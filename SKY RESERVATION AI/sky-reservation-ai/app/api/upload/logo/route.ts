import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/stripe/helpers";

const BUCKET = "tenant-logos";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];

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
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Máximo 2MB" }, { status: 400 });
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Solo PNG, JPG, SVG o WebP" }, { status: 400 });
    }

    const service = getServiceSupabase();

    // Create bucket on first upload if needed
    const { data: buckets } = await service.storage.listBuckets();
    if (!buckets?.some((b) => b.name === BUCKET)) {
      await service.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_BYTES });
    }

    const ext = file.name.split(".").pop() ?? "png";
    const path = `${profile.tenant_id}/logo.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await service.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = service.storage.from(BUCKET).getPublicUrl(path);

    // Merge logo_url into existing settings
    const { data: tenant } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", profile.tenant_id)
      .single();

    await supabase
      .from("tenants")
      .update({ settings: { ...(tenant?.settings ?? {}), logo_url: publicUrl } })
      .eq("id", profile.tenant_id);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[upload/logo]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
