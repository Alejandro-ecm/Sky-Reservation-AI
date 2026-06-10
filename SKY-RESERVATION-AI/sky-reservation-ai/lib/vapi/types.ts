// ============================================================
// VAPI TYPE DEFINITIONS
// ============================================================

export interface VapiAssistantConfig {
  name: string;
  model: {
    provider: "openai";
    model: "gpt-4o-mini";
    messages: [{ role: "system"; content: string }];
  };
  voice: {
    provider: "11labs" | "openai";
    voiceId: string;
  };
  firstMessage: string;
  endCallPhrases: string[];
  transcriber: {
    provider: "deepgram";
    language: "es" | "en";
  };
  metadata?: Record<string, string>;
}

export interface VapiAssistant {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  model?: VapiAssistantConfig["model"];
  voice?: VapiAssistantConfig["voice"];
  firstMessage?: string;
  metadata?: Record<string, string>;
}

export interface VapiCall {
  id: string;
  assistantId: string;
  status: "queued" | "ringing" | "in-progress" | "forwarding" | "ended";
  startedAt?: string;
  endedAt?: string;
  transcript?: string;
  summary?: string;
  customer?: {
    number: string;
  };
  durationSeconds?: number;
  endedReason?: string;
}

export interface VapiPhoneNumber {
  id: string;
  number: string;
  assistantId: string;
}

export interface VapiWebhookEvent {
  message: {
    type:
      | "assistant-request"
      | "function-call"
      | "status-update"
      | "transcript"
      | "hang"
      | "end-of-call-report"
      | "speech-update"
      | "tool-calls";
    call?: VapiCall;
    status?: string;
    transcript?: string;
    artifact?: {
      transcript?: string;
      summary?: string;
      messages?: Array<{ role: string; content: string; time: number }>;
    };
  };
}
