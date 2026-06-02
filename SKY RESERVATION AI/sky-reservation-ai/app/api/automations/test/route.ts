import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { triggerWorkflow } from "@/lib/n8n/client";
import type { AutomationRule } from "@/lib/n8n/types";

const SAMPLE_DATA: Record<string, Record<string, unknown>> = {
  new_reservation: {
    event: "new_reservation",
    tenantId: "test-tenant",
    reservationId: "test-reservation-id",
    customerName: "Juan García (Test)",
    customerPhone: "+52 55 1234 5678",
    serviceName: "Servicio de Prueba",
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 90000000).toISOString(),
    staffName: "Staff de Prueba",
    notes: "Esta es una reservación de prueba",
  },
  no_show: {
    event: "no_show",
    tenantId: "test-tenant",
    reservationId: "test-reservation-id",
    customerName: "María López (Test)",
    customerPhone: "+52 55 9876 5432",
    serviceName: "Servicio de Prueba",
    scheduledTime: new Date().toISOString(),
  },
  new_customer: {
    event: "new_customer",
    tenantId: "test-tenant",
    customerId: "test-customer-id",
    customerName: "Carlos Rodríguez (Test)",
    customerPhone: "+52 55 5555 5555",
    customerEmail: "test@example.com",
    leadScore: 75,
    source: "whatsapp",
  },
  follow_up_3day: {
    event: "follow_up_3day",
    tenantId: "test-tenant",
    customerId: "test-customer-id",
    customerName: "Ana Martínez (Test)",
    customerPhone: "+52 55 3333 3333",
    lastVisit: new Date(Date.now() - 259200000).toISOString(),
    daysSinceLastVisit: 3,
    serviceName: "Servicio de Prueba",
  },
  missed_call: {
    event: "missed_call",
    tenantId: "test-tenant",
    callerNumber: "+52 55 7777 7777",
    timestamp: new Date().toISOString(),
    assistantId: "test-assistant-id",
  },
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = (await request.json()) as { ruleId: string };
    const { ruleId } = body;

    if (!ruleId) {
      return NextResponse.json({ error: "Missing ruleId" }, { status: 400 });
    }

    const { data: rule, error } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("id", ruleId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error || !rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const typedRule = rule as AutomationRule;

    if (typedRule.action !== "n8n_webhook") {
      return NextResponse.json(
        { error: "Test is only available for n8n_webhook rules" },
        { status: 400 }
      );
    }

    const webhookUrl = typedRule.config?.webhookUrl;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Rule has no webhookUrl configured" },
        { status: 400 }
      );
    }

    const samplePayload = SAMPLE_DATA[typedRule.trigger] ?? {
      event: typedRule.trigger,
      tenantId: profile.tenant_id,
      _test: true,
    };

    await triggerWorkflow(webhookUrl, { ...samplePayload, _isTest: true });

    // Record trigger in rule
    await supabase
      .from("automation_rules")
      .update({
        last_triggered_at: new Date().toISOString(),
        trigger_count: (typedRule.trigger_count ?? 0) + 1,
      })
      .eq("id", ruleId);

    return NextResponse.json({ success: true, message: "Test payload sent successfully" });
  } catch (err) {
    console.error("Automations test error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
