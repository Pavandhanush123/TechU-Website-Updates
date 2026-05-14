import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, RefreshCw } from "lucide-react";
import {
  getAdminSession,
  getAdminSection,
  listAdminSections,
  updateAdminSection,
  type CourseSearchData,
  type CmsSection,
  type CmsSectionKey,
} from "@/lib/api";
import { normalizeCourseSearchData } from "@/lib/course-search-options";
import { ADMIN_SESSION_READY_EVENT } from "@/lib/admin-session-events";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  CmsFieldEditor,
  CmsRawEditor,
} from "@/components/admin/CmsFieldEditor";
import { invalidateCmsSectionCache } from "@/hooks/useCmsSection";

export const Route = createFileRoute("/admin/content")({
  component: AdminContentRoute,
});

const SECTION_LABELS: Record<CmsSectionKey, string> = {
  announcement_bar: "Announcement Bar",
  site_header: "Site Header",
  hero: "Homepage Hero",
  course_search: "Course Search",
  upcoming_courses: "Upcoming Courses",
  mentors: "Mentors",
  webinars: "Webinars & Events",
  infrastructure: "Infrastructure / Stats",
  cta_banner: "CTA Banner",
  testimonials: "Testimonials",
  contact: "Contact Section",
  final_cta: "Final CTA",
  site_footer: "Site Footer",
  welcome_popup: "Welcome Popup",
  seo_home: "SEO — Homepage",
  seo_courses: "SEO — Courses page",
  seo_course_detail: "SEO — Course detail page",
};

const SECTION_HINTS: Record<CmsSectionKey, string> = {
  announcement_bar:
    "The thin scrolling bar at the very top of the public site.",
  site_header: "Logo and main navigation.",
  hero: "The big homepage carousel above the fold.",
  course_search:
    "Homepage search bar — course, delivery mode (from catalog tiers), and location. Rows sync with course pricing tiers (no separate schedule field).",
  upcoming_courses: "Course cards on the homepage, grouped by delivery mode.",
  mentors: "Mentor profile cards on the homepage.",
  webinars: "Upcoming live webinars and events.",
  infrastructure: "Stats grid and supporting copy below the webinars section.",
  cta_banner: "Mid-page banner with Apply / Download Curriculum CTAs.",
  testimonials: "Student success stories.",
  contact: "Contact details and the application form labels.",
  final_cta: "Bottom-of-page CTA section.",
  site_footer: "Footer links, contact, social, and copyright.",
  welcome_popup:
    "First-visit popup with a free demo form. `enabled` toggles it; `delaySeconds` is how long to wait before opening; `showAgainAfterDays` is the cooldown after a visitor dismisses or submits (0 = once forever); bump `version` to force a re-show for everyone." +
    " Image fields accept absolute URLs or uploaded images.",
  seo_home: "Page title, description, OG image for the homepage.",
  seo_courses: "SEO for the /courses page.",
  seo_course_detail: "SEO for course detail pages.",
};

const GROUPS: { label: string; keys: CmsSectionKey[] }[] = [
  {
    label: "Layout & nav",
    keys: ["announcement_bar", "site_header", "site_footer", "welcome_popup"],
  },
  {
    label: "Homepage",
    keys: [
      "hero",
      "course_search",
      "upcoming_courses",
      "mentors",
      "webinars",
      "infrastructure",
      "cta_banner",
      "testimonials",
      "contact",
      "final_cta",
    ],
  },
  {
    label: "SEO",
    keys: ["seo_home", "seo_courses", "seo_course_detail"],
  },
];

type SectionData = Record<string, unknown>;

