"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, X } from "lucide-react"
import { wordListStorage } from "@/lib/word-list-storage"
import { toast } from "sonner"

interface WordListUploadProps {
  onWordsUploaded: (words: string[], fileName?: string) => void
  onListSaved: () => void
}

export function WordListUpload({ onWordsUploaded, onListSaved }: WordListUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string>("")
  const [wordCount, setWordCount] = useState(0)
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
        .filter((word) => word.length > 0 && /^[a-zA-Z]+$/.test(word))

      if (words.length === 0) {
        setError("No valid words found in the file.")
        return
      }

      setUploadedFile(file)
      setWordCount(words.length)

      const listName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
      await wordListStorage.saveWordList(listName, words)
      toast.success(`Word list "${listName}" automatically saved!`)

      onListSaved()
      onWordsUploaded(words, file.name)
    } catch (err) {
      console.error("Error processing file:", err)
      setError("Error processing file. Could not save the list.")
      toast.error("Error processing file. Could not save the list.")
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setWordCount(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
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
          <p className="text-sm text-gray-500">Upload a .txt file. It will be saved automatically.</p>
        </div>
        <Input ref={fileInputRef} type="file" accept=".txt,text/plain" onChange={handleFileInput} className="hidden" />
      </div>

      {uploadedFile && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-600" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-green-800">{uploadedFile.name}</span>
              <span className="text-xs text-green-600">{wordCount} words loaded & saved</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFile} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
