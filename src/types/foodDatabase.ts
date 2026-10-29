/**
 * Food Database Types
 * Shared types for USDA, OpenFoodFacts, and CalorieNinjas.
 *
 * Providers: USDA (search), OpenFoodFacts (barcode),
 * CalorieNinjas (natural language).
 */

// ============================================================================
// USDA FoodData Central Types
// ============================================================================

export interface USDAFoodItem {
  fdcId: number;
  description: string;
  dataType: 'Foundation' | 'SR Legacy' | 'Survey (FNDDS)' | 'Branded';
  publicationDate: string;
  foodNutrients: USDANutrient[];
  servingSize?: number;
  servingSizeUnit?: string;
  /** Human-readable portion, e.g. "1 CHICKEN BREAST" (branded foods only). */
  householdServingFullText?: string;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  ingredients?: string;
  foodCategory?: string;
  foodAttributes?: USDAFoodAttribute[];
}

/**
 * USDA returns nutrients in two shapes depending on the endpoint:
 *  - /foods/search  → `value` + `nutrientName`
 *  - /food/{fdcId}  → `amount` + `nutrient.name`
 * Both are modelled here; the mapper accepts either.
 */
export interface USDANutrient {
  nutrientId: number;
  nutrientName?: string;
  nutrientNumber?: string;
  /** Present on /foods/search responses. */
  value?: number;
  /** Present on /food/{fdcId} responses. */
  amount?: number;
  /** Present on /food/{fdcId} responses. */
  name?: string;
  unitName: string;
  derivationCode?: string;
  derivationDescription?: string;
  rank?: number;
}

export interface USDAFoodAttribute {
  name: string;
  value: string;
}

export interface USDAApiResponse {
  foods: USDAFoodItem[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

export interface USDASearchParams {
  query: string;
  pageSize?: number;
  pageNumber?: number;
  dataType?: ('Foundation' | 'SR Legacy' | 'Survey (FNDDS)' | 'Branded')[];
  /**
   * USDA's accepted values are the `.keyword` variants; sending anything else
   * (e.g. bare `dataType`) returns HTTP 400. Omitted by default.
   */
  sortBy?: 'dataType.keyword' | 'lowercaseDescription.keyword' | 'fdcId' | 'publishedDate';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// CalorieNinjas Types
// ============================================================================

/**
 * CalorieNinjas returns one item per food it recognises in the query, already
 * scaled to the portion the user described (e.g. "1 cup rice" -> 158g).
 */
export interface CalorieNinjasItem {
  name: string;
  calories: number;
  serving_size_g: number;
  fat_total_g: number;
  fat_saturated_g: number;
  protein_g: number;
  sodium_mg: number;
  potassium_mg: number;
  cholesterol_mg: number;
  carbohydrates_total_g: number;
  fiber_g: number;
  sugar_g: number;
}

export interface CalorieNinjasResponse {
  items: CalorieNinjasItem[];
}

// ============================================================================
// OpenFoodFacts Types
// ============================================================================

export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  brands_tags?: string[];
  categories?: string;
  categories_tags?: string[];
  quantity?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments: OpenFoodFactsNutriments;
  image_url?: string;
  image_small_url?: string;
  labels?: string;
  labels_tags?: string[];
  packaging?: string;
  packaging_tags?: string[];
  ingredients_text?: string;
  ingredients_text_en?: string;
  allergens?: string;
  allergens_tags?: string[];
  traces?: string;
  traces_tags?: string[];
  additives_tags?: string[];
  nutrition_grade?: string;
  nutrition_grade_fr?: string;
  nova_group?: number;
  ecoscore_grade?: string;
}

export interface OpenFoodFactsNutriments {
  energy_100g?: number;
  energy_kcal_100g?: number;
  fat_100g?: number;
  saturated_fat_100g?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  fiber_100g?: number;
  proteins_100g?: number;
  salt_100g?: number;
  sodium_100g?: number;
  [key: string]: number | undefined;
}

export interface OpenFoodFactsResponse {
  code: string;
  status: number;
  status_verbose: string;
  product?: OpenFoodFactsProduct;
}

// ============================================================================
// Unified Types (App-facing)
// ============================================================================

export interface FoodSearchResult {
  id: string;
  source: FoodProvider;
  name: string;
  brand?: string;
  category?: string;
  servingDescription: string; // e.g., "100g", "1 cup", "1 piece"
  servingWeightGrams: number;
  /**
   * The product's own portion wording, when the source provides one
   * (e.g. "1 CHICKEN BREAST"). Informational only — it does not change the
   * basis of the macro values, which are always per `servingWeightGrams`.
   */
  servingPortionHint?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  imageUrl?: string;
  barcode?: string;
  // Raw data for reference
  rawData?: USDAFoodItem | OpenFoodFactsProduct;
}

export interface FoodSearchResults {
  results: FoodSearchResult[];
  totalHits: number;
  page: number;
  totalPages: number;
  source: FoodSearchSource;
  query: string;
  cached: boolean;
}

/** A concrete data provider. */
export type FoodProvider = 'usda' | 'openfoodfacts' | 'calorieninjas';

/** A single provider, or 'all' for a merged multi-provider search. */
export type FoodSearchSource = FoodProvider | 'all';

export interface BarcodeLookupResult {
  success: boolean;
  result?: FoodSearchResult;
  error?: string;
  /** Providers consulted in the barcode fallback chain. */
  source: 'openfoodfacts' | 'usda';
}

export interface NaturalLanguageParseResult {
  success: boolean;
  foods?: FoodSearchResult[];
  error?: string;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CachedSearchResult {
  key: string;
  data: FoodSearchResults;
  timestamp: number;
  expiresAt: number;
}

export interface CachedBarcodeResult {
  key: string;
  data: BarcodeLookupResult;
  timestamp: number;
  expiresAt: number;
}

export const CACHE_TTL_DAYS = 30;
export const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
export const MAX_CACHE_SIZE = 500; // Max entries in IndexedDB

// ============================================================================
// API Configuration
// ============================================================================

export interface FoodDatabaseConfig {
  usda: {
    apiKey: string;
    baseUrl: string;
    rateLimit: number; // requests per day
  };
  calorieninjas: {
    apiKey: string;
    baseUrl: string;
    rateLimit: number; // requests per month
  };
  openFoodFacts: {
    baseUrl: string;
    userAgent: string;
  };
}