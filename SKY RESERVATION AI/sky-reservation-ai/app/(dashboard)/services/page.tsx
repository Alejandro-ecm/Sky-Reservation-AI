"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  X,
  DollarSign,
  Clock,
  Loader2,
  ToggleLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import type { Service } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ServiceFormState {
  name: string;
  description: string;
  duration_minutes: number | "";
  price: number | "";
  active: boolean;
}

const EMPTY_FORM: ServiceFormState = {
  name: "",
  description: "",
  duration_minutes: "",
  price: "",
  active: true,
};

// ─── Constants ───────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatPrice(price: number): string {
  return `$${price.toLocaleString("es-AR")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [showInactive, setShowInactive] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchServices = useCallback(
    async (includeInactive: boolean) => {
      try {
        const url = includeInactive ? "/api/services?include_inactive=1" : "/api/services";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Error al cargar servicios");
        const json = (await res.json()) as { data: Service[] };
        setServices(json.data);
      } catch {
        toast.error("No se pudieron cargar los servicios");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchServices(showInactive);
  }, [fetchServices, showInactive]);

  function openCreateModal() {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEditModal(service: Service) {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description ?? "",
      duration_minutes: service.duration_minutes,
      price: service.price,
      active: service.active,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingService(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!form.duration_minutes || Number(form.duration_minutes) <= 0) {
      toast.error("La duración es requerida");
      return;
    }
    if (form.price === "" || Number(form.price) < 0) {
      toast.error("El precio es requerido");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      duration_minutes: Number(form.duration_minutes),
      price: Number(form.price),
      active: form.active,
    };

    try {
      let res: Response;
      if (editingService) {
        res = await fetch(`/api/services/${editingService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }

      toast.success(editingService ? "Servicio actualizado" : "Servicio creado");
      closeModal();
      await fetchServices(showInactive);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(service: Service, checked: boolean) {
    setTogglingId(service.id);
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: checked }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, active: checked } : s))
      );
      toast.success(checked ? "Servicio activado" : "Servicio desactivado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(service: Service) {
    setDeletingId(service.id);
    try {
      const res = await fetch(`/api/services/${service.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      toast.success("Servicio eliminado");
      if (!showInactive) {
        setServices((prev) => prev.filter((s) => s.id !== service.id));
      } else {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, active: false } : s))
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  const activeServices = services.filter((s) => s.active);
  const avgPrice = Math.round(average(activeServices.map((s) => s.price)));
  const avgDuration = Math.round(average(activeServices.map((s) => s.duration_minutes)));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">Servicios</h1>
            {!loading && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-xs text-white/60 font-medium">
                <span className="text-white">{activeServices.length}</span>
                <span>/</span>
                <span>{services.length}</span>
                <span>activos</span>
              </span>
            )}
          </div>
          <p className="text-sm text-white/40 mt-0.5">
            Catálogo de servicios reservables para tu negocio
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar Servicio
        </button>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-white/50">Total Servicios</p>
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Package className="h-4 w-4 text-violet-400" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-white">{services.length}</p>
          <p className="text-xs text-white/30 mt-1">{activeServices.length} activos</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-white/50">Precio Promedio</p>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-white">{formatPrice(avgPrice)}</p>
          <p className="text-xs text-white/30 mt-1">entre servicios activos</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-white/50">Duración Promedio</p>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-white">{formatDuration(avgDuration)}</p>
          <p className="text-xs text-white/30 mt-1">por servicio activo</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
        className="flex items-center gap-3"
      >
        <button
          onClick={() => setShowInactive((v) => !v)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm border transition-colors ${
            showInactive
              ? "bg-white/10 border-white/20 text-white"
              : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/60"
          }`}
        >
          {showInactive ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
          {showInactive ? "Mostrando inactivos" : "Mostrar inactivos"}
        </button>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden"
      >
        {/* Table header */}
        <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-white/[0.07]">
          {["Nombre", "Descripción", "Duración", "Precio", "Activo", ""].map((col, i) => (
            <p key={i} className="text-xs font-medium text-white/30 uppercase tracking-wide">
              {col}
            </p>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-white/20 animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ToggleLeft className="h-10 w-10 text-white/10" />
            <p className="text-sm text-white/30">Aún no hay servicios registrados</p>
            <button
              onClick={openCreateModal}
              className="text-sm text-white/50 hover:text-white transition-colors underline underline-offset-4"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {services.map((service) => (
              <motion.div
                key={service.id}
                variants={rowVariants}
                className={`grid grid-cols-6 gap-4 px-5 py-4 border-b border-white/[0.04] items-center hover:bg-white/[0.02] transition-colors last:border-0 ${
                  !service.active ? "opacity-50" : ""
                }`}
              >
                {/* Name */}
                <p className="text-sm text-white font-medium truncate">{service.name}</p>

                {/* Description */}
                <p className="text-sm text-white/40 truncate">
                  {service.description ?? <span className="text-white/20 italic">Sin descripción</span>}
                </p>

                {/* Duration */}
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-white/30 shrink-0" />
                  <span className="text-sm text-white/60">
                    {formatDuration(service.duration_minutes)}
                  </span>
                </div>

                {/* Price */}
                <p className="text-sm text-white font-medium">
                  {formatPrice(service.price)}
                </p>

                {/* Active toggle */}
                <div>
                  <Switch
                    checked={service.active}
                    disabled={togglingId === service.id}
                    onCheckedChange={(checked) => void handleToggleActive(service, checked)}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => openEditModal(service)}
                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5 text-white/50" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Eliminar "${service.name}"?`)) {
                        void handleDelete(service);
                      }
                    }}
                    disabled={deletingId === service.id}
                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 border border-white/5 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {deletingId === service.id ? (
                      <Loader2 className="h-3.5 w-3.5 text-white/30 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 text-white/50" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">
                  {editingService ? "Editar Servicio" : "Nuevo Servicio"}
                </h2>
                <button
                  onClick={closeModal}
                  className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-white/50" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">
                    Nombre del servicio <span className="text-red-400">*</span>
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Corte de cabello"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Descripción opcional del servicio..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-1.5">
                      Duración (minutos) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={form.duration_minutes}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          duration_minutes: e.target.value === "" ? "" : Number(e.target.value),
                        }))
                      }
                      placeholder="45"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-1.5">
                      Precio <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={form.price}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            price: e.target.value === "" ? "" : Number(e.target.value),
                          }))
                        }
                        placeholder="2500"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-white/60">Servicio activo</p>
                    <p className="text-xs text-white/30">Visible para reservas</p>
                  </div>
                  <Switch
                    checked={form.active}
                    onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void handleSubmit()}
                  disabled={saving || !form.name.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? "Guardando…" : editingService ? "Actualizar" : "Crear Servicio"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
