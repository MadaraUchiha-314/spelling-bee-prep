import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Navigation } from "@/components/navigation"
import { WordProvider } from "@/lib/word-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Spelling Bee Trainer",
  description: "Master your spelling skills with interactive practice",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WordProvider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
              <div className="max-w-6xl mx-auto p-4">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Spelling Bee Trainer</h1>
                  <p className="text-lg text-gray-600 mb-6">Master your spelling skills with interactive practice</p>
                  <Navigation />
                </div>
                {children}
              </div>
            </div>
            <Toaster richColors />
          </WordProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
