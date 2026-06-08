import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase service credentials");
  return createServiceClient(url, key);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/, "");
}

/**
 * Returns the user's profile { tenant_id }, creating tenant + profile if missing.
 * Uses the service role to bypass RLS — only call from trusted server-side code.
 */
export async function ensureProfile(
  user: User
): Promise<{ tenant_id: string } | null> {
  const service = getServiceClient();

  const { data: profile } = await service
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.tenant_id) return profile as { tenant_id: string };

  // Invited user — metadata carries tenant_id + role set during inviteUserByEmail
  const invitedTenantId = user.user_metadata?.tenant_id as string | undefined;
  const invitedRole = user.user_metadata?.role as string | undefined;

  if (invitedTenantId && invitedRole) {
    const { data: invitedProfile, error } = await service
      .from("profiles")
      .insert({
        id: user.id,
        tenant_id: invitedTenantId,
        email: user.email,
        full_name: (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? "",
        role: invitedRole,
      })
      .select("tenant_id")
      .single();

    if (error) {
      console.error("[ensureProfile] invited profile creation failed:", error.message);
      return null;
    }
    return invitedProfile as { tenant_id: string };
  }

  // New owner — create tenant then profile
  const businessName =
    (user.user_metadata?.business_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "My Business";

  const slug = slugify(businessName) + "-" + user.id.slice(0, 8);

  const { data: tenant, error: tenantError } = await service
    .from("tenants")
    .insert({ name: businessName, slug, plan: "starter" })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    console.error("[ensureProfile] tenant creation failed:", tenantError?.message);
    return null;
  }

  const { data: newProfile, error: profileError } = await service
    .from("profiles")
    .insert({
      id: user.id,
      tenant_id: tenant.id,
      email: user.email,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? "",
      role: "owner",
    })
    .select("tenant_id")
    .single();

  if (profileError || !newProfile) {
    console.error("[ensureProfile] profile creation failed:", profileError?.message);
    return null;
  }

  return newProfile as { tenant_id: string };
}
