"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, Settings, Play, Archive, Trophy, History } from "lucide-react"
import { sessionStorage, type TestSession } from "@/lib/session-storage"
import { useState, useEffect } from "react"

export function Navigation() {
  const pathname = usePathname()
  const [currentSession, setCurrentSession] = useState<TestSession | null>(null)

  useEffect(() => {
    const loadActiveSession = async () => {
      try {
        const sessions = await sessionStorage.getAllSessions()
        const activeSession = sessions.find((session) => !session.isCompleted)
        if (activeSession) {
          setCurrentSession(activeSession)
        }
      } catch (err) {
        console.error("Error loading active session:", err)
      }
    }
    loadActiveSession()
  }, [])

  const navItems = [
    {
      href: "/upload",
      label: "Upload",
      icon: BookOpen,
    },
    {
      href: "/saved",
      label: "Saved Lists",
      icon: Archive,
    },
    {
      href: "/practice",
      label: "Practice",
      icon: Play,
    },
    {
      href: "/test",
      label: "Test Session",
      icon: Trophy,
      badge: currentSession && !currentSession.isCompleted,
    },
    {
      href: "/history",
      label: "History",
      icon: History,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    },
  ]

  return (
    <nav className="flex items-center justify-center space-x-1 bg-muted p-1 rounded-md">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm transition-all",
              "hover:bg-background hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {item.label}
            {item.badge && (
              <span className="ml-1 w-2 h-2 bg-orange-500 rounded-full"></span>
            )}
          </Link>
        )
      })}
    </nav>
  )
} 