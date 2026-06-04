import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { VapiWebhookEvent, VapiCall } from "@/lib/vapi/types";

// Use service role for webhook (no user session available)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase service role credentials");
  }
  return createClient(url, serviceKey);
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (timing-safe to prevent timing attacks)
    const secret = request.headers.get("x-vapi-secret");
    const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;

    if (expectedSecret) {
      const secretBuf = Buffer.from(secret ?? "");
      const expectedBuf = Buffer.from(expectedSecret);
      const valid =
        secretBuf.length === expectedBuf.length &&
        timingSafeEqual(secretBuf, expectedBuf);
      if (!valid) {
        console.warn(JSON.stringify({
          service: "vapi-webhook",
          level: "warn",
          event: "INVALID_SECRET",
          timestamp: new Date().toISOString(),
        }));
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = (await request.json()) as VapiWebhookEvent;
    const { message } = body;

    if (!message) {
      return NextResponse.json({ received: true });
    }

    const eventType = message.type;

    // Handle end-of-call-report: save conversation to Supabase
    if (eventType === "end-of-call-report") {
      await handleCallEnded(message.call, message.artifact);
    }

    // Handle status-update for call-started
    if (eventType === "status-update" && message.status === "ended") {
      await handleCallEnded(message.call, message.artifact);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(JSON.stringify({
      service: "vapi-webhook",
      level: "error",
      event: "HANDLER_EXCEPTION",
      error_message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }));
    // Always return 200 to prevent Vapi from retrying
    return NextResponse.json({ received: true });
  }
}

async function handleCallEnded(
  call: VapiCall | undefined,
  artifact?: {
    transcript?: string;
    summary?: string;
    messages?: Array<{ role: string; content: string; time: number }>;
  }
) {
  if (!call) return;

  try {
    const supabase = getServiceClient();

    // Try to find tenant from assistant metadata
    // In production, the assistant metadata would contain tenant_id
    const customerPhone = call.customer?.number ?? null;

    // Build messages array from artifact
    const messages = artifact?.messages
      ? artifact.messages.map((m) => ({
          id: crypto.randomUUID(),
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.time).toISOString(),
        }))
      : [];

    const durationSeconds = call.durationSeconds ?? null;

    // We need to find which tenant this assistant belongs to
    // Look up in our own assistant records if we stored them
    // For now, insert a generic conversation (tenant lookup by assistantId would need a local table)
    const { error } = await supabase.from("conversations").insert({
      channel: "voice",
      status: call.endedReason === "customer-ended-call" ? "resolved" : "ended",
      messages,
      external_id: call.id,
      summary: artifact?.summary ?? null,
      duration_seconds: durationSeconds,
      // customer_phone stored in metadata for later matching
      metadata: {
        assistant_id: call.assistantId,
        customer_phone: customerPhone,
        ended_reason: call.endedReason,
        transcript: artifact?.transcript ?? null,
      },
    });

    if (error) {
      console.error(JSON.stringify({
        service: "vapi-webhook",
        level: "error",
        event: "CONVERSATION_SAVE_FAILED",
        call_id: call.id,
        error_message: error.message,
        timestamp: new Date().toISOString(),
      }));
    }
  } catch (error) {
    console.error(JSON.stringify({
      service: "vapi-webhook",
      level: "error",
      event: "CALL_ENDED_EXCEPTION",
      error_message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }));
  }
}
