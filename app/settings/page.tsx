"use client"

import { motion } from "framer-motion"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Settings, Mail, MessageSquare, Phone, CheckCircle, AlertCircle } from "lucide-react"

export default function SettingsPage() {
  const integrations = [
    {
      id: "gmail",
      name: "Gmail",
      icon: <Mail className="w-6 h-6" />,
      connected: true,
      description: "Conectar con tu cuenta de Gmail para procesar correos",
    },
    {
      id: "outlook",
      name: "Outlook",
      icon: <Mail className="w-6 h-6" />,
      connected: false,
      description: "Conectar con tu cuenta de Outlook para procesar correos",
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      icon: <MessageSquare className="w-6 h-6" />,
      connected: true,
      description: "Conectar con WhatsApp Business API",
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: <Phone className="w-6 h-6" />,
      connected: false,
      description: "Conectar con Telegram Bot API",
    },
  ]

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
                        <Badge className="bg-green-100 text-green-800 border-green-200">
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
                      >
                        {integration.connected ? "Desconectar" : "Conectar"}
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
