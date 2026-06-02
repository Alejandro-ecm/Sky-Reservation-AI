import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "./client";
import { STRIPE_PRICES, type PlanKey } from "./prices";
import type Stripe from "stripe";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials");
  return createServiceClient(url, serviceKey);
}

// ============================================================
// createOrRetrieveCustomer
// ============================================================

export async function createOrRetrieveCustomer(
  tenantId: string,
  email: string,
  name: string
): Promise<string> {
  const supabase = getServiceSupabase();

  // Check if we already have a Stripe customer ID
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { tenantId },
  });

  // Save the customer ID to the subscriptions table
  await supabase
    .from("subscriptions")
    .upsert(
      {
        tenant_id: tenantId,
        stripe_customer_id: customer.id,
        plan: "starter",
        status: "trialing",
      },
      { onConflict: "tenant_id" }
    );

  return customer.id;
}

// ============================================================
// getSubscriptionStatus
// ============================================================

export interface SubscriptionStatus {
  plan: PlanKey;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  stripeSubscriptionId: string | null;
}

export async function getSubscriptionStatus(
  tenantId: string
): Promise<SubscriptionStatus> {
  const supabase = getServiceSupabase();

  const { data } = await supabase
    .from("subscriptions")
    .select(
      "plan, status, current_period_end, cancel_at_period_end, trial_ends_at, stripe_subscription_id"
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!data) {
    return {
      plan: "starter",
      status: "trialing",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      stripeSubscriptionId: null,
    };
  }

  return {
    plan: (data.plan as PlanKey) ?? "starter",
    status: data.status ?? "trialing",
    currentPeriodEnd: data.current_period_end ?? null,
    cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
    trialEndsAt: data.trial_ends_at ?? null,
    stripeSubscriptionId: data.stripe_subscription_id ?? null,
  };
}

// ============================================================
// syncStripeSubscription
// ============================================================

function mapStripePlanFromPriceId(priceId: string): PlanKey {
  for (const [key, val] of Object.entries(STRIPE_PRICES)) {
    if (val.monthly === priceId) return key as PlanKey;
  }
  return "starter";
}

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "cancelled";
    case "trialing":
      return "trialing";
    case "unpaid":
      return "past_due";
    case "incomplete":
      return "past_due";
    case "incomplete_expired":
      return "cancelled";
    case "paused":
      return "past_due";
    default:
      return "active";
  }
}

export async function syncStripeSubscription(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  const supabase = getServiceSupabase();

  const tenantId = stripeSubscription.metadata?.tenantId;
  if (!tenantId) {
    console.error("syncStripeSubscription: no tenantId in metadata");
    return;
  }

  const priceId = stripeSubscription.items.data[0]?.price?.id ?? "";
  const plan = mapStripePlanFromPriceId(priceId);
  const status = mapStripeStatus(stripeSubscription.status);

  const upsertData = {
    tenant_id: tenantId,
    plan,
    status,
    stripe_subscription_id: stripeSubscription.id,
    stripe_customer_id:
      typeof stripeSubscription.customer === "string"
        ? stripeSubscription.customer
        : stripeSubscription.customer.id,
    payment_provider: "stripe",
    current_period_start: (stripeSubscription as unknown as Record<string, number>).current_period_start
      ? new Date((stripeSubscription as unknown as Record<string, number>).current_period_start * 1000).toISOString()
      : null,
    current_period_end: (stripeSubscription as unknown as Record<string, number>).current_period_end
      ? new Date((stripeSubscription as unknown as Record<string, number>).current_period_end * 1000).toISOString()
      : null,
    trial_ends_at: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000).toISOString()
      : null,
    cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };

  await supabase
    .from("subscriptions")
    .upsert(upsertData, { onConflict: "tenant_id" });

  // Also update tenant plan column
  await supabase
    .from("tenants")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", tenantId);
}
