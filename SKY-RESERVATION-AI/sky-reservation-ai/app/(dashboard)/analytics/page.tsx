"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  MessageSquare,
  Phone,
  ChevronRight,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { formatRelative } from "@/lib/utils/format";

// ============================================================
// TYPES
// ============================================================

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
  top_services: Array<{ id: string; name: string; count: number }>;
  revenue_estimate: number;
}

interface TimeseriesPoint {
  date: string;
  value: number;
}

interface ChannelData {
  voice: number;
  whatsapp: number;
  sms: number;
  web: number;
  answered: number;
  missed: number;
  total: number;
}

interface PeakHourRow {
  hour: number;
  sunday: number;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
}

interface TopCustomer {
  customerId: string;
  name: string;
  phone: string | null;
  reservationCount: number;
  totalRevenue: number;
  lastVisit: string;
}

type Period = "7d" | "30d" | "90d";
type MetricTab = "reservations" | "revenue" | "customers" | "conversations";

// ============================================================
// HELPERS
// ============================================================

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

const CHANNEL_COLORS: Record<string, string> = {
  voice: "#3B82F6",
  whatsapp: "#22C55E",
  sms: "#F59E0B",
  web: "#8B5CF6",
};

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_KEYS: Array<keyof PeakHourRow> = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// ============================================================
// SKELETON
// ============================================================

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-white/[0.05] rounded-xl ${className ?? ""}`}
    />
  );
}

// ============================================================
// ANIMATED COUNTER
// ============================================================

function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const duration = 800;

  useEffect(() => {
    const start = display;
    const end = value;
    startRef.current = null;

    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span>
      {prefix}
      {display.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      {suffix}
    </span>
  );
}

// ============================================================
// CUSTOM TOOLTIP
// ============================================================

function CustomTooltip({
  active,
  payload,
  label,
  prefix = "",
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  prefix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-gray-400 mb-1.5">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="font-medium" style={{ color: entry.color }}>
          {prefix}
          {typeof entry.value === "number"
            ? entry.value.toLocaleString()
            : entry.value}
        </p>
      ))}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [metricTab, setMetricTab] = useState<MetricTab>("reservations");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [channels, setChannels] = useState<ChannelData | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHourRow[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingTimeseries, setLoadingTimeseries] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingPeakHours, setLoadingPeakHours] = useState(true);
  const [loadingTopCustomers, setLoadingTopCustomers] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof TopCustomer>("reservationCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const res = await fetch("/api/analytics/overview");
      const json = (await res.json()) as { data: OverviewData };
      setOverview(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const fetchTimeseries = useCallback(async () => {
    setLoadingTimeseries(true);
    try {
      const res = await fetch(
        `/api/analytics/timeseries?metric=${metricTab}&period=${period}`
      );
      const json = (await res.json()) as { data: TimeseriesPoint[] };
      setTimeseries(json.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTimeseries(false);
    }
  }, [metricTab, period]);

  const fetchChannels = useCallback(async () => {
    setLoadingChannels(true);
    try {
      const res = await fetch("/api/analytics/channels");
      const json = (await res.json()) as { data: ChannelData };
      setChannels(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  const fetchPeakHours = useCallback(async () => {
    setLoadingPeakHours(true);
    try {
      const res = await fetch("/api/analytics/peak-hours");
      const json = (await res.json()) as { data: PeakHourRow[] };
      setPeakHours(json.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPeakHours(false);
    }
  }, []);

  const fetchTopCustomers = useCallback(async () => {
    setLoadingTopCustomers(true);
    try {
      const res = await fetch("/api/analytics/top-customers");
      const json = (await res.json()) as { data: TopCustomer[] };
      setTopCustomers(json.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTopCustomers(false);
    }
  }, []);

  const fetchInsights = useCallback(async (stats: OverviewData) => {
    setLoadingInsights(true);
    setInsights([]);
    try {
      const res = await fetch("/api/analytics/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats }),
      });
      const json = (await res.json()) as { insights: string[] };
      setInsights(json.insights ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  useEffect(() => {
    void fetchOverview();
    void fetchChannels();
    void fetchPeakHours();
    void fetchTopCustomers();
  }, [fetchOverview, fetchChannels, fetchPeakHours, fetchTopCustomers]);

  useEffect(() => {
    void fetchTimeseries();
  }, [fetchTimeseries]);

  useEffect(() => {
    if (overview) void fetchInsights(overview);
  }, [overview, fetchInsights]);

  // Derived KPIs
  const resPctChange = overview
    ? pctChange(overview.reservations_this_month, overview.reservations_last_month)
    : 0;

  const conversionRate =
    overview && overview.conversations_this_month > 0
      ? Math.round(
          (overview.reservations_this_month / overview.conversations_this_month) * 100
        )
      : 0;

  // Peak-hours max value (for intensity coloring)
  const peakMax = peakHours.reduce((mx, row) => {
    const rowMax = Math.max(
      row.sunday, row.monday, row.tuesday, row.wednesday,
      row.thursday, row.friday, row.saturday
    );
    return Math.max(mx, rowMax);
  }, 1);

  function getHeatColor(val: number): string {
    const intensity = val / peakMax;
    if (intensity === 0) return "bg-white/[0.03]";
    if (intensity < 0.25) return "bg-[#00E5FF]/15";
    if (intensity < 0.5) return "bg-[#00E5FF]/35";
    if (intensity < 0.75) return "bg-[#00E5FF]/55";
    return "bg-[#00E5FF]/85";
  }

  const sortedCustomers = [...topCustomers].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    }
    return 0;
  });

  function handleSort(col: keyof TopCustomer) {
    if (sortColumn === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortColumn(col);
      setSortDir("desc");
    }
  }

  const channelPieData = channels
    ? [
        { name: "Voice AI", value: channels.voice, color: CHANNEL_COLORS.voice },
        { name: "WhatsApp", value: channels.whatsapp, color: CHANNEL_COLORS.whatsapp },
        { name: "SMS", value: channels.sms, color: CHANNEL_COLORS.sms },
        { name: "Web", value: channels.web, color: CHANNEL_COLORS.web },
      ].filter((d) => d.value > 0)
    : [];

  const topServicesData = overview?.top_services.map((s) => ({
    name: s.name.length > 14 ? s.name.slice(0, 14) + "…" : s.name,
    count: s.count,
  })) ?? [];

  const metricPrefix = metricTab === "revenue" ? "$" : "";

  const stagger = {
    container: {
      hidden: {},
      show: { transition: { staggerChildren: 0.07 } },
    },
    item: {
      hidden: { opacity: 0, y: 16 },
      show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-[1400px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Métricas en tiempo real de tu negocio</p>
        </div>
        <button
          onClick={() => {
            void fetchOverview();
            void fetchChannels();
            void fetchPeakHours();
            void fetchTopCustomers();
          }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] rounded-xl px-3 py-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 w-fit">
        {(["7d", "30d", "90d"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              period === p
                ? "bg-[#00E5FF] text-black shadow-lg shadow-[#00E5FF]/25"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {p === "7d" ? "7 días" : p === "30d" ? "30 días" : "90 días"}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {/* Total Reservaciones */}
        <motion.div variants={stagger.item} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5 text-[#00E5FF]" />
            </div>
            {resPctChange >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
          </div>
          <p className="text-xs text-gray-500 mb-1">Reservaciones del Mes</p>
          {loadingOverview ? (
            <Skeleton className="h-7 w-24 mb-1" />
          ) : (
            <p className="text-2xl font-black text-white">
              <AnimatedCounter value={overview?.reservations_this_month ?? 0} />
            </p>
          )}
          <p
            className={`text-xs font-medium mt-1 ${
              resPctChange >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {resPctChange >= 0 ? "+" : ""}
            {resPctChange}% vs mes anterior
          </p>
        </motion.div>

        {/* Ingresos Estimados */}
        <motion.div variants={stagger.item} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <DollarSign className="w-4.5 h-4.5 text-green-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-xs text-gray-500 mb-1">Ingresos Estimados</p>
          {loadingOverview ? (
            <Skeleton className="h-7 w-28 mb-1" />
          ) : (
            <p className="text-2xl font-black text-white">
              {formatCurrency(overview?.revenue_estimate ?? 0)}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">Este mes (completadas)</p>
        </motion.div>

        {/* Nuevos Clientes */}
        <motion.div variants={stagger.item} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-purple-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-xs text-gray-500 mb-1">Nuevos Clientes</p>
          {loadingOverview ? (
            <Skeleton className="h-7 w-16 mb-1" />
          ) : (
            <p className="text-2xl font-black text-white">
              <AnimatedCounter value={overview?.new_customers_this_month ?? 0} />
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {overview?.total_customers ?? 0} totales
          </p>
        </motion.div>

        {/* Tasa de Conversión */}
        <motion.div variants={stagger.item} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <MessageSquare className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-xs text-gray-500 mb-1">Tasa de Conversión</p>
          {loadingOverview ? (
            <Skeleton className="h-7 w-20 mb-1" />
          ) : (
            <p className="text-2xl font-black text-white">
              <AnimatedCounter value={conversionRate} suffix="%" />
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Conv. → Reservación
          </p>
        </motion.div>
      </motion.div>

      {/* Main chart */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="font-bold text-white">Tendencia</h2>
            <p className="text-xs text-gray-500">Últimos {period}</p>
          </div>
          {/* Metric tabs */}
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1">
            {(
              [
                { id: "reservations", label: "Reservaciones" },
                { id: "revenue", label: "Ingresos" },
                { id: "customers", label: "Clientes" },
                { id: "conversations", label: "Conversaciones" },
              ] as { id: MetricTab; label: string }[]
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMetricTab(m.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  metricTab === m.id
                    ? "bg-[#00E5FF] text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {loadingTimeseries ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timeseries}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#666", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.slice(5)}
                interval={Math.ceil(timeseries.length / 7)}
              />
              <YAxis
                tick={{ fill: "#666", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  metricTab === "revenue" ? formatCurrency(v) : String(v)
                }
              />
              <Tooltip
                content={<CustomTooltip prefix={metricPrefix} />}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#areaGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#3B82F6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Secondary row: Pie + Bar */}
      <div className="grid xl:grid-cols-2 gap-6">
        {/* Channel Distribution */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="w-4 h-4 text-[#00E5FF]" />
            <h2 className="font-bold text-white">Distribución de Canales</h2>
          </div>
          <p className="text-xs text-gray-500 mb-5">Por tipo de conversación</p>

          {loadingChannels ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={channelPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {channelPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#1a1a1a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex-1 space-y-3">
                {channelPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: item.color }}
                      />
                      <span className="text-sm text-gray-400">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${channels?.total ? (item.value / channels.total) * 100 : 0}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white w-8 text-right">
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
                {channels && (
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-gray-500">
                    <span>Respondidas: {channels.answered}</span>
                    <span className="text-red-400">Perdidas: {channels.missed}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Top 5 Services */}
        <div className="glass-card p-6">
          <h2 className="font-bold text-white mb-1">Top 5 Servicios</h2>
          <p className="text-xs text-gray-500 mb-5">Por número de reservaciones</p>

          {loadingOverview ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topServicesData} layout="vertical" barSize={14}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "#666", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#aaa", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Reservaciones" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Peak Hours Heatmap */}
      <div className="glass-card p-6">
        <h2 className="font-bold text-white mb-1">Horas Pico</h2>
        <p className="text-xs text-gray-500 mb-5">
          Distribución de reservaciones por hora y día
        </p>

        {loadingPeakHours ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[540px]">
              {/* Day headers */}
              <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: "3rem repeat(7, 1fr)" }}>
                <div />
                {DAY_LABELS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-medium text-gray-500">
                    {d}
                  </div>
                ))}
              </div>
              {/* Rows */}
              <div className="space-y-0.5">
                {peakHours
                  .filter((_, i) => i >= 6 && i <= 22)
                  .map((row) => (
                    <div
                      key={row.hour}
                      className="grid gap-0.5"
                      style={{ gridTemplateColumns: "3rem repeat(7, 1fr)" }}
                    >
                      <div className="text-[10px] text-gray-600 flex items-center justify-end pr-2">
                        {row.hour.toString().padStart(2, "0")}:00
                      </div>
                      {DAY_KEYS.map((dk) => {
                        const val = row[dk] as number;
                        return (
                          <div
                            key={dk}
                            title={`${val} reservaciones`}
                            className={`h-5 rounded-sm ${getHeatColor(val)} transition-colors cursor-default`}
                          />
                        );
                      })}
                    </div>
                  ))}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-2 mt-3 justify-end">
                <span className="text-[10px] text-gray-600">Menos</span>
                {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-sm ${getHeatColor(v * peakMax)}`}
                  />
                ))}
                <span className="text-[10px] text-gray-600">Más</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Customers Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-white">Mejores Clientes</h2>
            <p className="text-xs text-gray-500">Top 10 por número de reservaciones</p>
          </div>
        </div>

        {loadingTopCustomers ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sortedCustomers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            No hay datos de clientes aún
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                    #
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                    Cliente
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                    Teléfono
                  </th>
                  <th
                    className="text-right py-2 px-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("reservationCount")}
                  >
                    Reservaciones{" "}
                    {sortColumn === "reservationCount" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th
                    className="text-right py-2 px-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("totalRevenue")}
                  >
                    Total Gastado{" "}
                    {sortColumn === "totalRevenue" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">
                    Última visita
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCustomers.map((c, idx) => (
                  <motion.tr
                    key={c.customerId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-3 text-gray-600 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#7000FF] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <span className="font-medium text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-400">
                      {c.phone ?? "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-white">
                      {c.reservationCount}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-green-400">
                      {formatCurrency(c.totalRevenue)}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-500 text-xs">
                      {formatRelative(c.lastVisit)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Insights Panel */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">Insights de IA</h2>
              <p className="text-xs text-gray-500">Análisis y recomendaciones automáticas</p>
            </div>
          </div>
          <button
            onClick={() => overview && fetchInsights(overview)}
            disabled={loadingInsights || !overview}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] rounded-xl px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${loadingInsights ? "animate-spin" : ""}`} />
            Regenerar
          </button>
        </div>

        {loadingInsights ? (
          <div className="flex items-center gap-3 py-6 justify-center">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            <span className="text-sm text-gray-400">Generando insights...</span>
          </div>
        ) : insights.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No hay insights disponibles. Actualiza los datos para generarlos.
          </p>
        ) : (
          <ul className="space-y-3">
            {insights.map((insight, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-4 bg-purple-500/[0.05] border border-purple-500/10 rounded-xl"
              >
                <ChevronRight className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">{insight}</p>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
