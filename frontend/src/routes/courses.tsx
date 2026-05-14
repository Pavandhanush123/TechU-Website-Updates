import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/landing/AnnouncementBar";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { ExploreCourses } from "@/components/courses/ExploreCourses";
import { useSeo } from "@/lib/seo";
import { useCmsSection } from "@/hooks/useCmsSection";
import type { SeoSectionData } from "@/lib/api";

export const Route = createFileRoute("/courses")({
  component: CoursesPage,
});

function CoursesPage() {
  const seo = useCmsSection<SeoSectionData>("seo_courses", {
    title: "Upcoming AI & Tech Courses in Hyderabad & Online — TechU",
    description:
      "Explore job-ready AI, full-stack, data analytics, and UI/UX courses at TechU Innovation Labs. Live classes, real projects, flexible online & offline modes in Hyderabad.",
    canonical: "",
    ogImage: "",
  });
  useSeo({
    title: seo.title,
    description: seo.description,
    path: "/courses",
    ogImage: seo.ogImage || undefined,
  });
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <AnnouncementBar />
      <SiteHeader />

      <section className="bg-background py-8 sm:py-10 lg:py-12">
        <div className="mx-auto max-w-[900px] px-4 text-center sm:px-6">
          <h1 className="text-[clamp(1.6rem,5vw,2.2rem)] font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl lg:leading-[1.12]">
            Upcoming AI &amp; Tech Courses in Hyderabad &amp; Online
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:mt-4 sm:text-base">
            Explore job-ready AI, full-stack, and cloud programs with live
            classes, real projects, and flexible learning modes.
          </p>
        </div>
      </section>

      <ExploreCourses />

      <SiteFooter />
    </main>
  );
}
