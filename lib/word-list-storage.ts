export interface SavedWordList {
  id: string
  name: string
  words: string[]
  createdAt: Date
  wordCount: number
}

class WordListStorage {
  private dbName = "SpellingBeeDB"
  private version = 1
  private storeName = "wordLists"

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" })
          store.createIndex("name", "name", { unique: false })
          store.createIndex("createdAt", "createdAt", { unique: false })
        }
      }
    })
  }

  async saveWordList(name: string, words: string[]): Promise<string> {
    const db = await this.openDB()
    const id = `wordlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const wordList: SavedWordList = {
      id,
      name,
      words,
      createdAt: new Date(),
      wordCount: words.length,
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)
      const request = store.add(wordList)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(id)
    })
  }

  async getAllWordLists(): Promise<SavedWordList[]> {
    const db = await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly")
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const results = request.result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        resolve(results)
      }
    })
  }

  async getWordList(id: string): Promise<SavedWordList | null> {
    const db = await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly")
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async deleteWordList(id: string): Promise<void> {
    const db = await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async updateWordListName(id: string, newName: string): Promise<void> {
    const db = await this.openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const wordList = getRequest.result
        if (wordList) {
          wordList.name = newName
          const updateRequest = store.put(wordList)
          updateRequest.onerror = () => reject(updateRequest.error)
          updateRequest.onsuccess = () => resolve()
        } else {
          reject(new Error("Word list not found"))
        }
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }
}

export const wordListStorage = new WordListStorage()
