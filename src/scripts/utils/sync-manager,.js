const SYNC_STORE_NAME = 'pending-stories';
const DB_NAME = 'our-story-db';
const DB_VERSION = 2; // Update version

class SyncManager {
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
        if (!db.objectStoreNames.contains('saved-stories')) {
          const savedStore = db.createObjectStore('saved-stories', { keyPath: 'id' });
          savedStore.createIndex('name', 'name', { unique: false });
          savedStore.createIndex('description', 'description', { unique: false });
          savedStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create pending sync store
        if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
          const syncStore = db.createObjectStore(SYNC_STORE_NAME, { 
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

  // Add story to pending queue (offline mode)
  async addPendingStory(storyData) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      
      const pendingStory = {
        ...storyData,
        timestamp: Date.now(),
        synced: false
      };
      
      const request = store.add(pendingStory);

      request.onsuccess = () => {
        console.log('[SyncManager] Story added to pending queue:', request.result);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get all pending stories
  async getPendingStories() {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_STORE_NAME], 'readonly');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete pending story after successful sync
  async deletePendingStory(id) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Mark story as synced
  async markAsSynced(id) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const story = getRequest.result;
        if (story) {
          story.synced = true;
          const updateRequest = store.put(story);
          updateRequest.onsuccess = () => resolve(true);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(false);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Sync all pending stories to API
  async syncPendingStories() {
    const pendingStories = await this.getPendingStories();
    
    if (pendingStories.length === 0) {
      console.log('[SyncManager] No pending stories to sync');
      return { success: 0, failed: 0 };
    }

    console.log(`[SyncManager] Syncing ${pendingStories.length} pending stories...`);
    
    let successCount = 0;
    let failedCount = 0;

    for (const story of pendingStories) {
      try {
        await this.syncStoryToAPI(story);
        await this.deletePendingStory(story.id);
        successCount++;
        console.log(`[SyncManager] ✓ Synced story ${story.id}`);
      } catch (error) {
        failedCount++;
        console.error(`[SyncManager] ✗ Failed to sync story ${story.id}:`, error);
      }
    }

    console.log(`[SyncManager] Sync complete: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
  }

  // Sync single story to API
  async syncStoryToAPI(story) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const formData = new FormData();
    formData.append('description', story.description);
    formData.append('lat', story.lat);
    formData.append('lon', story.lon);

    // Handle photo - if it's a blob/file
    if (story.photo) {
      if (story.photo instanceof Blob || story.photo instanceof File) {
        formData.append('photo', story.photo);
      } else if (typeof story.photo === 'string' && story.photo.startsWith('blob:')) {
        // Fetch blob from blob URL
        const response = await fetch(story.photo);
        const blob = await response.blob();
        formData.append('photo', blob, 'photo.jpg');
      }
    }

    const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sync story');
    }

    return await response.json();
  }

  // Check if online
  isOnline() {
    return navigator.onLine;
  }

  // Get pending count
  async getPendingCount() {
    const pending = await this.getPendingStories();
    return pending.length;
  }
}

// Export singleton
const syncManager = new SyncManager();
export default syncManager;