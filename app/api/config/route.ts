import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/config?board_id=ESP32-SANTIAGO-01
 *
 * Endpoint público (sin autenticación) que el ESP32 consulta al arrancar
 * para obtener su configuración remota desde la tabla `assets`.
 *
 * Respuesta exitosa:
 * {
 *   "board_id":    "ESP32-SANTIAGO-01",
 *   "board_name":  "Tablero Principal",
 *   "location":    "SANTIAGO CASA MATRIZ",
 *   "custom_name": "Puerta Principal",
 *   "active":      true
 * }
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const board_id = searchParams.get("board_id")?.trim()

        if (!board_id) {
            return NextResponse.json(
                { ok: false, error: "Se requiere el parámetro board_id" },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        const { data, error } = await supabase
            .from("assets")
            .select("door_id, board_name, location, custom_name, active")
            .eq("door_id", board_id)
            .maybeSingle()

        if (error) {
            console.error("[api/config] Error consultando assets:", error)
            return NextResponse.json(
                { ok: false, error: "Error interno del servidor" },
                { status: 500 }
            )
        }

        if (!data) {
            return NextResponse.json(
                { ok: false, error: `No se encontró configuración para board_id: ${board_id}` },
                { status: 404 }
            )
        }

        return NextResponse.json({
            ok: true,
            board_id: data.door_id,
            board_name: data.board_name ?? data.door_id,
            location: data.location,
            custom_name: data.custom_name,
            active: data.active ?? true,
        })
    } catch (e) {
        console.error("[api/config] Error inesperado:", e)
        return NextResponse.json(
            { ok: false, error: "Error interno del servidor" },
            { status: 500 }
        )
    }
}
