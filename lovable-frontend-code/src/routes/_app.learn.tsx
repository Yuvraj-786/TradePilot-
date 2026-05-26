import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Activity, BookOpen, Brain, ShieldCheck, TrendingUp, Wallet, PlayCircle, GraduationCap, Compass } from "lucide-react";

export const Route = createFileRoute("/_app/learn")({
  head: () => ({ meta: [{ title: "Learn — TradePilot" }] }),
  component: Learn,
});

// const LESSONS = [
//   { icon: BookOpen, cat: "Basics", title: "How the stock market works", time: "8 min", body: "Understand exchanges, tickers, bid/ask, and order matching." },
//   { icon: Wallet, cat: "Basics", title: "Reading a stock quote", time: "5 min", body: "Decode price, volume, day range, market cap, P/E ratio." },
//   { icon: ShieldCheck, cat: "Risk", title: "Position sizing & stop-loss", time: "10 min", body: "Risk only 1–2% per trade. Set stops based on volatility, not emotion." },
//   { icon: Brain, cat: "Psychology", title: "Beating revenge trading", time: "7 min", body: "Why losing trades trigger bigger losing trades — and how to break the loop." },
//   { icon: TrendingUp, cat: "Strategy", title: "Moving average crossover", time: "12 min", body: "The classic 50/200 system. When it works, and when it doesn't." },
//   { icon: Activity, cat: "Strategy", title: "RSI mean-reversion", time: "11 min", body: "Use RSI extremes to time entries on liquid large-caps." },
// ];

const PAPER_TRADING_MODULES = [
  {
    title: "Paper Trading Fundamentals",
    description: "Learn how virtual accounts work, how to simulate trades, and why paper trading is the fastest way to build consistency before risking real money.",
    points: ["Use a fixed virtual balance", "Track every entry and exit", "Record reasons for every trade"],
  },
  {
    title: "Build a Trade Plan",
    description: "Define your thesis, risk rule, position size, and exit rule so every trade follows the same process.",
    points: ["Entry criteria", "Stop-loss and target", "Trade journal notes"],
  },
  {
    title: "Review and Improve",
    description: "Use post-trade reviews to identify behavior mistakes, improve execution, and reduce emotional decisions.",
    points: ["Review winners and losers", "Check drawdowns", "Refine your strategy weekly"],
  },
];

const LEARNING_RESOURCE_SECTIONS = [
  {
    title: "Basic learning videos",
    description: "Short, easy-to-follow videos for understanding stock trading, investing, and market basics.",
    resources: [
      {
        title: "Khan Academy — Stock Investments",
        type: "Video / Free lessons",
        description: "A beginner-friendly video series that explains stocks, investing, and risk in a simple way.",
        url: "https://www.khanacademy.org/economics-finance-domain/core-finance/stock-investments",
        badge: "Beginner-friendly",
      },
      {
        title: "Fidelity Learning Center",
        type: "Video / Docs",
        description: "Useful education pages and webinars for market basics, trading tools, and beginner investing.",
        url: "https://www.fidelity.com/learning-center/overview",
        badge: "Practical resources",
      },
      {
        title: "YouTube — The Trading Channel",
        type: "YouTube channel",
        description: "A direct YouTube resource for trading tutorials and market education.",
        url: "https://www.youtube.com/@TheTradingChannel",
        badge: "Direct tutorial link",
      },
    ],
  },
  {
    title: "Documents for stock trading, intraday and technical basics",
    description: "Direct reading material to understand fundamentals, intraday trading concepts, and technical analysis.",
    resources: [
      {
        title: "Training Material on Intraday Trading PDF",
        type: "PDF / Slideshare",
        description: "A practical intraday training deck covering the basics of intraday trading setups and execution.",
        url: "https://www.slideshare.net/slideshow/training-material-on-intraday-trading-pdf/269497393",
        badge: "Intraday PDF",
      },
      {
        title: "Zerodha Varsity — Fundamental Analysis vs Technical Analysis",
        type: "Learning document",
        description: "A direct guide comparing fundamentals and technicals so you can choose the right learning path.",
        url: "https://zerodha.com/varsity/chapter/fundamental-analysis-vs-technical-analysis/",
        badge: "Core concepts",
      },
      {
        title: "Zerodha TA Workbook PDF",
        type: "PDF / Workbook",
        description: "A technical analysis workbook covering chart reading, patterns, support/resistance, and indicators.",
        url: "https://zerodha.com/z-connect/wp-content/uploads/2014/06/TA_wrkbk.pdf",
        badge: "Technical workbook",
      },
    ],
  },
  {
    title: "YouTube tutorials for stock trading, candles, indicators and investing",
    description: "Direct links to useful tutorials that explain charts, candlesticks, indicators, and beginner investing step by step.",
    resources: [
      {
        title: "Candlestick Pattern Tutorial",
        type: "YouTube video",
        description: "Direct link for candlestick pattern learning.",
        url: "https://www.youtube.com/watch?v=EVlQgmirnCg",
        badge: "Candlestick patterns",
      },
      {
        title: "YouTube — TradingView",
        type: "YouTube channel",
        description: "Useful educational videos on indicators, market analysis, and trading ideas.",
        url: "https://www.youtube.com/@TradingView",
        badge: "Indicator & analysis",
      },
    ],
  },
  {
    title: "Avoid bad actions and trading psychology",
    description: "Use these resources to control revenge trading, chasing losses, and overconfidence.",
    resources: [
      {
        title: "Markets.com — Paper Trading Stocks and Forex",
        type: "Article / learning guide",
        description: "A useful guide on how to paper trade properly and avoid emotional mistakes while practicing.",
        url: "https://www.markets.com/education-centre/paper-trading-stocks-and-forex",
        badge: "Paper trading habits",
      },
      {
        title: "Fidelity Learning Center — Risk Management Basics",
        type: "Doc / overview",
        description: "A practical overview to help you define risk, position size, and protect your capital.",
        url: "https://www.fidelity.com/learning-center/trading-investing/risk-management",
        badge: "Risk first",
      },
    ],
  },
];

function Learn() {
  return (
    <>
      <TopBar title="Learn" />
      <main className="flex-1 overflow-y-auto p-5 lg:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Learning Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">Trading tutorials, risk lessons, market psychology, and paper trading resources</p>
        </div>

        <section className="mt-8 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Paper Trading Learning Track</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A practical path for beginners who want to learn trading with virtual money, improve discipline, and build a repeatable process.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {PAPER_TRADING_MODULES.map((module) => (
              <article key={module.title} className="rounded-lg border border-border bg-background/40 p-4">
                <div className="flex items-center gap-2">
                  <Compass className="size-4 text-primary" />
                  <h3 className="font-semibold">{module.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{module.description}</p>
                <ul className="mt-3 space-y-2 text-sm text-foreground">
                  {module.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1 size-1.5 rounded-full bg-primary" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center gap-2">
            <PlayCircle className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Direct learning resources</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Easy-to-understand learning links for stock trading, intraday concepts, chart patterns, indicators, investing, and psychology.
          </p>

          <div className="mt-5 space-y-6">
            {LEARNING_RESOURCE_SECTIONS.map((section) => (
              <div key={section.title} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-4 text-primary" />
                  <h3 className="text-base font-semibold">{section.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.description}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {section.resources.map((resource) => (
                    <article key={resource.title} className="rounded-lg border border-border bg-background/40 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold">{resource.title}</h4>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">{resource.badge}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{resource.type}</p>
                      <p className="mt-3 text-sm leading-relaxed text-foreground">{resource.description}</p>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                      >
                        Open resource
                        <span aria-hidden="true">→</span>
                      </a>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
