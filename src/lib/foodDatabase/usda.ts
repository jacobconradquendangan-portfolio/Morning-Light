/**
 * USDA FoodData Central API Client
 * https://fdc.nal.usda.gov/api-guide.html
 */

import type {
  USDAFoodItem,
  USDANutrient,
  USDAApiResponse,
  USDASearchParams,
  FoodSearchResult,
  FoodSearchResults,
} from '@/types/foodDatabase';
import { getCachedSearch, setCachedSearch, generateSearchCacheKey } from '@/lib/cache/indexedDB';

// ============================================================================
// Configuration
// ============================================================================

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const USDA_API_KEY = process.env.USDA_API_KEY || process.env.NEXT_PUBLIC_USDA_API_KEY;

if (!USDA_API_KEY) {
  console.warn('[USDA] API key not configured. Set USDA_API_KEY in environment.');
}

// ============================================================================
// Nutrient ID Constants (USDA)
// ============================================================================

const NUTRIENT_IDS = {
  ENERGY: 1008,           // Energy (kcal)
  PROTEIN: 1003,          // Protein (g)
  CARBS: 1005,            // Carbohydrate, by difference (g)
  FAT: 1004,              // Total lipid (fat) (g)
  FIBER: 1079,            // Fiber, total dietary (g)
  SUGAR: 2000,            // Sugars, total including NLEA (g)
  SODIUM: 1093,           // Sodium (mg)
} as const;

// ============================================================================
// Helper: Extract macros from USDA food item
// ============================================================================

/** Reads a nutrient's amount, tolerating both USDA response shapes. */
function nutrientAmount(n: USDANutrient): number {
  return n.value ?? n.amount ?? 0;
}

function extractMacros(food: USDAFoodItem): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
} {
  const nutrients = new Map(food.foodNutrients.map((n) => [n.nutrientId, nutrientAmount(n)]));

  return {
    calories: nutrients.get(NUTRIENT_IDS.ENERGY) ?? 0,
    protein: nutrients.get(NUTRIENT_IDS.PROTEIN) ?? 0,
    carbs: nutrients.get(NUTRIENT_IDS.CARBS) ?? 0,
    fat: nutrients.get(NUTRIENT_IDS.FAT) ?? 0,
    fiber: nutrients.get(NUTRIENT_IDS.FIBER),
    sugar: nutrients.get(NUTRIENT_IDS.SUGAR),
    sodium: nutrients.get(NUTRIENT_IDS.SODIUM),
  };
}

// ============================================================================
// Helper: Determine serving description
// ============================================================================

/**
 * USDA reports nutrient amounts per 100g for every dataType. `servingSize`
 * describes the product's portion (e.g. "1 CHICKEN BREAST", 284g) but does NOT
 * change the basis of the nutrient values.
 *
 * We therefore always report per-100g, and keep the household portion only as
 * a hint. Labelling per-100g values as a 284g serving would understate the
 * logged calories by ~3x.
 */
function getServingDescription(food: USDAFoodItem): {
  description: string;
  weightGrams: number;
  portionHint?: string;
} {
  const base = { description: '100g', weightGrams: 100 };

  const portion = food.householdServingFullText?.trim();
  if (portion) {
    return { ...base, portionHint: portion };
  }

  if (food.servingSize && food.servingSizeUnit === 'g') {
    return { ...base, portionHint: `${food.servingSize}g` };
  }

  return base;
}

// ============================================================================
// Helper: Map USDA food to unified FoodSearchResult
// ============================================================================

