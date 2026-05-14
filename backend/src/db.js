import mysql from "mysql2/promise";
import { randomUUID } from "node:crypto";

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

if (!DB_NAME || !DB_USER || DB_PASSWORD === undefined) {
  console.error(
    "Refusing to start: DB_NAME, DB_USER, and DB_PASSWORD are required.\n" +
      "Set them in the backend environment variables.",
  );
  process.exit(1);
}

export const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  connectionLimit: 10,
  waitForConnections: true,
  multipleStatements: false,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
});

// ────────────────────────────────────────────────────────────────────────────
// OLD: initSchema() removed — table creation is now handled by Prisma
// Migrations (npx prisma migrate dev). Default data is seeded via
// npx prisma db seed (see prisma/seed.js).
// ────────────────────────────────────────────────────────────────────────────

export const newId = () => randomUUID();

