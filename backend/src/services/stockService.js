const MOCK_STOCKS = {
  AAPL: { name: "Apple Inc.", sector: "Technology", price: 185.4, change: 1.45, volume: 43000000 },
  MSFT: { name: "Microsoft", sector: "Technology", price: 410.2, change: 0.8, volume: 23000000 },
  NVDA: { name: "NVIDIA", sector: "AI", price: 920.7, change: 3.12, volume: 42000000 },
  TSLA: { name: "Tesla", sector: "Automotive", price: 172.3, change: -1.12, volume: 64000000 },
  AMZN: { name: "Amazon", sector: "Consumer", price: 178.5, change: 0.63, volume: 21000000 },
  GOOGL: { name: "Alphabet", sector: "Technology", price: 170.6, change: 1.02, volume: 18000000 },
  JPM: { name: "JPMorgan", sector: "Finance", price: 170.7, change: 0.42, volume: 9000000 },
  VTI: { name: "Vanguard Total Stock Market ETF", sector: "ETF", price: 244.4, change: 0.3, volume: 5500000 },
};

const FINNHUB_BASE_URL = process.env.FINNHUB_BASE_URL || "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const CACHE_TTL_MS = 60_000;

const quoteCache = new Map();
let warnedMissingFinnhubKey = false;
let warnedFinnhubFailure = false;

const safePrice = (price) => Number(Number(price).toFixed(2));

const createSyntheticQuote = (symbol) => {
  const seededChange = (symbol.length % 5) * 0.35;
  const price = safePrice(50 + (symbol.charCodeAt(0) % 40) * 2.5);

  return {
    symbol,
    name: symbol,
    sector: "Unknown",
    price,
    change: Number((seededChange - 1.2).toFixed(2)),
    volume: 1000000,
    lastUpdated: new Date().toISOString(),
  };
};

const createFallbackQuote = (symbol) => {
  const known = MOCK_STOCKS[symbol];

  if (known) {
    return {
      ...known,
      symbol,
      lastUpdated: new Date().toISOString(),
    };
  }

  return createSyntheticQuote(symbol);
};

const getCachedQuote = (symbol) => {
  const cached = quoteCache.get(symbol);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
    quoteCache.delete(symbol);
    return null;
  }

  return cached.quote;
};

const setCachedQuote = (symbol, quote) => {
  quoteCache.set(symbol, {
    quote,
    fetchedAt: Date.now(),
  });
};

const getPercentChange = (current, previous) => {
  if (!previous || previous === 0) {
    return 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(2));
};

const CANDLE_RESOLUTIONS = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1H": "60",
  "4H": "240",
  "1D": "D",
  "1W": "W",
  "1M": "M",
};

const HISTORY_LOOKBACK_SECONDS = {
  "1m": 24 * 60 * 60,
  "5m": 7 * 24 * 60 * 60,
  "15m": 7 * 24 * 60 * 60,
  "30m": 14 * 24 * 60 * 60,
  "1H": 30 * 24 * 60 * 60,
  "4H": 60 * 24 * 60 * 60,
  "1D": 365 * 24 * 60 * 60,
  "1W": 5 * 365 * 24 * 60 * 60,
  "1M": 10 * 365 * 24 * 60 * 60,
};

const normalizeTimeframe = (timeframe = "1H") => {
  return Object.prototype.hasOwnProperty.call(CANDLE_RESOLUTIONS, timeframe) ? timeframe : "1H";
};

const createSyntheticCandles = (symbol, basePrice, timeframe) => {
  const normalized = normalizeTimeframe(timeframe);
  const seededChange = (symbol.length % 5) * 0.25;
  const stepSeconds = Math.max(60, Math.floor(HISTORY_LOOKBACK_SECONDS[normalized] / 80));
  const now = Math.floor(Date.now() / 1000);
  const count = 80;

  let current = safePrice(basePrice);
  const candles = [];

  for (let index = 0; index < count; index += 1) {
    const time = now - (count - index) * stepSeconds;
    const drift = ((index % 5) - 2) * 0.35 + seededChange;
    const open = current;
    const close = safePrice(open + drift);
    const high = safePrice(Math.max(open, close) + 0.35);
    const low = safePrice(Math.min(open, close) - 0.35);

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume: 120000 + index * 450,
    });

    current = close;
  }

  return candles;
};

