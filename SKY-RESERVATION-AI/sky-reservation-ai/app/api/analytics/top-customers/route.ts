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

    type ResRow = {
      customer_id: string;
      status: string;
      start_time: string;
      customers: { id: string; name: string; phone: string | null } | null;
      services: { price: number } | null;
    };

    const { data: resRows } = await admin
      .from("reservations")
      .select("customer_id, status, start_time, customers!inner(id, name, phone), services!inner(price)")
      .eq("tenant_id", tenantId) as { data: ResRow[] | null };

    // Aggregate by customer
    type CustomerAgg = {
      customerId: string;
      name: string;
      phone: string | null;
      reservationCount: number;
      totalRevenue: number;
      lastVisit: string;
    };

    const map = new Map<string, CustomerAgg>();

    for (const row of resRows ?? []) {
      if (!row.customers) continue;
      const cid = row.customer_id;
      const existing = map.get(cid);
      const revenue = row.status === "completed" ? (row.services?.price ?? 0) : 0;

      if (existing) {
        existing.reservationCount += 1;
        existing.totalRevenue += revenue;
        if (row.start_time > existing.lastVisit) {
          existing.lastVisit = row.start_time;
        }
      } else {
        map.set(cid, {
          customerId: cid,
          name: row.customers.name,
          phone: row.customers.phone,
          reservationCount: 1,
          totalRevenue: revenue,
          lastVisit: row.start_time,
        });
      }
    }

    const topCustomers = Array.from(map.values())
      .sort((a, b) => b.reservationCount - a.reservationCount)
      .slice(0, 10);

    return NextResponse.json({ data: topCustomers });
  } catch (err) {
    console.error("Analytics top-customers error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
