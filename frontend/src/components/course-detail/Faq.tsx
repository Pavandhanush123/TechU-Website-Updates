import { useState } from "react";
import { ChevronDown } from "lucide-react";

export const FAQS = [
  {
    q: "Do I need prior coding experience?",
    a: "No prior coding experience is required. Our curriculum starts from the fundamentals and gradually builds up to advanced concepts, with mentor support at every step.",
  },
  {
    q: "What is the time commitment?",
    a: "Plan for around 10–12 hours per week including live sessions, assignments, and project work. The program is designed to fit alongside a full-time job or studies.",
  },
  {
    q: "Will I get job placement assistance?",
    a: "Yes. You'll receive 1:1 career coaching, portfolio reviews, mock interviews, and direct referrals to our 100+ hiring partners until you land a role.",
  },
  {
    q: "Are there EMI options available?",
    a: "Yes. We offer flexible no-cost EMI plans through our financing partners so you can pay in monthly installments that fit your budget.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-muted/40 py-14 sm:py-20">
      <div className="mx-auto max-w-[820px] px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-[clamp(1.75rem,5vw,2.5rem)] font-bold tracking-tight text-foreground sm:text-5xl">
          Frequently Asked Questions
        </h2>

        <div className="mt-12 space-y-4">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)]"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-base font-medium text-foreground sm:text-lg">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={[
                      "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                      isOpen ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </button>
                <div
                  className={[
                    "grid transition-all duration-300",
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  ].join(" ")}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
