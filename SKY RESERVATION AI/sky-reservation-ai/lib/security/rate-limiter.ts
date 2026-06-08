import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let upstashApi: Ratelimit | null = null;
let upstashAuth: Ratelimit | null = null;
let upstashWebhook: Ratelimit | null = null;
let upstashAi: Ratelimit | null = null;
let upstashPublicBook: Ratelimit | null = null;

if (hasUpstash) {
  const redis = Redis.fromEnv();
  upstashApi       = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, "1 m"),  prefix: "sky:api" });
  upstashAuth      = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10,  "1 m"),  prefix: "sky:auth" });
  upstashWebhook   = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(200, "1 m"),  prefix: "sky:webhook" });
  upstashAi        = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30,  "1 m"),  prefix: "sky:ai" });
  upstashPublicBook = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  "1 h"),  prefix: "sky:book" });
}

// In-memory fallback for local dev without Upstash configured
interface RateWindow { count: number; resetAt: number }
const store = new Map<string, RateWindow>();

if (!hasUpstash && typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, w] of store.entries()) {
      if (w.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

function localLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const w = store.get(key);
  if (!w || w.resetAt < now) {
    const next: RateWindow = { count: 1, resetAt: now + windowMs };
    store.set(key, next);
    return { allowed: true, remaining: limit - 1, resetAt: next.resetAt };
  }
  w.count++;
  return {
    allowed: w.count <= limit,
    remaining: Math.max(0, limit - w.count),
    resetAt: w.resetAt,
  };
}

async function upstashLimit(limiter: Ratelimit, id: string): Promise<RateLimitResult> {
  const { success, remaining, reset } = await limiter.limit(id);
  return { allowed: success, remaining, resetAt: reset };
}

export async function apiLimiter(ip: string): Promise<RateLimitResult> {
  if (upstashApi) return upstashLimit(upstashApi, ip);
  return localLimit(`api:${ip}`, 100, 60_000);
}

export async function authLimiter(ip: string): Promise<RateLimitResult> {
  if (upstashAuth) return upstashLimit(upstashAuth, ip);
  return localLimit(`auth:${ip}`, 10, 60_000);
}

export async function webhookLimiter(ip: string): Promise<RateLimitResult> {
  if (upstashWebhook) return upstashLimit(upstashWebhook, ip);
  return localLimit(`webhook:${ip}`, 200, 60_000);
}

export async function aiLimiter(tenantId: string): Promise<RateLimitResult> {
  if (upstashAi) return upstashLimit(upstashAi, tenantId);
  return localLimit(`ai:${tenantId}`, 30, 60_000);
}

export async function publicBookingLimiter(ip: string): Promise<RateLimitResult> {
  if (upstashPublicBook) return upstashLimit(upstashPublicBook, ip);
  return localLimit(`book:${ip}`, 5, 60 * 60_000);
}
