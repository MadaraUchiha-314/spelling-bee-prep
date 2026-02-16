"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Volume2,
  BookOpen,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Headphones,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface WordData {
  word: string
  pronunciation?: string
  partOfSpeech?: string
  definition?: string
  etymology?: string
  example?: string
  audioUrl?: string
}

interface WordPracticeProps {
  words: string[]
  apiKey: string
}

export function WordPractice({ words, apiKey }: WordPracticeProps) {
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
  const [showPronunciation, setShowPronunciation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [randomizeWords, setRandomizeWords] = useState(false)
  const [shuffledWords, setShuffledWords] = useState<string[]>([])
  const [isPracticeOpen, setIsPracticeOpen] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [isTutorMode, setIsTutorMode] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (words.length > 0 && currentWordIndex < words.length) {
      setCurrentWord(words[currentWordIndex])
      resetWordState()
    }
  }, [currentWordIndex, words])

  useEffect(() => {
    if (randomizeWords) {
      const shuffled = [...words].sort(() => Math.random() - 0.5)
      setShuffledWords(shuffled)
    } else {
      setShuffledWords(words)
    }
    setCurrentWordIndex(0)
  }, [words, randomizeWords])

  useEffect(() => {
    const wordsToUse = shuffledWords.length > 0 ? shuffledWords : words
    if (wordsToUse.length > 0 && currentWordIndex < wordsToUse.length) {
      setCurrentWord(wordsToUse[currentWordIndex])
      resetWordState()
    }
  }, [currentWordIndex, shuffledWords, words])

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

  const resetWordState = () => {
    setWordData(null)
    setUserSpelling("")
    setHasCheckedSpelling(false)
    setShowDefinition(isTutorMode)
    setShowEtymology(isTutorMode)
    setShowPartOfSpeech(isTutorMode)
    setShowExample(isTutorMode)
    setShowWord(isTutorMode)
    setShowPronunciation(isTutorMode)
    setError("")
  }

  const clearFeedback = () => {
    setFeedback("")
    setIsCorrect(null)
  }

  const fetchWordData = async (word: string): Promise<WordData | null> => {
    if (!apiKey) {
      setError("Please configure your API key in Settings")
      return null
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
          word: word,
          pronunciation: entry.hwi?.prs?.[0]?.mw || "",
          partOfSpeech: entry.fl || "",
          definition: entry.shortdef?.[0] || "",
          etymology: entry.et?.[0]?.[1] || "",
          example: entry.def?.[0]?.sseq?.[0]?.[0]?.[1]?.dt?.find((item: any) => item[0] === "vis")?.[1]?.[0]?.t || "",
          audioUrl: audioUrl,
        }

        setWordData(newWordData)
        return newWordData
      } else {
        setError("Word not found in dictionary")
        return null
      }
    } catch (err) {
      setError("Failed to fetch word data. Please check your API key.")
      return null
    } finally {
      setLoading(false)
    }
  }

  const speakWordFallback = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord)
      utterance.rate = 0.7
      speechSynthesis.speak(utterance)
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

  const checkSpelling = () => {
    if (!userSpelling.trim()) return

    const correct = userSpelling.toLowerCase().trim() === currentWord.toLowerCase()
    setIsCorrect(correct)
    setHasCheckedSpelling(true)

    if (correct) {
      setCorrectCount((prev) => prev + 1)
      setFeedback("Correct! Well done!")
    } else {
      setIncorrectCount((prev) => prev + 1)
      const userWord = userSpelling.toLowerCase().trim()
      const correctWord = currentWord.toLowerCase()

      let feedbackText = `Incorrect. The correct spelling is "${currentWord}". `
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

  const markAsCorrect = () => {
    setIsCorrect(true)
    setHasCheckedSpelling(true)
    setCorrectCount((prev) => prev + 1)
    setFeedback("Marked as correct!")
    if (!userSpelling.trim()) {
      setUserSpelling(currentWord)
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(nextWord, 1200)
  }

  const markAsIncorrect = () => {
    setIsCorrect(false)
    setHasCheckedSpelling(true)
    setIncorrectCount((prev) => prev + 1)
    setFeedback(`Marked as incorrect. The correct spelling is "${currentWord}".`)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(nextWord, 1500)
  }

  const nextWord = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    clearFeedback()
    const wordsToUse = shuffledWords.length > 0 ? shuffledWords : words
    if (currentWordIndex < wordsToUse.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
    } else {
      setCurrentWordIndex(0)
    }
  }

  const skipWord = () => {
    clearFeedback()
    nextWord()
  }

  const previousWord = () => {
    clearFeedback()
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1)
    }
  }

  const accuracy = correctCount + incorrectCount > 0 ? (correctCount / (correctCount + incorrectCount)) * 100 : 0

  if (words.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No words to practice</p>
            <p>Please upload a word list or adjust your filters.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-y-2 gap-x-4">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Practice Mode
              </CardTitle>
              <CardDescription>
                Word {currentWordIndex + 1} of {shuffledWords.length > 0 ? shuffledWords.length : words.length}
              </CardDescription>
              <div className="flex items-center gap-2 pt-1">
                <Label htmlFor="tutor-mode-practice" className={`text-sm font-medium ${!isTutorMode ? "text-foreground" : "text-muted-foreground"}`}>
                  Student
                </Label>
                <Switch
                  id="tutor-mode-practice"
                  checked={isTutorMode}
                  onCheckedChange={setIsTutorMode}
                  aria-label="Toggle between Student and Tutor mode"
                />
                <Label htmlFor="tutor-mode-practice" className={`text-sm font-medium ${isTutorMode ? "text-foreground" : "text-muted-foreground"}`}>
                  Tutor
                </Label>
              </div>
            </div>
            <div className="flex flex-row sm:flex-row gap-2 sm:gap-4 mt-2 sm:mt-0">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{correctCount}</div>
                <div className="text-base sm:text-xs text-gray-500">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-red-600">{incorrectCount}</div>
                <div className="text-base sm:text-xs text-gray-500">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">{Math.round(accuracy)}%</div>
                <div className="text-base sm:text-xs text-gray-500">Accuracy</div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Collapsible open={isPracticeOpen} onOpenChange={setIsPracticeOpen} asChild>
        <Card>
          <div className="flex items-center p-6">
            <CollapsibleTrigger className="flex flex-1 cursor-pointer items-center justify-between text-left">
              <CardTitle>
                Current Word ({currentWordIndex + 1} of {shuffledWords.length > 0 ? shuffledWords.length : words.length}
                )
              </CardTitle>
              <ChevronDown
                className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isPracticeOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-y-2 gap-x-3 ml-0 sm:ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={previousWord}
                disabled={currentWordIndex === 0}
                className="flex items-center gap-2 bg-transparent"
                aria-label="Previous word"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRandomizeWords(!randomizeWords)}
                className={`flex items-center gap-2 ${randomizeWords ? "bg-blue-50 text-blue-600" : "bg-transparent"}`}
                aria-label={randomizeWords ? "Show words in order" : "Randomize word order"}
              >
                <RotateCcw className="w-4 h-4" />
                {randomizeWords ? "Ordered" : "Random"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWord(!showWord)}
                className="flex items-center gap-2"
                aria-label={showWord ? "Hide word" : "Show word"}
              >
                {showWord ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showWord ? "Hide" : "Show"} Word
              </Button>
              <Button variant="outline" size="sm" onClick={copyWord} className="flex items-center gap-2 bg-transparent" aria-label="Copy word to clipboard">
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {isCopied ? "Copied!" : "Copy Word"}
              </Button>
              <Button variant="outline" size="sm" onClick={skipWord} className="flex items-center gap-2 bg-transparent" aria-label="Next word">
                <ArrowRight className="w-4 h-4" />
                Next Word
              </Button>
            </div>
          </div>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              <div className="text-center">
                {showWord ? (
                  <div className="text-4xl font-bold text-blue-600 mb-4">
                    <a
                      href={`https://www.merriam-webster.com/dictionary/${encodeURIComponent(currentWord)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 hover:underline"
                    >
                      {currentWord}
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                ) : (
                  <div className="text-2xl text-gray-400 mb-4">Word Hidden - Use the buttons below to get clues</div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                <Button
                  variant={wordData?.audioUrl ? "secondary" : "outline"}
                  onClick={handlePronounceClick}
                  disabled={loading}
                  className="flex items-center gap-2"
                  aria-label="Play pronunciation audio"
                >
                  <Volume2 className="w-4 h-4" />
                  Pronounce {wordData?.audioUrl ? "(MW)" : ""}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    if (!wordData) fetchWordData(currentWord)
                    setShowPronunciation(!showPronunciation)
                  }}
                  disabled={loading}
                  className="flex items-center gap-2"
                  aria-label="Show phonetic spelling"
                >
                  <Headphones className="w-4 h-4" />
                  Phonetic
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    if (!wordData) fetchWordData(currentWord)
                    setShowDefinition(!showDefinition)
                  }}
                  disabled={loading}
                  className="flex items-center gap-2"
                  aria-label="Show definition"
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
                  aria-label="Show etymology"
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
                  aria-label="Show part of speech"
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
                  className="flex items-center gap-2"
                  aria-label="Show usage example"
                >
                  <MessageSquare className="w-4 h-4" />
                  Usage Example
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading && <div className="text-center text-gray-500">Loading word information...</div>}

              {wordData && (
                <div className="space-y-4">
                  {showPronunciation && wordData.pronunciation && (
                    <div className="p-4 bg-indigo-50 rounded-lg">
                      <h4 className="font-semibold text-indigo-800 mb-2">Phonetic Spelling:</h4>
                      <p className="text-indigo-700 font-mono text-lg">/{wordData.pronunciation}/</p>
                    </div>
                  )}

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

              <div className="space-y-4">
                <div>
                  <label htmlFor="spelling-input" className="block text-sm font-medium mb-2">
                    Enter your spelling:
                  </label>
                  <div className="flex flex-col md:flex-row gap-2 md:gap-3">
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

                {feedback && (
                  <Alert
                    variant={isCorrect ? "default" : "destructive"}
                    className={isCorrect ? "border-green-200 bg-green-50" : ""}
                    aria-live="polite"
                    role="status"
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

                <div className="flex justify-center gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={previousWord}
                    disabled={currentWordIndex === 0}
                    className="flex items-center gap-2 bg-transparent"
                    size="lg"
                    aria-label="Previous word"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  {hasCheckedSpelling ? (
                    <Button onClick={nextWord} className="flex items-center gap-2" size="lg" aria-label="Next word">
                      <RotateCcw className="w-4 h-4" />
                      Next Word
                    </Button>
                  ) : (
                    <Button
                      onClick={skipWord}
                      variant="outline"
                      className="flex items-center gap-2 bg-transparent"
                      size="lg"
                      aria-label="Next word"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Next Word
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
