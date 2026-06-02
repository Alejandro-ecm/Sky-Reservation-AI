import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CreateCustomerSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal("")),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export async function GET(request: NextRequest) {
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
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const perPage = parseInt(searchParams.get("per_page") ?? "20");
    const scoreMin = searchParams.get("score_min");
    const scoreMax = searchParams.get("score_max");
    const tag = searchParams.get("tag");

    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    if (scoreMin) query = query.gte("lead_score", parseInt(scoreMin));
    if (scoreMax) query = query.lte("lead_score", parseInt(scoreMax));
    if (tag) query = query.contains("tags", [tag]);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
    });
  } catch (err) {
    console.error("Customers GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const parsed = CreateCustomerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { name, phone, email, tags } = parsed.data;

    // Upsert by phone number (if provided)
    if (phone) {
      const { data, error } = await supabase
        .from("customers")
        .upsert(
          {
            tenant_id: profile.tenant_id,
            name,
            phone,
            email: email ?? null,
            tags: tags ?? [],
          },
          { onConflict: "tenant_id,phone" }
        )
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ data }, { status: 201 });
    }

    // Insert new customer without phone
    const { data, error } = await supabase
      .from("customers")
      .insert({
        tenant_id: profile.tenant_id,
        name,
        phone: null,
        email: email ?? null,
        tags: tags ?? [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("Customers POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
