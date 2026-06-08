"use client";

import { useState, useEffect, useCallback } from "react";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Clock, DollarSign, ChevronRight, ChevronLeft, Loader2, Calendar, User, Phone, Mail, StickyNote } from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
}

interface StaffMember {
  id: string;
  name: string;
}

interface TenantInfo {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  hours: unknown;
}

interface ConfirmationData {
  reservation_id: string;
  start_time: string;
  tenant_name: string;
  service_name: string;
}

// ============================================================
// HELPERS
// ============================================================

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(price);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getNext14Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function formatDay(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return {
    weekday: d.toLocaleDateString("es-MX", { weekday: "short" }),
    day: d.getDate(),
    month: d.toLocaleDateString("es-MX", { month: "short" }),
  };
}

function formatFullDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime12(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ============================================================
// STEP INDICATOR
// ============================================================

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            i + 1 < current
              ? "bg-gradient-to-br from-[#00E5FF] to-[#7000FF] text-black"
              : i + 1 === current
              ? "bg-gradient-to-br from-[#00E5FF] to-[#7000FF] text-black ring-4 ring-[#00E5FF]/20"
              : "bg-white/[0.06] text-gray-600"
          }`}>
            {i + 1 < current ? <CheckCircle className="w-4 h-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-px flex-1 w-8 transition-all ${i + 1 < current ? "bg-[#00E5FF]/55" : "bg-white/[0.08]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("");
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  // Step state
  const [step, setStep] = useState(1);

  // Step 1 — service + staff
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>("");

  // Step 2 — date + time
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 3 — customer info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Confirmation
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(null);

  // Resolve params
  useEffect(() => {
    void params.then((p) => setSlug(p.slug));
  }, [params]);

  // Load tenant data
  useEffect(() => {
    if (!slug) return;
    setLoadingTenant(true);
    fetch(`/api/public/${slug}/tenant`)
      .then((r) => r.json())
      .then((res: { tenant?: TenantInfo; services?: Service[]; staff?: StaffMember[]; error?: string }) => {
        if (res.error || !res.tenant) { setNotFoundFlag(true); return; }
        setTenant(res.tenant);
        setServices(res.services ?? []);
        setStaff(res.staff ?? []);
      })
      .catch(() => setNotFoundFlag(true))
      .finally(() => setLoadingTenant(false));
  }, [slug]);

  // Load availability when date or service changes
  const loadSlots = useCallback(async (date: string) => {
    if (!selectedService || !date || !slug) return;
    setLoadingSlots(true);
    setSelectedTime("");
    try {
      const params = new URLSearchParams({ date, service_id: selectedService.id });
      if (selectedStaff) params.set("staff_id", selectedStaff);
      const res = await fetch(`/api/public/${slug}/availability?${params}`);
      const data = (await res.json()) as { available_slots?: string[] };
      setAvailableSlots(data.available_slots ?? []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedService, selectedStaff, slug]);

  useEffect(() => {
    if (selectedDate) void loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  const handleSubmit = async () => {
    if (!tenant || !selectedService || !selectedDate || !selectedTime || !customerName.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/public/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: selectedService.id,
          staff_id: selectedStaff || undefined,
          date: selectedDate,
          time: selectedTime,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || undefined,
          customer_email: customerEmail.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = (await res.json()) as ConfirmationData & { error?: string | object };
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : "Error al crear la reservación";
        setSubmitError(msg);
        return;
      }
      setConfirmation(data);
    } catch {
      setSubmitError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (notFoundFlag) notFound();

  if (loadingTenant || !tenant) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.06] rounded-xl" />
        <div className="h-4 w-64 bg-white/[0.04] rounded-lg" />
        {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white/[0.04] rounded-2xl" />)}
      </div>
    );
  }

  // ── CONFIRMATION SCREEN ──────────────────────────────────────
  if (confirmation) {
    const refShort = confirmation.reservation_id.slice(0, 8).toUpperCase();
    const startDate = new Date(confirmation.start_time);
    const dateStr = startDate.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Mexico_City" });
    const timeStr = startDate.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">¡Reservación Confirmada!</h1>
        <p className="text-gray-500 text-sm mb-8">Te esperamos en {confirmation.tenant_name}</p>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 text-left space-y-4 mb-6">
          {[
            { label: "Servicio", value: confirmation.service_name },
            { label: "Fecha", value: dateStr },
            { label: "Hora", value: timeStr },
            { label: "Referencia", value: `#${refShort}`, mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex justify-between items-center border-b border-white/[0.05] pb-3 last:border-0 last:pb-0">
              <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
              <span className={`text-sm font-semibold text-white ${mono ? "font-mono" : ""}`}>{value}</span>
            </div>
          ))}
        </div>

        {(tenant.phone || tenant.email) && (
          <p className="text-xs text-gray-600">
            ¿Necesitas cancelar?{" "}
            {tenant.phone && <span className="text-gray-500">{tenant.phone}</span>}
            {tenant.phone && tenant.email && " · "}
            {tenant.email && <a href={`mailto:${tenant.email}`} className="text-[#00E5FF] hover:text-[#00E5FF]/80">{tenant.email}</a>}
          </p>
        )}

        <p className="text-xs text-gray-700 mt-6">Powered by Sky Reservation AI</p>
      </motion.div>
    );
  }

  const days = getNext14Days();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#7000FF] flex items-center justify-center text-white font-black text-lg">
              {tenant.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-black text-white">{tenant.name}</h1>
            {tenant.description && <p className="text-xs text-gray-500">{tenant.description}</p>}
          </div>
        </div>
      </div>

      <StepIndicator current={step} total={3} />

      <AnimatePresence mode="wait">
        {/* ── STEP 1: SERVICE ─────────────────────────────────── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-lg font-bold text-white mb-1">Elige un servicio</h2>
            <p className="text-sm text-gray-500 mb-5">Selecciona el servicio que deseas reservar</p>

            {services.length === 0 ? (
              <p className="text-gray-600 text-sm">No hay servicios disponibles en este momento.</p>
            ) : (
              <div className="space-y-3 mb-6">
                {services.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedService(svc)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      selectedService?.id === svc.id
                        ? "bg-[#00E5FF]/10 border-[#00E5FF]/30"
                        : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">{svc.name}</p>
                        {svc.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{svc.description}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" /> {formatDuration(svc.duration_minutes)}
                          </span>
                        </div>
                      </div>
                      <span className="flex items-center gap-0.5 text-sm font-bold text-white shrink-0">
                        <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                        {formatPrice(svc.price).replace("MX$", "").trim()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {staff.length > 1 && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  <User className="w-3.5 h-3.5 inline mr-1" />Staff (opcional)
                </label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#00E5FF]/30"
                >
                  <option value="">Sin preferencia</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            <button
              disabled={!selectedService}
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 disabled:opacity-40 text-black font-semibold py-3 rounded-xl transition-all"
            >
              Continuar <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ── STEP 2: DATE & TIME ─────────────────────────────── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-lg font-bold text-white mb-1">Elige fecha y hora</h2>
            <p className="text-sm text-gray-500 mb-5">{selectedService?.name} · {formatDuration(selectedService?.duration_minutes ?? 0)}</p>

            {/* Date strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
              {days.map((day) => {
                const { weekday, day: d, month } = formatDay(day);
                const isSelected = selectedDate === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(day)}
                    className={`flex-shrink-0 w-14 flex flex-col items-center py-3 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-gradient-to-br from-[#00E5FF] to-[#7000FF] border-transparent text-black"
                        : "bg-white/[0.03] border-white/[0.07] text-gray-400 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wide">{weekday}</span>
                    <span className="text-lg font-black">{d}</span>
                    <span className="text-[10px]">{month}</span>
                  </button>
                );
              })}
            </div>

            {/* Time slots */}
            {selectedDate && (
              <>
                <p className="text-xs text-gray-500 mb-3 capitalize">{formatFullDate(selectedDate)}</p>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Buscando horarios...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-gray-600 text-sm">No hay horarios disponibles este día. Elige otra fecha.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          selectedTime === slot
                            ? "bg-gradient-to-br from-[#00E5FF] to-[#7000FF] border-transparent text-black"
                            : "bg-white/[0.03] border-white/[0.07] text-gray-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        {formatTime12(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 px-4 py-3 text-sm text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] rounded-xl transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Atrás
              </button>
              <button
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 disabled:opacity-40 text-black font-semibold py-3 rounded-xl transition-all"
              >
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: CUSTOMER INFO ───────────────────────────── */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-lg font-bold text-white mb-1">Tus datos</h2>
            <p className="text-sm text-gray-500 mb-5">
              {selectedService?.name} · {formatFullDate(selectedDate)} · {formatTime12(selectedTime)}
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                  <User className="w-3.5 h-3.5" /> Nombre completo *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="María García"
                  autoComplete="name"
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                  <Phone className="w-3.5 h-3.5" /> Teléfono
                  <span className="text-gray-600">(para confirmación por WhatsApp)</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  autoComplete="tel"
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                  <Mail className="w-3.5 h-3.5" /> Email
                  <span className="text-gray-600">(para confirmación por correo)</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="maria@ejemplo.com"
                  autoComplete="email"
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                  <StickyNote className="w-3.5 h-3.5" /> Notas <span className="text-gray-600">(opcional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Instrucciones especiales, preferencias..."
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Summary box */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Resumen</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{selectedService?.name}</span>
                <span className="text-white font-semibold">{formatPrice(selectedService?.price ?? 0)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                <Calendar className="w-3 h-3" />
                <span className="capitalize">{formatFullDate(selectedDate)}</span>
                <span>·</span>
                <Clock className="w-3 h-3" />
                <span>{formatTime12(selectedTime)}</span>
              </div>
            </div>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">
                {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                disabled={submitting}
                className="flex items-center gap-1 px-4 py-3 text-sm text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] rounded-xl transition-all disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Atrás
              </button>
              <button
                disabled={!customerName.trim() || submitting}
                onClick={handleSubmit}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 disabled:opacity-40 text-black font-semibold py-3 rounded-xl transition-all shadow-lg shadow-[#00E5FF]/20"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Confirmar Reservación</>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-gray-700 mt-4">
              Powered by <span className="text-gray-600">Sky Reservation AI</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
