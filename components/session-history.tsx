"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Separator } from "@/components/ui/separator"
import {
  History,
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  TrendingUp,
  Play,
} from "lucide-react"
import { sessionStorage, type TestSession, type SessionStats } from "@/lib/session-storage"

interface SessionHistoryProps {
  onResumeSession?: (session: TestSession) => void
}

export function SessionHistory({ onResumeSession }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<TestSession[]>([])
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedSession, setSelectedSession] = useState<TestSession | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      const [sessionsData, statsData] = await Promise.all([sessionStorage.getAllSessions(), sessionStorage.getStats()])
      setSessions(sessionsData)
      setStats(statsData)
    } catch (err) {
      setError("Failed to load session history")
      console.error("Error loading session history:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await sessionStorage.deleteSession(sessionId)
      setSessions((prev) => prev.filter((session) => session.id !== sessionId))
      // Reload stats after deletion
      const updatedStats = await sessionStorage.getStats()
      setStats(updatedStats)
    } catch (err) {
      setError("Failed to delete session")
    }
  }

  const handleViewDetails = (session: TestSession) => {
    setSelectedSession(session)
    setDetailsDialogOpen(true)
  }

  const handleResumeSession = (session: TestSession) => {
    if (onResumeSession) {
      onResumeSession(session)
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

  const formatDuration = (startTime: Date, endTime?: Date) => {
    if (!endTime) return "In progress"
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime()
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  const getAccuracy = (session: TestSession) => {
    if (session.attempts.length === 0) return 0
    return Math.round((session.correctCount / session.attempts.length) * 100)
  }

  const canResumeSession = (session: TestSession) => {
    return !session.isCompleted && session.attempts.length < session.wordsAsked.length
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Loading session history...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Overall Statistics
            </CardTitle>
            <CardDescription>Your spelling practice progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
                <div className="text-sm text-blue-800">Total Sessions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.totalCorrect}</div>
                <div className="text-sm text-green-800">Words Correct</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.totalIncorrect}</div>
                <div className="text-sm text-red-800">Words Incorrect</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{Math.round(stats.averageAccuracy)}%</div>
                <div className="text-sm text-yellow-800">Average Accuracy</div>
              </div>
            </div>
            {stats.masteredWords.length > 0 && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">Mastered Words ({stats.masteredWords.length})</h4>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {stats.masteredWords.slice(0, 20).map((word) => (
                    <Badge key={word} variant="secondary" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                  {stats.masteredWords.length > 20 && (
                    <Badge variant="outline" className="text-xs">
                      +{stats.masteredWords.length - 20} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Session History
              </CardTitle>
              <CardDescription>
                {sessions.length === 0
                  ? "No sessions completed yet"
                  : `${sessions.length} session${sessions.length === 1 ? "" : "s"} completed`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadData} className="flex items-center gap-2 bg-transparent">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No sessions completed</p>
              <p className="text-sm">Complete a test session to see your history here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{session.name}</h3>
                      <Badge variant={session.isCompleted ? "default" : "secondary"} className="text-xs">
                        {session.isCompleted ? "Completed" : "In Progress"}
                      </Badge>
                      {canResumeSession(session) && (
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                          Can Resume
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(session.startTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(session.startTime, session.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {session.wordListName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-green-600">{session.correctCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <XCircle className="w-3 h-3 text-red-600" />
                        <span className="text-red-600">{session.incorrectCount}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getAccuracy(session)}% accuracy
                      </Badge>
                      {!session.isCompleted && (
                        <Badge variant="outline" className="text-xs">
                          {session.attempts.length}/{session.wordsAsked.length} words
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {canResumeSession(session) && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleResumeSession(session)}
                        className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700"
                      >
                        <Play className="w-3 h-3" />
                        Resume
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(session)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Details
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 bg-transparent"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Session</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{session.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSession(session.id)}
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
      </Card>

      {/* Session Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSession?.name || "Session Details"}</DialogTitle>
            <DialogDescription>Session details and word-by-word results</DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4">
              {/* Session Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">Word List:</span>
                  <p className="font-medium">{selectedSession.wordListName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Duration:</span>
                  <p className="font-medium">{formatDuration(selectedSession.startTime, selectedSession.endTime)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Total Words:</span>
                  <p className="font-medium">{selectedSession.totalWords}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Accuracy:</span>
                  <p className="font-medium">{getAccuracy(selectedSession)}%</p>
                </div>
              </div>

              <Separator />

              {/* Word Results */}
              <div>
                <h4 className="font-medium mb-3">Word Results</h4>
                {selectedSession.attempts.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedSession.attempts.map((attempt, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          attempt.isCorrect ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {attempt.isCorrect ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">{attempt.word}</p>
                            {!attempt.isCorrect && attempt.userSpelling && (
                              <p className="text-sm text-gray-600">Your spelling: {attempt.userSpelling}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={attempt.isCorrect ? "default" : "destructive"} className="text-xs">
                          {attempt.isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No attempts recorded for this session.</p>
                )}
              </div>

              {/* Unattempted Words */}
              {selectedSession.wordsAsked.length > selectedSession.attempts.length && (
                <div>
                  <h4 className="font-medium mb-3">Unattempted Words</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedSession.wordsAsked.slice(selectedSession.attempts.length).map((word, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {word}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
