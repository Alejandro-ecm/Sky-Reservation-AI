import type { Metadata } from "next";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";

export const metadata: Metadata = {
  title: {
    template: "%s | Sky Reservation AI",
    default: "Dashboard | Sky Reservation AI",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#050505] relative overflow-x-hidden">
      {/* Neural mesh gradient — cyan orb top-right */}
      <div
        className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)", filter: "blur(120px)" }}
      />
      {/* Neural mesh gradient — purple orb bottom-left */}
      <div
        className="absolute bottom-[-10%] left-[5%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(112,0,255,0.06) 0%, transparent 70%)", filter: "blur(120px)" }}
      />

      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
}
