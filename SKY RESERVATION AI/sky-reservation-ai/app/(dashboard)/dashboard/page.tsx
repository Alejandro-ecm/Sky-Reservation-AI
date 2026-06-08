"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Calendar, MessageSquare, DollarSign, TrendingUp, TrendingDown,
  Users, Phone, ArrowRight, Zap, Star, Activity, Clock,
  CheckCircle2, XCircle, AlertCircle, RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ReservationsAreaChart = dynamic(
  () => import("@/components/dashboard/area-chart").then((m) => m.ReservationsAreaChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full" /> }
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface OverviewData {
  total_reservations: number;
  reservations_this_month: number;
  reservations_last_month: number;
  total_conversations: number;
  conversations_this_month: number;
  total_customers: number;
  new_customers_this_month: number;
  avg_lead_score: number;
  reservation_completion_rate: number;
  revenue_estimate: number;
  top_services: { id: string; name: string; count: number }[];
}

interface TimeseriesPoint { date: string; value: number }

interface RecentReservation {
  id: string;
  status: string;
  created_at: string;
  customer?: { name: string } | null;
  service?: { name: string } | null;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  confirmed:  { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Reservación confirmada" },
  pending:    { icon: AlertCircle,  color: "text-yellow-400",  bg: "bg-yellow-500/10",  label: "Reservación pendiente" },
  cancelled:  { icon: XCircle,     color: "text-red-400",     bg: "bg-red-500/10",     label: "Reservación cancelada" },
  completed:  { icon: CheckCircle2, color: "text-blue-400",   bg: "bg-blue-500/10",    label: "Servicio completado" },
  no_show:    { icon: AlertCircle,  color: "text-orange-400", bg: "bg-orange-500/10",  label: "No-show registrado" },
};

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  title, value, sub, trend, icon: Icon, color,
}: {
  title: string; value: string; sub: string; trend?: number;
  icon: React.ElementType; color: string;
}) {
  const positive = (trend ?? 0) >= 0;
  return (
    <motion.div variants={stagger.item}
      className="relative bg-[#111111] border border-white/[0.07] rounded-2xl p-5 overflow-hidden group hover:border-white/[0.12] transition-colors"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${color} blur-3xl scale-50`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
            <Icon className="w-4.5 h-4.5 text-current opacity-80" />
          </div>
          {trend !== undefined && (
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
              {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{title}</p>
        <p className="text-xs text-gray-600 mt-1">{sub}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (signal?: AbortSignal, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [ovRes, tsRes, actRes] = await Promise.all([
        fetch("/api/analytics/overview", { signal }),
        fetch("/api/analytics/timeseries?metric=reservations&period=7d", { signal }),
        fetch("/api/reservations?per_page=5", { signal }),
      ]);
      if (signal?.aborted) return;
      if (ovRes.ok) {
        const json = (await ovRes.json()) as { data?: OverviewData };
        setOverview(json.data ?? null);
      }
      if (tsRes.ok) {
        const json = (await tsRes.json()) as TimeseriesPoint[];
        setTimeseries(json);
      }
      if (actRes.ok) {
        const json = (await actRes.json()) as { data: RecentReservation[] };
        setRecentActivity(json.data ?? []);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    } finally {
      if (!signal?.aborted) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const pct = (a: number, b: number) => b === 0 ? 0 : Math.round(((a - b) / b) * 100);

  const chartData = useMemo(() => timeseries.map((p) => ({
    name: new Date(p.date).toLocaleDateString("es", { weekday: "short" }),
    reservaciones: p.value,
  })), [timeseries]);

  const stats = overview ? [
    {
      title: "Reservaciones este mes",
      value: overview.reservations_this_month.toLocaleString(),
      sub: `${overview.total_reservations.toLocaleString()} total`,
      trend: pct(overview.reservations_this_month, overview.reservations_last_month),
      icon: Calendar,
      color: "bg-blue-500 text-blue-400",
    },
    {
      title: "Conversaciones activas",
      value: overview.conversations_this_month.toLocaleString(),
      sub: `${overview.total_conversations.toLocaleString()} total`,
      icon: MessageSquare,
      color: "bg-purple-500 text-purple-400",
    },
    {
      title: "Ingresos estimados",
      value: `$${overview.revenue_estimate.toLocaleString()}`,
      sub: "Reservaciones completadas",
      icon: DollarSign,
      color: "bg-emerald-500 text-emerald-400",
    },
    {
      title: "Clientes totales",
      value: overview.total_customers.toLocaleString(),
      sub: `+${overview.new_customers_this_month} este mes`,
      trend: overview.new_customers_this_month,
      icon: Users,
      color: "bg-yellow-500 text-yellow-400",
    },
  ] : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("es", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => void fetchData(undefined, true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white text-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#111111] border border-white/[0.07] rounded-2xl p-5 h-32">
                <Skeleton className="w-9 h-9 rounded-xl mb-4" />
                <Skeleton className="h-7 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))
          : stats.map((s) => <StatCard key={s.title} {...s} />)
        }
      </motion.div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-[#111111] border border-white/[0.07] rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">Reservaciones — Últimos 7 días</h2>
              <p className="text-xs text-gray-500 mt-0.5">Actividad diaria</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
              <Activity className="w-3 h-3" /> En vivo
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ReservationsAreaChart data={chartData} />
          )}
        </motion.div>

        {/* Quick KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#111111] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4"
        >
          <h2 className="text-sm font-semibold text-white">KPIs Clave</h2>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)
          ) : overview && (
            <>
              <KpiRow label="Tasa de completion" value={`${overview.reservation_completion_rate}%`} icon={CheckCircle2} color="emerald" />
              <KpiRow label="Lead score promedio" value={`${overview.avg_lead_score}/100`} icon={Star} color="yellow" />
              <KpiRow label="Nuevos clientes" value={`+${overview.new_customers_this_month}`} icon={Users} color="blue" />
              <KpiRow label="Servicio #1" value={overview.top_services[0]?.name ?? "—"} icon={TrendingUp} color="purple" />
            </>
          )}
        </motion.div>
      </div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-[#111111] border border-white/[0.07] rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Actividad Reciente</h2>
          <a href="/reservations" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
            Ver todo <ArrowRight className="w-3 h-3" />
          </a>
        </div>
        {loading ? (
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-white/5 rounded w-36" />
                  <div className="h-3 bg-white/5 rounded w-48" />
                </div>
                <div className="h-3 bg-white/5 rounded w-16" />
              </div>
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Activity className="w-8 h-8 text-white/10" />
            <p className="text-xs text-gray-600">Aún no hay actividad reciente</p>
            <p className="text-xs text-gray-700">Las reservaciones aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentActivity.map((item) => {
              const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              const relTime = new Date(item.created_at).toLocaleString("es", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              });
              return (
                <div key={item.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-200">{cfg.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {item.customer?.name ?? "Cliente desconocido"}
                      {item.service?.name ? ` — ${item.service.name}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-gray-600 flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{relTime}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

    </div>
  );
}

function KpiRow({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    yellow: "bg-yellow-500/10 text-yellow-400",
    blue: "bg-blue-500/10 text-blue-400",
    purple: "bg-purple-500/10 text-purple-400",
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-white truncate">{value}</p>
      </div>
    </div>
  );
}
