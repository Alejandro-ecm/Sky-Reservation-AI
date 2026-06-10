import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface MetaPhoneResponse {
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  error?: { message: string };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    return NextResponse.json({ connected: false });
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}?fields=display_phone_number,verified_name,quality_rating`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } }
    );
    const data = (await res.json()) as MetaPhoneResponse;

    if (!res.ok || data.error) {
      return NextResponse.json({ connected: false, error: data.error?.message });
    }

    return NextResponse.json({
      connected: true,
      phoneNumber: data.display_phone_number,
      displayName: data.verified_name,
      qualityRating: data.quality_rating,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
