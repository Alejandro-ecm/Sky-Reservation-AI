"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, User, Scissors, StickyNote, Loader2 } from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface StaffMember {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface InitialReservation {
  id: string;
  start_time: string;
  notes: string | null;
  customer?: { id: string; name: string } | null;
  service?: { id: string; duration_minutes: number } | null;
  staff?: { id: string } | null;
}

interface ReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string;
  initialTime?: string;
  initialReservation?: InitialReservation;
}

// ============================================================
// SCHEMA
// ============================================================

const reservationSchema = z.object({
  customer_id: z.string().min(1, "Selecciona un cliente"),
  service_id: z.string().min(1, "Selecciona un servicio"),
  staff_id: z.string().optional(),
  date: z.string().min(1, "Selecciona una fecha"),
  time: z.string().min(1, "Selecciona una hora"),
  notes: z.string().optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

// ============================================================
// TIME SLOTS
// ============================================================

function generateTimeSlots(serviceDuration: number): string[] {
  const slots: string[] = [];
  for (let hour = 8; hour < 20; hour++) {
    for (let min = 0; min < 60; min += serviceDuration) {
      const h = String(hour).padStart(2, "0");
      const m = String(min).padStart(2, "0");
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
}

// ============================================================
// COMPONENT
// ============================================================

export function ReservationForm({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialTime,
  initialReservation,
}: ReservationFormProps) {
  const isEditing = !!initialReservation;
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      date: initialDate ?? new Date().toISOString().split("T")[0],
      time: initialTime ?? "09:00",
    },
  });

  const selectedServiceId = watch("service_id");
  const selectedService = services.find((s) => s.id === selectedServiceId);
  const timeSlots = selectedService
    ? generateTimeSlots(selectedService.duration_minutes)
    : generateTimeSlots(30);

  // Pre-populate form when editing
  useEffect(() => {
    if (!isOpen) return;
    if (initialReservation) {
      const d = new Date(initialReservation.start_time);
      const date = d.toISOString().split("T")[0];
      const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      reset({
        customer_id: initialReservation.customer?.id ?? "",
        service_id: initialReservation.service?.id ?? "",
        staff_id: initialReservation.staff?.id ?? "",
        date,
        time,
        notes: initialReservation.notes ?? "",
      });
      if (initialReservation.customer?.name) {
        setCustomerSearch(initialReservation.customer.name);
      }
    } else {
      reset({
        date: initialDate ?? new Date().toISOString().split("T")[0],
        time: initialTime ?? "09:00",
      });
      setCustomerSearch("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialReservation]);

  // Fetch data
  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      fetch("/api/services").then((r) => r.json()),
      fetch("/api/staff").then((r) => r.json()),
    ]).then(([svcRes, staffRes]) => {
      setServices(svcRes.data ?? []);
      setStaff(staffRes.data ?? []);
    }).catch(console.error);
  }, [isOpen]);

  // Search customers
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}&per_page=10`)
        .then((r) => r.json())
        .then((res) => setCustomers(res.data ?? []))
        .catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, isOpen]);

  const onSubmit = async (data: ReservationFormData) => {
    setLoading(true);
    setError(null);

    try {
      const service = services.find((s) => s.id === data.service_id)
        ?? initialReservation?.service;
      const duration = service?.duration_minutes ?? 60;

      const start = new Date(`${data.date}T${data.time}:00`);
      const end = new Date(start.getTime() + duration * 60 * 1000);

      let response: Response;

      if (isEditing) {
        response = await fetch(`/api/reservations/${initialReservation!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            staff_id: data.staff_id || null,
            notes: data.notes || null,
          }),
        });
      } else {
        response = await fetch("/api/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: data.customer_id,
            service_id: data.service_id,
            staff_id: data.staff_id || undefined,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            notes: data.notes || undefined,
          }),
        });
      }

      const result = await response.json() as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? (isEditing ? "Error al actualizar" : "Error al crear"));
      }

      reset();
      setCustomerSearch("");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative w-full max-w-lg bg-[#111111] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isEditing ? "Editar Reservación" : "Nueva Reservación"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isEditing ? "Modifica fecha, hora, staff o notas" : "Completa los datos para agendar"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Customer */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                  <User className="w-3.5 h-3.5" /> Cliente
                </label>
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30 mb-2"
                />
                <select
                  {...register("customer_id")}
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#00E5FF]/30"
                >
                  <option value="">Seleccionar cliente</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `— ${c.phone}` : ""}
                    </option>
                  ))}
                </select>
                {errors.customer_id && (
                  <p className="text-xs text-red-400 mt-1">{errors.customer_id.message}</p>
                )}
              </div>

              {/* Service */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                  <Scissors className="w-3.5 h-3.5" /> Servicio
                </label>
                <select
                  {...register("service_id")}
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#00E5FF]/30"
                >
                  <option value="">Seleccionar servicio</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — ${s.price} ({s.duration_minutes} min)
                    </option>
                  ))}
                </select>
                {errors.service_id && (
                  <p className="text-xs text-red-400 mt-1">{errors.service_id.message}</p>
                )}
              </div>

              {/* Staff */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                  <User className="w-3.5 h-3.5" /> Staff (opcional)
                </label>
                <select
                  {...register("staff_id")}
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#00E5FF]/30"
                >
                  <option value="">Sin asignar</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                    <Calendar className="w-3.5 h-3.5" /> Fecha
                  </label>
                  <input
                    type="date"
                    {...register("date")}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#00E5FF]/30"
                  />
                  {errors.date && (
                    <p className="text-xs text-red-400 mt-1">{errors.date.message}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                    <Clock className="w-3.5 h-3.5" /> Hora
                  </label>
                  <select
                    {...register("time")}
                    className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#00E5FF]/30"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  {errors.time && (
                    <p className="text-xs text-red-400 mt-1">{errors.time.message}</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                  <StickyNote className="w-3.5 h-3.5" /> Notas (opcional)
                </label>
                <textarea
                  {...register("notes")}
                  rows={2}
                  placeholder="Instrucciones especiales, preferencias..."
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-gray-400 hover:text-white text-sm font-medium py-2.5 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 disabled:opacity-50 text-black text-sm font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-[#00E5FF]/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isEditing ? "Guardando..." : "Agendando..."}
                    </>
                  ) : (
                    isEditing ? "Guardar Cambios" : "Agendar Reservación"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
