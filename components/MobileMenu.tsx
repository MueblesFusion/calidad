"use client"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function MobileMenu() {
  const pathname = usePathname()

  const links = [
    { name: "Crear Plan", href: "/plan" },
    { name: "Planes de Trabajo", href: "/planes" },
    { name: "Registrar Defecto", href: "/" },
    { name: "Dashboard", href: "/dashboard" }
  ]

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="lg:hidden px-3 py-2">
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <div className="p-4 font-bold text-lg border-b mb-4">
          Calidad Muebles Fusion
        </div>
        <nav className="flex flex-col space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded hover:bg-muted ${
                pathname === link.href ? "bg-muted font-semibold" : ""
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
