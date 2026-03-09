"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { ArrowLeft, Settings, RefreshCw } from "lucide-react"
import Link from "next/link"

interface GeneratorAsset {
    door_id: string
    custom_name: string
    location: string
    board_name: string | null
    fuel_capacity_liters: number | null
    fuel_consumption_lph: number | null
    fuel_alert_threshold_pct: number | null
    asset_type: string
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
}

function formatMinutes(min: number): string {
    const h = Math.floor(min / 60)
    const m = min % 60
    if (h === 0) return `${m}m`
    return `${h}h ${m}m`
}

// Gauge SVG semicircular
function FuelGauge({ pct, alert }: { pct: number; alert: boolean }) {
    const clamp = Math.min(100, Math.max(0, pct))
    // Ángulo: 0% = -135deg, 100% = +135deg → rango 270deg
    const angle = -135 + (clamp / 100) * 270
    const rad = (angle * Math.PI) / 180
    const cx = 100
    const cy = 100
    const r = 72

    // Punta de la aguja
    const nx = cx + r * Math.cos(rad)
    const ny = cy + r * Math.sin(rad)

    // Color de la barra y aguja
    const color = alert ? "#ef4444" : clamp > 50 ? "#22c55e" : "#f59e0b"

    // Arco de fondo (gris, 270°) y arco de relleno
    const describeArc = (startDeg: number, endDeg: number) => {
        const toRad = (d: number) => (d * Math.PI) / 180
        const x1 = cx + r * Math.cos(toRad(startDeg))
        const y1 = cy + r * Math.sin(toRad(startDeg))
        const x2 = cx + r * Math.cos(toRad(endDeg))
        const y2 = cy + r * Math.sin(toRad(endDeg))
        const large = endDeg - startDeg > 180 ? 1 : 0
        return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
    }

    const fillEnd = -135 + (clamp / 100) * 270

    return (
        <svg viewBox="0 0 200 130" className="w-full max-w-[280px] mx-auto drop-shadow-lg">
            {/* Arco fondo */}
            <path
                d={describeArc(-135, 135)}
                fill="none"
                stroke="#334155"
                strokeWidth="14"
                strokeLinecap="round"
            />
            {/* Arco relleno */}
            {clamp > 0 && (
                <path
                    d={describeArc(-135, fillEnd)}
                    fill="none"
                    stroke={color}
                    strokeWidth="14"
                    strokeLinecap="round"
                    style={{ transition: "all 0.8s ease" }}
                />
            )}
            {/* Aguja */}
            <line
                x1={cx}
                y1={cy}
                x2={nx}
                y2={ny}
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                style={{ transition: "all 0.8s ease" }}
            />
            <circle cx={cx} cy={cy} r="6" fill={color} />
            {/* Etiquetas */}
            <text x="28" y="120" fill="#94a3b8" fontSize="11" textAnchor="middle">E</text>
            <text x="172" y="120" fill="#94a3b8" fontSize="11" textAnchor="middle">F</text>
            {/* Porcentaje central */}
            <text x={cx} y={cy + 30} fill="white" fontSize="22" fontWeight="bold" textAnchor="middle">
                {clamp}%
            </text>
        </svg>
    )
}

