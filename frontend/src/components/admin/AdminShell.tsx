// Shared admin layout: persistent sidebar (collapsible drawer on mobile),
// topbar with page title + user dropdown. Each admin route renders its
// content inside <AdminShell>. Auth handling lives here so individual
// pages don't reimplement it.

import {
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  FileText,
  Newspaper,
  Settings,
  Menu,
  X,
  LogOut,
  KeyRound,
  ExternalLink,
  ChevronDown,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminLogout,
  changeAdminPassword,
  getAdminSession,
} from "@/lib/api";
import { emitAdminSessionReady } from "@/lib/admin-session-events";
import { AdminLoginCard } from "@/components/admin/AdminLoginCard";
import {
  CommandPalette,
  useGoToShortcuts,
} from "@/components/admin/CommandPalette";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import techuLogo from "@/assets/techu-logo.png";

const TEXTS = {
  loading: "Loading…",
  accessPending: "Access pending",
  yourAccount: "Your account (",
  noAdminAccess: ") is signed in but doesn't have admin access yet. Ask the site owner to grant you the admin role.",
  signOut: "Sign out",
  techUAdmin: "TechU Admin",
  publicSite: "Public site",
  administrator: "Administrator",
  signedInAs: "Signed in as",
  searchJumpTo: "Search or jump to…",
  changePassword: "Change password",
  changePasswordDesc: "Use a password of at least 8 characters.",
  cancel: "Cancel",
};

type NavItem = {
  to: string;
  label: string;
  Icon: typeof LayoutDashboard;
  match: (pathname: string) => boolean;
};

type NavGroup = {
  heading: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Workspace",
    items: [
      {
        to: "/admin",
        label: "Dashboard",
        Icon: LayoutDashboard,
        match: (p) => p === "/admin" || p === "/admin/",
      },
      {
        to: "/admin/leads",
        label: "Leads",
        Icon: Users,
        match: (p) => p.startsWith("/admin/leads"),
      },
      {
        to: "/admin/isa-leads",
        label: "ISA Enquiry",
        Icon: Users,
        match: (p) => p.startsWith("/admin/isa-leads"),
      },
    ],
  },
  {
    heading: "Manage",
    items: [
      {
        to: "/admin/content",
        label: "Site Content",
        Icon: FileText,
        match: (p) => p.startsWith("/admin/content"),
      },
      {
        to: "/admin/blogs",
        label: "Blog",
        Icon: Newspaper,
        match: (p) => p.startsWith("/admin/blogs"),
      },
      {
        to: "/admin/settings",
        label: "Settings",
        Icon: Settings,
        match: (p) => p.startsWith("/admin/settings"),
      },
    ],
  },
];

type Props = {
  /** Page title shown in the topbar. */
  title: string;
  /** Optional secondary text under the title. */
  subtitle?: string;
  /** Optional right-aligned action(s) in the topbar (e.g. Save button). */
  actions?: ReactNode;
  /** Page body. */
  children: ReactNode;
};

type AuthState =
  | { status: "checking" }
  | { status: "unauthenticated" }
  | {
      status: "authenticated";
      email: string | null;
      isAdmin: boolean;
    };

export function AdminShell({ title, subtitle, actions, children }: Props) {
  const [auth, setAuth] = useState<AuthState>({ status: "checking" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useGoToShortcuts();

  const readSessionWithRetry = useCallback(
    async (attempts: number, delayMs: number) => {
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
          const session = await getAdminSession();
          if (session.authenticated) return session;
        } catch {
          // Keep retrying for transient network/session propagation issues.
        }
        if (attempt < attempts - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, delayMs));
        }
      }
      return { authenticated: false } as const;
    },
    [],
  );

  const initSession = useCallback(
    async () => {
      setAuth({ status: "checking" });
      const session = await readSessionWithRetry(4, 180);
      if (!session.authenticated) {
        setAuth({ status: "unauthenticated" });
        toast.error(
          "Could not create a persistent admin session. Check cookie/security settings and try again.",
        );
        return;
      }
      setAuth({
        status: "authenticated",
        email: session.email,
        isAdmin: session.isAdmin,
      });
      emitAdminSessionReady();
    },
    [readSessionWithRetry],
  );

  useEffect(() => {
    void (async () => {
      try {
        const session = await readSessionWithRetry(2, 120);
        if (!session.authenticated) {
          setAuth({ status: "unauthenticated" });
          return;
        }
        setAuth({
          status: "authenticated",
          email: session.email,
          isAdmin: session.isAdmin,
        });
        emitAdminSessionReady();
      } catch {
        setAuth({ status: "unauthenticated" });
      }
    })();
  }, [readSessionWithRetry]);

  const handleSignOut = async () => {
    await adminLogout();
    setAuth({ status: "unauthenticated" });
  };

  if (auth.status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">{TEXTS.loading}</p>
      </main>
    );
  }

  if (auth.status === "unauthenticated") {
    return <AdminLoginCard onAuthenticated={initSession} />;
  }

  if (!auth.isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            {TEXTS.accessPending}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {TEXTS.yourAccount}{auth.email}{TEXTS.noAdminAccess}
          </p>
          <button
            onClick={handleSignOut}
            className="mt-4 rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted"
          >
            {TEXTS.signOut}
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.98_0_0)] dark:bg-[oklch(0.16_0.01_260)]">
      <Sidebar
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        email={auth.email}
        onSignOut={handleSignOut}
        onChangePassword={() => setPwOpen(true)}
      />

      <div className="pt-16 md:pl-64 sm:pt-[74px]">
        <TopBar
          title={title}
          subtitle={subtitle}
          actions={actions}
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        <main
          key={title}
          className="animate-page-in mx-auto max-w-page px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >
          {children}
        </main>
      </div>

      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onChangePassword={() => setPwOpen(true)}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sidebar
