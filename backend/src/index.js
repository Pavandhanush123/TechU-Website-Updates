import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


import authRoutes from "./routes/auth.js";
import leadsRoutes from "./routes/leads.js";
import adminRoutes from "./routes/admin.js";
import cmsPublicRoutes from "./routes/cms-public.js";
import cmsAdminRoutes from "./routes/cms-admin.js";
import blogsPublicRoutes from "./routes/blogs-public.js";
import blogsAdminRoutes from "./routes/blogs-admin.js";
import uploadsRoutes, { UPLOAD_DIR } from "./routes/uploads.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { asyncHandler } from "./middleware/asyncHandler.js";
import { prisma } from "./prisma.js";

if (process.env.NODE_ENV === "production") {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error(
      "Refusing to start: AUTH_SECRET is required in production.\n" +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
    process.exit(1);
  }
  if (secret.length < 32) {
    console.error(
      "Refusing to start: AUTH_SECRET must be at least 32 characters.",
    );
    process.exit(1);
  }
}

// Verify database connectivity at startup.
// Table creation is handled by: npx prisma migrate dev
// Default data is handled by:   npx prisma db seed
try {
  await prisma.$queryRaw`SELECT 1`;
} catch (err) {
  console.error("Database failed to connect:", err);
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";

app.set("trust proxy", 1);

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const IS_DEV = process.env.NODE_ENV !== "production";
const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      if (ALLOWED_ORIGINS.includes(origin)) {
        cb(null, true);
        return;
      }
      if (IS_DEV && LOCAL_ORIGIN_RE.test(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json({ limit: "512kb" }));
app.use(cookieParser());

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );
  next();
});

const STARTED_AT = new Date().toISOString();

app.get("/api/health", asyncHandler(async (_req, res) => {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    /* dbOk stays false */
  }
  res.json({
    ok: dbOk,
    startedAt: STARTED_AT,
    nodeEnv: process.env.NODE_ENV ?? "development",
  });
}));

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/cms", cmsPublicRoutes);
app.use("/api/blogs", blogsPublicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/cms", cmsAdminRoutes);
app.use("/api/admin/blogs", blogsAdminRoutes);
app.use("/api/admin/uploads", uploadsRoutes);

// Serve uploaded files publicly. Long-lived cache because filenames are
// content-addressed (random per upload), so they never need to revalidate.
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    immutable: true,
    maxAge: "30d",
    fallthrough: true,
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);

app.get("/api/test-prisma", asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    take: 5,
    select: {
      id: true,
      email: true,
      createdAt: true,
      roles: true
    }
  });
  res.json({ ok: true, users });
}));

app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

app.use(errorHandler);

const server = app.listen(PORT, HOST, () => {
  console.log(`TechU API listening on http://${HOST}:${PORT}`);
});

function shutdown(signal) {
  console.log(`Received ${signal} — shutting down gracefully…`);
  server.close(async (err) => {
    if (err) {
      console.error("Error during server close:", err);
      process.exit(1);
    }
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error("Error closing Prisma client:", e);
    }
    console.log("Goodbye.");
    process.exit(0);
  });
  setTimeout(() => {
    console.warn("Forcing exit after 10s shutdown timeout.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
