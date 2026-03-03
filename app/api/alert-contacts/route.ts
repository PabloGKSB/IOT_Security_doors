import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Fetching alert contacts...")
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("alert_contacts")
      .select("*")
      .order("name", { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error fetching contacts:", error)
    return NextResponse.json(
      { error: "Error fetching contacts", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("alert_contacts")
      .insert({
        name: body.name,
        email: body.email,
        active: body.active !== false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error creating contact:", error)
    return NextResponse.json({ error: "Error creating contact" }, { status: 500 })
  }
}