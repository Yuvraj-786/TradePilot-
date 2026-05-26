import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { TradingChart } from "@/components/TradingChart";
import { OrderPanel, type Order } from "@/components/OrderPanel";
import { marketApi, portfolioApi, tradeApi, watchlistApi, subscribeToMarketUpdates, toStock, type MarketQuote, type MarketSnapshot, type PortfolioData, type TradeOrderRow } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { Search, Star } from "lucide-react";
import type { Stock } from "@/lib/mock";

export const Route = createFileRoute("/_app/trade")({
  head: () => ({ meta: [{ title: "Trade — TradePilot" }] }),
  component: Trade,
});

type Position = { symbol: string; qty: number; avg: number; ltp: number; side: "BUY" | "SELL" };

const REFRESH_INTERVAL_MS = 5_000;

function Trade() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [selected, setSelected] = useState<Stock | null>(null);
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<MarketQuote | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [balance, setBalance] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);

  const fetchQuoteSymbol = async (symbol: string) => {
    const normalized = symbol.toUpperCase();
    setSearchError("");
    setSearchLoading(true);
    try {
      const response = await marketApi.getQuote(normalized);
      const quote = response.data;
      if (!quote) {
        throw new Error("Symbol not found.");
      }
      setSearchResult(quote);
      setQuotes((prev) => {
        const exists = prev.some((item) => item.symbol === quote.symbol);
        if (exists) {
          return prev.map((item) => (item.symbol === quote.symbol ? quote : item));
        }
        return [quote, ...prev].slice(0, 50);
      });
      setSelected(toStock(quote));
      return quote;
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Unable to load symbol.");
      throw err;
    } finally {
      setSearchLoading(false);
    }
  };
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const authenticated = isAuthenticated();
    setIsAuthenticatedUser(authenticated);
    setIsAuthReady(true);
    setLoading(authenticated);
  }, []);

  const filtered = useMemo(() => {
    const stockList = quotes.map(toStock);
    const results = stockList.filter((s) => s.symbol.toLowerCase().includes(query.toLowerCase()) || s.name.toLowerCase().includes(query.toLowerCase()));

    if (query.trim()) {
      const normalized = query.trim().toUpperCase();
      if (!results.some((item) => item.symbol === normalized) && searchResult?.symbol === normalized) {
        return [toStock(searchResult), ...results];
      }
    }

    return results;
  }, [quotes, query, searchResult]);

  const applyMarketSnapshot = (snapshot: MarketSnapshot) => {
    const nextQuotes = Array.isArray(snapshot.quotes) ? snapshot.quotes : [];

    setQuotes(nextQuotes);
    setSelected((current) => {
      const nextStockList = nextQuotes.map(toStock);
      if (!current) {
        return nextStockList[0] ?? null;
      }

      const existing = nextStockList.find((item) => item.symbol === current.symbol);
      return existing ?? nextStockList[0] ?? null;
    });
  };

  const loadData = async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const [snapshotResponse, portfolioResponse, tradesResponse] = await Promise.all([
        marketApi.getSnapshot(),
        portfolioApi.getPortfolio(),
        tradeApi.getTrades(),
      ]);

      const nextQuotes = Array.isArray(snapshotResponse.data?.quotes) ? snapshotResponse.data.quotes : [];
      const portfolio = (portfolioResponse.data && typeof portfolioResponse.data === "object" ? portfolioResponse.data : {}) as PortfolioData;
      const backendOrders = Array.isArray(tradesResponse.data) ? tradesResponse.data : [];

      setQuotes(nextQuotes);
      setBalance(Number(portfolio.cashBalance) || 0);
      setOrders(backendOrders.map(toOrder));
      setPositions((portfolio.holdings ?? []).map((holding) => ({
        symbol: String(holding.symbol || "").toUpperCase(),
        qty: Number(holding.quantity) || 0,
        avg: Number(holding.avgPrice) || 0,
        ltp: Number(holding.currentPrice) || 0,
        side: "BUY",
      })));

      const stockList = nextQuotes.map(toStock);
      setSelected((current) => {
        const existing = current ? stockList.find((item) => item.symbol === current.symbol) : undefined;
        return existing ?? stockList[0] ?? null;
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load trade data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = subscribeToMarketUpdates((message) => {
      if (cancelled) {
        return;
      }

      if (message.type === "market:init" || message.type === "market:update") {
        applyMarketSnapshot(message.data);
      }
    }, () => {
      // Keep existing polling behavior as the fallback path.
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticatedUser) {
      if (isAuthReady) {
        setLoading(false);
      }
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      if (cancelled) return;
      await loadData();
    };

    refresh();
    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isAuthReady, isAuthenticatedUser]);

  // If a symbol was provided via query param, pre-select it when data loads
  useEffect(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const target = params?.get("symbol")?.toUpperCase();
    if (!target) return;

    const updateSelected = async () => {
      const found = quotes.map(toStock).find((s) => s.symbol === target);
      if (found) {
        setSelected(found);
        return;
      }

      try {
        await fetchQuoteSymbol(target);
      } catch {
        // Keep existing selection if fetch fails
      }
    };

    updateSelected();
  }, [quotes]);

  // Watch for query param changes (e.g. when TopBar navigate updates search) and select symbol without full reload
  useEffect(() => {
    let last = typeof window !== "undefined" ? window.location.search : "";
    const check = () => {
      const current = window.location.search;
      if (current !== last) {
        last = current;
        const params = new URLSearchParams(current);
        const target = params.get("symbol")?.toUpperCase();
        if (target) {
          const found = quotes.map(toStock).find((s) => s.symbol === target);
          if (found) setSelected(found);
        }
      }
    };

    const iv = window.setInterval(check, 300);
    return () => window.clearInterval(iv);
  }, [quotes]);

  const addToWatchlist = async (symbol: string) => {
    try {
      await watchlistApi.addToWatchlist(symbol);
    } catch (err) {
      // ignore for now
    }
  };

  useEffect(() => {
    let cancelled = false;

    const pollSelected = async () => {
      if (!selected) return;
      try {
        const response = await marketApi.getQuote(selected.symbol);
        const latest = response.data;
        if (!latest || cancelled) return;

        setQuotes((prev) => {
          const found = prev.find((item) => item.symbol === latest.symbol);
          if (found) {
            return prev.map((item) => (item.symbol === latest.symbol ? latest : item));
          }
          return [latest, ...prev].slice(0, 50);
        });

        setSelected((current) => (current && current.symbol === latest.symbol ? toStock(latest) : current));
      } catch {
        // ignore transient quote failures
      }
    };

    pollSelected();
    const interval = window.setInterval(pollSelected, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [selected?.symbol]);

  const placeOrder = async (o: Omit<Order, "id" | "ts" | "status">) => {
    if (!selected) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (o.side === "BUY") {
        await tradeApi.buy({
          symbol: selected.symbol,
          quantity: o.qty,
          stockPrice: o.price,
        });
      } else {
        await tradeApi.sell({
          symbol: selected.symbol,
          quantity: o.qty,
          stockPrice: o.price,
        });
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place trade.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPnL = positions.reduce((s, p) => s + (p.ltp - p.avg) * p.qty, 0);
  const invested = positions.reduce((s, p) => s + p.avg * Math.abs(p.qty), 0);

  if (!isAuthReady) {
    return (
      <>
        <TopBar title="Trade" />
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6 text-sm text-muted-foreground">
          Loading your trading workspace...
        </main>
      </>
    );
  }

  if (!isAuthenticatedUser) {
    return (
      <>
        <TopBar title="Trade" />
        <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-2xl font-bold">Sign in to trade</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Connect your account and load your live portfolio before placing any orders.
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
        <TopBar title="Trade" />
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6 text-sm text-muted-foreground">
          Loading your trading workspace...
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Trade"
        selectedStock={selected ? { symbol: selected.symbol, price: selected.price, change: selected.change } : undefined}
      />
      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 lg:p-4">
        {error ? <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">{error}</div> : null}

        <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)_300px] xl:grid-cols-[260px_minmax(0,1fr)_320px]">
          <aside className="flex h-[640px] flex-col rounded-xl border border-border bg-card">
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (!e.target.value.trim()) {
                      setSearchResult(null);
                      setSearchError("");
                    }
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && query.trim()) {
                      await fetchQuoteSymbol(query.trim());
                    }
                  }}
                  placeholder="Search stocks…"
                  className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-2 text-xs outline-none focus:border-ring"
                />
              </div>
              {searchError ? <p className="mt-2 px-1 text-[10px] text-bear">{searchError}</p> : null}
            </div>
            <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Market</span>
              <span>{filtered.length}</span>
            </div>
            <ul className="flex-1 overflow-y-auto">
              {filtered.map((s) => {
                const active = selected?.symbol === s.symbol;
                return (
                  <li key={s.symbol}>
                    <div
                      role="button"
                      onClick={() => setSelected(s)}
                      className={`flex w-full items-center justify-between gap-2 border-b border-border/50 px-3 py-2 text-left transition-colors ${
                        active ? "bg-primary/10" : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Star className="size-3 text-muted-foreground/60" />
                          <span className="text-sm font-semibold">{s.symbol}</span>
                          <button onClick={(e) => { e.stopPropagation(); addToWatchlist(s.symbol); }} className="ml-2 text-xs text-primary hover:underline">+ Watch</button>
                        </div>
                        <div className="truncate text-[10px] text-muted-foreground">{s.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs">₹{s.price.toLocaleString()}</div>
                        <div className={`font-mono text-[10px] ${s.change >= 0 ? "text-bull" : "text-bear"}`}>
                          {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="h-[640px] min-w-0">
            {selected ? (
              <TradingChart symbol={selected.symbol} basePrice={selected.price} changePct={selected.change} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
                Select a symbol to view the chart.
              </div>
            )}
          </section>

          <aside className="flex h-[640px] flex-col gap-3 overflow-y-auto">
            {selected ? <OrderPanel stock={selected} balance={balance} disabled={isSubmitting} onSubmit={placeOrder} /> : null}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Position Summary</h3>
              <div className="mt-3 space-y-1.5 text-xs">
                <Row label="Total Invested" value={`₹${invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                <Row label="Open Positions" value={String(positions.length)} />
                <Row label="Unrealized P&L" value={`${totalPnL >= 0 ? "+" : ""}₹${totalPnL.toFixed(2)}`} tone={totalPnL >= 0 ? "bull" : "bear"} />
                <Row label="Available Cash" value={`₹${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} tone="primary" />
              </div>
            </div>
          </aside>
        </div>

        <BottomTabs positions={positions} orders={orders} totalPnL={totalPnL} invested={invested} balance={balance} />
      </main>
    </>
  );
}

function toOrder(order: TradeOrderRow): Order {
  const safePrice = Number(order.price) || 0;
  const safeQty = Number(order.quantity) || 0;
  const safeStatus = String(order.status || "OPEN").toUpperCase();
  const safeType = String(order.order_type || "MARKET").toUpperCase();

  return {
    id: Number(order.id) || Date.now(),
    symbol: String(order.symbol || "UNKNOWN").toUpperCase(),
    side: safeType === "SELL" ? "SELL" : "BUY",
    type: "MARKET",
    qty: safeQty,
    price: safePrice,
    sl: undefined,
    tp: undefined,
    ts: order.created_at ? new Date(order.created_at).getTime() : Date.now(),
    status: safeStatus === "COMPLETED" ? "EXECUTED" : "OPEN",
  };
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "bull" | "bear" | "primary" }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-semibold ${
        tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : tone === "primary" ? "text-primary" : ""
      }`}>{value}</span>
    </div>
  );
}

function BottomTabs({ positions, orders, totalPnL, invested, balance }: {
  positions: Position[]; orders: Order[]; totalPnL: number; invested: number; balance: number;
}) {
  const [tab, setTab] = useState<"positions" | "orders" | "summary">("positions");
  const tabs = [
    { id: "positions" as const, label: `Positions (${positions.length})` },
    { id: "orders" as const, label: `Orders (${orders.length})` },
    { id: "summary" as const, label: "Portfolio Summary" },
  ];

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >{t.label}</button>
        ))}
      </div>
      <div className="overflow-x-auto">
        {tab === "positions" && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Symbol</th>
                <th className="px-4 py-2.5">Side</th>
                <th className="px-4 py-2.5 text-right">Qty</th>
                <th className="px-4 py-2.5 text-right">Avg</th>
                <th className="px-4 py-2.5 text-right">LTP</th>
                <th className="px-4 py-2.5 text-right">P&L</th>
                <th className="px-4 py-2.5 text-right">P&L %</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-xs text-muted-foreground">No open positions</td></tr>
              ) : positions.map((p) => {
                const pnl = (p.ltp - p.avg) * p.qty;
                const pct = ((p.ltp - p.avg) / p.avg) * 100;
                return (
                  <tr key={p.symbol} className="border-b border-border last:border-0 hover:bg-accent/30">
                    <td className="px-4 py-2.5 font-semibold">{p.symbol}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${p.side === "BUY" ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}`}>{p.side}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{p.qty}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{p.avg.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{p.ltp.toFixed(2)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono ${pnl >= 0 ? "text-bull" : "text-bear"}`}>
                      {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono ${pct >= 0 ? "text-bull" : "text-bear"}`}>
                      {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {tab === "orders" && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Symbol</th>
                <th className="px-4 py-2.5">Side</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5 text-right">Qty</th>
                <th className="px-4 py-2.5 text-right">Price</th>
                <th className="px-4 py-2.5 text-right">SL</th>
                <th className="px-4 py-2.5 text-right">TP</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-xs text-muted-foreground">No orders yet — place one from the panel above.</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{new Date(o.ts).toLocaleTimeString()}</td>
                  <td className="px-4 py-2.5 font-semibold">{o.symbol}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${o.side === "BUY" ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}`}>{o.side}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{o.type}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{o.qty}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{o.price.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{o.sl?.toFixed(2) ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{o.tp?.toFixed(2) ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${o.status === "EXECUTED" ? "bg-bull/15 text-bull" : "bg-warning/15 text-warning"}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "summary" && (
          <div className="grid gap-3 p-4 md:grid-cols-4">
            <Stat label="Total Invested" value={`₹${invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <Stat label="Available Cash" value={`₹${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} tone="primary" />
            <Stat label="Unrealized P&L" value={`${totalPnL >= 0 ? "+" : ""}₹${totalPnL.toFixed(2)}`} tone={totalPnL >= 0 ? "bull" : "bear"} />
            <Stat label="Open Positions" value={String(positions.length)} />
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "bull" | "bear" | "primary" }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-lg font-bold ${
        tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : tone === "primary" ? "text-primary" : ""
      }`}>{value}</div>
    </div>
  );
}
