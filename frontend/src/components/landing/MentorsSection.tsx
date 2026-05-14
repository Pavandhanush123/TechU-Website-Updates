import { Award, UserRound } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useCmsSection } from "@/hooks/useCmsSection";
import { type MentorsSectionData } from "@/lib/api";

const FALLBACK: MentorsSectionData = {
  title: "Learn from Industry Experts",
  subtitle:
    "Our mentors are working professionals from top tech companies with 10+ years of experience",
  items: [
    {
      name: "Vishal",
      role: "Full Stack Trainer",
      expertise:
        "End-to-end web development · Live mentorship · Industry-aligned projects",
      years: "Expert Mentor",
      image: "",
    },
    {
      name: "Tirupathi Rao",
      role: "Full Stack Trainer",
      expertise:
        "Modern stacks · Backend & frontend fundamentals · Hands-on labs",
      years: "Expert Mentor",
      image: "",
    },
    {
      name: "Sai Krishna Jeedipalli",
      role: "UI/UX Trainer",
      expertise: "Figma, UX research, product design",
      years: "Expert Mentor",
      image: "",
    },
    {
      name: "PAVAN Kumar",
      role: "Data Analytics & AI/ML Trainer",
      expertise: "ML, DL, computer vision",
      years: "2 years · ML Engineer",
      image: "",
    },
  ],
};

const TRACK_LABELS = [
  "Full Stack",
  "Full Stack",
  "UI/UX",
  "Data & AI/ML",
] as const;

export function MentorsSection() {
  const data = useCmsSection<MentorsSectionData>("mentors", FALLBACK);
  const items = data.items?.length ? data.items : FALLBACK.items;

  return (
    <section
      id="mentors"
      className="scroll-mt-24 bg-background py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-[40px]">
            {data.title.includes("Industry Experts") ? (
              <>
                Learn from{" "}
                <span className="text-brand-purple">Industry Experts</span>
              </>
            ) : (
              data.title
            )}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            {data.subtitle}
          </p>
        </div>

        <Reveal className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          {items.map((m, idx) => (
            <article
              key={`${m.name}-${idx}`}
              className="overflow-hidden rounded-3xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] ring-1 ring-border transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative flex min-h-[15rem] flex-col justify-end gap-3 bg-gradient-to-br from-brand-purple/20 via-brand-purple/10 to-brand-orange/10 p-5 sm:min-h-[17rem] sm:p-6 lg:min-h-[19rem]">
                <div className="grid w-full shrink-0 grid-cols-2 gap-2">
                  <div
                    className="flex h-9 min-h-9 items-center justify-center rounded-full border border-brand-purple/30 bg-white/90 px-2 text-[9px] font-bold uppercase leading-none tracking-wide text-brand-purple sm:h-10 sm:min-h-10 sm:px-2 sm:text-[10px]"
                    title={TRACK_LABELS[idx] ?? `Mentor ${idx + 1}`}
                  >
                    <span className="block w-full truncate text-center">
                      {TRACK_LABELS[idx] ?? `Mentor ${idx + 1}`}
                    </span>
                  </div>
                  <span
                    className="flex h-9 min-h-9 items-center justify-center gap-1 rounded-full bg-brand-orange px-1.5 text-[9px] font-semibold leading-none text-white shadow-md sm:h-10 sm:min-h-10 sm:gap-1 sm:px-2 sm:text-[10px]"
                    title={m.years}
                  >
                    <Award className="h-2.5 w-2.5 shrink-0 opacity-95 sm:h-3 sm:w-3" />
                    <span className="min-w-0 flex-1 truncate text-center">{m.years}</span>
                  </span>
                </div>
                <span className="absolute right-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-brand-purple/25 bg-white/80 text-brand-purple sm:h-14 sm:w-14">
                  <UserRound className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="text-lg font-bold text-foreground sm:text-xl">
                  {m.name}
                </h3>
                <p className="mt-1.5 text-sm font-semibold text-brand-purple sm:text-base">
                  {m.role}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {m.expertise}
                </p>
              </div>
            </article>
          ))}
        </Reveal>

        <div className="mt-12 flex justify-center">
          <a
            href="/#contact"
            className="rounded-full border-2 border-brand-purple px-8 py-3 text-base font-semibold text-brand-purple transition hover:bg-brand-purple hover:text-white"
          >
            Become a Mentor
          </a>
        </div>
      </div>
    </section>
  );
}
