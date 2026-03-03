"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Event {
  id: string
  board_name: string
  location: string
  event_type: string
  authorized: boolean
  timestamp: string
  duration_seconds: number | null
}

const LOCATIONS = ["SANTIAGO CASA MATRIZ", "ANTOFAGASTA", "COQUIMBO", "CONCEPCION", "PUERTO MONTT"]

export function EventsTable() {
  const [events, setEvents] = useState<Event[]>([])
  const [location, setLocation] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  const fetchEvents = async () => {
    try {
      const url = location === "all" ? "/api/door/events" : `/api/door/events?location=${encodeURIComponent(location)}`
      const response = await fetch(url)
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error("[v0] Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [location])

  const getEventBadge = (eventType: string, authorized: boolean) => {
    if (eventType === "forced") return <Badge variant="destructive">Forzada</Badge>
    if (eventType === "unauthorized") return <Badge variant="destructive">No Autorizado</Badge>
    if (eventType === "authorized") return <Badge variant="default">Autorizado</Badge>
    if (eventType === "open") return <Badge variant="secondary">Abierta</Badge>
    if (eventType === "close") return <Badge variant="outline">Cerrada</Badge>
    return <Badge>{eventType}</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtrar por ubicación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las ubicaciones</SelectItem>
            {LOCATIONS.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Tablero</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Duración</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Cargando eventos...
                </TableCell>
              </TableRow>
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay eventos registrados
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{new Date(event.timestamp).toLocaleString("es-CL")}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{event.board_name}</TableCell>
                  <TableCell>{getEventBadge(event.event_type, event.authorized)}</TableCell>
                  <TableCell>
                    {event.duration_seconds
                      ? `${Math.floor(event.duration_seconds / 60)}m ${event.duration_seconds % 60}s`
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
