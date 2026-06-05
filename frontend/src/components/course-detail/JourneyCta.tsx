import { useState } from "react";
import { useCourseName } from "./CourseContext";
import { ApplyDialog } from "./ApplyDialog";

export function JourneyCta() {
  const courseName = useCourseName();
  const [open, setOpen] = useState(false);
  return (
    <section className="py-10 sm:py-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-2xl px-4 py-12 text-center shadow-lg sm:rounded-3xl sm:px-12 sm:py-16"
          style={{
            background: "linear-gradient(120deg, #B13A89 0%, #971C00 100%)",
          }}
        >
          <h2 className="text-[clamp(1.5rem,5vw,2.25rem)] font-semibold text-white sm:text-4xl">
            Ready to Start Your Journey?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/90 sm:text-base">
            Join 500+ students who have transformed their careers with TechU.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-6 inline-block w-full rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-purple shadow-md transition hover:brightness-95 sm:mt-8 sm:w-auto sm:px-8 sm:py-3.5 sm:text-base"
          >
            Apply Now — Limited Seats
          </button>
        </div>
      </div>
      <ApplyDialog
        open={open}
        onOpenChange={setOpen}
        courseTitle={courseName}
        ctaLabel="Apply Now"
      />
    </section>
  );
}
