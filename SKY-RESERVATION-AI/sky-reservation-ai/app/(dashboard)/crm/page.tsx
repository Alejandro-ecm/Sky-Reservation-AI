"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Plus,
  TrendingUp,
  Mail,
  Phone,
  Tag,
  Filter,
  ChevronDown,
  ChevronRight,
  Bot,
  Loader2,
  Calendar,
  MessageSquare,
  X,
} from "lucide-react";
import { formatRelative } from "@/lib/utils/format";

// ============================================================
// TYPES
// ============================================================

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  tags: string[];
  lead_score: number;
  last_contact_at: string | null;
  total_reservations: number;
  created_at: string;
  metadata: Record<string, unknown>;
}

// ============================================================
// TAG COLORS
// ============================================================

const tagColors: Record<string, string> = {
  VIP: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
  Fiel: "bg-[#00E5FF]/10 border-[#00E5FF]/20 text-[#00E5FF]",
  Nuevo: "bg-green-500/10 border-green-500/20 text-green-400",
  Recurrente: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  Inactivo: "bg-red-500/10 border-red-500/20 text-red-400",
};

function getTagColor(tag: string) {
  return tagColors[tag] ?? "bg-gray-500/10 border-gray-500/20 text-gray-400";
}

// ============================================================
// SCORE BAR
// ============================================================

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-bold w-7 text-right ${score >= 75 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
        {score}
      </span>
    </div>
  );
}

// ============================================================
// ADD CUSTOMER FORM
// ============================================================

