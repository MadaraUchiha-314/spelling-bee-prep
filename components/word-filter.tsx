"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Filter, RotateCcw } from "lucide-react"

interface WordFilterProps {
  words: string[]
  onWordsFiltered: (filteredWords: string[]) => void
}

export function WordFilter({ words, onWordsFiltered }: WordFilterProps) {
  const [selectedLetters, setSelectedLetters] = useState<string[]>([])
  const [filteredWords, setFilteredWords] = useState<string[]>(words)

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

  // Get count of words starting with each letter
  const getLetterCount = (letter: string) => {
    return words.filter((word) => word.toLowerCase().startsWith(letter.toLowerCase())).length
  }

  useEffect(() => {
    if (selectedLetters.length === 0) {
      setFilteredWords(words)
    } else {
      const filtered = words.filter((word) =>
        selectedLetters.some((letter) => word.toLowerCase().startsWith(letter.toLowerCase())),
      )
      setFilteredWords(filtered)
    }
  }, [selectedLetters, words])

  useEffect(() => {
    onWordsFiltered(filteredWords)
  }, [filteredWords, onWordsFiltered])

  const toggleLetter = (letter: string) => {
    setSelectedLetters((prev) => (prev.includes(letter) ? prev.filter((l) => l !== letter) : [...prev, letter]))
  }

  const clearFilters = () => {
    setSelectedLetters([])
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Words
            </CardTitle>
            <CardDescription>
              Filter words by starting letter ({filteredWords.length} of {words.length} words)
            </CardDescription>
          </div>
          {selectedLetters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2 bg-transparent"
            >
              <RotateCcw className="w-4 h-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-13 gap-2">
          {alphabet.map((letter) => {
            const count = getLetterCount(letter)
            const isSelected = selectedLetters.includes(letter)
            const hasWords = count > 0

            return (
              <Button
                key={letter}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                disabled={!hasWords}
                onClick={() => toggleLetter(letter)}
                className="relative flex flex-col h-12 p-1"
              >
                <span className="font-bold">{letter}</span>
                {hasWords && (
                  <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                    {count}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>

        {selectedLetters.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">Active filters:</p>
            <div className="flex flex-wrap gap-1">
              {selectedLetters.map((letter) => (
                <Badge key={letter} variant="default" className="text-xs">
                  {letter}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
