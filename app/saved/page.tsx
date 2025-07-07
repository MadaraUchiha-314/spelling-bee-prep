"use client"

import { useState, useEffect, useCallback } from "react"
import { SavedWordLists } from "@/components/saved-word-lists"
import { useRouter } from "next/navigation"
import { useWordContext } from "@/lib/word-context"
import { wordListStorage, type SavedWordList, type AvailableWordList } from "@/lib/word-list-storage"

export default function SavedPage() {
  const [savedLists, setSavedLists] = useState<SavedWordList[]>([])
  const router = useRouter()
  const { setWords, setFilteredWords, setCurrentListName, setCurrentListId, availableLists, currentListId } = useWordContext()

  const loadSavedLists = useCallback(async () => {
    try {
      const lists = await wordListStorage.getAllWordLists()
      setSavedLists(lists)
    } catch (err) {
      console.error("Failed to load saved lists:", err)
    }
  }, [])

  useEffect(() => {
    loadSavedLists()
  }, [loadSavedLists])

  const handleSavedListSelected = (selectedWords: string[], listName: string, listId?: string) => {
    setWords(selectedWords)
    setFilteredWords(selectedWords)
    setCurrentListName(listName)
    setCurrentListId(listId || "")
    // router.push('/practice')
  }

  return (
    <div className="space-y-6">
          <SavedWordLists
            lists={savedLists}
            availableLists={availableLists}
            currentListId={currentListId}
            onWordListSelected={handleSavedListSelected}
            onListsUpdated={loadSavedLists}
          />
    </div>
  )
} 