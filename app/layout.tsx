// ============================================================
// VISION ERP - Root layout
// app/layout.tsx
// ------------------------------------------------------------
// Updated to mount global Providers (NextAuth + React Query + Toasts).
// ============================================================

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const fontSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vision ERP",
  description: "Enterprise Optometry ERP System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}