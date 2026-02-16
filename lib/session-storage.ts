import { openDatabase } from "./idb"

export type SessionMode = "student" | "tutor"

export interface WordAttempt {
  word: string
  userSpelling: string
  isCorrect: boolean
  timestamp: Date
}

export interface TestSession {
  id: string
  name: string
  wordListId?: string
  wordListName: string
  startTime: Date
  endTime?: Date
  isCompleted: boolean
  wordsAsked: string[]
  attempts: WordAttempt[]
  correctCount: number
  incorrectCount: number
  totalWords: number
  excludePreviouslyCorrect: boolean
  mode: SessionMode
}

export interface SessionStats {
  totalSessions: number
  totalWordsAttempted: number
  totalCorrect: number
  totalIncorrect: number
  averageAccuracy: number
  masteredWords: string[]
}

class SessionStorage {
  private sessionStore = "testSessions"
  private statsStore = "sessionStats"

  private async db() {
    return openDatabase()
  }

  async createSession(
    name: string,
    wordListName: string,
    wordsToAsk: string[],
    excludePreviouslyCorrect: boolean,
    mode: SessionMode,
    wordListId?: string,
  ) {
    const db = await this.db()
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const session: TestSession = {
      id,
      name,
      wordListId,
      wordListName,
      startTime: new Date(),
      isCompleted: false,
      wordsAsked: wordsToAsk,
      attempts: [],
      correctCount: 0,
      incorrectCount: 0,
      totalWords: wordsToAsk.length,
      excludePreviouslyCorrect,
      mode,
    }

    return new Promise<string>((resolve, reject) => {
      const req = db.transaction([this.sessionStore], "readwrite").objectStore(this.sessionStore).add(session)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(id)
    })
  }

  async getSession(id: string) {
    const db = await this.db()
    return new Promise<TestSession | null>((resolve, reject) => {
      const req = db.transaction([this.sessionStore], "readonly").objectStore(this.sessionStore).get(id)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result || null)
    })
  }

  async updateSession(session: TestSession) {
    const db = await this.db()
    return new Promise<void>((resolve, reject) => {
      const req = db.transaction([this.sessionStore], "readwrite").objectStore(this.sessionStore).put(session)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve()
    })
  }

  async addAttempt(sessionId: string, attempt: WordAttempt) {
    const session = await this.getSession(sessionId)
    if (!session) throw new Error("Session not found")
    session.attempts.push(attempt)
    attempt.isCorrect ? session.correctCount++ : session.incorrectCount++
    await this.updateSession(session)
  }

  async completeSession(id: string) {
    const session = await this.getSession(id)
    if (!session) throw new Error("Session not found")
    session.isCompleted = true
    session.endTime = new Date()
    await this.updateSession(session)
    await this.updateStats(session)
  }

  private async updateStats(completed: TestSession) {
    const db = await this.db()
    const statsId = "global_stats"
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction([this.statsStore], "readwrite")
      const store = tx.objectStore(this.statsStore)
      const getReq = store.get(statsId)

      getReq.onsuccess = () => {
        const stats: SessionStats = getReq.result || {
          totalSessions: 0,
          totalWordsAttempted: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          averageAccuracy: 0,
          masteredWords: [],
        }

        stats.totalSessions++
        stats.totalWordsAttempted += completed.attempts.length
        stats.totalCorrect += completed.correctCount
        stats.totalIncorrect += completed.incorrectCount
        stats.averageAccuracy =
          stats.totalWordsAttempted > 0 ? (stats.totalCorrect / stats.totalWordsAttempted) * 100 : 0

        const newlyMastered = completed.attempts
          .filter((a) => a.isCorrect)
          .map((a) => a.word.toLowerCase())
          .filter((w) => !stats.masteredWords.includes(w))

        stats.masteredWords.push(...newlyMastered)

        const putReq = store.put({ id: statsId, ...stats })
        putReq.onerror = () => reject(putReq.error)
        putReq.onsuccess = () => resolve()
      }
      getReq.onerror = () => reject(getReq.error)
    })
  }

  async getStats() {
    const db = await this.db()
    return new Promise<SessionStats>((resolve, reject) => {
      const req = db.transaction([this.statsStore], "readonly").objectStore(this.statsStore).get("global_stats")
      req.onerror = () => reject(req.error)
      req.onsuccess = () =>
        resolve(
          req.result || {
            totalSessions: 0,
            totalWordsAttempted: 0,
            totalCorrect: 0,
            totalIncorrect: 0,
            averageAccuracy: 0,
            masteredWords: [],
          },
        )
    })
  }

  async getAllSessions() {
    const db = await this.db()
    return new Promise<TestSession[]>((resolve, reject) => {
      const req = db.transaction([this.sessionStore], "readonly").objectStore(this.sessionStore).getAll()
      req.onerror = () => reject(req.error)
      req.onsuccess = () =>
        resolve(req.result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()))
    })
  }

  async deleteSession(id: string) {
    const db = await this.db()
    return new Promise<void>((resolve, reject) => {
      const req = db.transaction([this.sessionStore], "readwrite").objectStore(this.sessionStore).delete(id)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve()
    })
  }

  async getMasteredWords() {
    const stats = await this.getStats()
    return stats.masteredWords
  }

  async importSession(sessionData: TestSession) {
    const db = await this.db()
    // Create a new object to avoid modifying the original
    const importedSession: TestSession = {
      ...sessionData,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // New unique ID
      name: `${sessionData.name} (Imported)`,
      startTime: new Date(), // Set import time as start time
      isCompleted: sessionData.isCompleted,
      // If the original session was completed, set a new end time for the import record
      endTime: sessionData.isCompleted ? new Date() : undefined,
      mode: sessionData.mode || "student",
    }

    return new Promise<void>((resolve, reject) => {
      // Basic validation
      if (
        !importedSession.name ||
        typeof importedSession.wordsAsked === "undefined" ||
        typeof importedSession.attempts === "undefined"
      ) {
        return reject(new Error("Invalid session file format."))
      }
      const req = db.transaction([this.sessionStore], "readwrite").objectStore(this.sessionStore).add(importedSession)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve()
    })
  }
}

export const sessionStorage = new SessionStorage()
