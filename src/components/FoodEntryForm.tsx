'use client';

import React, { useState } from 'react';
import { useFood } from '@/context/FoodContext';
import type { FoodEntry } from '@/types/food';
import type { FoodSearchResult } from '@/types/foodDatabase';
import { Icons } from './Icons';
import { FoodSearch } from './FoodSearch';

const MEAL_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast', icon: Icons.Breakfast },
  { value: 'lunch', label: 'Lunch', icon: Icons.Lunch },
  { value: 'dinner', label: 'Dinner', icon: Icons.Dinner },
  { value: 'snack', label: 'Snack', icon: Icons.Snack },
] as const;

interface FoodEntryFormProps {
  onClose: () => void;
  editingEntry?: FoodEntry | null;
}

export function FoodEntryForm({ onClose, editingEntry }: FoodEntryFormProps) {
  const { addEntry, deleteEntry, selectedDate } = useFood();
  const isEditing = !!editingEntry;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [dbFood, setDbFood] = useState<FoodSearchResult | null>(null);
  const [servingsInput, setServingsInput] = useState('1');

  const [formData, setFormData] = useState(() => {
    if (editingEntry) {
      return {
        name: editingEntry.name,
        calories: editingEntry.calories.toString(),
        protein: editingEntry.protein.toString(),
        carbs: editingEntry.carbs.toString(),
        fat: editingEntry.fat.toString(),
        mealType: editingEntry.mealType,
        date: editingEntry.date,
      };
    }
    return {
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      mealType: 'breakfast' as FoodEntry['mealType'],
      date: selectedDate,
    };
  });

  const applyFoodToForm = (food: FoodSearchResult, multiplier: number) => {
    setFormData((prev) => ({
      ...prev,
      name: multiplier === 1 ? food.name : `${food.name} (${multiplier} × ${food.servingDescription})`,
      calories: String(Math.round(food.calories * multiplier)),
      protein: String(Math.round(food.protein * multiplier * 10) / 10),
      carbs: String(Math.round(food.carbs * multiplier * 10) / 10),
      fat: String(Math.round(food.fat * multiplier * 10) / 10),
    }));
  };

  const handleDatabaseSelect = (food: FoodSearchResult) => {
    setDbFood(food);
    setServingsInput('1');
    applyFoodToForm(food, 1);
    setIsSearchOpen(false);
  };

  const handleServingsChange = (raw: string) => {
    setServingsInput(raw);
    if (!dbFood) return;
    const parsed = parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    applyFoodToForm(dbFood, Math.min(parsed, 100));
  };

  const clearDatabaseFood = () => {
    setDbFood(null);
    setServingsInput('1');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entryData = {
      name: formData.name.trim(),
      calories: parseInt(formData.calories) || 0,
      protein: parseFloat(formData.protein) || 0,
      carbs: parseFloat(formData.carbs) || 0,
      fat: parseFloat(formData.fat) || 0,
      mealType: formData.mealType,
      date: formData.date,
    };
    if (!entryData.name) return;
    if (isEditing && editingEntry) {
      deleteEntry(editingEntry.id);
      addEntry(entryData);
    } else {
      addEntry(entryData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (editingEntry) {
      deleteEntry(editingEntry.id);
      onClose();
    }
  };

  const macroInputs: { key: 'protein' | 'carbs' | 'fat'; label: string; color: string }[] = [
    { key: 'protein', label: 'Protein', color: 'var(--color-macro-protein)' },
    { key: 'carbs', label: 'Carbs', color: 'var(--color-macro-carbs)' },
    { key: 'fat', label: 'Fat', color: 'var(--color-macro-fat)' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-6 bg-overlay-modal backdrop-blur-sm"
      onClick={onClose}
      style={{ backgroundColor: 'var(--color-overlay-modal)' }}
    >
      <div
        className="w-full sm:max-w-lg bg-base-surface rounded-t-2xl sm:rounded-2xl shadow-level4 border border-border-default max-h-[92vh] sm:max-h-[88vh] flex flex-col animate-slide-up sm:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-form-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle flex-shrink-0">
          <h2 id="food-form-title" className="font-display text-lg font-semibold text-text-primary">
            {isEditing ? 'Edit food' : 'Add food'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-base-surface-hover transition-colors"
            aria-label="Close"
          >
            <Icons.Close className="w-5 h-5" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-primary-muted border border-accent-primary/30 text-accent-primary font-semibold hover:bg-accent-primary/15 transition-colors"
            >
              <Icons.Search className="w-5 h-5" size={20} />
              Search food database
            </button>
          )}

          {dbFood && (
            <div className="rounded-xl border border-accent-primary/30 bg-accent-primary-muted/60 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="eyebrow text-accent-primary">From database</p>
                  <p className="text-sm font-medium text-text-primary truncate mt-0.5">{dbFood.name}</p>
                  <p className="text-xs text-text-muted tabular mt-0.5">
                    {dbFood.calories} kcal per {dbFood.servingDescription} ({dbFood.servingWeightGrams}g)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearDatabaseFood}
                  className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-base-surface-hover flex-shrink-0"
                  aria-label="Clear database food"
                >
                  <Icons.Close className="w-4 h-4" size={16} />
                </button>
              </div>
              <div className="pt-3 mt-3 border-t border-accent-primary/20">
                <div className="flex items-center gap-3 flex-wrap">
                  <label htmlFor="servings-input" className="text-xs font-medium text-text-secondary whitespace-nowrap">
                    Quantity ({dbFood.servingDescription})
                  </label>
                  <input
                    id="servings-input"
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={servingsInput}
                    onChange={(e) => handleServingsChange(e.target.value)}
                    className="w-20 px-2.5 py-1.5 text-sm text-center input-base tabular"
                    aria-label={`Quantity in ${dbFood.servingDescription}`}
                  />
                  <span className="text-xs text-text-muted tabular">
                    = {(parseFloat(servingsInput) * dbFood.servingWeightGrams).toFixed(1)}g total
                  </span>
                </div>
                <p className="text-[0.6875rem] text-text-muted mt-1.5">
                  Macros scale with quantity. 1 × {dbFood.servingDescription} = {dbFood.servingWeightGrams}g.
                </p>
              </div>
            </div>
          )}

          {/* Name + calories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="food-name" className="eyebrow block mb-1.5">Name</label>
              <input
                id="food-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Grilled chicken breast"
                className="input-base"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="food-calories" className="eyebrow block mb-1.5">Calories</label>
              <div className="relative">
                <input
                  id="food-calories"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="0"
                  className="input-base pr-14 tabular"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                  kcal
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="food-date" className="eyebrow block mb-1.5">Date</label>
              <input
                id="food-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-base tabular"
              />
            </div>
          </div>

          {/* Macros */}
          <div>
            <p className="eyebrow mb-2">Macronutrients</p>
            <div className="grid grid-cols-3 gap-3">
              {macroInputs.map(({ key, label, color }) => (
                <div key={key}>
                  <label htmlFor={`food-${key}`} className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      id={`food-${key}`}
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      placeholder="0"
                      className="input-base pr-7 tabular"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                      g
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meal type */}
          <div>
            <p className="eyebrow mb-2">Meal</p>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_OPTIONS.map(({ value, label, icon: Icon }) => {
                const isActive = formData.mealType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, mealType: value })}
                    aria-pressed={isActive}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-accent-primary text-text-inverse border-accent-primary shadow-accent'
                        : 'bg-base-canvas/50 text-text-secondary border-border-subtle hover:border-border-strong hover:text-text-primary'
                    }`}
                  >
                    <Icon className="w-5 h-5" size={20} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-border-subtle flex-shrink-0">
          {isEditing && (
            <button type="button" onClick={handleDelete} className="btn btn-danger flex-1">
              <Icons.Delete className="w-4 h-4" size={16} />
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary flex-1 sm:flex-none sm:px-6"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!formData.name.trim()}
            className="btn btn-primary flex-1"
          >
            {isEditing ? 'Save changes' : 'Add food'}
          </button>
        </div>
      </div>

      {isSearchOpen && (
        <FoodSearch onSelect={handleDatabaseSelect} onClose={() => setIsSearchOpen(false)} />
      )}
    </div>
  );
}
