import { Router } from "express";
// OLD: import { pool, newId } from "../db.js";
import { newId } from "../db.js";
import { prisma } from "../prisma.js";
import { normalizeIndianApplicationPhoneCanonical } from "../util/indianPhone.js";
import {
  applicationSchema,
  brochureRequestSchema,
  demoRequestSchema,
} from "../schemas/index.js";
import { rateLimit, clientIp } from "../rate-limit.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";

const router = Router();
const EXPERIENCE_YEARS_MONTHS_REGEX = /^(\d{1,2})\s+years?\s+(\d{1,2})\s+months?$/i;

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL insert used by all three endpoints (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// const INSERT_LEAD_SQL = `INSERT INTO demo_requests
//   (id, full_name, email, phone, course, preferred_date, source)
//   VALUES (?, ?, ?, ?, ?, ?, ?)`;

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL /demo endpoint
// ────────────────────────────────────────────────────────────────────────────
// router.post("/demo", validate(demoRequestSchema), asyncHandler(async (req, res) => {
//   if (!rateLimit("demo", clientIp(req))) {
//     return res.status(429).json({ ok: false, error: "Too many requests. Please try again in a minute." });
//   }
//   await pool.query(INSERT_LEAD_SQL, [
//     newId(), req.body.fullName, req.body.email, req.body.phone,
//     req.body.course, req.body.preferredDate ? req.body.preferredDate : null, "demo",
//   ]);
//   res.json({ ok: true });
// }));

// NEW: Prisma implementation
router.post("/demo", validate(demoRequestSchema), asyncHandler(async (req, res) => {
  if (!rateLimit("demo", clientIp(req))) {
    return res.status(429).json({
      ok: false,
      error: "Too many requests. Please try again in a minute.",
    });
  }

  const phone =
    normalizeIndianApplicationPhoneCanonical(req.body.phone) ??
    req.body.phone;

  await prisma.demoRequest.create({
    data: {
      id: newId(),
      fullName: req.body.fullName,
      email: req.body.email,
      phone,
      course: req.body.course,
      preferredDate: null,
      source: "demo",
    },
  });
  res.json({ ok: true });
}));

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL /application endpoint
// ────────────────────────────────────────────────────────────────────────────
// router.post("/application", validate(applicationSchema), asyncHandler(async (req, res) => {
//   if (!rateLimit("application", clientIp(req))) {
//     return res.status(429).json({ ok: false, error: "Too many requests. Please try again in a minute." });
//   }
//   const phone = req.body.phone.startsWith("+") ? req.body.phone : `+91 ${req.body.phone}`;
//   await pool.query(INSERT_LEAD_SQL, [
//     newId(), req.body.fullName, req.body.email, phone,
//     `${req.body.course} — ${req.body.experience} yrs experience`, null, "application",
//   ]);
//   res.json({ ok: true });
// }));

// NEW: Prisma implementation
router.post("/application", validate(applicationSchema), asyncHandler(async (req, res) => {
  if (!rateLimit("application", clientIp(req))) {
    return res.status(429).json({
      ok: false,
      error: "Too many requests. Please try again in a minute.",
    });
  }

  const phone =
    normalizeIndianApplicationPhoneCanonical(req.body.phone) ??
    req.body.phone;
  const candidateProfile = String(req.body.experience ?? "").trim();
  let profileLabel = `${candidateProfile} yrs experience`;
  if (/^\d{4}$/.test(candidateProfile)) {
    profileLabel = `Passout Year: ${candidateProfile}`;
  } else if (EXPERIENCE_YEARS_MONTHS_REGEX.test(candidateProfile)) {
    profileLabel = `Experience: ${candidateProfile}`;
  }

  await prisma.demoRequest.create({
    data: {
      id: newId(),
      fullName: req.body.fullName,
      email: req.body.email,
      phone,
      course: req.body.learningMode 
        ? `${req.body.course} (${req.body.learningMode}) — ${profileLabel}`
        : `${req.body.course} — ${profileLabel}`,
      preferredDate: null,
      source: "application",
    },
  });
  res.json({ ok: true });
}));

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL /brochure endpoint
// ────────────────────────────────────────────────────────────────────────────
// router.post("/brochure", validate(brochureRequestSchema), asyncHandler(async (req, res) => {
//   if (!rateLimit("brochure", clientIp(req))) {
//     return res.status(429).json({ ok: false, error: "Too many requests. Please try again in a minute." });
//   }
//   const phone = req.body.phone.startsWith("+") ? req.body.phone : `+91 ${req.body.phone}`;
//   await pool.query(INSERT_LEAD_SQL, [
//     newId(), req.body.fullName, req.body.email, phone,
//     `Brochure — ${req.body.course}`, null, "brochure",
//   ]);
//   res.json({ ok: true });
// }));

// NEW: Prisma implementation
router.post("/brochure", validate(brochureRequestSchema), asyncHandler(async (req, res) => {
  if (!rateLimit("brochure", clientIp(req))) {
    return res.status(429).json({
      ok: false,
      error: "Too many requests. Please try again in a minute.",
    });
  }

  const phone =
    normalizeIndianApplicationPhoneCanonical(req.body.phone) ??
    req.body.phone;

  try {
    await prisma.demoRequest.create({
      data: {
        id: newId(),
        fullName: req.body.fullName,
        email: req.body.email,
        phone,
        course: `Brochure — ${req.body.course}`,
        preferredDate: null,
        source: "brochure",
      },
    });
    res.json({ ok: true });
  } catch (err) {
    // If it's a connection issue, try once more after a short delay
    if (err.message?.includes("connection") || err.code === "P1001") {
      await prisma.$connect();
      await prisma.demoRequest.create({
        data: {
          id: newId(),
          fullName: req.body.fullName,
          email: req.body.email,
          phone,
          course: `Brochure — ${req.body.course}`,
          preferredDate: null,
          source: "brochure",
        },
      });
      return res.json({ ok: true });
    }
    throw err;
  }
}));

export default router;

