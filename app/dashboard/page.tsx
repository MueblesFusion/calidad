"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  LineChart,
  Line,
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
      "Fecha Creación": report.created_at
        ? new Date(report.created_at).toLocaleDateString()
        : "",
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

  // Estadísticas generales
  const areaStats = filteredReports.reduce((acc, report) => {
    acc[report.area] = (acc[report.area] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const areaChartData = Object.entries(areaStats).map(([area, count]) => ({
    area,
    count,
    percentage: ((count / filteredReports.length) * 100).toFixed(1),
  }))

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

  // Gráfico por defecto y área
  const stackedData = filteredReports.reduce((acc, report) => {
    const key = report.defecto.length > 20 ? report.defecto.substring(0, 20) + "..." : report.defecto
    if (!acc[key]) acc[key] = { defecto: key, SILLAS: 0, SALAS: 0 }
    acc[key][report.area] = (acc[key][report.area] || 0) + 1
    return acc
  }, {} as Record<string, { defecto: string; SILLAS: number; SALAS: number }>)

  const stackedChartData = Object.values(stackedData).filter(
    (item) => item.SILLAS + item.SALAS >= 2
  )

  // Gráfico por fecha
  const trendData = filteredReports.reduce((acc, report) => {
    const fecha = report.fecha
    if (!acc[fecha]) acc[fecha] = { fecha, count: 0 }
    acc[fecha].count += 1
    return acc
  }, {} as Record<string, { fecha: string; count: number }>)

  const trendChartData = Object.values(trendData).sort((a, b) => a.fecha.localeCompare(b.fecha))

  const pieDefectData = Object.entries(defectStats).map(([defecto, count], index) => ({
    name: defecto.length > 20 ? defecto.substring(0, 20) + "..." : defecto,
    value: count,
    color: COLORS[index % COLORS.length],
  }))

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
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
              <Button variant="outline" onClick={clearFilter}>Limpiar</Button>
              <div className="ml-auto">
                <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Exportar Excel</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Defectos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredReports.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
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
            <CardHeader className="pb-2">
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
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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

        {/* NUEVAS GRÁFICAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Tipo de Defecto</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieDefectData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieDefectData.map((entry, index) => (
                      <Cell key={`pie-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Defectos por Tipo y Área</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stackedChartData}>
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

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Tendencia Diaria de Defectos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
