"use client"

import React, { useEffect, useState } from "react"
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import * as XLSX from "xlsx-style"

type Plan = {
  id: number
  cliente: string
  producto: string
  cantidad: number
  entregado: number
  fecha: string
  area: string
  lote_lp?: string
}

type Liberacion = {
  id: number
  plan_id: number
  cantidad: number
  fecha: string
  usuario: string
  revertida: boolean
  reversion_de_id?: number
}

export default function Page() {
  const supabase = createClient()
  const [planes, setPlanes] = useState<Plan[]>([])
  const [planesSillas, setPlanesSillas] = useState<Plan[]>([])
  const [liberaciones, setLiberaciones] = useState<Record<number, Liberacion[]>>({})
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [modalLiberarOpen, setModalLiberarOpen] = useState(false)
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false)
  const [cantidadLiberar, setCantidadLiberar] = useState(0)
  const [liberadoPor, setLiberadoPor] = useState("")
  const [loading, setLoading] = useState(true)
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("")
  const [filtroFechaFin, setFiltroFechaFin] = useState("")
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true)

      const { data: planesSalas } = await supabase
        .from("planes_trabajo")
        .select("*")
        .eq("area", "SALAS")

      const { data: planesSillas } = await supabase
        .from("planes_trabajo_sillas")
        .select("*")
        .eq("area", "SILLAS")

      const { data: liberacionesSalas } = await supabase
        .from("liberaciones")
        .select("*")

      const { data: liberacionesSillas } = await supabase
        .from("liberaciones_sillas")
        .select("*")

      const agrupadas: Record<number, Liberacion[]> = {}
      ;[...(liberacionesSalas ?? []), ...(liberacionesSillas ?? [])].forEach((lib) => {
        if (!agrupadas[lib.plan_id]) agrupadas[lib.plan_id] = []
        agrupadas[lib.plan_id].push(lib)
      })

      setPlanes(planesSalas ?? [])
      setPlanesSillas(planesSillas ?? [])
      setLiberaciones(agrupadas)
      setLoading(false)
    }

    cargarDatos()
  }, [])

  const obtenerLiberadas = (plan: Plan) => {
    const libs = liberaciones[plan.id] || []
    return libs.reduce((acc, l) => acc + l.cantidad, 0)
  }

  const abrirModalLiberar = (plan: Plan) => {
    setSelectedPlan(plan)
    setCantidadLiberar(0)
    setLiberadoPor("")
    setModalLiberarOpen(true)
  }

  const abrirHistorial = (plan: Plan) => {
    setSelectedPlan(plan)
    setModalHistorialOpen(true)
  }

  const liberar = async () => {
    if (!selectedPlan || cantidadLiberar <= 0 || !liberadoPor) return

    const tabla = selectedPlan.area === "SILLAS" ? "liberaciones_sillas" : "liberaciones"
    await supabase.from(tabla).insert({
      plan_id: selectedPlan.id,
      cantidad: cantidadLiberar,
      fecha: new Date().toISOString().split("T")[0],
      usuario: liberadoPor,
      revertida: false,
    })

    setModalLiberarOpen(false)
    window.location.reload()
  }

  const revertirLiberacion = async (lib: Liberacion, area: string) => {
    const tabla = area === "SILLAS" ? "liberaciones_sillas" : "liberaciones"
    await supabase.from(tabla).insert({
      plan_id: lib.plan_id,
      cantidad: -lib.cantidad,
      fecha: new Date().toISOString().split("T")[0],
      usuario: "Reversión",
      revertida: true,
      reversion_de_id: lib.id,
    })

    await supabase.from(tabla).update({ revertida: true }).eq("id", lib.id)
    window.location.reload()
  }
  const exportarExcel = () => {
    const exportarDatos = (planes: Plan[], nombreHoja: string) => {
      const datos = planes.flatMap((plan) => {
        const liberacionesPlan = liberaciones[plan.id] || []
        return liberacionesPlan.map((lib) => ({
          "Producto": plan.producto,
          "Cliente": plan.cliente,
          "Cantidad Planificada": plan.cantidad,
          "Cantidad Liberada": lib.cantidad,
          "Fecha de Liberación": lib.fecha,
          "Liberado por": lib.usuario,
          "Revertida": lib.revertida ? "Sí" : "No",
        }))
      })

      const ws = XLSX.utils.json_to_sheet(datos, { origin: "A2" })

      // Título en fila 1
      const fechaTexto = fechaInicio && fechaFin
        ? `Liberaciones del ${fechaInicio} al ${fechaFin}`
        : fechaInicio
        ? `Liberaciones del ${fechaInicio}`
        : "Liberaciones"
      ws["A1"] = { v: fechaTexto, s: { font: { bold: true, color: { rgb: "FF0000" } } } }

      // Encabezados
      const encabezados = Object.keys(datos[0] || {})
      encabezados.forEach((k, i) => {
        const cell = ws[XLSX.utils.encode_cell({ r: 1, c: i })]
        if (cell) {
          cell.s = {
            fill: { fgColor: { rgb: "444444" } },
            font: { bold: true, color: { rgb: "FFFFFF" } },
            border: { top: { style: "thin", color: { auto: 1 } }, bottom: { style: "thin", color: { auto: 1 } } },
            alignment: { horizontal: "center" },
          }
        }
      })

      // Filas alternadas y bordes
      for (let r = 2; r < datos.length + 2; r++) {
        for (let c = 0; c < encabezados.length; c++) {
          const cell = ws[XLSX.utils.encode_cell({ r, c })]
          if (cell) {
            cell.s = {
              fill: { fgColor: { rgb: r % 2 === 0 ? "FFFFFF" : "F2F2F2" } },
              border: {
                top: { style: "thin", color: { auto: 1 } },
                bottom: { style: "thin", color: { auto: 1 } },
                left: { style: "thin", color: { auto: 1 } },
                right: { style: "thin", color: { auto: 1 } },
              },
            }
          }
        }
      }

      // Ajustar ancho de columnas
      const wscols = encabezados.map((key) => {
        const maxLen = Math.max(
          key.length,
          ...datos.map((d) => (d[key]?.toString().length || 0))
        )
        return { wch: maxLen + 2 }
      })
      ws["!cols"] = wscols

      return ws
    }

    const wb = XLSX.utils.book_new()
    const hojaSalas = exportarDatos(planes, "SALAS")
    const hojaSillas = exportarDatos(planesSillas, "SILLAS")

    XLSX.utils.book_append_sheet(wb, hojaSillas, "Sillas")
    XLSX.utils.book_append_sheet(wb, hojaSalas, "Salas")
    XLSX.writeFile(wb, "Liberaciones.xlsx")
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex gap-4">
        <Button onClick={exportarExcel}>Exportar a Excel</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>SILLAS</CardTitle>
          </CardHeader>
          <CardContent>
            {planesSillas.length === 0 && <p>No hay planes registrados para SILLAS.</p>}
            {planesSillas.map((plan) => {
              const liberadas = obtenerLiberadas(plan)
              return (
                <div key={plan.id} className="border p-3 mb-4 rounded-md">
                  <p><b>Producto:</b> {plan.producto}</p>
                  <p><b>Cliente:</b> {plan.cliente}</p>
                  <p><b>Cantidad:</b> {plan.cantidad}</p>
                  <p><b>Liberadas:</b> {liberadas}</p>
                  <div className="flex gap-2 mt-2">
                    <Button onClick={() => abrirModalLiberar(plan)}>Liberar</Button>
                    <Button variant="outline" onClick={() => abrirHistorial(plan)}>Historial</Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SALAS</CardTitle>
          </CardHeader>
          <CardContent>
            {planes.length === 0 && <p>No hay planes registrados para SALAS.</p>}
            {planes.map((plan) => {
              const liberadas = obtenerLiberadas(plan)
              return (
                <div key={plan.id} className="border p-3 mb-4 rounded-md">
                  <p><b>Producto:</b> {plan.producto}</p>
                  <p><b>Cliente:</b> {plan.cliente}</p>
                  <p><b>Cantidad:</b> {plan.cantidad}</p>
                  <p><b>Liberadas:</b> {liberadas}</p>
                  <div className="flex gap-2 mt-2">
                    <Button onClick={() => abrirModalLiberar(plan)}>Liberar</Button>
                    <Button variant="outline" onClick={() => abrirHistorial(plan)}>Historial</Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Dialog open={modalLiberarOpen} onOpenChange={setModalLiberarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liberar piezas</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Label>Cantidad a liberar</Label>
            <Input
              type="number"
              value={cantidadLiberar}
              onChange={(e) => setCantidadLiberar(parseInt(e.target.value))}
            />
            <Label>Nombre del liberador</Label>
            <Input
              type="text"
              value={liberadoPor}
              onChange={(e) => setLiberadoPor(e.target.value)}
            />
            <Button onClick={liberar}>Confirmar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalHistorialOpen} onOpenChange={setModalHistorialOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historial de liberaciones</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {(liberaciones[selectedPlan.id] || []).map((lib) => (
                <div key={lib.id} className="border p-2 rounded-md">
                  <p><b>Fecha:</b> {lib.fecha}</p>
                  <p><b>Cantidad:</b> {lib.cantidad}</p>
                  <p><b>Usuario:</b> {lib.usuario}</p>
                  <p><b>Revertida:</b> {lib.revertida ? "Sí" : "No"}</p>
                  {!lib.revertida && (
                    <Button size="sm" variant="destructive" onClick={() => revertirLiberacion(lib, selectedPlan.area)}>
                      Revertir
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
