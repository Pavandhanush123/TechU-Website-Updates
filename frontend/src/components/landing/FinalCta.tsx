import { ArrowRight, CreditCard, ShieldCheck, Clock } from "lucide-react";
import { useCmsSection } from "@/hooks/useCmsSection";
import type { FinalCtaData } from "@/lib/api";

const FALLBACK: FinalCtaData = {
  titleStart: "Ready to Start Your ",
  titleHighlight: "Tech Journey?",
  titleEnd: "",
  description:
    "Join thousands of students who have transformed their careers. Limited seats available for the 2026 batch.",
  primaryLabel: "Enroll Now — Limited Seats",
  primaryHref: "#contact",
  badges: ["EMI options available", "Money-back guarantee"],
};

const BADGE_ICONS = [CreditCard, ShieldCheck, Clock];

type FinalCtaProps = {
  /** When set (e.g. on homepage), primary CTA opens enrollment dialog instead of navigating to primaryHref. */
  onPrimaryEnroll?: () => void;
};

export function FinalCta({ onPrimaryEnroll }: FinalCtaProps) {
  const data = useCmsSection<FinalCtaData>("final_cta", FALLBACK);
  const badges = data.badges?.length ? data.badges : FALLBACK.badges;
  const title = `${data.titleStart}${data.titleHighlight}${data.titleEnd}`;

  const primaryBtnClass =
    "group/btn inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-brand-purple shadow-lg transition hover:-translate-y-0.5 hover:bg-white/95 sm:px-8 sm:py-4 sm:text-base";

  return (
    <section className="bg-background py-10 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-brand-gradient px-6 py-12 text-center shadow-xl ring-1 ring-black/5 sm:rounded-[2rem] sm:px-10 sm:py-16 lg:py-20">
          <h2 className="text-[clamp(1.6rem,5.5vw,2.25rem)] font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[44px]">
            {title}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:mt-5 sm:text-lg">
            {data.description}
          </p>

          <div className="mt-8 flex justify-center sm:mt-10">
            {onPrimaryEnroll ? (
              <button
                type="button"
                onClick={onPrimaryEnroll}
                className={primaryBtnClass}
              >
                {data.primaryLabel}
                <ArrowRight className="h-5 w-5 transition group-hover/btn:translate-x-1" />
              </button>
            ) : (
              <a href={data.primaryHref} className={primaryBtnClass}>
                {data.primaryLabel}
                <ArrowRight className="h-5 w-5 transition group-hover/btn:translate-x-1" />
              </a>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-white/85 sm:mt-8 sm:text-sm">
            {badges.map((label, i) => {
              const Icon = BADGE_ICONS[i % BADGE_ICONS.length];
              return (
                <span key={`${label}-${i}`} className="inline-flex items-center">
                  {i > 0 && (
                    <span aria-hidden className="mr-3 text-white/40">
                      •
                    </span>
                  )}
                  <Icon className="mr-1.5 h-4 w-4 text-white/80" />
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
