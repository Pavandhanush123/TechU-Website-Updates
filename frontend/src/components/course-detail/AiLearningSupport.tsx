import {
  BarChart3,
  MessageSquare,
  FileText,
  UserCircle2,
  Target,
} from "lucide-react";
import mockup from "@/assets/ai-learning-mockup.jpg";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Personalized Learning Dashboard",
    desc: "Track your progress, identify strengths, and see exactly where to focus next.",
  },
  {
    icon: MessageSquare,
    title: "AI-Assisted Mock Interviews",
    desc: "Practice answering interview questions with AI-generated scenarios and feedback.",
  },
  {
    icon: FileText,
    title: "Project Feedback with AI Insights",
    desc: "Get detailed feedback on your projects — combining mentor reviews with AI analysis.",
  },
  {
    icon: UserCircle2,
    title: "Mentor + AI Guidance",
    desc: "Human mentors for strategy. AI assistance for speed. The best of both worlds.",
  },
  {
    icon: Target,
    title: "Skill Readiness Tracking",
    desc: "Know when you're job-ready with competency maps aligned to industry standards.",
  },
];

export function AiLearningSupport() {
  return (
    <section
      className="relative py-14 sm:py-16 lg:py-20"
      style={{
        background: "linear-gradient(120deg, #B13A89 0%, #971C00 100%)",
      }}
    >
      <div className="mx-auto grid max-w-page items-start gap-10 px-4 sm:gap-11 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
        {/* Left column: heading, copy, mockup aligned on one vertical edge */}
        <div className="min-w-0 max-w-xl">
          <h2 className="text-[clamp(1.75rem,5vw,2.25rem)] font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[40px]">
            AI-Powered Learning
            <br />
            &amp; Career Support
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-white/85 sm:text-base">
            Our learning experience is designed to support you — not overwhelm
            you. AI handles the repetitive parts so you can focus on growing in
            your craft.
          </p>

          <div className="mt-8 sm:mt-10">
            <img
              src={mockup}
              alt="AI-powered learning dashboard preview"
              loading="lazy"
              width={1024}
              height={768}
              className="h-auto w-full max-w-xl rounded-xl shadow-2xl"
            />
          </div>
        </div>

        {/* Right column: cards share width edge with column, top-aligned */}
        <div className="min-w-0 w-full max-w-xl justify-self-start lg:max-w-lg lg:justify-self-end xl:max-w-xl">
          <div className="flex flex-col gap-3.5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 rounded-2xl bg-white p-4 shadow-lg sm:p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10">
                  <f.icon className="h-5 w-5 text-brand-purple" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className="text-[15px] font-bold leading-snug text-foreground sm:text-base">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
