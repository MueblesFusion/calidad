"use client"

import { useEffect, useState } from "react"
import { getAllPlanes } from "@/lib/supabase/planes"

export default function TestConexion() {
  const [planes, setPlanes] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const datos = await getAllPlanes()
        setPlanes(datos || [])
      } catch (err) {
        console.error("Fallo al conectar con Supabase:", err)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Conexión a Supabase</h1>
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
