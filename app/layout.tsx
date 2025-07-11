
'use client'

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileMenu from "@/components/MobileMenu";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Calidad Muebles Fusion",
  description: "Sistema de Control de Calidad",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <html lang="es">
      <head />
      <body className="flex flex-col min-h-screen">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 shadow bg-white">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsOpen(true)} className="text-2xl font-bold">
              ☰
            </button>
            <span className="font-bold text-lg">Calidad Muebles Fusion</span>
          </div>
        </header>

        <div className="lg:flex flex-1 w-full">
          <aside className="hidden lg:block w-64">
            <Sidebar />
          </aside>

          <MobileMenu isOpen={isOpen} setIsOpen={setIsOpen} />

          <main className="flex-1 p-4">
            {children}
            <Toaster />
          </main>
        </div>
      </body>
    </html>
  );
}
