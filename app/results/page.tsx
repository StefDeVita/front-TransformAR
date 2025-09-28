"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Download, FileSpreadsheet, RotateCcw, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProcessingResult {
  id: string
  fileName: string
  status: "success" | "error" | "processing"
  extractedData: any
  transformedData: any
  timestamp: string
}

export default function ResultsPage() {
  const [processingData, setProcessingData] = useState<any>(null)
  const [results, setResults] = useState<ProcessingResult[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    const data = localStorage.getItem("processingData")
    if (data) {
      const parsed = JSON.parse(data)
      setProcessingData(parsed)
      setSelectedTemplate(parsed.selectedTemplate)

      // Simulate processing results
      const mockResults: ProcessingResult[] = Array.from({ length: 1 }, (_, i) => ({
        id: `result-${i + 1}`,
        fileName: `documento_${i + 1}.pdf`,
        status: "success",
        extractedData: {
          nombre: `Cliente ${i + 1}`,
          fecha: "2024-01-15",
          monto: (Math.random() * 1000 + 100).toFixed(2),
          direccion: `Calle Falsa ${123 + i}`,
          telefono: `+54 11 ${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
        },
        transformedData: {
          customer_name: `Cliente ${i + 1}`,
          invoice_date: "15/01/2024",
          total_amount: `$${(Math.random() * 1000 + 100).toFixed(2)}`,
          formatted_address: `Calle Falsa ${123 + i}, Buenos Aires, Argentina`,
          contact_phone: `+54 11 ${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
        },
        timestamp: new Date().toISOString(),
      }))

      setResults(mockResults)
    } else {
      router.push("/")
    }
  }, [router])

  const toggleExpanded = (resultId: string) => {
    const newExpanded = new Set(expandedResults)
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId)
    } else {
      newExpanded.add(resultId)
    }
    setExpandedResults(newExpanded)
  }

  const handleExportCSV = () => {
    const csvData = results.map((result) => result.transformedData)
    console.log("Exporting CSV:", csvData)
    // TODO: Implement actual CSV export
    alert("Exportando a CSV...")
  }

  const handleExportXLSX = () => {
    const xlsxData = results.map((result) => result.transformedData)
    console.log("Exporting XLSX:", xlsxData)
    // TODO: Implement actual XLSX export
    alert("Exportando a Excel...")
  }

  const handleReprocess = async () => {
    if (!selectedTemplate || !processingData) return

    const updatedData = { ...processingData, selectedTemplate }
    localStorage.setItem("processingData", JSON.stringify(updatedData))

    // TODO: Make actual API call to reprocess
    alert(`Reprocesando con plantilla: ${selectedTemplate}`)
    window.location.reload()
  }

  if (!processingData) {
    return <div>Cargando...</div>
  }

  return (
    <div className="flex h-screen bg-background">
      <SidebarNavigation />

      <div className="flex-1 flex flex-col">
        <MainHeader title="Resultados del Procesamiento" />

        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto space-y-6"
          >
            {/* Processing Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Resumen del Procesamiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fuente</p>
                    <Badge variant="outline">{processingData.sourceType.toUpperCase()}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Plantilla Utilizada</p>
                    <Badge className="bg-primary/10 text-primary">{processingData.selectedTemplate}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Badge className="bg-green-100 text-green-800">Completado</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones de Exportación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={handleExportCSV} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </Button>
                  <Button
                    onClick={handleExportXLSX}
                    variant="outline"
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Exportar XLSX
                  </Button>
                  <div className="flex items-center gap-2">
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Seleccionar plantilla" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facturacion">Plantilla de Facturación</SelectItem>
                        <SelectItem value="inventario">Plantilla de Inventario</SelectItem>
                        <SelectItem value="clientes">Plantilla de Clientes</SelectItem>
                        <SelectItem value="pedidos">Plantilla de Pedidos</SelectItem>
                        <SelectItem value="reportes">Plantilla de Reportes</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleReprocess}
                      variant="outline"
                      disabled={selectedTemplate === processingData.selectedTemplate}
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reprocesar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>Resultados Detallados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Collapsible>
                      <CollapsibleTrigger
                        onClick={() => toggleExpanded(result.id)}
                        className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedResults.has(result.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <span className="font-medium">{result.fileName}</span>
                          <Badge
                            className={
                              result.status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }
                          >
                            {result.status === "success" ? "Éxito" : "Error"}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(result.timestamp).toLocaleString()}
                        </span>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="mt-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2 text-sm">Datos Extraídos</h4>
                            <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-48">
                              {JSON.stringify(result.extractedData, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2 text-sm">Datos Transformados</h4>
                            <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-48">
                              {JSON.stringify(result.transformedData, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
