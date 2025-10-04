"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  BarChart3,
  Activity,
  Download,
  Eye,
  RefreshCw,
  Filter,
  TrendingUp,
} from "lucide-react"

interface ProcessingJob {
  id: string
  fileName: string
  fileType: string
  status: "completed" | "processing" | "failed" | "queued"
  progress: number
  startTime: string
  endTime?: string
  duration?: string
  extractedFields: number
  totalFields: number
  template?: string
  errorMessage?: string
}

const mockJobs: ProcessingJob[] = [
  {
    id: "1",
    fileName: "solicitud_lucia_gomez_marzo.docx",
    fileType: "document",
    status: "completed",
    progress: 100,
    startTime: "2024-01-20 14:30:00",
    endTime: "2024-01-20 14:32:15",
    duration: "2m 15s",
    extractedFields: 12,
    totalFields: 12,
    template: "Reporte de Ventas",
  },
  {
    id: "2",
    fileName: "pedido-express_farmacia_centro.docx",
    fileType: "document",
    status: "completed",
    progress: 100,
    startTime: "2025-07-10 14:30:00",
    endTime: "2025-07-10 14:32:15",
    duration: "1m 15s",
    extractedFields: 2,
    totalFields: 12,
    template: "Inventario de Productos",
  },
  {
    id: "3",
    fileName: "cotizacion_muebles_la_esquina_enero.pdf",
    fileType: "pdf",
    status: "completed",
    progress: 100,
    startTime: "2024-01-20 13:15:00",
    endTime: "2024-01-20 13:18:45",
    duration: "3m 45s",
    extractedFields: 18,
    totalFields: 18,
    template: "Facturación Clientes",
  },
  {
    id: "4",
    fileName: "inventario_productos_enero.xlsx",
    fileType: "spreadsheet",
    status: "failed",
    progress: 0,
    startTime: "2024-01-20 16:00:00",
    endTime: "2024-01-20 16:01:30",
    duration: "1m 30s",
    extractedFields: 0,
    totalFields: 20,
    errorMessage: "Error de formato: No se pudo leer la estructura del archivo",
  },
  {
    id: "5",
    fileName: "facturas_diciembre_2023.pdf",
    fileType: "pdf",
    status: "completed",
    progress: 100,
    startTime: "2024-01-20 16:15:00",
    endTime: "2024-01-20 13:18:45",
    duration: "1m 45s",
    extractedFields: 2,
    totalFields: 25,
    template: "Facturación Clientes",
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case "processing":
      return <RefreshCw className="w-4 h-4 text-primary animate-spin" />
    case "failed":
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    case "queued":
      return <Clock className="w-4 h-4 text-muted-foreground" />
    default:
      return null
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completado</Badge>
    case "failed":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Error</Badge>
    default:
      return null
  }
}

export default function ProcessedPage() {
  const [jobs, setJobs] = useState<ProcessingJob[]>(mockJobs)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [timeFilter, setTimeFilter] = useState<string>("today")

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== "all" && job.status !== statusFilter) return false
    return true
  })

  const stats = {
    total: jobs.length,
    completed: jobs.filter((j) => j.status === "completed").length,
    processing: jobs.filter((j) => j.status === "processing").length,
    failed: jobs.filter((j) => j.status === "failed").length,
    queued: jobs.filter((j) => j.status === "queued").length,
  }

  const successRate = stats.total > 0 ? Math.round((stats.completed / (stats.completed + stats.failed)) * 100) : 0

  return (
    <div className="flex h-screen bg-background">
      <SidebarNavigation />

      <div className="flex-1 flex flex-col">
        <MainHeader title="Dashboard" />

        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">Total Trabajos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{stats.completed}</p>
                      <p className="text-xs text-muted-foreground">Completados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{stats.failed}</p>
                      <p className="text-xs text-muted-foreground">Errores</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="jobs" className="space-y-6">
              <TabsContent value="jobs" className="space-y-6">
                {/* Filters */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Filtros:</span>
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="completed">Completados</SelectItem>
                          <SelectItem value="processing">Procesando</SelectItem>
                          <SelectItem value="failed">Con Error</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={timeFilter} onValueChange={setTimeFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Hoy</SelectItem>
                          <SelectItem value="week">Esta Semana</SelectItem>
                          <SelectItem value="month">Este Mes</SelectItem>
                          <SelectItem value="all">Todo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Jobs List */}
                <Card>
                  <CardHeader className="bg-muted/50">
                    <CardTitle className="text-lg font-semibold">Trabajos de Procesamiento</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {filteredJobs.map((job, index) => (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-primary" />
                              <div>
                                <h3 className="font-medium text-sm">{job.fileName}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {job.template && `Plantilla: ${job.template}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {getStatusBadge(job.status)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">Inicio:</span>
                              <br />
                              {new Date(job.startTime).toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Duración:</span>
                              <br />
                              {job.duration || "En progreso..."}
                            </div>
                            <div>
                              <span className="font-medium">Campos:</span>
                              <br />
                              {job.extractedFields}/{job.totalFields} extraídos
                            </div>
                          </div>

                          {job.errorMessage && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                              <strong>Error:</strong> {job.errorMessage}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
