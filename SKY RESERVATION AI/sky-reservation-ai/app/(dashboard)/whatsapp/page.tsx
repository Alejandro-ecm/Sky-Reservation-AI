"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Search,
  Settings,
  Users,
  Clock,
  Activity,
  Bot,
  Loader2,
  CheckCheck,
  PhoneCall,
  Circle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatRelative, formatTime } from "@/lib/utils/format";

// ============================================================
// TYPES
// ============================================================

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
  customer?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
}

// ============================================================
// ANIMATIONS
// ============================================================

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// ============================================================
// CONVERSATION LIST ITEM
// ============================================================

function ConvoItem({
  convo,
  selected,
  onClick,
}: {
  convo: Conversation;
  selected: boolean;
  onClick: () => void;
}) {
  const lastMsg = convo.messages[convo.messages.length - 1];
  const unreadCount = convo.messages.filter(
    (m) => m.role === "user"
  ).length;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 transition-all border-b border-white/[0.04] ${
        selected ? "bg-green-500/[0.08]" : "hover:bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 flex items-center justify-center text-sm font-bold text-green-400">
            {(convo.customer?.name ?? "?").charAt(0).toUpperCase()}
          </div>
          {convo.status === "active" && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#0A0A0A] rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white truncate">
              {convo.customer?.name ?? convo.customer?.phone ?? "Desconocido"}
            </p>
            <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">
              {formatRelative(convo.updated_at)}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {lastMsg ? (lastMsg.role === "assistant" ? "✓ " : "") + lastMsg.content : "Sin mensajes"}
          </p>
        </div>
        {unreadCount > 0 && !selected && (
          <span className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}

// ============================================================
// CHAT PANEL
// ============================================================

function ChatPanel({
  conversation,
  onSend,
  sending,
}: {
  conversation: Conversation | null;
  onSend: (text: string) => void;
  sending: boolean;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-green-500" />
        </div>
        <p className="text-gray-400 font-medium">Selecciona una conversación</p>
        <p className="text-gray-600 text-sm mt-1">
          Los mensajes de WhatsApp aparecerán aquí
        </p>
      </div>
    );
  }

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 flex items-center justify-center text-sm font-bold text-green-400">
          {(conversation.customer?.name ?? "?").charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {conversation.customer?.name ?? "Desconocido"}
          </p>
          <p className="text-xs text-gray-500">
            {conversation.customer?.phone ?? "Sin número"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs ${conversation.status === "active" ? "text-green-400" : "text-gray-500"}`}>
            <Circle className="w-2 h-2 fill-current" />
            {conversation.status === "active" ? "Activo" : "Inactivo"}
          </span>
          <button className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white transition-all">
            <PhoneCall className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "assistant" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-green-600 text-white rounded-br-sm"
                  : "bg-white/[0.06] text-gray-200 rounded-bl-sm"
              }`}
            >
              {msg.content}
              <div
                className={`flex items-center gap-1 mt-1 ${
                  msg.role === "assistant" ? "justify-end" : "justify-start"
                }`}
              >
                <span className="text-[10px] opacity-60">
                  {formatTime(msg.timestamp)}
                </span>
                {msg.role === "assistant" && (
                  <CheckCheck className="w-3 h-3 opacity-60" />
                )}
                {msg.role === "assistant" && (
                  <span title="Respuesta AI">
                    <Bot className="w-3 h-3 opacity-60" />
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-transparent text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-8 h-8 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-xl flex items-center justify-center transition-all"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function WhatsAppPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  const selectedConvo = conversations.find((c) => c.id === selectedId) ?? null;

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/messages?per_page=50");
      const data = await res.json() as { data?: Conversation[]; total?: number };
      setConversations(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConversations();
    // Poll every 30s
    const interval = setInterval(fetchConversations, 30_000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const filteredConvos = useMemo(() => {
    if (!search) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.customer?.name?.toLowerCase().includes(q) ||
        c.customer?.phone?.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const { activeCount, autoResponded } = useMemo(() => ({
    activeCount: conversations.filter((c) => c.status === "active").length,
    autoResponded: conversations.filter((c) =>
      c.messages.some((m) => m.role === "assistant")
    ).length,
  }), [conversations]);

  const handleSendMessage = async (text: string) => {
    if (!selectedConvo?.customer?.phone) return;
    setSending(true);
    try {
      await fetch("/api/whatsapp/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedConvo.customer.phone,
          message: text,
          tenantId: "",
        }),
      });
      await fetchConversations();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-[1400px]"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">WhatsApp AI</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Asistente inteligente para mensajes de WhatsApp
          </p>
        </div>
        <button
          onClick={() => router.push("/settings?tab=ai")}
          className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] text-gray-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
        >
          <Settings className="w-4 h-4" />
          Configurar AI
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Conversaciones", value: total, icon: MessageCircle, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
          { label: "Auto-respondidas", value: autoResponded, icon: Bot, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Tiempo Prom.", value: "< 1s", icon: Clock, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
          { label: "Activas Ahora", value: activeCount, icon: Activity, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
        ].map((stat) => (
          <div key={stat.label} className={`glass-card p-4 border ${stat.bg}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} border flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-2xl font-black text-white">
                  {loading ? "—" : stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Chat Interface */}
      <motion.div
        variants={item}
        className="glass-card overflow-hidden flex"
        style={{ height: "600px" }}
      >
        {/* Left Panel — Conversation List */}
        <div className="w-80 flex-shrink-0 border-r border-white/[0.06] flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conversaciones..."
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-9 pr-4 py-2 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-green-500/40"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
              </div>
            ) : filteredConvos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Users className="w-8 h-8 text-gray-700 mb-3" />
                <p className="text-sm text-gray-500">Sin conversaciones</p>
                <p className="text-xs text-gray-600 mt-1">
                  Los mensajes de clientes aparecerán aquí
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredConvos.map((convo) => (
                  <ConvoItem
                    key={convo.id}
                    convo={convo}
                    selected={selectedId === convo.id}
                    onClick={() => setSelectedId(convo.id)}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right Panel — Chat */}
        <ChatPanel
          conversation={selectedConvo}
          onSend={handleSendMessage}
          sending={sending}
        />
      </motion.div>
    </motion.div>
  );
}
