import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { STRIPE_PRICES, type PlanKey } from "@/lib/stripe/prices";
import { createOrRetrieveCustomer } from "@/lib/stripe/helpers";

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
      .select("tenant_id, full_name, email")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      plan: PlanKey;
      successUrl: string;
      cancelUrl: string;
    };

    const { plan, successUrl, cancelUrl } = body;

    if (!plan || !(plan in STRIPE_PRICES)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: "successUrl and cancelUrl are required" },
        { status: 400 }
      );
    }

    const customerId = await createOrRetrieveCustomer(
      profile.tenant_id,
      profile.email ?? user.email ?? "",
      profile.full_name ?? ""
    );

    const priceConfig = STRIPE_PRICES[plan];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceConfig.monthly,
          quantity: 1,
        },
      ],
      metadata: {
        tenantId: profile.tenant_id,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          tenantId: profile.tenant_id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
