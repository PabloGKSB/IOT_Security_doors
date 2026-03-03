"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download } from "lucide-react"
import { StatsCards } from "@/components/stats-cards"
import { EventsTable } from "@/components/events-table"
import Link from "next/link"

const LOCATIONS = ["all", "SANTIAGO CASA MATRIZ", "ANTOFAGASTA", "COQUIMBO", "CONCEPCION", "PUERTO MONTT"]

export default function ReportsPage() {
  const [selectedLocation, setSelectedLocation] = useState("all")

  const handleExportCSV = async () => {
    try {
      const url =
        selectedLocation === "all"
          ? "/api/door/events"
          : `/api/door/events?location=${encodeURIComponent(selectedLocation)}`
      const response = await fetch(url)
      const events = await response.json()

      const csv = [
        ["Fecha y Hora", "Ubicación", "Tablero", "Tipo de Evento", "Autorizado", "Duración (segundos)"].join(","),
        ...events.map((event: any) =>
          [
            new Date(event.timestamp).toLocaleString("es-CL"),
            event.location,
            event.board_name,
            event.event_type,
            event.authorized ? "Sí" : "No",
            event.duration_seconds || "",
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url2 = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url2
      a.download = `reporte_eventos_${selectedLocation}_${new Date().toISOString().split("T")[0]}.csv`
      a.click()
    } catch (error) {
      console.error("[v0] Error exporting CSV:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Reportes y Análisis</h1>
          <p className="text-muted-foreground mt-1">Informes detallados de uso y seguridad</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Seleccionar ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                {LOCATIONS.slice(1).map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Estadísticas</h2>
          <StatsCards location={selectedLocation} />
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Eventos Detallados</CardTitle>
              <CardDescription>Vista completa de todos los eventos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <EventsTable />
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
