import type { Metadata, Viewport } from "next";
import { Caveat } from "next/font/google";
import "./globals.css";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0047AB",
};

export const metadata: Metadata = {
  title: "Club Estudiantil San Luis — Gestión Deportiva",
  description: "App de gestión deportiva para el Club Estudiantil San Luis, categoría 2017 Mixto",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "San Luis",
  },
  icons: {
    apple: "/Escudo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full ${caveat.variable}`}>
      <body className="min-h-full">
        {/* Fixed dark overlay encima del fondo de estadio */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed", inset: 0, zIndex: 0,
            background: "linear-gradient(to bottom, rgba(5,10,25,0.75) 0%, rgba(5,10,25,0.60) 40%, rgba(5,10,25,0.80) 100%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
