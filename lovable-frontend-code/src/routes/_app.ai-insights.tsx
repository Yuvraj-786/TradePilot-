import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { aiApi, type AiInsightData } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { AI_INSIGHTS, BEHAVIOR } from "@/lib/mock";
import { Sparkles, Send, TriangleAlert, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/_app/ai-insights")({
  head: () => ({ meta: [{ title: "AI Insights — TradePilot" }] }),
  component: AIInsights,
});

type ChatMessage = {
  id: number;
  sender: "assistant" | "user";
  text: string;
};

function buildMentorResponse(input: string, data: AiInsightData | null) {
  const normalized = input.toLowerCase().trim();
  const risk = data?.risk;
  const behavior = data?.behavior;

  if (!normalized) {
    return "Ask me about your risk level, behavior patterns, or a trading plan and I’ll tailor the feedback to your current portfolio.";
  }

  if (/risk|portfolio|exposure|stop|loss|cash|score/.test(normalized)) {
    const score = risk?.riskScore ?? 40;
    const level = risk?.riskLevel ?? "Medium";
    const summary = risk?.summary ?? "Your current portfolio is in a balanced range for a paper-trading setup.";
    const recommendation = risk?.recommendation ?? "Keep position sizes disciplined and maintain a cash buffer.";

    return `${summary} Current risk level: ${level} (${score}/100). ${recommendation}`;
  }

  if (/overtrade|discipline|behavior|panic|revenge|emotion|habit/.test(normalized)) {
    const flags = behavior?.flags ?? [];
    const summary = behavior?.summary ?? "Your current behavior pattern appears disciplined.";
    if (flags.length > 0) {
      return `${summary} Before opening another trade, review the last 3 positions and make sure your trade plan and stop-loss are still valid.`;
    }

    return `${summary} Keep a simple checklist: thesis, entry, stop-loss, and exit. That helps prevent emotion-driven decisions.`;
  }

  if (/strategy|plan|paper trade|trade|entry|exit|setup|position/.test(normalized)) {
    const recommendation = risk?.recommendation ?? "Stay consistent with position sizing and review your trade journal after every session.";
    return `For paper trading, start with a clear plan: define your thesis, place a stop-loss, size the position to 1–2% of your virtual capital, and review the outcome after the trade. ${recommendation}`;
  }

  return `I can help with risk, behavior, and trading plans. Try questions like “What is my current risk score?” or “How can I improve my discipline?”`;
}

