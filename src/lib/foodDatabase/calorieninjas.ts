/**
 * CalorieNinjas API Client
 * https://calorieninjas.com/api
 * Free tier: 10,000 requests/month
 *
 * Used for natural-language meal entry ("2 eggs and 1 cup rice"). CalorieNinjas
 * performs its own quantity parsing and portion sizing, so the returned
 * `serving_size_g` already reflects the requested amount.
 */

import type {
  CalorieNinjasResponse,
  CalorieNinjasItem,
  FoodSearchResult,
  NaturalLanguageParseResult,
} from '@/types/foodDatabase';

// ============================================================================
// Configuration
// ============================================================================

const CALORIENINJAS_BASE_URL = 'https://api.calorieninjas.com/v1/nutrition';
const CALORIENINJAS_API_KEY = process.env.CALORIENINJAS_API_KEY;

export function isCalorieNinjasConfigured(): boolean {
  return Boolean(CALORIENINJAS_API_KEY);
}

// ============================================================================
// Mapping
// ============================================================================

function mapItemToSearchResult(item: CalorieNinjasItem, index: number): FoodSearchResult {
  // CalorieNinjas reports values for the parsed portion, so servingWeightGrams
  // is the amount the user actually asked for.
  const servingGrams = item.serving_size_g || 100;

  return {
    id: `calorieninjas:${index}:${item.name}`,
    source: 'calorieninjas',
    name: item.name,
    servingDescription: `${Math.round(servingGrams)}g`,
    servingWeightGrams: servingGrams,
    calories: Math.round(item.calories),
    protein: Math.round(item.protein_g * 10) / 10,
    carbs: Math.round(item.carbohydrates_total_g * 10) / 10,
    fat: Math.round(item.fat_total_g * 10) / 10,
    fiber: item.fiber_g != null ? Math.round(item.fiber_g * 10) / 10 : undefined,
    sugar: item.sugar_g != null ? Math.round(item.sugar_g * 10) / 10 : undefined,
    sodium: item.sodium_mg != null ? Math.round(item.sodium_mg) : undefined,
  };
}

// ============================================================================
// Natural Language Parsing
// ============================================================================

export async function parseNaturalLanguage(
  query: string
): Promise<NaturalLanguageParseResult> {
  if (!CALORIENINJAS_API_KEY) {
    return { success: false, error: 'CalorieNinjas API key not configured' };
  }

  try {
    const url = `${CALORIENINJAS_BASE_URL}?query=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        'X-Api-Key': CALORIENINJAS_API_KEY,
        Accept: 'application/json',
      },
      // User-specific query; don't cache at the CDN layer.
      cache: 'no-store',
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      if (response.status === 401 || response.status === 400) {
        return { success: false, error: 'CalorieNinjas rejected the API key' };
      }
      if (response.status === 429) {
        return { success: false, error: 'Monthly API limit reached. Try again next month.' };
      }
      return {
        success: false,
        error: `CalorieNinjas error: ${response.status} ${body}`.trim(),
      };
    }

    const data: CalorieNinjasResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        error: 'No foods recognised in that description.',
      };
    }

    return {
      success: true,
      foods: data.items.map(mapItemToSearchResult),
    };
  } catch (error) {
    console.error('[CalorieNinjas] Parse error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
