import { supabase } from "./index"

export async function getAllPlanes() {
  const { data, error } = await supabase
    .from("planes_trabajo")
    .select("*")
    .order('fecha', { ascending: false })

  if (error) {
    console.error("Error al obtener planes:", error)
    throw error
  }
  return data
}

export async function crearPlan(plan: {
  area: string,
  producto: string,
  cantidad: number,
  color?: string,
  lf?: string,
  pt?: string,
  lp?: string,
  pedido?: string,
  cliente?: string,
}) {
  const { data, error } = await supabase
    .from("planes_trabajo")
    .insert([plan])
    .select()

  if (error) {
    console.error("Error al insertar plan:", error)
    throw error
  }
  return data?.[0]
}

export async function actualizarPlan(id: number, cambios: Partial<{
  area: string,
  producto: string,
  cantidad: number,
  color: string,
  lf: string,
  pt: string,
  lp: string,
  pedido: string,
  cliente: string,
  liberado: number,
}>) {
  const { data, error } = await supabase
    .from("planes_trabajo")
    .update(cambios)
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error al actualizar plan:", error)
    throw error
  }
  return data?.[0]
}
