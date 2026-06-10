import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { validateEnv } from "@/lib/env-check";

validateEnv();

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Sky Reservation AI — Automatiza tu Negocio con IA",
    template: "%s | Sky Reservation AI",
  },
  description:
    "Plataforma de reservas y atención al cliente 24/7 impulsada por inteligencia artificial. Automatiza llamadas, WhatsApp y reservas para tu negocio.",
  keywords: [
    "reservas AI",
    "automatización negocio",
    "inteligencia artificial",
    "atención al cliente",
    "chatbot",
    "voice AI",
    "WhatsApp AI",
  ],
  authors: [{ name: "Sky Reservation AI" }],
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Sky Reservation AI — Automatiza tu Negocio con IA",
    description:
      "Plataforma de reservas y atención al cliente 24/7 impulsada por inteligencia artificial.",
    siteName: "Sky Reservation AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sky Reservation AI",
    description:
      "Automatiza tu negocio con IA. Reservas, llamadas y WhatsApp 24/7.",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Analytics />
          <SpeedInsights />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1a1a",
                border: "1px solid #333",
                color: "#fff",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
