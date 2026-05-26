import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { authApi } from "@/lib/api";
import { getCurrentUser, getToken, setStoredSession } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — TradePilot" }] }),
  component: Settings,
});

function Settings() {
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(() => getCurrentUser()?.name ?? "");
  const [email, setEmail] = useState(() => getCurrentUser()?.email ?? "");
  const [balance, setBalance] = useState(() => String(getCurrentUser()?.balance ?? 100000));
  const [defaultOrderType, setDefaultOrderType] = useState(() => getCurrentUser()?.defaultOrderType ?? "MARKET");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await authApi.getProfile();
        if (cancelled) return;

        setName(response.user.name);
        setEmail(response.user.email);
        setBalance(String(response.user.balance));
        setDefaultOrderType(response.user.defaultOrderType);
      } catch {
        // Keep local session values visible if profile refresh fails.
      }
    };

    if (getToken()) {
      loadProfile();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const saveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatus("");
    setSaving(true);

    try {
      const response = await authApi.updateProfile({
        name,
        email,
        balance: Number(balance),
        defaultOrderType,
      });
      const token = getToken();

      if (token) {
        setStoredSession({ token, user: response.user });
      }

      setStatus(response.message || "Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopBar title="Settings" />
      <main className="flex-1 overflow-y-auto p-5 lg:p-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences</p>

          <form onSubmit={saveSettings} className="mt-6 space-y-5">
            <Section title="Profile">
              <Field label="Display name">
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring" />
              </Field>
              <Field label="Email">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring" />
              </Field>
            </Section>

            <Section title="Trading">
              <Field label="Starting balance (₹)">
                <input value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm font-mono outline-none focus:border-ring" />
              </Field>
              <Field label="Default order type">
                <select value={defaultOrderType} onChange={(e) => setDefaultOrderType(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring">
                  <option value="MARKET">Market</option><option value="LIMIT">Limit</option>
                </select>
              </Field>
            </Section>

            <Section title="Appearance">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Theme</div>
                <div className="mt-2 inline-flex rounded-md border border-border p-0.5">
                  {(["light", "dark"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setTheme(t)} className={`px-4 py-1.5 text-sm font-medium capitalize rounded ${theme === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            {error ? <p className="text-sm text-bear">{error}</p> : null}
            {status ? <p className="text-sm text-bull">{status}</p> : null}
            <button disabled={saving} className="w-full rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span><div className="mt-1.5">{children}</div></label>;
}
