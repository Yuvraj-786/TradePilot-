import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, LineChart, Briefcase, Eye, Sparkles,
  FlaskConical, GraduationCap, Settings, LogOut,
} from "lucide-react";
import { Logo } from "./Logo";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase },
  { to: "/trade", label: "Trade", icon: LineChart },
  { to: "/watchlist", label: "Watchlist", icon: Eye },
  { to: "/ai-insights", label: "AI Insights", icon: Sparkles },
  { to: "/backtesting", label: "Backtesting", icon: FlaskConical },
  { to: "/learn", label: "Learn", icon: GraduationCap },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link to="/dashboard"><Logo /></Link>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="size-4" /> Logout
        </Link>
      </div>
    </aside>
  );
}
