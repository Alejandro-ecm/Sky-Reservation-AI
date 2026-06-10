import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase service role credentials");
  return createServiceClient(url, serviceKey);
}

type DayKey = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

const DOW_KEYS: DayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

type PeakHourRow = {
  hour: number;
  sunday: number;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
};

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

    // Fetch all reservations for this tenant with start_time
    const { data: resRows } = await admin
      .from("reservations")
      .select("start_time")
      .eq("tenant_id", tenantId);

    // Build matrix: hour (0-23) x day (0=Sun...6=Sat)
    const matrix: number[][] = Array.from({ length: 24 }, () => new Array(7).fill(0) as number[]);

    for (const row of resRows ?? []) {
      const dt = new Date(row.start_time as string);
      const hour = dt.getHours();
      const dow = dt.getDay(); // 0=Sunday
      matrix[hour][dow] += 1;
    }

    // Transform into array of { hour, monday, tuesday, ... }
    const result: PeakHourRow[] = matrix.map((dayCounts, hour) => {
      const entry: PeakHourRow = {
        hour,
        sunday: dayCounts[0],
        monday: dayCounts[1],
        tuesday: dayCounts[2],
        wednesday: dayCounts[3],
        thursday: dayCounts[4],
        friday: dayCounts[5],
        saturday: dayCounts[6],
      };
      return entry;
    });

    // Suppress unused variable warning
    void DOW_KEYS;

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("Analytics peak-hours error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
