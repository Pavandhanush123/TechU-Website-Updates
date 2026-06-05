import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** First clip served (exported from repo `video/Techu .mp4`). */
const DEFAULT_VIDEO = "/videos/techu-overview-part2.mp4";
/** Second clip after the first ends (original overview video). */
const DEFAULT_FOLLOW_UP = "/videos/techu-overview.mp4";
/** Frame grab from first-played MP4 (`techu-overview-part2.mp4`); regenerate via DEPLOYMENT.md if that file changes. */
const DEFAULT_POSTER = "/images/techu-overview-first-poster.jpg";

type TechuOverviewVideoProps = {
  className?: string;
  /** First clip — public URL (Vite serves `public/` from site root). */
  videoSrc?: string;
  /** Second clip — starts after the first ends. Use `""` to disable. */
  followUpVideoSrc?: string;
  posterSrc?: string;
  /** Assistive label for the first clip. */
  title?: string;
  /** Assistive label for the second clip. */
  followUpAriaLabel?: string;
};

/**
 * Two-part overview: after the first clip ends, the second MP4 loads and plays.
 *
 * **Performance:** `src` is empty until the block is near the viewport; `preload="none"`
 * until then so the homepage does not download large files during initial load.
 */
const TEXTS = {
  unsupportedVideo: "Your browser does not support embedded video.",
  downloadPart1: "Download part 1",
  downloadPart2: "Download part 2",
};

export function TechuOverviewVideo({
  className,
  videoSrc = DEFAULT_VIDEO,
  followUpVideoSrc = DEFAULT_FOLLOW_UP,
  posterSrc = DEFAULT_POSTER,
  title = "TechU overview — campus and programs walkthrough",
  followUpAriaLabel = "TechU overview — continuation",
}: TechuOverviewVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [enteredView, setEnteredView] = useState(false);
  const [phase, setPhase] = useState<1 | 2>(1);

  const followUp = followUpVideoSrc?.trim() ?? "";
  const hasFollowUp = followUp.length > 0;

  const activeSrc =
    enteredView ? (phase === 1 ? videoSrc : hasFollowUp ? followUp : videoSrc) : undefined;

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setEnteredView(true);
      },
      { rootMargin: "280px", threshold: 0.06 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== 2 || !hasFollowUp) return;
    const v = videoRef.current;
    if (!v) return;
    const playWhenReady = () => {
      void v.play().catch(() => {
        /* Autoplay can be blocked without a prior gesture; user can press play. */
      });
    };
    if (v.readyState >= 2) playWhenReady();
    else v.addEventListener("loadeddata", playWhenReady, { once: true });
  }, [phase, hasFollowUp]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-black/10 bg-zinc-950 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] ring-1 ring-black/10 sm:rounded-3xl",
        className,
      )}
    >
      <div className="relative aspect-video w-full bg-zinc-950">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          controls
          playsInline
          preload={enteredView ? "metadata" : "none"}
          poster={posterSrc}
          src={activeSrc}
          aria-label={phase === 1 ? title : followUpAriaLabel}
          onEnded={() => {
            if (phase === 1 && hasFollowUp) setPhase(2);
          }}
        >
          {TEXTS.unsupportedVideo}{" "}
          <a className="underline" href={videoSrc}>
            {TEXTS.downloadPart1}
          </a>
          {hasFollowUp ? (
            <>
              {" "}
              ·{" "}
              <a className="underline" href={followUp}>
                {TEXTS.downloadPart2}
              </a>
            </>
          ) : null}
          .
        </video>
      </div>
    </div>
  );
}
