"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Calendar, MessageSquare, DollarSign, TrendingUp, TrendingDown,
  Users, Activity, Clock,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, ArrowRight, Star,
  Sparkles, Lightbulb, Wifi, PhoneCall, Zap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";

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
  confirmed: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Reservación confirmada" },
  pending:   { icon: AlertCircle,  color: "text-yellow-400",  bg: "bg-yellow-500/10",  label: "Reservación pendiente" },
  cancelled: { icon: XCircle,     color: "text-red-400",     bg: "bg-red-500/10",     label: "Reservación cancelada" },
  completed: { icon: CheckCircle2, color: "text-[#00E5FF]",  bg: "bg-[#00E5FF]/10",   label: "Servicio completado" },
  no_show:   { icon: AlertCircle,  color: "text-orange-400", bg: "bg-orange-500/10",  label: "No-show registrado" },
};

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  title, value, sub, trend, icon: Icon, iconBg, glowBg, accentRgb,
}: {
  title: string;
  value: string;
  sub: string;
  trend?: number;
  icon: React.ElementType;
  iconBg: string;
  glowBg: string;
  accentRgb?: string;
}) {
  const positive = (trend ?? 0) >= 0;
  const iconColorClass = iconBg.split(" ").find((c) => c.startsWith("text-")) ?? "text-white";

  return (
    <motion.div
      variants={stagger.item}
      className="metric-card group"
    >
      {/* Ambient glow — subtle at rest, brighter on hover */}
      <div className={`absolute inset-0 opacity-[0.05] group-hover:opacity-[0.12] transition-opacity duration-700 ${glowBg} blur-3xl scale-75 pointer-events-none`} />

      {/* Top accent line per card color */}
      {accentRgb && (
        <div
          className="absolute top-0 inset-x-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.6), transparent)` }}
        />
      )}

      {/* Background watermark icon */}
      <div className={`absolute -bottom-3 -right-3 ${iconColorClass} opacity-[0.04] pointer-events-none`}>
        <Icon className="w-24 h-24" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border border-white/[0.06] ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend !== undefined && (
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
              {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-xs text-zinc-400 mt-1">{title}</p>
        <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>
      </div>
    </motion.div>
  );
}

// ─── StatusDot ────────────────────────────────────────────────────────────────
function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`status-dot ${active ? "status-dot-active" : "status-dot-inactive"}`} />
      <span className={active ? "text-zinc-400" : "text-zinc-600"}>{label}</span>
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { profile } = useUser();
  const firstName = (profile?.full_name ?? profile?.email ?? "").split(/[\s@]/)[0] || "bienvenido";

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
        const json = (await tsRes.json()) as { data: TimeseriesPoint[] };
        setTimeseries(json.data ?? []);
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

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  // Health status (derived from overview data)
  const whatsappActive = (overview?.total_conversations ?? 0) > 0;
  const voiceActive = true; // VAPI is always configured when tenant exists
  const automationsActive = true; // automations run independently

  // AI Insights (derived from real data — no mock values)
  const insights = useMemo(() => {
    if (!overview) return [];
    const list: { icon: React.ElementType; title: string; desc: string; color: string }[] = [];
    const growth = pct(overview.reservations_this_month, overview.reservations_last_month);
    if (overview.reservations_this_month > 0) {
      list.push({
        icon: TrendingUp,
        title: growth >= 0 ? `+${growth}% vs mes anterior` : `${growth}% vs mes anterior`,
        desc: `${overview.reservations_this_month} reservaciones este mes`,
        color: growth >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10",
      });
    }
    if (overview.top_services[0]) {
      list.push({
        icon: Star,
        title: overview.top_services[0].name,
        desc: `Servicio #1 · ${overview.top_services[0].count} reservaciones`,
        color: "text-amber-400 bg-amber-500/10",
      });
    }
    if (overview.avg_lead_score > 0) {
      list.push({
        icon: Lightbulb,
        title: `Lead score: ${overview.avg_lead_score}/100`,
        desc: overview.avg_lead_score >= 70 ? "Clientes de alta calidad" : "Margen de mejora disponible",
        color: "text-[#00E5FF] bg-[#00E5FF]/10",
      });
    }
    return list;
  }, [overview]);

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
      iconBg: "bg-[#00E5FF]/10 text-[#00E5FF]",
      glowBg: "bg-[#00E5FF]",
      accentRgb: "0, 229, 255",
    },
    {
      title: "Conversaciones activas",
      value: overview.conversations_this_month.toLocaleString(),
      sub: `${overview.total_conversations.toLocaleString()} total`,
      icon: MessageSquare,
      iconBg: "bg-purple-500/10 text-purple-400",
      glowBg: "bg-purple-600",
      accentRgb: "147, 51, 234",
    },
    {
      title: "Ingresos estimados",
      value: `$${overview.revenue_estimate.toLocaleString()}`,
      sub: "Reservaciones completadas",
      icon: DollarSign,
      iconBg: "bg-emerald-500/10 text-emerald-400",
      glowBg: "bg-emerald-600",
      accentRgb: "52, 211, 153",
    },
    {
      title: "Clientes totales",
      value: overview.total_customers.toLocaleString(),
      sub: `+${overview.new_customers_this_month} este mes`,
      trend: overview.new_customers_this_month,
      icon: Users,
      iconBg: "bg-amber-500/10 text-amber-400",
      glowBg: "bg-amber-600",
      accentRgb: "251, 191, 36",
    },
  ] : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {/* ─── Greeting Card ─────────────────────────────────────── */}
      <div className="greeting-card">
        {/* Ambient orbs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#00E5FF]/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 left-1/3 w-32 h-32 bg-purple-600/[0.05] rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#00E5FF]/70" />
              <span className="text-xs text-[#00E5FF]/70 font-medium uppercase tracking-widest">Sky AI</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
              {greeting}, <span className="capitalize">{firstName}</span>
            </h1>
            <p className="text-sm text-zinc-500">
              {loading
                ? "Cargando métricas de tu negocio…"
                : overview
                  ? "Tu negocio está operando normalmente."
                  : "Bienvenido a tu panel de control."}
            </p>

            {/* Quick stat pills */}
            {!loading && overview && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF]/80 text-xs px-3 py-1.5 rounded-full">
                  <Calendar className="w-3 h-3" />
                  {overview.reservations_this_month} reservaciones este mes
                </span>
                <span className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs px-3 py-1.5 rounded-full">
                  <MessageSquare className="w-3 h-3" />
                  {overview.conversations_this_month} conversaciones IA
                </span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  {overview.reservation_completion_rate}% completadas
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => void fetchData(undefined, true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] text-zinc-400 hover:text-white text-xs transition-all duration-300 disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* ─── Health Center ─────────────────────────────────────── */}
      <div className="flex items-center gap-5 px-5 py-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl text-xs flex-wrap">
        <span className="text-zinc-600 font-medium uppercase tracking-widest text-[10px]">Sistema</span>
        <StatusDot active={whatsappActive} label="WhatsApp IA" />
        <StatusDot active={voiceActive} label="Voice AI" />
        <StatusDot active={automationsActive} label="Automatizaciones" />
        <StatusDot active={true} label="Calendario" />
        <span className="ml-auto text-zinc-700 text-[10px] hidden sm:inline">
          {new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>

      {/* Stat Cards */}
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-5 h-36">
                <Skeleton className="w-10 h-10 rounded-2xl mb-4" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-32 mt-1" />
              </div>
            ))
          : stats.map((s) => <StatCard key={s.title} {...s} />)
        }
      </motion.div>

      {/* Chart + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">Reservaciones — Últimos 7 días</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Actividad diaria</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <Activity className="w-3 h-3" /> En vivo
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <ReservationsAreaChart data={chartData} />
          )}
        </motion.div>

        {/* KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3"
        >
          <h2 className="text-sm font-semibold text-white">KPIs Clave</h2>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
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

      {/* ─── AI Insights ───────────────────────────────────────── */}
      {!loading && insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-[#00E5FF]" />
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">IA Insights</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {insights.map((ins, i) => (
              <div key={i} className="insight-card">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${ins.color}`}>
                  <ins.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight">{ins.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{ins.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Activity Feed ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Actividad Reciente</h2>
          <a href="/reservations" className="text-xs text-[#00E5FF] hover:text-[#00E5FF]/80 flex items-center gap-1 transition-colors">
            Ver todo <ArrowRight className="w-3 h-3" />
          </a>
        </div>

        {loading ? (
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/[0.05] flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-white/[0.05] rounded w-36" />
                  <div className="h-3 bg-white/[0.03] rounded w-48" />
                </div>
                <div className="h-3 bg-white/[0.05] rounded w-16" />
              </div>
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#00E5FF]/60" />
            </div>
            <p className="text-sm font-medium text-zinc-400">Sin actividad aún</p>
            <p className="text-xs text-zinc-600 mt-1 max-w-xs">
              Cuando tu IA atienda su primera reservación, aparecerá aquí en tiempo real.
            </p>
            <a
              href="/reservations"
              className="inline-flex items-center gap-1.5 mt-4 text-xs text-[#00E5FF] hover:text-[#00E5FF]/80 border border-[#00E5FF]/20 hover:border-[#00E5FF]/40 bg-[#00E5FF]/[0.06] px-4 py-2 rounded-full transition-all duration-300"
            >
              Crear primera reservación <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="space-y-0.5">
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
                    <p className="text-xs font-medium text-zinc-200">{cfg.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">
                      {item.customer?.name ?? "Cliente desconocido"}
                      {item.service?.name ? ` — ${item.service.name}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-600 flex-shrink-0 flex items-center gap-1">
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
    yellow:  "bg-yellow-500/10 text-yellow-400",
    blue:    "bg-[#00E5FF]/10 text-[#00E5FF]",
    purple:  "bg-purple-500/10 text-purple-400",
  };
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] transition-all duration-300">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-zinc-500">{label}</p>
        <p className="text-sm font-semibold text-white truncate">{value}</p>
      </div>
    </div>
  );
}
