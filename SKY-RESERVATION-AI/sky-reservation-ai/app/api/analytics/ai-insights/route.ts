import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";

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

    const body = (await request.json()) as { stats: Record<string, unknown> };
    const { stats } = body;

    if (!stats) {
      return NextResponse.json({ error: "Missing stats in request body" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un AI de análisis de negocios especializado en empresas de servicios con reservaciones. Responde SIEMPRE en español y SIEMPRE en formato JSON válido.",
        },
        {
          role: "user",
          content: `Dados estos métricas de un negocio que usa Sky Reservation AI:

${JSON.stringify(stats, null, 2)}

Proporciona exactamente 5 insights específicos y accionables en español. Enfócate en qué está funcionando bien, qué necesita mejorar, y pasos concretos a tomar.

Responde ÚNICAMENTE con un JSON array de strings, sin texto adicional. Ejemplo:
["Insight 1...", "Insight 2...", "Insight 3...", "Insight 4...", "Insight 5..."]`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";

    let insights: string[] = [];
    try {
      const parsed = JSON.parse(rawContent) as { insights?: string[] } | string[];
      if (Array.isArray(parsed)) {
        insights = parsed as string[];
      } else if (parsed && typeof parsed === "object" && "insights" in parsed && Array.isArray(parsed.insights)) {
        insights = parsed.insights;
      } else {
        // Try to find any array in the response
        const values = Object.values(parsed as Record<string, unknown>);
        const found = values.find((v) => Array.isArray(v));
        if (found) insights = found as string[];
      }
    } catch {
      insights = [
        "No se pudieron generar insights en este momento. Intenta de nuevo.",
      ];
    }

    return NextResponse.json({ insights });
  } catch (err) {
    console.error("AI insights error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
