import { Router } from "express";
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

router.get("/isa-leads", asyncHandler(async (_req, res) => {
  const rows = await prisma.isaLead.findMany({
    orderBy: { createdAt: "desc" },
  });
  const leads = rows.map((r) => ({
    id: r.id,
    created_at: r.createdAt,
    full_name: r.fullName,
    email: r.email,
    phone: r.phone,
    course: r.course,
    preferred_mode: r.preferredMode,
    status: r.status,
    notes: r.notes,
    updated_at: r.updatedAt,
  }));
  res.json({ ok: true, leads });
}));

router.get("/isa-stats", asyncHandler(async (_req, res) => {
  const total = await prisma.isaLead.count();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last7 = await prisma.isaLead.count({
    where: { createdAt: { gte: sevenDaysAgo } },
  });

  const newCount = await prisma.isaLead.count({
    where: { status: "new" },
  });

  const converted = await prisma.isaLead.count({
    where: { status: "converted" },
  });

  res.json({ ok: true, total, last7, newCount, converted });
}));

router.patch("/isa-leads/:id/status", validate(leadStatusUpdateSchema), asyncHandler(async (req, res) => {
  try {
    await prisma.isaLead.update({
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

router.delete("/isa-leads/:id", asyncHandler(async (req, res) => {
  try {
    await prisma.isaLead.delete({
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

router.patch("/isa-leads/:id/notes", validate(leadNotesUpdateSchema), asyncHandler(async (req, res) => {
  try {
    await prisma.isaLead.update({
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

router.post("/isa-leads/bulk-status", validate(bulkStatusSchema), asyncHandler(async (req, res) => {
  const result = await prisma.isaLead.updateMany({
    where: { id: { in: req.body.ids } },
    data: { status: req.body.status },
  });
  res.json({ ok: true, updated: result.count });
}));

router.post("/isa-leads/bulk-delete", validate(bulkDeleteSchema), asyncHandler(async (req, res) => {
  const result = await prisma.isaLead.deleteMany({
    where: { id: { in: req.body.ids } },
  });
  res.json({ ok: true, deleted: result.count });
}));

export default router;
