/**
 * IndexedDB Cache Layer for Food Database
 * Provides persistent caching with TTL and size limits
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  CachedSearchResult,
  CachedBarcodeResult,
  FoodSearchResults,
  BarcodeLookupResult,
  FoodProvider,
} from '@/types/foodDatabase';
import { CACHE_TTL_MS, MAX_CACHE_SIZE } from '@/types/foodDatabase';

interface FoodCacheDB extends DBSchema {
  searchCache: {
    key: string;
    value: CachedSearchResult;
    indexes: { 'by-timestamp': number; 'by-expires': number };
  };
  barcodeCache: {
    key: string;
    value: CachedBarcodeResult;
    indexes: { 'by-timestamp': number; 'by-expires': number };
  };
}

let dbPromise: Promise<IDBPDatabase<FoodCacheDB>> | null = null;

/**
 * IndexedDB only exists in the browser. These modules are also imported by
 * server-side API routes, where every cache operation must be a no-op —
 * HTTP cache headers handle server-side caching instead.
 */
const isBrowser = typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

function getDB(): Promise<IDBPDatabase<FoodCacheDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FoodCacheDB>('food-database-cache', 1, {
      upgrade(db) {
        // Search cache store
        const searchStore = db.createObjectStore('searchCache', { keyPath: 'key' });
        searchStore.createIndex('by-timestamp', 'timestamp');
        searchStore.createIndex('by-expires', 'expiresAt');

        // Barcode cache store
        const barcodeStore = db.createObjectStore('barcodeCache', { keyPath: 'key' });
        barcodeStore.createIndex('by-timestamp', 'timestamp');
        barcodeStore.createIndex('by-expires', 'expiresAt');
      },
    });
  }
  return dbPromise;
}

// ============================================================================
// Cache Key Generators
// ============================================================================

export function generateSearchCacheKey(
  source: FoodProvider,
  query: string,
  page: number,
  pageSize: number
): string {
  const normalizedQuery = query.toLowerCase().trim();
  return `${source}:search:${normalizedQuery}:p${page}:s${pageSize}`;
}

export function generateBarcodeCacheKey(barcode: string): string {
  return `barcode:${barcode.trim()}`;
}

// ============================================================================
// Search Cache Operations
// ============================================================================

export async function getCachedSearch(key: string): Promise<FoodSearchResults | null> {
  if (!isBrowser) return null;
  const db = await getDB();
  const cached = await db.get('searchCache', key);

  if (!cached) return null;

  // Check expiration
  if (Date.now() > cached.expiresAt) {
    await db.delete('searchCache', key);
    return null;
  }

  return cached.data;
}

export async function setCachedSearch(
  key: string,
  data: FoodSearchResults
): Promise<void> {
  if (!isBrowser) return;
  const db = await getDB();
  const now = Date.now();

  await db.put('searchCache', {
    key,
    data,
    timestamp: now,
    expiresAt: now + CACHE_TTL_MS,
  });

  // Enforce size limit (cleanup oldest if over limit)
  await enforceSearchCacheSizeLimit(db);
}

export async function getCachedBarcode(key: string): Promise<BarcodeLookupResult | null> {
  if (!isBrowser) return null;
  const db = await getDB();
  const cached = await db.get('barcodeCache', key);

  if (!cached) return null;

  // Check expiration
  if (Date.now() > cached.expiresAt) {
    await db.delete('barcodeCache', key);
    return null;
  }

  return cached.data;
}

export async function setCachedBarcode(
  key: string,
  data: BarcodeLookupResult
): Promise<void> {
  if (!isBrowser) return;
  const db = await getDB();
  const now = Date.now();

  await db.put('barcodeCache', {
    key,
    data,
    timestamp: now,
    expiresAt: now + CACHE_TTL_MS,
  });

  // Enforce size limit
  await enforceBarcodeCacheSizeLimit(db);
}

// ============================================================================
// Cache Maintenance
// ============================================================================

