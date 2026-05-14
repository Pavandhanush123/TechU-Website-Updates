import { z } from "zod";

const PASSOUT_BASE_START_YEAR = 2021;
const PASSOUT_BASE_END_YEAR = 2026;
const PASSOUT_BASE_REFERENCE_YEAR = 2026;
const APRIL_MONTH_INDEX = 3;

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
  .max(100, "Name is too long")
  .regex(
    /^[A-Za-z][A-Za-z\s.'-]+$/,
    "Use letters only (spaces, hyphens and apostrophes are fine)",
  );

const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(255, "Email is too long")
  .email("Enter a valid email address");

const phoneField = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .transform(sanitizePhone)
  .pipe(
    z.string().regex(/^\+?\d{10,15}$/, "Enter a valid mobile number (10 digits after +91)"),
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

const getPassoutYearRange = (today = new Date()) => {
  const year = today.getFullYear();
  const month = today.getMonth();
  const effectiveYear = month >= APRIL_MONTH_INDEX ? year : year - 1;
  const shift = Math.max(0, effectiveYear - PASSOUT_BASE_REFERENCE_YEAR);
  return {
    startYear: PASSOUT_BASE_START_YEAR + shift,
    endYear: PASSOUT_BASE_END_YEAR + shift,
  };
};

const isPassoutYearInRange = (value) => {
  if (!/^\d{4}$/.test(value.trim())) return false;
  const year = Number(value);
  const { startYear, endYear } = getPassoutYearRange();
  return year >= startYear && year <= endYear;
};

export const demoRequestSchema = z.object({
  fullName: fullNameField,
  email: emailField,
  phone: phoneField,
  course: courseField,
});

export const applicationSchema = z.object({
  fullName: fullNameField,
  email: emailField,
  phone: phoneField,
  experience: z
    .string()
    .trim()
    .min(1, "Please select your year of passing")
    .max(80)
    .refine(
      (v) => {
        const trimmed = v.trim();
        if (isPassoutYearInRange(trimmed)) return true;
        if (isExperienceYearsMonths(trimmed)) return true;
        if (!/^\d{1,2}(\.\d)?$/.test(trimmed)) return false;
        const n = Number(trimmed);
        return Number.isFinite(n) && n >= 0 && n <= 50;
      },
      "Choose a valid graduation year from the list",
    ),
  course: courseField,
  learningMode: z.string().trim().optional(),
});

export const brochureRequestSchema = z.object({
  fullName: fullNameField,
  email: emailField,
  phone: phoneField,
  course: courseField,
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
