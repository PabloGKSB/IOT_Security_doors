"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle, Clock, DoorOpen } from "lucide-react"

interface Stats {
  total_events: number
  by_type: Record<string, number>
  by_location: Record<string, number>
  avg_duration: number
  total_alerts: number
}

export function StatsCards({ location }: { location?: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url =
          location && location !== "all" ? `/api/stats?location=${encodeURIComponent(location)}` : "/api/stats"
        const response = await fetch(url)
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("[v0] Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [location])

  if (loading) {
    return <div className="text-center py-4">Cargando estadísticas...</div>
  }

  if (!stats) return null

  const openEvents = stats.by_type["open"] || 0
  const closeEvents = stats.by_type["close"] || 0
  const authorizedEvents = stats.by_type["authorized"] || 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_events}</div>
          <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eventos Autorizados</CardTitle>
          <DoorOpen className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{authorizedEvents}</div>
          <p className="text-xs text-muted-foreground">Accesos con tarjeta RFID</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas de Seguridad</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_alerts}</div>
          <p className="text-xs text-muted-foreground">Eventos no autorizados/forzados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.floor(stats.avg_duration / 60)}m {stats.avg_duration % 60}s
          </div>
          <p className="text-xs text-muted-foreground">Tiempo puerta abierta</p>
        </CardContent>
      </Card>
    </div>
  )
}
