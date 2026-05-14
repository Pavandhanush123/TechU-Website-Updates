import { useCourse } from "./CourseContext";

export function DesignTools() {
  const course = useCourse();
  return (
    <section className="bg-background">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 lg:grid-cols-2">
        {/* Left: copy */}
        <div className="flex items-center px-4 py-10 sm:px-10 sm:py-16 lg:px-16 lg:py-24">
          <div className="max-w-md">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-purple">
              {course.toolsEyebrow}
            </span>
            <h2 className="mt-3 text-[clamp(1.75rem,5vw,2.25rem)] font-extrabold tracking-tight text-foreground sm:text-4xl">
              {course.toolsTitle}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-base">
              {course.toolsCopy}
            </p>
          </div>
        </div>

        {/* Right: tool grid */}
        <div
          className="flex items-center justify-center px-4 py-10 sm:px-10 sm:py-16 lg:py-24"
          style={{
            background: "linear-gradient(120deg, #B13A89 0%, #971C00 100%)",
          }}
        >
          <div className="grid w-full max-w-md grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
            {course.tools.map((t, i) => (
              <div
                key={i}
                title={t.name}
                className="flex aspect-square items-center justify-center rounded-xl bg-white shadow-lg sm:rounded-2xl"
              >
                {t.el}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
