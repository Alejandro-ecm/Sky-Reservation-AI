"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, Chrome, Check } from "lucide-react";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");

  const passwordChecks = [
    { label: "Al menos 8 caracteres", valid: password.length >= 8 },
    { label: "Una letra mayúscula", valid: /[A-Z]/.test(password) },
    { label: "Una letra minúscula", valid: /[a-z]/.test(password) },
    { label: "Un número", valid: /\d/.test(password) },
  ];

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            business_name: data.business_name,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este email ya está registrado. Inicia sesión.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("¡Cuenta creada! Redirigiendo al dashboard...");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Ocurrió un error inesperado. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error("Error al conectar con Google");
      }
    } catch {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white mb-2">
            Crea tu cuenta gratis
          </h1>
          <p className="text-gray-400 text-sm">
            14 días gratis · Sin tarjeta de crédito
          </p>
        </div>

        {/* Google Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleGoogleSignup}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-sm font-medium text-white transition-all duration-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Chrome className="w-4 h-4" />
          )}
          Registrarse con Google
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-gray-500">o con email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nombre completo
            </label>
            <input
              {...register("full_name")}
              type="text"
              placeholder="Juan García"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30 focus:bg-white/[0.07] transition-all duration-200"
            />
            {errors.full_name && (
              <p className="mt-1.5 text-xs text-red-400">{errors.full_name.message}</p>
            )}
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nombre del negocio
            </label>
            <input
              {...register("business_name")}
              type="text"
              placeholder="Mi Empresa S.A."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30 focus:bg-white/[0.07] transition-all duration-200"
            />
            {errors.business_name && (
              <p className="mt-1.5 text-xs text-red-400">{errors.business_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="tu@empresa.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30 focus:bg-white/[0.07] transition-all duration-200"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30 focus:bg-white/[0.07] transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
            )}

            {/* Password checks */}
            {password && (
              <div className="mt-2 grid grid-cols-2 gap-1">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-1.5 text-xs">
                    <Check className={`w-3 h-3 ${check.valid ? "text-green-400" : "text-gray-600"}`} />
                    <span className={check.valid ? "text-gray-400" : "text-gray-600"}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                {...register("confirm_password")}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00E5FF]/30 focus:bg-white/[0.07] transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="mt-1.5 text-xs text-red-400">{errors.confirm_password.message}</p>
            )}
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00E5FF] to-[#7000FF] hover:from-[#00E5FF]/90 hover:to-[#7000FF]/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-[#00E5FF]/20 mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Crear Cuenta Gratis
          </motion.button>
        </form>

        {/* Terms */}
        <p className="text-center text-xs text-gray-600 mt-4">
          Al registrarte, aceptas nuestros{" "}
          <a href="/terms" className="text-gray-500 hover:text-gray-400 underline">
            Términos de Servicio
          </a>{" "}
          y{" "}
          <a href="/privacy" className="text-gray-500 hover:text-gray-400 underline">
            Política de Privacidad
          </a>
          .
        </p>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-[#00E5FF] hover:text-[#00E5FF]/80 font-medium transition-colors"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
