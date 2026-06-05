// Visual card-grid manager for the `courses_catalog` CMS section. Instead of a
// cramped JSON accordion, each course shows up as a website-style card the
// admin can publish/unpublish, edit, duplicate or delete — plus a "New course"
// tile. Editing opens a focused dialog backed by the generic field editor, so
// every course field stays editable without bespoke per-field wiring.
//
// This is a presentation-only upgrade: it reads/writes the exact same
// `{ courses: CatalogCourse[] }` shape the backend already stores.

import { useState } from "react";
import {
  Clock,
  Copy,
  ExternalLink,
  GraduationCap,
  ImageOff,
  Lock,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import {
  resolveAssetUrl,
  type CatalogCourse,
  type CoursesCatalogData,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CmsFieldEditor } from "@/components/admin/CmsFieldEditor";
import { COURSE_SLUGS, getCourse } from "@/data/courses";

type Json = Record<string, unknown>;

// Built-in, hand-authored courses (Full Stack, Data Analytics, UI/UX) live in
// code with full detail pages — they're shown here read-only so the admin sees
// the complete set of live courses, not just the CMS-managed ones.
function normalizeMode(label: string): string | null {
  const l = label.toLowerCase();
  if (l.includes("online")) return "Online";
  if (l.includes("offline")) return "Offline";
  return null;
}

type DisplayCourse = CatalogCourse & { builtIn?: boolean };

const BUILTIN_COURSES: DisplayCourse[] = COURSE_SLUGS.map((slug) => {
  const c = getCourse(slug);
  const modes = Array.from(
    new Set(
      c.pricingTiers
        .map((t) => normalizeMode(t.label))
        .filter((m): m is string => !!m),
    ),
  );
  return {
    builtIn: true,
    published: true,
    slug,
    title: c.title,
    badge: c.badge,
    heroImage: c.heroImage,
    duration: c.duration,
    modes,
    pricingTiers: c.pricingTiers,
  };
});

const NEW_COURSE: CatalogCourse = {
  published: false,
  slug: "",
  title: "Untitled course",
  category: "Development",
  badge: "Enrollment Open",
  tagline: "Short one-line tagline shown under the title",
  description: "A 1–2 sentence summary shown in the hero and listings.",
  metaTitle: "",
  metaDescription: "",
  heroImage: "",
  brochureUrl: "",
  duration: "4 Months",
  rating: 4.8,
  students: "1,000",
  modes: ["Online", "Offline"],
  batchDate: "",
  batchNote: "Next Batch Starting Soon",
  pricingTiers: [
    {
      id: "online",
      label: "Online Live",
      price: "₹65,000",
      originalPrice: "₹90,000",
      saveLabel: "Save ₹25,000 - Limited Time",
      emi: "Or ₹5,417/month with 0% EMI",
      subtitle: "Live classes + mentorship",
    },
  ],
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CoursesCatalogEditor({
  value,
  onChange,
}: {
  value: CoursesCatalogData;
  onChange: (next: CoursesCatalogData) => void;
}) {
  const courses = Array.isArray(value?.courses) ? value.courses : [];
  const [editing, setEditing] = useState<number | null>(null);

  const setCourses = (next: CatalogCourse[]) => onChange({ ...value, courses: next });

  const updateAt = (idx: number, next: CatalogCourse) =>
    setCourses(courses.map((c, i) => (i === idx ? next : c)));

  const addCourse = () => {
    const next = [...courses, { ...NEW_COURSE }];
    setCourses(next);
    setEditing(next.length - 1);
  };

  const duplicate = (idx: number) => {
    const src = courses[idx];
    const copy: CatalogCourse = {
      ...src,
      published: false,
      title: `${src.title} (copy)`,
      slug: src.slug ? `${src.slug}-copy` : "",
    };
    setCourses([
      ...courses.slice(0, idx + 1),
      copy,
      ...courses.slice(idx + 1),
    ]);
  };

  const remove = (idx: number) => {
    const c = courses[idx];
    if (!confirm(`Delete "${c.title || "this course"}"? This can't be undone.`)) return;
    setCourses(courses.filter((_, i) => i !== idx));
  };

  const totalLive =
    BUILTIN_COURSES.length +
    courses.filter((c) => c.published !== false && c.slug && c.title).length;

  return (
    <div className="space-y-8">
      {/* Built-in courses — read-only, managed in code. */}
      <section>
        <SectionHeading
          title="Built-in courses"
          count={BUILTIN_COURSES.length}
          hint="Hand-authored pages managed in code — view only."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {BUILTIN_COURSES.map((c) => (
            <CourseCard key={c.slug} course={c} readOnly />
          ))}
        </div>
      </section>

      {/* Admin-managed catalog courses — fully editable. */}
      <section>
        <SectionHeading
          title="Your courses"
          count={courses.length}
          hint="Added through this panel — edit, publish or remove freely."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c, i) => (
            <CourseCard
              key={i}
              course={c}
              onEdit={() => setEditing(i)}
              onDuplicate={() => duplicate(i)}
              onDelete={() => remove(i)}
              onTogglePublished={() =>
                updateAt(i, { ...c, published: !c.published })
              }
            />
          ))}

          <button
            type="button"
            onClick={addCourse}
            className="group flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/40 p-6 text-center transition hover:border-brand-purple hover:bg-brand-purple/5"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple transition group-hover:scale-110">
              <Plus className="h-6 w-6" />
            </span>
            <span className="text-sm font-semibold text-foreground">
              New course
            </span>
            <span className="max-w-[16rem] text-xs text-muted-foreground">
              Creates a draft you can fill in and publish when ready.
            </span>
          </button>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        {totalLive} course{totalLive === 1 ? "" : "s"} currently live on the site.
      </p>

      {editing !== null && courses[editing] && (
        <CourseEditDialog
          course={courses[editing]}
          onClose={() => setEditing(null)}
          onChange={(next) => updateAt(editing, next)}
        />
      )}
    </div>
  );
}

