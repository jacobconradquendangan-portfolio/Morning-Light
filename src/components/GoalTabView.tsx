'use client';

import React, { useState, useEffect } from 'react';
import { useFood } from '@/context/FoodContext';
import type { MacroGoals, WaterGoal } from '@/types/food';
import { DEFAULT_GOALS, DEFAULT_WATER_GOAL } from '@/types/food';
import { Icons } from './Icons';
import { formatMl } from '@/lib/format';

type NumericField = 'calories' | 'protein' | 'carbs' | 'fat';

interface GoalDraft {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

interface WaterGoalDraft {
  amount: string;
  glassSize: string;
}

const GOAL_RANGES: Record<NumericField, { min: number; max: number; label: string }> = {
  calories: { min: 800, max: 5000, label: 'Calories' },
  protein: { min: 10, max: 500, label: 'Protein' },
  carbs: { min: 10, max: 800, label: 'Carbs' },
  fat: { min: 10, max: 300, label: 'Fat' },
};

const WATER_GOAL_RANGES = {
  amount: { min: 500, max: 10000, label: 'Daily water goal' },
  glassSize: { min: 50, max: 1000, label: 'Glass size' },
};

function validateRange(value: string, min: number, max: number, label: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return `${label} is required`;
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return `${label} must be a number`;
  if (num < min || num > max) return `${label} must be between ${min} and ${max}`;
  return undefined;
}

function macroGoalsToDraft(goals: MacroGoals): GoalDraft {
  return {
    calories: String(goals.calories),
    protein: String(goals.protein),
    carbs: String(goals.carbs),
    fat: String(goals.fat),
  };
}

function waterGoalToDraft(goal: WaterGoal): WaterGoalDraft {
  return { amount: String(goal.amount), glassSize: String(goal.glassSize) };
}

const MACRO_FIELDS: {
  key: NumericField;
  label: string;
  unit: string;
  color: string;
  iconClass: string;
  kcalPerGram: number;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal', color: 'var(--color-macro-calories)', iconClass: 'text-macro-calories', kcalPerGram: 0, icon: Icons.Fire },
  { key: 'protein', label: 'Protein', unit: 'g', color: 'var(--color-macro-protein)', iconClass: 'text-macro-protein', kcalPerGram: 4, icon: Icons.Protein },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: 'var(--color-macro-carbs)', iconClass: 'text-macro-carbs', kcalPerGram: 4, icon: Icons.Carbs },
  { key: 'fat', label: 'Fat', unit: 'g', color: 'var(--color-macro-fat)', iconClass: 'text-macro-fat', kcalPerGram: 9, icon: Icons.Fat },
];

