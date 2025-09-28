"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Play, Save, FileText, Zap, Code } from "lucide-react"

interface ExtractionRule {
  id: string
  field: string
  pattern: string
  type: "text" | "number" | "date" | "email"
  required: boolean
}

interface TransformationRule {
  id: string
  sourceField: string
  targetField: string
  operation: "copy" | "format" | "calculate" | "combine"
  formula?: string
}

export default function TransformationsPage() {
  const [extractionRules, setExtractionRules] = useState<ExtractionRule[]>([
    {
      id: "1",
      field: "cliente_nombre",
      pattern: "Cliente:\\s*(.+)",
      type: "text",
      required: true,
    },
    {
      id: "2",
      field: "fecha_pedido",
      pattern: "Fecha:\\s*(\\d{2}/\\d{2}/\\d{4})",
      type: "date",
      required: true,
    },
  ])

  const [transformationRules, setTransformationRules] = useState<TransformationRule[]>([
    {
      id: "1",
      sourceField: "cliente_nombre",
      targetField: "customer_name",
      operation: "copy",
    },
    {
      id: "2",
      sourceField: "fecha_pedido",
      targetField: "order_date",
      operation: "format",
      formula: "DATE(value, 'DD/MM/YYYY')",
    },
  ])

  const addExtractionRule = () => {
    const newRule: ExtractionRule = {
      id: Date.now().toString(),
      field: "",
      pattern: "",
      type: "text",
      required: false,
    }
    setExtractionRules([...extractionRules, newRule])
  }

  const removeExtractionRule = (id: string) => {
    setExtractionRules(extractionRules.filter((rule) => rule.id !== id))
  }

  const updateExtractionRule = (id: string, updates: Partial<ExtractionRule>) => {
    setExtractionRules(extractionRules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)))
  }

  const addTransformationRule = () => {
    const newRule: TransformationRule = {
      id: Date.now().toString(),
      sourceField: "",
      targetField: "",
      operation: "copy",
    }
    setTransformationRules([...transformationRules, newRule])
  }

  const removeTransformationRule = (id: string) => {
    setTransformationRules(transformationRules.filter((rule) => rule.id !== id))
  }

  const updateTransformationRule = (id: string, updates: Partial<TransformationRule>) => {
    setTransformationRules(transformationRules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)))
  }

  const handleSaveConfiguration = () => {
    // TODO: Save to backend
    console.log("Saving configuration:", { extractionRules, transformationRules })
  }

  const handleTestConfiguration = () => {
    // TODO: Test with sample document
    console.log("Testing configuration")
  }

  return (
    <div className="flex h-screen bg-background">
      <SidebarNavigation />

      <div className="flex-1 flex flex-col">
        <MainHeader title="Configuración de Transformaciones" />

        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto space-y-6"
          >
            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Instrucciones de Transformación</h2>
                <p className="text-muted-foreground">Define reglas para extraer y transformar datos de documentos</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleTestConfiguration}>
                  <Play className="w-4 h-4 mr-2" />
                  Probar
                </Button>
                <Button onClick={handleSaveConfiguration} className="bg-primary hover:bg-primary-hover">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>

            <Tabs defaultValue="extraction" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="extraction" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Extracción de Datos
                </TabsTrigger>
                <TabsTrigger value="transformation" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Transformación
                </TabsTrigger>
              </TabsList>

              {/* Extraction Rules Tab */}
              <TabsContent value="extraction" className="space-y-6">
                <Card>
                  <CardHeader className="bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          Reglas de Extracción
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Define patrones para extraer información específica de los documentos
                        </p>
                      </div>
                      <Button onClick={addExtractionRule} size="sm" className="bg-primary hover:bg-primary-hover">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Regla
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {extractionRules.map((rule, index) => (
                        <motion.div
                          key={rule.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 border border-border rounded-lg bg-muted/20"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <Label htmlFor={`field-${rule.id}`} className="text-sm font-medium">
                                Campo
                              </Label>
                              <Input
                                id={`field-${rule.id}`}
                                value={rule.field}
                                onChange={(e) => updateExtractionRule(rule.id, { field: e.target.value })}
                                placeholder="nombre_campo"
                                className="mt-1"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor={`pattern-${rule.id}`} className="text-sm font-medium">
                                Patrón de Extracción (RegEx)
                              </Label>
                              <Input
                                id={`pattern-${rule.id}`}
                                value={rule.pattern}
                                onChange={(e) => updateExtractionRule(rule.id, { pattern: e.target.value })}
                                placeholder="Cliente:\s*(.+)"
                                className="mt-1 font-mono text-sm"
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <Label className="text-sm font-medium">Tipo</Label>
                                <Select
                                  value={rule.type}
                                  onValueChange={(value: any) => updateExtractionRule(rule.id, { type: value })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Texto</SelectItem>
                                    <SelectItem value="number">Número</SelectItem>
                                    <SelectItem value="date">Fecha</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExtractionRule(rule.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={rule.required}
                                onChange={(e) => updateExtractionRule(rule.id, { required: e.target.checked })}
                                className="rounded border-border"
                              />
                              Campo requerido
                            </label>
                            <Badge variant={rule.type === "text" ? "default" : "secondary"} className="text-xs">
                              {rule.type}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transformation Rules Tab */}
              <TabsContent value="transformation" className="space-y-6">
                <Card>
                  <CardHeader className="bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-primary" />
                          Reglas de Transformación
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Define cómo transformar los datos extraídos al formato de salida
                        </p>
                      </div>
                      <Button onClick={addTransformationRule} size="sm" className="bg-primary hover:bg-primary-hover">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Transformación
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {transformationRules.map((rule, index) => (
                        <motion.div
                          key={rule.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 border border-border rounded-lg bg-muted/20"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                              <Label htmlFor={`source-${rule.id}`} className="text-sm font-medium">
                                Campo Origen
                              </Label>
                              <Input
                                id={`source-${rule.id}`}
                                value={rule.sourceField}
                                onChange={(e) => updateTransformationRule(rule.id, { sourceField: e.target.value })}
                                placeholder="campo_origen"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`target-${rule.id}`} className="text-sm font-medium">
                                Campo Destino
                              </Label>
                              <Input
                                id={`target-${rule.id}`}
                                value={rule.targetField}
                                onChange={(e) => updateTransformationRule(rule.id, { targetField: e.target.value })}
                                placeholder="campo_destino"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Operación</Label>
                              <Select
                                value={rule.operation}
                                onValueChange={(value: any) => updateTransformationRule(rule.id, { operation: value })}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="copy">Copiar</SelectItem>
                                  <SelectItem value="format">Formatear</SelectItem>
                                  <SelectItem value="calculate">Calcular</SelectItem>
                                  <SelectItem value="combine">Combinar</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`formula-${rule.id}`} className="text-sm font-medium">
                                Fórmula
                              </Label>
                              <Input
                                id={`formula-${rule.id}`}
                                value={rule.formula || ""}
                                onChange={(e) => updateTransformationRule(rule.id, { formula: e.target.value })}
                                placeholder="UPPER(value)"
                                className="mt-1 font-mono text-sm"
                                disabled={rule.operation === "copy"}
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTransformationRule(rule.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Preview Section */}
            <Card>
              <CardHeader className="bg-sand/30">
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  Vista Previa de Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 text-sm text-muted-foreground">Reglas de Extracción</h4>
                    <div className="bg-muted/30 rounded-lg p-4 font-mono text-sm">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(extractionRules, null, 2)}</pre>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3 text-sm text-muted-foreground">Reglas de Transformación</h4>
                    <div className="bg-muted/30 rounded-lg p-4 font-mono text-sm">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(transformationRules, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
