"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Clock, MapPin, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DoorStatus {
  id: string
  door_id: string
  board_name: string
  location: string
  is_open: boolean
  last_updated: string
  event_start_time: string | null
  custom_name?: string
  asset_location?: string
  asset_description?: string
}

export function DashboardMonitor() {
  const [doors, setDoors] = useState<DoorStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const { toast } = useToast()

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/door/status")
      const data = await response.json()
      setDoors(data)
    } catch (error) {
      console.error("[v0] Error fetching door status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearStatus = async () => {
    setClearing(true)
    try {
      const response = await fetch("/api/door/status/clear", {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al limpiar estado")
      }

      toast({
        title: "Estado limpiado",
        description: `Se eliminaron ${result.deletedCount} registros de estado de puertas`,
      })

      await fetchStatus()
    } catch (error) {
      console.error("[v0] Error clearing status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo limpiar el estado",
        variant: "destructive",
      })
    } finally {
      setClearing(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const getDuration = (startTime: string | null) => {
    if (!startTime) return null
    const start = new Date(startTime)
    const now = new Date()
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000)
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    return `${minutes}m ${seconds}s`
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={clearing || doors.length === 0}>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpiar Estado de Puertas
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará el estado actual de todas las puertas ({doors.length} registros). El estado se
                volverá a generar automáticamente cuando lleguen nuevos eventos. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearStatus} disabled={clearing}>
                {clearing ? "Limpiando..." : "Confirmar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {doors.map((door) => {
          const displayName = door.custom_name || door.board_name

          return (
            <Card
              key={door.id}
              className={door.is_open ? "border-red-500 bg-red-950/20" : "border-green-500 bg-green-950/20"}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{displayName}</CardTitle>
                <Badge
                  variant={door.is_open ? "destructive" : "default"}
                  className={door.is_open ? "bg-red-500" : "bg-green-500"}
                >
                  {door.is_open ? "Abierta" : "Cerrada"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {door.location}
                  </div>
                  {door.asset_description && (
                    <div className="text-xs text-muted-foreground italic">{door.asset_description}</div>
                  )}
                  {door.is_open && door.event_start_time && (
                    <div className="flex items-center gap-2 text-sm text-red-400 font-medium">
                      <Clock className="h-4 w-4" />
                      Duración: {getDuration(door.event_start_time)}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Actualizado: {new Date(door.last_updated).toLocaleString("es-CL")}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {doors.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No hay activos registrados. Ve a la sección de Administración para agregar activos.
          </div>
        )}
      </div>
    </div>
  )
}
