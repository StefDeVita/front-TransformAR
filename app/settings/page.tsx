"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Settings, Mail, MessageSquare, Phone, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

type IntegrationStatus = {
  id: string
  name: string
  icon: React.ReactNode
  connected: boolean
  description: string
  loading?: boolean
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([
    {
      id: "gmail",
      name: "Gmail",
      icon: <Mail className="w-6 h-6" />,
      connected: false,
      description: "Conectar con tu cuenta de Gmail para procesar correos",
      loading: false,
    },
    {
      id: "outlook",
      name: "Outlook",
      icon: <Mail className="w-6 h-6" />,
      connected: false,
      description: "Conectar con tu cuenta de Outlook para procesar correos",
      loading: false,
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      icon: <MessageSquare className="w-6 h-6" />,
      connected: false,
      description: "Conectar con WhatsApp Business API",
      loading: false,
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: <Phone className="w-6 h-6" />,
      connected: false,
      description: "Conectar con Telegram Bot API",
      loading: false,
    },
  ])

  // Cargar el estado de las conexiones al montar el componente
  useEffect(() => {
    // Manejar callback de OAuth (cuando el usuario regresa de Gmail/Outlook)
    const urlParams = new URLSearchParams(window.location.search)
    const oauthSuccess = urlParams.get('oauth_success')
    const oauthError = urlParams.get('oauth_error')
    const pendingIntegration = localStorage.getItem('pending_integration')

    if (oauthSuccess === 'true' && pendingIntegration) {
      // OAuth exitoso - obtener nombre de la integración
      const integrationNames: Record<string, string> = {
        gmail: 'Gmail',
        outlook: 'Outlook',
        whatsapp: 'WhatsApp Business',
        telegram: 'Telegram'
      }
      const integrationName = integrationNames[pendingIntegration] || 'La integración'

      toast({
        title: "Conexión exitosa",
        description: `${integrationName} se ha conectado correctamente`,
      })

      // Limpiar localStorage
      localStorage.removeItem('pending_integration')

      // Limpiar URL sin recargar la página
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (oauthError && pendingIntegration) {
      // OAuth falló
      const integrationNames: Record<string, string> = {
        gmail: 'Gmail',
        outlook: 'Outlook',
        whatsapp: 'WhatsApp Business',
        telegram: 'Telegram'
      }
      const integrationName = integrationNames[pendingIntegration] || 'La integración'

      toast({
        title: "Error de conexión",
        description: `No se pudo conectar ${integrationName}. ${oauthError}`,
        variant: "destructive",
      })

      // Limpiar localStorage
      localStorage.removeItem('pending_integration')

      // Limpiar URL sin recargar la página
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    // Cargar estados de conexión
    loadConnectionStatuses()
  }, [])

  const loadConnectionStatuses = async () => {
    try {
      // Obtener el token de autenticación
      const token = localStorage.getItem("authToken")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Cargar estado de cada integración
      const statusPromises = integrations.map(async (integration) => {
        try {
          const response = await fetch(`${API_BASE}/integration/${integration.id}/status`, {
            headers,
            cache: "no-store",
          })
          if (response.ok) {
            const data = await response.json()
            return { id: integration.id, connected: data.connected || false }
          }
        } catch (error) {
          console.error(`Error loading ${integration.id} status:`, error)
        }
        return { id: integration.id, connected: false }
      })

      const statuses = await Promise.all(statusPromises)

      // Actualizar el estado de las integraciones
      setIntegrations((prev) =>
        prev.map((integration) => {
          const status = statuses.find((s) => s.id === integration.id)
          return status ? { ...integration, connected: status.connected } : integration
        })
      )
    } catch (error) {
      console.error("Error loading connection statuses:", error)
    }
  }

  const handleToggleConnection = async (integrationId: string) => {
    const integration = integrations.find((i) => i.id === integrationId)
    if (!integration) return

    // Marcar como loading
    setIntegrations((prev) =>
      prev.map((i) => (i.id === integrationId ? { ...i, loading: true } : i))
    )

    try {
      const token = localStorage.getItem("authToken")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const action = integration.connected ? "disconnect" : "connect"
      const method = integration.connected ? "DELETE" : "POST"
      const url = `${API_BASE}/integration/${integrationId}/${action}`

      console.log(`Making ${method} request to:`, url)

      const response = await fetch(url, {
        method: method,
        headers,
      })

      console.log(`Response status for ${integrationId}:`, response.status, response.statusText)

      if (!response.ok) {
        let errorMessage = `Error al ${action === "connect" ? "conectar" : "desconectar"}`
        try {
          const error = await response.json()
          errorMessage = error.detail || errorMessage
        } catch (e) {
          // Si no hay JSON en la respuesta, usar el mensaje por defecto
        }
        throw new Error(errorMessage)
      }

      // Intentar parsear JSON solo si hay contenido
      let data = null
      const contentType = response.headers.get("content-type")
      console.log(`Content-Type for ${integrationId}:`, contentType)

      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json()
          console.log(`Response data for ${integrationId} ${action}:`, data)
        } catch (e) {
          console.error("Error parsing JSON response:", e)
          // No hay JSON en la respuesta, continuar sin data
        }
      } else {
        console.log(`No JSON content-type for ${integrationId}, skipping JSON parse`)
      }

      // Si es conectar y hay authorization_url (Gmail/Outlook OAuth)
      if (action === "connect" && data?.authorization_url) {
        console.log(`Redirecting to OAuth URL for ${integrationId}:`, data.authorization_url)

        // Guardar el ID de integración para saber cuál se estaba conectando
        localStorage.setItem("pending_integration", integrationId)

        toast({
          title: "Redirigiendo...",
          description: `Serás redirigido a ${integration.name} para autorizar la conexión`,
          duration: 2000,
        })

        // Redirigir al usuario a la URL de autorización OAuth inmediatamente
        window.location.href = data.authorization_url

        // No continuar ejecutando código después de la redirección
        return
      }

      // Si es conectar y hay QR code (WhatsApp/Telegram)
      if (action === "connect" && data?.qr_code) {
        toast({
          title: "Escanea el código QR",
          description: "Por favor escanea el código QR con tu aplicación para completar la conexión",
          duration: 5000,
        })
        // Aquí podrías mostrar el QR code en un modal
        console.log("QR Code:", data.qr_code)
      }

      // Actualizar el estado
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === integrationId ? { ...i, connected: !integration.connected, loading: false } : i
        )
      )

      toast({
        title: action === "connect" ? "Conectado" : "Desconectado",
        description: `${integration.name} ${action === "connect" ? "conectado" : "desconectado"} exitosamente`,
      })
    } catch (error: any) {
      console.error(`Error toggling ${integrationId}:`, error)
      toast({
        title: "Error",
        description: error.message || "Error al procesar la solicitud",
        variant: "destructive",
      })
      // Remover el loading
      setIntegrations((prev) =>
        prev.map((i) => (i.id === integrationId ? { ...i, loading: false } : i))
      )
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <SidebarNavigation />

      <div className="flex-1 flex flex-col">
        <MainHeader title="Configuración" />

        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
            </div>

            {/* Integrations */}
            <Card>
              <CardHeader>
                <CardTitle>Integraciones de Comunicación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-sand rounded-lg">{integration.icon}</div>
                      <div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {integration.connected ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Conectado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Desconectado
                        </Badge>
                      )}

                      <Button
                        variant={integration.connected ? "outline" : "default"}
                        size="sm"
                        className={integration.connected ? "" : "bg-primary hover:bg-primary/90"}
                        onClick={() => handleToggleConnection(integration.id)}
                        disabled={integration.loading}
                      >
                        {integration.loading ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>{integration.connected ? "Desconectar" : "Conectar"}</>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
