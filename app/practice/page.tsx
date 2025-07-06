"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WordPractice } from "@/components/word-practice"
import { WordFilter } from "@/components/word-filter"
import { BookOpen } from "lucide-react"
import { useWordContext } from "@/lib/word-context"

export default function PracticePage() {
  const [apiKey, setApiKey] = useState<string>("")
  const { 
    words, 
    filteredWords, 
    currentListName, 
    currentListId, 
    availableLists, 
    setFilteredWords 
  } = useWordContext()

  useEffect(() => {
    const savedApiKey = localStorage.getItem("spelling-bee-api-key")
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  const handleWordsFiltered = (filtered: string[]) => {
    setFilteredWords(filtered)
  }

  return (
    <div className="space-y-6">
          {words.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No word list selected</p>
                  <p>Please upload a new word list or select a saved one to start practicing.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Current Word List
                    {currentListId === availableLists[0]?.id && (
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                        Default List
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {currentListName} - {words.length} words total
                    {currentListId === availableLists[0]?.id && (
                      <span className="block text-xs text-gray-500 mt-1">
                        Source: {availableLists[0]?.path.replace('/data/', 'data/')}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
              <WordFilter words={words} onWordsFiltered={handleWordsFiltered} />
              <WordPractice words={filteredWords} apiKey={apiKey} />
            </>
          )}
    </div>
  )
} 