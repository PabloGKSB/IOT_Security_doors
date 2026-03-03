import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location")

    // Obtener estadísticas de eventos
    let eventsQuery = supabase.from("door_events").select("event_type, location, duration_seconds")

    if (location && location !== "all") {
      eventsQuery = eventsQuery.eq("location", location)
    }

    const { data: events, error } = await eventsQuery

    if (error) throw error

    // Calcular estadísticas
    const stats = {
      total_events: events?.length || 0,
      by_type: {} as Record<string, number>,
      by_location: {} as Record<string, number>,
      avg_duration: 0,
      total_alerts: 0,
    }

    let totalDuration = 0
    let durationCount = 0

    events?.forEach((event) => {
      // Contar por tipo
      stats.by_type[event.event_type] = (stats.by_type[event.event_type] || 0) + 1

      // Contar por ubicación
      stats.by_location[event.location] = (stats.by_location[event.location] || 0) + 1

      // Calcular duración promedio
      if (event.duration_seconds) {
        totalDuration += event.duration_seconds
        durationCount++
      }

      // Contar alertas
      if (["forced", "unauthorized"].includes(event.event_type)) {
        stats.total_alerts++
      }
    })

    stats.avg_duration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return NextResponse.json({ error: "Error fetching stats" }, { status: 500 })
  }
}
