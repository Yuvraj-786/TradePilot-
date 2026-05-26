import { useEffect, useState } from "react";
import type { Stock } from "@/lib/mock";

export type Order = {
  id: number;
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  qty: number;
  price: number;
  sl?: number;
  tp?: number;
  ts: number;
  status: "OPEN" | "EXECUTED";
};

type Props = {
  stock: Stock;
  balance: number;
  disabled?: boolean;
  onSubmit: (o: Omit<Order, "id" | "ts" | "status">) => void;
};

export function OrderPanel({ stock, balance, disabled = false, onSubmit }: Props) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [type, setType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState(stock.price.toFixed(2));
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");

  useEffect(() => {
    if (type === "MARKET") setPrice(stock.price.toFixed(2));
  }, [stock, type]);

  const qtyN = Math.max(0, Number(qty) || 0);
  const priceN = type === "MARKET" ? stock.price : Number(price) || 0;
  const margin = qtyN * priceN;
  const insufficient = side === "BUY" && margin > balance;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Place Order</h3>
        <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-primary">
          {stock.symbol}
        </span>
      </div>

      {/* Side toggle */}
      <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border">
        <button
          onClick={() => setSide("BUY")}
          className={`py-2 text-sm font-bold transition ${side === "BUY" ? "bg-bull text-bull-foreground" : "text-muted-foreground hover:bg-accent"}`}
        >BUY</button>
        <button
          onClick={() => setSide("SELL")}
          className={`py-2 text-sm font-bold transition ${side === "SELL" ? "bg-bear text-bear-foreground" : "text-muted-foreground hover:bg-accent"}`}
        >SELL</button>
      </div>

      {/* Type */}
      <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border bg-background">
        {(["MARKET", "LIMIT"] as const).map((t) => (
          <button key={t} onClick={() => setType(t)}
            className={`py-1.5 text-[11px] font-semibold uppercase tracking-wider ${type === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >{t}</button>
        ))}
      </div>

      <Field label="Quantity">
        <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-ring" />
      </Field>

      <Field label={type === "MARKET" ? "Price (Market)" : "Limit Price"}>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} disabled={type === "MARKET"}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-ring disabled:opacity-60" />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Stop Loss">
          <input type="number" value={sl} onChange={(e) => setSl(e.target.value)} placeholder="—"
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-ring" />
        </Field>
        <Field label="Take Profit">
          <input type="number" value={tp} onChange={(e) => setTp(e.target.value)} placeholder="—"
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-ring" />
        </Field>
      </div>

      <div className="space-y-1 rounded-md border border-border bg-background/50 p-3 text-xs">
        <Row label="Estimated margin" value={`₹${margin.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <Row label="Available balance" value={`₹${balance.toLocaleString()}`} tone="primary" />
        {insufficient && <div className="text-bear">Insufficient balance for this order.</div>}
      </div>

      <button
        disabled={disabled || qtyN === 0 || (type === "LIMIT" && priceN === 0) || insufficient}
        onClick={() => onSubmit({
          symbol: stock.symbol, side, type, qty: qtyN, price: priceN,
          sl: sl ? Number(sl) : undefined, tp: tp ? Number(tp) : undefined,
        })}
        className={`rounded-md py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          side === "BUY" ? "bg-bull text-bull-foreground hover:opacity-90" : "bg-bear text-bear-foreground hover:opacity-90"
        }`}
      >
        {disabled ? "Processing..." : `${side} ${qtyN} ${stock.symbol} ${type === "LIMIT" ? `@ ₹${priceN}` : "@ Market"}`}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "primary" }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${tone === "primary" ? "text-primary font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
