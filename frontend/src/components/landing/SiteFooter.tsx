import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import techuLogoStacked from "@/assets/techu-logo-stacked.png";
import { useCmsSection } from "@/hooks/useCmsSection";
import { resolveAssetUrl, type SiteFooterData } from "@/lib/api";

const FALLBACK: SiteFooterData = {
  logoUrl: "",
  description:
    "Step confidently toward your personal and professional goals with TechU — your reliable guide to mastering in-demand tech skills with offline & online training.",
  bullets: [
    "500+ Learner Reviews",
    "4.95 Average Rating",
    "100% Satisfied Students",
  ],
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
    { label: "Contact", href: "/#contact" },
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

export function SiteFooter() {
  const data = useCmsSection<SiteFooterData>("site_footer", FALLBACK);
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
  const socials = [
    { Icon: Linkedin, label: "LinkedIn", href: data.socials?.linkedin },
    { Icon: Facebook, label: "Facebook", href: data.socials?.facebook },
    { Icon: Instagram, label: "Instagram", href: data.socials?.instagram },
    { Icon: Youtube, label: "YouTube", href: data.socials?.youtube },
  ].filter((s) => s.href);
  const phoneTel = data.phone.replace(/\s+/g, "");

  return (
    <footer className="bg-[oklch(0.18_0.02_260)] text-white">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="rounded-2xl bg-white/95 p-3 inline-block sm:p-4">
              <img
                src={logo}
                alt="TechU Innovation Labs"
                className="h-20 w-auto object-contain sm:h-24 lg:h-28"
              />
            </div>
            <p className="mt-5 text-sm leading-relaxed text-white/70">
              {data.description}
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {data.bullets.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.75_0.15_165)]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Courses</h3>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              {data.coursesLinks.map((c) => (
                <li key={c.label}>
                  <Link
                    to={c.to}
                    search={(c.search ?? {}) as never}
                    className="hover:text-white transition"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/courses" className="hover:text-white transition">
                  Browse all courses →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Company</h3>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              {companyLinks.map((c) => (
                <li key={c.label}>
                  <a href={c.href} className="hover:text-white transition">
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <ul className="mt-5 space-y-3 text-sm text-white/80">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[oklch(0.75_0.15_165)]" />
                <a
                  href={`mailto:${data.email}`}
                  className="hover:text-white transition"
                >
                  {data.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[oklch(0.75_0.15_165)]" />
                <a
                  href={`tel:${phoneTel}`}
                  className="hover:text-white transition"
                >
                  {data.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-[oklch(0.75_0.15_165)]" />
                <span className="whitespace-pre-line">{data.address}</span>
              </li>
            </ul>

            <div className="mt-6">
              <div className="text-sm text-white/70">Follow Us</div>
              <div className="mt-3 flex gap-3">
                {socials.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
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
