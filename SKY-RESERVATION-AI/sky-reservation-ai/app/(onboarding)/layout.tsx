"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TOTAL_STEPS = 4;

// Extract step from query param is done client-side; layout just renders shell
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#7000FF] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-[#00E5FF] to-[#7000FF] bg-clip-text text-transparent">
            Sky
          </span>
          <span className="text-xl font-bold text-white">AI</span>
        </Link>
        <span className="text-sm text-gray-500">Configuración inicial</span>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">{children}</div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-4 text-center">
        <p className="text-xs text-gray-600">
          © 2026 Sky Reservation AI. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
