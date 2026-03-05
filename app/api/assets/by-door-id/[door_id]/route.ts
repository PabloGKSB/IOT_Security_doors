import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(
    request: Request,
    { params }: { params: { door_id?: string } }
) {
    try {
        const supabase = await createClient()
        const door_id = params?.door_id ? decodeURIComponent(params.door_id).trim() : ""

        if (!door_id) {
            return NextResponse.json({ error: "Missing door_id in route param" }, { status: 400 })
        }

        const body = await request.json().catch(() => ({}))
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
            return NextResponse.json({ error: "No fields to update" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("assets")
            .update(updateData)
            .eq("door_id", door_id)
            .select("*")
            .single()

        if (error) {
            console.error("[by-door-id] Error updating asset:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (e) {
        console.error("[by-door-id] Error in PUT:", e)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: { door_id?: string } }
) {
    try {
        const supabase = await createClient()
        const door_id = params?.door_id ? decodeURIComponent(params.door_id).trim() : ""

        if (!door_id) {
            return NextResponse.json({ error: "Missing door_id in route param" }, { status: 400 })
        }

        const { error } = await supabase.from("assets").delete().eq("door_id", door_id)

        if (error) {
            console.error("[by-door-id] Error deleting asset:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error("[by-door-id] Error in DELETE:", e)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}