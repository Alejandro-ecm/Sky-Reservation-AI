"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Phone, MessageSquare, Calendar, Users, BarChart3, Building2,
  Star, ChevronDown, Check, ArrowRight, Zap, Shield, Globe,
  Menu, X, Sparkles, TrendingUp, Clock, Bot, Play, ChevronRight,
  DollarSign, HeartHandshake, Infinity as InfinityIcon, Lock, Cpu, Rocket,
} from "lucide-react";

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-black/85 backdrop-blur-2xl border-b border-white/[0.06]" : ""}`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#7000FF] flex items-center justify-center shadow-lg shadow-[#00E5FF]/20">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-lg">
            <span className="bg-gradient-to-r from-[#00E5FF] to-[#7000FF] bg-clip-text text-transparent">Sky</span>
            <span className="text-white"> AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[["Características", "#features"], ["Precios", "#pricing"], ["FAQ", "#faq"]].map(([label, href]) => (
            <a key={label} href={href} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
            Iniciar sesión
          </Link>
          <Link href="/register" className="text-sm font-semibold bg-white text-black hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors">
            Empezar gratis
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-gray-400 hover:text-white">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 border-t border-white/10 px-6 py-4 flex flex-col gap-4"
          >
            {[["Características", "#features"], ["Precios", "#pricing"], ["FAQ", "#faq"]].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setOpen(false)} className="text-sm text-gray-300">{label}</a>
            ))}
            <Link href="/register" className="mt-2 text-center bg-white text-black text-sm font-semibold py-3 rounded-xl">
              Empezar gratis
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      setCount(Math.floor(current));
      if (current >= target) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

const WAVE = [4,7,12,20,30,22,14,9,18,36,28,18,11,32,44,32,20,13,28,42,28,18,9,22,34,22,13,9,18,28,18,9,5];

