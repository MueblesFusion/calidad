"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Filter, Loader2 } from "lucide-react"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import * as XLSX from "xlsx"
import { getDefectReports, type DefectReport } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export default function DashboardPage() {
  const [reports, setReports] = useState<DefectReport[]>([])
  const [filteredReports, setFilteredReports] = useState<DefectReport[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setIsLoading(true)
      const data = await getDefectReports()
      setReports(data)
      setFilteredReports(data)
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los reportes", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateFilter = async () => {
    try {
      setIsFiltering(true)
      if (!startDate || !endDate) {
        setFilteredReports(reports)
        return
      }

      const filtered = await getDefectReports(startDate, endDate)
      setFilteredReports(filtered)
    } catch (error) {
      toast({ title: "Error", description: "Error al filtrar los reportes", variant: "destructive" })
    } finally {
      setIsFiltering(false)
    }
  }

  const clearFilter = () => {
    setStartDate("")
    setEndDate("")
    setFilteredReports(reports)
  }

  // Acumula la cantidad total de piezas defectuosas
  const totalDefectos = filteredReports.reduce((sum, report) => {
    const cantidad = Number(report.cantidad) || 0
    return sum + cantidad
  }, 0)

  // Estadísticas totales por área sumando cantidad
  const areaStats = filteredReports.reduce((acc, report) => {
    const cantidad = Number(report.cantidad) || 0
    acc[report.area] = (acc[report.area] || 0) + cantidad
    return acc
  }, {} as Record<string, number>)

  const areaChartData = Object.entries(areaStats).map(([area, count]) => ({
    area,
    count,
    percentage: ((count / totalDefectos) * 100).toFixed(1),
  }))

  // Estadísticas por defecto sumando cantidad
  const defectStats = filteredReports.reduce((acc, report) => {
    const cantidad = Number(report.cantidad) || 0
    const defectos = report.defecto?.split(",").map((d) => d.trim()).filter(Boolean) || []
    for (const defecto of defectos) {
      acc[defecto] = (acc[defecto] || 0) + cantidad
    }
    return acc
  }, {} as Record<string, number>)

  const topDefects = Object.entries(defectStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([defecto, count]) => ({
      defecto: defecto.length > 20 ? defecto.slice(0, 20) + "..." : defecto,
      count,
      percentage: ((count / totalDefectos) * 100).toFixed(1),
    }))

  const pieData = areaChartData.map((item, index) => ({
    name: item.area,
    value: item.count,
    color: COLORS[index % COLORS.length],
  }))

  // Defectos por área y tipo sumando cantidad
  const defectosPorArea = filteredReports.reduce((acc, report) => {
    const cantidad = Number(report.cantidad) || 0
    const defectos = report.defecto?.split(",").map((d) => d.trim()).filter(Boolean) || []
    for (const defecto of defectos) {
      if (!acc[report.area]) acc[report.area] = {}
      acc[report.area][defecto] = (acc[report.area][defecto] || 0) + cantidad
    }
    return acc
  }, {} as Record<string, Record<string, number>>)

  const defectosSillasData = Object.entries(defectosPorArea["SILLAS"] || {}).map(([defecto, count]) => ({
    defecto,
    count,
  }))

  const defectosSalasData = Object.entries(defectosPorArea["SALAS"] || {}).map(([defecto, count]) => ({
    defecto,
    count,
  }))

  const exportToExcel = () => {
    const dataToExport = filteredReports.map((report) => ({
      Fecha: report.fecha,
      "Fecha Creación": report.created_at ? new Date(report.created_at).toLocaleDateString() : "",
      Área: report.area,
      Producto: report.producto,
      Color: report.color,
      LF: report.lf,
      PT: report.pt,
      LP: report.lp,
      Pedido: report.pedido,
      Cliente: report.cliente,
      Defecto: report.defecto,
      Descripción: report.descripcion,
      "URL Foto": report.foto_url || "",
      Cantidad: report.cantidad || "",
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reportes de Defectos")

    const fileName = `reporte_defectos_${startDate || "todos"}_${endDate || "todos"}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Cargando reportes...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas de Defectos</h1>
          <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Fecha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <Label htmlFor="startDate">Fecha Inicio</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="endDate">Fecha Fin</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <Button onClick={handleDateFilter} disabled={isFiltering}>
                {isFiltering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Aplicar Filtro
              </Button>
              <Button variant="outline" onClick={clearFilter}>
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tarjetas de Totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {["Total Defectos", "Defectos Sillas", "Defectos Salas"].map((title, i) => {
            const key = i === 1 ? "SILLAS" : i === 2 ? "SALAS" : ""
            const value = i === 0 ? totalDefectos : areaStats[key] || 0
            return (
              <Card key={title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{value}</div>
                  {i > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {(value && totalDefectos ? ((value / totalDefectos) * 100).toFixed(1) : 0) + "%"} del total
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Gráficos por Área */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Defectos por Área</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={areaChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por Área</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos por tipo de defecto por área */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Defectos por Tipo (SILLAS)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={defectosSillasData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="defecto" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Defectos por Tipo (SALAS)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={defectosSalasData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="defecto" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top 10 Defectos */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Defectos Más Frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topDefects} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="defecto" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
