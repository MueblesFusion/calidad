import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type DefectReport = {
  id?: string
  created_at?: string
  fecha: string
  area: string
  producto: string
  color: string
  lf: string
  pt: string
  lp: string
  pedido: string
  cliente: string
  defecto: string
  descripcion: string
  foto_url?: string
}
