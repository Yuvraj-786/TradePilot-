import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import {
  ArrowRight, ShieldCheck, Sparkles, LineChart, Brain,
  TrendingUp, Eye, FlaskConical, GraduationCap,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";
import { useState } from "react";
import { authApi } from "@/lib/api";
import { setStoredSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TradePilot — AI Powered Paper Trading Platform" },
      { name: "description", content: "Practice stock trading risk-free with ₹1,00,000 virtual capital, real-time market data, and AI-driven feedback on every trade." },
      { property: "og:title", content: "TradePilot — Learn the Market, Risk-Free" },
      { property: "og:description", content: "AI-powered paper trading platform for serious learners." },
    ],
  }),
  component: Landing,
});

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className="grid size-9 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground">
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

function Landing() {
  const navigate = useNavigate();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState("");

  const handleViewLiveDemo = async () => {
    setDemoError("");
    setIsDemoLoading(true);

    try {
      const response = await authApi.demo();

      if (!response.success || !response.token || !response.user) {
        throw new Error(response.message || "Unable to load demo account right now.");
      }

      setStoredSession({ token: response.token, user: response.user });
      navigate({ to: "/dashboard" });
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : "Unable to load demo account right now.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Logo />
          <nav className="ml-10 hidden gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-block">
              Sign in
            </Link>
            <Link to="/signup" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Open free account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-bull" />
              Live market simulation · 100% virtual money
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Learn to trade the<br />market, <span className="text-primary">risk-free.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Practice with ₹1,00,000 virtual capital on real-time prices. Get AI feedback on every trade,
              behavioral insights, and a personalized risk score — without losing a rupee.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Start paper trading <ArrowRight className="size-4" />
              </Link>
              <button
                type="button"
                onClick={handleViewLiveDemo}
                disabled={isDemoLoading}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDemoLoading ? "Loading demo..." : "View live demo"}
              </button>
            </div>
            {demoError ? (
              <p className="mt-3 text-sm text-bear">{demoError}</p>
            ) : null}
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6">
              <Stat label="Active learners" value="50K+" />
              <Stat label="Trades simulated" value="2.4M" />
              <Stat label="Avg. accuracy lift" value="+34%" />
            </div>
          </div>

          {/* Mock dashboard card */}
          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-primary/5">
              <div className="flex items-center justify-between border-b border-border bg-background/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">RELIANCE</span>
                  <span className="text-[10px] text-muted-foreground">NSE</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-semibold">₹2,845.30</span>
                  <span className="font-mono text-xs text-bull">+1.15%</span>
                </div>
              </div>
              <div className="p-4">
                <svg viewBox="0 0 400 160" className="h-40 w-full">
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--bull)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--bull)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,120 L40,110 L80,95 L120,100 L160,80 L200,85 L240,60 L280,70 L320,45 L360,55 L400,30 L400,160 L0,160 Z" fill="url(#g)" />
                  <path d="M0,120 L40,110 L80,95 L120,100 L160,80 L200,85 L240,60 L280,70 L320,45 L360,55 L400,30" stroke="var(--bull)" strokeWidth="2" fill="none" />
                </svg>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                  <Mini label="Open" value="2,810" />
                  <Mini label="High" value="2,862" />
                  <Mini label="Low" value="2,798" />
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 rounded-md bg-bull py-2.5 text-xs font-bold text-bull-foreground">BUY</button>
                  <button className="flex-1 rounded-md bg-bear py-2.5 text-xs font-bold text-bear-foreground">SELL</button>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden w-60 rounded-xl border border-border bg-card p-4 shadow-xl lg:block">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span className="text-xs font-semibold">AI Mentor</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                "Your tech exposure is 62%. Consider diversifying into financials."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Why TradePilot</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Everything a serious learner needs.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built to teach you not just how to trade — but how to think like a trader.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Feature icon={Brain} title="AI Trade Analysis" body="Every order analyzed for risk, sizing, and timing — with plain-English feedback." />
            <Feature icon={ShieldCheck} title="Risk Scoring" body="Continuous risk score from diversification, stop-loss usage, and volatility exposure." />
            <Feature icon={Sparkles} title="Behavioral Insights" body="Detects overtrading, revenge trades, and panic selling before they cost you." />
            <Feature icon={LineChart} title="Real-Time Data" body="Live NSE/BSE & US prices, candlestick charts, and historical depth." />
            <Feature icon={Eye} title="Watchlists" body="Track unlimited symbols with instant buy/sell access from anywhere." />
            <Feature icon={FlaskConical} title="Strategy Backtesting" body="Test MA, RSI, and momentum strategies on years of historical data." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-border bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Get trading in three steps.</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { n: "01", t: "Create account", d: "Sign up free, receive ₹1,00,000 virtual capital instantly." },
              { n: "02", t: "Place real trades", d: "Buy & sell on live prices. No broker, no risk, no funding." },
              { n: "03", t: "Learn from AI", d: "Get personalized feedback, risk scores, and improvement tips after every trade." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-border bg-background p-6">
                <div className="font-mono text-xs font-semibold text-primary">{s.n}</div>
                <div className="mt-3 text-lg font-semibold">{s.t}</div>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <GraduationCap className="mx-auto size-10 text-primary" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            Free forever. Built for learners.
          </h2>
          <p className="mt-3 text-muted-foreground">
            No credit card. No hidden fees. Just real market education.
          </p>
          <Link to="/signup" className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Open your free account <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-3">
            <TrendingUp className="size-4 text-primary" />
            <span>© 2026 TradePilot. Paper trading platform — no real money involved.</span>
          </div>
          <div className="flex gap-5"><a href="#" className="hover:text-foreground">Privacy</a><a href="#" className="hover:text-foreground">Terms</a><a href="#" className="hover:text-foreground">Contact</a></div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/50 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm font-semibold">₹{value}</div>
    </div>
  );
}
function Feature({ icon: Icon, title, body }: { icon: typeof Brain; title: string; body: string }) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
      <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="mt-4 text-base font-semibold">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
