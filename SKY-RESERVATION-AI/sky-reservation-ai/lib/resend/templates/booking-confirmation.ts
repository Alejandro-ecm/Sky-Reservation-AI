interface BookingConfirmationData {
  customerName: string;
  tenantName: string;
  serviceName: string;
  startTime: string; // ISO string
  reservationId: string;
  tenantPhone?: string;
  tenantEmail?: string;
}

export function bookingConfirmationHtml(data: BookingConfirmationData): string {
  const date = new Date(data.startTime);
  const dateStr = date.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Mexico_City",
  });
  const timeStr = date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  });

  const refShort = data.reservationId.slice(0, 8).toUpperCase();

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#00E5FF,#7000FF);padding:32px;text-align:center">
            <p style="margin:0;color:rgba(0,0,0,0.6);font-size:13px;letter-spacing:1px;text-transform:uppercase">Reservación Confirmada</p>
            <h1 style="margin:8px 0 0;color:#000000;font-size:28px;font-weight:800">✅ ¡Todo listo!</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 24px;color:#374151;font-size:15px">Hola <strong>${data.customerName}</strong>,</p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6">
              Tu reservación en <strong style="color:#111827">${data.tenantName}</strong> ha sido confirmada. ¡Te esperamos!
            </p>
            <!-- Details card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px">
              <tr><td style="padding:20px">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">
                      <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Servicio</span><br>
                      <strong style="color:#111827;font-size:15px">${data.serviceName}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">
                      <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Fecha</span><br>
                      <strong style="color:#111827;font-size:15px">${dateStr}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">
                      <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Hora</span><br>
                      <strong style="color:#111827;font-size:15px">${timeStr}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0">
                      <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Referencia</span><br>
                      <strong style="color:#111827;font-size:15px;font-family:monospace">#${refShort}</strong>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
            ${data.tenantPhone || data.tenantEmail ? `
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px">¿Necesitas cancelar o cambiar tu cita?</p>
            <p style="margin:0;color:#6b7280;font-size:13px">
              ${data.tenantPhone ? `📞 ${data.tenantPhone}` : ""}
              ${data.tenantPhone && data.tenantEmail ? " &nbsp;·&nbsp; " : ""}
              ${data.tenantEmail ? `✉️ ${data.tenantEmail}` : ""}
            </p>` : ""}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb">
            <p style="margin:0;color:#9ca3af;font-size:12px">
              Powered by <strong>Sky Reservation AI</strong>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function bookingConfirmationSubject(tenantName: string): string {
  return `✅ Reservación confirmada — ${tenantName}`;
}
