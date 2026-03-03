import { DashboardMonitor } from "@/components/dashboard-monitor"
import { EventsTable } from "@/components/events-table"
import { StatsCards } from "@/components/stats-cards"
import { ManualEventForm } from "@/components/manual-event-form"
import { UserNav } from "@/components/user-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{"Control de activos criticos\n"}</h1>
            <p className="text-muted-foreground mt-1">Monitoreo en tiempo real - Sucursales Chile</p>
          </div>
          <div className="flex items-center gap-2">
            <ManualEventForm />
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Administración
              </Button>
            </Link>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Estadísticas Generales</h2>
          <StatsCards />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Estado Actual de Puertas</h2>
          <DashboardMonitor />
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Historial de Eventos</CardTitle>
              <CardDescription>Últimos 100 eventos registrados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <EventsTable />
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Sistema IoT de Seguridad © {new Date().getFullYear()} - Desarrollado con Next.js y Supabase
        </div>
      </footer>
    </div>
  )
}
