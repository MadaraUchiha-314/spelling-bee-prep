"use client"

import { SessionHistory } from "@/components/session-history"
import { useRouter } from "next/navigation"
import { type TestSession } from "@/lib/session-storage"

export default function HistoryPage() {
  const router = useRouter()

  const handleResumeSession = (session: TestSession) => {
    router.push('/test')
  }

  const handleSessionDeleted = (sessionId: string) => {
    // Handle session deletion if needed
  }

  return (
    <div className="space-y-6">
          <SessionHistory onResumeSession={handleResumeSession} onSessionDeleted={handleSessionDeleted} />
    </div>
  )
} 