import { openDatabase } from "./idb"

export interface SavedWordList {
  id: string
  name: string
  words: string[]
  createdAt: Date
  wordCount: number
}

class WordListStorage {
  private storeName = "wordLists"

  private async db() {
    return openDatabase()
  }

  async saveWordList(name: string, words: string[]): Promise<string> {
    const db = await this.db()
    const id = `wordlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const wordList: SavedWordList = {
      id,
      name,
      words,
      createdAt: new Date(),
      wordCount: words.length,
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite")
      transaction.oncomplete = () => resolve(id)
      transaction.onerror = () => reject(transaction.error)
      transaction.objectStore(this.storeName).add(wordList)
    })
  }

  async getAllWordLists(): Promise<SavedWordList[]> {
    const db = await this.db()
    return new Promise((resolve, reject) => {
      const request = db.transaction(this.storeName, "readonly").objectStore(this.storeName).getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () =>
        resolve(request.result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    })
  }

  async getWordList(id: string): Promise<SavedWordList | null> {
    const db = await this.db()
    return new Promise((resolve, reject) => {
      const request = db.transaction(this.storeName, "readonly").objectStore(this.storeName).get(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async deleteWordList(id: string): Promise<void> {
    const db = await this.db()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite")
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.objectStore(this.storeName).delete(id)
    })
  }

  async updateWordListName(id: string, newName: string): Promise<void> {
    const db = await this.db()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite")
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)

      const store = transaction.objectStore(this.storeName)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const data = getRequest.result
        if (data) {
          data.name = newName
          store.put(data)
        } else {
          transaction.abort()
          reject(new Error("Word list not found for update"))
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }
}

export const wordListStorage = new WordListStorage()
