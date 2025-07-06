"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { wordListStorage, type AvailableWordList } from '@/lib/word-list-storage'

interface WordContextType {
  words: string[]
  filteredWords: string[]
  currentListName: string
  currentListId: string
  availableLists: AvailableWordList[]
  setWords: (words: string[]) => void
  setFilteredWords: (words: string[]) => void
  setCurrentListName: (name: string) => void
  setCurrentListId: (id: string) => void
  loadDefaultWordList: () => Promise<void>
}

const WordContext = createContext<WordContextType | undefined>(undefined)

export function WordProvider({ children }: { children: ReactNode }) {
  const [words, setWords] = useState<string[]>([])
  const [filteredWords, setFilteredWords] = useState<string[]>([])
  const [currentListName, setCurrentListName] = useState<string>("")
  const [currentListId, setCurrentListId] = useState<string>("")
  const [availableLists, setAvailableLists] = useState<AvailableWordList[]>([])

  const loadAvailableLists = async () => {
    try {
      const lists = await wordListStorage.getAvailableWordLists()
      setAvailableLists(lists)
    } catch (err) {
      console.error("Failed to load available lists:", err)
    }
  }

  const loadDefaultWordList = async () => {
    try {
      const defaultList = await wordListStorage.loadDefaultWordList()
      if (defaultList) {
        setWords(defaultList.words)
        setFilteredWords(defaultList.words)
        setCurrentListName(defaultList.name)
        setCurrentListId(defaultList.id)
      }
    } catch (err) {
      console.error("Failed to load default word list:", err)
    }
  }

  useEffect(() => {
    loadAvailableLists()
    loadDefaultWordList()
  }, [])

  const value = {
    words,
    filteredWords,
    currentListName,
    currentListId,
    availableLists,
    setWords,
    setFilteredWords,
    setCurrentListName,
    setCurrentListId,
    loadDefaultWordList,
  }

  return (
    <WordContext.Provider value={value}>
      {children}
    </WordContext.Provider>
  )
}

export function useWordContext() {
  const context = useContext(WordContext)
  if (context === undefined) {
    throw new Error('useWordContext must be used within a WordProvider')
  }
  return context
} 