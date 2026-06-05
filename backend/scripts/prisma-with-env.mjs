/**
 * Runs Prisma CLI after building DATABASE_URL from DB_* when needed.
 * Usage (from backend/): node --env-file=.env ./scripts/prisma-with-env.mjs migrate deploy
 */
import "../src/ensure-database-url.js";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(here, "..");
const prismaArgs = process.argv.slice(2);

const res = spawnSync("npx", ["prisma", ...prismaArgs], {
  cwd: backendRoot,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(res.status === 0 ? 0 : (res.status ?? 1));
