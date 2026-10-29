'use client';

import React from 'react';
import { useFood } from '@/context/FoodContext';
import { Icons } from './Icons';
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
      className="card-interactive p-4 cursor-pointer focus-visible:border-border-focus"
      aria-label={`Water: ${formatMl(total)} of ${formatMl(goal)} (${percentage}%). Open water tracker.`}
    >
      <div className="flex items-center gap-3.5">
        {/* Ring */}
        <div className="relative flex-shrink-0 w-11 h-11">
          <svg width="44" height="44" className="transform -rotate-90" aria-hidden="true">
            <circle
              strokeWidth={4}
              stroke="var(--color-border-subtle)"
              fill="transparent"
              r={18}
              cx={22}
              cy={22}
            />
            <circle
              strokeWidth={4}
              stroke="var(--color-macro-water)"
              fill="transparent"
              r={18}
              cx={22}
              cy={22}
              strokeDasharray={113.1}
              strokeDashoffset={113.1 * (1 - Math.min(progress, 1))}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.2, 0, 0, 1)' }}
            />
          </svg>
          <Icons.Droplet className="absolute inset-0 m-auto w-4 h-4 text-macro-water" size={16} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-text-primary text-base tabular leading-none">
              {formatMl(total)}
            </span>
            <span className="text-xs text-text-muted">/ {formatMl(goal)}</span>
          </div>
          <div className="mt-2 h-1.5 bg-base-canvas rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${percentage}%`,
                backgroundColor: isGoalMet ? 'var(--color-semantic-success)' : 'var(--color-macro-water)',
                transition: 'width 700ms cubic-bezier(0.2, 0, 0, 1)',
              }}
            />
          </div>
        </div>

        {/* Quick add */}
      </div>

      <p className={`mt-3 text-[0.6875rem] flex items-center gap-1.5 ${isGoalMet ? 'text-semantic-success-light' : 'text-text-muted'}`}>
        {isGoalMet ? (
          <>
            <Icons.Check className="w-3.5 h-3.5" size={14} />
            Goal reached — nice work
          </>
        ) : (
          <>
            <Icons.Droplet className="w-3.5 h-3.5" size={14} />
            {formatMl(remaining)} to reach your goal
          </>
        )}
      </p>
    </div>
  );
}
