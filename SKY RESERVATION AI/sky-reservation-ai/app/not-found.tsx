import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-8">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <p className="text-blue-400 text-sm font-mono mb-4">404</p>
      <h1 className="text-4xl font-bold text-white mb-3">Página no encontrada</h1>
      <p className="text-gray-400 mb-8 max-w-sm">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
