import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { authApi } from "@/lib/api";
import { setStoredSession } from "@/lib/auth";
import { useState } from "react";
import { Check } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — TradePilot" }, { name: "description", content: "Create your free TradePilot paper trading account." }] }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Name, email, and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authApi.register(form);

      if (!response.success || !response.token || !response.user) {
        throw new Error(response.message || "Unable to create your account right now.");
      }

      setStoredSession({ token: response.token, user: response.user });
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-border bg-card p-12 lg:flex">
        <Link to="/"><Logo /></Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Start with ₹1,00,000 virtual capital.</h2>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            {[
              "Real-time NSE, BSE & US market prices",
              "AI-powered feedback on every trade",
              "Personalized risk score & behavioral insights",
              "Strategy backtesting on historical data",
              "100% free, forever",
            ].map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span className="grid size-5 place-items-center rounded-full bg-bull/15 text-bull"><Check className="size-3" /></span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 TradePilot. No real money involved.</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex lg:hidden"><Logo /></Link>
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Free to start. No credit card required.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Full name" type="text" value={form.name} onChange={set("name")} placeholder="Jane Doe" />
            <Field label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
            <Field label="Password" type="password" value={form.password} onChange={set("password")} placeholder="At least 8 characters" />
            {error ? <p className="text-sm text-bear">{error}</p> : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder }: { label: string; type: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
      />
    </label>
  );
}