function GeneratorCard({ asset }: { asset: GeneratorAsset }) {
    const [status, setStatus] = useState<GeneratorStatus | null>(null)
    const [refilling, setRefilling] = useState(false)
    const [pulse, setPulse] = useState(false)
    const { toast } = useToast()

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/generator/status?board_id=${encodeURIComponent(asset.door_id)}`, {
                cache: "no-store",
            })
            const data = await res.json()
            if (data.ok) {
                setStatus((prev) => {
                    if (prev?.is_on !== data.is_on) setPulse(true)
                    return data
                })
            }
        } catch (e) {
            console.error("[generator]", e)
        }
    }, [asset.door_id])

    useEffect(() => {
        fetchStatus()
        const interval = setInterval(fetchStatus, 5000)
        return () => clearInterval(interval)
    }, [fetchStatus])

    useEffect(() => {
        if (pulse) {
            const t = setTimeout(() => setPulse(false), 1000)
            return () => clearTimeout(t)
        }
    }, [pulse])

    const handleRefill = async () => {
        setRefilling(true)
        try {
            const res = await fetch("/api/generator/refill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ board_id: asset.door_id }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast({ title: "✅ Combustible recargado", description: "Contador reiniciado." })
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
    const hasConfig = (asset.fuel_capacity_liters ?? 0) > 0

    return (
        <div
            className={`
        relative rounded-2xl border-2 overflow-hidden flex flex-col
        transition-all duration-700
        ${isOn
                    ? "border-green-500 bg-gradient-to-b from-slate-900 to-slate-800 shadow-[0_0_32px_rgba(34,197,94,0.25)]"
                    : "border-slate-600 bg-gradient-to-b from-slate-900 to-slate-800"
                }
        ${pulse ? "scale-[1.01]" : ""}
      `}
        >
            {/* Banda superior de estado */}
            <div className={`w-full h-1.5 transition-colors duration-700 ${isOn ? "bg-green-500" : "bg-slate-600"}`} />

            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-start justify-between">
                <div>
                    <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">{asset.location}</p>
                    <h2 className="text-2xl font-bold text-white leading-tight">{asset.custom_name}</h2>
                </div>
                <div className={`
          flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide
          transition-all duration-500
          ${isOn
                        ? "bg-green-500/20 border border-green-500 text-green-400"
                        : "bg-slate-700 border border-slate-500 text-slate-400"
                    }
        `}>
                    <span className={`h-2 w-2 rounded-full ${isOn ? "bg-green-400 animate-pulse" : "bg-slate-500"}`} />
                    {isOn ? "Encendido" : "Apagado"}
                </div>
            </div>

            {/* Gauge de combustible */}
            {hasConfig ? (
                <div className="px-6 pb-2">
                    <p className="text-xs text-slate-400 text-center mb-1 uppercase tracking-widest">Nivel de Combustible</p>
                    <FuelGauge pct={fuelPct} alert={fuelAlert} />
                    {fuelAlert && (
                        <div className="mt-2 text-center">
                            <Badge className="bg-red-500/20 border border-red-500 text-red-400 animate-pulse text-xs px-3 py-1">
                                ⚠ COMBUSTIBLE BAJO — REQUIERE RECARGA
                            </Badge>
                        </div>
                    )}
                    <div className="flex justify-between text-xs text-slate-400 mt-3 px-2">
                        <span>Restante: <span className="text-white font-medium">{status?.fuel_remaining_liters ?? "—"}L</span></span>
                        <span>Capacidad: <span className="text-white font-medium">{asset.fuel_capacity_liters}L</span></span>
                    </div>
                </div>
            ) : (
                <div className="px-6 py-4 text-center text-xs text-slate-500">Sin config. de combustible</div>
            )}

            {/* Tiempos */}
            <div className="grid grid-cols-2 gap-3 px-6 pb-4">
                <div className={`rounded-xl p-3 border ${isOn ? "bg-green-500/10 border-green-500/30" : "bg-slate-800 border-slate-700"}`}>
                    <p className="text-xs text-slate-400 mb-1">Sesión Actual</p>
                    <p className={`text-2xl font-bold tabular-nums ${isOn ? "text-green-400" : "text-slate-500"}`}>
                        {isOn && status ? formatMinutes(status.session_minutes) : "—"}
                    </p>
                </div>
                <div className="rounded-xl p-3 bg-slate-800 border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Desde Recarga</p>
                    <p className="text-2xl font-bold text-white tabular-nums">
                        {status ? formatMinutes(status.total_minutes_since_refill) : "—"}
                    </p>
                </div>
            </div>

            {/* Info consumo */}
            {hasConfig && asset.fuel_consumption_lph && (
                <div className="px-6 pb-3 flex justify-between text-xs text-slate-500">
                    <span>Consumo: {asset.fuel_consumption_lph} L/h</span>
                    <span>Gastado: {status?.fuel_consumed_liters ?? 0}L</span>
                </div>
            )}

            {/* Footer: última recarga + botón */}
            <div className="px-6 pb-5 pt-2 border-t border-slate-700 mt-auto flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500 truncate">
                    {status?.last_refill_at
                        ? `Recarga: ${new Date(status.last_refill_at).toLocaleString("es-CL")}`
                        : "Sin recarga registrada"}
                </p>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={refilling}
                            className="shrink-0 border-slate-600 text-slate-300 hover:border-green-500 hover:text-green-400 text-xs"
                        >
                            <RefreshCw className="h-3 w-3 mr-1.5" />
                            {refilling ? "Registrando..." : "Rellenar"}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Confirmar recarga?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esto registrará una recarga y reiniciará el contador de combustible para{" "}
                                <strong>{asset.custom_name}</strong>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRefill} disabled={refilling}>
                                Confirmar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}

export default function GeneratorPage() {
    const [generators, setGenerators] = useState<GeneratorAsset[]>([])
    const [loading, setLoading] = useState(true)
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const fetchGenerators = async () => {
            try {
                const res = await fetch("/api/assets", { cache: "no-store" })
                const data = await res.json()
                const list = Array.isArray(data)
                    ? data.filter((a: GeneratorAsset & { asset_type?: string }) => a.asset_type === "generator")
                    : []
                setGenerators(list)
            } catch (e) {
                console.error("[generator page]", e)
            } finally {
                setLoading(false)
            }
        }
        fetchGenerators()

        // Reloj en vivo
        const clock = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(clock)
    }, [])

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">⚡ Monitoreo de Generadores</h1>
                            <p className="text-xs text-slate-400">Sucursales Chile — tiempo real</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Reloj */}
                        <span className="text-slate-300 font-mono text-sm tabular-nums px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                            {now.toLocaleTimeString("es-CL")}
                        </span>
                        <Link href="/">
                            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Tableros
                            </Button>
                        </Link>
                        <Link href="/admin">
                            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                                <Settings className="mr-2 h-4 w-4" />
                                Admin
                            </Button>
                        </Link>
                        <UserNav />
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-center py-24 text-slate-500">
                        <div className="text-4xl mb-4 animate-pulse">⚡</div>
                        <p>Cargando generadores...</p>
                    </div>
                ) : generators.length === 0 ? (
                    <div className="text-center py-24 text-slate-500">
                        <div className="text-5xl mb-4 opacity-30">⚡</div>
                        <p className="text-lg">No hay generadores registrados.</p>
                        <p className="text-sm mt-2">
                            Ve a{" "}
                            <Link href="/admin/assets" className="underline text-slate-300">
                                Admin → Activos
                            </Link>{" "}
                            y crea uno con tipo "Generador".
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {generators.map((gen) => (
                            <GeneratorCard key={gen.door_id} asset={gen} />
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/80 backdrop-blur py-2 px-6">
                <p className="text-center text-xs text-slate-600">
                    Sistema IoT — {now.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
            </footer>
        </div>
    )
}
