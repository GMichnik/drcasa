
const DB_NAME = 'CliniqueMysteresDB';
const STORE_NAME = 'images';
const DB_VERSION = 1;

// Open (or create) the database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Check if IndexedDB is supported
    if (!('indexedDB' in window)) {
      reject(new Error("IndexedDB not supported"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

/**
 * Saves a base64 image string to IndexedDB
 */
export const saveImageToCache = async (key: string, base64: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(base64, key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to save to cache", e);
  }
};

/**
 * Retrieves a base64 image string from IndexedDB
 */
export const getImageFromCache = async (key: string): Promise<string | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        // Failing to read cache is not critical, just return null
        console.warn("Error reading cache", request.error);
        resolve(null); 
      };
    });
  } catch (e) {
    console.error("Failed to read from cache", e);
    return null;
  }
};
