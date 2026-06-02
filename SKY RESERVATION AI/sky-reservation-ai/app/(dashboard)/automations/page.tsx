"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus,
  X,
  ChevronDown,
  Loader2,
  Trash2,
  FlaskConical,
  Pencil,
  Calendar,
  Phone,
  Users,
  Clock,
  PhoneMissed,
  MessageSquare,
  Webhook,
  Mail,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { formatRelative } from "@/lib/utils/format";
import type {
  AutomationRule,
  WorkflowTrigger,
  AutomationAction,
  AutomationConfig,
} from "@/lib/n8n/types";

// ============================================================
// CONFIG MAPS
// ============================================================

const TRIGGER_OPTIONS: {
  value: WorkflowTrigger;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    value: "new_reservation",
    label: "Nueva Reservación",
    description: "Al crearse una nueva reserva",
    icon: Calendar,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    value: "no_show",
    label: "No-Show",
    description: "Cliente no asistió a su cita",
    icon: AlertCircle,
    color: "text-red-400 bg-red-500/10 border-red-500/20",
  },
  {
    value: "new_customer",
    label: "Nuevo Cliente",
    description: "Al registrarse un nuevo cliente",
    icon: Users,
    color: "text-green-400 bg-green-500/10 border-green-500/20",
  },
  {
    value: "follow_up_3day",
    label: "Seguimiento 3 días",
    description: "3 días después de la última visita",
    icon: Clock,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    value: "missed_call",
    label: "Llamada Perdida",
    description: "Cuando se pierde una llamada de voz",
    icon: PhoneMissed,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
];

const ACTION_OPTIONS: {
  value: AutomationAction;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "send_whatsapp",
    label: "Enviar WhatsApp",
    description: "Envía un mensaje por WhatsApp al cliente",
    icon: MessageSquare,
  },
  {
    value: "n8n_webhook",
    label: "Webhook n8n",
    description: "Dispara un workflow de n8n",
    icon: Webhook,
  },
  {
    value: "send_email",
    label: "Enviar Email",
    description: "Envía un correo electrónico",
    icon: Mail,
  },
];

function getTriggerOption(trigger: WorkflowTrigger) {
  return TRIGGER_OPTIONS.find((t) => t.value === trigger);
}

function getActionOption(action: AutomationAction) {
  return ACTION_OPTIONS.find((a) => a.value === action);
}

// ============================================================
// FORM TYPES
// ============================================================

interface RuleFormValues {
  name: string;
  trigger: WorkflowTrigger;
  action: AutomationAction;
  webhookUrl: string;
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
  enabled: boolean;
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 border ${color}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const form = useForm<RuleFormValues>({
    defaultValues: {
      name: "",
      trigger: "new_reservation",
      action: "n8n_webhook",
      webhookUrl: "",
      whatsappMessage:
        "Hola {customerName}, tu reservación para {service} el {date} ha sido confirmada.",
      emailSubject: "",
      emailBody: "",
      enabled: true,
    },
  });

  const watchAction = form.watch("action");

