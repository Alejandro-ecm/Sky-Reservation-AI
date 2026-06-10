// Validates required environment variables at startup.
// Import this at the top of any server entry point or API route that needs a specific var.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

// ─── Required for all environments ───────────────────────────────────────────
export const env = {
  SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  APP_URL: optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),

  // Optional — only required when those features are used
  get SUPABASE_SERVICE_ROLE_KEY() { return requireEnv("SUPABASE_SERVICE_ROLE_KEY"); },
  get OPENAI_API_KEY() { return requireEnv("OPENAI_API_KEY"); },
  get VAPI_API_KEY() { return requireEnv("VAPI_API_KEY"); },
  get VAPI_WEBHOOK_SECRET() { return optionalEnv("VAPI_WEBHOOK_SECRET"); },
  get META_WHATSAPP_TOKEN() { return requireEnv("META_WHATSAPP_TOKEN"); },
  get META_WHATSAPP_PHONE_ID() { return requireEnv("META_WHATSAPP_PHONE_ID"); },
  get META_WEBHOOK_VERIFY_TOKEN() { return requireEnv("META_WEBHOOK_VERIFY_TOKEN"); },
  get STRIPE_SECRET_KEY() { return requireEnv("STRIPE_SECRET_KEY"); },
  get STRIPE_WEBHOOK_SECRET() { return requireEnv("STRIPE_WEBHOOK_SECRET"); },
  get MERCADOPAGO_ACCESS_TOKEN() { return requireEnv("MERCADOPAGO_ACCESS_TOKEN"); },
  get N8N_WEBHOOK_URL() { return optionalEnv("N8N_WEBHOOK_URL"); },
} as const;
