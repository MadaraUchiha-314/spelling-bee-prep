"use client"

import { useState, useEffect } from "react"
import { TestSessionComponent } from "@/components/test-session"
import { SessionPractice } from "@/components/session-practice"
import { useRouter } from "next/navigation"
import { sessionStorage, type TestSession } from "@/lib/session-storage"
import { useWordContext } from "@/lib/word-context"
import { Button } from "@/components/ui/button"

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

  const handlePauseSession = () => {
    setCurrentSession(null)
  }

  const handleEndSession = async () => {
    if (currentSession) {
      await sessionStorage.completeSession(currentSession.id)
      setCurrentSession(null)
    }
  }

  const showSessionPractice = currentSession && !currentSession.isCompleted

  return (
    <div className="space-y-6">
      {showSessionPractice ? (
        <>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setCurrentSession(null)
              }}
            >
              New Test Session
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndSession}
            >
              End
            </Button>
          </div>
          <SessionPractice session={currentSession} apiKey={apiKey} onSessionComplete={handleSessionComplete} />
        </>
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