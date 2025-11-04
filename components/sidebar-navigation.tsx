"use client"
import { motion } from "framer-motion"
import { Home, Clock, CheckCircle, Users, Trash2, Settings, FileSpreadsheet, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

const navigationItems = [
  { icon: Home, label: "Inicio", href: "/" },
  { icon: FileSpreadsheet, label: "Plantillas", href: "/templates" },
  { icon: CheckCircle, label: "Procesados", href: "/processed" },
]

export function SidebarNavigation() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gradient-to-b from-primary/5 to-sand/20 border-r border-primary/20 h-screen flex flex-col">
      <div className="p-6 border-b border-primary/20 bg-gradient-to-r from-sun/10 to-primary-hover/10">
        <div className="flex items-center justify-center">
          <div className="w-32 h-32 relative">
            <Image
              src="/transformar-logo.png"
              alt="TransformAR"
              width={256}
              height={256}
              className="object-contain drop-shadow-lg"
            />
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-3">
        {navigationItems.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          const getItemColor = (index: number, isActive: boolean) => {
            if (isActive) return "bg-primary text-white shadow-lg border border-primary/30 hover:bg-primary/90"

            const colors = [
              "hover:bg-gradient-to-r hover:from-sun/20 hover:to-sun/10 hover:text-foreground hover:shadow-md hover:border-sun/30", // sun gradient
              "hover:bg-gradient-to-r hover:from-primary-hover/20 hover:to-primary/10 hover:text-foreground hover:shadow-md hover:border-primary/30", // blue gradient
              "hover:bg-gradient-to-r hover:from-sand/30 hover:to-sand/15 hover:text-foreground hover:shadow-md hover:border-sand/40", // sand gradient
              "hover:bg-gradient-to-r hover:from-primary/15 hover:to-primary-hover/20 hover:text-foreground hover:shadow-md hover:border-primary/20", // primary gradient
            ]
            return `text-sidebar-foreground border border-transparent transition-all duration-300 ${colors[index % colors.length]}`
          }

          return (
            <motion.div
              key={item.href}
              whileHover={{ x: 6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link href={item.href} className="block">
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-4 h-12 text-sm font-medium rounded-xl",
                    getItemColor(index, isActive),
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-primary/20 bg-gradient-to-r from-sand/15 to-sun/10">
        <Link href="/settings" className="block">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-4 h-12 text-sm font-medium rounded-xl border border-transparent transition-all duration-300",
                pathname === "/settings"
                  ? "bg-primary text-white shadow-lg border-primary/30 hover:bg-primary/90"
                  : "text-sidebar-foreground hover:bg-gradient-to-r hover:from-sun/25 hover:to-sand/20 hover:text-foreground hover:shadow-md hover:border-sun/40",
              )}
            >
              <Settings className="w-5 h-5" />
              Configuración
            </Button>
          </motion.div>
        </Link>
      </div>
    </div>
  )
}
