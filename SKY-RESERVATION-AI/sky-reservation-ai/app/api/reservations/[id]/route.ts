import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/security/audit-logger";
import { getClientIP } from "@/lib/security/sanitize";

// ============================================================
// GET — single reservation
// ============================================================
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
        *,
        customer:customers(id, name, phone, email, tags, lead_score),
        staff:staff(id, name, availability),
        service:services(id, name, price, duration_minutes, description)
      `
      )
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Reservation GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================
// PUT — update reservation
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = (await request.json()) as {
      start_time?: string;
      end_time?: string;
      status?: string;
      staff_id?: string;
      notes?: string;
    };

    // If rescheduling with a staff, check for conflicts (excluding this reservation)
    if (body.start_time && body.end_time && body.staff_id) {
      const { data: conflicts } = await supabase
        .from("reservations")
        .select("id")
        .eq("tenant_id", profile.tenant_id)
        .eq("staff_id", body.staff_id)
        .neq("id", id)
        .in("status", ["pending", "confirmed"])
        .or(`and(start_time.lt.${body.end_time},end_time.gt.${body.start_time})`);

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          { error: "Staff member already has a reservation in this time slot" },
          { status: 409 }
        );
      }
    }

    const updateFields: Record<string, unknown> = {};
    if (body.start_time !== undefined) updateFields.start_time = body.start_time;
    if (body.end_time !== undefined) updateFields.end_time = body.end_time;
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.staff_id !== undefined) updateFields.staff_id = body.staff_id;
    if (body.notes !== undefined) updateFields.notes = body.notes;

    const { data, error } = await supabase
      .from("reservations")
      .update(updateFields)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    void logAuditEvent({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: "reservation.update",
      resource_type: "reservation",
      resource_id: id,
      ip_address: getClientIP(request.headers),
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Reservation PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================
// DELETE — cancel reservation
// ============================================================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { error } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    void logAuditEvent({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: "reservation.delete",
      resource_type: "reservation",
      resource_id: id,
      ip_address: getClientIP(_request.headers),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reservation DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
