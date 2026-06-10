import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPlanLimit, trackUsage } from "@/lib/billing/limits";

export async function GET(request: NextRequest) {
  try {
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

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const page = parseInt(searchParams.get("page") ?? "1");
    const perPage = parseInt(searchParams.get("per_page") ?? "20");

    let query = supabase
      .from("conversations")
      .select(`
        *,
        customer:customers(id, name, phone, email)
      `, { count: "exact" })
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (status) query = query.eq("status", status);
    if (channel) query = query.eq("channel", channel);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
    });
  } catch (err) {
    console.error("Conversations GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check plan limit before creating a new conversation
    const limitCheck = await checkPlanLimit(profile.tenant_id, "conversations");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Plan limit reached",
          message: `Has alcanzado el límite de ${limitCheck.limit} conversaciones este mes.`,
          upgradeUrl: "/billing",
          used: limitCheck.used,
          limit: limitCheck.limit,
        },
        { status: 402 }
      );
    }

    const body = await request.json();
    const { customer_id, channel, messages } = body;

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        tenant_id: profile.tenant_id,
        customer_id: customer_id || null,
        channel: channel || "web",
        status: "active",
        messages: messages || [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Track usage
    await trackUsage(profile.tenant_id, "conversation", 1);

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("Conversations POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
