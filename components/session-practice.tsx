"use client"

import { useState, useEffect, useRef } from "react"
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
  Copy,
  Check,
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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import { sessionStorage, type TestSession, type WordAttempt } from "@/lib/session-storage"

interface WordData {
  word: string
  pronunciation?: string
  partOfSpeech?: string
  definition?: string
  etymology?: string
  example?: string
  audioUrl?: string
}

interface SessionPracticeProps {
  session: TestSession
  apiKey: string
  onSessionComplete: () => void
}

export function SessionPractice({ session, apiKey, onSessionComplete }: SessionPracticeProps) {
  const [currentSession, setCurrentSession] = useState<TestSession>(session)
  const [currentWordIndex, setCurrentWordIndex] = useState(session.attempts.length)
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
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isTutorMode, setIsTutorMode] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastWordRef = useRef<string>("")

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const resetWordState = () => {
    setUserSpelling("")
    setHasCheckedSpelling(false)
    setIsCorrect(null)
    setFeedback("")
    setError("")
    setIsAdvancing(false)

    setWordData(null)
    setShowDefinition(isTutorMode)
    setShowEtymology(isTutorMode)
    setShowPartOfSpeech(isTutorMode)
    setShowExample(isTutorMode)
    setShowPronunciation(isTutorMode)
    setShowWord(isTutorMode)
  }

  useEffect(() => {
    const newWord = currentSession.wordsAsked[currentWordIndex] ?? ""
    if (newWord && newWord !== lastWordRef.current) {
      setCurrentWord(newWord)
      lastWordRef.current = newWord
      resetWordState()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWordIndex, currentSession.wordsAsked])

  useEffect(() => {
    if (isTutorMode && currentWord) {
      setShowWord(true)
      setShowPronunciation(true)
      setShowDefinition(true)
      setShowEtymology(true)
      setShowPartOfSpeech(true)
      setShowExample(true)
      if (!wordData) {
        fetchWordData(currentWord)
      }
    }
  }, [isTutorMode, currentWord])

  const fetchWordData = async (word: string): Promise<WordData | null> => {
    if (!apiKey) {
      setError("Please configure your API key in Settings")
      return null
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${apiKey}`)
      if (!res.ok) throw new Error("API request failed")

      const data = await res.json()

      if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
        const entry = data[0]
        const sound = entry.hwi?.prs?.[0]?.sound
        let audioUrl: string | undefined = undefined

        if (sound?.audio) {
          const subdirectory = sound.audio.startsWith("bix")
            ? "bix"
            : sound.audio.startsWith("gg")
              ? "gg"
              : sound.audio.match(/^[^a-zA-Z]/)
                ? "number"
                : sound.audio.charAt(0)
          audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdirectory}/${sound.audio}.mp3`
        }

        const newWordData: WordData = {
          word,
          pronunciation: entry.hwi?.prs?.[0]?.mw || "",
          partOfSpeech: entry.fl || "",
          definition: entry.shortdef?.[0] || "",
          etymology: entry.et?.[0]?.[1] || "",
          example: entry.def?.[0]?.sseq?.[0]?.[0]?.[1]?.dt?.find((d: any) => d[0] === "vis")?.[1]?.[0]?.t || "",
          audioUrl: audioUrl,
        }
        setWordData(newWordData)
        return newWordData
      } else {
        setError("Word not found in dictionary")
        return null
      }
    } catch {
      setError("Failed to fetch word data. Please check your API key.")
      return null
    } finally {
      setLoading(false)
    }
  }

  const speakWordFallback = () => {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(currentWord)
      u.rate = 0.7
      speechSynthesis.speak(u)
    }
  }

  const playPronunciation = (data: WordData | null) => {
    if (data?.audioUrl) {
      const audio = new Audio(data.audioUrl)
      audio.play().catch((err) => {
        console.error("Audio playback failed, using fallback:", err)
        speakWordFallback()
      })
    } else {
      speakWordFallback()
    }
  }

  const handlePronounceClick = async () => {
    if (wordData) {
      playPronunciation(wordData)
    } else {
      const fetchedData = await fetchWordData(currentWord)
      playPronunciation(fetchedData)
    }
  }

  const copyWord = () => {
    if (currentWord) {
      navigator.clipboard.writeText(currentWord).then(() => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      })
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

  const nextWord = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (currentWordIndex < currentSession.wordsAsked.length - 1) {
      setCurrentWordIndex((i) => i + 1)
    } else {
      setCompletionOpen(true)
    }
  }

  const markCorrect = async () => {
    if (isAdvancing) return
    setIsAdvancing(true)
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
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(nextWord, 1200)
  }

  const markIncorrect = async () => {
    if (isAdvancing) return
    setIsAdvancing(true)
    setIsCorrect(false)
    setHasCheckedSpelling(true)
    setFeedback(`Marked as incorrect. The correct spelling is "${currentWord}".`)

    await recordAttempt({
      word: currentWord,
      userSpelling: userSpelling.trim(),
      isCorrect: false,
      timestamp: new Date(),
    })
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(nextWord, 1500)
  }

  const previousWord = () => {
    if (currentWordIndex > 0) setCurrentWordIndex((i) => i - 1)
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-y-2 gap-x-4">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                {currentSession.name}
              </CardTitle>
              <CardDescription>
                Word {currentWordIndex + 1} of {currentSession.wordsAsked.length}
              </CardDescription>
              <div className="flex items-center gap-2 pt-1">
                <Label htmlFor="tutor-mode-test" className={`text-sm font-medium ${!isTutorMode ? "text-foreground" : "text-muted-foreground"}`}>
                  Student
                </Label>
                <Switch
                  id="tutor-mode-test"
                  checked={isTutorMode}
                  onCheckedChange={setIsTutorMode}
                  aria-label="Toggle between Student and Tutor mode"
                />
                <Label htmlFor="tutor-mode-test" className={`text-sm font-medium ${isTutorMode ? "text-foreground" : "text-muted-foreground"}`}>
                  Tutor
                </Label>
              </div>
            </div>
            <div className="flex flex-row sm:flex-row gap-2 sm:gap-4 mt-2 sm:mt-0">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{currentSession.correctCount}</div>
                <div className="text-base sm:text-xs text-gray-500">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-red-600">{currentSession.incorrectCount}</div>
                <div className="text-base sm:text-xs text-gray-500">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">{Math.round(accuracy)}%</div>
                <div className="text-base sm:text-xs text-gray-500">Accuracy</div>
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
              <CardTitle className="flex flex-col">
                <span>Current Word</span>
                <span className="text-lg font-normal text-muted-foreground">({currentWordIndex + 1} of {currentSession.wordsAsked.length})</span>
              </CardTitle>
              <ChevronDown
                className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isPracticeOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <div className="flex flex-col sm:flex-row flex-wrap gap-y-2 gap-x-3 ml-0 sm:ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={previousWord}
                disabled={currentWordIndex === 0}
                className="bg-transparent"
                aria-label="Previous word"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              <Button variant="outline" size="sm" onClick={() => setShowWord((s) => !s)} aria-label={showWord ? "Hide word" : "Show word"}>
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

              <Button variant="outline" size="sm" onClick={copyWord} className="flex items-center gap-2 bg-transparent" aria-label="Copy word to clipboard">
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {isCopied ? "Copied!" : "Copy Word"}
              </Button>

              <Button variant="outline" size="sm" onClick={nextWord} className="bg-transparent" aria-label={isLastWord ? "Finish session" : "Next word"}>
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

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                <Button
                  variant={wordData?.audioUrl ? "secondary" : "outline"}
                  onClick={handlePronounceClick}
                  disabled={loading}
                  className="gap-2"
                  aria-label="Play pronunciation audio"
                >
                  <Volume2 className="w-4 h-4" /> Pronounce {wordData?.audioUrl ? "(MW)" : ""}
                </Button>

                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={() => {
                    if (!wordData) fetchWordData(currentWord)
                    setShowPronunciation((s) => !s)
                  }}
                  className="gap-2"
                  aria-label="Show phonetic spelling"
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
                  aria-label="Show definition"
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
                  aria-label="Show etymology"
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
                  aria-label="Show part of speech"
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
                  aria-label="Show usage example"
                >
                  <MessageSquare className="w-4 h-4" /> Usage Example
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" aria-live="assertive" role="alert">
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
                      disabled={hasCheckedSpelling || isAdvancing}
                      onClick={markCorrect}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Correct
                    </Button>

                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 bg-transparent gap-2"
                      disabled={hasCheckedSpelling || isAdvancing}
                      onClick={markIncorrect}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Wrong
                    </Button>
                  </div>
                </div>

                {feedback && (
                  <Alert variant={isCorrect ? "default" : "destructive"} aria-live="polite" role="status">
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

                {hasCheckedSpelling && !isAdvancing && (
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
