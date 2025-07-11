
'use client'

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileMenu from "@/components/MobileMenu";
import { useMediaQuery } from 'usehooks-ts';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isOpen, setIsOpen] = useState(false);

  const isDashboard = pathname === "/dashboard";
  const isPlan = pathname === "/plan";
  const isPlanes = pathname === "/planes";
  const isRegistro = pathname === "/";

  const showSidebar = isDashboard || isPlan || isPlanes || isRegistro;

  return (
    <html lang="es">
      <head>
        <title>Calidad Muebles Fusion</title>
      </head>
      <body className="flex">
        {showSidebar && isMobile && (
          <>
            <MobileMenu isOpen={isOpen} setIsOpen={setIsOpen} />
          </>
        )}

        {showSidebar && !isMobile && (
          <aside className="w-64 hidden md:block">
            <Sidebar />
          </aside>
        )}

        <main className="flex-1 flex flex-col w-full">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              {isMobile && (
                <button onClick={() => setIsOpen(true)} className="text-2xl font-bold">
                  ☰
                </button>
              )}
              <h1 className="text-xl font-semibold">Calidad Muebles Fusion</h1>
            </div>
          </header>
          <div className="p-4">{children}</div>
        </main>
      </body>
    </html>
  );
}
