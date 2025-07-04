"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Volume2,
  BookOpen,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
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
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentWord, setCurrentWord] = useState<string>("")
  const [wordData, setWordData] = useState<WordData | null>(null)
  const [userSpelling, setUserSpelling] = useState("")
  const [feedback, setFeedback] = useState("")
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [hasCheckedSpelling, setHasCheckedSpelling] = useState(false)
  const [showDefinition, setShowDefinition] = useState(false)
  const [showEtymology, setShowEtymology] = useState(false)
  const [showPartOfSpeech, setShowPartOfSpeech] = useState(false)
  const [showExample, setShowExample] = useState(false)
  const [showWord, setShowWord] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentSession, setCurrentSession] = useState<TestSession>(session)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)

  // Set current word when index changes
  useEffect(() => {
    if (currentSession.wordsAsked.length > 0 && currentWordIndex < currentSession.wordsAsked.length) {
      setCurrentWord(currentSession.wordsAsked[currentWordIndex])
      resetWordState()
    }
  }, [currentWordIndex, currentSession.wordsAsked])

  const resetWordState = () => {
    setWordData(null)
    setUserSpelling("")
    setHasCheckedSpelling(false)
    setShowDefinition(false)
    setShowEtymology(false)
    setShowPartOfSpeech(false)
    setShowExample(false)
    setShowWord(false)
    setError("")
  }

  const clearFeedback = () => {
    setFeedback("")
    setIsCorrect(null)
  }

  const fetchWordData = async (word: string) => {
    if (!apiKey) {
      setError("Please configure your API key in Settings")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(
        `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${apiKey}`,
      )

      if (!response.ok) {
        throw new Error("API request failed")
      }

      const data = await response.json()

      if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
        const entry = data[0]

        const wordData: WordData = {
          word: word,
          pronunciation: entry.hwi?.prs?.[0]?.mw || "",
          partOfSpeech: entry.fl || "",
          definition: entry.shortdef?.[0] || "",
          etymology: entry.et?.[0]?.[1] || "",
          example: entry.def?.[0]?.sseq?.[0]?.[0]?.[1]?.dt?.find((item: any) => item[0] === "vis")?.[1]?.[0]?.t || "",
        }

        setWordData(wordData)
      } else {
        setError("Word not found in dictionary")
      }
    } catch (err) {
      setError("Failed to fetch word data. Please check your API key.")
    } finally {
      setLoading(false)
    }
  }

  const speakWord = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord)
      utterance.rate = 0.7
      speechSynthesis.speak(utterance)
    }
  }

  const saveAttempt = async (correct: boolean, spelling: string) => {
    const attempt: WordAttempt = {
      word: currentWord,
      userSpelling: spelling,
      isCorrect: correct,
      timestamp: new Date(),
    }

    try {
      await sessionStorage.addAttempt(currentSession.id, attempt)

      // Update local session state
      const updatedSession = await sessionStorage.getSession(currentSession.id)
      if (updatedSession) {
        setCurrentSession(updatedSession)
      }
    } catch (err) {
      setError("Failed to save attempt")
      return false
    }
    return true
  }

  const checkSpelling = async () => {
    if (!userSpelling.trim()) return

    const correct = userSpelling.toLowerCase().trim() === currentWord.toLowerCase()
    setIsCorrect(correct)
    setHasCheckedSpelling(true)

    const success = await saveAttempt(correct, userSpelling.trim())
    if (!success) return

    if (correct) {
      setFeedback("Correct! Well done!")
    } else {
      // Provide detailed feedback
      const userWord = userSpelling.toLowerCase().trim()
      const correctWord = currentWord.toLowerCase()

      let feedbackText = `Incorrect. The correct spelling is "${currentWord}". `

      // Find differences
      const differences = []
      const maxLength = Math.max(userWord.length, correctWord.length)

      for (let i = 0; i < maxLength; i++) {
        const userChar = userWord[i] || ""
        const correctChar = correctWord[i] || ""

        if (userChar !== correctChar) {
          if (!userChar) {
            differences.push(`Missing "${correctChar}" at position ${i + 1}`)
          } else if (!correctChar) {
            differences.push(`Extra "${userChar}" at position ${i + 1}`)
          } else {
            differences.push(`"${userChar}" should be "${correctChar}" at position ${i + 1}`)
          }
        }
      }

      if (differences.length > 0) {
        feedbackText += "Issues: " + differences.slice(0, 3).join(", ")
        if (differences.length > 3) {
          feedbackText += ` and ${differences.length - 3} more...`
        }
      }

      setFeedback(feedbackText)
    }
  }

  const markAsCorrect = async () => {
    setIsCorrect(true)
    setHasCheckedSpelling(true)
    setFeedback("Marked as correct!")

    const spelling = userSpelling.trim() || currentWord
    if (!userSpelling.trim()) {
      setUserSpelling(currentWord) // Fill in the correct spelling if empty
    }

    await saveAttempt(true, spelling)
  }

  const markAsIncorrect = async () => {
    setIsCorrect(false)
    setHasCheckedSpelling(true)
    setFeedback(`Marked as incorrect. The correct spelling is "${currentWord}".`)

    const spelling = userSpelling.trim() || "[marked as incorrect]"
    await saveAttempt(false, spelling)
  }

  const nextWord = () => {
    clearFeedback() // Clear feedback before moving to next word
    if (currentWordIndex < currentSession.wordsAsked.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
    } else {
      // Session completed
      setShowCompletionDialog(true)
    }
  }

  const skipWord = () => {
    clearFeedback() // Clear feedback when skipping
    nextWord()
  }

  const previousWord = () => {
    clearFeedback() // Clear feedback when going back
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1)
    }
  }

  const completeSession = async () => {
    try {
      await sessionStorage.completeSession(currentSession.id)
      setShowCompletionDialog(false)
      onSessionComplete()
    } catch (err) {
      setError("Failed to complete session")
    }
  }

  const progress = ((currentWordIndex + (hasCheckedSpelling ? 1 : 0)) / currentSession.wordsAsked.length) * 100
  const accuracy =
    currentSession.attempts.length > 0 ? (currentSession.correctCount / currentSession.attempts.length) * 100 : 0

  const isLastWord = currentWordIndex >= currentSession.wordsAsked.length - 1

  return (
    <div className="space-y-6">
      {/* Session Header */}
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
            <div className="flex items-center gap-4">
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
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      {/* Word Practice */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Current Word ({currentWordIndex + 1} of {currentSession.wordsAsked.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousWord}
                disabled={currentWordIndex === 0}
                className="flex items-center gap-2 bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWord(!showWord)}
                className="flex items-center gap-2"
              >
                {showWord ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showWord ? "Hide" : "Show"} Word
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={skipWord}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 bg-transparent"
              >
                <ArrowRight className="w-4 h-4" />
                Skip
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Word Display */}
          <div className="text-center">
            {showWord ? (
              <div className="text-4xl font-bold text-blue-600 mb-4">{currentWord}</div>
            ) : (
              <div className="text-2xl text-gray-400 mb-4">Word Hidden - Use the buttons below to get clues</div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button variant="outline" onClick={speakWord} className="flex items-center gap-2 bg-transparent">
              <Volume2 className="w-4 h-4" />
              Pronounce
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (!wordData) fetchWordData(currentWord)
                setShowDefinition(!showDefinition)
              }}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Definition
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (!wordData) fetchWordData(currentWord)
                setShowEtymology(!showEtymology)
              }}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Etymology
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (!wordData) fetchWordData(currentWord)
                setShowPartOfSpeech(!showPartOfSpeech)
              }}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Part of Speech
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (!wordData) fetchWordData(currentWord)
                setShowExample(!showExample)
              }}
              disabled={loading}
              className="flex items-center gap-2 md:col-span-2"
            >
              <MessageSquare className="w-4 h-4" />
              Usage Example
            </Button>
          </div>

          {/* Word Information Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && <div className="text-center text-gray-500">Loading word information...</div>}

          {wordData && (
            <div className="space-y-4">
              {showDefinition && wordData.definition && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Definition:</h4>
                  <p className="text-blue-700">{wordData.definition}</p>
                </div>
              )}

              {showPartOfSpeech && wordData.partOfSpeech && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Part of Speech:</h4>
                  <Badge variant="secondary">{wordData.partOfSpeech}</Badge>
                </div>
              )}

              {showEtymology && wordData.etymology && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Etymology:</h4>
                  <p className="text-purple-700 text-sm">{wordData.etymology}</p>
                </div>
              )}

              {showExample && wordData.example && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">Usage Example:</h4>
                  <p className="text-orange-700 italic">
                    {wordData.example.replace(/\{wi\}/g, "").replace(/\{\/wi\}/g, "")}
                  </p>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Spelling Input */}
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
                  placeholder="Type the word here..."
                  onKeyPress={(e) => e.key === "Enter" && !hasCheckedSpelling && checkSpelling()}
                  className="flex-1"
                  disabled={hasCheckedSpelling}
                />
                <Button onClick={checkSpelling} disabled={!userSpelling.trim() || hasCheckedSpelling}>
                  Check
                </Button>
                <Button
                  onClick={markAsCorrect}
                  disabled={hasCheckedSpelling}
                  variant="outline"
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 bg-transparent"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Correct
                </Button>
                <Button
                  onClick={markAsIncorrect}
                  disabled={hasCheckedSpelling}
                  variant="outline"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                >
                  <ThumbsDown className="w-4 h-4" />
                  Wrong
                </Button>
              </div>
            </div>

            {/* Feedback */}
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

            {/* Next Word Button - Show after checking spelling OR always show a navigation option */}
            <div className="flex justify-center gap-4 pt-4">
              <Button
                variant="outline"
                onClick={previousWord}
                disabled={currentWordIndex === 0}
                className="flex items-center gap-2 bg-transparent"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              {hasCheckedSpelling ? (
                <Button onClick={nextWord} className="flex items-center gap-2" size="lg">
                  <RotateCcw className="w-4 h-4" />
                  {isLastWord ? "Complete Session" : "Next Word"}
                </Button>
              ) : (
                <Button
                  onClick={skipWord}
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                  size="lg"
                >
                  <ArrowRight className="w-4 h-4" />
                  {isLastWord ? "Complete Session" : "Skip Word"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Session Complete!
            </DialogTitle>
            <DialogDescription>Congratulations! You've completed your spelling test session.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{currentSession.wordsAsked.length}</div>
                <div className="text-sm text-blue-800">Total Words</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{currentSession.correctCount}</div>
                <div className="text-sm text-green-800">Correct</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{currentSession.incorrectCount}</div>
                <div className="text-sm text-red-800">Incorrect</div>
              </div>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
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
