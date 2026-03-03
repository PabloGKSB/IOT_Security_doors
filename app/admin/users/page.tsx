"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Pencil, Plus } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

type Role = "admin" | "gestor"

interface ProfileRow {
  user_id: string
  email: string
  role: Role
}

interface PermissionRow {
  location: string
  can_open: boolean
}

const LOCATIONS = ["SANTIAGO CASA MATRIZ", "ANTOFAGASTA", "COQUIMBO", "CONCEPCION", "PUERTO MONTT"]

export default function UsersPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)

  // quién soy (para habilitar/ocultar features)
  const [myRole, setMyRole] = useState<Role | null>(null)
  const canEditRole = myRole === "admin"

  // ----- Crear usuario -----
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: "",
    role: "gestor" as Role,
    locations: [] as string[],
  })

  // ----- Editar usuario -----
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<ProfileRow | null>(null)
  const [roleDraft, setRoleDraft] = useState<Role>("gestor")
  const [locationDraft, setLocationDraft] = useState<string[]>([])

  const resetCreateForm = () => {
    setCreateForm({ email: "", role: "gestor", locations: [] })
  }

  const toggleCreateLocation = (loc: string) => {
    setCreateForm((prev) => ({
      ...prev,
      locations: prev.locations.includes(loc) ? prev.locations.filter((x) => x !== loc) : [...prev.locations, loc],
    }))
  }

  const toggleEditLocation = (loc: string) => {
    setLocationDraft((prev) => (prev.includes(loc) ? prev.filter((x) => x !== loc) : [...prev, loc]))
  }

  // ---- Fetch: mi rol (opcional)
  const fetchMyRole = async () => {
    try {
      // Si tienes /api/me/role úsalo; si no, dejamos fallback basado en /api/profiles.
      const res = await fetch("/api/me/role")
      if (!res.ok) return
      const data = await res.json()
      if (data?.role === "admin" || data?.role === "gestor") setMyRole(data.role)
    } catch {
      // ignore
    }
  }

  // ---- Fetch: perfiles (lista)
  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/profiles")
      const data = await res.json()

      if (res.status === 401) {
        window.location.href = "/auth/login"
        return
      }

      if (!res.ok) {
        console.error("profiles error:", res.status, data)
        setProfiles([])
        // fallback: si no hay /api/me/role, asumimos que no eres admin si 403
        if (res.status === 403 && myRole === null) setMyRole("gestor")
        return
      }

      setProfiles(Array.isArray(data) ? data : [])
      // Si /api/profiles funciona, eres admin (por cómo lo dejamos)
      if (myRole === null) setMyRole("admin")
    } catch (e) {
      console.error(e)
      setProfiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
    fetchMyRole()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Crear usuario (invitar)
  const createUser = async () => {
    const email = createForm.email.trim().toLowerCase()
    if (!email) return alert("Email requerido")

    try {
      setCreating(true)
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role: createForm.role,
          locations: createForm.locations,
        }),
      })
      const data = await res.json()

      if (res.status === 401) {
        window.location.href = "/auth/login"
        return
      }

      if (!res.ok) {
        alert(data?.error ?? "No se pudo crear el usuario")
        return
      }

      setCreateOpen(false)
      resetCreateForm()
      await fetchProfiles()
      alert("Usuario creado e invitación enviada por correo.")
    } catch (e) {
      console.error(e)
      alert("Error creando usuario")
    } finally {
      setCreating(false)
    }
  }

  // ---- Abrir modal editar
  const openEdit = async (p: ProfileRow) => {
    setEditing(p)
    setRoleDraft(p.role)

    // cargar permisos por ubicación
    try {
      const res = await fetch(`/api/open-permissions?user_id=${encodeURIComponent(p.user_id)}`)
      const data = await res.json()
      if (res.ok && Array.isArray(data)) {
        const allowed = (data as PermissionRow[]).filter((x) => x.can_open).map((x) => x.location)
        setLocationDraft(allowed)
      } else {
        setLocationDraft([])
      }
    } catch {
      setLocationDraft([])
    }

    setEditOpen(true)
  }

  // ---- Guardar cambios (rol + permisos)
  const saveEdit = async () => {
    if (!editing) return

    try {
      setSaving(true)

      // 1) rol (solo admin)
      if (canEditRole && roleDraft !== editing.role) {
        const res = await fetch("/api/profiles", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: editing.user_id, new_role: roleDraft }),
        })
        const data = await res.json()
        if (!res.ok) {
          alert(data?.error ?? "Error actualizando rol")
          return
        }
      }

      // 2) permisos apertura (admin/gestor)
      {
        const res = await fetch("/api/open-permissions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: editing.user_id, locations: locationDraft }),
        })
        const data = await res.json()
        if (!res.ok) {
          alert(data?.error ?? "Error actualizando permisos")
          return
        }
      }

      setEditOpen(false)
      setEditing(null)
      await fetchProfiles()
    } catch (e) {
      console.error(e)
      alert("Error guardando cambios")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Usuarios del Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Roles (Admin/Gestor) y permisos de apertura por ubicación. RFID deshabilitado.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>
                Puedes invitar usuarios desde aquí. Se les enviará un correo para definir contraseña.
              </CardDescription>
            </div>

            {/* Crear Usuario */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetCreateForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear usuario
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Crear usuario (invitar por correo)</DialogTitle>
                  <DialogDescription>
                    Se creará la cuenta en Supabase Auth y se enviará un correo para que el usuario defina su contraseña.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={createForm.email}
                      onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="usuario@correo.com"
                      type="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <Select
                      value={createForm.role}
                      onValueChange={(v) => setCreateForm((p) => ({ ...p, role: v as Role }))}
                      disabled={!canEditRole}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">admin</SelectItem>
                        <SelectItem value="gestor">gestor</SelectItem>
                      </SelectContent>
                    </Select>
                    {!canEditRole && <div className="text-sm text-muted-foreground">Solo admin puede asignar rol.</div>}
                  </div>

                  <div className="space-y-2">
                    <Label>Permisos de apertura por ubicación</Label>
                    <div className="flex flex-wrap gap-2">
                      {LOCATIONS.map((loc) => (
                        <Badge
                          key={loc}
                          variant={createForm.locations.includes(loc) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleCreateLocation(loc)}
                        >
                          {loc}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>RFID</Label>
                    <div className="text-sm text-muted-foreground">Deshabilitado por ahora.</div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                      Cancelar
                    </Button>
                    <Button onClick={createUser} disabled={creating}>
                      {creating ? "Creando..." : "Crear e Invitar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando usuarios...</div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay usuarios (o no tienes permiso para listar).
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Permisos apertura</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.user_id}>
                      <TableCell className="font-medium">{p.email}</TableCell>
                      <TableCell>
                        <Badge variant={p.role === "admin" ? "default" : "secondary"}>{p.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Editar en modal</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Modal Editar */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar usuario</DialogTitle>
                  <DialogDescription>Rol (solo admin) + permisos de apertura por ubicación.</DialogDescription>
                </DialogHeader>

                {editing && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <div className="text-sm">{editing.email}</div>
                    </div>

                    <div className="space-y-2">
                      <Label>Rol</Label>
                      {canEditRole ? (
                        <Select value={roleDraft} onValueChange={(v) => setRoleDraft(v as Role)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">admin</SelectItem>
                            <SelectItem value="gestor">gestor</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-muted-foreground">Solo admin puede cambiar roles.</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Permisos de apertura por ubicación</Label>
                      <div className="flex flex-wrap gap-2">
                        {LOCATIONS.map((loc) => (
                          <Badge
                            key={loc}
                            variant={locationDraft.includes(loc) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleEditLocation(loc)}
                          >
                            {loc}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>RFID</Label>
                      <div className="text-sm text-muted-foreground">Deshabilitado por ahora.</div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                        Cancelar
                      </Button>
                      <Button onClick={saveEdit} disabled={saving}>
                        {saving ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}