import Link from "next/link";

export default function BookingNotFound() {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">🔍</span>
      </div>
      <h1 className="text-xl font-bold text-white mb-2">Negocio no encontrado</h1>
      <p className="text-gray-500 text-sm mb-8">
        El enlace de reservación no es válido o el negocio ya no está disponible.
      </p>
      <Link
        href="/"
        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
