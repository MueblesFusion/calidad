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

const supabaseUrl = "https://your-supabase-url.supabase.co"
const supabaseKey = "your-supabase-key"
const supabase = createClient(supabaseUrl, supabaseKey)

const defectosSillas = [/*... tu lista ...*/]
const defectosSalas = [/*... tu lista ...*/]

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
  const [foto, setFoto] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFoto(e.target.files[0])
      setFotos([e.target.files[0]])
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
        return
      }

      const reportData = {
        fecha: new Date().toISOString().split("T")[0],
        ...formData,
      }

      const newReport = await createDefectReport(reportData)

      let fotoUrl = ""
      if (foto && newReport.id) {
        fotoUrl = await uploadDefectPhoto(foto, newReport.id)

        const { error: updateError } = await supabase
          .from("defect_reports")
          .update({ foto_url: fotoUrl })
          .eq("id", newReport.id)

        if (updateError) {
          console.error("Error updating photo URL:", updateError)
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
        defecto: "",
        descripcion: "",
      })
      setFotos([])
      setFoto(null)

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

  const handleDeleteAllDefects = async () => {
    const confirmDelete = confirm("¿Estás seguro que deseas eliminar todos los registros de defectos y sus fotos?")
    if (!confirmDelete) return

    try {
      const { data: defectos, error: fetchError } = await supabase
        .from("defect_reports")
        .select("foto_url")

      if (fetchError) throw fetchError

      const archivos = defectos
        .map((d) => d.foto_url)
        .filter((url) => !!url)
        .map((url) => {
          const parts = url.split("/object/public/")
          return parts[1] || null
        })
        .filter((path) => path !== null)

      if (archivos.length > 0) {
        const { error: deleteFilesError } = await supabase
          .storage
          .from("defect_photos") // CAMBIA esto si tu bucket tiene otro nombre
          .remove(archivos)

        if (deleteFilesError) {
          console.error("Error deleting images:", deleteFilesError)
          throw deleteFilesError
        }
      }

      const { error: deleteDataError } = await supabase
        .from("defect_reports")
        .delete()
        .neq("id", 0)

      if (deleteDataError) throw deleteDataError

      toast({
        title: "Éxito",
        description: "Todos los defectos y sus fotos fueron eliminados.",
      })
    } catch (error) {
      console.error("Error deleting defects and images:", error)
      toast({
        title: "Error",
        description: "Ocurrió un problema al borrar los defectos o sus fotos.",
        variant: "destructive",
      })
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
              {/* tu formulario como lo tienes actualmente */}
              {/* ... */}
              {/* Botones */}
              <div className="flex justify-between">
                <Button type="button" variant="destructive" onClick={handleDeleteAllDefects}>
                  Eliminar Todo
                </Button>
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
