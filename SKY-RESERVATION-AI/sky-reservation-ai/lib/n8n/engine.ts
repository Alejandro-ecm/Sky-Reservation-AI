import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendMessage } from "@/lib/whatsapp/client";
import { sendEmail } from "@/lib/resend/client";
import { triggerWorkflow } from "./client";
import type { WorkflowTrigger, AutomationConfig } from "./types";

// ─── Context passed to every automation execution ────────────────────────────

export interface AutomationContext {
  tenantId: string;
  customerName?: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  serviceName?: string;
  startTime?: string;
  endTime?: string;
  reservationId?: string;
  customerId?: string;
  [key: string]: unknown;
}

// ─── Template variable interpolation ────────────────────────────────────────

function interpolate(template: string, ctx: AutomationContext): string {
  const date = ctx.startTime
    ? new Date(ctx.startTime).toLocaleDateString("es-MX", {
        weekday: "long", day: "numeric", month: "long",
      })
    : "";
  const time = ctx.startTime
    ? new Date(ctx.startTime).toLocaleTimeString("es-MX", {
        hour: "2-digit", minute: "2-digit",
      })
    : "";

  return template
    .replace(/\{customerName\}/g, ctx.customerName ?? "")
    .replace(/\{service\}/g,      ctx.serviceName  ?? "")
    .replace(/\{date\}/g,         date)
    .replace(/\{time\}/g,         time);
}

// ─── Central automation dispatcher ───────────────────────────────────────────

/**
 * Executes ALL enabled automation rules matching `trigger` for the tenant.
 * Handles n8n_webhook, send_whatsapp, and send_email actions.
 * Never throws — errors are logged and swallowed per rule.
 */
export async function executeAutomations(
  trigger: WorkflowTrigger,
  ctx: AutomationContext
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return;

  const admin = createServiceClient(supabaseUrl, serviceKey);

  const { data: rules } = await admin
    .from("automation_rules")
    .select("id, action, config, trigger_count")
    .eq("tenant_id", ctx.tenantId)
    .eq("trigger", trigger)
    .eq("enabled", true);

  if (!rules || rules.length === 0) return;

  await Promise.allSettled(
    rules.map(async (rule: { id: string; action: string; config: AutomationConfig; trigger_count: number }) => {
      try {
        if (rule.action === "n8n_webhook") {
          const url = rule.config.webhookUrl as string | undefined;
          if (url) {
            await triggerWorkflow(url, { event: trigger, ...ctx });
          }

        } else if (rule.action === "send_whatsapp") {
          const template = rule.config.message as string | undefined;
          const phone = ctx.customerPhone;
          if (template && phone) {
            const text = interpolate(template, ctx);
            await sendMessage(phone, text);
          }

        } else if (rule.action === "send_email") {
          const subject = rule.config.emailSubject as string | undefined;
          const body    = rule.config.emailBody    as string | undefined;
          const email   = ctx.customerEmail;
          if (subject && body && email) {
            await sendEmail({
              to: email,
              subject: interpolate(subject, ctx),
              html: interpolate(body, ctx),
            });
          }
        }

        // Update execution metrics (fire-and-forget, best-effort)
        void admin
          .from("automation_rules")
          .update({
            trigger_count: (rule.trigger_count ?? 0) + 1,
            last_triggered_at: new Date().toISOString(),
          })
          .eq("id", rule.id);

      } catch (err) {
        console.error(`[automation-engine] Rule ${rule.id} (${rule.action}) failed:`, err);
      }
    })
  );
}
