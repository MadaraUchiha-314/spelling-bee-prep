"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Filter } from "lucide-react"

interface WordFilterProps {
  words: string[]
  onWordsFiltered?: (filteredWords: string[]) => void
}

export function WordFilter({ words, onWordsFiltered }: WordFilterProps) {
  const [selectedLetters, setSelectedLetters] = useState<string[]>([])
  const [filteredWords, setFilteredWords] = useState<string[]>(words)

  // Update filtered words when words prop changes
  useEffect(() => {
    setFilteredWords(words)
    if (onWordsFiltered) {
      onWordsFiltered(words)
    }
  }, [words, onWordsFiltered])

  // Filter words when selected letters change
  useEffect(() => {
    if (selectedLetters.length === 0) {
      setFilteredWords(words)
      if (onWordsFiltered) {
        onWordsFiltered(words)
      }
    } else {
      const filtered = words.filter((word) =>
        selectedLetters.some((letter) => word.toLowerCase().startsWith(letter.toLowerCase())),
      )
      setFilteredWords(filtered)
      if (onWordsFiltered) {
        onWordsFiltered(filtered)
      }
    }
  }, [selectedLetters, words, onWordsFiltered])

  const toggleLetter = (letter: string) => {
    setSelectedLetters((prev) => (prev.includes(letter) ? prev.filter((l) => l !== letter) : [...prev, letter]))
  }

  const clearFilters = () => {
    setSelectedLetters([])
  }

  const getWordCountForLetter = (letter: string) => {
    return words.filter((word) => word.toLowerCase().startsWith(letter.toLowerCase())).length
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Words by Starting Letter
            </CardTitle>
            <CardDescription>
              {selectedLetters.length === 0
                ? `Showing all ${words.length} words`
                : `Showing ${filteredWords.length} words starting with: ${selectedLetters.join(", ")}`}
            </CardDescription>
          </div>
          {selectedLetters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2 bg-transparent"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 md:grid-cols-13 gap-2">
          {alphabet.map((letter) => {
            const wordCount = getWordCountForLetter(letter)
            const isSelected = selectedLetters.includes(letter)
            const hasWords = wordCount > 0

            return (
              <Button
                key={letter}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                disabled={!hasWords}
                onClick={() => toggleLetter(letter)}
                className={`relative flex flex-col items-center justify-center h-16 p-2 ${
                  isSelected ? "bg-blue-600 text-white" : ""
                } ${!hasWords ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span className="text-lg font-bold">{letter}</span>
                {hasWords && (
                  <Badge
                    variant={isSelected ? "secondary" : "default"}
                    className={`absolute -top-1 -right-1 text-xs min-w-[20px] h-5 ${
                      isSelected ? "bg-white text-blue-600" : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {wordCount}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>

        {selectedLetters.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-blue-800">Active filters:</span>
              {selectedLetters.map((letter) => (
                <Badge key={letter} variant="default" className="bg-blue-600 text-white">
                  {letter}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLetter(letter)}
                    className="ml-1 h-4 w-4 p-0 hover:bg-blue-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
