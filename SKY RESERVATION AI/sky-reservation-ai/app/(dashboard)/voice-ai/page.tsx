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
        className="relative w-full max-w-lg bg-[#111111] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
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
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40"
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
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40"
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
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40 resize-none"
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
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40"
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
                      ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
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
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-all"
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
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20"
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
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20",
            },
            {
              label: "Atendidas",
              value: answeredCalls,
              icon: PhoneCall,
              color: "text-green-400",
              bg: "bg-green-500/10 border-green-500/20",
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
              color: "text-yellow-400",
              bg: "bg-yellow-500/10 border-yellow-500/20",
            },
          ].map((stat) => (
            <div key={stat.label} className={`glass-card p-4 border ${stat.bg}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} border flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-black text-white">
                    {loading ? "—" : stat.value}
                  </p>
                </div>
              </div>
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
                  className="glass-card p-4 border border-blue-500/10 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{assistant.name}</p>
                    <p className="text-xs text-gray-500">
                      Creado {formatRelative(assistant.createdAt)}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="flex items-center gap-1 text-xs text-green-400">
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
        <motion.div variants={item} className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white">Historial de Llamadas</h2>
            <Settings className="w-4 h-4 text-gray-500" />
          </div>

          {loading ? (
            <div className="py-20 flex items-center justify-center gap-3 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Cargando llamadas...
            </div>
          ) : calls.length === 0 ? (
            <div className="py-20 text-center">
              <Phone className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                No hay llamadas registradas aún
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Las llamadas aparecerán aquí cuando el asistente las reciba
              </p>
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
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                              <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
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
                          <button className="text-xs text-gray-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
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
                                              : "bg-blue-500/10 text-blue-300 ml-8"
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
