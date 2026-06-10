import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scoreLeadWithAI } from "@/lib/openai/ai-assistant";

export async function POST(request: NextRequest) {
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

    const body = (await request.json()) as { customerId: string };
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json({ error: "customerId is required" }, { status: 400 });
    }

    // Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Fetch conversation history
    const { data: conversations } = await supabase
      .from("conversations")
      .select("channel, status, created_at, messages")
      .eq("customer_id", customerId)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch reservation history
    const { data: reservations } = await supabase
      .from("reservations")
      .select("status, start_time, service:services(name, price)")
      .eq("customer_id", customerId)
      .eq("tenant_id", profile.tenant_id)
      .order("start_time", { ascending: false })
      .limit(20);

    // Build customer data object for AI
    const customerDataForAI = {
      customer: {
        name: customer.name,
        tags: customer.tags,
        current_lead_score: customer.lead_score,
        last_contact_at: customer.last_contact_at,
        total_reservations: customer.total_reservations,
        created_at: customer.created_at,
      },
      reservations: {
        total: reservations?.length ?? 0,
        completed: reservations?.filter((r) => r.status === "completed").length ?? 0,
        cancelled: reservations?.filter((r) => r.status === "cancelled").length ?? 0,
        upcoming: reservations?.filter((r) => r.status === "pending" || r.status === "confirmed").length ?? 0,
        recent: reservations?.slice(0, 5).map((r) => ({
          status: r.status,
          date: r.start_time,
          service: r.service,
        })),
      },
      conversations: {
        total: conversations?.length ?? 0,
        channels: [...new Set(conversations?.map((c) => c.channel) ?? [])],
        resolved: conversations?.filter((c) => c.status === "resolved").length ?? 0,
      },
    };

    // Score with AI
    const result = await scoreLeadWithAI(customerDataForAI);

    // Update customer lead_score in DB
    const { error: updateError } = await supabase
      .from("customers")
      .update({ lead_score: result.score })
      .eq("id", customerId)
      .eq("tenant_id", profile.tenant_id);

    if (updateError) {
      console.error("Failed to update lead score:", updateError);
    }

    return NextResponse.json({
      score: result.score,
      reasoning: result.reasoning,
    });
  } catch (err) {
    console.error("Score lead POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
