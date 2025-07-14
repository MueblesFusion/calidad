"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDefectReportsWithPhotos } from "@/lib/database"
import Image from "next/image"

export default function ReportesPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReports() {
      try {
        const data = await getDefectReportsWithPhotos()
        setReports(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  if (loading) return <p>Cargando reportes...</p>

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Reportes de Defectos</h1>
      {reports.length === 0 && <p>No hay reportes registrados.</p>}
      {reports.map((report) => (
        <Card key={report.id} className="mb-6">
          <CardHeader>
            <CardTitle>{report.producto} - {report.defecto}</CardTitle>
            <p className="text-sm text-gray-500">{report.fecha}</p>
          </CardHeader>
          <CardContent>
            <p><strong>Área:</strong> {report.area}</p>
            <p><strong>Descripción:</strong> {report.descripcion || "N/A"}</p>
            <p><strong>Cliente:</strong> {report.cliente}</p>
            <div className="mt-4 flex flex-wrap gap-4">
              {report.defect_report_photos && report.defect_report_photos.length > 0 ? (
                report.defect_report_photos.map((photo: any) => (
                  <div key={photo.id} className="w-32 h-32 relative border rounded overflow-hidden">
                    <Image src={photo.foto_url} alt="Foto del defecto" fill style={{ objectFit: "cover" }} />
                  </div>
                ))
              ) : (
                <p>No hay fotos.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </main>
  )
}
