const DB_NAME = "masri-ru-audio-v1";
const STORE = "recordings";
const memoryFallback = new Map();
let dbPromise = null;

function openDb() {
  if (!("indexedDB" in window)) return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
  return dbPromise;
}

async function withStore(mode, work) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    let request;
    try {
      request = db.transaction(STORE, mode).objectStore(STORE);
      work(request);
    } catch {
      resolve(null);
      return;
    }
    request.transaction.oncomplete = () => resolve(request.result ?? null);
    request.transaction.onerror = () => resolve(null);
    request.transaction.onabort = () => resolve(null);
  });
}

export async function getRecording(key) {
  const db = await openDb();
  if (!db) return memoryFallback.get(key) || null;
  return new Promise((resolve) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result || memoryFallback.get(key) || null);
    request.onerror = () => resolve(memoryFallback.get(key) || null);
  });
}

export async function putRecording(key, blob, meta = {}) {
  const record = { key, blob, mime: blob.type || "audio/webm", updated: Date.now(), size: blob.size, ...meta };
  const db = await openDb();
  if (!db) {
    memoryFallback.set(key, record);
    return record;
  }
  return new Promise((resolve) => {
    try {
      const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => {
        memoryFallback.set(key, record);
        resolve(record);
      };
    } catch {
      memoryFallback.set(key, record);
      resolve(record);
    }
  });
}

export async function deleteRecording(key) {
  memoryFallback.delete(key);
  const db = await openDb();
  if (!db) return;
  await withStore("readwrite", (store) => store.delete(key));
}

export async function listRecordings() {
  const db = await openDb();
  const records = new Map(memoryFallback);
  if (!db) return [...records.values()].sort((a, b) => b.updated - a.updated);
  return new Promise((resolve) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => {
      request.result.forEach((item) => records.set(item.key, item));
      resolve([...records.values()].sort((a, b) => b.updated - a.updated));
    };
    request.onerror = () => resolve([...records.values()].sort((a, b) => b.updated - a.updated));
  });
}

export async function clearRecordings() {
  memoryFallback.clear();
  const db = await openDb();
  if (!db) return;
  await withStore("readwrite", (store) => store.clear());
}

export async function countRecordings() {
  return (await listRecordings()).length;
}
