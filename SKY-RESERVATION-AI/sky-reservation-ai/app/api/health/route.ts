import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { status: "ok" | "error"; latencyMs?: number; error?: string }> = {};

  // Check Supabase connectivity
  try {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const t0 = Date.now();
    const { error } = await supabase.from("tenants").select("id").limit(1);
    checks.database = error
      ? { status: "error", error: error.message }
      : { status: "ok", latencyMs: Date.now() - t0 };
  } catch (e) {
    checks.database = { status: "error", error: String(e) };
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      version: process.env.npm_package_version ?? "1.0.0",
      uptime: process.uptime?.() ?? 0,
      latencyMs: Date.now() - start,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
