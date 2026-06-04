import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe/client";
import { syncStripeSubscription } from "@/lib/stripe/helpers";
import type Stripe from "stripe";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials");
  return createServiceClient(url, serviceKey);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error(JSON.stringify({
      service: "stripe-webhook",
      level: "error",
      event: "MISSING_WEBHOOK_SECRET",
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(JSON.stringify({
      service: "stripe-webhook",
      level: "error",
      event: "SIGNATURE_VERIFICATION_FAILED",
      error_message: message,
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  try {
    switch (event.type) {
      // --------------------------------------------------------
      // Checkout completed — first subscription created
      // --------------------------------------------------------
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await syncStripeSubscription(subscription);
        break;
      }

      // --------------------------------------------------------
      // Subscription updated (plan change, renewal, etc.)
      // --------------------------------------------------------
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncStripeSubscription(subscription);
        break;
      }

      // --------------------------------------------------------
      // Subscription deleted / cancelled
      // --------------------------------------------------------
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenantId;
        if (!tenantId) break;

        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            plan: "starter",
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq("tenant_id", tenantId);

        // Revert tenant plan to starter
        await supabase
          .from("tenants")
          .update({ plan: "starter", updated_at: new Date().toISOString() })
          .eq("id", tenantId);
        break;
      }

      // --------------------------------------------------------
      // Invoice payment succeeded
      // --------------------------------------------------------
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) break;

        // Find tenant by stripe_customer_id
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("tenant_id, id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!subscription) break;

        await supabase.from("invoices").upsert(
          {
            tenant_id: subscription.tenant_id,
            subscription_id: subscription.id,
            amount_cents: invoice.amount_paid,
            currency: invoice.currency,
            status: "paid",
            payment_provider: "stripe",
            external_invoice_id: invoice.id,
            invoice_url: invoice.hosted_invoice_url ?? null,
            paid_at: invoice.status_transitions?.paid_at
              ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
              : new Date().toISOString(),
          },
          { onConflict: "external_invoice_id" }
        );
        break;
      }

      // --------------------------------------------------------
      // Invoice payment failed
      // --------------------------------------------------------
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) break;

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("tenant_id, id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!subscription) break;

        // Mark subscription as past_due
        await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("tenant_id", subscription.tenant_id);

        // Create a failed invoice record (upsert for idempotency on Stripe retries)
        await supabase.from("invoices").upsert(
          {
            tenant_id: subscription.tenant_id,
            subscription_id: subscription.id,
            amount_cents: invoice.amount_due,
            currency: invoice.currency,
            status: "failed",
            payment_provider: "stripe",
            external_invoice_id: invoice.id,
            invoice_url: invoice.hosted_invoice_url ?? null,
            paid_at: null,
          },
          { onConflict: "external_invoice_id" }
        );
        break;
      }

      default:
        console.warn(JSON.stringify({
          service: "stripe-webhook",
          level: "warn",
          event: "UNHANDLED_EVENT_TYPE",
          stripe_event_type: event.type,
          stripe_event_id: event.id,
          timestamp: new Date().toISOString(),
        }));
    }
  } catch (err) {
    console.error(JSON.stringify({
      service: "stripe-webhook",
      level: "error",
      event: "HANDLER_EXCEPTION",
      stripe_event_type: event.type,
      stripe_event_id: event.id,
      error_message: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    }));
    // Still return 200 to avoid Stripe retrying
  }

  return NextResponse.json({ received: true });
}
