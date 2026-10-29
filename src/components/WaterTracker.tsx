'use client';

import React, { useState } from 'react';
import { useFood } from '@/context/FoodContext';
import { Icons } from './Icons';
import { formatMl } from '@/lib/format';

const QUICK_ADD_OPTIONS = [250, 500, 750] as const;

function validateAmount(raw: string, min: number, max: number, label: string): string | undefined {
  const trimmed = raw.trim();
  if (trimmed === '') return `${label} is required`;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return `${label} must be a number`;
  if (value < min || value > max) return `${label} must be between ${min} and ${max}ml`;
  return undefined;
}

/* ============================================================================
   WATER RING
   ============================================================================ */

function WaterRing({ progress, size = 132, strokeWidth = 12 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
      <circle
        strokeWidth={strokeWidth}
        stroke="var(--color-border-subtle)"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        strokeWidth={strokeWidth}
        stroke="var(--color-macro-water)"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.2, 0, 0, 1)' }}
      />
    </svg>
  );
}

/* ============================================================================
   WATER TRACKER
   ============================================================================ */

export function WaterTracker() {
  const {
    selectedDate,
    waterGoal,
    addWater,
    deleteWater,
    setWaterGoal,
    getWaterForDate,
    getWaterTotalForDate,
  } = useFood();

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(waterGoal.amount));
  const [glassDraft, setGlassDraft] = useState(String(waterGoal.glassSize));

  const goalErrors = {
    amount: validateAmount(goalDraft, 100, 20000, 'Daily goal'),
    glassSize: validateAmount(glassDraft, 50, 5000, 'Glass size'),
  };
  const hasGoalErrors = !!(goalErrors.amount || goalErrors.glassSize);

  const entries = getWaterForDate(selectedDate);
  const total = getWaterTotalForDate(selectedDate);
  const progress = waterGoal.amount > 0 ? total / waterGoal.amount : 0;
  const percentage = Math.round(progress * 100);
  const remaining = Math.max(waterGoal.amount - total, 0);
  const isGoalMet = total >= waterGoal.amount;

  const handleUndo = () => {
    const last = entries[entries.length - 1];
    if (last) deleteWater(last.id);
  };

  const handleSaveGoal = () => {
    if (hasGoalErrors) return;
    setWaterGoal({
      amount: Math.round(Number(goalDraft)),
      glassSize: Math.round(Number(glassDraft)),
    });
    setIsEditingGoal(false);
  };

  const handleCancelGoal = () => {
    setGoalDraft(String(waterGoal.amount));
    setGlassDraft(String(waterGoal.glassSize));
    setIsEditingGoal(false);
  };

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <section className="card p-6" aria-labelledby="water-heading">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h2 id="water-heading" className="section-title">Water</h2>
            <p className="text-xs text-text-muted mt-0.5">Stay hydrated throughout the day</p>
          </div>
          <button
            onClick={() => setIsEditingGoal((v) => !v)}
            className="btn btn-ghost text-xs px-3 py-1.5"
          >
            <Icons.Settings className="w-4 h-4" size={16} />
            {isEditingGoal ? 'Close' : 'Set goal'}
          </button>
        </div>

        {isEditingGoal ? (
          <div className="space-y-4 animate-slide-down">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="water-goal-input" className="eyebrow block mb-1.5">
                  Daily goal (ml)
                </label>
                <input
                  id="water-goal-input"
                  type="number"
                  min="100"
                  max="20000"
                  step="50"
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  aria-invalid={!!goalErrors.amount}
                  aria-describedby={goalErrors.amount ? 'water-goal-error' : undefined}
                  className={`input-base tabular ${goalErrors.amount ? 'border-semantic-error' : ''}`}
                />
                {goalErrors.amount && (
                  <p id="water-goal-error" className="text-xs text-semantic-error mt-1.5" role="alert">
                    {goalErrors.amount}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="water-glass-input" className="eyebrow block mb-1.5">
                  Glass size (ml)
                </label>
                <input
                  id="water-glass-input"
                  type="number"
                  min="50"
                  max="5000"
                  step="50"
                  value={glassDraft}
                  onChange={(e) => setGlassDraft(e.target.value)}
                  aria-invalid={!!goalErrors.glassSize}
                  aria-describedby={goalErrors.glassSize ? 'water-glass-error' : undefined}
                  className={`input-base tabular ${goalErrors.glassSize ? 'border-semantic-error' : ''}`}
                />
                {goalErrors.glassSize && (
                  <p id="water-glass-error" className="text-xs text-semantic-error mt-1.5" role="alert">
                    {goalErrors.glassSize}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleCancelGoal} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleSaveGoal} disabled={hasGoalErrors} className="btn btn-primary flex-1">
                Save goal
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative flex-shrink-0">
                <WaterRing progress={progress} size={132} strokeWidth={12} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-bold text-text-primary tabular leading-none">
                    {percentage}%
                  </span>
                  <span className="text-[0.6875rem] text-text-muted mt-0.5">of goal</span>
                </div>
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex items-baseline justify-center sm:justify-start gap-1.5">
                  <span className="font-display text-3xl font-bold text-text-primary tabular leading-none">
                    {formatMl(total)}
                  </span>
                  <span className="text-sm text-text-muted">/ {formatMl(waterGoal.amount)}</span>
                </div>

                <p className={`text-sm mt-2 font-medium ${isGoalMet ? 'text-semantic-success-light' : 'text-text-secondary'}`}>
                  {isGoalMet ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Icons.Check className="w-4 h-4" size={16} />
                      Goal reached
                    </span>
                  ) : (
                    `${formatMl(remaining)} remaining`
                  )}
                </p>

                <p className="text-xs text-text-muted mt-1">
                  ≈ {waterGoal.glassSize > 0 ? (total / waterGoal.glassSize).toFixed(1) : '0'} glasses
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5 h-2 bg-base-canvas rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(progress, 1) * 100}%`,
                  backgroundColor: isGoalMet ? 'var(--color-semantic-success)' : 'var(--color-macro-water)',
                  transition: 'width 700ms cubic-bezier(0.2, 0, 0, 1)',
                }}
              />
            </div>
          </>
        )}
      </section>

      {/* Quick add */}
      <section className="card p-5" aria-labelledby="quick-add-heading">
        <h3 id="quick-add-heading" className="section-title mb-3">Quick add</h3>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ADD_OPTIONS.map((amount) => (
            <button
              key={amount}
              onClick={() => addWater(amount, selectedDate)}
              className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl bg-macro-water/10 text-macro-water border border-macro-water/20 hover:bg-macro-water/20 hover:border-macro-water/40 active:scale-[0.98] transition-all duration-150"
            >
              <Icons.Glass className="w-5 h-5" size={20} />
              <span className="text-sm font-semibold tabular">+{formatMl(amount)}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => addWater(waterGoal.glassSize, selectedDate)}
          className="w-full mt-3 btn btn-secondary"
        >
          <Icons.Droplet className="w-4 h-4" size={16} />
          Add one glass ({formatMl(waterGoal.glassSize)})
        </button>
      </section>

      {/* Log */}
      {entries.length > 0 && (
        <section className="card p-5" aria-labelledby="water-log-heading">
          <div className="flex items-center justify-between mb-3">
            <h3 id="water-log-heading" className="section-title">
              Today&apos;s log
              <span className="ml-2 text-xs font-normal text-text-muted">({entries.length})</span>
            </h3>
            <button onClick={handleUndo} className="btn btn-ghost text-xs px-2.5 py-1">
              Undo last
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {entries.map((entry, i) => (
              <button
                key={entry.id}
                onClick={() => deleteWater(entry.id)}
                className="group inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-full bg-base-canvas border border-border-subtle text-xs text-text-secondary hover:border-semantic-error hover:text-semantic-error transition-colors"
                aria-label={`Remove ${formatMl(entry.amount)} entry`}
              >
                <span className="text-text-muted tabular">{i + 1}.</span>
                <span className="tabular">{formatMl(entry.amount)}</span>
                <Icons.Close className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" size={12} />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
