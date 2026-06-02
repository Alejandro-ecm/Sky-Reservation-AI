import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/whatsapp/client";

// ============================================================
// GET — list WhatsApp conversations
// ============================================================
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") ?? "1");
    const perPage = parseInt(searchParams.get("per_page") ?? "20");

    const { data, error, count } = await supabase
      .from("conversations")
      .select(
        `
        *,
        customer:customers(id, name, phone, email)
      `,
        { count: "exact" }
      )
      .eq("tenant_id", profile.tenant_id)
      .eq("channel", "whatsapp")
      .order("updated_at", { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
    });
  } catch (error) {
    console.error("WhatsApp messages GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — send manual message
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
      to: string;
      message: string;
      tenantId: string;
    };

    const { to, message } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: "to and message are required" },
        { status: 400 }
      );
    }

    // Send via WhatsApp API
    await sendMessage(to, message);

    // Save to conversations
    const { data: existingConvo } = await supabase
      .from("conversations")
      .select("id, messages")
      .eq("tenant_id", profile.tenant_id)
      .eq("channel", "whatsapp")
      .contains("messages", JSON.stringify([]))
      .maybeSingle();

    const newMsg = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: message,
      timestamp: new Date().toISOString(),
    };

    if (existingConvo?.id) {
      const updated = [...(existingConvo.messages ?? []), newMsg];
      await supabase
        .from("conversations")
        .update({ messages: updated, updated_at: new Date().toISOString() })
        .eq("id", existingConvo.id);
    } else {
      await supabase.from("conversations").insert({
        tenant_id: profile.tenant_id,
        channel: "whatsapp",
        status: "active",
        messages: [newMsg],
        metadata: { to },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WhatsApp messages POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
