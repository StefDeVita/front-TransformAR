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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Mail, MessageSquare, Phone, CheckCircle, AlertCircle, Loader2, QrCode } from "lucide-react"
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

  // Indicador de versión para debugging
  useEffect(() => {
    console.log("🔄 Settings page loaded - Version with OAuth redirect (2024-11-01)")
  }, [])

  const [loadingStatuses, setLoadingStatuses] = useState(true)

  // Estados para diálogos de WhatsApp y Telegram
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false)
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false)

  // Datos de conexión
  const [whatsappPhone, setWhatsappPhone] = useState("")
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("")
  const [whatsappAccessToken, setWhatsappAccessToken] = useState("")
  const [telegramBotToken, setTelegramBotToken] = useState("")
  const [qrCodeData, setQrCodeData] = useState("")
  const [connectingIntegration, setConnectingIntegration] = useState<string>("")

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
      setLoadingStatuses(true)

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
    } finally {
      setLoadingStatuses(false)
    }
  }

  const handleToggleConnection = async (integrationId: string) => {
    const integration = integrations.find((i) => i.id === integrationId)
    if (!integration) return

    // Si es WhatsApp o Telegram y no está conectado, abrir diálogo para capturar datos
    if (!integration.connected) {
      if (integrationId === "whatsapp") {
        setWhatsappDialogOpen(true)
        return
      } else if (integrationId === "telegram") {
        setTelegramDialogOpen(true)
        return
      }
    }

    // Para desconectar o para Gmail/Outlook, proceder normalmente
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

  // Conectar WhatsApp con número de teléfono
  const handleConnectWhatsApp = async () => {
    if (!whatsappPhone.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un número de teléfono",
        variant: "destructive",
      })
      return
    }

    if (!whatsappPhoneId.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el Phone Number ID",
        variant: "destructive",
      })
      return
    }

    if (!whatsappAccessToken.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el Access Token",
        variant: "destructive",
      })
      return
    }

    setConnectingIntegration("whatsapp")

    try {
      const token = localStorage.getItem("authToken")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/integration/whatsapp/connect`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          phone_number: whatsappPhone,
          phone_number_id: whatsappPhoneId,
          access_token: whatsappAccessToken
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error al conectar WhatsApp")
      }

      const data = await response.json()

      // Si hay QR code, mostrarlo en el diálogo
      if (data.qr_code) {
        setQrCodeData(data.qr_code)
        setWhatsappDialogOpen(false)
        setQrCodeDialogOpen(true)
        toast({
          title: "Código QR generado",
          description: "Escanea el código QR con WhatsApp para completar la conexión",
        })
      } else {
        // Conexión exitosa sin QR
        setWhatsappDialogOpen(false)
        setWhatsappPhone("")
        setWhatsappPhoneId("")
        setWhatsappAccessToken("")
        loadConnectionStatuses()
        toast({
          title: "Conectado",
          description: "WhatsApp se ha conectado correctamente",
        })
      }
    } catch (error: any) {
      console.error("Error connecting WhatsApp:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo conectar WhatsApp",
        variant: "destructive",
      })
    } finally {
      setConnectingIntegration("")
    }
  }

  // Conectar Telegram con bot token
  const handleConnectTelegram = async () => {
    if (!telegramBotToken.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el token del bot",
        variant: "destructive",
      })
      return
    }

    setConnectingIntegration("telegram")

    try {
      const token = localStorage.getItem("authToken")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/integration/telegram/connect`, {
        method: "POST",
        headers,
        body: JSON.stringify({ bot_token: telegramBotToken })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error al conectar Telegram")
      }

      const data = await response.json()

      // Si hay URL de autorización, redirigir
      if (data.authorization_url) {
        localStorage.setItem("pending_integration", "telegram")
        window.location.href = data.authorization_url
        return
      }

      // Conexión exitosa
      setTelegramDialogOpen(false)
      setTelegramBotToken("")
      loadConnectionStatuses()
      toast({
        title: "Conectado",
        description: "Telegram se ha conectado correctamente",
      })
    } catch (error: any) {
      console.error("Error connecting Telegram:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo conectar Telegram",
        variant: "destructive",
      })
    } finally {
      setConnectingIntegration("")
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
                {loadingStatuses ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Verificando estados de conexión...</p>
                    </div>
                  </div>
                ) : (
                  integrations.map((integration) => (
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
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>

      {/* Diálogo de WhatsApp */}
      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp Business API</DialogTitle>
            <DialogDescription>
              Ingresa las credenciales de tu aplicación de WhatsApp Business API desde Meta for Developers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-phone">Número de teléfono</Label>
              <Input
                id="whatsapp-phone"
                placeholder="+54 9 11 1234-5678"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                disabled={connectingIntegration === "whatsapp"}
              />
              <p className="text-xs text-muted-foreground">
                El número de teléfono registrado en WhatsApp Business (incluye código de país)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp-phone-id">Phone Number ID</Label>
              <Input
                id="whatsapp-phone-id"
                placeholder="123456789012345"
                value={whatsappPhoneId}
                onChange={(e) => setWhatsappPhoneId(e.target.value)}
                disabled={connectingIntegration === "whatsapp"}
              />
              <p className="text-xs text-muted-foreground">
                Encuéntralo en Meta for Developers → WhatsApp → API Setup
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp-access-token">Access Token</Label>
              <Textarea
                id="whatsapp-access-token"
                placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={whatsappAccessToken}
                onChange={(e) => setWhatsappAccessToken(e.target.value)}
                disabled={connectingIntegration === "whatsapp"}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Token de acceso permanente de tu app de WhatsApp Business en{" "}
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Meta for Developers
                </a>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWhatsappDialogOpen(false)
                setWhatsappPhone("")
                setWhatsappPhoneId("")
                setWhatsappAccessToken("")
              }}
              disabled={connectingIntegration === "whatsapp"}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConnectWhatsApp}
              disabled={connectingIntegration === "whatsapp"}
            >
              {connectingIntegration === "whatsapp" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Conectar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Telegram */}
      <Dialog open={telegramDialogOpen} onOpenChange={setTelegramDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar Telegram Bot</DialogTitle>
            <DialogDescription>
              Ingresa el token de tu bot de Telegram. Si no tienes uno, créalo con @BotFather
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="telegram-token">Bot Token</Label>
              <Textarea
                id="telegram-token"
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                disabled={connectingIntegration === "telegram"}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Crea un bot en Telegram hablando con{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @BotFather
                </a>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTelegramDialogOpen(false)
                setTelegramBotToken("")
              }}
              disabled={connectingIntegration === "telegram"}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConnectTelegram}
              disabled={connectingIntegration === "telegram"}
            >
              {connectingIntegration === "telegram" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Conectar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de QR Code */}
      <Dialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Escanea el código QR
            </DialogTitle>
            <DialogDescription>
              Abre WhatsApp en tu teléfono y escanea este código para conectar
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            {qrCodeData ? (
              <img
                src={qrCodeData}
                alt="QR Code"
                className="w-64 h-64 border-2 border-border rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Abre WhatsApp en tu teléfono</p>
            <p>2. Ve a Configuración → Dispositivos vinculados</p>
            <p>3. Toca "Vincular un dispositivo"</p>
            <p>4. Escanea este código QR</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setQrCodeDialogOpen(false)
                setQrCodeData("")
                loadConnectionStatuses()
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
