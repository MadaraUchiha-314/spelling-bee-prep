"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Play, Trophy, Archive } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to practice page by default
    router.push('/practice')
  }, [router])

  const features = [
    {
      icon: BookOpen,
      title: "Upload Word Lists",
      description: "Upload your own word lists or use pre-built ones for practice",
      href: "/upload"
    },
    {
      icon: Play,
      title: "Interactive Practice",
      description: "Practice spelling with audio pronunciation and definitions",
      href: "/practice"
    },
    {
      icon: Trophy,
      title: "Test Sessions",
      description: "Take timed tests to assess your spelling progress",
      href: "/test"
    },
    {
      icon: Archive,
      title: "Track Progress",
      description: "Review your session history and track improvement over time",
      href: "/history"
    }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to Spelling Bee Trainer</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get started by uploading a word list or selecting from saved lists, then begin practicing your spelling skills.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {feature.description}
                </CardDescription>
                <Button asChild className="w-full">
                  <Link href={feature.href}>
                    Get Started
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
