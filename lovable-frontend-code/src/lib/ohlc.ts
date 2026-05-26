export type Candle = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D" | "1W" | "1M";

const TF_SECONDS: Record<Timeframe, number> = {
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

// Deterministic pseudo-random from symbol + tf so chart is stable per pair.
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

export function generateCandles(symbol: string, tf: Timeframe, basePrice: number, count = 220): Candle[] {
  const rand = seeded(hash(symbol + tf));
  const step = TF_SECONDS[tf];
  const now = Math.floor(Date.now() / 1000);
  const startAligned = Math.floor((now - step * count) / step) * step;

  const vol = basePrice * 0.012; // per-bar volatility
  const drift = basePrice * 0.0004;

  let price = basePrice * (0.85 + rand() * 0.05);
  const out: Candle[] = [];
  for (let i = 0; i < count; i++) {
    const open = price;
    const dir = rand() > 0.48 ? 1 : -1;
    const move = (rand() * vol + drift) * dir;
    const close = Math.max(0.5, open + move);
    const high = Math.max(open, close) + rand() * vol * 0.6;
    const low = Math.min(open, close) - rand() * vol * 0.6;
    const volume = Math.round((50000 + rand() * 250000) * (1 + Math.abs(move) / vol));
    out.push({
      time: startAligned + i * step,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +Math.max(0.5, low).toFixed(2),
      close: +close.toFixed(2),
      volume,
    });
    price = close;
  }
  return out;
}

export function sma(values: number[], period: number): (number | undefined)[] {
  const out: (number | undefined)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : undefined);
  }
  return out;
}

export function ema(values: number[], period: number): (number | undefined)[] {
  const out: (number | undefined)[] = [];
  const k = 2 / (period + 1);
  let prev: number | undefined;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { out.push(undefined); continue; }
    if (prev === undefined) {
      const slice = values.slice(0, period);
      prev = slice.reduce((a, b) => a + b, 0) / period;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out.push(prev);
  }
  return out;
}

export function rsi(values: number[], period = 14): (number | undefined)[] {
  const out: (number | undefined)[] = [undefined];
  let gain = 0, loss = 0;
  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const g = Math.max(diff, 0);
    const l = Math.max(-diff, 0);
    if (i <= period) {
      gain += g; loss += l;
      if (i === period) {
        gain /= period; loss /= period;
        const rs = loss === 0 ? 100 : gain / loss;
        out.push(100 - 100 / (1 + rs));
      } else out.push(undefined);
    } else {
      gain = (gain * (period - 1) + g) / period;
      loss = (loss * (period - 1) + l) / period;
      const rs = loss === 0 ? 100 : gain / loss;
      out.push(100 - 100 / (1 + rs));
    }
  }
  return out;
}

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine = values.map((_, i) => {
    const a = emaFast[i], b = emaSlow[i];
    return a !== undefined && b !== undefined ? a - b : undefined;
  });
  const valid = macdLine.map((v) => v ?? 0);
  const signalLine = ema(valid, signal).map((v, i) => (macdLine[i] === undefined ? undefined : v));
  const hist = macdLine.map((m, i) => {
    const s = signalLine[i];
    return m !== undefined && s !== undefined ? m - s : undefined;
  });
  return { macdLine, signalLine, hist };
}
