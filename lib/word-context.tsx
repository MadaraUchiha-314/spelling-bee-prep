"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { wordListStorage, type AvailableWordList } from '@/lib/word-list-storage'
import { preferencesStorage, PREF_KEYS } from '@/lib/preferences-storage'

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

  const persistListId = useCallback((id: string) => {
    setCurrentListId(id)
    preferencesStorage.set(PREF_KEYS.SELECTED_LIST_ID, id).catch((err) =>
      console.error("Failed to persist selected list id:", err)
    )
  }, [])

  const loadAvailableLists = async () => {
    try {
      const lists = await wordListStorage.getAvailableWordLists()
      setAvailableLists(lists)
    } catch (err) {
      console.error("Failed to load available lists:", err)
    }
  }

  const loadSavedOrDefaultWordList = async () => {
    try {
      const savedListId = await preferencesStorage.get(PREF_KEYS.SELECTED_LIST_ID)

      if (savedListId) {
        const savedList = await wordListStorage.getWordList(savedListId)
        if (savedList) {
          setWords(savedList.words)
          setFilteredWords(savedList.words)
          setCurrentListName(savedList.name)
          setCurrentListId(savedList.id)
          return
        }
      }

      const defaultList = await wordListStorage.loadDefaultWordList()
      if (defaultList) {
        setWords(defaultList.words)
        setFilteredWords(defaultList.words)
        setCurrentListName(defaultList.name)
        persistListId(defaultList.id)
      }
    } catch (err) {
      console.error("Failed to load word list:", err)
    }
  }

  const loadDefaultWordList = async () => {
    try {
      const defaultList = await wordListStorage.loadDefaultWordList()
      if (defaultList) {
        setWords(defaultList.words)
        setFilteredWords(defaultList.words)
        setCurrentListName(defaultList.name)
        persistListId(defaultList.id)
      }
    } catch (err) {
      console.error("Failed to load default word list:", err)
    }
  }

  useEffect(() => {
    loadAvailableLists()
    loadSavedOrDefaultWordList()
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
    setCurrentListId: persistListId,
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