function AddCustomerForm({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="glass-card p-5 border border-[#00E5FF]/20 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Nuevo Cliente</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
        {error && (
          <div className="col-span-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre *"
          required
          className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Teléfono"
          className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30"
        />
        <div className="col-span-3 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-white px-4 py-2 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] text-black text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Guardar Cliente
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ============================================================
// CUSTOMER DETAIL PANEL
// ============================================================

function CustomerDetail({
  customer,
  onScore,
  scoring,
  scoreResult,
}: {
  customer: Customer;
  onScore: (id: string) => void;
  scoring: boolean;
  scoreResult: { score: number; reasoning: string } | null;
}) {
  return (
    <motion.td
      colSpan={7}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white/[0.02] border-t border-b border-white/[0.04] px-5 py-4 space-y-3">
        <div className="grid grid-cols-3 gap-4">
          {/* Info */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Información</p>
            <div className="space-y-1">
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                  {customer.phone}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  {customer.email}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                {customer.total_reservations} reservaciones
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                {customer.last_contact_at
                  ? `Último contacto: ${formatRelative(customer.last_contact_at)}`
                  : "Sin contactos registrados"}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {customer.tags.length > 0 ? (
                customer.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs px-2.5 py-1 rounded-full border ${getTagColor(tag)}`}
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-600">Sin tags</span>
              )}
            </div>
          </div>

          {/* AI Score */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              AI Lead Score
            </p>
            <div className="space-y-2">
              <ScoreBar score={customer.lead_score} />
              <button
                onClick={() => onScore(customer.id)}
                disabled={scoring}
                className="flex items-center gap-2 text-xs bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
              >
                {scoring ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Bot className="w-3 h-3" />
                )}
                {scoring ? "Analizando..." : "Actualizar Score con IA"}
              </button>
              {scoreResult && (
                <p className="text-xs text-gray-400 leading-relaxed">
                  {scoreResult.reasoning}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.td>
  );
}

// ============================================================
// PAGE
// ============================================================

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const rowItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [scoreMin, setScoreMin] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [scoreResults, setScoreResults] = useState<Record<string, { score: number; reasoning: string }>>({});

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "50" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (scoreMin) params.set("score_min", scoreMin);

      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json() as { data?: Customer[]; total?: number };
      setCustomers(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, scoreMin]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const handleScoreLead = async (customerId: string) => {
    setScoringId(customerId);
    try {
      const res = await fetch("/api/ai/score-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json() as { score?: number; reasoning?: string };
      if (data.score !== undefined) {
        setScoreResults((prev) => ({
          ...prev,
          [customerId]: { score: data.score!, reasoning: data.reasoning ?? "" },
        }));
        // Update customer in list
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customerId ? { ...c, lead_score: data.score! } : c
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScoringId(null);
    }
  };

  const avgScore =
    customers.length > 0
      ? Math.round(customers.reduce((s, c) => s + c.lead_score, 0) / customers.length)
      : 0;

  const vipCount = customers.filter((c) => c.tags.includes("VIP")).length;
  const inactiveCount = customers.filter((c) => c.lead_score < 30).length;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-[1400px]"
    >
      {/* Header */}
      <motion.div variants={rowItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">CRM</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} clientes registrados</p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 text-black text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-[#00E5FF]/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </motion.div>

      {/* Add Customer Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div variants={rowItem} key="add-form">
            <AddCustomerForm
              onSuccess={fetchCustomers}
              onClose={() => setShowAddForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <motion.div variants={rowItem} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Clientes", value: total, icon: Users, color: "text-[#00E5FF]", bg: "bg-[#00E5FF]/10 border-[#00E5FF]/20" },
          { label: "Score Promedio", value: `${avgScore}/100`, icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
          { label: "VIP", value: vipCount, icon: Tag, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
          { label: "Score Bajo", value: inactiveCount, icon: Users, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
        ].map((stat) => (
          <div key={stat.label} className={`glass-card p-4 border ${stat.bg}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} border flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-lg font-bold text-white">{loading ? "—" : stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={rowItem} className="glass-card p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o email..."
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 bg-white/[0.04] border rounded-xl px-4 py-2.5 text-sm transition-colors ${
              showFilters
                ? "border-[#00E5FF]/30 text-[#00E5FF]"
                : "border-white/[0.07] text-gray-400 hover:text-white"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-3 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Score mínimo:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreMin}
                  onChange={(e) => setScoreMin(e.target.value)}
                  placeholder="0"
                  className="w-20 bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-[#00E5FF]/30"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Table */}
      <motion.div variants={rowItem} className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando clientes...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Cliente", "Contacto", "Tags", "Lead Score", "Última Actividad", "Reservaciones", ""].map(
                    (col) => (
                      <th key={col} className="text-left text-xs font-medium text-gray-500 px-5 py-4">
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, i) => (
                  <>
                    <motion.tr
                      key={`row-${customer.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() =>
                        setExpandedId(expandedId === customer.id ? null : customer.id)
                      }
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00E5FF]/15 to-[#7000FF]/15 border border-[#00E5FF]/20 flex items-center justify-center text-sm font-bold text-[#00E5FF]">
                            {customer.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-white">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Phone className="w-3 h-3" /> {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Mail className="w-3 h-3" /> {customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {customer.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`text-xs px-2 py-0.5 rounded-full border ${getTagColor(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 w-36">
                        <ScoreBar score={customer.lead_score} />
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {customer.last_contact_at
                          ? formatRelative(customer.last_contact_at)
                          : "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {customer.total_reservations ?? 0}
                      </td>
                      <td className="px-5 py-4">
                        {expandedId === customer.id ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </td>
                    </motion.tr>

                    {/* Expanded Detail Row */}
                    <AnimatePresence>
                      {expandedId === customer.id && (
                        <tr key={`detail-${customer.id}`}>
                          <CustomerDetail
                            customer={customer}
                            onScore={handleScoreLead}
                            scoring={scoringId === customer.id}
                            scoreResult={scoreResults[customer.id] ?? null}
                          />
                        </tr>
                      )}
                    </AnimatePresence>
                  </>
                ))}
              </tbody>
            </table>

            {customers.length === 0 && !loading && (
              <div className="py-20 text-center">
                <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron clientes</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
