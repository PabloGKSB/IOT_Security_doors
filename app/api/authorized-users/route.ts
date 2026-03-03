import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

type Role = "admin" | "gestor"

async function requireAdminOrGestor(supabase: any) {
  // 1) Usuario autenticado
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  console.log("[authErr]", authErr)
  console.log("[authUser]", authData?.user?.id, authData?.user?.email)
  if (authErr || !authData?.user) {
    return { ok: false as const, res: NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
  }
  

  // 2) Rol desde profiles
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", authData.user.id)
    .single()

  console.log("[profileErr]", profErr)
  console.log("[profile]", profile)

  if (profErr || !profile?.role) {
    return { ok: false as const, res: NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 }) }
  }

  const role = profile.role as Role
  if (role !== "admin" && role !== "gestor") {
    return { ok: false as const, res: NextResponse.json({ error: "Sin permisos" }, { status: 403 }) }
  }

  return { ok: true as const, userId: authData.user.id, role }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const gate = await requireAdminOrGestor(supabase)
    if (!gate.ok) return gate.res

    const { data, error } = await supabase
      .from("authorized_users")
      .select("*")
      .order("nombre", { ascending: true })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error fetching authorized users:", error)
    return NextResponse.json({ error: "Error fetching users" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const gate = await requireAdminOrGestor(supabase)
    if (!gate.ok) return gate.res

    const body = await request.json()

    // RFID deshabilitado: no lo exigimos y lo guardamos como null
    const { data, error } = await supabase
      .from("authorized_users")
      .insert({
        nombre: body.nombre,
        apellido: body.apellido,
        email: body.email,
        telefono: body.telefono,
        cargo: body.cargo,
        departamento: body.departamento,
        rfid_uid: null, // <-- RFID OFF
        ubicaciones_autorizadas: body.ubicaciones_autorizadas || [],
        activo: body.activo !== false,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    return NextResponse.json({ error: "Error creating user" }, { status: 500 })
  }
}