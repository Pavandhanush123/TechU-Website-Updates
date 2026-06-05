/** Shown next to inputs; full addresses are built as `${local}${GMAIL_HOST_SUFFIX}`. */
export const GMAIL_HOST_SUFFIX = "@gmail.com";

/** Normalize pasted or typed values to the Gmail local part only (lowercase). */
export function normalizeGmailLocalInput(raw: string): string {
  let s = raw.trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  if (lower.endsWith("@gmail.com")) {
    s = s.slice(0, s.length - "@gmail.com".length);
  } else {
    const at = s.indexOf("@");
    if (at >= 0) s = s.slice(0, at);
  }
  return s.trim().toLowerCase();
}

/** Strip disallowed characters while typing; then normalize (handles paste of full address). */
export function sanitizeGmailLocalTyping(raw: string): string {
  return normalizeGmailLocalInput(raw.replace(/[^a-zA-Z0-9._@-]/g, ""));
}
