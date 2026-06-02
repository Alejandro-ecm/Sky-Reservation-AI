"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Clock,
  Loader2,
  Check,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { StaffMember, StaffAvailability, StaffRole } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface StaffFormState {
  name: string;
  role: StaffRole;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Admin",
  staff: "Staff",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<StaffRole, string> = {
  admin: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  staff: "text-green-400 bg-green-500/10 border-green-500/20",
  viewer: "text-gray-400 bg-gray-500/10 border-gray-500/20",
};

const DAY_ABBR: Record<string, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mié",
  thursday: "Jue",
  friday: "Vie",
  saturday: "Sáb",
  sunday: "Dom",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvailabilitySummary(availability: StaffAvailability): string {
  const days = Object.keys(DAY_ABBR);
  const activeDays = days.filter((day) => {
    const slots = availability[day as keyof StaffAvailability];
    return slots && slots.length > 0;
  });

  if (activeDays.length === 0) return "Sin disponibilidad";
  if (activeDays.length === 7) return "Todos los días";
  if (
    activeDays.length === 5 &&
    !availability.saturday?.length &&
    !availability.sunday?.length
  ) {
    return "Lun – Vie";
  }
  return activeDays.map((d) => DAY_ABBR[d]).join(", ");
}

function getActiveDaysCount(availability: StaffAvailability): number {
  return Object.values(availability).filter((slots) => slots && slots.length > 0).length;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffFormState>({ name: "", role: "staff" });

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Error al cargar el staff");
      const json = (await res.json()) as { data: StaffMember[] };
      setStaff(json.data);
    } catch {
      toast.error("No se pudo cargar el equipo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStaff();
  }, [fetchStaff]);

  async function handleCreate() {
    if (!form.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), role: form.role }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      toast.success("Miembro agregado");
      setShowModal(false);
      setForm({ name: "", role: "staff" });
      await fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear miembro");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateName(id: string) {
    if (!editingName.trim()) return;
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      toast.success("Nombre actualizado");
      setEditingId(null);
      await fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      toast.success("Miembro eliminado");
      setStaff((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  const avgActiveDays =
    staff.length > 0
      ? Math.round(
          staff.reduce((sum, s) => sum + getActiveDaysCount(s.availability), 0) / staff.length
        )
      : 0;

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
            <h1 className="text-2xl font-semibold text-white">Staff</h1>
            {!loading && (
              <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-2 rounded-full bg-white/10 text-xs text-white/60 font-medium">
                {staff.length}
              </span>
            )}
          </div>
          <p className="text-sm text-white/40 mt-0.5">
            Gestiona los agentes y empleados de tu negocio
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar Miembro
        </button>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-white/50">Total Miembros</p>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-white">{staff.length}</p>
          <p className="text-xs text-white/30 mt-1">agentes registrados</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-white/50">Disponibilidad Promedio</p>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Clock className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-white">{avgActiveDays}</p>
          <p className="text-xs text-white/30 mt-1">días activos en promedio</p>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden"
      >
        {/* Table header */}
        <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-white/[0.07]">
          {["Agente", "Rol", "Disponibilidad", "Alta", ""].map((col, i) => (
            <p key={i} className="text-xs font-medium text-white/30 uppercase tracking-wide">
              {col}
            </p>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-white/20 animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <UserCheck className="h-10 w-10 text-white/10" />
            <p className="text-sm text-white/30">Aún no hay miembros del equipo</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-white/50 hover:text-white transition-colors underline underline-offset-4"
            >
              Agregar el primero
            </button>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {staff.map((member) => (
              <motion.div
                key={member.id}
                variants={rowVariants}
                className="grid grid-cols-5 gap-4 px-5 py-4 border-b border-white/[0.04] items-center hover:bg-white/[0.02] transition-colors last:border-0"
              >
                {/* Name + avatar */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-white/70">
                      {getInitials(member.name)}
                    </span>
                  </div>
                  {editingId === member.id ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleUpdateName(member.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 bg-white/5 border border-white/20 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-white/40 min-w-0"
                      />
                      <button
                        onClick={() => void handleUpdateName(member.id)}
                        className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      >
                        <Check className="h-3.5 w-3.5 text-white" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                      >
                        <X className="h-3.5 w-3.5 text-white/50" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-white font-medium truncate">{member.name}</p>
                  )}
                </div>

                {/* Role badge */}
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[member.role ?? "staff"]}`}
                  >
                    {ROLE_LABELS[member.role ?? "staff"]}
                  </span>
                </div>

                {/* Availability */}
                <p className="text-sm text-white/50 truncate">
                  {getAvailabilitySummary(member.availability)}
                </p>

                {/* Date */}
                <p className="text-sm text-white/30">{formatDate(member.created_at)}</p>

                {/* Actions */}
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => {
                      setEditingId(member.id);
                      setEditingName(member.name);
                    }}
                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5 text-white/50" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Eliminar a ${member.name}? Esta acción no se puede deshacer.`)) {
                        void handleDelete(member.id);
                      }
                    }}
                    disabled={deletingId === member.id}
                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 border border-white/5 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {deletingId === member.id ? (
                      <Loader2 className="h-3.5 w-3.5 text-white/30 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 text-white/50 group-hover:text-red-400" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Agregar Miembro</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-white/50" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">
                    Nombre completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleCreate();
                    }}
                    placeholder="Ej: María García"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">
                    Rol
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["admin", "staff", "viewer"] as StaffRole[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, role }))}
                        className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                          form.role === role
                            ? ROLE_COLORS[role] + " border-current"
                            : "bg-white/5 border-white/10 text-white/40 hover:bg-white/8"
                        }`}
                      >
                        {ROLE_LABELS[role]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void handleCreate()}
                  disabled={saving || !form.name.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? "Guardando…" : "Agregar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
