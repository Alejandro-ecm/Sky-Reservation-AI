import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservar cita",
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-lg mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
