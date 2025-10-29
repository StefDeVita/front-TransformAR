"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Download, FileSpreadsheet, CheckCircle, Info } from "lucide-react"
import { useRouter } from "next/navigation"

type FileResult = {
  fileName?: string
  template_id: string
  compiled: { extract_instr: string; transform_instr: string }
  result: any // normalmente Array<Record<string, any>> o un objeto
}

type ProcessingData = {
  sourceType: string
  selectedTemplate: string
  fileCount: number
  results: FileResult[]
  when: string
}

function isArrayOfRecords(x: any): x is Record<string, any>[] {
  return Array.isArray(x) && x.every((r) => r && typeof r === "object" && !Array.isArray(r))
}

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return ""
  const headers = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k))
      return set
    }, new Set<string>())
  )
  const esc = (v: any) => {
    if (v === null || v === undefined) return ""
    const s = typeof v === "string" ? v : JSON.stringify(v)
    const needsQuote = /[",\n;]/.test(s)
    return needsQuote ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))]
  return lines.join("\n")
}

export default function ResultsPage() {
  const [processingData, setProcessingData] = useState<ProcessingData | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const router = useRouter()

  useEffect(() => {
    const data = localStorage.getItem("processingData")
    if (!data) {
      router.push("/")
      return
    }
    try {
      const parsed: ProcessingData = JSON.parse(data)
      setProcessingData(parsed)
    } catch {
      router.push("/")
    }
  }, [router])

  const allTabularRows = useMemo(() => {
    if (!processingData) return []
    const rows: Record<string, any>[] = []
    for (const fr of processingData.results || []) {
      if (isArrayOfRecords(fr.result)) rows.push(...fr.result)
    }
    return rows
  }, [processingData])

  const exportAllCSV = () => {
    if (!allTabularRows.length) {
      alert("No hay datos tabulares para exportar (el resultado no es una lista de objetos).")
      return
    }
    const csv = toCSV(allTabularRows)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transformar_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!processingData) return <div className="p-6">Cargando…</div>

  return (
    <div className="flex h-screen bg-background">
      <SidebarNavigation />

      <div className="flex-1 flex flex-col">
        <MainHeader title="Resultados del Procesamiento" />

        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto space-y-6"
          >
            {/* Resumen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fuente</p>
                  <Badge variant="outline">{processingData.sourceType.toUpperCase()}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plantilla</p>
                  <Badge className="bg-primary/10 text-primary">{processingData.selectedTemplate}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Archivos</p>
                  <Badge variant="secondary">{processingData.fileCount}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <Badge variant="outline">
                    {new Date(processingData.when).toLocaleString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Acciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Exportación
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3 flex-wrap">
                <Button onClick={exportAllCSV} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar CSV (todos)
                </Button>
                
              </CardContent>
            </Card>

            {/* Resultados por archivo */}
            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(processingData.results || []).map((fr, idx) => {
                  const isOpen = expanded.has(idx)
                  const fileName = `archivo_${idx + 1}`
                  const asRows = isArrayOfRecords(fr.result)
                  const sampleRow = asRows ? fr.result[0] : null
                  const headers = sampleRow ? Object.keys(sampleRow) : []

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                    >
                      <Collapsible>
                        <CollapsibleTrigger
                          onClick={() => {
                            const next = new Set(expanded)
                            if (next.has(idx)) next.delete(idx)
                            else next.add(idx)
                            setExpanded(next)
                          }}
                          className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <span className="font-medium">{fileName}</span>
                            <Badge variant="outline">{fr.template_id}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">click para ver detalle</span>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="mt-4 space-y-4">
                          {/* Instrucciones compiladas */}
                          <Card className="border-primary/20">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Instrucciones compiladas</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">extract_instr</p>
                                <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                                  {fr.compiled?.extract_instr}
                                </pre>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">transform_instr</p>
                                <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                                  {fr.compiled?.transform_instr}
                                </pre>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Resultado */}
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Resultado</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {asRows && headers.length ? (
                                <div className="w-full overflow-auto">
                                  <table className="w-full text-sm border rounded">
                                    <thead className="bg-muted/50">
                                      <tr>
                                        {headers.map((h) => (
                                          <th key={h} className="text-left p-2 border-b">{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {fr.result.map((row: Record<string, any>, i: number) => (
                                        <tr key={i} className="border-b hover:bg-muted/20">
                                          {headers.map((h) => (
                                            <td key={h} className="p-2 align-top">
                                              {typeof row[h] === "object" ? JSON.stringify(row[h]) : String(row[h] ?? "")}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-80">
                                  {JSON.stringify(fr.result, null, 2)}
                                </pre>
                              )}
                            </CardContent>
                          </Card>
                        </CollapsibleContent>
                      </Collapsible>
                    </motion.div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
