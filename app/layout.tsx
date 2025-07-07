import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Image from "next/image"
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
            <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
              <div className="flex-1 max-w-6xl mx-auto w-full px-4">
                <div className="text-center mb-8 pt-4">
                  <div className="flex items-center justify-center mb-4">
                    <Image
                      src="/logo.png"
                      alt="Spelling Bee Trainer Logo"
                      width={60}
                      height={60}
                      className="rounded-lg shadow-md mr-4"
                    />
                    <h1 className="text-4xl font-bold text-gray-900">Spelling Bee Prep</h1>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">Master your spelling skills with interactive practice</p>
                  <Navigation />
                </div>
                {children}
              </div>
              <footer className="text-center py-3 text-sm text-gray-500 bg-white/50 border-t w-full">
                <p>🔒 Your data stays private – everything is saved locally in your browser</p>
              </footer>
            </div>
            <Toaster richColors />
          </WordProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
