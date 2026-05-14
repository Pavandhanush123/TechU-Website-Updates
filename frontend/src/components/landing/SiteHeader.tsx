import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import techuLogo from "@/assets/techu-logo.png";
import { useCmsSection } from "@/hooks/useCmsSection";
import { resolveAssetUrl, type SiteHeaderData } from "@/lib/api";

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
        className="h-9 w-auto object-contain sm:h-11 lg:h-12"
      />
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const data = useCmsSection<SiteHeaderData>("site_header", FALLBACK);

  return (
    <header className="bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:py-4 sm:px-6 lg:px-10">
        <Logo src={data.logoUrl} />

        <nav className="hidden items-center gap-8 lg:flex">
          {data.nav.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className="text-[15px] font-medium text-foreground/80 transition hover:text-brand-purple"
                activeProps={{
                  className:
                    "text-[15px] font-medium text-brand-purple underline decoration-2 underline-offset-8 transition",
                }}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="text-[15px] font-medium text-foreground/80 transition hover:text-brand-purple"
              >
                {item.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={data.ctaHref}
            className="flex items-center gap-2 rounded-lg border border-brand-purple px-4 py-2 text-sm font-medium text-brand-purple transition hover:bg-brand-purple/5"
          >
            {data.ctaLabel}
            <span className="border-l border-brand-purple/40 pl-2">
              <ChevronDown className="h-4 w-4" />
            </span>
          </a>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-white lg:hidden">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-1 px-4 py-3">
            {data.nav.map((item) =>
              item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-[15px] font-medium text-foreground/80 hover:bg-muted"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-[15px] font-medium text-foreground/80 hover:bg-muted"
                >
                  {item.label}
                </a>
              ),
            )}
            <a
              href={data.ctaHref}
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-lg border border-brand-purple px-3 py-2 text-center text-sm font-medium text-brand-purple"
            >
              {data.ctaLabel}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
