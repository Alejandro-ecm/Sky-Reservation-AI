import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubscription } from "@/lib/mercadopago/client";

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
      .select("tenant_id, email")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = (await request.json()) as { plan: string; tenantId?: string };
    const { plan } = body;

    if (!plan || !["starter", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const payerEmail = profile.email ?? user.email ?? "";
    const tenantId = profile.tenant_id;

    const { id, init_point } = await createSubscription(plan, payerEmail, tenantId);

    // Save the pending subscription ID to DB
    await supabase
      .from("subscriptions")
      .upsert(
        {
          tenant_id: tenantId,
          mercadopago_subscription_id: id,
          payment_provider: "mercadopago",
          plan,
          status: "trialing",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id" }
      );

    return NextResponse.json({ url: init_point, subscriptionId: id });
  } catch (err) {
    console.error("MercadoPago checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create MercadoPago subscription" },
      { status: 500 }
    );
  }
}
