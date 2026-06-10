interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface ResendResponse {
  id?: string;
  error?: { message: string };
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[resend] RESEND_API_KEY not set — skipping email");
    return;
  }

  const from = options.from ?? "Sky Reservation AI <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }),
  });

  const data = (await res.json()) as ResendResponse;

  if (!res.ok) {
    console.error("[resend] Failed to send email:", data.error?.message ?? res.statusText);
  }
}
