/**
 * Offline-First IndexedDB Persistence & Crash-Recovery Queue for OMR Batches
 *
 * Ensures zero data loss if a teacher's phone loses Wi-Fi, battery dies, or browser
 * tab refreshes mid-batch while scanning 100–500 student sheets.
 */

import type { ScanProcessingResult, StudentScoreCard, AuditLogEntry } from './types';

const DB_NAME = 'rofaz_omr_offline_v1';
const DB_VERSION = 1;
const STORE_ITEMS = 'omr_batch_items';

export interface PersistedOmrBatchItem {
  sheetId: string;
  examId: string;
  presetId: string;
  timestamp: number;
  synced: boolean;
  previewDataUrl?: string; // Compressed JPEG thumbnail of warped/overlay sheet for visual HITL review
  scanResult: Omit<ScanProcessingResult, 'warpedImageCanvas' | 'enhancedImageCanvas'>;
  scoreCard: StudentScoreCard;
  corrections: AuditLogEntry[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        const store = db.createObjectStore(STORE_ITEMS, { keyPath: 'sheetId' });
        store.createIndex('examId', 'examId', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

export const OmrOfflineStore = {
  async saveItem(item: PersistedOmrBatchItem): Promise<void> {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_ITEMS, 'readwrite');
        tx.objectStore(STORE_ITEMS).put(item);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    } catch (err) {
      console.warn('[OmrOfflineStore] saveItem skipped:', err);
    }
  },

  async loadAll(): Promise<PersistedOmrBatchItem[]> {
    try {
      const db = await openDb();
      return await new Promise<PersistedOmrBatchItem[]>((resolve, reject) => {
        const tx = db.transaction(STORE_ITEMS, 'readonly');
        const req = tx.objectStore(STORE_ITEMS).getAll();
        req.onsuccess = () => {
          db.close();
          const items = (req.result || []) as PersistedOmrBatchItem[];
          items.sort((a, b) => a.timestamp - b.timestamp);
          resolve(items);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      });
    } catch {
      return [];
    }
  },

  async markSynced(sheetIds: string[]): Promise<void> {
    if (sheetIds.length === 0) return;
    try {
      const db = await openDb();
      const idSet = new Set(sheetIds);
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_ITEMS, 'readwrite');
        const store = tx.objectStore(STORE_ITEMS);
        const req = store.getAll();
        req.onsuccess = () => {
          const all = (req.result || []) as PersistedOmrBatchItem[];
          for (const item of all) {
            if (idSet.has(item.sheetId)) {
              item.synced = true;
              store.put(item);
            }
          }
        };
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    } catch (err) {
      console.warn('[OmrOfflineStore] markSynced skipped:', err);
    }
  },

  async removeItem(sheetId: string): Promise<void> {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_ITEMS, 'readwrite');
        tx.objectStore(STORE_ITEMS).delete(sheetId);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    } catch {}
  },

  async clearAll(): Promise<void> {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_ITEMS, 'readwrite');
        tx.objectStore(STORE_ITEMS).clear();
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    } catch {}
  },
};
