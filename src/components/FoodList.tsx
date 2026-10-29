'use client';

import React from 'react';
import { useFood } from '@/context/FoodContext';
import type { FoodEntry } from '@/types/food';
import { Icons } from './Icons';

interface MealOption {
  value: FoodEntry['mealType'];
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  timeRange: string;
  color: string;
}

interface FoodListProps {
  onOpenForm: (
    entry?: FoodEntry | null,
    options?: { mealType?: FoodEntry['mealType']; openSearch?: boolean }
  ) => void;
}

const MEAL_OPTIONS: MealOption[] = [
  { value: 'breakfast', label: 'Breakfast', icon: Icons.Breakfast, timeRange: '6–10 AM', color: '#E8A838' },
  { value: 'lunch', label: 'Lunch', icon: Icons.Lunch, timeRange: '11 AM–2 PM', color: '#C46A4A' },
  { value: 'dinner', label: 'Dinner', icon: Icons.Dinner, timeRange: '5–9 PM', color: '#4A7C59' },
  { value: 'snack', label: 'Snacks', icon: Icons.Snack, timeRange: 'Anytime', color: '#B8956A' },
];

function getMealTotals(entries: FoodEntry[]) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function formatMacro(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

/* ============================================================================
   FOOD ENTRY ROW
   ============================================================================ */

function FoodEntryRow({ entry, onEdit, onDelete }: { entry: FoodEntry; onEdit: () => void; onDelete: () => void }) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit();
    }
  };

  return (
    <div className="group flex items-center gap-3 px-3.5 py-3 rounded-lg hover:bg-base-surface-hover transition-colors duration-150">
      <button
        onClick={onEdit}
        onKeyDown={handleKeyDown}
        className="flex-1 min-w-0 flex items-center gap-3 text-left"
        aria-label={`Edit ${entry.name}`}
      >
        <span
          className="w-1 h-9 rounded-full flex-shrink-0"
          style={{ backgroundColor: 'var(--color-macro-calories)' }}
          aria-hidden="true"
        />

        <span className="flex-1 min-w-0">
          <span className="block font-medium text-text-primary text-sm truncate">{entry.name}</span>
          <span className="block text-xs text-text-muted font-mono mt-0.5 truncate tabular">
            {formatMacro(entry.protein)}g P · {formatMacro(entry.carbs)}g C · {formatMacro(entry.fat)}g F
          </span>
        </span>

        <span className="flex items-baseline gap-1 flex-shrink-0">
          <span className="font-display font-bold text-text-primary text-base tabular">{entry.calories}</span>
          <span className="text-[0.6875rem] text-text-muted">kcal</span>
        </span>
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 rounded-md text-text-muted hover:text-semantic-error hover:bg-semantic-error/10 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        aria-label={`Delete ${entry.name}`}
      >
        <Icons.Delete className="w-4 h-4" size={16} />
      </button>
    </div>
  );
}

/* ============================================================================
   MEAL SECTION
   ============================================================================ */

function MealSection({
  meal,
  entries,
  totals,
  onAdd,
  onEdit,
  onDelete,
}: {
  meal: MealOption;
  entries: FoodEntry[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  onAdd: () => void;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (id: string) => void;
}) {
  const hasEntries = entries.length > 0;

  return (
    <section className="card overflow-hidden stagger-in" aria-labelledby={`meal-${meal.value}-heading`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle bg-base-surface-elevated/50">
        <span
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${meal.color}1F`, color: meal.color }}
          aria-hidden="true"
        >
          <meal.icon className="w-[18px] h-[18px]" size={18} />
        </span>

        <div className="flex-1 min-w-0">
          <h3 id={`meal-${meal.value}-heading`} className="font-display font-semibold text-text-primary text-[0.9375rem] truncate">
            {meal.label}
          </h3>
          <p className="text-[0.6875rem] text-text-muted">
            {hasEntries ? `${entries.length} ${entries.length === 1 ? 'item' : 'items'}` : meal.timeRange}
          </p>
        </div>

        {hasEntries && (
          <div className="text-right flex-shrink-0">
            <p className="font-display font-bold text-text-primary text-base tabular leading-none">
              {totals.calories}
            </p>
            <p className="text-[0.6875rem] text-text-muted tabular mt-0.5">
              {formatMacro(totals.protein)}P · {formatMacro(totals.carbs)}C · {formatMacro(totals.fat)}F
            </p>
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="p-1.5">
        {hasEntries ? (
          <>
            {entries.map((entry) => (
              <FoodEntryRow
                key={entry.id}
                entry={entry}
                onEdit={() => onEdit(entry)}
                onDelete={() => onDelete(entry.id)}
              />
            ))}
            <button
              onClick={onAdd}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-accent-primary hover:bg-accent-primary-muted transition-colors duration-150"
            >
              <Icons.Add className="w-4 h-4" size={16} />
              Add to {meal.label.toLowerCase()}
            </button>
          </>
        ) : (
          <button
            onClick={onAdd}
            className="w-full flex items-center gap-2 px-3.5 py-3 rounded-lg text-sm font-medium text-text-muted hover:text-accent-primary hover:bg-accent-primary-muted transition-colors duration-150"
          >
            <Icons.Add className="w-4 h-4" size={16} />
            Add to {meal.label.toLowerCase()}
          </button>
        )}
      </div>
    </section>
  );
}

/* ============================================================================
   EMPTY STATE
   ============================================================================ */

function EmptyState({ onAddFirst }: { onAddFirst: () => void }) {
  return (
    <div className="card p-8 lg:p-12 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-accent-primary-muted flex items-center justify-center mx-auto mb-5">
        <Icons.Utensils className="w-8 h-8 text-accent-primary" size={32} />
      </div>
      <h3 className="font-display text-lg font-semibold text-text-primary mb-2">No foods logged yet</h3>
      <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto leading-relaxed">
        Start your day by adding your first meal. Your macros and calories will update automatically.
      </p>
      <button onClick={onAddFirst} className="btn btn-primary">
        <Icons.Add className="w-5 h-5" size={20} />
        Log your first meal
      </button>
    </div>
  );
}

/* ============================================================================
   FOOD LIST
   ============================================================================ */

export function FoodList({ onOpenForm }: FoodListProps) {
  const { selectedDate, getEntriesForDate, deleteEntry } = useFood();
  const entries = getEntriesForDate(selectedDate);

  const grouped = MEAL_OPTIONS.reduce(
    (acc, meal) => {
      acc[meal.value] = entries.filter((e) => e.mealType === meal.value);
      return acc;
    },
    {} as Record<FoodEntry['mealType'], FoodEntry[]>
  );

  const handleAdd = (mealType: FoodEntry['mealType']) => {
    onOpenForm(undefined, { mealType });
  };

  const hasAnyEntries = entries.length > 0;

  return (
    <div className="space-y-4" role="list" aria-label="Food log">
      {!hasAnyEntries ? (
        <EmptyState onAddFirst={() => handleAdd('breakfast')} />
      ) : (
        MEAL_OPTIONS.map((meal) => (
          <MealSection
            key={meal.value}
            meal={meal}
            entries={grouped[meal.value]}
            totals={getMealTotals(grouped[meal.value])}
            onAdd={() => handleAdd(meal.value)}
            onEdit={onOpenForm}
            onDelete={deleteEntry}
          />
        ))
      )}
    </div>
  );
}
