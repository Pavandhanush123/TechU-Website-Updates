// Client-side Zod schemas — these mirror the backend's validation to
// give immediate user feedback before sending to the API. The backend
// re-validates everything; the client copy is only for UX.
import { z } from "zod";
import { normalizeGmailLocalInput } from "@/lib/gmail-local-part";
import { normalizeIndianNationalMobileDigits } from "@/lib/indian-phone";

const GMAIL_LOCAL_MAX = 64;

/** Lead forms: UI collects local part only; value becomes `local@gmail.com`. */
const gmailLocalPartField = z
  .string()
  .transform((raw) => normalizeGmailLocalInput(raw))
  .pipe(
    z
      .string()
      .min(1, "Enter your Gmail username (part before @)")
      .max(GMAIL_LOCAL_MAX, "Gmail username is too long")
      .regex(
        /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/,
        "Use letters, numbers, dots, hyphens, or underscores only",
      ),
  )
  .transform((local) => `${local}@gmail.com`);

// Strip everything except digits and a single leading + before validating.
export const sanitizePhone = (raw: string) => {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D+/g, "");
  return hasPlus ? `+${digits}` : digits;
};

const fullNameField = z
  .string()
  .trim()
  .min(2, "Please enter your full name")
  .max(100, "Name is too long");

// 10–15 digits, optional leading +. Indian numbers are 10 digits without
// country code or 12 with +91 — both pass.
const phoneField = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .transform(sanitizePhone)
  .pipe(
    z
      .string()
      .regex(
        /^\+?\d{10,15}$/,
        "Enter a valid mobile number",
      ),
  );

/** UI shows +91 prefix; state holds up to 10 national digits — combine for validation/API. */
export function wireContactNationalPhoneDigits(nationalDigits: string): string {
  const d = normalizeIndianNationalMobileDigits(nationalDigits);
  if (!d.length) return "";
  return `+91${d}`;
}

/** Homepage contact form: UI collects exactly 10 national digits after +91. */
const contactSectionPhoneField = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .transform(sanitizePhone)
  .pipe(
    z
      .string()
      .regex(
        /^\+91\d{10}$/,
        "Enter a valid 10-digit Indian mobile number",
      ),
  );

const courseField = z
  .string()
  .trim()
  .min(1, "Please select a course")
  .max(200, "Course / webinar title is too long");

const EXPERIENCE_YEARS_MONTHS_REGEX = /^(\d{1,2})\s+years?\s+(\d{1,2})\s+months?$/i;

const isExperienceYearsMonths = (value: string) => {
  const match = value.trim().match(EXPERIENCE_YEARS_MONTHS_REGEX);
  if (!match) return false;
  const years = Number(match[1]);
  const months = Number(match[2]);
  return (
    Number.isInteger(years) &&
    Number.isInteger(months) &&
    years >= 1 &&
    years <= 20 &&
    months >= 0 &&
    months <= 11
  );
};

export const demoRequestSchema = z.object({
  fullName: fullNameField,
  email: gmailLocalPartField,
  phone: phoneField,
  course: courseField,
});
export type DemoRequestInput = z.infer<typeof demoRequestSchema>;
export type DemoRequestFormValues = z.input<typeof demoRequestSchema>;

export const applicationSchema = z.object({
  fullName: fullNameField,
  email: gmailLocalPartField,
  phone: phoneField,
  course: courseField,
  learningMode: z.string().trim().optional(),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type ApplicationFormValues = z.input<typeof applicationSchema>;

/** Homepage contact section only collects total work experience (years + months). */
export const contactSectionApplicationSchema = z.object({
  fullName: fullNameField,
  email: gmailLocalPartField,
  phone: contactSectionPhoneField,
  experience: z
    .string()
    .trim()
    .min(1, "Please select your total work experience")
    .max(80)
    .refine(
      (v) => isExperienceYearsMonths(v.trim()),
      "Select years (1–20) and months (0–11)",
    ),
  course: courseField,
  learningMode: z.string().trim().optional(),
});

export const brochureRequestSchema = z.object({
  fullName: fullNameField,
  email: gmailLocalPartField,
  phone: phoneField,
  course: courseField,
});
export type BrochureRequestInput = z.infer<typeof brochureRequestSchema>;
export type BrochureFormValues = z.input<typeof brochureRequestSchema>;

export const isaProgramEnquirySchema = z.object({
  fullName: fullNameField,
  email: gmailLocalPartField,
  phone: phoneField,
  course: courseField,
  preferredMode: z.enum(["Online", "Offline"]),
});
export type IsaProgramEnquiryInput = z.infer<typeof isaProgramEnquirySchema>;
export type IsaProgramEnquiryFormValues = z.input<typeof isaProgramEnquirySchema>;

// Validate a single field of a Zod object schema. Returns the error
// message for that field, or undefined if it's valid. Used by forms to
// show inline errors on blur / while typing.
export function validateField<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  field: keyof T & string,
  value: unknown,
  rest: Record<string, unknown> = {},
): string | undefined {
  const result = schema.safeParse({ ...rest, [field]: value });
  if (result.success) return undefined;
  for (const issue of result.error.issues) {
    if (issue.path[0] === field) return issue.message;
  }
  return undefined;
}
