import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { ensureProfile } from "@/lib/supabase/ensure-profile";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase service role credentials");
  return createServiceClient(url, serviceKey);
}

type TimeseriesPoint = { date: string; value: number };
type Period = "7d" | "30d" | "90d";
type Metric = "reservations" | "conversations" | "customers" | "revenue";

function getPeriodDays(period: Period): number {
  return period === "7d" ? 7 : period === "90d" ? 90 : 30;
}

function buildDateRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: from.toISOString(), to: to.toISOString() };
}

function fillDates(raw: Map<string, number>, days: number): TimeseriesPoint[] {
  const result: TimeseriesPoint[] = [];
  let cumulative = 0;
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const val = raw.get(key) ?? 0;
    cumulative += val;
    result.push({ date: key, value: val });
  }
  return result;
}

function fillDatesCumulative(raw: Map<string, number>, days: number): TimeseriesPoint[] {
  const result: TimeseriesPoint[] = [];
  let cumulative = 0;
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cumulative += raw.get(key) ?? 0;
    result.push({ date: key, value: cumulative });
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await ensureProfile(user);

    if (!profile) {
      return NextResponse.json({ error: "Account not configured" }, { status: 403 });
    }

    const tenantId = profile.tenant_id;
    const searchParams = request.nextUrl.searchParams;
    const metric = (searchParams.get("metric") ?? "reservations") as Metric;
    const period = (searchParams.get("period") ?? "30d") as Period;
    const days = getPeriodDays(period);
    const { from } = buildDateRange(days);

    const admin = getServiceRoleClient();
    const rawMap = new Map<string, number>();

    if (metric === "reservations") {
      const { data } = await admin
        .from("reservations")
        .select("created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", from);

      for (const row of data ?? []) {
        const key = (row.created_at as string).slice(0, 10);
        rawMap.set(key, (rawMap.get(key) ?? 0) + 1);
      }

      return NextResponse.json({ data: fillDates(rawMap, days) });
    }

    if (metric === "conversations") {
      const { data } = await admin
        .from("conversations")
        .select("created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", from);

      for (const row of data ?? []) {
        const key = (row.created_at as string).slice(0, 10);
        rawMap.set(key, (rawMap.get(key) ?? 0) + 1);
      }

      return NextResponse.json({ data: fillDates(rawMap, days) });
    }

    if (metric === "customers") {
      const { data } = await admin
        .from("customers")
        .select("created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", from);

      for (const row of data ?? []) {
        const key = (row.created_at as string).slice(0, 10);
        rawMap.set(key, (rawMap.get(key) ?? 0) + 1);
      }

      return NextResponse.json({ data: fillDatesCumulative(rawMap, days) });
    }

    if (metric === "revenue") {
      type RevenueRow = { created_at: string; services: { price: number } | null };
      const { data } = await admin
        .from("reservations")
        .select("created_at, services!inner(price)")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("created_at", from) as { data: RevenueRow[] | null };

      for (const row of data ?? []) {
        const key = row.created_at.slice(0, 10);
        rawMap.set(key, (rawMap.get(key) ?? 0) + (row.services?.price ?? 0));
      }

      return NextResponse.json({ data: fillDates(rawMap, days) });
    }

    return NextResponse.json({ error: "Invalid metric" }, { status: 400 });
  } catch (err) {
    console.error("Analytics timeseries error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
