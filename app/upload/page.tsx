"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WordListUpload } from "@/components/word-list-upload"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useWordContext } from "@/lib/word-context"

export default function UploadPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(true)
  const router = useRouter()
  const { setWords, setFilteredWords, setCurrentListName, setCurrentListId } = useWordContext()

  const handleWordsUploaded = (uploadedWords: string[], fileName?: string) => {
    setWords(uploadedWords)
    setFilteredWords(uploadedWords)
    setCurrentListName(fileName || "Uploaded List")
    setCurrentListId("")
    router.push('/practice')
  }

  const handleListSaved = async () => {
    // Refresh saved lists if needed
  }

  return (
    <div className="space-y-6">
      <Collapsible open={isUploadOpen} onOpenChange={setIsUploadOpen} asChild>
        <Card>
          <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between p-6 text-left">
            <div>
              <CardTitle>Upload Word List</CardTitle>
              <CardDescription>
                Upload a text file with words (one word per line) to start practicing
              </CardDescription>
            </div>
            <ChevronDown
              className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isUploadOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <WordListUpload onWordsUploaded={handleWordsUploaded} onListSaved={handleListSaved} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
} 