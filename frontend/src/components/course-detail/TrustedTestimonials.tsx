import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import maleAvatar from "@/assets/testimonial-male.png";
import femaleAvatar from "@/assets/testimonial-female.png";

const STATS = [
  { value: "52,000+", label: "Professionals Trained" },
  { value: "30+", label: "Expert Trainers" },
  { value: "120+", label: "Workshops/Month" },
  { value: "2500+", label: "5-star Online reviews" },
];

type Testimonial = {
  rating: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  package: string;
  avatar: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    rating: "5/5",
    quote:
      "TechU's UI/UX design program gave me real-world skills through hands-on projects and expert mentorship. The structured learning and portfolio guidance helped me confidently transition into a product design role.",
    name: "Arnaud Moinard",
    role: "UIUX Designer",
    company: "Accenture",
    package: "8 LPA",
    avatar: maleAvatar,
  },
  {
    rating: "5/5",
    quote:
      "The UI/UX course at TechU is truly job-oriented. From design fundamentals to real product case studies, every module is practical. It helped me build a strong portfolio and crack top design interviews.",
    name: "Priya Sharma",
    role: "UIUX Designer",
    company: "Accenture",
    package: "8 LPA",
    avatar: femaleAvatar,
  },
  {
    rating: "5/5",
    quote:
      "From zero design experience to landing my dream role — TechU's mentors guided me through every milestone. The community and feedback culture made all the difference in my growth.",
    name: "Rahul Verma",
    role: "Product Designer",
    company: "Razorpay",
    package: "12 LPA",
    avatar: maleAvatar,
  },
  {
    rating: "5/5",
    quote:
      "TechU's curriculum mixes design thinking with hands-on tooling. Live critiques and real client briefs prepared me for the demands of a senior design role from day one.",
    name: "Ananya Iyer",
    role: "Senior Designer",
    company: "Swiggy",
    package: "16 LPA",
    avatar: femaleAvatar,
  },
  {
    rating: "5/5",
    quote:
      "The mock interviews and 1:1 mentor reviews at TechU were a game changer. By the time placement drives started, I was confidently solving design challenges and walked into multiple offers.",
    name: "Karthik Reddy",
    role: "UX Researcher",
    company: "Flipkart",
    package: "14 LPA",
    avatar: maleAvatar,
  },
  {
    rating: "5/5",
    quote:
      "Coming from a non-tech background, I was anxious about switching careers. TechU's pace, mentor support and the AI-augmented projects helped me ramp up faster than I imagined.",
    name: "Sneha Krishnan",
    role: "Product Designer",
    company: "Zomato",
    package: "13 LPA",
    avatar: femaleAvatar,
  },
  {
    rating: "5/5",
    quote:
      "What stood out was the focus on real outcomes — case studies that look like work, not assignments. My portfolio actually impressed hiring managers, and I closed two offers in three weeks.",
    name: "Vikram Patel",
    role: "Senior UI Designer",
    company: "PhonePe",
    package: "18 LPA",
    avatar: maleAvatar,
  },
  {
    rating: "5/5",
    quote:
      "TechU pushed me to think beyond pixels — accessibility, motion, design systems, and product strategy. I came out a more rounded designer, and that shows in my day-to-day work.",
    name: "Meera Nair",
    role: "Design Lead",
    company: "Cred",
    package: "22 LPA",
    avatar: femaleAvatar,
  },
  {
    rating: "5/5",
    quote:
      "The placement team didn't just send me job links — they prepared me. Every mock turned into a debrief, every portfolio review into a sharper case study. Worth every rupee.",
    name: "Rohan Mehta",
    role: "UI/UX Designer",
    company: "Paytm",
    package: "11 LPA",
    avatar: maleAvatar,
  },
];

const PER_PAGE = 2;
const AUTO_ADVANCE_MS = 6000;

export function TrustedTestimonials() {
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const pageCount = Math.ceil(TESTIMONIALS.length / PER_PAGE);
  const visible = TESTIMONIALS.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const prev = useCallback(
    () => setPage((p) => (p - 1 + pageCount) % pageCount),
    [pageCount],
  );
  const next = useCallback(
    () => setPage((p) => (p + 1) % pageCount),
    [pageCount],
  );

  // Auto-advance the carousel. Resets whenever `page` changes (manual click or
  // auto step) so the timer is consistent. Pauses on hover/focus and when the
  // user has prefers-reduced-motion enabled.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (paused) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduce) return;
    }
    intervalRef.current = setInterval(() => {
      setPage((p) => (p + 1) % pageCount);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [page, paused, pageCount]);

  return (
    <section className="bg-background py-14 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            Trusted by 100+ Organizations and 52,000+ Professionals Worldwide
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Our immersive, agile training programs have transformed careers and
            upskilled teams at leading tech enterprises. We don't just teach
            theory; we build practical, future-ready capabilities.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 border-b border-border pb-10 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-brand-orange sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div
          className="mt-10 grid gap-6 md:grid-cols-2"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          aria-roledescription="carousel"
          aria-label="Student testimonials"
        >
          {visible.map((t, i) => (
            <article
              key={`${page}-${i}`}
              className="animate-fade-up relative overflow-hidden rounded-2xl p-6 text-white shadow-lg sm:min-h-[280px] sm:p-7 sm:pr-44"
              style={{
                background: "linear-gradient(120deg, #B13A89 0%, #971C00 100%)",
              }}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className="h-4 w-4 fill-brand-orange text-brand-orange"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-white/90">
                    {t.rating}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/95">
                  {t.quote}
                </p>
                <div className="mt-6">
                  <div className="text-lg font-bold">{t.name}</div>
                  <div className="mt-0.5 text-xs">
                    <span className="font-semibold text-brand-orange">
                      {t.role},
                    </span>{" "}
                    <span className="text-white/85">{t.company}</span>
                  </div>
                </div>
              </div>

              {/* Avatar — stacked below text on mobile, anchored bottom-right on desktop */}
              <div className="mt-6 flex flex-col items-center sm:absolute sm:bottom-0 sm:right-0 sm:mt-0 sm:block sm:h-full sm:w-40">
                <img
                  src={t.avatar}
                  alt={t.name}
                  loading="lazy"
                  width={640}
                  height={800}
                  className="h-44 w-32 rounded-xl object-cover object-top sm:h-full sm:w-full sm:rounded-none sm:object-bottom"
                />
                <span className="mt-2 rounded-md bg-brand-orange px-3 py-1 text-xs font-bold text-white shadow sm:absolute sm:bottom-3 sm:right-3 sm:mt-0 sm:px-3 sm:py-1.5 sm:text-sm">
                  {t.package}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous testimonials"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition hover:border-brand-purple hover:text-brand-purple"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === page ? "true" : undefined}
                  onClick={() => setPage(i)}
                  className={[
                    "h-2 rounded-full transition-all",
                    i === page
                      ? "w-6 bg-brand-purple"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                  ].join(" ")}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              aria-label="Next testimonials"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition hover:border-brand-purple hover:text-brand-purple"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <a
            href="/#stories"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-purple underline-offset-4 hover:underline"
          >
            Read All Testimonials <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
