"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  isValid,
} from "date-fns";
import { es } from "date-fns/locale";

// ============================================================
// TYPES
// ============================================================

interface ReservationEntry {
  id: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  customer?: { name: string } | null;
  service?: { name: string; duration_minutes: number } | null;
}

interface CalendarViewProps {
  reservations: ReservationEntry[];
  onSlotClick?: (date: string, time: string) => void;
}

// ============================================================
// ANIMATION VARIANTS
// ============================================================

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.018 } },
};

const cellVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

// ============================================================
// STATUS PILL COLORS (cyan-tinted for Neural aesthetic)
// ============================================================

const STATUS_STYLES = {
  pending:   "bg-amber-500/15 border-amber-500/25 text-amber-300/90",
  confirmed: "bg-[#00E5FF]/10 border-[#00E5FF]/25 text-[#00E5FF]/85",
  completed: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300/90",
  cancelled: "bg-red-500/10 border-red-500/20 text-red-400/70 line-through opacity-60",
  no_show:   "bg-white/5 border-white/10 text-white/30 opacity-60",
};

// ============================================================
// DOT GENERATOR — deterministic pseudo-random per day
// ============================================================

function generateDots(day: Date): { x: number; y: number }[] {
  const seed = day.getDate() * 7 + day.getMonth() * 31 + day.getFullYear();
  // Wide range: 3–16 dots — creates natural dramatic variation between cells
  const count = 3 + (seed % 14);
  return Array.from({ length: count }, (_, i) => ({
    x: 8 + ((seed * (i + 1) * 17 + i * 43) % 80),
    y: 22 + ((seed * (i + 1) * 13 + i * 29) % 58),
  }));
}

// ============================================================
// COMPONENT
// ============================================================

export function CalendarView({ reservations, onSlotClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();
  const todayKey = today.toDateString();

  // --- Calendar grid days ---
  const allDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd   = endOfMonth(currentMonth);
    const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  // --- Pre-compute dots per cell (stable across re-renders) ---
  const dotsMap = useMemo(() => {
    const map: Record<string, { x: number; y: number }[]> = {};
    allDays.forEach((day) => {
      const key = day.toDateString();
      const base = generateDots(day);
      // Today gets extra dots — denser halo matches the "alive" look
      if (key === todayKey) {
        const extra = generateDots(new Date(day.getTime() + 1)).slice(0, 8);
        map[key] = [...base, ...extra];
      } else {
        map[key] = base;
      }
    });
    return map;
  }, [allDays, todayKey]);

  // --- Reservations lookup per day ---
  function getReservationsForDay(day: Date): ReservationEntry[] {
    return reservations.filter((r) => {
      const start = parseISO(r.start_time);
      return isValid(start) && isSameDay(start, day);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050505]">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-white/[0.06]">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/40 hover:text-white transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="flex-1 text-center text-sm font-bold tracking-[0.22em] uppercase text-white/90">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </span>

        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/40 hover:text-white transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => setCurrentMonth(new Date())}
          className="text-[11px] font-medium tracking-wider uppercase text-[#00E5FF]/60 hover:text-[#00E5FF] transition-colors px-2"
        >
          Hoy
        </button>
      </div>

      {/* ── DAY NAMES ───────────────────────────────────────── */}
      <div className="grid grid-cols-7 border-b border-white/[0.04] bg-white/[0.01]">
        {["L", "M", "Mi", "J", "V", "S", "D"].map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium text-white/35 tracking-[0.15em] uppercase py-2.5"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── CALENDAR GRID ───────────────────────────────────── */}
      <motion.div
        key={format(currentMonth, "yyyy-MM")}
        variants={gridVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-7 gap-px p-1 bg-white/[0.025]"
      >
        {allDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday        = isSameDay(day, today);
          const dayRes         = getReservationsForDay(day);
          const dots           = dotsMap[day.toDateString()] ?? [];

          return (
            <motion.div
              key={day.toISOString()}
              variants={cellVariants}
              onClick={() =>
                isCurrentMonth &&
                onSlotClick?.(format(day, "yyyy-MM-dd"), "09:00")
              }
              className={[
                "relative min-h-[92px] p-2 rounded-lg overflow-hidden",
                "bg-white/[0.03] backdrop-blur-xl border border-white/[0.05]",
                "transition-all duration-300 hover:scale-[1.03] hover:border-white/[0.22] hover:bg-white/[0.065] hover:z-10",
                isCurrentMonth ? "cursor-pointer" : "cursor-default opacity-20",
                isToday
                  ? "border-[#00E5FF]/30 shadow-[0_0_22px_rgba(0,229,255,0.13)]"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* Pulsing halo — today only */}
              {isToday && (
                <div className="absolute inset-0 rounded-lg bg-[#00E5FF]/[0.045] animate-pulse pointer-events-none" />
              )}

              {/* Day number */}
              <span
                className={[
                  "relative z-10 block text-[11px] font-bold leading-none",
                  isToday
                    ? "text-[#00E5FF] drop-shadow-[0_0_6px_rgba(0,229,255,0.9)]"
                    : "text-white/60",
                ].join(" ")}
              >
                {format(day, "d")}
              </span>

              {/* Light dots (activity heatmap) */}
              {dots.map((dot, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-[#00E5FF] pointer-events-none"
                  style={{
                    left: `${dot.x}%`,
                    top: `${dot.y}%`,
                    opacity: isToday ? 0.75 : 0.42,
                    boxShadow: isToday
                      ? "0 0 7px 1px #00E5FF"
                      : "0 0 5px #00E5FF",
                  }}
                />
              ))}

              {/* Reservation pills */}
              {isCurrentMonth && dayRes.length > 0 && (
                <div className="relative z-10 mt-1.5 space-y-0.5">
                  {dayRes.slice(0, 2).map((res) => (
                    <div
                      key={res.id}
                      className={`text-[9px] px-1.5 py-[2px] rounded border truncate ${STATUS_STYLES[res.status]}`}
                      title={`${res.customer?.name ?? "Sin cliente"} — ${res.service?.name ?? "Sin servicio"}`}
                    >
                      {res.customer?.name ?? "Reservación"}
                    </div>
                  ))}
                  {dayRes.length > 2 && (
                    <div className="text-[9px] text-white/30 pl-0.5">
                      +{dayRes.length - 2} más
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
