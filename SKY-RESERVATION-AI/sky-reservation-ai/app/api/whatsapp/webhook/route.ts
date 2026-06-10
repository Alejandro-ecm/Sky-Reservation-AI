import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendMessage, markAsRead } from "@/lib/whatsapp/client";
import { processIncomingMessage } from "@/lib/whatsapp/ai-responder";
import { checkPlanLimit, trackUsage } from "@/lib/billing/limits";
import type { Message } from "@/types";

// ============================================================
// TYPES
// ============================================================

interface MetaWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: { body: string };
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials");
  return createServiceClient(url, serviceKey);
}

// ============================================================
// GET — Webhook verification
// ============================================================
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ============================================================
// POST — Process incoming messages
// ============================================================
export async function POST(request: NextRequest) {
  const secret = process.env.META_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[whatsapp-webhook] META_WEBHOOK_SECRET not configured — rejecting");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get("x-hub-signature-256") ?? "";
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  let valid = false;
  try {
    const expectedBuf = Buffer.from(expected);
    const sigBuf = Buffer.from(sig);
    valid = expectedBuf.length === sigBuf.length && timingSafeEqual(expectedBuf, sigBuf);
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const body = JSON.parse(rawBody) as MetaWebhookBody;

  // Fire and forget
  processWebhook(body).catch((err) =>
    console.error(JSON.stringify({
      service: "whatsapp-webhook",
      level: "error",
      event: "PROCESSING_EXCEPTION",
      error_message: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    }))
  );

  return NextResponse.json({ received: true });
}

async function processWebhook(body: MetaWebhookBody) {
  if (body.object !== "whatsapp_business_account") return;

  const supabase = getServiceSupabase();

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") continue;

      const value = change.value;
      const messages = value.messages ?? [];
      const contacts = value.contacts ?? [];
      const phoneNumberId = value.metadata?.phone_number_id;

      // Find which tenant owns this phone number
      const { data: tenantConfig } = await supabase
        .from("tenants")
        .select("id")
        .eq("settings->whatsapp_phone_id", phoneNumberId)
        .maybeSingle();

      const tenantId = tenantConfig?.id;
      if (!tenantId) {
        console.warn(JSON.stringify({
          service: "whatsapp-webhook",
          level: "warn",
          event: "UNKNOWN_TENANT",
          phone_number_id: phoneNumberId,
          timestamp: new Date().toISOString(),
        }));
        continue;
      }

      for (const message of messages) {
        // Only handle text messages
        if (message.type !== "text" || !message.text?.body) continue;

        const from = message.from;
        const messageText = message.text.body;
        const contactName =
          contacts.find((c) => c.wa_id === from)?.profile?.name ?? from;

        try {
          // Check WhatsApp message plan limit
          const waLimitCheck = await checkPlanLimit(tenantId, "whatsapp_messages");
          if (!waLimitCheck.allowed) {
            await sendMessage(
              from,
              "Nuestro servicio está temporalmente limitado. Por favor, contáctanos directamente para más información."
            ).catch(() => {});
            continue;
          }

          // Track WhatsApp usage
          await trackUsage(tenantId, "whatsapp_message", 1);

          // Mark as read
          await markAsRead(message.id).catch(() => {});

          // Load or create customer
          const { data: customer } = await supabase
            .from("customers")
            .upsert(
              {
                tenant_id: tenantId,
                phone: from,
                name: contactName,
              },
              { onConflict: "tenant_id,phone" }
            )
            .select()
            .single();

          const customerId = customer?.id ?? null;

          // Load existing conversation (last 24h)
          const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: existingConvo } = await supabase
            .from("conversations")
            .select("id, messages")
            .eq("tenant_id", tenantId)
            .eq("channel", "whatsapp")
            .eq("customer_id", customerId)
            .gte("updated_at", cutoff)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const conversationHistory: Message[] = existingConvo?.messages ?? [];

          // IDEMPOTENCY: skip if this message was already processed (Meta retry)
          const isDuplicate = conversationHistory.some((m) => m.id === message.id);
          if (isDuplicate) {
            console.log(`[whatsapp-webhook] Duplicate message ${message.id} — skipping`);
            continue;
          }

          // Generate AI response
          const aiResponse = await processIncomingMessage(
            tenantId,
            from,
            messageText,
            conversationHistory
          );

          // Send reply via WhatsApp
          await sendMessage(from, aiResponse);

          // Build updated messages array
          const newMessages: Message[] = [
            ...conversationHistory,
            {
              id: message.id,
              role: "user",
              content: messageText,
              timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
            },
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: aiResponse,
              timestamp: new Date().toISOString(),
            },
          ];

          // Save or update conversation
          if (existingConvo?.id) {
            await supabase
              .from("conversations")
              .update({
                messages: newMessages,
                updated_at: new Date().toISOString(),
                status: "active",
              })
              .eq("id", existingConvo.id);
          } else {
            await supabase.from("conversations").insert({
              tenant_id: tenantId,
              customer_id: customerId,
              channel: "whatsapp",
              status: "active",
              messages: newMessages,
              external_id: message.id,
            });
          }

          // Update customer last_contact_at
          if (customerId) {
            await supabase
              .from("customers")
              .update({ last_contact_at: new Date().toISOString() })
              .eq("id", customerId);
          }
        } catch (err) {
          console.error(JSON.stringify({
            service: "whatsapp-webhook",
            level: "error",
            event: "MESSAGE_PROCESSING_FAILED",
            from,
            error_message: err instanceof Error ? err.message : String(err),
            timestamp: new Date().toISOString(),
          }));
        }
      }
    }
  }
}