function SectionHeading({
  title,
  count,
  hint,
}: {
  title: string;
  count: number;
  hint: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border">
          {count}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Card
// ────────────────────────────────────────────────────────────────────────────

function CourseCard({
  course,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePublished,
  readOnly,
}: {
  course: DisplayCourse;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onTogglePublished?: () => void;
  readOnly?: boolean;
}) {
  const img = course.heroImage ? resolveAssetUrl(course.heroImage) : "";
  const firstTier = course.pricingTiers?.[0];
  const modes = course.modes ?? [];

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-36 overflow-hidden bg-muted">
        {img ? (
          <img
            src={img}
            alt={course.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = "0.2";
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground/60">
            <ImageOff className="h-6 w-6" />
            <span className="text-[10px]">No image</span>
          </div>
        )}

        {readOnly ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground shadow-sm backdrop-blur">
            <Lock className="h-2.5 w-2.5" />
            In code
          </span>
        ) : (
          <PublishToggle
            published={course.published !== false}
            onToggle={onTogglePublished!}
          />
        )}

        {course.badge && (
          <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-semibold text-brand-purple shadow-sm">
            {course.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
            {course.title || "Untitled course"}
          </h3>
        </div>
        {course.slug ? (
          <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
            /{course.slug}
          </p>
        ) : (
          !readOnly && (
            <p className="mt-0.5 text-[10px] font-medium text-amber-600">
              ⚠ No slug set — won't be reachable
            </p>
          )
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {course.rating != null && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-brand-orange text-brand-orange" />
              <span className="font-semibold text-foreground">
                {course.rating}
              </span>
            </span>
          )}
          {course.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.duration}
            </span>
          )}
          {course.students && (
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {course.students}
            </span>
          )}
        </div>

        {modes.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {modes.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 rounded-full bg-brand-purple/10 px-2 py-0.5 text-[10px] font-medium text-brand-purple"
              >
                <MapPin className="h-2.5 w-2.5" />
                {m}
              </span>
            ))}
          </div>
        )}

        {firstTier && (
          <div className="mt-2.5 text-xs">
            <span className="font-bold text-foreground">{firstTier.price}</span>
            {firstTier.originalPrice && (
              <span className="ml-1.5 text-[11px] text-muted-foreground line-through">
                {firstTier.originalPrice}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center gap-1.5 pt-4">
          {readOnly ? (
            <a
              href={`/course-detail?course=${course.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View page
            </a>
          ) : (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-purple px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              {course.slug && course.published !== false && (
                <a
                  href={`/course-detail?course=${course.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View live page"
                  aria-label="View live page"
                  className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <IconButton title="Duplicate" onClick={onDuplicate!}>
                <Copy className="h-4 w-4" />
              </IconButton>
              <IconButton title="Delete" destructive onClick={onDelete!}>
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function PublishToggle({
  published,
  onToggle,
}: {
  published: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={published ? "Published — click to unpublish" : "Draft — click to publish"}
      className={[
        "absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm backdrop-blur transition",
        published
          ? "bg-emerald-500/95 text-white hover:bg-emerald-600"
          : "bg-white/90 text-muted-foreground hover:bg-white",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          published ? "bg-white" : "bg-amber-500",
        ].join(" ")}
      />
      {published ? "Live" : "Draft"}
    </button>
  );
}

function IconButton({
  title,
  onClick,
  destructive,
  children,
}: {
  title: string;
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={[
        "rounded-lg border border-border p-2 transition",
        destructive
          ? "text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Edit dialog — reuses the generic field editor for the single course object.
// ────────────────────────────────────────────────────────────────────────────

function CourseEditDialog({
  course,
  onChange,
  onClose,
}: {
  course: CatalogCourse;
  onChange: (next: CatalogCourse) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{course.title || "Edit course"}</DialogTitle>
          <DialogDescription>
            Changes apply when you hit <strong>Save changes</strong> in the top
            bar. Set a unique, URL-safe slug and toggle{" "}
            <strong>Published</strong> to make it live.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {!course.slug && course.title && (
            <button
              type="button"
              onClick={() => onChange({ ...course, slug: slugify(course.title) })}
              className="w-full rounded-lg border border-dashed border-brand-purple/50 bg-brand-purple/5 px-3 py-2 text-left text-xs font-medium text-brand-purple transition hover:bg-brand-purple/10"
            >
              Suggested slug:{" "}
              <span className="font-mono">/{slugify(course.title)}</span> — click
              to use
            </button>
          )}
          <CmsFieldEditor
            value={course as Json}
            onChange={(next) => onChange(next as CatalogCourse)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
