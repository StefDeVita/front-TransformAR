"use client"

import { Search, Bell, User, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"

interface MainHeaderProps {
  title: string
  showUploadButton?: boolean
  onUploadClick?: () => void
}

export function MainHeader({ title, showUploadButton = false, onUploadClick }: MainHeaderProps) {
  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {showUploadButton && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Button
                onClick={onUploadClick}
                className="bg-primary hover:bg-primary-hover text-primary-foreground gap-2 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Subir Documento
              </Button>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
