import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";


import authRoutes from "./routes/auth.js";
import leadsRoutes from "./routes/leads.js";
import adminRoutes from "./routes/admin.js";
import adminIsaRoutes from "./routes/admin-isa.js";
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

const FRONTEND_DIST_RAW = process.env.FRONTEND_DIST?.trim();
const frontendDistAbs = FRONTEND_DIST_RAW
  ? path.isAbsolute(FRONTEND_DIST_RAW)
    ? FRONTEND_DIST_RAW
    : path.resolve(process.cwd(), FRONTEND_DIST_RAW)
  : null;

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

function isPrivateLanIpv4(hostname) {
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(hostname);
  if (!m) return false;
  const oct = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  if (oct.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return false;
  const [a, b] = oct;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

/** Vite (or similar) on another device / LAN IP — same need as localhost for dev. */
function isPrivateLanDevOrigin(origin) {
  try {
    const hostname = new URL(origin).hostname;
    return isPrivateLanIpv4(hostname);
  } catch {
    return false;
  }
}

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
      if (
        IS_DEV &&
        (LOCAL_ORIGIN_RE.test(origin) || isPrivateLanDevOrigin(origin))
      ) {
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
app.use("/api/admin", adminIsaRoutes);
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

if (frontendDistAbs) {
  app.use(
    express.static(frontendDistAbs, {
      index: "index.html",
      maxAge: "1h",
      fallthrough: true,
    }),
  );
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      next();
      return;
    }
    res.sendFile(path.join(frontendDistAbs, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

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
  if (frontendDistAbs) {
    console.log(`Serving SPA from ${frontendDistAbs}`);
  }
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
