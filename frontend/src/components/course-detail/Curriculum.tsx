import { useState } from "react";
import { ChevronDown, PlayCircle, FileText, Code2 } from "lucide-react";
import { useCourse } from "./CourseContext";
import { Reveal } from "@/components/Reveal";

const ICONS = { play: PlayCircle, doc: FileText, code: Code2 };

export function Curriculum() {
  const course = useCourse();
  const MODULES = course.modules;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-background py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[760px] px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-[clamp(1.75rem,5vw,2.25rem)] font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-[40px]">
            {course.curriculumTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {course.curriculumCopy}
          </p>
        </div>

        <Reveal className="mt-10 space-y-3">
          {MODULES.map((m, idx) => {
            const isOpen = open === idx;
            const lessonCount = m.items?.length ?? 0;
            const lessonLabel = `${lessonCount} lesson${lessonCount === 1 ? "" : "s"}`;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="flex w-full items-start gap-4 px-5 py-4 text-left"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 text-xs font-semibold text-brand-purple">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground sm:text-base">
                      {m.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      {m.desc}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-brand-orange">
                      <span className="inline-flex items-center gap-1.5">
                        <PlayCircle className="h-3.5 w-3.5" />
                        {lessonLabel}
                      </span>
                      <span className="text-muted-foreground">{m.weeks}</span>
                    </div>
                  </div>
                  <ChevronDown
                    className={[
                      "mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300",
                      isOpen ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-border/60 px-5 py-3">
                    {m.items && m.items.length > 0 ? (
                      m.items.map((item) => {
                        const Icon = ICONS[item.icon];
                        return (
                          <div
                            key={item.title}
                            className="flex items-center justify-between py-2.5 text-sm"
                          >
                            <span className="inline-flex items-center gap-3 text-foreground/85">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              {item.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.duration}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-2 text-xs text-muted-foreground italic">
                        Detailed lesson schedule for this module is provided in the course curriculum PDF and discussed in the live orientation session.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
