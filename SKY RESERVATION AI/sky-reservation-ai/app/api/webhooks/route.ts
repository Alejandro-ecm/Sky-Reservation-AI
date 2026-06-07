import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { processIncomingMessage } from "@/lib/whatsapp/ai-responder";
import { sendMessage } from "@/lib/whatsapp/client";
import { triggerMissedCallWorkflow, triggerNewReservationWorkflow } from "@/lib/n8n/client";
import type { VapiWebhookEvent } from "@/lib/vapi/types";
import type { Message } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key);
}

function verifyHmac(secret: string, payload: string, signature: string): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ─── POST — VAPI / WhatsApp webhooks ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const source = request.headers.get("x-webhook-source") ?? "unknown";

  try {
    // Fail-closed: reject if secrets are not configured
    if (source === "vapi") {
      const secret = process.env.VAPI_WEBHOOK_SECRET;
      if (!secret) {
        console.error("[webhook] VAPI_WEBHOOK_SECRET not configured — rejecting");
        return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
      }
      const sig = request.headers.get("x-vapi-signature") ?? "";
      if (!verifyHmac(secret, rawBody, sig)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    if (source === "meta-whatsapp") {
      const secret = process.env.META_APP_SECRET;
      if (!secret) {
        console.error("[webhook] META_APP_SECRET not configured — rejecting");
        return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
      }
      const sig = (request.headers.get("x-hub-signature-256") ?? "").replace("sha256=", "");
      if (!verifyHmac(secret, rawBody, sig)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    const body = JSON.parse(rawBody) as Record<string, unknown>;

    switch (source) {
      case "vapi":
        return handleVapiWebhook(body);
      case "meta-whatsapp":
        return handleWhatsAppWebhook(body);
      default:
        return NextResponse.json({ received: true });
    }
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET — Meta WhatsApp verification challenge ───────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─── VAPI handler ─────────────────────────────────────────────────────────────

async function handleVapiWebhook(body: Record<string, unknown>) {
  const event = body as unknown as VapiWebhookEvent;
  const { type, call, artifact } = event.message;

  if (!call) return NextResponse.json({ received: true });

  const customerPhone = call.customer?.number ?? null;
  const supabase = adminClient();

  // Resolve tenantId: explicit metadata is canonical.
  // Fallback uses assistantId mapped in tenant settings (never a cross-tenant phone lookup).
  const metadataTenantId = (call as unknown as { metadata?: Record<string, string> }).metadata?.tenant_id ?? null;
  let tenantId: string | null = metadataTenantId;

  if (!tenantId && call.assistantId) {
    const { data: allTenants } = await supabase.from("tenants").select("id, settings");
    const matched = allTenants?.find((t) => {
      const ai = (t.settings as Record<string, unknown> | null)?.ai_settings as Record<string, unknown> | null;
      return ai?.vapi_assistant_id === call.assistantId;
    });
    tenantId = matched?.id ?? null;
  }

  if (!tenantId) {
    console.warn("[vapi] unresolvable tenant_id for call", call.id, "— aborting");
    return NextResponse.json({ received: true });
  }

  if (type === "end-of-call-report") {
    const transcript = artifact?.transcript ?? "";
    const summary    = artifact?.summary ?? "";
    const messages: Message[] = (artifact?.messages ?? []).map((m, i) => ({
      id: `vapi-${call.id}-${i}`,
      role: m.role as Message["role"],
      content: m.content,
      timestamp: new Date(m.time * 1000).toISOString(),
    }));

    if (tenantId) {
      // Upsert conversation record
      const { data: conv } = await supabase
        .from("conversations")
        .upsert(
          {
            tenant_id: tenantId,
            channel: "voice",
            status: call.endedReason === "customer-ended-call" ? "resolved" : "missed",
            messages,
          },
          { onConflict: "id" }
        )
        .select("id")
        .single();

      // Check if a reservation was created during this call; if not, fire missed-call workflow
      const { count } = await supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", call.startedAt ?? new Date().toISOString());

      if ((count ?? 0) === 0) {
        await triggerMissedCallWorkflow({
          tenantId,
          callerNumber: customerPhone,
          assistantId: call.assistantId,
          timestamp: new Date().toISOString(),
        });
      }

      console.info(`[vapi] end-of-call-report saved, conv=${conv?.id}`);
    }
  }

  if (type === "tool-calls") {
    // Handle create-reservation tool call
    const toolCalls = (body as Record<string, unknown>).toolCallList as Array<{
      id: string;
      function: { name: string; arguments: string };
    }> | undefined;

    const createReservationCall = toolCalls?.find(
      (t) => t.function.name === "create-reservation"
    );

    if (createReservationCall && tenantId) {
      try {
        const params = JSON.parse(createReservationCall.function.arguments) as {
          customer_name?: string;
          customer_phone?: string;
          service_id?: string;
          staff_id?: string;
          start_time?: string;
          end_time?: string;
          notes?: string;
        };

        // Find or create customer
        let customerId: string | null = null;
        if (params.customer_phone) {
          const { data: existing } = await supabase
            .from("customers")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("phone", params.customer_phone)
            .single();

          if (existing) {
            customerId = existing.id;
          } else if (params.customer_name) {
            const { data: created } = await supabase
              .from("customers")
              .insert({ tenant_id: tenantId, name: params.customer_name, phone: params.customer_phone, tags: [], lead_score: 50, metadata: {} })
              .select("id")
              .single();
            customerId = created?.id ?? null;
          }
        }

        const { data: reservation } = await supabase
          .from("reservations")
          .insert({
            tenant_id: tenantId,
            customer_id: customerId,
            service_id: params.service_id ?? null,
            staff_id: params.staff_id ?? null,
            start_time: params.start_time ?? new Date().toISOString(),
            end_time: params.end_time ?? new Date(Date.now() + 3600_000).toISOString(),
            status: "confirmed",
            notes: params.notes ?? "Reserva creada via llamada IA",
          })
          .select()
          .single();

        if (reservation && tenantId) {
          await triggerNewReservationWorkflow({
            tenantId,
            reservationId: reservation.id,
            customerName: params.customer_name ?? "Cliente",
            customerPhone: params.customer_phone ?? null,
            serviceName: "Servicio",
            startTime: reservation.start_time,
            endTime: reservation.end_time,
            notes: params.notes,
          });
        }

        console.info(`[vapi] reservation created via tool-call: ${reservation?.id}`);
      } catch (err) {
        console.error("[vapi] tool-call reservation error:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}

// ─── WhatsApp handler ─────────────────────────────────────────────────────────

interface MetaMessage {
  id: string;
  from: string;
  type: string;
  timestamp: string;
  text?: { body: string };
}

interface MetaWebhookEntry {
  changes: Array<{
    value: {
      messages?: MetaMessage[];
      metadata?: { phone_number_id: string };
    };
  }>;
}

async function handleWhatsAppWebhook(body: Record<string, unknown>) {
  const entries = (body.entry ?? []) as MetaWebhookEntry[];

  for (const entry of entries) {
    for (const change of entry.changes) {
      const { messages, metadata } = change.value;
      if (!messages?.length) continue;

      const phoneNumberId = metadata?.phone_number_id ?? "";
      const supabase = adminClient();

      // Find tenant by WhatsApp phone_number_id stored in settings
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, settings");

      const matchedTenant = tenants?.find((t) => {
        const settings = t.settings as Record<string, unknown> | null;
        const ai = settings?.ai_settings as Record<string, unknown> | null;
        return ai?.whatsapp_phone_id === phoneNumberId;
      });

      // Global env-var fallback only when there is exactly one tenant (single-tenant setup).
      // Never fall back to an arbitrary tenant — that would route messages cross-tenant.
      const tenantId =
        matchedTenant?.id ??
        (process.env.META_WHATSAPP_PHONE_ID === phoneNumberId && tenants?.length === 1
          ? tenants[0].id
          : null);

      if (!tenantId) {
        console.warn("[whatsapp] no tenant matched phone_number_id:", phoneNumberId, "— skipping message");
        continue;
      }

      for (const msg of messages) {
        if (msg.type !== "text" || !msg.text?.body) continue;

        const from        = msg.from;
        const messageText = msg.text.body;
        const msgTs       = new Date(Number(msg.timestamp) * 1000).toISOString();

        // Find or create customer
        let customerId: string | null = null;
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("phone", from)
          .single();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const { data: newCustomer } = await supabase
            .from("customers")
            .insert({ tenant_id: tenantId, name: `+${from}`, phone: from, tags: [], lead_score: 50, metadata: { source: "whatsapp" } })
            .select("id")
            .single();
          customerId = newCustomer?.id ?? null;
        }

        // Get or create active conversation
        const { data: activeConv } = await supabase
          .from("conversations")
          .select("id, messages")
          .eq("tenant_id", tenantId)
          .eq("channel", "whatsapp")
          .eq("status", "active")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const history: Message[] = (activeConv?.messages ?? []) as Message[];

        // Generate AI response
        const aiReply = await processIncomingMessage(tenantId, from, messageText, history);

        // Build updated messages array
        const userMsg: Message = {
          id: msg.id,
          role: "user",
          content: messageText,
          timestamp: msgTs,
        };
        const assistantMsg: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: aiReply,
          timestamp: new Date().toISOString(),
        };
        const updatedMessages = [...history, userMsg, assistantMsg];

        // Upsert conversation
        if (activeConv) {
          await supabase
            .from("conversations")
            .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
            .eq("id", activeConv.id);
        } else {
          await supabase.from("conversations").insert({
            tenant_id: tenantId,
            customer_id: customerId,
            channel: "whatsapp",
            status: "active",
            messages: updatedMessages,
          });
        }

        // Send reply via WhatsApp
        await sendMessage(from, aiReply);
      }
    }
  }

  return NextResponse.json({ received: true });
}
