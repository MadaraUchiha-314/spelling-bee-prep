import { DB_NAME, DB_VERSION } from "./db-constants"

const WORD_LISTS_STORE = "wordLists"
const TEST_SESSIONS_STORE = "testSessions"
const SESSION_STATS_STORE = "sessionStats"

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // ALWAYS ensure every store exists
      if (!db.objectStoreNames.contains(WORD_LISTS_STORE)) {
        const store = db.createObjectStore(WORD_LISTS_STORE, { keyPath: "id" })
        store.createIndex("name", "name", { unique: false })
        store.createIndex("createdAt", "createdAt", { unique: false })
      }

      if (!db.objectStoreNames.contains(TEST_SESSIONS_STORE)) {
        const store = db.createObjectStore(TEST_SESSIONS_STORE, { keyPath: "id" })
        store.createIndex("startTime", "startTime", { unique: false })
        store.createIndex("wordListName", "wordListName", { unique: false })
        store.createIndex("isCompleted", "isCompleted", { unique: false })
      }

      if (!db.objectStoreNames.contains(SESSION_STATS_STORE)) {
        db.createObjectStore(SESSION_STATS_STORE, { keyPath: "id" })
      }
    }
  })
}
