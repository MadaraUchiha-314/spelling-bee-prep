"use client"

import { useState, useEffect } from "react"
import {
  Volume2,
  BookOpen,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  Trophy,
  Headphones,
  ChevronDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

import { sessionStorage, type TestSession, type WordAttempt } from "@/lib/session-storage"

interface WordData {
  word: string
  pronunciation?: string
  partOfSpeech?: string
  definition?: string
  etymology?: string
  example?: string
}

interface SessionPracticeProps {
  session: TestSession
  apiKey: string
  onSessionComplete: () => void
}

export function SessionPractice({ session, apiKey, onSessionComplete }: SessionPracticeProps) {
  const [currentSession, setCurrentSession] = useState<TestSession>(session)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentWord, setCurrentWord] = useState("")
  const [userSpelling, setUserSpelling] = useState("")
  const [hasCheckedSpelling, setHasCheckedSpelling] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [feedback, setFeedback] = useState("")
  const [error, setError] = useState("")

  const [wordData, setWordData] = useState<WordData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showWord, setShowWord] = useState(false)
  const [showDefinition, setShowDefinition] = useState(false)
  const [showEtymology, setShowEtymology] = useState(false)
  const [showPartOfSpeech, setShowPartOfSpeech] = useState(false)
  const [showExample, setShowExample] = useState(false)
  const [showPronunciation, setShowPronunciation] = useState(false)

  const [completionOpen, setCompletionOpen] = useState(false)
  const [isPracticeOpen, setIsPracticeOpen] = useState(true)

  const resetWordState = () => {
    setUserSpelling("")
    setHasCheckedSpelling(false)
    setIsCorrect(null)
    setFeedback("")
    setError("")

    setWordData(null)
    setShowDefinition(false)
    setShowEtymology(false)
    setShowPartOfSpeech(false)
    setShowExample(false)
    setShowPronunciation(false)
    setShowWord(false)
  }

  useEffect(() => {
    if (currentSession.wordsAsked.length > 0 && currentWordIndex < currentSession.wordsAsked.length) {
      setCurrentWord(currentSession.wordsAsked[currentWordIndex])
      resetWordState()
    }
  }, [currentWordIndex, currentSession.wordsAsked])

  const fetchWordData = async (word: string) => {
    if (!apiKey) {
      setError("Please configure your API key in Settings")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${apiKey}`)
      if (!res.ok) throw new Error("API request failed")

      const data = await res.json()

      if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
        const entry = data[0]
        setWordData({
          word,
          pronunciation: entry.hwi?.prs?.[0]?.mw || "",
          partOfSpeech: entry.fl || "",
          definition: entry.shortdef?.[0] || "",
          etymology: entry.et?.[0]?.[1] || "",
          example: entry.def?.[0]?.sseq?.[0]?.[0]?.[1]?.dt?.find((d: any) => d[0] === "vis")?.[1]?.[0]?.t || "",
        })
      } else {
        setError("Word not found in dictionary")
      }
    } catch {
      setError("Failed to fetch word data. Please check your API key.")
    } finally {
      setLoading(false)
    }
  }

  const speakWord = () => {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(currentWord)
      u.rate = 0.7
      speechSynthesis.speak(u)
    }
  }

  const recordAttempt = async (attempt: WordAttempt) => {
    await sessionStorage.addAttempt(currentSession.id, attempt)
    const updated = await sessionStorage.getSession(currentSession.id)
    if (updated) setCurrentSession(updated)
  }

  const checkSpelling = async () => {
    if (!userSpelling.trim()) return

    const correct = userSpelling.trim().toLowerCase() === currentWord.toLowerCase()
    setIsCorrect(correct)
    setHasCheckedSpelling(true)

    await recordAttempt({
      word: currentWord,
      userSpelling: userSpelling.trim(),
      isCorrect: correct,
      timestamp: new Date(),
    })

    if (correct) {
      setFeedback("Correct! Well done!")
    } else {
      setFeedback(`Incorrect. The correct spelling is "${currentWord}".`)
    }
  }

  const markCorrect = async () => {
    setIsCorrect(true)
    setHasCheckedSpelling(true)
    setFeedback("Marked as correct!")
    if (!userSpelling.trim()) setUserSpelling(currentWord)

    await recordAttempt({
      word: currentWord,
      userSpelling: userSpelling.trim() || currentWord,
      isCorrect: true,
      timestamp: new Date(),
    })
  }

  const markIncorrect = async () => {
    setIsCorrect(false)
    setHasCheckedSpelling(true)
    setFeedback(`Marked as incorrect. The correct spelling is "${currentWord}".`)

    await recordAttempt({
      word: currentWord,
      userSpelling: userSpelling.trim(),
      isCorrect: false,
      timestamp: new Date(),
    })
  }

  const previousWord = () => {
    if (currentWordIndex > 0) setCurrentWordIndex((i) => i - 1)
  }

  const nextWord = () => {
    if (currentWordIndex < currentSession.wordsAsked.length - 1) {
      setCurrentWordIndex((i) => i + 1)
    } else {
      setCompletionOpen(true)
    }
  }

  const completeSession = async () => {
    await sessionStorage.completeSession(currentSession.id)
    setCompletionOpen(false)
    onSessionComplete()
  }

  const progress = ((currentWordIndex + (hasCheckedSpelling ? 1 : 0)) / currentSession.wordsAsked.length) * 100
  const attemptsCount = currentSession.attempts.length
  const accuracy = attemptsCount > 0 ? (currentSession.correctCount / attemptsCount) * 100 : 0
  const isLastWord = currentWordIndex === currentSession.wordsAsked.length - 1

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                {currentSession.name}
              </CardTitle>
              <CardDescription>
                Word {currentWordIndex + 1} of {currentSession.wordsAsked.length}
              </CardDescription>
            </div>

            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{currentSession.correctCount}</div>
                <div className="text-xs text-gray-500">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{currentSession.incorrectCount}</div>
                <div className="text-xs text-gray-500">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{Math.round(accuracy)}%</div>
                <div className="text-xs text-gray-500">Accuracy</div>
              </div>
            </div>
          </div>

          <Progress value={progress} className="w-full mt-4" />
        </CardHeader>
      </Card>

      <Collapsible open={isPracticeOpen} onOpenChange={setIsPracticeOpen} asChild>
        <Card>
          <div className="flex items-center p-6">
            <CollapsibleTrigger className="flex flex-1 cursor-pointer items-center justify-between text-left">
              <CardTitle>
                Current Word ({currentWordIndex + 1} of {currentSession.wordsAsked.length})
              </CardTitle>
              <ChevronDown
                className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isPracticeOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <div className="flex gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={previousWord}
                disabled={currentWordIndex === 0}
                className="bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              <Button variant="outline" size="sm" onClick={() => setShowWord((s) => !s)}>
                {showWord ? (
                  <>
                    <EyeOff className="w-4 h-4" /> Hide Word
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" /> Show Word
                  </>
                )}
              </Button>

              <Button variant="outline" size="sm" onClick={nextWord} className="bg-transparent">
                <ArrowRight className="w-4 h-4" />
                {isLastWord ? "Finish Session" : "Next Word"}
              </Button>
            </div>
          </div>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              <div className="text-center">
                {showWord ? (
                  <div className="text-4xl font-bold text-blue-600 mb-4">{currentWord}</div>
                ) : (
                  <div className="text-2xl text-gray-400 mb-4">Word Hidden – use the clue buttons</div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button variant="outline" onClick={speakWord} className="bg-transparent gap-2">
                  <Volume2 className="w-4 h-4" /> Pronounce
                </Button>

                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={() => {
                    if (!wordData) fetchWordData(currentWord)
                    setShowPronunciation((s) => !s)
                  }}
                  className="gap-2"
                >
                  <Headphones className="w-4 h-4" /> Phonetic
                </Button>

                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={() => {
                    if (!wordData) fetchWordData(currentWord)
                    setShowDefinition((s) => !s)
                  }}
                  className="gap-2"
                >
                  <BookOpen className="w-4 h-4" /> Definition
                </Button>

                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={() => {
                    if (!wordData) fetchWordData(currentWord)
                    setShowEtymology((s) => !s)
                  }}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" /> Etymology
                </Button>

                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={() => {
                    if (!wordData) fetchWordData(currentWord)
                    setShowPartOfSpeech((s) => !s)
                  }}
                  className="gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Part of Speech
                </Button>

                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={() => {
                    if (!wordData) fetchWordData(currentWord)
                    setShowExample((s) => !s)
                  }}
                  className="gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Usage Example
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading && <div className="text-center text-gray-500">Loading…</div>}

              {wordData && (
                <div className="space-y-4">
                  {showPronunciation && wordData.pronunciation && (
                    <div className="p-4 bg-indigo-50 rounded-lg">
                      <h4 className="font-semibold text-indigo-800 mb-2">Phonetic Spelling</h4>
                      <p className="font-mono text-indigo-700 text-lg">/{wordData.pronunciation}/</p>
                    </div>
                  )}

                  {showDefinition && wordData.definition && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Definition</h4>
                      <p className="text-blue-700">{wordData.definition}</p>
                    </div>
                  )}

                  {showPartOfSpeech && wordData.partOfSpeech && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Part of Speech</h4>
                      <Badge variant="secondary">{wordData.partOfSpeech}</Badge>
                    </div>
                  )}

                  {showEtymology && wordData.etymology && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">Etymology</h4>
                      <p className="text-purple-700 text-sm">{wordData.etymology}</p>
                    </div>
                  )}

                  {showExample && wordData.example && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">Usage Example</h4>
                      <p className="italic text-orange-700">
                        {wordData.example.replace(/\{wi\}/g, "").replace(/\{\/wi\}/g, "")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <div>
                  <label htmlFor="spelling-input" className="block text-sm font-medium mb-2">
                    Enter your spelling:
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="spelling-input"
                      value={userSpelling}
                      onChange={(e) => setUserSpelling(e.target.value)}
                      placeholder="Type the word here…"
                      disabled={hasCheckedSpelling}
                      onKeyDown={(e) => e.key === "Enter" && !hasCheckedSpelling && checkSpelling()}
                      className="flex-1"
                    />

                    <Button onClick={checkSpelling} disabled={!userSpelling.trim() || hasCheckedSpelling}>
                      Check
                    </Button>

                    <Button
                      variant="outline"
                      className="text-green-600 hover:text-green-700 bg-transparent gap-2"
                      disabled={hasCheckedSpelling}
                      onClick={markCorrect}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Correct
                    </Button>

                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 bg-transparent gap-2"
                      disabled={hasCheckedSpelling}
                      onClick={markIncorrect}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Wrong
                    </Button>
                  </div>
                </div>

                {feedback && (
                  <Alert
                    variant={isCorrect ? "default" : "destructive"}
                    className={isCorrect ? "border-green-200 bg-green-50" : ""}
                  >
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <AlertDescription className={isCorrect ? "text-green-800" : ""}>{feedback}</AlertDescription>
                    </div>
                  </Alert>
                )}

                {hasCheckedSpelling && (
                  <div className="flex justify-center pt-4">
                    <Button onClick={nextWord} size="lg" className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      {isLastWord ? "Complete Session" : "Next Word"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Dialog open={completionOpen} onOpenChange={setCompletionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" /> Session Complete!
            </DialogTitle>
            <DialogDescription>Congratulations! You’ve finished this spelling session.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{currentSession.totalWords}</div>
                <div className="text-sm text-blue-800">Total Words</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{currentSession.correctCount}</div>
                <div className="text-sm text-green-800">Correct</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{currentSession.incorrectCount}</div>
                <div className="text-sm text-red-800">Incorrect</div>
              </div>
            </div>

            <div className="text-center bg-yellow-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{Math.round(accuracy)}%</div>
              <div className="text-sm text-yellow-800">Final Accuracy</div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={completeSession} className="w-full">
              Finish Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
