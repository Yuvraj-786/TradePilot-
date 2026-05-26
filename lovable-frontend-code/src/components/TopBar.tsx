import { Bell, Moon, Sun, Search } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { clearStoredSession, getCurrentUser } from "@/lib/auth";

type SelectedStock = {
  symbol: string;
  price: number;
  change: number;
};

export function TopBar({
  title,
  selectedStock,
}: {
  title: string;
  selectedStock?: SelectedStock;
}) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const s = query.trim().toUpperCase();
      if (s) {
        navigate({ to: "/trade", search: { symbol: s } });
      }
    }
  };

  const onLogout = () => {
    clearStoredSession();
    navigate({ to: "/login" });
  };

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-5">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">{title}</h1>
          {selectedStock ? (
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              <span className="font-semibold text-foreground">{selectedStock.symbol}</span>
              <span className="font-mono text-muted-foreground">
                ₹{selectedStock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className={`font-mono ${selectedStock.change >= 0 ? "text-bull" : "text-bear"}`}>
                {selectedStock.change >= 0 ? "+" : ""}
                {selectedStock.change.toFixed(2)}%
              </span>
            </div>
          ) : null}
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-bull/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-bull">
          <span className="size-1.5 animate-pulse rounded-full bg-bull" /> Live
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
            onKeyDown={onSearchKey}
            placeholder="Search symbol…"
            className="h-9 w-56 rounded-md border border-border bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
          />
        </div>
        <button
          onClick={toggle}
          className="grid size-9 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((s) => !s)}
            className="relative grid size-9 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-bear" />
          </button>
          {showNotifications ? (
            <div className="absolute right-0 mt-2 w-72 rounded-md border border-border bg-card p-2 shadow-lg z-50">
              <div className="text-sm font-semibold px-2 py-1">Notifications</div>
              <div className="mt-1 text-xs text-muted-foreground px-2 py-1">No new notifications</div>
            </div>
          ) : null}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile((s) => !s)}
            className="grid size-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            aria-label="Profile"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : "D"}
          </button>
          {showProfile ? (
            <div className="absolute right-0 mt-2 w-44 rounded-md border border-border bg-card p-2 shadow-lg z-50">
              <button onClick={() => navigate({ to: "/settings" })} className="block w-full text-left px-2 py-1 text-sm hover:bg-accent">
                Settings
              </button>
              <div className="border-t border-border mt-1" />
              <button onClick={onLogout} className="block w-full text-left px-2 py-1 text-sm text-bear hover:bg-accent">
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}