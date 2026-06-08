import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen text-zinc-300"
      style={{ background: "radial-gradient(ellipse at 20% 10%, rgba(0,229,255,0.04) 0%, transparent 50%), #050505" }}
    >
      {/* Header */}
      <header className="border-b border-white/[0.05] bg-zinc-950/80 backdrop-blur-xl px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 w-fit group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#7000FF] flex items-center justify-center shadow-sm shadow-[#00E5FF]/20 group-hover:shadow-[#00E5FF]/35 transition-all duration-300">
              <Sparkles className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-bold text-sm text-white">
              Sky <span className="text-zinc-500">Reservation AI</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-14">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">© 2026 Sky Technologies LATAM. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6 text-xs text-zinc-600">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacidad</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Términos</Link>
            <Link href="/docs" className="hover:text-zinc-300 transition-colors">API Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
