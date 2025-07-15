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
  creado_en: string
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

  // Inputs liberar
  const [cantidadLiberar, setCantidadLiberar] = useState<number>(0)
  const [liberadoPor, setLiberadoPor] = useState("")

  // Inputs revertir
  const [revertidoPor, setRevertidoPor] = useState("")
  const [liberacionSeleccionada, setLiberacionSeleccionada] = useState<Liberacion | null>(null)

  // Cargar planes y liberaciones
  async function fetchData() {
    setLoading(true)
    try {
      const { data: planesData, error: errorPlanes } = await supabase
        .from("planes_trabajo")
        .select("*")
        .order("creado_en", { ascending: false })

      if (errorPlanes) throw errorPlanes

      const { data: liberacionesData, error: errorLiberaciones } = await supabase
        .from("liberaciones")
        .select("*")
        .order("creado_en", { ascending: false })

      if (errorLiberaciones) throw errorLiberaciones

      setPlanes(planesData || [])

      // Agrupar liberaciones por plan_id
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

    // Subscripciones en tiempo real a planes_trabajo
    const planesSub = supabase
      .channel("public:planes_trabajo")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "planes_trabajo" },
        () => {
          fetchData()
        }
      )
      .subscribe()

    // Subscripciones en tiempo real a liberaciones
    const liberacionesSub = supabase
      .channel("public:liberaciones")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "liberaciones" },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(planesSub)
      supabase.removeChannel(liberacionesSub)
    }
  }, [])

  // Calcular liberado y pendiente por plan
  function calcularLiberado(planId: string): number {
    const libs = liberaciones[planId] || []
    return libs.filter((l) => !l.revertido).reduce((sum, l) => sum + l.cantidad_liberada, 0)
  }

  function calcularPendiente(plan: PlanTrabajo): number {
    return plan.cantidad - calcularLiberado(plan.id)
  }

  // Abrir modal liberar
  function abrirModalLiberar(plan: PlanTrabajo) {
    setSelectedPlan(plan)
    setCantidadLiberar(0)
    setLiberadoPor("")
    setModalLiberarOpen(true)
  }

  // Guardar liberación
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
          cantidad_liberada: cantidadLiberar,
          liberado_por: liberadoPor.trim(),
        },
      ])

      if (error) throw error

      toast({
        title: "Liberación registrada",
        description: `Se liberaron ${cantidadLiberar} piezas`,
      })
      setModalLiberarOpen(false)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo registrar la liberación",
        variant: "destructive",
      })
    }
  }

  // Abrir modal revertir
  function abrirModalRevertir(liberacion: Liberacion) {
    setLiberacionSeleccionada(liberacion)
    setRevertidoPor("")
    setModalRevertirOpen(true)
  }

  // Revertir liberación
  async function handleRevertir() {
    if (!liberacionSeleccionada) return

    if (revertidoPor.trim().length === 0) {
      toast({
        title: "Falta nombre",
        description: "Debes ingresar quién revierte",
        variant: "destructive",
      })
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
      toast({
        title: "Error",
        description: "No se pudo revertir la liberación",
        variant: "destructive",
      })
    }
  }

  // Render tabla por área
  function renderTabla(area: "SILLAS" | "SALAS") {
    const planesArea = planes.filter((p) => p.area === area)

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
                    <th className="border px-2 py-1">Creado</th>
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
                          <td className="border px-2 py-1">{new Date(plan.creado_en).toLocaleDateString()}</td>
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

                        {/* Fila con historial de liberaciones */}
                        <tr>
                          <td colSpan={12} className="bg-gray-50 p-2 border">
                            <strong>Historial de Liberaciones:</strong>
                            {liberaciones[plan.id]?.length ? (
                              <table className="w-full text-xs mt-1 border border-gray-200">
                                <thead>
                                  <tr className="bg-gray-200">
                                    <th className="border px-1 py-0.5">Cantidad</th>
                                    <th className="border px-1 py-0.5">Liberado Por</th>
                                    <th className="border px-1 py-0.5">Fecha</th>
                                    <th className="border px-1 py-0.5">Revertido</th>
                                    <th className="border px-1 py-0.5">Revertido Por</th>
                                    <th className="border px-1 py-0.5">Fecha Reversión</th>
                                    <th className="border px-1 py-0.5">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {liberaciones[plan.id].map((lib) => (
                                    <tr key={lib.id} className={lib.revertido ? "line-through text-red-600" : ""}>
                                      <td className="border px-1 py-0.5 text-center">{lib.cantidad_liberada}</td>
                                      <td className="border px-1 py-0.5 text-center">{lib.liberado_por}</td>
                                      <td className="border px-1 py-0.5 text-center">{new Date(lib.creado_en).toLocaleString()}</td>
                                      <td className="border px-1 py-0.5 text-center">{lib.revertido ? "Sí" : "No"}</td>
                                      <td className="border px-1 py-0.5 text-center">{lib.revertido_por || "-"}</td>
                                      <td className="border px-1 py-0.5 text-center">{lib.revertido_en ? new Date(lib.revertido_en).toLocaleString() : "-"}</td>
                                      <td className="border px-1 py-0.5 text-center">
                                        {!lib.revertido && (
                                          <Button size="xs" variant="destructive" onClick={() => abrirModalRevertir(lib)}>
                                            Revertir
                                          </Button>
                                        )}
                                      </td>
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
                  placeholder="Nombre"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setModalLiberarOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={cantidadLiberar <= 0 || liberadoPor.trim() === ""}>
                  Liberar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Revertir */}
        <Dialog open={modalRevertirOpen} onOpenChange={setModalRevertirOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Revertir Liberación</DialogTitle>
              <button
                aria-label="Cerrar"
                className="absolute top-3 right-3"
                onClick={() => setModalRevertirOpen(false)}
              >
                ✕
              </button>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleRevertir()
              }}
              className="space-y-4 p-2"
            >
              <div>
                <Label>Cantidad a revertir</Label>
                <Input
                  type="number"
                  value={liberacionSeleccionada?.cantidad_liberada ?? 0}
                  disabled
                />
              </div>
              <div>
                <Label>Quién revierte</Label>
                <Input
                  type="text"
                  value={revertidoPor}
                  onChange={(e) => setRevertidoPor(e.target.value)}
                  required
                  placeholder="Nombre"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setModalRevertirOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={revertidoPor.trim() === ""}>
                  Revertir
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
