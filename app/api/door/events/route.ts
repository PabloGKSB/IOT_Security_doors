import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location")

    let query = supabase.from("door_events").select("*").order("timestamp", { ascending: false }).limit(100)

    if (location) {
      query = query.eq("location", location)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching events:", error)
    return NextResponse.json({ error: "Error fetching events" }, { status: 500 })
  }
}
