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
}

export default function PlanesPage() {
  const { toast } = useToast()
  const [planes, setPlanes] = useState<PlanTrabajo[]>([])
  const [liberaciones, setLiberaciones] = useState<Record<string, Liberacion[]>>({})
  const [loading, setLoading] = useState(true)

  const [modalLiberarOpen, setModalLiberarOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanTrabajo | null>(null)

  // Inputs liberar
  const [cantidadLiberar, setCantidadLiberar] = useState<number>(0)
  const [liberadoPor, setLiberadoPor] = useState("")

  // Nuevo estado para filtro de búsqueda
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
        .select("id, plan_id, cantidad, fecha, usuario")
        .order("fecha", { ascending: false })

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
  }, [])

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

  async function handleLiberar() {
    if (!selectedPlan) return

    if (cantidadLiberar <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "La cantidad a liberar debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    if (cantidadLiberar > calcularPendiente(selectedPlan)) {
      toast({
        title: "Cantidad excedida",
        description: "No puedes liberar más piezas de las pendientes",
        variant: "destructive",
      })
      return
    }

    if (liberadoPor.trim().length === 0) {
      toast({
        title: "Falta nombre",
        description: "Debes ingresar quién libera",
        variant: "destructive",
      })
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

      toast({
        title: "Liberación registrada",
        description: `Se liberaron ${cantidadLiberar} piezas`,
      })
      setModalLiberarOpen(false)
      await fetchData() // recarga datos para actualizar UI
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo registrar la liberación",
        variant: "destructive",
      })
    }
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
                            <Button
                              size="sm"
                              onClick={() => abrirModalLiberar(plan)}
                              disabled={pendiente <= 0}
                            >
                              Liberar
                            </Button>
                          </td>
                        </tr>

                        {/* Historial liberaciones */}
                        <tr>
                          <td colSpan={12} className="bg-gray-50 p-2 border">
                            <strong>Historial de Liberaciones:</strong>
                            {liberaciones[plan.id]?.length ? (
                              <table className="w-full text-xs mt-1 border border-gray-200">
                                <thead>
                                  <tr className="bg-gray-200">
                                    <th className="border px-1 py-0.5">Cantidad</th>
                                    <th className="border px-1 py-0.5">Usuario</th>
                                    <th className="border px-1 py-0.5">Fecha</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {liberaciones[plan.id].map((lib) => (
                                    <tr key={lib.id} className="text-green-600 font-semibold">
                                      <td className="border px-1 py-0.5 text-center">{lib.cantidad}</td>
                                      <td className="border px-1 py-0.5 text-center">{lib.usuario}</td>
                                      <td className="border px-1 py-0.5 text-center">{new Date(lib.fecha).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-1">No hay liberaciones registradas.</p>
                            )}
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Liberar Piezas</DialogTitle>
              <button
                aria-label="Cerrar"
                className="absolute top-3 right-3"
                onClick={() => setModalLiberarOpen(false)}
              >
                ✕
              </button>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleLiberar()
              }}
              className="space-y-4 p-2"
            >
              <div>
                <Label>Cantidad a liberar</Label>
                <Input
                  type="number"
                  min={1}
                  max={selectedPlan ? calcularPendiente(selectedPlan) : undefined}
                  value={cantidadLiberar}
                  onChange={(e) => setCantidadLiberar(parseInt(e.target.value))}
                  required
                  autoFocus
                />
              </div>
              <div>
                <Label>Quién libera</Label>
                <Input
                  type="text"
                  value={liberadoPor}
                  onChange={(e) => setLiberadoPor(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" onClick={() => setModalLiberarOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
