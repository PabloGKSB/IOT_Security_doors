import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id } = params

    const { custom_name, location, board_name, description, active } = body

    const updateData: any = {}
    if (custom_name !== undefined) updateData.custom_name = custom_name
    if (location !== undefined) updateData.location = location
    if (board_name !== undefined) updateData.board_name = board_name
    if (description !== undefined) updateData.description = description
    if (active !== undefined) updateData.active = active
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("assets").update(updateData).eq("id", id).select().single()

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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params

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
