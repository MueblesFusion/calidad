import { supabase } from "./index"

export async function getAllPlanes() {
  const { data, error } = await supabase
    .from("planes_trabajo")
    .select("*")

  if (error) {
    console.error("Error al obtener planes:", error)
    throw error
  }

  return data
}

export async function crearPlan(plan: any) {
  const { data, error } = await supabase
    .from("planes_trabajo")
    .insert([plan])
    .select()

  if (error) throw error
  return data?.[0]
}
