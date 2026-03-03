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

interface Asset {
  id: string
  door_id: string
  custom_name: string
  location: string
  board_name: string | null
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
}

interface DoorStatus {
  door_id: string
  is_open: boolean
  last_updated: string
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [doorStatuses, setDoorStatuses] = useState<Record<string, DoorStatus>>({})
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [formData, setFormData] = useState({
    door_id: "",
    custom_name: "",
    location: "",
    board_name: "",
    description: "",
  })
  const { toast } = useToast()

  const fetchAssets = async () => {
    try {
      const response = await fetch("/api/assets")
      const data = await response.json()
      setAssets(data)
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
      data.forEach((status: DoorStatus) => {
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

    // Actualizar estados cada 5 segundos
    const interval = setInterval(fetchDoorStatuses, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : "/api/assets"
      const method = editingAsset ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Error al guardar el activo")
      }

      toast({
        title: "Éxito",
        description: editingAsset ? "Activo actualizado correctamente" : "Activo creado correctamente",
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

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset)
    setFormData({
      door_id: asset.door_id,
      custom_name: asset.custom_name,
      location: asset.location,
      board_name: asset.board_name || "",
      description: asset.description || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este activo?")) return

    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el activo")
      }

      toast({
        title: "Éxito",
        description: "Activo eliminado correctamente",
      })

      fetchAssets()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el activo",
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
    })
    setEditingAsset(null)
  }

  const getStatusIndicator = (doorId: string) => {
    const status = doorStatuses[doorId]
    if (!status) {
      return <Badge variant="secondary">Sin datos</Badge>
    }
    return (
      <div className="flex items-center gap-2">
        <Circle
          className={`h-3 w-3 ${status.is_open ? "fill-red-500 text-red-500" : "fill-green-500 text-green-500"}`}
        />
        <Badge variant={status.is_open ? "destructive" : "default"}>{status.is_open ? "Abierta" : "Cerrada"}</Badge>
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
          <p className="text-muted-foreground mt-1">Administrar activos conectados al ESP32</p>
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
                        <Label htmlFor="door_id">ID del Activo *</Label>
                        <Input
                          id="door_id"
                          value={formData.door_id}
                          onChange={(e) => setFormData({ ...formData, door_id: e.target.value })}
                          placeholder="ESP32-SANTIAGO-01"
                          required
                          disabled={!!editingAsset}
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
                  <TableRow key={asset.id}>
                    <TableCell>{getStatusIndicator(asset.door_id)}</TableCell>
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
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(asset.id)}>
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
