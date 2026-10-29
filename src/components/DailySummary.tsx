'use client';

import { useState, useEffect, useRef } from 'react';
import { useFood } from '@/context/FoodContext';
import type { MacroGoals } from '@/types/food';
import { Icons } from './Icons';

interface ProgressRingProps {
  progress: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
  className?: string;
  'aria-label'?: string;
}

interface FormulaBreakdownProps {
  macroKey: keyof MacroGoals;
  current: number;
  goal: number;
}

const MACRO_FORMULAS = {
  calories: {
    name: 'Total Calories',
    formula: 'Σ Food Item Calories',
    description: 'Sum of calories from all logged food items',
  },
  protein: {
    name: 'Protein Calories',
    formula: 'Protein (g) × 4 kcal/g',
    description: 'Each gram of protein provides 4 kcal',
  },
  carbs: {
    name: 'Carbohydrate Calories',
    formula: 'Carbs (g) × 4 kcal/g',
    description: 'Each gram of carbohydrate provides 4 kcal',
  },
  fat: {
    name: 'Fat Calories',
    formula: 'Fat (g) × 9 kcal/g',
    description: 'Each gram of fat provides 9 kcal',
  },
} as const;

function ProgressRing({
  progress,
  color,
  size = 168,
  strokeWidth = 12,
  animate = true,
  className = '',
  'aria-label': ariaLabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));
  const percentage = Math.round(progress * 100);
  const pathRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!animate || !pathRef.current) return;
    const path = pathRef.current;
    path.style.strokeDashoffset = String(circumference);
    path.style.transition = 'none';
    path.getBoundingClientRect();
    path.style.transition = 'stroke-dashoffset 900ms cubic-bezier(0.2, 0, 0, 1)';
    path.style.strokeDashoffset = String(offset);
  }, [progress, animate, circumference, offset]);

  return (
    <svg
      width={size}
      height={size}
      className={`transform -rotate-90 ${className}`}
      role="img"
      aria-label={ariaLabel || `${percentage}% complete`}
    >
      <circle
        strokeWidth={strokeWidth}
        stroke="var(--color-border-subtle)"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        ref={pathRef}
        style={{ color, transition: animate ? 'stroke-dashoffset 900ms cubic-bezier(0.2, 0, 0, 1)' : 'none' }}
        strokeWidth={strokeWidth}
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        strokeDasharray={circumference}
        strokeDashoffset={animate ? offset : circumference}
        strokeLinecap="round"
      />
    </svg>
  );
}

