"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  Phone,
  MessagesSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  Zap,
  CreditCard,
  UserCog,
  Scissors,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";

const navItems = [
  { label: "Dashboard",       href: "/dashboard",      icon: LayoutDashboard },
  { label: "Reservaciones",   href: "/reservations",   icon: Calendar },
  { label: "Conversaciones",  href: "/conversations",  icon: MessageSquare },
  { label: "CRM",             href: "/crm",            icon: Users },
  { label: "Analytics",       href: "/analytics",      icon: BarChart3 },
  { label: "Voice AI",        href: "/voice-ai",       icon: Phone },
  { label: "WhatsApp AI",     href: "/whatsapp",       icon: MessagesSquare },
  { label: "Automatizaciones",href: "/automations",    icon: Zap },
  { label: "Staff",           href: "/staff",          icon: UserCog },
  { label: "Servicios",       href: "/services",       icon: Scissors },
  { label: "Facturación",     href: "/billing",        icon: CreditCard },
  { label: "Configuración",   href: "/settings",       icon: Settings },
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { tenant } = useUser();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    router.push("/login");
    router.refresh();
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex-shrink-0 h-screen bg-[#0D0D0D] border-r border-white/[0.06] flex flex-col z-20"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-lg whitespace-nowrap overflow-hidden"
              >
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Sky
                </span>
                <span className="text-white"> AI</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#1a1a1a] border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors z-30 shadow-lg"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
              )}
            >
              <item.icon
                className={cn(
                  "w-4.5 h-4.5 flex-shrink-0",
                  isActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-200"
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-full"
                />
              )}

              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-[#1a1a1a] border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Tenant badge */}
      <div className="px-2 py-2 border-t border-white/[0.06]">
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]",
          collapsed && "justify-center"
        )}>
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden min-w-0"
              >
                <p className="text-xs font-medium text-white truncate">
                  {tenant?.name ?? "Mi Empresa"}
                </p>
                <p className="text-xs text-gray-600 capitalize">
                  {tenant?.plan ? `Plan ${tenant.plan}` : "Plan Starter"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:text-red-400" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Cerrar Sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
