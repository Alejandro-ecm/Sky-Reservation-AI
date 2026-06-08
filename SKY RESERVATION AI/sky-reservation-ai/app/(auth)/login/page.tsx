"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, Sparkles, Chrome } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STEP_VARIANTS = {
  enter:  { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0  },
  exit:   { opacity: 0, x: -24 },
};

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep]         = useState<"email" | "password">("email");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);

  /* ── Step 1: email continue ─────────────────────────────────────────────── */
  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Ingresa un correo electrónico válido");
      return;
    }
    setStep("password");
  }

  /* ── Step 2: sign in ────────────────────────────────────────────────────── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      const sb = createClient();
      const { error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(
          error.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos"
            : error.message
        );
        return;
      }
      toast.success("¡Bienvenido de vuelta!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Ocurrió un error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Google OAuth ───────────────────────────────────────────────────────── */
  async function handleGoogle() {
    setGLoading(true);
    try {
      const sb = createClient();
      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) toast.error("Error al conectar con Google");
    } catch {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setGLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full max-w-[420px]"
    >
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "rgba(6,6,8,0.92)",
          backdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,229,255,0.05)",
        }}
      >
        {/* Neural top accent line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#00E5FF]/60 to-transparent" />

        <div className="px-8 pt-8 pb-9">
          {/* ── Logo + title ──────────────────────────────────────────────── */}
          <div className="flex flex-col items-center mb-7">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "linear-gradient(135deg,#00E5FF,#7000FF)",
                boxShadow: "0 0 32px rgba(0,229,255,0.35)",
              }}
            >
              <Sparkles className="w-7 h-7 text-black" />
            </div>
            <h1 className="text-[21px] font-black text-white tracking-tight text-center">
              Inicia sesión o regístrate
            </h1>
            <p className="text-zinc-500 text-xs mt-1.5 text-center">
              {step === "email"
                ? "Ingresa tu correo para continuar"
                : "Ingresa tu contraseña para acceder"}
            </p>
          </div>

          {/* ── Steps ─────────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait" initial={false}>

            {/* ── STEP 1: email ─────────────────────────────────────────── */}
            {step === "email" && (
              <motion.form
                key="email"
                variants={STEP_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                onSubmit={handleContinue}
                className="space-y-3"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  autoFocus
                  autoComplete="email"
                  className="w-full text-sm text-white placeholder:text-zinc-600 bg-white/[0.04] border border-white/[0.12] hover:border-white/20 focus:border-[#00E5FF]/50 focus:bg-white/[0.06] rounded-xl px-4 py-3.5 outline-none transition-all duration-200"
                />

                <button
                  type="submit"
                  className="w-full text-black font-bold text-sm py-3.5 rounded-xl transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg,#00E5FF,#7000FF)",
                    boxShadow: "0 4px 20px rgba(0,229,255,0.25)",
                  }}
                >
                  Continuar
                </button>

                {/* divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/[0.07]" />
                  <span className="text-[11px] text-zinc-600 font-medium">o</span>
                  <div className="flex-1 h-px bg-white/[0.07]" />
                </div>

                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={gLoading}
                  className="w-full flex items-center justify-center gap-3 text-sm font-medium text-white/80 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] rounded-xl py-3 transition-all duration-200 disabled:opacity-50"
                >
                  {gLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                  ) : (
                    <Chrome className="w-4 h-4 text-[#00E5FF]" />
                  )}
                  Continuar con Google
                </button>
              </motion.form>
            )}

            {/* ── STEP 2: password ──────────────────────────────────────── */}
            {step === "password" && (
              <motion.form
                key="password"
                variants={STEP_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                onSubmit={handleLogin}
                className="space-y-3"
              >
                {/* Email chip — back button */}
                <button
                  type="button"
                  onClick={() => { setStep("email"); setPassword(""); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-300 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] rounded-xl transition-all group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#00E5FF] transition-colors flex-shrink-0" />
                  <span className="truncate">{email}</span>
                </button>

                {/* Password */}
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    autoFocus
                    autoComplete="current-password"
                    className="w-full text-sm text-white placeholder:text-zinc-600 bg-white/[0.04] border border-white/[0.12] hover:border-white/20 focus:border-[#00E5FF]/50 focus:bg-white/[0.06] rounded-xl px-4 py-3.5 pr-11 outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[#00E5FF] hover:text-[#00E5FF]/80 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-black font-bold text-sm py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg,#00E5FF,#7000FF)",
                    boxShadow: "0 4px 20px rgba(0,229,255,0.25)",
                  }}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    "Iniciar sesión"
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* ── Bottom note ───────────────────────────────────────────────── */}
          <p className="text-center text-[11px] text-zinc-700 mt-6 leading-relaxed">
            ¿Primera vez aquí?{" "}
            <Link
              href="/register"
              className="text-[#00E5FF] hover:text-[#00E5FF]/80 font-semibold transition-colors"
            >
              Crear cuenta gratis
            </Link>
          </p>
        </div>
      </div>

      {/* ── Legal note below modal ─────────────────────────────────────────── */}
      <p className="text-center text-[10px] text-zinc-700 mt-5 px-4 leading-relaxed">
        Al continuar, aceptas nuestros{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-400 transition-colors">
          Términos de Servicio
        </Link>{" "}
        y{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-400 transition-colors">
          Política de Privacidad
        </Link>
      </p>
    </motion.div>
  );
}
