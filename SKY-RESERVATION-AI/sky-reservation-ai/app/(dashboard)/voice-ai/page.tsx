"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Clock,
  TrendingUp,
  Plus,
  X,
  Mic,
  Loader2,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { formatRelative, formatDate } from "@/lib/utils/format";

// ============================================================
// TYPES
// ============================================================

interface VoiceCall {
  id: string;
  status: string;
  created_at: string;
  duration_seconds: number | null;
  summary: string | null;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  metadata: {
    customer_phone?: string;
    ended_reason?: string;
    transcript?: string;
  };
  customer?: { name: string; phone: string | null } | null;
}

interface VapiAssistant {
  id: string;
  name: string;
  createdAt: string;
}

// ============================================================
// ANIMATIONS
// ============================================================

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20 } },
};

// ============================================================
// CREATE ASSISTANT FORM
// ============================================================

function CreateAssistantModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    services: "",
    hours: "",
    voice: "female" as "female" | "male",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vapi/assistants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error creating assistant");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-zinc-950/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-bold text-white">Crear Asistente de Voz</h2>
            <p className="text-xs text-gray-500 mt-0.5">Configura tu recepcionista AI</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-2 block">
                Nombre del Asistente
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Sofía — Recepcionista"
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-2 block">
                Nombre del Negocio
              </label>
              <input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                required
                placeholder="Salón Elegance"
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">
              Servicios (uno por línea)
            </label>
            <textarea
              value={form.services}
              onChange={(e) => setForm({ ...form, services: e.target.value })}
              rows={3}
              placeholder={"Corte de cabello — $25\nTinte completo — $80\nBarba — $20"}
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">
              Horarios de Atención
            </label>
            <input
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              placeholder="Lun-Vie: 9am-7pm, Sáb: 10am-5pm"
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">
              Voz del Asistente
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["female", "male"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm({ ...form, voice: v })}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${
                    form.voice === v
                      ? "bg-[#00E5FF]/15 border-[#00E5FF]/30 text-[#00E5FF]/80"
                      : "bg-white/[0.04] border-white/[0.07] text-gray-400 hover:border-white/20"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  {v === "female" ? "Voz Femenina" : "Voz Masculina"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-gray-400 text-sm font-medium py-2.5 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 disabled:opacity-50 text-black text-sm font-medium py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-[#00E5FF]/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Crear Asistente
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function VoiceAIPage() {
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [assistants, setAssistants] = useState<VapiAssistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [callsRes, assistantsRes] = await Promise.all([
        fetch("/api/vapi/calls", { signal }),
        fetch("/api/vapi/assistants", { signal }),
      ]);
      if (signal?.aborted) return;
      const callsData = await callsRes.json() as { data?: VoiceCall[] };
      const assistantsData = await assistantsRes.json() as { data?: VapiAssistant[] };
      setCalls(callsData.data ?? []);
      setAssistants(assistantsData.data ?? []);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Voice AI fetch error:", err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const { totalCalls, answeredCalls, avgDuration } = useMemo(() => {
    const withDuration = calls.filter((c) => c.duration_seconds);
    return {
      totalCalls: calls.length,
      answeredCalls: calls.filter(
        (c) => c.status === "resolved" || c.status === "active" || c.duration_seconds
      ).length,
      avgDuration: withDuration.length > 0
        ? Math.round(
            withDuration.reduce((s, c) => s + (c.duration_seconds ?? 0), 0) / withDuration.length
          )
        : 0,
    };
  }, [calls]);

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6 max-w-[1400px]"
      >
        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Voice AI</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Recepcionista virtual inteligente 24/7
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 text-black text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-[#00E5FF]/20"
          >
            <Plus className="w-4 h-4" />
            Crear Asistente
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Llamadas",
              value: totalCalls,
              icon: Phone,
              color: "text-[#00E5FF]",
              bg: "bg-[#00E5FF]/10 border-[#00E5FF]/20",
            },
            {
              label: "Atendidas",
              value: answeredCalls,
              icon: PhoneCall,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20",
            },
            {
              label: "Duración Prom.",
              value: avgDuration > 0 ? `${avgDuration}s` : "—",
              icon: Clock,
              color: "text-purple-400",
              bg: "bg-purple-500/10 border-purple-500/20",
            },
            {
              label: "Asistentes Activos",
              value: assistants.length,
              icon: TrendingUp,
              color: "text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20",
            },
          ].map((stat) => (
            <div key={stat.label} className={`relative overflow-hidden bg-white/[0.03] backdrop-blur-xl border ${stat.bg} rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(0,229,255,0.1)]`}>
              {/* Watermark icon */}
              <div className={`absolute -bottom-2 -right-2 ${stat.color} opacity-[0.05] pointer-events-none`}>
                <stat.icon className="w-20 h-20" />
              </div>
              <div className={`w-10 h-10 rounded-2xl ${stat.bg} border flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-white tracking-tight">{loading ? "—" : stat.value}</p>
              <p className="text-xs text-zinc-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Assistants */}
        {assistants.length > 0 && (
          <motion.div variants={item}>
            <h2 className="text-sm font-semibold text-gray-400 mb-3">
              Asistentes Configurados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {assistants.map((assistant) => (
                <div
                  key={assistant.id}
                  className="glass-card p-4 border border-[#00E5FF]/10 hover:border-[#00E5FF]/20 flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00E5FF]/15 to-[#7000FF]/15 border border-[#00E5FF]/20 flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5 text-[#00E5FF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{assistant.name}</p>
                    <p className="text-xs text-zinc-500">
                      Creado {formatRelative(assistant.createdAt)}
                    </p>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      Activo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Calls Table */}
        <motion.div variants={item} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <h2 className="text-sm font-semibold text-white">Historial de Llamadas</h2>
            <Settings className="w-4 h-4 text-gray-500" />
          </div>

          {loading ? (
            <div className="py-20 flex items-center justify-center gap-3 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Cargando llamadas...
            </div>
          ) : calls.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center max-w-sm mx-auto gap-4">
              {/* Voice AI simulator widget */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center">
                    <Phone className="w-9 h-9 text-[#00E5FF]" />
                  </div>
                  <div className="absolute inset-0 rounded-full border border-[#00E5FF]/20 animate-ping opacity-20" />
                  <div
                    className="absolute rounded-full border border-[#00E5FF]/10 animate-ping opacity-10"
                    style={{ inset: "-8px", animationDuration: "2s", animationDelay: "0.6s" }}
                  />
                </div>
                {/* Animated waveform bars */}
                <div className="flex items-center justify-center gap-[3px]" style={{ height: 28 }}>
                  {[4, 8, 14, 10, 20, 14, 9, 16, 11, 7, 13, 8, 4].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-[3px] rounded-full bg-[#00E5FF]/55"
                      animate={{ scaleY: [0.35, 1, 0.35] }}
                      transition={{
                        duration: 1.1 + (i % 4) * 0.25,
                        repeat: Infinity,
                        delay: i * 0.07,
                        ease: "easeInOut",
                      }}
                      style={{ height: h }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">Tu recepcionista IA está lista</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Haz una llamada de prueba y escucha cómo atenderá a tus clientes las 24 horas del día.
                </p>
              </div>
              <ul className="text-left text-sm text-zinc-400 space-y-2.5 w-full">
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Agenda y cancela citas automáticamente
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Responde preguntas frecuentes
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Confirma disponibilidad en tiempo real
                </li>
              </ul>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 flex items-center gap-2 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 text-black text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-[#00E5FF]/20"
              >
                <Plus className="w-4 h-4" />
                Crear asistente de voz
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Cliente", "Fecha", "Duración", "Estado", "Resumen", ""].map(
                      (col) => (
                        <th
                          key={col}
                          className="text-left text-xs font-medium text-gray-500 px-5 py-4"
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call, i) => (
                    <>
                      <motion.tr
                        key={`call-${call.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() =>
                          setExpandedCall(expandedCall === call.id ? null : call.id)
                        }
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center">
                              <PhoneCall className="w-3.5 h-3.5 text-[#00E5FF]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {call.customer?.name ?? call.metadata?.customer_phone ?? "Desconocido"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {call.metadata?.customer_phone ?? "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400">
                          {formatDate(call.created_at, "dd MMM, HH:mm")}
                        </td>
                        <td className="px-5 py-4">
                          {call.duration_seconds ? (
                            <span className="text-sm text-gray-300">
                              {Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s
                            </span>
                          ) : (
                            <span className="text-sm text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                              call.status === "resolved" || call.status === "active"
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : "bg-gray-500/10 border-gray-500/20 text-gray-400"
                            }`}
                          >
                            {call.status === "resolved" || call.status === "active" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            {call.status === "resolved"
                              ? "Completada"
                              : call.status === "active"
                              ? "Activa"
                              : "Pendiente"}
                          </span>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <p className="text-sm text-gray-400 truncate">
                            {call.summary ?? "Sin resumen disponible"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <button className="text-xs text-gray-500 hover:text-[#00E5FF] flex items-center gap-1 transition-colors">
                            <FileText className="w-3.5 h-3.5" />
                            Transcript
                          </button>
                        </td>
                      </motion.tr>

                      {/* Transcript panel */}
                      <AnimatePresence>
                        {expandedCall === call.id &&
                          (call.metadata?.transcript || call.messages?.length > 0) && (
                            <tr key={`transcript-${call.id}`}>
                              <td
                                colSpan={6}
                                className="bg-white/[0.02] px-5 py-4 border-b border-white/[0.04]"
                              >
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  <p className="text-xs font-medium text-gray-500 mb-2">
                                    Transcripción
                                  </p>
                                  {call.metadata?.transcript ? (
                                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                      {call.metadata.transcript}
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {call.messages.map((msg, j) => (
                                        <div
                                          key={j}
                                          className={`text-xs px-3 py-2 rounded-lg max-w-lg ${
                                            msg.role === "user"
                                              ? "bg-white/[0.04] text-gray-300 ml-0"
                                              : "bg-[#00E5FF]/10 text-[#00E5FF]/80 ml-8"
                                          }`}
                                        >
                                          <span className="font-medium">
                                            {msg.role === "user" ? "Cliente" : "Asistente"}:
                                          </span>{" "}
                                          {msg.content}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              </td>
                            </tr>
                          )}
                      </AnimatePresence>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Create Assistant Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateAssistantModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={fetchData}
          />
        )}
      </AnimatePresence>
    </>
  );
}
