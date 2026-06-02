import type {
  ReservationCreatedPayload,
  ReservationNoShowPayload,
  NewCustomerPayload,
  FollowUpPayload,
  MissedCallPayload,
  WorkflowTrigger,
} from "./types";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// ============================================================
// CORE TRIGGER FUNCTION
// ============================================================

/**
 * Sends a POST request to an n8n webhook URL with the given payload.
 * Errors are caught and logged — never thrown to the caller.
 */
export async function triggerWorkflow(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!webhookUrl) {
    console.warn("[n8n] triggerWorkflow called with empty webhookUrl — skipping");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000), // 10 second timeout
    });

    if (!response.ok) {
      console.warn(`[n8n] Webhook responded with ${response.status}: ${webhookUrl}`);
    }
  } catch (err) {
    // n8n may be down — never crash the main flow
    console.error("[n8n] Failed to trigger workflow:", err);
  }
}

// ============================================================
// TENANT WEBHOOK URL LOOKUP
// ============================================================

async function getTenantWebhookUrl(
  tenantId: string,
  trigger: WorkflowTrigger
): Promise<string | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return null;

    const admin = createServiceClient(url, serviceKey);

    // First check automation_rules table for an enabled webhook rule
    const { data } = await admin
      .from("automation_rules")
      .select("config")
      .eq("tenant_id", tenantId)
      .eq("trigger", trigger)
      .eq("action", "n8n_webhook")
      .eq("enabled", true)
      .limit(1)
      .single();

    if (data?.config?.webhookUrl) {
      return data.config.webhookUrl as string;
    }

    // Fallback: check tenant settings.n8n_webhooks
    const { data: tenant } = await admin
      .from("tenants")
      .select("settings")
      .eq("id", tenantId)
      .single();

    const settings = tenant?.settings as Record<string, unknown> | null;
    const n8nWebhooks = settings?.n8n_webhooks as Record<string, string> | null;
    return n8nWebhooks?.[trigger] ?? null;
  } catch (err) {
    console.error("[n8n] getTenantWebhookUrl error:", err);
    return null;
  }
}

// ============================================================
// PRE-BUILT WORKFLOW TRIGGER FUNCTIONS
// ============================================================

export async function triggerNewReservationWorkflow(
  data: ReservationCreatedPayload
): Promise<void> {
  const webhookUrl = await getTenantWebhookUrl(data.tenantId, "new_reservation");
  if (!webhookUrl) return;
  await triggerWorkflow(webhookUrl, { event: "new_reservation", ...data });
}

export async function triggerNoShowWorkflow(
  data: ReservationNoShowPayload
): Promise<void> {
  const webhookUrl = await getTenantWebhookUrl(data.tenantId, "no_show");
  if (!webhookUrl) return;
  await triggerWorkflow(webhookUrl, { event: "no_show", ...data });
}

export async function triggerNewCustomerWorkflow(
  data: NewCustomerPayload
): Promise<void> {
  const webhookUrl = await getTenantWebhookUrl(data.tenantId, "new_customer");
  if (!webhookUrl) return;
  await triggerWorkflow(webhookUrl, { event: "new_customer", ...data });
}

export async function triggerFollowUpWorkflow(
  data: FollowUpPayload
): Promise<void> {
  const webhookUrl = await getTenantWebhookUrl(data.tenantId, "follow_up_3day");
  if (!webhookUrl) return;
  await triggerWorkflow(webhookUrl, { event: "follow_up_3day", ...data });
}

export async function triggerMissedCallWorkflow(
  data: MissedCallPayload
): Promise<void> {
  const webhookUrl = await getTenantWebhookUrl(data.tenantId, "missed_call");
  if (!webhookUrl) return;
  await triggerWorkflow(webhookUrl, { event: "missed_call", ...data });
}