  const fetchRules = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch("/api/automations", { signal });
      if (signal?.aborted) return;
      const json = (await res.json()) as { data: AutomationRule[] };
      setRules(json.data ?? []);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Error al cargar las automatizaciones");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchRules(controller.signal);
    return () => controller.abort();
  }, [fetchRules]);

  function openCreateModal() {
    setEditingRule(null);
    form.reset();
    setModalOpen(true);
  }

  function openEditModal(rule: AutomationRule) {
    setEditingRule(rule);
    form.reset({
      name: rule.name,
      trigger: rule.trigger,
      action: rule.action,
      webhookUrl: (rule.config.webhookUrl as string) ?? "",
      whatsappMessage:
        (rule.config.message as string) ??
        "Hola {customerName}, tu reservación para {service} el {date} ha sido confirmada.",
      emailSubject: (rule.config.emailSubject as string) ?? "",
      emailBody: (rule.config.emailBody as string) ?? "",
      enabled: rule.enabled,
    });
    setModalOpen(true);
  }

  async function handleSave(values: RuleFormValues) {
    const config: AutomationConfig = {};
    if (values.action === "n8n_webhook") config.webhookUrl = values.webhookUrl;
    if (values.action === "send_whatsapp") config.message = values.whatsappMessage;
    if (values.action === "send_email") {
      config.emailSubject = values.emailSubject;
      config.emailBody = values.emailBody;
    }

    const payload = {
      name: values.name,
      trigger: values.trigger,
      action: values.action,
      config,
      enabled: values.enabled,
    };

    try {
      if (editingRule) {
        const res = await fetch(`/api/automations/${editingRule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Update failed");
        toast.success("Automatización actualizada");
      } else {
        const res = await fetch("/api/automations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Create failed");
        toast.success("Automatización creada");
      }
      setModalOpen(false);
      void fetchRules();
    } catch {
      toast.error("Error al guardar la automatización");
    }
  }

  async function handleToggle(rule: AutomationRule) {
    setSavingId(rule.id);
    // Optimistic update
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
    );
    try {
      const res = await fetch(`/api/automations/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      if (!res.ok) throw new Error("Toggle failed");
    } catch {
      // Revert
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: rule.enabled } : r))
      );
      toast.error("Error al actualizar el estado");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(ruleId: string) {
    setDeletingId(ruleId);
    try {
      const res = await fetch(`/api/automations/${ruleId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast.success("Automatización eliminada");
    } catch {
      toast.error("Error al eliminar la automatización");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTest(ruleId: string) {
    setTestingId(ruleId);
    try {
      const res = await fetch("/api/automations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (json.success) {
        toast.success("Prueba enviada correctamente");
      } else {
        toast.error(json.error ?? "Error al enviar prueba");
      }
    } catch {
      toast.error("Error al probar la automatización");
    } finally {
      setTestingId(null);
    }
  }

  const { activeRules, totalTriggers, triggeredToday } = useMemo(() => {
    const today = new Date().toDateString();
    return {
      activeRules: rules.filter((r) => r.enabled).length,
      totalTriggers: rules.reduce((s, r) => s + r.trigger_count, 0),
      triggeredToday: rules.filter(
        (r) => r.last_triggered_at && new Date(r.last_triggered_at).toDateString() === today
      ).length,
    };
  }, [rules]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-[1200px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Automatizaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configura workflows automáticos basados en eventos de tu negocio
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Nueva Regla
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Reglas Activas"
          value={activeRules}
          icon={CheckCircle2}
          color="text-green-400 bg-green-500/10 border-green-500/20"
        />
        <StatCard
          label="Disparadas Hoy"
          value={triggeredToday}
          icon={Zap}
          color="text-amber-400 bg-amber-500/10 border-amber-500/20"
        />
        <StatCard
          label="Total Disparos"
          value={totalTriggers}
          icon={Phone}
          color="text-blue-400 bg-blue-500/10 border-blue-500/20"
        />
      </div>

      {/* Rules list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="h-5 bg-white/[0.05] rounded w-48 mb-3" />
              <div className="h-3 bg-white/[0.03] rounded w-64" />
            </div>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-16 flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Sin automatizaciones</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Crea tu primera regla para automatizar flujos de trabajo cuando ocurran
            eventos en tu negocio.
          </p>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear primera regla
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, i) => {
            const triggerOpt = getTriggerOption(rule.trigger);
            const actionOpt = getActionOption(rule.action);
            const TriggerIcon = triggerOpt?.icon ?? Zap;
            const ActionIcon = actionOpt?.icon ?? Zap;

            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card p-5 transition-all ${
                  rule.enabled ? "" : "opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                      triggerOpt?.color ?? "text-gray-400 bg-white/[0.05] border-white/10"
                    }`}
                  >
                    <TriggerIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">{rule.name}</h3>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          triggerOpt?.color ?? "text-gray-400 bg-white/[0.05] border-white/10"
                        }`}
                      >
                        {triggerOpt?.label ?? rule.trigger}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border text-gray-400 bg-white/[0.05] border-white/10 flex items-center gap-1">
                        <ActionIcon className="w-3 h-3" />
                        {actionOpt?.label ?? rule.action}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      <span className="text-xs text-gray-500">
                        {rule.trigger_count} disparos totales
                      </span>
                      {rule.last_triggered_at && (
                        <span className="text-xs text-gray-500">
                          Último:{" "}
                          {formatRelative(rule.last_triggered_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => void handleToggle(rule)}
                      disabled={savingId === rule.id}
                      title={rule.enabled ? "Desactivar" : "Activar"}
                      className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {savingId === rule.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : rule.enabled ? (
                        <ToggleRight className="w-6 h-6 text-blue-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>

                    {/* Test */}
                    {rule.action === "n8n_webhook" && (
                      <button
                        onClick={() => void handleTest(rule.id)}
                        disabled={testingId === rule.id}
                        title="Probar"
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-amber-500/10 border border-white/[0.07] hover:border-amber-500/20 text-gray-400 hover:text-amber-400 transition-colors disabled:opacity-50"
                      >
                        {testingId === rule.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FlaskConical className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => openEditModal(rule)}
                      title="Editar"
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-blue-500/10 border border-white/[0.07] hover:border-blue-500/20 text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => void handleDelete(rule.id)}
                      disabled={deletingId === rule.id}
                      title="Eliminar"
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.07] hover:border-red-500/20 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {deletingId === rule.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-lg bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                  <h2 className="font-bold text-white">
                    {editingRule ? "Editar Automatización" : "Nueva Automatización"}
                  </h2>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form */}
                <form
                  onSubmit={form.handleSubmit(handleSave)}
                  className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
                >
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Nombre de la regla
                    </label>
                    <input
                      {...form.register("name", { required: true })}
                      placeholder="Ej: Confirmar nueva reservación"
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>

                  {/* Trigger */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Disparador (Trigger)
                    </label>
                    <div className="relative">
                      <select
                        {...form.register("trigger")}
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                      >
                        {TRIGGER_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label} — {t.description}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Action */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Acción
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {ACTION_OPTIONS.map((a) => {
                        const selected = form.watch("action") === a.value;
                        const Icon = a.icon;
                        return (
                          <button
                            key={a.value}
                            type="button"
                            onClick={() => form.setValue("action", a.value)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                              selected
                                ? "bg-blue-600/15 border-blue-500/40 text-blue-300"
                                : "bg-white/[0.03] border-white/[0.07] text-gray-400 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            {a.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic config */}
                  {watchAction === "n8n_webhook" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        URL del Webhook n8n
                      </label>
                      <input
                        {...form.register("webhookUrl", { required: true })}
                        placeholder="https://n8n.tudominio.com/webhook/..."
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors font-mono text-xs"
                      />
                    </div>
                  )}

                  {watchAction === "send_whatsapp" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Mensaje de WhatsApp
                      </label>
                      <textarea
                        {...form.register("whatsappMessage", { required: true })}
                        rows={4}
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                      />
                      <p className="text-[10px] text-gray-600 mt-1.5">
                        Variables disponibles:{" "}
                        <code className="text-gray-500">
                          {"{customerName}"} {"{service}"} {"{date}"} {"{time}"}
                        </code>
                      </p>
                    </div>
                  )}

                  {watchAction === "send_email" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Asunto del email
                        </label>
                        <input
                          {...form.register("emailSubject", { required: true })}
                          placeholder="Confirmación de tu reservación"
                          className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Cuerpo del email
                        </label>
                        <textarea
                          {...form.register("emailBody", { required: true })}
                          rows={5}
                          placeholder="Hola {customerName}, ..."
                          className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Enable toggle */}
                  <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-white">Activar al crear</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        La regla empezará a ejecutarse inmediatamente
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => form.setValue("enabled", !form.watch("enabled"))}
                      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
                        form.watch("enabled") ? "bg-blue-600" : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                          form.watch("enabled") ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="flex-1 py-2.5 text-sm text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                      {form.formState.isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      {editingRule ? "Guardar Cambios" : "Crear Regla"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
