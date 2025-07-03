"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Key, ExternalLink, Eye, EyeOff } from "lucide-react"

interface ApiKeyManagerProps {
  currentApiKey: string
  onApiKeySaved: (apiKey: string) => void
}

export function ApiKeyManager({ currentApiKey, onApiKeySaved }: ApiKeyManagerProps) {
  const [apiKey, setApiKey] = useState(currentApiKey)
  const [showApiKey, setShowApiKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    onApiKeySaved(apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const maskedApiKey = apiKey ? apiKey.slice(0, 8) + "..." + apiKey.slice(-4) : ""

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Merriam-Webster API Key
          </CardTitle>
          <CardDescription>
            Enter your Merriam-Webster Dictionary API key to enable word definitions, etymology, and other features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key here..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <Button onClick={handleSave} disabled={!apiKey.trim()} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save
              </Button>
            </div>
          </div>

          {currentApiKey && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Current API Key:</strong> {maskedApiKey}
              </p>
            </div>
          )}

          {saved && (
            <Alert>
              <AlertDescription>
                API key saved successfully! It will be stored in your browser's local storage.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Get Your API Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Visit the Merriam-Webster Developer Portal</p>
                <p className="text-gray-600">Go to the Merriam-Webster Developer website to register for an API key.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">Register for a Free Account</p>
                <p className="text-gray-600">Create an account and register for the Collegiate Dictionary API.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">Get Your API Key</p>
                <p className="text-gray-600">
                  Once registered, you'll receive an API key that you can use with this application.
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full flex items-center gap-2 bg-transparent"
            onClick={() => window.open("https://dictionaryapi.com/", "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
            Visit Merriam-Webster Developer Portal
          </Button>

          <Alert>
            <AlertDescription>
              <strong>Note:</strong> Your API key is stored locally in your browser and is not sent to any servers other
              than Merriam-Webster's API. The free tier includes 1,000 queries per day.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
