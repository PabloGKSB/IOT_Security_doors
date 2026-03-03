import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

type Role = "admin" | "gestor"

async function requireAuth(supabase: any) {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return { ok: false as const, res: NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
  }
  return { ok: true as const, user: data.user }
}

async function getMyRole(supabase: any): Promise<Role | null> {
  const { data: role } = await supabase.rpc("get_my_role")
  return (role as Role) ?? null
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const gate = await requireAuth(supabase)
  if (!gate.ok) return gate.res

  const role = await getMyRole(supabase)
  if (role !== "admin" && role !== "gestor") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const url = new URL(req.url)
  const userId = url.searchParams.get("user_id")
  if (!userId) return NextResponse.json({ error: "Falta user_id" }, { status: 400 })

  const { data, error } = await supabase
    .from("user_open_permissions")
    .select("location,can_open")
    .eq("user_id", userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  const gate = await requireAuth(supabase)
  if (!gate.ok) return gate.res

  const role = await getMyRole(supabase)
  if (role !== "admin" && role !== "gestor") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const body = await req.json()
  const { user_id, locations } = body as { user_id: string; locations: string[] }

  if (!user_id || !Array.isArray(locations)) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  // estrategia simple: borrar y reinsertar
  const del = await supabase.from("user_open_permissions").delete().eq("user_id", user_id)
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 })

  if (locations.length === 0) return NextResponse.json({ ok: true })

  const rows = locations.map((loc) => ({ user_id, location: loc, can_open: true }))
  const ins = await supabase.from("user_open_permissions").insert(rows)
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}