"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useDropzone } from "react-dropzone"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadFile {
  id: string
  file: File
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  error?: string
}

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const acceptedFileTypes = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/csv": [".csv"],
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: "pending",
      progress: 0,
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const uploadFiles = async () => {
    setIsUploading(true)

    for (const uploadFile of files) {
      if (uploadFile.status !== "pending") continue

      setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f)))

      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 200))
          setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)))
        }

        // TODO: Replace with actual API call
        // const formData = new FormData()
        // formData.append('file', uploadFile.file)
        // const response = await fetch('/api/upload', {
        //   method: 'POST',
        //   body: formData
        // })

        setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "success", progress: 100 } : f)))
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "error", error: "Error al subir el archivo" } : f)),
        )
      }
    }

    setIsUploading(false)
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    return <FileText className="w-5 h-5 text-primary" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Subir Documentos</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Drop Zone */}
          <motion.div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30",
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {isDragActive ? "Suelta los archivos aquí" : "Arrastra archivos o haz clic para seleccionar"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Soporta PDF, Word, Excel y CSV hasta 50MB</p>
            <Badge variant="outline" className="text-xs">
              Máximo 50MB por archivo
            </Badge>
          </motion.div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Archivos seleccionados ({files.length})</h4>
              <AnimatePresence>
                {files.map((uploadFile) => (
                  <motion.div
                    key={uploadFile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    {getFileIcon(uploadFile.file.name)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(uploadFile.status)}
                          {uploadFile.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(uploadFile.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(uploadFile.file.size)}</span>
                        {uploadFile.status === "uploading" && <span>{uploadFile.progress}%</span>}
                        {uploadFile.error && <span className="text-red-500">{uploadFile.error}</span>}
                      </div>
                      {uploadFile.status === "uploading" && (
                        <Progress value={uploadFile.progress} className="mt-2 h-1" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={uploadFiles}
            disabled={files.length === 0 || isUploading}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            {isUploading ? "Subiendo..." : `Subir ${files.length} archivo${files.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
