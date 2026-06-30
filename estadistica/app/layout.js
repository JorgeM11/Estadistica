import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Parchita Tracker | Control, Trazabilidad y Cosecha",
  description: "Monitorea, registra y analiza de forma avanzada la polinización de flores, recolección de frutos y procesamiento de pulpa en plantaciones de maracuyá / parchita.",
  keywords: ["parchita", "maracuyá", "agronomía", "cosecha", "polinización", "control agrícola", "PWA"],
  authors: [{ name: "JorgeM11" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
  openGraph: {
    title: "Parchita Tracker | Control Agrícola",
    description: "Trazabilidad de ciclo de 60 días para floración y cosecha de maracuyá.",
    type: "website",
    locale: "es_ES",
    siteName: "Parchita Tracker",
  }
};

export const viewport = {
  themeColor: "#022c22", // bg-emerald-950
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
