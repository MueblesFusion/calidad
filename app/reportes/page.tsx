"use client"

import React, { useState, useEffect } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Download, X } from "lucide-react"
import Image from "next/image"
import { createClient } from "@supabase/supabase-js"
import * as XLSX from "xlsx"

type Report = {
  id: string
  fecha: string
  area: "SILLAS" | "SALAS" | string
  producto: string
  color: string
  lf: string
  pt: string
  lp: string
  pedido: string
  cliente: string
  defecto: string
  descripcion: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ReportesPage() {
  const { toast } = useToast()

  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [filterCliente, setFilterCliente] = useState("")
  const [filterPedido, setFilterPedido] = useState("")
  const [filterFecha, setFilterFecha] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [fotoSeleccionada, setFotoSeleccionada] = useState<string[]>([])

  async function fetchReports() {
    const { data, error } = await supabase
      .from("defect_reports")
      .select("*")
      .order("fecha", { ascending: false })

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los reportes",
        variant: "destructive",
      })
      return
    }

    setReports(data as Report[])
    setFilteredReports(data as Report[])
  }

  useEffect(() => {
    let filtered = reports

    if (filterCliente.trim() !== "") {
      filtered = filtered.filter((r) =>
        r.cliente.toLowerCase().includes(filterCliente.toLowerCase())
      )
    }

    if (filterPedido.trim() !== "") {
      filtered = filtered.filter((r) =>
        r.pedido.toLowerCase().includes(filterPedido.toLowerCase())
      )
    }

    if (filterFecha.trim() !== "") {
      filtered = filtered.filter((r) => r.fecha === filterFecha)
    }

    setFilteredReports(filtered)
  }, [filterCliente, filterPedido, filterFecha, reports])

  async function obtenerFotos(reportId: string) {
    const { data, error } = await supabase
      .from("defect_report_photos")
      .select("foto_url")
      .eq("report_id", reportId)

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las fotos",
        variant: "destructive",
      })
      return
    }

    if (data && data.length > 0) {
      setFotoSeleccionada(data.map((d) => d.foto_url))
      setModalOpen(true)
    } else {
      toast({
        title: "Sin Fotos",
        description: "Este reporte no tiene fotos asociadas",
      })
    }
  }

  function exportToExcel(area: string) {
    const dataToExport = filteredReports.filter((r) => r.area === area)

    if (dataToExport.length === 0) {
      toast({
        title: "Sin datos",
        description: `No hay reportes para exportar en ${area}`,
        variant: "destructive",
      })
      return
    }

    const worksheetData = dataToExport.map((r) => ({
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
    }))

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reportes")

    XLSX.writeFile(workbook, `Reportes_${area}_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const sillasReports = filteredReports.filter((r) => r.area === "SILLAS")
  const salasReports = filteredReports.filter((r) => r.area === "SALAS")

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">

        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filterFecha">Fecha</Label>
              <Input
                type="date"
                id="filterFecha"
                value={filterFecha}
                onChange={(e) => setFilterFecha(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filterCliente">Cliente</Label>
              <Input
                id="filterCliente"
                placeholder="Buscar por cliente"
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filterPedido">Pedido</Label>
              <Input
                id="filterPedido"
                placeholder="Buscar por pedido"
                value={filterPedido}
                onChange={(e) => setFilterPedido(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Defectos - SILLAS</CardTitle>
            <Button
              className="bg-green-600 hover:bg-green-700 flex items-center"
              onClick={() => exportToExcel("SILLAS")}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </CardHeader>
          <CardContent>
            {sillasReports.length === 0 ? (
              <p>No hay reportes de SILLAS.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 text-sm min-w-[900px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1">Fecha</th>
                      <th className="border px-2 py-1">Producto</th>
                      <th className="border px-2 py-1">Color</th>
                      <th className="border px-2 py-1">LF</th>
                      <th className="border px-2 py-1">PT</th>
                      <th className="border px-2 py-1">LP</th>
                      <th className="border px-2 py-1">Pedido</th>
                      <th className="border px-2 py-1">Cliente</th>
                      <th className="border px-2 py-1">Defecto</th>
                      <th className="border px-2 py-1">Descripción</th>
                      <th className="border px-2 py-1">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sillasReports.map((r) => (
                      <tr key={r.id}>
                        <td className="border px-2 py-1">{r.fecha}</td>
                        <td className="border px-2 py-1">{r.producto}</td>
                        <td className="border px-2 py-1">{r.color}</td>
                        <td className="border px-2 py-1">{r.lf}</td>
                        <td className="border px-2 py-1">{r.pt}</td>
                        <td className="border px-2 py-1">{r.lp}</td>
                        <td className="border px-2 py-1">{r.pedido}</td>
                        <td className="border px-2 py-1">{r.cliente}</td>
                        <td className="border px-2 py-1">{r.defecto}</td>
                        <td className="border px-2 py-1">{r.descripcion}</td>
                        <td className="border px-2 py-1 text-center">
                          <Button size="sm" onClick={() => obtenerFotos(r.id)}>
                            Ver Fotos
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Defectos - SALAS</CardTitle>
            <Button
              className="bg-green-600 hover:bg-green-700 flex items-center"
              onClick={() => exportToExcel("SALAS")}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </CardHeader>
          <CardContent>
            {salasReports.length === 0 ? (
              <p>No hay reportes de SALAS.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 text-sm min-w-[900px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1">Fecha</th>
                      <th className="border px-2 py-1">Producto</th>
                      <th className="border px-2 py-1">Color</th>
                      <th className="border px-2 py-1">LF</th>
                      <th className="border px-2 py-1">PT</th>
                      <th className="border px-2 py-1">LP</th>
                      <th className="border px-2 py-1">Pedido</th>
                      <th className="border px-2 py-1">Cliente</th>
                      <th className="border px-2 py-1">Defecto</th>
                      <th className="border px-2 py-1">Descripción</th>
                      <th className="border px-2 py-1">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salasReports.map((r) => (
                      <tr key={r.id}>
                        <td className="border px-2 py-1">{r.fecha}</td>
                        <td className="border px-2 py-1">{r.producto}</td>
                        <td className="border px-2 py-1">{r.color}</td>
                        <td className="border px-2 py-1">{r.lf}</td>
                        <td className="border px-2 py-1">{r.pt}</td>
                        <td className="border px-2 py-1">{r.lp}</td>
                        <td className="border px-2 py-1">{r.pedido}</td>
                        <td className="border px-2 py-1">{r.cliente}</td>
                        <td className="border px-2 py-1">{r.defecto}</td>
                        <td className="border px-2 py-1">{r.descripcion}</td>
                        <td className="border px-2 py-1 text-center">
                          <Button size="sm" onClick={() => obtenerFotos(r.id)}>
                            Ver Fotos
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Fotos del Reporte</DialogTitle>
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-3 right-3"
                aria-label="Cerrar"
              >
                <X className="h-6 w-6" />
              </button>
            </DialogHeader>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 p-4">
              {fotoSeleccionada.length === 0 && <p>No hay fotos para mostrar.</p>}
              {fotoSeleccionada.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => window.open(url, "_blank")}
                  className="rounded overflow-hidden border p-1 hover:shadow-lg transition-shadow"
                  aria-label={`Abrir foto ${idx + 1} en nueva pestaña`}
                >
                  <Image
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    width={120}
                    height={120}
                    className="object-cover"
                    style={{ borderRadius: 6 }}
                  />
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
