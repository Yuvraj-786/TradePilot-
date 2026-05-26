import { useEffect, useMemo, useState } from "react";
import { marketApi, toStock } from "@/lib/api";
import type { Stock } from "@/lib/mock";

const REFRESH_INTERVAL_MS = 15_000;

export function Ticker() {
  const [quotes, setQuotes] = useState<Stock[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadQuotes = async () => {
      try {
        const response = await marketApi.getSnapshot();
        if (cancelled) return;

        const snapshotQuotes = response.data?.quotes ?? [];
        setQuotes(snapshotQuotes.map(toStock));
        setError("");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unable to refresh live market data.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadQuotes();
    const interval = window.setInterval(loadQuotes, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const items = useMemo(() => {
    if (quotes.length === 0) {
      return [];
    }

    return [...quotes, ...quotes];
  }, [quotes]);

  return (
    <div className="relative overflow-hidden border-b border-border bg-card">
      {error ? <div className="px-5 py-1 text-[10px] text-warning">{error}</div> : null}
      {loading && quotes.length === 0 ? (
        <div className="px-5 py-1 text-[10px] text-muted-foreground">Loading live market quotes...</div>
      ) : null}
      <div className="flex animate-ticker whitespace-nowrap py-2">
        {items.map((s, i) => (
          <div key={`${s.symbol}-${i}`} className="flex items-center gap-2 px-5 text-xs">
            <span className="font-semibold text-foreground">{s.symbol}</span>
            <span className="font-mono text-muted-foreground">₹{s.price.toLocaleString()}</span>
            <span className={`font-mono ${s.change >= 0 ? "text-bull" : "text-bear"}`}>
              {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
