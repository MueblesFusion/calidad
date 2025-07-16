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
  revertida?: boolean
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
        .select("id, plan_id, cantidad, fecha, usuario, revertida")
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
    return libs
      .filter((l) => !l.revertida)
      .reduce((sum, l) => sum + l.cantidad, 0)
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
      toast({
        title: "Cantidad invÃ¡lida",
        description: "Revisa la cantidad a liberar",
        variant: "destructive",
      })
      return
    }
    if (liberadoPor.trim().length === 0) {
      toast({
        title: "Falta nombre",
        description: "Debes ingresar quiÃ©n libera",
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
          revertida: false,
        },
      ])
      if (error) throw error

      toast({
        title: "LiberaciÃ³n registrada",
        description: `Se liberaron ${cantidadLiberar} piezas`,
      })
      setModalLiberarOpen(false)
      await fetchData()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo registrar la liberaciÃ³n",
        variant: "destructive",
      })
    }
  }

  async function handleRevertir(id: string) {
    const { error } = await supabase
      .from("liberaciones")
      .update({ revertida: true })
      .eq("id", id)

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo revertir la liberaciÃ³n",
        variant: "destructive",
      })
    } else {
      toast({
        title: "LiberaciÃ³n revertida",
        description: "Se ha marcado como revertida correctamente.",
      })
      await fetchData()
    }
  }

  const planesFiltrados = planes.filter((plan) => {
    const filtro = filtroTexto.trim().toLowerCase()
    if (!filtro) return true
    const textoPlan = `${plan.cliente} ${plan.pedido} ${plan.producto} ${plan.area} ${plan.color} ${plan.lf} ${plan.pt} ${plan.lp}`.toLowerCase()
    return textoPlan.includes(filtro)
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-4">Planes de Trabajo</h1>

        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
          <Input
            type="text"
            placeholder="Buscar por cliente, pedido, producto, Ã¡rea..."
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
          planesFiltrados.map((plan) => {
            const pendiente = calcularPendiente(plan)
            const liberado = calcularLiberado(plan.id)
            return (
              <Card key={plan.id}>
                <CardHeader className="flex justify-between items-center">
                  <CardTitle>{plan.producto} - {plan.cliente}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Pendiente: {pendiente}</p>
                  <Button onClick={() => abrirModalLiberar(plan)} disabled={pendiente <= 0}>
                    Liberar
                  </Button>
                  <Button variant="secondary" onClick={() => abrirModalHistorial(plan)} className="ml-2">
                    Ver Liberaciones
                  </Button>
                </CardContent>
              </Card>
            )
          })
        )}

        {/* Modal Liberaciones */}
        <Dialog open={modalHistorialOpen} onOpenChange={setModalHistorialOpen}>
          <DialogContent className="max-w-full md:max-w-2xl overflow-x-auto">
            <DialogHeader>
              <DialogTitle>Historial de Liberaciones</DialogTitle>
            </DialogHeader>
            {selectedPlan && liberaciones[selectedPlan.id]?.length ? (
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-2 py-1">Cantidad</th>
                    <th className="border px-2 py-1">Usuario</th>
                    <th className="border px-2 py-1">Fecha</th>
                    <th className="border px-2 py-1">Revertida</th>
                    <th className="border px-2 py-1">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {liberaciones[selectedPlan.id].map((lib) => (
                    <tr key={lib.id}>
                      <td className="border px-2 py-1 text-center">{lib.cantidad}</td>
                      <td className="border px-2 py-1 text-center">{lib.usuario}</td>
                      <td className="border px-2 py-1 text-center">{new Date(lib.fecha).toLocaleString()}</td>
                      <td className="border px-2 py-1 text-center">{lib.revertida ? "SÃ­" : "No"}</td>
                      <td className="border px-2 py-1 text-center">
                        {!lib.revertida && (
                          <Button size="sm" variant="destructive" onClick={() => handleRevertir(lib.id)}>
                            Revertir
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted-foreground text-sm">No hay liberaciones registradas.</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Liberar */}
        <Dialog open={modalLiberarOpen} onOpenChange={setModalLiberarOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Liberar Piezas</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleLiberar()
              }}
              className="space-y-4"
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
                <Label>QuiÃ©n libera</Label>
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
