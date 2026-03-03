import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const days = searchParams.get("days")

    console.log("[v0] Iniciando limpieza de eventos, tipo:", type, "días:", days)

    if (type === "all") {
      console.log("[v0] Actualizando door_status para remover referencias...")

      const { error: updateError } = await supabase
        .from("door_status")
        .update({
          last_event_id: null,
          event_start_time: null,
        })
        .neq("id", "00000000-0000-0000-0000-000000000000")

      if (updateError) {
        console.error("[v0] Error actualizando door_status:", updateError)
        throw updateError
      }

      console.log("[v0] Referencias eliminadas de door_status")

      // Ahora eliminar TODOS los eventos
      const { error, count } = await supabase
        .from("door_events")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000")

      if (error) {
        console.error("[v0] Error eliminando todos los eventos:", error)
        throw error
      }

      console.log("[v0] Eventos eliminados:", count)

      return NextResponse.json({
        success: true,
        deleted: count || 0,
        message: `Se eliminaron ${count || 0} eventos exitosamente.`,
      })
    } else if (type === "old" && days) {
      // Eliminar eventos antiguos
      const daysNumber = Number.parseInt(days)
      if (isNaN(daysNumber) || daysNumber < 1) {
        return NextResponse.json({ error: "Número de días inválido" }, { status: 400 })
      }

      // Calcular fecha límite
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysNumber)
      const cutoffISO = cutoffDate.toISOString()

      console.log("[v0] Eliminando eventos anteriores a:", cutoffISO)

      const { data: eventsToDelete, error: fetchError } = await supabase
        .from("door_events")
        .select("id")
        .lt("created_at", cutoffISO)

      if (fetchError) {
        console.error("[v0] Error obteniendo eventos a eliminar:", fetchError)
        throw fetchError
      }

      const eventIds = eventsToDelete?.map((e) => e.id) || []
      console.log("[v0] Eventos a eliminar:", eventIds.length)

      if (eventIds.length === 0) {
        return NextResponse.json({
          success: true,
          deleted: 0,
          message: `No hay eventos con más de ${daysNumber} días de antigüedad.`,
        })
      }

      // Actualizar door_status que referencian estos eventos
      const { error: updateError } = await supabase
        .from("door_status")
        .update({
          last_event_id: null,
          event_start_time: null,
        })
        .in("last_event_id", eventIds)

      if (updateError) {
        console.error("[v0] Error actualizando door_status:", updateError)
        throw updateError
      }

      // Ahora eliminar los eventos antiguos
      const { error, count } = await supabase.from("door_events").delete().lt("created_at", cutoffISO)

      if (error) {
        console.error("[v0] Error eliminando eventos antiguos:", error)
        throw error
      }

      console.log("[v0] Eventos antiguos eliminados:", count)

      return NextResponse.json({
        success: true,
        deleted: count || 0,
        message: `Se eliminaron ${count || 0} eventos con más de ${daysNumber} días de antigüedad.`,
      })
    } else {
      return NextResponse.json({ error: "Tipo de limpieza no especificado o inválido" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Error en API de limpieza:", error)
    return NextResponse.json(
      {
        error: "Error al limpiar eventos",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
