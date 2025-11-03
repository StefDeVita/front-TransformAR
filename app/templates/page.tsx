"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
  FileSpreadsheet,
  Plus,
  Edit,
  Trash2,
  Copy,
  Save,
  X,
  Lightbulb,
  CheckCircle,
  Loader2,
  GripVertical,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

interface GridColumn {
  col: string  // Letra de columna: "A", "B", "C", etc.
  title: string  // Descripción del dato a extraer
  example: string  // Instrucción de transformación
}

interface GridTemplate {
  id: string
  name: string
  description: string
  columns: GridColumn[]
}

// Helper: convierte número de columna a letra (0->A, 1->B, ..., 26->AA)
function numToCol(num: number): string {
  let result = ""
  let n = num
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26) - 1
  }
  return result
}

export default function TemplatesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<GridTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<GridTemplate | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<GridTemplate | null>(null)
  const [loading, setLoading] = useState(false)

  // Verificar autenticación
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/login")
    }
  }, [router])

  // Cargar plantillas del backend
  useEffect(() => {
    loadTemplates()
  }, [])

  // Normalizar template para asegurar que tenga la estructura correcta
  const normalizeTemplate = (template: any): GridTemplate => {
    return {
      id: template.id || "",
      name: template.name || "Sin nombre",
      description: template.description || "",
      columns: Array.isArray(template.columns) ? template.columns : [],
    }
  }

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("authToken")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
        headers["ngrok-skip-browser-warning"]= "true"

      }

      const response = await fetch(`${API_BASE}/templates`, {
        headers,
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        const normalizedTemplates = Array.isArray(data) ? data.map(normalizeTemplate) : []
        setTemplates(normalizedTemplates)
      }
    } catch (error) {
      console.error("Error loading templates:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las plantillas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    setIsCreateDialogOpen(true)
  }

  const handleEditTemplate = (template: GridTemplate) => {
    setSelectedTemplate(template)
    setIsEditDialogOpen(true)
  }

  const handleDeleteTemplate = (template: GridTemplate) => {
    setTemplateToDelete(template)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return

    try {
      const token = localStorage.getItem("authToken")
      const headers: HeadersInit = {}
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
        headers["ngrok-skip-browser-warning"]= "true"
      }

      const response = await fetch(`${API_BASE}/templates/${templateToDelete.id}`, {
        method: "DELETE",
        headers,
      })

      if (!response.ok) {
        throw new Error("Error al eliminar la plantilla")
      }

      setTemplates(templates.filter((t) => t.id !== templateToDelete.id))
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla se eliminó correctamente",
      })
      setIsDeleteDialogOpen(false)
      setTemplateToDelete(null)
    } catch (error: any) {
      console.error("Error deleting template:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la plantilla",
        variant: "destructive",
      })
    }
  }

  const handleDuplicateTemplate = async (template: GridTemplate) => {
    try {
      const token = localStorage.getItem("authToken")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
        headers["ngrok-skip-browser-warning"]= "true"
      }

      // Generar nuevo ID para la plantilla duplicada
      const newId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const newTemplate: GridTemplate = {
        id: newId,
        name: `${template.name} (Copia)`,
        description: template.description,
        columns: template.columns.map(col => ({ ...col })), // Clonar columnas
      }

      const response = await fetch(`${API_BASE}/templates`, {
        method: "POST",
        headers,
        body: JSON.stringify(newTemplate),
      })

      if (!response.ok) {
        throw new Error("Error al duplicar la plantilla")
      }

      const createdTemplate = await response.json()
      setTemplates([...templates, normalizeTemplate(createdTemplate)])
      toast({
        title: "Plantilla duplicada",
        description: "La plantilla se duplicó correctamente",
      })
    } catch (error: any) {
      console.error("Error duplicating template:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo duplicar la plantilla",
        variant: "destructive",
      })
    }
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
                        Son formatos que definen qué información extraer de sus documentos y cómo organizarla.
                        Por ejemplo, puede definir columnas como "Cliente", "Fecha", "Monto" y el sistema
                        extraerá automáticamente esos datos de cada documento.
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
                        <p className="text-sm text-muted-foreground">Plantillas Creadas</p>
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
                          {templates.reduce((sum, t) => sum + t.columns.length, 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Columnas Totales</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {templates.length > 0 ? Math.round(templates.reduce((sum, t) => sum + t.columns.length, 0) / templates.length) : 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Promedio por Plantilla</p>
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
                      Crear Nueva Plantilla
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">¡Comience creando su primera plantilla!</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Las plantillas le ayudan a extraer información específica de sus documentos automáticamente.
                      </p>
                      <Button onClick={handleCreateTemplate} className="bg-primary hover:bg-primary-hover">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Mi Primera Plantilla
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
                                    <Badge variant="secondary" className="text-xs mt-1">
                                      {template.columns.length} columnas
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{template.description || "Sin descripción"}</p>

                              <div className="space-y-1 mb-4 bg-muted/30 p-3 rounded-lg max-h-32 overflow-y-auto">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Columnas:</p>
                                {template.columns.map((col) => (
                                  <div key={col.col} className="text-xs flex gap-2">
                                    <span className="font-mono font-bold text-primary">{col.col}:</span>
                                    <span className="text-foreground">{col.title}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditTemplate(template)}
                                      className="flex-1"
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Editar
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar plantilla</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDuplicateTemplate(template)}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Duplicar</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteTemplate(template)}
                                      className="text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Eliminar</TooltipContent>
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

        {/* Dialog de Crear */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Plantilla</DialogTitle>
            </DialogHeader>
            <CreateTemplateForm
              onClose={() => setIsCreateDialogOpen(false)}
              onSuccess={loadTemplates}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog de Editar */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Plantilla</DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <EditTemplateForm
                template={selectedTemplate}
                onClose={() => setIsEditDialogOpen(false)}
                onSuccess={loadTemplates}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmar Eliminación */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Eliminar Plantilla
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <p className="text-sm text-foreground">
                  ¿Estás seguro de que querés eliminar la plantilla{" "}
                  <span className="font-semibold">{templateToDelete?.name}</span>?
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false)
                    setTemplateToDelete(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Plantilla
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

// Componente de columna arrastrable
interface SortableColumnProps {
  id: string
  col: GridColumn
  index: number
  onUpdate: (index: number, field: keyof GridColumn, value: string) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

function SortableColumn({ id, col, index, onUpdate, onRemove, canRemove }: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card ref={setNodeRef} style={style} className={`p-4 ${isDragging ? "shadow-lg" : ""}`}>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing touch-none hover:bg-accent rounded p-1"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="font-mono font-bold text-primary">{col.col}</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <Label className="text-xs">Título *</Label>
              <Input
                value={col.title}
                onChange={(e) => onUpdate(index, "title", e.target.value)}
                placeholder="Ej: Cliente, Fecha, Monto"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Instrucciones (opcional)</Label>
              <Textarea
                value={col.example}
                onChange={(e) => onUpdate(index, "example", e.target.value)}
                placeholder="Ej: formato dd/mm/yyyy"
                rows={2}
              />
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

function CreateTemplateForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [columns, setColumns] = useState<GridColumn[]>([
    { col: "A", title: "", example: "" }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((_, i) => `column-${i}` === active.id)
        const newIndex = items.findIndex((_, i) => `column-${i}` === over.id)

        const reorderedColumns = arrayMove(items, oldIndex, newIndex)
        // Actualizar las letras de las columnas
        return reorderedColumns.map((col, idx) => ({
          ...col,
          col: numToCol(idx)
        }))
      })
    }
  }

  const addColumn = () => {
    const nextCol = numToCol(columns.length)
    setColumns([...columns, { col: nextCol, title: "", example: "" }])
  }

  const removeColumn = (index: number) => {
    if (columns.length > 1) {
      const newColumns = columns.filter((_, i) => i !== index)
      // Actualizar las letras de las columnas
      setColumns(newColumns.map((col, idx) => ({
        ...col,
        col: numToCol(idx)
      })))
    }
  }

  const updateColumn = (index: number, field: keyof GridColumn, value: string) => {
    const newColumns = [...columns]
    newColumns[index] = { ...newColumns[index], [field]: value }
    setColumns(newColumns)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que todas las columnas tengan título
    if (columns.some(col => !col.title.trim())) {
      toast({
        title: "Error",
        description: "Todas las columnas deben tener un título",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("authToken")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
        headers["ngrok-skip-browser-warning"]= "true"
      }

      // Generar ID único para la nueva plantilla
      const newId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const templateData: GridTemplate = {
        id: newId,
        name: formData.name,
        description: formData.description,
        columns: columns,
      }

      const response = await fetch(`${API_BASE}/templates`, {
        method: "POST",
        headers,
        body: JSON.stringify(templateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error al crear la plantilla")
      }

      toast({
        title: "Plantilla creada",
        description: "La plantilla se creó correctamente",
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error creating template:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la plantilla",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm mb-1">¿Cómo funciona esto?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Defina las columnas que desea extraer de sus documentos. Por ejemplo: "Cliente", "Fecha de Factura", "Monto Total".
              Puede agregar instrucciones opcionales para cada columna (ej: "formato dd/mm/yyyy").
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="name">Nombre de la Plantilla *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Facturas de Clientes"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej: Plantilla para procesar facturas de clientes y extraer información clave"
              rows={2}
            />
          </div>
        </div>

        <div>
          <Label className="mb-3 block">Columnas</Label>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map((_, i) => `column-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {columns.map((col, index) => (
                  <SortableColumn
                    key={`column-${index}`}
                    id={`column-${index}`}
                    col={col}
                    index={index}
                    onUpdate={updateColumn}
                    onRemove={removeColumn}
                    canRemove={columns.length > 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addColumn}
            className="w-full mt-3"
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar Columna
          </Button>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Crear Plantilla
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

function EditTemplateForm({ template, onClose, onSuccess }: { template: GridTemplate; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description,
  })
  const [columns, setColumns] = useState<GridColumn[]>(template.columns.map(col => ({ ...col })))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((_, i) => `column-${i}` === active.id)
        const newIndex = items.findIndex((_, i) => `column-${i}` === over.id)

        const reorderedColumns = arrayMove(items, oldIndex, newIndex)
        // Actualizar las letras de las columnas
        return reorderedColumns.map((col, idx) => ({
          ...col,
          col: numToCol(idx)
        }))
      })
    }
  }

  const addColumn = () => {
    const nextCol = numToCol(columns.length)
    setColumns([...columns, { col: nextCol, title: "", example: "" }])
  }

  const removeColumn = (index: number) => {
    if (columns.length > 1) {
      const newColumns = columns.filter((_, i) => i !== index)
      // Actualizar las letras de las columnas
      setColumns(newColumns.map((col, idx) => ({
        ...col,
        col: numToCol(idx)
      })))
    }
  }

  const updateColumn = (index: number, field: keyof GridColumn, value: string) => {
    const newColumns = [...columns]
    newColumns[index] = { ...newColumns[index], [field]: value }
    setColumns(newColumns)
  }

  const handleSave = async () => {
    // Validar que todas las columnas tengan título
    if (columns.some(col => !col.title.trim())) {
      toast({
        title: "Error",
        description: "Todas las columnas deben tener un título",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("authToken")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
        headers["ngrok-skip-browser-warning"]= "true"
      }

      const updatedTemplate: GridTemplate = {
        id: template.id,
        name: formData.name,
        description: formData.description,
        columns: columns,
      }

      // El backend usa POST para upsert (crear o actualizar)
      const response = await fetch(`${API_BASE}/templates`, {
        method: "POST",
        headers,
        body: JSON.stringify(updatedTemplate),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error al actualizar la plantilla")
      }

      toast({
        title: "Plantilla actualizada",
        description: "La plantilla se actualizó correctamente",
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error updating template:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la plantilla",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="edit-name">Nombre de la Plantilla *</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-description">Descripción</Label>
          <Textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Columnas</Label>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map((_, i) => `column-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {columns.map((col, index) => (
                <SortableColumn
                  key={`column-${index}`}
                  id={`column-${index}`}
                  col={col}
                  index={index}
                  onUpdate={updateColumn}
                  onRemove={removeColumn}
                  canRemove={columns.length > 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addColumn}
          className="w-full mt-3"
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar Columna
        </Button>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
