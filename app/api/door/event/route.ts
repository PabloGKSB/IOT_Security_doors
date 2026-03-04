import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // ✅ ahora recibimos door_id
    const { door_id, board_name, location, event_type, authorized, details } = body
    const doorId = door_id || `${board_name}_${location}` // fallback

    console.log("[v0] Creating event:", { door_id: doorId, board_name, location, event_type, authorized })

    // ✅ Insertar evento (guardando door_id)
    const { data: eventData, error: eventError } = await supabase
      .from("door_events")
      .insert({
        door_id: doorId,
        board_name,
        location,
        event_type,
        authorized: authorized || false,
        details: details || {},
        timestamp: new Date().toISOString(),
      })
      .select()
      .single()

    if (eventError) throw eventError

    // ✅ Actualizar door_status también para automático
    const isDoorEvent = event_type === "open" || event_type === "close"
    const isAutoEvent = event_type === "power_up" || event_type === "power_down"

    const statusPayload: any = {
      door_id: doorId,
      board_name,
      location,
      last_updated: new Date().toISOString(),
      last_event_id: eventData.id,
    }

    if (isDoorEvent) {
      statusPayload.is_open = event_type === "open"
      statusPayload.event_start_time = event_type === "open" ? new Date().toISOString() : null
    }

    if (isAutoEvent) {
      statusPayload.auto_on = event_type === "power_up"
      statusPayload.auto_last_updated = new Date().toISOString()
    }

    // Solo upsert si es evento relevante
    if (isDoorEvent || isAutoEvent) {
      const { error: statusError } = await supabase
        .from("door_status")
        .upsert(statusPayload, { onConflict: "door_id" })
      if (statusError) throw statusError
    }

    const eventLabels = {
      open: "Apertura",
      close: "Cierre",
      authorized: "Acceso Autorizado",
      unauthorized: "Acceso No Autorizado",
      forced: "Apertura Forzada",
      power_up: "Automático Subido",
      power_down: "Automático Bajado",
    } as const

    const eventLabel = eventLabels[event_type as keyof typeof eventLabels] || event_type
    const alertMessage = `${eventLabel} en ${location} - ${board_name}${details?.note ? ` - ${details.note}` : ""}`

    // (tu bloque de envío alertas lo dejo tal cual)
    try {
      let baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (request.headers.get("x-forwarded-proto") || "https") + "://" + request.headers.get("x-forwarded-host") ||
        (request.headers.get("host")
          ? `${request.headers.get("host")?.includes("localhost") ? "http" : "https"}://${request.headers.get("host")}`
          : "http://localhost:3000")

      baseUrl = baseUrl.replace(/\/$/, "")
      const alertUrl = `${baseUrl}/api/alerts/send`

      const alertResponse = await fetch(alertUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: alertMessage, event_type, location, board_name }),
      })

      const alertText = await alertResponse.text()
      console.log("[v0] Respuesta alertas:", alertResponse.status, alertText)
    } catch (smsError) {
      console.error("[v0] Error enviando alertas (non-blocking):", smsError)
    }

    return NextResponse.json({ success: true, event: eventData })
  } catch (error) {
    console.error("[v0] Error creating event:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear evento" },
      { status: 500 },
    )
  }
}