import type { Metadata } from "next";
import Link from "next/link";
import { Code2, Webhook, Key, Zap, ArrowRight, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "API Docs — Sky AI",
  description: "Documentación de la API de Sky Reservation AI para desarrolladores.",
};

const endpoints = [
  {
    method: "GET",
    path: "/api/public/[slug]/tenant",
    desc: "Obtiene información del tenant, servicios y staff para el booking público.",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    method: "GET",
    path: "/api/public/[slug]/availability",
    desc: "Devuelve slots disponibles por fecha, servicio y miembro del staff.",
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
  {
    method: "POST",
    path: "/api/public/[slug]/book",
    desc: "Crea una reservación pública con validación Zod, rate limiting y notificaciones.",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    method: "POST",
    path: "/api/webhooks",
    desc: "Recibe eventos de VAPI (end-of-call, tool-calls) y WhatsApp Meta (HMAC verificado).",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
];

const features = [
  { icon: Key, title: "Autenticación JWT", desc: "Endpoints protegidos usan Supabase Auth con JWT en header Authorization." },
  { icon: Webhook, title: "Webhooks", desc: "Recibe eventos en tiempo real de llamadas VAPI y mensajes WhatsApp con verificación HMAC." },
  { icon: Zap, title: "Rate Limiting", desc: "5 req/hora/IP para endpoints públicos vía Upstash Redis distribuido." },
  { icon: Terminal, title: "Respuestas JSON", desc: "Todas las respuestas siguen el formato { data, error, meta } con HTTP status codes estándar." },
];

export default function DocsPage() {
  return (
    <article className="max-w-none">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
          <Code2 className="w-3.5 h-3.5" />
          Documentación técnica
        </div>
        <h1 className="text-3xl font-black text-white mb-3 tracking-tight">API Docs</h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
          Sky Reservation AI expone una API REST sobre Next.js App Router. Los endpoints públicos
          permiten booking sin autenticación; los protegidos requieren JWT de Supabase Auth.
        </p>
      </div>

      {/* Base URL */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mb-8">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Base URL</p>
        <code className="text-sm text-indigo-300 font-mono">https://tu-dominio.vercel.app</code>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {features.map((f) => (
          <div key={f.title} className="flex items-start gap-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <f.icon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Endpoints */}
      <div className="mb-10">
        <h2 className="text-base font-bold text-white mb-4">Endpoints principales</h2>
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <div key={ep.path} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex items-start gap-4">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border flex-shrink-0 mt-0.5 ${ep.color}`}>
                {ep.method}
              </span>
              <div className="min-w-0">
                <code className="text-sm text-zinc-200 font-mono break-all">{ep.path}</code>
                <p className="text-xs text-zinc-500 mt-1">{ep.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example */}
      <div className="mb-10">
        <h2 className="text-base font-bold text-white mb-4">Ejemplo de request</h2>
        <div className="bg-zinc-950/80 border border-white/[0.07] rounded-2xl p-5 overflow-x-auto">
          <pre className="text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre">{`# Obtener slots disponibles
curl "https://tu-dominio.vercel.app/api/public/mi-negocio/availability\\
  ?date=2026-06-15\\
  &serviceId=uuid-del-servicio"

# Respuesta
{
  "data": {
    "slots": ["09:00", "10:00", "11:30", "15:00"],
    "date": "2026-06-15",
    "timezone": "America/Mexico_City"
  }
}`}</pre>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/8 border border-indigo-500/20 rounded-2xl p-6 text-center">
        <p className="text-sm font-semibold text-white mb-1">¿Necesitas integración personalizada?</p>
        <p className="text-xs text-zinc-500 mb-4">Nuestro equipo técnico puede ayudarte a conectar Sky AI con tu stack existente.</p>
        <a
          href="mailto:api@skyreservation.ai"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20"
        >
          Contactar equipo API
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* Back */}
      <div className="mt-8 pt-6 border-t border-white/[0.05]">
        <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">
          ← Volver al inicio
        </Link>
      </div>
    </article>
  );
}
