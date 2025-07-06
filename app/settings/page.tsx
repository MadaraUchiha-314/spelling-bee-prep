"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiKeyManager } from "@/components/api-key-manager"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

export default function SettingsPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(true)
  const [apiKey, setApiKey] = useState<string>("")

  // Load API key from localStorage on component mount
  if (typeof window !== 'undefined') {
    const savedApiKey = localStorage.getItem("spelling-bee-api-key")
    if (savedApiKey && !apiKey) {
      setApiKey(savedApiKey)
    }
  }

  const handleApiKeySaved = (key: string) => {
    setApiKey(key)
    localStorage.setItem("spelling-bee-api-key", key)
  }

  return (
    <div className="space-y-6">
          <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen} asChild>
            <Card>
              <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between p-6 text-left">
                <div>
                  <CardTitle>API Configuration</CardTitle>
                  <CardDescription>Configure your Merriam-Webster Dictionary API key</CardDescription>
                </div>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
                    isSettingsOpen ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <ApiKeyManager currentApiKey={apiKey} onApiKeySaved={handleApiKeySaved} />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
    </div>
  )
} 