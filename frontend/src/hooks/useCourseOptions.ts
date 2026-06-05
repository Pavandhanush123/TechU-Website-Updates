import { useMemo } from "react";
import { COURSE_SLUGS, getCourse } from "@/data/courses";
import { useCmsSection } from "@/hooks/useCmsSection";
import {
  COURSES_CATALOG_FALLBACK,
  type CoursesCatalogData,
} from "@/lib/api";

/**
 * Titles of the hand-authored, built-in courses (the three with full detail
 * pages in `data/courses.ts`).
 */
export const BUILT_IN_COURSE_TITLES: string[] = COURSE_SLUGS.map(
  (slug) => getCourse(slug).title,
);

/** A sensible default course title for form initial state. */
export const DEFAULT_COURSE_TITLE = BUILT_IN_COURSE_TITLES[0];

/**
 * Hybrid list of selectable course titles: the built-in courses PLUS every
 * published course an admin created in the CMS (`courses_catalog`), deduped.
 *
 * Use this for every "select a course" dropdown so newly-added admin courses
 * show up everywhere automatically — no per-form code change needed.
 *
 * @param extra Extra title(s) to guarantee are present and listed first (e.g.
 *   the course a detail page is currently showing, even if unpublished).
 */
export function useCourseOptions(extra?: string | string[]): string[] {
  const catalog = useCmsSection<CoursesCatalogData>(
    "courses_catalog",
    COURSES_CATALOG_FALLBACK,
  );

  const extraKey = Array.isArray(extra) ? extra.join("|") : extra ?? "";

  return useMemo(() => {
    const extras = Array.isArray(extra) ? extra : extra ? [extra] : [];
    const admin = (catalog.courses ?? [])
      .filter(
        (c) =>
          c.published !== false &&
          typeof c.title === "string" &&
          c.title.trim(),
      )
      .map((c) => c.title.trim());

    const seen = new Set<string>();
    const out: string[] = [];
    for (const title of [...extras, ...BUILT_IN_COURSE_TITLES, ...admin]) {
      const v = (title ?? "").trim();
      if (v && !seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.courses, extraKey]);
}
