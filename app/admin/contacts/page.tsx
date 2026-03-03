"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Pencil, Trash2, Send, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Contact {
  id: string
  name: string
  email: string
  active: boolean
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState({ name: "", email: "", active: true })

  const [testMessage, setTestMessage] = useState("🔔 Mensaje de prueba del Sistema IoT de Seguridad")
  const [testSubject, setTestSubject] = useState("🔔 Prueba - Sistema IoT de Seguridad")
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/alert-contacts")
      const data = await response.json()
      setContacts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[v0] Error fetching contacts:", error)
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const resetForm = () => {
    setEditingContact(null)
    setFormData({ name: "", email: "", active: true })
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({ name: contact.name, email: contact.email, active: contact.active })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingContact ? `/api/alert-contacts/${editingContact.id}` : "/api/alert-contacts"
      const method = editingContact ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchContacts()
        setDialogOpen(false)
        resetForm()
      } else {
        const err = await response.json().catch(() => ({}))
        console.error("[v0] Error saving contact:", err)
      }
    } catch (error) {
      console.error("[v0] Error saving contact:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este contacto?")) return

    try {
      await fetch(`/api/alert-contacts/${id}`, { method: "DELETE" })
      await fetchContacts()
    } catch (error) {
      console.error("[v0] Error deleting contact:", error)
    }
  }

  const handleSendTest = async () => {
    setSendingTest(true)
    setTestResult(null)

    try {
      // Si dejaste el endpoint como /api/alerts/send pero ahora envía email con Resend, déjalo así.
      // Si creaste /api/alerts/send-email, cambia la ruta aquí.
      const response = await fetch("/api/alerts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: testSubject,
          message: testMessage,
          event_type: "test",
          location: "Prueba",
          board_name: "Sistema",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const sent = data.results?.filter((r: any) => r.status === "sent").length || 0
        const failed = data.results?.filter((r: any) => r.status === "failed").length || 0

        let resultMessage = `✅ Correos enviados: ${sent} | Fallidos: ${failed}`
        setTestResult(resultMessage)
      } else {
        setTestResult(`❌ Error: ${data.error || "No se pudo enviar"}`)
      }
    } catch (error) {
      console.error("[v0] Error sending test email:", error)
      setTestResult("❌ Error al enviar correo de prueba")
    } finally {
      setSendingTest(false)
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
          <h1 className="text-3xl font-bold">Contactos de Alertas (Email)</h1>
          <p className="text-muted-foreground mt-1">Gestión de correos para recibir alertas del sistema</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Tester de Correos
            </CardTitle>
            <CardDescription>Envía un correo de prueba a todos los contactos activos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="test-subject">Asunto</Label>
                <Input
                  id="test-subject"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="test-message">Mensaje</Label>
                <Input
                  id="test-message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Escribe un mensaje de prueba..."
                  className="mt-2"
                />
              </div>

              <div className="flex items-center gap-4">
                <Button onClick={handleSendTest} disabled={sendingTest || contacts.filter((c) => c.active).length === 0}>
                  <Send className="mr-2 h-4 w-4" />
                  {sendingTest ? "Enviando..." : "Enviar Correo de Prueba"}
                </Button>
                {contacts.filter((c) => c.active).length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay contactos activos para enviar correos</p>
                )}
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-md whitespace-pre-line ${
                    testResult.includes("✅")
                      ? "bg-green-500/10 text-green-500 border border-green-500/30"
                      : "bg-red-500/10 text-red-500 border border-red-500/30"
                  }`}
                >
                  {testResult}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lista de Contactos</CardTitle>
              <CardDescription>Correos que recibirán alertas de seguridad</CardDescription>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Contacto
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingContact ? "Editar Contacto" : "Nuevo Contacto"}</DialogTitle>
                  <DialogDescription>Complete los datos del contacto para alertas por correo</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Correo</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="nombre@dominio.com"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">Debe ser un correo válido</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="active">Contacto activo</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">{editingContact ? "Actualizar" : "Crear"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando contactos...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No hay contactos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell className="font-mono">{contact.email}</TableCell>
                        <TableCell>
                          <Badge variant={contact.active ? "default" : "secondary"}>
                            {contact.active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(contact.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}