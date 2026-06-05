import {
  MapPin,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import techuLogoStacked from "@/assets/techu-logo-stacked.png";
import { useCmsSection } from "@/hooks/useCmsSection";
import {
  MENTORS_SECTION_DISABLED_FALLBACK,
  resolveAssetUrl,
  isMentorsSectionPublished,
  type MentorsSectionData,
  type SiteFooterData,
} from "@/lib/api";

const FALLBACK: SiteFooterData = {
  logoUrl: "",
  description:
    "Step confidently toward your personal and professional goals with TechU — your reliable guide to mastering in-demand tech skills with offline & online training.",
  coursesLinks: [
    {
      label: "Full Stack Development",
      to: "/course-detail",
      search: { course: "fullstack" },
    },
    {
      label: "Data Analytics with AI / ML",
      to: "/course-detail",
      search: { course: "data-analytics" },
    },
    {
      label: "UI/UX Design",
      to: "/course-detail",
      search: { course: "uiux" },
    },
  ],
  companyLinks: [
    { label: "About Us", href: "/#contact" },
    { label: "Our Trainers", href: "/#mentors" },
    { label: "Success Stories", href: "/#stories" },
    { label: "Blog", href: "/blog" },
    { label: "Webinars", href: "/#webinars" },
  ],
  email: "info@techu.in",
  phone: "+91 90001 44281",
  address: "101, Images Capital Park,\nMadhapur, Hyderabad, 500081",
  socials: {
    linkedin:
      "https://www.linkedin.com/company/techu-innovation-labs/?viewAsMember=true",
    facebook: "https://www.facebook.com/techutraining",
    instagram: "https://www.instagram.com/techu_in/",
    youtube: "https://www.youtube.com/@TechU_In",
  },
  copyright: "© 2026 TechU Innovation Labs. All rights reserved.",
};

/** Brand-colored chips so controls read clearly on the dark footer. */
const SOCIAL_CHIP: Record<string, string> = {
  LinkedIn:
    "bg-[#0A66C2] text-white shadow-md ring-1 ring-white/35 hover:bg-[#084d9c] hover:ring-white/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
  Facebook:
    "bg-[#1877F2] text-white shadow-md ring-1 ring-white/35 hover:bg-[#1367d7] hover:ring-white/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
  Instagram:
    "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white shadow-md ring-1 ring-white/35 hover:brightness-110 hover:ring-white/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
  YouTube:
    "bg-[#ff0000] text-white shadow-md ring-1 ring-white/35 hover:bg-[#e60000] hover:ring-white/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
};

const SOCIAL_CHIP_FALLBACK =
  "bg-white text-[oklch(0.22_0.04_260)] shadow-md ring-1 ring-white/40 hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.75_0.15_165)]";

/** Legacy Company column "Contact" → #contact (removed from UI; keep filter for old CMS payloads). */
function isRemovedCompanyContactLink(link: { label: string; href: string }) {
  if (link.label !== "Contact") return false;
  const h = link.href.trim();
  return h === "/#contact" || h === "#contact" || h.endsWith("/#contact");
}

function linkPointsToMentorsSection(link: { href: string }) {
  return link.href.includes("#mentors");
}

export function SiteFooter() {
  const navigate = useNavigate();
  const data = useCmsSection<SiteFooterData>("site_footer", FALLBACK);
  const mentorsCfg = useCmsSection<MentorsSectionData>(
    "mentors",
    MENTORS_SECTION_DISABLED_FALLBACK,
  );
  const logo =
    data.logoUrl && data.logoUrl.trim()
      ? resolveAssetUrl(data.logoUrl)
      : techuLogoStacked;
  // Make sure the Blog page is always reachable from the footer, even on
  // installs whose `site_footer` data was seeded before /blog existed.
  const companyLinks = data.companyLinks?.some((c) => c.href === "/blog")
    ? data.companyLinks
    : [
        ...(data.companyLinks ?? []),
        { label: "Blog", href: "/blog" },
      ];
  const companyLinksVisible = companyLinks
    .filter((c) => !isRemovedCompanyContactLink(c))
    .filter(
      (c) =>
        isMentorsSectionPublished(mentorsCfg) ||
        !linkPointsToMentorsSection(c),
    );
  const socials = [
    { Icon: Linkedin, label: "LinkedIn", href: data.socials?.linkedin },
    { Icon: Facebook, label: "Facebook", href: data.socials?.facebook },
    { Icon: Instagram, label: "Instagram", href: data.socials?.instagram },
    { Icon: Youtube, label: "YouTube", href: data.socials?.youtube },
  ].filter((s) => s.href);
  const phoneTel = data.phone.replace(/\s+/g, "");

  return (
    <footer className="bg-[oklch(0.18_0.02_260)] text-white">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:gap-y-12 lg:grid-cols-12 lg:items-start lg:gap-x-10 lg:gap-y-12 xl:gap-x-12">
          <div className="min-w-0 lg:col-span-4">
            <div className="inline-block rounded-2xl bg-white/95 p-3 sm:p-4">
              <img
                src={logo}
                alt="TechU Innovation Labs"
                className="h-20 w-auto object-contain sm:h-24 lg:h-28"
              />
            </div>
            <p className="mt-5 max-w-prose text-pretty text-sm leading-relaxed text-white/70 lg:max-w-none">
              {data.description}
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 items-start gap-10 min-[480px]:grid-cols-2 min-[480px]:gap-x-8 min-[480px]:gap-y-10 lg:col-span-8 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-0 xl:gap-x-10">
            <div className="flex min-w-0 flex-col">
              <h3 className="border-b border-white/10 pb-3 text-lg font-semibold leading-tight">
                Courses
              </h3>
              <ul className="mt-4 list-none space-y-2.5 p-0 text-sm leading-snug text-white/70">
                {data.coursesLinks.map((c) => (
                  <li key={c.label}>
                    <Link
                      to={c.to}
                      search={(c.search ?? {}) as never}
                      className="inline-block hover:text-white transition"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href="/courses"
                    className="inline-block font-medium text-[oklch(0.82_0.12_165)] hover:text-white transition"
                    target="_self"
                    onClick={(e) => {
                      if (e.defaultPrevented) return;
                      if (
                        e.button !== 0 ||
                        e.metaKey ||
                        e.ctrlKey ||
                        e.shiftKey ||
                        e.altKey
                      ) {
                        return;
                      }
                      e.preventDefault();
                      void navigate({ to: "/courses" });
                    }}
                  >
                    Browse all courses →
                  </a>
                </li>
              </ul>
            </div>

            <div className="flex min-w-0 flex-col">
              <h3 className="border-b border-white/10 pb-3 text-lg font-semibold leading-tight">
                Company
              </h3>
              <ul className="mt-4 list-none space-y-2.5 p-0 text-sm leading-snug text-white/70">
                {companyLinksVisible.map((c) => (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      className="inline-block hover:text-white transition"
                    >
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex min-w-0 flex-col min-[480px]:col-span-2 lg:col-span-1">
              <h3 className="border-b border-white/10 pb-3 text-lg font-semibold leading-tight">
                Contact Us
              </h3>
              <ul className="mt-4 list-none space-y-3 p-0 text-sm text-white/80">
                <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <a
                    href={`mailto:${data.email}`}
                    className="whitespace-nowrap hover:text-white transition"
                  >
                    {data.email}
                  </a>
                  <span className="text-white/35 select-none" aria-hidden>
                    ·
                  </span>
                  <a
                    href={`tel:${phoneTel}`}
                    className="whitespace-nowrap hover:text-white transition"
                  >
                    {data.phone}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.75_0.15_165)]" />
                  <span className="whitespace-pre-line">{data.address}</span>
                </li>
              </ul>

              <div className="mt-4 flex min-w-0 flex-nowrap items-center gap-2 sm:gap-3">
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.82_0.12_165)] sm:text-xs">
                  Follow us
                </span>
                <div className="flex min-w-0 flex-nowrap items-center gap-1.5">
                  {socials.map(({ Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition sm:h-8 sm:w-8 ${SOCIAL_CHIP[label] ?? SOCIAL_CHIP_FALLBACK}`}
                    >
                      <Icon
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                        aria-hidden
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 flex flex-col gap-4 text-xs text-white/60 sm:mt-14 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <p>{data.copyright}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 sm:gap-8">
            <a
              href={`mailto:${data.email}`}
              className="hover:text-white transition"
            >
              Contact
            </a>
            <a
              href={`tel:${phoneTel}`}
              className="hover:text-white transition"
            >
              Call us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
