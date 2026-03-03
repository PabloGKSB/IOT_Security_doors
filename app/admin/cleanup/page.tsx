"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserNav } from "@/components/user-nav"
import { ArrowLeft, Trash2, AlertTriangle, Calendar } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function CleanupPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [cleanupType, setCleanupType] = useState<"old" | "all" | null>(null)
  const [daysOld, setDaysOld] = useState("30")

  const handleCleanup = async (type: "old" | "all") => {
    setCleanupType(type)
    setShowDialog(true)
  }

  const confirmCleanup = async () => {
    setLoading(true)
    setShowDialog(false)

    try {
      const params = new URLSearchParams()
      if (cleanupType === "old") {
        params.append("days", daysOld)
      }
      params.append("type", cleanupType!)

      const response = await fetch(`/api/admin/cleanup?${params.toString()}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al limpiar eventos")
      }

      toast({
        title: "Limpieza completada",
        description: data.message || `Se eliminaron ${data.deleted} eventos exitosamente.`,
      })
    } catch (error) {
      console.error("[v0] Error en limpieza:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al limpiar eventos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Administración
              </Button>
            </Link>
            <UserNav />
          </div>
          <h1 className="text-3xl font-bold">Limpieza de Eventos</h1>
          <p className="text-muted-foreground mt-1">Eliminar eventos antiguos para optimizar el rendimiento</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
          <Card className="border-orange-500/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <CardTitle>Limpiar Eventos Antiguos</CardTitle>
              </div>
              <CardDescription>Eliminar eventos con más de X días de antigüedad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="days">Días de antigüedad</Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  value={daysOld}
                  onChange={(e) => setDaysOld(e.target.value)}
                  placeholder="30"
                />
                <p className="text-sm text-muted-foreground">Se eliminarán eventos más antiguos que {daysOld} días</p>
              </div>
              <Button onClick={() => handleCleanup("old")} disabled={loading} className="w-full" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Limpiar Eventos Antiguos
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                <CardTitle>Limpiar Todos los Eventos</CardTitle>
              </div>
              <CardDescription>Eliminar TODOS los eventos de la base de datos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-destructive">¡Advertencia!</p>
                  <p className="text-muted-foreground mt-1">
                    Esta acción es irreversible. Se eliminarán todos los registros de eventos, historial completo y
                    estadísticas.
                  </p>
                </div>
              </div>
              <Button onClick={() => handleCleanup("all")} disabled={loading} variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Limpiar Todos los Eventos
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 max-w-4xl">
          <CardHeader>
            <CardTitle>Información sobre Limpieza</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>¿Qué se elimina?</strong> Solo se eliminan los registros de la tabla <code>door_events</code>. Los
              usuarios autorizados, contactos de alertas y configuraciones se mantienen intactos.
            </p>
            <p>
              <strong>Estado de puertas:</strong> El estado actual de las puertas (<code>door_status</code>) NO se
              elimina para mantener la continuidad del monitoreo en tiempo real.
            </p>
            <p>
              <strong>Recomendaciones:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Exporta reportes antes de limpiar si necesitas conservar datos históricos</li>
              <li>Limpia eventos antiguos periódicamente para mantener el rendimiento</li>
              <li>La limpieza completa solo debe usarse en casos excepcionales o para resetear el sistema</li>
            </ul>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Limpieza</DialogTitle>
            <DialogDescription>
              {cleanupType === "old"
                ? `¿Estás seguro de que deseas eliminar todos los eventos con más de ${daysOld} días de antigüedad?`
                : "¿Estás seguro de que deseas eliminar TODOS los eventos? Esta acción no se puede deshacer."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant={cleanupType === "all" ? "destructive" : "default"}
              onClick={confirmCleanup}
              disabled={loading}
            >
              Confirmar Limpieza
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
