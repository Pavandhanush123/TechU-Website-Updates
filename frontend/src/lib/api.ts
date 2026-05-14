// Single typed API client for the TechU backend.
// All calls go through `apiFetch` which:
//   - prepends VITE_API_BASE_URL (or "" for same-origin)
//   - attaches the session cookie (credentials: "include")
//   - parses JSON responses and unifies error shape

const RAW_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
const ALLOW_DEV_CROSS_ORIGIN_API =
  import.meta.env.VITE_ALLOW_CROSS_ORIGIN_API_IN_DEV === "true";

function isLocalDevHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function resolveApiBase(): string {
  if (!RAW_BASE) return "";
  if (typeof window === "undefined") return RAW_BASE;
  if (!import.meta.env.DEV || ALLOW_DEV_CROSS_ORIGIN_API) return RAW_BASE;
  if (!isLocalDevHost(window.location.hostname)) return RAW_BASE;

  // In local dev, force same-origin API calls (Vite proxy -> backend) so
  // session cookies are first-party and persist reliably for admin auth.
  try {
    const targetOrigin = new URL(RAW_BASE).origin;
    if (targetOrigin !== window.location.origin) {
      if (import.meta.env.DEV) {
        console.info(
          `[api] Ignoring VITE_API_BASE_URL (${targetOrigin}) in local dev to preserve admin session cookies. Using same-origin /api via Vite proxy.`,
        );
      }
      return "";
    }
  } catch {
    // If malformed, keep previous behavior and let request fail visibly.
  }
  return RAW_BASE;
}

const BASE = resolveApiBase();

/** Resolve a server-relative URL (e.g. "/uploads/foo.jpg") to a fully-qualified
 * URL that works whether the API is same-origin or hosted elsewhere. Absolute
 * URLs (starting with "http") are returned unchanged. */
export function resolveAssetUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

type ApiOk<T> = { ok: true } & T;
type ApiErr = { ok: false; error: string };
export type ApiResult<T> = ApiOk<T> | ApiErr;

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch (err) {
    if (import.meta.env.DEV) console.error("[api] network error:", path, err);
    return {
      ok: false,
      error:
        "Couldn't reach the server. Check your connection and try again.",
    };
  }
  const ct = res.headers.get("content-type") || "";
  let data: unknown = null;
  if (ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      /* malformed JSON */
    }
  }
  if (!res.ok) {
    const err = (data as { error?: string } | null)?.error;
    return { ok: false, error: err || `Request failed (${res.status})` };
  }
  if (data === null) {
    // Got HTML or no body on a 2xx — treat as upstream misconfig.
    return { ok: false, error: "Unexpected response from server." };
  }
  return data as ApiResult<T>;
}

// ──────────────────────────────────────────────────────────────────────────
// Public lead endpoints
// ──────────────────────────────────────────────────────────────────────────

export type DemoRequestInput = {
  fullName: string;
  email: string;
  phone: string;
  course: string;
};
export type ApplicationInput = {
  fullName: string;
  email: string;
  phone: string;
  experience: string;
  course: string;
};
export type BrochureRequestInput = {
  fullName: string;
  email: string;
  phone: string;
  course: string;
};

