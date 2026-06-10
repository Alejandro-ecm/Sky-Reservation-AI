"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  ChevronRight,
  Building2,
  Sparkles,
  Mic,
  Globe,
  Clock,
  ArrowRight,
  Star,
  Zap,
  Shield,
} from "lucide-react";

// ============================================================
// TYPES & SCHEMAS
// ============================================================

const businessSchema = z.object({
  businessName: z.string().min(2, "Nombre requerido (mínimo 2 caracteres)"),
  industry: z.string().min(1, "Selecciona una industria"),
  city: z.string().min(2, "Ciudad requerida"),
  phone: z.string().min(7, "Teléfono inválido"),
  businessEmail: z.string().email("Email inválido").optional().or(z.literal("")),
});

type BusinessForm = z.infer<typeof businessSchema>;

type PlanKey = "starter" | "pro" | "enterprise";

interface AIConfig {
  first_message: string;
  voice_type: "femenino" | "masculino";
  language: "español" | "english" | "español+english";
  business_hours_type: "weekdays" | "custom";
}

const INDUSTRIES = [
  "Restaurante",
  "Spa / Salón de Belleza",
  "Médico / Clínica",
  "Fitness / Gym",
  "Consultorio",
  "Hotel / Hospedaje",
  "Educación",
  "Otro",
];

