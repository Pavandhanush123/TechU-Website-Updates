import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { getIronSession } from "iron-session";

const RAW_SECRET = process.env.AUTH_SECRET;

if (process.env.NODE_ENV === "production" && !RAW_SECRET) {
  console.error(
    "Refusing to start: AUTH_SECRET is required in production.\n" +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
  );
  process.exit(1);
}

const SESSION_PASSWORD =
  RAW_SECRET || "dev-only-secret-change-me-please-32chars-min!!";

if (SESSION_PASSWORD.length < 32) {
  console.error("Refusing to start: AUTH_SECRET must be at least 32 characters.");
  process.exit(1);
}

const COOKIE_SECURE_OVERRIDE = process.env.AUTH_COOKIE_SECURE;
const hasHttpCorsOrigin = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .some((origin) => /^http:\/\//i.test(origin));

const shouldUseSecureCookie =
  COOKIE_SECURE_OVERRIDE === "true"
    ? true
    : COOKIE_SECURE_OVERRIDE === "false"
      ? false
      : process.env.NODE_ENV === "production" && !hasHttpCorsOrigin;

export const sessionOptions = {
  password: SESSION_PASSWORD,
  cookieName: "techu_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export function getSession(req, res) {
  return getIronSession(req, res, sessionOptions);
}

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
