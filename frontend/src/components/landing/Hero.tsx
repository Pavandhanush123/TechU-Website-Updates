import { useEffect, useState } from "react";
import { ArrowRight, Check, Radio } from "lucide-react";
import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-students.jpg";
import heroUiux from "@/assets/hero-uiux.jpg";
import heroData from "@/assets/hero-data.jpg";
import { useCmsSection } from "@/hooks/useCmsSection";
import { resolveAssetUrl, type HeroData, type HeroSlide } from "@/lib/api";

type HeroProps = {
  onOpenDemo: () => void;
};

const FALLBACK_IMAGES = [heroImg, heroUiux, heroData];

const FALLBACK: HeroData = {
  livePillLabel: "Live",
  livePillText: "Register for Free Demo",
  slides: [
    {
      badge: "Powered by TechU",
      titleStart: "Kickstart Your Career with ",
      titleHighlight: "Job-Ready Tech Courses",
      titleEnd: "",
      description:
        "Make 2026 your year of growth. Unlock limitless opportunities with TechU.\nLearn from expert mentors with real projects and placement support.",
      features: [
        "4.95 Avg Rating",
        "500+ Learner Reviews",
        "100% Satisfied Students",
      ],
      primaryCta: "Enroll Now",
      secondaryCta: "Explore Courses",
      image: "",
      alt: "Two AI engineers collaborating at a workstation",
    },
    {
      badge: "UI/UX Design",
      titleStart: "Shape Ideas Into ",
      titleHighlight: "Stunning Digital Experiences",
      titleEnd: "",
      description:
        "Learn Figma, Photoshop, Illustrator, and Adobe XD with real-time projects\nand portfolio building guided by industry mentors.",
      features: ["Hands-On Projects", "Portfolio Building", "Expert Trainers"],
      primaryCta: "Enroll Now",
      secondaryCta: "Explore Courses",
      image: "",
      alt: "Designer crafting UI/UX layouts on a large monitor",
    },
    {
      badge: "Data Science & AI",
      titleStart: "Unlock the ",
      titleHighlight: "Power of Data",
      titleEnd: " with AI & ML",
      description:
        "Learn Python, Machine Learning, SQL, and AI tools with hands-on projects\nto become a skilled Data Scientist ready for the industry.",
      features: ["Industry Curriculum", "Live Sessions", "Placement Support"],
      primaryCta: "Enroll Now",
      secondaryCta: "Explore Courses",
      image: "",
      alt: "Data analyst reviewing dashboards across multiple monitors",
    },
  ],
};

function resolveImage(slide: HeroSlide, idx: number): string {
  if (slide.image && slide.image.trim()) return resolveAssetUrl(slide.image);
  return FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
}

