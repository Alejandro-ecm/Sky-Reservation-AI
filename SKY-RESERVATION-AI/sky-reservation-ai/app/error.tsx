"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="bg-black min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Algo salió mal</h1>
          <p className="text-gray-400 mb-8 text-sm">
            Ocurrió un error inesperado. Nuestro equipo ha sido notificado.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-600 mb-6 font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg border border-white/10 transition-colors"
            >
              <Home className="w-4 h-4" />
              Inicio
            </Link>
          </div>
        </motion.div>
      </body>
    </html>
  );
}
