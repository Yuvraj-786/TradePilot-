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
const CACHE_TTL_MS = Number(process.env.QUOTE_CACHE_TTL_MS || 5_000);

const quoteCache = new Map();
const exchangeSymbolCache = new Map();
let warnedMissingFinnhubKey = false;
let warnedFinnhubFailure = false;

const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "US", type: "Common Stock" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "US", type: "Common Stock" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "US", type: "Common Stock" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", exchange: "US", type: "ETF" },
  { symbol: "RELIANCE", name: "Reliance Industries Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "INFY", name: "Infosys Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "TCS", name: "Tata Consultancy Services Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "HDFCBANK", name: "HDFC Bank Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "ICICIBANK", name: "ICICI Bank Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE", type: "Common Stock" },
];

const DISCOVERY_STOCKS = [
  { symbol: "META", name: "Meta Platforms, Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "NFLX", name: "Netflix, Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "ADBE", name: "Adobe Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "INTC", name: "Intel Corporation", exchange: "US", type: "Common Stock" },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "ORCL", name: "Oracle Corporation", exchange: "US", type: "Common Stock" },
  { symbol: "CRM", name: "Salesforce, Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "QCOM", name: "QUALCOMM Incorporated", exchange: "US", type: "Common Stock" },
  { symbol: "AVGO", name: "Broadcom Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "PYPL", name: "PayPal Holdings, Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "MA", name: "Mastercard Incorporated", exchange: "US", type: "Common Stock" },
  { symbol: "V", name: "Visa Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "BAC", name: "Bank of America Corporation", exchange: "US", type: "Common Stock" },
  { symbol: "WFC", name: "Wells Fargo & Company", exchange: "US", type: "Common Stock" },
  { symbol: "XOM", name: "Exxon Mobil Corporation", exchange: "US", type: "Common Stock" },
  { symbol: "CVX", name: "Chevron Corporation", exchange: "US", type: "Common Stock" },
  { symbol: "UNH", name: "UnitedHealth Group Incorporated", exchange: "US", type: "Common Stock" },
  { symbol: "JNJ", name: "Johnson & Johnson", exchange: "US", type: "Common Stock" },
  { symbol: "PFE", name: "Pfizer Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "ABBV", name: "AbbVie Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "ABBV", name: "AbbVie Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "TMO", name: "Thermo Fisher Scientific Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "COST", name: "Costco Wholesale Corporation", exchange: "US", type: "Common Stock" },
  { symbol: "KO", name: "The Coca-Cola Company", exchange: "US", type: "Common Stock" },
  { symbol: "PEP", name: "PepsiCo, Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "DIS", name: "The Walt Disney Company", exchange: "US", type: "Common Stock" },
  { symbol: "SONY", name: "Sony Group Corporation", exchange: "US", type: "Common Stock" },
  { symbol: "LIN", name: "Linde plc", exchange: "US", type: "Common Stock" },
  { symbol: "NKE", name: "NIKE, Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "LOW", name: "Lowe's Companies, Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "HD", name: "The Home Depot, Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "MCD", name: "McDonald's Corporation", exchange: "US", type: "Common Stock" },
  { symbol: "MRK", name: "Merck & Co., Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "BMY", name: "Bristol-Myers Squibb Company", exchange: "US", type: "Common Stock" },
  { symbol: "TXN", name: "Texas Instruments Incorporated", exchange: "US", type: "Common Stock" },
  { symbol: "CAT", name: "Caterpillar Inc.", exchange: "US", type: "Common Stock" },
  { symbol: "GE", name: "General Electric Company", exchange: "US", type: "Common Stock" },
  { symbol: "BA", name: "The Boeing Company", exchange: "US", type: "Common Stock" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", exchange: "US", type: "ETF" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", exchange: "US", type: "ETF" },
  { symbol: "IWM", name: "iShares Core S&P 500 ETF", exchange: "US", type: "ETF" },
  { symbol: "TATASTEEL", name: "Tata Steel Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "MARUTI", name: "Maruti Suzuki India Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "LT", name: "Larsen & Toubro Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "AXISBANK", name: "Axis Bank Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "WIPRO", name: "Wipro Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "TECHM", name: "Tech Mahindra Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "NESTLEIND", name: "Nestlé India Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "ITC", name: "ITC Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "BAJAJFINSV", name: "Bajaj Finance Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "HCLTECH", name: "HCL Technologies Limited", exchange: "NSE", type: "Common Stock" },
  { symbol: "ONGC", name: "Oil and Natural Gas Corporation Limited", exchange: "NSE", type: "Common Stock" },
];

const EXCHANGE_ALIASES = {
  US: "US",
  NYSE: "US",
  NASDAQ: "US",
  NSE: "NSE",
  BSE: "BSE",
};

const safePrice = (price) => Number(Number(price).toFixed(2));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const seeded = (seed) => {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0xffffffff;
  };
};

const hash = (value) => {
  let hashed = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hashed ^= value.charCodeAt(index);
    hashed = (hashed * 16777619) >>> 0;
  }

  return hashed;
};

const createPriceDrift = (symbol) => {
  const minuteBucket = Math.floor(Date.now() / 10_000);
  const seed = Array.from(symbol).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const wave = Math.sin((minuteBucket + seed) / 3) * 0.45;
  const pulse = Math.cos((minuteBucket + seed) / 7) * 0.2;

  return Number((wave + pulse).toFixed(2));
};

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
  const drift = createPriceDrift(symbol);

  if (known) {
    const price = safePrice(known.price + drift);

    return {
      ...known,
      price,
      change: Number((known.change + drift / Math.max(known.price, 1) * 100).toFixed(2)),
      symbol,
      lastUpdated: new Date().toISOString(),
    };
  }

  const synthetic = createSyntheticQuote(symbol);

  return {
    ...synthetic,
    price: safePrice(synthetic.price + drift),
    change: Number((synthetic.change + drift / Math.max(synthetic.price, 1) * 100).toFixed(2)),
  };
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

const CANDLE_TARGET_COUNTS = {
  "1m": 220,
  "5m": 180,
  "15m": 160,
  "30m": 140,
  "1H": 180,
  "4H": 140,
  "1D": 130,
  "1W": 120,
  "1M": 110,
};

const TIMEFRAME_SECONDS = {
  "1m": 60,
  "5m": 5 * 60,
  "15m": 15 * 60,
  "30m": 30 * 60,
  "1H": 60 * 60,
  "4H": 4 * 60 * 60,
  "1D": 24 * 60 * 60,
  "1W": 7 * 24 * 60 * 60,
  "1M": 30 * 24 * 60 * 60,
};

const normalizeTimeframe = (timeframe = "1H") => {
  return Object.prototype.hasOwnProperty.call(CANDLE_RESOLUTIONS, timeframe) ? timeframe : "1H";
};

const getHistoryWindow = (timeframe = "1H") => {
  const normalized = normalizeTimeframe(timeframe);
  const stepSeconds = TIMEFRAME_SECONDS[normalized];
  const now = Math.floor(Date.now() / 1000);
  const alignedNow = Math.floor(now / stepSeconds) * stepSeconds;
  const targetCount = Math.max(100, Math.min(300, CANDLE_TARGET_COUNTS[normalized] ?? 220));

  return {
    alignedNow,
    from: alignedNow - stepSeconds * targetCount,
    to: alignedNow,
    targetCount,
  };
};

const createSyntheticCandles = (symbol, basePrice, timeframe) => {
  const normalized = normalizeTimeframe(timeframe);
  const rand = seeded(hash(`${symbol}${normalized}`));
  const stepSeconds = TIMEFRAME_SECONDS[normalized];
  const now = Math.floor(Date.now() / 1000);
  const count = Math.max(100, Math.min(300, CANDLE_TARGET_COUNTS[normalized] ?? 220));
  const startAligned = Math.floor((now - stepSeconds * count) / stepSeconds) * stepSeconds;
  const volatility = basePrice * 0.012;
  const drift = basePrice * 0.0004;

  let current = basePrice * (0.85 + rand() * 0.05);
  const candles = [];

  for (let index = 0; index < count; index += 1) {
    const time = startAligned + index * stepSeconds;
    const open = current;
    const direction = rand() > 0.48 ? 1 : -1;
    const move = (rand() * volatility + drift) * direction;
    const close = Math.max(0.5, open + move);
    const high = Math.max(open, close) + rand() * volatility * 0.6;
    const low = Math.min(open, close) - rand() * volatility * 0.6;
    const volume = Math.round((50000 + rand() * 250000) * (1 + Math.abs(move) / volatility));

    candles.push({
      time,
      open: safePrice(open),
      high: safePrice(high),
      low: safePrice(Math.max(0.5, low)),
      close: safePrice(close),
      volume,
    });

    current = close;
  }

  return candles;
};

const fetchFinnhubJson = async (url, { maxAttempts = 3, baseDelayMs = 300 } = {}) => {
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url);

      if (response.status === 429 || response.status >= 500) {
        const retryAfterHeader = response.headers.get("retry-after");
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : baseDelayMs * (attempt + 1);
        lastError = new Error(`Finnhub request failed with status ${response.status}`);
        if (attempt === maxAttempts - 1) {
          throw lastError;
        }
        await sleep(retryAfterMs);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Finnhub request failed with status ${response.status}`);
      }

      return response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Finnhub request failed.");
      if (attempt === maxAttempts - 1) {
        throw lastError;
      }
      await sleep(baseDelayMs * (attempt + 1));
    }
  }

  throw lastError ?? new Error("Finnhub request failed.");
};

const normalizeExchange = (exchange = "US") => {
  const normalized = String(exchange || "US").toUpperCase();
  return EXCHANGE_ALIASES[normalized] || normalized;
};

const normalizeSymbolResult = (entry) => {
  const symbol = String(entry?.symbol || entry?.displaySymbol || "").toUpperCase();
  const name = String(entry?.description || entry?.name || symbol);

  if (!symbol) {
    return null;
  }

  return {
    symbol,
    name,
    exchange: normalizeExchange(entry?.exchange || entry?.mic || "US"),
    description: name,
    type: String(entry?.type || "Common Stock"),
  };
};

const getFallbackExchangeSymbols = (exchange) => {
  const normalized = normalizeExchange(exchange);
  const fallback = [...POPULAR_STOCKS, ...DISCOVERY_STOCKS].filter((item) => item.exchange === normalized);

  return Array.from(new Map(fallback.map((item) => [item.symbol, item])).values()).map((item) => ({
    symbol: item.symbol,
    name: item.name,
    exchange: item.exchange,
    description: item.name,
    type: item.type,
  }));
};

const fetchLiveQuote = async (symbol) => {
  if (!FINNHUB_API_KEY) {
    throw new Error("FINNHUB_API_KEY is not configured.");
  }

  const token = `token=${FINNHUB_API_KEY}`;

  const [quoteResponse, profileResponse] = await Promise.allSettled([
    fetchFinnhubJson(`${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&${token}`),
    fetchFinnhubJson(`${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&${token}`),
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
  const { from, to } = getHistoryWindow(normalized);
  const token = `token=${FINNHUB_API_KEY}`;

  const response = await fetchFinnhubJson(
    `${FINNHUB_BASE_URL}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}&${token}`
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

  const candles = timestamps
    .map((timestamp, index) => {
      const time = Number(timestamp);
      const open = Number(opens[index]);
      const high = Number(highs[index]);
      const low = Number(lows[index]);
      const close = Number(closes[index]);

      if (!Number.isFinite(time) || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
        return null;
      }

      return {
        time,
        open: safePrice(open),
        high: safePrice(high),
        low: safePrice(low),
        close: safePrice(close),
        volume: Number(volumes[index] ?? 0),
      };
    })
    .filter(Boolean);

  if (candles.length === 0) {
    throw new Error("Finnhub returned no candle data.");
  }

  const uniqueCandles = Array.from(new Map(candles.map((candle) => [candle.time, candle])).values()).sort((a, b) => a.time - b.time);

  if (uniqueCandles.length < 100) {
    throw new Error("Finnhub returned insufficient candle history.");
  }

  return uniqueCandles;
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
  const symbols = getPopularStocks().map((stock) => stock.symbol);
  const quotes = await getQuotes(symbols);
  const overallChange = quotes.reduce((sum, quote) => sum + quote.change, 0) / Math.max(quotes.length, 1);

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
  } catch (error) {
    if (!warnedFinnhubFailure) {
      warnedFinnhubFailure = true;
      console.warn(`Finnhub history fetch failed for ${key}; using synthetic candles.`, error instanceof Error ? error.message : error);
    }

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

export const getAllStockSymbols = async (exchange = "US") => {
  const normalized = normalizeExchange(exchange);
  const cached = exchangeSymbolCache.get(normalized);

  if (cached && Date.now() - cached.fetchedAt < 60 * 60 * 1000) {
    return cached.symbols;
  }

  if (!FINNHUB_API_KEY) {
    const fallback = getFallbackExchangeSymbols(normalized);
    exchangeSymbolCache.set(normalized, { symbols: fallback, fetchedAt: Date.now() });
    return fallback;
  }

  try {
    const response = await fetchFinnhubJson(`${FINNHUB_BASE_URL}/stock/symbol?exchange=${encodeURIComponent(normalized)}&token=${FINNHUB_API_KEY}`);

    if (!Array.isArray(response)) {
      throw new Error("Finnhub returned an invalid symbol list.");
    }

    const symbols = response
      .map(normalizeSymbolResult)
      .filter(Boolean)
      .sort((left, right) => left.symbol.localeCompare(right.symbol));

    exchangeSymbolCache.set(normalized, { symbols, fetchedAt: Date.now() });
    return symbols;
  } catch (error) {
    const fallback = getFallbackExchangeSymbols(normalized);
    exchangeSymbolCache.set(normalized, { symbols: fallback, fetchedAt: Date.now() });

    if (!warnedFinnhubFailure) {
      warnedFinnhubFailure = true;
      console.warn(`Finnhub symbol fetch failed for ${normalized}; using fallback symbols.`, error instanceof Error ? error.message : error);
    }

    return fallback;
  }
};

export const searchStocks = async (query = "") => {
  const normalized = String(query || "").trim().toUpperCase();

  if (!normalized) {
    return getPopularStocks();
  }

  const [usSymbols, nseSymbols] = await Promise.all([
    getAllStockSymbols("US"),
    getAllStockSymbols("NSE"),
  ]);

  const matches = [...usSymbols, ...nseSymbols].filter((item) => {
    const haystack = `${item.symbol} ${item.name} ${item.description}`.toUpperCase();
    return haystack.includes(normalized);
  });

  return matches.slice(0, 100);
};

export const getPopularStocks = () => POPULAR_STOCKS.map((item) => ({
  symbol: item.symbol,
  name: item.name,
  exchange: item.exchange,
  description: item.name,
  type: item.type,
}));
