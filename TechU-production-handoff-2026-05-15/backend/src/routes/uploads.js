// Admin-only image upload endpoint. Files are stored under ./uploads/
// with a random filename and served back via /uploads/<file>.
//
// Limits:
//   - 5 MB per file
//   - JPEG / PNG / WebP / GIF / SVG only

import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { requireAdmin } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const UPLOAD_DIR = path.resolve(__dirname, "../../uploads");

mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const EXT_FOR_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext =
      EXT_FOR_MIME[file.mimetype] ||
      path.extname(file.originalname).toLowerCase().slice(0, 8) ||
      ".bin";
    const id = randomBytes(12).toString("hex");
    cb(null, `${Date.now()}-${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only JPEG, PNG, WebP, GIF, and SVG images are allowed."));
  },
});

const router = Router();

router.use(requireAdmin);

router.post("/image", (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      res
        .status(status)
        .json({ ok: false, error: err.message || "Upload failed" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ ok: false, error: "No file uploaded" });
      return;
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({
      ok: true,
      url,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
});

export default router;
