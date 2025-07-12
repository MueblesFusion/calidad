// lib/supabase/liberaciones.ts
import { supabase } from "../supabase"

export async function updateLiberado(id: number, liberado: number) {
  const { error } = await supabase
    .from("planes_trabajo")
    .update({ liberado })
    .eq("id", id)

  if (error) {
    console.error("Error actualizando liberado:", error)
    throw error
  }
}
