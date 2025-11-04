"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Lightbulb, FileText, Mail, Send, MessageSquare, Phone, AlertCircle } from "lucide-react"

type TemplateMeta = { id: string; name: string; description?: string | null }
type GmailMsg = { id: string; from?: string; subject?: string }
type OutlookMsg = { id: string; from?: string; subject?: string; hasAttachments?: boolean }
type WhatsAppMsg = {
  id: string
  sender: { phone: string; name: string }
  timestamp: string
  type: string
  content?: { text: string; caption?: string }
  attachment?: {
    type: string
    filename: string
    mime_type: string
    id: string
  }
}
type TelegramMsg = {
  id: string
  from?: { username?: string }
  text?: string
  type: string
  document?: {
    file_id: string
    file_name: string
    file_size: number
  }
  photo?: {
    file_id: string
    file_size: number
  }
  video?: {
    file_id: string
    file_name?: string
    file_size: number
  }
  audio?: {
    file_id: string
    file_name?: string
    file_size: number
  }
}
type GmailDetail = { text: string; attachments: string[] }
type OutlookDetail = { text: string; attachments: string[] }
type WhatsAppDetail = {
  text?: string
  attachment?: {
    type: string
    filename: string
    mime_type: string
    id: string
  }
}
type TelegramDetail = {
  text?: string
  attachments?: Array<{
    file_id: string
    file_name?: string
    file_size?: number
    type?: string
  }>
}