export function Hero({ onOpenDemo }: HeroProps) {
  const data = useCmsSection<HeroData>("hero", FALLBACK);
  const slides = data.slides?.length ? data.slides : FALLBACK.slides;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    slides.forEach((s, i) => {
      const img = new Image();
      img.src = resolveImage(s, i);
    });
  }, [slides]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (typeof document !== "undefined" && document.hidden) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    const onVisibility = () => {
      if (document.hidden) clearInterval(id);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [index, slides.length]);

  return (
    <section className="relative overflow-hidden bg-brand-gradient text-white">
      <div className="absolute inset-0 bg-brand-grid opacity-60" aria-hidden />
      <div className="relative grid">
        {slides.map((slide, i) => {
          const isActive = i === index;
          return (
            <div
              key={i}
              aria-hidden={!isActive}
              className={[
                "col-start-1 row-start-1 transition-opacity duration-700 ease-out motion-reduce:transition-none",
                isActive
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none",
              ].join(" ")}
            >
              <div className="mx-auto grid max-w-[1400px] items-start gap-8 px-4 pt-8 pb-10 sm:gap-12 sm:px-6 sm:pt-12 sm:pb-14 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-10 lg:pt-14 lg:pb-16">
                <div className="flex min-h-[560px] flex-col items-center text-center lg:min-h-[620px] lg:items-start lg:text-left">
                  <div
                    key={`badge-${index}-${i}`}
                    className={
                      isActive
                        ? "animate-hero-rise-soft inline-flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/5 px-3.5 py-1.5 text-xs sm:text-sm [animation-delay:120ms]"
                        : "inline-flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/5 px-3.5 py-1.5 text-xs sm:text-sm opacity-0"
                    }
                  >
                    <span
                      className="h-2 w-2 rounded-full bg-white animate-pulse"
                      aria-hidden
                    />
                    {slide.badge}
                  </div>

                  <div className="mt-5 min-h-[8.5rem] sm:mt-6 sm:min-h-[9.5rem] lg:min-h-[12.5rem]">
                    <h1
                      key={`title-${index}-${i}`}
                      className={
                        isActive
                          ? "animate-hero-rise text-[clamp(2rem,7vw,2.75rem)] font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[60px] xl:text-[64px] lg:leading-[1.05] [animation-delay:240ms]"
                          : "text-[clamp(2rem,7vw,2.75rem)] font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[60px] xl:text-[64px] lg:leading-[1.05] opacity-0"
                      }
                    >
                      {slide.titleStart}
                      <span className="underline decoration-2 underline-offset-[6px] sm:underline-offset-[10px]">
                        {slide.titleHighlight}
                      </span>
                      {slide.titleEnd}
                    </h1>
                  </div>

                  <div className="mt-5 min-h-[3.5rem] sm:mt-6 sm:min-h-[4.5rem]">
                    <p
                      key={`desc-${index}-${i}`}
                      className={
                        isActive
                          ? "animate-hero-rise-soft max-w-xl text-base text-white/90 sm:text-lg [animation-delay:380ms]"
                          : "max-w-xl text-base text-white/90 sm:text-lg opacity-0"
                      }
                    >
                      {slide.description.replace(/\n/g, " ")}
                    </p>
                  </div>

                  <div className="mt-7 min-h-[3.5rem]">
                    <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-white sm:gap-x-8 sm:text-[15px] lg:justify-start">
                      {slide.features.map((f, fi) => (
                        <li
                          key={`${index}-${f}`}
                          className={
                            isActive
                              ? "animate-hero-rise-soft flex items-center gap-2"
                              : "flex items-center gap-2 opacity-0"
                          }
                          style={
                            isActive
                              ? { animationDelay: `${480 + fi * 90}ms` }
                              : undefined
                          }
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    key={`cta-${index}-${i}`}
                    className={
                      isActive
                        ? "animate-hero-rise-soft mt-auto flex w-full flex-col items-stretch gap-3 pt-8 sm:w-auto sm:flex-row sm:items-center sm:flex-wrap [animation-delay:780ms]"
                        : "mt-auto flex w-full flex-col items-stretch gap-3 pt-8 sm:w-auto sm:flex-row sm:items-center sm:flex-wrap opacity-0"
                    }
                  >
                    <button
                      type="button"
                      onClick={onOpenDemo}
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-orange px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-black/10 transition hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      {slide.primaryCta.trim().toLowerCase() === "join now"
                        ? "Enroll Now"
                        : slide.primaryCta}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </button>
                    <Link
                      to="/courses"
                      className="rounded-xl border border-white/70 bg-white/5 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/15 text-center"
                    >
                      {slide.secondaryCta}
                    </Link>
                  </div>

                  <div className="mt-8 flex items-center justify-center gap-3 lg:justify-start">
                    {slides.map((_, j) => {
                      const dotActive = j === index;
                      return (
                        <button
                          key={j}
                          type="button"
                          aria-label={`Go to slide ${j + 1}`}
                          onClick={() => setIndex(j)}
                          className={[
                            "relative h-1.5 overflow-hidden rounded-full transition-all duration-500 ease-out",
                            dotActive
                              ? "w-10 bg-white/25 sm:w-12"
                              : "w-5 bg-white/30 hover:bg-white/50 sm:w-6",
                          ].join(" ")}
                        >
                          {dotActive && (
                            <span
                              key={`bar-${index}`}
                              className="absolute inset-0 block bg-white animate-hero-progress"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
                  <div
                    key={`frame-${index}-${i}`}
                    className={
                      isActive
                        ? "animate-hero-image-in relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl shadow-black/20 ring-1 ring-white/10 sm:rounded-3xl lg:aspect-[5/4]"
                        : "relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl shadow-black/20 ring-1 ring-white/10 sm:rounded-3xl lg:aspect-[5/4] opacity-0"
                    }
                  >
                    <img
                      src={resolveImage(slide, i)}
                      alt={slide.alt}
                      width={1280}
                      height={1024}
                      loading={i === 0 ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={i === 0 ? "high" : "low"}
                      className={
                        isActive
                          ? "animate-hero-kenburns h-full w-full object-cover"
                          : "h-full w-full object-cover"
                      }
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-transparent"
                      aria-hidden
                    />
                  </div>

                  <button
                    type="button"
                    onClick={onOpenDemo}
                    className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white px-3.5 py-2.5 text-xs font-semibold text-foreground shadow-xl ring-1 ring-black/5 transition hover:scale-[1.02] sm:-bottom-6 sm:gap-3 sm:px-5 sm:py-3 sm:text-base"
                  >
                    <span className="flex items-center gap-1 rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white sm:px-2 sm:py-1 sm:text-[10px]">
                      <Radio className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {data.livePillLabel}
                    </span>
                    <span>{data.livePillText}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
