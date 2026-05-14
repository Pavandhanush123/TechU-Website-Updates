import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  Users,
  Star,
  Clock,
  Calendar,
  BookOpen,
  Sparkles,
  TrendingUp,
  Eye,
  Flame,
  Zap,
} from "lucide-react";
import { useCourse, useCourseName } from "./CourseContext";
import { BrochureDownloadDialog } from "./BrochureDownloadDialog";
import { ApplyDialog } from "./ApplyDialog";
import { type PricingTier } from "@/data/courses";

const FEATURES = [
  "Online & Classroom Real-Time training",
  "Project & Task Based Learning",
  "24/7 Learning Support with Dedicated Mentors",
  "Interviews, Jobs and Placement Support",
];

const BATCHES = [
  { day: "12", month: "May", note: "12 Seats" },
  { day: "26", month: "May", note: "8 Seats" },
  { day: "9", month: "Jun", note: "Full", full: true },
  { day: "23", month: "Jun", note: "10 Seats" },
  { day: "7", month: "Jul", note: "12 Seats" },
  { day: "21", month: "Jul", note: "12 Seats" },
];


const PERKS = [
  "Live mentor sessions",
  "Real AI projects",
  "95% placement support",
  "Industry certificate",
];

const APPLICATION_CLOSE_AT = new Date("2026-02-05T23:59:59+05:30");