/** Delete the oldest entries until the store is back under MAX_CACHE_SIZE. */
async function enforceSearchCacheSizeLimit(db: IDBPDatabase<FoodCacheDB>): Promise<void> {
  const count = await db.count('searchCache');
  if (count <= MAX_CACHE_SIZE) return;

  const toDelete = count - MAX_CACHE_SIZE + 50; // Delete a buffer
  let deleted = 0;

  let cursor = await db
    .transaction('searchCache', 'readwrite')
    .store.index('by-timestamp')
    .openCursor();

  while (cursor && deleted < toDelete) {
    await cursor.delete();
    deleted++;
    cursor = await cursor.continue();
  }
}

async function enforceBarcodeCacheSizeLimit(db: IDBPDatabase<FoodCacheDB>): Promise<void> {
  const count = await db.count('barcodeCache');
  if (count <= MAX_CACHE_SIZE) return;

  const toDelete = count - MAX_CACHE_SIZE + 50;
  let deleted = 0;

  let cursor = await db
    .transaction('barcodeCache', 'readwrite')
    .store.index('by-timestamp')
    .openCursor();

  while (cursor && deleted < toDelete) {
    await cursor.delete();
    deleted++;
    cursor = await cursor.continue();
  }
}

export async function clearExpiredCache(): Promise<void> {
  if (!isBrowser) return;
  const db = await getDB();
  const now = Date.now();
  const upperBound = IDBKeyRange.upperBound(now);

  let searchCursor = await db
    .transaction('searchCache', 'readwrite')
    .store.index('by-expires')
    .openCursor(upperBound);

  while (searchCursor) {
    await searchCursor.delete();
    searchCursor = await searchCursor.continue();
  }

  let barcodeCursor = await db
    .transaction('barcodeCache', 'readwrite')
    .store.index('by-expires')
    .openCursor(upperBound);

  while (barcodeCursor) {
    await barcodeCursor.delete();
    barcodeCursor = await barcodeCursor.continue();
  }
}

export async function clearAllCache(): Promise<void> {
  if (!isBrowser) return;
  const db = await getDB();
  await db.clear('searchCache');
  await db.clear('barcodeCache');
}

export async function getCacheStats(): Promise<{
  searchEntries: number;
  barcodeEntries: number;
  oldestSearch: number | null;
  oldestBarcode: number | null;
}> {
  if (!isBrowser) {
    return { searchEntries: 0, barcodeEntries: 0, oldestSearch: null, oldestBarcode: null };
  }
  const db = await getDB();

  const [searchCount, barcodeCount] = await Promise.all([
    db.count('searchCache'),
    db.count('barcodeCache'),
  ]);

  const [oldestSearch, oldestBarcode] = await Promise.all([
    (async () => {
      const cursor = await db
        .transaction('searchCache', 'readonly')
        .store.index('by-timestamp')
        .openCursor();
      return cursor ? cursor.value.timestamp : null;
    })(),
    (async () => {
      const cursor = await db
        .transaction('barcodeCache', 'readonly')
        .store.index('by-timestamp')
        .openCursor();
      return cursor ? cursor.value.timestamp : null;
    })(),
  ]);

  return {
    searchEntries: searchCount,
    barcodeEntries: barcodeCount,
    oldestSearch,
    oldestBarcode,
  };
}

// ============================================================================
// Recent Foods (localStorage-based, simpler)
// ============================================================================

const RECENT_FOODS_KEY = 'food-database-recent';
const MAX_RECENT_FOODS = 20;

export interface RecentFood {
  id: string;
  name: string;
  source: FoodProvider;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingDescription: string;
  servingWeightGrams: number;
  timestamp: number;
}

export function getRecentFoods(): RecentFood[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_FOODS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addRecentFood(food: Omit<RecentFood, 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  const recent = getRecentFoods();
  const newFood: RecentFood = { ...food, timestamp: Date.now() };

  // Remove duplicates (by id)
  const filtered = recent.filter((f) => f.id !== newFood.id);

  // Add to front and limit
  filtered.unshift(newFood);
  if (filtered.length > MAX_RECENT_FOODS) {
    filtered.length = MAX_RECENT_FOODS;
  }

  localStorage.setItem(RECENT_FOODS_KEY, JSON.stringify(filtered));
}

export function clearRecentFoods(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(RECENT_FOODS_KEY);
}