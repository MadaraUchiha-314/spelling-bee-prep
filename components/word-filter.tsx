"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { X, Filter, ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface WordFilterProps {
  words: string[]
  onWordsFiltered?: (filteredWords: string[]) => void
}

export function WordFilter({ words, onWordsFiltered }: WordFilterProps) {
  const [selectedLetters, setSelectedLetters] = useState<string[]>([])
  const [filteredWords, setFilteredWords] = useState<string[]>(words)
  const [isOpen, setIsOpen] = useState(false)

  // Update filtered words when words prop changes
  useEffect(() => {
    setFilteredWords(words)
  }, [words])

  // Filter words when selected letters change
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

  // 3️⃣ inform parent whenever the result list changes
  useEffect(() => {
    if (onWordsFiltered) {
      onWordsFiltered(filteredWords)
    }
  }, [filteredWords, onWordsFiltered])

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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <Card>
        <div className="flex items-center p-6">
          <CollapsibleTrigger className="flex flex-1 cursor-pointer items-center justify-between text-left">
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
            <ChevronDown
              className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          {selectedLetters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="ml-4 flex items-center gap-2 bg-transparent"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          )}
        </div>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2 md:grid md:grid-cols-13 md:gap-2">
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
