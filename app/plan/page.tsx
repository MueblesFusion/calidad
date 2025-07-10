"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
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
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Crear Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">Área</label>
          <Select value={form.area} onValueChange={(value) => setForm({ ...form, area: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sillas">Sillas</SelectItem>
              <SelectItem value="Salas">Salas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {["cantidad", "producto", "color", "lf", "pt", "lp", "pedido", "cliente"].map((field) => (
          <div key={field}>
            <label className="block capitalize mb-1">{field}</label>
            <Input name={field} value={form[field as keyof typeof form]} onChange={handleChange} />
          </div>
        ))}
      </div>
      </div>
            <Button onClick={handleSubmit} className="mt-6">Crear Plan</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
