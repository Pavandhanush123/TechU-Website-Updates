import { Router } from "express";
// OLD: import { pool } from "../db.js";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import {
  bulkDeleteSchema,
  bulkStatusSchema,
  leadNotesUpdateSchema,
  leadStatusUpdateSchema,
} from "../schemas/index.js";

const router = Router();

router.use(requireAdmin);

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// router.get("/leads", asyncHandler(async (_req, res) => {
//   const [rows] = await pool.query(
//     `SELECT id, created_at, full_name, email, phone, course, preferred_date,
//             source, status, notes, updated_at
//        FROM demo_requests ORDER BY created_at DESC`,
//   );
//   res.json({ ok: true, leads: rows });
// }));

// NEW: Prisma implementation
router.get("/leads", asyncHandler(async (_req, res) => {
  const rows = await prisma.demoRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  // Map camelCase Prisma fields to snake_case keys the frontend expects
  const leads = rows.map((r) => ({
    id: r.id,
    created_at: r.createdAt,
    full_name: r.fullName,
    email: r.email,
    phone: r.phone,
    course: r.course,
    preferred_date: r.preferredDate,
    source: r.source,
    status: r.status,
    notes: r.notes,
    updated_at: r.updatedAt,
  }));
  res.json({ ok: true, leads });
}));

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// router.get("/stats", asyncHandler(async (_req, res) => {
//   const [totalRows] = await pool.query("SELECT COUNT(*) AS c FROM demo_requests");
//   const total = Number(totalRows[0]?.c ?? 0);
//   const [last7Rows] = await pool.query(
//     "SELECT COUNT(*) AS c FROM demo_requests WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
//   );
//   const last7 = Number(last7Rows[0]?.c ?? 0);
//   const [newRows] = await pool.query(
//     "SELECT COUNT(*) AS c FROM demo_requests WHERE status = 'new'",
//   );
//   const newCount = Number(newRows[0]?.c ?? 0);
//   const [convertedRows] = await pool.query(
//     "SELECT COUNT(*) AS c FROM demo_requests WHERE status = 'converted'",
//   );
//   const converted = Number(convertedRows[0]?.c ?? 0);
//   const [bySourceRows] = await pool.query(
//     "SELECT source, COUNT(*) AS c FROM demo_requests GROUP BY source",
//   );
//   const bySource = bySourceRows.map((r) => ({ source: String(r.source), c: Number(r.c) }));
//   res.json({ ok: true, total, last7, newCount, converted, bySource });
// }));

// NEW: Prisma implementation
router.get("/stats", asyncHandler(async (_req, res) => {
  const total = await prisma.demoRequest.count();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last7 = await prisma.demoRequest.count({
    where: { createdAt: { gte: sevenDaysAgo } },
  });

  const newCount = await prisma.demoRequest.count({
    where: { status: "new" },
  });

  const converted = await prisma.demoRequest.count({
    where: { status: "converted" },
  });

  const bySourceRaw = await prisma.demoRequest.groupBy({
    by: ["source"],
    _count: { _all: true },
  });
  const bySource = bySourceRaw.map((r) => ({
    source: String(r.source),
    c: r._count._all,
  }));

  res.json({ ok: true, total, last7, newCount, converted, bySource });
}));

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// router.patch("/leads/:id/status", validate(leadStatusUpdateSchema), asyncHandler(async (req, res) => {
//   const [result] = await pool.query(
//     "UPDATE demo_requests SET status = ? WHERE id = ?",
//     [req.body.status, req.params.id],
//   );
//   if (result.affectedRows === 0) {
//     return res.status(404).json({ ok: false, error: "Lead not found" });
//   }
//   res.json({ ok: true });
// }));

// NEW: Prisma implementation
router.patch("/leads/:id/status", validate(leadStatusUpdateSchema), asyncHandler(async (req, res) => {
  try {
    await prisma.demoRequest.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(404).json({ ok: false, error: "Lead not found" });
    }
    throw e;
  }
}));

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// router.delete("/leads/:id", asyncHandler(async (req, res) => {
//   const [result] = await pool.query(
//     "DELETE FROM demo_requests WHERE id = ?",
//     [req.params.id],
//   );
//   if (result.affectedRows === 0) {
//     return res.status(404).json({ ok: false, error: "Lead not found" });
//   }
//   res.json({ ok: true });
// }));

// NEW: Prisma implementation
router.delete("/leads/:id", asyncHandler(async (req, res) => {
  try {
    await prisma.demoRequest.delete({
      where: { id: req.params.id },
    });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(404).json({ ok: false, error: "Lead not found" });
    }
    throw e;
  }
}));

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// router.patch("/leads/:id/notes", validate(leadNotesUpdateSchema), asyncHandler(async (req, res) => {
//   const [result] = await pool.query(
//     "UPDATE demo_requests SET notes = ? WHERE id = ?",
//     [req.body.notes, req.params.id],
//   );
//   if (result.affectedRows === 0) {
//     return res.status(404).json({ ok: false, error: "Lead not found" });
//   }
//   res.json({ ok: true });
// }));

// NEW: Prisma implementation
router.patch("/leads/:id/notes", validate(leadNotesUpdateSchema), asyncHandler(async (req, res) => {
  try {
    await prisma.demoRequest.update({
      where: { id: req.params.id },
      data: { notes: req.body.notes },
    });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(404).json({ ok: false, error: "Lead not found" });
    }
    throw e;
  }
}));

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// router.post("/leads/bulk-status", validate(bulkStatusSchema), asyncHandler(async (req, res) => {
//   const placeholders = req.body.ids.map(() => "?").join(",");
//   const [result] = await pool.query(
//     `UPDATE demo_requests SET status = ? WHERE id IN (${placeholders})`,
//     [req.body.status, ...req.body.ids],
//   );
//   res.json({ ok: true, updated: result.affectedRows });
// }));

// NEW: Prisma implementation
router.post("/leads/bulk-status", validate(bulkStatusSchema), asyncHandler(async (req, res) => {
  const result = await prisma.demoRequest.updateMany({
    where: { id: { in: req.body.ids } },
    data: { status: req.body.status },
  });
  res.json({ ok: true, updated: result.count });
}));

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// router.post("/leads/bulk-delete", validate(bulkDeleteSchema), asyncHandler(async (req, res) => {
//   const placeholders = req.body.ids.map(() => "?").join(",");
//   const [result] = await pool.query(
//     `DELETE FROM demo_requests WHERE id IN (${placeholders})`,
//     req.body.ids,
//   );
//   res.json({ ok: true, deleted: result.affectedRows });
// }));

// NEW: Prisma implementation
router.post("/leads/bulk-delete", validate(bulkDeleteSchema), asyncHandler(async (req, res) => {
  const result = await prisma.demoRequest.deleteMany({
    where: { id: { in: req.body.ids } },
  });
  res.json({ ok: true, deleted: result.count });
}));

export default router;

