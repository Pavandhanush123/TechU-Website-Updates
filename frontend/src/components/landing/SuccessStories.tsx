import { Star } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useCmsSection } from "@/hooks/useCmsSection";
import { resolveAssetUrl, type TestimonialsSectionData } from "@/lib/api";

type Story = TestimonialsSectionData["items"][number];

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

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
  const avatarSrc = s.avatar && s.avatar.trim() ? resolveAssetUrl(s.avatar) : "";
  const lpa = s.lpa?.trim();
  // Show as "<n> LPA" (don't double up if the admin already typed "LPA").
  const lpaText = lpa ? (/lpa/i.test(lpa) ? lpa : `${lpa} LPA`) : "";

  return (
    <article className="group flex h-full flex-col rounded-2xl bg-white p-6 shadow-[0_4px_22px_rgba(0,0,0,0.07)] ring-1 ring-border transition hover:-translate-y-1 hover:shadow-2xl hover:ring-brand-purple/30 sm:p-7">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="h-5 w-5 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.75)]"
            />
          ))}
        </div>
        <span className="text-base font-bold tracking-tight text-foreground">
          {s.company}
        </span>
      </div>

      <blockquote className="mt-4 min-h-0 text-[15px] italic leading-relaxed text-muted-foreground">
        "{s.quote}"
      </blockquote>

      <div className="mt-auto flex shrink-0 items-center justify-between gap-3 border-t border-border/50 pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-purple/10 ring-2 ring-brand-purple/20">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={s.name}
                width={96}
                height={96}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-brand-purple">
                {initialsOf(s.name)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-bold leading-tight text-foreground">
              {s.name}
            </div>
            <div className="mt-0.5 truncate text-sm leading-snug text-muted-foreground">
              {s.role}
            </div>
          </div>
        </div>
        {lpaText ? (
          <div className="shrink-0 text-xl font-extrabold tracking-tight text-brand-purple tabular-nums sm:text-2xl">
            {lpaText}
          </div>
        ) : (
          <div className="shrink-0 text-2xl font-bold text-brand-purple tabular-nums">
            {s.rating}
          </div>
        )}
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
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
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