const fetchJson = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Finnhub request failed with status ${response.status}`);
  }

  return response.json();
};

const fetchLiveQuote = async (symbol) => {
  if (!FINNHUB_API_KEY) {
    throw new Error("FINNHUB_API_KEY is not configured.");
  }

  const token = `token=${FINNHUB_API_KEY}`;

  const [quoteResponse, profileResponse] = await Promise.allSettled([
    fetchJson(`${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&${token}`),
    fetchJson(`${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&${token}`),
  ]);

  if (quoteResponse.status !== "fulfilled") {
    throw new Error("Finnhub quote request failed.");
  }

  const quoteData = quoteResponse.value;

  if (!quoteData || typeof quoteData.c !== "number") {
    throw new Error("Finnhub returned an invalid quote payload.");
  }

  const price = safePrice(quoteData.c);
  const previousClose = Number(quoteData.pc ?? price);
  const change = Number((quoteData.dp ?? getPercentChange(price, previousClose)).toFixed(2));

  const profileData = profileResponse.status === "fulfilled" ? profileResponse.value : null;

  return {
    symbol,
    name: profileData?.name || symbol,
    sector: profileData?.finnhubIndustry || profileData?.industry || "Unknown",
    price,
    change,
    volume: Number(quoteData.v ?? 0),
    lastUpdated: new Date().toISOString(),
  };
};

const fetchHistoricalCandles = async (symbol, timeframe = "1H") => {
  if (!FINNHUB_API_KEY) {
    throw new Error("FINNHUB_API_KEY is not configured.");
  }

  const normalized = normalizeTimeframe(timeframe);
  const resolution = CANDLE_RESOLUTIONS[normalized];
  const now = Math.floor(Date.now() / 1000);
  const from = now - HISTORY_LOOKBACK_SECONDS[normalized];
  const token = `token=${FINNHUB_API_KEY}`;

  const response = await fetchJson(
    `${FINNHUB_BASE_URL}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${now}&${token}`
  );

  if (!response || response.s !== "ok") {
    throw new Error("Finnhub returned an invalid candle payload.");
  }

  const timestamps = Array.isArray(response.t) ? response.t : [];
  const opens = Array.isArray(response.o) ? response.o : [];
  const highs = Array.isArray(response.h) ? response.h : [];
  const lows = Array.isArray(response.l) ? response.l : [];
  const closes = Array.isArray(response.c) ? response.c : [];
  const volumes = Array.isArray(response.v) ? response.v : [];

  return timestamps.map((timestamp, index) => ({
    time: Number(timestamp),
    open: safePrice(opens[index]),
    high: safePrice(highs[index]),
    low: safePrice(lows[index]),
    close: safePrice(closes[index]),
    volume: Number(volumes[index] ?? 0),
  })).filter((candle) => candle.time > 0 && Number.isFinite(candle.open) && Number.isFinite(candle.high) && Number.isFinite(candle.low) && Number.isFinite(candle.close));
};

const fetchQuoteWithFallback = async (symbol) => {
  const cached = getCachedQuote(symbol);

  if (cached) {
    return cached;
  }

  if (!FINNHUB_API_KEY && !warnedMissingFinnhubKey) {
    warnedMissingFinnhubKey = true;
    console.warn("FINNHUB_API_KEY is not set. Falling back to synthetic stock prices.");
  }

  try {
    const liveQuote = await fetchLiveQuote(symbol);
    setCachedQuote(symbol, liveQuote);
    return liveQuote;
  } catch (error) {
    if (!warnedFinnhubFailure) {
      warnedFinnhubFailure = true;
      console.warn(`Finnhub fetch failed for ${symbol}. Falling back to synthetic stock prices.`, error.message);
    }

    const fallback = createFallbackQuote(symbol);
    setCachedQuote(symbol, fallback);
    return fallback;
  }
};

export const getQuote = async (symbol) => {
  const key = String(symbol).toUpperCase();
  return fetchQuoteWithFallback(key);
};

export const getQuotes = async (symbols = []) => {
  const normalizedSymbols = Array.from(new Set(symbols.map((symbol) => String(symbol).toUpperCase()).filter(Boolean)));

  if (normalizedSymbols.length === 0) {
    return [];
  }

  return Promise.all(normalizedSymbols.map((symbol) => getQuote(symbol)));
};

export const getMarketSnapshot = async () => {
  const symbols = Object.keys(MOCK_STOCKS);
  const quotes = await getQuotes(symbols);
  const overallChange = quotes.reduce((sum, quote) => sum + quote.change, 0) / quotes.length;

  return {
    marketStatus: overallChange >= 0 ? "Bullish" : "Cautious",
    overallChange: Number(overallChange.toFixed(2)),
    quotes,
    generatedAt: new Date().toISOString(),
  };
};

export const getCandles = async (symbol, timeframe = "1H") => {
  const key = String(symbol).toUpperCase();

  try {
    return await fetchHistoricalCandles(key, timeframe);
  } catch {
    const quote = await getQuote(key);
    return createSyntheticCandles(key, quote.price, timeframe);
  }
};

export const getPriceHistory = async (symbol, timeframe = "1D") => {
  const candles = await getCandles(symbol, timeframe);

  return candles.map((candle) => ({
    date: new Date(candle.time * 1000).toISOString().slice(0, 10),
    price: candle.close,
  }));
};
