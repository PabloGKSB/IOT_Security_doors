import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const supabase = await createClient()

  // Obtener usuario
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) redirect("/login")

  // Obtener rol
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", authData.user.id)
    .single()

  const role = profile?.role

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Button>
            </Link>
            <UserNav />
          </div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de usuarios, contactos y configuración del sistema
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Activos */}
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Activos ESP32</CardTitle>
              <CardDescription>
                Gestionar activos conectados y nombres personalizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/assets">
                <Button className="w-full">Administrar Activos</Button>
              </Link>
            </CardContent>
          </Card>

          {/* SOLO ADMIN */}
          {role === "admin" && (
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle>Usuarios Autorizados</CardTitle>
                <CardDescription>
                  Gestionar nivel de acceso de usuarios autorizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/users">
                  <Button className="w-full">Administrar Usuarios</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Contactos */}
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Contactos de Alertas</CardTitle>
              <CardDescription>
                Gestionar contactos para recibir alertas por correo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/contacts">
                <Button className="w-full">Administrar Contactos</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Reportes */}
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Reportes y Análisis</CardTitle>
              <CardDescription>
                Generar informes de uso y seguridad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/reports">
                <Button className="w-full">Ver Reportes</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Limpieza */}
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Limpieza de Eventos</CardTitle>
              <CardDescription>
                Eliminar eventos antiguos de la base de datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/cleanup">
                <Button className="w-full" variant="outline">
                  Gestionar Limpieza
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}