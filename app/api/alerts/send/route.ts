import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: Request) {
  try {
    console.log("[v0] Iniciando envío de alertas EMAIL...")

    const supabase = await createClient()
    const { message, event_type, location, board_name, subject } = await request.json()

    console.log("[v0] Datos recibidos:", { message, event_type, location, board_name, subject })

    // Obtener contactos activos
    const { data: contacts, error } = await supabase
      .from("alert_contacts")
      .select("*")
      .eq("active", true)

    if (error) {
      console.error("[v0] Error obteniendo contactos:", error)
      return NextResponse.json({ error: "Error obteniendo contactos", details: error.message }, { status: 500 })
    }

    if (!contacts || contacts.length === 0) {
      console.log("[v0] No hay contactos activos")
      return NextResponse.json({
        message: "No hay contactos activos",
        sent_to: 0,
        results: [],
      })
    }

    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.ALERTS_FROM_EMAIL

    if (!apiKey || !fromEmail) {
      console.error("[v0] Resend no configurado correctamente")
      return NextResponse.json(
        {
          error: "Resend no configurado correctamente",
          missing: {
            RESEND_API_KEY: !apiKey,
            ALERTS_FROM_EMAIL: !fromEmail,
          },
        },
        { status: 500 },
      )
    }

    const resend = new Resend(apiKey)

    const results: any[] = []
    let successCount = 0

    const finalSubject =
      subject ||
      `🔔 Alerta ${event_type ? `(${event_type})` : ""} - ${board_name ?? "Sistema IoT"}`
        .replace(/\s+/g, " ")
        .trim()

    const textBody = [
      `Evento: ${event_type ?? "-"}`,
      `Ubicación: ${location ?? "-"}`,
      `Tablero: ${board_name ?? "-"}`,
      "",
      message ?? "",
    ].join("\n")

    for (const contact of contacts) {
      try {
        const email = (contact.email || "").trim()
        if (!email) {
          results.push({
            contact: contact.name,
            email: null,
            status: "failed",
            error: "Contacto sin email",
          })
          continue
        }

        console.log(`[v0] Enviando EMAIL a ${contact.name} (${email})...`)

        const { data, error: sendError } = await resend.emails.send({
          from: fromEmail,
          to: [email], // 1 por contacto (privacidad + reporte detallado)
          subject: finalSubject,
          text: textBody,
        })

        if (sendError) {
          console.error(`[v0] Error enviando EMAIL a ${contact.name}:`, sendError)
          results.push({
            contact: contact.name,
            email,
            status: "failed",
            error: sendError.message,
          })
        } else {
          console.log(`[v0] EMAIL enviado exitosamente a ${contact.name}`)
          results.push({
            contact: contact.name,
            email,
            status: "sent",
            id: data?.id ?? null,
          })
          successCount++
        }
      } catch (err) {
        console.error(`[v0] Error enviando EMAIL a ${contact.name}:`, err)
        results.push({
          contact: contact.name,
          email: contact.email ?? null,
          status: "error",
          error: String(err),
        })
      }
    }

    console.log(`[v0] Resultado final: ${successCount}/${contacts.length} EMAIL enviados`)

    return NextResponse.json({
      success: true,
      message: "Alertas procesadas",
      sent_to: successCount,
      total_contacts: contacts.length,
      results,
    })
  } catch (error) {
    console.error("[v0] Error crítico en envío de alertas:", error)
    return NextResponse.json(
      {
        error: "Error crítico sending alerts",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}