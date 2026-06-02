"use client";

import { useEffect, useState, useCallback } from "react";
import type { Reservation, ReservationStatus } from "@/types";

interface UseReservationsOptions {
  status?: ReservationStatus;
  page?: number;
  perPage?: number;
}

interface ReservationsData {
  reservations: Reservation[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useReservations(options: UseReservationsOptions = {}): ReservationsData {
  const { status, page = 1, perPage = 20 } = options;
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchReservations() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(perPage),
        });
        if (status) params.set("status", status);

        const res = await fetch(`/api/reservations?${params}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to fetch reservations");
        }

        const data = await res.json();
        setReservations(data.data ?? []);
        setTotal(data.total ?? 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchReservations();
  }, [status, page, perPage, refreshKey]);

  return { reservations, total, isLoading, error, refresh };
}
