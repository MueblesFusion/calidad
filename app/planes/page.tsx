"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@supabase/supabase-js"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PlanesDeTrabajo() {
  const { toast } = useToast()
  const [planes, setPlanes] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [historialModalOpen, setHistorialModalOpen] = useState(false)
  const [liberaciones, setLiberaciones] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [cantidadLiberar, setCantidadLiberar] = useState("")

  const fetchPlanes = async () => {
    const { data, error } = await supabase
      .from("planes")
      .select("*")
      .order("creado_en", { ascending: false })

    if (!error && data) {
      setPlanes(data)
    } else {
      console.error("Error al cargar planes:", error)
    }
  }

  useEffect(() => {
    fetchPlanes()
  }, [])

  const handleLiberar = async () => {
    const cantidad = parseInt(cantidadLiberar)
    if (isNaN(cantidad) || cantidad <= 0) {
      toast({ title: "Cantidad inválida", description: "Debe ser mayor a 0", variant: "destructive" })
      return
    }

    const pendiente = selectedPlan.cantidad - (selectedPlan.liberado || 0)
    if (cantidad > pendiente) {
      toast({ title: "Exceso", description: `Solo puedes liberar hasta ${pendiente}`, variant: "destructive" })
      return
    }

    const nuevoTotal = (selectedPlan.liberado || 0) + cantidad

    const { error } = await supabase
      .from("planes")
      .update({ liberado: nuevoTotal })
      .eq("id", selectedPlan.id)

    if (error) {
      toast({ title: "Error", description: "No se pudo liberar cantidad", variant: "destructive" })
    } else {
      toast({ title: "Liberado", description: `Se liberaron ${cantidad} unidades` })
      setModalOpen(false)
      setCantidadLiberar("")
      fetchPlanes()
    }
  }

  const exportarExcel = (planesFiltrados: any[], nombre: string) => {
    const datos = planesFiltrados.map((plan) => ({
      Fecha: new Date(plan.creado_en).toLocaleDateString(),
      Área: plan.area,
      Producto: plan.producto,
      Color: plan.color,
      Cantidad: plan.cantidad,
      Liberado: plan.liberado || 0,
      Pendiente: plan.cantidad - (plan.liberado || 0),
      Cliente: plan.cliente,
      Pedido: plan.pedido,
      PT: plan.pt,
      LF: plan.lf,
      LP: plan.lp,
    }))
    const hoja = XLSX.utils.json_to_sheet(datos)
    const libro = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libro, hoja, "Planes")
    XLSX.writeFile(libro, `Planes_${nombre}.xlsx`)
  }

  const renderTabla = (titulo: string, planesFiltrados: any[]) => (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{titulo}</CardTitle>
        <Button onClick={() => exportarExcel(planesFiltrados, titulo)}>Exportar Excel</Button>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>LF</TableHead>
              <TableHead>LP</TableHead>
              <TableHead>PT</TableHead>
              <TableHead>Pedido</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Liberado</TableHead>
              <TableHead>Pendiente</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planesFiltrados.map((plan) => {
              const pendiente = plan.cantidad - (plan.liberado || 0)
              return (
                <TableRow key={plan.id}>
                  <TableCell>{new Date(plan.creado_en).toLocaleDateString()}</TableCell>
                  <TableCell>{plan.producto}</TableCell>
                  <TableCell>{plan.color}</TableCell>
                  <TableCell>{plan.lf}</TableCell>
                  <TableCell>{plan.lp}</TableCell>
                  <TableCell>{plan.pt}</TableCell>
                  <TableCell>{plan.pedido}</TableCell>
                  <TableCell>{plan.cantidad}</TableCell>
                  <TableCell>{plan.liberado || 0}</TableCell>
                  <TableCell>{pendiente}</TableCell>
                  <TableCell>
                    {pendiente > 0 ? (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setHistorialModalOpen(false) // cerrar otro modal si estaba abierto
                          setSelectedPlan(plan)
                          setModalOpen(true)
                        }}
                      >
                        Liberar
                      </Button>
                    ) : (
                      <span className="text-green-600 font-medium">Completado</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const { data } = await supabase
                            .from("liberaciones")
                            .select("*")
                            .eq("plan_id", plan.id)
                            .order("fecha", { ascending: false })
                          setLiberaciones(data || [])
                          setHistorialModalOpen(true)
                        }}
                      >
                        Historial
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {planesFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  No hay registros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  
  const [filtro, setFiltro] = useState("")

  const [orden, setOrden] = useState("desc")

  const planesFiltrados = planes
    .filter((p) => {
      const q = filtro.toLowerCase()
      return (
        p.area &&
        (
          p.pedido?.toLowerCase().includes(q) ||
          p.cliente?.toLowerCase().includes(q) ||
          p.pt?.toLowerCase().includes(q) ||
          p.lp?.toLowerCase().includes(q) ||
          p.producto?.toLowerCase().includes(q) ||
          p.color?.toLowerCase().includes(q) ||
          p.lf?.toLowerCase().includes(q)
        )
      )
    })
    .sort((a, b) => {
      const fechaA = new Date(a.creado_en).getTime()
      const fechaB = new Date(b.creado_en).getTime()
      return orden === "desc" ? fechaB - fechaA : fechaA - fechaB
    })
    const q = filtro.toLowerCase()
    return (
      p.area &&
      (p.pedido?.toLowerCase().includes(q) ||
       p.cliente?.toLowerCase().includes(q) ||
       p.pt?.toLowerCase().includes(q) ||
       p.lp?.toLowerCase().includes(q))
    )
  })

  const sillas = planesFiltrados.filter((p) => p.area === "SILLAS")
  const salas = planes.filter((p) => p.area === "SALAS")

  return (
    <div className="min-h-screen bg-gray-50">
  <main className="max-w-4xl mx-auto py-8 px-4">
    <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <Input
        className="w-full md:w-1/2"
        placeholder="Buscar por cualquier campo"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Orden:</label>
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="desc">Más reciente</option>
          <option value="asc">Más antiguo</option>
        </select>
      </div>
    </div>
      <Input
        placeholder="Buscar por PT, LP, Pedido o Cliente"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />
    </div>
      {renderTabla("Planes - SILLAS", sillas)}
      {renderTabla("Planes - SALAS", salas)}

      {/* Modal de Liberación */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liberar Cantidad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Cantidad a liberar"
              value={cantidadLiberar}
              onChange={(e) => setCantidadLiberar(e.target.value)}
            />
            <Button onClick={handleLiberar}>Confirmar Liberación</Button>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

      {/* Modal de Historial */}
      <Dialog open={historialModalOpen} onOpenChange={setHistorialModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historial de Liberaciones</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {liberaciones.length > 0 ? (
              liberaciones.map((lib) => (
                <div key={lib.id} className="flex justify-between border-b pb-1 text-sm">
                  <span>{new Date(lib.fecha).toLocaleString()}</span>
                  <span className="font-medium">{lib.cantidad} unidades</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sin registros</p>
            )}

          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
      </main>
</div>
  )
}
