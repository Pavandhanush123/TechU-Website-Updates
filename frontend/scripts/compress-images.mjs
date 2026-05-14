/**
 * Recompress raster assets under src/assets and public.
 * PNG: zlib + adaptive filtering (lossless; no palette). JPEG: mozjpeg ~quality 92 (high quality).
 * Only overwrites a file when the output is smaller (JPEG never grows).
 */
import sharp from "sharp";
import { readdir, stat, writeFile, rename, unlink } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const PNG_OPTS = {
  compressionLevel: 9,
  adaptiveFiltering: true,
  palette: false,
};
const JPEG_OPTS = { quality: 92, mozjpeg: true };

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, files);
    else files.push(full);
  }
  return files;
}

async function atomicReplace(filePath, buffer) {
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, buffer);
  try {
    await rename(tmp, filePath);
  } catch (err) {
    try {
      await unlink(tmp);
    } catch {
      /* ignore */
    }
    throw err;
  }
}

async function optimizeFile(file) {
  const ext = path.extname(file).toLowerCase();
  if (![".png", ".jpg", ".jpeg"].includes(ext)) return null;

  const before = (await stat(file)).size;
  let out;

  if (ext === ".png") {
    out = await sharp(file).png(PNG_OPTS).toBuffer();
    if (out.length < before) {
      await atomicReplace(file, out);
      return { file, before, after: out.length };
    }
    return null;
  }

  out = await sharp(file).jpeg(JPEG_OPTS).toBuffer();
  if (out.length < before) {
    await atomicReplace(file, out);
    return { file, before, after: out.length };
  }
  return null;
}

async function main() {
  const dirs = [
    path.join(ROOT, "src", "assets"),
    path.join(ROOT, "public"),
  ];
  let saved = 0;
  let count = 0;

  for (const dir of dirs) {
    let files = [];
    try {
      files = await walk(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      const r = await optimizeFile(file);
      if (r) {
        count++;
        saved += r.before - r.after;
        console.log(
          `${path.relative(ROOT, r.file)}  ${r.before} → ${r.after} B`,
        );
      }
    }
  }

  console.log(
    `\nOptimized ${count} file(s). Total reduction: ${(saved / 1024).toFixed(1)} KiB.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
