"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WordListUpload } from "@/components/word-list-upload"
import { ApiKeyManager } from "@/components/api-key-manager"
import { WordPractice } from "@/components/word-practice"
import { WordFilter } from "@/components/word-filter"
import { BookOpen, Settings, Play } from "lucide-react"

export default function SpellingBeeApp() {
  const [words, setWords] = useState<string[]>([])
  const [filteredWords, setFilteredWords] = useState<string[]>([])
  const [apiKey, setApiKey] = useState<string>("")
  const [activeTab, setActiveTab] = useState("upload")

  useEffect(() => {
    // Load API key from localStorage on component mount
    const savedApiKey = localStorage.getItem("spelling-bee-api-key")
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  const handleWordsUploaded = (uploadedWords: string[]) => {
    setWords(uploadedWords)
    setFilteredWords(uploadedWords)
    setActiveTab("practice")
  }

  const handleWordsFiltered = (filtered: string[]) => {
    setFilteredWords(filtered)
  }

  const handleApiKeySaved = (key: string) => {
    setApiKey(key)
    localStorage.setItem("spelling-bee-api-key", key)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Spelling Bee Trainer</h1>
          <p className="text-lg text-gray-600">Master your spelling skills with interactive practice</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Word Lists
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Practice
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Word List</CardTitle>
                <CardDescription>Upload a text file with words (one word per line) to start practicing</CardDescription>
              </CardHeader>
              <CardContent>
                <WordListUpload onWordsUploaded={handleWordsUploaded} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="practice" className="space-y-6">
            {words.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Please upload a word list first to start practicing.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <WordFilter words={words} onWordsFiltered={handleWordsFiltered} />
                <WordPractice words={filteredWords} apiKey={apiKey} />
              </>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>Configure your Merriam-Webster Dictionary API key</CardDescription>
              </CardHeader>
              <CardContent>
                <ApiKeyManager currentApiKey={apiKey} onApiKeySaved={handleApiKeySaved} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
