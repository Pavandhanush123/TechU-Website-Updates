import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  CMS_SECTION_KEYS,
  getSection,
  listSections,
  upsertSection,
} from "../cms.js";

const router = Router();

router.use(requireAdmin);

const MAX_BYTES = 256 * 1024;

router.get("/sections", asyncHandler(async (_req, res) => {
  const all = await listSections();
  const known = new Set(CMS_SECTION_KEYS);
  const sections = all.filter((s) => known.has(s.key));
  // Order to match CMS_SECTION_KEYS for a predictable sidebar.
  sections.sort(
    (a, b) => CMS_SECTION_KEYS.indexOf(a.key) - CMS_SECTION_KEYS.indexOf(b.key),
  );
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

router.put("/sections/:key", asyncHandler(async (req, res) => {
  const key = String(req.params.key);
  if (!CMS_SECTION_KEYS.includes(key)) {
    return res.status(404).json({ ok: false, error: "Unknown section" });
  }
  const data = req.body?.data;
  if (data === undefined || data === null || typeof data !== "object") {
    return res.status(400).json({ ok: false, error: "Body must include `data` object" });
  }
  let serialized;
  try {
    serialized = JSON.stringify(data);
  } catch {
    return res.status(400).json({ ok: false, error: "Data is not JSON-serializable" });
  }
  if (serialized.length > MAX_BYTES) {
    return res
      .status(413)
      .json({ ok: false, error: `Section payload exceeds ${MAX_BYTES} bytes` });
  }
  await upsertSection(key, data);
  const section = await getSection(key);
  res.json({ ok: true, section });
}));

export default router;
