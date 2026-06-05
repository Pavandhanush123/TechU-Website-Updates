import { useMemo, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import techuLogo from "@/assets/techu-logo.png";
import { useCmsSection } from "@/hooks/useCmsSection";
import {
  MENTORS_SECTION_DISABLED_FALLBACK,
  resolveAssetUrl,
  isMentorsSectionPublished,
  type MentorsSectionData,
  type SiteHeaderData,
} from "@/lib/api";

const FALLBACK: SiteHeaderData = {
  logoUrl: "",
  nav: [
    { label: "Courses", to: "/courses" },
    { label: "AI Programs", href: "/#programs" },
    { label: "Webinars", href: "/#webinars" },
    { label: "Mentors", href: "/#mentors" },
    { label: "Blog", to: "/blog" },
    { label: "Hire Talent", href: "/#contact" },
  ],
  ctaLabel: "Become a Mentor",
  ctaHref: "/#contact",
};

function Logo({ src }: { src: string }) {
  return (
    <Link
      to="/"
      className="flex items-center"
      aria-label="TechU Innovation Labs"
    >
      <img
        src={src ? resolveAssetUrl(src) : techuLogo}
        alt="TechU Innovation Labs"
        className="h-8 w-auto object-contain sm:h-10 lg:h-11"
      />
    </Link>
  );
}

function navItemPointsToMentors(item: SiteHeaderData["nav"][number]) {
  const href = item.href ?? "";
  const to = item.to ?? "";
  return href.includes("#mentors") || to.includes("#mentors");
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const data = useCmsSection<SiteHeaderData>("site_header", FALLBACK);
  const mentorsCfg = useCmsSection<MentorsSectionData>(
    "mentors",
    MENTORS_SECTION_DISABLED_FALLBACK,
  );
  const nav = useMemo(() => {
    if (isMentorsSectionPublished(mentorsCfg)) return data.nav;
    return data.nav.filter((item) => !navItemPointsToMentors(item));
  }, [data.nav, mentorsCfg.enabled]);

  return (
    <header className="bg-white">
      <div className="mx-auto flex max-w-page items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:py-3 sm:px-6 lg:gap-5 lg:px-8">
        <Logo src={data.logoUrl} />

        <nav className="hidden items-center gap-5 xl:gap-6 lg:flex">
          {nav.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className="text-[17px] font-medium text-foreground/80 transition hover:text-brand-purple"
                activeProps={{
                  className:
                    "text-[17px] font-medium text-brand-purple underline decoration-2 underline-offset-8 transition",
                }}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="text-[17px] font-medium text-foreground/80 transition hover:text-brand-purple"
              >
                {item.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={data.ctaHref}
            className="flex items-center gap-2 rounded-lg border border-brand-purple px-4 py-2.5 text-[17px] font-medium text-brand-purple transition hover:bg-brand-purple/5"
          >
            {data.ctaLabel}
            <span className="border-l border-brand-purple/40 pl-2">
              <ChevronDown className="h-4 w-4" />
            </span>
          </a>
          {/* TODO: wire to the LMS portal login when it's ready. No action for now. */}
          <button
            type="button"
            title="LMS login — coming soon"
            className="rounded-lg border border-brand-orange px-4 py-2.5 text-[17px] font-medium text-brand-orange transition hover:bg-brand-orange/5"
          >
            Login
          </button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {/* TODO: wire to the LMS portal login when it's ready. No action for now. */}
          <button
            type="button"
            title="LMS login — coming soon"
            className="rounded-lg border border-brand-orange px-3.5 py-2 text-sm font-medium text-brand-orange transition hover:bg-brand-orange/5"
          >
            Login
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground/80"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-white lg:hidden">
          <div className="mx-auto flex max-w-page flex-col gap-1 px-4 py-3 sm:px-6 lg:px-8">
            {nav.map((item) =>
              item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-base font-medium text-foreground/80 hover:bg-muted"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-md px-3 py-2.5 text-base font-medium text-foreground/80 hover:bg-muted"
                >
                  {item.label}
                </a>
              ),
            )}
            <a
              href={data.ctaHref}
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-lg border border-brand-purple px-3 py-2.5 text-center text-base font-medium text-brand-purple"
            >
              {data.ctaLabel}
            </a>
            {/* TODO: wire to the LMS portal login when it's ready. No action for now. */}
            <button
              type="button"
              title="LMS login — coming soon"
              onClick={() => setOpen(false)}
              className="block w-full rounded-lg border border-brand-orange px-3 py-2.5 text-center text-base font-medium text-brand-orange"
            >
              Login
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
