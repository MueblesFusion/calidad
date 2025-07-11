"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const links = [
    { name: "Crear Plan", href: "/plan" },
    { name: "Planes de Trabajo", href: "/planes" },
    { name: "Registrar Defecto", href: "/" },
    { name: "Dashboard", href: "/dashboard" },
  ]

  return (
    <>
      {/* Botón ☰ */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded shadow"
      >
        <Menu size={28} />
      </button>

      {/* Overlay y Drawer */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="fixed top-0 left-0 w-64 h-full bg-white shadow-lg p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Menú</h2>
              <button onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-2 py-2 rounded hover:bg-gray-100 ${
                  pathname === link.href ? "bg-gray-200 font-semibold" : ""
                }`}
                onClick={() => setOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
