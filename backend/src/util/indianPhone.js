/**
 * After Zod sanitization (digits, optional '+'), coerce to canonical +91 E.164
 * only when we have India's 10-digit national pattern ([6–9] + 9 digits).
 * Otherwise return null — caller keeps the sanitized body.phone as-is.
 */
export function normalizeIndianApplicationPhoneCanonical(sanitized) {
  let d = String(sanitized ?? "").replace(/^\+/, "").replace(/\D+/g, "");
  while (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  while (d.length >= 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10 || !/^\d{10}$/.test(d)) return null;
  return `+91${d}`;
}
