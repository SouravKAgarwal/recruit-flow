import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";
import { headers } from "next/headers";

/**
 * Rate limiter instance for API routes and server actions.
 * Limits to 10 requests per 10 seconds per user/IP.
 */
export const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  enableProtection: true,
  prefix: "@upstash/ratelimit",
});

/**
 * Utility to enforce rate limits globally in Server Actions or Page renders.
 * Throws an Error if rate limit is exceeded.
 */
export async function enforceRateLimit(
  actionName: string,
  customLimiter = rateLimit,
) {
  const h = await headers();
  const ip = h.get("x-forwarded-for");

  const { success } = await customLimiter.limit(`${actionName}_${ip}`);
  if (!success) {
    throw new Error("Too many requests. Please try again later.");
  }
}
