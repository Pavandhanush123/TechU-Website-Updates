import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { adminLogin, ensureAdminUser } from "@/lib/api";
import techuLogo from "@/assets/techu-logo.png";

type Props = {
  onAuthenticated: () => void;
};

export function AdminLoginCard({ onAuthenticated }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void ensureAdminUser().catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await adminLogin(username, password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (!res.isAdmin) {
        setError("Your account does not have admin access.");
        return;
      }
      toast.success("Verifying your admin session…");
      onAuthenticated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[oklch(0.97_0_0)] px-4 py-12 dark:bg-[oklch(0.16_0.01_260)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-brand-purple/25 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-brand-orange/20 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative w-full max-w-md animate-page-in">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          ← Back to public site
        </Link>

        <div className="overflow-hidden rounded-3xl border border-border bg-card/85 shadow-2xl shadow-black/5 backdrop-blur-md ring-1 ring-black/5">
          <div className="relative bg-brand-gradient px-8 pb-10 pt-7 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-brand-grid opacity-30"
            />
            <div className="relative flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 shadow-sm">
                <img
                  src={techuLogo}
                  alt="TechU"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/80">
                  Control center
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Welcome back
                </h1>
              </div>
            </div>
            <p className="relative mt-3 text-sm text-white/85">
              Sign in to manage leads, content, and settings.
            </p>
          </div>

          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Username or email
              </label>
              <input
                type="text"
                required
                value={username}
                autoFocus
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground transition focus:border-brand-purple focus:outline-none focus:ring-1 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm text-foreground transition focus:border-brand-purple focus:outline-none focus:ring-1 focus:ring-brand-purple"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-muted-foreground transition hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

            <div className="mt-5 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              Admin actions are protected by an authenticated session cookie.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
