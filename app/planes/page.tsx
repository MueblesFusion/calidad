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
  const [planesSillas, setPlanesSillas] = useState<PlanTrabajo[]>([])
  const [planesSalas, setPlanesSalas] = useState<PlanTrabajo[]>([])
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
      // Traer solo planes sillas de planes_trabajo_sillas
      const { data: sillasData, error: sillasError } = await supabase
        .from("planes_trabajo_sillas")
        .select("*")
        .order("fecha", { ascending: false })

      // Traer solo planes salas de planes_trabajo
      const { data: salasData, error: salasError } = await supabase
        .from("planes_trabajo")
        .select("*")
        .order("fecha", { ascending: false })

      if (sillasError || salasError) {
        throw new Error("Error cargando planes")
      }

      setPlanesSillas(sillasData || [])
      setPlanesSalas(salasData || [])

      // Liberaciones para sillas
      const { data: liberacionesSillasData, error: libSillasErr } = await supabase
        .from("liberaciones_sillas")
        .select("*")
        .order("fecha", { ascending: false })

      // Liberaciones para salas
      const { data: liberacionesSalasData, error: libSalasErr } = await supabase
        .from("liberaciones")
        .select("*")
        .order("fecha", { ascending: false })

      if (libSillasErr || libSalasErr) {
        throw new Error("Error cargando liberaciones")
      }

      // Agrupar liberaciones por plan_id
      const agrupado: Record<string, Liberacion[]> = {}

      ;[...(liberacionesSillasData || []), ...(liberacionesSalasData || [])].forEach((lib) => {
        if (!agrupado[lib.plan_id]) agrupado[lib.plan_id] = []
        agrupado[lib.plan_id].push(lib)
      })

      setLiberaciones(agrupado)
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
      const tablaLiberaciones = selectedPlan.area === "SILLAS" ? "liberaciones_sillas" : "liberaciones"
      const { error } = await supabase.from(tablaLiberaciones).insert([
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

  function filtrarPlanes(planes: PlanTrabajo[]) {
    return planes.filter((plan) => {
      const filtro = filtroTexto.trim().toLowerCase()
      if (!filtro) return true
      const textoPlan = `${plan.cliente} ${plan.pedido} ${plan.producto} ${plan.color} ${plan.lf} ${plan.pt} ${plan.lp}`.toLowerCase()
      return textoPlan.includes(filtro)
    })
  }

  function renderTabla(area: "SILLAS" | "SALAS", planesArea: PlanTrabajo[]) {
    const planesFiltrados = filtrarPlanes(planesArea)

    const gruposPorLp: Record<string, PlanTrabajo[]> = {}

    planesFiltrados.forEach((plan) => {
      if (!gruposPorLp[plan.lp]) gruposPorLp[plan.lp] = []
      gruposPorLp[plan.lp].push(plan)
    })

    const lotesOrdenados = Object.keys(gruposPorLp).sort()

    return (
      <Card key={area}>
        <CardHeader>
          <CardTitle>{area}</CardTitle>
        </CardHeader>
        <CardContent>
          {planesFiltrados.length === 0 ? (
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
          <Button onClick={() => exportarLiberacionesAExcel()}>Exportar Excel</Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center space-x-2">
            <Loader2 className="animate-spin" size={24} />
            <span>Cargando planes...</span>
          </div>
        ) : (
          <>
            {renderTabla("SILLAS", planesSillas)}
            {renderTabla("SALAS", planesSalas)}
          </>
        )}
      </div>

      {/* Modal Liberar */}
      <Dialog open={modalLiberarOpen} onOpenChange={setModalLiberarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar liberación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Plan: <strong>{selectedPlan?.producto}</strong>
            </p>
            <p>
              Cantidad pendiente: <strong>{selectedPlan ? calcularPendiente(selectedPlan) : 0}</strong>
            </p>
            <div>
              <Label htmlFor="cantidad">Cantidad a liberar</Label>
              <Input
                id="cantidad"
                type="number"
                min={1}
                max={selectedPlan ? calcularPendiente(selectedPlan) : 0}
                value={cantidadLiberar}
                onChange={(e) => setCantidadLiberar(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="usuario">Usuario que libera</Label>
              <Input
                id="usuario"
                type="text"
                value={liberadoPor}
                onChange={(e) => setLiberadoPor(e.target.value)}
                placeholder="Nombre del usuario"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setModalLiberarOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleLiberar}>Confirmar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Historial */}
      <Dialog open={modalHistorialOpen} onOpenChange={setModalHistorialOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial de liberaciones</DialogTitle>
          </DialogHeader>
          <div>
            {selectedPlan && liberaciones[selectedPlan.id] ? (
              <table className="w-full border text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border px-2 py-1">Fecha</th>
                    <th className="border px-2 py-1">Cantidad</th>
                    <th className="border px-2 py-1">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {liberaciones[selectedPlan.id]
                    .filter((lib) => {
                      if (filtroFechaInicio && new Date(lib.fecha) < new Date(filtroFechaInicio)) return false
                      if (filtroFechaFin && new Date(lib.fecha) > new Date(filtroFechaFin)) return false
                      return true
                    })
                    .map((lib) => (
                      <tr key={lib.id}>
                        <td className="border px-2 py-1">{new Date(lib.fecha).toLocaleString()}</td>
                        <td className="border px-2 py-1">{lib.cantidad}</td>
                        <td className="border px-2 py-1">{lib.usuario}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <p>No hay liberaciones para este plan.</p>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={() => setModalHistorialOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