export const submitDemoRequest = (data: DemoRequestInput) =>
  apiFetch<Record<string, never>>("/api/leads/demo", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const submitApplication = (data: ApplicationInput) =>
  apiFetch<Record<string, never>>("/api/leads/application", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const submitBrochureRequest = (data: BrochureRequestInput) =>
  apiFetch<Record<string, never>>("/api/leads/brochure", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ──────────────────────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────────────────────

export const ensureAdminUser = () =>
  apiFetch<Record<string, never>>("/api/auth/ensure-admin", {
    method: "POST",
  });

export const adminLogin = (username: string, password: string) =>
  apiFetch<{ isAdmin: boolean; email: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const adminLogout = () =>
  apiFetch<Record<string, never>>("/api/auth/logout", { method: "POST" });

export type AdminSessionResponse =
  | { authenticated: false }
  | { authenticated: true; email: string | null; isAdmin: boolean };

export async function getAdminSession(): Promise<AdminSessionResponse> {
  const res = await fetch(`${BASE}/api/auth/session`, {
    credentials: "include",
  });
  if (!res.ok) return { authenticated: false };
  return (await res.json()) as AdminSessionResponse;
}

export const changeAdminPassword = (
  currentPassword: string,
  newPassword: string,
) =>
  apiFetch<Record<string, never>>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });

// ──────────────────────────────────────────────────────────────────────────
// Admin
// ──────────────────────────────────────────────────────────────────────────

export type LeadStatus = "new" | "contacted" | "converted" | "archived";

export type Lead = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  course: string;
  preferred_date: string | null;
  source: "application" | "brochure" | "demo";
  status: LeadStatus;
  notes: string | null;
  updated_at: string;
};

export type LeadStats = {
  total: number;
  last7: number;
  newCount: number;
  converted: number;
  bySource: Array<{ source: string; c: number }>;
};

export const listLeads = () =>
  apiFetch<{ leads: Lead[] }>("/api/admin/leads");

export const getLeadStats = () => apiFetch<LeadStats>("/api/admin/stats");

export const updateLeadStatus = (id: string, status: LeadStatus) =>
  apiFetch<Record<string, never>>(`/api/admin/leads/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const deleteLead = (id: string) =>
  apiFetch<Record<string, never>>(`/api/admin/leads/${id}`, {
    method: "DELETE",
  });

export const updateLeadNotes = (id: string, notes: string | null) =>
  apiFetch<Record<string, never>>(`/api/admin/leads/${id}/notes`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });

export const bulkUpdateStatus = (ids: string[], status: LeadStatus) =>
  apiFetch<{ updated: number }>("/api/admin/leads/bulk-status", {
    method: "POST",
    body: JSON.stringify({ ids, status }),
  });

export const bulkDeleteLeads = (ids: string[]) =>
  apiFetch<{ deleted: number }>("/api/admin/leads/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

// ──────────────────────────────────────────────────────────────────────────
// CMS — site_content sections
// ──────────────────────────────────────────────────────────────────────────

export type CmsSectionKey =
  | "announcement_bar"
  | "site_header"
  | "hero"
  | "course_search"
  | "upcoming_courses"
  | "mentors"
  | "webinars"
  | "infrastructure"
  | "cta_banner"
  | "testimonials"
  | "contact"
  | "final_cta"
  | "site_footer"
  | "welcome_popup"
  | "seo_home"
  | "seo_courses"
  | "seo_course_detail";

export type CmsSection<T = unknown> = {
  key: CmsSectionKey;
  data: T;
  updatedAt: string;
};

export const getPublicSection = <T = unknown>(key: CmsSectionKey) =>
  apiFetch<{ section: CmsSection<T> }>(`/api/cms/sections/${key}`);

export const listAdminSections = () =>
  apiFetch<{ sections: CmsSection[] }>("/api/admin/cms/sections");

export const getAdminSection = <T = unknown>(key: CmsSectionKey) =>
  apiFetch<{ section: CmsSection<T> }>(`/api/admin/cms/sections/${key}`);

export type UploadedImage = {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
};

export async function uploadImage(file: File): Promise<ApiResult<UploadedImage>> {
  const form = new FormData();
  form.append("file", file);
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/admin/uploads/image`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
  } catch {
    return {
      ok: false,
      error: "Couldn't reach the server. Check your connection and try again.",
    };
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const err = (data as { error?: string } | null)?.error;
    return { ok: false, error: err || `Upload failed (${res.status})` };
  }
  return data as ApiResult<UploadedImage>;
}

export const updateAdminSection = <T = unknown>(
  key: CmsSectionKey,
  data: T,
) =>
  apiFetch<{ section: CmsSection<T> }>(`/api/admin/cms/sections/${key}`, {
    method: "PUT",
    body: JSON.stringify({ data }),
  });

// ── Section data shapes ──────────────────────────────────────────────────

export type MentorsSectionData = {
  title: string;
  subtitle: string;
  items: Array<{
    name: string;
    role: string;
    expertise: string;
    years: string;
    image: string;
  }>;
};

export type TestimonialsSectionData = {
  title: string;
  subtitle: string;
  items: Array<{
    name: string;
    role: string;
    company: string;
    rating: string;
    quote: string;
    avatar: string;
  }>;
};

export type SocialLinks = {
  linkedin: string;
  facebook: string;
  instagram: string;
  youtube: string;
};

export type AnnouncementBarData = {
  enabled: boolean;
  text: string;
  ctaLabel: string;
  ctaHref: string;
  suffix: string;
  socials: SocialLinks;
};

