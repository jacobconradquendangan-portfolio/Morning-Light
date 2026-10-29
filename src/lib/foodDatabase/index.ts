/**
 * Unified Food Database Module
 *
 * Providers:
 *   USDA          — food search (authoritative generic + branded)
 *   OpenFoodFacts — barcode lookup
 *   CalorieNinjas — natural-language meal entry
 */

import type {
  FoodSearchResult,
  FoodSearchResults,
  BarcodeLookupResult,
  NaturalLanguageParseResult,
  FoodDatabaseConfig,
  FoodSearchSource,
} from '@/types/foodDatabase';

export type { FoodSearchResult, FoodSearchResults, BarcodeLookupResult };
import { searchUSDA, getUSDAFood, getUSDARateLimitStatus } from './usda';
import { lookupBarcodeOpenFoodFacts, searchOpenFoodFacts } from './openfoodfacts';
import { parseNaturalLanguage, isCalorieNinjasConfigured } from './calorieninjas';
import { clearAllCache, getCacheStats } from '@/lib/cache/indexedDB';

// Re-exported for consumers that need a specific provider rather than the
// unified search/lookup functions above.
export { searchUSDA, searchUSDAByBarcode, getUSDAFood } from './usda';
export { searchOpenFoodFacts };
export { isCalorieNinjasConfigured };

// ============================================================================
// Configuration
// ============================================================================

export const foodDatabaseConfig: FoodDatabaseConfig = {
  usda: {
    apiKey: process.env.USDA_API_KEY || '',
    baseUrl: 'https://api.nal.usda.gov/fdc/v1',
    rateLimit: 1000,
  },
  calorieninjas: {
    apiKey: process.env.CALORIENINJAS_API_KEY || '',
    baseUrl: 'https://api.calorieninjas.com/v1',
    rateLimit: 10_000,
  },
  openFoodFacts: {
    baseUrl: 'https://world.openfoodfacts.org/api/v0',
    userAgent: 'CalorieCounter/1.0',
  },
};

// ============================================================================
// Search (USDA)
// ============================================================================

export async function searchFoods(
  query: string,
  options?: { pageSize?: number; pageNumber?: number; source?: FoodSearchSource }
): Promise<FoodSearchResults> {
  const { pageSize = 20, pageNumber = 1 } = options || {};

  // USDA is the only search provider; `source` is accepted for API
  // compatibility and ignored.
  return searchUSDA({ query, pageSize, pageNumber });
}

// ============================================================================
// Barcode Lookup (OpenFoodFacts; USDA Branded as fallback)
// ============================================================================

export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  return lookupBarcodeOpenFoodFacts(barcode.trim());
}

// ============================================================================
// Natural Language Parsing (CalorieNinjas)
// ============================================================================

export async function parseNaturalLanguageQuery(query: string): Promise<NaturalLanguageParseResult> {
  return parseNaturalLanguage(query);
}

// ============================================================================
// Get Single Food by ID
// ============================================================================

export async function getFoodById(id: string): Promise<FoodSearchResult | null> {
  // Parse ID format: "source:id"
  const [source, ...rest] = id.split(':');
  const sourceId = rest.join(':');

  switch (source) {
    case 'usda':
      return getUSDAFood(parseInt(sourceId, 10));
    case 'openfoodfacts':
      // OpenFoodFacts uses barcode as ID
      const result = await lookupBarcodeOpenFoodFacts(sourceId);
      return result.success ? result.result ?? null : null;
    default:
      return null;
  }
}

// ============================================================================
// Response Trimming
// ============================================================================

/**
 * Strips `rawData` (the full upstream payload) before results cross the wire.
 * Providers return 50-200KB per product; the client only needs the mapped
 * fields, so dropping this keeps API responses small.
 */
export function stripRawData<T extends FoodSearchResult>(food: T): Omit<T, 'rawData'> {
  const clone = { ...food } as T & { rawData?: unknown };
  delete clone.rawData;
  return clone as Omit<T, 'rawData'>;
}

export function stripRawDataFromResults(results: FoodSearchResults): FoodSearchResults {
  return { ...results, results: results.results.map(stripRawData) };
}

export function stripRawDataFromBarcode(result: BarcodeLookupResult): BarcodeLookupResult {
  if (!result.result) return result;
  return { ...result, result: stripRawData(result.result) };
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getRateLimitStatus() {
  return {
    usda: getUSDARateLimitStatus(),
    calorieninjas: { used: 0, remaining: 10_000, resetAt: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    openFoodFacts: { used: 0, remaining: Infinity, resetAt: 0 },
  };
}

export async function clearCache(): Promise<void> {
  await clearAllCache();
}

export async function getCacheStatistics() {
  return getCacheStats();
}

// ============================================================================
// Validate Configuration
// ============================================================================

/**
 * Reports missing credentials. `missing` lists only the keys needed for core
 * features (search + barcode); `optionalMissing` covers natural-language entry,
 * which is hidden in the UI when unavailable.
 */
export function validateConfig(): {
  valid: boolean;
  missing: string[];
  optionalMissing: string[];
} {
  const missing: string[] = [];
  const optionalMissing: string[] = [];

  if (!foodDatabaseConfig.usda.apiKey) missing.push('USDA_API_KEY');
  if (!foodDatabaseConfig.calorieninjas.apiKey) optionalMissing.push('CALORIENINJAS_API_KEY');

  return {
    valid: missing.length === 0,
    missing,
    optionalMissing,
  };
}