import { createContext, useContext, type ReactNode } from "react";
import { getCourse, type CourseContent } from "@/data/courses";

const CourseCtx = createContext<CourseContent>(getCourse(undefined));

export function CourseProvider({
  slug,
  content,
  children,
}: {
  slug?: string;
  /** Pre-resolved content (e.g. an admin-created catalog course). Overrides slug lookup. */
  content?: CourseContent;
  children: ReactNode;
}) {
  const course = content ?? getCourse(slug);
  return <CourseCtx.Provider value={course}>{children}</CourseCtx.Provider>;
}

export function useCourse() {
  return useContext(CourseCtx);
}

// Plain-text course name suitable for storing in leads (strips the " — TechU"
// SEO suffix on metaTitle).
export function useCourseName() {
  const course = useContext(CourseCtx);
  return course.metaTitle.replace(/\s*[—-]\s*TechU\s*$/i, "");
}
