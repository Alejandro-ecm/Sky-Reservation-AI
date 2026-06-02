"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Clock,
  Bot,
  Zap,
  Users,
  ChevronRight,
  Save,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  X,
  Globe,
  Mail,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";

// ============================================================
// TYPES
// ============================================================

interface DayHours {
  enabled: boolean;
  open: string;
  close: string;
}

interface WeeklySchedule {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface BusinessFormValues {
  name: string;
  industry: string;
  description: string;
  phone: string;
  email: string;
  website: string;
}

interface AIFormValues {
  model: "gpt-4o-mini" | "gpt-4o";
  language: "es" | "en";
  personality: "professional" | "friendly" | "formal";
  firstMessage: string;
  maxCallDurationMinutes: number;
  whatsappAutoReply: boolean;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: "owner" | "admin" | "staff" | "viewer";
  created_at: string;
  avatar_url: string | null;
}

interface TenantData {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: {
    industry?: string;
    description?: string;
    phone?: string;
    email?: string;
    website?: string;
    hours?: WeeklySchedule;
    ai?: AIFormValues;
    n8n_base_url?: string;
    n8n_webhooks?: Record<string, string>;
  };
}

// ============================================================
// CONSTANTS
// ============================================================

const DAY_KEYS: Array<keyof WeeklySchedule> = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS: Record<keyof WeeklySchedule, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

const TRIGGER_LABELS: Record<string, string> = {
  new_reservation: "Nueva Reservación",
  no_show: "No-Show",
  new_customer: "Nuevo Cliente",
  follow_up_3day: "Seguimiento 3 días",
  missed_call: "Llamada Perdida",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  admin: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  staff: "text-green-400 bg-green-500/10 border-green-500/20",
  viewer: "text-gray-400 bg-gray-500/10 border-gray-500/20",
};

const DEFAULT_SCHEDULE: WeeklySchedule = {
  monday: { enabled: true, open: "09:00", close: "18:00" },
  tuesday: { enabled: true, open: "09:00", close: "18:00" },
  wednesday: { enabled: true, open: "09:00", close: "18:00" },
  thursday: { enabled: true, open: "09:00", close: "18:00" },
  friday: { enabled: true, open: "09:00", close: "18:00" },
  saturday: { enabled: true, open: "10:00", close: "15:00" },
  sunday: { enabled: false, open: "10:00", close: "14:00" },
};

// ============================================================
// HELPERS
// ============================================================

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/[0.05] rounded-xl ${className ?? ""}`} />
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

const tabs = [
  { id: "business", label: "Perfil del Negocio", icon: Building2 },
  { id: "hours", label: "Horarios", icon: Clock },
  { id: "ai", label: "IA & Voz", icon: Bot },
  { id: "automations", label: "Automatizaciones", icon: Zap },
  { id: "team", label: "Equipo", icon: Users },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("business");
  const [loading, setLoading] = useState(true);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);
  const [n8nBaseUrl, setN8nBaseUrl] = useState("");
  const [n8nWebhooks, setN8nWebhooks] = useState<Record<string, string>>({});
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "staff" | "viewer">("staff");

  const businessForm = useForm<BusinessFormValues>();
  const aiForm = useForm<AIFormValues>({
    defaultValues: {
      model: "gpt-4o-mini",
      language: "es",
      personality: "professional",
      firstMessage: "¡Hola! Soy tu asistente de reservaciones. ¿En qué puedo ayudarte hoy?",
      maxCallDurationMinutes: 5,
      whatsappAutoReply: true,
    },
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const json = (await res.json()) as {
        data: { tenant: TenantData; team: TeamMember[] };
      };
      if (json.data) {
        const { tenant, team } = json.data;
        setTenantData(tenant);
        setTeamMembers(team);

        businessForm.reset({
          name: tenant.name,
          industry: tenant.settings?.industry ?? "",
          description: tenant.settings?.description ?? "",
          phone: tenant.settings?.phone ?? "",
          email: tenant.settings?.email ?? "",
          website: tenant.settings?.website ?? "",
        });

        if (tenant.settings?.hours) {
          setSchedule({ ...DEFAULT_SCHEDULE, ...tenant.settings.hours });
        }

        if (tenant.settings?.ai) {
          aiForm.reset(tenant.settings.ai);
        }

        if (tenant.settings?.n8n_base_url) {
          setN8nBaseUrl(tenant.settings.n8n_base_url);
        }

        if (tenant.settings?.n8n_webhooks) {
          setN8nWebhooks(tenant.settings.n8n_webhooks);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  }, [businessForm, aiForm]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  async function saveBusiness(values: BusinessFormValues) {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          settings: {
            ...tenantData?.settings,
            industry: values.industry,
            description: values.description,
            phone: values.phone,
            email: values.email,
            website: values.website,
          },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Perfil del negocio guardado");
    } catch {
      toast.error("Error al guardar");
    }
  }

  async function saveHours() {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: { ...tenantData?.settings, hours: schedule },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Horarios guardados");
    } catch {
      toast.error("Error al guardar horarios");
    }
  }

  async function saveAI(values: AIFormValues) {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: { ...tenantData?.settings, ai: values },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Configuración de IA guardada");
    } catch {
      toast.error("Error al guardar configuración de IA");
    }
  }

  async function saveAutomationsSettings() {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...tenantData?.settings,
            n8n_base_url: n8nBaseUrl,
            n8n_webhooks: n8nWebhooks,
          },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Configuración de automatizaciones guardada");
    } catch {
      toast.error("Error al guardar");
    }
  }

  function updateDayField(
    day: keyof WeeklySchedule,
    field: keyof DayHours,
    value: string | boolean
  ) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  const maxDuration = aiForm.watch("maxCallDurationMinutes");

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1200px]">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-4 gap-6">
          <Skeleton className="h-64" />
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-[1200px]"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Gestiona tu negocio, horarios, IA y equipo
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="glass-card p-3 h-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-5">
          {/* ===== TAB: Business ===== */}
          {activeTab === "business" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="glass-card p-6">
                <h2 className="font-bold text-white mb-1">Perfil del Negocio</h2>
                <p className="text-xs text-gray-500 mb-6">
                  Información principal de tu empresa
                </p>

                {/* Avatar / Logo placeholder */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
                    {tenantData ? getInitials(tenantData.name) : "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Logo del negocio</p>
                    <p className="text-xs text-gray-500 mt-0.5 mb-2">
                      PNG, JPG o SVG. Máximo 2MB.
                    </p>
                    <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                      Subir logo
                    </button>
                  </div>
                </div>

                <form onSubmit={businessForm.handleSubmit(saveBusiness)} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Nombre del Negocio
                      </label>
                      <input
                        {...businessForm.register("name", { required: true })}
                        placeholder="Mi Empresa"
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Slug (URL)
                      </label>
                      <input
                        value={tenantData?.slug ?? ""}
                        readOnly
                        className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Industria / Giro
                    </label>
                    <input
                      {...businessForm.register("industry")}
                      placeholder="Salud, Belleza, Restaurante, etc."
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Descripción
                    </label>
                    <textarea
                      {...businessForm.register("description")}
                      rows={3}
                      placeholder="Describe brevemente tu negocio..."
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Teléfono
                      </label>
                      <input
                        {...businessForm.register("phone")}
                        placeholder="+52 55 1234 5678"
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Email de contacto
                      </label>
                      <input
                        {...businessForm.register("email")}
                        type="email"
                        placeholder="hola@minegocio.com"
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Sitio web
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        {...businessForm.register("website")}
                        placeholder="https://minegocio.com"
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={businessForm.formState.isSubmitting}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                      {businessForm.formState.isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ===== TAB: Hours ===== */}
          {activeTab === "hours" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <h2 className="font-bold text-white mb-1">Horarios de Atención</h2>
              <p className="text-xs text-gray-500 mb-6">
                Configura los días y horas de apertura de tu negocio
              </p>

              <div className="space-y-2">
                {DAY_KEYS.map((day) => {
                  const d = schedule[day];
                  return (
                    <div
                      key={day}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        d.enabled
                          ? "bg-white/[0.03] border-white/[0.07]"
                          : "bg-white/[0.01] border-white/[0.03] opacity-50"
                      }`}
                    >
                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() => updateDayField(day, "enabled", !d.enabled)}
                        className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${
                          d.enabled ? "bg-blue-600" : "bg-white/10"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                            d.enabled ? "left-[22px]" : "left-0.5"
                          }`}
                        />
                      </button>

                      {/* Day name */}
                      <span className="text-sm font-medium text-white w-24 flex-shrink-0">
                        {DAY_LABELS[day]}
                      </span>

                      {d.enabled ? (
                        <>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={d.open}
                              onChange={(e) =>
                                updateDayField(day, "open", e.target.value)
                              }
                              className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                            <span className="text-gray-600 text-sm">—</span>
                            <input
                              type="time"
                              value={d.close}
                              onChange={(e) =>
                                updateDayField(day, "close", e.target.value)
                              }
                              className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-600 flex-1">Cerrado</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-4 bg-amber-500/[0.05] border border-amber-500/10 rounded-xl">
                <p className="text-xs text-amber-500/80">
                  Los horarios especiales (festivos) se configurarán próximamente.
                </p>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => void saveHours()}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                >
                  <Save className="w-4 h-4" />
                  Guardar Horarios
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== TAB: AI ===== */}
          {activeTab === "ai" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <form onSubmit={aiForm.handleSubmit(saveAI)} className="space-y-5">
                {/* Model & Language */}
                <div className="glass-card p-6">
                  <h2 className="font-bold text-white mb-1">Modelo de IA</h2>
                  <p className="text-xs text-gray-500 mb-5">
                    Configura el modelo y el idioma del asistente
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Modelo OpenAI
                      </label>
                      <Controller
                        name="model"
                        control={aiForm.control}
                        render={({ field }) => (
                          <div className="grid grid-cols-2 gap-2">
                            {(
                              [
                                {
                                  id: "gpt-4o-mini",
                                  label: "GPT-4o Mini",
                                  desc: "Rápido y económico",
                                },
                                {
                                  id: "gpt-4o",
                                  label: "GPT-4o",
                                  desc: "Más inteligente",
                                },
                              ] as { id: "gpt-4o-mini" | "gpt-4o"; label: string; desc: string }[]
                            ).map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => field.onChange(m.id)}
                                className={`flex flex-col items-start p-3 rounded-xl border text-xs transition-all ${
                                  field.value === m.id
                                    ? "bg-blue-600/15 border-blue-500/40 text-blue-300"
                                    : "bg-white/[0.03] border-white/[0.07] text-gray-400 hover:border-white/20"
                                }`}
                              >
                                <span className="font-semibold text-white">{m.label}</span>
                                <span className="text-gray-500 mt-0.5">{m.desc}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Idioma del asistente
                      </label>
                      <Controller
                        name="language"
                        control={aiForm.control}
                        render={({ field }) => (
                          <div className="grid grid-cols-2 gap-2">
                            {(
                              [
                                { id: "es", label: "Español" },
                                { id: "en", label: "English" },
                              ] as { id: "es" | "en"; label: string }[]
                            ).map((l) => (
                              <button
                                key={l.id}
                                type="button"
                                onClick={() => field.onChange(l.id)}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                                  field.value === l.id
                                    ? "bg-blue-600/15 border-blue-500/40 text-blue-300"
                                    : "bg-white/[0.03] border-white/[0.07] text-gray-400 hover:border-white/20"
                                }`}
                              >
                                {l.label}
                              </button>
                            ))}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Personality & First message */}
                <div className="glass-card p-6">
                  <h2 className="font-bold text-white mb-1">Personalidad del Asistente</h2>
                  <p className="text-xs text-gray-500 mb-5">
                    Cómo se comunica tu asistente de voz
                  </p>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Estilo de comunicación
                    </label>
                    <Controller
                      name="personality"
                      control={aiForm.control}
                      render={({ field }) => (
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              {
                                id: "professional",
                                label: "Profesional",
                                emoji: "💼",
                              },
                              { id: "friendly", label: "Amigable", emoji: "😊" },
                              { id: "formal", label: "Formal", emoji: "🎩" },
                            ] as {
                              id: "professional" | "friendly" | "formal";
                              label: string;
                              emoji: string;
                            }[]
                          ).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => field.onChange(p.id)}
                              className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${
                                field.value === p.id
                                  ? "bg-blue-600/15 border-blue-500/40 text-blue-300"
                                  : "bg-white/[0.03] border-white/[0.07] text-gray-400 hover:border-white/20"
                              }`}
                            >
                              <span className="text-lg">{p.emoji}</span>
                              {p.label}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Primer mensaje del asistente
                    </label>
                    <textarea
                      {...aiForm.register("firstMessage")}
                      rows={3}
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Call settings */}
                <div className="glass-card p-6">
                  <h2 className="font-bold text-white mb-1">Llamadas & WhatsApp</h2>
                  <p className="text-xs text-gray-500 mb-5">
                    Límites y comportamiento de los canales de IA
                  </p>

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Duración máxima de llamada:{" "}
                      <span className="text-blue-400 font-bold">{maxDuration} min</span>
                    </label>
                    <Controller
                      name="maxCallDurationMinutes"
                      control={aiForm.control}
                      render={({ field }) => (
                        <input
                          type="range"
                          min={1}
                          max={15}
                          step={1}
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          className="w-full accent-blue-500"
                        />
                      )}
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>1 min</span>
                      <span>15 min</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Respuesta automática WhatsApp
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        El asistente responde automáticamente a mensajes
                      </p>
                    </div>
                    <Controller
                      name="whatsappAutoReply"
                      control={aiForm.control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
                            field.value ? "bg-blue-600" : "bg-white/10"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                              field.value ? "left-[22px]" : "left-0.5"
                            }`}
                          />
                        </button>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={aiForm.formState.isSubmitting}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {aiForm.formState.isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar Configuración IA
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ===== TAB: Automations ===== */}
          {activeTab === "automations" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-white mb-1">n8n Integration</h2>
                    <p className="text-xs text-gray-500">
                      Conecta n8n para workflows avanzados
                    </p>
                  </div>
                  <a
                    href="https://n8n.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    n8n.io
                  </a>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    URL base de n8n
                  </label>
                  <input
                    value={n8nBaseUrl}
                    onChange={(e) => setN8nBaseUrl(e.target.value)}
                    placeholder="https://n8n.tudominio.com"
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors font-mono text-xs"
                  />
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="font-bold text-white mb-1">Webhooks por Trigger</h2>
                <p className="text-xs text-gray-500 mb-5">
                  Configura URLs de webhook para cada tipo de evento
                </p>

                <div className="space-y-3">
                  {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">
                        {label}
                      </label>
                      <input
                        value={n8nWebhooks[key] ?? ""}
                        onChange={(e) =>
                          setN8nWebhooks((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        placeholder={`https://n8n.tudominio.com/webhook/${key.replace("_", "-")}`}
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-5">
                  <a
                    href="/automations"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    Ver todas las reglas de automatización
                    <ChevronRight className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => void saveAutomationsSettings()}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                  >
                    <Save className="w-4 h-4" />
                    Guardar
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== TAB: Team ===== */}
          {activeTab === "team" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-white mb-1">Equipo</h2>
                  <p className="text-xs text-gray-500">
                    {teamMembers.length} miembro{teamMembers.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Invitar miembro
                </button>
              </div>

              {teamMembers.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                  <p className="text-sm">No hay miembros del equipo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.05] rounded-xl hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {getInitials(member.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{member.full_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Mail className="w-3 h-3 text-gray-600" />
                          <p className="text-xs text-gray-500 truncate">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${
                            ROLE_COLORS[member.role] ??
                            "text-gray-400 bg-gray-500/10 border-gray-500/20"
                          }`}
                        >
                          {member.role}
                        </span>
                        <p className="text-[10px] text-gray-600 hidden sm:block">
                          {new Date(member.created_at).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        {member.role !== "owner" && (
                          <button
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Eliminar del equipo"
                            onClick={() =>
                              toast.error("Esta funcionalidad estará disponible pronto")
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setInviteModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm bg-[#141414] border border-white/10 rounded-2xl shadow-2xl p-6 z-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Invitar Miembro</h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email del nuevo miembro
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Rol
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "admin", label: "Admin" },
                      { id: "staff", label: "Staff" },
                      { id: "viewer", label: "Viewer" },
                    ] as { id: "admin" | "staff" | "viewer"; label: string }[]
                  ).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setInviteRole(r.id)}
                      className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                        inviteRole === r.id
                          ? "bg-blue-600/15 border-blue-500/40 text-blue-300"
                          : "bg-white/[0.03] border-white/[0.07] text-gray-400"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setInviteModalOpen(false)}
                  className="flex-1 py-2.5 text-sm text-gray-400 bg-white/[0.04] border border-white/[0.07] rounded-xl hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    toast.success(
                      `Invitación enviada a ${inviteEmail} (${inviteRole}). Funcionalidad de invitaciones por email próximamente.`
                    );
                    setInviteModalOpen(false);
                    setInviteEmail("");
                  }}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl transition-all"
                >
                  Enviar Invitación
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
