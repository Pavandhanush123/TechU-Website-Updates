import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Star, Users, Clock, BarChart3 } from "lucide-react";
import courseFullstack from "@/assets/course-fullstack.jpg";
import courseUiux from "@/assets/course-uiux.jpg";
import courseData from "@/assets/course-data.jpg";
import { DemoRequestDialog } from "@/components/landing/DemoRequestDialog";
import { Reveal } from "@/components/Reveal";
import { useCmsSection } from "@/hooks/useCmsSection";
import { resolveAssetUrl, type UpcomingCoursesData } from "@/lib/api";

type Mode = UpcomingCoursesData["courses"][number]["mode"];
type Course = UpcomingCoursesData["courses"][number];

const FALLBACK: UpcomingCoursesData = {
  title: "Explore Our Upcoming Courses",
  subtitle:
    "Hand-picked courses designed by industry experts to help you land your dream tech job",
  courses: [],
};

function slugFor(title: string): "fullstack" | "data-analytics" | "uiux" {
  const t = title.toLowerCase();
  if (t.includes("data")) return "data-analytics";
  if (t.includes("ui/ux") || t.includes("design")) return "uiux";
  return "fullstack";
}

function imageFor(c: Course): string {
  if (c.image && c.image.trim()) return resolveAssetUrl(c.image);
  const slug = slugFor(c.title);
  if (slug === "data-analytics") return courseData;
  if (slug === "uiux") return courseUiux;
  return courseFullstack;
}

function CourseCard({ c, onRegister }: { c: Course; onRegister: () => void }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] ring-1 ring-border transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageFor(c)}
          alt={c.title}
          width={800}
          height={512}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-brand-purple shadow-sm">
          <MapPin className="h-3 w-3" />
          {c.mode}
        </span>
        {c.upcoming && !c.batchNote && (
          <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-[oklch(0.55_0.2_350)] to-[oklch(0.55_0.18_15)] px-3 py-1 text-xs font-medium text-white shadow-sm">
            Upcoming Batch
          </span>
        )}
        {c.batchNote && (
          <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-[oklch(0.55_0.2_350)] to-[oklch(0.55_0.18_15)] px-3 py-1 text-xs font-medium text-white shadow-sm">
            {c.batchNote}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="min-h-[4.5rem]">
          <Link
            to="/course-detail"
            search={{ course: slugFor(c.title) }}
            className="text-lg font-bold leading-tight text-foreground transition hover:text-brand-purple"
          >
            {c.title}
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-brand-orange text-brand-orange" />
            <span className="font-semibold text-foreground">{c.rating}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {c.students}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {c.duration}
          </span>
          <span className="inline-flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5" />
            {c.level}
          </span>
        </div>

        <div className="mt-auto pt-5 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onRegister}
            className="flex h-11 items-center justify-center rounded-full bg-brand-orange px-6 text-center text-[15px] font-bold leading-none text-white shadow-md transition hover:brightness-110"
          >
            Register Now
          </button>
          <Link
            to="/course-detail"
            search={{ course: slugFor(c.title) }}
            className="flex h-11 items-center justify-center rounded-full border border-brand-purple px-6 text-center text-[15px] font-bold leading-none text-brand-purple transition hover:bg-brand-purple hover:text-white"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export function UpcomingCourses() {
  const data = useCmsSection<UpcomingCoursesData>("upcoming_courses", FALLBACK);
  const courses = data.courses ?? [];
  const MODES: Mode[] = useMemo(() => {
    const s = new Set<Mode>(courses.map((c) => c.mode));
    return Array.from(s);
  }, [courses]);

  const [active, setActive] = useState<Mode>(MODES[0] ?? "Offline");
  const [dialogOpen, setDialogOpen] = useState(false);
  const items = courses.filter((c) => c.mode === active);

  return (
    <section
      id="programs"
      className="scroll-mt-24 bg-muted/40 py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-[40px]">
            {data.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            {data.subtitle}
          </p>
        </div>

        {MODES.length > 0 && (
          <div className="mt-8 flex justify-center sm:mt-10">
            <div
              role="tablist"
              aria-label="Course delivery mode"
              className="inline-flex flex-wrap items-center justify-center gap-1 sm:gap-1.5"
            >
              {MODES.map((m) => {
                const isActive = active === m;
                return (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(m)}
                    className={[
                      "min-w-[170px] skew-x-[20deg] border px-8 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/60 focus-visible:ring-offset-1 sm:min-w-[230px] sm:px-10 sm:py-2 sm:text-base",
                      isActive
                        ? "border-brand-orange bg-brand-orange text-white shadow-[0_10px_24px_-10px_rgba(249,115,22,1)]"
                        : "border-border/70 bg-white text-foreground hover:border-border hover:bg-muted/80",
                    ].join(" ")}
                  >
                    <span className="inline-block -skew-x-[20deg]">{m}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Reveal className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {items.map((c, i) => (
            <CourseCard
              key={`${c.title}-${i}`}
              c={c}
              onRegister={() => setDialogOpen(true)}
            />
          ))}
        </Reveal>
      </div>
      <DemoRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
}
