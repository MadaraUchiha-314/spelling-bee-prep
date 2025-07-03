"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, FileText, X, Save } from "lucide-react"
import { wordListStorage } from "@/lib/word-list-storage"

interface WordListUploadProps {
  onWordsUploaded: (words: string[], fileName?: string) => void
}

export function WordListUpload({ onWordsUploaded }: WordListUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string>("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveListName, setSaveListName] = useState("")
  const [currentWords, setCurrentWords] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    setError("")

    if (!file.type.includes("text") && !file.name.endsWith(".txt")) {
      setError("Please upload a text file (.txt)")
      return
    }

    try {
      const text = await file.text()
      const words = text
        .split("\n")
        .map((word) => word.trim())
        .filter((word) => word.length > 0)
        .filter((word) => /^[a-zA-Z]+$/.test(word)) // Only alphabetic characters

      if (words.length === 0) {
        setError("No valid words found in the file")
        return
      }

      setUploadedFile(file)
      setCurrentWords(words)

      // Set default save name from filename
      const defaultName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
      setSaveListName(defaultName)

      onWordsUploaded(words, file.name)
    } catch (err) {
      setError("Error reading file")
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setCurrentWords([])
    setSaveListName("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSaveWordList = async () => {
    if (!saveListName.trim() || currentWords.length === 0) return

    try {
      setSaving(true)
      await wordListStorage.saveWordList(saveListName.trim(), currentWords)
      setShowSaveDialog(false)
      setSaveListName("")
      // Show success message or toast here if desired
    } catch (err) {
      setError("Failed to save word list")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: "pointer" }}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <div className="space-y-2">
          <p className="text-lg font-medium">Drop your word list here, or click to browse</p>
          <p className="text-sm text-gray-500">Upload a .txt file with one word per line</p>
        </div>

        <div className="mt-4">
          <Button
            variant="outline"
            className="mt-2 bg-transparent"
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
          >
            Choose File
          </Button>
        </div>

        <Input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          onChange={handleFileInput}
          className="hidden"
          style={{ display: "none" }}
        />
      </div>

      {uploadedFile && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-600" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-green-800">{uploadedFile.name}</span>
              <span className="text-xs text-green-600">{currentWords.length} words loaded</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-1 text-green-600 hover:text-green-700"
            >
              <Save className="w-3 h-3" />
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={clearFile} className="text-green-600 hover:text-green-800">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Word List</DialogTitle>
            <DialogDescription>Give your word list a name to save it for future use.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="list-name">Word List Name</Label>
            <Input
              id="list-name"
              value={saveListName}
              onChange={(e) => setSaveListName(e.target.value)}
              placeholder="Enter a name for this word list..."
            />
            <p className="text-sm text-gray-500">This list contains {currentWords.length} words</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveWordList} disabled={!saveListName.trim() || saving}>
              {saving ? "Saving..." : "Save Word List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