export type SiteHeaderData = {
  logoUrl: string;
  nav: Array<{ label: string; to?: string; href?: string }>;
  ctaLabel: string;
  ctaHref: string;
};

export type HeroSlide = {
  badge: string;
  titleStart: string;
  titleHighlight: string;
  titleEnd: string;
  description: string;
  features: string[];
  primaryCta: string;
  secondaryCta: string;
  image: string;
  alt: string;
};

export type HeroData = {
  slides: HeroSlide[];
  livePillLabel: string;
  livePillText: string;
};

/** Homepage search bar rows — aligned with course catalog pricing tiers (no schedule field). */
export type CourseSearchCourseRow = {
  title: string;
  slug: string;
  mode: string;
  location: string;
};

export type CourseSearchData = {
  courses: CourseSearchCourseRow[];
};

export type UpcomingCoursesData = {
  title: string;
  subtitle: string;
  courses: Array<{
    title: string;
    image: string;
    rating: number;
    students: string;
    duration: string;
    level: string;
    mode: "Offline" | "Online" | "Recorded";
    upcoming?: boolean;
    batchNote?: string;
  }>;
};

export type WebinarsData = {
  title: string;
  subtitle: string;
  items: Array<{
    id?: string;
    title: string;
    date: string;
    time: string;
    attendees: string;
    hostName: string;
    hostRole: string;
    badge: string;
  }>;
};

export type InfrastructureData = {
  titleLine1: string;
  titleHighlight: string;
  titleLine2: string;
  subtitle: string;
  body: string;
  image: string;
  stats: Array<{ label: string; value: string; suffix: string }>;
};

export type CtaBannerData = {
  title: string;
  primaryLabel: string;
  secondaryLabel: string;
  image: string;
  brochureUrl: string;
};

export type ContactData = {
  heading: string;
  formBadge: string;
  formTitle: string;
  formSubmitLabel: string;
  consent: string;
  email: string;
  phone: string;
  address: string;
  socials: SocialLinks;
  stats: Array<{ value: string; label: string }>;
  courseOptions: string[];
};

export type FinalCtaData = {
  eyebrow: string;
  titleStart: string;
  titleHighlight: string;
  titleEnd: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  badges: string[];
};

export type SiteFooterData = {
  logoUrl: string;
  description: string;
  bullets: string[];
  coursesLinks: Array<{
    label: string;
    to: string;
    search?: Record<string, string>;
  }>;
  companyLinks: Array<{ label: string; href: string }>;
  email: string;
  phone: string;
  address: string;
  socials: SocialLinks;
  copyright: string;
};

export type WelcomePopupData = {
  enabled: boolean;
  title: string;
  subtitle: string;
  badge: string;
  primaryLabel: string;
  image: string;
  courseOptions: string[];
  delaySeconds: number;
  showAgainAfterDays: number;
  version: number;
};

export type SeoSectionData = {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
};

// ──────────────────────────────────────────────────────────────────────────
// Blog
// ──────────────────────────────────────────────────────────────────────────

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string;
  author: string;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostListItem = Omit<BlogPost, "body">;

export type BlogPostInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  coverImage?: string;
  author?: string;
  tags?: string[];
  published?: boolean;
};

export const listPublicBlogPosts = () =>
  apiFetch<{ posts: BlogPostListItem[] }>("/api/blogs");

export const getPublicBlogPost = (slug: string) =>
  apiFetch<{ post: BlogPost }>(`/api/blogs/${encodeURIComponent(slug)}`);

export const listAdminBlogPosts = () =>
  apiFetch<{ posts: BlogPost[] }>("/api/admin/blogs");

export const getAdminBlogPost = (id: string) =>
  apiFetch<{ post: BlogPost }>(`/api/admin/blogs/${id}`);

export const createAdminBlogPost = (data: BlogPostInput) =>
  apiFetch<{ post: BlogPost }>("/api/admin/blogs", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateAdminBlogPost = (id: string, data: Partial<BlogPostInput>) =>
  apiFetch<{ post: BlogPost }>(`/api/admin/blogs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteAdminBlogPost = (id: string) =>
  apiFetch<Record<string, never>>(`/api/admin/blogs/${id}`, {
    method: "DELETE",
  });
