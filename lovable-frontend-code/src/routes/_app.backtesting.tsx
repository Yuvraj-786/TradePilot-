import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { PORTFOLIO_GROWTH } from "@/lib/mock";
import { backtestingApi, type BacktestPoint, type BacktestResult } from "@/lib/api";
import { Play } from "lucide-react";

export const Route = createFileRoute("/_app/backtesting")({
  head: () => ({ meta: [{ title: "Backtesting — TradePilot" }] }),
  component: Backtesting,
});

const STRATEGIES = [
  { id: "ma", name: "Moving Average Crossover", desc: "Buy on 50/200 MA crossover" },
  { id: "rsi", name: "RSI Mean Reversion", desc: "Buy oversold (<30), sell overbought (>70)" },
  { id: "momentum", name: "Momentum", desc: "Top 20% performers, rebalance monthly" },
];

function Backtesting() {
  const [strategy, setStrategy] = useState("ma");
  const [symbol, setSymbol] = useState("RELIANCE");
  const [initialCapital, setInitialCapital] = useState("100000");
  const [ran, setRan] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const previewData: BacktestPoint[] = PORTFOLIO_GROWTH.map((d, i) => ({
    day: d.day,
    strategy: d.value,
    benchmark: 100000 + i * 500 + Math.sin(i / 3) * 800,
  }));
  const data = result?.equityCurve ?? previewData;

  const runBacktest = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await backtestingApi.run({
        symbol: symbol.trim().toUpperCase(),
        strategy,
        initialCapital: Number(initialCapital) || 100000,
      });

      setResult(response.data ?? null);
      setRan(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run backtest.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar title="Backtesting" />
      <main className="flex-1 overflow-y-auto p-5 lg:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Strategy Backtesting</h1>
          <p className="mt-1 text-sm text-muted-foreground">Test trading strategies on historical data</p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-4">
          <aside className="space-y-4 lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Strategy</h2>
              <div className="mt-4 space-y-2">
                {STRATEGIES.map((s) => (
                  <button key={s.id} onClick={() => setStrategy(s.id)} className={`w-full rounded-md border p-3 text-left transition-colors ${strategy === s.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`}>
                    <div className="text-sm font-semibold">{s.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <Field label="Symbol"><input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring" /></Field>
              <Field label="Start date"><input type="date" defaultValue="2024-01-01" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring" /></Field>
              <Field label="End date"><input type="date" defaultValue="2025-12-31" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring" /></Field>
              <Field label="Initial capital"><input value={initialCapital} onChange={(e) => setInitialCapital(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-ring" /></Field>
              {error ? <p className="text-xs text-bear">{error}</p> : null}
              <button onClick={runBacktest} disabled={loading} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                <Play className="size-4" /> {loading ? "Running..." : "Run Backtest"}
              </button>
            </div>
          </aside>

          <section className="space-y-5 lg:col-span-3">
            <div className="grid gap-4 sm:grid-cols-4">
              <Metric label="Total Return" value={`${(result?.totalReturnPct ?? 34.2) >= 0 ? "+" : ""}${(result?.totalReturnPct ?? 34.2).toFixed(1)}%`} accent={(result?.totalReturnPct ?? 34.2) >= 0 ? "bull" : "bear"} />
              <Metric label="Sharpe Ratio" value={(result?.sharpeRatio ?? 1.84).toFixed(2)} />
              <Metric label="Max Drawdown" value={`${(result?.maxDrawdown ?? -8.4).toFixed(1)}%`} accent="bear" />
              <Metric label="Win Rate" value={`${(result?.winRate ?? 62).toFixed(0)}%`} />
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Equity Curve</h2>
                  <p className="text-xs text-muted-foreground">Strategy vs. benchmark</p>
                </div>
                {!ran && <span className="text-xs text-muted-foreground">Sample preview</span>}
              </div>
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="strategy" stroke="var(--primary)" strokeWidth={2} dot={false} name="Strategy" />
                    <Line type="monotone" dataKey="benchmark" stroke="var(--muted-foreground)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Benchmark" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span><div className="mt-1.5">{children}</div></label>;
}
function Metric({ label, value, accent }: { label: string; value: string; accent?: "bull" | "bear" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1.5 font-mono text-xl font-bold ${accent === "bull" ? "text-bull" : accent === "bear" ? "text-bear" : ""}`}>{value}</div>
    </div>
  );
}
