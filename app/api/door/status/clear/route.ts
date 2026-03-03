import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE() {
  try {
    console.log("[v0] Iniciando limpieza de estado de puertas...")

    const supabase = await createClient()

    // Eliminar todos los registros de door_status
    const { error: deleteError, count } = await supabase
      .from("door_status")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Eliminar todos

    if (deleteError) {
      console.error("[v0] Error al limpiar door_status:", deleteError)
      return NextResponse.json(
        { error: "Error al limpiar estado de puertas", details: deleteError.message },
        { status: 500 },
      )
    }

    console.log(`[v0] Limpieza completada. ${count || 0} registros eliminados`)

    return NextResponse.json({
      success: true,
      message: "Estado de puertas limpiado exitosamente",
      deletedCount: count || 0,
    })
  } catch (error) {
    console.error("[v0] Error en limpieza:", error)
    return NextResponse.json({ error: "Error interno del servidor", details: String(error) }, { status: 500 })
  }
}
