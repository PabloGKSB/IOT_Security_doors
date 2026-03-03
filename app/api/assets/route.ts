import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: assets, error } = await supabase
      .from("assets")
      .select("*")
      .order("location", { ascending: true })
      .order("custom_name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching assets:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(assets || [])
  } catch (error) {
    console.error("[v0] Error in assets API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { door_id, custom_name, location, board_name, description } = body

    if (!door_id || !custom_name || !location) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("assets")
      .insert({
        door_id,
        custom_name,
        location,
        board_name,
        description,
        active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating asset:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in assets POST:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
