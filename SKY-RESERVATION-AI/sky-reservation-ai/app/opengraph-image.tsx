import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Sky Reservation AI — Automatiza tu Negocio con IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0f0f",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Gradient orb background */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)",
          }}
        />

        {/* Logo badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #3b82f6, #a855f7)",
            marginBottom: 32,
            fontSize: 48,
            fontWeight: 700,
            color: "white",
          }}
        >
          S
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            marginBottom: 16,
            lineHeight: 1.1,
          }}
        >
          Sky Reservation AI
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            color: "#9ca3af",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Automatiza tu negocio con IA. Reservas, llamadas y WhatsApp 24/7.
        </div>

        {/* Bottom pill */}
        <div
          style={{
            marginTop: 48,
            padding: "10px 28px",
            borderRadius: 999,
            background: "rgba(59,130,246,0.15)",
            border: "1px solid rgba(59,130,246,0.4)",
            color: "#93c5fd",
            fontSize: 18,
          }}
        >
          skyreservation.ai
        </div>
      </div>
    ),
    { ...size }
  );
}
