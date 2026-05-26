export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" fill="none" className="size-5">
          <path d="M3 17l5-5 4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 8h5v5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-[15px] font-semibold tracking-tight">TradePilot</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Paper Trading</div>
      </div>
    </div>
  );
}
