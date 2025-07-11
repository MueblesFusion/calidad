"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const pathname = usePathname()

  const links = [
    { name: "Crear Plan", href: "/plan" },
    { name: "Planes de Trabajo", href: "/planes" },
    { name: "Registrar Defecto", href: "/" },
    { name: "Dashboard", href: "/dashboard" }
  ]

  return (
    <aside className="w-64 h-full border-r bg-white shadow-sm fixed top-0 left-0">
      <div className="p-4 font-bold text-xl border-b">Calidad Fusion</div>
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
  )
}
