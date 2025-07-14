
"use client"

import { useEffect, useState } from "react"
import { getAllPlanes } from "@/lib/supabase/planes"
import { registrarLiberacion } from "@/lib/supabase/liberaciones"
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

  const handleLiberar = async (plan: any) => {
    const cantidadStr = prompt(`¿Cuántas piezas quieres liberar del plan PT ${plan.pt}?`)
    const cantidadLiberar = parseInt(cantidadStr || "", 10)

    if (isNaN(cantidadLiberar) || cantidadLiberar <= 0) {
      alert("Por favor ingresa una cantidad válida.")
      return
    }

    const nuevoLiberado = plan.liberado + cantidadLiberar
    const pendiente = plan.cantidad - nuevoLiberado

    if (nuevoLiberado > plan.cantidad) {
      alert("No puedes liberar más de lo planeado.")
      return
    }

    try {
      await registrarLiberacion(plan.id, cantidadLiberar, nuevoLiberado)

      alert(`Liberaste ${cantidadLiberar} piezas. Pendiente: ${pendiente}`)

      // Actualizar en pantalla
      setPlanes(prev =>
        prev.map(p =>
          p.id === plan.id ? { ...p, liberado: nuevoLiberado } : p
        )
      )
    } catch (error) {
      console.error("Error al registrar liberación:", error)
      alert("Ocurrió un error al registrar la liberación.")
    }
  }

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
                    <Button size="sm" variant="outline" onClick={() => handleLiberar(plan)}>
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Planes de Trabajo</h1>
      {renderTablaPorArea("SILLAS")}
      {renderTablaPorArea("SALAS")}
    </div>
  )
}
