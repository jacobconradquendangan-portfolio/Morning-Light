/**
 * Shared macro-nutrient colour palette.
 * Matches the "Morning Light" design system tokens.
 * Used by DailySummary, GoalsView, HistoryView, and FoodList.
 */
export const MACRO_COLORS = {
  /** Calories — Saffron, the hero accent */
  calories: '#E8A838',
  /** Protein — Terracotta, building blocks */
  protein: '#C46A4A',
  /** Carbohydrates — Fresh green, fuel */
  carbs: '#4A7C59',
  /** Fat — Warm gold, richness */
  fat: '#B8956A',
} as const;

/** Water accent — Cool blue, hydration */
export const WATER_COLOR = '#5A8FC4';

/** Type helper for macro keys */
export type MacroKey = keyof typeof MACRO_COLORS;