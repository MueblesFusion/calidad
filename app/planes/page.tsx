"use client"

import React, { useEffect, useState } from "react"
import {
  Card, CardHeader, CardTitle, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  revertida: boolean
  reversion_de_id?: string
  cantidad_revertida?: number
}

export default function PlanesPage() {
  const { toast } = useToast()
  const [planes, setPlanes] = useState<PlanTrabajo[]>([])
  const [liberaciones, setLiberaciones] = useState<Record<string, Liberacion[]>>({})
  const [loading, setLoading] = useState(true)

  const [modalLiberarOpen, setModalLiberarOpen] = useState(false)
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false)
  const [modalRevertirOpen, setModalRevertirOpen] = useState(false)

  const [selectedPlan, setSelectedPlan] = useState<PlanTrabajo | null>(null)
  const [selectedLiberacion, setSelectedLiberacion] = useState<Liberacion | null>(null)

  const [cantidadLiberar, setCantidadLiberar] = useState<number>(0)
  const [cantidadRevertir, setCantidadRevertir] = useState<number>(0)
  const [usuarioAccion, setUsuarioAccion] = useState("")
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
        .select("*")
        .order("fecha", { ascending: false })

      const grouped: Record<string, Liberacion[]> = {}
      for (const lib of liberacionesData || []) {
        if (!grouped[lib.plan_id]) grouped[lib.plan_id] = []
        grouped[lib.plan_id].push(lib)
      }

      setPlanes(planesData || [])
      setLiberaciones(grouped)
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" })
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

  function getCantidadRevertida(lib: Liberacion, todas: Liberacion[]) {
    return todas
      .filter((l) => l.reversion_de_id === lib.id)
      .reduce((sum, l) => sum + (l.cantidad_revertida || 0), 0)
  }

  async function handleLiberar() {
    if (!selectedPlan || cantidadLiberar <= 0 || !usuarioAccion.trim()) return

    const pendiente = calcularPendiente(selectedPlan)
    if (cantidadLiberar > pendiente) {
      toast({ title: "Cantidad inválida", variant: "destructive" })
      return
    }

    const { error } = await supabase.from("liberaciones").insert([
      {
        plan_id: selectedPlan.id,
        cantidad: cantidadLiberar,
        usuario: usuarioAccion.trim(),
        fecha: new Date().toISOString(),
        revertida: false,
        reversion_de_id: null,
      }
    ])

    if (!error) {
      toast({ title: "Liberado", description: `Liberaste ${cantidadLiberar} piezas` })
      setModalLiberarOpen(false)
      fetchData()
    }
  }

  async function handleRevertir() {
    if (!selectedLiberacion || cantidadRevertir <= 0 || !usuarioAccion.trim()) return

    const { error } = await supabase.from("liberaciones").insert([
      {
        plan_id: selectedLiberacion.plan_id,
        cantidad: -cantidadRevertir,
        usuario: `Revertido de ${selectedLiberacion.usuario} (${usuarioAccion.trim()})`,
        fecha: new Date().toISOString(),
        revertida: true,
        reversion_de_id: selectedLiberacion.id,
        cantidad_revertida: cantidadRevertir,
      }
    ])

    if (!error) {
      toast({ title: "Reversión registrada", description: `Revertiste ${cantidadRevertir} piezas` })
      setModalRevertirOpen(false)
      fetchData()
    }
  }

  function renderTabla(area: string) {
    const planesFiltrados = planes.filter((p) => p.area === area)
    return (
      <Card key={area}>
        <CardHeader><CardTitle>{area}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border text-sm min-w-[1000px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Producto</th>
                  <th className="border px-2 py-1">Cliente</th>
                  <th className="border px-2 py-1">Cantidad</th>
                  <th className="border px-2 py-1">Liberado</th>
                  <th className="border px-2 py-1">Pendiente</th>
                  <th className="border px-2 py-1">Acción</th>
                  <th className="border px-2 py-1">Historial</th>
                </tr>
              </thead>
              <tbody>
                {planesFiltrados.map((plan) => {
                  const liberado = calcularLiberado(plan.id)
                  const pendiente = calcularPendiente(plan)
                  return (
                    <tr key={plan.id}>
                      <td className="border px-2 py-1">{plan.producto}</td>
                      <td className="border px-2 py-1">{plan.cliente}</td>
                      <td className="border px-2 py-1">{plan.cantidad}</td>
                      <td className="border px-2 py-1">{liberado}</td>
                      <td className="border px-2 py-1">{pendiente}</td>
                      <td className="border px-2 py-1">
                        <Button size="sm" onClick={() => {
                          setSelectedPlan(plan)
                          setCantidadLiberar(0)
                          setUsuarioAccion("")
                          setModalLiberarOpen(true)
                        }}>Liberar</Button>
                      </td>
                      <td className="border px-2 py-1">
                        <Button size="sm" variant="secondary" onClick={() => {
                          setSelectedPlan(plan)
                          setModalHistorialOpen(true)
                        }}>Liberaciones</Button>
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
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Planes de Trabajo</h1>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="animate-spin w-8 h-8" />
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
          <DialogHeader><DialogTitle>Liberar piezas</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleLiberar() }} className="space-y-4">
            <div><Label>Cantidad</Label>
              <Input type="number" value={cantidadLiberar} min={1} onChange={(e) => setCantidadLiberar(Number(e.target.value))} />
            </div>
            <div><Label>Usuario</Label>
              <Input value={usuarioAccion} onChange={(e) => setUsuarioAccion(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalLiberarOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Historial */}
      <Dialog open={modalHistorialOpen} onOpenChange={setModalHistorialOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Historial</DialogTitle></DialogHeader>
          {selectedPlan && liberaciones[selectedPlan.id]?.length ? (
            <table className="w-full text-sm border mt-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Cantidad</th>
                  <th className="border px-2 py-1">Usuario</th>
                  <th className="border px-2 py-1">Fecha</th>
                  <th className="border px-2 py-1">Revertir</th>
                </tr>
              </thead>
              <tbody>
                {liberaciones[selectedPlan.id].map((lib) => {
                  const revertido = getCantidadRevertida(lib, liberaciones[selectedPlan.id])
                  const puedeRevertir = lib.cantidad > 0 && revertido < lib.cantidad
                  return (
                    <tr key={lib.id}>
                      <td className={`border px-2 py-1 text-center ${lib.cantidad < 0 ? "text-red-500 font-bold" : ""}`}>{lib.cantidad}</td>
                      <td className="border px-2 py-1 text-center">{lib.usuario}</td>
                      <td className="border px-2 py-1 text-center">{new Date(lib.fecha).toLocaleString()}</td>
                      <td className="border px-2 py-1 text-center">
                        {puedeRevertir && (
                          <Button variant="destructive" size="sm" onClick={() => {
                            setSelectedLiberacion(lib)
                            setCantidadRevertir(0)
                            setUsuarioAccion("")
                            setModalRevertirOpen(true)
                          }}>
                            Revertir
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : <p>No hay liberaciones.</p>}
        </DialogContent>
      </Dialog>

      {/* Modal Revertir Parcial */}
      <Dialog open={modalRevertirOpen} onOpenChange={setModalRevertirOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Revertir Liberación</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleRevertir() }} className="space-y-4">
            <div>
              <Label>Cantidad a revertir</Label>
              <Input
                type="number"
                min={1}
                max={selectedLiberacion ? selectedLiberacion.cantidad - getCantidadRevertida(selectedLiberacion, liberaciones[selectedLiberacion.plan_id]) : undefined}
                value={cantidadRevertir}
                onChange={(e) => setCantidadRevertir(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Usuario</Label>
              <Input value={usuarioAccion} onChange={(e) => setUsuarioAccion(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setModalRevertirOpen(false)}>Cancelar</Button>
              <Button type="submit">Revertir</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
