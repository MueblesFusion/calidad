import { supabase } from "../supabase"

export async function registrarLiberacion(planId: number, cantidad: number, nuevoLiberado: number) {
  // 1. Insertar en historial
  const { error: insertError } = await supabase.from("liberaciones").insert([
    {
      plan_id: planId,
      cantidad,
      usuario: "capturista", // puedes cambiar por usuario dinámico más adelante
    },
  ])

  if (insertError) throw insertError

  // 2. Actualizar campo 'liberado' en planes_trabajo
  const { error: updateError } = await supabase
    .from("planes_trabajo")
    .update({ liberado: nuevoLiberado })
    .eq("id", planId)

  if (updateError) throw updateError
}
