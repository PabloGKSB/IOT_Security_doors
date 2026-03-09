"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { UserNav } from "@/components/user-nav"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus, Pencil, Trash2, Circle } from "lucide-react"
import Link from "next/link"

type AssetType = "door" | "generator"

type AssetApi = {
  id?: string
  door_id: string
  custom_name: string
  location: string
  board_name: string | null
  description: string | null
  active: boolean
  asset_type?: AssetType
  fuel_capacity_liters?: number | null
  fuel_consumption_lph?: number | null
  fuel_alert_threshold_pct?: number | null
  created_at: string
  updated_at: string
}

type AssetUI = {
  id?: string
  door_id: string
  custom_name: string
  location: string
  board_name: string | null
  description: string | null
  active: boolean
  asset_type: AssetType
  fuel_capacity_liters: number | null
  fuel_consumption_lph: number | null
  fuel_alert_threshold_pct: number | null
  created_at: string
  updated_at: string
}

interface DoorStatus {
  door_id: string
  is_open: boolean
  last_updated: string
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetUI[]>([])
  const [doorStatuses, setDoorStatuses] = useState<Record<string, DoorStatus>>({})
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<AssetUI | null>(null)
  const [formData, setFormData] = useState({
    door_id: "",
    custom_name: "",
    location: "",
    board_name: "",
    description: "",
    asset_type: "door" as "door" | "generator",
    fuel_capacity_liters: "",
    fuel_consumption_lph: "",
    fuel_alert_threshold_pct: "20",
  })
  const { toast } = useToast()