export function GoalTabView() {
  const { goals, setGoals, waterGoal, setWaterGoal, profile, calculateGoalsFromProfile } = useFood();
  const [isEditingMacros, setIsEditingMacros] = useState(false);
  const [isEditingWater, setIsEditingWater] = useState(false);
  const [macroDraft, setMacroDraft] = useState<GoalDraft>(() => macroGoalsToDraft(goals));
  const [waterDraft, setWaterDraft] = useState<WaterGoalDraft>(() => waterGoalToDraft(waterGoal));
  const [mounted, setMounted] = useState(false);

  const calculatedGoals = calculateGoalsFromProfile(profile);
  const isAutoCalculated =
    goals.calories === calculatedGoals.calories &&
    goals.protein === calculatedGoals.protein &&
    goals.carbs === calculatedGoals.carbs &&
    goals.fat === calculatedGoals.fat;

  // Hydration guard: runs once on client mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const macroErrors: Partial<Record<NumericField, string>> = {};
  (Object.keys(GOAL_RANGES) as NumericField[]).forEach((f) => {
    macroErrors[f] = validateRange(macroDraft[f], GOAL_RANGES[f].min, GOAL_RANGES[f].max, GOAL_RANGES[f].label);
  });
  const hasMacroErrors = Object.values(macroErrors).some(Boolean);

  const waterErrors: Partial<Record<keyof WaterGoalDraft, string>> = {
    amount: validateRange(waterDraft.amount, WATER_GOAL_RANGES.amount.min, WATER_GOAL_RANGES.amount.max, WATER_GOAL_RANGES.amount.label),
    glassSize: validateRange(waterDraft.glassSize, WATER_GOAL_RANGES.glassSize.min, WATER_GOAL_RANGES.glassSize.max, WATER_GOAL_RANGES.glassSize.label),
  };
  const hasWaterErrors = Object.values(waterErrors).some(Boolean);

  const saveMacros = () => {
    if (hasMacroErrors) return;
    setGoals({
      calories: Number(macroDraft.calories),
      protein: Number(macroDraft.protein),
      carbs: Number(macroDraft.carbs),
      fat: Number(macroDraft.fat),
    });
    setIsEditingMacros(false);
  };

  const useCalculated = () => {
    setGoals(calculatedGoals);
    setMacroDraft(macroGoalsToDraft(calculatedGoals));
    setIsEditingMacros(false);
  };

  const saveWater = () => {
    if (hasWaterErrors) return;
    setWaterGoal({ amount: Number(waterDraft.amount), glassSize: Number(waterDraft.glassSize) });
    setIsEditingWater(false);
  };

  if (!mounted) {
    return (
      <div className="space-y-4 animate-pulse" aria-busy="true">
        <div className="h-32 card" />
        <div className="h-48 card" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-text-primary tracking-tight">Goals</h2>
          <p className="text-sm text-text-muted mt-0.5">Set the daily targets you&apos;re tracking against</p>
        </div>
        {isAutoCalculated ? (
          <span className="badge badge-accent">
            <Icons.Target className="w-3 h-3" size={12} />
            Auto-calculated
          </span>
        ) : (
          <span className="badge badge-neutral">
            <Icons.Edit className="w-3 h-3" size={12} />
            Manually set
          </span>
        )}
      </div>

      {/* Macro targets */}
      <section className="card p-5 lg:p-6" aria-labelledby="macro-goals-heading">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h3 id="macro-goals-heading" className="section-title">Daily targets</h3>
          {isEditingMacros ? (
            <div className="flex gap-2">
              <button onClick={() => { setMacroDraft(macroGoalsToDraft(goals)); setIsEditingMacros(false); }} className="btn btn-ghost text-sm px-3 py-1.5">
                Cancel
              </button>
              <button onClick={saveMacros} disabled={hasMacroErrors} className="btn btn-primary text-sm px-3.5 py-1.5">
                Save
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {!isAutoCalculated && (
                <button onClick={useCalculated} className="btn btn-secondary text-sm px-3 py-1.5">
                  <Icons.Target className="w-4 h-4" size={16} />
                  Use calculated
                </button>
              )}
              <button onClick={() => setIsEditingMacros(true)} className="btn btn-primary text-sm px-3.5 py-1.5">
                <Icons.Edit className="w-4 h-4" size={16} />
                Edit
              </button>
            </div>
          )}
        </div>

        {isEditingMacros ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MACRO_FIELDS.map(({ key, label, unit, color, iconClass, icon: Icon }) => (
                <div key={key} className="bg-base-canvas/50 border border-border-subtle rounded-xl p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}1F` }}>
                      <Icon className={`w-4 h-4 ${iconClass}`} size={16} />
                    </span>
                    <label htmlFor={`goal-${key}`} className="text-sm font-medium text-text-primary">
                      {label} <span className="text-text-muted font-normal">({unit})</span>
                    </label>
                  </div>
                  <input
                    id={`goal-${key}`}
                    type="number"
                    min={GOAL_RANGES[key].min}
                    max={GOAL_RANGES[key].max}
                    step={key === 'calories' ? 1 : 0.1}
                    value={macroDraft[key]}
                    onChange={(e) => setMacroDraft((p) => ({ ...p, [key]: e.target.value }))}
                    aria-invalid={!!macroErrors[key]}
                    aria-describedby={macroErrors[key] ? `goal-${key}-error` : undefined}
                    className={`input-base text-lg font-mono tabular ${macroErrors[key] ? 'border-semantic-error' : ''}`}
                  />
                  {macroErrors[key] && (
                    <p id={`goal-${key}-error`} className="mt-1.5 text-xs text-semantic-error" role="alert">
                      {macroErrors[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-accent-primary-muted border border-accent-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icons.Target className="w-4 h-4 text-accent-primary" size={16} />
                <span className="text-sm font-semibold text-accent-primary">Auto-calculated from your profile</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {MACRO_FIELDS.map(({ key, label, color }) => (
                  <div key={key}>
                    <div className="font-display text-lg font-bold tabular" style={{ color }}>
                      {calculatedGoals[key as keyof MacroGoals].toLocaleString()}
                    </div>
                    <div className="text-[0.6875rem] text-text-muted">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {MACRO_FIELDS.map(({ key, label, unit, color, iconClass, kcalPerGram, icon: Icon }) => {
              const value = goals[key as keyof MacroGoals];
              const pctOfCalories = key !== 'calories' && goals.calories > 0
                ? Math.round((value * kcalPerGram / goals.calories) * 100)
                : null;

              return (
                <div key={key} className="bg-base-canvas/50 border border-border-subtle rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}1F` }}>
                      <Icon className={`w-4 h-4 ${iconClass}`} size={16} />
                    </span>
                    <span className="text-xs font-medium text-text-secondary">{label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-2xl font-bold tabular" style={{ color }}>
                      {value.toLocaleString()}
                    </span>
                    <span className="text-xs text-text-muted">{unit}</span>
                  </div>
                  {pctOfCalories !== null && (
                    <p className="text-[0.6875rem] text-text-muted mt-1 tabular">{pctOfCalories}% of calories</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Water target */}
      <section className="card p-5 lg:p-6" aria-labelledby="water-goals-heading">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h3 id="water-goals-heading" className="section-title">Water target</h3>
          {isEditingWater ? (
            <div className="flex gap-2">
              <button onClick={() => { setWaterDraft(waterGoalToDraft(waterGoal)); setIsEditingWater(false); }} className="btn btn-ghost text-sm px-3 py-1.5">
                Cancel
              </button>
              <button onClick={saveWater} disabled={hasWaterErrors} className="btn btn-primary text-sm px-3.5 py-1.5">
                Save
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditingWater(true)} className="btn btn-primary text-sm px-3.5 py-1.5">
              <Icons.Edit className="w-4 h-4" size={16} />
              Edit
            </button>
          )}
        </div>

        {isEditingWater ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-base-canvas/50 border border-border-subtle rounded-xl p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-8 h-8 rounded-lg bg-macro-water/15 flex items-center justify-center">
                  <Icons.Droplet className="w-4 h-4 text-macro-water" size={16} />
                </span>
                <label htmlFor="water-amount" className="text-sm font-medium text-text-primary">
                  Daily goal <span className="text-text-muted font-normal">(ml)</span>
                </label>
              </div>
              <input
                id="water-amount"
                type="number"
                min={WATER_GOAL_RANGES.amount.min}
                max={WATER_GOAL_RANGES.amount.max}
                step={50}
                value={waterDraft.amount}
                onChange={(e) => setWaterDraft((p) => ({ ...p, amount: e.target.value }))}
                aria-invalid={!!waterErrors.amount}
                aria-describedby={waterErrors.amount ? 'water-amount-error' : undefined}
                className={`input-base text-lg font-mono tabular ${waterErrors.amount ? 'border-semantic-error' : ''}`}
              />
              {waterErrors.amount && (
                <p id="water-amount-error" className="mt-1.5 text-xs text-semantic-error" role="alert">{waterErrors.amount}</p>
              )}
            </div>

            <div className="bg-base-canvas/50 border border-border-subtle rounded-xl p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-8 h-8 rounded-lg bg-macro-water/15 flex items-center justify-center">
                  <Icons.Glass className="w-4 h-4 text-macro-water" size={16} />
                </span>
                <label htmlFor="water-glass" className="text-sm font-medium text-text-primary">
                  Glass size <span className="text-text-muted font-normal">(ml)</span>
                </label>
              </div>
              <input
                id="water-glass"
                type="number"
                min={WATER_GOAL_RANGES.glassSize.min}
                max={WATER_GOAL_RANGES.glassSize.max}
                step={50}
                value={waterDraft.glassSize}
                onChange={(e) => setWaterDraft((p) => ({ ...p, glassSize: e.target.value }))}
                aria-invalid={!!waterErrors.glassSize}
                aria-describedby={waterErrors.glassSize ? 'water-glass-error' : undefined}
                className={`input-base text-lg font-mono tabular ${waterErrors.glassSize ? 'border-semantic-error' : ''}`}
              />
              {waterErrors.glassSize && (
                <p id="water-glass-error" className="mt-1.5 text-xs text-semantic-error" role="alert">{waterErrors.glassSize}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-base-canvas/50 border border-border-subtle rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-lg bg-macro-water/15 flex items-center justify-center">
                  <Icons.Droplet className="w-4 h-4 text-macro-water" size={16} />
                </span>
                <span className="text-xs font-medium text-text-secondary">Daily goal</span>
              </div>
              <span className="font-display text-2xl font-bold text-macro-water tabular">
                {formatMl(waterGoal.amount)}
              </span>
            </div>
            <div className="bg-base-canvas/50 border border-border-subtle rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-lg bg-macro-water/15 flex items-center justify-center">
                  <Icons.Glass className="w-4 h-4 text-macro-water" size={16} />
                </span>
                <span className="text-xs font-medium text-text-secondary">Glass size</span>
              </div>
              <span className="font-display text-2xl font-bold text-macro-water tabular">
                {formatMl(waterGoal.glassSize)}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={useCalculated} disabled={isAutoCalculated} className="card-interactive p-4 text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-accent-primary-muted flex items-center justify-center flex-shrink-0">
              <Icons.Target className="w-4 h-4 text-accent-primary" size={16} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-text-primary">Sync from profile</span>
              <span className="block text-xs text-text-muted">Recalculate from your body stats</span>
            </span>
          </div>
        </button>

        <button
          onClick={() => { setGoals(DEFAULT_GOALS); setWaterGoal(DEFAULT_WATER_GOAL); }}
          className="card-interactive p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-base-surface-elevated flex items-center justify-center flex-shrink-0">
              <Icons.Refresh className="w-4 h-4 text-text-secondary" size={16} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-text-primary">Reset to defaults</span>
              <span className="block text-xs text-text-muted">2000 kcal · 2L water</span>
            </span>
          </div>
        </button>
      </section>
    </div>
  );
}
