import { Star } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useCmsSection } from "@/hooks/useCmsSection";
import { type TestimonialsSectionData } from "@/lib/api";

type Story = TestimonialsSectionData["items"][number];

const FALLBACK: TestimonialsSectionData = {
  title: "Success Stories",
  subtitle: "Hear from our graduates who transformed their careers",
  items: [
    {
      name: "CC Traders",
      role: "Google Reviewer",
      company: "Google Reviews",
      rating: "★ 5.0",
      quote:
        "TechU has been a game-changer for my career. Real-world projects and placement support helped me build confidence.",
      avatar: "",
    },
    {
      name: "Naveen Guntuka",
      role: "Local Guide, Google Reviewer",
      company: "Google Reviews",
      rating: "★ 5.0",
      quote:
        "TechU Innovation Labs is an outstanding place for anyone passionate about technology and innovation.",
      avatar: "",
    },
    {
      name: "Vamshi",
      role: "Google Reviewer",
      company: "Google Reviews",
      rating: "★ 5.0",
      quote:
        "High-quality, industry-oriented IT training with a strong focus on practical, real-world learning.",
      avatar: "",
    },
    {
      name: "Amreen Unissa",
      role: "Google Reviewer",
      company: "Google Reviews",
      rating: "★ 5.0",
      quote:
        "Very professional and well-structured training. Mentors provide continuous support and explain concepts clearly.",
      avatar: "",
    },
    {
      name: "Siva Kumar",
      role: "Local Guide, Google Reviewer",
      company: "Google Reviews",
      rating: "★ 5.0",
      quote:
        "I joined TechU for training and got a placement that fits my skills. Interview preparation support was excellent.",
      avatar: "",
    },
    {
      name: "Gayatri Neruturi",
      role: "Google Reviewer",
      company: "Google Reviews",
      rating: "★ 5.0",
      quote:
        "Mentors teach MERN Stack from basics to advanced in an easy way. Overall, TechU is a great choice.",
      avatar: "",
    },
  ],
};

function StoryCard({ s }: { s: Story }) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] ring-1 ring-border transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <span className="text-base font-bold tracking-tight text-foreground">
          {s.company}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-sm italic leading-relaxed text-muted-foreground">
          "{s.quote}"
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <div className="font-bold text-foreground">{s.name}</div>
          <div className="text-sm text-muted-foreground">{s.role}</div>
        </div>
        <div className="text-2xl font-bold text-brand-purple">{s.rating}</div>
      </div>
    </article>
  );
}

export function SuccessStories() {
  const data = useCmsSection<TestimonialsSectionData>("testimonials", FALLBACK);
  const items = data.items?.length ? data.items : FALLBACK.items;

  return (
    <section
      id="stories"
      className="scroll-mt-24 bg-muted/40 py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-[44px]">
            {data.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            {data.subtitle}
          </p>
        </div>

        <Reveal className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {items.map((s, i) => (
            <StoryCard key={`${s.name}-${i}`} s={s} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
