import type { CourseSearchData } from "@/lib/api";
import type { PricingTier } from "@/data/courses";
import {
  COURSE_SLUGS,
  courseSearchRowsFromCatalog,
  getCourse,
  listAvailableCourses,
  type AvailableCourseOption,
  type CourseModeOption,
  type CourseSlug,
} from "@/data/courses";

function resolvePricingTier(
  slug: CourseSlug,
  modeRaw: string,
): PricingTier | undefined {
  const course = getCourse(slug);
  const norm = modeRaw.trim().toLowerCase();
  if (!norm) return undefined;

  const byLabel = course.pricingTiers.find(
    (t) => t.label.toLowerCase() === norm,
  );
  if (byLabel) return byLabel;

  const offline = course.pricingTiers.find((t) => t.id === "offline");
  const online = course.pricingTiers.find((t) => t.id === "online");

  // Legacy CMS labels from older homepage filters
  if (norm === "hybrid" || norm === "in-person") return offline;
  if (norm === "online") return online;

  return undefined;
}

function sortModesByCatalog(slug: CourseSlug, modes: CourseModeOption[]) {
  const order = getCourse(slug).pricingTiers.map((t) => t.id);
  const idx = new Map(order.map((id, i) => [id, i]));
  return [...modes].sort((a, b) => (idx.get(a.id) ?? 99) - (idx.get(b.id) ?? 99));
}

/**
 * Rebuilds `course_search` from the live catalog and merges title/location overrides
 * from CMS when the row matches the same slug + pricing tier (including legacy mode labels).
 */
export function normalizeCourseSearchData(data: CourseSearchData): CourseSearchData {
  const incoming = data.courses ?? [];
  const base = courseSearchRowsFromCatalog();

  return {
    courses: base.map((row) => {
      const slug = row.slug;
      const tier = getCourse(slug).pricingTiers.find((t) => t.label === row.mode);
      if (!tier) return row;

      const override = incoming.find((r) => {
        if ((r.slug ?? "").trim() !== slug) return false;
        const t = resolvePricingTier(slug, r.mode ?? "");
        return t?.id === tier.id;
      });

      return {
        title: override?.title?.trim() || row.title,
        slug: row.slug,
        mode: row.mode,
        location: override?.location?.trim() || row.location,
      };
    }),
  };
}

/**
 * Maps CMS `course_search.courses` rows into dropdown options.
 * Only includes slugs that exist in the static course catalog so `/course-detail`
 * and pricing always resolve correctly. Mode IDs match pricing tier ids.
 */
export function courseSearchRowsToOptions(
  data: CourseSearchData,
): AvailableCourseOption[] | null {
  const rows = data.courses ?? [];
  if (!rows.length) return null;

  const slugOrder: CourseSlug[] = [];
  const map = new Map<CourseSlug, { title: string; modes: CourseModeOption[] }>();
  const tierSeen = new Map<CourseSlug, Set<string>>();

  rows.forEach((row) => {
    const slugRaw = row.slug?.trim();
    if (!slugRaw || !(COURSE_SLUGS as readonly string[]).includes(slugRaw)) return;

    const slug = slugRaw as CourseSlug;
    const tier = resolvePricingTier(slug, row.mode ?? "");
    if (!tier) return;

    const seen = tierSeen.get(slug) ?? new Set<string>();
    if (seen.has(tier.id)) return;
    seen.add(tier.id);
    tierSeen.set(slug, seen);

    const mode: CourseModeOption = {
      id: tier.id,
      label: tier.label,
      subtitle: tier.subtitle,
    };

    const existing = map.get(slug);
    if (!existing) {
      map.set(slug, {
        title: row.title?.trim() || slug,
        modes: [mode],
      });
      slugOrder.push(slug);
    } else {
      existing.modes.push(mode);
    }
  });

  if (!slugOrder.length) return null;

  return slugOrder.map((slug) => ({
    slug,
    title: map.get(slug)!.title,
    modes: sortModesByCatalog(slug, map.get(slug)!.modes),
  }));
}

export function locationOptionsFromCourseSearch(data: CourseSearchData): string[] {
  const canonical = normalizeCourseSearchData(data);
  const raw = (canonical.courses ?? [])
    .map((c) => c.location?.trim())
    .filter((v): v is string => !!v);
  const uniq = Array.from(new Set(raw));
  return uniq.length ? uniq.sort((a, b) => a.localeCompare(b)) : ["Madhapur"];
}

export function resolvedCourseSearchOptions(
  data: CourseSearchData,
): AvailableCourseOption[] {
  const canonical = normalizeCourseSearchData(data);
  return courseSearchRowsToOptions(canonical) ?? listAvailableCourses();
}
