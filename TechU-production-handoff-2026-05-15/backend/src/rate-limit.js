const BUCKETS = new Map();
const MAX_BUCKETS = 10_000;

const LIMITS = {
  demo: { capacity: 5, refillPerSec: 5 / 60 },
  application: { capacity: 5, refillPerSec: 5 / 60 },
  brochure: { capacity: 10, refillPerSec: 10 / 60 },
  login: { capacity: 10, refillPerSec: 10 / 60 },
};

export function rateLimit(action, ip) {
  const now = Date.now();
  const key = `${action}:${ip}`;
  const cfg = LIMITS[action];

  if (BUCKETS.size > MAX_BUCKETS) {
    const entries = [...BUCKETS.entries()].sort(
      (a, b) => a[1].updated - b[1].updated,
    );
    for (let i = 0; i < Math.floor(entries.length / 4); i++) {
      BUCKETS.delete(entries[i][0]);
    }
  }

  const bucket = BUCKETS.get(key) ?? { tokens: cfg.capacity, updated: now };
  const elapsed = (now - bucket.updated) / 1000;
  bucket.tokens = Math.min(
    cfg.capacity,
    bucket.tokens + elapsed * cfg.refillPerSec,
  );
  bucket.updated = now;

  if (bucket.tokens < 1) {
    BUCKETS.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  BUCKETS.set(key, bucket);
  return true;
}

export function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string") return xff.split(",")[0].trim();
  const real = req.headers["x-real-ip"];
  if (typeof real === "string") return real.trim();
  return req.socket?.remoteAddress ?? "unknown";
}
