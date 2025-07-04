"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WordListUpload } from "@/components/word-list-upload"
import { SavedWordLists } from "@/components/saved-word-lists"
import { ApiKeyManager } from "@/components/api-key-manager"
import { WordPractice } from "@/components/word-practice"
import { WordFilter } from "@/components/word-filter"
import { TestSessionComponent } from "@/components/test-session"
import { SessionHistory } from "@/components/session-history"
import { SessionPractice } from "@/components/session-practice"
import { BookOpen, Settings, Play, Archive, Trophy, History } from "lucide-react"
import { sessionStorage, type TestSession } from "@/lib/session-storage"
import { wordListStorage, type SavedWordList } from "@/lib/word-list-storage"

export default function SpellingBeeApp() {
  const [words, setWords] = useState<string[]>([])
  const [filteredWords, setFilteredWords] = useState<string[]>([])
  const [apiKey, setApiKey] = useState<string>("")
  const [activeTab, setActiveTab] = useState("upload")
  const [currentListName, setCurrentListName] = useState<string>("")
  const [currentListId, setCurrentListId] = useState<string>("")
  const [currentSession, setCurrentSession] = useState<TestSession | null>(null)
  const [savedLists, setSavedLists] = useState<SavedWordList[]>([])

  const loadSavedLists = useCallback(async () => {
    try {
      const lists = await wordListStorage.getAllWordLists()
      setSavedLists(lists)
    } catch (err) {
      console.error("Failed to load saved lists:", err)
    }
  }, [])

  useEffect(() => {
    const savedApiKey = localStorage.getItem("spelling-bee-api-key")
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
    loadActiveSession()
    loadSavedLists()
  }, [loadSavedLists])

  const loadActiveSession = async () => {
    try {
      const sessions = await sessionStorage.getAllSessions()
      const activeSession = sessions.find((session) => !session.isCompleted)
      if (activeSession) {
        setCurrentSession(activeSession)
      }
    } catch (err) {
      console.error("Error loading active session:", err)
    }
  }

  const handleWordsUploaded = (uploadedWords: string[], fileName?: string) => {
    setWords(uploadedWords)
    setFilteredWords(uploadedWords)
    setCurrentListName(fileName || "Uploaded List")
    setCurrentListId("")
    setActiveTab("practice")
  }

  const handleWordsFiltered = (filtered: string[]) => {
    setFilteredWords(filtered)
  }

  const handleApiKeySaved = (key: string) => {
    setApiKey(key)
    localStorage.setItem("spelling-bee-api-key", key)
  }

  const handleSavedListSelected = (selectedWords: string[], listName: string, listId?: string) => {
    setWords(selectedWords)
    setFilteredWords(selectedWords)
    setCurrentListName(listName)
    setCurrentListId(listId || "")
    setActiveTab("practice")
  }

  const handleSessionStart = (session: TestSession) => {
    setCurrentSession(session)
    setActiveTab("test")
  }

  const handleSessionComplete = () => {
    setCurrentSession(null)
    setActiveTab("history")
  }

  const handleResumeSession = (session: TestSession) => {
    setCurrentSession(session)
    setActiveTab("test")
  }

  const showSessionPractice = currentSession && activeTab === "test"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Spelling Bee Trainer</h1>
          <p className="text-lg text-gray-600">Master your spelling skills with interactive practice</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Saved Lists
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Practice
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Test Session
              {currentSession && !currentSession.isCompleted && (
                <span className="ml-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
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
                <WordListUpload onWordsUploaded={handleWordsUploaded} onListSaved={loadSavedLists} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            <SavedWordLists
              lists={savedLists}
              onWordListSelected={handleSavedListSelected}
              onListsUpdated={loadSavedLists}
            />
          </TabsContent>

          <TabsContent value="practice" className="space-y-6">
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
                    <CardTitle>Current Word List</CardTitle>
                    <CardDescription>
                      {currentListName} - {words.length} words total
                    </CardDescription>
                  </CardHeader>
                </Card>
                <WordFilter words={words} onWordsFiltered={handleWordsFiltered} />
                <WordPractice words={filteredWords} apiKey={apiKey} />
              </>
            )}
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            {showSessionPractice ? (
              <SessionPractice session={currentSession} apiKey={apiKey} onSessionComplete={handleSessionComplete} />
            ) : (
              <TestSessionComponent
                words={words}
                wordListName={currentListName}
                wordListId={currentListId}
                apiKey={apiKey}
                onSessionStart={handleSessionStart}
              />
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <SessionHistory onResumeSession={handleResumeSession} />
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
