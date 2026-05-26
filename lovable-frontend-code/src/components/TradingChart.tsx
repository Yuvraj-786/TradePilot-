import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  BarSeries,
  LineSeries,
  HistogramSeries,
  CrosshairMode,
  type ISeriesApi,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useTheme } from "@/lib/theme";
import { marketApi, type MarketCandle } from "@/lib/api";
import { sma, ema, rsi as rsiCalc, macd as macdCalc, type Candle, type Timeframe } from "@/lib/ohlc";

type ChartType = "candles" | "bars";

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W", "1M"];
const REFRESH_INTERVAL_MS = 15_000;

type Indicators = { sma20: boolean; sma50: boolean; ema20: boolean; volume: boolean; rsi: boolean; macd: boolean };

type Props = {
  symbol: string;
  basePrice: number;
  changePct: number;
};

function normalizeCandles(candles: MarketCandle[]) {
  const byTime = new Map<number, MarketCandle>();

  candles.forEach((candle) => {
    if (
      Number.isFinite(candle.time) &&
      Number.isFinite(candle.open) &&
      Number.isFinite(candle.high) &&
      Number.isFinite(candle.low) &&
      Number.isFinite(candle.close)
    ) {
      byTime.set(candle.time, candle);
    }
  });

  return Array.from(byTime.values()).sort((a, b) => a.time - b.time);
}

