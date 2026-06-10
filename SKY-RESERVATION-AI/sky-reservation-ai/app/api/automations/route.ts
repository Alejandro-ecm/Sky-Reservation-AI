import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AutomationAction, WorkflowTrigger, AutomationConfig } from "@/lib/n8n/types";

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

    const { data, error } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("Automations GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      trigger: WorkflowTrigger;
      action: AutomationAction;
      config: AutomationConfig;
      enabled?: boolean;
    };

    const { name, trigger, action, config, enabled = true } = body;

    if (!name || !trigger || !action || !config) {
      return NextResponse.json(
        { error: "Missing required fields: name, trigger, action, config" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("automation_rules")
      .insert({
        tenant_id: profile.tenant_id,
        name,
        trigger,
        action,
        config,
        enabled,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("Automations POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
