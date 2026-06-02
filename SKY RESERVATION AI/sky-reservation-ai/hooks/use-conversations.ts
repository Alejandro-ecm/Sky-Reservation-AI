"use client";

import { useEffect, useState, useCallback } from "react";
import type { Conversation, ConversationChannel, ConversationStatus } from "@/types";

interface UseConversationsOptions {
  status?: ConversationStatus;
  channel?: ConversationChannel;
  page?: number;
  perPage?: number;
}

interface ConversationsData {
  conversations: Conversation[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useConversations(options: UseConversationsOptions = {}): ConversationsData {
  const { status, channel, page = 1, perPage = 30 } = options;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchConversations() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(perPage),
        });
        if (status) params.set("status", status);
        if (channel) params.set("channel", channel);

        const res = await fetch(`/api/conversations?${params}`);
        if (!res.ok) {
          const data = await res.json() as { error?: string };
          throw new Error(data.error ?? "Failed to fetch conversations");
        }

        const data = await res.json() as { data?: Conversation[]; total?: number };
        setConversations(data.data ?? []);
        setTotal(data.total ?? 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversations();
  }, [status, channel, page, perPage, refreshKey]);

  return { conversations, total, isLoading, error, refresh };
}
