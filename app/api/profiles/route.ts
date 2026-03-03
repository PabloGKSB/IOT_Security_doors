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
  // si ya tienes RPC get_my_role úsalo. Si no, puedes leer profiles (ya arreglaste RLS).
  const { data: role, error } = await supabase.rpc("get_my_role")
  if (!error && role) return role as Role

  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return null

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", authData.user.id).single()
  return (profile?.role as Role) ?? null
}

export async function GET() {
  const supabase = await createClient()
  const gate = await requireAuth(supabase)
  if (!gate.ok) return gate.res

  const role = await getMyRole(supabase)
  if (role !== "admin" && role !== "gestor") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  // Solo admin puede listar todos los perfiles
  if (role !== "admin") {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,email,role")
    .order("email", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const gate = await requireAuth(supabase)
  if (!gate.ok) return gate.res

  const role = await getMyRole(supabase)
  if (role !== "admin") {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 })
  }

  const body = await req.json()
  const { user_id, new_role } = body as { user_id: string; new_role: Role }

  if (!user_id || !new_role || !["admin", "gestor"].includes(new_role)) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: new_role })
    .eq("user_id", user_id)
    .select("user_id,email,role")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}