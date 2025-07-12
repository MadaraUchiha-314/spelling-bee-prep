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
            <div className="flex flex-col min-h-screen bg-background">
              <div className="flex-1 max-w-6xl mx-auto w-full px-2 sm:px-4">
                <div className="text-center mb-8 pt-4">
                  {/* Mobile nav at top left */}
                  <div className="sm:hidden flex w-full justify-start mb-2">
                    <Navigation />
                  </div>
                  <div className="flex flex-col xs:flex-row items-center justify-center mb-4 gap-2 xs:gap-4">
                    <Image
                      src="/logo.png"
                      alt="Spelling Bee Trainer Logo"
                      width={60}
                      height={60}
                      className="rounded-lg shadow-md mb-2 xs:mb-0 xs:mr-4"
                    />
                    <h1 className="text-2xl sm:text-4xl font-bold text-foreground">Spelling Bee Prep</h1>
                  </div>
                  <p className="text-base sm:text-lg text-muted-foreground mb-6">Master your spelling skills with interactive practice</p>
                  {/* Desktop nav below logo/title */}
                  <div className="hidden sm:block">
                    <Navigation />
                  </div>
                </div>
                {children}
              </div>
              <footer className="text-center py-4 sm:py-6 text-xs sm:text-sm text-gray-500 bg-card border-t w-full px-2 sm:px-0">
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
