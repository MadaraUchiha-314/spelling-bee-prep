"use client"

import { useState, useEffect } from "react"
import { TestSessionComponent } from "@/components/test-session"
import { SessionPractice } from "@/components/session-practice"
import { useRouter } from "next/navigation"
import { sessionStorage, type TestSession } from "@/lib/session-storage"
import { useWordContext } from "@/lib/word-context"

export default function TestPage() {
  const [currentSession, setCurrentSession] = useState<TestSession | null>(null)
  const [apiKey, setApiKey] = useState<string>("")
  const router = useRouter()
  const { words, currentListName, currentListId } = useWordContext()

  useEffect(() => {
    const savedApiKey = localStorage.getItem("spelling-bee-api-key")
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
    loadActiveSession()
  }, [])

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

  const handleSessionStart = (session: TestSession) => {
    setCurrentSession(session)
  }

  const handleSessionComplete = () => {
    setCurrentSession(null)
    router.push('/history')
  }

  const showSessionPractice = currentSession && !currentSession.isCompleted

  return (
    <div className="space-y-6">
          {showSessionPractice ? (
            <SessionPractice session={currentSession} apiKey={apiKey} onSessionComplete={handleSessionComplete} />
          ) : (
            <TestSessionComponent
              words={words}
              wordListName={currentListName}
              wordListId={currentListId}
              apiKey={apiKey}
              onSessionStart={handleSessionStart}
            />
          )}
    </div>
  )
} 