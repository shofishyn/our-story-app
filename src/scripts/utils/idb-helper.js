const DB_NAME = 'our-story-db';
const DB_VERSION = 2; 
const STORE_NAME = 'saved-stories';

class IDBHelper {
  constructor() {
    this.db = null;
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create saved stories store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('name', 'name', { unique: false });
          objectStore.createIndex('description', 'description', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create pending sync store (for sync-manager)
        if (!db.objectStoreNames.contains('pending-stories')) {
          const syncStore = db.createObjectStore('pending-stories', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }

  async getDB() {
    if (!this.db) {
      await this.openDB();
    }
    return this.db;
  }

  async saveStory(story) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const storyWithTimestamp = {
        ...story,
        createdAt: story.createdAt || new Date().toISOString()
      };
      
      const request = store.put(storyWithTimestamp);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllStories() {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getStory(id) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteStory(id) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async searchStories(keyword) {
    const allStories = await this.getAllStories();
    const lowerKeyword = keyword.toLowerCase();
    
    return allStories.filter(story => 
      (story.name && story.name.toLowerCase().includes(lowerKeyword)) ||
      (story.description && story.description.toLowerCase().includes(lowerKeyword))
    );
  }

  async hasStory(id) {
    const story = await this.getStory(id);
    return !!story;
  }

  async getCount() {
    const stories = await this.getAllStories();
    return stories.length;
  }

  async clearAll() {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

const idbHelper = new IDBHelper();
export default idbHelper;