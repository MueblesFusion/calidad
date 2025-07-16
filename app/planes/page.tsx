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
  area: string
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
  cantidad: number
  fecha: string
  usuario: string
  revertida?: boolean
  reversion_de_id?: string
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

  const [reversionEnCurso, setReversionEnCurso] = useState<Liberacion | null>(null)
  const [cantidadRevertir, setCantidadRevertir] = useState<number>(0)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: planesData } = await supabase.from("planes_trabajo").select("*").order("fecha", { ascending: false })
      const { data: liberacionesData } = await supabase.from("liberaciones").select("*").order("fecha", { ascending: true })

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
        title: "Cantidad inválida",
        description: "Revisa la cantidad a liberar",
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

    const { error } = await supabase.from("liberaciones").insert([
      {
        plan_id: selectedPlan.id,
        cantidad: cantidadLiberar,
        usuario: liberadoPor.trim(),
        fecha: new Date().toISOString(),
        revertida: false,
      },
    ])

    if (error) {
      console.error(error)
      toast({ title: "Error", description: "No se pudo registrar la liberación", variant: "destructive" })
    } else {
      toast({ title: "Liberación registrada", description: `Se liberaron ${cantidadLiberar} piezas` })
      setModalLiberarOpen(false)
      await fetchData()
    }
  }

  function obtenerCantidadYaRevertida(id: string) {
    const todas = Object.values(liberaciones).flat()
    return todas
      .filter((l) => l.reversion_de_id === id)
      .reduce((acc, curr) => acc + Math.abs(curr.cantidad), 0)
  }

  async function handleRevertirParcial() {
    if (!reversionEnCurso || cantidadRevertir <= 0 || cantidadRevertir > reversionEnCurso.cantidad) return

    const cantidadYaRevertida = obtenerCantidadYaRevertida(reversionEnCurso.id)
    const disponible = reversionEnCurso.cantidad - cantidadYaRevertida

    if (cantidadRevertir > disponible) {
      toast({ title: "Error", description: "Ya se ha revertido parte de esta liberación", variant: "destructive" })
      return
    }

    const { error } = await supabase.from("liberaciones").insert([
      {
        plan_id: reversionEnCurso.plan_id,
        cantidad: -cantidadRevertir,
        fecha: new Date().toISOString(),
        usuario: `Reversión de ${reversionEnCurso.usuario}`,
        revertida: true,
        reversion_de_id: reversionEnCurso.id,
      },
    ])

    if (error) {
      toast({ title: "Error", description: "No se pudo revertir", variant: "destructive" })
    } else {
      toast({ title: "Liberación revertida", description: `Revertiste ${cantidadRevertir} piezas` })
      setReversionEnCurso(null)
      setCantidadRevertir(0)
      await fetchData()
    }
  }

  function renderTabla(area: string) {
    const planesArea = planes.filter((p) => p.area === area)
    return (
      <Card key={area}>
        <CardHeader><CardTitle>{area}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px] border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Producto</th>
                  <th className="border px-2 py-1">Cliente</th>
                  <th className="border px-2 py-1">Cantidad</th>
                  <th className="border px-2 py-1">Liberado</th>
                  <th className="border px-2 py-1">Pendiente</th>
                  <th className="border px-2 py-1">Acción</th>
                </tr>
              </thead>
              <tbody>
                {planesArea.map((plan) => {
                  const liberado = calcularLiberado(plan.id)
                  const pendiente = calcularPendiente(plan)
                  return (
                    <tr key={plan.id}>
                      <td className="border px-2 py-1">{plan.producto}</td>
                      <td className="border px-2 py-1">{plan.cliente}</td>
                      <td className="border px-2 py-1">{plan.cantidad}</td>
                      <td className="border px-2 py-1">{liberado}</td>
                      <td className="border px-2 py-1">{pendiente}</td>
                      <td className="border px-2 py-1 text-center space-x-2">
                        <Button size="sm" onClick={() => abrirModalLiberar(plan)} disabled={pendiente <= 0}>Liberar</Button>
                        <Button size="sm" variant="secondary" onClick={() => abrirModalHistorial(plan)}>Historial</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Planes de Trabajo</h1>
      {renderTabla("SILLAS")}
      {renderTabla("SALAS")}

      {/* Modal Liberar */}
      <Dialog open={modalLiberarOpen} onOpenChange={setModalLiberarOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Liberar piezas</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Cantidad</Label>
            <Input type="number" value={cantidadLiberar} onChange={(e) => setCantidadLiberar(parseInt(e.target.value))} />
            <Label>Quién libera</Label>
            <Input type="text" value={liberadoPor} onChange={(e) => setLiberadoPor(e.target.value)} />
            <div className="flex justify-end">
              <Button onClick={handleLiberar}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Historial */}
      <Dialog open={modalHistorialOpen} onOpenChange={setModalHistorialOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Historial de Liberaciones</DialogTitle></DialogHeader>
          <div className="overflow-auto max-h-[400px]">
            {selectedPlan && liberaciones[selectedPlan.id]?.length ? (
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-2 py-1">Cantidad</th>
                    <th className="border px-2 py-1">Usuario</th>
                    <th className="border px-2 py-1">Fecha</th>
                    <th className="border px-2 py-1">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {liberaciones[selectedPlan.id].map((lib) => {
                    const cantidadYaRevertida = obtenerCantidadYaRevertida(lib.id)
                    const cantidadDisponible = lib.cantidad - cantidadYaRevertida
                    const puedeRevertirse = lib.cantidad > 0 && cantidadDisponible > 0

                    return (
                      <tr key={lib.id}>
                        <td className="border px-2 py-1 text-center">{lib.cantidad}</td>
                        <td className="border px-2 py-1 text-center">{lib.usuario}</td>
                        <td className="border px-2 py-1 text-center">{new Date(lib.fecha).toLocaleString()}</td>
                        <td className="border px-2 py-1 text-center">
                          {puedeRevertirse && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setReversionEnCurso(lib)
                                setCantidadRevertir(0)
                              }}
                            >
                              Revertir
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <p>No hay liberaciones</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de reversión parcial */}
      <Dialog open={!!reversionEnCurso} onOpenChange={() => setReversionEnCurso(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reversión parcial</DialogTitle></DialogHeader>
          {reversionEnCurso && (
            <div className="space-y-3">
              <p>Liberación de <strong>{reversionEnCurso.usuario}</strong>, cantidad total: {reversionEnCurso.cantidad}</p>
              <Label>Cantidad a revertir</Label>
              <Input
                type="number"
                min={1}
                max={reversionEnCurso.cantidad - obtenerCantidadYaRevertida(reversionEnCurso.id)}
                value={cantidadRevertir}
                onChange={(e) => setCantidadRevertir(parseInt(e.target.value))}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setReversionEnCurso(null)}>Cancelar</Button>
                <Button onClick={handleRevertirParcial}>Revertir</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
