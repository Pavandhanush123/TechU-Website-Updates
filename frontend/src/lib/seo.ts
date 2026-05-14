import { useEffect } from "react";

export type SeoOptions = {
  title: string;
  description: string;
  /** Path with leading slash, e.g. "/courses" or "/course-detail?course=fullstack". */
  path: string;
  ogImage?: string;
};

const SITE_ORIGIN = "https://techu.in";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/apple-touch-icon.png`;

function setMeta(selector: string, attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Update the document <title>, meta description, canonical URL, and Open Graph
 * + Twitter card tags for the current page. Call once per route component via
 * `useEffect`. Safe to call from inside any client-side route — it only touches
 * the document head, never re-renders React components.
 */
export function useSeo({ title, description, path, ogImage }: SeoOptions) {
  useEffect(() => {
    const url = `${SITE_ORIGIN}${path}`;
    const image = ogImage ?? DEFAULT_OG_IMAGE;

    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setLink("canonical", url);

    // Open Graph
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      description,
    );
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    setMeta('meta[property="og:image"]', "property", "og:image", image);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");

    // Twitter
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      description,
    );
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
  }, [title, description, path, ogImage]);
}
