"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  format,
  isSameDay,
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
// CONFIG
// ============================================================

const STATUS_COLORS = {
  pending: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
  confirmed: "bg-blue-500/20 border-blue-500/40 text-blue-300",
  completed: "bg-green-500/20 border-green-500/40 text-green-300",
  cancelled: "bg-red-500/20 border-red-500/40 text-red-300 line-through opacity-60",
  no_show: "bg-gray-500/20 border-gray-500/40 text-gray-400 opacity-60",
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am - 8pm

// ============================================================
// COMPONENT
// ============================================================

export function CalendarView({ reservations, onSlotClick }: CalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const today = new Date();

  // Get reservations for a specific day + hour
  function getReservationsForSlot(day: Date, hour: number): ReservationEntry[] {
    return reservations.filter((r) => {
      const start = parseISO(r.start_time);
      if (!isValid(start)) return false;
      return isSameDay(start, day) && start.getHours() === hour;
    });
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-white capitalize">
            {format(weekStart, "MMMM yyyy", { locale: es })}
          </span>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => setCurrentWeek(new Date())}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Hoy
        </button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-auto max-h-[600px]">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.06] sticky top-0 bg-[#111111] z-10">
            <div className="h-12" />
            {days.map((day) => {
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={day.toISOString()}
                  className="flex flex-col items-center justify-center h-12 border-l border-white/[0.04]"
                >
                  <span className="text-[10px] text-gray-500 uppercase">
                    {format(day, "EEE", { locale: es })}
                  </span>
                  <span
                    className={`text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday
                        ? "bg-blue-500 text-white"
                        : "text-gray-300"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time rows */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.03]"
            >
              {/* Hour label */}
              <div className="flex items-start justify-end pr-3 pt-1.5">
                <span className="text-[10px] text-gray-600">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>

              {/* Day cells */}
              {days.map((day) => {
                const slotReservations = getReservationsForSlot(day, hour);
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() =>
                      onSlotClick?.(
                        format(day, "yyyy-MM-dd"),
                        `${String(hour).padStart(2, "0")}:00`
                      )
                    }
                    className={`min-h-[56px] border-l border-white/[0.04] p-1 cursor-pointer transition-colors hover:bg-white/[0.02] ${
                      isToday ? "bg-blue-500/[0.02]" : ""
                    }`}
                  >
                    {slotReservations.map((res, idx) => (
                      <motion.div
                        key={res.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`text-[10px] px-1.5 py-1 rounded border mb-0.5 truncate ${
                          STATUS_COLORS[res.status]
                        }`}
                        title={`${res.customer?.name ?? "Sin cliente"} — ${res.service?.name ?? "Sin servicio"}`}
                      >
                        <div className="font-medium truncate">
                          {res.customer?.name ?? "Sin cliente"}
                        </div>
                        <div className="opacity-70 truncate">
                          {res.service?.name ?? "Sin servicio"}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
