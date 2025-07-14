"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient" // Asumo tienes este archivo para la instancia supabase
import { ExportToCsv } from "export-to-csv"
import { X } from "lucide-react"

type DefectPhoto = {
  id: string
  report_id: string
  foto_url: string
  created_at: string
}

type DefectReport = {
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
  created_at: string
  photos?: DefectPhoto[]
}

export default function ReportesPage() {
  const [reports, setReports] = useState<DefectReport[]>([])
  const [filteredReports, setFilteredReports] = useState<DefectReport[]>([])
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedReport, setSelectedReport] = useState<DefectReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    setLoading(true)
    try {
      // Traemos defectos con sus fotos (left join simulada)
      const { data, error } = await supabase
        .from("defect_reports")
        .select(`
          *,
          defect_report_photos (
            id,
            report_id,
            foto_url,
            created_at
          )
        `)
        .order("fecha", { ascending: false })

      if (error) throw error
      setReports(data || [])
      setFilteredReports(data || [])
    } catch (error) {
      toast({
        title: "Error al cargar reportes",
        description: (error as any).message || "Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrado simple por texto y fechas
  useEffect(() => {
    let filtered = [...reports]

    if (startDate && endDate) {
      filtered = filtered.filter((r) => r.fecha >= startDate && r.fecha <= endDate)
    }
    if (search.trim()) {
      const s = search.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.cliente.toLowerCase().includes(s) ||
          r.pedido.toLowerCase().includes(s) ||
          r.defecto.toLowerCase().includes(s)
      )
    }
    setFilteredReports(filtered)
  }, [search, startDate, endDate, reports])

  function exportToCsv(areaFilter: string) {
    const dataToExport = filteredReports
      .filter((r) => r.area === areaFilter)
      .map((r) => ({
        Fecha: r.fecha,
        Área: r.area,
        Producto: r.producto,
        Color: r.color,
        LF: r.lf,
        PT: r.pt,
        LP: r.lp,
        Pedido: r.pedido,
        Cliente: r.cliente,
        Defecto: r.defecto,
        Descripción: r.descripcion,
        Fotos: r.photos ? r.photos.map((p) => p.foto_url).join(", ") : "",
      }))

    const options = {
      filename: `Reportes_${areaFilter}_${format(new Date(), "yyyyMMdd_HHmmss")}`,
      fieldSeparator: ",",
      quoteStrings: '"',
      decimalSeparator: ".",
      showLabels: true,
      showTitle: true,
      title: `Reportes de Defectos - ${areaFilter}`,
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
    }

    const csvExporter = new ExportToCsv(options)
    csvExporter.generateCsv(dataToExport)
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-center">Lista de Reportes de Defectos</h1>

      {/* Filtros */}
      <div className="max-w-4xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Fecha inicio"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="Fecha fin"
        />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, pedido o defecto"
          className="md:col-span-2"
        />
      </div>

      {/* Cards para SILLAS y SALAS */}
      <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2">
        {/* SILLAS */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Defectos SILLAS</CardTitle>
            <Button variant="outline" className="text-green-600 border-green-600" onClick={() => exportToCsv("SILLAS")}>
              Exportar Excel
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Cargando...</p>
            ) : filteredReports.filter((r) => r.area === "SILLAS").length === 0 ? (
              <p className="text-center text-gray-500">No hay defectos registrados para SILLAS</p>
            ) : (
              <table className="w-full table-auto border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Fecha</th>
                    <th className="border px-2 py-1 text-left">Producto</th>
                    <th className="border px-2 py-1 text-left">Color</th>
                    <th className="border px-2 py-1 text-left">LF</th>
                    <th className="border px-2 py-1 text-left">PT</th>
                    <th className="border px-2 py-1 text-left">LP</th>
                    <th className="border px-2 py-1 text-left">Pedido</th>
                    <th className="border px-2 py-1 text-left">Cliente</th>
                    <th className="border px-2 py-1 text-left">Defecto</th>
                    <th className="border px-2 py-1 text-left">Descripción</th>
                    <th className="border px-2 py-1 text-center">Fotos</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports
                    .filter((r) => r.area === "SILLAS")
                    .map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="border px-2 py-1">{report.fecha}</td>
                        <td className="border px-2 py-1">{report.producto}</td>
                        <td className="border px-2 py-1">{report.color}</td>
                        <td className="border px-2 py-1">{report.lf}</td>
                        <td className="border px-2 py-1">{report.pt}</td>
                        <td className="border px-2 py-1">{report.lp}</td>
                        <td className="border px-2 py-1">{report.pedido}</td>
                        <td className="border px-2 py-1">{report.cliente}</td>
                        <td className="border px-2 py-1">{report.defecto}</td>
                        <td className="border px-2 py-1">{report.descripcion}</td>
                        <td className="border px-2 py-1 text-center">
                          <Button size="sm" onClick={() => setSelectedReport(report)}>
                            Ver Fotos
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* SALAS */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Defectos SALAS</CardTitle>
            <Button variant="outline" className="text-green-600 border-green-600" onClick={() => exportToCsv("SALAS")}>
              Exportar Excel
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Cargando...</p>
            ) : filteredReports.filter((r) => r.area === "SALAS").length === 0 ? (
              <p className="text-center text-gray-500">No hay defectos registrados para SALAS</p>
            ) : (
              <table className="w-full table-auto border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Fecha</th>
                    <th className="border px-2 py-1 text-left">Producto</th>
                    <th className="border px-2 py-1 text-left">Color</th>
                    <th className="border px-2 py-1 text-left">LF</th>
                    <th className="border px-2 py-1 text-left">PT</th>
                    <th className="border px-2 py-1 text-left">LP</th>
                    <th className="border px-2 py-1 text-left">Pedido</th>
                    <th className="border px-2 py-1 text-left">Cliente</th>
                    <th className="border px-2 py-1 text-left">Defecto</th>
                    <th className="border px-2 py-1 text-left">Descripción</th>
                    <th className="border px-2 py-1 text-center">Fotos</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports
                    .filter((r) => r.area === "SALAS")
                    .map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="border px-2 py-1">{report.fecha}</td>
                        <td className="border px-2 py-1">{report.producto}</td>
                        <td className="border px-2 py-1">{report.color}</td>
                        <td className="border px-2 py-1">{report.lf}</td>
                        <td className="border px-2 py-1">{report.pt}</td>
                        <td className="border px-2 py-1">{report.lp}</td>
                        <td className="border px-2 py-1">{report.pedido}</td>
                        <td className="border px-2 py-1">{report.cliente}</td>
                        <td className="border px-2 py-1">{report.defecto}</td>
                        <td className="border px-2 py-1">{report.descripcion}</td>
                        <td className="border px-2 py-1 text-center">
                          <Button size="sm" onClick={() => setSelectedReport(report)}>
                            Ver Fotos
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal fotos */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setSelectedReport(null)} // cerrar modal al click fuera
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto p-6"
            onClick={(e) => e.stopPropagation()} // evitar cerrar al click dentro
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Fotos del Reporte</h3>
              <button
                onClick={() => setSelectedReport(null)}
                aria-label="Cerrar modal"
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 max-h-[60vh] overflow-auto">
              {selectedReport.photos && selectedReport.photos.length > 0 ? (
                selectedReport.photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.foto_url}
                    alt="Foto defecto"
                    className="cursor-pointer object-cover rounded border border-gray-300 hover:scale-105 transition-transform"
                    style={{ width: 120, height: 120 }}
                    onClick={() => window.open(photo.foto_url, "_blank")}
                    loading="lazy"
                  />
                ))
              ) : (
                <p>No hay fotos para este reporte.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
