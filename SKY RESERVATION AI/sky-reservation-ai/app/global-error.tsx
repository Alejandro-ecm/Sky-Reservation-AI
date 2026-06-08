"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#050505", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          {/* Neural glow orb */}
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)",
              filter: "blur(80px)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #00E5FF, #7000FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              flexShrink: 0,
              boxShadow: "0 0 32px rgba(0,229,255,0.25)",
            }}
          >
            ⚠
          </div>

          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "#fff",
                margin: "0 0 0.5rem",
                letterSpacing: "-0.02em",
              }}
            >
              Algo salió mal
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", margin: 0 }}>
              {error.digest ? `Error ${error.digest}` : "Error inesperado en la aplicación."}
            </p>
          </div>

          <button
            onClick={reset}
            style={{
              background: "linear-gradient(135deg, #00E5FF, #7000FF)",
              color: "#000",
              fontWeight: 700,
              fontSize: "0.875rem",
              padding: "0.625rem 1.5rem",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(0,229,255,0.3)",
            }}
          >
            Reintentar
          </button>

          <a
            href="/"
            style={{
              color: "rgba(0,229,255,0.6)",
              fontSize: "0.75rem",
              textDecoration: "none",
            }}
          >
            ← Volver al inicio
          </a>
        </div>
      </body>
    </html>
  );
}
