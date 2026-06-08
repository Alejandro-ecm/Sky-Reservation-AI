"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const INDUSTRIES = [
  { label: "Salón de Belleza",  icon: "💆‍♀️", grad: "linear-gradient(135deg,#f43f5e,#be185d)" },
  { label: "Restaurante",        icon: "🍽️",  grad: "linear-gradient(135deg,#f59e0b,#c2410c)" },
  { label: "Spa & Wellness",     icon: "🧘‍♀️", grad: "linear-gradient(135deg,#10b981,#0f766e)" },
  { label: "Clínica Dental",     icon: "🦷",  grad: "linear-gradient(135deg,#0ea5e9,#1d4ed8)" },
  { label: "Gym & Fitness",      icon: "💪",  grad: "linear-gradient(135deg,#8b5cf6,#6d28d9)" },
  { label: "Hotel Boutique",     icon: "🏨",  grad: "linear-gradient(135deg,#64748b,#1e293b)" },
  { label: "Sky AI Voice",       icon: "🎙️",  grad: "linear-gradient(135deg,#00E5FF,#7000FF)" },
  { label: "Clínica Médica",     icon: "⚕️",  grad: "linear-gradient(135deg,#06b6d4,#0369a1)" },
  { label: "Centro de Yoga",     icon: "🧘",  grad: "linear-gradient(135deg,#d946ef,#9d174d)" },
  { label: "Arte & Tatuajes",    icon: "🎨",  grad: "linear-gradient(135deg,#6366f1,#4338ca)" },
  { label: "Estética Canina",    icon: "🐕",  grad: "linear-gradient(135deg,#eab308,#b45309)" },
  { label: "Centro Estético",    icon: "✨",  grad: "linear-gradient(135deg,#f472b6,#be123c)" },
  { label: "Veterinaria",        icon: "🐾",  grad: "linear-gradient(135deg,#22c55e,#15803d)" },
  { label: "Consultoría",        icon: "💼",  grad: "linear-gradient(135deg,#475569,#0f172a)" },
  { label: "Fisioterapia",       icon: "🏃‍♂️", grad: "linear-gradient(135deg,#14b8a6,#0369a1)" },
  { label: "Nutrición",          icon: "🥗",  grad: "linear-gradient(135deg,#84cc16,#15803d)" },
];

const CARDS = Array.from({ length: 40 }, (_, i) => INDUSTRIES[i % INDUSTRIES.length]);

export function AuthBackground({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isLogin    = path === "/login";
  const isRegister = path === "/register";

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col bg-black">

      {/* ── Card mosaic ─────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-2.5 p-2 md:p-2.5 auto-rows-[calc((100vh-20px)/4)]">
          {CARDS.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.018, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              className="rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2 px-2 py-3 relative"
              style={{ background: card.grad }}
            >
              {/* subtle inner shine */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-2xl" />
              <span className="text-3xl sm:text-4xl lg:text-5xl select-none relative z-10">
                {card.icon}
              </span>
              <span className="text-white/90 text-[8px] sm:text-[9px] lg:text-[10px] font-black text-center leading-tight uppercase tracking-wider relative z-10">
                {card.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Overlay ─────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-black/50" />
      {/* Radial: lighter in center so modal "emerges" from darkness */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 65% at 50% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.72) 100%)",
        }}
      />
      {/* Neural glow behind the modal center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 30% 35% at 50% 52%, rgba(0,229,255,0.05) 0%, transparent 70%)",
        }}
      />

      {/* ── Top nav ─────────────────────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#7000FF] flex items-center justify-center shadow-lg shadow-[#00E5FF]/30 group-hover:shadow-[#00E5FF]/50 transition-shadow">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="text-white font-bold text-lg">
            Sky{" "}
            <span className="bg-gradient-to-r from-[#00E5FF] to-[#7000FF] bg-clip-text text-transparent">
              AI
            </span>
          </span>
        </Link>

        {isLogin && (
          <Link
            href="/register"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            ¿No tienes cuenta?{" "}
            <span className="text-[#00E5FF] font-semibold">Regístrate</span>
          </Link>
        )}
        {isRegister && (
          <Link
            href="/login"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            ¿Ya tienes cuenta?{" "}
            <span className="text-[#00E5FF] font-semibold">Iniciar sesión</span>
          </Link>
        )}
      </header>

      {/* ── Modal slot ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </div>
    </div>
  );
}
