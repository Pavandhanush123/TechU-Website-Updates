import { Router } from "express";
import { CMS_SECTION_KEYS, getSection, listSections } from "../cms.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/sections", asyncHandler(async (_req, res) => {
  const all = await listSections();
  const known = new Set(CMS_SECTION_KEYS);
  const sections = all.filter((s) => known.has(s.key));
  res.json({ ok: true, sections });
}));

router.get("/sections/:key", asyncHandler(async (req, res) => {
  const key = String(req.params.key);
  if (!CMS_SECTION_KEYS.includes(key)) {
    return res.status(404).json({ ok: false, error: "Section not found" });
  }
  const section = await getSection(key);
  if (!section) {
    return res.status(404).json({ ok: false, error: "Section not found" });
  }
  res.json({ ok: true, section });
}));

export default router;
