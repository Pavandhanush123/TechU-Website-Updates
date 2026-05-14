import { PlayCircle } from "lucide-react";
import campusOffice from "@/assets/campus-office.jpg";
import { Reveal } from "@/components/Reveal";
import { useCmsSection } from "@/hooks/useCmsSection";
import { resolveAssetUrl, type InfrastructureData } from "@/lib/api";

const FALLBACK: InfrastructureData = {
  titleLine1: "Where Real Learning Meets",
  titleHighlight: "Real Learning",
  titleLine2: "Real Infrastructure",
  subtitle:
    "Hand-picked courses designed by industry experts to help you land your dream tech job",
  body: "Step into TechU — Hyderabad's premium AI and full-stack training institute — built with industry-grade classrooms, collaborative learning spaces, and real-time mentorship environments designed to simulate the modern workplace.",
  image: "",
  stats: [
    { label: "Graduate Placed", value: "500", suffix: "+" },
    { label: "Average Salary", value: "85k", suffix: "+" },
    { label: "Student Rating", value: "4.8", suffix: "/5" },
    { label: "Placement Rate", value: "98", suffix: "%" },
  ],
};

export function InfrastructureSection() {
  const data = useCmsSection<InfrastructureData>("infrastructure", FALLBACK);
  const stats = data.stats?.length ? data.stats : FALLBACK.stats;
  const posterImage =
    data.image && data.image.trim() ? resolveAssetUrl(data.image) : campusOffice;

  // Render the title with the highlighted phrase rendered in brand color when present
  const renderTitle = () => {
    const { titleLine1, titleHighlight, titleLine2 } = data;
    if (titleHighlight && titleLine1.includes(titleHighlight)) {
      const [before, after] = titleLine1.split(titleHighlight);
      return (
        <>
          {before}
          <span className="text-brand-purple">{titleHighlight}</span>
          {after} {titleLine2}
        </>
      );
    }
    return (
      <>
        {titleLine1} {titleLine2}
      </>
    );
  };

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">
        <div className="text-center">
          <h2 className="text-[clamp(1.5rem,5vw,2rem)] font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-[44px]">
            {renderTitle()}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:mt-4 sm:text-base">
            {data.subtitle}
          </p>
        </div>

        <Reveal className="mt-8 grid items-stretch gap-8 sm:mt-14 sm:gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-2">
              {stats.map((s, i) => (
                <div
                  key={`${s.label}-${i}`}
                  className={[
                    "p-4 sm:p-8 lg:p-10",
                    i % 2 === 0 ? "border-r border-border" : "",
                    i < 2 ? "border-b border-border" : "",
                  ].join(" ")}
                >
                  <div className="text-[11px] font-semibold text-foreground sm:text-sm">
                    {s.label}
                  </div>
                  <div className="mt-1.5 text-2xl font-bold sm:mt-3 sm:text-5xl lg:text-6xl">
                    <span className="text-brand-purple">{s.value}</span>
                    <span className="text-foreground">{s.suffix}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground sm:mt-10 sm:text-base">
              {data.body}
            </p>
          </div>

          <div className="relative order-1 lg:order-2 lg:h-full">
            <div className="h-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5 sm:rounded-3xl">
              <div className="relative aspect-[4/3] w-full lg:h-full lg:min-h-[420px]">
                <img
                  src={posterImage}
                  alt="Campus video placeholder background"
                  width={1024}
                  height={800}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-black/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
                  <PlayCircle className="h-14 w-14 text-brand-orange drop-shadow-md sm:h-16 sm:w-16" />
                  <p className="mt-4 text-lg font-bold tracking-tight sm:text-2xl">
                    Campus Video Coming Soon
                  </p>
                  <p className="mt-2 max-w-xs text-sm text-white/85 sm:max-w-sm sm:text-base">
                    We will add a real walkthrough video here soon.
                  </p>
                </div>
              </div>
            </div>
            <span
              aria-hidden
              className="absolute -top-4 -right-4 h-10 w-10 rounded-full bg-brand-orange/80 blur-xl"
            />
            <span
              aria-hidden
              className="absolute -bottom-3 -left-3 h-12 w-12 rounded-full bg-brand-purple/40 blur-xl"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
