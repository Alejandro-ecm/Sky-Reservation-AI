"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Zap,
  MessageSquare,
  Phone,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Download,
  BarChart3,
  Shield,
  Globe,
  Star,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PLAN_GRADIENT: Record<string, string> = {
  starter: "from-slate-400 to-slate-500",
  pro: "from-blue-400 to-purple-500",
  enterprise: "from-amber-400 to-orange-500",
};

// ============================================================
// TYPES
// ============================================================

interface PlanLimits {
  plan: string;
  conversations_per_month: number;
  voice_minutes_per_month: number;
  whatsapp_messages_per_month: number;
  max_staff: number;
  max_locations: number;
  ai_model: string;
  has_api_access: boolean;
  has_advanced_analytics: boolean;
  has_automations: boolean;
  has_priority_support: boolean;
}

interface Subscription {
  tenant_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_ends_at: string | null;
  stripe_customer_id?: string | null;
  payment_provider?: string;
}

interface UsageStats {
  conversations: number;
  voice_minutes: number;
  whatsapp_messages: number;
}

interface Invoice {
  id: string;
  created_at: string;
  amount_cents: number;
  currency: string;
  status: string;
  invoice_url: string | null;
  payment_provider: string;
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    active: { label: "Activo", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    trialing: { label: "Prueba Gratis", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    past_due: { label: "Pago Pendiente", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    cancelled: { label: "Cancelado", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  };
  const cfg = configs[status] ?? configs.active;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ============================================================
// USAGE METER
// ============================================================

function UsageMeter({
  label,
  icon: Icon,
  used,
  limit,
  color,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  used: number;
  limit: number;
  color: string;
}) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isHigh = pct >= 80;
  const isFull = pct >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="text-gray-400">{label}</span>
        </div>
        <span className={`font-medium text-xs ${isFull ? "text-red-400" : isHigh ? "text-yellow-400" : "text-gray-300"}`}>
          {used.toLocaleString()} / {limit >= 999999 ? "∞" : limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${
            isFull
              ? "bg-red-500"
              : isHigh
              ? "bg-yellow-500"
              : `bg-gradient-to-r ${color.includes("blue") ? "from-blue-500 to-blue-400" : color.includes("green") ? "from-green-500 to-green-400" : "from-purple-500 to-purple-400"}`
          }`}
        />
      </div>
    </div>
  );
}

// ============================================================
// PLAN COMPARISON TABLE
// ============================================================

const PLAN_FEATURES: Array<{
  label: string;
  key: keyof PlanLimits | "price";
  starter: string;
  pro: string;
  enterprise: string;
}> = [
  { label: "Precio", key: "price", starter: "$49/mes", pro: "$149/mes", enterprise: "$399/mes" },
  { label: "Conversaciones/mes", key: "conversations_per_month", starter: "100", pro: "1,000", enterprise: "Ilimitadas" },
  { label: "Minutos de voz", key: "voice_minutes_per_month", starter: "60 min", pro: "600 min", enterprise: "Ilimitados" },
  { label: "Mensajes WhatsApp", key: "whatsapp_messages_per_month", starter: "200", pro: "2,000", enterprise: "Ilimitados" },
  { label: "Colaboradores", key: "max_staff", starter: "3", pro: "10", enterprise: "Ilimitados" },
  { label: "Sucursales", key: "max_locations", starter: "1", pro: "3", enterprise: "Ilimitadas" },
  { label: "Modelo IA", key: "ai_model", starter: "GPT-4o mini", pro: "GPT-4o mini", enterprise: "GPT-4o" },
  { label: "API Access", key: "has_api_access", starter: "—", pro: "—", enterprise: "✓" },
  { label: "Analytics avanzado", key: "has_advanced_analytics", starter: "—", pro: "✓", enterprise: "✓" },
  { label: "Automatizaciones", key: "has_automations", starter: "—", pro: "✓", enterprise: "✓" },
  { label: "Soporte prioritario", key: "has_priority_support", starter: "—", pro: "—", enterprise: "✓" },
];

function PlanTable({
  currentPlan,
  onSelectPlan,
}: {
  currentPlan: string;
  onSelectPlan: (plan: string, provider: "stripe" | "mercadopago") => void;
}) {
  const plans = ["starter", "pro", "enterprise"] as const;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-3 pr-4 text-gray-500 font-medium w-40">Característica</th>
            {plans.map((plan) => (
              <th key={plan} className="text-center py-3 px-4">
                <div
                  className={`inline-flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg ${
                    currentPlan === plan
                      ? "bg-blue-500/20 border border-blue-500/40"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <span className={`font-semibold capitalize text-sm ${currentPlan === plan ? "text-blue-300" : "text-gray-300"}`}>
                    {plan}
                    {currentPlan === plan && (
                      <span className="ml-1.5 text-xs text-blue-400">(actual)</span>
                    )}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PLAN_FEATURES.map((row) => (
            <tr key={row.key} className="border-t border-white/5">
              <td className="py-2.5 pr-4 text-gray-500 text-xs">{row.label}</td>
              {plans.map((plan) => {
                const val = row[plan];
                const isCurrent = currentPlan === plan;
                return (
                  <td
                    key={plan}
                    className={`py-2.5 px-4 text-center text-xs ${
                      isCurrent ? "text-blue-300 font-medium" : "text-gray-400"
                    }`}
                  >
                    {val === "✓" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                    ) : val === "—" ? (
                      <span className="text-gray-700">—</span>
                    ) : (
                      val
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {/* CTA row */}
          <tr className="border-t border-white/10">
            <td className="py-3 pr-4" />
            {plans.map((plan) => (
              <td key={plan} className="py-3 px-4 text-center">
                {currentPlan === plan ? (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Plan actual
                  </span>
                ) : (
                  <button
                    onClick={() => onSelectPlan(plan, "stripe")}
                    className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all"
                  >
                    Seleccionar
                  </button>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [usage, setUsage] = useState<UsageStats>({ conversations: 0, voice_minutes: 0, whatsapp_messages: 0 });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const fetchBillingData = useCallback(async () => {
    try {
      const [subRes, invoicesRes] = await Promise.all([
        fetch("/api/billing/subscription"),
        fetch("/api/billing/invoices").catch(() => null),
      ]);

      if (subRes.ok) {
        const json = (await subRes.json()) as {
          data: { subscription: Subscription; limits: PlanLimits; usage: UsageStats };
        };
        setSubscription(json.data.subscription);
        setLimits(json.data.limits);
        setUsage(json.data.usage);
      }

      if (invoicesRes?.ok) {
        const json = (await invoicesRes.json()) as { data: Invoice[] };
        setInvoices(json.data ?? []);
      }
    } catch (err) {
      console.error("Billing fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  async function handleOpenPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (json.url) window.location.href = json.url;
      else console.error("Portal error:", json.error);
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleSelectPlan(plan: string, provider: "stripe" | "mercadopago") {
    setCheckoutLoading(plan);
    try {
      const appUrl = window.location.origin;

      if (provider === "stripe") {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            successUrl: `${appUrl}/billing?success=true`,
            cancelUrl: `${appUrl}/billing?cancelled=true`,
          }),
        });
        const json = (await res.json()) as { url?: string; error?: string };
        if (json.url) window.location.href = json.url;
      } else {
        const res = await fetch("/api/billing/mercadopago/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const json = (await res.json()) as { url?: string; error?: string };
        if (json.url) window.location.href = json.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setCheckoutLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando información de facturación...</span>
        </div>
      </div>
    );
  }

  const plan = subscription?.plan ?? "starter";
  const periodEnd = subscription?.current_period_end ?? subscription?.trial_ends_at;

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Facturación</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gestiona tu suscripción, plan y historial de pagos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ====================================================
            LEFT COLUMN — Current Plan Card
        ==================================================== */}
        <div className="lg:col-span-1 space-y-4">
          {/* Current Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/60 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Plan actual</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xl font-bold capitalize bg-gradient-to-r ${PLAN_GRADIENT[plan] ?? "from-gray-400 to-gray-500"} bg-clip-text text-transparent`}
                  >
                    {plan}
                  </span>
                  <StatusBadge status={subscription?.status ?? "trialing"} />
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-blue-400" />
              </div>
            </div>

            {periodEnd && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                <Clock className="w-3.5 h-3.5" />
                Hasta{" "}
                {format(new Date(periodEnd), "d 'de' MMMM, yyyy", { locale: es })}
              </div>
            )}

            {subscription?.cancel_at_period_end && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-4">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <p className="text-xs text-yellow-300">
                  Tu suscripción no se renovará al final del período.
                </p>
              </div>
            )}

            {/* Usage Meters */}
            {limits && (
              <div className="space-y-3 mb-5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Uso este mes
                </p>
                <UsageMeter
                  label="Conversaciones"
                  icon={MessageSquare}
                  used={usage.conversations}
                  limit={limits.conversations_per_month}
                  color="text-blue-400"
                />
                <UsageMeter
                  label="Minutos de voz"
                  icon={Phone}
                  used={usage.voice_minutes}
                  limit={limits.voice_minutes_per_month}
                  color="text-green-400"
                />
                <UsageMeter
                  label="WhatsApp"
                  icon={MessageSquare}
                  used={usage.whatsapp_messages}
                  limit={limits.whatsapp_messages_per_month}
                  color="text-purple-400"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm rounded-xl transition-all"
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Gestionar Facturación
                <ExternalLink className="w-3 h-3 ml-auto" />
              </button>
            </div>
          </motion.div>

          {/* Payment Provider Selector */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/60 border border-white/10 rounded-2xl p-5"
          >
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Método de pago
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleSelectPlan(plan === "starter" ? "pro" : plan, "stripe")}
                disabled={!!checkoutLoading}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm text-gray-300"
              >
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span>Pagar con Stripe</span>
                <span className="ml-auto text-xs text-gray-600">Internacional</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <button
                onClick={() => handleSelectPlan(plan === "starter" ? "pro" : plan, "mercadopago")}
                disabled={!!checkoutLoading}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm text-gray-300"
              >
                <Globe className="w-4 h-4 text-blue-300" />
                <span>Pagar con Mercado Pago</span>
                <span className="ml-auto text-xs text-gray-600">LATAM</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* ====================================================
            RIGHT COLUMN — Plan Table + Invoices
        ==================================================== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gray-900/60 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-base font-semibold text-white">Comparar Planes</h2>
            </div>
            <PlanTable
              currentPlan={plan}
              onSelectPlan={(p, provider) => handleSelectPlan(p, provider)}
            />
          </motion.div>

          {/* Invoice History */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gray-900/60 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-400" />
              </div>
              <h2 className="text-base font-semibold text-white">Historial de Pagos</h2>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No hay facturas todavía.</p>
                <p className="text-xs text-gray-700 mt-1">
                  Las facturas aparecerán aquí después de tu primer pago.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-white/10">
                      <th className="pb-2 text-xs text-gray-500 font-medium">Fecha</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium">Monto</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium">Proveedor</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium">Estado</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="py-3 text-gray-400 text-xs">
                          {format(new Date(invoice.created_at), "d MMM yyyy", { locale: es })}
                        </td>
                        <td className="py-3 text-white font-medium text-xs">
                          {(invoice.amount_cents / 100).toLocaleString("es-AR", {
                            style: "currency",
                            currency: invoice.currency.toUpperCase(),
                          })}
                        </td>
                        <td className="py-3 text-gray-400 text-xs capitalize">
                          {invoice.payment_provider}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                              invoice.status === "paid"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : invoice.status === "failed"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            }`}
                          >
                            {invoice.status === "paid"
                              ? "Pagado"
                              : invoice.status === "failed"
                              ? "Fallido"
                              : "Pendiente"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {invoice.invoice_url ? (
                            <a
                              href={invoice.invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Ver
                            </a>
                          ) : (
                            <span className="text-xs text-gray-700">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
