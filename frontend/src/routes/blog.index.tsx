import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Calendar, Loader2, User as UserIcon } from "lucide-react";
import { AnnouncementBar } from "@/components/landing/AnnouncementBar";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { Reveal } from "@/components/Reveal";
import {
  listPublicBlogPosts,
  resolveAssetUrl,
  type BlogPostListItem,
} from "@/lib/api";
import { useSeo } from "@/lib/seo";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
});

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BlogIndex() {
  useSeo({
    title: "Blog — TechU Innovation Labs",
    description:
      "Insights on AI, full-stack development, design, and career growth from TechU mentors and alumni.",
    path: "/blog",
  });

  const [posts, setPosts] = useState<BlogPostListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await listPublicBlogPosts();
      if (res.ok) setPosts(res.posts);
      else setError(res.error);
    })();
  }, []);

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <AnnouncementBar />
      <SiteHeader />

      <section className="border-b border-border bg-muted/30 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[1200px] px-4 text-center sm:px-6 lg:px-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-purple/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-purple">
            TechU Blog
          </span>
          <h1 className="mt-4 text-[clamp(2rem,6vw,2.75rem)] font-extrabold tracking-tight text-foreground sm:text-5xl">
            Stories, tutorials &amp; career insights
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Hands-on guides on AI, full-stack engineering, data, and design —
            written by our mentors, alumni, and engineering team.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
          {posts === null && !error ? (
            <BlogGridSkeleton />
          ) : error ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Couldn't load posts: {error}
              </p>
            </div>
          ) : posts && posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <h2 className="text-lg font-semibold text-foreground">
                No posts yet
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Check back soon — we're working on the first article.
              </p>
            </div>
          ) : (
            <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts!.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </Reveal>
          )}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function PostCard({ post }: { post: BlogPostListItem }) {
  const cover = post.coverImage ? resolveAssetUrl(post.coverImage) : "";
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
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
          <div className="flex h-full w-full items-center justify-center bg-brand-gradient text-3xl font-black text-white/30">
            TechU
          </div>
        )}
        {post.tags?.[0] && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-purple shadow-sm">
            {post.tags[0]}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-lg font-bold leading-tight text-foreground transition group-hover:text-brand-purple">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-muted-foreground">
          {post.author && (
            <span className="inline-flex items-center gap-1">
              <UserIcon className="h-3.5 w-3.5" />
              {post.author}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(post.publishedAt)}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-brand-purple opacity-0 transition group-hover:opacity-100">
            Read <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function BlogGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Tiny re-export so loading state has access without pulling react-icons.
export { Loader2 };
