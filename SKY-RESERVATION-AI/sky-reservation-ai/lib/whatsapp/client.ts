const BASE_URL = `https://graph.facebook.com/v21.0`;

function getPhoneNumberId(): string {
  const id = process.env.META_WHATSAPP_PHONE_ID;
  if (!id) throw new Error("META_WHATSAPP_PHONE_ID is not set");
  return id;
}

function getToken(): string {
  const token = process.env.META_WHATSAPP_TOKEN;
  if (!token) throw new Error("META_WHATSAPP_TOKEN is not set");
  return token;
}

async function metaRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Meta API error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// ============================================================
// SEND TEXT MESSAGE
// ============================================================

export async function sendMessage(to: string, message: string): Promise<void> {
  const phoneNumberId = getPhoneNumberId();
  await metaRequest(`/${phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: message },
    }),
  });
}

// ============================================================
// SEND TEMPLATE MESSAGE
// ============================================================

export async function sendTemplate(
  to: string,
  templateName: string,
  params: string[]
): Promise<void> {
  const phoneNumberId = getPhoneNumberId();
  await metaRequest(`/${phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "es_MX" },
        components: params.length > 0
          ? [
              {
                type: "body",
                parameters: params.map((text) => ({ type: "text", text })),
              },
            ]
          : [],
      },
    }),
  });
}

// ============================================================
// MARK MESSAGE AS READ
// ============================================================

export async function markAsRead(messageId: string): Promise<void> {
  const phoneNumberId = getPhoneNumberId();
  await metaRequest(`/${phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}

// ============================================================
// GET MEDIA URL
// ============================================================

export async function getMediaUrl(mediaId: string): Promise<string> {
  const data = await metaRequest<{ url: string }>(`/${mediaId}`);
  return data.url;
}
