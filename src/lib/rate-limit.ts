import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("Upstash Redis not configured — rate limiting disabled");
    return null;
  }

  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: false,
  });

  return ratelimit;
}

// Returns { allowed: true } or { allowed: false, retryAfter: ms }
export async function checkRateLimit(
  identifier: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const rl = getRatelimit();

  if (!rl) {
    // Upstash not configured — allow through
    return { allowed: true };
  }

  try {
    const { success, reset } = await rl.limit(identifier);
    if (success) {
      return { allowed: true };
    }
    return { allowed: false, retryAfter: reset - Date.now() };
  } catch (error) {
    // Rate limiter failure — log and allow through (don't block on infra issues)
    console.error("Rate limit check failed:", error);
    return { allowed: true };
  }
}

// Generate rate limit key from IP + UA (F18: corporate proxy handling)
export function rateLimitKey(ip: string, ua: string): string {
  // Simple concatenation — hash done by Upstash internally
  return `${ip}:${ua.slice(0, 50)}`;
}
