import "@/app/globals.css"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { MenuIcon, XIcon } from "lucide-react"
import { useState } from "react"

export const metadata = {
  title: "Calidad Muebles Fusion",
  description: "Sistema de calidad para muebles",
}

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <html lang="es">
      <body className={cn("flex min-h-screen w-full bg-muted/40", inter.className)}>
        {/* Sidebar móvil */}
        <div className="lg:hidden fixed top-0 left-0 w-full bg-white shadow z-20 flex items-center justify-between px-4 py-3">
          <span className="font-bold">Calidad Fusion</span>
          <button onClick={() => setOpen(!open)}>
            {open ? <XIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Sidebar grande + móvil */}
        <div
          className={cn(
            "transition-transform transform z-30 fixed top-0 left-0 lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <Sidebar />
        </div>

        {/* Contenido principal */}
        <main className="flex-1 flex flex-col pt-16 lg:pt-0 lg:ml-64 w-full">
          {children}
          <Toaster />
        </main>
      </body>
    </html>
  )
}
