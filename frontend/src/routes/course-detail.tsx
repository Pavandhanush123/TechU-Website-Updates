import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useSeo } from "@/lib/seo";
import { JsonLd } from "@/lib/JsonLd";
import { FAQS } from "@/components/course-detail/Faq";
import { AnnouncementBar } from "@/components/landing/AnnouncementBar";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { CourseHero } from "@/components/course-detail/CourseHero";
import { WhoItsFor } from "@/components/course-detail/WhoItsFor";
import { AiLearningSupport } from "@/components/course-detail/AiLearningSupport";
import { Curriculum } from "@/components/course-detail/Curriculum";
import { DesignTools } from "@/components/course-detail/DesignTools";
import { RealProjects } from "@/components/course-detail/RealProjects";
import { TrustedTestimonials } from "@/components/course-detail/TrustedTestimonials";
import { HiringCompanies } from "@/components/course-detail/HiringCompanies";
import { Faq } from "@/components/course-detail/Faq";
import { JourneyCta } from "@/components/course-detail/JourneyCta";
import { CourseProvider } from "@/components/course-detail/CourseContext";
import {
  getCourse,
  isStaticCourseSlug,
  buildCourseContentFromCatalog,
  type CourseContent,
} from "@/data/courses";
import { useCmsSection } from "@/hooks/useCmsSection";
import { COURSES_CATALOG_FALLBACK, type CoursesCatalogData } from "@/lib/api";

const searchSchema = z.object({
  // Accepts built-in slugs (uiux/fullstack/data-analytics) and any
  // admin-created catalog slug.
  course: z.string().optional(),
});

export const Route = createFileRoute("/course-detail")({
  validateSearch: searchSchema,
  component: CourseDetailPage,
});

function CourseDetailPage() {
  const { course } = Route.useSearch();
  const catalog = useCmsSection<CoursesCatalogData>(
    "courses_catalog",
    COURSES_CATALOG_FALLBACK,
  );

  // Built-in courses use their hand-authored content; admin-created catalog
  // courses are built from core fields merged over shared defaults.
  let resolvedContent: CourseContent | undefined;
  if (!isStaticCourseSlug(course)) {
    const entry = (catalog.courses ?? []).find(
      (c) => c.slug === course && c.published !== false,
    );
    if (entry) resolvedContent = buildCourseContentFromCatalog(entry);
  }

  const meta = resolvedContent ?? getCourse(course);
  const path = course
    ? `/course-detail?course=${course}`
    : "/course-detail";
  const url = `https://techu.in${path}`;
  const cleanName = meta.metaTitle.replace(/\s*[—-]\s*TechU\s*$/i, "");

  useSeo({
    title: meta.metaTitle,
    description: meta.metaDescription,
    path,
  });

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: cleanName,
    description: meta.metaDescription,
    url,
    provider: {
      "@type": "EducationalOrganization",
      "@id": "https://techu.in/#organization",
      name: "TechU Innovation Labs",
      url: "https://techu.in/",
      sameAs: [
        "https://www.linkedin.com/company/techu-innovation-labs/",
        "https://www.facebook.com/techutraining",
        "https://www.instagram.com/techu_in/",
        "https://www.youtube.com/@TechU_In",
      ],
    },
    inLanguage: "en-IN",
    educationalLevel: "Beginner to Advanced",
    courseMode: ["online", "onsite"],
    locationCreated: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Hyderabad",
        addressRegion: "Telangana",
        addressCountry: "IN",
      },
    },
    offers: {
      "@type": "Offer",
      category: "Paid",
      priceCurrency: "INR",
      url,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://techu.in/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Courses",
        item: "https://techu.in/courses",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: cleanName,
        item: url,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <JsonLd id="ld-course" data={courseSchema} />
      <JsonLd id="ld-breadcrumb" data={breadcrumbSchema} />
      <JsonLd id="ld-faq" data={faqSchema} />
      <AnnouncementBar />
      <SiteHeader />
      <CourseProvider slug={course} content={resolvedContent}>
        <CourseHero />
        <WhoItsFor />
        <AiLearningSupport />
        <Curriculum />
        <DesignTools />
        <RealProjects />
        <TrustedTestimonials />
        <HiringCompanies />
        <Faq />
        <JourneyCta />
      </CourseProvider>
      <SiteFooter />
    </main>
  );
}
