"use client"

import React, { useEffect, useState } from "react"
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
import { createClient } from "@supabase/supabase-js"
import { Loader2 } from "lucide-react"
import XLSX from "xlsx-js-style"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type PlanTrabajo = {
  id: string
  area: "SILLAS" | "SALAS" | string
  cantidad: number
  producto: string
  color: string
  lf: string
  pt: string
  lp: string
  pedido: string
  cliente: string
  fecha: string
  liberado: number
}

type Liberacion = {
  id: string
  plan_id: string
  cantidad: number
  fecha: string
  usuario: string
}

export default function PlanesPage() {
  const { toast } = useToast()
  const [planes, setPlanes] = useState<PlanTrabajo[]>([])
  const [liberaciones, setLiberaciones] = useState<Record<string, Liberacion[]>>({})
  const [loading, setLoading] = useState(true)

  const [modalLiberarOpen, setModalLiberarOpen] = useState(false)
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanTrabajo | null>(null)

  const [cantidadLiberar, setCantidadLiberar] = useState<number>(0)
  const [liberadoPor, setLiberadoPor] = useState("")
  const [filtroTexto, setFiltroTexto] = useState("")
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("")
  const [filtroFechaFin, setFiltroFechaFin] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: planesData } = await supabase
        .from("planes_trabajo")
        .select("*")
        .order("fecha", { ascending: false })

      const { data: planesSillasData } = await supabase
        .from("planes_trabajo_sillas")
        .select("*")
        .order("fecha", { ascending: false })

      const { data: liberacionesData } = await supabase
        .from("liberaciones")
        .select("id, plan_id, cantidad, fecha, usuario")
        .order("fecha", { ascending: false })

      // Forzar area = "SILLAS" para planes_trabajo_sillas
      const planesSillasConArea = (planesSillasData || []).map(plan => ({
        ...plan,
        area: "SILLAS"
      }))

      // Combinar todos los planes
      const todosPlanes = [...(planesData || []), ...planesSillasConArea]

      setPlanes(todosPlanes)

      const grouped: Record<string, Liberacion[]> = {}
      ;(liberacionesData || []).forEach((lib) => {
        if (!grouped[lib.plan_id]) grouped[lib.plan_id] = []
        grouped[lib.plan_id].push(lib)
      })
      setLiberaciones(grouped)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  function calcularLiberado(planId: string): number {
    const libs = liberaciones[planId] || []
    return libs.reduce((sum, l) => sum + l.cantidad, 0)
  }

  function calcularPendiente(plan: PlanTrabajo): number {
    return plan.cantidad - calcularLiberado(plan.id)
  }

  function abrirModalLiberar(plan: PlanTrabajo) {
    setSelectedPlan(plan)
    setCantidadLiberar(0)
    setLiberadoPor("")
    setModalLiberarOpen(true)
  }

  function abrirModalHistorial(plan: PlanTrabajo) {
    setSelectedPlan(plan)
    setModalHistorialOpen(true)
  }

  async function handleLiberar() {
    if (!selectedPlan) return
    if (cantidadLiberar <= 0 || cantidadLiberar > calcularPendiente(selectedPlan)) {
      toast({ title: "Cantidad inválida", description: "Revisa la cantidad a liberar", variant: "destructive" })
      return
    }
    if (liberadoPor.trim().length === 0) {
      toast({ title: "Falta nombre", description: "Debes ingresar quién libera", variant: "destructive" })
      return
    }
    try {
      const { error } = await supabase.from("liberaciones").insert([
        {
          plan_id: selectedPlan.id,
          cantidad: cantidadLiberar,
          usuario: liberadoPor.trim(),
          fecha: new Date().toISOString(),
        },
      ])
      if (error) throw error

      toast({ title: "Liberación registrada", description: `Se liberaron ${cantidadLiberar} piezas` })
      setModalLiberarOpen(false)
      await fetchData()
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "No se pudo registrar la liberación", variant: "destructive" })
    }
  }

  const planesFiltrados = planes.filter((plan) => {
    const filtro = filtroTexto.trim().toLowerCase()
    if (!filtro) return true
    const textoPlan = `${plan.cliente} ${plan.pedido} ${plan.producto} ${plan.area} ${plan.color} ${plan.lf} ${plan.pt} ${plan.lp}`.toLowerCase()
    return textoPlan.includes(filtro)
  })

  // Para exportar, separamos planes por área
  const planesSillas = planesFiltrados.filter((p) => p.area === "SILLAS")
  const planesSalas = planesFiltrados.filter((p) => p.area === "SALAS")

  function exportarLiberacionesAExcel() {
    // Función para preparar datos para cada área
    function prepararDatos(planesArea: PlanTrabajo[]) {
      const data: any[] = []

      planesArea.forEach((plan) => {
        const historial = liberaciones[plan.id] || []
        historial.forEach((lib) => {
          const fechaLib = new Date(lib.fecha)
          if (
            (filtroFechaInicio && fechaLib < new Date(filtroFechaInicio)) ||
            (filtroFechaFin && fechaLib > new Date(filtroFechaFin))
          ) {
            return
          }

          const liberado = calcularLiberado(plan.id)
          const pendiente = plan.cantidad - liberado

          data.push({
            "Fecha de liberación": fechaLib.toLocaleString(),
            Producto: plan.producto,
            Color: plan.color,
            LF: plan.lf,
            PT: plan.pt,
            LP: plan.lp,
            Pedido: plan.pedido,
            Cliente: plan.cliente,
            Cantidad: plan.cantidad,
            Liberado: liberado,
            Pendiente: pendiente,
            "Cantidad liberada": lib.cantidad,
            Usuario: lib.usuario,
          })
        })
      })

      return data
    }

    const dataSillas = prepararDatos(planesSillas)
    const dataSalas = prepararDatos(planesSalas)

    if (dataSillas.length === 0 && dataSalas.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay liberaciones para exportar con el filtro aplicado",
        variant: "destructive",
      })
      return
    }

    // Helper para crear hoja con estilos
    function crearHoja(data: any[], nombreHoja: string) {
      const worksheet = XLSX.utils.json_to_sheet(data, { origin: 1 })
      const headers = Object.keys(data[0] || {})

      // Título con rango de fechas arriba (fila 1)
      let titulo = "Liberaciones"
      if (filtroFechaInicio && filtroFechaFin) {
        titulo = `Liberaciones del ${new Date(filtroFechaInicio).toLocaleDateString()} al ${new Date(filtroFechaFin).toLocaleDateString()}`
      } else if (filtroFechaInicio) {
        titulo = `Liberaciones desde ${new Date(filtroFechaInicio).toLocaleDateString()}`
      } else if (filtroFechaFin) {
        titulo = `Liberaciones hasta ${new Date(filtroFechaFin).toLocaleDateString()}`
      }

      worksheet["A1"] = {
        v: titulo,
        t: "s",
        s: {
          font: { color: { rgb: "FF0000" }, bold: true, sz: 14 },
          alignment: { horizontal: "center", vertical: "center" },
        },
      }
      // Merge título en toda la fila de encabezado
      worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }]

      // Estilo encabezados (fila 2)
      headers.forEach((header, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ c: colIdx, r: 1 })
        worksheet[cellRef] = {
          v: header,
          t: "s",
          s: {
            fill: { fgColor: { rgb: "404040" } },
            font: { color: { rgb: "FFFFFF" }, bold: true },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
          },
        }
      })

      // Estilo filas de datos (desde fila 3)
      for (let row = 2; row < data.length + 2; row++) {
        const fillColor = row % 2 === 0 ? "FFFFFF" : "F2F2F2"
        for (let col = 0; col < headers.length; col++) {
          const cellRef = XLSX.utils.encode_cell({ c: col, r: row })
          if (!worksheet[cellRef]) continue
          worksheet[cellRef].s = {
            fill: { fgColor: { rgb: fillColor } },
            font: { color: { rgb: "000000" } },
            alignment: { horizontal: "left", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
          }
        }
      }

      // Auto ancho columnas
      worksheet["!cols"] = headers.map((header) => {
        const maxLength = Math.max(
          header.length,
          ...data.map((d) => (d[header] ? d[header].toString().length : 0))
        )
        return { wch: maxLength + 5 }
      })

      // Filtros en fila de encabezado (fila 2)
      const lastCol = String.fromCharCode(65 + headers.length - 1)
      worksheet["!autofilter"] = {
        ref: `A2:${lastCol}${data.length + 2}`,
      }

      return worksheet
    }

    const wb = XLSX.utils.book_new()

    if (dataSillas.length > 0) {
      const wsSillas = crearHoja(dataSillas, "SILLAS")
      XLSX.utils.book_append_sheet(wb, wsSillas, "SILLAS")
    }

    if (dataSalas.length > 0) {
      const wsSalas = crearHoja(dataSalas, "SALAS")
      XLSX.utils.book_append_sheet(wb, wsSalas, "SALAS")
    }

    XLSX.writeFile(wb, "liberaciones_planes_trabajo.xlsx")
  }
  function renderTabla(area: "SILLAS" | "SALAS") {
    const planesArea = planesFiltrados.filter((p) => p.area === area)
    const gruposPorLp: Record<string, PlanTrabajo[]> = {}

    planesArea.forEach((plan) => {
      if (!gruposPorLp[plan.lp]) gruposPorLp[plan.lp] = []
      gruposPorLp[plan.lp].push(plan)
    })

    const lotesOrdenados = Object.keys(gruposPorLp).sort()

    return (
      <Card key={area}>
        <CardHeader><CardTitle>{area}</CardTitle></CardHeader>
        <CardContent>
          {planesArea.length === 0 ? (
            <p>No hay planes registrados para {area}.</p>
          ) : (
            lotesOrdenados.map((lp) => (
              <div key={lp} className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Lote: {lp}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border text-sm min-w-[1000px]">
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
                        <th className="border px-2 py-1">Cantidad</th>
                        <th className="border px-2 py-1">Liberado</th>
                        <th className="border px-2 py-1">Pendiente</th>
                        <th className="border px-2 py-1">Acciones</th>
                        <th className="border px-2 py-1">Historial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gruposPorLp[lp].map((plan) => {
                        const liberado = calcularLiberado(plan.id)
                        const pendiente = calcularPendiente(plan)
                        return (
                          <tr key={plan.id}>
                            <td className="border px-2 py-1">{new Date(plan.fecha).toLocaleDateString()}</td>
                            <td className="border px-2 py-1">{plan.producto}</td>
                            <td className="border px-2 py-1">{plan.color}</td>
                            <td className="border px-2 py-1">{plan.lf}</td>
                            <td className="border px-2 py-1">{plan.pt}</td>
                            <td className="border px-2 py-1">{plan.lp}</td>
                            <td className="border px-2 py-1">{plan.pedido}</td>
                            <td className="border px-2 py-1">{plan.cliente}</td>
                            <td className="border px-2 py-1">{plan.cantidad}</td>
                            <td className="border px-2 py-1">{liberado}</td>
                            <td className="border px-2 py-1">{pendiente}</td>
                            <td className="border px-2 py-1 text-center">
                              <Button size="sm" onClick={() => abrirModalLiberar(plan)} disabled={pendiente <= 0}>
                                Liberar
                              </Button>
                            </td>
                            <td className="border px-2 py-1 text-center">
                              <Button size="sm" variant="secondary" onClick={() => abrirModalHistorial(plan)}>
                                Liberaciones
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-4">Planes de Trabajo</h1>

        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-2">
          <Input
            type="text"
            placeholder="Buscar por cliente, pedido, producto, área..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
          <Input type="date" value={filtroFechaInicio} onChange={(e) => setFiltroFechaInicio(e.target.value)} />
          <Input type="date" value={filtroFechaFin} onChange={(e) => setFiltroFechaFin(e.target.value)} />
          <Button onClick={exportarLiberacionesAExcel} className="bg-green-600 hover:bg-green-700 text-white">
            Exportar Excel
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin h-8 w-8 text-gray-600" />
          </div>
        ) : (
          <>
            {renderTabla("SILLAS")}
            {renderTabla("SALAS")}
          </>
        )}

        {/* Modal Liberar */}
        <Dialog open={modalLiberarOpen} onOpenChange={setModalLiberarOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Liberar piezas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Label>Cantidad a liberar</Label>
              <Input
                type="number"
                min={1}
                max={selectedPlan ? calcularPendiente(selectedPlan) : 0}
                value={cantidadLiberar}
                onChange={(e) => setCantidadLiberar(Number(e.target.value))}
              />
              <Label>Usuario</Label>
              <Input
                type="text"
                value={liberadoPor}
                onChange={(e) => setLiberadoPor(e.target.value)}
                placeholder="Nombre de quien libera"
              />
              <Button onClick={handleLiberar} className="w-full">
                Liberar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Historial */}
        <Dialog open={modalHistorialOpen} onOpenChange={setModalHistorialOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Historial de liberaciones</DialogTitle>
            </DialogHeader>
            {selectedPlan && (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full border text-sm min-w-[600px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1">Fecha</th>
                      <th className="border px-2 py-1">Cantidad</th>
                      <th className="border px-2 py-1">Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(liberaciones[selectedPlan.id] || []).map((lib) => (
                      <tr key={lib.id}>
                        <td className="border px-2 py-1">{new Date(lib.fecha).toLocaleString()}</td>
                        <td className="border px-2 py-1">{lib.cantidad}</td>
                        <td className="border px-2 py-1">{lib.usuario}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
