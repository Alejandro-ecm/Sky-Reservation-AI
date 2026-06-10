import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/stripe/helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const service = getServiceSupabase();

    const { data: tenant, error } = await service
      .from("tenants")
      .select("id, name, slug, settings")
      .eq("slug", slug)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const [{ data: services }, { data: staff }] = await Promise.all([
      service
        .from("services")
        .select("id, name, description, duration_minutes, price")
        .eq("tenant_id", tenant.id)
        .eq("active", true)
        .order("name"),
      service
        .from("staff")
        .select("id, name")
        .eq("tenant_id", tenant.id)
        .order("name"),
    ]);

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        description: (tenant.settings as Record<string, unknown>)?.description ?? null,
        phone: (tenant.settings as Record<string, unknown>)?.phone ?? null,
        email: (tenant.settings as Record<string, unknown>)?.email ?? null,
        logo_url: (tenant.settings as Record<string, unknown>)?.logo_url ?? null,
        hours: (tenant.settings as Record<string, unknown>)?.hours ?? null,
      },
      services: services ?? [],
      staff: staff ?? [],
    });
  } catch (err) {
    console.error("[public/tenant]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
