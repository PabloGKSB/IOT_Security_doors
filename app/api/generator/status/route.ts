import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/generator/status?board_id=GEN-SANTIAGO-01
 *
 * Retorna:
 * - is_on: si el generador está encendido ahora
 * - session_minutes: minutos encendido en la sesión actual
 * - total_minutes_since_refill: minutos totales desde la última recarga
 *   (con tolerancia de 30 min entre apagado y encendido = misma sesión)
 * - fuel_capacity_liters: capacidad total
 * - fuel_consumed_liters: combustible gastado estimado
 * - fuel_remaining_liters: combustible restante estimado
 * - fuel_remaining_pct: porcentaje restante
 * - fuel_alert: true si está bajo el umbral
 * - last_event_at: timestamp del último evento
 *
 * Acepta eventos del ESP32 en dos modalidades sin cambiar firmware:
 *   open / power_up  → generador ENCENDIDO
 *   close / power_down → generador APAGADO
 */

const PAUSE_TOLERANCE_MIN = 30 // Req #7: pausa ≤ 30 min no reinicia el contador

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const board_id = searchParams.get("board_id")?.trim()

        if (!board_id) {
            return NextResponse.json(
                { ok: false, error: "Se requiere board_id" },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // 1. Obtener configuración del generador
        const { data: asset, error: assetError } = await supabase
            .from("assets")
            .select("fuel_capacity_liters, fuel_consumption_lph, fuel_alert_threshold_pct, last_refill_at, active")
            .eq("door_id", board_id)
            .eq("asset_type", "generator")
            .maybeSingle()

        if (assetError) throw assetError
        if (!asset) {
            return NextResponse.json(
                { ok: false, error: `No se encontró generador con board_id: ${board_id}` },
                { status: 404 }
            )
        }

        // 2. Obtener eventos del generador desde la última recarga
        // Acepta tanto open/close (relay) como power_up/power_down (boot ESP32)
        const since = asset.last_refill_at ?? "2000-01-01T00:00:00Z"

        const { data: events, error: eventsError } = await supabase
            .from("door_events")
            .select("event_type, timestamp")
            .eq("door_id", board_id)
            .in("event_type", ["open", "close", "power_up", "power_down"])
            .gte("timestamp", since)
            .order("timestamp", { ascending: true })

        if (eventsError) throw eventsError

        // 3. Calcular tiempo total encendido (con tolerancia de pausa ≤ 30 min)
        let totalMinutes = 0
        let sessionStartMs: number | null = null
        let lastDownMs: number | null = null
        let isOn = false

        for (const ev of events ?? []) {
            const ts = new Date(ev.timestamp).getTime()
            // 'open' o 'power_up' = generador encendido
            const isOnEvent = ev.event_type === "power_up" || ev.event_type === "open"
            // 'close' o 'power_down' = generador apagado
            const isOffEvent = ev.event_type === "power_down" || ev.event_type === "close"

            if (isOnEvent) {
                // Si hubo un apagado reciente (≤ 30 min), continuar la sesión
                if (lastDownMs !== null && (ts - lastDownMs) / 60000 <= PAUSE_TOLERANCE_MIN) {
                    // Continuar — no reiniciar sessionStart
                } else {
                    // Nueva sesión
                    sessionStartMs = ts
                }
                lastDownMs = null
                isOn = true
            } else if (isOffEvent) {
                if (sessionStartMs !== null) {
                    totalMinutes += (ts - sessionStartMs) / 60000
                    sessionStartMs = null
                }
                lastDownMs = ts
                isOn = false
            }
        }

        // Si sigue encendido ahora, agregar tiempo de la sesión actual
        const nowMs = Date.now()
        let currentSessionMinutes = 0
        if (isOn && sessionStartMs !== null) {
            currentSessionMinutes = (nowMs - sessionStartMs) / 60000
            totalMinutes += currentSessionMinutes
        }

        // 4. Calcular combustible
        const lph = asset.fuel_consumption_lph ?? 0
        const capacity = asset.fuel_capacity_liters ?? 0
        const consumed = capacity > 0 && lph > 0 ? (totalMinutes / 60) * lph : 0
        const remaining = Math.max(0, capacity - consumed)
        const remainingPct = capacity > 0 ? (remaining / capacity) * 100 : 100
        const threshold = asset.fuel_alert_threshold_pct ?? 20
        const fuelAlert = capacity > 0 && remainingPct <= threshold

        const lastEvent = events && events.length > 0 ? events[events.length - 1] : null

        return NextResponse.json({
            ok: true,
            board_id,
            is_on: isOn,
            session_minutes: Math.round(currentSessionMinutes),
            total_minutes_since_refill: Math.round(totalMinutes),
            fuel_capacity_liters: capacity,
            fuel_consumed_liters: Math.round(consumed * 10) / 10,
            fuel_remaining_liters: Math.round(remaining * 10) / 10,
            fuel_remaining_pct: Math.round(remainingPct),
            fuel_alert: fuelAlert,
            fuel_alert_threshold_pct: threshold,
            last_refill_at: asset.last_refill_at,
            last_event_at: lastEvent?.timestamp ?? null,
            last_event_type: lastEvent?.event_type ?? null,
        })
    } catch (e) {
        console.error("[api/generator/status]", e)
        return NextResponse.json(
            { ok: false, error: "Error interno del servidor" },
            { status: 500 }
        )
    }
}
