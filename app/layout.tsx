import "./globals.css"
import { Inter } from "next/font/google"
import Sidebar from "@/components/Sidebar"
import MobileMenu from "@/components/MobileMenu"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Encabezado en móvil con botón de menú y título */}
        <header className="lg:hidden flex items-center gap-2 px-4 py-3 shadow bg-white">
          <MobileMenu />
          <span className="font-bold text-lg">Calidad Muebles Fusion</span>
        </header>

        <div className="lg:flex">
          {/* Sidebar fijo en escritorio */}
          <aside className="hidden lg:block w-64">
            <Sidebar />
          </aside>

          <main className="flex-1 p-4 w-full">
            {children}
            <Toaster />
          </main>
        </div>
      </body>
    </html>
  )
}
