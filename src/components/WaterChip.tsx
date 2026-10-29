'use client';

import React from 'react';
import { useFood } from '@/context/FoodContext';
import { formatMl } from '@/lib/format';

/* ============================================================================
   WATER CHIP — compact hydration card for the Log tab
   ============================================================================ */

export function WaterChip({ onNavigateToWater }: { onNavigateToWater: () => void }) {
  const { selectedDate, waterGoal, getWaterTotalForDate } = useFood();

  const total = getWaterTotalForDate(selectedDate);
  const goal = waterGoal.amount;
  const progress = goal > 0 ? total / goal : 0;
  const percentage = Math.min(Math.round(progress * 100), 100);
  const isGoalMet = total >= goal;
  const remaining = Math.max(goal - total, 0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onNavigateToWater();
    }
  };

  return (
    <div
      onClick={onNavigateToWater}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="bg-base-canvas/60 border border-border-subtle rounded-xl p-3.5"
      aria-label={`Water: ${formatMl(total)} of ${formatMl(goal)} (${percentage}%). Open water tracker.`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="eyebrow">Water</span>
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: 'var(--color-macro-water)' }}
          aria-hidden="true"
        />
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="font-display text-xl font-bold text-text-primary tabular leading-none">
          {formatMl(total)}
        </span>
        <span className="text-xs text-text-muted">/ {formatMl(goal)}</span>
      </div>

      <div className="h-1.5 bg-base-surface rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(progress, 1) * 100}%`,
            backgroundColor: isGoalMet ? 'var(--color-semantic-success)' : 'var(--color-macro-water)',
            transition: 'width 800ms cubic-bezier(0.2, 0, 0, 1)',
          }}
        />
      </div>

      <div className="flex items-center gap-1.5 mt-2 whitespace-nowrap">
        <span className="text-[0.6875rem] text-text-muted">
          {isGoalMet ? 'Goal reached' : `${formatMl(remaining)} left`}
        </span>
      </div>
    </div>
  );
}
