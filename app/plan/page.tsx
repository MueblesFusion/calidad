"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CrearPlanPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    area: "",
    cantidad: "",
    producto: "",
    color: "",
    lf: "",
    pt: "",
    lp: "",
    pedido: "",
    cliente: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación de campos vacíos
    for (const key in formData) {
      if (!formData[key as keyof typeof formData] || (key === "cantidad" && parseInt(formData.cantidad) <= 0)) {
        toast({
          title: "Datos incompletos",
          description:
            key === "cantidad"
              ? "La cantidad debe ser mayor a 0"
              : "Todos los campos deben estar completos",
          variant: "destructive",
        })
        return
      }
    }


    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("planes").insert([
        {
          ...formData,
          cantidad: parseInt(formData.cantidad) || 0,
          creado_en: new Date().toISOString(),
        },
      ])

      if (error) {
        console.error("Error al crear plan:", error)
        toast({
          title: "Error",
          description: "No se pudo guardar el plan",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Éxito",
          description: "Plan creado correctamente",
        })
        setFormData({
          area: "",
          cantidad: "",
          producto: "",
          color: "",
          lf: "",
          pt: "",
          lp: "",
          pedido: "",
          cliente: "",
        })
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Crear Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Área */}
              <div>
                <Label htmlFor="area">Área *</Label>
                <Select value={formData.area} onValueChange={(value) => handleInputChange("area", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SILLAS">SILLAS</SelectItem>
                    <SelectItem value="SALAS">SALAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Información del Plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    value={formData.cantidad}
                    onChange={(e) => handleInputChange("cantidad", e.target.value)}
                    placeholder="Cantidad del plan"
                  />
                </div>
                <div>
                  <Label htmlFor="producto">Producto</Label>
                  <Input
                    id="producto"
                    value={formData.producto}
                    onChange={(e) => handleInputChange("producto", e.target.value)}
                    placeholder="Nombre del producto"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    placeholder="Color del producto"
                  />
                </div>
                <div>
                  <Label htmlFor="lf">LF</Label>
                  <Input
                    id="lf"
                    value={formData.lf}
                    onChange={(e) => handleInputChange("lf", e.target.value)}
                    placeholder="LF"
                  />
                </div>
                <div>
                  <Label htmlFor="pt">PT</Label>
                  <Input
                    id="pt"
                    value={formData.pt}
                    onChange={(e) => handleInputChange("pt", e.target.value)}
                    placeholder="PT"
                  />
                </div>
                <div>
                  <Label htmlFor="lp">LP</Label>
                  <Input
                    id="lp"
                    value={formData.lp}
                    onChange={(e) => handleInputChange("lp", e.target.value)}
                    placeholder="LP"
                  />
                </div>
                <div>
                  <Label htmlFor="pedido">Pedido</Label>
                  <Input
                    id="pedido"
                    value={formData.pedido}
                    onChange={(e) => handleInputChange("pedido", e.target.value)}
                    placeholder="Número de pedido"
                  />
                </div>
                <div>
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    value={formData.cliente}
                    onChange={(e) => handleInputChange("cliente", e.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </div>
              </div>

              {/* Botón de Envío */}
              <div className="flex justify-end">
                <Button type="submit" className="px-8" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Crear Plan"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
