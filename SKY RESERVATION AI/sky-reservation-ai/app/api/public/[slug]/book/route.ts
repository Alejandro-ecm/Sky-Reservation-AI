import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/stripe/helpers";
import { publicBookingLimiter } from "@/lib/security/rate-limiter";
import { getClientIP } from "@/lib/security/sanitize";
import { sendEmail } from "@/lib/resend/client";
import { bookingConfirmationHtml, bookingConfirmationSubject } from "@/lib/resend/templates/booking-confirmation";
import { sendMessage } from "@/lib/whatsapp/client";

const BookingSchema = z.object({
  service_id: z.string().uuid(),
  staff_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  customer_name: z.string().min(2, "Nombre muy corto").max(120),
  customer_phone: z.string().min(7, "Teléfono inválido").max(20).optional().or(z.literal("")),
  customer_email: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Rate limit: 5 bookings per hour per IP
    const ip = getClientIP(request.headers);
    const rl = await publicBookingLimiter(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    const { slug } = await params;
    const parsed = BookingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { service_id, staff_id, date, time, customer_name, customer_phone, customer_email, notes } =
      parsed.data;

    const db = getServiceSupabase();

    // Resolve tenant by slug
    const { data: tenant } = await db
      .from("tenants")
      .select("id, name, settings")
      .eq("slug", slug)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Validate service belongs to this tenant
    const { data: svc } = await db
      .from("services")
      .select("id, name, duration_minutes, price")
      .eq("id", service_id)
      .eq("tenant_id", tenant.id)
      .eq("active", true)
      .single();

    if (!svc) {
      return NextResponse.json({ error: "Servicio no disponible" }, { status: 404 });
    }

    // Validate staff if provided
    if (staff_id) {
      const { data: staffMember } = await db
        .from("staff")
        .select("id")
        .eq("id", staff_id)
        .eq("tenant_id", tenant.id)
        .single();

      if (!staffMember) {
        return NextResponse.json({ error: "Staff no encontrado" }, { status: 404 });
      }
    }

    // Compute start/end times
    const start = new Date(`${date}T${time}:00`);
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: "Fecha u hora inválida" }, { status: 400 });
    }
    if (start < new Date()) {
      return NextResponse.json({ error: "No puedes reservar en el pasado" }, { status: 400 });
    }
    const end = new Date(start.getTime() + svc.duration_minutes * 60 * 1000);

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    // Anti-race condition: verify slot still available
    if (staff_id) {
      const { data: conflicts } = await db
        .from("reservations")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("staff_id", staff_id)
        .in("status", ["pending", "confirmed"])
        .or(`and(start_time.lt.${endIso},end_time.gt.${startIso})`);

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json({ error: "El horario ya no está disponible. Elige otro." }, { status: 409 });
      }
    }

    // Upsert customer by phone (preferred) or email
    let customerId: string;
    const phone = customer_phone || null;
    const email = customer_email || null;

    const lookupField = phone ? "phone" : email ? "email" : null;
    const lookupValue = phone ?? email;

    let existingCustomer: { id: string } | null = null;
    if (lookupField && lookupValue) {
      const { data } = await db
        .from("customers")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq(lookupField, lookupValue)
        .maybeSingle();
      existingCustomer = data;
    }

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update name in case it changed
      await db.from("customers").update({ name: customer_name }).eq("id", customerId);
    } else {
      const { data: newCustomer, error: custErr } = await db
        .from("customers")
        .insert({ tenant_id: tenant.id, name: customer_name, phone, email })
        .select("id")
        .single();

      if (custErr || !newCustomer) {
        console.error("[public/book] customer insert:", custErr?.message);
        return NextResponse.json({ error: "Error al registrar cliente" }, { status: 500 });
      }
      customerId = newCustomer.id;
    }

    // Insert reservation
    const { data: reservation, error: resErr } = await db
      .from("reservations")
      .insert({
        tenant_id: tenant.id,
        customer_id: customerId,
        service_id: svc.id,
        staff_id: staff_id ?? null,
        start_time: startIso,
        end_time: endIso,
        notes: notes || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (resErr || !reservation) {
      console.error("[public/book] reservation insert:", resErr?.message);
      return NextResponse.json({ error: "Error al crear la reservación" }, { status: 500 });
    }

    const settings = tenant.settings as Record<string, unknown>;
    const tenantPhone = (settings?.phone as string) ?? undefined;
    const tenantEmail = (settings?.email as string) ?? undefined;

    // Fire-and-forget: email confirmation
    if (email) {
      void sendEmail({
        to: email,
        subject: bookingConfirmationSubject(tenant.name),
        html: bookingConfirmationHtml({
          customerName: customer_name,
          tenantName: tenant.name,
          serviceName: svc.name,
          startTime: startIso,
          reservationId: reservation.id,
          tenantPhone,
          tenantEmail,
        }),
      });
    }

    // Fire-and-forget: WhatsApp confirmation (uses existing client)
    if (phone) {
      const dateStr = start.toLocaleDateString("es-MX", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "America/Mexico_City",
      });
      const timeStr = start.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Mexico_City",
      });
      const msg = `✅ *Reservación Confirmada*\n\nHola ${customer_name}! Tu cita en *${tenant.name}* ha sido agendada:\n\n📋 *Servicio:* ${svc.name}\n📅 *Fecha:* ${dateStr}\n⏰ *Hora:* ${timeStr}\n\n¿Necesitas cancelar? Contáctanos.\n¡Te esperamos! 🙌`;
      void sendMessage(phone, msg).catch((e) => console.error("[public/book] WhatsApp:", e));
    }

    return NextResponse.json({
      reservation_id: reservation.id,
      start_time: startIso,
      tenant_name: tenant.name,
      service_name: svc.name,
    }, { status: 201 });
  } catch (err) {
    console.error("[public/book]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
