"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[Dashboard Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center text-center max-w-sm gap-5"
      >
        <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            Ha ocurrido un error en el módulo
          </h2>
          <p className="text-sm text-white/40 leading-relaxed">
            Nuestro equipo ha sido notificado. Puedes intentar recargar el
            módulo o volver al dashboard principal.
          </p>
          {error.digest && (
            <p className="text-xs text-white/20 font-mono pt-1">
              ref: {error.digest}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reintentar
          </button>
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/8 transition-colors"
          >
            Ir al inicio
          </a>
        </div>
      </motion.div>
    </div>
  );
}
