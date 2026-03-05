import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function isUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
  )
}

export async function PUT(
  request: Request,
  { params }: { params: { id?: string } }
) {
  try {
    const supabase = await createClient()
    const body = await request.json().catch(() => ({}))
    const id = params?.id

    console.log("[assets PUT] params:", params)
    console.log("[assets PUT] id:", id)
    console.log("[assets PUT] body:", body)

    if (!isUuid(id)) {
      return NextResponse.json(
        { error: "Missing or invalid asset id (uuid) in route param" },
        { status: 400 }
      )
    }

    const { custom_name, location, board_name, description, active } = body as {
      custom_name?: string
      location?: string
      board_name?: string
      description?: string
      active?: boolean
    }

    const updateData: Record<string, any> = {}
    if (custom_name !== undefined) updateData.custom_name = custom_name
    if (location !== undefined) updateData.location = location
    if (board_name !== undefined) updateData.board_name = board_name
    if (description !== undefined) updateData.description = description
    if (active !== undefined) updateData.active = active
    updateData.updated_at = new Date().toISOString()

    if (Object.keys(updateData).length === 1 && updateData.updated_at) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("assets")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      console.error("[v0] Error updating asset:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in asset PUT:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id?: string } }
) {
  try {
    const supabase = await createClient()
    const id = params?.id

    console.log("[assets DELETE] params:", params)
    console.log("[assets DELETE] id:", id)

    if (!isUuid(id)) {
      return NextResponse.json(
        { error: "Missing or invalid asset id (uuid) in route param" },
        { status: 400 }
      )
    }

    const { error } = await supabase.from("assets").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting asset:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in asset DELETE:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}