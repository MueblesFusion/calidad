"use client"

import { useEffect, useState } from "react"
import { getAllPlanes } from "@/lib/supabase/planes"
import { Button } from "@/components/ui/button"

export default function PlanesAgrupadosPage() {
  const [planes, setPlanes] = useState<any[]>([])

  useEffect(() => {
    async function fetchPlanes() {
      const data = await getAllPlanes()
      setPlanes(data || [])
    }
    fetchPlanes()
  }, [])

  const renderTablaPorArea = (area: string) => {
    const planesFiltrados = planes.filter((p) => p.area === area)

    if (planesFiltrados.length === 0) return null

    return (
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">{area}</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Cantidad</th>
                <th className="px-4 py-2">Producto</th>
                <th className="px-4 py-2">Color</th>
                <th className="px-4 py-2">LF</th>
                <th className="px-4 py-2">PT</th>
                <th className="px-4 py-2">LP</th>
                <th className="px-4 py-2">Pedido</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Liberado</th>
                <th className="px-4 py-2">Pendiente</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {planesFiltrados.map((plan) => (
                <tr key={plan.id} className="border-b">
                  <td className="px-4 py-2">{plan.fecha}</td>
                  <td className="px-4 py-2">{plan.cantidad}</td>
                  <td className="px-4 py-2">{plan.producto}</td>
                  <td className="px-4 py-2">{plan.color}</td>
                  <td className="px-4 py-2">{plan.lf}</td>
                  <td className="px-4 py-2">{plan.pt}</td>
                  <td className="px-4 py-2">{plan.lp}</td>
                  <td className="px-4 py-2">{plan.pedido}</td>
                  <td className="px-4 py-2">{plan.cliente}</td>
                  <td className="px-4 py-2">{plan.liberado}</td>
                  <td className="px-4 py-2">
                    {plan.cantidad - plan.liberado}
                  </td>
                  <td className="px-4 py-2">
                    <Button size="sm" variant="outline">
                      Liberar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

    return (
    <div className="p-4 pt-20 lg:pt-4">
      <h1 className="text-2xl font-bold mb-6">Planes de Trabajo</h1>
      {renderTablaPorArea("SILLAS")}
      {renderTablaPorArea("SALAS")}
    </div>
  )
}

  

