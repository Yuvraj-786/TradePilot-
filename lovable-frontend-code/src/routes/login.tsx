import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { authApi } from "@/lib/api";
import { setStoredSession } from "@/lib/auth";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — TradePilot" }, { name: "description", content: "Sign in to your TradePilot paper trading account." }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authApi.login({ email, password });

      if (!response.success || !response.token || !response.user) {
        throw new Error(response.message || "Unable to sign in right now.");
      }

      setStoredSession({ token: response.token, user: response.user });
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueWithDemo = async () => {
    setError("");
    setIsDemoSubmitting(true);

    try {
      const response = await authApi.demo();

      if (!response.success || !response.token || !response.user) {
        throw new Error(response.message || "Unable to load demo account right now.");
      }

      setStoredSession({ token: response.token, user: response.user });
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load demo account right now.");
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center"><Logo /></Link>
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your TradePilot account</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            {error ? <p className="text-sm text-bear">{error}</p> : null}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" className="rounded border-border" /> Remember me</label>
              <a href="#" className="font-medium text-primary hover:underline">Forgot password?</a>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> Or <div className="h-px flex-1 bg-border" />
          </div>
          <button
            onClick={continueWithDemo}
            disabled={isDemoSubmitting}
            className="w-full rounded-md border border-border bg-background py-2.5 text-sm font-semibold hover:bg-accent"
          >
            {isDemoSubmitting ? "Loading demo..." : "Continue with demo account"}
          </button>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            No real money involved. Practice safely.
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account? <Link to="/signup" className="font-semibold text-primary hover:underline">Sign up</Link>
        </p>
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
