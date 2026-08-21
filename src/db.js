const DB_NAME = "revision-db";
const DB_VERSION = 1;
const STORE_PROGRESS = "progression";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
        db.createObjectStore(STORE_PROGRESS, { keyPath: "coursId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getProgress(coursId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRESS, "readonly");
    const store = tx.objectStore(STORE_PROGRESS);
    const req = store.get(coursId);
    req.onsuccess = () =>
      resolve(req.result || { coursId, cartesMaitrisees: [], vues: 0 });
    req.onerror = () => reject(req.error);
  });
}

export async function saveProgress(coursId, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRESS, "readwrite");
    const store = tx.objectStore(STORE_PROGRESS);
    const req = store.put({ coursId, ...data });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function toggleCarteMaitrisee(coursId, carteId) {
  const progress = await getProgress(coursId);
  const set = new Set(progress.cartesMaitrisees || []);
  if (set.has(carteId)) set.delete(carteId);
  else set.add(carteId);
  const updated = { ...progress, cartesMaitrisees: Array.from(set) };
  await saveProgress(coursId, updated);
  return updated;
}
