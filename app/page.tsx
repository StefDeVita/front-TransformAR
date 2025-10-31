"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Lightbulb, FileText, Mail, Send, MessageSquare, Phone } from "lucide-react"

type TemplateMeta = { id: string; name: string; description?: string | null }
type GmailMsg = { id: string; from?: string; subject?: string }
type OutlookMsg = { id: string; from?: string; subject?: string; hasAttachments?: boolean }
type GmailDetail = { text: string; attachments: string[] }
type OutlookDetail = { text: string; attachments: string[] }

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
  const [source, setSource] = useState<"document" | "gmail" | "outlook" | "text" | "whatsapp" | "telegram">("document")

  // Plantillas (último paso)
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [templateId, setTemplateId] = useState<string>("")

  // Entradas por fuente
  const [files, setFiles] = useState<File[]>([])
  const [freeText, setFreeText] = useState<string>("")

  // Gmail/Outlook/WhatsApp/Telegram
  const [gmailList, setGmailList] = useState<GmailMsg[]>([])
  const [outlookList, setOutlookList] = useState<OutlookMsg[]>([])
  const [whatsappList, setWhatsappList] = useState<GmailMsg[]>([])
  const [telegramList, setTelegramList] = useState<GmailMsg[]>([])
  const [selectedMsgId, setSelectedMsgId] = useState<string>("")
  const [emailDetail, setEmailDetail] = useState<GmailDetail | OutlookDetail | null>(null)
  const [useText, setUseText] = useState<boolean>(true)
  const [attachmentIndex, setAttachmentIndex] = useState<number>(0)

  // Spinners
  const [loadingList, setLoadingList] = useState<boolean>(false)
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false)

  // Procesamiento
  const [isProcessing, setIsProcessing] = useState(false)

  // Cargar plantillas
  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`${API_BASE}/templates`, { cache: "no-store" })
        const data = await r.json()
        setTemplates(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error(e)
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
    // abrir Paso 2
    setOpenStep(2)
  }

  // Cargar listas cuando estoy en Paso 2 y la fuente es correo/mensajería
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingList(true)
        setSelectedMsgId("")
        setEmailDetail(null)
        if (source === "gmail") {
          const r = await fetch(`${API_BASE}/input/gmail/messages?limit=10`, { cache: "no-store" })
          const d = await r.json()
          setGmailList(d.messages || [])
        } else if (source === "outlook") {
          const r = await fetch(`${API_BASE}/input/outlook/messages?limit=10`, { cache: "no-store" })
          const d = await r.json()
          setOutlookList(d.messages || [])
        } else if (source === "whatsapp") {
          const r = await fetch(`${API_BASE}/input/whatsapp/messages?limit=10`, { cache: "no-store" })
          const d = await r.json()
          setWhatsappList(d.messages || [])
        } else if (source === "telegram") {
          const r = await fetch(`${API_BASE}/input/telegram/messages?limit=10`, { cache: "no-store" })
          const d = await r.json()
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

  // Cargar detalle del correo/mensaje
  const handleFetchDetail = async (id: string) => {
    try {
      setSelectedMsgId(id)
      setLoadingDetail(true)
      let endpoint = ""
      if (source === "gmail") {
        endpoint = `${API_BASE}/input/gmail/messages/${id}`
      } else if (source === "outlook") {
        endpoint = `${API_BASE}/input/outlook/messages/${id}`
      } else if (source === "whatsapp") {
        endpoint = `${API_BASE}/input/whatsapp/messages/${id}`
      } else if (source === "telegram") {
        endpoint = `${API_BASE}/input/telegram/messages/${id}`
      }
      const r = await fetch(endpoint, { cache: "no-store" })
      const data = await r.json()
      setEmailDetail(data)
      setUseText(Boolean((data as any).text))
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

      if (source === "document") {
        if (!files.length) { alert("Seleccioná un archivo."); return }
        const fd = new FormData()
        fd.append("template_id", templateId)
        fd.append("file", files[0])
        const r = await fetch(`${API_BASE}/process/document`, { method: "POST", body: fd })
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
        const r = await fetch(`${API_BASE}/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

      else if (source === "gmail" || source === "outlook" || source === "whatsapp" || source === "telegram") {
        if (!selectedMsgId) { alert("Elegí un mensaje."); return }
        const body: any = { method: source, template_id: templateId }
        if (source === "gmail") {
          body.gmail = { message_id: selectedMsgId, use_text: useText }
          if (!useText && (emailDetail?.attachments?.length ?? 0) > 0) body.gmail.attachment_index = attachmentIndex
        } else if (source === "outlook") {
          body.outlook = { message_id: selectedMsgId, use_text: useText }
          if (!useText && (emailDetail?.attachments?.length ?? 0) > 0) body.outlook.attachment_index = attachmentIndex
        } else if (source === "whatsapp") {
          body.whatsapp = { message_id: selectedMsgId, use_text: useText }
          if (!useText && (emailDetail?.attachments?.length ?? 0) > 0) body.whatsapp.attachment_index = attachmentIndex
        } else if (source === "telegram") {
          body.telegram = { message_id: selectedMsgId, use_text: useText }
          if (!useText && (emailDetail?.attachments?.length ?? 0) > 0) body.telegram.attachment_index = attachmentIndex
        }
        const r = await fetch(`${API_BASE}/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

    } catch (e: any) {
      alert("Error: " + e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const entradaLista = useMemo(() => {
    if (source === "document") return files.length > 0
    if (source === "text") return freeText.trim().length > 0
    if (source === "gmail" || source === "outlook" || source === "whatsapp" || source === "telegram") return Boolean(selectedMsgId && (useText || (emailDetail?.attachments?.length ?? 0) > 0))
    return false
  }, [source, files, freeText, selectedMsgId, emailDetail, useText])

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
                    <p>Seleccioná el tipo de documento. Por ejemplo: facturas en PDF, correos de clientes, o mensajes.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={()=>handlePickSource("document")} className={`text-left rounded-xl border p-4 hover:shadow transition ${source==="document"?"bg-primary/10 border-primary":"bg-card"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div>
                      <div>
                        <div className="font-medium">Documentos</div>
                        <div className="text-xs text-muted-foreground">Facturas, contratos, reportes</div>
                      </div>
                    </div>
                  </button>
                  <button onClick={()=>handlePickSource("gmail")} className={`text-left rounded-xl border p-4 hover:shadow transition ${source==="gmail"?"bg-primary/10 border-primary":"bg-card"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-200/40 flex items-center justify-center"><Mail className="w-5 h-5" /></div>
                      <div>
                        <div className="font-medium">Gmail</div>
                        <div className="text-xs text-muted-foreground">Correos de clientes, pedidos</div>
                      </div>
                    </div>
                  </button>
                  <button onClick={()=>handlePickSource("outlook")} className={`text-left rounded-xl border p-4 hover:shadow transition ${source==="outlook"?"bg-primary/10 border-primary":"bg-card"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-200/40 flex items-center justify-center"><Send className="w-5 h-5" /></div>
                      <div>
                        <div className="font-medium">Outlook</div>
                        <div className="text-xs text-muted-foreground">Correos corporativos</div>
                      </div>
                    </div>
                  </button>
                  <button onClick={()=>handlePickSource("whatsapp")} className={`text-left rounded-xl border p-4 hover:shadow transition ${source==="whatsapp"?"bg-primary/10 border-primary":"bg-card"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-200/40 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-green-600" /></div>
                      <div>
                        <div className="font-medium">WhatsApp</div>
                        <div className="text-xs text-muted-foreground">Mensajes de clientes</div>
                      </div>
                    </div>
                  </button>
                  <button onClick={()=>handlePickSource("telegram")} className={`text-left rounded-xl border p-4 hover:shadow transition ${source==="telegram"?"bg-primary/10 border-primary":"bg-card"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-sky-200/40 flex items-center justify-center"><Phone className="w-5 h-5 text-sky-600" /></div>
                      <div>
                        <div className="font-medium">Telegram</div>
                        <div className="text-xs text-muted-foreground">Chats y mensajes</div>
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
                        {loadingList ? (
                          <div className="h-full flex items-center justify-center text-sm text-muted-foreground gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Cargando mensajes…
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
                          <div className="text-sm text-muted-foreground">Seleccioná un mensaje…</div>
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
                        {loadingList ? (
                          <div className="h-full flex items-center justify-center text-sm text-muted-foreground gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Cargando mensajes…
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
                          <div className="text-sm text-muted-foreground">Seleccioná un mensaje…</div>
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
                        {loadingList ? (
                          <div className="h-full flex items-center justify-center text-sm text-muted-foreground gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Cargando mensajes…
                          </div>
                        ) : (
                          (whatsappList || []).map(m => (
                            <button key={m.id} onClick={()=>handleFetchDetail(m.id)} className={`w-full text-left px-3 py-2 border-b hover:bg-muted ${selectedMsgId===m.id? "bg-muted": ""}`}>
                              <div className="text-sm font-medium">{m.subject || m.from || "(sin asunto)"}</div>
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
                          <div className="text-sm text-muted-foreground">Seleccioná un mensaje…</div>
                        ) : (
                          <>
                            <div className="flex items-center gap-4 text-sm">
                              <label className="flex items-center gap-2">
                                <input type="radio" checked={useText} onChange={()=>setUseText(true)} /> Texto
                              </label>
                              <label className="flex items-center gap-2">
                                <input type="radio" checked={!useText} onChange={()=>setUseText(false)} /> Multimedia
                              </label>
                            </div>
                            {!useText && (
                              <div>
                                <Label className="text-sm">Archivo</Label>
                                <Select value={String(attachmentIndex)} onValueChange={(v)=> setAttachmentIndex(parseInt(v))}>
                                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {(emailDetail.attachments || []).map((_,i)=>(<SelectItem key={i} value={String(i)}>Archivo #{i+1}</SelectItem>))}
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

                  {source === "telegram" && (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="border rounded-lg h-56 overflow-auto">
                        {loadingList ? (
                          <div className="h-full flex items-center justify-center text-sm text-muted-foreground gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Cargando mensajes…
                          </div>
                        ) : (
                          (telegramList || []).map(m => (
                            <button key={m.id} onClick={()=>handleFetchDetail(m.id)} className={`w-full text-left px-3 py-2 border-b hover:bg-muted ${selectedMsgId===m.id? "bg-muted": ""}`}>
                              <div className="text-sm font-medium">{m.subject || m.from || "(sin asunto)"}</div>
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
                          <div className="text-sm text-muted-foreground">Seleccioná un mensaje…</div>
                        ) : (
                          <>
                            <div className="flex items-center gap-4 text-sm">
                              <label className="flex items-center gap-2">
                                <input type="radio" checked={useText} onChange={()=>setUseText(true)} /> Texto
                              </label>
                              <label className="flex items-center gap-2">
                                <input type="radio" checked={!useText} onChange={()=>setUseText(false)} /> Multimedia
                              </label>
                            </div>
                            {!useText && (
                              <div>
                                <Label className="text-sm">Archivo</Label>
                                <Select value={String(attachmentIndex)} onValueChange={(v)=> setAttachmentIndex(parseInt(v))}>
                                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {(emailDetail.attachments || []).map((_,i)=>(<SelectItem key={i} value={String(i)}>Archivo #{i+1}</SelectItem>))}
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
                    <Select value={templateId} onValueChange={(v)=> setTemplateId(v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Elegí una plantilla" /></SelectTrigger>
                      <SelectContent>
                        {templates.map(t => (<SelectItem key={t.id} value={t.id}>{t.name}{t.description?` — ${t.description}`:""}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botón principal abajo (grande) */}
            <div className="sticky bottom-6">
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
            </div>

          </motion.div>
        </main>
      </div>
    </div>
  )
}
