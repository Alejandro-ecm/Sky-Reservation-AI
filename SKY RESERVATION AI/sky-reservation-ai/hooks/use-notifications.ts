"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface AppNotification {
  id: string;
  tenant_id: string;
  user_id: string | null;
  type: "new_reservation" | "missed_call" | "new_customer" | "system";
  title: string;
  body: string;
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface UseNotificationsReturn {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const json = (await res.json()) as { data: AppNotification[] };
      setNotifications(json.data ?? []);
    } catch (err) {
      console.error("useNotifications fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();

    // Poll every 60 seconds
    intervalRef.current = setInterval(() => {
      void fetchNotifications();
    }, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    // Optimistic update
    setNotifications([]);
    try {
      await fetch("/api/notifications", { method: "POST" });
    } catch (err) {
      console.error("markAllRead error:", err);
      // Re-fetch on error
      await fetchNotifications();
    }
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, { method: "PUT" });
    } catch (err) {
      console.error("markRead error:", err);
    }
  }, []);

  const dismiss = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("dismiss error:", err);
    }
  }, []);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    loading,
    markAllRead,
    markRead,
    dismiss,
    refetch: fetchNotifications,
  };
}
