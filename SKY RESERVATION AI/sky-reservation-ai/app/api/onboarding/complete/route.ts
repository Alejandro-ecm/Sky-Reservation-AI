import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials");
  return createServiceClient(url, serviceKey);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomDigits(n: number): string {
  return Math.floor(Math.random() * Math.pow(10, n))
    .toString()
    .padStart(n, "0");
}

interface AIConfig {
  first_message?: string;
  voice_type?: "femenino" | "masculino";
  language?: "español" | "english" | "español+english";
  business_hours_type?: "weekdays" | "custom";
  business_hours?: Record<string, { open: string; close: string; enabled: boolean }>;
}

interface OnboardingBody {
  businessName: string;
  industry: string;
  city: string;
  phone: string;
  businessEmail?: string;
  plan: "starter" | "pro" | "enterprise";
  aiConfig: AIConfig;
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

    const body = (await request.json()) as OnboardingBody;
    const { businessName, industry, city, phone, businessEmail, plan, aiConfig } = body;

    if (!businessName || !industry || !city || !plan) {
      return NextResponse.json(
        { error: "Missing required fields: businessName, industry, city, plan" },
        { status: 400 }
      );
    }

    const serviceSupabase = getServiceSupabase();

    // Generate unique slug
    const baseSlug = slugify(businessName);
    const slug = `${baseSlug}-${randomDigits(4)}`;

    // Build default business hours based on aiConfig
    const defaultHours = { open: "09:00", close: "18:00", enabled: true };
    const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const weekend = ["saturday", "sunday"];

    const businessHours =
      aiConfig.business_hours_type === "custom" && aiConfig.business_hours
        ? aiConfig.business_hours
        : Object.fromEntries([
            ...weekdays.map((d) => [d, defaultHours]),
            ...weekend.map((d) => [d, { ...defaultHours, enabled: false }]),
          ]);

    // Build tenant settings
    const settings = {
      industry,
      city,
      phone,
      business_email: businessEmail ?? user.email,
      business_hours: businessHours,
      ai_settings: {
        voice_enabled: true,
        whatsapp_enabled: true,
        language: aiConfig.language ?? "español",
        first_message:
          aiConfig.first_message ?? "Hola, ¿en qué te puedo ayudar?",
        voice_type: aiConfig.voice_type ?? "femenino",
      },
      onboarded_at: new Date().toISOString(),
    };

    // Check if user already has a tenant (created by trigger)
    const { data: existingProfile } = await serviceSupabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    let tenantId: string;

    if (existingProfile?.tenant_id) {
      // Update existing tenant
      tenantId = existingProfile.tenant_id;

      await serviceSupabase
        .from("tenants")
        .update({
          name: businessName,
          slug,
          plan,
          settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tenantId);
    } else {
      // Create new tenant
      const { data: newTenant, error: tenantError } = await serviceSupabase
        .from("tenants")
        .insert({
          name: businessName,
          slug,
          plan,
          settings,
        })
        .select("id")
        .single();

      if (tenantError || !newTenant) {
        console.error("Tenant creation error:", tenantError);
        return NextResponse.json(
          { error: "Failed to create tenant" },
          { status: 500 }
        );
      }

      tenantId = newTenant.id;

      // Link profile to tenant
      await serviceSupabase
        .from("profiles")
        .update({ tenant_id: tenantId })
        .eq("id", user.id);
    }

    // Create or update subscription record (trial)
    const trialEndsAt = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000
    ).toISOString();

    await serviceSupabase
      .from("subscriptions")
      .upsert(
        {
          tenant_id: tenantId,
          plan,
          status: "trialing",
          trial_ends_at: trialEndsAt,
          payment_provider: "stripe",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id" }
      );

    return NextResponse.json({
      success: true,
      tenantId,
      slug,
    });
  } catch (err) {
    console.error("Onboarding complete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
