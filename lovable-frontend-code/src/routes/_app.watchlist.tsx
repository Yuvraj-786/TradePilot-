import { Link, createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { toStock, watchlistApi, marketApi, subscribeToMarketUpdates, type MarketQuote, type MarketSnapshot } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_app/watchlist")({
  head: () => ({ meta: [{ title: "Watchlist — TradePilot" }] }),
  component: Watchlist,
});



function Watchlist() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);

  useEffect(() => {
    setIsAuthenticatedUser(isAuthenticated());
    setIsAuthReady(true);
  }, []);

  // Fetch watchlist once on mount
  const refresh = async () => {
    if (!isAuthenticatedUser) {
      setLoading(false);
      return;
    }
    try {
      const response = await watchlistApi.getWatchlist();
      setSymbols(response.data?.symbols ?? []);
      setQuotes(response.data?.quotes ?? []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load watchlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    let unsub: (() => void) | undefined;
    let cancelled = false;

    const loadAndSubscribe = async () => {
      setLoading(true);
      await refresh();
      if (cancelled || !isAuthenticatedUser) {
        return;
      }
      // Subscribe to market updates for real-time price refresh
      unsub = subscribeToMarketUpdates((msg) => {
        if (msg.type === "market:update" || msg.type === "market:init") {
          // Only update quotes for symbols in the watchlist
          setQuotes((prevQuotes) => {
            const watchSymbols = new Set(symbols);
            const updatedQuotes = (msg.data.quotes || []).filter((q) => watchSymbols.has(q.symbol));
            // If no symbols yet, fallback to previous
            return updatedQuotes.length > 0 ? updatedQuotes : prevQuotes;
          });
        }
      });
    };

    loadAndSubscribe();
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [isAuthReady, isAuthenticatedUser, symbols.length]);

  const addSymbol = async () => {
    const normalized = input.trim().toUpperCase();
    if (!normalized) {
      return;
    }

    setIsAdding(true);
    setError("");
    try {
      // Validate symbol exists before adding
      const quoteResp = await marketApi.getQuote(normalized);
      if (!quoteResp.data || !quoteResp.data.symbol) {
        setError("Symbol not found. Please enter a valid stock symbol.");
        setIsAdding(false);
        return;
      }
      const response = await watchlistApi.addToWatchlist(normalized);
      setSymbols(response.data?.symbols ?? []);
      setQuotes(response.data?.quotes ?? []);
      setInput("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add symbol.");
    } finally {
      setIsAdding(false);
    }
  };

  const removeSymbol = async (symbol: string) => {
    try {
      const response = await watchlistApi.removeFromWatchlist(symbol);
      setSymbols(response.data?.symbols ?? []);
      setQuotes(response.data?.quotes ?? []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove symbol.");
    }
  };

  const items = quotes.map(toStock);

  if (!isAuthReady) {
    return (
      <>
        <TopBar title="Watchlist" />
        <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="text-sm text-muted-foreground">Loading your watchlist...</div>
        </main>
      </>
    );
  }

  if (!isAuthenticatedUser) {
    return (
      <>
        <TopBar title="Watchlist" />
        <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-2xl font-bold">Sign in to manage your watchlist</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Your watchlist is tied to your account. Sign in to view and update the symbols you are tracking.
          </p>
          <Link to="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Go to sign in
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Watchlist" />
      <main className="flex-1 overflow-y-auto p-5 lg:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your favourite stocks</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Add symbol… (e.g. INFY)"
            className="h-10 w-72 rounded-md border border-border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
          />
          <button
            onClick={addSymbol}
            disabled={isAdding}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="size-4" /> {isAdding ? "Adding..." : "Add"}
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-bear">{error}</p> : null}

        {loading ? (
          <div className="mt-6 text-sm text-muted-foreground">Loading your watchlist...</div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Your watchlist is empty. Add symbols to start tracking live prices.
              </div>
            ) : items.map((s) => (
              <div key={s.symbol} className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-bold tracking-tight">{s.symbol}</div>
                    <div className="text-xs text-muted-foreground">{s.name}</div>
                    <div className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.sector}</div>
                  </div>
                  <button
                    onClick={() => removeSymbol(s.symbol)}
                    className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold">₹{s.price.toLocaleString()}</span>
                  <span className={`rounded-md px-1.5 py-0.5 text-xs font-mono font-semibold ${s.change >= 0 ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"}`}>
                    {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <a href="/trade" className="flex-1 rounded-md bg-bull py-2 text-center text-xs font-bold text-bull-foreground hover:opacity-90">BUY</a>
                  <button onClick={() => removeSymbol(s.symbol)} className="flex-1 rounded-md border border-border bg-background py-2 text-xs font-semibold hover:bg-accent">REMOVE</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