function AICard() {
  return (
    <div className="relative">
      {/* Multi-layer glow halo */}
      <div className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.4) 0%, rgba(124,58,237,0.2) 50%, transparent 80%)" }} />
      <div className="absolute -inset-1 rounded-2xl pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(124,58,237,0.08), transparent 60%)", borderRadius: 20 }} />

      {/* Card */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
          border: "1px solid rgba(255,255,255,0.09)",
          backdropFilter: "blur(32px)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04) inset",
        }}>

        {/* ── Status bar ── */}
        <div className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
          <div className="flex items-center gap-2.5">
            <div className="relative w-2 h-2">
              <span className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
              <span className="relative block w-2 h-2 bg-red-500 rounded-full"
                style={{ boxShadow: "0 0 8px rgba(239,68,68,0.9)" }} />
            </div>
            <span className="text-[9px] font-bold tracking-[0.22em] text-white/40 uppercase">En vivo</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <Bot className="w-3 h-3 text-[#00E5FF]" />
              </div>
              <span className="text-[10px] font-medium text-zinc-500">Sofía AI</span>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-zinc-700">02:47</span>
          </div>
        </div>

        {/* ── Waveform hero ── */}
        <div className="px-5 pt-5 pb-2">
          <div className="flex items-center justify-center gap-[2.5px]" style={{ height: 56 }}>
            {WAVE.map((h, i) => (
              <motion.div
                key={i}
                className="rounded-full flex-shrink-0"
                style={{
                  width: 2.5,
                  background: `linear-gradient(to top, rgba(99,102,241,${0.18 + (h/44)*0.65}), rgba(167,139,250,${0.12 + (h/44)*0.5}))`,
                }}
                animate={{ scaleY: [0.25, 1, 0.25] }}
                transition={{
                  duration: 0.75 + (i % 7) * 0.11,
                  repeat: Infinity,
                  delay: i * 0.045,
                  ease: "easeInOut",
                }}
                initial={{ height: h }}
              />
            ))}
          </div>
          <p className="text-center text-[8.5px] text-zinc-800 mt-2 tracking-[0.18em] uppercase font-medium">
            Procesando audio · Latencia 180ms
          </p>
        </div>

        {/* ── Conversation ── */}
        <div className="px-5 py-3 space-y-2">
          <AIMessage role="user" text="Quiero agendar para mañana" />
          <AIMessage role="ai"   text="Disponible martes 3pm o miércoles 11am" />
          <AIMessage role="user" text="El martes a las 3pm" />
          <AIMessage role="ai"   text="Perfecto, agendando tu cita…" highlight />
        </div>

        {/* ── Booking confirmed ── */}
        <div className="mx-4 mb-4 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.14)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(52,211,153,0.12)" }}>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-emerald-400 leading-none mb-0.5">Cita confirmada</p>
            <p className="text-[9.5px] text-zinc-600 truncate">Martes · 3:00 PM · Corte de cabello</p>
          </div>
          <span className="text-[8px] text-emerald-500/50 font-bold tracking-wider flex-shrink-0">NUEVO</span>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 divide-x"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.05)" }}>
          {[["47", "Llamadas"], ["23", "Citas hoy"], ["68%", "Conversión"]].map(([v, l]) => (
            <div key={l} className="py-3.5 text-center">
              <p className="text-[15px] font-bold tracking-tight text-white">{v}</p>
              <p className="text-[8.5px] text-zinc-700 uppercase tracking-[0.13em] mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIMessage({ role, text, highlight }: { role: "user" | "ai"; text: string; highlight?: boolean }) {
  const isAI = role === "ai";
  return (
    <div className={`flex items-start gap-2 ${isAI ? "" : "flex-row-reverse"}`}>
      <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[7px] font-bold mt-0.5 ${
        isAI ? "bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/20" : "bg-zinc-800/80 text-zinc-500 border border-white/[0.06]"
      }`}>
        {isAI ? "AI" : "C"}
      </div>
      <p className={`text-[11px] leading-relaxed max-w-[82%] ${
        highlight ? "text-emerald-300 font-medium" : isAI ? "text-zinc-200" : "text-zinc-500"
      }`}>
        {text}
      </p>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* ── Background ── */}
      <div className="absolute inset-0" style={{ background: "#020205" }} />

      {/* Layered gradient mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[65%] h-[75%] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(79,70,229,0.13) 0%, transparent 65%)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[65%] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.09) 0%, transparent 70%)" }} />
        <div className="absolute top-[50%] right-[30%] w-[25%] h-[30%] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />
      </div>

      {/* Subtle dot grid */}
      <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative max-w-6xl mx-auto px-6 py-28 flex flex-col lg:flex-row items-center gap-20">

        {/* ── LEFT ── */}
        <div className="flex-1 text-center lg:text-left">

          {/* Badge — gradient border */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}
            className="inline-flex items-center gap-2 text-[11px] font-semibold mb-8 px-3.5 py-2 rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.07))",
              border: "1px solid rgba(99,102,241,0.22)",
              color: "rgba(165,180,252,0.85)",
            }}
          >
            <Sparkles className="w-3 h-3" />
            Plataforma #1 para automatización con IA en LATAM
          </motion.div>

          {/* Headline */}
          <div className="mb-7 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: [0.16,1,0.3,1] }}
            >
              <span className="block text-[56px] lg:text-[80px] font-black text-white leading-[0.95] tracking-[-0.04em]">
                Tu negocio
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.16, ease: [0.16,1,0.3,1] }}
            >
              <span
                className="block text-[56px] lg:text-[80px] font-black leading-[0.95] tracking-[-0.04em]"
                style={{
                  background: "linear-gradient(125deg, #818cf8 0%, #c084fc 45%, #a78bfa 70%, #818cf8 100%)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                atiende solo.
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.26, ease: [0.16,1,0.3,1] }}
              className="mt-3"
            >
              <span className="text-[22px] lg:text-[28px] font-bold text-white/20 tracking-[-0.02em]">
                24h · 7 días · Sin descanso.
              </span>
            </motion.div>
          </div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="text-[16px] lg:text-[17px] text-zinc-500 mb-10 max-w-md mx-auto lg:mx-0 leading-[1.7]"
          >
            IA que responde llamadas, agenda citas y convierte clientes —
            <span className="text-zinc-300"> mientras tú duermes</span>. Sin contratar personal extra.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8"
          >
            {/* Primary — glowing */}
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center gap-2 text-[14px] font-bold text-white px-8 py-4 rounded-2xl overflow-hidden transition-all duration-300"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", boxShadow: "0 0 0 0 rgba(99,102,241,0)" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 40px rgba(99,102,241,0.5), 0 8px 32px rgba(99,102,241,0.3)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 0 0 rgba(99,102,241,0)")}
            >
              <span>Prueba gratis 14 días</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>

            {/* Secondary — ghost */}
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 text-[14px] font-medium text-zinc-400 hover:text-white px-8 py-4 rounded-2xl transition-all duration-300"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.16)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Play className="w-3.5 h-3.5" />
              Ver demo
            </a>
          </motion.div>

          {/* Trust line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="flex flex-wrap items-center gap-5 justify-center lg:justify-start"
          >
            {["Sin tarjeta de crédito", "Cancela cuando quieras", "Setup en 5 minutos"].map((t, i) => (
              <span key={t} className="flex items-center gap-1.5 text-[11px] text-zinc-700">
                {i > 0 && <span className="text-zinc-800">·</span>}
                {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, x: 50, rotateY: -8 }}
          animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 max-w-[340px] w-full mx-auto lg:mx-0"
          style={{ perspective: 1200 }}
        >
          <AICard />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: 10000, suffix: "+", label: "negocios activos" },
    { value: 50, suffix: "M+", label: "conversaciones IA" },
    { value: 99, suffix: ".9%", label: "uptime garantizado" },
    { value: 4, suffix: ".9★", label: "calificación promedio" },
  ];
  return (
    <section className="border-y border-white/[0.06] bg-white/[0.02]">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-black text-white mb-1">
              <AnimatedNumber target={s.value} suffix={s.suffix} />
            </p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────
const features = [
  { icon: Phone, title: "IA Recepcionista de Voz", desc: "Responde llamadas como un humano. Agenda, cancela y reagenda citas automáticamente en tiempo real.", color: "from-[#00E5FF] to-[#7000FF]", tag: "Voice AI" },
  { icon: MessageSquare, title: "WhatsApp Inteligente", desc: "Convierte cada mensaje en una reservación. Respuestas en segundos, disponible 24/7, nunca pierde un lead.", color: "from-emerald-500 to-emerald-600", tag: "WhatsApp" },
  { icon: Calendar, title: "Reservaciones Inteligentes", desc: "Calendario dinámico que detecta conflictos, gestiona disponibilidad y confirma citas automáticamente.", color: "from-purple-500 to-[#7000FF]", tag: "Scheduling" },
  { icon: Users, title: "CRM con Lead Scoring IA", desc: "Clasifica clientes automáticamente. Identifica quiénes van a comprar y cuándo necesitan seguimiento.", color: "from-orange-500 to-orange-600", tag: "CRM" },
  { icon: BarChart3, title: "Analytics en Tiempo Real", desc: "Métricas que importan: conversiones, horarios pico, ingresos y clientes recurrentes con insights IA.", color: "from-pink-500 to-pink-600", tag: "Analytics" },
  { icon: Zap, title: "Automatizaciones", desc: "Workflows inteligentes que siguen a tus clientes, recuperan perdidos y convierten sin intervención humana.", color: "from-yellow-500 to-yellow-600", tag: "Automation" },
];

function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px 0px 0px 0px", amount: 0 });

  return (
    <section id="features" className="py-28 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
            className="text-sm text-[#00E5FF] font-medium mb-3"
          >
            Todo lo que necesitas
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-5xl font-black text-white mb-4"
          >
            Un sistema operativo para tu negocio
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Todo lo que antes requería 3 empleados, ahora lo hace Sky AI solo.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08 + 0.2 }}
              className="group relative bg-[#0e0e0e] border border-white/[0.07] rounded-2xl p-6 hover:border-white/[0.15] transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at top left, rgba(79,70,229,0.05), transparent 60%)` }}
              />
              <span className="text-xs font-medium text-gray-600 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full mb-4 inline-block">{f.tag}</span>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: "01", title: "Crea tu cuenta en 5 minutos", desc: "Registra tu negocio, personaliza el nombre de tu IA y configura tus servicios y horarios." },
    { n: "02", title: "Tu IA aprende tu negocio", desc: "Entrena a Sofía con tus servicios, precios, respuestas frecuentes y personalidad de marca." },
    { n: "03", title: "Conecta tus canales", desc: "Activa tu número de teléfono y WhatsApp Business. Listo — tu IA empieza a atender clientes." },
    { n: "04", title: "Tú ves los resultados", desc: "Monitorea reservaciones, ingresos y satisfacción en tiempo real. Optimiza con insights IA." },
  ];
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px 0px 0px 0px", amount: 0 });

  return (
    <section className="py-28 px-6 bg-white/[0.01]" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            className="text-4xl font-black text-white mb-4"
          >
            Configurado y funcionando en{" "}
            <span className="bg-gradient-to-r from-[#00E5FF] to-[#7000FF] bg-clip-text text-transparent">menos de un día</span>
          </motion.h2>
        </div>
        <div className="space-y-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.12 }}
              className="flex gap-5 p-5 bg-[#0e0e0e] border border-white/[0.07] rounded-2xl hover:border-white/[0.12] transition-colors group"
            >
              <span className="text-3xl font-black text-white/10 group-hover:text-[#00E5FF]/25 transition-colors flex-shrink-0 w-12">{s.n}</span>
              <div>
                <h3 className="font-bold text-white mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── ROI Calculator Section ───────────────────────────────────────────────────
function ROISection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px 0px 0px 0px", amount: 0 });
  const comparisons = [
    { label: "Recepcionista humana", cost: "$1,800/mes", items: ["8 horas al día", "Solo habla un idioma", "Se enferma / falta", "Máximo 1 llamada a la vez"], bad: true },
    { label: "Sky Reservation AI", cost: "Desde $49/mes", items: ["24 horas, 7 días", "Español + Inglés", "Nunca falta, nunca descansa", "Miles de llamadas simultáneas"], bad: false },
  ];

  return (
    <section className="py-28 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-4xl font-black text-white mb-4">
            Ahorra hasta{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-[#00E5FF] bg-clip-text text-transparent">$1,750 al mes</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.2 }} className="text-gray-400">
            Compara el costo real de contratar vs automatizar
          </motion.p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {comparisons.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15 }}
              className={`p-6 rounded-2xl border ${c.bad ? "bg-[#0e0e0e] border-white/[0.07]" : "bg-gradient-to-br from-[#00E5FF]/[0.06] to-[#7000FF]/[0.06] border-[#00E5FF]/25"}`}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-white">{c.label}</h3>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${c.bad ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>{c.cost}</span>
              </div>
              <ul className="space-y-2.5">
                {c.items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    {c.bad ? <X className="w-4 h-4 text-red-400 flex-shrink-0" /> : <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                    <span className={c.bad ? "text-gray-500" : "text-gray-200"}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const plans = [
  {
    name: "Starter",
    price: "$49",
    desc: "Perfecto para empezar a automatizar",
    features: ["WhatsApp IA", "100 conversaciones/mes", "Reservaciones básicas", "Dashboard esencial", "Soporte por email"],
    cta: "Empezar gratis",
    href: "/register?plan=starter",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$149",
    desc: "El más popular para negocios en crecimiento",
    features: ["Todo lo de Starter", "Llamadas IA ilimitadas", "1,000 conversaciones/mes", "CRM inteligente", "Analytics avanzados", "Automatizaciones", "Soporte prioritario"],
    cta: "Empezar con Pro",
    href: "/register?plan=pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$399",
    desc: "Para negocios con múltiples sucursales",
    features: ["Todo lo de Pro", "Multi-sucursal ilimitada", "API acceso completo", "IA personalizada", "Integraciones avanzadas", "Gerente de cuenta", "SLA 99.9%"],
    cta: "Contactar ventas",
    href: "/register?plan=enterprise",
    highlight: false,
  },
];

function PricingSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px 0px 0px 0px", amount: 0 });

  return (
    <section id="pricing" className="py-28 px-6 bg-white/[0.01]" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-4xl font-black text-white mb-4">
            Precios simples. Sin sorpresas.
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.15 }} className="text-gray-400">
            14 días gratis en todos los planes. Sin tarjeta de crédito.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 border ${plan.highlight ? "bg-gradient-to-b from-[#00E5FF]/[0.06] to-[#7000FF]/[0.03] border-[#00E5FF]/30 shadow-2xl shadow-[#00E5FF]/10" : "bg-[#0e0e0e] border-white/[0.07]"}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] text-white text-xs font-bold px-4 py-1 rounded-full">
                  MÁS POPULAR
                </div>
              )}
              <h3 className="font-bold text-white text-lg mb-1">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="text-gray-500 text-sm">/mes</span>
              </div>
              <ul className="space-y-2.5 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block text-center text-sm font-semibold py-3 rounded-xl transition-all duration-300 ${plan.highlight ? "bg-gradient-to-r from-[#00E5FF] to-[#7000FF] text-black hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 shadow-lg shadow-[#00E5FF]/20" : "bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]"}`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────────────────────
const testimonials = [
  { name: "Carolina Mendoza", role: "Dueña · Spa Lumina", text: "Antes perdía el 40% de mis llamadas porque no podía contestar. Ahora Sky AI contesta todo y agenda sola. Mis reservaciones subieron un 60%.", rating: 5 },
  { name: "Dr. Andrés Pérez", role: "Director · Clínica Viva", text: "Lo que más me sorprendió es lo humana que suena la IA. Mis pacientes no saben que están hablando con un sistema automático.", rating: 5 },
  { name: "Valeria Torres", role: "CEO · FitZone Gym", text: "Automaticé los recordatorios y seguimientos. Reduje mis cancelaciones un 35% y ya no necesito una recepcionista dedicada para eso.", rating: 5 },
];

function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px 0px 0px 0px", amount: 0 });

  return (
    <section className="py-28 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-4xl font-black text-white mb-4">
            Negocios que ya automatizaron
          </motion.h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0e0e0e] border border-white/[0.07] rounded-2xl p-6 hover:border-white/[0.12] transition-colors"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-5">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const faqs = [
  { q: "¿Cuánto tiempo tarda el setup?", a: "Menos de 30 minutos. Registras tu negocio, configuras tus servicios y conectas tu número de teléfono y WhatsApp. La IA empieza a trabajar el mismo día." },
  { q: "¿La IA suena robótica?", a: "No. Usamos las voces más avanzadas disponibles con pausas naturales, entonación humana y respuestas conversacionales. La mayoría de clientes no se da cuenta que hablan con IA." },
  { q: "¿Qué pasa cuando la IA no sabe algo?", a: "La IA tiene un fallback inteligente: si no puede resolver algo, transfiere la llamada a un humano o programa un callback. Nunca deja a un cliente sin respuesta." },
  { q: "¿Funciona con mi sistema de reservaciones actual?", a: "Sky AI tiene su propio sistema de reservaciones integrado. Si necesitas integrar con otro sistema (como Google Calendar), lo podemos hacer via API." },
  { q: "¿Puedo cancelar cuando quiera?", a: "Sí. Sin contratos de permanencia. Cancelas en 2 clics desde tu panel de facturación." },
  { q: "¿Qué idiomas soporta?", a: "Español e inglés natively. La IA detecta automáticamente el idioma del cliente y responde en consecuencia." },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px 0px 0px 0px", amount: 0 });

  return (
    <section id="faq" className="py-28 px-6 bg-white/[0.01]" ref={ref}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-4xl font-black text-white mb-4">
            Preguntas frecuentes
          </motion.h2>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.05 }}
              className="bg-[#0e0e0e] border border-white/[0.07] rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-semibold text-white">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-4 ${open === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px 0px 0px 0px", amount: 0 });

  return (
    <section className="py-28 px-6" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          className="relative bg-gradient-to-br from-[#00E5FF]/[0.08] to-[#7000FF]/[0.06] border border-[#00E5FF]/20 rounded-3xl p-12 text-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#00E5FF]/[0.03] to-[#7000FF]/[0.03]" />
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#00E5FF]/10 rounded-full blur-3xl" />
          <div className="relative">
            <Rocket className="w-12 h-12 text-[#00E5FF] mx-auto mb-5" />
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              Tu negocio merece<br />trabajar las 24 horas.
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Únete a más de 10,000 negocios que ya automatizan con Sky AI.
              Pruébalo 14 días gratis, sin riesgos.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-black font-bold text-base px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-2xl"
            >
              Empezar gratis ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-gray-600 mt-4">Sin tarjeta · Sin contratos · Setup en 5 min</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const cols = [
    {
      title: "Producto",
      links: [
        { label: "Características", href: "#features" },
        { label: "Precios", href: "#pricing" },
        { label: "FAQ", href: "#faq" },
        { label: "Demo en vivo", href: "#features" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Política de Privacidad", href: "/privacy" },
        { label: "Términos de Servicio", href: "/terms" },
        { label: "API Docs", href: "/docs" },
      ],
    },
    {
      title: "Contacto",
      links: [
        { label: "hola@skyreservation.ai", href: "mailto:hola@skyreservation.ai" },
        { label: "soporte@skyreservation.ai", href: "mailto:soporte@skyreservation.ai" },
        { label: "api@skyreservation.ai", href: "mailto:api@skyreservation.ai" },
      ],
    },
  ];

  return (
    <footer className="border-t border-white/[0.05] pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-14">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#7000FF] flex items-center justify-center shadow-lg shadow-[#00E5FF]/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-base">
                Sky <span className="text-zinc-500">AI</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed mb-5 max-w-[210px]">
              Automatiza tu negocio con IA. Llamadas, WhatsApp y reservaciones 24/7.
            </p>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Sistema operativo</span>
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-5">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-500 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.05] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © 2026 Sky Technologies LATAM. Todos los derechos reservados.
          </p>
          <p className="text-xs text-zinc-700">
            Hecho en México · Tecnología con propósito
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="bg-[#030303] text-white min-h-screen">
      <Navbar />
      <Hero />
      <StatsBar />
      <FeaturesSection />
      <HowItWorks />
      <ROISection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
