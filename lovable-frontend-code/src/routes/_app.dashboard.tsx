import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Delta } from "@/components/Delta";
import { AI_INSIGHTS, PORTFOLIO_GROWTH } from "@/lib/mock";
import { marketApi, portfolioApi, tradeApi, type MarketSnapshot, type PortfolioData, type TradeOrderRow } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Sparkles, TriangleAlert, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TradePilot" }] }),
  component: Dashboard,
});

const REFRESH_INTERVAL_MS = 30_000;

function Dashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [trades, setTrades] = useState<TradeOrderRow[]>([]);
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);

  useEffect(() => {
    const authenticated = isAuthenticated();
    setIsAuthenticatedUser(authenticated);
    setIsAuthReady(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticatedUser) {
      if (isAuthReady) {
        setLoading(false);
      }
      return;
    }

    let cancelled = false;

    const loadDashboardData = async () => {
      try {
        const [portfolioResponse, tradesResponse, snapshotResponse] = await Promise.all([
          portfolioApi.getPortfolio(),
          tradeApi.getTrades(),
          marketApi.getSnapshot(),
        ]);

        if (cancelled) return;

        setPortfolio(portfolioResponse.data ?? null);
        setTrades(tradesResponse.data ?? []);
        setSnapshot(snapshotResponse.data ?? null);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();
    const interval = window.setInterval(loadDashboardData, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isAuthReady, isAuthenticatedUser]);

  const portfolioValue = portfolio?.totalValue ?? 0;
  const invested = portfolio?.totalInvested ?? 0;
  const pnl = portfolio?.totalPnL ?? 0;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
  const balance = portfolio?.cashBalance ?? 0;
  const holdings = portfolio?.holdings ?? [];

  if (!isAuthReady) {
    return (
      <>
        <TopBar title="Dashboard" />
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6 text-sm text-muted-foreground">
          Loading your dashboard...
        </main>
      </>
    );
  }

  if (!isAuthenticatedUser) {
    return (
      <>
        <TopBar title="Dashboard" />
        <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-2xl font-bold">Sign in to view your dashboard</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Connect your account to load your real portfolio, balances, and trade activity.
          </p>
          <Link to="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Go to sign in
          </Link>
        </main>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <TopBar title="Dashboard" />
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6 text-sm text-muted-foreground">
          Loading your dashboard...
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopBar title="Dashboard" />
        <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-xl font-semibold">Unable to load the dashboard</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-5 lg:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Portfolio Value" value={`₹${portfolioValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`} delta={pnlPct} />
          <Kpi label="Virtual Balance" value={`₹${balance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`} delta={Number(snapshot?.overallChange ?? 0)} />
          <Kpi label="Today's P&L" value={`${pnl >= 0 ? "+" : ""}₹${pnl.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`} delta={pnlPct} accent={pnl >= 0 ? "bull" : "bear"} />
          <Kpi label="Total Trades" value={String(trades.length)} hint={`${snapshot?.marketStatus ?? "Market"} snapshot`} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <section className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Portfolio Growth</h2>
                <p className="text-xs text-muted-foreground">Last 30 days · ₹</p>
              </div>
              <div className="flex gap-1 rounded-md border border-border p-0.5 text-xs">
                {[
                  "1D",
                  "1W",
                  "1M",
                  "3M",
                  "1Y",
                ].map((r, i) => (
                  <button key={r} className={`rounded px-2.5 py-1 font-medium ${i === 2 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{r}</button>
                ))}
              </div>
            </div>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PORTFOLIO_GROWTH} margin={{ top: 10, right: 8, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--bull)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--bull)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "var(--muted-foreground)" }}
                    formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Value"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--bull)" strokeWidth={2} fill="url(#pg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Risk Score</h2>
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">Medium</span>
              </div>
              <div className="mt-4 flex items-center gap-5">
                <RiskGauge value={Math.min(100, Math.max(20, Math.round(100 - (portfolioValue / 1000))))} />
                <div className="space-y-1.5 text-xs">
                  <Row k="Diversification" v={holdings.length > 4 ? "Improving" : "Low"} tone={holdings.length > 4 ? "bull" : "bear"} />
                  <Row k="Stop-loss" v={holdings.length > 0 ? "Managed" : "None"} tone={holdings.length > 0 ? "bull" : "bear"} />
                  <Row k="Volatility" v={snapshot?.marketStatus === "Bullish" ? "Moderate" : "High"} tone={snapshot?.marketStatus === "Bullish" ? "bull" : "warning"} />
                  <Row k="Consistency" v={trades.length > 0 ? "Good" : "New"} tone={trades.length > 0 ? "bull" : "warning"} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">AI Insights</h2>
              </div>
              <div className="mt-4 space-y-3">
                {AI_INSIGHTS.slice(0, 2).map((i, idx) => (
                  <InsightItem key={idx} {...i} />
                ))}
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-5 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">Holdings</h2>
              <p className="text-xs text-muted-foreground">{holdings.length} positions</p>
            </div>
            <button className="text-xs font-medium text-primary hover:underline">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Symbol</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3 text-right">Avg Price</th>
                  <th className="px-5 py-3 text-right">LTP</th>
                  <th className="px-5 py-3 text-right">P&L</th>
                  <th className="px-5 py-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-muted-foreground">
                      No holdings yet. Start trading to build your portfolio.
                    </td>
                  </tr>
                ) : holdings.map((h) => {
                  const pnlHolding = h.unrealizedPnL;
                  const up = pnlHolding >= 0;
                  return (
                    <tr key={h.symbol} className="border-b border-border last:border-0 hover:bg-accent/40">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold">{h.symbol}</div>
                        <div className="text-xs text-muted-foreground">Live quote</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono">{h.quantity}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-muted-foreground">₹{h.avgPrice.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right font-mono">₹{h.currentPrice.toFixed(2)}</td>
                      <td className={`px-5 py-3.5 text-right font-mono ${up ? "text-bull" : "text-bear"}`}>
                        {up ? "+" : ""}₹{pnlHolding.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold">₹{h.marketValue.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}

function Kpi({ label, value, delta, hint, accent }: { label: string; value: string; delta?: number; hint?: string; accent?: "bull" | "bear" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 font-mono text-2xl font-semibold tracking-tight ${accent === "bull" ? "text-bull" : ""}`}>{value}</div>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {delta !== undefined ? <Delta value={delta} /> : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone: "bull" | "bear" | "warning" }) {
  const cls = tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-warning";
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className={`font-semibold ${cls}`}>{v}</span>
    </div>
  );
}

function RiskGauge({ value }: { value: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative grid size-24 place-items-center">
      <svg viewBox="0 0 90 90" className="size-24 -rotate-90">
        <circle cx="45" cy="45" r={r} stroke="var(--muted)" strokeWidth="7" fill="none" />
        <circle cx="45" cy="45" r={r} stroke="var(--warning)" strokeWidth="7" fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="font-mono text-xl font-bold">{value}</div>
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">/100</div>
      </div>
    </div>
  );
}

function InsightItem({ tone, title, body }: { tone: "warning" | "info" | "bull"; title: string; body: string }) {
  const Icon = tone === "warning" ? TriangleAlert : tone === "bull" ? TrendingUp : Sparkles;
  const cls = tone === "warning" ? "text-warning bg-warning/10" : tone === "bull" ? "text-bull bg-bull/10" : "text-primary bg-primary/10";
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-center gap-2">
        <div className={`grid size-6 place-items-center rounded ${cls}`}><Icon className="size-3.5" /></div>
        <div className="text-xs font-semibold">{title}</div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
