import { useCourse } from "./CourseContext";
import { Reveal } from "@/components/Reveal";

export function RealProjects() {
  const course = useCourse();
  const PROJECTS = course.projects;
  return (
    <section className="bg-background py-14 sm:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-brand-purple">
            {course.projectsEyebrow}
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,5vw,2.5rem)] font-bold tracking-tight text-foreground sm:text-5xl">
            {course.projectsTitle}
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            {course.projectsCopy}
          </p>
        </div>

        <Reveal className="mt-12 grid gap-6 md:grid-cols-3">
          {PROJECTS.map((p) => (
            <article
              key={p.title}
              className="overflow-hidden rounded-2xl bg-white ring-1 ring-border shadow-[0_2px_14px_rgba(0,0,0,0.05)] transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  width={800}
                  height={640}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-brand-purple shadow-sm">
                  {p.tag}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-foreground">{p.title}</h3>

                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-bold tracking-[0.14em] text-brand-purple">
                      PROBLEM
                    </p>
                    <p className="mt-1.5 text-muted-foreground">{p.problem}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-[0.14em] text-brand-purple">
                      PROCESS
                    </p>
                    <p className="mt-1.5 text-muted-foreground">{p.process}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-[0.14em] text-brand-purple">
                      OUTCOME
                    </p>
                    <p className="mt-1.5 text-muted-foreground">{p.outcome}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
