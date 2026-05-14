import {
  ArrowRight,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Clock,
} from "lucide-react";
import { useCmsSection } from "@/hooks/useCmsSection";
import type { FinalCtaData } from "@/lib/api";

const FALLBACK: FinalCtaData = {
  eyebrow: "Admissions Open · 2026 Batch",
  titleStart: "Ready to Start Your ",
  titleHighlight: "Tech Journey?",
  titleEnd: "",
  description:
    "Join thousands of learners who have transformed their careers with TechU. Limited seats available for the upcoming 2026 batch.",
  primaryLabel: "Enroll Now — Limited Seats",
  primaryHref: "#contact",
  secondaryLabel: "Talk to a Mentor",
  secondaryHref: "#contact",
  badges: [
    "EMI options available",
    "Money-back guarantee",
    "Next batch starting soon",
  ],
};

const BADGE_ICONS = [CreditCard, ShieldCheck, Clock];
const BADGE_COLORS = ["text-brand-orange", "text-emerald-400", "text-amber-300"];

type FinalCtaProps = {
  /** When set (e.g. on homepage), primary CTA opens enrollment dialog instead of navigating to primaryHref. */
  onPrimaryEnroll?: () => void;
};

const primaryBtnClass =
  "group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-orange px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_oklch(0.7_0.18_45)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-10px_oklch(0.7_0.18_45)] sm:px-8 sm:py-4 sm:text-base";

export function FinalCta({ onPrimaryEnroll }: FinalCtaProps) {
  const data = useCmsSection<FinalCtaData>("final_cta", FALLBACK);
  const badges = data.badges?.length ? data.badges : FALLBACK.badges;

  return (
    <section className="relative bg-background py-10 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(0.42_0.13_330)] via-[oklch(0.36_0.14_340)] to-[oklch(0.28_0.10_355)] px-4 py-10 text-center shadow-2xl ring-1 ring-white/10 sm:rounded-[2rem] sm:px-10 sm:py-16 lg:px-12 lg:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-brand-orange/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-fuchsia-500/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage:
                "radial-gradient(ellipse at center, black 35%, transparent 75%)",
            }}
          />

          <div className="relative">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-brand-orange" />
              {data.eyebrow}
            </div>

            <h2 className="mt-5 text-[clamp(1.75rem,5.5vw,2.25rem)] font-bold leading-[1.15] tracking-tight text-white sm:mt-6 sm:text-4xl lg:text-[52px] lg:leading-[1.05]">
              {data.titleStart}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-brand-orange via-amber-300 to-brand-orange bg-clip-text text-transparent">
                  {data.titleHighlight}
                </span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-1.5 h-[3px] rounded-full bg-gradient-to-r from-transparent via-brand-orange to-transparent"
                />
              </span>
              {data.titleEnd}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:mt-5 sm:text-lg">
              {data.description}
            </p>

            <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
              {onPrimaryEnroll ? (
                <button
                  type="button"
                  onClick={onPrimaryEnroll}
                  className={primaryBtnClass}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full"
                  />
                  <span className="relative">{data.primaryLabel}</span>
                  <ArrowRight className="relative h-5 w-5 transition group-hover/btn:translate-x-1" />
                </button>
              ) : (
                <a href={data.primaryHref} className={primaryBtnClass}>
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full"
                  />
                  <span className="relative">{data.primaryLabel}</span>
                  <ArrowRight className="relative h-5 w-5 transition group-hover/btn:translate-x-1" />
                </a>
              )}
              {/* Secondary CTA disabled — retain layout/copy until re-enabled */}
              <span
                aria-disabled="true"
                className="pointer-events-none inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/80 backdrop-blur-sm select-none sm:px-7 sm:py-4 sm:text-base"
              >
                {data.secondaryLabel}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-white/85 sm:mt-10 sm:gap-x-8 sm:text-sm">
              {badges.map((label, i) => {
                const Icon = BADGE_ICONS[i % BADGE_ICONS.length];
                const color = BADGE_COLORS[i % BADGE_COLORS.length];
                return (
                  <span
                    key={`${label}-${i}`}
                    className="inline-flex items-center gap-2"
                  >
                    <Icon className={`h-4 w-4 ${color}`} />
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
