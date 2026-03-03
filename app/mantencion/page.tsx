"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function MantencionPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/admin/contacts")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Redirigiendo a la página de contactos...</p>
      </div>
    </div>
  )
}
