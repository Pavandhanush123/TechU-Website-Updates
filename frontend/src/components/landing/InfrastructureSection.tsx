import { Reveal } from "@/components/Reveal";
import { TechuOverviewVideo } from "@/components/landing/TechuOverviewVideo";
import { useCmsSection } from "@/hooks/useCmsSection";
import { type InfrastructureData } from "@/lib/api";

const FALLBACK: InfrastructureData = {
  titleLine1: "Where Real Learning Meets",
  titleHighlight: "Real Learning",
  titleLine2: "Real Infrastructure",
  subtitle:
    "Hand-picked courses designed by industry experts to help you land your dream tech job",
  body: "",
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
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <div className="text-center">
          <h2 className="text-[clamp(1.5rem,5vw,2rem)] font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-[44px]">
            {renderTitle()}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:mt-4 sm:text-base">
            {data.subtitle}
          </p>
        </div>

        <Reveal className="mt-8 grid items-start gap-8 sm:mt-14 sm:gap-10 lg:grid-cols-[minmax(0,40%)_minmax(0,60%)] lg:gap-12">
          <div className="order-2 min-w-0 lg:order-1">
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
          </div>

          <div className="relative order-1 w-full min-w-0 lg:order-2 lg:flex lg:justify-end lg:pl-1">
            <TechuOverviewVideo className="w-full max-w-[640px] lg:max-w-none" />
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
