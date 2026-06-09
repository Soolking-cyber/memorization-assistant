const DB_NAME = 'MemorizationAssistantDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_cache';

let dbPromise = null;

function getDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => {
            console.error("IndexedDB open error:", event.target.error);
            dbPromise = null; // Reset promise so a future call can try again
            reject(event.target.error);
        };
    });
    return dbPromise;
}

export async function dbGet(key) {
    try {
        const db = await getDB();
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn("IndexedDB get fallback:", e);
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : null;
        } catch (err) {
            return null;
        }
    }
}

export async function dbSet(key, val) {
    try {
        const db = await getDB();
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(val, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn("IndexedDB set fallback:", e);
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch (err) {
            console.error("Storage write failed completely:", err);
        }
    }
}

export async function dbDelete(key) {
    try {
        const db = await getDB();
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn("IndexedDB delete fallback:", e);
        try {
            localStorage.removeItem(key);
        } catch (err) {}
    }
}