export function TradingChart({ symbol, basePrice, changePct }: Props) {
  const { theme } = useTheme();
  const [tf, setTf] = useState<Timeframe>("1m");
  const [type, setType] = useState<ChartType>("candles");
  const [ind, setInd] = useState<Indicators>({ sma20: true, sma50: true, ema20: false, volume: true, rsi: true, macd: true });
  const [candles, setCandles] = useState<MarketCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadCandles = async () => {
      try {
        const response = await marketApi.getHistory(symbol, tf);
        if (cancelled) return;

        setCandles(normalizeCandles(response.data?.candles ?? []));
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load chart history.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    loadCandles();
    const interval = window.setInterval(loadCandles, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [symbol, tf]);

  // Poll latest quote frequently and merge into last candle for a live feel
  useEffect(() => {
    let cancelled = false;
    const stepSecondsMap: Record<Timeframe, number> = {
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

    const step = stepSecondsMap[tf] ?? 60 * 60;

    const poll = async () => {
      try {
        const quote = await marketApi.getQuote(symbol);
        if (cancelled) return;
        const price = Number(quote.data?.price ?? basePrice ?? 0);

        setCandles((prev) => {
          if (!prev || prev.length === 0) return prev;
          const now = Math.floor(Date.now() / 1000);
          const aligned = Math.floor(now / step) * step;
          const last = prev[prev.length - 1];

          // If same candle interval, update last candle
          if (last.time === aligned) {
            const updated = { ...last };
            updated.high = Math.max(updated.high, price);
            updated.low = Math.min(updated.low, price);
            updated.close = price;
            // don't guess volume
            const copy = prev.slice(0, -1);
            copy.push(updated);
            return copy;
          }

          // Otherwise append a new candle using previous close as open
          const newCandle = {
            time: aligned,
            open: last.close,
            high: Math.max(last.close, price),
            low: Math.min(last.close, price),
            close: price,
            volume: 0,
          } as MarketCandle;

          return [...prev, newCandle].slice(-500);
        });
      } catch (err) {
        // ignore quote errors here
      }
    };

    // Poll faster for live feel
    const iv = window.setInterval(poll, 5_000);
    // run immediately once
    poll();

    return () => {
      cancelled = true;
      window.clearInterval(iv);
    };
  }, [symbol, tf, basePrice]);

  const currentPrice = Number(basePrice) || 0;
  const latest = candles[candles.length - 1];
  const first = candles[0];
  const high = candles.length > 0 ? Math.max(...candles.map((item) => item.high)) : currentPrice;
  const low = candles.length > 0 ? Math.min(...candles.map((item) => item.low)) : currentPrice;
  const vol = candles.reduce((sum, item) => sum + item.volume, 0);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-baseline gap-3">
          <span className="text-base font-bold">{symbol}</span>
          <span className={`font-mono text-lg ${changePct >= 0 ? "text-bull" : "text-bear"}`}>
            ₹{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className={`font-mono text-xs ${changePct >= 0 ? "text-bull" : "text-bear"}`}>
            {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
          </span>
        </div>
        <div className="hidden gap-4 text-[10px] uppercase tracking-wider text-muted-foreground md:flex">
          <Stat label="O" value={first ? first.open.toFixed(2) : currentPrice.toFixed(2)} />
          <Stat label="H" value={high.toFixed(2)} tone="bull" />
          <Stat label="L" value={low.toFixed(2)} tone="bear" />
          <Stat label="C" value={latest ? latest.close.toFixed(2) : currentPrice.toFixed(2)} />
          <Stat label="Vol" value={vol.toLocaleString()} />
        </div>
      </div>

      {error ? <div className="border-b border-border px-4 py-2 text-xs text-bear">{error}</div> : null}

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <div className="flex rounded-md border border-border bg-background">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                tf === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex rounded-md border border-border bg-background">
          <button
            onClick={() => setType("candles")}
            className={`px-2.5 py-1 text-[11px] font-semibold ${type === "candles" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >Candles</button>
          <button
            onClick={() => setType("bars")}
            className={`px-2.5 py-1 text-[11px] font-semibold ${type === "bars" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >Bars (OHLC)</button>
        </div>

        <div className="ml-auto flex flex-wrap gap-1.5">
          <Toggle label="SMA 20" active={ind.sma20} onClick={() => setInd({ ...ind, sma20: !ind.sma20 })} dot="var(--chart-1)" />
          <Toggle label="SMA 50" active={ind.sma50} onClick={() => setInd({ ...ind, sma50: !ind.sma50 })} dot="var(--chart-3)" />
          <Toggle label="EMA 20" active={ind.ema20} onClick={() => setInd({ ...ind, ema20: !ind.ema20 })} dot="var(--chart-5)" />
          <Toggle label="Volume" active={ind.volume} onClick={() => setInd({ ...ind, volume: !ind.volume })} />
          <Toggle label="RSI" active={ind.rsi} onClick={() => setInd({ ...ind, rsi: !ind.rsi })} />
          <Toggle label="MACD" active={ind.macd} onClick={() => setInd({ ...ind, macd: !ind.macd })} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {loading && candles.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-sm text-muted-foreground">
            Loading historical candles...
          </div>
        ) : error && candles.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-sm text-bear">
            {error}
          </div>
        ) : (
          <>
            <div className="min-h-[280px] flex-[3]">
              <PriceChart candles={candles} type={type} ind={ind} theme={theme} />
            </div>
            {ind.rsi && (
              <div className="h-28 border-t border-border">
                <RsiChart candles={candles} theme={theme} />
              </div>
            )}
            {ind.macd && (
              <div className="h-28 border-t border-border">
                <MacdChart candles={candles} theme={theme} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "bull" | "bear" }) {
  return (
    <span>
      <span className="text-muted-foreground">{label} </span>
      <span className={`font-mono normal-case ${tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-foreground"}`}>{value}</span>
    </span>
  );
}

function Toggle({ label, active, onClick, dot }: { label: string; active: boolean; onClick: () => void; dot?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
        active ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      {dot && <span className="inline-block size-1.5 rounded-full" style={{ background: dot }} />}
      {label}
    </button>
  );
}

// --- Sub-charts ---

function useChartColors(theme: string) {
  return useMemo(() => {
    const dark = theme === "dark";
    return {
      bg: "transparent",
      text: dark ? "#94a3b8" : "#64748b",
      grid: dark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.10)",
      border: dark ? "rgba(148,163,184,0.18)" : "rgba(100,116,139,0.22)",
      bull: dark ? "#22c55e" : "#16a34a",
      bear: dark ? "#ef4444" : "#dc2626",
      primary: dark ? "#60a5fa" : "#2563eb",
      orange: "#f59e0b",
      purple: dark ? "#a78bfa" : "#7c3aed",
    };
  }, [theme]);
}

function baseOptions(c: ReturnType<typeof useChartColors>) {
  return {
    layout: { background: { color: c.bg }, textColor: c.text, fontFamily: "Inter, sans-serif" },
    grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
    rightPriceScale: { borderColor: c.border },
    timeScale: { borderColor: c.border, timeVisible: true, secondsVisible: false },
    crosshair: { mode: CrosshairMode.Normal },
    autoSize: true,
  } as const;
}

function PriceChart({ candles, type, ind, theme }: { candles: Candle[]; type: ChartType; ind: Indicators; theme: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const colors = useChartColors(theme);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, baseOptions(colors));
    const data = candles.map((c) => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close }));

    let mainSeries: ISeriesApi<"Candlestick" | "Bar">;
    if (type === "candles") {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: colors.bull, downColor: colors.bear,
        borderUpColor: colors.bull, borderDownColor: colors.bear,
        wickUpColor: colors.bull, wickDownColor: colors.bear,
      });
    } else {
      mainSeries = chart.addSeries(BarSeries, {
        upColor: colors.bull, downColor: colors.bear, openVisible: true, thinBars: false,
      });
    }
    mainSeries.setData(data);

    const closes = candles.map((c) => c.close);
    const addLine = (vals: (number | undefined)[], color: string) => {
      const s = chart.addSeries(LineSeries, { color, lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
      s.setData(candles.map((c, i) => (vals[i] !== undefined ? { time: c.time as UTCTimestamp, value: vals[i]! } : null)).filter(Boolean) as never);
    };
    if (ind.sma20) addLine(sma(closes, 20), colors.primary);
    if (ind.sma50) addLine(sma(closes, 50), colors.orange);
    if (ind.ema20) addLine(ema(closes, 20), colors.purple);

    if (ind.volume) {
      const v = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
        color: colors.primary,
      });
      v.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      v.setData(candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? colors.bull + "80" : colors.bear + "80",
      })));
    }

    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => chart.timeScale().fitContent());
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.remove(); };
  }, [candles, type, ind.sma20, ind.sma50, ind.ema20, ind.volume, colors]);

  return <div ref={ref} className="h-full w-full" />;
}

