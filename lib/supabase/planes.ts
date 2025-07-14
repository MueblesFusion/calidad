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
