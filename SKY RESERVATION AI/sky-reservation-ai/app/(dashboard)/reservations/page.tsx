"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  ChevronDown,
  LayoutGrid,
  Table2,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";
import { formatShortDate, formatTime } from "@/lib/utils/format";
import { ReservationForm } from "@/components/reservations/reservation-form";
import { CalendarView } from "@/components/reservations/calendar-view";

// ============================================================
// TYPES
// ============================================================

interface Reservation {
  id: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  notes: string | null;
  customer?: { id: string; name: string; phone: string | null; email: string | null } | null;
  staff?: { id: string; name: string } | null;
  service?: { id: string; name: string; price: number; duration_minutes: number } | null;
}

// ============================================================
// CONFIG
// ============================================================

const statusConfig = {
  confirmed: {
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    label: "Confirmado",
  },
  pending: {
    icon: AlertCircle,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    label: "Pendiente",
  },
  cancelled: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    label: "Cancelado",
  },
  completed: {
    icon: CheckCircle,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    label: "Completado",
  },
  no_show: {
    icon: XCircle,
    color: "text-gray-400",
    bg: "bg-gray-500/10 border-gray-500/20",
    label: "No se presentó",
  },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// ============================================================
// PAGE
// ============================================================

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"table" | "calendar">("table");
  const [showForm, setShowForm] = useState(false);
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>();
  const [formInitialTime, setFormInitialTime] = useState<string | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/reservations?${params}`);
      const data = await res.json() as { data?: Reservation[]; total?: number };
      setReservations(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error("Failed to load reservations:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchReservations();
  }, [fetchReservations]);

  const filtered = reservations.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.customer?.name?.toLowerCase().includes(q) ||
      r.service?.name?.toLowerCase().includes(q) ||
      r.staff?.name?.toLowerCase().includes(q)
    );
  });

  const todayCount = reservations.filter((r) => {
    const d = new Date(r.start_time);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  }).length;

  const thisWeekCount = reservations.filter((r) => {
    const d = new Date(r.start_time);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return d >= weekStart && d < weekEnd;
  }).length;

  const pendingCount = reservations.filter((r) => r.status === "pending").length;

  const handleDelete = async (id: string) => {
    if (!confirm("¿Cancelar esta reservación?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      await fetchReservations();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCalendarSlotClick = (date: string, time: string) => {
    setFormInitialDate(date);
    setFormInitialTime(time);
    setShowForm(true);
  };

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
            <h1 className="text-2xl font-black text-white">Reservaciones</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {total} reservaciones en total
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center bg-white/[0.04] border border-white/[0.07] rounded-xl p-1">
              <button
                onClick={() => setView("table")}
                className={`p-2 rounded-lg transition-all ${
                  view === "table"
                    ? "bg-white/[0.08] text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Table2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`p-2 rounded-lg transition-all ${
                  view === "calendar"
                    ? "bg-white/[0.08] text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                setFormInitialDate(undefined);
                setFormInitialTime(undefined);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Nueva Reservación
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-3 gap-4">
          {[
            { label: "Hoy", value: todayCount, icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
            { label: "Esta Semana", value: thisWeekCount, icon: Calendar, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
            { label: "Pendientes", value: pendingCount, icon: AlertCircle, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
          ].map((stat) => (
            <div key={stat.label} className={`glass-card p-4 border ${stat.bg}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} border flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-black text-white">{loading ? "—" : stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {view === "table" && (
          <>
            {/* Filters */}
            <motion.div variants={item} className="glass-card p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por cliente, servicio o staff..."
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500/40 cursor-pointer"
                >
                  <option value="all">Todos los estados</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="pending">Pendiente</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </motion.div>

            {/* Table */}
            <motion.div variants={item} className="glass-card overflow-hidden">
              {loading ? (
                <div className="py-20 flex items-center justify-center gap-3 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cargando reservaciones...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {["Cliente", "Servicio", "Staff", "Fecha y Hora", "Estado", "Precio", ""].map((col) => (
                          <th key={col} className="text-left text-xs font-medium text-gray-500 px-5 py-4">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((reservation, i) => {
                        const status = statusConfig[reservation.status];
                        const StatusIcon = status.icon;
                        return (
                          <motion.tr
                            key={reservation.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                                  {reservation.customer?.name?.charAt(0) ?? "?"}
                                </div>
                                <span className="text-sm font-medium text-white">
                                  {reservation.customer?.name ?? "Sin cliente"}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-400">
                              {reservation.service?.name ?? "—"}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-400">
                              {reservation.staff?.name ?? "Sin asignar"}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 text-sm text-gray-300">
                                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                {formatShortDate(reservation.start_time)}
                                <Clock className="w-3.5 h-3.5 text-gray-500 ml-1" />
                                {formatTime(reservation.start_time)}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${status.bg} ${status.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm font-semibold text-white">
                              ${reservation.service?.price ?? "—"}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => { setEditingReservation(reservation); setShowForm(true); }}
                                  className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-blue-500/20 flex items-center justify-center text-gray-500 hover:text-blue-400 transition-all"
                                  title="Editar"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(reservation.id)}
                                  disabled={deletingId === reservation.id}
                                  className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-red-500/20 flex items-center justify-center text-gray-500 hover:text-red-400 transition-all disabled:opacity-50"
                                  title="Cancelar"
                                >
                                  {deletingId === reservation.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                                  Ver <ChevronDown className="w-3 h-3 -rotate-90" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filtered.length === 0 && !loading && (
                    <div className="py-20 text-center">
                      <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500">No se encontraron reservaciones</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}

        {view === "calendar" && (
          <motion.div variants={item}>
            <CalendarView
              reservations={reservations}
              onSlotClick={handleCalendarSlotClick}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Reservation Form Modal */}
      <ReservationForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingReservation(null); }}
        onSuccess={fetchReservations}
        initialDate={formInitialDate}
        initialTime={formInitialTime}
        initialReservation={editingReservation ?? undefined}
      />
    </>
  );
}