function AIInsights() {
  const [msg, setMsg] = useState("");
  const [data, setData] = useState<AiInsightData | null>(null);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "assistant",
      text: "Hello! I’m your TradePilot AI mentor. Ask me about your current risk level, behavior patterns, or how to improve your paper-trading plan.",
    },
  ]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);

  useEffect(() => {
    const authenticated = isAuthenticated();
    setIsAuthenticatedUser(authenticated);
    setIsAuthReady(true);
  }, []);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticatedUser) {
      return;
    }

    let cancelled = false;

    const loadInsights = async () => {
      try {
        const response = await aiApi.getInsights();
        if (cancelled) return;

        setData(response.data ?? null);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load AI insights.");
        }
      }
    };

    loadInsights();

    return () => {
      cancelled = true;
    };
  }, []);

  const insights = useMemo(() => {
    if (!data) return AI_INSIGHTS;

    return [
      {
        tone: data.behavior.flags.length > 0 ? ("warning" as const) : ("bull" as const),
        title: data.behavior.flags.length > 0 ? data.behavior.flags.join(", ") : "Disciplined Pattern",
        body: data.behavior.summary,
      },
      {
        tone: data.risk.riskLevel === "High" ? ("warning" as const) : data.risk.riskLevel === "Low" ? ("bull" as const) : ("info" as const),
        title: `${data.risk.riskLevel} Risk`,
        body: data.risk.summary,
      },
      {
        tone: "info" as const,
        title: "Recommendation",
        body: data.risk.recommendation,
      },
    ];
  }, [data]);

  const behavior = useMemo(() => {
    if (!data) return BEHAVIOR;

    return [
      { label: "Risk Discipline", value: Math.max(0, 100 - data.risk.riskScore), tone: data.risk.riskScore > 65 ? ("warning" as const) : ("bull" as const) },
      { label: "Behavior Score", value: Math.max(0, 100 - data.behavior.riskScore), tone: data.behavior.riskScore > 65 ? ("warning" as const) : ("bull" as const) },
      { label: "Portfolio Risk", value: data.risk.riskScore, tone: data.risk.riskScore > 65 ? ("bear" as const) : ("warning" as const) },
    ];
  }, [data]);

  if (!isAuthReady) {
    return (
      <>
        <TopBar title="AI Insights" />
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6 text-sm text-muted-foreground">
          Loading your AI insights...
        </main>
      </>
    );
  }

  if (!isAuthenticatedUser) {
    return (
      <>
        <TopBar title="AI Insights" />
        <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-2xl font-bold">Sign in to view AI insights</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Your AI mentor and portfolio guidance are available after you sign in.
          </p>
          <a href="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Go to sign in
          </a>
        </main>
      </>
    );
  }

  const sendMessage = (prompt?: string) => {
    const normalized = (prompt ?? msg).trim();
    if (!normalized) {
      return;
    }

    setMessages((current) => [
      ...current,
      { id: current.length + 1, sender: "user", text: normalized },
      {
        id: current.length + 2,
        sender: "assistant",
        text: buildMentorResponse(normalized, data),
      },
    ]);

    setMsg("");
  };

  return (
    <>
      <TopBar title="AI Insights" />
      <main className="flex-1 overflow-y-auto p-5 lg:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">Behavioral analysis, risk feedback, and your AI learning assistant</p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <section className="space-y-5 lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">Trade Feedback</h2>
              </div>
              <div className="mt-4 space-y-3">
                {error ? <p className="text-sm text-warning">{error}</p> : null}
                {insights.map((i, idx) => {
                  const Icon = i.tone === "warning" ? TriangleAlert : i.tone === "bull" ? TrendingUp : Sparkles;
                  const cls = i.tone === "warning" ? "border-warning/30 bg-warning/5" : i.tone === "bull" ? "border-bull/30 bg-bull/5" : "border-primary/30 bg-primary/5";
                  const tcls = i.tone === "warning" ? "text-warning" : i.tone === "bull" ? "text-bull" : "text-primary";
                  return (
                    <div key={idx} className={`rounded-lg border p-4 ${cls}`}>
                      <div className="flex items-center gap-2">
                        <Icon className={`size-4 ${tcls}`} />
                        <span className={`text-xs font-semibold uppercase tracking-wider ${tcls}`}>{i.title}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed">{i.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Behavioral Patterns</h2>
              <div className="mt-4 space-y-4">
                {behavior.map((b) => {
                  const cls = b.tone === "bull" ? "bg-bull" : b.tone === "warning" ? "bg-warning" : "bg-bear";
                  return (
                    <div key={b.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{b.label}</span>
                        <span className="font-mono font-semibold">{b.value}/100</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full ${cls}`} style={{ width: `${b.value}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Risk Overview</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Card k="Diversification" v={data ? data.risk.riskLevel : "Low"} tone={data?.risk.riskLevel === "Low" ? "bull" : data?.risk.riskLevel === "High" ? "bear" : "warning"} />
                <Card k="Stop-loss Usage" v={data ? "Review" : "None"} tone={data ? "warning" : "bear"} />
                <Card k="Volatility Exposure" v={data?.risk.riskLevel ?? "High"} tone={data?.risk.riskLevel === "Low" ? "bull" : "warning"} />
                <Card k="Consistency" v={data?.behavior.flags.length ? "Review" : "Good"} tone={data?.behavior.flags.length ? "warning" : "bull"} />
              </div>
            </div>
          </section>

          <aside className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">AI Mentor</h2>
              <span className="ml-auto size-1.5 animate-pulse rounded-full bg-bull" />
            </div>

            <div className="mt-4 flex h-80 flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-background/50 p-3">
              {messages.map((message) => (
                <div key={message.id} className={`max-w-[85%] rounded-lg p-3 text-sm ${message.sender === "assistant" ? "bg-card" : "ml-auto bg-primary text-primary-foreground"}`}>
                  {message.text}
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Ask about your trades, risk, strategies…"
                className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <button className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground hover:opacity-90">
                <Send className="size-4" />
              </button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: "My risk score", prompt: "What is my current risk score?" },
                { label: "TSLA advice", prompt: "How should I think about TSLA risk right now?" },
                { label: "Strategy tips", prompt: "Give me a simple paper-trading checklist." },
              ].map((q) => (
                <button
                  key={q.label}
                  onClick={() => sendMessage(q.prompt)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function Card({ k, v, tone }: { k: string; v: string; tone: "bull" | "bear" | "warning" }) {
  const cls = tone === "bull" ? "text-bull border-bull/30 bg-bull/5" : tone === "bear" ? "text-bear border-bear/30 bg-bear/5" : "text-warning border-warning/30 bg-warning/5";
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{k}</div>
      <div className="mt-1 text-lg font-bold">{v}</div>
    </div>
  );
}
