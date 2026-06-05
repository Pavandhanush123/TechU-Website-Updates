import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import {
  bulkDeleteLeads,
  bulkUpdateStatus,
  deleteLead,
  getAdminSession,
  getLeadStats,
  listLeads,
  updateLeadNotes,
  updateLeadStatus,
  type Lead,
  type LeadStats,
  type LeadStatus,
} from "@/lib/api";
import { ADMIN_SESSION_READY_EVENT } from "@/lib/admin-session-events";
import { AdminShell } from "@/components/admin/AdminShell";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SourceFilter = "all" | "application" | "brochure" | "demo" | "isa_program_enquiry";
type StatusFilter = "all" | LeadStatus;
const ISA_PROGRAM_PREFIX = "ISA Program Enquiry — ";

function isIsaProgramEnquiryLead(lead: Lead) {
  return lead.course.startsWith(ISA_PROGRAM_PREFIX);
}

function sourceKeyForLead(lead: Lead): SourceFilter | "demo" {
  if (isIsaProgramEnquiryLead(lead)) return "isa_program_enquiry";
  return lead.source;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  converted: "Converted",
  archived: "Archived",
};

const STATUS_BADGE: Record<LeadStatus, string> = {
  new: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  contacted: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  converted:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  archived: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const COURSE_DETAIL_SPLIT = /\s+[—-]\s+/;

function parseLeadCourseMeta(rawCourse: string) {
  const cleanedRaw = rawCourse.startsWith(ISA_PROGRAM_PREFIX)
    ? rawCourse.slice(ISA_PROGRAM_PREFIX.length)
    : rawCourse;
  const [courseWithMode, detailRaw] = cleanedRaw.split(COURSE_DETAIL_SPLIT, 2);
  const modeMatch = courseWithMode.match(/\(([^)]+)\)\s*$/);
  const mode = modeMatch?.[1]?.trim() || null;
  const title = modeMatch
    ? courseWithMode.replace(/\s*\([^)]+\)\s*$/, "").trim()
    : courseWithMode.trim();
  const detail = detailRaw?.trim() || null;
  return { title, mode, detail };
}

function formatLeadDate(value: Date) {
  return value.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRangeLabel(range: DateRange | undefined) {
  if (!range?.from) return "Any date";
  if (!range.to) return formatLeadDate(range.from);
  const start = range.from <= range.to ? range.from : range.to;
  const end = range.from <= range.to ? range.to : range.from;
  return `${formatLeadDate(start)} - ${formatLeadDate(end)}`;
}

/** Single-line text for Excel-safe cells (multiline notes/course can break parsing in some locales). */
function flattenCsvText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, " ")
    .trim();
}

