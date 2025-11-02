"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, LogIn, Mail } from "lucide-react"
import Image from "next/image"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "recover">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
         },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error al iniciar sesión")
      }

      const data = await response.json()
      console.log(data)
      // Save token to localStorage and cookie
      const token = data.token || data.access_token || data.authtoken
      localStorage.setItem("authToken", token)
      localStorage.setItem("userEmail", email)
      
      // Set cookie for server-side middleware
      document.cookie = `authToken=${token}; path=/; max-age=86400; SameSite=Lax`
      
      // Redirect to main page
      router.push("/")
    } catch (error: any) {
      setMessage(error.message || "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch(`${API_BASE}/auth/recover-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
         },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error al enviar el correo")
      }

      setMessage("Si el correo existe, recibirás instrucciones para recuperar tu contraseña")
      setEmail("")
    } catch (error: any) {
      setMessage(error.message || "Error al procesar la solicitud")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-sand/5 to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16">
              <Image
                src="/transformar-logo.png"
                alt="TransformAR Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">TransformAR</h1>
        </div>

        <Card className="border-muted/60 shadow-lg" data-testid="login-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {mode === "login" ? "Iniciar Sesión" : "Recuperar Contraseña"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Ingresá tus credenciales para continuar"
                : "Ingresá tu correo para recuperar tu contraseña"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={mode === "login" ? handleLogin : handleRecover} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                    data-testid="email-input"
                  />
                </div>
              </div>

              {mode === "login" && (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="password-input"
                    />
                  </div>
                </div>
              )}

              {message && (
                <div
                  className={`text-sm p-3 rounded-lg ${
                    message.includes("recibirás")
                      ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                      : "bg-destructive/10 text-destructive"
                  }`}
                  data-testid="message-box"
                >
                  {message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="submit-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : mode === "login" ? (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Ingresar
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Correo
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">o</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMode(mode === "login" ? "recover" : "login")
                  setMessage("")
                  setPassword("")
                }}
                data-testid="toggle-mode-button"
              >
                {mode === "login" ? "¿Olvidaste tu contraseña?" : "Volver al inicio de sesión"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>¿No tenés cuenta? Contactá a tu administrador</p>
        </div>
      </motion.div>
    </div>
  )
}
