import "./globals.css"
import { Inter } from "next/font/google"
import Sidebar from "@/components/Sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Calidad Fusion",
  description: "Registro de defectos",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="flex">
          <Sidebar />
          <main className="ml-60 w-full p-4 bg-gray-50 min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  )
}
