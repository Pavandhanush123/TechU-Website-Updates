import { z } from "zod";

const sanitizePhone = (raw) => {
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

const normalizeGmailLocal = (raw) => {
  let s = String(raw ?? "").trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  if (lower.endsWith("@gmail.com")) {
    s = s.slice(0, s.length - 10);
  } else {
    const at = s.indexOf("@");
    if (at >= 0) s = s.slice(0, at);
  }
  return s.trim().toLowerCase();
};

/** Public lead endpoints: accept Gmail local part or full `x@gmail.com`; stored as full address. */
const gmailLeadEmailField = z
  .string()
  .trim()
  .transform((raw) => normalizeGmailLocal(raw))
  .pipe(
    z
      .string()
      .min(1, "Enter your Gmail username (part before @)")
      .max(64, "Gmail username is too long")
      .regex(
        /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/,
        "Use letters, numbers, dots, hyphens, or underscores only",
      ),
  )
  .transform((local) => `${local}@gmail.com`);

const phoneField = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .transform(sanitizePhone)
  .pipe(
    z.string().regex(/^\+?\d{10,15}$/, "Enter a valid mobile number"),
  );

const courseField = z
  .string()
  .trim()
  .min(1, "Please select a course")
  .max(200, "Course / webinar title is too long");

const EXPERIENCE_YEARS_MONTHS_REGEX = /^(\d{1,2})\s+years?\s+(\d{1,2})\s+months?$/i;

const isExperienceYearsMonths = (value) => {
  const match = String(value).trim().match(EXPERIENCE_YEARS_MONTHS_REGEX);
  if (!match) return false;
  const years = Number(match[1]);
  const months = Number(match[2]);
  return Number.isInteger(years)
    && Number.isInteger(months)
    && years >= 1
    && years <= 20
    && months >= 0
    && months <= 11;
};

export const demoRequestSchema = z.object({
  fullName: fullNameField,
  email: gmailLeadEmailField,
  phone: phoneField,
  course: courseField,
});

export const applicationSchema = z.object({
  fullName: fullNameField,
  email: gmailLeadEmailField,
  phone: phoneField,
  // Optional total work experience ("X years Y months"). Only the homepage
  // Hire-Talent form sends this; the course "Apply" form no longer collects it.
  experience: z
    .string()
    .trim()
    .max(80)
    .refine(
      (v) => v === "" || isExperienceYearsMonths(v.trim()),
      "Select years (1–20) and months (0–11)",
    )
    .optional(),
  course: courseField,
  learningMode: z.string().trim().optional(),
});

export const brochureRequestSchema = z.object({
  fullName: fullNameField,
  email: gmailLeadEmailField,
  phone: phoneField,
  course: courseField,
});

export const isaProgramEnquirySchema = z.object({
  fullName: fullNameField,
  email: gmailLeadEmailField,
  phone: phoneField,
  course: courseField,
  preferredMode: z.enum(["Online", "Offline"]),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(254),
  password: z.string().min(1, "Password is required").max(200),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(200),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(200),
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export const leadStatusUpdateSchema = z.object({
  status: z.enum(["new", "contacted", "converted", "archived"]),
});

export const leadNotesUpdateSchema = z.object({
  notes: z.string().max(2000).nullable(),
});

export const bulkStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  status: z.enum(["new", "contacted", "converted", "archived"]),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
});

const blogTagsField = z
  .array(z.string().trim().min(1).max(40))
  .max(20)
  .optional();

export const blogPostCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(240),
  slug: z.string().trim().max(160).optional(),
  excerpt: z.string().trim().max(500).optional(),
  body: z.string().max(120_000).optional(),
  coverImage: z.string().trim().max(500).optional(),
  author: z.string().trim().max(120).optional(),
  tags: blogTagsField,
  published: z.boolean().optional(),
});

export const blogPostUpdateSchema = blogPostCreateSchema.partial();