function RsiChart({ candles, theme }: { candles: Candle[]; theme: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const colors = useChartColors(theme);
  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, { ...baseOptions(colors), rightPriceScale: { borderColor: colors.border, autoScale: false } });
    const closes = candles.map((c) => c.close);
    const values = rsiCalc(closes, 14);
    const s = chart.addSeries(LineSeries, { color: colors.purple, lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
    s.setData(candles.map((c, i) => values[i] !== undefined ? { time: c.time as UTCTimestamp, value: values[i]! } : null).filter(Boolean) as never);
    s.createPriceLine({ price: 70, color: colors.bear, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "70" });
    s.createPriceLine({ price: 30, color: colors.bull, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "30" });
    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => chart.timeScale().fitContent());
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.remove(); };
  }, [candles, colors]);
  return (
    <div className="relative h-full w-full">
      <span className="pointer-events-none absolute left-2 top-1 z-10 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">RSI (14)</span>
      <div ref={ref} className="h-full w-full" />
    </div>
  );
}

function MacdChart({ candles, theme }: { candles: Candle[]; theme: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const colors = useChartColors(theme);
  useEffect(() => {
    if (!ref.current) return;
    const chart: IChartApi = createChart(ref.current, baseOptions(colors));
    const closes = candles.map((c) => c.close);
    const { macdLine, signalLine, hist } = macdCalc(closes);
    const h = chart.addSeries(HistogramSeries, { priceLineVisible: false });
    h.setData(candles.map((c, i) => hist[i] !== undefined ? {
      time: c.time as UTCTimestamp, value: hist[i]!,
      color: hist[i]! >= 0 ? colors.bull + "B0" : colors.bear + "B0",
    } : null).filter(Boolean) as never);
    const m = chart.addSeries(LineSeries, { color: colors.primary, lineWidth: 2, priceLineVisible: false });
    m.setData(candles.map((c, i) => macdLine[i] !== undefined ? { time: c.time as UTCTimestamp, value: macdLine[i]! } : null).filter(Boolean) as never);
    const s = chart.addSeries(LineSeries, { color: colors.orange, lineWidth: 2, priceLineVisible: false });
    s.setData(candles.map((c, i) => signalLine[i] !== undefined ? { time: c.time as UTCTimestamp, value: signalLine[i]! } : null).filter(Boolean) as never);
    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => chart.timeScale().fitContent());
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.remove(); };
  }, [candles, colors]);
  return (
    <div className="relative h-full w-full">
      <span className="pointer-events-none absolute left-2 top-1 z-10 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">MACD (12, 26, 9)</span>
      <div ref={ref} className="h-full w-full" />
    </div>
  );
}
