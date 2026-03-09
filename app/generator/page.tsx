"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { UserNav } from "@/components/user-nav"
import { useToast } from "@/hooks/use-toast"
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
import { Zap, ZapOff, Fuel, Clock, AlertTriangle, RefreshCw, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"

interface GeneratorAsset {
    id: string
    door_id: string
    custom_name: string
    location: string
    board_name: string | null
    fuel_capacity_liters: number | null
    fuel_consumption_lph: number | null
    fuel_alert_threshold_pct: number | null
}

interface GeneratorStatus {
    ok: boolean
    board_id: string
    is_on: boolean
    session_minutes: number
    total_minutes_since_refill: number
    fuel_capacity_liters: number
    fuel_consumed_liters: number
    fuel_remaining_liters: number
    fuel_remaining_pct: number
    fuel_alert: boolean
    fuel_alert_threshold_pct: number
    last_refill_at: string | null
    last_event_at: string | null
    last_event_type: string | null
}

function formatMinutes(min: number): string {
    const h = Math.floor(min / 60)
    const m = min % 60
    if (h === 0) return `${m}m`
    return `${h}h ${m}m`
}

function GeneratorCard({ asset }: { asset: GeneratorAsset }) {
    const [status, setStatus] = useState<GeneratorStatus | null>(null)
    const [refilling, setRefilling] = useState(false)
    const { toast } = useToast()

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/generator/status?board_id=${encodeURIComponent(asset.door_id)}`, {
                cache: "no-store",
            })
            const data = await res.json()
            if (data.ok) setStatus(data)
        } catch (e) {
            console.error("[generator] Error fetching status:", e)
        }
    }, [asset.door_id])

    useEffect(() => {
        fetchStatus()
        const interval = setInterval(fetchStatus, 5000)
        return () => clearInterval(interval)
    }, [fetchStatus])

    const handleRefill = async () => {
        setRefilling(true)
        try {
            const res = await fetch("/api/generator/refill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ board_id: asset.door_id, note: "Recarga manual desde dashboard" }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? "Error al registrar recarga")

            toast({ title: "✅ Combustible recargado", description: "El contador ha sido reiniciado." })
            await fetchStatus()
        } catch (e) {
            toast({
                title: "Error",
                description: e instanceof Error ? e.message : "No se pudo registrar la recarga.",
                variant: "destructive",
            })
        } finally {
            setRefilling(false)
        }
    }

    const isOn = status?.is_on ?? false
    const fuelPct = status?.fuel_remaining_pct ?? 100
    const fuelAlert = status?.fuel_alert ?? false

    return (
        <Card className={`${isOn ? "border-green-500" : "border-zinc-600"} ${fuelAlert ? "ring-2 ring-amber-500" : ""}`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-base font-semibold">{asset.custom_name}</CardTitle>
                    <CardDescription className="text-xs mt-1">{asset.location}</CardDescription>
                </div>
                <Badge
                    className={isOn ? "bg-green-500 text-white" : "bg-zinc-500 text-white"}
                >
                    {isOn
                        ? <><Zap className="h-3 w-3 mr-1" />Encendido</>
                        : <><ZapOff className="h-3 w-3 mr-1" />Apagado</>
                    }
                </Badge>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Barra de combustible */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                            <Fuel className="h-4 w-4" />
                            Combustible
                        </span>
                        <span className={`font-medium ${fuelAlert ? "text-amber-500" : ""}`}>
                            {status ? `${status.fuel_remaining_liters}L / ${status.fuel_capacity_liters}L (${fuelPct}%)` : "—"}
                        </span>
                    </div>
                    <Progress
                        value={fuelPct}
                        className="h-2"
                    />
                    {fuelAlert && (
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            Nivel bajo — requiere recarga
                        </div>
                    )}
                </div>

                {/* Tiempos */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Sesión actual
                        </p>
                        <p className="font-medium">
                            {status ? (isOn ? formatMinutes(status.session_minutes) : "—") : "—"}
                        </p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Total desde recarga
                        </p>
                        <p className="font-medium">
                            {status ? formatMinutes(status.total_minutes_since_refill) : "—"}
                        </p>
                    </div>
                </div>

                {/* Info consumo */}
                {asset.fuel_consumption_lph && (
                    <p className="text-xs text-muted-foreground">
                        Consumo: {asset.fuel_consumption_lph} L/h ·
                        Consumido: {status?.fuel_consumed_liters ?? 0}L
                    </p>
                )}

                {/* Última recarga */}
                {status?.last_refill_at && (
                    <p className="text-xs text-muted-foreground">
                        Última recarga: {new Date(status.last_refill_at).toLocaleString("es-CL")}
                    </p>
                )}

                {/* Botón recarga */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled={refilling}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {refilling ? "Registrando..." : "Combustible Rellenado"}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Confirmar recarga de combustible?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esto registrará una recarga en el historial y reiniciará el contador de combustible
                                para <strong>{asset.custom_name}</strong>. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRefill} disabled={refilling}>
                                Confirmar Recarga
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    )
}

export default function GeneratorPage() {
    const [generators, setGenerators] = useState<GeneratorAsset[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchGenerators = async () => {
            try {
                const res = await fetch("/api/assets?type=generator", { cache: "no-store" })
                const data = await res.json()
                const list = Array.isArray(data)
                    ? data.filter((a: GeneratorAsset & { asset_type?: string }) => a.asset_type === "generator")
                    : []
                setGenerators(list)
            } catch (e) {
                console.error("[generator page] Error:", e)
            } finally {
                setLoading(false)
            }
        }
        fetchGenerators()
    }, [])

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Monitoreo de Generadores</h1>
                        <p className="text-muted-foreground mt-1">
                            Estado en tiempo real — Sucursales Chile
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Tableros
                            </Button>
                        </Link>
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

            <main className="container mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">Cargando generadores...</div>
                ) : generators.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Fuel className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No hay generadores registrados.</p>
                        <p className="text-sm mt-1">
                            Ve a{" "}
                            <Link href="/admin/assets" className="underline">
                                Administración → Activos
                            </Link>{" "}
                            y agrega uno con tipo "Generador".
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {generators.map((gen) => (
                            <GeneratorCard key={gen.door_id} asset={gen} />
                        ))}
                    </div>
                )}
            </main>

            <footer className="border-t mt-16">
                <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                    Sistema IoT de Seguridad © {new Date().getFullYear()} - Generadores
                </div>
            </footer>
        </div>
    )
}
