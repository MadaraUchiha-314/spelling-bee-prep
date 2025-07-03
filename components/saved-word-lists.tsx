"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { BookOpen, Trash2, Edit, Calendar, FileText, Download, RefreshCw } from "lucide-react"
import { wordListStorage, type SavedWordList } from "@/lib/word-list-storage"

interface SavedWordListsProps {
  onWordListSelected: (words: string[], name: string, id?: string) => void
}

export function SavedWordLists({ onWordListSelected }: SavedWordListsProps) {
  const [savedLists, setSavedLists] = useState<SavedWordList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingList, setEditingList] = useState<SavedWordList | null>(null)
  const [newName, setNewName] = useState("")

  const loadSavedLists = async () => {
    try {
      setLoading(true)
      setError("")
      const lists = await wordListStorage.getAllWordLists()
      setSavedLists(lists)
    } catch (err) {
      setError("Failed to load saved word lists")
      console.error("Error loading word lists:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSavedLists()
  }, [])

  const handleSelectList = async (list: SavedWordList) => {
    try {
      onWordListSelected(list.words, list.name, list.id)
    } catch (err) {
      setError("Failed to load word list")
    }
  }

  const handleDeleteList = async (id: string) => {
    try {
      await wordListStorage.deleteWordList(id)
      setSavedLists((prev) => prev.filter((list) => list.id !== id))
    } catch (err) {
      setError("Failed to delete word list")
    }
  }

  const handleRenameList = async () => {
    if (!editingList || !newName.trim()) return

    try {
      await wordListStorage.updateWordListName(editingList.id, newName.trim())
      setSavedLists((prev) =>
        prev.map((list) => (list.id === editingList.id ? { ...list, name: newName.trim() } : list)),
      )
      setEditingList(null)
      setNewName("")
    } catch (err) {
      setError("Failed to rename word list")
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const downloadWordList = (list: SavedWordList) => {
    const content = list.words.join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${list.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Loading saved word lists...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Saved Word Lists
            </CardTitle>
            <CardDescription>
              {savedLists.length === 0
                ? "No saved word lists yet"
                : `${savedLists.length} saved word list${savedLists.length === 1 ? "" : "s"}`}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSavedLists}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {savedLists.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No saved word lists</p>
            <p className="text-sm">Upload a word list to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedLists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{list.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {list.wordCount} words
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(list.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectList(list)}
                    className="flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3" />
                    Use
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadWordList(list)}
                    className="flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingList(list)
                          setNewName(list.name)
                        }}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rename Word List</DialogTitle>
                        <DialogDescription>Enter a new name for this word list.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Label htmlFor="new-name">Name</Label>
                        <Input
                          id="new-name"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="Enter word list name..."
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingList(null)
                            setNewName("")
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleRenameList} disabled={!newName.trim()}>
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 bg-transparent"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Word List</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{list.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteList(list.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
