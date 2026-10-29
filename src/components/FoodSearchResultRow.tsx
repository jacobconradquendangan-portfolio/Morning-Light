'use client';

import React from 'react';
import type { FoodSearchResult } from '@/types/foodDatabase';

interface FoodSearchResultRowProps {
  food: FoodSearchResult;
  onSelect: (food: FoodSearchResult) => void;
  selected?: boolean;
}

const SOURCE_LABELS: Record<FoodSearchResult['source'], string> = {
  usda: 'USDA',
  openfoodfacts: 'OFF',
  calorieninjas: 'Parsed',
};

const SOURCE_STYLES: Record<FoodSearchResult['source'], string> = {
  usda: 'bg-semantic-success-muted text-semantic-success-light',
  openfoodfacts: 'bg-accent-primary-muted text-accent-primary',
  calorieninjas: 'bg-semantic-warning-muted text-semantic-warning',
};

export function FoodSearchResultRow({ food, onSelect, selected }: FoodSearchResultRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(food)}
      aria-label={`Add ${food.name}`}
      className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex items-center gap-3 ${
        selected
          ? 'border-accent-primary bg-accent-primary-muted'
          : 'border-border-subtle hover:border-border-strong hover:bg-base-surface-hover'
      }`}
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-base-surface-elevated border border-border-subtle flex items-center justify-center">
        {food.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={food.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-xs font-semibold text-text-muted">
            {food.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-text-primary line-clamp-2 leading-snug">{food.name}</p>
          <span className={`flex-shrink-0 badge ${SOURCE_STYLES[food.source]}`}>
            {SOURCE_LABELS[food.source]}
          </span>
        </div>

        {food.brand && (
          <p className="text-xs text-text-muted truncate mt-0.5">{food.brand}</p>
        )}

        <div className="flex items-center gap-2.5 mt-1.5 text-xs tabular">
          <span className="font-semibold text-accent-primary">{food.calories} kcal</span>
          <span className="text-text-muted">P {food.protein}g</span>
          <span className="text-text-muted">C {food.carbs}g</span>
          <span className="text-text-muted">F {food.fat}g</span>
        </div>

        <p className="text-[0.6875rem] text-text-muted mt-1 truncate">
          per {food.servingDescription}
          {food.servingPortionHint && ` · ${food.servingPortionHint}`}
        </p>
      </div>
    </button>
  );
}
