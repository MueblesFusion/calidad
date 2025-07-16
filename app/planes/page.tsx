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
import * as XLSX from "xlsx"

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
  reversion_de?: string | null
}

export default function PlanesPage() {
  const { toast } = useToast()
  const [planes, setPlanes] = useState<PlanTrabajo[]>([])
  const [liberaciones, setLiberaciones] = useState<Record<string, Liberacion[]>>({})
  const [loading, setLoading] = useState(true)

  // Modales de liberar y historial existentes
  const [modalLiberarOpen, setModalLiberarOpen] = useState(false)
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanTrabajo | null>(null)

  // Nuevos estados para reversión
  const [modalRevertirOpen, setModalRevertirOpen] = useState(false)
  const [liberacionARevertir, setLiberacionARevertir] = useState<Liberacion | null>(null)
  const [cantidadRevertir, setCantidadRevertir] = useState<number>(0)
  const [usuarioReversion, setUsuarioReversion] = useState("")
  const [disponibleParaRevertir, setDisponibleParaRevertir] = useState<number>(0)

  // Estados para liberar normal
  const [cantidadLiberar, setCantidadLiberar] = useState<number>(0)
  const [liberadoPor, setLiberadoPor] = useState("")
  const [filtroTexto, setFiltroTexto] = useState("")

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

      const { data: liberacionesData } = await supabase
        .from("liberaciones")
        .select("id, plan_id, cantidad, fecha, usuario, reversion_de")
        .order("fecha", { ascending: false })

      setPlanes(planesData || [])

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

  // Abrir modal para liberar (normal)
  function abrirModalLiberar(plan: PlanTrabajo) {
    setSelectedPlan(plan)
    setCantidadLiberar(0)
    setLiberadoPor("")
    setModalLiberarOpen(true)
  }

  // Abrir modal historial (sin cambios)
  function abrirModalHistorial(plan: PlanTrabajo) {
    setSelectedPlan(plan)
    setModalHistorialOpen(true)
  }

  // Abrir modal para revertir una liberación
  async function abrirModalRevertir(lib: Liberacion) {
    setLiberacionARevertir(lib)
    setCantidadRevertir(0)
    setUsuarioReversion("")
    setModalRevertirOpen(true)

    // Consultar disponible para revertir en la vista creada
    const { data, error } = await supabase
      .from("vista_reversiones")
      .select("disponible_para_revertir")
      .eq("id_original", lib.id)
      .single()

    if (error) {
      console.error("Error al obtener disponible para revertir:", error)
      setDisponibleParaRevertir(0)
    } else {
      setDisponibleParaRevertir(data?.disponible_para_revertir ?? 0)
    }
  }

  // Guardar reversión en la tabla liberaciones
  async function handleRevertirLiberacion() {
    if (!liberacionARevertir) return

    if (cantidadRevertir <= 0 || cantidadRevertir > disponibleParaRevertir) {
      toast({
        title: "Cantidad inválida",
        description: `Solo puedes revertir hasta ${disponibleParaRevertir} piezas.`,
        variant: "destructive",
      })
      return
    }
    if (usuarioReversion.trim().length === 0) {
      toast({
        title: "Falta nombre",
        description: "Debes ingresar quién revierte la liberación",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("liberaciones").insert([
        {
          plan_id: liberacionARevertir.plan_id,
          cantidad: -cantidadRevertir, // negativa para reversión
          usuario: usuarioReversion.trim(),
          fecha: new Date().toISOString(),
          reversion_de: liberacionARevertir.id,
        },
      ])

      if (error) throw error

      toast({
        title: "Reversión registrada",
        description: `Se revirtieron ${cantidadRevertir} piezas`,
      })
      setModalRevertirOpen(false)
      await fetchData()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo registrar la reversión",
        variant: "destructive",
      })
    }
  }

  // Función para exportar Excel sin cambios
  function exportarLiberacionesAExcel() {
    const data: any[] = []

    planesFiltrados.forEach((plan) => {
      const historial = liberaciones[plan.id] || []
      historial.forEach((lib) => {
        data.push({
          Fecha: new Date(lib.fecha).toLocaleString(),
          Área: plan.area,
          Producto: plan.producto,
          Cliente: plan.cliente,
          Cantidad: lib.cantidad,
          Usuario: lib.usuario,
        })
      })
    })

    if (data.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay liberaciones para exportar con el filtro aplicado",
        variant: "destructive",
      })
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Liberaciones")
    XLSX.writeFile(workbook, "liberaciones.xlsx")
  }

  const planesFiltrados = planes.filter((plan) => {
    const filtro = filtroTexto.trim().toLowerCase()
    if (!filtro) return true
    const textoPlan = `${plan.cliente} ${plan.pedido} ${plan.producto} ${plan.area} ${plan.color} ${plan.lf} ${plan.pt} ${plan.lp}`.toLowerCase()
    return textoPlan.includes(filtro)
  })

  function renderTabla(area: "SILLAS" | "SALAS") {
    const planesArea = planesFiltrados.filter((p) => p.area === area)
    return (
      <Card key={area}>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>{area}</CardTitle>
        </CardHeader>
        <CardContent>
          {planesArea.length === 0 ? (
            <p>No hay planes registrados para {area}.</p>
          ) : (
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
                  {planesArea.map((plan) => {
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
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-4">Planes de Trabajo</h1>

        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
          <Input
            type="text"
            placeholder="Buscar por cliente, pedido, producto, área..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className="mb-2 md:mb-0"
          />
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
            {
