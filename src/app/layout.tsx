// Arquivo: src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. Importe o componente Toaster
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/context/app-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Harper Points",
  description: "Sistema de pontos da Harper System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AppProvider>
          {children}
          {/* 2. Adicione o Toaster aqui, antes de fechar o <body> */}
          <Toaster richColors position="top-right" />
        </AppProvider>
      </body>
    </html>
  );
}