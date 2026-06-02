import { createClient } from "@/lib/supabase/server";
import { generateResponse } from "@/lib/openai/ai-assistant";
import { WHATSAPP_ASSISTANT_PROMPT } from "@/lib/openai/prompts";
import type OpenAI from "openai";
import type { Message } from "@/types";

// ============================================================
// PROCESS INCOMING WHATSAPP MESSAGE
// ============================================================

export async function processIncomingMessage(
  tenantId: string,
  from: string,
  messageText: string,
  conversationHistory: Message[]
): Promise<string> {
  try {
    const supabase = await createClient();

    // Load tenant config for business context
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, settings")
      .eq("id", tenantId)
      .single();

    const rawName = tenant?.name ?? "el negocio";
    const businessName = rawName.replace(/[{}\n\r]/g, "").trim().slice(0, 100) || "el negocio";
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    const aiSettings = (settings.ai_settings as Record<string, unknown>) ?? {};

    // Load services for context
    const { data: services } = await supabase
      .from("services")
      .select("name, duration_minutes, price")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .limit(10);

    const servicesText =
      services && services.length > 0
        ? services
            .map((s: { name: string; duration_minutes: number; price: number }) => {
              const safeName = s.name.replace(/[{}\n\r]/g, "").trim().slice(0, 80);
              return `- ${safeName}: $${s.price} (${s.duration_minutes} min)`;
            })
            .join("\n")
        : "Consultar al negocio";

    // Build hours text from settings
    const businessHours =
      (settings.business_hours as Record<string, { open: string; close: string; enabled: boolean }>) ?? {};
    const daysEs: Record<string, string> = {
      monday: "Lunes",
      tuesday: "Martes",
      wednesday: "Miércoles",
      thursday: "Jueves",
      friday: "Viernes",
      saturday: "Sábado",
      sunday: "Domingo",
    };
    const hoursText = Object.entries(businessHours)
      .filter(([, hours]) => hours?.enabled)
      .map(([day, hours]) => `${daysEs[day] ?? day}: ${hours.open} - ${hours.close}`)
      .join("\n") || "Consultar horarios con el negocio";

    // Build system prompt with context
    const systemPrompt = WHATSAPP_ASSISTANT_PROMPT
      .replace("{businessName}", businessName)
      .replace("{services}", servicesText)
      .replace("{hours}", hoursText);

    // Build conversation history for OpenAI
    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
      ...conversationHistory
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      { role: "user" as const, content: messageText },
    ];

    // Generate AI response
    const response = await generateResponse(openaiMessages, systemPrompt);
    return response;
  } catch (error) {
    console.error("WhatsApp AI responder error:", error);
    return "Gracias por tu mensaje. En breve un representante te atenderá. 🙏";
  }
}
