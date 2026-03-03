"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Send, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const LOCATIONS = ["Santiago Casa Matriz", "Antofagasta", "Coquimbo", "Concepción", "Puerto Montt"]

const EVENT_TYPES = [
  { value: "open", label: "Apertura Normal" },
  { value: "close", label: "Cierre Normal" },
  { value: "authorized", label: "Acceso Autorizado" },
  { value: "unauthorized", label: "Acceso No Autorizado" },
  { value: "forced", label: "Apertura Forzada" },
]

export function ManualEventForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testingSMS, setTestingSMS] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    location: "",
    event_type: "",
    board_name: "Manual-Admin",
    details: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.location || !formData.event_type) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/door/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          authorized: formData.event_type === "authorized",
          details: { note: formData.details, manual: true },
        }),
      })

      if (!response.ok) throw new Error("Error al crear evento")

      toast({
        title: "Evento creado",
        description: "El evento manual se ha registrado correctamente",
      })

      setFormData({
        location: "",
        event_type: "",
        board_name: "Manual-Admin",
        details: "",
      })
      setOpen(false)
    } catch (error) {
      console.error("[v0] Error creating manual event:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el evento manual",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestSMS = async () => {
    setTestingSMS(true)

    try {
      const response = await fetch("/api/alerts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "🧪 Mensaje de prueba - Sistema IoT de Seguridad",
          event_type: "test",
          location: "Test",
          board_name: "Admin-Test",
        }),
      })

      const data = await response.json()

      if (data.unverified_count > 0) {
        toast({
          title: "SMS enviados parcialmente",
          description: `${data.sent_to} de ${data.total_contacts} mensajes enviados. ${data.unverified_count} números no verificados (cuenta Twilio Trial). Verifica los números en twilio.com o actualiza a cuenta de producción.`,
          variant: "default",
          duration: 8000,
        })
      } else if (data.sent_to > 0) {
        toast({
          title: "SMS enviados exitosamente",
          description: `${data.sent_to} mensajes enviados correctamente`,
        })
      } else {
        toast({
          title: "No se enviaron SMS",
          description: "No hay contactos activos o todos los números requieren verificación",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error testing SMS:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje de prueba",
        variant: "destructive",
      })
    } finally {
      setTestingSMS(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Crear Evento Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Evento Manual</DialogTitle>
          <DialogDescription>Registra un evento manual en el sistema y envía alertas SMS</DialogDescription>
        </DialogHeader>

        <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Cuenta Twilio Trial Activa</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            Los SMS solo se enviarán a números verificados.{" "}
            <a
              href="https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Verificar números aquí
            </a>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Ubicación *</Label>
            <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
              <SelectTrigger id="location">
                <SelectValue placeholder="Selecciona una ubicación" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_type">Tipo de Evento *</Label>
            <Select
              value={formData.event_type}
              onValueChange={(value) => setFormData({ ...formData, event_type: value })}
            >
              <SelectTrigger id="event_type">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Detalles (opcional)</Label>
            <Textarea
              id="details"
              placeholder="Agrega notas o detalles adicionales..."
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creando..." : "Crear Evento"}
            </Button>

            <Button type="button" variant="outline" onClick={handleTestSMS} disabled={testingSMS}>
              <Send className="mr-2 h-4 w-4" />
              {testingSMS ? "Enviando..." : "Probar SMS"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
