import { Router } from "express";
// OLD: import { pool, newId } from "../db.js";
import { newId } from "../db.js";
import { prisma } from "../prisma.js";
import { getSession, hashPassword, verifyPassword } from "../auth.js";
import { rateLimit, clientIp } from "../rate-limit.js";
import { loginSchema, changePasswordSchema } from "../schemas/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// router.post("/ensure-admin", asyncHandler(async (_req, res) => {
//   const reset = process.env.RESET_ADMIN_PASSWORD === "true";
//   const [adminRows] = await pool.query(
//     "SELECT COUNT(*) AS c FROM user_roles WHERE role = 'admin'",
//   );
//   const adminCount = Number(adminRows[0]?.c ?? 0);
//   if (adminCount > 0 && !reset) {
//     return res.json({ ok: true });
//   }
//   const email = process.env.ADMIN_EMAIL;
//   const password = process.env.ADMIN_PASSWORD;
//   if (!email || !password) {
//     console.error("[ensureAdminUser] ADMIN_EMAIL / ADMIN_PASSWORD not configured");
//     return res.json({ ok: false });
//   }
//   const [existingRows] = await pool.query(
//     "SELECT id FROM users WHERE LOWER(email) = LOWER(?)", [email],
//   );
//   const existing = existingRows[0];
//   let userId;
//   if (existing) {
//     userId = existing.id;
//     await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
//       hashPassword(password), userId,
//     ]);
//     if (reset) {
//       console.warn("[ensureAdminUser] RESET_ADMIN_PASSWORD=true — admin password rotated for", email);
//     }
//   } else {
//     userId = newId();
//     await pool.query(
//       "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
//       [userId, email, hashPassword(password)],
//     );
//   }
//   await pool.query(
//     "INSERT IGNORE INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')",
//     [newId(), userId],
//   );
//   res.json({ ok: true });
// }));

// NEW: Prisma implementation — uses $transaction for atomic user + role creation
router.post("/ensure-admin", asyncHandler(async (_req, res) => {
  const reset = process.env.RESET_ADMIN_PASSWORD === "true";

  const adminCount = await prisma.userRole.count({
    where: { role: "admin" },
  });
  if (adminCount > 0 && !reset) {
    return res.json({ ok: true });
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error(
      "[ensureAdminUser] ADMIN_EMAIL / ADMIN_PASSWORD not configured",
    );
    return res.json({ ok: false });
  }

  // MySQL utf8mb4_unicode_ci collation is already case-insensitive,
  // so a plain equals match works the same as LOWER(email) = LOWER(?)
  const existing = await prisma.user.findFirst({
    where: { email },
  });

  let userId;
  if (existing) {
    userId = existing.id;
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashPassword(password) },
    });
    if (reset) {
      console.warn(
        "[ensureAdminUser] RESET_ADMIN_PASSWORD=true — admin password rotated for",
        email,
      );
    }
  } else {
    // Transaction: create user + admin role atomically
    userId = newId();
    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: userId,
          email,
          passwordHash: hashPassword(password),
        },
      }),
      prisma.userRole.create({
        data: {
          id: newId(),
          userId,
          role: "admin",
        },
      }),
    ]);
    res.json({ ok: true });
    return;
  }

  // For existing user, ensure admin role exists (upsert-style)
  const hasAdminRole = await prisma.userRole.findFirst({
    where: { userId, role: "admin" },
  });
  if (!hasAdminRole) {
    await prisma.userRole.create({
      data: {
        id: newId(),
        userId,
        role: "admin",
      },
    });
  }

  res.json({ ok: true });
}));

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// router.post("/login", validate(loginSchema), asyncHandler(async (req, res) => {
//   if (!rateLimit("login", clientIp(req))) {
//     return res.status(429).json({
//       ok: false,
//       error: "Too many login attempts. Please try again in a minute.",
//     });
//   }
//   const { username, password } = req.body;
//   const [userRows] = await pool.query(
//     "SELECT id, email, password_hash FROM users WHERE LOWER(email) = LOWER(?)",
//     [username],
//   );
//   const user = userRows[0];
//   if (!user || !verifyPassword(password, user.password_hash)) {
//     return res.status(401).json({ ok: false, error: "Invalid email or password." });
//   }
//   const [roleRows] = await pool.query(
//     "SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin' LIMIT 1",
//     [user.id],
//   );
//   const isAdmin = roleRows.length > 0;
//   const session = await getSession(req, res);
//   session.userId = user.id;
//   session.email = user.email;
//   session.isAdmin = isAdmin;
//   await session.save();
//   res.json({ ok: true, isAdmin, email: user.email });
// }));

// NEW: Prisma implementation — single query with include: { roles: true }
router.post("/login", validate(loginSchema), asyncHandler(async (req, res) => {
  if (!rateLimit("login", clientIp(req))) {
    return res.status(429).json({
      ok: false,
      error: "Too many login attempts. Please try again in a minute.",
    });
  }

  const { username, password } = req.body;

  // Fetch user + roles in a single query (replaces two raw SQL queries)
  // MySQL utf8mb4_unicode_ci collation is already case-insensitive,
  // so a plain equals match works the same as LOWER(email) = LOWER(?)
  const user = await prisma.user.findFirst({
    where: { email: username },
    include: { roles: true },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ ok: false, error: "Invalid email or password." });
  }

  const isAdmin = user.roles.some((r) => r.role === "admin");

  const session = await getSession(req, res);
  session.userId = user.id;
  session.email = user.email;
  session.isAdmin = isAdmin;
  await session.save();

  res.json({ ok: true, isAdmin, email: user.email });
}));

router.post("/logout", asyncHandler(async (req, res) => {
  const session = await getSession(req, res);
  session.destroy();
  res.json({ ok: true });
}));

router.get("/session", asyncHandler(async (req, res) => {
  const session = await getSession(req, res);
  if (!session.userId) {
    return res.json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    email: session.email ?? null,
    isAdmin: !!session.isAdmin,
  });
}));

// ────────────────────────────────────────────────────────────────────────────
// OLD: Raw SQL implementation (commented out for comparison)
// ────────────────────────────────────────────────────────────────────────────
// router.post("/change-password", requireAuth, validate(changePasswordSchema), asyncHandler(async (req, res) => {
//   const [userRows] = await pool.query(
//     "SELECT id, password_hash FROM users WHERE id = ?",
//     [req.userId],
//   );
//   const user = userRows[0];
//   if (!user) {
//     return res.status(404).json({ ok: false, error: "Account not found" });
//   }
//   if (!verifyPassword(req.body.currentPassword, user.password_hash)) {
//     return res.status(400).json({ ok: false, error: "Current password is incorrect" });
//   }
//   await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
//     hashPassword(req.body.newPassword), user.id,
//   ]);
//   res.json({ ok: true });
// }));

// NEW: Prisma implementation
router.post("/change-password", requireAuth, validate(changePasswordSchema), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    return res.status(404).json({ ok: false, error: "Account not found" });
  }

  if (!verifyPassword(req.body.currentPassword, user.passwordHash)) {
    return res.status(400).json({ ok: false, error: "Current password is incorrect" });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(req.body.newPassword) },
  });
  res.json({ ok: true });
}));

export default router;

