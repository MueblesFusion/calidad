import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function getAllPlanes() {
  const { data, error } = await supabase
    .from("planes")
    .select("*")
    .order("fecha", { ascending: false })

  if (error) {
    console.error("Error al obtener los planes:", error.message)
    return []
  }

  return data
}