function FormulaBreakdown({ macroKey, current, goal }: FormulaBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const formula = MACRO_FORMULAS[macroKey];
  const progress = goal > 0 ? current / goal : 0;
  const percentage = Math.round(progress * 100);

  let substitutedValues = '';
  let stepByStep = '';
  let finalOutput = '';

  switch (macroKey) {
    case 'calories':
      substitutedValues = 'Sum of all food item calories logged for the day';
      stepByStep = `Total = ${current.toLocaleString()} kcal (from logged entries)`;
      finalOutput = `${current.toLocaleString()} kcal of ${goal.toLocaleString()} kcal target (${percentage}%)`;
      break;
    case 'protein':
      substitutedValues = `${current.toFixed(1)}g (Total Daily Protein) × 4 kcal/g`;
      stepByStep = `${current.toFixed(1)} × 4 = ${(current * 4).toFixed(0)} kcal`;
      finalOutput = `${(current * 4).toFixed(0)} kcal from protein (${percentage}% of ${goal}g target)`;
      break;
    case 'carbs':
      substitutedValues = `${current.toFixed(1)}g (Total Daily Carbs) × 4 kcal/g`;
      stepByStep = `${current.toFixed(1)} × 4 = ${(current * 4).toFixed(0)} kcal`;
      finalOutput = `${(current * 4).toFixed(0)} kcal from carbs (${percentage}% of ${goal}g target)`;
      break;
    case 'fat':
      substitutedValues = `${current.toFixed(1)}g (Total Daily Fat) × 9 kcal/g`;
      stepByStep = `${current.toFixed(1)} × 9 = ${(current * 9).toFixed(0)} kcal`;
      finalOutput = `${(current * 9).toFixed(0)} kcal from fat (${percentage}% of ${goal}g target)`;
      break;
  }

  return (
    <div className="border-t border-border-subtle pt-3">
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-2 text-left group"
      >
        <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
          Formula &amp; solution
        </span>
        <Icons.ChevronDown
          className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          size={16}
        />
      </button>

      {isOpen && (
        <div className="animate-slide-down mt-3 space-y-3">
          <div>
            <p className="eyebrow mb-1">Equation</p>
            <code className="block font-mono text-xs text-accent-primary bg-base-canvas px-3 py-2 rounded-md border border-border-subtle">
              {formula.formula}
            </code>
          </div>
          <div>
            <p className="eyebrow mb-1">Data lineage</p>
            <p className="text-xs text-text-secondary font-mono">{substitutedValues}</p>
          </div>
          <div>
            <p className="eyebrow mb-1">Solution</p>
            <p className="text-xs text-text-secondary font-mono">{stepByStep}</p>
          </div>
          <div className="pt-2 border-t border-border-subtle">
            <p className="eyebrow mb-1">Result</p>
            <p className="text-sm font-bold text-text-primary tabular">{finalOutput}</p>
          </div>
          <p className="text-[0.6875rem] text-text-muted italic leading-relaxed">{formula.description}</p>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   MACRO STAT TILE
   ============================================================================ */

interface MacroTileProps {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
  kcalPerGram?: number;
}

function MacroTile({ label, current, goal, unit, color, kcalPerGram }: MacroTileProps) {
  const progress = goal > 0 ? current / goal : 0;
  const remaining = Math.max(goal - current, 0);
  const isOver = goal > 0 && current > goal;

  return (
    <div className="bg-base-canvas/60 border border-border-subtle rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="eyebrow">{label}</span>
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="font-display text-xl font-bold text-text-primary tabular leading-none">
          {current.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        </span>
        <span className="text-xs text-text-muted">/ {goal.toLocaleString()}{unit}</span>
      </div>

      <div className="h-1.5 bg-base-surface rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(progress, 1) * 100}%`,
            backgroundColor: isOver ? 'var(--color-semantic-error)' : color,
            transition: 'width 800ms cubic-bezier(0.2, 0, 0, 1)',
          }}
        />
      </div>

      <div className="flex items-center gap-1.5 mt-2 whitespace-nowrap">
        <span className="text-[0.6875rem] text-text-muted">
          {isOver ? `${(current - goal).toLocaleString()}${unit} over` : `${remaining.toLocaleString()}${unit} left`}
        </span>
        {kcalPerGram && (
          <span className="text-[0.6875rem] text-text-muted tabular ml-1">
            {(current * kcalPerGram).toFixed(0)} kcal
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   DAILY SUMMARY
   ============================================================================ */

export function DailySummary() {
  const { selectedDate, goals, getTotalsForDate } = useFood();
  const totals = getTotalsForDate(selectedDate);
  const [mounted, setMounted] = useState(false);

  // Hydration guard: standard SSR pattern to prevent content flash
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const calorieGoal = goals.calories;
  const calorieCurrent = totals.calories;
  const calorieProgress = calorieGoal > 0 ? calorieCurrent / calorieGoal : 0;
  const caloriePercentage = Math.round(calorieProgress * 100);
  const isOverCalories = calorieGoal > 0 && calorieCurrent > calorieGoal;
  const remaining = Math.max(calorieGoal - calorieCurrent, 0);

  if (!mounted) {
    return (
      <section className="card p-5 animate-pulse" aria-busy="true">
        <div className="h-6 w-32 bg-base-surface-elevated rounded mb-4" />
        <div className="w-40 h-40 rounded-full bg-base-surface-elevated mx-auto mb-5" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-base-surface-elevated rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="card p-5 space-y-5" aria-labelledby="daily-summary-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="daily-summary-heading" className="section-title">
            Daily Intake
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <span className={`badge ${isOverCalories ? 'badge-neutral' : 'badge-accent'}`}>
          {isOverCalories ? 'Over target' : `${caloriePercentage}%`}
        </span>
      </div>

      {/* Hero ring */}
      <div className="relative mx-auto w-[168px] h-[168px]">
        <ProgressRing
          progress={calorieProgress}
          color={isOverCalories ? 'var(--color-semantic-error)' : 'var(--color-accent-primary)'}
          size={168}
          strokeWidth={12}
          aria-label={`${caloriePercentage}% of daily calorie target`}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display text-[2.5rem] font-bold text-text-primary tabular leading-none">
            {calorieCurrent.toLocaleString()}
          </span>
          <span className="text-sm text-text-muted mt-1 tabular">
            of {calorieGoal.toLocaleString()} kcal
          </span>
          <span
            className={`mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
              isOverCalories
                ? 'bg-semantic-error/15 text-semantic-error'
                : 'bg-accent-primary-muted text-accent-primary'
            }`}
          >
            {isOverCalories ? `${(calorieCurrent - calorieGoal).toLocaleString()} over` : `${remaining.toLocaleString()} left`}
          </span>
        </div>
      </div>

      {/* Macro tiles */}
      <div className="grid grid-cols-1 gap-2.5">
        <MacroTile
          label="Protein"
          current={totals.protein}
          goal={goals.protein}
          unit="g"
          color="var(--color-macro-protein)"
          kcalPerGram={4}
        />
        <MacroTile
          label="Carbs"
          current={totals.carbs}
          goal={goals.carbs}
          unit="g"
          color="var(--color-macro-carbs)"
          kcalPerGram={4}
        />
        <MacroTile
          label="Fat"
          current={totals.fat}
          goal={goals.fat}
          unit="g"
          color="var(--color-macro-fat)"
          kcalPerGram={9}
        />
      </div>

      <FormulaBreakdown macroKey="calories" current={calorieCurrent} goal={calorieGoal} />
    </section>
  );
}
