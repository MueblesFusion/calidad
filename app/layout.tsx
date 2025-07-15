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
        {/* Header fijo en móvil */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-2 px-4 py-3 shadow bg-white">
          <MobileMenu />
          <img src="/logo.png" alt="Calidad Fusion" className="h-8" />
        </header>

        <div className="lg:flex pt-14 lg:pt-0">
          {/* Sidebar fijo solo en escritorio */}
          <aside className="hidden lg:block w-64">
            <Sidebar />
          </aside>

          {/* Contenido desplazable */}
          <main className="flex-1 p-4 w-full overflow-auto h-[calc(100vh-3.5rem)] lg:h-screen">
            {children}
            <Toaster />
          </main>
        </div>
      </body>
    </html>
  )
}
