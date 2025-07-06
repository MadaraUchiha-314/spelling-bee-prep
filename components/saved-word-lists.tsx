"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { BookOpen, Trash2, Edit, Calendar, FileText, Download, RefreshCw, ChevronDown } from "lucide-react"
import { wordListStorage, type SavedWordList, type AvailableWordList } from "@/lib/word-list-storage"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "sonner"

interface SavedWordListsProps {
  lists: SavedWordList[]
  availableLists: AvailableWordList[]
  onWordListSelected: (words: string[], name: string, id?: string) => void
  onListsUpdated: () => void
}

export function SavedWordLists({ lists, availableLists, onWordListSelected, onListsUpdated }: SavedWordListsProps) {
  const [error, setError] = useState("")
  const [editingList, setEditingList] = useState<SavedWordList | null>(null)
  const [newName, setNewName] = useState("")
  const [isOpen, setIsOpen] = useState(true)

  const handleSelectList = (list: SavedWordList) => {
    onWordListSelected(list.words, list.name, list.id)
  }

  const handleDeleteList = async (id: string, name: string) => {
    try {
      await wordListStorage.deleteWordList(id)
      toast.success(`Deleted "${name}" list.`)
      onListsUpdated()
    } catch (err) {
      setError("Failed to delete word list")
      toast.error("Failed to delete word list.")
    }
  }

  const handleRenameList = async () => {
    if (!editingList || !newName.trim()) return

    try {
      await wordListStorage.updateWordListName(editingList.id, newName.trim())
      toast.success(`Renamed list to "${newName.trim()}".`)
      onListsUpdated()
      setEditingList(null)
      setNewName("")
    } catch (err) {
      setError("Failed to rename word list")
      toast.error("Failed to rename word list.")
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <Card>
        <div className="flex items-center p-6">
          <CollapsibleTrigger className="flex flex-1 cursor-pointer items-center justify-between text-left">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Saved Word Lists
              </CardTitle>
              <CardDescription>
                {lists.length === 0
                  ? "No saved word lists yet"
                  : `${lists.length} saved word list${lists.length === 1 ? "" : "s"}`}
              </CardDescription>
            </div>
            <ChevronDown
              className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <Button
            variant="outline"
            size="sm"
            onClick={onListsUpdated}
            className="ml-4 flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {lists.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No saved word lists</p>
                <p className="text-sm">Upload a word list to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lists.map((list) => (
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
                        {list.id === availableLists[0]?.id && (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(list.createdAt)}
                        </span>
                        {list.id === availableLists[0]?.id && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {availableLists[0]?.path.replace('/data/', 'data/')}
                          </span>
                        )}
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

                      <Dialog
                        open={editingList?.id === list.id}
                        onOpenChange={(isOpen) => {
                          if (!isOpen) setEditingList(null)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingList(list)
                              setNewName(list.name)
                            }}
                            className="flex items-center gap-1"
                            disabled={list.id === availableLists[0]?.id}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rename Word List</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2 pt-4">
                            <Label htmlFor="new-name">Name</Label>
                            <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingList(null)}>
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
                            disabled={list.id === availableLists[0]?.id}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{list.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteList(list.id, list.name)}
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
