import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials");
  return createServiceClient(url, serviceKey);
}

export interface PlanLimits {
  plan: string;
  conversations_per_month: number;
  voice_minutes_per_month: number;
  whatsapp_messages_per_month: number;
  max_staff: number;
  max_locations: number;
  ai_model: string;
  has_api_access: boolean;
  has_advanced_analytics: boolean;
  has_automations: boolean;
  has_priority_support: boolean;
}

export type UsageFeature = "conversations" | "voice_minutes" | "whatsapp_messages";

const DEFAULT_LIMITS: PlanLimits = {
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
};

// ============================================================
// getPlanLimits
// ============================================================
export async function getPlanLimits(plan: string): Promise<PlanLimits> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("plan_limits")
    .select("*")
    .eq("plan", plan)
    .single();

  if (error || !data) {
    console.warn(`getPlanLimits: could not find limits for plan '${plan}', using defaults`);
    return { ...DEFAULT_LIMITS, plan };
  }

  return data as PlanLimits;
}

// ============================================================
// checkPlanLimit
// ============================================================
export async function checkPlanLimit(
  tenantId: string,
  feature: UsageFeature
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabase = getServiceSupabase();

  // Get current plan from subscriptions
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const plan = subscription?.plan ?? "starter";
  const status = subscription?.status ?? "trialing";

  // Cancelled subscriptions are locked to starter limits
  const effectivePlan = status === "cancelled" ? "starter" : plan;
  const limits = await getPlanLimits(effectivePlan);

  // Determine the limit for this feature
  let limit: number;
  let eventType: string;

  switch (feature) {
    case "conversations":
      limit = limits.conversations_per_month;
      eventType = "conversation";
      break;
    case "voice_minutes":
      limit = limits.voice_minutes_per_month;
      eventType = "voice_minute";
      break;
    case "whatsapp_messages":
      limit = limits.whatsapp_messages_per_month;
      eventType = "whatsapp_message";
      break;
    default:
      return { allowed: true, used: 0, limit: 999999 };
  }

  // Count usage events for current billing period
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: usageData, error: usageError } = await supabase
    .from("usage_events")
    .select("quantity")
    .eq("tenant_id", tenantId)
    .eq("event_type", eventType)
    .gte("period_start", periodStart);

  if (usageError) {
    console.error("checkPlanLimit usage query error:", usageError);
    // Fail open to avoid blocking users on DB errors
    return { allowed: true, used: 0, limit };
  }

  const used = (usageData ?? []).reduce((sum, row) => sum + (row.quantity ?? 1), 0);
  const allowed = used < limit;

  return { allowed, used, limit };
}

// ============================================================
// trackUsage
// ============================================================
export async function trackUsage(
  tenantId: string,
  eventType: string,
  quantity = 1
): Promise<void> {
  const supabase = getServiceSupabase();

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { error } = await supabase.from("usage_events").insert({
    tenant_id: tenantId,
    event_type: eventType,
    quantity,
    period_start: periodStart,
    created_at: now.toISOString(),
  });

  if (error) {
    console.error("trackUsage insert error:", error);
  }
}
