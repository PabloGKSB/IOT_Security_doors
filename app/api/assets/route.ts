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

    const {
      door_id,
      custom_name,
      location,
      board_name,
      description,
      asset_type,
      fuel_capacity_liters,
      fuel_consumption_lph,
      fuel_alert_threshold_pct,
    } = body

    if (!door_id || !custom_name || !location) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const insertData: Record<string, unknown> = {
      door_id,
      custom_name,
      location,
      board_name: board_name || null,
      description: description || null,
      active: true,
      asset_type: asset_type ?? "door",
    }

    if (fuel_capacity_liters !== undefined && fuel_capacity_liters !== "")
      insertData.fuel_capacity_liters = Number(fuel_capacity_liters)
    if (fuel_consumption_lph !== undefined && fuel_consumption_lph !== "")
      insertData.fuel_consumption_lph = Number(fuel_consumption_lph)
    if (fuel_alert_threshold_pct !== undefined && fuel_alert_threshold_pct !== "")
      insertData.fuel_alert_threshold_pct = Number(fuel_alert_threshold_pct)

    const { data, error } = await supabase
      .from("assets")
      .insert(insertData)
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