function AdminContentRoute() {
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [activeKey, setActiveKey] = useState<CmsSectionKey | null>(null);
  const [data, setData] = useState<SectionData | null>(null);
  const [originalData, setOriginalData] = useState<SectionData | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingSection, setLoadingSection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"form" | "raw">("form");

  const loadSections = useCallback(async () => {
    const session = await getAdminSession();
    if (!session.authenticated) {
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    const res = await listAdminSections();
    if (res.ok) {
      setSections(res.sections);
      if (res.sections.length > 0) {
        setActiveKey((prev) => {
          if (prev) return prev;
          // Honor a section deep-link stashed by the command palette.
          const stashed = sessionStorage.getItem("admin.content.activeKey");
          sessionStorage.removeItem("admin.content.activeKey");
          if (stashed && res.sections.some((s) => s.key === stashed)) {
            return stashed as CmsSectionKey;
          }
          return res.sections[0].key as CmsSectionKey;
        });
      }
    } else {
      toast.error(res.error || "Could not load sections");
    }
    setLoadingList(false);
  }, []);

  useEffect(() => {
    const load = () => {
      void loadSections();
    };
    load();
    window.addEventListener(ADMIN_SESSION_READY_EVENT, load);
    return () => {
      window.removeEventListener(ADMIN_SESSION_READY_EVENT, load);
    };
  }, [loadSections]);

  useEffect(() => {
    if (!activeKey) return;
    setLoadingSection(true);
    void (async () => {
      const res = await getAdminSection(activeKey);
      if (res.ok) {
        const next = res.section.data as SectionData;
        if (activeKey === "course_search") {
          const raw = JSON.parse(JSON.stringify(next)) as CourseSearchData;
          const normalized = normalizeCourseSearchData(raw);
          setData(normalized as SectionData);
          setOriginalData(JSON.parse(JSON.stringify(raw)));
        } else {
          setData(next);
          setOriginalData(JSON.parse(JSON.stringify(next)));
        }
      } else {
        toast.error(res.error || "Could not load section");
      }
      setLoadingSection(false);
    })();
  }, [activeKey]);

  const dirty =
    data !== null &&
    originalData !== null &&
    (activeKey === "course_search"
      ? JSON.stringify(data) !==
        JSON.stringify(normalizeCourseSearchData(originalData as CourseSearchData))
      : JSON.stringify(data) !== JSON.stringify(originalData));

  const handleSave = async () => {
    if (!activeKey || !data) return;
    setSaving(true);
    try {
      const payload =
        activeKey === "course_search"
          ? (normalizeCourseSearchData(data as CourseSearchData) as SectionData)
          : data;
      const res = await updateAdminSection(activeKey, payload);
      if (!res.ok) {
        toast.error(res.error || "Save failed");
        return;
      }
      toast.success("Saved — the public site will pick this up automatically");
      invalidateCmsSectionCache(activeKey);
      setSections((prev) =>
        prev.map((s) => (s.key === activeKey ? res.section : s)),
      );
      const saved = res.section.data as SectionData;
      if (activeKey === "course_search") {
        const normalized = normalizeCourseSearchData(saved as CourseSearchData);
        setOriginalData(JSON.parse(JSON.stringify(saved)));
        setData(normalized as SectionData);
      } else {
        setOriginalData(JSON.parse(JSON.stringify(saved)));
        setData(saved);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!originalData) return;
    if (activeKey === "course_search") {
      setData(
        normalizeCourseSearchData(
          JSON.parse(JSON.stringify(originalData)) as CourseSearchData,
        ) as SectionData,
      );
    } else {
      setData(JSON.parse(JSON.stringify(originalData)));
    }
  };

  const visibleSections = new Set(sections.map((s) => s.key));

  const topbarActions = activeKey && data ? (
    <>
      <div className="hidden items-center rounded-lg border border-border bg-card p-0.5 text-xs sm:inline-flex">
        <button
          type="button"
          onClick={() => setMode("form")}
          className={`rounded-md px-2.5 py-1 transition ${mode === "form" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          Form
        </button>
        <button
          type="button"
          onClick={() => setMode("raw")}
          className={`rounded-md px-2.5 py-1 transition ${mode === "raw" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          JSON
        </button>
      </div>
      <button
        onClick={handleReset}
        disabled={!dirty || saving}
        className="hidden rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40 sm:block"
      >
        Reset
      </button>
      <button
        onClick={handleSave}
        disabled={saving || !dirty}
        className="rounded-lg bg-brand-orange px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
      </button>
    </>
  ) : null;

  return (
    <AdminShell
      title="Site Content"
      subtitle="Edit anything that shows up on the public website."
      actions={topbarActions}
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-5">
          {loadingList ? (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Loading sections…
              </div>
            </div>
          ) : (
            GROUPS.map((group) => {
              const keys = group.keys.filter((k) => visibleSections.has(k));
              if (keys.length === 0) return null;
              return (
                <div key={group.label}>
                  <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {group.label}
                  </div>
                  <div className="space-y-1 rounded-2xl border border-border bg-card p-2 shadow-sm">
                    {keys.map((key) => {
                      const active = key === activeKey;
                      return (
                        <button
                          key={key}
                          onClick={() => setActiveKey(key)}
                          className={[
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition",
                            active
                              ? "bg-brand-purple/10 font-semibold text-brand-purple"
                              : "text-foreground/85 hover:bg-muted",
                          ].join(" ")}
                        >
                          <span className="truncate">{SECTION_LABELS[key]}</span>
                          {active && <Pencil className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </aside>

        {/* Editor */}
        <section>
          {!activeKey ? (
            <EmptyCard message="Select a section to edit." />
          ) : loadingSection || !data ? (
            <EmptyCard message="Loading section…" />
          ) : (
            <div
              className={[
                "overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
                activeKey === "announcement_bar"
                  ? "lg:flex lg:max-h-[calc(100vh-8rem)] lg:flex-col"
                  : "",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/30 px-5 py-4">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-foreground">
                    {SECTION_LABELS[activeKey]}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {SECTION_HINTS[activeKey]}
                  </p>
                </div>
                {/* Mobile actions echo */}
                <div className="flex shrink-0 items-center gap-2 sm:hidden">
                  <button
                    type="button"
                    onClick={() => setMode(mode === "form" ? "raw" : "form")}
                    className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground"
                  >
                    {mode === "form" ? "JSON" : "Form"}
                  </button>
                </div>
              </div>

              <div
                className={[
                  "px-5 py-5",
                  activeKey === "announcement_bar" ? "lg:overflow-y-auto" : "",
                ].join(" ")}
              >
                {mode === "form" ? (
                  <CmsFieldEditor value={data} onChange={setData} />
                ) : (
                  <CmsRawEditor value={data} onChange={setData} />
                )}
              </div>

              {dirty && (
                <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
                  <p className="text-xs text-muted-foreground">
                    You have unsaved changes.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReset}
                      disabled={saving}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-lg bg-brand-orange px-4 py-1.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
