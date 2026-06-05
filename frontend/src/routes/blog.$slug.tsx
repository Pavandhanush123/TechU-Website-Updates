import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  Clock,
  Linkedin,
  Link as LinkIcon,
  Sparkles,
  Twitter,
  User as UserIcon,
} from "lucide-react";
import { AnnouncementBar } from "@/components/landing/AnnouncementBar";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import {
  getPublicBlogPost,
  listPublicBlogPosts,
  resolveAssetUrl,
  type BlogPost,
  type BlogPostListItem,
} from "@/lib/api";
import { useSeo } from "@/lib/seo";
import { markdownToHtml } from "@/lib/markdown";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogDetail,
});

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function readingMinutes(body: string): number {
  // 220 wpm — typical adult silent reading speed for non-technical prose.
  // Round up so a 1-minute post doesn't show "0 min".
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function BlogDetail() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [allPosts, setAllPosts] = useState<BlogPostListItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "missing" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setStatus("loading");
    setProgress(0);
    void (async () => {
      const [postRes, allRes] = await Promise.all([
        getPublicBlogPost(slug),
        listPublicBlogPosts(),
      ]);
      if (postRes.ok) {
        setPost(postRes.post);
        setStatus("ok");
      } else if (postRes.error.toLowerCase().includes("not found")) {
        setStatus("missing");
      } else {
        setError(postRes.error);
        setStatus("error");
      }
      if (allRes.ok) setAllPosts(allRes.posts);
    })();
  }, [slug]);

  // Sticky reading-progress bar — tracks how far down the article you've read.
  useEffect(() => {
    if (status !== "ok") return;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      if (max <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min(1, Math.max(0, doc.scrollTop / max)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [status]);

  useSeo({
    title: post ? `${post.title} — TechU Blog` : "Blog post — TechU",
    description: post?.excerpt || "Insights from the TechU team.",
    path: `/blog/${slug}`,
    ogImage: post?.coverImage ? resolveAssetUrl(post.coverImage) : undefined,
  });

  const html = useMemo(() => (post ? markdownToHtml(post.body) : ""), [post]);
  const minutes = useMemo(() => (post ? readingMinutes(post.body) : 0), [post]);

  // Related posts: prefer ones sharing a tag with the current post, then fall
  // back to other recent posts. Cap at 3.
  const related = useMemo(() => {
    if (!post) return [];
    const others = allPosts.filter((p) => p.slug !== post.slug);
    const tagged = others.filter((p) =>
      p.tags.some((t) => post.tags.includes(t)),
    );
    const seen = new Set<string>();
    const merged = [...tagged, ...others].filter((p) => {
      if (seen.has(p.slug)) return false;
      seen.add(p.slug);
      return true;
    });
    return merged.slice(0, 3);
  }, [post, allPosts]);

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <AnnouncementBar />
      <SiteHeader />

      {/* Sticky reading-progress bar */}
      {status === "ok" && (
        <div
          aria-hidden
          className="sticky top-0 z-20 h-0.5 bg-transparent"
        >
          <div
            className="h-full origin-left bg-brand-purple transition-transform duration-150"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      )}

      <article className="mx-auto max-w-[820px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All posts
        </Link>

        {status === "loading" && <DetailSkeleton />}

        {status === "missing" && (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <h1 className="text-xl font-semibold text-foreground">
              Post not found
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This post may have been removed, renamed, or never existed.
            </p>
            <Link
              to="/blog"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-purple px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              Browse all posts
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Couldn't load this post: {error}
          </div>
        )}

        {status === "ok" && post && (
          <>
            <header className="mt-6">
              {post.tags?.[0] && (
                <span className="inline-flex rounded-full bg-brand-purple/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-purple">
                  {post.tags[0]}
                </span>
              )}
              <h1 className="mt-4 text-[clamp(1.875rem,5vw,2.75rem)] font-extrabold leading-[1.15] tracking-tight text-foreground">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mt-4 text-lg text-muted-foreground">
                  {post.excerpt}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5 text-sm text-muted-foreground">
                {post.author && (
                  <span className="inline-flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                      {post.author.slice(0, 1).toUpperCase()}
                    </span>
                    <span>
                      <span className="block font-medium text-foreground">
                        {post.author}
                      </span>
                      <span className="text-[11px]">TechU contributor</span>
                    </span>
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-3 text-[12px]">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(post.publishedAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {minutes} min read
                  </span>
                </span>
              </div>
            </header>

            {post.coverImage && (
              <div className="mt-8 overflow-hidden rounded-2xl ring-1 ring-border">
                <img
                  src={resolveAssetUrl(post.coverImage)}
                  alt={post.title}
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            )}

            <ShareRow title={post.title} slug={post.slug} className="mt-8" />

            <div
              className="prose-blog mt-8"
              // markdownToHtml escapes the input first then emits a controlled subset
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tags
                </span>
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <ShareRow
              title={post.title}
              slug={post.slug}
              className="mt-8 border-t border-border pt-6"
              compact
            />

            <CourseCta />
          </>
        )}
      </article>

      {status === "ok" && related.length > 0 && (
        <section className="border-t border-border bg-muted/30 py-12 sm:py-16">
          <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Keep reading
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  More from the TechU blog you might like.
                </p>
              </div>
              <Link
                to="/blog"
                className="hidden items-center gap-1 text-sm font-medium text-brand-purple hover:underline sm:inline-flex"
              >
                All posts
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <RelatedCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
      <div className="space-y-3 pt-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  );
}

function ShareRow({
  title,
  slug,
  className = "",
  compact,
}: {
  title: string;
  slug: string;
  className?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => {
    if (typeof window === "undefined") return `/blog/${slug}`;
    return `${window.location.origin}/blog/${slug}`;
  }, [slug]);

  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title,
  )}&url=${encodeURIComponent(url)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    url,
  )}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!compact && (
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Share
        </span>
      )}
      <a
        href={tweet}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Twitter"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-brand-purple hover:text-brand-purple"
      >
        <Twitter className="h-4 w-4" />
      </a>
      <a
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-brand-purple hover:text-brand-purple"
      >
        <Linkedin className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        className={`flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium transition hover:border-brand-purple hover:text-brand-purple ${
          copied
            ? "border-emerald-300 text-emerald-700 dark:border-emerald-900/40 dark:text-emerald-300"
            : "text-muted-foreground"
        }`}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Copied
          </>
        ) : (
          <>
            <LinkIcon className="h-3.5 w-3.5" />
            Copy link
          </>
        )}
      </button>
    </div>
  );
}

function RelatedCard({ post }: { post: BlogPostListItem }) {
  const cover = post.coverImage ? resolveAssetUrl(post.coverImage) : "";
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-gradient text-2xl font-black text-white/30">
            TechU
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {post.tags?.[0] && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-purple">
            {post.tags[0]}
          </span>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-foreground transition group-hover:text-brand-purple">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
            {post.excerpt}
          </p>
        )}
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(post.publishedAt)}
        </span>
      </div>
    </Link>
  );
}

function CourseCta() {
  return (
    <aside className="mt-12 overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white shadow-lg sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-brand-grid opacity-30"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            Take it further
          </span>
          <h3 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
            Liked this post? Build the skills next.
          </h3>
          <p className="mt-2 max-w-xl text-sm text-white/85">
            Join a TechU cohort and learn AI, full-stack, data, or design with
            mentors who write articles like this one.
          </p>
        </div>
        <Link
          to="/courses"
          className="inline-flex items-center justify-center gap-1.5 self-start whitespace-nowrap rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-purple shadow-md transition hover:bg-white/90 sm:self-auto"
        >
          Explore courses
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}
