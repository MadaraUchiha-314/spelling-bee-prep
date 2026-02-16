import { openDatabase, PREFERENCES_STORE } from "./idb"

class PreferencesStorage {
  private async db() {
    return openDatabase()
  }

  async get<T = string>(key: string): Promise<T | null> {
    const db = await this.db()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(PREFERENCES_STORE, "readonly")
        .objectStore(PREFERENCES_STORE)
        .get(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result?.value ?? null)
    })
  }

  async set<T = string>(key: string, value: T): Promise<void> {
    const db = await this.db()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PREFERENCES_STORE, "readwrite")
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.objectStore(PREFERENCES_STORE).put({ key, value })
    })
  }

  async remove(key: string): Promise<void> {
    const db = await this.db()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PREFERENCES_STORE, "readwrite")
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.objectStore(PREFERENCES_STORE).delete(key)
    })
  }
}

export const preferencesStorage = new PreferencesStorage()

export const PREF_KEYS = {
  API_KEY: "api-key",
  SELECTED_LIST_ID: "selected-list-id",
  TUTOR_MODE: "tutor-mode",
} as const
