import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listAssistants,
  createAssistant,
} from "@/lib/vapi/client";
import { VOICE_RECEPTIONIST_PROMPT } from "@/lib/openai/prompts";
import type { VapiAssistantConfig } from "@/lib/vapi/types";

// ============================================================
// GET — list assistants for this tenant
// ============================================================
export async function GET(_request: NextRequest) {
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

    const allAssistants = await listAssistants();

    // Filter by tenant metadata
    const tenantAssistants = allAssistants.filter(
      (a) => a.metadata?.tenantId === profile.tenant_id
    );

    return NextResponse.json({ data: tenantAssistants });
  } catch (error) {
    console.error("Vapi assistants GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — create new assistant
// ============================================================
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

    const body = (await request.json()) as {
      name: string;
      businessName: string;
      services: string;
      hours: string;
      voice: "female" | "male";
      tenantId: string;
    };

    const { name, businessName, services, hours, voice } = body;

    if (!name || !businessName) {
      return NextResponse.json(
        { error: "name and businessName are required" },
        { status: 400 }
      );
    }

    // Generate system prompt from template
    const systemPrompt = VOICE_RECEPTIONIST_PROMPT
      .replace("{businessName}", businessName)
      .replace("{services}", services ?? "Consultar con el negocio")
      .replace("{hours}", hours ?? "Consultar horarios");

    // Voice IDs: 11labs female/male
    const voiceId =
      voice === "male" ? "pNInz6obpgDQGcFmaJgB" : "EXAVITQu4vr4xnSDxMaL";

    const config: VapiAssistantConfig = {
      name,
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }],
      },
      voice: {
        provider: "11labs",
        voiceId,
      },
      firstMessage: `Hola, gracias por llamar a ${businessName}. Soy Sofía, ¿en qué puedo ayudarte hoy?`,
      endCallPhrases: [
        "hasta luego",
        "adiós",
        "bye",
        "chao",
        "gracias adiós",
        "que tengas buen día",
      ],
      transcriber: {
        provider: "deepgram",
        language: "es",
      },
      metadata: {
        tenantId: profile.tenant_id,
        businessName,
      },
    };

    const assistant = await createAssistant(config);

    return NextResponse.json({ data: assistant }, { status: 201 });
  } catch (error) {
    console.error("Vapi assistants POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
