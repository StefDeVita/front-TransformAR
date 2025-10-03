"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Upload,
  Settings,
  Play,
  Mail,
  FileType,
  MessageSquare,
  Phone,
  FileSpreadsheet,
  HelpCircle,
  Lightbulb,
  CheckCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"

type TemplateMeta = {
  id: string
  name: string
  description?: string | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

export default function HomePage() {
  const [sourceType, setSourceType] = useState<string>("")
  const [files, setFiles] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const router = useRouter()

  // --- Load templates from backend ---
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const r = await fetch(`${API_BASE}/templates`, { cache: "no-store" })
        if (!r.ok) throw new Error(`GET /templates ${r.status}`)
        const data = await r.json()
        setTemplates(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error loading templates:", err)
      }
    }
    loadTemplates()
  }, [])

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return sourceType !== ""
      case 2:
        // si es PDF, al menos un archivo
        return sourceType !== "pdf" || files.length > 0
      case 3:
        // plantilla seleccionada
        return selectedTemplate !== ""
      default:
        return true
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles(selectedFiles)
    if (selectedFiles.length > 0) setCurrentStep(Math.max(currentStep, 3))
  }

  // --- Helpers para UI ---
  const getSourceIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4" />
      case "gmail":
        return <Mail className="w-4 h-4" />
      case "outlook":
        return <Mail className="w-4 h-4" />
      case "texto":
        return <MessageSquare className="w-4 h-4" />
      case "whatsapp":
        return <MessageSquare className="w-4 h-4" />
      case "telegram":
        return <Phone className="w-4 h-4" />
      default:
        return <FileType className="w-4 h-4" />
    }
  }

  // --- Procesar: usa /process/document (sube y procesa sin guardar) ---
  const handleProcess = async () => {
    if (!sourceType || !selectedTemplate) {
      alert("Por favor completa todos los pasos antes de procesar")
      return
    }

    // MVP: soportamos PDF (documento manual) en una sola llamada
    if (sourceType !== "pdf") {
      alert("Por ahora, la demo procesa solo PDFs. Próximo paso: Gmail/Outlook/Text.")
      return
    }
    if (files.length === 0) {
      alert("Subí al menos un PDF")
      return
    }

    setIsProcessing(true)

    try {
      // Si hay múltiples PDFs, los procesamos en lote (1 request por archivo)
      const results: any[] = []
      for (const file of files) {
        const formData = new FormData()
        formData.append("template_id", selectedTemplate)
        formData.append("file", file)

        const r = await fetch(`${API_BASE}/process/document`, {
          method: "POST",
          body: formData,
        })
        if (!r.ok) {
          const txt = await r.text()
          throw new Error(`POST /process/document (${r.status}) ${txt}`)
        }
        const data = await r.json()
        results.push({
          fileName: file.name,
          ...data,
        })
      }

      // Guardamos data para la pantalla de resultados
      const processingData = {
        sourceType,
        selectedTemplate,
        fileCount: files.length,
        results, // [{ fileName, template_id, compiled, result }]
        when: new Date().toISOString(),
      }
      localStorage.setItem("processingData", JSON.stringify(processingData))
      router.push("/results")
    } catch (error) {
      console.error("Error processing:", error)
      alert("Error al procesar los documentos")
    } finally {
      setIsProcessing(false)
    }
  }

  // Plantillas para Select
  const templateItems = useMemo(() => {
    if (!templates?.length) return null
    return templates.map((t) => (
      <SelectItem key={t.id} value={t.id}>
        {t.name} {t.description ? `— ${t.description}` : ""}
      </SelectItem>
    ))
  }, [templates])

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-sand/5 to-primary/5">
      <SidebarNavigation />

      <div className="flex-1 flex flex-col">
        <MainHeader title="Guía Paso a Paso" />

        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <Card className="border-primary/20 shadow-lg bg-gradient-to-r from-primary/5 to-primary-hover/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-primary">Progreso del Proceso</h2>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    Paso {Math.min(currentStep, 3)} de 3
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                          isStepComplete(step)
                            ? "bg-primary text-white"
                            : step === currentStep
                              ? "bg-primary/20 text-primary border-2 border-primary"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isStepComplete(step) ? <CheckCircle className="w-4 h-4" /> : step}
                      </div>
                      {step < 3 && (
                        <div className={`w-8 h-1 mx-1 rounded ${isStepComplete(step) ? "bg-primary" : "bg-muted"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-lg bg-card dark:bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg text-card-foreground">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileType className="w-6 h-6 text-primary" />
                  </div>
                  Paso 1: ¿De dónde vienen tus documentos?
                  <div className="ml-auto">{isStepComplete(1) && <CheckCircle className="w-5 h-5 text-primary" />}</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">💡 Consejo</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Selecciona el tipo de documento que quieres procesar. Por ahora el flujo automático está optimizado para PDF.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    {
                      value: "pdf",
                      label: "Documentos",
                      description: "Facturas, contratos, reportes",
                      icon: "pdf",
                      color:
                        "from-red-500/10 to-red-600/5 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700",
                    },
                    {
                      value: "gmail",
                      label: "Gmail",
                      description: "Correos de clientes, pedidos",
                      icon: "gmail",
                      color:
                        "from-red-500/10 to-orange-500/5 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700",
                    },
                    {
                      value: "outlook",
                      label: "Outlook",
                      description: "Correos corporativos",
                      icon: "outlook",
                      color:
                        "from-blue-500/10 to-blue-600/5 border-blue-200 hover:border-blue-300 dark:border-blue-800 dark:hover:border-blue-700",
                    },
                    {
                      value: "texto",
                      label: "Texto Simple",
                      description: "Notas, descripciones",
                      icon: "texto",
                      color:
                        "from-green-500/10 to-green-600/5 border-green-200 hover:border-green-300 dark:border-green-800 dark:hover:border-green-700",
                    },
                  ].map((source) => (
                    <motion.div key={source.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={sourceType === source.value ? "default" : "outline"}
                        className={`h-24 flex-col gap-2 w-full transition-all duration-300 ${
                          sourceType === source.value
                            ? "bg-gradient-to-r from-primary to-primary-hover text-white shadow-lg border-primary/30"
                            : `bg-gradient-to-r ${source.color} hover:shadow-md`
                        }`}
                        onClick={() => {
                          setSourceType(source.value)
                          setCurrentStep(Math.max(currentStep, 2))
                        }}
                      >
                        <div className="p-1">{getSourceIcon(source.icon)}</div>
                        <div className="text-center">
                          <span className="text-sm font-medium block">{source.label}</span>
                          <span className="text-xs opacity-75">{source.description}</span>
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {sourceType === "pdf" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3 }}>
                <Card className="border-sun/30 shadow-lg bg-card dark:bg-card">
                  <CardHeader className="bg-gradient-to-r from-sun/10 to-sun/5 border-b border-sun/20">
                    <CardTitle className="flex items-center gap-3 text-lg text-card-foreground">
                      <div className="p-2 bg-sun/20 rounded-lg">
                        <Upload className="w-6 h-6 text-sun-foreground" />
                      </div>
                      Paso 2: Sube tus documentos PDF
                      <div className="ml-auto">
                        {isStepComplete(2) && <CheckCircle className="w-5 h-5 text-primary" />}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <HelpCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                          <div>
                            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                              📄 ¿Qué documentos puedo subir?
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              Facturas, recibos, contratos, reportes, o cualquier documento PDF que contenga información
                              que quieras organizar.
                            </p>
                          </div>
                        </div>
                      </div>
                      <Input
                        type="file"
                        multiple
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      {files.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">✅ Archivos listos para procesar:</Label>
                          <div className="space-y-1">
                            {files.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-sm text-muted-foreground bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800"
                              >
                                <FileText className="w-4 h-4 text-green-600" />
                                {file.name}
                                <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <Card className="border-sun/30 shadow-lg bg-card dark:bg-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-card-foreground">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sun/20 rounded-lg">
                      <FileSpreadsheet className="w-5 h-5 text-sun-foreground" />
                    </div>
                    Paso 2: Elige tu formato de salida
                    <div className="ml-2">{isStepComplete(3) && <CheckCircle className="w-5 h-5 text-primary" />}</div>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="sm" onClick={() => router.push("/templates")} className="border-sun/30 hover:bg-sun/10 hover:border-sun/50">
                      <Settings className="w-4 h-4 mr-2" />
                      Crear Nueva Plantilla
                    </Button>
                  </motion.div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-indigo-800 dark:text-indigo-200 font-medium">📊 ¿Qué es una plantilla?</p>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                        Es como una tabla de Excel que define cómo se organizarán tus datos. Usa una existente o crea una nueva.
                      </p>
                    </div>
                  </div>
                </div>

                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder={templates.length ? "Selecciona una plantilla" : "Cargando plantillas..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {templateItems}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="border-primary/30 shadow-xl bg-card dark:bg-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-card-foreground">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sun/20 rounded-lg">
                      <FileSpreadsheet className="w-5 h-5 text-sun-foreground" />
                    </div>
                    Paso 3: Transformá!!
                    <div className="ml-2">{isStepComplete(3) && <CheckCircle className="w-5 h-5 text-primary" />}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 pb-6">
                {!isStepComplete(3) && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-yellow-600" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Completa todos los pasos anteriores para poder procesar tus documentos
                      </p>
                    </div>
                  </div>
                )}
                <motion.div whileHover={{ scale: isStepComplete(3) ? 1.02 : 1 }} whileTap={{ scale: isStepComplete(3) ? 0.98 : 1 }}>
                  <Button
                    onClick={handleProcess}
                    disabled={isProcessing || !sourceType || !selectedTemplate || (sourceType === "pdf" && files.length === 0)}
                    className="w-full h-16 text-xl font-bold bg-gradient-to-r from-primary via-primary-hover to-primary shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        Procesando tus documentos...
                      </>
                    ) : (
                      <>
                        <Play className="w-6 h-6 mr-3" />🚀 ¡Transformar mis Documentos!
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  )
}