import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/stripe/helpers";
import { sendEmail } from "@/lib/resend/client";
import { bookingReminderHtml, bookingReminderSubject } from "@/lib/resend/templates/booking-reminder";

// Vercel Cron calls this every hour — send reminder emails to customers
// whose reservation starts in the next 23–25h window (de-duplicated via DB flag).
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const db = getServiceSupabase();
  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const { data: reservations, error } = await db
    .from("reservations")
    .select(`
      id,
      start_time,
      reminder_sent,
      customers ( name, email ),
      services ( name ),
      tenants ( name, settings )
    `)
    .gte("start_time", windowStart.toISOString())
    .lte("start_time", windowEnd.toISOString())
    .in("status", ["confirmed", "pending"])
    .eq("reminder_sent", false);

  if (error) {
    console.error("[cron/reminders] query error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const r of reservations ?? []) {
    const customer = r.customers as unknown as { name: string; email: string | null } | null;
    const service = r.services as unknown as { name: string } | null;
    const tenant = r.tenants as unknown as { name: string; settings: Record<string, unknown> } | null;
    const email = customer?.email;
    if (!email || !customer || !service || !tenant) continue;

    const settings = tenant.settings as {
      phone?: string;
      business_email?: string;
    };

    try {
      await sendEmail({
        to: email,
        subject: bookingReminderSubject(tenant.name),
        html: bookingReminderHtml({
          customerName: customer.name,
          tenantName: tenant.name,
          serviceName: service.name,
          startTime: r.start_time,
          reservationId: r.id,
          tenantPhone: settings.phone,
          tenantEmail: settings.business_email,
        }),
      });

      await db
        .from("reservations")
        .update({ reminder_sent: true })
        .eq("id", r.id);

      sent++;
    } catch (err) {
      console.error("[cron/reminders] send failed for", r.id, err);
      failed++;
    }
  }

  console.log(`[cron/reminders] sent=${sent} failed=${failed} window=${windowStart.toISOString()}–${windowEnd.toISOString()}`);
  return NextResponse.json({ sent, failed });
}