export function CourseHero() {
  const course = useCourse();
  const courseName = useCourseName();
  const [brochureOpen, setBrochureOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyLabel, setApplyLabel] = useState("Submit Application");
  const [selectedMode, setSelectedMode] = useState(0);
  const [selectedBatch, setSelectedBatch] = useState(0);
  const [liveSeatsLeft, setLiveSeatsLeft] = useState(20);
  const [liveViewers, setLiveViewers] = useState(17);
  const batchScrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const selectedTier = course.pricingTiers[selectedMode] || course.pricingTiers[0];
  const projectHighlights = course.projects.slice(0, 2).map((project) => project.title);

  const syncBatchNavigationState = useCallback(() => {
    const container = batchScrollerRef.current;
    if (!container) return;

    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    setCanScrollPrev(container.scrollLeft > 1);
    setCanScrollNext(container.scrollLeft < maxScrollLeft - 1);
  }, []);

  const scrollBatchDates = useCallback((direction: "prev" | "next") => {
    const container = batchScrollerRef.current;
    if (!container) return;

    const firstCard = container.querySelector<HTMLElement>("[data-batch-card]");
    const step = (firstCard?.offsetWidth ?? 72) + 6;
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    const nextScrollLeft =
      direction === "next"
        ? Math.min(container.scrollLeft + step, maxScrollLeft)
        : Math.max(container.scrollLeft - step, 0);

    container.scrollTo({ left: nextScrollLeft, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (liveSeatsLeft <= 6) return;
    const timeoutMs = 14_000 + Math.floor(Math.random() * 12_000);
    const timeout = window.setTimeout(() => {
      setLiveSeatsLeft((prev) => {
        if (prev <= 6) return prev;
        const decrement = Math.random() < 0.7 ? 1 : 2;
        return Math.max(6, prev - decrement);
      });
    }, timeoutMs);
    return () => window.clearTimeout(timeout);
  }, [liveSeatsLeft]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLiveViewers((prev) => {
        const next = prev + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.7 ? 1 : 2);
        return Math.max(9, Math.min(34, next));
      });
    }, 9000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const container = batchScrollerRef.current;
    if (!container) return;

    syncBatchNavigationState();
    container.addEventListener("scroll", syncBatchNavigationState, {
      passive: true,
    });
    window.addEventListener("resize", syncBatchNavigationState);

    return () => {
      container.removeEventListener("scroll", syncBatchNavigationState);
      window.removeEventListener("resize", syncBatchNavigationState);
    };
  }, [syncBatchNavigationState]);

  const openBrochure = () => {
    if (course.brochureUrl) setBrochureOpen(true);
  };
  const openApply = (label: string) => {
    setApplyLabel(label);
    setApplyOpen(true);
  };
  return (
    <>
      <section className="relative overflow-hidden bg-background pt-8 pb-10 sm:pt-12 sm:pb-14 lg:pt-14 lg:pb-14">
        {/* Background image: strictly right half, no text overlap */}
        <div className="pointer-events-none absolute bottom-16 right-0 top-16 z-0 hidden w-[46%] overflow-hidden rounded-l-[4rem] shadow-inner lg:block">
          <img
            src={course.backgroundImage}
            alt=""
            aria-hidden="true"
            className="h-full w-full scale-105 object-cover blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-brand-purple/35 via-black/15 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto grid max-w-[1280px] gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8">
          {/* Left: Title + features */}
          <div className="flex h-full flex-col">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-purple/40 px-3 py-1 text-xs font-medium text-brand-purple">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-purple" />
              {course.badge}
            </span>

            <h1 className="mt-5 text-[clamp(1.875rem,7vw,2.25rem)] font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
              {course.title}
            </h1>

            <p className="mt-5 text-base font-semibold text-foreground">
              {course.tagline}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {course.description}
            </p>

            <ul className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-sm font-semibold text-foreground"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-purple" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm sm:mt-8">
              <span className="inline-flex items-center gap-1.5 text-brand-teal">
                <Users className="h-4 w-4" />
                <span className="font-medium">500+ students</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <span className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-brand-orange text-brand-orange"
                    />
                  ))}
                </span>
                <span className="font-medium">4.8/5</span>
              </span>
            </div>
            <div className="mt-6 w-full max-w-xl self-start rounded-2xl bg-white/60 p-2 shadow-sm backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => openApply("Register Now")}
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-orange px-6 text-base font-bold text-white shadow-[0_12px_28px_-16px_rgba(249,115,22,0.95)] transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Register Now
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
                <button
                  type="button"
                  disabled={!course.brochureUrl}
                  onClick={openBrochure}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-purple bg-white px-6 text-base font-bold text-brand-purple transition hover:bg-brand-purple hover:text-white disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Download Brochure
                </button>
              </div>
            </div>
            <LiveSeatsWidget
              seatsLeft={liveSeatsLeft}
              viewers={liveViewers}
              onReserveSeat={() => openApply("Reserve my seat")}
            />
          </div>

          <div className="relative flex flex-col lg:justify-start">
            {/* Mobile/Tablet background: matches widget height, doesn't overlap left text */}
            <div className="pointer-events-none absolute -bottom-1 -top-1 left-0 right-[-50vw] z-0 overflow-hidden rounded-l-[2rem] shadow-xl lg:hidden">
              <img
                src={course.backgroundImage}
                alt=""
                aria-hidden="true"
                className="h-full w-full scale-105 object-cover blur-[2px]"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-brand-purple/35 via-black/15 to-transparent" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-[25rem] rounded-2xl border-2 border-brand-purple/50 bg-white/92 p-3.5 shadow-[0_20px_60px_-20px_rgba(124,58,237,0.3)] ring-4 ring-brand-purple/5 backdrop-blur-md sm:rounded-3xl sm:p-5 lg:ml-auto lg:mr-0">
              <div className="flex items-baseline gap-3">
                <span className="text-[1.7rem] font-extrabold text-foreground sm:text-3xl">
                  {selectedTier.price}
                </span>
                <span className="text-base text-muted-foreground line-through">
                  {selectedTier.originalPrice}
                </span>
              </div>
              <span className="mt-2 inline-block rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-semibold text-brand-orange">
                {selectedTier.saveLabel}
              </span>
              <p className="mt-2 text-xs text-muted-foreground sm:text-sm">{selectedTier.emi}</p>
              <div className="mt-3 rounded-xl border border-brand-purple/20 bg-gradient-to-r from-brand-purple/10 to-brand-teal/10 p-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-purple">
                  <Sparkles className="h-3.5 w-3.5" />
                  Projects you'll build
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {projectHighlights.map((project) => (
                    <span
                      key={project}
                      className="rounded-full border border-brand-purple/25 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-foreground"
                    >
                      {project}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="mt-4 text-sm font-semibold text-foreground">
                {course.batchHeading}
              </h3>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollBatchDates("prev")}
                  disabled={!canScrollPrev}
                  aria-label="View previous batch dates"
                  className={[
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground transition sm:h-9 sm:w-9",
                    canScrollPrev
                      ? "hover:border-brand-purple/60 hover:text-brand-purple"
                      : "cursor-not-allowed opacity-40",
                  ].join(" ")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div
                  ref={batchScrollerRef}
                  className="flex-1 overflow-x-auto pb-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                <div className="grid min-w-full grid-flow-col auto-cols-[minmax(4rem,1fr)] gap-1.5 sm:auto-cols-[minmax(4.25rem,1fr)]">
                  {BATCHES.map((b, i) => {
                    const isSelected = selectedBatch === i && !b.full;
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={b.full}
                        onClick={() => setSelectedBatch(i)}
                        aria-pressed={isSelected}
                        data-batch-card
                        className={[
                          "snap-start rounded-lg border p-1.5 text-center transition",
                          b.full
                            ? "cursor-not-allowed border-border bg-muted/40 opacity-60"
                            : isSelected
                              ? "border-brand-purple bg-brand-purple/10 ring-2 ring-brand-purple/40"
                              : "border-brand-orange/30 bg-white hover:border-brand-orange",
                        ].join(" ")}
                      >
                        <div className="text-base font-bold text-foreground">
                          {b.day}
                        </div>
                        <div className="text-[11px] font-medium text-foreground">
                          {b.month}
                        </div>
                        <div
                          className={[
                            "mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-medium",
                            b.full
                              ? "bg-brand-orange text-white"
                              : "text-muted-foreground",
                          ].join(" ")}
                        >
                          {b.note}
                        </div>
                      </button>
                    );
                  })}
                </div>
                </div>
                <button
                  type="button"
                  onClick={() => scrollBatchDates("next")}
                  disabled={!canScrollNext}
                  aria-label="View next batch dates"
                  className={[
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground transition sm:h-9 sm:w-9",
                    canScrollNext
                      ? "hover:border-brand-purple/60 hover:text-brand-purple"
                      : "cursor-not-allowed opacity-40",
                  ].join(" ")}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <h3 className="mt-4 text-sm font-semibold text-foreground">
                Select Learning Mode
              </h3>
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {course.pricingTiers.map((m, i) => {
                  const isSelected = selectedMode === i;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMode(i)}
                      aria-pressed={isSelected}
                      className={[
                        "rounded-xl border p-2.5 text-left transition",
                        isSelected
                          ? "border-brand-purple bg-brand-purple/5 ring-2 ring-brand-purple/30"
                          : "border-border hover:border-brand-purple/50",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "text-sm font-semibold",
                          isSelected ? "text-brand-purple" : "text-foreground",
                        ].join(" ")}
                      >
                        {m.label}
                      </div>
                      <div className="mt-1 text-[11px] leading-tight text-muted-foreground">
                        {m.subtitle}
                      </div>
                      {m.internship && (
                        <div className="mt-2 inline-flex items-center gap-1 rounded bg-brand-teal/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-teal">
                          <CheckCircle2 className="h-3 w-3" />
                          {m.internship} Internship
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <ul className="mt-4 grid grid-cols-2 gap-y-1.5 text-xs sm:text-sm">
                {PERKS.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-2 text-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-brand-teal" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => openApply("Enroll Now")}
                className="mt-4 w-full rounded-xl bg-brand-orange py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110 sm:text-base"
              >
                Enroll Now
              </button>
              <button
                type="button"
                disabled={!course.brochureUrl}
                onClick={openBrochure}
                className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-purple py-2.5 text-sm font-semibold text-brand-purple transition hover:bg-brand-purple hover:text-white disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Download Brochure
              </button>
            </div>
          </div>
        </div>
      </section>
      <CourseInfoStrip
        selectedTier={selectedTier}
        applicationCloseDate={APPLICATION_CLOSE_AT}
      />
      {course.brochureUrl && (
        <BrochureDownloadDialog
          open={brochureOpen}
          onOpenChange={setBrochureOpen}
          courseTitle={courseName}
          brochureUrl={course.brochureUrl}
        />
      )}
      <ApplyDialog
        open={applyOpen}
        onOpenChange={setApplyOpen}
        courseTitle={courseName}
        ctaLabel={applyLabel}
        selectedBatch={BATCHES[selectedBatch]}
        selectedMode={selectedTier}
      />
      <StickyCTA 
        onApply={() => openApply("Enroll Now")} 
        price={selectedTier.price}
        visible={!applyOpen}
      />
    </>
  );
}

function LiveSeatsWidget({
  seatsLeft,
  viewers,
  onReserveSeat,
}: {
  seatsLeft: number;
  viewers: number;
  onReserveSeat: () => void;
}) {
  const totalSeats = 20;
  const seatsFilled = totalSeats - seatsLeft;
  const filledPercent = Math.max(0, Math.min(100, (seatsFilled / totalSeats) * 100));
  const filledPercentRounded = Math.round(filledPercent);
  const seatsJoinedToday = Math.max(2, Math.min(11, seatsFilled + 2));
  const seatSegments = 10;
  const filledSegments = Math.round((filledPercent / 100) * seatSegments);

  return (
    <div className="relative mt-10 w-full max-w-xl self-start overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-[0_2px_24px_-12px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.03] lg:mt-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-orange/45 to-transparent"
      />
      <div className="relative border-b border-border/80 bg-muted/25 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-tight text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-orange/40 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-orange" />
            </span>
            High demand this week
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange/[0.09] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-orange ring-1 ring-brand-orange/15">
            <Flame className="h-3 w-3 shrink-0" strokeWidth={2.25} />
            Fast filling
          </span>
        </div>
      </div>

      <div className="relative space-y-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Remaining seats
            </p>
            <p className="mt-1 text-[1.65rem] font-bold leading-none tracking-tight text-foreground sm:text-[1.85rem]">
              <span className="tabular-nums">{seatsLeft}</span>
              <span className="ml-2 text-[1rem] font-semibold tracking-tight text-muted-foreground">
                seats left
              </span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="rounded-lg bg-brand-purple/[0.08] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-brand-purple ring-1 ring-brand-purple/15">
              {filledPercentRounded}% batch filled
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-purple via-brand-purple to-brand-orange shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-[width] duration-700 ease-out"
              style={{ width: `${filledPercent}%` }}
            />
          </div>
          <div className="flex gap-1">
            {Array.from({ length: seatSegments }).map((_, index) => (
              <div
                key={index}
                className={[
                  "h-1 flex-1 rounded-[2px] transition-colors duration-300",
                  index < filledSegments ? "bg-brand-orange" : "bg-muted",
                ].join(" ")}
              />
            ))}
          </div>
          <p className="text-xs leading-snug text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">
              {seatsFilled}/{totalSeats}
            </span>{" "}
            seats already reserved
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/15 px-3 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
              <Eye className="h-4 w-4" strokeWidth={2} />
            </span>
            <p className="text-[13px] font-semibold leading-tight text-foreground">
              <span className="tabular-nums">{viewers}</span> viewing now
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/15 px-3 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
              <TrendingUp className="h-4 w-4" strokeWidth={2} />
            </span>
            <p className="text-[13px] font-semibold leading-tight text-foreground">
              <span className="tabular-nums">{seatsJoinedToday}</span> joined today
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReserveSeat}
          className="group relative flex w-full flex-col gap-0.5 overflow-hidden rounded-xl bg-brand-orange px-4 py-3.5 text-left text-white shadow-[0_14px_36px_-18px_rgba(249,115,22,0.85)] ring-1 ring-black/5 transition hover:brightness-[1.03] active:scale-[0.99]"
        >
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.14] to-transparent opacity-90" />
          <span className="relative inline-flex items-center gap-2 text-[15px] font-bold tracking-tight">
            <Zap className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
            Reserve my seat — limited spots
            <ArrowRight
              className="ml-auto h-4 w-4 shrink-0 transition group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
          <span className="relative text-[11px] font-medium text-white/85">
            First-come, first-served · Secure yours before this batch fills
          </span>
        </button>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          Seats are allotted on a first-come, first-served basis.
        </p>
      </div>
    </div>
  );
}

function StickyCTA({ onApply, price, visible }: { onApply: () => void; price: string; visible: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const target = document.getElementById("who-it-is-for");
      if (target) {
        const rect = target.getBoundingClientRect();
        // Show after the "Who it's for" section starts appearing
        // We show it when the top of the section is near the top of the viewport
        setShow(rect.top <= 150);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActuallyVisible = show && visible;

  return (
    <div 
      className={[
        "fixed bottom-0 left-0 right-0 z-[100] border-t border-brand-purple/10 bg-white/95 p-4 pb-safe backdrop-blur-md transition-all duration-300 lg:hidden shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]",
        isActuallyVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-purple/60">Total Fee</span>
          <span className="text-xl font-black text-foreground">{price}</span>
        </div>
        <button
          type="button"
          onClick={onApply}
          className="flex-1 rounded-2xl bg-brand-orange py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-orange/20 transition active:scale-[0.98]"
        >
          Enroll Now
        </button>
      </div>
    </div>
  );
}

function CourseInfoStrip({
  selectedTier,
  applicationCloseDate,
}: {
  selectedTier: PricingTier;
  applicationCloseDate: Date;
}) {
  const course = useCourse();
  const closeDateLabel = applicationCloseDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const INFO_ITEMS = [
    { icon: Clock, label: "Application closes on", value: closeDateLabel },
    {
      icon: Calendar,
      label: "Program Duration",
      value: course.duration,
      suffix: selectedTier.internship ? `(+ ${selectedTier.internship} Internship)` : "(6-8hrs / Week)",
    },
    {
      icon: BookOpen,
      label: "Learning Format",
      value: selectedTier.label.includes("Offline") ? "In-Person (Hyderabad)" : "Live, Online, Interactive",
    },
  ];
  return (
    <section className="bg-background pt-10 pb-4 sm:pt-12">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-brand-purple/10 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {INFO_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-sm"
              >
                <item.icon
                  className="h-7 w-7 shrink-0 text-brand-purple"
                  strokeWidth={1.75}
                />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground/80">
                    {item.label}
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-brand-orange">
                    {item.value}
                    {item.suffix && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {item.suffix}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
