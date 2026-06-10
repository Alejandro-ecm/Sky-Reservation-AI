"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile, Tenant } from "@/types";

interface UserData {
  user: User | null;
  profile: Profile | null;
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
}

export function useUser(): UserData {
  const [data, setData] = useState<UserData>({
    user: null,
    profile: null,
    tenant: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setData({ user: null, profile: null, tenant: null, isLoading: false, error: null });
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*, tenant:tenants(*)")
          .eq("id", user.id)
          .single();

        if (profileError) {
          setData({ user, profile: null, tenant: null, isLoading: false, error: profileError.message });
          return;
        }

        const tenantData = profile?.tenant as unknown as Tenant | null;
        const profileData = { ...profile } as Profile;

        setData({ user, profile: profileData, tenant: tenantData, isLoading: false, error: null });
      } catch (err) {
        setData({ user: null, profile: null, tenant: null, isLoading: false, error: "Failed to load user" });
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  return data;
}
