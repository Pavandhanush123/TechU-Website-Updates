import { useState } from "react";
import { Download } from "lucide-react";
import ctaTeam from "@/assets/cta-team.png";
import { BrochureDownloadDialog } from "@/components/course-detail/BrochureDownloadDialog";
import { useCmsSection } from "@/hooks/useCmsSection";
import { resolveAssetUrl, type CtaBannerData } from "@/lib/api";

const FALLBACK: CtaBannerData = {
  title: "Learn Tech Skills from best Industry Experts in Hyderabad",
  primaryLabel: "Apply Today",
  secondaryLabel: "Download Curriculum",
  image: "",
  brochureUrl: "/brochures/fullstack-brochure.pdf",
};

const scrollToContact = () => {
  const el = document.getElementById("contact");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  else window.location.hash = "#contact";
};

export function CtaBanner() {
  const data = useCmsSection<CtaBannerData>("cta_banner", FALLBACK);
  const image = data.image && data.image.trim() ? resolveAssetUrl(data.image) : ctaTeam;
  const [brochureOpen, setBrochureOpen] = useState(false);

  return (
    <section className="bg-background py-10 sm:py-12">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-brand-gradient sm:rounded-3xl">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-brand-grid opacity-30"
          />
          <div className="relative grid items-end gap-8 px-5 pt-10 sm:gap-10 sm:px-10 sm:pt-12 lg:grid-cols-2 lg:items-stretch lg:gap-0 lg:px-0 lg:pt-0">
            <div className="text-white text-center lg:text-left lg:self-center lg:py-14 lg:pl-16 lg:pr-6">
              <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl lg:text-[44px]">
                {data.title}
              </h2>

              <div className="mt-7 flex w-full flex-col items-stretch gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 lg:justify-start justify-center">
                <button
                  type="button"
                  onClick={scrollToContact}
                  className="rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-brand-purple shadow-md transition hover:bg-white/90 sm:px-7 sm:text-base"
                >
                  {data.primaryLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setBrochureOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/70 bg-transparent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:px-7 sm:text-base"
                >
                  <Download className="h-4 w-4" />
                  {data.secondaryLabel}
                </button>
              </div>
            </div>

            <div className="relative w-full overflow-hidden lg:h-full lg:min-h-[280px]">
              <img
                src={image}
                alt="TechU mentors and students"
                width={643}
                height={362}
                loading="lazy"
                className="block aspect-[16/9] w-full object-cover object-bottom sm:aspect-[2/1] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full lg:w-full"
              />
            </div>
          </div>
        </div>
      </div>
      <BrochureDownloadDialog
        open={brochureOpen}
        onOpenChange={setBrochureOpen}
        courseTitle="TechU Programs"
        brochureUrl={data.brochureUrl}
      />
    </section>
  );
}
