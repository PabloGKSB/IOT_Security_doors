import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/generator/refill
 * Body: { board_id: string, liters_added?: number, note?: string }
 *
 * Registra una recarga de combustible:
 * 1. Inserta evento fuel_refill en door_events
 * 2. Actualiza last_refill_at en assets (reinicia el contador de combustible)
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // Verificar autenticación
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError || !authData?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await request.json()
        const { board_id, liters_added, note } = body as {
            board_id: string
            liters_added?: number
            note?: string
        }

        if (!board_id) {
            return NextResponse.json(
                { ok: false, error: "Se requiere board_id" },
                { status: 400 }
            )
        }

        // Verificar que el activo existe y es generador
        const { data: asset, error: assetError } = await supabase
            .from("assets")
            .select("id, fuel_capacity_liters")
            .eq("door_id", board_id)
            .eq("asset_type", "generator")
            .maybeSingle()

        if (assetError) throw assetError
        if (!asset) {
            return NextResponse.json(
                { ok: false, error: `No se encontró generador: ${board_id}` },
                { status: 404 }
            )
        }

        const now = new Date().toISOString()

        // 1. Insertar evento fuel_refill
        const details: Record<string, unknown> = {
            refilled_by: authData.user.email,
        }
        if (liters_added !== undefined) details.liters_added = liters_added
        if (note) details.note = note

        const { error: eventError } = await supabase.from("door_events").insert({
            door_id: board_id,
            board_name: board_id,
            location: "",          // se podría enriquecer haciendo join con assets
            event_type: "fuel_refill",
            authorized: true,
            details,
        })

        if (eventError) throw eventError

        // 2. Resetear last_refill_at en el asset (esto reinicia el contador)
        const { error: updateError } = await supabase
            .from("assets")
            .update({ last_refill_at: now, updated_at: now })
            .eq("door_id", board_id)

        if (updateError) throw updateError

        return NextResponse.json({
            ok: true,
            message: "Recarga de combustible registrada correctamente",
            refilled_at: now,
            board_id,
        })
    } catch (e) {
        console.error("[api/generator/refill]", e)
        return NextResponse.json(
            { ok: false, error: "Error interno del servidor" },
            { status: 500 }
        )
    }
}
