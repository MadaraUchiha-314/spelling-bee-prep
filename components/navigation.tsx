"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, Settings, Play, Archive, Trophy, History, Menu } from "lucide-react"
import { sessionStorage, type TestSession } from "@/lib/session-storage"
import { useState, useEffect } from "react"
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer"

export function Navigation() {
  const pathname = usePathname()
  const [currentSession, setCurrentSession] = useState<TestSession | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

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
    <>
      {/* Mobile Hamburger */}
      <div className="flex sm:hidden w-full justify-start">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="p-2 rounded-md bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Open navigation menu">
              <Menu className="w-6 h-6" aria-hidden="true" />
              <span className="sr-only">Open navigation</span>
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <nav className="flex flex-col gap-2 p-4" aria-label="Mobile navigation" role="navigation">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-base font-medium rounded-md transition-all min-w-fit",
                      "hover:bg-background hover:text-foreground",
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground"
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    {item.label}
                    {item.badge && (
                      <span className="ml-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </DrawerContent>
        </Drawer>
      </div>
      {/* Desktop Nav */}
      <nav className="hidden sm:flex items-center justify-center space-x-1 bg-muted p-1 rounded-md overflow-x-auto flex-nowrap scrollbar-thin scrollbar-thumb-muted/40 scrollbar-track-transparent sm:space-x-1 sm:p-1 sm:text-base text-xs min-w-0" aria-label="Main navigation" role="navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-sm transition-all min-w-fit",
                "hover:bg-background hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
              aria-label={item.label}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {item.label}
              {item.badge && (
                <span className="ml-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
} 