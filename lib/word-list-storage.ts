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
      const tx = db.transaction([this.storeName], "readwrite")
      const store = tx.objectStore(this.storeName)
      const req = store.add(wordList)

      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(id)
    })
  }

  async getAllWordLists(): Promise<SavedWordList[]> {
    const db = await this.db()
    return new Promise((resolve, reject) => {
      const req = db.transaction([this.storeName], "readonly").objectStore(this.storeName).getAll()
      req.onerror = () => reject(req.error)
      req.onsuccess = () =>
        resolve(req.result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    })
  }

  async getWordList(id: string) {
    const db = await this.db()
    return new Promise<SavedWordList | null>((resolve, reject) => {
      const req = db.transaction([this.storeName], "readonly").objectStore(this.storeName).get(id)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result || null)
    })
  }

  async deleteWordList(id: string) {
    const db = await this.db()
    return new Promise<void>((resolve, reject) => {
      const req = db.transaction([this.storeName], "readwrite").objectStore(this.storeName).delete(id)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve()
    })
  }

  async updateWordListName(id: string, newName: string) {
    const db = await this.db()
    return new Promise<void>((resolve, reject) => {
      const store = db.transaction([this.storeName], "readwrite").objectStore(this.storeName)
      const getReq = store.get(id)

      getReq.onerror = () => reject(getReq.error)
      getReq.onsuccess = () => {
        const data = getReq.result
        if (!data) return reject(new Error("Word list not found"))
        data.name = newName
        const putReq = store.put(data)
        putReq.onerror = () => reject(putReq.error)
        putReq.onsuccess = () => resolve()
      }
    })
  }
}

export const wordListStorage = new WordListStorage()
