"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Download, Filter, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts"
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
      console.error("Error loading reports:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los reportes",
        variant: "destructive",
      })
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
      console.error("Error filtering reports:", error)
      toast({
        title: "Error",
        description: "Error al filtrar los reportes",
        variant: "destructive",
      })
    } finally {
      setIsFiltering(false)
    }
  }

  const clearFilter = () => {
    setStartDate("")
    setEndDate("")
    setFilteredReports(reports)
  }

  // Estadísticas por área
  const areaStats = filteredReports.reduce(
    (acc, report) => {
      acc[report.area] = (acc[report.area] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const areaChartData = Object.entries(areaStats).map(([area, count]) => ({
    area,
    count,
    percentage: ((count / filteredReports.length) * 100).toFixed(1),
  }))

  // Estadísticas por defecto
  const defectStats = filteredReports.reduce(
    (acc, report) => {
      acc[report.defecto] = (acc[report.defecto] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topDefects = Object.entries(defectStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([defecto, count]) => ({
      defecto: defecto.length > 20 ? defecto.substring(0, 20) + "..." : defecto,
      count,
      percentage: ((count / filteredReports.length) * 100).toFixed(1),
    }))

  // Datos para gráfico de pie
  const pieData = areaChartData.map((item, index) => ({
    name: item.area,
    value: item.count,
    color: COLORS[index % COLORS.length],
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
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando reportes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Estadísticas de Defectos</h1>
            </div>
            <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Exportar Excel</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Filtros */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros de Fecha</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label htmlFor="startDate">Fecha Inicio</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="endDate">Fecha Fin</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <Button onClick={handleDateFilter} disabled={isFiltering}>
                {isFiltering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Filtrando...
                  </>
                ) : (
                  "Aplicar Filtro"
                )}
              </Button>
              <Button variant="outline" onClick={clearFilter}>
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Defectos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredReports.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Defectos Sillas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{areaStats.SILLAS || 0}</div>
              <p className="text-xs text-muted-foreground">
                {areaStats.SILLAS ? ((areaStats.SILLAS / filteredReports.length) * 100).toFixed(1) : 0}% del total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Defectos Salas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{areaStats.SALAS || 0}</div>
              <p className="text-xs text-muted-foreground">
                {areaStats.SALAS ? ((areaStats.SALAS / filteredReports.length) * 100).toFixed(1) : 0}% del total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Barras por Área */}
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
                  <Tooltip
                    formatter={(value, name) => [value, "Cantidad"]}
                    labelFormatter={(label) => `Área: ${label}`}
                  />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Pie */}
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
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
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
                <Tooltip
                  formatter={(value, name) => [value, "Cantidad"]}
                  labelFormatter={(label) => `Defecto: ${label}`}
                />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
