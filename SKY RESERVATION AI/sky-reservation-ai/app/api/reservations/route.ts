import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/whatsapp/client";

const CreateReservationSchema = z.object({
  customer_id: z.string().uuid(),
  service_id: z.string().uuid(),
  start_time: z.string().datetime({ offset: true }),
  end_time: z.string().datetime({ offset: true }),
  staff_id: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
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
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const page = parseInt(searchParams.get("page") ?? "1");
    const perPage = parseInt(searchParams.get("per_page") ?? "20");

    let query = supabase
      .from("reservations")
      .select(
        `
        *,
        customer:customers(id, name, phone, email),
        staff:staff(id, name),
        service:services(id, name, price, duration_minutes)
      `,
        { count: "exact" }
      )
      .eq("tenant_id", profile.tenant_id)
      .order("start_time", { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (status) query = query.eq("status", status);
    if (dateFrom) query = query.gte("start_time", dateFrom);
    if (dateTo) query = query.lte("start_time", dateTo);

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
    console.error("Reservations GET error:", err);
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

    const parsed = CreateReservationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { customer_id, staff_id, service_id, start_time, end_time, notes } = parsed.data;

    // Validate ownership: customer and service must belong to this tenant
    const [{ data: customerCheck }, { data: serviceCheck }] = await Promise.all([
      supabase
        .from("customers")
        .select("id")
        .eq("id", customer_id)
        .eq("tenant_id", profile.tenant_id)
        .single(),
      supabase
        .from("services")
        .select("id")
        .eq("id", service_id)
        .eq("tenant_id", profile.tenant_id)
        .single(),
    ]);

    if (!customerCheck) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    if (!serviceCheck) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (staff_id) {
      const { data: staffCheck } = await supabase
        .from("staff")
        .select("id")
        .eq("id", staff_id)
        .eq("tenant_id", profile.tenant_id)
        .single();
      if (!staffCheck) {
        return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
      }
    }

    // Check for double-booking: overlapping time slot for same staff
    if (staff_id) {
      const { data: conflicts, error: conflictError } = await supabase
        .from("reservations")
        .select("id")
        .eq("tenant_id", profile.tenant_id)
        .eq("staff_id", staff_id)
        .in("status", ["pending", "confirmed"])
        .or(
          `and(start_time.lt.${end_time},end_time.gt.${start_time})`
        );

      if (conflictError) {
        return NextResponse.json({ error: conflictError.message }, { status: 500 });
      }

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          { error: "Staff member already has a reservation in this time slot" },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from("reservations")
      .insert({
        tenant_id: profile.tenant_id,
        customer_id,
        staff_id: staff_id ?? null,
        service_id,
        start_time,
        end_time,
        notes: notes ?? null,
        status: "pending",
      })
      .select(`
        *,
        customer:customers(id, name, phone, email),
        service:services(id, name, price, duration_minutes)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-send WhatsApp confirmation if customer has phone
    const customerPhone = data?.customer?.phone;
    const serviceName = data?.service?.name ?? "el servicio";

    if (customerPhone) {
      const startDate = new Date(start_time);
      const dateStr = startDate.toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timeStr = startDate.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const confirmationMsg = `✅ *Reservación Confirmada*\n\nHola ${data.customer?.name ?? ""}! Tu cita ha sido agendada:\n\n📋 *Servicio:* ${serviceName}\n📅 *Fecha:* ${dateStr}\n⏰ *Hora:* ${timeStr}\n\nSi necesitas cancelar o cambiar tu cita, contáctanos. ¡Te esperamos!`;

      sendMessage(customerPhone, confirmationMsg).catch((e) =>
        console.error("Failed to send WhatsApp confirmation:", e)
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("Reservations POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
