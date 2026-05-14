import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Eye,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  createAdminBlogPost,
  deleteAdminBlogPost,
  getAdminSession,
  getAdminBlogPost,
  listAdminBlogPosts,
  resolveAssetUrl,
  updateAdminBlogPost,
  uploadImage,
  type BlogPost,
  type BlogPostInput,
} from "@/lib/api";
import { ADMIN_SESSION_READY_EVENT } from "@/lib/admin-session-events";
import { AdminShell } from "@/components/admin/AdminShell";
import { Skeleton } from "@/components/ui/skeleton";
import { markdownToHtml } from "@/lib/markdown";

export const Route = createFileRoute("/admin/blogs")({
  component: AdminBlogs,
});

type Mode =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; id: string };

function AdminBlogs() {
  const [mode, setMode] = useState<Mode>({ kind: "list" });

  return mode.kind === "list" ? (
    <BlogList onCreate={() => setMode({ kind: "create" })} onEdit={(id) => setMode({ kind: "edit", id })} />
  ) : (
    <BlogEditor mode={mode} onBack={() => setMode({ kind: "list" })} />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// List view
// ────────────────────────────────────────────────────────────────────────────

function BlogList({
  onCreate,
  onEdit,
}: {
  onCreate: () => void;
  onEdit: (id: string) => void;
}) {
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "drafts">("all");
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const session = await getAdminSession();
    if (!session.authenticated) return;
    const res = await listAdminBlogPosts();
    if (res.ok) setPosts(res.posts);
    else toast.error(res.error || "Could not load posts");
  }, []);

  useEffect(() => {
    const load = () => {
      void refresh();
    };
    load();
    window.addEventListener(ADMIN_SESSION_READY_EVENT, load);
    return () => {
      window.removeEventListener(ADMIN_SESSION_READY_EVENT, load);
    };
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!posts) return [];
    return posts.filter((p) => {
      if (filter === "published" && !p.published) return false;
      if (filter === "drafts" && p.published) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, query, filter]);

  const counts = useMemo(() => {
    if (!posts) return { all: 0, published: 0, drafts: 0 };
    return {
      all: posts.length,
      published: posts.filter((p) => p.published).length,
      drafts: posts.filter((p) => !p.published).length,
    };
  }, [posts]);

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Delete "${post.title}"? This can't be undone.`)) return;
    setBusy(post.id);
    try {
      const res = await deleteAdminBlogPost(post.id);
      if (!res.ok) {
        toast.error(res.error || "Delete failed");
        return;
      }
      toast.success("Post deleted");
      setPosts((prev) => (prev ? prev.filter((p) => p.id !== post.id) : prev));
    } finally {
      setBusy(null);
    }
  };

  const togglePublish = async (post: BlogPost) => {
    setBusy(post.id);
    try {
      const res = await updateAdminBlogPost(post.id, {
        published: !post.published,
      });
      if (!res.ok) {
        toast.error(res.error || "Update failed");
        return;
      }
      toast.success(res.post.published ? "Published" : "Moved to drafts");
      setPosts((prev) =>
        prev ? prev.map((p) => (p.id === post.id ? res.post : p)) : prev,
      );
    } finally {
      setBusy(null);
    }
  };

  const actions = (
    <button
      onClick={onCreate}
      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
    >
      <Plus className="h-3.5 w-3.5" />
      New post
    </button>
  );

  return (
    <AdminShell
      title="Blog"
      subtitle="Write, schedule, and publish posts to /blog."
      actions={actions}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "published", "drafts"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition sm:px-4",
                filter === k
                  ? "bg-foreground text-background shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {k}{" "}
              <span className="ml-1 opacity-70">({counts[k]})</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, slug, author, tag…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm focus:border-brand-purple focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {posts === null ? (
          <div className="space-y-px">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-12 w-20 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Pencil className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              {posts.length === 0
                ? "No posts yet"
                : "No posts match your filter"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {posts.length === 0
                ? "Write your first post — it'll appear at /blog."
                : "Try clearing the search or switching tabs."}
            </p>
            {posts.length === 0 && (
              <button
                onClick={onCreate}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-4 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110"
              >
                <Plus className="h-3.5 w-3.5" />
                New post
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 transition hover:bg-muted/40 sm:gap-4 sm:p-4"
              >
                <div className="hidden h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border sm:block">
                  {p.coverImage ? (
                    <img
                      src={resolveAssetUrl(p.coverImage)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand-gradient text-[10px] font-bold text-white/70">
                      TechU
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onEdit(p.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {p.title}
                    </span>
                    {p.published ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Published
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="truncate">/{p.slug}</span>
                    {p.author && <span>· {p.author}</span>}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(p.publishedAt ?? p.createdAt).toLocaleDateString()}
                    </span>
                    {p.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  {p.published && (
                    <Link
                      to="/blog/$slug"
                      params={{ slug: p.slug }}
                      target="_blank"
                      title="View published post"
                      className="hidden rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                  <button
                    onClick={() => togglePublish(p)}
                    disabled={busy === p.id}
                    title={p.published ? "Unpublish" : "Publish"}
                    className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    {busy === p.id ? "…" : p.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => onEdit(p.id)}
                    title="Edit"
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={busy === p.id}
                    title="Delete"
                    className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Editor view
// ────────────────────────────────────────────────────────────────────────────

const EMPTY: BlogPostInput = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImage: "",
  author: "",
  tags: [],
  published: false,
};

function BlogEditor({
  mode,
  onBack,
}: {
  mode: { kind: "create" } | { kind: "edit"; id: string };
  onBack: () => void;
}) {
  const editing = mode.kind === "edit";
  const [form, setForm] = useState<BlogPostInput>(EMPTY);
  const [original, setOriginal] = useState<BlogPostInput | null>(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!editing) {
      setOriginal(EMPTY);
      return;
    }
    setLoading(true);
    void (async () => {
      const res = await getAdminBlogPost(mode.id);
      if (res.ok) {
        const data: BlogPostInput = {
          title: res.post.title,
          slug: res.post.slug,
          excerpt: res.post.excerpt,
          body: res.post.body,
          coverImage: res.post.coverImage,
          author: res.post.author,
          tags: res.post.tags,
          published: res.post.published,
        };
        setForm(data);
        setOriginal(JSON.parse(JSON.stringify(data)));
      } else {
        toast.error(res.error || "Could not load post");
        onBack();
      }
      setLoading(false);
    })();
  }, [editing, mode, onBack]);

  const dirty = useMemo(
    () => original !== null && JSON.stringify(form) !== JSON.stringify(original),
    [form, original],
  );

  const update = <K extends keyof BlogPostInput>(
    key: K,
    value: BlogPostInput[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    if ((form.tags ?? []).includes(t)) {
      setTagDraft("");
      return;
    }
    update("tags", [...(form.tags ?? []), t]);
    setTagDraft("");
  };
  const removeTag = (t: string) =>
    update("tags", (form.tags ?? []).filter((x) => x !== t));

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Images must be smaller than 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadImage(file);
      if (!res.ok) {
        toast.error(res.error || "Upload failed");
        return;
      }
      update("coverImage", res.url);
      toast.success("Cover image uploaded");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (publish?: boolean) => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload: BlogPostInput = {
        ...form,
        published: publish ?? form.published,
      };
      const res = editing
        ? await updateAdminBlogPost(mode.id, payload)
        : await createAdminBlogPost(payload);
      if (!res.ok) {
        toast.error(res.error || "Save failed");
        return;
      }
      toast.success(
        publish === true
          ? "Published"
          : publish === false
            ? "Saved as draft"
            : "Saved",
      );
      const next: BlogPostInput = {
        title: res.post.title,
        slug: res.post.slug,
        excerpt: res.post.excerpt,
        body: res.post.body,
        coverImage: res.post.coverImage,
        author: res.post.author,
        tags: res.post.tags,
        published: res.post.published,
      };
      setForm(next);
      setOriginal(JSON.parse(JSON.stringify(next)));
      if (!editing) onBack();
    } finally {
      setSaving(false);
    }
  };

  const actions = (
    <>
      <button
        type="button"
        onClick={() => setPreview((p) => !p)}
        className="hidden rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted sm:inline-flex sm:items-center sm:gap-1.5"
      >
        <Eye className="h-3.5 w-3.5" />
        {preview ? "Edit" : "Preview"}
      </button>
      <button
        type="button"
        onClick={() => submit(false)}
        disabled={saving || !dirty}
        className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save draft"}
      </button>
      <button
        type="button"
        onClick={() => submit(true)}
        disabled={saving}
        className="rounded-lg bg-brand-orange px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
      >
        {saving ? "Publishing…" : form.published ? "Update" : "Publish"}
      </button>
    </>
  );

  return (
    <AdminShell
      title={editing ? "Edit post" : "New post"}
      subtitle={form.title || "Untitled"}
      actions={actions}
    >
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All posts
      </button>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : preview ? (
        <PreviewCard form={form} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <Field
              label="Title"
              value={form.title}
              onChange={(v) => update("title", v)}
              placeholder="An attention-grabbing title"
              big
            />
            <Field
              label="Slug"
              prefix="/blog/"
              value={form.slug ?? ""}
              onChange={(v) => update("slug", v)}
              placeholder="auto-generated-from-title"
              hint="Leave blank to auto-generate from the title."
            />
            <TextArea
              label="Excerpt"
              value={form.excerpt ?? ""}
              onChange={(v) => update("excerpt", v)}
              placeholder="Short summary shown on the blog index and in social previews."
              rows={3}
              maxLength={500}
            />
            <TextArea
              label="Body (Markdown)"
              value={form.body ?? ""}
              onChange={(v) => update("body", v)}
              placeholder={"# Heading\n\nStart writing your post in markdown.\n\n- Use **bold**, *italic*, [links](https://example.com)\n- Add images with ![alt](https://…/image.jpg)\n- Code blocks with ``` fences"}
              rows={20}
              monospace
            />
          </section>

          <aside className="space-y-5">
            <Card title="Status">
              <ToggleRow
                label="Published"
                checked={!!form.published}
                onChange={(v) => update("published", v)}
                hint={
                  form.published
                    ? "Visible at /blog and on the public site."
                    : "Saved as a draft, not visible publicly."
                }
              />
            </Card>

            <Card title="Cover image">
              <CoverUpload
                value={form.coverImage ?? ""}
                uploading={uploading}
                onUpload={handleCoverUpload}
                onChange={(v) => update("coverImage", v)}
              />
            </Card>

            <Card title="Author">
              <Field
                label=""
                value={form.author ?? ""}
                onChange={(v) => update("author", v)}
                placeholder="Jane Doe"
              />
            </Card>

            <Card title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {(form.tags ?? []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-purple/10 px-2.5 py-1 text-[11px] font-medium text-brand-purple"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="text-brand-purple/70 hover:text-brand-purple"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-brand-purple focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  Add
                </button>
              </div>
            </Card>
          </aside>
        </div>
      )}
    </AdminShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Editor primitives
// ────────────────────────────────────────────────────────────────────────────

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  hint,
  big,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  hint?: string;
  big?: boolean;
}) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <div
        className={`mt-1 flex items-center rounded-lg border border-border bg-background ${
          big ? "px-3" : "px-3"
        } focus-within:border-brand-purple`}
      >
        {prefix && (
          <span className="pr-1 text-xs text-muted-foreground">{prefix}</span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-transparent ${
            big ? "py-2.5 text-lg font-semibold" : "py-2 text-sm"
          } focus:outline-none`}
        />
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  monospace,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  monospace?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="block text-xs font-medium text-muted-foreground">
          {label}
        </label>
        {maxLength && (
          <span className="text-[10px] text-muted-foreground">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-purple focus:outline-none ${
          monospace ? "font-mono text-[13px] leading-relaxed" : ""
        }`}
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && (
          <div className="text-[11px] text-muted-foreground">{hint}</div>
        )}
      </div>
    </div>
  );
}

function CoverUpload({
  value,
  uploading,
  onChange,
  onUpload,
}: {
  value: string;
  uploading: boolean;
  onChange: (v: string) => void;
  onUpload: (file: File | null) => void;
}) {
  const preview = value ? resolveAssetUrl(value) : "";
  return (
    <div className="space-y-2">
      {preview ? (
        <div className="group relative aspect-[16/9] overflow-hidden rounded-lg ring-1 ring-border">
          <img src={preview} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      ) : (
        <label className="flex aspect-[16/9] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-background text-muted-foreground transition hover:border-brand-purple hover:text-brand-purple">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span className="text-[11px]">
            {uploading ? "Uploading…" : "Click to upload"}
          </span>
          <input
            type="file"
            hidden
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste an image URL"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-brand-purple focus:outline-none"
      />
    </div>
  );
}

function PreviewCard({ form }: { form: BlogPostInput }) {
  const html = useMemo(() => markdownToHtml(form.body ?? ""), [form.body]);
  const cover = form.coverImage ? resolveAssetUrl(form.coverImage) : "";
  return (
    <div className="mx-auto max-w-[820px] rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
      <span className="inline-flex rounded-full bg-brand-purple/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-purple">
        Preview
      </span>
      <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
        {form.title || "Untitled"}
      </h1>
      {form.author && (
        <p className="mt-2 text-sm text-muted-foreground">By {form.author}</p>
      )}
      {form.excerpt && (
        <p className="mt-4 text-lg text-muted-foreground">{form.excerpt}</p>
      )}
      {cover && (
        <img
          src={cover}
          alt=""
          className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover ring-1 ring-border"
        />
      )}
      <div
        className="prose-blog mt-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
