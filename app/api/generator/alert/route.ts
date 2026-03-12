import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/generator/alert
 * Body: { board_id, alert_type: "fuel_low" | "test" }
 *
 * Envía alerta por email usando el mismo sistema que los tableros (Resend).
 * Reutiliza /api/alerts/send internamente.
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        const body = await request.json()
        const { board_id, alert_type = "fuel_low", simulated_pct = 15 } = body as {
            board_id: string
            alert_type?: "fuel_low" | "test"
            simulated_pct?: number
        }

        if (!board_id) {
            return NextResponse.json({ ok: false, error: "Se requiere board_id" }, { status: 400 })
        }

        // Obtener datos del generador
        const { data: asset } = await supabase
            .from("assets")
            .select("custom_name, location, fuel_capacity_liters, fuel_consumption_lph, fuel_alert_threshold_pct")
            .eq("door_id", board_id)
            .eq("asset_type", "generator")
            .maybeSingle()

        if (!asset) {
            return NextResponse.json({ ok: false, error: `Generador no encontrado: ${board_id}` }, { status: 404 })
        }

        // Obtener estado actual de combustible
        const baseUrl = new URL(request.url).origin
        const statusRes = await fetch(`${baseUrl}/api/generator/status?board_id=${encodeURIComponent(board_id)}`)
        const status = await statusRes.json()

        const isTest = alert_type === "test"
        const fuelPct = isTest ? simulated_pct : (status?.fuel_remaining_pct ?? 0)
        const fuelRemaining = isTest ? (asset.fuel_capacity_liters ?? 0) * (simulated_pct / 100) : (status?.fuel_remaining_liters ?? 0)
        const totalHours = isTest ? 12 : Math.round((status?.total_minutes_since_refill ?? 0) / 60)

        const subject = isTest
            ? `🧪 [SIMULACIÓN] Alerta Combustible — ${asset.custom_name}`
            : `⛽ Combustible Bajo — ${asset.custom_name} (${asset.location})`

        const message = [
            isTest ? "⚠ SIMULACIÓN — Esta es una prueba del sistema de alertas de generador." : "",
            "",
            `Generador: ${asset.custom_name}`,
            `Ubicación: ${asset.location}`,
            `Board ID: ${board_id}`,
            "",
            `🔋 Nivel de combustible: ${fuelPct}%`,
            `💧 Combustible restante: ${Math.round(fuelRemaining * 10) / 10} L`,
            `⏱ Horas desde última recarga: ${totalHours}h`,
            `📊 Umbral configurado: ${asset.fuel_alert_threshold_pct ?? 20}%`,
            "",
            "Acción requerida: Realizar recarga de combustible lo antes posible.",
            isTest ? "\nEsta es una alerta de PRUEBA generada manualmente desde el dashboard." : "",
        ]
            .filter((l) => l !== undefined)
            .join("\n")
            .trim()

        // Reutilizar el mismo endpoint de envío de alertas que usan los tableros
        const alertRes = await fetch(`${baseUrl}/api/alerts/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Pasar la cookie de autenticación
                cookie: request.headers.get("cookie") ?? "",
            },
            body: JSON.stringify({
                subject,
                message,
                event_type: isTest ? "test_fuel_alert" : "fuel_alert",
                location: asset.location,
                board_name: board_id,
            }),
        })

        const alertData = await alertRes.json()

        return NextResponse.json({
            ok: true,
            is_test: isTest,
            sent_to: alertData.sent_to ?? 0,
            results: alertData.results ?? [],
        })
    } catch (e) {
        console.error("[api/generator/alert]", e)
        return NextResponse.json({ ok: false, error: "Error interno del servidor" }, { status: 500 })
    }
}
