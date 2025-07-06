import { openDatabase } from "./idb"

export interface SavedWordList {
  id: string
  name: string
  words: string[]
  createdAt: Date
  wordCount: number
}

export interface AvailableWordList {
  id: string
  name: string
  path: string
  description?: string
}

class WordListStorage {
  private storeName = "wordLists"

  private async db() {
    return openDatabase()
  }

  async getAvailableWordLists(): Promise<AvailableWordList[]> {
    try {
      const response = await fetch('/data/available-word-lists.json')
      if (!response.ok) {
        console.warn('Available word lists configuration not found')
        return []
      }
      return await response.json()
    } catch (error) {
      console.error('Error loading available word lists:', error)
      return []
    }
  }

  async loadWordListFromPath(path: string): Promise<string[]> {
    try {
      const response = await fetch(path)
      if (!response.ok) {
        throw new Error(`Failed to load word list from ${path}`)
      }

      const text = await response.text()
      const words = text
        .split('\n')
        .map(word => word.trim())
        .filter(word => word.length > 0 && /^[a-zA-Z]+$/.test(word))

      if (words.length === 0) {
        throw new Error('No valid words found in word list')
      }

      return words
    } catch (error) {
      console.error(`Error loading word list from ${path}:`, error)
      throw error
    }
  }

  async loadDefaultWordList(): Promise<SavedWordList | null> {
    try {
      const availableLists = await this.getAvailableWordLists()
      if (availableLists.length === 0) {
        console.warn('No available word lists configured')
        return null
      }

      // Use the first available word list as default
      const defaultList = availableLists[0]
      
      // Check if this list already exists in database
      const existingList = await this.getWordList(defaultList.id)
      if (existingList) {
        return existingList
      }

      // Load the word list from the configured path
      const words = await this.loadWordListFromPath(defaultList.path)

      // Save the list to the database
      const wordList: SavedWordList = {
        id: defaultList.id,
        name: defaultList.name,
        words,
        createdAt: new Date(),
        wordCount: words.length,
      }

      const db = await this.db()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite")
        transaction.oncomplete = () => resolve(wordList)
        transaction.onerror = () => reject(transaction.error)
        transaction.objectStore(this.storeName).add(wordList)
      })
    } catch (error) {
      console.error('Error loading default word list:', error)
      return null
    }
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
