import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

function getRateLimiter() {
  if (ratelimit) return ratelimit;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    ratelimit = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
    });
    return ratelimit;
  }

  return null; // no Redis → skip rate limiting in dev
}

export async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  const rl = getRateLimiter();
  if (!rl) return { success: true };
  const result = await rl.limit(identifier);
  return { success: result.success };
}
