"use client"

import { useState } from "react"
import { MenuIcon, XIcon } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { cn } from "@/lib/utils"

export default function ResponsiveWrapper({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-muted/40">
      {/* Encabezado móvil */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-white shadow z-20 flex items-center justify-between px-4 py-3">
        <span className="font-bold">Calidad Fusion</span>
        <button onClick={() => setOpen(!open)}>
          {open ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "transition-transform transform z-30 fixed top-0 left-0 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <Sidebar />
      </div>

      {/* Contenido */}
      <main className="flex-1 flex flex-col pt-16 lg:pt-0 lg:ml-64 w-full">
        {children}
      </main>
    </div>
  )
}
