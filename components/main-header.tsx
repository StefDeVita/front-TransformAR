"use client"
import { useEffect, useRef, useState } from "react"
import { Search, Bell, User, Plus, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
interface MainHeaderProps {
  title: string
  showUploadButton?: boolean
  onUploadClick?: () => void
}
export function MainHeader({ title, showUploadButton = false, onUploadClick }: MainHeaderProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userEmail")
    // Remove auth cookie
    document.cookie = "authToken=; path=/; max-age=0"
    setIsMenuOpen(false)
    router.push("/login")
  }
  const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])
  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {showUploadButton && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10 hover:text-primary"
              data-testid="user-menu"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <User className="w-5 h-5" />
            </Button>
            {isMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md z-50"
              >
                <div className="px-2 py-1.5 text-sm font-medium">Mi Cuenta</div>
                {userEmail && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">{userEmail}</div>
                )}
                <div className="-mx-1 my-1 h-px bg-border" role="separator" />
                <button
                  type="button"
                  onClick={handleLogout}
                  data-testid="logout-button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}