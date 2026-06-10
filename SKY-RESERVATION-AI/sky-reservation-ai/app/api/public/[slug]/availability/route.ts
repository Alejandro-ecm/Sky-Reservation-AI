import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/stripe/helpers";

interface DayHours {
  enabled: boolean;
  open: string;
  close: string;
}

type WeeklySchedule = Record<string, DayHours>;

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const DEFAULT_HOURS: DayHours = { enabled: true, open: "09:00", close: "18:00" };

function generateSlots(open: string, close: string, durationMinutes: number): string[] {
  const slots: string[] = [];
  const [openH, openM] = open.split(":").map(Number);
  const [closeH, closeM] = close.split(":").map(Number);
  const openTotal = openH * 60 + openM;
  const closeTotal = closeH * 60 + closeM;

  for (let t = openTotal; t + durationMinutes <= closeTotal; t += durationMinutes) {
    const h = String(Math.floor(t / 60)).padStart(2, "0");
    const m = String(t % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = request.nextUrl;
    const date = searchParams.get("date");        // YYYY-MM-DD
    const serviceId = searchParams.get("service_id");
    const staffId = searchParams.get("staff_id"); // optional

    if (!date || !serviceId) {
      return NextResponse.json({ error: "date y service_id son requeridos" }, { status: 400 });
    }

    const service = getServiceSupabase();

    // Resolve tenant + service in parallel
    const [{ data: tenant }, { data: svc }] = await Promise.all([
      service.from("tenants").select("id, settings").eq("slug", slug).single(),
      service.from("services").select("duration_minutes").eq("id", serviceId).single(),
    ]);

    if (!tenant) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    if (!svc) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });

    // Get business hours for the selected day
    const dayIndex = new Date(`${date}T12:00:00`).getDay();
    const dayName = DAY_NAMES[dayIndex];
    const hours = ((tenant.settings as Record<string, unknown>)?.hours as WeeklySchedule) ?? {};
    const dayHours: DayHours = hours[dayName] ?? DEFAULT_HOURS;

    if (!dayHours.enabled) {
      return NextResponse.json({ available_slots: [] });
    }

    // Generate all theoretical slots
    const allSlots = generateSlots(dayHours.open, dayHours.close, svc.duration_minutes);

    if (allSlots.length === 0) {
      return NextResponse.json({ available_slots: [] });
    }

    // Build time range for the day
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;

    // Fetch existing reservations that overlap this day
    let query = service
      .from("reservations")
      .select("start_time, end_time, staff_id")
      .eq("tenant_id", tenant.id)
      .in("status", ["pending", "confirmed"])
      .gte("start_time", dayStart)
      .lte("start_time", dayEnd);

    if (staffId) query = query.eq("staff_id", staffId);

    const { data: existing } = await query;

    // Convert reservations to occupied minute ranges
    const occupied = (existing ?? []).map((r) => ({
      start: new Date(r.start_time).getHours() * 60 + new Date(r.start_time).getMinutes(),
      end: new Date(r.end_time).getHours() * 60 + new Date(r.end_time).getMinutes(),
    }));

    // Filter slots that don't overlap
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const available = allSlots.filter((slot) => {
      const [h, m] = slot.split(":").map(Number);
      const slotStart = h * 60 + m;
      const slotEnd = slotStart + svc.duration_minutes;

      // Skip past slots for today
      if (date === todayStr && slotStart <= nowMinutes) return false;

      // Skip if any existing reservation overlaps
      return !occupied.some((o) => slotStart < o.end && slotEnd > o.start);
    });

    return NextResponse.json({ available_slots: available });
  } catch (err) {
    console.error("[public/availability]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
