import { Award, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { useCmsSection } from "@/hooks/useCmsSection";
import {
  resolveAssetUrl,
  isMentorsSectionPublished,
  type MentorsSectionData,
} from "@/lib/api";

/** Photo in `J.vishal.jpg` is Vishal; `Vishal.jpg` is Tirupathi Rao. */
import imgJVishal from "../../../assets/trainers/J.vishal.jpg";
import imgSai from "../../../assets/trainers/Jeedipalli Saikrishna.jpg";
import imgPavan from "../../../assets/trainers/pavan-kumar.jpeg";
import imgTirupathi from "../../../assets/trainers/Vishal.jpg";

/** Default photos when CMS `image` is empty (bundled assets). Admin uploads override via `image` URL. */
const MENTOR_FALLBACK_PHOTO: Record<string, string> = {
  Vishal: imgJVishal,
  "Tirupathi Rao": imgTirupathi,
  "Sai Krishna Jeedipalli": imgSai,
  "Pavan Kumar": imgPavan,
};

const VISIBLE_LG = 4;

function mentorPhotoSrc(m: MentorsSectionData["items"][number]): string {
  const fromCms = m.image?.trim();
  if (fromCms) return resolveAssetUrl(fromCms);
  return MENTOR_FALLBACK_PHOTO[m.name] ?? "";
}

/** When `track` is missing from CMS (legacy rows), infer badge by position. */
const TRACK_FALLBACK = [
  "MERN Stack",
  "Full Stack",
  "UI/UX",
  "Data & AI/ML",
] as const;

function mentorTrackLabel(
  m: MentorsSectionData["items"][number],
  idx: number,
): string {
  const t = m.track?.trim();
  if (t) return t;
  if (idx < TRACK_FALLBACK.length) return TRACK_FALLBACK[idx];
  return "Mentor";
}

function chunkItems<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

const FALLBACK: MentorsSectionData = {
  enabled: false,
  title: "Learn from Industry Experts",
  subtitle:
    "Our mentors are working professionals from top tech companies with 10+ years of experience",
  items: [
    {
      name: "Vishal",
      role: "MERN STACK developer + trainer",
      expertise:
        "End-to-end web development · Live mentorship · Industry-aligned projects",
      years: "Expert Mentor",
      image: "",
      track: "MERN Stack",
    },
    {
      name: "Tirupathi Rao",
      role: "Full Stack Trainer",
      expertise:
        "Modern stacks · Backend & frontend fundamentals · Hands-on labs",
      years: "Expert Mentor",
      image: "",
      track: "Full Stack",
    },
    {
      name: "Sai Krishna Jeedipalli",
      role: "UI/UX Trainer",
      expertise: "Figma, UX research, product design",
      years: "Expert Mentor",
      image: "",
      track: "UI/UX",
    },
    {
      name: "Pavan Kumar",
      role: "Data Analytics & AI/ML Trainer",
      expertise:
        "Machine learning, deep learning, computer vision, and analytics pipelines",
      years: "2 years · ML Engineer",
      image: "",
      track: "Data & AI/ML",
    },
  ],
};

function MentorProfileCard({
  m,
  globalIdx,
}: {
  m: MentorsSectionData["items"][number];
  globalIdx: number;
}) {
  const photo = mentorPhotoSrc(m);
  const trackLabel = mentorTrackLabel(m, globalIdx);
  return (
    <article
      role="listitem"
      className="min-w-0"
      aria-labelledby={`mentor-name-${globalIdx}`}
    >
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] ring-1 ring-border transition hover:-translate-y-1 hover:shadow-xl">
        <div className="relative min-h-[15rem] overflow-hidden sm:min-h-[17rem] lg:min-h-[19rem]">
          {photo ? (
            <>
              <img
                src={photo}
                alt={`${m.name}, ${m.role}`}
                className="absolute inset-0 h-full w-full object-cover object-top"
                loading="lazy"
                decoding="async"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-purple/25 via-transparent to-brand-orange/15"
                aria-hidden
              />
            </>
          ) : (
            <>
              <div
                className="absolute inset-0 bg-gradient-to-br from-brand-purple/20 via-brand-purple/10 to-brand-orange/10"
                aria-hidden
              />
              <div className="absolute inset-0 flex items-center justify-center text-brand-purple/35">
                <UserRound
                  className="h-24 w-24 sm:h-28 sm:w-28"
                  aria-hidden
                />
              </div>
            </>
          )}
          <div className="relative z-10 flex min-h-[15rem] flex-col justify-end gap-3 p-5 sm:min-h-[17rem] sm:p-6 lg:min-h-[19rem]">
            <div className="grid w-full shrink-0 grid-cols-2 gap-2">
              <div
                className="flex h-9 min-h-9 items-center justify-center rounded-full border border-brand-purple/30 bg-white/90 px-2 text-[9px] font-bold uppercase leading-none tracking-wide text-brand-purple shadow-sm backdrop-blur-sm sm:h-10 sm:min-h-10 sm:px-2 sm:text-[10px]"
                title={trackLabel}
              >
                <span className="block w-full truncate text-center">
                  {trackLabel}
                </span>
              </div>
              <span
                className="flex h-9 min-h-9 items-center justify-center gap-1 rounded-full bg-brand-orange px-1.5 text-[9px] font-semibold leading-none text-white shadow-md sm:h-10 sm:min-h-10 sm:gap-1 sm:px-2 sm:text-[10px]"
                title={m.years}
              >
                <Award className="h-2.5 w-2.5 shrink-0 opacity-95 sm:h-3 sm:w-3" />
                <span className="min-w-0 flex-1 truncate text-center">
                  {m.years}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <h3
            id={`mentor-name-${globalIdx}`}
            className="text-lg font-bold text-foreground sm:text-xl"
          >
            {m.name}
          </h3>
          <p className="mt-1.5 text-sm font-semibold text-brand-purple sm:text-base">
            {m.role}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {m.expertise}
          </p>
        </div>
      </div>
    </article>
  );
}

