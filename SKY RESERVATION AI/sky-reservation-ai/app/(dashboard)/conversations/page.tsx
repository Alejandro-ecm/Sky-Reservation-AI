"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Phone, Search, Clock, Bot, User, Loader2 } from "lucide-react";
import { formatRelative, formatTime } from "@/lib/utils/format";
import { useConversations } from "@/hooks/use-conversations";
import { Skeleton } from "@/components/ui/skeleton";
import type { Conversation, ConversationChannel, ConversationStatus, Message } from "@/types";

const channelConfig: Record<ConversationChannel, { icon: typeof MessageSquare; color: string; bg: string; label: string }> = {
  whatsapp: { icon: MessageSquare, color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20",   label: "WhatsApp" },
  voice:    { icon: Phone,         color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",     label: "Llamada" },
  sms:      { icon: MessageSquare, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", label: "SMS" },
  web:      { icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", label: "Web" },
};

const statusDot: Record<ConversationStatus, string> = {
  active:   "bg-green-500",
  resolved: "bg-gray-500",
  pending:  "bg-yellow-500",
  missed:   "bg-red-500",
};

function lastMessagePreview(conv: Conversation): string {
  const msgs = conv.messages;
  if (!msgs?.length) return "Sin mensajes";
  return msgs[msgs.length - 1].content;
}

function customerName(conv: Conversation): string {
  return conv.customer?.name ?? "Desconocido";
}

export default function ConversationsPage() {
  const { conversations, isLoading, error } = useConversations({ perPage: 50 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) =>
    customerName(c).toLowerCase().includes(search.toLowerCase())
  );

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-[calc(100vh-8rem)] flex gap-6 max-w-[1400px]"
    >
      {/* Left panel */}
      <div className="w-80 flex-shrink-0 flex flex-col glass-card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h1 className="font-bold text-white mb-3">Conversaciones</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-9 pr-4 py-2 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {isLoading && (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 text-center">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Sin conversaciones</p>
              </div>
            </div>
          )}

          {!isLoading && filtered.map((conv) => {
            const channel = channelConfig[conv.channel];
            const ChannelIcon = channel.icon;
            const name = customerName(conv);
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full flex items-start gap-3 p-4 text-left border-b border-white/[0.04] transition-colors ${
                  selectedId === conv.id
                    ? "bg-blue-600/10 border-l-2 border-l-blue-500"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400 flex-shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0D0D0D] ${statusDot[conv.status]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white truncate">{name}</span>
                    <span className="text-xs text-gray-600 flex-shrink-0">{formatRelative(conv.updated_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{lastMessagePreview(conv)}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md border ${channel.bg} ${channel.color}`}>
                      <ChannelIcon className="w-2.5 h-2.5" />
                      {channel.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat panel */}
      {selected ? (
        <ConversationDetail conv={selected} />
      ) : (
        <div className="flex-1 glass-card flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">Selecciona una conversación</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ConversationDetail({ conv }: { conv: Conversation }) {
  const name = conv.customer?.name ?? "Desconocido";
  const messages: Message[] = conv.messages ?? [];

  return (
    <div className="flex-1 flex flex-col glass-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelative(conv.updated_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No hay mensajes en esta conversación</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg.id ?? i}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-start" : "justify-end"}`}
            >
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-gray-300" />
                </div>
              )}
              <div
                className={`max-w-sm rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-white/[0.06] text-gray-200 rounded-tl-none"
                    : "bg-blue-600/20 border border-blue-500/20 text-blue-100 rounded-tr-none"
                }`}
              >
                {msg.content}
                <p className="text-[10px] text-gray-500 mt-1">{formatTime(msg.timestamp)}</p>
              </div>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