// ────────────────────────────────────────────────────────────────────────────

function Sidebar({
  open,
  onClose,
  email,
  onSignOut,
  onChangePassword,
}: {
  open: boolean;
  onClose: () => void;
  email: string | null;
  onSignOut: () => void;
  onChangePassword: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const content = (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border">
          <img
            src={techuLogo}
            alt="TechU"
            className="h-6 w-auto object-contain"
          />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold tracking-tight text-foreground">
            {TEXTS.techUAdmin}
          </div>
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Control center
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading} className="mb-4">
            <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
              {group.heading}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, Icon, match }) => {
                const active = match(pathname);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={[
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                      active
                        ? "bg-brand-purple/10 font-semibold text-brand-purple"
                        : "text-foreground/75 hover:bg-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute -left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-purple"
                      />
                    )}
                    <Icon
                      className={[
                        "h-4 w-4 transition-transform",
                        active
                          ? "text-brand-purple"
                          : "text-muted-foreground group-hover:text-foreground group-hover:scale-110",
                      ].join(" ")}
                    />
                    <span className="flex-1">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-2 border-t border-border pt-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/75 transition hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
            <span className="flex-1">{TEXTS.publicSite}</span>
            <span className="text-[10px] text-muted-foreground/60">↗</span>
          </a>
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-xl border border-transparent p-2 text-left transition hover:border-border hover:bg-muted/60">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white shadow-sm">
                {(email ?? "A").slice(0, 1).toUpperCase()}
                <span
                  aria-hidden
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-foreground">
                  {email ?? "Admin"}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {TEXTS.administrator}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="truncate text-xs">
              {TEXTS.signedInAs}
              <div className="truncate font-medium text-foreground">
                {email ?? "—"}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onChangePassword}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change password
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border md:block">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card transition-transform md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex justify-end p-2 md:hidden">
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1.5 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {content}
      </aside>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TopBar
// ────────────────────────────────────────────────────────────────────────────

function TopBar({
  title,
  subtitle,
  actions,
  onOpenDrawer,
  onOpenPalette,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onOpenDrawer: () => void;
  onOpenPalette: () => void;
}) {
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/i.test(navigator.platform);

  return (
    <header className="fixed left-0 right-0 top-0 z-30 border-b border-border bg-card/85 backdrop-blur supports-[backdrop-filter]:bg-card/70 md:left-64">
      <div className="mx-auto flex max-w-page items-center gap-3 px-4 py-3 sm:px-6 sm:py-3.5 lg:px-8">
        <button
          onClick={onOpenDrawer}
          aria-label="Open menu"
          className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold tracking-tight text-foreground sm:text-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
              {subtitle}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenPalette}
          className="group hidden min-w-[220px] items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground transition hover:border-brand-purple/50 hover:bg-background hover:text-foreground sm:inline-flex"
          title="Open command palette"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            <span>{TEXTS.searchJumpTo}</span>
          </span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/80">
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </button>
        <button
          type="button"
          onClick={onOpenPalette}
          className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground sm:hidden"
          aria-label="Open command palette"
        >
          <Search className="h-5 w-5" />
        </button>

        {actions && (
          <>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          </>
        )}
      </div>
    </header>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Change password dialog
// ────────────────────────────────────────────────────────────────────────────

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setForm({ currentPassword: "", newPassword: "", confirm: "" });
    setError(null);
  };

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
      onOpenChange(false);
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{TEXTS.changePassword}</DialogTitle>
          <DialogDescription>
            {TEXTS.changePasswordDesc}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="mt-2 space-y-3">
          <Field
            label="Current password"
            type="password"
            value={form.currentPassword}
            autoComplete="current-password"
            onChange={(v) => setForm((f) => ({ ...f, currentPassword: v }))}
          />
          <Field
            label="New password"
            type="password"
            value={form.newPassword}
            autoComplete="new-password"
            onChange={(v) => setForm((f) => ({ ...f, newPassword: v }))}
          />
          <Field
            label="Confirm new password"
            type="password"
            value={form.confirm}
            autoComplete="new-password"
            onChange={(v) => setForm((f) => ({ ...f, confirm: v }))}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              {TEXTS.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand-orange px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Update password"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );
}
