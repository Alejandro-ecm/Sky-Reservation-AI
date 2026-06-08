import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Buffer.from(bytes).toString("base64");
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    // In dev, React/Turbopack require eval() for call stack reconstruction.
    // strict-dynamic lets nonced scripts load their own children (Next.js chunks).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.vapi.ai https://graph.facebook.com https://js.stripe.com wss://*.supabase.co",
    "frame-src https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");
}

const STATIC_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

export async function middleware(request: NextRequest) {
  const nonce = generateNonce();

  // Forward nonce to server components via request header.
  // updateSession internally calls NextResponse.next({ request: { headers } })
  // which propagates these headers (including x-nonce) to RSCs and
  // allows Next.js to automatically nonce its own hydration scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  const requestWithNonce = new NextRequest(request, { headers: requestHeaders });

  const response = await updateSession(requestWithNonce);

  const res = response as NextResponse;
  res.headers.set("Content-Security-Policy", buildCsp(nonce));
  for (const [key, value] of Object.entries(STATIC_HEADERS)) {
    res.headers.set(key, value);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
