/**
 * Prisma's schema requires env("DATABASE_URL"). Many hosts store MySQL as
 * separate fields (host, user, password, database) instead of one URL.
 *
 * If DATABASE_URL is already set, it is left unchanged.
 * Otherwise it is built from: DB_HOST, DB_PORT (default 3306), DB_USER,
 * DB_PASSWORD (may be empty), DB_NAME.
 *
 * Import this module before @prisma/client or mysql2 pool creation.
 */

function buildMysqlUrl(host, port, user, password, database) {
  const u = encodeURIComponent(user);
  const p = encodeURIComponent(password ?? "");
  return `mysql://${u}:${p}@${host}:${port}/${database}`;
}

function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return;
  }

  const host = process.env.DB_HOST?.trim();
  const port = String(process.env.DB_PORT || "3306").trim();
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_NAME?.trim();

  if (!host || user === undefined || user === null || user === "" || !database) {
    console.error(
      [
        "Database configuration:",
        "  Set DATABASE_URL, or set DB_HOST, DB_PORT (optional, default 3306),",
        "  DB_USER, DB_PASSWORD (may be empty), and DB_NAME.",
      ].join("\n"),
    );
    process.exit(1);
  }

  process.env.DATABASE_URL = buildMysqlUrl(host, port, user, password, database);
}

ensureDatabaseUrl();
