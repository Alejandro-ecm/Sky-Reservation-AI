"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Building2,
  Check,
  Calendar,
  Phone,
  Users,
  AlertCircle,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getInitials, formatRelative } from "@/lib/utils/format";
import { useNotifications, type AppNotification } from "@/hooks/use-notifications";
import { useUser } from "@/hooks/use-user";

function notifTypeIcon(type: AppNotification["type"]) {
  switch (type) {
    case "new_reservation":
      return <Calendar className="w-3.5 h-3.5 text-indigo-400" />;
    case "missed_call":
      return <Phone className="w-3.5 h-3.5 text-red-400" />;
    case "new_customer":
      return <Users className="w-3.5 h-3.5 text-emerald-400" />;
    default:
      return <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />;
  }
}

const dropdownClass =
  "absolute right-0 top-full mt-2 bg-zinc-950/95 backdrop-blur-xl border border-white/[0.09] rounded-2xl shadow-2xl overflow-hidden";

export function DashboardHeader() {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [tenantOpen, setTenantOpen] = useState(false);

  const { profile, tenant, isLoading: userLoading } = useUser();
  const { notifications, unreadCount, markAllRead, markRead, dismiss } =
    useNotifications();

  const displayName   = profile?.full_name ?? profile?.email?.split("@")[0] ?? "Usuario";
  const displayEmail  = profile?.email ?? "";
  const displayRole   = profile?.role ?? "owner";
  const displayTenant = tenant?.name ?? "Mi Empresa";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    router.push("/login");
    router.refresh();
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    toast.success("Todas las notificaciones marcadas como leídas");
  };

  const closeAll = () => {
    setNotifOpen(false);
    setUserMenuOpen(false);
    setTenantOpen(false);
  };

  return (
    <header className="h-16 bg-zinc-950/80 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between px-6 flex-shrink-0 relative z-10">

      {/* Search — pill style */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar reservaciones, clientes..."
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-full pl-10 pr-4 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)] transition-all duration-300"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">

        {/* Tenant switcher — premium */}
        <div className="relative">
          <button
            onClick={() => {
              setTenantOpen(!tenantOpen);
              setNotifOpen(false);
              setUserMenuOpen(false);
            }}
            className="flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.14] rounded-xl px-3 py-2 text-sm text-zinc-300 transition-all duration-300"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-600/25 to-purple-600/20 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Building2 className="w-2.5 h-2.5 text-indigo-300" />
            </div>
            {userLoading ? (
              <span className="w-20 h-3 bg-white/10 rounded animate-pulse" />
            ) : (
              <span className="max-w-28 truncate">{displayTenant}</span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
          </button>

          <AnimatePresence>
            {tenantOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`${dropdownClass} w-56`}
              >
                <div className="p-2">
                  <p className="text-xs text-zinc-500 px-3 py-1.5 font-medium">
                    Empresa activa
                  </p>
                  <div className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm text-zinc-300 bg-white/[0.03]">
                    <span className="truncate">{displayTenant}</span>
                    <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setUserMenuOpen(false);
              setTenantOpen(false);
            }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-white/[0.14] text-zinc-400 hover:text-zinc-100 transition-all duration-300"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`${dropdownClass} w-80`}
              >
                {/* Header */}
                <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">Notificaciones</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-medium bg-indigo-600 text-white rounded-full px-1.5 py-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => void handleMarkAllRead()}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Marcar todas leídas
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-sm text-zinc-500">Sin notificaciones</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-start gap-3 p-4 hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] last:border-0 group ${
                          !n.read ? "bg-indigo-500/[0.04]" : ""
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0 mt-0.5">
                          {notifTypeIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white leading-tight">{n.title}</p>
                          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                          <p className="text-[10px] text-zinc-600 mt-1">{formatRelative(n.created_at)}</p>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.read && (
                            <button
                              onClick={() => void markRead(n.id)}
                              title="Marcar como leída"
                              className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-indigo-400 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => void dismiss(n.id)}
                            title="Descartar"
                            className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-2 border-t border-white/[0.05]">
                  <button
                    onClick={() => { router.push("/settings"); closeAll(); }}
                    className="w-full text-xs text-center text-zinc-500 hover:text-zinc-200 py-1.5 transition-colors"
                  >
                    Ver configuración de notificaciones
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setNotifOpen(false);
              setTenantOpen(false);
            }}
            className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-white/[0.14] rounded-xl px-2.5 py-1.5 transition-all duration-300"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shadow-indigo-500/30">
              {userLoading ? "…" : getInitials(displayName)}
            </div>
            <div className="hidden sm:block text-left">
              {userLoading ? (
                <div className="space-y-1">
                  <div className="w-16 h-2.5 bg-white/10 rounded animate-pulse" />
                  <div className="w-10 h-2 bg-white/10 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <p className="text-xs font-medium text-white leading-tight">{displayName.split(" ")[0]}</p>
                  <p className="text-[10px] text-zinc-500 leading-tight capitalize">{displayRole}</p>
                </>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`${dropdownClass} w-56`}
              >
                <div className="p-4 border-b border-white/[0.05]">
                  <p className="font-semibold text-sm text-white">{displayName}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{displayEmail}</p>
                </div>
                <div className="p-2">
                  {[
                    { icon: User,     label: "Mi Perfil",      href: "/dashboard/profile" },
                    { icon: Settings, label: "Configuración",  href: "/settings" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { router.push(item.href); closeAll(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all duration-200"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                  <div className="h-px bg-white/[0.05] my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
