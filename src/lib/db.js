import { openDB } from 'idb';

const DB_NAME = 'family_health_vitals_db';
const DB_VERSION = 1;
const STORE_NAME = 'vitals';

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: false
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
    }
  });
}

export async function saveRecord(record) {
  const db = await initDB();
  const id = record.id || `record_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const recordToSave = {
    id,
    timestamp: record.timestamp || new Date().toISOString(),
    systolic: Number(record.systolic),
    diastolic: Number(record.diastolic),
    heart_rate: Number(record.heart_rate),
    notes: record.notes || '',
    synced: !!record.synced
  };

  await db.put(STORE_NAME, recordToSave);
  return recordToSave;
}

export async function getAllRecords() {
  const db = await initDB();
  const records = await db.getAllFromIndex(STORE_NAME, 'timestamp');
  // Sort descending (latest first)
  return records.reverse();
}

export async function markAsSynced(id) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const record = await store.get(id);
  if (record) {
    record.synced = true;
    await store.put(record);
  }
  await tx.done;
}

export async function deleteRecord(id) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

export async function clearAllRecords() {
  const db = await initDB();
  await db.clear(STORE_NAME);
}
