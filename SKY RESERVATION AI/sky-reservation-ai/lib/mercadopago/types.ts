// ============================================================
// Mercado Pago Type Definitions
// ============================================================

export interface MPItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

export interface MPPayer {
  name?: string;
  surname?: string;
  email: string;
  identification?: {
    type: string;
    number: string;
  };
  phone?: {
    area_code: string;
    number: string;
  };
  address?: {
    street_name: string;
    street_number: number;
    zip_code: string;
  };
}

export interface MPPreference {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
  items: MPItem[];
  payer?: MPPayer;
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: "approved" | "all";
  metadata?: Record<string, unknown>;
  external_reference?: string;
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
  date_created?: string;
}

export interface MPSubscriptionPreapproval {
  id: string;
  status: "pending" | "authorized" | "paused" | "cancelled";
  init_point: string;
  preapproval_plan_id?: string;
  reason: string;
  external_reference?: string;
  payer_id?: number;
  payer_email?: string;
  auto_recurring: {
    frequency: number;
    frequency_type: "days" | "months";
    transaction_amount: number;
    currency_id: string;
    start_date?: string;
    end_date?: string;
    billing_day?: number;
  };
  date_created?: string;
  last_modified?: string;
  summarized?: {
    charged_quantity?: number;
    pending_charge_quantity?: number;
    charged_amount?: number;
    pending_charge_amount?: number;
    last_charged_date?: string;
    last_charged_amount?: number;
  };
}

export type MPSubscription = MPSubscriptionPreapproval;

export interface MPWebhookEvent {
  id: number;
  live_mode: boolean;
  type: "payment" | "subscription_preapproval" | "plan" | "invoice";
  date_created: string;
  application_id: number;
  user_id: number;
  api_version: string;
  action:
    | "payment.created"
    | "payment.updated"
    | "subscription_preapproval.created"
    | "subscription_preapproval.updated";
  data: {
    id: string;
  };
}

export interface MPPayment {
  id: number;
  status:
    | "pending"
    | "approved"
    | "authorized"
    | "in_process"
    | "in_mediation"
    | "rejected"
    | "cancelled"
    | "refunded"
    | "charged_back";
  status_detail: string;
  currency_id: string;
  transaction_amount: number;
  payer: {
    id?: number;
    email?: string;
  };
  metadata?: Record<string, unknown>;
  external_reference?: string;
  preapproval_id?: string;
  date_created?: string;
  date_approved?: string;
  description?: string;
}
