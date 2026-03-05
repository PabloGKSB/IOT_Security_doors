import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function getDoorIdFromUrl(request: Request) {
    try {
        const url = new URL(request.url)
        const parts = url.pathname.split("/").filter(Boolean)
        // .../api/assets/by-door-id/<DOOR_ID>
        return decodeURIComponent(parts[parts.length - 1] || "").trim()
    } catch {
        return ""
    }
}

export async function PUT(
    request: Request,
    ctx: { params: { door_id?: string } }
) {
    try {
        const supabase = await createClient()

        const body = await request.json().catch(() => ({}))
        const doorIdFromParams = ctx?.params?.door_id ? decodeURIComponent(ctx.params.door_id).trim() : ""
        const doorIdFromUrl = getDoorIdFromUrl(request)

        const door_id = (doorIdFromParams || doorIdFromUrl).trim()

        console.log("[by-door-id PUT] url:", request.url)
        console.log("[by-door-id PUT] doorIdFromParams:", doorIdFromParams)
        console.log("[by-door-id PUT] doorIdFromUrl:", doorIdFromUrl)
        console.log("[by-door-id PUT] FINAL door_id:", door_id)
        console.log("[by-door-id PUT] body:", body)

        if (!door_id) {
            return NextResponse.json(
                { error: "Missing door_id in route param", debug: { doorIdFromParams, doorIdFromUrl } },
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

        // Si viene todo vacío, avisamos explícito
        const meaningfulKeys = Object.keys(updateData).filter((k) => k !== "updated_at")
        if (meaningfulKeys.length === 0) {
            return NextResponse.json(
                { error: "No fields to update", received: body },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from("assets")
            .update(updateData)
            .eq("door_id", door_id)
            .select("*")
            .single()

        if (error) {
            console.error("[by-door-id PUT] supabase error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!data) {
            return NextResponse.json(
                { error: "Asset not found for door_id", door_id },
                { status: 404 }
            )
        }

        return NextResponse.json({ ok: true, data, _route: "by-door-id" })
    } catch (e) {
        console.error("[by-door-id PUT] unexpected:", e)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    ctx: { params: { door_id?: string } }
) {
    try {
        const supabase = await createClient()

        const doorIdFromParams = ctx?.params?.door_id ? decodeURIComponent(ctx.params.door_id).trim() : ""
        const doorIdFromUrl = getDoorIdFromUrl(request)
        const door_id = (doorIdFromParams || doorIdFromUrl).trim()

        console.log("[by-door-id DELETE] FINAL door_id:", door_id)

        if (!door_id) {
            return NextResponse.json(
                { error: "Missing door_id in route param", debug: { doorIdFromParams, doorIdFromUrl } },
                { status: 400 }
            )
        }

        const { error } = await supabase.from("assets").delete().eq("door_id", door_id)

        if (error) {
            console.error("[by-door-id DELETE] supabase error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ ok: true, success: true, _route: "by-door-id" })
    } catch (e) {
        console.error("[by-door-id DELETE] unexpected:", e)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}