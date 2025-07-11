"use client"

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import MobileMenu from "@/components/MobileMenu"
import { Toaster } from "@/components/ui/sonner"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Encabezado móvil con botón ☰ */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 shadow bg-white">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsOpen(true)} className="text-2xl font-bold">
              ☰
            </button>
            <span className="font-bold text-lg">Calidad Muebles Fusion</span>
          </div>
        </header>

        {/* Menú lateral + contenido */}
        <div className="lg:flex">
          <aside className="hidden lg:block w-64">
            <Sidebar />
          </aside>

          <MobileMenu isOpen={isOpen} setIsOpen={setIsOpen} />

          <main className="flex-1 p-4 w-full lg:ml-64">
            {children}
            <Toaster />
          </main>
        </div>
      </body>
    </html>
  )
}
