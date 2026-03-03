import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

type Role = "admin" | "gestor"
const ALLOWED_ROLES: Role[] = ["admin", "gestor"]

export async function POST(req: Request) {
  try {
    // 1) Cliente normal (con cookies) para validar quién llama
    const supabase = await createClient()

    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // 2) Validar rol admin
    // 2) Validar rol admin
    const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", authData.user.id)
    .single()

    if (profErr || profile?.role !== "admin") {
        return NextResponse.json({ error: "Solo admin" }, { status: 403 })
    }

    // 3) Payload
    const body = await req.json()
    const email = String(body.email ?? "").trim().toLowerCase()
    const role = body.role as Role
    const locations = Array.isArray(body.locations) ? body.locations : []

    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    if (!ALLOWED_ROLES.includes(role)) return NextResponse.json({ error: "Rol inválido" }, { status: 400 })

    // 4) Admin client (service role) SOLO en servidor
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!, // <- solo server env
      { auth: { persistSession: false } }
    )

    // 5) Crear usuario y enviar invitación (correo de set password)
    const { data: created, error: createErr } = await admin.auth.admin.inviteUserByEmail(email)
    if (createErr || !created?.user) {
      return NextResponse.json({ error: createErr?.message ?? "No se pudo crear usuario" }, { status: 500 })
    }

    const userId = created.user.id

    // 6) Setear role en profiles
    const up1 = await admin
      .from("profiles")
      .upsert({ user_id: userId, email, role }, { onConflict: "user_id" })

    if (up1.error) {
      return NextResponse.json({ error: up1.error.message }, { status: 500 })
    }

    // 7) Setear permisos de apertura (reemplaza todo)
    const del = await admin.from("user_open_permissions").delete().eq("user_id", userId)
    if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 })

    if (locations.length > 0) {
      const rows = locations.map((loc: string) => ({ user_id: userId, location: loc, can_open: true }))
      const ins = await admin.from("user_open_permissions").insert(rows)
      if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      user_id: userId,
      email,
      role,
      locations,
      invited: true,
    })
  } catch (e: any) {
    console.error("[create-user]", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}