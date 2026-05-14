import { useState } from "react";
import { Calendar, Clock, Users } from "lucide-react";
import { DemoRequestDialog } from "@/components/landing/DemoRequestDialog";
import { Reveal } from "@/components/Reveal";
import { useCmsSection } from "@/hooks/useCmsSection";
import type { WebinarsData } from "@/lib/api";

const FALLBACK: WebinarsData = {
  title: "Upcoming Webinars & Events",
  subtitle:
    "Join live sessions with industry experts and get your questions answered",
  items: [
    {
      title: "Getting Started with AI/ML in 2026",
      date: "May 10, 2026",
      time: "6:00 PM IST",
      attendees: "1,234",
      hostName: "Rajesh Sharma",
      hostRole: "AI/ML Lead at Google",
      badge: "Free",
    },
    {
      title: "Build a Full-Stack App with Claude AI",
      date: "May 17, 2026",
      time: "7:00 PM IST",
      attendees: "986",
      hostName: "Priya Verma",
      hostRole: "Principal Engineer at Microsoft",
      badge: "Free",
    },
    {
      title: "UI/UX Design Trends for 2026",
      date: "May 24, 2026",
      time: "6:30 PM IST",
      attendees: "1,420",
      hostName: "Ananya Reddy",
      hostRole: "Senior UX Designer at Meta",
      badge: "Free",
    },
  ],
};

export function WebinarsSection() {
  const data = useCmsSection<WebinarsData>("webinars", FALLBACK);
  const items = Array.isArray(data.items) ? data.items : FALLBACK.items;
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<string | undefined>(undefined);

  return (
    <section
      id="webinars"
      className="scroll-mt-24 bg-background py-10 sm:py-12"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-brand-gradient px-4 py-10 sm:rounded-3xl sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-[40px]">
              {data.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/90 sm:text-base">
              {data.subtitle}
            </p>
          </div>

          <Reveal className="mt-10 grid gap-5 sm:mt-12 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-white/20 bg-white/10 px-6 py-10 text-center text-sm text-white/90 sm:text-base">
                No webinars scheduled right now. New sessions will appear here
                when added in the admin content editor.
              </div>
            ) : (
              items.map((w, i) => (
              <article
                key={
                  w.id || `${w.title}::${w.date}::${w.time}::${i}`
                }
                className="flex flex-col rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 sm:p-6"
              >
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-brand-purple/10 px-3 py-1 text-xs font-semibold text-brand-purple">
                    {w.badge}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {w.attendees}
                  </span>
                </div>

                <h3 className="mt-5 min-h-[3.5rem] text-xl font-bold leading-snug text-foreground">
                  {w.title}
                </h3>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {w.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {w.time}
                  </span>
                </div>

                <div className="my-5 h-px bg-border" />

                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">Hosted by</p>
                  <p className="mt-1 font-bold text-foreground">{w.hostName}</p>
                  <p className="text-sm font-semibold text-brand-purple">
                    {w.hostRole}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTopic(w.title);
                    setOpen(true);
                  }}
                  className="mt-auto w-full rounded-xl bg-brand-orange px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Register Now
                </button>
              </article>
              ))
            )}
          </Reveal>
        </div>
      </div>
      <DemoRequestDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setTopic(undefined);
        }}
        topic={topic}
      />
    </section>
  );
}
