"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Loader2,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

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

interface Stats {
  total: number
  completed: number
  failed: number
  processing: number
  queued: number
  successRate: number
}

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
  const router = useRouter()
  const [jobs, setJobs] = useState<ProcessingJob[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    failed: 0,
    processing: 0,
    queued: 0,
    successRate: 0
  })
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [timeFilter, setTimeFilter] = useState<string>("today")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/login")
    }
  }, [router])

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem("authToken")
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        // Load logs and stats in parallel
        const [logsResponse, statsResponse] = await Promise.all([
          fetch(`${API_BASE}/logs/transformations?limit=50${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`, {
            headers,
            cache: "no-store"
          }),
          fetch(`${API_BASE}/logs/transformations/stats`, {
            headers,
            cache: "no-store"
          })
        ])

        if (!logsResponse.ok || !statsResponse.ok) {
          throw new Error("Error cargando datos")
        }

        const logsData = await logsResponse.json()
        const statsData = await statsResponse.json()

        setJobs(logsData.logs || [])
        setStats(statsData.stats || {
          total: 0,
          completed: 0,
          failed: 0,
          processing: 0,
          queued: 0,
          successRate: 0
        })
      } catch (e: any) {
        console.error("Error loading processed data:", e)
        setError(e.message || "Error cargando datos")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [statusFilter])

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== "all" && job.status !== statusFilter) return false
    return true
  })

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
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Cargando datos...</span>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Error: {error}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Content */}
            {!loading && !error && (
              <>
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
                    {filteredJobs.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No hay trabajos procesados</p>
                        <p className="text-sm">Los trabajos aparecerán aquí una vez que proceses documentos</p>
                      </div>
                    ) : (
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
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
