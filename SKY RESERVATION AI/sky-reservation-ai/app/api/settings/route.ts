import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/security/audit-logger";
import { getClientIP } from "@/lib/security/sanitize";

// GET tenant settings + team members
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
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const [tenantResult, teamResult] = await Promise.all([
      supabase
        .from("tenants")
        .select("id, name, slug, plan, settings, created_at")
        .eq("id", profile.tenant_id)
        .single(),
      supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at, avatar_url")
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: true }),
    ]);

    return NextResponse.json({
      data: {
        tenant: tenantResult.data,
        team: teamResult.data ?? [],
      },
    });
  } catch (err) {
    console.error("Settings GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT — update tenant settings
export async function PUT(request: NextRequest) {
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
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = (await request.json()) as {
      name?: string;
      settings?: Record<string, unknown>;
    };

    const updatePayload: Record<string, unknown> = {};
    if (body.name) updatePayload.name = body.name;
    if (body.settings) updatePayload.settings = body.settings;

    const { data, error } = await supabase
      .from("tenants")
      .update(updatePayload)
      .eq("id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    void logAuditEvent({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: "settings.update",
      resource_type: "tenant",
      resource_id: profile.tenant_id,
      ip_address: getClientIP(request.headers),
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Settings PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
