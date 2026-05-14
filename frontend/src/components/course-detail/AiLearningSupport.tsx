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
      <div className="mx-auto grid max-w-[1200px] gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-10 lg:px-8">
        {/* Left */}
        <div>
          <h2 className="text-[clamp(1.75rem,5vw,2.25rem)] font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[40px]">
            AI-Powered Learning
            <br />
            &amp; Career Support
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
            Our learning experience is designed to support you — not overwhelm
            you. AI handles the repetitive parts so you can focus on growing in
            your craft.
          </p>

          <div className="mt-10 flex justify-center lg:justify-start">
            <img
              src={mockup}
              alt="AI-powered learning dashboard preview"
              loading="lazy"
              width={1024}
              height={768}
              className="w-full max-w-[520px] rounded-xl shadow-2xl"
            />
          </div>
        </div>

        {/* Right: feature cards */}
        <div className="space-y-3.5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-lg"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10">
                <f.icon className="h-5 w-5 text-brand-purple" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground">
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
    </section>
  );
}