function escapeCsvCell(value: unknown) {
  const s = flattenCsvText(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/** Excel: force comma as delimiter when list separator is ; in regional settings. */
const EXCEL_CSV_SEP_LINE = "sep=,";

/** Case-insensitive match across lead fields; UUID matches with or without hyphens. */
function leadMatchesSearchQuery(lead: Lead, rawQuery: string): boolean {
  const trimmed = rawQuery.trim();
  if (!trimmed) return true;
  const q = trimmed.toLowerCase();
  const qNoHyphen = q.replace(/-/g, "");
  if (qNoHyphen.length > 0) {
    const idNoHyphen = lead.id.replace(/-/g, "").toLowerCase();
    if (idNoHyphen.includes(qNoHyphen)) return true;
  }
  const created = new Date(lead.created_at);
  const updated = new Date(lead.updated_at);
  const haystack = [
    lead.id,
    lead.full_name,
    lead.email,
    lead.phone,
    lead.course,
    lead.preferred_date,
    lead.notes,
    lead.source,
    lead.status,
    lead.created_at,
    lead.updated_at,
    created.toISOString(),
    updated.toISOString(),
    created.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    updated.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    created.toLocaleDateString(),
    updated.toLocaleDateString(),
  ]
    .filter((x) => x != null && String(x).length > 0)
    .join("\0")
    .toLowerCase();
  return haystack.includes(q);
}

export const Route = createFileRoute("/admin/leads")({
  component: AdminLeads,
});

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [notesEditing, setNotesEditing] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const refresh = useCallback(async () => {
    const session = await getAdminSession();
    if (!session.authenticated) return;
    const [leadsRes, statsRes] = await Promise.all([
      listLeads(),
      getLeadStats(),
    ]);
    if (leadsRes.ok) setLeads(leadsRes.leads);
    else toast.error(leadsRes.error || "Could not load leads");
    if (statsRes.ok) {
      const { ok: _ok, ...rest } = statsRes;
      setStats(rest);
    }
  }, []);

  useEffect(() => {
    const load = () => {
      void (async () => {
        await refresh();
        setLoading(false);
      })();
    };
    load();
    window.addEventListener(ADMIN_SESSION_READY_EVENT, load);
    return () => {
      window.removeEventListener(ADMIN_SESSION_READY_EVENT, load);
    };
  }, [refresh]);

  const filtered = useMemo(() => {
    let rangeStartMs: number | null = null;
    let rangeEndMs: number | null = null;

    if (dateRange?.from) {
      const start =
        dateRange.to && dateRange.from > dateRange.to ? dateRange.to : dateRange.from;
      const end =
        dateRange.to && dateRange.from <= dateRange.to ? dateRange.to : dateRange.from;

      const startDate = new Date(start);
      const endDate = new Date(end);

      rangeStartMs = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        0,
        0,
        0,
        0,
      ).getTime();

      rangeEndMs = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        23,
        59,
        59,
        999,
      ).getTime();
    }

    return leads.filter((l) => {
      const createdMs = new Date(l.created_at).getTime();
      if (rangeStartMs !== null && createdMs < rangeStartMs) return false;
      if (rangeEndMs !== null && createdMs > rangeEndMs) return false;
      if (filter !== "all" && sourceKeyForLead(l) !== filter) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      return leadMatchesSearchQuery(l, query);
    });
  }, [leads, filter, statusFilter, query, dateRange]);

  const counts = useMemo(() => {
    return {
      all: leads.length,
      application: leads.filter((l) => l.source === "application").length,
      brochure: leads.filter((l) => l.source === "brochure").length,
      demo: leads.filter((l) => l.source === "demo" && !isIsaProgramEnquiryLead(l)).length,
      isa_program_enquiry: leads.filter((l) => isIsaProgramEnquiryLead(l)).length,
    };
  }, [leads]);

  const exportLeadsCsv = useCallback(
    (scope: "filtered" | "all") => {
      const data = scope === "filtered" ? filtered : leads;
      const searchTrim = query.trim();

      const headers = [
        "Created at (UTC)",
        "Source",
        "Status",
        "Name",
        "Email",
        "Phone",
        "Preferred date",
        "Course",
        "Notes",
        "Updated at (UTC)",
        "Lead ID",
      ];
      const dataRows = data.map((l) =>
        [
          new Date(l.created_at).toISOString(),
          l.source,
          l.status,
          l.full_name,
          l.email,
          l.phone,
          l.preferred_date ?? "",
          l.course,
          l.notes ?? "",
          new Date(l.updated_at).toISOString(),
          l.id,
        ]
          .map(escapeCsvCell)
          .join(","),
      );

      const csv = [
        EXCEL_CSV_SEP_LINE,
        headers.map(escapeCsvCell).join(","),
        ...dataRows,
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().replace(/:/g, "-").slice(0, 19);
      if (scope === "filtered") {
        const filterSlug =
          [
            filter !== "all" ? filter : null,
            statusFilter !== "all" ? statusFilter : null,
            dateRange?.from ? "daterange" : null,
            searchTrim ? "search" : null,
          ]
            .filter(Boolean)
            .join("-") || "all-filters";
        a.download = `leads-filtered-${filterSlug}-${stamp}.csv`;
      } else {
        a.download = `leads-all-${stamp}.csv`;
      }
      a.click();
      URL.revokeObjectURL(url);

      toast.success(
        scope === "filtered"
          ? `Exported ${data.length} lead${data.length === 1 ? "" : "s"} (filtered view)`
          : `Exported ${data.length} lead${data.length === 1 ? "" : "s"} (all loaded leads)`,
      );
    },
    [filtered, leads, filter, statusFilter, query, dateRange],
  );

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    setBusyId(id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      const res = await updateLeadStatus(id, status);
      if (!res.ok) {
        toast.error(res.error || "Update failed");
        await refresh();
      } else {
        toast.success(`Marked ${STATUS_LABELS[status].toLowerCase()}`);
        const statsRes = await getLeadStats();
        if (statsRes.ok) {
          const { ok: _ok, ...rest } = statsRes;
          setStats(rest);
        }
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lead permanently?")) return;
    setBusyId(id);
    const prev = leads;
    setLeads((p) => p.filter((l) => l.id !== id));
    try {
      const res = await deleteLead(id);
      if (!res.ok) {
        toast.error(res.error || "Delete failed");
        setLeads(prev);
      } else {
        toast.success("Lead deleted");
        const statsRes = await getLeadStats();
        if (statsRes.ok) {
          const { ok: _ok, ...rest } = statsRes;
          setStats(rest);
        }
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      toast.success("Refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelected((prev) => {
      const allVisible = filtered.every((l) => prev.has(l.id));
      if (allVisible) {
        const next = new Set(prev);
        filtered.forEach((l) => next.delete(l.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((l) => next.add(l.id));
      return next;
    });
  };

  const handleBulkStatus = async (status: LeadStatus) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await bulkUpdateStatus(ids, status);
      if (!res.ok) {
        toast.error(res.error || "Bulk update failed");
        return;
      }
      toast.success(
        `Updated ${res.updated} lead${res.updated === 1 ? "" : "s"}`,
      );
      setSelected(new Set());
      await refresh();
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (
      !confirm(`Delete ${ids.length} lead${ids.length === 1 ? "" : "s"} permanently?`)
    )
      return;
    setBulkBusy(true);
    try {
      const res = await bulkDeleteLeads(ids);
      if (!res.ok) {
        toast.error(res.error || "Bulk delete failed");
        return;
      }
      toast.success(`Deleted ${res.deleted} lead${res.deleted === 1 ? "" : "s"}`);
      setSelected(new Set());
      await refresh();
    } finally {
      setBulkBusy(false);
    }
  };

  const startEditNotes = (lead: Lead) => {
    setNotesEditing(lead.id);
    setNotesDraft(lead.notes ?? "");
  };

  const saveNotes = async (id: string) => {
    const next = notesDraft.trim();
    setBusyId(id);
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, notes: next || null } : l)),
    );
    try {
      const res = await updateLeadNotes(id, next || null);
      if (!res.ok) {
        toast.error(res.error || "Could not save notes");
        await refresh();
      } else {
        toast.success("Notes saved");
      }
    } finally {
      setBusyId(null);
      setNotesEditing(null);
    }
  };

  return (
    <AdminShell
      title="Leads"
      subtitle="Submissions from the public site — applications, brochure requests, demo signups, and ISA Program enquiries."
    >
      {loading ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        </div>
      ) : (
        <>
            {stats && (
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <StatCard label="Total leads" value={stats.total} />
                <StatCard
                  label="New"
                  value={stats.newCount}
                  hint="awaiting first contact"
                />
                <StatCard label="Converted" value={stats.converted} />
                <StatCard label="Last 7 days" value={stats.last7} />
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as SourceFilter)}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="all">All ({counts.all})</option>
                  <option value="application">Application ({counts.application})</option>
                  <option value="brochure">Brochure ({counts.brochure})</option>
                  <option value="demo">Demo ({counts.demo})</option>
                  <option value="isa_program_enquiry">
                    ISA Program Enquiry ({counts.isa_program_enquiry})
                  </option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="all">All statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="archived">Archived</option>
                </select>

                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                    >
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      {dateRange?.from
                        ? formatDateRangeLabel(dateRange)
                        : "Any date"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                    />
                    {dateRange?.from && (
                      <button
                        type="button"
                        onClick={() => setDateRange(undefined)}
                        className="mt-2 w-full rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        Clear date filter
                      </button>
                    )}
                  </PopoverContent>
                </Popover>

                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, ID, email, phone, notes…"
                  aria-label="Search leads by any field"
                  className="min-w-0 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none sm:w-52"
                />

                <div className="flex items-center gap-2 sm:ml-auto">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                    title="Reload leads from the server"
                  >
                    {refreshing ? "Refreshing…" : "↻ Refresh"}
                  </button>
                  <div
                    className="inline-flex overflow-hidden rounded-lg"
                    title="Main action uses the filters above. Open the menu to export every loaded lead."
                  >
                    <button
                      type="button"
                      onClick={() => exportLeadsCsv("filtered")}
                      className="whitespace-nowrap bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
                    >
                      Export CSV
                      <span className="ml-1 font-normal opacity-80">
                        ({filtered.length})
                      </span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="border-l border-background/25 bg-foreground px-2 py-1.5 text-background hover:opacity-90"
                          aria-label="More export options"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[14rem]">
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                          Export options
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="flex cursor-pointer justify-between gap-3 text-sm"
                          onSelect={() => exportLeadsCsv("filtered")}
                        >
                          <span>Filtered view</span>
                          <span className="text-xs text-muted-foreground">
                            {filtered.length} row{filtered.length === 1 ? "" : "s"}
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex cursor-pointer justify-between gap-3 text-sm"
                          onSelect={() => exportLeadsCsv("all")}
                        >
                          <span>All loaded leads</span>
                          <span className="text-xs text-muted-foreground">
                            {leads.length} row{leads.length === 1 ? "" : "s"}
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            {selected.size > 0 && (
              <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-brand-purple/30 bg-brand-purple/5 px-3 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:px-4">
                <div className="flex items-center justify-between gap-2 sm:contents">
                  <span className="font-semibold text-brand-purple">
                    {selected.size} selected
                  </span>
                  <button
                    onClick={() => setSelected(new Set())}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground sm:hidden"
                  >
                    Clear
                  </button>
                </div>
                <span className="hidden text-muted-foreground sm:inline">·</span>
                <span className="text-xs text-muted-foreground">Mark as:</span>
                <div className="flex flex-wrap gap-1.5 sm:contents">
                  {(
                    ["new", "contacted", "converted", "archived"] as LeadStatus[]
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleBulkStatus(s)}
                      disabled={bulkBusy}
                      className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium capitalize hover:border-brand-purple hover:text-brand-purple disabled:opacity-50"
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
                <span className="ml-auto hidden items-center gap-2 sm:flex">
                  <button
                    onClick={() => setSelected(new Set())}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkBusy}
                    className="rounded-md border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300"
                  >
                    Delete selected
                  </button>
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkBusy}
                  className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 sm:hidden"
                >
                  Delete selected
                </button>
              </div>
            )}

            <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-border bg-card md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      <input
                        type="checkbox"
                        checked={
                          filtered.length > 0 &&
                          filtered.every((l) => selected.has(l.id))
                        }
                        ref={(el) => {
                          if (el)
                            el.indeterminate =
                              filtered.some((l) => selected.has(l.id)) &&
                              !filtered.every((l) => selected.has(l.id));
                        }}
                        onChange={toggleSelectAllVisible}
                        aria-label="Select all visible leads"
                        className="h-4 w-4 cursor-pointer accent-brand-purple"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Course</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((l) => (
                    <tr
                      key={l.id}
                      className={[
                        "hover:bg-muted/30",
                        selected.has(l.id) ? "bg-brand-purple/5" : "",
                      ].join(" ")}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(l.id)}
                          onChange={() => toggleSelected(l.id)}
                          aria-label={`Select ${l.full_name}`}
                          className="h-4 w-4 cursor-pointer accent-brand-purple"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-brand-purple/10 px-2 py-0.5 text-xs font-medium text-brand-purple">
                          {sourceKeyForLead(l) === "isa_program_enquiry"
                            ? "ISA Program Enquiry"
                            : l.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {l.full_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <a
                          href={`mailto:${l.email}`}
                          className="block truncate hover:text-foreground"
                          title={l.email}
                        >
                          ✉ {l.email}
                        </a>
                        <div className="mt-1 flex items-center gap-2">
                          <a
                            href={`tel:${l.phone}`}
                            className="hover:text-foreground"
                            title="Call"
                          >
                            ☎ {l.phone}
                          </a>
                          <a
                            href={`https://wa.me/${l.phone.replace(/[^\d]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300"
                            title="Open WhatsApp chat"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const meta = parseLeadCourseMeta(l.course);
                          return (
                        <div className="flex flex-col gap-1">
                              <span className="text-foreground">{meta.title}</span>
                            <div className="flex flex-wrap gap-1">
                                {meta.mode && (
                              <span className={[
                                "inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                                    meta.mode.toLowerCase().includes('entrepreneur')
                                  ? "bg-brand-orange/10 text-brand-orange border border-brand-orange/20"
                                  : "bg-muted text-muted-foreground border border-border"
                              ].join(" ")}>
                                    {meta.mode}
                              </span>
                                )}
                                {meta.detail && (
                                <span className="inline-flex rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-700 dark:border-sky-900/30 dark:bg-sky-900/20 dark:text-sky-300">
                                    {meta.detail}
                                </span>
                              )}
                            </div>
                        </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {notesEditing === l.id ? (
                          <div className="flex flex-col gap-1">
                            <textarea
                              value={notesDraft}
                              onChange={(e) => setNotesDraft(e.target.value)}
                              maxLength={2000}
                              rows={3}
                              className="w-44 rounded border border-border bg-background px-2 py-1 text-xs focus:border-brand-purple focus:outline-none"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => saveNotes(l.id)}
                                disabled={busyId === l.id}
                                className="rounded bg-brand-purple px-2 py-0.5 text-[10px] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setNotesEditing(null)}
                                className="rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditNotes(l)}
                            className="block w-44 max-w-[11rem] truncate text-left text-xs text-muted-foreground hover:text-foreground"
                            title={l.notes ?? "Click to add notes"}
                          >
                            {l.notes || (
                              <span className="italic opacity-60">
                                + Add notes
                              </span>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={l.status}
                          disabled={busyId === l.id}
                          onChange={(e) =>
                            handleStatusChange(
                              l.id,
                              e.target.value as LeadStatus,
                            )
                          }
                          className={[
                            "cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium capitalize focus:outline-none",
                            STATUS_BADGE[l.status],
                          ].join(" ")}
                        >
                          {(
                            [
                              "new",
                              "contacted",
                              "converted",
                              "archived",
                            ] as LeadStatus[]
                          ).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(l.id)}
                          disabled={busyId === l.id}
                          className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-900/20"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        No leads match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="mt-6 grid gap-3 md:hidden">
              {filtered.map((l) => (
                <div
                  key={l.id}
                  className={[
                    "rounded-2xl border border-border bg-card p-4 shadow-sm",
                    selected.has(l.id) ? "border-brand-purple bg-brand-purple/5" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected.has(l.id)}
                        onChange={() => toggleSelected(l.id)}
                        aria-label={`Select ${l.full_name}`}
                        className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-brand-purple"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">
                          {l.full_name}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(l.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 rounded-full bg-brand-purple/10 px-2 py-0.5 text-xs font-medium text-brand-purple">
                      {sourceKeyForLead(l) === "isa_program_enquiry"
                        ? "ISA Program Enquiry"
                        : l.source}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <a
                      href={`mailto:${l.email}`}
                      className="block truncate text-muted-foreground hover:text-foreground"
                    >
                      ✉ {l.email}
                    </a>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:${l.phone}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ☎ {l.phone}
                      </a>
                      <a
                        href={`https://wa.me/${l.phone.replace(/[^\d]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300"
                      >
                        WhatsApp
                      </a>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                      {(() => {
                        const meta = parseLeadCourseMeta(l.course);
                        return (
                          <>
                            <div className="text-foreground font-medium">{meta.title}</div>
                        <div className="flex flex-wrap gap-1.5">
                              {meta.mode && (
                          <span className={[
                            "inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                                  meta.mode.toLowerCase().includes('entrepreneur')
                              ? "bg-brand-orange/10 text-brand-orange border border-brand-orange/20"
                              : "bg-muted text-muted-foreground border border-border"
                          ].join(" ")}>
                                  {meta.mode}
                          </span>
                              )}
                              {meta.detail && (
                            <span className="inline-flex rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-700 dark:border-sky-900/30 dark:bg-sky-900/20 dark:text-sky-300">
                                  {meta.detail}
                            </span>
                          )}
                        </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-3 border-t border-border pt-3">
                    {notesEditing === l.id ? (
                      <div className="flex flex-col gap-1">
                        <textarea
                          value={notesDraft}
                          onChange={(e) => setNotesDraft(e.target.value)}
                          maxLength={2000}
                          rows={3}
                          className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs focus:border-brand-purple focus:outline-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveNotes(l.id)}
                            disabled={busyId === l.id}
                            className="rounded bg-brand-purple px-3 py-1 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setNotesEditing(null)}
                            className="rounded border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditNotes(l)}
                        className="block w-full text-left text-xs text-muted-foreground hover:text-foreground"
                      >
                        {l.notes || (
                          <span className="italic opacity-60">+ Add notes</span>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <select
                      value={l.status}
                      disabled={busyId === l.id}
                      onChange={(e) =>
                        handleStatusChange(l.id, e.target.value as LeadStatus)
                      }
                      className={[
                        "cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium capitalize focus:outline-none",
                        STATUS_BADGE[l.status],
                      ].join(" ")}
                    >
                      {(
                        [
                          "new",
                          "contacted",
                          "converted",
                          "archived",
                        ] as LeadStatus[]
                      ).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleDelete(l.id)}
                      disabled={busyId === l.id}
                      className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                  No leads match these filters.
                </div>
              )}
            </div>
          </>
      )}
    </AdminShell>
  );
}
