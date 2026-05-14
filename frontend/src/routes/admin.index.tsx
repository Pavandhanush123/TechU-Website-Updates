import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  FileText,
  Inbox,
  Minus,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getAdminSession,
  getLeadStats,
  listLeads,
  type Lead,
  type LeadStats,
} from "@/lib/api";
import { ADMIN_SESSION_READY_EVENT } from "@/lib/admin-session-events";
import { AdminShell } from "@/components/admin/AdminShell";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/")({
  component: DashboardRoute,
});

const QUICK_LINKS: { label: string; sublabel: string; to: string }[] = [
  {
    label: "Edit Hero",
    sublabel: "Homepage carousel slides",
    to: "/admin/content",
  },
  {
    label: "Edit Mentors",
    sublabel: "Mentor cards",
    to: "/admin/content",
  },
  {
    label: "Edit Testimonials",
    sublabel: "Student stories",
    to: "/admin/content",
  },
  {
    label: "Edit Contact",
    sublabel: "Email, phone, socials",
    to: "/admin/content",
  },
  {
    label: "Edit Footer",
    sublabel: "Links, copyright",
    to: "/admin/content",
  },
  {
    label: "Edit SEO",
    sublabel: "Meta tags, OG image",
    to: "/admin/content",
  },
];

function DashboardRoute() {
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [leads, setLeads] = useState<Lead[] | null>(null);

  const refresh = async () => {
    const session = await getAdminSession();
    if (!session.authenticated) return;
    const [statsRes, leadsRes] = await Promise.all([
      getLeadStats(),
      listLeads(),
    ]);
    if (statsRes.ok) {
      const { ok: _ok, ...rest } = statsRes;
      setStats(rest);
    }
    if (leadsRes.ok) setLeads(leadsRes.leads);
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

  // 30-day daily trend, computed client-side from the leads list.
  const trend = useMemo(() => {
    const now = new Date();
    const days: { day: string; leads: number; label: string }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      days.push({
        day: key,
        leads: 0,
        label: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      });
    }
    if (leads) {
      const map = new Map(days.map((d) => [d.day, d]));
      for (const l of leads) {
        const k = new Date(l.created_at).toISOString().slice(0, 10);
        const entry = map.get(k);
        if (entry) entry.leads += 1;
      }
    }
    return days;
  }, [leads]);

  const conversionRate = useMemo(() => {
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.converted / stats.total) * 100);
  }, [stats]);

  // Compare last 7 days vs previous 7 days for the trend pill on KPIs.
  const last7Delta = useMemo(() => {
    if (!leads) return null;
    const now = Date.now();
    const sevenAgo = now - 7 * 24 * 60 * 60 * 1000;
    const fourteenAgo = now - 14 * 24 * 60 * 60 * 1000;
    let last7 = 0;
    let prev7 = 0;
    for (const l of leads) {
      const t = new Date(l.created_at).getTime();
      if (t >= sevenAgo) last7 += 1;
      else if (t >= fourteenAgo) prev7 += 1;
    }
    if (prev7 === 0) return last7 > 0 ? 100 : 0;
    return Math.round(((last7 - prev7) / prev7) * 100);
  }, [leads]);

  const sparkline = useMemo(() => trend.slice(-14), [trend]);

  const sourceBreakdown = useMemo(() => {
    if (!stats) return [];
    return stats.bySource.map((s) => ({
      ...s,
      pct: stats.total === 0 ? 0 : Math.round((s.c / stats.total) * 100),
    }));
  }, [stats]);

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Overview of leads, content, and site activity."
    >
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Total leads"
          value={stats?.total}
          accent="purple"
          spark={sparkline}
        />
        <KpiCard
          icon={Inbox}
          label="New"
          hint="awaiting first contact"
          value={stats?.newCount}
          accent="amber"
        />
        <KpiCard
          icon={TrendingUp}
          label="Last 7 days"
          value={stats?.last7}
          accent="sky"
          delta={last7Delta}
          deltaSuffix="vs prev 7d"
          spark={sparkline}
        />
        <KpiCard
          icon={Zap}
          label="Conversion rate"
          value={stats ? `${conversionRate}%` : undefined}
          accent="emerald"
          hint={stats ? `${stats.converted} converted` : undefined}
        />
      </div>

      {/* Trend chart + source breakdown */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Leads over time
            </h2>
            <span className="text-xs text-muted-foreground">Last 30 days</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Daily new lead submissions across all sources.
          </p>
          <div className="mt-4 h-56 w-full">
            {leads === null ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trend}
                  margin={{ top: 6, right: 6, left: -8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="oklch(0.55 0.18 305)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor="oklch(0.55 0.18 305)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10 }}
                    stroke="currentColor"
                    className="text-muted-foreground"
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="oklch(0.55 0.18 305)"
                    strokeWidth={2}
                    fill="url(#leadsFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-foreground">By source</h2>
          <p className="text-xs text-muted-foreground">
            Where your leads come from.
          </p>
          <div className="mt-4 space-y-3">
            {!stats ? (
              <>
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
              </>
            ) : sourceBreakdown.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No leads yet.
              </p>
            ) : (
              sourceBreakdown.map((s) => (
                <div key={s.source}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-medium capitalize text-foreground">
                      {s.source}
                    </span>
                    <span className="text-muted-foreground">
                      {s.c}{" "}
                      <span className="text-[10px]">({s.pct}%)</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand-purple"
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent leads + quick actions */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Recent leads
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Latest 6 submissions
              </p>
            </div>
            <Link
              to="/admin/leads"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-purple hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {leads === null ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-48" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))
            ) : leads.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Inbox className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No leads yet. Submissions from the public site will show up here.
                </p>
              </div>
            ) : (
              leads.slice(0, 6).map((l) => (
                <Link
                  key={l.id}
                  to="/admin/leads"
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50 sm:px-5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                    {l.full_name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {l.full_name}
                      </span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                        {l.source}
                      </span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {l.course} · {new Date(l.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                      l.status === "new"
                        ? "bg-amber-100 text-amber-800"
                        : l.status === "contacted"
                          ? "bg-sky-100 text-sky-800"
                          : l.status === "converted"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-zinc-200 text-zinc-700",
                    ].join(" ")}
                  >
                    {l.status}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-purple" />
              <h2 className="text-sm font-semibold text-foreground">
                Quick edits
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Jump straight into editing your most-changed sections.
            </p>
            <div className="mt-3 grid gap-2">
              {QUICK_LINKS.map((q) => (
                <Link
                  key={q.label}
                  to={q.to}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition hover:border-brand-purple hover:bg-brand-purple/5"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground">
                      {q.label}
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {q.sublabel}
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-purple" />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Public site
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Open the live site to verify your changes.
            </p>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open public site
            </a>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

type Accent = "purple" | "amber" | "sky" | "emerald";

const ACCENTS: Record<
  Accent,
  { icon: string; gradient: string; spark: string }
> = {
  purple: {
    icon: "bg-brand-purple/10 text-brand-purple",
    gradient: "from-brand-purple/15 via-transparent to-transparent",
    spark: "oklch(0.55 0.18 305)",
  },
  amber: {
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    gradient:
      "from-amber-200/40 dark:from-amber-500/15 via-transparent to-transparent",
    spark: "oklch(0.78 0.16 75)",
  },
  sky: {
    icon: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    gradient:
      "from-sky-200/40 dark:from-sky-500/15 via-transparent to-transparent",
    spark: "oklch(0.65 0.16 230)",
  },
  emerald: {
    icon:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    gradient:
      "from-emerald-200/40 dark:from-emerald-500/15 via-transparent to-transparent",
    spark: "oklch(0.7 0.18 160)",
  },
};

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "purple",
  delta,
  deltaSuffix,
  spark,
}: {
  icon: typeof Users;
  label: string;
  value: number | string | undefined;
  hint?: string;
  accent?: Accent;
  delta?: number | null;
  deltaSuffix?: string;
  spark?: { day: string; leads: number }[];
}) {
  const a = ACCENTS[accent];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${a.gradient} opacity-60`}
      />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {value === undefined ? (
                <span className="skeleton-shimmer block h-8 w-20 rounded" />
              ) : (
                value
              )}
            </div>
            {hint && (
              <div className="mt-1 text-[11px] text-muted-foreground">
                {hint}
              </div>
            )}
            {delta !== undefined && delta !== null && (
              <DeltaPill value={delta} suffix={deltaSuffix} />
            )}
          </div>
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/5 ${a.icon}`}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>

        {spark && spark.length > 0 && (
          <div className="mt-3 -mb-1 -mx-1 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spark}>
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke={a.spark}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function DeltaPill({ value, suffix }: { value: number; suffix?: string }) {
  const positive = value > 0;
  const negative = value < 0;
  const tone = positive
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
    : negative
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
      : "bg-muted text-muted-foreground";
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;
  return (
    <div className="mt-2 inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tone}`}
      >
        <Icon className="h-3 w-3" />
        {Math.abs(value)}%
      </span>
      {suffix && (
        <span className="text-[10px] text-muted-foreground">{suffix}</span>
      )}
    </div>
  );
}
