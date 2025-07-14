// /lib/database.ts


import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

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

export async function createDefectReport(report: Omit<DefectReport, "id" | "created_at">) {
  const { data, error } = await supabase.from("defect_reports").insert([report]).select().single()

  if (error) {
    console.error("Error creating defect report:", error)
    throw error
  }

  return data
}

export async function getDefectReports(startDate?: string, endDate?: string) {
  let query = supabase.from("defect_reports").select("*").order("created_at", { ascending: false })

  if (startDate && endDate) {
    query = query.gte("fecha", startDate).lte("fecha", endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching defect reports:", error)
    throw error
  }

  return data || []
}

export async function uploadDefectPhoto(file: File, reportId: string) {
  const fileExt = file.name.split(".").pop()
  const uniqueId = uuidv4()
  const fileName = `${reportId}-${uniqueId}.${fileExt}`
  const filePath = `defect-photos/${fileName}`

  const { error: uploadError } = await supabase.storage.from("defect-photos").upload(filePath, file)

  if (uploadError) {
    console.error("Error uploading photo:", uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from("defect-photos").getPublicUrl(filePath)

  return data.publicUrl
}

export async function getDefectStats(startDate?: string, endDate?: string) {
  let query = supabase.from("defect_reports").select("area, defecto, fecha")

  if (startDate && endDate) {
    query = query.gte("fecha", startDate).lte("fecha", endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching stats:", error)
    throw error
  }

  return data || []
}
