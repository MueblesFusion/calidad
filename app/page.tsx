"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2 } from "lucide-react"
import { createDefectReport, uploadDefectPhoto } from "@/lib/database"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-supabase-url.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-supabase-key"
const supabase = createClient(supabaseUrl, supabaseKey)

const defectosSillas = [
  "GOLPE DES. DE LACA",
  "GOLPE ANT. DE LACA",
  "DESPOSTILLADO",
  "RAYAS DES. DE LACA",
  "RAYAS ANT. DE LACA",
  "MARCA PULIDORA",
  "MARCA CARACOL",
  "SIN RESANE",
  "EXCESO DE RESANE",
  "LACA MANCHA",
  "LACA CHORREADA",
  "LACA MARCAS",
  "LACA GRUMO",
  "LACA BRISIADO",
  "GRAPA VISIBLE",
  "CASCO DESCUADRADO",
  "CASCO QUEBRADO",
  "BONFORD ROTO",
  "COSTURA DESALINEADA",
  "PESPUNTE FLOJO",
  "FALLA DE TELA",
  "DIFERENCIA DE TONO",
  "MAL TAPIZADO",
  "TELA SUCIA",
  "TELA ROTA",
  "RESPALDO QUEBRADO",
  "OTRO",
]

const defectosSalas = [
  "MAL TAPIZADO",
  "BONFORD ROTO",
  "GRAPA VISIBLE",
  "TIRA TACHUELA DESALINEADO",
  "TIRA TACHUELA SUELTA",
  "JALONES DESALINEADOS",
  "JALONES SUELTOS",
  "COSTURA DESALINEADA",
  "PESPUNTE FLOJO",
  "FALLA DE TELA",
  "DIFERENCIA DE TONO",
  "CASCO DESCUADRADO",
  "CASCO QUEBRADO",
  "PATAS FLOJAS",
  "TELA SUCIA",
  "TELA MANCHADA",
  "TELA ROTA",
  "OTRO",
]

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
    defecto: "",
    descripcion: "",
  })

  const [fotos, setFotos] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Agregar múltiples archivos al arreglo fotos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFotos((prev) => [...prev, ...Array.from(e.target.files)])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.area || !formData.producto || !formData.defecto) {
        toast({
          title: "Error",
          description: "Por favor completa los campos obligatorios",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Crear reporte
      const reportData = {
        fecha: new Date().toISOString().split("T")[0],
        ...formData,
      }

      const newReport = await createDefectReport(reportData)

      // Subir todas las fotos si hay y guardar en tabla relacionada
      if (newReport.id && fotos.length > 0) {
        const uploadPromises = fotos.map((file) => uploadDefectPhoto(file, newReport.id!))
        const fotoUrls = await Promise.all(uploadPromises)

        // Insertar URLs en tabla defect_report_photos
        for (const url of fotoUrls) {
          const { error } = await supabase.from("defect_report_photos").insert({
            report_id: newReport.id,
            foto_url: url,
          })
          if (error) {
            console.error("Error inserting photo record:", error)
          }
        }
      }

      toast({
        title: "Éxito",
        description: "Reporte de defecto registrado correctamente",
      })

      // Limpiar
      setFormData({
        area: "",
        producto: "",
        color: "",
        lf: "",
        pt: "",
        lp: "",
        pedido: "",
        cliente: "",
        defecto: "",
        descripcion: "",
      })
      setFotos([])

      const fileInput = document.getElementById("foto") as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }
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

              {/* Información del Producto */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="producto">Producto *</Label>
                  <Input
                    id="producto"
                    value={formData.producto}
                    onChange={(e) => handleInputChange("producto", e.target.value)}
                    placeholder="Ingresa el producto"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    placeholder="Ingresa el color"
                  />
                </div>
                <div>
                  <Label htmlFor="lf">LF</Label>
                  <Input
                    id="lf"
                    value={formData.lf}
                    onChange={(e) => handleInputChange("lf", e.target.value)}
                    placeholder="Ingresa LF"
                  />
                </div>
                <div>
                  <Label htmlFor="pt">PT</Label>
                  <Input
                    id="pt"
                    value={formData.pt}
                    onChange={(e) => handleInputChange("pt", e.target.value)}
                    placeholder="Ingresa PT"
                  />
                </div>
                <div>
                  <Label htmlFor="lp">LP</Label>
                  <Input
                    id="lp"
                    value={formData.lp}
                    onChange={(e) => handleInputChange("lp", e.target.value)}
                    placeholder="Ingresa LP"
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

              {/* Lista de Defectos */}
              {formData.area && (
                <div>
                  <Label htmlFor="defecto">Defecto *</Label>
                  <Select value={formData.defecto} onValueChange={(value) => handleInputChange("defecto", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un defecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {defectosActuales.map((defecto) => (
                        <SelectItem key={defecto} value={defecto}>
                          {defecto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              {/* Carga de Fotos (múltiples) */}
              <div>
                <Label htmlFor="foto">Fotos del Defecto</Label>
                <div className="mt-2">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click para subir</span> o arrastra las imágenes
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG o JPEG (múltiples)</p>
                    </div>
                    <input
                      id="foto"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                    />
                  </label>

                  {fotos.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-600 list-disc pl-4">
                      {fotos.map((foto, index) => (
                        <li key={index}>{foto.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Botón de Envío */}
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
