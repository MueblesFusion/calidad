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
}

type Liberacion = {
  id: string
  plan_id: string
  cantidad_liberada: number
  liberado_por: string
  creado_en: string
  revertido: boolean
  revertido_por?: string | null
  revertido_en?: string | null
}

export default function PlanesPage() {
  const { toast } = useToast()
  const [planes, setPlanes] = useState<PlanTrabajo[]>([])
  const [liberaciones, setLiberaciones] = useState<Record<string, Liberacion[]>>({})
  const [loading, setLoading] = useState(true)

  const [modalLiberarOpen, setModalLiberarOpen] = useState(false)
  const [modalRevertirOpen, setModalRevertirOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanTrabajo | null>(null)

  const [cantidadLiberar, setCantidadLiberar] = useState<number>(0)
  const [liberadoPor, setLiberadoPor] = useState("")

  const [revertidoPor, setRevertidoPor] = useState("")
  const [liberacionSeleccionada, setLiberacionSeleccionada] = useState<Liberacion | null>(null)

  const [filtroTexto, setFiltroTexto] = useState("")

  async function fetchData() {
    setLoading(true)
    try {
      const { data: planesData, error: errorPlanes } = await supabase
        .from("planes_trabajo")
        .select("*")
        .order("fecha", { ascending: false })

      if (errorPlanes) throw errorPlanes

      const { data: liberacionesData, error: errorLiberaciones } = await supabase
        .from("liberaciones")
        .select("*")
        .order("creado_en", { ascending: false })

      if (errorLiberaciones) throw errorLiberaciones

      setPlanes(planesData || [])

      const grouped: Record<string, Liberacion[]> = {}
      (liberacionesData || []).forEach((lib) => {
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

  useEffect(() => {
    fetchData()

    const planesSub = supabase
      .channel("public:planes_trabajo")
      .on("postgres_changes", { event: "*", schema: "public", table: "planes_trabajo" }, fetchData)
      .subscribe()

    const liberacionesSub = supabase
      .channel("public:liberaciones")
      .on("postgres_changes", { event: "*", schema: "public", table: "liberaciones" }, fetchData)
      .subscribe()

    return () => {
      supabase.removeChannel(planesSub)
      supabase.removeChannel(liberacionesSub)
    }
  }, [])

  function calcularLiberado(planId: string): number {
    const libs = liberaciones[planId] || []
    return libs.filter((l) => !l.revertido).reduce((sum, l) => sum + l.cantidad_liberada, 0)
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

  async function handleLiberar() {
    if (!selectedPlan) return

    if (cantidadLiberar <= 0 || cantidadLiberar > calcularPendiente(selectedPlan) || !liberadoPor.trim()) {
      toast({
        title: "Datos inválidos",
        description: "Verifica la cantidad y el nombre de quien libera",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("liberaciones").insert([{
        plan_id: selectedPlan.id,
        cantidad_liberada: cantidadLiberar,
        liberado_por: liberadoPor.trim(),
      }])

      if (error) throw error

      toast({ title: "Liberación registrada", description: `Se liberaron ${cantidadLiberar} piezas` })
      setModalLiberarOpen(false)
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "No se pudo registrar la liberación", variant: "destructive" })
    }
  }

  function abrirModalRevertir(liberacion: Liberacion) {
    setLiberacionSeleccionada(liberacion)
    setRevertidoPor("")
    setModalRevertirOpen(true)
  }

  async function handleRevertir() {
    if (!liberacionSeleccionada || !revertidoPor.trim()) {
      toast({ title: "Falta nombre", description: "Debes ingresar quién revierte", variant: "destructive" })
      return
    }

    try {
      const { error } = await supabase
        .from("liberaciones")
        .update({
          revertido: true,
          revertido_por: revertidoPor.trim(),
          revertido_en: new Date().toISOString(),
        })
        .eq("id", liberacionSeleccionada.id)

      if (error) throw error

      toast({
        title: "Liberación revertida",
        description: `Se revirtió la liberación de ${liberacionSeleccionada.cantidad_liberada} piezas`,
      })
      setModalRevertirOpen(false)
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "No se pudo revertir", variant: "destructive" })
    }
  }

  const planesFiltrados = planes.filter((plan) => {
    const filtro = filtroTexto.trim().toLowerCase()
    if (!filtro) return true
    const texto = `${plan.cliente} ${plan.pedido} ${plan.producto} ${plan.area} ${plan.color} ${plan.lf} ${plan.pt} ${plan.lp}`.toLowerCase()
    return texto.includes(filtro)
  })

  function renderTabla(area: "SILLAS" | "SALAS") {
    const planesArea = planesFiltrados.filter((p) => p.area === area)

    return (
      <Card key={area}>
        <CardHeader><CardTitle>{area}</CardTitle></CardHeader>
        <CardContent>
          {planesArea.length === 0 ? (
            <p>No hay planes registrados para {area}.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border text-sm min-w-[900px]">
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
                  </tr>
                </thead>
                <tbody>
                  {planesArea.map((plan) => {
                    const liberado = calcularLiberado(plan.id)
                    const pendiente = calcularPendiente(plan)
                    return (
                      <React.Fragment key={plan.id}>
                        <tr>
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
                        </tr>
                      </React.Fragment>
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

  function exportarLiberacionesAExcel() {
    const data: any[] = []
    planesFiltrados.forEach((plan) => {
      const historial = liberaciones[plan.id] || []
      historial.forEach((lib) => {
        data.push({
          Fecha: new Date(lib.creado_en).toLocaleString(),
          Área: plan.area,
          Producto: plan.producto,
          Cliente: plan.cliente,
          Cantidad: lib.cantidad_liberada,
          "Liberado por": lib.liberado_por,
          Estado: lib.revertido ? "Revertido" : "Liberado",
          "Revertido por": lib.revertido_por || "-",
          "Fecha reversión": lib.revertido_en ? new Date(lib.revertido_en).toLocaleString() : "-",
        })
      })
    })

    if (data.length === 0) {
      toast({ title: "Sin datos", description: "No hay liberaciones para exportar", variant: "destructive" })
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Liberaciones")
    XLSX.writeFile(workbook, "liberaciones.xlsx")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-4">Planes de Trabajo</h1>
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
          <Input
            type="text"
            placeholder="Buscar por cliente, pedido, producto..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className="mb-2 md:mb-0"
          />
          <Button onClick={exportarLiberacionesAExcel} variant="secondary">
            Exportar Liberaciones
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
      </div>
    </div>
  )
}
