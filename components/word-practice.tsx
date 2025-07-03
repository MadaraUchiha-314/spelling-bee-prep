"use client"

import { useState, useEffect } from "react"
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
  RotateCcw,
  CheckCircle,
  XCircle,
  Shuffle,
  Eye,
  EyeOff,
} from "lucide-react"

interface WordData {
  word: string
  pronunciation?: string
  partOfSpeech?: string
  definition?: string
  etymology?: string
  example?: string
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
  const [showDefinition, setShowDefinition] = useState(false)
  const [showEtymology, setShowEtymology] = useState(false)
  const [showPartOfSpeech, setShowPartOfSpeech] = useState(false)
  const [showExample, setShowExample] = useState(false)
  const [showWord, setShowWord] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [shuffledWords, setShuffledWords] = useState<string[]>([])

  // Shuffle words when component mounts or words change
  useEffect(() => {
    if (words.length > 0) {
      const shuffled = [...words].sort(() => Math.random() - 0.5)
      setShuffledWords(shuffled)
      setCurrentWordIndex(0)
    }
  }, [words])

  // Set current word when index changes
  useEffect(() => {
    if (shuffledWords.length > 0) {
      setCurrentWord(shuffledWords[currentWordIndex])
      resetWordState()
    }
  }, [currentWordIndex, shuffledWords])

  const resetWordState = () => {
    setWordData(null)
    setUserSpelling("")
    setFeedback("")
    setIsCorrect(null)
    setShowDefinition(false)
    setShowEtymology(false)
    setShowPartOfSpeech(false)
    setShowExample(false)
    setShowWord(false)
    setError("")
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

  const checkSpelling = () => {
    const correct = userSpelling.toLowerCase().trim() === currentWord.toLowerCase()
    setIsCorrect(correct)

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

  const nextWord = () => {
    if (currentWordIndex < shuffledWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
    } else {
      // Reshuffle and start over
      const reshuffled = [...words].sort(() => Math.random() - 0.5)
      setShuffledWords(reshuffled)
      setCurrentWordIndex(0)
    }
  }

  const reshuffleWords = () => {
    const reshuffled = [...words].sort(() => Math.random() - 0.5)
    setShuffledWords(reshuffled)
    setCurrentWordIndex(0)
  }

  if (words.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No words available for practice.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Word Practice</CardTitle>
              <CardDescription>
                Word {currentWordIndex + 1} of {shuffledWords.length}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={reshuffleWords}
                className="flex items-center gap-2 bg-transparent"
              >
                <Shuffle className="w-4 h-4" />
                Reshuffle
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
                  onKeyPress={(e) => e.key === "Enter" && checkSpelling()}
                  className="flex-1"
                />
                <Button onClick={checkSpelling} disabled={!userSpelling.trim()}>
                  Check
                </Button>
              </div>
            </div>

            {/* Feedback */}
            {feedback && (
              <Alert variant={isCorrect ? "default" : "destructive"}>
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription>{feedback}</AlertDescription>
                </div>
              </Alert>
            )}

            {/* Next Word Button */}
            {isCorrect !== null && (
              <div className="flex justify-center">
                <Button onClick={nextWord} className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Next Word
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
