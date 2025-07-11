import "./globals.css"
import { Inter } from "next/font/google"
import Sidebar from "@/components/Sidebar"
import { Toaster } from "@/components/ui/sonner"
import Head from "next/head"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Calidad Muebles Fusion",
  description: "Sistema de Control de Calidad",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="lg:flex">
          <Sidebar />
          <main className="w-full lg:ml-64 p-4">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
