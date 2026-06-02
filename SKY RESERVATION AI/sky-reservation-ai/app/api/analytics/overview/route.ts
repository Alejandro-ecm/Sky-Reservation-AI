import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase service role credentials");
  return createServiceClient(url, serviceKey);
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const tenantId = profile.tenant_id;
    const admin = getServiceRoleClient();

    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    // Parallel queries
    const [
      totalResQuery,
      thisMonthResQuery,
      lastMonthResQuery,
      totalConvQuery,
      thisMonthConvQuery,
      totalCustQuery,
      newCustQuery,
      avgLeadQuery,
      completionQuery,
      topServicesQuery,
      revenueQuery,
    ] = await Promise.all([
      // total_reservations
      admin
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),

      // reservations_this_month
      admin
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", firstDayCurrentMonth),

      // reservations_last_month
      admin
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", firstDayLastMonth)
        .lt("created_at", firstDayCurrentMonth),

      // total_conversations
      admin
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),

      // conversations_this_month
      admin
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", firstDayCurrentMonth),

      // total_customers
      admin
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),

      // new_customers_this_month
      admin
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", firstDayCurrentMonth),

      // avg_lead_score
      admin
        .from("customers")
        .select("lead_score")
        .eq("tenant_id", tenantId),

      // reservation_completion_rate: get counts by status
      admin
        .from("reservations")
        .select("status")
        .eq("tenant_id", tenantId)
        .in("status", ["completed", "no_show", "cancelled"]),

      // top_services: join with services, count reservations per service
      admin
        .from("reservations")
        .select("service_id, services!inner(id, name, price)")
        .eq("tenant_id", tenantId),

      // revenue_estimate: completed reservations this month
      admin
        .from("reservations")
        .select("services!inner(price)")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("created_at", firstDayCurrentMonth)
        .lt("created_at", firstDayNextMonth),
    ]);

    // Compute avg_lead_score
    const leadScores = (avgLeadQuery.data ?? []) as Array<{ lead_score: number }>;
    const avgLeadScore =
      leadScores.length > 0
        ? Math.round(leadScores.reduce((s, c) => s + (c.lead_score ?? 0), 0) / leadScores.length)
        : 0;

    // Compute completion rate
    const statusRows = (completionQuery.data ?? []) as Array<{ status: string }>;
    const completedCount = statusRows.filter((r) => r.status === "completed").length;
    const denominator = statusRows.length;
    const reservationCompletionRate =
      denominator > 0 ? Math.round((completedCount / denominator) * 100) : 0;

    // Compute top_services
    type ServiceRow = { service_id: string; services: { id: string; name: string; price: number } | null };
    const serviceRows = (topServicesQuery.data ?? []) as unknown as ServiceRow[];
    const serviceMap = new Map<string, { name: string; count: number }>();
    for (const row of serviceRows) {
      if (!row.services) continue;
      const key = row.service_id;
      const existing = serviceMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        serviceMap.set(key, { name: row.services.name, count: 1 });
      }
    }
    const topServices = Array.from(serviceMap.entries())
      .map(([id, { name, count }]) => ({ id, name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Compute revenue_estimate
    type RevenueRow = { services: { price: number } | null };
    const revenueRows = (revenueQuery.data ?? []) as unknown as RevenueRow[];
    const revenueEstimate = revenueRows.reduce((s, r) => s + (r.services?.price ?? 0), 0);

    const overview = {
      total_reservations: totalResQuery.count ?? 0,
      reservations_this_month: thisMonthResQuery.count ?? 0,
      reservations_last_month: lastMonthResQuery.count ?? 0,
      total_conversations: totalConvQuery.count ?? 0,
      conversations_this_month: thisMonthConvQuery.count ?? 0,
      total_customers: totalCustQuery.count ?? 0,
      new_customers_this_month: newCustQuery.count ?? 0,
      avg_lead_score: avgLeadScore,
      reservation_completion_rate: reservationCompletionRate,
      top_services: topServices,
      revenue_estimate: revenueEstimate,
    };

    return NextResponse.json({ data: overview });
  } catch (err) {
    console.error("Analytics overview error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
