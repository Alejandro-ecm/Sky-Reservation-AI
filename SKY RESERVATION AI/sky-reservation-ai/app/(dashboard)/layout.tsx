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
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 15% 20%, rgba(79,70,229,0.07) 0%, transparent 55%), radial-gradient(ellipse at 88% 82%, rgba(139,92,246,0.05) 0%, transparent 55%), #050505" }}
    >
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
}
