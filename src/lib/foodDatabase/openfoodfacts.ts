/**
 * OpenFoodFacts API Client
 * https://world.openfoodfacts.org/data
 * Free, open, community-driven - 3M+ products
 * No API key required, but polite to set User-Agent
 */

import type {
  OpenFoodFactsProduct,
  OpenFoodFactsResponse,
  FoodSearchResult,
  BarcodeLookupResult,
} from '@/types/foodDatabase';
import { getCachedBarcode, setCachedBarcode, generateBarcodeCacheKey } from '@/lib/cache/indexedDB';

// ============================================================================
// Configuration
// ============================================================================

const OPENFOODFACTS_BASE_URL = 'https://world.openfoodfacts.org/api/v0';
const USER_AGENT = process.env.OPENFOODFACTS_USER_AGENT || 'CalorieCounter/1.0';

// ============================================================================
// Helper: Map OpenFoodFacts product to unified FoodSearchResult
// ============================================================================

function mapOpenFoodFactsToSearchResult(product: OpenFoodFactsProduct): FoodSearchResult {
  const nutriments = product.nutriments;

  // Get serving size in grams
  let servingWeightGrams = 100;
  let servingDescription = '100g';

  if (product.serving_quantity && product.serving_size) {
    // Parse serving size (e.g., "30 g" or "100 ml")
    const match = product.serving_size.match(/([\d.]+)\s*(\w+)/);
    if (match) {
      const qty = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit === 'g') {
        servingWeightGrams = qty;
        servingDescription = `${qty}g`;
      } else if (unit === 'ml') {
        servingWeightGrams = qty; // Assume 1ml ≈ 1g for liquids
        servingDescription = `${qty}ml`;
      }
    }
  } else if (product.serving_quantity) {
    servingWeightGrams = product.serving_quantity;
    servingDescription = `${product.serving_quantity}g`;
  }

  // Scale from per 100g to serving size
  const scale = servingWeightGrams / 100;

  // Prefer kcal directly; fall back to converting kJ (energy_100g) -> kcal.
  const caloriesPer100g =
    nutriments.energy_kcal_100g ??
    (nutriments.energy_100g != null ? nutriments.energy_100g / 4.184 : 0);

  return {
    id: `openfoodfacts:${product.code}`,
    source: 'openfoodfacts',
    name: product.product_name_en || product.product_name || 'Unknown Product',
    brand: product.brands,
    category: product.categories,
    servingDescription,
    servingWeightGrams,
    calories: Math.round(caloriesPer100g * scale),
    protein: Math.round((nutriments.proteins_100g || 0) * scale * 10) / 10,
    carbs: Math.round((nutriments.carbohydrates_100g || 0) * scale * 10) / 10,
    fat: Math.round((nutriments.fat_100g || 0) * scale * 10) / 10,
    fiber: nutriments.fiber_100g ? Math.round(nutriments.fiber_100g * scale * 10) / 10 : undefined,
    sugar: nutriments.sugars_100g ? Math.round(nutriments.sugars_100g * scale * 10) / 10 : undefined,
    sodium: nutriments.sodium_100g ? Math.round(nutriments.sodium_100g * scale * 1000) : undefined, // Convert g to mg
    imageUrl: product.image_url || product.image_small_url,
    barcode: product.code,
    rawData: product,
  };
}

// ============================================================================
// Barcode Lookup
// ============================================================================

export async function lookupBarcodeOpenFoodFacts(barcode: string): Promise<BarcodeLookupResult> {
  // Check cache first
  const cacheKey = generateBarcodeCacheKey(barcode);
  const cached = await getCachedBarcode(cacheKey);
  if (cached) {
    return { ...cached, source: 'openfoodfacts' };
  }

  try {
    const url = `${OPENFOODFACTS_BASE_URL}/product/${encodeURIComponent(barcode)}.json`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, source: 'openfoodfacts' };
    }

    const data: OpenFoodFactsResponse = await response.json();

    if (data.status !== 1 || !data.product) {
      return { success: false, error: 'Product not found', source: 'openfoodfacts' };
    }

    const result = mapOpenFoodFactsToSearchResult(data.product);

    const lookupResult: BarcodeLookupResult = {
      success: true,
      result,
      source: 'openfoodfacts',
    };

    await setCachedBarcode(cacheKey, lookupResult);
    return lookupResult;
  } catch (error) {
    console.error('[OpenFoodFacts] Barcode lookup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'openfoodfacts',
    };
  }
}

// ============================================================================
// Search by Name (limited - OpenFoodFacts search is less robust)
// ============================================================================

export async function searchOpenFoodFacts(
  query: string,
  pageSize = 20,
  page = 1
): Promise<FoodSearchResult[]> {
  try {
    // OpenFoodFacts search endpoint
    const url = `${OPENFOODFACTS_BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${pageSize}&page=${page}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();

    if (!data.products || !Array.isArray(data.products)) return [];

    return data.products
      .filter((p: OpenFoodFactsProduct) => p.product_name || p.product_name_en)
      .slice(0, pageSize)
      .map(mapOpenFoodFactsToSearchResult);
  } catch (error) {
    console.error('[OpenFoodFacts] Search error:', error);
    return [];
  }
}