"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Phone, MessageSquare, Calendar, Users, BarChart3, Building2,
  Star, ChevronDown, Check, ArrowRight, Zap, Shield, Globe,
  Menu, X, Sparkles, TrendingUp, Clock, Bot, Play, ChevronRight,
  DollarSign, HeartHandshake, Infinity, Lock, Cpu, Rocket,
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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Sky</span>
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
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#030303]" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "60px 60px" }}
      />

      <div className="relative max-w-6xl mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-16">
        {/* Left */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Plataforma #1 para automatización con IA en LATAM
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-black text-white leading-[1.06] tracking-tight mb-6"
          >
            Tu negocio{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              atiende solo.
            </span>
            <br />
            24 horas.
            <br />
            <span className="text-gray-300">7 días.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-400 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed"
          >
            IA que responde llamadas, agenda citas y convierte clientes —
            mientras tú duermes. Sin contratar personal extra.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
          >
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-white text-black font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-gray-100 transition-colors shadow-2xl shadow-white/10">
              Prueba gratis 14 días
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="inline-flex items-center justify-center gap-2 text-sm text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3.5 rounded-xl transition-colors">
              <Play className="w-4 h-4" />
              Ver demo
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-gray-600 mt-4"
          >
            Sin tarjeta de crédito · Cancela cuando quieras · Setup en 5 minutos
          </motion.p>
        </div>

        {/* Right — Live AI Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="flex-1 max-w-sm w-full mx-auto"
        >
          <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Sofía — Sky AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <p className="text-xs text-emerald-400">En llamada ahora</p>
                </div>
              </div>
              <div className="ml-auto text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded-lg">02:47</div>
            </div>

            {/* Transcript */}
            <div className="space-y-3 mb-4">
              <ChatBubble align="left" text="Hola, quiero agendar una cita para corte de cabello" />
              <ChatBubble align="right" text="¡Hola! Con gusto te ayudo. Tenemos disponibilidad mañana martes a las 3pm o el miércoles a las 11am. ¿Cuál te funciona mejor?" />
              <ChatBubble align="left" text="El martes a las 3pm está perfecto" />
              <ChatBubble align="right" text="Perfecto. ¿Me das tu nombre completo para confirmar la cita?" />
            </div>

            {/* Waveform */}
            <div className="flex items-center gap-1 justify-center py-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-blue-500 rounded-full"
                  animate={{ height: [4, Math.random() * 20 + 4, 4] }}
                  transition={{ duration: 0.6 + Math.random() * 0.4, repeat: 9999, delay: i * 0.05 }}
                />
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[["Llamadas hoy", "47"], ["Citas agendadas", "23"], ["Conversión", "68%"]].map(([label, value]) => (
                <div key={label} className="text-center bg-white/[0.03] rounded-xl p-2 border border-white/[0.06]">
                  <p className="text-sm font-bold text-white">{value}</p>
                  <p className="text-xs text-gray-500 leading-tight mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ChatBubble({ align, text }: { align: "left" | "right"; text: string }) {
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
      <p className={`text-xs px-3 py-2 rounded-xl max-w-[85%] leading-relaxed ${align === "right" ? "bg-blue-600 text-white" : "bg-white/8 text-gray-300 border border-white/[0.06]"}`}>
        {text}
      </p>
    </div>
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
  { icon: Phone, title: "IA Recepcionista de Voz", desc: "Responde llamadas como un humano. Agenda, cancela y reagenda citas automáticamente en tiempo real.", color: "from-blue-500 to-blue-600", tag: "Voice AI" },
  { icon: MessageSquare, title: "WhatsApp Inteligente", desc: "Convierte cada mensaje en una reservación. Respuestas en segundos, disponible 24/7, nunca pierde un lead.", color: "from-emerald-500 to-emerald-600", tag: "WhatsApp" },
  { icon: Calendar, title: "Reservaciones Inteligentes", desc: "Calendario dinámico que detecta conflictos, gestiona disponibilidad y confirma citas automáticamente.", color: "from-purple-500 to-purple-600", tag: "Scheduling" },
  { icon: Users, title: "CRM con Lead Scoring IA", desc: "Clasifica clientes automáticamente. Identifica quiénes van a comprar y cuándo necesitan seguimiento.", color: "from-orange-500 to-orange-600", tag: "CRM" },
  { icon: BarChart3, title: "Analytics en Tiempo Real", desc: "Métricas que importan: conversiones, horarios pico, ingresos y clientes recurrentes con insights IA.", color: "from-pink-500 to-pink-600", tag: "Analytics" },
  { icon: Zap, title: "Automatizaciones", desc: "Workflows inteligentes que siguen a tus clientes, recuperan perdidos y convierten sin intervención humana.", color: "from-yellow-500 to-yellow-600", tag: "Automation" },
];

function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-28 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
            className="text-sm text-blue-400 font-medium mb-3"
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
                style={{ background: `radial-gradient(circle at top left, rgba(59,130,246,0.05), transparent 60%)` }}
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
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-28 px-6 bg-white/[0.01]" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            className="text-4xl font-black text-white mb-4"
          >
            Configurado y funcionando en{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">menos de un día</span>
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
              <span className="text-3xl font-black text-white/10 group-hover:text-blue-500/30 transition-colors flex-shrink-0 w-12">{s.n}</span>
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
  const inView = useInView(ref, { once: true, margin: "-100px" });
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
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">$1,750 al mes</span>
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
              className={`p-6 rounded-2xl border ${c.bad ? "bg-[#0e0e0e] border-white/[0.07]" : "bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-blue-500/30"}`}
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
  const inView = useInView(ref, { once: true, margin: "-100px" });

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
              className={`relative rounded-2xl p-6 border ${plan.highlight ? "bg-gradient-to-b from-blue-600/10 to-purple-600/5 border-blue-500/40 shadow-2xl shadow-blue-500/10" : "bg-[#0e0e0e] border-white/[0.07]"}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full">
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
                className={`block text-center text-sm font-semibold py-3 rounded-xl transition-colors ${plan.highlight ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"}`}
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
  const inView = useInView(ref, { once: true, margin: "-100px" });

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
  const inView = useInView(ref, { once: true, margin: "-100px" });

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
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-28 px-6" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          className="relative bg-gradient-to-br from-blue-600/15 to-purple-600/10 border border-blue-500/20 rounded-3xl p-12 text-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5" />
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <Rocket className="w-12 h-12 text-blue-400 mx-auto mb-5" />
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
  return (
    <footer className="border-t border-white/[0.06] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">Sky <span className="text-gray-500">Reservation AI</span></span>
          </div>
          <div className="flex items-center gap-8 text-sm text-gray-500">
            {["Privacidad", "Términos", "API Docs", "Contacto"].map((l) => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-xs text-gray-600">© 2026 Sky Technologies LATAM</p>
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
