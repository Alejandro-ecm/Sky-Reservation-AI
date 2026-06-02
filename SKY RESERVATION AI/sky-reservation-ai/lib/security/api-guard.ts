import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiLimiter, authLimiter, type RateLimitResult } from "./rate-limiter";
import { getClientIP } from "./sanitize";

export interface GuardedContext {
  userId: string;
  tenantId: string;
}

type HandlerFn = (
  req: NextRequest,
  ctx: GuardedContext,
  params?: Record<string, string>
) => Promise<NextResponse>;

/** Wrap an API route handler with auth + rate-limit checks. */
export function withAuth(handler: HandlerFn) {
  return async (
    req: NextRequest,
    params?: Record<string, string>
  ): Promise<NextResponse> => {
    const ip = getClientIP(req.headers);
    const rl = await apiLimiter(ip);

    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 403 });
    }

    return handler(req, { userId: user.id, tenantId: profile.tenant_id }, params);
  };
}

/** Rate-limit for auth endpoints (stricter). */
export function withAuthRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ip = getClientIP(req.headers);
    const rl = await authLimiter(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }
    return handler(req);
  };
}