type FileResult = {
  fileName?: string
  template_id: string
  compiled: { extract_instr: string; transform_instr: string }
  result: any
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

export default function HomePage() {
  const router = useRouter()

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/login")
    }
  }, [router])

  // Acordeón: 1 = Fuente, 2 = Entrada, 3 = Plantilla
  const [openStep, setOpenStep] = useState<1 | 2 | 3>(1)

  // Fuente
  const [source, setSource] = useState<"document" | "gmail" | "outlook" | "text" | "whatsapp" | "telegram" | "">("")

  // Plantillas (último paso)
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [templateId, setTemplateId] = useState<string>("")

  // Entradas por fuente
  const [files, setFiles] = useState<File[]>([])
  const [freeText, setFreeText] = useState<string>("")

  // Gmail/Outlook/WhatsApp/Telegram
  const [gmailList, setGmailList] = useState<GmailMsg[]>([])
  const [outlookList, setOutlookList] = useState<OutlookMsg[]>([])
  const [whatsappList, setWhatsappList] = useState<WhatsAppMsg[]>([])
  const [telegramList, setTelegramList] = useState<TelegramMsg[]>([])
  const [selectedMsgId, setSelectedMsgId] = useState<string>("")
  const [emailDetail, setEmailDetail] = useState<GmailDetail | OutlookDetail | WhatsAppDetail | TelegramDetail | null>(null)
  const [useText, setUseText] = useState<boolean>(true)
  const [attachmentIndex, setAttachmentIndex] = useState<number>(0)
  const [downloadedFile, setDownloadedFile] = useState<{ blob: Blob; filename: string } | null>(null)

  // Spinners
  const [loadingList, setLoadingList] = useState<boolean>(false)
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false)

  // Estado de conexión de la fuente
  const [sourceConnected, setSourceConnected] = useState<boolean>(true)
  const [checkingConnection, setCheckingConnection] = useState<boolean>(false)

  // Permisos de suscripción
  const [subscriptionPreferences, setSubscriptionPreferences] = useState<{
    mailing: boolean
    messaging: boolean
  } | null>(null)

  // Procesamiento
  const [isProcessing, setIsProcessing] = useState(false)

  // Cargar plantillas
  useEffect(() => {
    ;(async () => {
      try {
        // Obtener el token de autenticación
        const token = localStorage.getItem("authToken")
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        const r = await fetch(`${API_BASE}/templates`, {
          cache: "no-store",
          headers
        })
        const data = await r.json()
        setTemplates(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

  // Cargar permisos de suscripción
  useEffect(() => {
    ;(async () => {
      try {
        const token = localStorage.getItem("authToken")
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        const response = await fetch(`${API_BASE}/auth/subscription-preferences`, {
          headers,
          cache: "no-store",
        })

        if (response.ok) {
          const data = await response.json()
          setSubscriptionPreferences({
            mailing: data.mailing ?? true,
            messaging: data.messaging ?? true
          })
        } else {
          setSubscriptionPreferences({
            mailing: true,
            messaging: true
          })
        }
      } catch (error) {
        console.error("Error loading subscription preferences:", error)
        setSubscriptionPreferences({
          mailing: true,
          messaging: true
        })
      }
    })()
  }, [])

  // Elegir fuente → abrir Paso 2
  const handlePickSource = (s: "document" | "gmail" | "outlook" | "text" | "whatsapp" | "telegram") => {
    setSource(s)
    // limpiar entrada anterior
    setFiles([])
    setFreeText("")
    setSelectedMsgId("")
    setEmailDetail(null)
    setSourceConnected(true) // reset connection status
    // abrir Paso 2
    setOpenStep(2)
  }

  // Verificar si la fuente está conectada
  const checkSourceConnection = async (sourceType: "gmail" | "outlook" | "whatsapp" | "telegram"): Promise<boolean> => {
    try {
      setCheckingConnection(true)
      const token = localStorage.getItem("authToken")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/integration/${sourceType}/status`, {
        headers,
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        return data.connected || false
      }
      return false
    } catch (error) {
      console.error(`Error checking ${sourceType} connection:`, error)
      return false
    } finally {
      setCheckingConnection(false)
    }
  }

  // Cargar listas cuando estoy en Paso 2 y la fuente es correo/mensajería
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingList(true)
        setSelectedMsgId("")
        setEmailDetail(null)

        // Verificar primero si la fuente está conectada
        if (source === "gmail" || source === "outlook" || source === "whatsapp" || source === "telegram") {
          const connected = await checkSourceConnection(source)
          setSourceConnected(connected)

          // Si no está conectada, no intentar cargar mensajes
          if (!connected) {
            setLoadingList(false)
            return
          }
        }

        // Obtener el token de autenticación
        const token = localStorage.getItem("authToken")
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        if (source === "gmail") {
          const r = await fetch(`${API_BASE}/input/gmail/messages?limit=10`, {
            cache: "no-store",
            headers
          })
          const d = await r.json()
          setGmailList(d.messages || [])
        } else if (source === "outlook") {
          const r = await fetch(`${API_BASE}/input/outlook/messages?limit=10`, {
            cache: "no-store",
            headers
          })
          const d = await r.json()
          setOutlookList(d.messages || [])
        } else if (source === "whatsapp") {
          const r = await fetch(`${API_BASE}/input/whatsapp/messages?limit=10`, {
            cache: "no-store",
            headers
          })
          const d = await r.json()
          setWhatsappList(d.messages || [])
        } else if (source === "telegram") {
          const r = await fetch(`${API_BASE}/input/telegram/messages?limit=10`, {
            cache: "no-store",
            headers
          })
          const d = await r.json()
          console.log("=== Respuesta de /input/telegram/messages ===")
          console.log("Full response:", d)
          console.log("Messages:", d.messages)
          if (d.messages && d.messages.length > 0) {
            console.log("First message structure:", d.messages[0])
          }
          setTelegramList(d.messages || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingList(false)
      }
    }
    if (openStep === 2 && (source === "gmail" || source === "outlook" || source === "whatsapp" || source === "telegram")) {
      load()
    }
  }, [openStep, source])

  // Descargar archivo de WhatsApp
  const downloadWhatsAppMedia = async (mediaId: string, filename: string, token: string | null) => {
    try {
      const headers: HeadersInit = {}
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
        headers["ngrok-skip-browser-warning"]= "true"
      }
      const response = await fetch(`${API_BASE}/input/whatsapp/media/${mediaId}`, { headers })
      if (!response.ok) throw new Error("Error descargando archivo de WhatsApp")
      const blob = await response.blob()
      setDownloadedFile({ blob, filename })
    } catch (e) {
      console.error("Error descargando archivo de WhatsApp:", e)
    }
  }

  // Descargar archivo de Telegram
  const downloadTelegramFile = async (fileId: string, filename: string, token: string | null) => {
    try {
      console.log("=== Descargando archivo de Telegram ===")
      console.log("File ID:", fileId)
      console.log("Filename:", filename)
      console.log("API URL:", `${API_BASE}/input/telegram/file/${fileId}`)

      const headers: HeadersInit = {}
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
        headers["ngrok-skip-browser-warning"]= "true"

      }

      const response = await fetch(`${API_BASE}/input/telegram/file/${fileId}`, { headers })
      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error("Error descargando archivo de Telegram: " + errorText)
      }

      const blob = await response.blob()
      console.log("Blob descargado:", blob.size, "bytes, tipo:", blob.type)
      setDownloadedFile({ blob, filename })
      console.log("Archivo guardado en estado")
    } catch (e) {
      console.error("Error descargando archivo de Telegram:", e)
    }
  }

  // Cargar detalle del correo/mensaje
  const handleFetchDetail = async (id: string) => {
    try {
      setSelectedMsgId(id)
      setLoadingDetail(true)
      setDownloadedFile(null)

      // Obtener el token de autenticación
      const token = localStorage.getItem("authToken")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      let data: any

      // Para WhatsApp y Telegram, los mensajes ya vienen completos en la lista
      if (source === "whatsapp") {
        const message = whatsappList.find(m => m.id === id)
        if (!message) throw new Error("Mensaje no encontrado")
        // Convertir el mensaje de WhatsApp al formato detail
        data = {
          text: message.content?.text,
          attachment: message.attachment
        }
      } else if (source === "telegram") {
        const message = telegramList.find(m => m.id === id)
        if (!message) throw new Error("Mensaje no encontrado")

        console.log("=== Mensaje de Telegram seleccionado ===")
        console.log("Mensaje original:", message)
        console.log("Message ID:", message.id)
        console.log("Message type:", message.type)
        console.log("Has document:", !!message.document)
        console.log("Has photo:", !!message.photo)
        console.log("Has video:", !!message.video)
        console.log("Has audio:", !!message.audio)
        console.log("Text:", message.text)

        // Procesar directamente desde el mensaje original
        // Extraer attachments del mensaje
        const attachments: Array<{file_id: string, file_name?: string, file_size?: number, type?: string}> = []

        if (message.document) {
          attachments.push({
            file_id: message.document.file_id,
            file_name: message.document.file_name,
            file_size: message.document.file_size,
            type: 'document'
          })
        } else if (message.photo) {
          attachments.push({
            file_id: message.photo.file_id,
            file_size: message.photo.file_size,
            type: 'photo'
          })
        } else if (message.video) {
          attachments.push({
            file_id: message.video.file_id,
            file_name: message.video.file_name,
            file_size: message.video.file_size,
            type: 'video'
          })
        } else if (message.audio) {
          attachments.push({
            file_id: message.audio.file_id,
            file_name: message.audio.file_name,
            file_size: message.audio.file_size,
            type: 'audio'
          })
        }

        console.log("Attachments extraídos del mensaje:", attachments)

        // Usar los datos directamente del mensaje en lugar de llamar al endpoint
        data = {
          text: message.text || "",
          attachments: attachments
        }

        console.log("Telegram detail (procesado localmente):", data)
      } else {
        // Para Gmail y Outlook, sí necesitamos hacer fetch
        let endpoint = ""
        if (source === "gmail") {
          endpoint = `${API_BASE}/input/gmail/messages/${id}`
        } else if (source === "outlook") {
          endpoint = `${API_BASE}/input/outlook/messages/${id}`
        }
        const r = await fetch(endpoint, {
          cache: "no-store",
          headers
        })
        data = await r.json()
      }

      setEmailDetail(data)

      // Auto-seleccionar según el contenido disponible y descargar archivo si es necesario
      let shouldUseText = true
      if (source === "whatsapp") {
        const detail = data as WhatsAppDetail
        // Si solo hay adjunto (sin texto), seleccionar archivo y descargarlo
        if (detail.attachment && !detail.text) {
          shouldUseText = false
          await downloadWhatsAppMedia(detail.attachment.id, detail.attachment.filename, token)
        }
        // Si solo hay texto (sin adjunto), seleccionar texto
        else if (detail.text && !detail.attachment) {
          shouldUseText = true
        }
        // Si hay ambos, default a archivo (más común en WhatsApp)
        else if (detail.text && detail.attachment) {
          shouldUseText = false
          await downloadWhatsAppMedia(detail.attachment.id, detail.attachment.filename, token)
        }
      } else if (source === "telegram") {
        const detail = data as TelegramDetail
        const hasAttachments = detail.attachments && detail.attachments.length > 0
        const firstAttachment = hasAttachments ? detail.attachments![0] : null

        console.log("Telegram detail:", detail)
        console.log("Has attachments:", hasAttachments)
        console.log("First attachment:", firstAttachment)
        console.log("Has text:", !!detail.text)

        // Si solo hay adjunto (sin texto), seleccionar archivo y descargarlo
        if (hasAttachments && !detail.text) {
          console.log("Caso 1: Solo archivo, descargando...")
          shouldUseText = false
          await downloadTelegramFile(
            firstAttachment!.file_id,
            firstAttachment!.file_name || "telegram_file",
            token
          )
        }
        // Si solo hay texto (sin adjunto), seleccionar texto
        else if (detail.text && !hasAttachments) {
          console.log("Caso 2: Solo texto")
          shouldUseText = true
        }
        // Si hay ambos, default a archivo
        else if (detail.text && hasAttachments) {
          console.log("Caso 3: Texto y archivo, descargando archivo...")
          shouldUseText = false
          await downloadTelegramFile(
            firstAttachment!.file_id,
            firstAttachment!.file_name || "telegram_file",
            token
          )
        }
        else {
          console.log("Caso 4: Sin contenido disponible")
        }
      } else {
        // Gmail/Outlook: default a texto si existe
        shouldUseText = Boolean((data as any).text)
      }

      setUseText(shouldUseText)
      setAttachmentIndex(0)
      // si ya hay detalle, abrimos Paso 3 (plantilla)
      setOpenStep(3)
    } catch (e) {
      console.error(e)
      setEmailDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Si la entrada queda lista por file/text, abrir Paso 3
  useEffect(() => {
    if (openStep === 2) {
      if (source === "document" && files.length > 0) setOpenStep(3)
      if (source === "text" && freeText.trim().length > 0) setOpenStep(3)
    }
  }, [openStep, source, files, freeText])

  // Helper: guardar resultados y navegar
  function goToResults({
    sourceType,
    selectedTemplate,
    fileName,
    compiled,
    result,
    fileCount = 1,
  }: {
    sourceType: string
    selectedTemplate: string
    fileName?: string
    compiled: { extract_instr: string; transform_instr: string }
    result: any
    fileCount?: number
  }) {
    const payload = {
      sourceType,
      selectedTemplate,
      fileCount,
      when: new Date().toISOString(),
      results: [
        {
          fileName,
          template_id: selectedTemplate,
          compiled,
          result,
        } as FileResult,
      ],
    }
    localStorage.setItem("processingData", JSON.stringify(payload))
    router.push("/results")
  }

  // Ejecutar procesamiento y saltar a /resultados
  const processNow = async () => {
    if (!templateId) {
      alert("Elegí una plantilla.")
      setOpenStep(3)
      return
    }
    try {
      setIsProcessing(true)

      // Obtener el token de autenticación
      const token = localStorage.getItem("authToken")
      const headers: HeadersInit = {
        "ngrok-skip-browser-warning": "true"
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      if (source === "document") {
        if (!files.length) { alert("Seleccioná un archivo."); return }
        const fd = new FormData()
        fd.append("template_id", templateId)
        fd.append("file", files[0])
        const r = await fetch(`${API_BASE}/process/document`, {
          method: "POST",
          headers,
          body: fd
        })
        if (!r.ok) throw new Error(await r.text())
        const d = await r.json()
        goToResults({
          sourceType: "document",
          selectedTemplate: templateId,
          fileName: files[0]?.name,
          compiled: d.compiled,
          result: d.result,
          fileCount: 1,
        })
      }

      else if (source === "text") {
        if (!freeText.trim()) { alert("Pegá un texto."); return }
        const headersWithContentType = {
          ...headers,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
        const r = await fetch(`${API_BASE}/process`, {
          method: "POST",
          headers: headersWithContentType,
          body: JSON.stringify({ method: "text", template_id: templateId, text: freeText })
        })
        if (!r.ok) throw new Error(await r.text())
        const d = await r.json()
        goToResults({
          sourceType: "text",
          selectedTemplate: templateId,
          fileName: "texto_libre.txt",
          compiled: d.compiled,
          result: d.result,
          fileCount: 1,
        })
      }

      else if (source === "gmail" || source === "outlook") {
        if (!selectedMsgId) { alert("Elegí un mensaje."); return }
        const body: any = { method: source, template_id: templateId }
        if (source === "gmail") {
          body.gmail = { message_id: selectedMsgId, use_text: useText }
          if (!useText && (emailDetail?.attachments?.length ?? 0) > 0) body.gmail.attachment_index = attachmentIndex
        } else if (source === "outlook") {
          body.outlook = { message_id: selectedMsgId, use_text: useText }
          if (!useText && (emailDetail?.attachments?.length ?? 0) > 0) body.outlook.attachment_index = attachmentIndex
        }
        const headersWithContentType = {
          ...headers,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
        const r = await fetch(`${API_BASE}/process`, {
          method: "POST",
          headers: headersWithContentType,
          body: JSON.stringify(body)
        })
        if (!r.ok) throw new Error(await r.text())
        const d = await r.json()
        goToResults({
          sourceType: source,
          selectedTemplate: templateId,
          fileName: selectedMsgId,
          compiled: d.compiled,
          result: d.result,
          fileCount: 1,
        })
      }

      else if (source === "whatsapp" || source === "telegram") {
        if (!selectedMsgId) { alert("Elegí un mensaje."); return }

        // Si se seleccionó usar archivo y existe el archivo descargado, usar /process/document
        if (!useText && downloadedFile) {
          const fd = new FormData()
          fd.append("template_id", templateId)
          // Convertir Blob a File
          const file = new File([downloadedFile.blob], downloadedFile.filename, { type: downloadedFile.blob.type })
          fd.append("file", file)

          const r = await fetch(`${API_BASE}/process/document`, {
            method: "POST",
            headers,
            body: fd
          })
          if (!r.ok) throw new Error(await r.text())
          const d = await r.json()
          goToResults({
            sourceType: source,
            selectedTemplate: templateId,
            fileName: downloadedFile.filename,
            compiled: d.compiled,
            result: d.result,
            fileCount: 1,
          })
        }
        // Si se seleccionó usar texto, enviar vía /process con message_id
        else if (useText) {
          const body: any = { method: source, template_id: templateId }
          if (source === "whatsapp") {
            body.whatsapp = { message_id: selectedMsgId, use_text: true }
          } else if (source === "telegram") {
            body.telegram = { message_id: selectedMsgId, use_text: true }
          }
          const headersWithContentType = {
            ...headers,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
          }
          const r = await fetch(`${API_BASE}/process`, {
            method: "POST",
            headers: headersWithContentType,
            body: JSON.stringify(body)
          })
          if (!r.ok) throw new Error(await r.text())
          const d = await r.json()
          goToResults({
            sourceType: source,
            selectedTemplate: templateId,
            fileName: selectedMsgId,
            compiled: d.compiled,
            result: d.result,
            fileCount: 1,
          })
        } else {
          alert("No hay archivo descargado para procesar.")
          return
        }
      }

    } catch (e: any) {
      alert("Error: " + e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const entradaLista = useMemo(() => {
    if (source === "document") return files.length > 0
    if (source === "text") return freeText.trim().length > 0
    if (source === "gmail" || source === "outlook") {
      return Boolean(selectedMsgId && ((useText && emailDetail?.text) || (!useText && (emailDetail?.attachments?.length ?? 0) > 0)))
    }
    if (source === "whatsapp" || source === "telegram") {
      // Para WhatsApp/Telegram: verificar que tengamos texto o archivo descargado
      return Boolean(selectedMsgId && ((useText && emailDetail?.text) || (!useText && downloadedFile)))
    }
    return false
  }, [source, files, freeText, selectedMsgId, emailDetail, useText, downloadedFile])

  const puedeTransformar = templateId && entradaLista

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-sand/5 to-primary/5">
      <SidebarNavigation />
      <div className="flex-1 flex flex-col">
        <MainHeader title="Guía Paso a Paso" />
        <main className="flex-1 p-6 overflow-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-6xl mx-auto space-y-6">

            {/* Progreso compacto */}
            <Card className="border-muted/60">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">Paso</Badge>
                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center ${openStep===1?"bg-primary text-primary-foreground":""}`}>1</span>
                    <span className="w-12 border-t" />
                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center ${openStep===2?"bg-primary text-primary-foreground":""}`}>2</span>
                    <span className="w-12 border-t" />
                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center ${openStep===3?"bg-primary text-primary-foreground":""}`}>3</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PASO 1: FUENTE */}
            <Card className={`${openStep>=1 ? "" : "opacity-60"}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Paso 1: ¿De dónde vienen tus documentos?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/40 p-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-500" />
                    <p>Seleccioná de donde querés extraer los documentos. Por ejemplo: desde un correo, un archivo en tu computadora o apps de mensajería instantánea.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={()=>handlePickSource("document")} className={`text-left rounded-xl border p-4 hover:shadow transition ${source==="document"?"bg-primary/10 border-primary":"bg-card"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div>
                      <div>
                        <div className="font-medium">Documentos</div>
                        <div className="text-xs text-muted-foreground">Cargar archivos de tu PC</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={()=>handlePickSource("gmail")}
                    disabled={subscriptionPreferences && !subscriptionPreferences.mailing}
                    className={`text-left rounded-xl border p-4 transition ${
                      subscriptionPreferences && !subscriptionPreferences.mailing
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:shadow"
                    } ${source==="gmail"?"bg-primary/10 border-primary":"bg-card"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-200/40 flex items-center justify-center"><Mail className="w-5 h-5" /></div>
                      <div>
                        <div className="font-medium">Gmail</div>
                        <div className="text-xs text-muted-foreground">Correos de tu bandeja de entrada</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={()=>handlePickSource("outlook")}
                    disabled={subscriptionPreferences && !subscriptionPreferences.mailing}
                    className={`text-left rounded-xl border p-4 transition ${
                      subscriptionPreferences && !subscriptionPreferences.mailing
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:shadow"
                    } ${source==="outlook"?"bg-primary/10 border-primary":"bg-card"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-200/40 flex items-center justify-center"><Send className="w-5 h-5" /></div>
                      <div>
                        <div className="font-medium">Outlook</div>
                        <div className="text-xs text-muted-foreground">Correos de tu bandeja de entrada</div>
                      </div>
                    </div>
                  </button>
                  <button onClick={()=>handlePickSource("text")} className={`text-left rounded-xl border p-4 hover:shadow transition ${source==="text"?"bg-primary/10 border-primary":"bg-card"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-200/40 flex items-center justify-center"><MessageSquare className="w-5 h-5" /></div>
                      <div>
                        <div className="font-medium">Texto Simple</div>
                        <div className="text-xs text-muted-foreground">Notas, descripciones</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={()=>handlePickSource("whatsapp")}
                    disabled={subscriptionPreferences && !subscriptionPreferences.messaging}
                    className={`text-left rounded-xl border p-4 transition ${
                      subscriptionPreferences && !subscriptionPreferences.messaging
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:shadow"
                    } ${source==="whatsapp"?"bg-primary/10 border-primary":"bg-card"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-200/40 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-green-600" /></div>
                      <div>
                        <div className="font-medium">WhatsApp</div>
                        <div className="text-xs text-muted-foreground">Chats, imagenes y documentos</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={()=>handlePickSource("telegram")}
                    disabled={subscriptionPreferences && !subscriptionPreferences.messaging}
                    className={`text-left rounded-xl border p-4 transition ${
                      subscriptionPreferences && !subscriptionPreferences.messaging
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:shadow"
                    } ${source==="telegram"?"bg-primary/10 border-primary":"bg-card"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-sky-200/40 flex items-center justify-center"><Phone className="w-5 h-5 text-sky-600" /></div>
                      <div>
                        <div className="font-medium">Telegram</div>
                        <div className="text-xs text-muted-foreground">Chats, imagenes y documentos</div>
                      </div>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* PASO 2: ENTRADA (auto al elegir fuente) */}
            {openStep >= 2 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Paso 2: Elegí la entrada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {source === "document" && (
                    <div className="space-y-2 max-w-md">
                      <Label className="text-sm">Archivo</Label>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        onChange={(e)=>{ const f = Array.from(e.target.files||[]); setFiles(f) }}
                      />
                      {files.length>0 && <p className="text-xs text-muted-foreground">Archivo seleccionado: {files[0].name}</p>}
                    </div>
                  )}

                  {source === "text" && (
                    <div className="space-y-2">
                      <Label className="text-sm">Texto</Label>
                      <Textarea rows={6} value={freeText} onChange={(e)=> setFreeText(e.target.value)} placeholder="Pegá el contenido aquí..." />
                    </div>
                  )}

                  {source === "gmail" && (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="border rounded-lg h-56 overflow-auto">
                        {loadingList || checkingConnection ? (
                          <div className="h-full flex items-center justify-center text-sm text-muted-foreground gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> {checkingConnection ? "Verificando conexión…" : "Cargando mensajes…"}
                          </div>
                        ) : !sourceConnected ? (
                          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                            <AlertCircle className="w-12 h-12 text-yellow-500 mb-3" />
                            <p className="text-sm font-medium text-foreground mb-2">Gmail no está conectado</p>
                            <p className="text-xs text-muted-foreground mb-3">
                              Para seleccionar mensajes de Gmail, primero necesitas conectar tu cuenta.
                            </p>
                            <Button
                              size="sm"
                              onClick={() => router.push("/settings")}
                              className="text-xs"
                            >
                              Ir a Configuración
                            </Button>
                          </div>
                        ) : (
                          (gmailList || []).map(m => (
                            <button key={m.id} onClick={()=>handleFetchDetail(m.id)} className={`w-full text-left px-3 py-2 border-b hover:bg-muted ${selectedMsgId===m.id? "bg-muted": ""}`}>
                              <div className="text-sm font-medium">{m.subject || "(sin asunto)"}</div>
                              <div className="text-xs text-muted-foreground">{m.from || ""}</div>
                            </button>
                          ))
                        )}
                      </div>
                      <div className="space-y-3">
                        {loadingDetail ? (
                          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground gap-2 border rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin" /> Cargando contenido…
                          </div>
                        ) : !emailDetail ? (
                          sourceConnected && <div className="text-sm text-muted-foreground">Seleccioná un mensaje…</div>
                        ) : (
                          <>
                            <div className="flex items-center gap-4 text-sm">
                              <label className="flex items-center gap-2">
                                <input type="radio" checked={useText} onChange={()=>setUseText(true)} /> Cuerpo
                              </label>
                              <label className="flex items-center gap-2">
                                <input type="radio" checked={!useText} onChange={()=>setUseText(false)} /> Adjunto
                              </label>
                            </div>
                            {!useText && (
                              <div>
                                <Label className="text-sm">Adjunto</Label>
                                <Select value={String(attachmentIndex)} onValueChange={(v)=> setAttachmentIndex(parseInt(v))}>
                                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {(emailDetail.attachments || []).map((_,i)=>(<SelectItem key={i} value={String(i)}>Adjunto #{i+1}</SelectItem>))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {useText && (
                              <ScrollArea className="h-32 rounded border p-2 text-xs whitespace-pre-wrap">
                                {emailDetail.text?.slice(0,3000) || "(sin texto)"}
                              </ScrollArea>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {source === "outlook" && (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="border rounded-lg h-56 overflow-auto">
                        {loadingList || checkingConnection ? (
                          <div className="h-full flex items-center justify-center text-sm text-muted-foreground gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> {checkingConnection ? "Verificando conexión…" : "Cargando mensajes…"}
                          </div>
                        ) : !sourceConnected ? (
                          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                            <AlertCircle className="w-12 h-12 text-yellow-500 mb-3" />
                            <p className="text-sm font-medium text-foreground mb-2">Outlook no está conectado</p>
                            <p className="text-xs text-muted-foreground mb-3">
                              Para seleccionar mensajes de Outlook, primero necesitas conectar tu cuenta.
                            </p>
                            <Button
                              size="sm"
                              onClick={() => router.push("/settings")}
                              className="text-xs"
                            >
                              Ir a Configuración
                            </Button>
                          </div>
                        ) : (
                          (outlookList || []).map(m => (
                            <button key={m.id} onClick={()=>handleFetchDetail(m.id)} className={`w-full text-left px-3 py-2 border-b hover:bg-muted ${selectedMsgId===m.id? "bg-muted": ""}`}>
                              <div className="text-sm font-medium">{m.subject || "(sin asunto)"}</div>
                              <div className="text-xs text-muted-foreground">{m.from || ""}</div>
                            </button>
                          ))
                        )}
                      </div>
                      <div className="space-y-3">
                        {loadingDetail ? (
                          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground gap-2 border rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin" /> Cargando contenido…
                          </div>
                        ) : !emailDetail ? (
                          sourceConnected && <div className="text-sm text-muted-foreground">Seleccioná un mensaje…</div>
                        ) : (
                          <>
                            <div className="flex items-center gap-4 text-sm">
                              <label className="flex items-center gap-2">
                                <input type="radio" checked={useText} onChange={()=>setUseText(true)} /> Cuerpo
                              </label>
                              <label className="flex items-center gap-2">
                                <input type="radio" checked={!useText} onChange={()=>setUseText(false)} /> Adjunto
                              </label>
                            </div>
                            {!useText && (
                              <div>
                                <Label className="text-sm">Adjunto</Label>
                                <Select value={String(attachmentIndex)} onValueChange={(v)=> setAttachmentIndex(parseInt(v))}>
                                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {(emailDetail.attachments || []).map((_,i)=>(<SelectItem key={i} value={String(i)}>Adjunto #{i+1}</SelectItem>))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {useText && (
                              <ScrollArea className="h-32 rounded border p-2 text-xs whitespace-pre-wrap">
                                {emailDetail.text?.slice(0,3000) || "(sin texto)"}
                              </ScrollArea>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {source === "whatsapp" && (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="border rounded-lg h-56 overflow-auto">
                        {loadingList || checkingConnection ? (
                          <div className="h-full flex items-center justify-center text-sm text-muted-foreground gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> {checkingConnection ? "Verificando conexión…" : "Cargando mensajes…"}
                          </div>
                        ) : !sourceConnected ? (
                          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                            <AlertCircle className="w-12 h-12 text-yellow-500 mb-3" />
                            <p className="text-sm font-medium text-foreground mb-2">WhatsApp no está conectado</p>
                            <p className="text-xs text-muted-foreground mb-3">
                              Para seleccionar mensajes de WhatsApp, primero necesitas conectar tu cuenta.
                            </p>
                            <Button
                              size="sm"
                              onClick={() => router.push("/settings")}
                              className="text-xs"
                            >
                              Ir a Configuración
                            </Button>
                          </div>
                        ) : (
                          (whatsappList || []).map(m => (
                            <button key={m.id} onClick={()=>handleFetchDetail(m.id)} className={`w-full text-left px-3 py-2 border-b hover:bg-muted ${selectedMsgId===m.id? "bg-muted": ""}`}>
                              <div className="text-sm font-medium">
                                {m.type === "text" ? (m.content?.text?.slice(0, 50) || "(mensaje de texto)") : m.attachment?.filename || `(${m.type})`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {m.sender.name || m.sender.phone} • {new Date(parseInt(m.timestamp) * 1000).toLocaleString()}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      <div className="space-y-3">
                        {loadingDetail ? (
                          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground gap-2 border rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin" /> Cargando contenido…
                          </div>
                        ) : !emailDetail ? (
                          sourceConnected && <div className="text-sm text-muted-foreground">Seleccioná un mensaje…</div>
                        ) : (
                          <>
                            {/* Solo mostrar opciones si hay tanto texto como archivo */}
                            {emailDetail.text && (emailDetail as WhatsAppDetail).attachment && (
                              <div className="flex items-center gap-4 text-sm">
                                <label className="flex items-center gap-2">
                                  <input type="radio" checked={useText} onChange={()=>setUseText(true)} /> Texto
                                </label>
                                <label className="flex items-center gap-2">
                                  <input type="radio" checked={!useText} onChange={async ()=> {
                                    setUseText(false)
                                    // Descargar el archivo si no está descargado
                                    const detail = emailDetail as WhatsAppDetail
                                    if (!downloadedFile && detail.attachment) {
                                      const token = localStorage.getItem("authToken")
                                      await downloadWhatsAppMedia(detail.attachment.id, detail.attachment.filename, token)
                                    }
                                  }} /> Archivo
                                </label>
                              </div>
                            )}
                            {!useText && (emailDetail as WhatsAppDetail).attachment && (
                              <div className="p-3 border rounded-lg bg-muted/30">
                                <div className="text-sm font-medium">📎 Archivo adjunto seleccionado</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  <strong>Nombre:</strong> {(emailDetail as WhatsAppDetail).attachment?.filename}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  <strong>Tipo:</strong> {(emailDetail as WhatsAppDetail).attachment?.mime_type}
                                </div>
                                {downloadedFile && (
                                  <div className="text-xs text-green-600 mt-2">
                                    ✓ Archivo descargado y listo para procesar
                                  </div>
                                )}
                              </div>
                            )}
                            {useText && emailDetail.text && (
                              <div>
                                <div className="text-sm font-medium mb-2">📝 Texto seleccionado</div>
                                <ScrollArea className="h-32 rounded border p-2 text-xs whitespace-pre-wrap bg-muted/20">
                                  {emailDetail.text?.slice(0,3000) || "(sin texto)"}
                                </ScrollArea>
                                <div className="text-xs text-green-600 mt-2">
                                  ✓ Listo para procesar
                                </div>
                              </div>
                            )}
                            {!emailDetail.text && !(emailDetail as WhatsAppDetail).attachment && (
                              <div className="text-sm text-muted-foreground">No hay contenido disponible</div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {source === "telegram" && (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="border rounded-lg h-56 overflow-auto">
                        {loadingList || checkingConnection ? (
                          <div className="h-full flex items-center justify-center text-sm text-muted-foreground gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> {checkingConnection ? "Verificando conexión…" : "Cargando mensajes…"}
                          </div>
                        ) : !sourceConnected ? (
                          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                            <AlertCircle className="w-12 h-12 text-yellow-500 mb-3" />
                            <p className="text-sm font-medium text-foreground mb-2">Telegram no está conectado</p>
                            <p className="text-xs text-muted-foreground mb-3">
                              Para seleccionar mensajes de Telegram, primero necesitas conectar tu bot.
                            </p>
                            <Button
                              size="sm"
                              onClick={() => router.push("/settings")}
                              className="text-xs"
                            >
                              Ir a Configuración
                            </Button>
                          </div>
                        ) : (
                          (telegramList || []).map(m => {
                            const fileName = m.document?.file_name || m.video?.file_name || m.audio?.file_name || null
                            const displayText = m.type === "text" ? (m.text?.slice(0, 50) || "(mensaje de texto)") : fileName || `(${m.type})`
                            const senderName = m.from?.username || "Usuario"

                            return (
                              <button key={m.id} onClick={()=>handleFetchDetail(m.id)} className={`w-full text-left px-3 py-2 border-b hover:bg-muted ${selectedMsgId===m.id? "bg-muted": ""}`}>
                                <div className="text-sm font-medium">{displayText}</div>
                                <div className="text-xs text-muted-foreground">{senderName}</div>
                              </button>
                            )
                          })
                        )}
                      </div>
                      <div className="space-y-3">
                        {loadingDetail ? (
                          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground gap-2 border rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin" /> Cargando contenido…
                          </div>
                        ) : !emailDetail ? (
                          sourceConnected && <div className="text-sm text-muted-foreground">Seleccioná un mensaje…</div>
                        ) : (
                          <>
                            {(() => {
                              const detail = emailDetail as TelegramDetail
                              const hasAttachments = detail.attachments && detail.attachments.length > 0
                              const firstAttachment = hasAttachments ? detail.attachments![0] : null

                              return (
                                <>
                                  {/* Solo mostrar opciones si hay tanto texto como archivo */}
                                  {detail.text && hasAttachments && (
                                    <div className="flex items-center gap-4 text-sm">
                                      <label className="flex items-center gap-2">
                                        <input type="radio" checked={useText} onChange={()=>setUseText(true)} /> Texto
                                      </label>
                                      <label className="flex items-center gap-2">
                                        <input type="radio" checked={!useText} onChange={async ()=> {
                                          setUseText(false)
                                          // Descargar el archivo si no está descargado
                                          if (!downloadedFile && firstAttachment) {
                                            const token = localStorage.getItem("authToken")
                                            await downloadTelegramFile(
                                              firstAttachment.file_id,
                                              firstAttachment.file_name || "telegram_file",
                                              token
                                            )
                                          }
                                        }} /> Archivo
                                      </label>
                                    </div>
                                  )}
                                  {!useText && hasAttachments && (
                                    <div className="p-3 border rounded-lg bg-muted/30">
                                      <div className="text-sm font-medium">📎 Archivo seleccionado</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        <strong>Nombre:</strong> {firstAttachment?.file_name || "telegram_file"}
                                      </div>
                                      {firstAttachment?.type && (
                                        <div className="text-xs text-muted-foreground">
                                          <strong>Tipo:</strong> {firstAttachment.type}
                                        </div>
                                      )}
                                      {downloadedFile && (
                                        <div className="text-xs text-green-600 mt-2">
                                          ✓ Archivo descargado y listo para procesar
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {useText && detail.text && (
                                    <div>
                                      <div className="text-sm font-medium mb-2">📝 Texto seleccionado</div>
                                      <ScrollArea className="h-32 rounded border p-2 text-xs whitespace-pre-wrap bg-muted/20">
                                        {detail.text?.slice(0,3000) || "(sin texto)"}
                                      </ScrollArea>
                                      <div className="text-xs text-green-600 mt-2">
                                        ✓ Listo para procesar
                                      </div>
                                    </div>
                                  )}
                                  {!detail.text && !hasAttachments && (
                                    <div className="text-sm text-muted-foreground">No hay contenido disponible</div>
                                  )}
                                </>
                              )
                            })()}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* PASO 3: PLANTILLA (último) */}
            {openStep >= 3 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Paso 3: Elegí una plantilla</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-w-md">
                    <Label className="text-sm">Plantilla</Label>
                    <Select value={templateId} onValueChange={(v)=> {
                      if (v === "create-new") {
                        router.push("/templates")
                      } else {
                        setTemplateId(v)
                      }
                    }}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Elegí una plantilla" /></SelectTrigger>
                      <SelectContent>
                        {templates.map(t => (<SelectItem key={t.id} value={t.id}>{t.name}{t.description?` — ${t.description}`:""}</SelectItem>))}
                        {templates.length > 0 && <SelectSeparator />}
                        <SelectItem value="create-new" className="text-primary font-medium">
                          + Crear nueva plantilla
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botón principal abajo (grande) */}
              <Card>
                  <CardContent>
                    <Button
                      onClick={processNow}
                      disabled={isProcessing || !puedeTransformar}
                      className="w-full h-14 text-lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Procesando…
                        </>
                      ) : (
                        <>Transformar 🚀</>
                      )}
                    </Button>
                </CardContent>
              </Card>

          </motion.div>
        </main>
      </div>
    </div>
  )
}
