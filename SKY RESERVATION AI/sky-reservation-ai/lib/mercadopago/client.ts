import type {
  MPPreference,
  MPItem,
  MPPayer,
  MPSubscription,
  MPSubscriptionPreapproval,
} from "./types";

const MP_BASE = "https://api.mercadopago.com";

function getMPToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
  return token;
}

async function mpFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getMPToken();

  const response = await fetch(`${MP_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `MercadoPago API error ${response.status}: ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}

// ============================================================
// Plan amounts in USD cents → ARS via hardcoded rates
// In production you'd use the MP currency converter or set ARS amounts directly.
// ============================================================
const MP_PLAN_AMOUNTS: Record<string, { amount: number; currency: string; label: string }> = {
  starter: { amount: 49, currency: "USD", label: "Sky AI Starter" },
  pro: { amount: 149, currency: "USD", label: "Sky AI Pro" },
  enterprise: { amount: 399, currency: "USD", label: "Sky AI Enterprise" },
};

// ============================================================
// createPreference — one-time or payment preference
// ============================================================
export async function createPreference(
  items: MPItem[],
  payer: MPPayer,
  metadata: Record<string, unknown>
): Promise<{ id: string; init_point: string }> {
  const preference = await mpFetch<MPPreference>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items,
      payer,
      metadata,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/billing?status=success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/billing?status=failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/billing?status=pending`,
      },
      auto_return: "approved",
    }),
  });

  return { id: preference.id, init_point: preference.init_point };
}

// ============================================================
// createSubscription — creates a preapproval (recurring payment)
// ============================================================
export async function createSubscription(
  plan: string,
  payerEmail: string,
  tenantId: string
): Promise<{ id: string; init_point: string }> {
  const planConfig = MP_PLAN_AMOUNTS[plan];
  if (!planConfig) throw new Error(`Unknown plan: ${plan}`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const preapproval = await mpFetch<MPSubscriptionPreapproval>(
    "/preapproval",
    {
      method: "POST",
      body: JSON.stringify({
        reason: planConfig.label,
        external_reference: tenantId,
        payer_email: payerEmail,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: planConfig.amount,
          currency_id: planConfig.currency,
        },
        back_url: `${appUrl}/billing?status=success&provider=mercadopago`,
        status: "pending",
      }),
    }
  );

  return { id: preapproval.id, init_point: preapproval.init_point };
}

// ============================================================
// getSubscription
// ============================================================
export async function getSubscription(
  subscriptionId: string
): Promise<MPSubscription> {
  return mpFetch<MPSubscription>(`/preapproval/${subscriptionId}`);
}

// ============================================================
// cancelSubscription
// ============================================================
export async function cancelSubscription(
  subscriptionId: string
): Promise<void> {
  await mpFetch<MPSubscription>(`/preapproval/${subscriptionId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "cancelled" }),
  });
}

// ============================================================
// getPayment
// ============================================================
export async function getPayment(
  paymentId: string
): Promise<{ status: string; external_reference?: string; transaction_amount?: number; currency_id?: string }> {
  return mpFetch<{
    status: string;
    external_reference?: string;
    transaction_amount?: number;
    currency_id?: string;
  }>(`/v1/payments/${paymentId}`);
}
