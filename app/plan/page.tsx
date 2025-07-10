"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CrearPlan() {
  const [form, setForm] = useState({
    area: "", cantidad: "", producto: "", color: "",
    lf: "", pt: "", lp: "", pedido: "", cliente: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    const { data, error } = await supabase.from("planes").insert([
      {
        area: form.area,
        cantidad: parseInt(form.cantidad) || 0,
        producto: form.producto,
        color: form.color,
        lf: form.lf,
        pt: form.pt,
        lp: form.lp,
        pedido: form.pedido,
        cliente: form.cliente,
        creado_en: new Date().toISOString()
      }
    ])

    if (error) {
      console.error("Error al crear plan:", error)
    } else {
      console.log("Plan creado exitosamente:", data)
    }
  }

  return (
    <div className="p-4 ml-64">
      <h1 className="text-2xl font-bold mb-4">Crear Plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(form).map((field) => (
          <div key={field}>
            <label className="block capitalize mb-1">{field}</label>
            <Input name={field} value={form[field as keyof typeof form]} onChange={handleChange} />
          </div>
        ))}
      </div>
      <Button onClick={handleSubmit} className="mt-6">Crear Plan</Button>
    </div>
  )
}
