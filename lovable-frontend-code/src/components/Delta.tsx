import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function Delta({ value, suffix = "%", className = "" }: { value: number; suffix?: string; className?: string }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs font-medium ${up ? "text-bull" : "text-bear"} ${className}`}>
      <Icon className="size-3.5" />
      {up ? "+" : ""}{value.toFixed(2)}{suffix}
    </span>
  );
}
