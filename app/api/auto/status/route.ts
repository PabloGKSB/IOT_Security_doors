import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const norm = (s: any) => String(s ?? "").trim().toUpperCase()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const board_name = norm(searchParams.get("board_name"))
    const location = norm(searchParams.get("location"))

    if (!board_name || !location) {
      return NextResponse.json(
        { ok: false, error: "board_name y location son requeridos" },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("door_events")
      .select("event_type, timestamp, details")
      .eq("board_name", board_name)
      .eq("location", location)
      .in("event_type", ["power_up", "power_down"])
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ ok: true, auto_on: null, last_updated: null, note: null })
    }

    return NextResponse.json({
      ok: true,
      auto_on: data.event_type === "power_up",
      last_updated: data.timestamp,
      note: data.details?.note ?? null,
    })
  } catch (e) {
    console.error("[auto/status]", e)
    return NextResponse.json({ ok: false, error: "Error obteniendo estado automático" }, { status: 500 })
  }
}