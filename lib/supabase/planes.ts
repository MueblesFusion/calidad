export async function crearPlan(plan: any) {
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
