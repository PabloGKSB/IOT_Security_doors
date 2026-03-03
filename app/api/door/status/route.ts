import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: assets, error: assetsError } = await supabase
      .from("assets")
      .select("*")
      .eq("active", true)
      .order("custom_name")

    if (assetsError) throw assetsError

    const { data: statuses, error: statusError } = await supabase
      .from("door_status")
      .select("*")
      .order("last_updated", { ascending: false })

    if (statusError) throw statusError

    const result = (assets || []).map((asset) => {
      const status = (statuses || []).find((s) => s.door_id === asset.door_id)

      if (status) {
        // Si existe estado, lo usamos con el nombre personalizado del activo
        return {
          ...status,
          custom_name: asset.custom_name,
          asset_location: asset.location,
          asset_description: asset.description,
        }
      } else {
        // Si no existe estado, creamos uno por defecto con el activo
        return {
          id: asset.id,
          door_id: asset.door_id,
          board_name: asset.board_name,
          location: asset.location,
          is_open: false,
          last_updated: asset.updated_at || asset.created_at,
          event_start_time: null,
          last_event_id: null,
          custom_name: asset.custom_name,
          asset_location: asset.location,
          asset_description: asset.description,
        }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error fetching door status:", error)
    return NextResponse.json({ error: "Error fetching door status" }, { status: 500 })
  }
}
