import type {
  VapiAssistant,
  VapiAssistantConfig,
  VapiCall,
  VapiPhoneNumber,
} from "./types";

const VAPI_BASE = "https://api.vapi.ai";

function getHeaders(): Record<string, string> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    throw new Error("VAPI_API_KEY environment variable is not set");
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function vapiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${VAPI_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Vapi API error ${response.status}: ${errorText}`
    );
  }

  // DELETE returns 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ============================================================
// ASSISTANTS
// ============================================================

export async function createAssistant(
  config: VapiAssistantConfig
): Promise<VapiAssistant> {
  return vapiRequest<VapiAssistant>("/assistant", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function listAssistants(): Promise<VapiAssistant[]> {
  return vapiRequest<VapiAssistant[]>("/assistant");
}

export async function getAssistant(id: string): Promise<VapiAssistant> {
  return vapiRequest<VapiAssistant>(`/assistant/${id}`);
}

export async function updateAssistant(
  id: string,
  config: Partial<VapiAssistantConfig>
): Promise<VapiAssistant> {
  return vapiRequest<VapiAssistant>(`/assistant/${id}`, {
    method: "PATCH",
    body: JSON.stringify(config),
  });
}

export async function deleteAssistant(id: string): Promise<void> {
  return vapiRequest<void>(`/assistant/${id}`, {
    method: "DELETE",
  });
}

// ============================================================
// CALLS
// ============================================================

export async function listCalls(params?: {
  limit?: number;
  tenantId?: string;
}): Promise<VapiCall[]> {
  const searchParams = new URLSearchParams();
  if (params?.limit) {
    searchParams.set("limit", String(params.limit));
  }
  const query = searchParams.toString();
  return vapiRequest<VapiCall[]>(`/call${query ? `?${query}` : ""}`);
}

export async function getCall(id: string): Promise<VapiCall> {
  return vapiRequest<VapiCall>(`/call/${id}`);
}

// ============================================================
// PHONE NUMBERS
// ============================================================

export async function createPhoneNumber(
  number: string,
  assistantId: string
): Promise<VapiPhoneNumber> {
  return vapiRequest<VapiPhoneNumber>("/phone-number", {
    method: "POST",
    body: JSON.stringify({ number, assistantId }),
  });
}

export async function listPhoneNumbers(): Promise<VapiPhoneNumber[]> {
  return vapiRequest<VapiPhoneNumber[]>("/phone-number");
}
