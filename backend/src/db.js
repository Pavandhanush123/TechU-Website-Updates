import "./ensure-database-url.js";
import mysql from "mysql2/promise";
import { randomUUID } from "node:crypto";

if (!process.env.DATABASE_URL?.trim()) {
  console.error(
    "Refusing to start: DATABASE_URL is missing after resolving credentials.",
  );
  process.exit(1);
}

export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,
  waitForConnections: true,
  multipleStatements: false,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
});

export const newId = () => randomUUID();
