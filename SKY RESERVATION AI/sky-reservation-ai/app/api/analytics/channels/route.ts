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

    const { data: convRows } = await admin
      .from("conversations")
      .select("channel, status")
      .eq("tenant_id", tenantId);

    const rows = (convRows ?? []) as Array<{ channel: string; status: string }>;

    const channels = {
      voice: 0,
      whatsapp: 0,
      sms: 0,
      web: 0,
    };

    let answered = 0;
    let missed = 0;

    for (const row of rows) {
      const ch = row.channel as keyof typeof channels;
      if (ch in channels) {
        channels[ch] += 1;
      }
      if (row.status === "missed") {
        missed += 1;
      } else {
        answered += 1;
      }
    }

    return NextResponse.json({
      data: {
        ...channels,
        answered,
        missed,
        total: rows.length,
      },
    });
  } catch (err) {
    console.error("Analytics channels error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
