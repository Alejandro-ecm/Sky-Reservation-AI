import { createClient as createServiceClient } from "@supabase/supabase-js";

export type AuditAction =
  | "login"
  | "logout"
  | "register"
  | "reservation.create"
  | "reservation.update"
  | "reservation.delete"
  | "customer.create"
  | "customer.update"
  | "billing.checkout"
  | "billing.cancel"
  | "settings.update"
  | "api.rate_limited"
  | "auth.failed";

export interface AuditEntry {
  tenant_id: string;
  user_id?: string;
  action: AuditAction;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  try {
    const client = getAdminClient();
    if (!client) return;
    await client.from("audit_logs").insert({
      ...entry,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Audit logging must never crash the main flow
  }
}
