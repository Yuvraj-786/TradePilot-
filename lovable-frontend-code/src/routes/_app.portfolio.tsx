import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { marketApi, portfolioApi, type MarketQuote, type PortfolioData } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/_app/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — TradePilot" }] }),
  component: Portfolio,
});

const REFRESH_INTERVAL_MS = 30_000;

function Portfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
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

    const loadPortfolio = async () => {
      try {
        const portfolioResponse = await portfolioApi.getPortfolio();
        if (cancelled) return;

        const currentPortfolio = portfolioResponse.data ?? null;
        setPortfolio(currentPortfolio);

        const symbols = currentPortfolio?.holdings.map((holding) => holding.symbol) ?? [];
        if (symbols.length === 0) {
          setQuotes([]);
          setError("");
          return;
        }

        const quotesResponse = await marketApi.getQuotes(symbols);
        if (cancelled) return;

        setQuotes(quotesResponse.data ?? []);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load your portfolio.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPortfolio();
    const interval = window.setInterval(loadPortfolio, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isAuthReady, isAuthenticatedUser]);

  const holdings = portfolio?.holdings ?? [];
  const invested = portfolio?.totalInvested ?? 0;
  const current = portfolio?.totalValue ?? 0;
  const pnl = portfolio?.totalPnL ?? 0;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

  const sectorData = useMemo(() => {
    const totals = new Map<string, number>();

    holdings.forEach((holding) => {
      const quote = quotes.find((item) => item.symbol === holding.symbol);
      const sector = quote?.sector || "Unknown";
      totals.set(sector, (totals.get(sector) || 0) + holding.marketValue);
    });

    const total = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);

    return Array.from(totals.entries()).map(([name, value], index) => ({
      name,
      value: total === 0 ? 0 : Number(((value / total) * 100).toFixed(1)),
      color: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"][index % 5],
    }));
  }, [holdings, quotes]);

  if (!isAuthReady) {
    return (
      <>
        <TopBar title="Portfolio" />
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6 text-sm text-muted-foreground">
          Loading your portfolio...
        </main>
      </>
    );
  }

  if (!isAuthenticatedUser) {
    return (
      <>
        <TopBar title="Portfolio" />
        <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-2xl font-bold">Sign in to view your portfolio</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Your holdings and cash balance are protected behind your account.
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
        <TopBar title="Portfolio" />
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6 text-sm text-muted-foreground">
          Loading your portfolio...
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopBar title="Portfolio" />
        <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-xl font-semibold">Unable to load your portfolio</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Portfolio" />
      <main className="flex-1 overflow-y-auto p-5 lg:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Portfolio</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track all your virtual holdings and performance</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Invested" value={`₹${invested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} />
          <StatCard label="Current" value={`₹${current.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} />
          <StatCard label="P&L" value={`${pnl >= 0 ? "+" : ""}₹${pnl.toFixed(0)}`} accent={pnl >= 0 ? "bull" : "bear"} />
          <StatCard label="Return" value={`${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`} accent={pnlPct >= 0 ? "bull" : "bear"} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <section className="rounded-xl border border-border bg-card lg:col-span-2">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Holdings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3">Stock</th>
                    <th className="px-5 py-3">Qty</th>
                    <th className="px-5 py-3 text-right">P&L</th>
                    <th className="px-5 py-3">Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const alloc = current === 0 ? 0 : (h.marketValue / current) * 100;
                    const p = h.unrealizedPnL;
                    return (
                      <tr key={h.symbol} className="border-b border-border last:border-0 hover:bg-accent/40">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold">{h.symbol}</div>
                          <div className="text-xs text-muted-foreground">Live quote</div>
                        </td>
                        <td className="px-5 py-3.5 font-mono">{h.quantity}</td>
                        <td className={`px-5 py-3.5 text-right font-mono ${p >= 0 ? "text-bull" : "text-bear"}`}>
                          {p >= 0 ? "+" : ""}₹{p.toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-primary" style={{ width: `${alloc}%` }} />
                            </div>
                            <span className="font-mono text-xs text-muted-foreground">{alloc.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Sector Distribution</h2>
              <div className="mt-3 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2} strokeWidth={0}>
                      {sectorData.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-2">
                {sectorData.map((s) => (
                  <li key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-sm" style={{ background: s.color }} />
                      <span>{s.name}</span>
                    </div>
                    <span className="font-mono font-semibold">{s.value}%</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-warning">Diversification Tip</div>
              <p className="mt-2 text-sm leading-relaxed">
                {sectorData.length > 0 && sectorData[0]?.value >= 40
                  ? `${sectorData[0].name} dominates your holdings. Consider diversifying across sectors to lower concentration risk.`
                  : "Keep your portfolio balanced across sectors so a single move does not impact your total net value."}
              </p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "bull" | "bear" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 font-mono text-2xl font-semibold ${accent === "bull" ? "text-bull" : accent === "bear" ? "text-bear" : ""}`}>{value}</div>
    </div>
  );
}
