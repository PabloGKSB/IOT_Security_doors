import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data?.user) return NextResponse.json({ error: "No auth" }, { status: 401 })

  const { data: role } = await supabase.rpc("get_my_role")
  return NextResponse.json({ role: role ?? null })
}