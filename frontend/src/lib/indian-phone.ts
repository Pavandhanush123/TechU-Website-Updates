/**
 * Normalize pasted or typed digits into India's 10-digit national mobile (without +91).
 * Handles leading 91 / 0 and accidental duplication so we never keep a truncated prefix.
 */
export function normalizeIndianNationalMobileDigits(raw: unknown): string {
  let d = String(raw ?? "").replace(/\D+/g, "");
  while (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  while (d.length >= 11 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
}
