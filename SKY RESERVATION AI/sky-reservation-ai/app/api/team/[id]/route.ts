import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/stripe/helpers";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!callerProfile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    if (!["owner", "admin"].includes(callerProfile.role)) {
      return NextResponse.json({ error: "Solo owners y admins pueden eliminar miembros" }, { status: 403 });
    }

    if (targetId === user.id) {
      return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
    }

    const service = getServiceSupabase();

    // Verify target belongs to same tenant and is not the owner
    const { data: targetProfile } = await service
      .from("profiles")
      .select("id, role, tenant_id")
      .eq("id", targetId)
      .single();

    if (!targetProfile || targetProfile.tenant_id !== callerProfile.tenant_id) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }
    if (targetProfile.role === "owner") {
      return NextResponse.json({ error: "No se puede eliminar al owner" }, { status: 400 });
    }

    const { error } = await service
      .from("profiles")
      .delete()
      .eq("id", targetId)
      .eq("tenant_id", callerProfile.tenant_id);

    if (error) {
      console.error("[team/delete]", error.message);
      return NextResponse.json({ error: "Error al eliminar miembro" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[team/delete]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
