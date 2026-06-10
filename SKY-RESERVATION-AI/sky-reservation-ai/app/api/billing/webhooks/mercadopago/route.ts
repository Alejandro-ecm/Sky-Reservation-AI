import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getSubscription, getPayment } from "@/lib/mercadopago/client";
import type { MPWebhookEvent } from "@/lib/mercadopago/types";
import { createHmac, timingSafeEqual } from "crypto";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials");
  return createServiceClient(url, serviceKey);
}

// ============================================================
// Verify MercadoPago webhook signature
// MP sends: x-signature: ts=<timestamp>,v1=<hmac>
// ============================================================
function verifyMPSignature(
  request: NextRequest,
  body: string,
  secret: string
): boolean {
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  if (!xSignature) return false;

  // Parse ts and v1 from x-signature header
  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key.trim(), value?.trim() ?? ""];
    })
  );

  const ts = parts["ts"];
  const v1 = parts["v1"];

  if (!ts || !v1) return false;

  // Build manifest string as per MP docs
  // format: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
  let manifest = "";
  try {
    const parsed = JSON.parse(body) as { data?: { id?: string } };
    if (parsed?.data?.id) {
      manifest += `id:${parsed.data.id};`;
    }
  } catch {
    // ignore parse errors for manifest building
  }
  if (xRequestId) manifest += `request-id:${xRequestId};`;
  manifest += `ts:${ts};`;

  const hmac = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(hmac), Buffer.from(v1));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (webhookSecret) {
    const isValid = verifyMPSignature(request, body, webhookSecret);
    if (!isValid) {
      console.error("MercadoPago webhook signature invalid");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  let event: MPWebhookEvent;
  try {
    event = JSON.parse(body) as MPWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  try {
    switch (event.type) {
      // --------------------------------------------------------
      // Payment created/updated
      // --------------------------------------------------------
      case "payment": {
        const paymentId = event.data.id;
        const payment = await getPayment(paymentId);

        const tenantId = payment.external_reference;
        if (!tenantId) break;

        if (payment.status === "approved") {
          // Mark subscription as active
          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("tenant_id", tenantId);

          // Create paid invoice record
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("id, plan")
            .eq("tenant_id", tenantId)
            .maybeSingle();

          await supabase.from("invoices").insert({
            tenant_id: tenantId,
            subscription_id: subscription?.id ?? null,
            amount_cents: Math.round((payment.transaction_amount ?? 0) * 100),
            currency: payment.currency_id?.toLowerCase() ?? "usd",
            status: "paid",
            payment_provider: "mercadopago",
            external_invoice_id: paymentId,
            paid_at: new Date().toISOString(),
          });
        } else if (payment.status === "rejected" || payment.status === "cancelled") {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("tenant_id", tenantId);
        }
        break;
      }

      // --------------------------------------------------------
      // Subscription preapproval created/updated
      // --------------------------------------------------------
      case "subscription_preapproval": {
        const subscriptionId = event.data.id;
        const mpSubscription = await getSubscription(subscriptionId);

        const tenantId = mpSubscription.external_reference;
        if (!tenantId) break;

        let status: string;
        switch (mpSubscription.status) {
          case "authorized":
            status = "active";
            break;
          case "paused":
            status = "past_due";
            break;
          case "cancelled":
            status = "cancelled";
            break;
          case "pending":
          default:
            status = "trialing";
            break;
        }

        await supabase
          .from("subscriptions")
          .update({
            status,
            mercadopago_subscription_id: subscriptionId,
            payment_provider: "mercadopago",
            updated_at: new Date().toISOString(),
          })
          .eq("tenant_id", tenantId);

        // If cancelled, revert plan to starter
        if (status === "cancelled") {
          await supabase
            .from("subscriptions")
            .update({ plan: "starter", updated_at: new Date().toISOString() })
            .eq("tenant_id", tenantId);

          await supabase
            .from("tenants")
            .update({ plan: "starter", updated_at: new Date().toISOString() })
            .eq("id", tenantId);
        }
        break;
      }

      default:
        console.warn(`[mercadopago-webhook] unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("MercadoPago webhook handler error:", err);
    // Return 200 to avoid infinite retries from MP
  }

  return NextResponse.json({ received: true });
}
