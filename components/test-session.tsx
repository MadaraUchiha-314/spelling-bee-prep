"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
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
import { Play, Settings, Trophy, Target, CheckCircle, Clock, ChevronDown } from "lucide-react"
import { sessionStorage, type TestSession } from "@/lib/session-storage"
import { WordFilter } from "@/components/word-filter"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface TestSessionProps {
  words: string[]
  wordListName: string
  wordListId?: string
  apiKey: string
  onSessionStart?: (session: TestSession) => void
}

export function TestSessionComponent({ words, wordListName, wordListId, apiKey, onSessionStart }: TestSessionProps) {
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [sessionName, setSessionName] = useState("")
  const [excludePreviouslyCorrect, setExcludePreviouslyCorrect] = useState(true)
  const [randomizeWords, setRandomizeWords] = useState(true)
  const [availableWords, setAvailableWords] = useState<string[]>([])
  const [masteredWords, setMasteredWords] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [filteredWords, setFilteredWords] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(true)

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
      const filtered = wordsToFilter.filter((w) => !masteredWords.includes(w.toLowerCase()))
      setAvailableWords(filtered)
    } else {
      setAvailableWords(wordsToFilter)
    }
  }

  const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5)

  const startSession = async () => {
    if (!sessionName.trim() || availableWords.length === 0) return

    try {
      setLoading(true)
      setError("")

      const wordsForSession = randomizeWords ? shuffle(availableWords) : [...availableWords]

      const sessionId = await sessionStorage.createSession(
        sessionName.trim(),
        wordListName,
        wordsForSession,
        excludePreviouslyCorrect,
        wordListId,
      )

      const session = await sessionStorage.getSession(sessionId)
      if (session && onSessionStart) {
        onSessionStart(session)
      }
      setShowStartDialog(false)
      setSessionName("")
    } catch (err) {
      setError("Failed to start session")
    } finally {
      setLoading(false)
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
      <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
        <Card>
          <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between p-6 text-left">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Test Session
              </CardTitle>
              <CardDescription>Start a structured spelling test to track your progress</CardDescription>
            </div>
            <ChevronDown
              className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              <WordFilter words={words} onWordsFiltered={handleWordsFiltered} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={Target} label="Filtered Words" value={filteredWords.length} color="blue" />
                <StatCard icon={CheckCircle} label="Mastered" value={masteredWords.length} color="green" />
                <StatCard icon={Clock} label="Available" value={availableWords.length} color="orange" />
              </div>

              <div className="p-4 border rounded-lg space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Session Options
                </h3>

                <ToggleRow
                  id="randomize-words"
                  checked={randomizeWords}
                  onChange={setRandomizeWords}
                  title="Randomize word order"
                  description="Shuffle the words for varied practice"
                />

                <ToggleRow
                  id="exclude-mastered"
                  checked={excludePreviouslyCorrect}
                  onChange={setExcludePreviouslyCorrect}
                  title="Exclude previously mastered words"
                  description="Skip words you've spelled correctly in previous sessions"
                />

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
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
                <Detail label="Word List" value={wordListName} />
                <Detail label="Words to Practice" value={availableWords.length} />
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

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number
  color: "blue" | "green" | "orange"
}
function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colors: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    orange: "text-orange-600 bg-orange-50",
  }
  return (
    <div className={`p-4 rounded-lg ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colors[color].split(" ")[0]}`} />
        <span className={`text-sm font-medium ${colors[color].split(" ")[0].replace("text-", "text-")}`}>{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

interface ToggleRowProps {
  id: string
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}
function ToggleRow({ id, title, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <Label htmlFor={id}>{title}</Label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

interface DetailProps {
  label: string
  value: string | number
}
const Detail = ({ label, value }: DetailProps) => (
  <div>
    <span className="text-gray-600">{label}:</span>
    <p className="font-medium">{value}</p>
  </div>
)
