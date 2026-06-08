import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-sm">
            S
          </div>
          <span className="font-bold text-white text-sm">Sky Reservation AI</span>
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        {children}
      </main>
      <footer className="border-t border-white/[0.06] px-6 py-6 text-center text-xs text-gray-600">
        © 2026 Sky Technologies LATAM. Todos los derechos reservados.
      </footer>
    </div>
  );
}
