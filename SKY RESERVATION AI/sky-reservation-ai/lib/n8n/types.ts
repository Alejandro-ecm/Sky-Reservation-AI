// ============================================================
// N8N WORKFLOW PAYLOAD TYPES
// ============================================================

export interface ReservationCreatedPayload {
  tenantId: string;
  reservationId: string;
  customerName: string;
  customerPhone: string | null;
  serviceName: string;
  startTime: string;
  endTime?: string;
  staffName?: string;
  notes?: string;
}

export interface ReservationNoShowPayload {
  tenantId: string;
  reservationId: string;
  customerName: string;
  customerPhone: string | null;
  serviceName: string;
  scheduledTime: string;
}

export interface NewCustomerPayload {
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  leadScore: number;
  source?: string;
}

export interface FollowUpPayload {
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  lastVisit: string;
  daysSinceLastVisit: number;
  serviceName?: string;
}

export interface MissedCallPayload {
  tenantId: string;
  callerNumber: string | null;
  timestamp: string;
  assistantId?: string;
}

export type WorkflowTrigger =
  | "new_reservation"
  | "no_show"
  | "new_customer"
  | "follow_up_3day"
  | "missed_call";

export type AutomationAction = "send_whatsapp" | "n8n_webhook" | "send_email";

export interface AutomationRule {
  id: string;
  tenant_id: string;
  name: string;
  trigger: WorkflowTrigger;
  action: AutomationAction;
  config: AutomationConfig;
  enabled: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
}

export interface AutomationConfig {
  webhookUrl?: string;
  message?: string;
  templateName?: string;
  emailSubject?: string;
  emailBody?: string;
  [key: string]: unknown;
}
