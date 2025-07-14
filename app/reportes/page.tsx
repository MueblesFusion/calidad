"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { createDefectReport, uploadDefectPhoto, getDefectReports } from "@/lib/database"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"

type DefectPhoto = {
  id: string
  report_id: string
  foto_url: string
  created_at: string
}

type DefectReportWithPhotos = {
  id: string
  fecha: string
  area: string
  producto: string
  color: string
  lf: string
  pt: string
  lp: string
  pedido: string
  cliente: string
  defecto: string
  descripcion: string
  foto_url?: string
  photos: DefectPhoto[]
}

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

export default function ReportesPage() {
  const [reports, setReports] = useState<DefectReportWithPhotos[]>([])
  const [filter, setFilter] = useState({ fecha: "", cliente: "", pedido: "" })
  const [selectedReport, setSelectedReport] = useState<DefectReportWithPhotos | null>(null)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      // Aquí asumo que tienes una función o query que trae defect_reports junto a defect_report_photos
      // La función debe devolver los datos ya anidados, si no, habría que hacer el fetch y anidar manualmente
      // Para ejemplo, fetch manual con supabase:
      const { data: reportsData, error: reportsError } = await supabase
        .from("defect_reports")
        .select(`
          id, fecha, area, producto, color, lf, pt, lp, pedido, cliente, defecto, descripcion, foto_url,
          defect_report_photos (
            id, report_id, foto_url, created_at
          )
        `)
        .order("fecha", { ascending: false })

      if (reportsError) throw reportsError

      setReports(reportsData || [])
    } catch (error) {
      console.error("Error fetching defect reports:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los reportes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  // Filtrar reports por filtro fecha, cliente o pedido
  const filteredReports = reports.filter((r) => {
    const fechaMatch = filter.fecha ? r.fecha === filter.fecha : true
    const clienteMatch = filter.cliente ? r.cliente.toLowerCase().includes(filter.cliente.toLowerCase()) : true
    const pedidoMatch = filter.pedido ? r.pedido.toLowerCase().includes(filter.pedido.toLowerCase()) : true
    return fechaMatch && clienteMatch && pedidoMatch
  })

  const sillasReports = filteredReports.filter((r) => r.area === "SILLAS")
  const salasReports = filteredReports.filter((r) => r.area === "SALAS")

  function exportToExcel(data: DefectReportWithPhotos[], filename: string) {
    const wsData = data.map(({ id, photos, ...rest }) => rest) // excluyo id y photos para exportar solo info principal
    const worksheet = XLSX.utils.json_to_sheet(wsData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reportes")
    XLSX.writeFile(workbook, filename)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle>Reportes de Defectos</CardTitle>
          <div className="flex flex-wrap gap-4 mt-2">
            <Input
              placeholder="Filtrar por fecha (YYYY-MM-DD)"
              value={filter.fecha}
              onChange={(e) => setFilter((f) => ({ ...f, fecha: e.target.value }))}
              className="max-w-xs"
            />
            <Input
              placeholder="Filtrar por cliente"
              value={filter.cliente}
              onChange={(e) => setFilter((f) => ({ ...f, cliente: e.target.value }))}
              className="max-w-xs"
            />
            <Input
              placeholder="Filtrar por pedido"
              value={filter.pedido}
              onChange={(e) => setFilter((f) => ({ ...f, pedido: e.target.value }))}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="mx-auto animate-spin" size={36} />
              <p>Cargando reportes...</p>
            </div>
          ) : (
            <>
              {/* Card Sillas */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Defectos SILLAS</h2>
                <Button
                  className="mb-4 bg-green-600 hover:bg-green-700"
                  onClick={() => exportToExcel(sillasReports, "Reportes_Sillas.xlsx")}
                >
                  Exportar Excel
                </Button>
                <table className="w-full table-auto border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1">Fecha</th>
                      <th className="border px-2 py-1">Cliente</th>
                      <th className="border px-2 py-1">Pedido</th>
                      <th className="border px-2 py-1">Producto</th>
                      <th className="border px-2 py-1">Color</th>
                      <th className="border px-2 py-1">Defecto</th>
                      <th className="border px-2 py-1">Descripción</th>
                      <th className="border px-2 py-1">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sillasReports.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center p-4">
                          No hay reportes de Sillas
                        </td>
                      </tr>
                    ) : (
                      sillasReports.map((report) => (
                        <tr key={report.id}>
                          <td className="border px-2 py-1">{report.fecha}</td>
                          <td className="border px-2 py-1">{report.cliente}</td>
                          <td className="border px-2 py-1">{report.pedido}</td>
                          <td className="border px-2 py-1">{report.producto}</td>
                          <td className="border px-2 py-1">{report.color}</td>
                          <td className="border px-2 py-1">{report.defecto}</td>
                          <td className="border px-2 py-1">{report.descripcion}</td>
                          <td className="border px-2 py-1">
                            <Button
                              size="sm"
                              onClick={() => setSelectedReport(report)}
                            >
                              Ver Fotos
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Card Salas */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Defectos SALAS</h2>
                <Button
                  className="mb-4 bg-green-600 hover:bg-green-700"
                  onClick={() => exportToExcel(salasReports, "Reportes_Salas.xlsx")}
                >
                  Exportar Excel
                </Button>
                <table className="w-full table-auto border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1">Fecha</th>
                      <th className="border px-2 py-1">Cliente</th>
                      <th className="border px-2 py-1">Pedido</th>
                      <th className="border px-2 py-1">Producto</th>
                      <th className="border px-2 py-1">Color</th>
                      <th className="border px-2 py-1">Defecto</th>
                      <th className="border px-2 py-1">Descripción</th>
                      <th className="border px-2 py-1">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salasReports.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center p-4">
                          No hay reportes de Salas
                        </td>
                      </tr>
                    ) : (
                      salasReports.map((report) => (
                        <tr key={report.id}>
                          <td className="border px-2 py-1">{report.fecha}</td>
                          <td className="border px-2 py-1">{report.cliente}</td>
                          <td className="border px-2 py-1">{report.pedido}</td>
                          <td className="border px-2 py-1">{report.producto}</td>
                          <td className="border px-2 py-1">{report.color}</td>
                          <td className="border px-2 py-1">{report.defecto}</td>
                          <td className="border px-2 py-1">{report.descripcion}</td>
                          <td className="border px-2 py-1">
                            <Button
                              size="sm"
                              onClick={() => setSelectedReport(report)}
                            >
                              Ver Fotos
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Fotos */}
      {selectedReport && (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto p-6">
            <h3 className="text-lg font-bold mb-4">Fotos del Reporte</h3>
            <div className="grid grid-cols-3 gap-4 max-h-[60vh] overflow-auto">
              {selectedReport.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.foto_url}
                  alt="Foto defecto"
                  className="cursor-pointer object-cover rounded border border-gray-300 hover:scale-105 transition-transform"
                  style={{ width: 120, height: 120 }}
                  onClick={() => window.open(photo.foto_url, "_blank")}
                />
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  )
}
