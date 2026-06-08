import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/stripe/helpers";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    if (!["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Solo owners y admins pueden invitar" }, { status: 403 });
    }

    const body = (await request.json()) as { email?: string; role?: string };
    const email = body.email?.trim().toLowerCase();
    const role = body.role;

    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    if (!["admin", "staff", "viewer"].includes(role ?? "")) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    // Check if email is already a member of this tenant
    const service = getServiceSupabase();
    const { data: existing } = await service
      .from("profiles")
      .select("id")
      .eq("tenant_id", profile.tenant_id)
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Este usuario ya es miembro del equipo" }, { status: 409 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const { error: inviteError } = await service.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=/dashboard`,
      data: {
        tenant_id: profile.tenant_id,
        role,
        invited_by: user.id,
      },
    });

    if (inviteError) {
      // Supabase returns this when the user already has an account but hasn't been
      // added to this tenant — the invite email is still sent
      const alreadyExists = inviteError.message.toLowerCase().includes("already been registered");
      if (!alreadyExists) {
        console.error("[team/invite]", inviteError.message);
        return NextResponse.json({ error: inviteError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[team/invite]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
