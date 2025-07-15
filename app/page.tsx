"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2 } from "lucide-react"
import { createDefectReport, uploadDefectPhoto } from "@/lib/database"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-supabase-url.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-supabase-key"
const supabase = createClient(supabaseUrl, supabaseKey)

const defectosSillas = [/* igual que antes */ "GOLPE DES. DE LACA", "BONFORD ROTO", "OTRO"]
const defectosSalas = [/* igual que antes */ "MAL TAPIZADO", "TELA ROTA", "OTRO"]

export default function HomePage() {
  const [formData, setFormData] = useState({
    area: "",
    producto: "",
    color: "",
    lf: "",
    pt: "",
    lp: "",
    pedido: "",
    cliente: "",
    defecto: [] as string[], // ← CAMBIO AQUÍ
    descripcion: "",
  })

  const [fotos, setFotos] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFotos((prev) => [...prev, ...Array.from(e.target.files)])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.area || !formData.producto || formData.defecto.length === 0) {
        toast({
          title: "Error",
          description: "Por favor completa los campos obligatorios",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      const reportData = {
        fecha: new Date().toISOString().split("T")[0],
        ...formData,
        defecto: formData.defecto.join(", "), // ← convertir arreglo a string
      }

      const newReport = await createDefectReport(reportData)

      if (newReport.id && fotos.length > 0) {
        const uploadPromises = fotos.map((file) => uploadDefectPhoto(file, newReport.id!))
        const fotoUrls = await Promise.all(uploadPromises)

        for (const url of fotoUrls) {
          const { error } = await supabase.from("defect_report_photos").insert({
            report_id: newReport.id,
            foto_url: url,
          })
          if (error) console.error("Error inserting photo record:", error)
        }
      }

      toast({
        title: "Éxito",
        description: "Reporte de defecto registrado correctamente",
      })

      setFormData({
        area: "",
        producto: "",
        color: "",
        lf: "",
        pt: "",
        lp: "",
        pedido: "",
        cliente: "",
        defecto: [],
        descripcion: "",
      })
      setFotos([])
      const fileInput = document.getElementById("foto") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al registrar el defecto. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const defectosActuales = formData.area === "SILLAS" ? defectosSillas : formData.area === "SALAS" ? defectosSalas : []

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Registro de Defectos</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Área */}
              <div>
                <Label htmlFor="area">Área *</Label>
                <select
                  value={formData.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                  className="w-full border rounded px-3 py-2 mt-1"
                >
                  <option value="">Selecciona un área</option>
                  <option value="SILLAS">SILLAS</option>
                  <option value="SALAS">SALAS</option>
                </select>
              </div>

              {/* Información del Producto */}
              {/* (igual que antes, no modificado) */}
              {/* ... */}
              {/* Cliente */}
              <div>
                <Label htmlFor="cliente">Cliente</Label>
                <Input
                  id="cliente"
                  value={formData.cliente}
                  onChange={(e) => handleInputChange("cliente", e.target.value)}
                  placeholder="Nombre del cliente"
                />
              </div>

              {/* Lista de Defectos múltiples con tags */}
              {formData.area && (
                <div>
                  <Label>Defectos *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {defectosActuales.map((defecto) => (
                      <label
                        key={defecto}
                        className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-2 rounded shadow-sm"
                      >
                        <input
                          type="checkbox"
                          value={defecto}
                          checked={formData.defecto.includes(defecto)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setFormData((prev) => ({
                              ...prev,
                              defecto: checked
                                ? [...prev.defecto, defecto]
                                : prev.defecto.filter((d) => d !== defecto),
                            }))
                          }}
                        />
                        {defecto}
                      </label>
                    ))}
                  </div>

                  {/* Etiquetas visuales */}
                  {formData.defecto.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {formData.defecto.map((defecto) => (
                        <span
                          key={defecto}
                          className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm"
                        >
                          {defecto}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                defecto: prev.defecto.filter((d) => d !== defecto),
                              }))
                            }
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            aria-label={`Quitar ${defecto}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Descripción */}
              <div>
                <Label htmlFor="descripcion">Descripción del Defecto</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange("descripcion", e.target.value)}
                  placeholder="Describe el defecto encontrado..."
                  rows={4}
                />
              </div>

              {/* Fotos */}
              {/* (igual que antes, sin cambios) */}

              {/* Botón */}
              <div className="flex justify-end">
                <Button type="submit" className="px-8" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Registrar Defecto"
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
