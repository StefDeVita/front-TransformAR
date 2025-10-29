"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  FileSpreadsheet,
  Plus,
  Edit,
  Trash2,
  Download,
  Copy,
  Eye,
  Settings,
  Save,
  HelpCircle,
  Lightbulb,
  CheckCircle,
} from "lucide-react"

interface ExcelTemplate {
  id: string
  name: string
  description: string
  columns: number
  rows: number
  createdAt: string
  lastModified: string
  headers: string[]
  data: string[][]
  status: "active" | "draft"
}

const mockTemplates: ExcelTemplate[] = [
  {
    id: "1",
    name: "Pedido",
    description: "Plantilla para reportes mensuales de ventas",
    columns: 3,
    rows: 10,
    createdAt: "2025-10-03",
    lastModified: "2025-10-03",
    headers: ["nombre_del_cliente", "fecha", "descripcion_productos"],
    data: [
      ["Nombre", "dd/mm/aaaa", "pasala a aleman"],
    ],
    status: "active",
  }
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ExcelTemplate[]>(mockTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<ExcelTemplate | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleCreateTemplate = () => {
    setIsCreateDialogOpen(true)
  }

  const handleEditTemplate = (template: ExcelTemplate) => {
    setSelectedTemplate(template)
    setIsEditDialogOpen(true)
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter((t) => t.id !== templateId))
  }

  const handleDuplicateTemplate = (template: ExcelTemplate) => {
    const newTemplate: ExcelTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copia)`,
      status: "draft",
      createdAt: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString().split("T")[0],
    }
    setTemplates([...templates, newTemplate])
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        <SidebarNavigation />

        <div className="flex-1 flex flex-col">
          <MainHeader title="📊 Mis Plantillas" showUploadButton={true} onUploadClick={handleCreateTemplate} />

          <main className="flex-1 p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-7xl mx-auto space-y-6"
            >
              <Card className="bg-gradient-to-r from-primary/10 via-primary-hover/10 to-sand/20 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold text-foreground">¿Qué son las Plantillas?</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Son como tablas de Excel que definen cómo quiere que se vean sus reportes
                        finales. Por ejemplo, puede crear un formato que organice automáticamente
                        los datos en columnas como "Cliente", "Fecha", "Monto", etc. ¡Es como tener un asistente que
                        ordena todo por usted!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">{templates.length}</p>
                        <p className="text-sm text-muted-foreground">Formatos Creados</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {templates.filter((t) => t.status === "active").length}
                        </p>
                        <p className="text-sm text-muted-foreground">Listos para Usar</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-sun/20 rounded-lg flex items-center justify-center">
                        <Settings className="w-6 h-6 text-sun" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-sun">
                          {templates.filter((t) => t.status === "draft").length}
                        </p>
                        <p className="text-sm text-muted-foreground">En Preparación</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg font-semibold">Plantillas</CardTitle>
                    </div>
                    <Button onClick={handleCreateTemplate} className="bg-primary hover:bg-primary-hover">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Nuevo Formato
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {templates.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">¡Comience creando su primer formato!</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Los formatos le ayudan a organizar automáticamente la información extraída de sus documentos en
                        planillas Excel ordenadas y profesionales.
                      </p>
                      <Button onClick={handleCreateTemplate} className="bg-primary hover:bg-primary-hover">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Mi Primer Formato
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {templates.map((template, index) => (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="hover:shadow-lg transition-all duration-200 group border-l-4 border-l-primary/20 hover:border-l-primary">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-sm">{template.name}</h3>
                                    <Badge
                                      variant={template.status === "active" ? "default" : "secondary"}
                                      className={`text-xs mt-1 ${
                                        template.status === "active"
                                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                          : "bg-sun/20 text-sun-foreground"
                                      }`}
                                    >
                                      {template.status === "active" ? "✓ Listo" : "⚠ En preparación"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{template.description}</p>

                              <div className="space-y-2 mb-4 bg-muted/30 p-3 rounded-lg">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Columnas de datos:</span>
                                  <span className="font-medium text-primary">{template.columns}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Campos configurados:</span>
                                  <span className="font-medium text-primary">{template.headers.length}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Última modificación:</span>
                                  <span className="font-medium">
                                    {new Date(template.lastModified).toLocaleDateString("es-AR")}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(template)}>
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar formato</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => handleDuplicateTemplate(template)}>
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Hacer una copia</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteTemplate(template.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Eliminar formato</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </main>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>🎯 Crear Plantilla</DialogTitle>
            </DialogHeader>
            <CreateTemplateForm onClose={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>✏️ Editar Plantilla: {selectedTemplate?.name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {selectedTemplate && (
                <EditTemplateForm template={selectedTemplate} onClose={() => setIsEditDialogOpen(false)} />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

function CreateTemplateForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    columns: 5,
    rows: 10,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Create template logic
    console.log("Creating template:", formData)
    onClose()
  }

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm mb-1">¿Cómo funciona esto?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Está creando un formato que define cómo se organizarán sus datos en Excel. Piense en las columnas que
              necesita (como "Cliente", "Fecha", "Monto") y cuántas filas de información espera procesar habitualmente.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nombre del Formato</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Facturas de Clientes, Control de Stock..."
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use un nombre que describa qué tipo de documentos va a procesar
            </p>
          </div>
          <div>
            <Label htmlFor="description">¿Para qué lo va a usar?</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej: Para organizar las facturas mensuales de mis clientes"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Descripción breve para recordar el propósito de este formato
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="columns">¿Cuántas columnas necesita?</Label>
            <Input
              id="columns"
              type="number"
              min="1"
              max="50"
              value={formData.columns}
              onChange={(e) => setFormData({ ...formData, columns: Number.parseInt(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ej: Cliente, Fecha, Producto, Cantidad, Total = 5 columnas
            </p>
          </div>
          <div>
            <Label htmlFor="rows">¿Cuántas filas de datos espera?</Label>
            <Input
              id="rows"
              type="number"
              min="1"
              max="1000"
              value={formData.rows}
              onChange={(e) => setFormData({ ...formData, rows: Number.parseInt(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cantidad aproximada de registros que procesará habitualmente
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary-hover">
            <Plus className="w-4 h-4 mr-2" />
            Crear Mi Formato
          </Button>
        </div>
      </form>
    </div>
  )
}

function EditTemplateForm({ template, onClose }: { template: ExcelTemplate; onClose: () => void }) {
  const [headers, setHeaders] = useState<string[]>(template.headers)
  const [data, setData] = useState<string[][]>(template.data)
  const [templateInfo, setTemplateInfo] = useState({
    name: template.name,
    description: template.description,
  })

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...headers]
    newHeaders[index] = value
    setHeaders(newHeaders)
  }

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data]
    if (!newData[rowIndex]) {
      newData[rowIndex] = new Array(headers.length).fill("")
    }
    newData[rowIndex][colIndex] = value
    setData(newData)
  }

  const addColumn = () => {
    setHeaders([...headers, "Nueva Columna"])
    const newData = data.map((row) => [...row, ""])
    setData(newData)
  }

  const addRow = () => {
    setData([...data, new Array(headers.length).fill("")])
  }

  const removeColumn = (index: number) => {
    if (headers.length > 1) {
      setHeaders(headers.filter((_, i) => i !== index))
      setData(data.map((row) => row.filter((_, i) => i !== index)))
    }
  }

  const removeRow = (index: number) => {
    if (data.length > 1) {
      setData(data.filter((_, i) => i !== index))
    }
  }

  const getColumnLetter = (index: number): string => {
    let result = ""
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result
      index = Math.floor(index / 26) - 1
    }
    return result
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <Tabs defaultValue="table" className="flex-1 flex flex-col space-y-4">
        <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
          <TabsTrigger value="table">📊 Diseñar Mi Excel</TabsTrigger>
          <TabsTrigger value="settings">⚙️ Información General</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="flex-1 flex flex-col space-y-4">
          <div className="bg-gradient-to-r from-primary/5 to-sand/10 border border-primary/20 rounded-lg p-4 flex-shrink-0">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">Diseñe su Plantilla como un Excel</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Esta tabla funciona igual que Excel. La primera fila son los títulos de las columnas (encabezados). En
                  la fila siguiente, describa cómo quiere que aparezca información extraída de sus documentos.
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-primary/20 rounded"></div>
                    <span>Encabezados (títulos)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-background border rounded"></div>
                    <span>Formatos deseados</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between flex-shrink-0">
            <h3 className="text-lg font-semibold">Su Formato de Excel</h3>
            <div className="flex gap-2">
              <Button onClick={addColumn} size="sm" variant="outline" className="text-xs bg-transparent">
                <Plus className="w-3 h-3 mr-1" />Columna
              </Button>
            </div>
          </div>

          <div className="flex-1 border border-border rounded-lg overflow-hidden bg-white dark:bg-card">
            <div className="h-full overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="w-12 h-8 border-r border-border bg-muted text-xs font-medium text-center">#</th>
                    {headers.map((_, index) => (
                      <th
                        key={index}
                        className="min-w-32 h-8 border-r border-border bg-muted text-xs font-medium text-center"
                      >
                        {getColumnLetter(index)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-primary/5">
                    <td className="w-12 h-10 border-r border-b border-border bg-muted text-xs font-medium text-center">
                      1
                    </td>
                    {headers.map((header, index) => (
                      <td key={index} className="border-r border-b border-border p-0">
                        <Input
                          value={header}
                          onChange={(e) => updateHeader(index, e.target.value)}
                          className="border-0 rounded-none h-10 bg-primary/5 font-medium text-center"
                          placeholder="Título de columna"
                        />
                      </td>
                    ))}
                  </tr>
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="w-12 h-10 border-r border-b border-border bg-muted text-xs font-medium text-center">
                        {rowIndex + 2}
                      </td>
                      {headers.map((_, colIndex) => (
                        <td key={colIndex} className="border-r border-b border-border p-0">
                          <Input
                            value={row[colIndex] || ""}
                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                            className="border-0 rounded-none h-10 text-center"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gradient-to-r from-sand/20 to-sun/10 border border-sun/30 rounded-lg p-4 flex-shrink-0">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-sun/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-sun" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2 text-sun-foreground">💡 Ejemplos prácticos para PyMEs</h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="font-medium mb-1">📄 Para facturas:</p>
                    <p className="text-muted-foreground">
                      Encabezados: Cliente | Fecha | N° Factura | Subtotal | IVA | Total
                      <br />
                      Datos: <code className="bg-background px-1 rounded">{"{{cliente}}"}</code> |{" "}
                      <code className="bg-background px-1 rounded">{"{{fecha}}"}</code> |{" "}
                      <code className="bg-background px-1 rounded">{"{{numero}}"}</code> |{" "}
                      <code className="bg-background px-1 rounded">{"{{subtotal}}"}</code> |{" "}
                      <code className="bg-background px-1 rounded">{"{{iva}}"}</code> |{" "}
                      <code className="bg-background px-1 rounded">{"{{total}}"}</code>
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">📦 Para inventario:</p>
                    <p className="text-muted-foreground">
                      Encabezados: Código | Producto | Stock | Precio
                      <br />
                      Datos: <code className="bg-background px-1 rounded">{"{{codigo}}"}</code> |{" "}
                      <code className="bg-background px-1 rounded">{"{{producto}}"}</code> |{" "}
                      <code className="bg-background px-1 rounded">{"{{stock}}"}</code> |{" "}
                      <code className="bg-background px-1 rounded">{"{{precio}}"}</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={templateInfo.name}
                    onChange={(e) => setTemplateInfo({ ...templateInfo, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Input
                    value={templateInfo.description}
                    onChange={(e) => setTemplateInfo({ ...templateInfo, description: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Columnas:</span>
                  <span className="text-sm font-medium">{headers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Filas de datos:</span>
                  <span className="text-sm font-medium">{data.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Campos mapeados:</span>
                  <span className="text-sm font-medium">
                    {data.flat().filter((cell) => cell.includes("{{")).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button className="bg-primary hover:bg-primary-hover">
          <Save className="w-4 h-4 mr-2" />
          Guardar Mi Formato
        </Button>
      </div>
    </div>
  )
}
