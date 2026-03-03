import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { board_name, location, event_type, authorized, details } = body

    console.log("[v0] Creating event:", { board_name, location, event_type, authorized })

    // Insertar evento
    const { data: eventData, error: eventError } = await supabase
      .from("door_events")
      .insert({
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

    console.log("[v0] Event created with ID:", eventData.id)

    // Actualizar estado de la puerta
    // Actualizar estado de la puerta SOLO para eventos de puerta
    const doorId = `${board_name}_${location}`

    if (event_type === "open" || event_type === "close") {
      const { error: statusError } = await supabase.from("door_status").upsert(
        {
          door_id: doorId,
          board_name,
          location,
          is_open: event_type === "open",
          last_updated: new Date().toISOString(),
          last_event_id: eventData.id,
          event_start_time: event_type === "open" ? new Date().toISOString() : null,
        },
        { onConflict: "door_id" },
      )

      if (statusError) throw statusError
    }

    console.log("[v0] Door status updated")

    const eventLabels = {
    open: "Apertura",
    close: "Cierre",
    authorized: "Acceso Autorizado",
    unauthorized: "Acceso No Autorizado",
    forced: "Apertura Forzada",
    power_up: "Automático Subido",
    power_down: "Automático Bajado",
    }

    const eventLabel = eventLabels[event_type as keyof typeof eventLabels] || event_type
    const alertMessage = `${eventLabel} en ${location} - ${board_name}${details?.note ? ` - ${details.note}` : ""}`

    console.log("[v0] Preparando envío de SMS:", alertMessage)

    try {
      // Construir base URL correctamente
      let baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (request.headers.get("x-forwarded-proto") || "https") + "://" + request.headers.get("x-forwarded-host") ||
        (request.headers.get("host")
          ? `${request.headers.get("host")?.includes("localhost") ? "http" : "https"}://${request.headers.get("host")}`
          : "http://localhost:3000")

      // Remover trailing slash si existe
      baseUrl = baseUrl.replace(/\/$/, "")

      const alertUrl = `${baseUrl}/api/alerts/send`
      console.log("[v0] Enviando SMS a URL:", alertUrl)

      const alertResponse = await fetch(alertUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: alertMessage,
          event_type,
          location,
          board_name,
        }),
      })

      const alertText = await alertResponse.text()
      console.log("[v0] Respuesta SMS (raw):", alertText)

      if (alertResponse.ok) {
        try {
          const alertData = JSON.parse(alertText)
          console.log("[v0] SMS procesado correctamente:", alertData)
        } catch (parseError) {
          console.error("[v0] Error parseando respuesta SMS (pero HTTP 200):", parseError)
        }
      } else {
        console.error("[v0] Error en envío SMS (HTTP", alertResponse.status, "):", alertText)
      }
    } catch (smsError) {
      console.error("[v0] Error enviando SMS (non-blocking):", smsError)
      // No lanzamos el error para que el evento se registre aunque falle el SMS
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