export function MentorsSection() {
  const data = useCmsSection<MentorsSectionData>("mentors", FALLBACK);
  const published = isMentorsSectionPublished(data);
  const items = data.items?.length ? data.items : FALLBACK.items;
  const pages = useMemo(
    () => (published ? chunkItems(items, VISIBLE_LG) : []),
    [published, items],
  );
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (pages.length <= 1) return;
    setPageIndex(0);
  }, [pages.length]);

  useEffect(() => {
    if (pages.length <= 1) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const id = window.setInterval(() => {
      setPageIndex((p) => (p + 1) % pages.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [pages.length]);

  if (!published) return null;

  return (
    <section
      id="mentors"
      className="scroll-mt-24 bg-background py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-[40px]">
            {data.title.includes("Industry Experts") ? (
              <>
                Learn from{" "}
                <span className="text-brand-purple">Industry Experts</span>
              </>
            ) : (
              data.title
            )}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            {data.subtitle}
          </p>
        </div>

        <Reveal className="mt-10 sm:mt-12">
          {pages.length <= 1 ? (
            <div
              role="list"
              aria-label="Mentor profiles"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4"
            >
              {items.map((m, idx) => (
                <MentorProfileCard key={`${m.name}-${idx}`} m={m} globalIdx={idx} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden" aria-roledescription="carousel">
                <div
                  className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
                  style={{
                    width: `${pages.length * 100}%`,
                    transform: `translateX(-${(pageIndex * 100) / pages.length}%)`,
                  }}
                >
                  {pages.map((page, pi) => (
                    <div
                      key={pi}
                      className="shrink-0"
                      style={{ width: `${100 / pages.length}%` }}
                    >
                      <div
                        role="list"
                        aria-label={`Mentor profiles, page ${pi + 1} of ${pages.length}`}
                        className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4"
                      >
                        {page.map((m, idx) => {
                          const globalIdx = pi * VISIBLE_LG + idx;
                          return (
                            <MentorProfileCard
                              key={`${m.name}-${globalIdx}`}
                              m={m}
                              globalIdx={globalIdx}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="flex justify-center gap-2 pt-2"
                role="tablist"
                aria-label="Mentor carousel pages"
              >
                {pages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === pageIndex}
                    aria-label={`Show mentor page ${i + 1}`}
                    className={[
                      "h-2 w-2 rounded-full transition",
                      i === pageIndex
                        ? "bg-brand-purple"
                        : "bg-border hover:bg-muted-foreground/40",
                    ].join(" ")}
                    onClick={() => setPageIndex(i)}
                  />
                ))}
              </div>
            </div>
          )}
        </Reveal>

        <div className="mt-12 flex justify-center">
          <a
            href="/#contact"
            className="rounded-full border-2 border-brand-purple px-8 py-3 text-base font-semibold text-brand-purple transition hover:bg-brand-purple hover:text-white"
          >
            Become a Mentor
          </a>
        </div>
      </div>
    </section>
  );
}
