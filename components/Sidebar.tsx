'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const menuItems = [
  { label: "Registrar defecto", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-white border-r h-screen fixed left-0 top-0 px-4 py-6">
      <div className="mb-8">
        <img src="/logo.png" alt="Muebles Fusión" className="w-full h-auto" />
      </div>
      <nav className="space-y-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block px-4 py-2 rounded text-gray-700 hover:bg-gray-100 font-medium",
              pathname === item.href && "bg-gray-200 text-blue-600"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
