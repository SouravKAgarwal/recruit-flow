import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";
import { headers } from "next/headers";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Helper: resolve the caller's IP from request headers.
// Falls back to a random UUID so that requests without an IP header are still
// rate-limited (they all get their own bucket rather than sharing one).
// ---------------------------------------------------------------------------
async function resolveIp(): Promise<string> {
  const h = await headers();
  // x-forwarded-for can be a comma-separated list; take the first (client) IP
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = h.get("x-real-ip");
  if (realIp) return realIp.trim();

  // No IP header — return a random ID so this request gets its own bucket
  // and isn't grouped with other headerless requests.
  return `anon-${randomUUID()}`;
}

// ---------------------------------------------------------------------------
// Rate limiter instances
// Each limiter is tuned to the sensitivity of the endpoint it guards.
// ---------------------------------------------------------------------------

/**
 * Generic limiter — used for low-sensitivity actions (profile update, etc.)
 * 5 requests per 10 seconds per key.
 */
export const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  enableProtection: true,
  prefix: "rl:generic",
});

/**
 * Auth limiter — sign-in, sign-up.
 * 5 attempts per minute per IP. Tight enough to block brute-force but
 * loose enough for users who mistype their password a few times.
 */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  enableProtection: true,
  prefix: "rl:auth",
});

/**
 * OTP limiter — email OTP send + verify.
 * 3 attempts per 5 minutes per identifier (email).
 * Limits enumeration and brute-force on the 6-digit OTP space.
 */
export const otpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "5 m"),
  analytics: true,
  enableProtection: true,
  prefix: "rl:otp",
});

/**
 * Password-reset limiter — very tight.
 * 3 requests per hour per IP to prevent reset-link spam / enumeration.
 */
export const resetLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "60 m"),
  analytics: true,
  enableProtection: true,
  prefix: "rl:reset",
});

// ---------------------------------------------------------------------------
// Enforcement helpers
// ---------------------------------------------------------------------------

/**
 * Enforces a rate limit for the given key using the provided limiter.
 * Throws if the limit is exceeded so the caller can catch and return an error.
 *
 * @param actionKey - Unique key for this action (e.g. "sign-in:user@example.com")
 * @param limiter   - Ratelimit instance to use (defaults to `rateLimit`)
 */
export async function enforceRateLimit(
  actionKey: string,
  limiter: Ratelimit = rateLimit,
): Promise<void> {
  const ip = await resolveIp();
  const key = `${actionKey}:${ip}`;
  const { success, reset } = await limiter.limit(key);

  if (!success) {
    const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
    throw new Error(
      `Too many requests. Please try again in ${retryAfterSeconds} second${retryAfterSeconds === 1 ? "" : "s"}.`,
    );
  }
}

/**
 * Enforces a rate limit keyed by email (not IP) — used for per-account
 * limits such as OTP send/verify to prevent per-email enumeration.
 *
 * @param actionPrefix - Action prefix (e.g. "otp-send")
 * @param email        - User's email address
 * @param limiter      - Ratelimit instance to use
 */
export async function enforceEmailRateLimit(
  actionPrefix: string,
  email: string,
  limiter: Ratelimit = otpLimiter,
): Promise<void> {
  const normalised = email.toLowerCase().trim();
  const key = `${actionPrefix}:${normalised}`;
  const { success, reset } = await limiter.limit(key);

  if (!success) {
    const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
    throw new Error(
      `Too many attempts for this email. Please try again in ${retryAfterSeconds} second${retryAfterSeconds === 1 ? "" : "s"}.`,
    );
  }
}
