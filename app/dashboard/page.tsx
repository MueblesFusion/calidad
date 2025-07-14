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
  Legend,
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

  // Estadísticas por área
  const areaStats = filteredReports.reduce((acc, report) => {
    acc[report.area] = (acc[report.area] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const areaChartData = Object.entries(areaStats).map(([area, count]) => ({
    area,
    count,
    percentage: ((count / filteredReports.length) * 100).toFixed(1),
  }))

  // Estadísticas por defecto
  const defectStats = filteredReports.reduce((acc, report) => {
    acc[report.defecto] = (acc[report.defecto] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topDefects = Object.entries(defectStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([defecto, count]) => ({
      defecto: defecto.length > 20 ? defecto.substring(0, 20) + "..." : defecto,
      count,
      percentage: ((count / filteredReports.length) * 100).toFixed(1),
    }))

  const pieData = areaChartData.map((item, index) => ({
    name: item.area,
    value: item.count,
    color: COLORS[index % COLORS.length],
  }))

  // Nuevas estadísticas por defecto (Pie)
  const defectPieData = Object.entries(defectStats).map(([defecto, count], index) => ({
    name: defecto.length > 20 ? defecto.substring(0, 20) + "..." : defecto,
    value: count,
    color: COLORS[index % COLORS.length],
  }))

  // Defectos por área (stacked bar chart)
  const defectByArea: Record<string, Record<string, number>> = {}
  filteredReports.forEach((report) => {
    if (!defectByArea[report.defecto]) {
      defectByArea[report.defecto] = {}
    }
    defectByArea[report.defecto][report.area] = (defectByArea[report.defecto][report.area] || 0) + 1
  })

  const stackedData = Object.entries(defectByArea).map(([defecto, areas]) => ({
    defecto: defecto.length > 20 ? defecto.substring(0, 20) + "..." : defecto,
    SILLAS: areas["SILLAS"] || 0,
    SALAS: areas["SALAS"] || 0,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
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
                {isFiltering ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Filtrando...</> : "Aplicar Filtro"}
              </Button>
              <Button variant="outline" onClick={clearFilter}>
                Limpiar
              </Button>
              <div className="ml-auto">
                <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Exportar Excel</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card><CardHeader><CardTitle className="text-sm font-medium">Total Defectos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{filteredReports.length}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm font-medium">Defectos Sillas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{areaStats.SILLAS || 0}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm font-medium">Defectos Salas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{areaStats.SALAS || 0}</div></CardContent></Card>
        </div>

        {/* Gráficas existentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card><CardHeader><CardTitle>Defectos por Área</CardTitle></CardHeader><CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="area" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Distribución por Área</CardTitle></CardHeader><CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent></Card>
        </div>

        {/* Top 10 defectos */}
        <Card>
          <CardHeader><CardTitle>Top 10 Defectos Más Frecuentes</CardTitle></CardHeader>
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

        {/* NUEVAS GRÁFICAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Pie Chart por defecto */}
          <Card>
            <CardHeader><CardTitle>Distribución por Tipo de Defecto</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={defectPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    dataKey="value"
                  >
                    {defectPieData.map((entry, index) => (
                      <Cell key={`cell-defecto-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stacked Bar Chart por área y defecto */}
          <Card>
            <CardHeader><CardTitle>Defectos por Tipo y Área</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stackedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="defecto" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="SILLAS" stackId="a" fill="#8884d8" />
                  <Bar dataKey="SALAS" stackId="a" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
