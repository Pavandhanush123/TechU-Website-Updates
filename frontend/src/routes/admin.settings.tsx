import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  KeyRound,
  LogOut,
  Server,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import {
  adminLogout,
  changeAdminPassword,
  getAdminSession,
} from "@/lib/api";
import { ADMIN_SESSION_READY_EVENT } from "@/lib/admin-session-events";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsRoute,
});

type Health = {
  ok: boolean;
  startedAt: string;
  nodeEnv: string;
};

function SettingsRoute() {
  const [email, setEmail] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const refresh = async () => {
    const session = await getAdminSession();
    if (!session.authenticated) return;
    setEmail(session.email);

    try {
      const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(`${base}/api/health`, {
        credentials: "include",
      });
      if (!res.ok) {
        setHealthError(`Health check returned ${res.status}`);
        return;
      }
      const data = (await res.json()) as Health;
      setHealth(data);
      setHealthError(null);
    } catch (err) {
      setHealthError((err as Error).message);
    }
  };

  useEffect(() => {
    const load = () => {
      void refresh();
    };
    load();
    window.addEventListener(ADMIN_SESSION_READY_EVENT, load);
    return () => {
      window.removeEventListener(ADMIN_SESSION_READY_EVENT, load);
    };
  }, []);

  return (
    <AdminShell
      title="Settings"
      subtitle="Account, security, and system info."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          icon={UserIcon}
          title="Account"
          description="The signed-in admin user."
        >
          <Row label="Email" value={email ?? "—"} />
          <Row label="Role" value="Administrator" />
        </Card>

        <Card
          icon={KeyRound}
          title="Security"
          description="Update your password regularly."
        >
          <ChangePasswordForm />
        </Card>

        <Card
          icon={Server}
          title="System"
          description="Backend status."
        >
          {health ? (
            <>
              <Row
                label="Status"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${health.ok ? "bg-emerald-500" : "bg-red-500"}`}
                    />
                    {health.ok ? "Operational" : "Degraded"}
                  </span>
                }
              />
              <Row label="Environment" value={health.nodeEnv} />
              <Row
                label="Started"
                value={new Date(health.startedAt).toLocaleString()}
              />
            </>
          ) : healthError ? (
            <p className="text-xs text-red-600">{healthError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Checking…</p>
          )}
        </Card>
      </div>

      <Card
        className="mt-4"
        icon={ShieldCheck}
        title="Session"
        description="Sign out from this browser."
      >
        <button
          onClick={async () => {
            await adminLogout();
            window.location.href = "/admin";
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          Sign out everywhere
        </button>
      </Card>
    </AdminShell>
  );
}

function Card({
  icon: Icon,
  title,
  description,
  children,
  className = "",
}: {
  icon: typeof UserIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 ${className}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-purple" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function ChangePasswordForm() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirm) {
      setError("New passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await changeAdminPassword(
        form.currentPassword,
        form.newPassword,
      );
      if (!res.ok) {
        setError(res.error || "Could not change password");
        return;
      }
      toast.success("Password updated");
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <PasswordField
        label="Current"
        autoComplete="current-password"
        value={form.currentPassword}
        onChange={(v) => setForm((f) => ({ ...f, currentPassword: v }))}
      />
      <PasswordField
        label="New"
        autoComplete="new-password"
        value={form.newPassword}
        onChange={(v) => setForm((f) => ({ ...f, newPassword: v }))}
      />
      <PasswordField
        label="Confirm"
        autoComplete="new-password"
        value={form.confirm}
        onChange={(v) => setForm((f) => ({ ...f, confirm: v }))}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-orange px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
      >
        {submitting ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      <input
        type="password"
        required
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-purple focus:outline-none"
      />
    </div>
  );
}
