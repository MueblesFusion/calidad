"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon, XIcon } from "lucide-react"
import Head from "next/head"

const links = [
  { href: "/plan", label: "Crear Plan" },
  { href: "/planes", label: "Planes de Trabajo" },
  { href: "/", label: "Registrar defecto" },
  { href: "/dashboard", label: "Dashboard" },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen">
      <Head>
        <title>Calidad Muebles Fusion</title>
      </Head>

      {/* Header móvil */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-white shadow z-20 flex items-center justify-between px-4 py-3">
        <span className="font-bold">Calidad Fusion</span>
        <button onClick={() => setOpen(!open)}>{open ? <XIcon /> : <MenuIcon />}</button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white shadow h-full w-64 fixed top-0 left-0 p-4 z-30 transition-transform transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="text-lg font-bold mb-4">Calidad Fusion</div>
        <nav className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block px-2 py-2 rounded hover:bg-gray-100",
                pathname === link.href && "bg-gray-200 font-semibold"
              )}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 lg:ml-64 w-full">
        {children}
      </main>
    </div>
  )
}
