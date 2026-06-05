import {
  MessageCircle,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";
import { useCmsSection } from "@/hooks/useCmsSection";
import type { AnnouncementBarData } from "@/lib/api";

const FALLBACK: AnnouncementBarData = {
  enabled: true,
  text: "Final Call: Admissions closing soon —",
  ctaLabel: "Apply now",
  ctaHref: "/#contact",
  suffix: "· Last 5 seats left",
  socials: {
    linkedin:
      "https://www.linkedin.com/company/techu-innovation-labs/?viewAsMember=true",
    facebook: "https://www.facebook.com/techutraining",
    instagram: "https://www.instagram.com/techu_in/",
    youtube: "https://www.youtube.com/@TechU_In",
  },
};

function Message({ data }: { data: AnnouncementBarData }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 px-6">
      <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        {data.text}{" "}
        <a
          href={data.ctaHref}
          className="inline-block rounded bg-white/15 px-2 py-0.5 font-semibold underline underline-offset-2 hover:bg-white/25"
        >
          {data.ctaLabel}
        </a>{" "}
        {data.suffix}
      </span>
    </span>
  );
}

export function AnnouncementBar() {
  const data = useCmsSection<AnnouncementBarData>("announcement_bar", FALLBACK);
  if (!data.enabled) return null;

  const socials = [
    { Icon: Linkedin, label: "LinkedIn", href: data.socials.linkedin },
    { Icon: Facebook, label: "Facebook", href: data.socials.facebook },
    { Icon: Instagram, label: "Instagram", href: data.socials.instagram },
    { Icon: Youtube, label: "YouTube", href: data.socials.youtube },
  ].filter((s) => s.href);

  return (
    <div className="bg-brand-gradient text-white">
      <div className="overflow-hidden py-2 text-xs sm:hidden">
        <div
          className="flex w-max animate-marquee whitespace-nowrap"
          aria-hidden="true"
        >
          <Message data={data} />
          <Message data={data} />
        </div>
        <span className="sr-only">
          {data.text} {data.ctaLabel}. {data.suffix}
        </span>
      </div>

      <div className="mx-auto hidden max-w-page items-center justify-between gap-4 px-6 py-2.5 text-sm sm:flex lg:px-10">
        <div className="hidden w-10 lg:block" aria-hidden />
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-center">
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            {data.text}{" "}
            <a
              href={data.ctaHref}
              className="inline-block rounded bg-white/15 px-2 py-0.5 font-semibold underline underline-offset-2 hover:bg-white/25"
            >
              {data.ctaLabel}
            </a>{" "}
            {data.suffix}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {socials.map(({ Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15 text-white transition hover:bg-white/25"
            >
              <Icon className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
