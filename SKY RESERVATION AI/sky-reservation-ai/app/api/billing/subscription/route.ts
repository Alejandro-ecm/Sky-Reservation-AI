import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Query subscriptions joined with plan_limits
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .maybeSingle();

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    const currentPlan = subscription?.plan ?? "starter";

    const { data: limits, error: limitsError } = await supabase
      .from("plan_limits")
      .select("*")
      .eq("plan", currentPlan)
      .single();

    if (limitsError) {
      console.error("Plan limits error:", limitsError);
    }

    // Get current month usage
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: usageData } = await supabase
      .from("usage_events")
      .select("event_type, quantity")
      .eq("tenant_id", profile.tenant_id)
      .gte("period_start", periodStart);

    const usage = {
      conversations: 0,
      voice_minutes: 0,
      whatsapp_messages: 0,
    };

    for (const event of usageData ?? []) {
      if (event.event_type === "conversation") usage.conversations += event.quantity;
      if (event.event_type === "voice_minute") usage.voice_minutes += event.quantity;
      if (event.event_type === "whatsapp_message")
        usage.whatsapp_messages += event.quantity;
    }

    return NextResponse.json({
      data: {
        subscription: subscription ?? {
          tenant_id: profile.tenant_id,
          plan: "starter",
          status: "trialing",
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
        },
        limits: limits ?? {
          plan: "starter",
          conversations_per_month: 100,
          voice_minutes_per_month: 60,
          whatsapp_messages_per_month: 200,
          max_staff: 3,
          max_locations: 1,
          ai_model: "gpt-4o-mini",
          has_api_access: false,
          has_advanced_analytics: false,
          has_automations: false,
          has_priority_support: false,
        },
        usage,
      },
    });
  } catch (err) {
    console.error("Subscription GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
