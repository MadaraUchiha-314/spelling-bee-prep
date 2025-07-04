"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Play, Settings, Trophy, Target, CheckCircle, Clock } from "lucide-react"
import { sessionStorage, type TestSession } from "@/lib/session-storage"
import { SessionPractice } from "@/components/session-practice"
import { WordFilter } from "@/components/word-filter"

interface TestSessionProps {
  words: string[]
  wordListName: string
  wordListId?: string
  apiKey: string
}

export function TestSessionComponent({ words, wordListName, wordListId, apiKey }: TestSessionProps) {
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [sessionName, setSessionName] = useState("")
  const [excludePreviouslyCorrect, setExcludePreviouslyCorrect] = useState(true)
  const [randomizeWords, setRandomizeWords] = useState(true) // Default to true for test sessions
  const [currentSession, setCurrentSession] = useState<TestSession | null>(null)
  const [availableWords, setAvailableWords] = useState<string[]>([])
  const [masteredWords, setMasteredWords] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [filteredWords, setFilteredWords] = useState<string[]>([])

  useEffect(() => {
    loadMasteredWords()
  }, [])

  useEffect(() => {
    updateAvailableWords()
  }, [filteredWords, masteredWords, excludePreviouslyCorrect])

  useEffect(() => {
    setFilteredWords(words)
  }, [words])

  const loadMasteredWords = async () => {
    try {
      const mastered = await sessionStorage.getMasteredWords()
      setMasteredWords(mastered)
    } catch (err) {
      console.error("Error loading mastered words:", err)
    }
  }

  const handleWordsFiltered = (filtered: string[]) => {
    setFilteredWords(filtered)
  }

  const updateAvailableWords = () => {
    const wordsToFilter = filteredWords.length > 0 ? filteredWords : words
    if (excludePreviouslyCorrect && masteredWords.length > 0) {
      const filtered = wordsToFilter.filter((word) => !masteredWords.includes(word.toLowerCase()))
      setAvailableWords(filtered)
    } else {
      setAvailableWords(wordsToFilter)
    }
  }

  const startSession = async () => {
    if (!sessionName.trim() || availableWords.length === 0) return

    try {
      setLoading(true)
      setError("")

      // Shuffle words for the session if randomization is enabled
      const wordsForSession = randomizeWords ? [...availableWords].sort(() => Math.random() - 0.5) : [...availableWords]

      const sessionId = await sessionStorage.createSession(
        sessionName.trim(),
        wordListName,
        wordsForSession,
        excludePreviouslyCorrect,
        wordListId,
      )

      const session = await sessionStorage.getSession(sessionId)
      setCurrentSession(session)
      setShowStartDialog(false)
      setSessionName("")
    } catch (err) {
      setError("Failed to start session")
    } finally {
      setLoading(false)
    }
  }

  const handleSessionComplete = async () => {
    if (currentSession) {
      await sessionStorage.completeSession(currentSession.id)
      setCurrentSession(null)
      await loadMasteredWords() // Refresh mastered words
    }
  }

  const generateSessionName = () => {
    const now = new Date()
    const dateStr = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    setSessionName(`${wordListName} - ${dateStr}`)
  }

  if (currentSession) {
    return <SessionPractice session={currentSession} apiKey={apiKey} onSessionComplete={handleSessionComplete} />
  }

  if (words.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No word list selected</p>
            <p>Please select a word list to start a test session.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Test Session
          </CardTitle>
          <CardDescription>Start a structured spelling test to track your progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Word Filter */}
          {words.length > 0 && <WordFilter words={words} onWordsFiltered={handleWordsFiltered} />}

          {/* Session Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Filtered Words</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{filteredWords.length}</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Mastered</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{masteredWords.length}</p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Available</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{availableWords.length}</p>
            </div>
          </div>

          {/* Session Options */}
          <div className="p-4 border rounded-lg space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Session Options
            </h3>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="randomize-words">Randomize word order</Label>
                <p className="text-sm text-gray-500">Shuffle the words for varied practice</p>
              </div>
              <Switch id="randomize-words" checked={randomizeWords} onCheckedChange={setRandomizeWords} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="exclude-mastered">Exclude previously mastered words</Label>
                <p className="text-sm text-gray-500">Skip words you've spelled correctly in previous sessions</p>
              </div>
              <Switch
                id="exclude-mastered"
                checked={excludePreviouslyCorrect}
                onCheckedChange={setExcludePreviouslyCorrect}
              />
            </div>

            {excludePreviouslyCorrect && masteredWords.length > 0 && (
              <Alert>
                <AlertDescription>
                  {masteredWords.length} mastered words will be excluded from this session.
                  {availableWords.length === 0 && (
                    <span className="text-orange-600 font-medium">
                      {" "}
                      All words have been mastered! Consider adding new words or disabling this option.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Start Session Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => {
                generateSessionName()
                setShowStartDialog(true)
              }}
              disabled={availableWords.length === 0}
              className="flex items-center gap-2"
              size="lg"
            >
              <Play className="w-4 h-4" />
              Start Test Session
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Start Session Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Test Session</DialogTitle>
            <DialogDescription>Configure your spelling test session</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">Session Name</Label>
              <Input
                id="session-name"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Enter session name..."
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h4 className="font-medium">Session Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Word List:</span>
                  <p className="font-medium">{wordListName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Words to Practice:</span>
                  <p className="font-medium">{availableWords.length}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {randomizeWords && (
                  <Badge variant="secondary" className="text-xs">
                    Randomized order
                  </Badge>
                )}
                {excludePreviouslyCorrect && masteredWords.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Excluding {masteredWords.length} mastered words
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={startSession} disabled={!sessionName.trim() || availableWords.length === 0 || loading}>
              {loading ? "Starting..." : "Start Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
