import { useEffect } from "react";

/**
 * Inject a `<script type="application/ld+json">` block into <head> for the
 * lifetime of a route. The element is removed on unmount so the previous
 * page's structured data doesn't bleed into the next.
 */
export function JsonLd({ id, data }: { id: string; data: unknown }) {
  useEffect(() => {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [id, data]);
  return null;
}
