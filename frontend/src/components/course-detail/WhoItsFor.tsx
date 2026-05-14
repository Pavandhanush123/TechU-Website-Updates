import { useCourse } from "./CourseContext";

export function WhoItsFor() {
  const course = useCourse();
  const STATS = course.whoStats;
  return (
    <section
      id="who-it-is-for"
      className="relative bg-background pt-8 pb-16 lg:pt-12 lg:pb-20"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(124,58,237,0.18) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-purple">
            Who it's for
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-[40px]">
            {course.whoTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {course.whoCopy}
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="grid gap-5 sm:grid-cols-2">
            {STATS.map((s) => (
              <div
                key={s.percent + s.title}
                className="rounded-2xl bg-white p-6 shadow-[0_8px_30px_-12px_rgba(124,58,237,0.15)]"
              >
                <div className="text-3xl font-extrabold text-foreground">
                  {s.percent}
                </div>
                <p className="mt-3 text-base leading-snug text-foreground/80">
                  {s.title}
                </p>
                <p className="mt-5 text-sm font-semibold text-brand-purple">
                  → {s.note}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center lg:justify-end">
            <img
              src={course.heroImage}
              alt={`${course.metaTitle} preview`}
              loading="lazy"
              width={1024}
              height={1024}
              className="aspect-square w-full max-w-[420px] rounded-2xl object-cover shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
