"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const pathname = usePathname()

  const links = [
    { name: "Crear Plan", href: "/plan" },
    { name: "Planes de Trabajo", href: "/planes" },
    { name: "Registrar defecto", href: "/" },
    { name: "Dashboard", href: "/dashboard" }
  ]

  return (
    <>
      {/* Título visible en móvil */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-white shadow z-20 flex items-center justify-between px-4 py-3">
      <span className="font-bold">Calidad Muebles Fusion</span>
      </div>

      {/* Menú lateral visible solo en escritorio */}
      <aside className="hidden lg:block w-64 h-full border-r bg-white shadow-sm fixed top-0 left-0">
      <img src="/logo.png" alt="Calidad Muebles Fusion" className="h-8" />
        <nav className="p-4 flex flex-col gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded hover:bg-gray-100 ${
                pathname === link.href ? "bg-gray-200 font-semibold" : ""
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