  const fetchAssets = async () => {
    try {
      const response = await fetch("/api/assets")
      const data = (await response.json()) as AssetApi[]

      if (!Array.isArray(data)) {
        setAssets([])
        return
      }

      // Normalizamos sin forzar asset_id; trabajamos con door_id
      const normalized: AssetUI[] = data
        .filter((a) => !!a?.door_id)
        .map((a) => ({
          id: a.id,
          door_id: a.door_id,
          custom_name: a.custom_name,
          location: a.location,
          board_name: a.board_name ?? null,
          description: a.description ?? null,
          active: !!a.active,
          asset_type: (a.asset_type ?? "door") as "door" | "generator",
          fuel_capacity_liters: a.fuel_capacity_liters ?? null,
          fuel_consumption_lph: a.fuel_consumption_lph ?? null,
          fuel_alert_threshold_pct: a.fuel_alert_threshold_pct ?? null,
          created_at: a.created_at,
          updated_at: a.updated_at,
        }))

      setAssets(normalized)

      // Debug útil si algo viene raro
      const missingDoorId = data.filter((a: any) => !a?.door_id)
      if (missingDoorId.length > 0) {
        console.warn("[v0] Assets sin door_id:", missingDoorId)
      }
    } catch (error) {
      console.error("[v0] Error fetching assets:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los activos",
        variant: "destructive",
      })
    }
  }

  const fetchDoorStatuses = async () => {
    try {
      const response = await fetch("/api/door/status")
      const data = await response.json()
      const statusMap: Record<string, DoorStatus> = {}

        ; (Array.isArray(data) ? data : []).forEach((status: DoorStatus) => {
          statusMap[status.door_id] = status
        })

      setDoorStatuses(statusMap)
    } catch (error) {
      console.error("[v0] Error fetching door statuses:", error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchAssets(), fetchDoorStatuses()])
      setLoading(false)
    }
    loadData()

    const interval = setInterval(fetchDoorStatuses, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const isEditing = !!editingAsset

      // ✅ Editar por door_id (ID ESP32)
      if (isEditing && !editingAsset?.door_id) {
        throw new Error("No se encontró door_id para editar.")
      }

      const url = isEditing
        ? `/api/assets/by-door-id/${encodeURIComponent(editingAsset!.door_id)}`
        : "/api/assets"

      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const msg = payload?.error ?? "Error al guardar el activo"
        throw new Error(msg)
      }

      toast({
        title: "Éxito",
        description: isEditing ? "Activo actualizado correctamente" : "Activo creado correctamente",
      })

      setDialogOpen(false)
      resetForm()
      fetchAssets()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el activo",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (asset: AssetUI) => {
    setEditingAsset(asset)
    setFormData({
      door_id: asset.door_id,
      custom_name: asset.custom_name,
      location: asset.location,
      board_name: asset.board_name || "",
      description: asset.description || "",
      asset_type: asset.asset_type ?? "door",
      fuel_capacity_liters: asset.fuel_capacity_liters?.toString() ?? "",
      fuel_consumption_lph: asset.fuel_consumption_lph?.toString() ?? "",
      fuel_alert_threshold_pct: asset.fuel_alert_threshold_pct?.toString() ?? "20",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (doorId: string) => {
    if (!doorId) {
      toast({
        title: "Error",
        description: "door_id vacío (evitando DELETE).",
        variant: "destructive",
      })
      return
    }

    if (!confirm("¿Estás seguro de eliminar este activo?")) return

    try {
      // ✅ Borrar por door_id
      const response = await fetch(`/api/assets/by-door-id/${encodeURIComponent(doorId)}`, {
        method: "DELETE",
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const msg = payload?.error ?? "Error al eliminar el activo"
        throw new Error(msg)
      }

      toast({
        title: "Éxito",
        description: "Activo eliminado correctamente",
      })

      fetchAssets()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el activo",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      door_id: "",
      custom_name: "",
      location: "",
      board_name: "",
      description: "",
      asset_type: "door",
      fuel_capacity_liters: "",
      fuel_consumption_lph: "",
      fuel_alert_threshold_pct: "20",
    })
    setEditingAsset(null)
  }

  const getStatusIndicator = (asset: AssetUI) => {
    const status = doorStatuses[asset.door_id]
    const isGenerator = asset.asset_type === "generator"

    if (!status) return <Badge variant="secondary">{isGenerator ? "Sin señal" : "Sin datos"}</Badge>

    return (
      <div className="flex items-center gap-2">
        <Circle className={`h-3 w-3 ${status.is_open ? "fill-red-500 text-red-500" : "fill-green-500 text-green-500"}`} />
        <Badge variant={status.is_open ? "destructive" : "default"}>
          {isGenerator
            ? status.is_open ? "Encendido" : "Apagado"
            : status.is_open ? "Abierta" : "Cerrada"
          }
        </Badge>
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
            <UserNav />
          </div>
          <h1 className="text-3xl font-bold">Gestión de Activos</h1>
          <p className="text-muted-foreground mt-1">Administrar activos conectados al sistema</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activos Registrados</CardTitle>
                <CardDescription>Lista de todos los activos conectados al sistema</CardDescription>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Activo
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>{editingAsset ? "Editar Activo" : "Nuevo Activo"}</DialogTitle>
                      <DialogDescription>
                        {editingAsset ? "Modifica los datos del activo" : "Agrega un nuevo activo al sistema"}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="door_id">ID del Activo (ESP32) *</Label>
                        <Input
                          id="door_id"
                          value={formData.door_id}
                          onChange={(e) => setFormData({ ...formData, door_id: e.target.value })}
                          placeholder="ESP32-SANTIAGO-01"
                          required
                          disabled={!!editingAsset} // no se cambia el id operativo
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="custom_name">Nombre Personalizado *</Label>
                        <Input
                          id="custom_name"
                          value={formData.custom_name}
                          onChange={(e) => setFormData({ ...formData, custom_name: e.target.value })}
                          placeholder="Puerta Principal Santiago"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="location">Ubicación *</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="Santiago Casa Matriz"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="board_name">Nombre del Tablero</Label>
                        <Input
                          id="board_name"
                          value={formData.board_name}
                          onChange={(e) => setFormData({ ...formData, board_name: e.target.value })}
                          placeholder="ESP32-MAIN-01"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Descripción del activo..."
                          rows={3}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="asset_type">Tipo de Activo *</Label>
                        <select
                          id="asset_type"
                          value={formData.asset_type}
                          onChange={(e) => setFormData({ ...formData, asset_type: e.target.value as "door" | "generator" })}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                        >
                          <option value="door">Tablero (Puerta)</option>
                          <option value="generator">Generador</option>
                        </select>
                      </div>

                      {formData.asset_type === "generator" && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                              <Label htmlFor="fuel_capacity_liters">Capacidad Estanque (L)</Label>
                              <Input
                                id="fuel_capacity_liters"
                                type="number"
                                min="0"
                                step="0.1"
                                value={formData.fuel_capacity_liters}
                                onChange={(e) => setFormData({ ...formData, fuel_capacity_liters: e.target.value })}
                                placeholder="200"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="fuel_consumption_lph">Consumo (L/hora)</Label>
                              <Input
                                id="fuel_consumption_lph"
                                type="number"
                                min="0"
                                step="0.1"
                                value={formData.fuel_consumption_lph}
                                onChange={(e) => setFormData({ ...formData, fuel_consumption_lph: e.target.value })}
                                placeholder="12.5"
                              />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="fuel_alert_threshold_pct">Alerta de combustible bajo (%)</Label>
                            <Input
                              id="fuel_alert_threshold_pct"
                              type="number"
                              min="0"
                              max="100"
                              value={formData.fuel_alert_threshold_pct}
                              onChange={(e) => setFormData({ ...formData, fuel_alert_threshold_pct: e.target.value })}
                              placeholder="20"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">{editingAsset ? "Guardar Cambios" : "Crear Activo"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>ID Activo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Tablero</TableHead>
                  <TableHead>Actualizado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.door_id}>
                    <TableCell>{getStatusIndicator(asset)}</TableCell>
                    <TableCell className="font-medium">{asset.custom_name}</TableCell>
                    <TableCell className="font-mono text-sm">{asset.door_id}</TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell>{asset.board_name || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(asset.updated_at).toLocaleString("es-CL")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(asset)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(asset.door_id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {assets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay activos registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}