const PLANS: Array<{
  key: PlanKey;
  name: string;
  price: string;
  badge?: string;
  features: string[];
  gradient: string;
}> = [
  {
    key: "starter",
    name: "Starter",
    price: "$49",
    gradient: "from-slate-600 to-slate-700",
    features: [
      "100 conversaciones/mes",
      "60 min de voz",
      "200 mensajes WhatsApp",
      "3 colaboradores",
      "1 sucursal",
      "IA GPT-4o mini",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$149",
    badge: "RECOMENDADO",
    gradient: "from-[#00E5FF] to-[#7000FF]",
    features: [
      "1,000 conversaciones/mes",
      "600 min de voz",
      "2,000 mensajes WhatsApp",
      "10 colaboradores",
      "3 sucursales",
      "Analytics avanzado",
      "Automatizaciones",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "$399",
    gradient: "from-amber-500 to-orange-600",
    features: [
      "Conversaciones ilimitadas",
      "Voz ilimitada",
      "WhatsApp ilimitado",
      "Staff ilimitado",
      "Sucursales ilimitadas",
      "IA GPT-4o",
      "API Access",
      "Soporte prioritario",
    ],
  },
];

// ============================================================
// STEP PROGRESS BAR
// ============================================================

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">Paso {step} de {total}</span>
        <span className="text-xs text-gray-500">
          {Math.round((step / total) * 100)}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#00E5FF] to-[#7000FF] rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${(step / total) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ============================================================
// STEP 1 — Welcome
// ============================================================

function StepWelcome({
  userName,
  onNext,
}: {
  userName: string;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      className="text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00E5FF] to-[#7000FF] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#00E5FF]/25">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-3">
        Bienvenido a Sky Reservation AI{userName ? `, ${userName}` : ""}!
      </h1>
      <p className="text-gray-400 mb-2 text-lg">
        Configura tu negocio en 4 pasos
      </p>
      <p className="text-gray-500 text-sm mb-10 max-w-md mx-auto">
        En menos de 5 minutos tendrás tu asistente de IA listo para atender
        reservas 24/7, responder WhatsApp y gestionar tu agenda automáticamente.
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-10">
        {[
          { icon: Building2, label: "Tu Negocio" },
          { icon: Sparkles, label: "Elige tu Plan" },
          { icon: Mic, label: "Configura IA" },
          { icon: Check, label: "¡Listo!" },
        ].map(({ icon: Icon, label }, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="w-7 h-7 rounded-lg bg-[#00E5FF]/15 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-[#00E5FF]" />
            </div>
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 text-black font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#00E5FF]/20 text-sm"
      >
        Empezar
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ============================================================
// STEP 2 — Business Info
// ============================================================

function StepBusiness({
  onNext,
  defaultValues,
}: {
  onNext: (data: BusinessForm) => void;
  defaultValues: Partial<BusinessForm>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusinessForm>({
    resolver: zodResolver(businessSchema),
    defaultValues,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/15 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-[#00E5FF]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Tu Negocio</h2>
          <p className="text-sm text-gray-500">Cuéntanos sobre tu empresa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Nombre del negocio *
          </label>
          <input
            {...register("businessName")}
            placeholder="Ej: Spa Magnolia, Clínica San Rafael..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-[#00E5FF]/30 transition-colors text-sm"
          />
          {errors.businessName && (
            <p className="mt-1 text-xs text-red-400">{errors.businessName.message}</p>
          )}
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Industria *
          </label>
          <select
            {...register("industry")}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-[#00E5FF]/30 transition-colors text-sm appearance-none"
          >
            <option value="" className="bg-gray-900">
              Selecciona tu industria...
            </option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind} className="bg-gray-900">
                {ind}
              </option>
            ))}
          </select>
          {errors.industry && (
            <p className="mt-1 text-xs text-red-400">{errors.industry.message}</p>
          )}
        </div>

        {/* City & Phone row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Ciudad *
            </label>
            <input
              {...register("city")}
              placeholder="Buenos Aires..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-[#00E5FF]/30 transition-colors text-sm"
            />
            {errors.city && (
              <p className="mt-1 text-xs text-red-400">{errors.city.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Teléfono *
            </label>
            <input
              {...register("phone")}
              placeholder="+54 11 1234-5678"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-[#00E5FF]/30 transition-colors text-sm"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Business Email */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Email del negocio
          </label>
          <input
            {...register("businessEmail")}
            type="email"
            placeholder="contacto@tunegocio.com"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-[#00E5FF]/30 transition-colors text-sm"
          />
          {errors.businessEmail && (
            <p className="mt-1 text-xs text-red-400">{errors.businessEmail.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 disabled:opacity-50 text-black font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#00E5FF]/20 text-sm mt-2"
        >
          Continuar
          <ChevronRight className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
}

// ============================================================
// STEP 3 — Choose Plan
// ============================================================

function StepPlan({
  selectedPlan,
  onSelect,
  onNext,
}: {
  selectedPlan: PlanKey | null;
  onSelect: (plan: PlanKey) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Star className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Elige tu Plan</h2>
          <p className="text-sm text-gray-500">14 días gratis en todos los planes</p>
        </div>
      </div>

      <div className="grid gap-3 mb-6">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.key;
          return (
            <button
              key={plan.key}
              onClick={() => onSelect(plan.key)}
              className={`relative w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? "border-blue-500/60 bg-[#00E5FF]/10 ring-1 ring-blue-500/30"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-[#00E5FF] to-[#7000FF] text-black rounded-full">
                  {plan.badge}
                </span>
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-sm font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}
                    >
                      {plan.name}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.features.slice(0, 4).map((f) => (
                      <span
                        key={f}
                        className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-md"
                      >
                        {f}
                      </span>
                    ))}
                    {plan.features.length > 4 && (
                      <span className="text-xs text-gray-600">
                        +{plan.features.length - 4} más
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-white">{plan.price}</p>
                  <p className="text-xs text-gray-500">/mes</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-600 text-center mb-4">
        Puedes cambiar de plan en cualquier momento. Sin permanencia.
      </p>

      <button
        onClick={onNext}
        disabled={!selectedPlan}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#00E5FF]/20 text-sm"
      >
        Continuar con {selectedPlan ? PLANS.find((p) => p.key === selectedPlan)?.name : "..."}
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ============================================================
// STEP 4 — AI Configuration
// ============================================================

function StepAI({
  config,
  onChange,
  onNext,
}: {
  config: AIConfig;
  onChange: (c: AIConfig) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
          <Mic className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Configura tu IA</h2>
          <p className="text-sm text-gray-500">Personaliza cómo responde tu asistente</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* First message */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Mensaje de bienvenida
          </label>
          <textarea
            value={config.first_message}
            onChange={(e) => onChange({ ...config, first_message: e.target.value })}
            rows={3}
            placeholder="Hola, soy tu asistente de Sky AI. ¿En qué te puedo ayudar hoy?"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-[#00E5FF]/30 transition-colors text-sm resize-none"
          />
        </div>

        {/* Voice type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tipo de voz
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["femenino", "masculino"] as const).map((v) => (
              <button
                key={v}
                onClick={() => onChange({ ...config, voice_type: v })}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-sm ${
                  config.voice_type === v
                    ? "border-blue-500/60 bg-[#00E5FF]/10 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span className="capitalize">{v}</span>
                {config.voice_type === v && (
                  <Check className="w-3.5 h-3.5 text-[#00E5FF] ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Idioma
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { key: "español", label: "Español" },
                { key: "english", label: "English" },
                { key: "español+english", label: "Bilingüe" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onChange({ ...config, language: key })}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-all text-xs ${
                  config.language === key
                    ? "border-blue-500/60 bg-[#00E5FF]/10 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Business hours type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Horario de atención
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { key: "weekdays", label: "Lun–Vie 9–18h" },
                { key: "custom", label: "Personalizado" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onChange({ ...config, business_hours_type: key })}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-sm ${
                  config.business_hours_type === key
                    ? "border-blue-500/60 bg-[#00E5FF]/10 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                <Clock className="w-4 h-4" />
                {label}
                {config.business_hours_type === key && (
                  <Check className="w-3.5 h-3.5 text-[#00E5FF] ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 py-3.5 mt-6 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 text-black font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#00E5FF]/20 text-sm"
      >
        Finalizar configuración
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ============================================================
// STEP 5 — Success
// ============================================================

function StepSuccess({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="text-center"
    >
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
      >
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
        >
          <Check className="w-12 h-12 text-white" />
        </motion.div>
      </motion.div>

      {/* Bouncing sparkles */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute top-12 right-12 opacity-30"
      >
        <Sparkles className="w-6 h-6 text-yellow-400" />
      </motion.div>

      <h1 className="text-3xl font-bold text-white mb-3">¡Tu cuenta está lista!</h1>
      <p className="text-gray-400 mb-2">
        Tu asistente de IA está configurado y listo para trabajar.
      </p>
      <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
        Tienes 14 días de prueba gratuita. Explora el dashboard, conecta WhatsApp
        y activa tu asistente de voz.
      </p>

      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8">
        {[
          { icon: Sparkles, label: "IA Activada", color: "text-[#00E5FF]", bg: "bg-[#00E5FF]/15" },
          { icon: Zap, label: "14 días gratis", color: "text-yellow-400", bg: "bg-yellow-500/20" },
          { icon: Shield, label: "Datos seguros", color: "text-green-400", bg: "bg-green-500/20" },
        ].map(({ icon: Icon, label, color, bg }) => (
          <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-1.5`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onGoToDashboard}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 text-black font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#00E5FF]/20 text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          Ir al Dashboard
        </button>
        <a
          href="/billing"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-medium rounded-xl transition-all duration-200 text-sm"
        >
          Configurar pago
        </a>
      </div>
    </motion.div>
  );
}

// ============================================================
// MAIN ONBOARDING PAGE
// ============================================================

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState("");
  const [businessData, setBusinessData] = useState<Partial<BusinessForm>>({});
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>("pro");
  const [aiConfig, setAIConfig] = useState<AIConfig>({
    first_message: "Hola, soy tu asistente de Sky AI. ¿En qué te puedo ayudar hoy?",
    voice_type: "femenino",
    language: "español",
    business_hours_type: "weekdays",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const TOTAL_STEPS = 4;

  async function handleComplete() {
    if (!selectedPlan) return;
    setIsSubmitting(true);

    try {
      const payload = {
        businessName: businessData.businessName ?? "",
        industry: businessData.industry ?? "",
        city: businessData.city ?? "",
        phone: businessData.phone ?? "",
        businessEmail: businessData.businessEmail,
        plan: selectedPlan,
        aiConfig,
      };

      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Onboarding complete failed:", await res.text());
      }
    } catch (err) {
      console.error("Onboarding submit error:", err);
    } finally {
      setIsSubmitting(false);
      setStep(5);
    }
  }

  const slideVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
      {/* Progress bar (steps 2-4) */}
      {step > 1 && step < 5 && (
        <ProgressBar step={step - 1} total={TOTAL_STEPS} />
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" {...slideVariants} transition={{ duration: 0.3 }}>
            <StepWelcome userName={userName} onNext={() => setStep(2)} />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" {...slideVariants} transition={{ duration: 0.3 }}>
            <StepBusiness
              defaultValues={businessData}
              onNext={(data) => {
                setBusinessData(data);
                setStep(3);
              }}
            />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" {...slideVariants} transition={{ duration: 0.3 }}>
            <StepPlan
              selectedPlan={selectedPlan}
              onSelect={setSelectedPlan}
              onNext={() => setStep(4)}
            />
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" {...slideVariants} transition={{ duration: 0.3 }}>
            <StepAI
              config={aiConfig}
              onChange={setAIConfig}
              onNext={handleComplete}
            />
            {isSubmitting && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-4 h-4 border-2 border-blue-500/50 border-t-blue-500 rounded-full animate-spin" />
                  Configurando tu cuenta...
                </div>
              </div>
            )}
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="step5" {...slideVariants} transition={{ duration: 0.3 }}>
            <StepSuccess onGoToDashboard={() => router.push("/dashboard")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
