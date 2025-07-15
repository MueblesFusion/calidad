"use client"

import { useEffect, useState } from "react"
import { getAllPlanes } from "@/lib/supabase/planes"
import { crearPlan } from "@/lib/supabase/planes"

export default function TestConexion() {
  const [planes, setPlanes] = useState<any[]>([])
  const [area, setArea] = useState("")
  const [producto, setProducto] = useState("")
  const [cantidad, setCantidad] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const datos = await getAllPlanes()
      setPlanes(datos || [])
    } catch (err) {
      console.error("Fallo al conectar con Supabase:", err)
    }
  }

  async function handleSubmit(e: any) {
    e.preventDefault()
    try {
      const nuevoPlan = {
        area,
        producto,
        cantidad,
      }
      await crearPlan(nuevoPlan)
      setArea("")
      setProducto("")
      setCantidad(0)
      fetchData()
    } catch (err) {
      alert("Error al crear plan")
      console.error(err)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Conexión a Supabase</h1>

      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block mb-1 font-semibold">Área:</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Producto:</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Cantidad:</label>
          <input
            type="number"
            className="border rounded px-3 py-2 w-full"
            value={cantidad}
            onChange={(e) => setCantidad(parseInt(e.target.value))}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Crear plan
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2">Planes actuales:</h2>
      <ul className="list-disc pl-6">
        {planes.map((plan) => (
          <li key={plan.id}>
            {plan.area} - {plan.producto} - {plan.cantidad} piezas
          </li>
        ))}
      </ul>

      {planes.length === 0 && <p>No hay planes registrados aún.</p>}
    </div>
  )
}
