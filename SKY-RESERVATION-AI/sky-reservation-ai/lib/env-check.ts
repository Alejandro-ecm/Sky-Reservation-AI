import { z } from "zod";

const requiredEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  VAPI_WEBHOOK_SECRET: z.string().min(1),
  META_APP_SECRET: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().min(1),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

const optionalEnvKeys = [
  "STRIPE_PRICE_STARTER_MONTHLY",
  "STRIPE_PRICE_PRO_MONTHLY",
  "STRIPE_PRICE_ENTERPRISE_MONTHLY",
  "MERCADOPAGO_ACCESS_TOKEN",
] as const;

let validated = false;

export function validateEnv(): void {
  if (validated) return;

  const result = requiredEnvSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.errors.map((e) => e.path.join(".")).join(", ");
    const message =
      `[Sky Reservation AI] Missing required environment variables: ${missing}\n` +
      `Add them to .env.local (dev) or to Vercel Environment Variables (prod).`;

    // During `next build`, Next.js sets NEXT_PHASE to 'phase-production-build'.
    // Env vars may legitimately be absent at build time in CI — only throw at
    // server *runtime* when requests are actually served.
    const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

    if (process.env.NODE_ENV === "production" && !isBuildPhase) {
      throw new Error(message);
    } else {
      console.warn(message);
    }
  }

  const missingOptional = optionalEnvKeys.filter((key) => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(
      `[Sky Reservation AI] Optional env vars not set: ${missingOptional.join(", ")}`
    );
  }

  validated = true;
}