function mapUSDAToSearchResult(food: USDAFoodItem): FoodSearchResult {
  // Values are already per 100g, so no scaling is applied here. Serving
  // multipliers are handled by the entry form.
  const macros = extractMacros(food);
  const serving = getServingDescription(food);

  return {
    id: `usda:${food.fdcId}`,
    source: 'usda',
    name: food.description,
    brand: food.brandOwner || food.brandName,
    category: food.foodCategory,
    servingDescription: serving.description,
    servingWeightGrams: serving.weightGrams,
    servingPortionHint: serving.portionHint,
    calories: Math.round(macros.calories),
    protein: Math.round(macros.protein * 10) / 10,
    carbs: Math.round(macros.carbs * 10) / 10,
    fat: Math.round(macros.fat * 10) / 10,
    fiber: macros.fiber != null ? Math.round(macros.fiber * 10) / 10 : undefined,
    sugar: macros.sugar != null ? Math.round(macros.sugar * 10) / 10 : undefined,
    sodium: macros.sodium != null ? Math.round(macros.sodium) : undefined,
    imageUrl: undefined, // USDA doesn't provide images
    barcode: food.gtinUpc,
    rawData: food,
  };
}

// ============================================================================
// Main Search Function
// ============================================================================

export async function searchUSDA(params: USDASearchParams): Promise<FoodSearchResults> {
  const { query, pageSize = 20, pageNumber = 1, dataType, sortBy, sortOrder } = params;

  if (!USDA_API_KEY) {
    throw new Error('USDA API key not configured');
  }

  // Check cache first
  const cacheKey = generateSearchCacheKey('usda', query, pageNumber, pageSize);
  const cached = await getCachedSearch(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  // Build request. USDA 400s on sortBy/sortOrder values it doesn't recognise,
  // so only send them when explicitly requested.
  const searchParams = new URLSearchParams({
    api_key: USDA_API_KEY,
    query,
    pageSize: pageSize.toString(),
    pageNumber: pageNumber.toString(),
  });

  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);

  if (dataType && dataType.length > 0) {
    dataType.forEach((dt) => searchParams.append('dataType', dt));
  }

  const url = `${USDA_BASE_URL}/foods/search?${searchParams}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 }, // Cache in Next.js for 1 hour
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`USDA API error: ${response.status} ${errorText}`);
    }

    const data: USDAApiResponse = await response.json();

    // Map results
    const results = data.foods.map(mapUSDAToSearchResult);

    const searchResults: FoodSearchResults = {
      results,
      totalHits: data.totalHits,
      page: data.currentPage,
      totalPages: data.totalPages,
      source: 'usda',
      query,
      cached: false,
    };

    // Cache the results
    await setCachedSearch(cacheKey, searchResults);

    return searchResults;
  } catch (error) {
    console.error('[USDA] Search error:', error);
    throw error;
  }
}

// ============================================================================
// Get Single Food by FDC ID
// ============================================================================

export async function getUSDAFood(fdcId: number): Promise<FoodSearchResult | null> {
  if (!USDA_API_KEY) {
    throw new Error('USDA API key not configured');
  }

  const url = `${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`USDA API error: ${response.status}`);
    }

    const food: USDAFoodItem = await response.json();
    return mapUSDAToSearchResult(food);
  } catch (error) {
    console.error('[USDA] Get food error:', error);
    throw error;
  }
}

// ============================================================================
// Search by Barcode (UPC)
// ============================================================================

export async function searchUSDAByBarcode(barcode: string): Promise<FoodSearchResult | null> {
  if (!USDA_API_KEY) {
    throw new Error('USDA API key not configured');
  }

  const url = `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(barcode)}&dataType=Branded&pageSize=5`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const data: USDAApiResponse = await response.json();

    // Find exact barcode match
    const match = data.foods.find((f) => f.gtinUpc === barcode);
    if (!match) return null;

    return mapUSDAToSearchResult(match);
  } catch (error) {
    console.error('[USDA] Barcode search error:', error);
    return null;
  }
}

// ============================================================================
// Rate Limit Helpers
// ============================================================================

let usdaRequestCount = 0;
let usdaRequestResetTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

export function getUSDARateLimitStatus(): { used: number; remaining: number; resetAt: number } {
  const now = Date.now();
  if (now > usdaRequestResetTime) {
    usdaRequestCount = 0;
    usdaRequestResetTime = now + 24 * 60 * 60 * 1000;
  }
  return {
    used: usdaRequestCount,
    remaining: Math.max(0, 1000 - usdaRequestCount),
    resetAt: usdaRequestResetTime,
  };
}

export function incrementUSDARateLimit(): void {
  usdaRequestCount++;
}