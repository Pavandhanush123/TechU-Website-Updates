import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSeo } from "@/lib/seo";
import { useCmsSection } from "@/hooks/useCmsSection";
import type { SeoSectionData } from "@/lib/api";
import { AnnouncementBar } from "@/components/landing/AnnouncementBar";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { Hero } from "@/components/landing/Hero";
import { CourseSearchBar } from "@/components/landing/CourseSearchBar";
import { DemoRequestDialog } from "@/components/landing/DemoRequestDialog";
import { UpcomingCourses } from "@/components/landing/UpcomingCourses";
import { MentorsSection } from "@/components/landing/MentorsSection";
import { WebinarsSection } from "@/components/landing/WebinarsSection";
import { InfrastructureSection } from "@/components/landing/InfrastructureSection";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { SuccessStories } from "@/components/landing/SuccessStories";
import { ContactSection } from "@/components/landing/ContactSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { WelcomePopup } from "@/components/landing/WelcomePopup";
import { ApplyDialog } from "@/components/course-detail/ApplyDialog";

/** Default course when opening ApplyDialog from homepage CTAs without a specific selection. */
const HOMEPAGE_ENROLL_DEFAULT_COURSE =
  "Full Stack Development with Claude AI";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [finalEnrollOpen, setFinalEnrollOpen] = useState(false);
  const seo = useCmsSection<SeoSectionData>("seo_home", {
    title:
      "TechU — Job-Ready AI, Full-Stack & UI/UX Courses in Hyderabad",
    description:
      "Learn AI, Full-Stack Development, Data Analytics & UI/UX with TechU Innovation Labs — live mentor-led courses, real projects and 95% placement support in Hyderabad and online.",
    canonical: "",
    ogImage: "",
  });
  useSeo({
    title: seo.title,
    description: seo.description,
    path: "/",
    ogImage: seo.ogImage || undefined,
  });
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <AnnouncementBar />
      <SiteHeader />
      <Hero onOpenDemo={() => setDemoOpen(true)} />
      <CourseSearchBar />
      <UpcomingCourses />
      <MentorsSection />
      <WebinarsSection />
      <InfrastructureSection />
      <CtaBanner />
      <SuccessStories />
      <ContactSection />
      <FinalCta onPrimaryEnroll={() => setFinalEnrollOpen(true)} />
      <SiteFooter />
      <DemoRequestDialog open={demoOpen} onOpenChange={setDemoOpen} />
      <ApplyDialog
        open={finalEnrollOpen}
        onOpenChange={setFinalEnrollOpen}
        courseTitle={HOMEPAGE_ENROLL_DEFAULT_COURSE}
        ctaLabel="Enroll Now"
      />
      <WelcomePopup />
    </main>
  );
}
