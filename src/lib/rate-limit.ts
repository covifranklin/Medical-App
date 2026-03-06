/**
 * Simple in-memory rate limiter for auth endpoints.
 * In production, use Redis-backed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60_000;

function cleanupIfNeeded() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key);
  });
}

interface RateLimitOptions {
  /** Max requests per window */
  max: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

/**
 * Check rate limit for a given key (typically IP + route).
 * Returns { allowed, remaining, resetIn } or throws with retry info.
 */
export function checkRateLimit(
  key: string,
  opts: RateLimitOptions = { max: 5, windowSeconds: 60 }
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  cleanupIfNeeded();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + opts.windowSeconds * 1000 });
    return { allowed: true, remaining: opts.max - 1, resetInSeconds: opts.windowSeconds };
  }

  entry.count++;
  const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count > opts.max) {
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  return { allowed: true, remaining: opts.max - entry.count, resetInSeconds };
}

/**
 * Extract a rate-limit key from a request (IP + path).
 */
export function rateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const url = new URL(request.url);
  return `${ip}:${url.pathname}`;
}

// ── Daily rate limiter (for AI endpoints) ───────────────

const dailyStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check a daily rate limit keyed by userId + action.
 * Resets at midnight UTC each day.
 */
export function checkDailyRateLimit(
  userId: string,
  action: string,
  maxPerDay: number
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const key = `daily:${userId}:${action}`;

  // Clean up expired daily entries
  dailyStore.forEach((entry, k) => {
    if (entry.resetAt < now) dailyStore.delete(k);
  });

  const entry = dailyStore.get(key);

  // Calculate next midnight UTC
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  const resetAt = tomorrow.getTime();
  const resetInSeconds = Math.ceil((resetAt - now) / 1000);

  if (!entry || entry.resetAt < now) {
    dailyStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxPerDay - 1, resetInSeconds };
  }

  entry.count++;

  if (entry.count > maxPerDay) {
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  return { allowed: true, remaining: maxPerDay - entry.count, resetInSeconds };
}
