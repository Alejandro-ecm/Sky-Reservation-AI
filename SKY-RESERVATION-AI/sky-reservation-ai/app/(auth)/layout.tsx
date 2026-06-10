import type { Metadata } from "next";
import { AuthBackground } from "./_components/auth-background";

export const metadata: Metadata = {
  title: {
    template: "%s | Sky Reservation AI",
    default: "Autenticación | Sky Reservation AI",
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthBackground>{children}</AuthBackground>;
}
