import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // 1) Traer assets activos tipo 'door' (excluye generadores)
    const { data: assets, error: assetsError } = await supabase
      .from("assets")
      .select("*")
      .eq("active", true)
      .eq("asset_type", "door")
      .order("custom_name")

    if (assetsError) throw assetsError

    // 2) Traer últimos estados de puertas
    const { data: statuses, error: statusError } = await supabase
      .from("door_status")
      .select("*")
      .order("last_updated", { ascending: false })

    if (statusError) throw statusError

    // 3) Unir assets con su estado por door_id (si existe)
    const result = (assets || []).map((asset: any) => {
      const status = (statuses || []).find((s: any) => s.door_id === asset.door_id)

      return {
        // IDs consistentes (no ambiguos)
        asset_id: asset.id,               // UUID de assets
        status_id: status?.id ?? null,    // UUID de door_status (si existe)

        // Llave de correlación / negocio
        door_id: asset.door_id,
        board_name: asset.board_name,

        // Estado (si no existe, default)
        is_open: status?.is_open ?? false,
        last_updated: status?.last_updated ?? asset.updated_at ?? asset.created_at,
        event_start_time: status?.event_start_time ?? null,
        last_event_id: status?.last_event_id ?? null,

        // Metadata del asset
        custom_name: asset.custom_name,
        asset_location: asset.location,
        asset_description: asset.description,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error fetching door status:", error)
    return NextResponse.json({ error: "Error fetching door status" }, { status: 500 })
  }
}