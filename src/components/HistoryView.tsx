'use client';

import React from 'react';
import { useFood } from '@/context/FoodContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import { MACRO_COLORS, WATER_COLOR } from '@/lib/macroColors';
import { formatMl } from '@/lib/format';

function getLastNDays(n: number) {
  const days: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
}

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-base-surface-elevated)',
  border: '1px solid var(--color-border-default)',
  borderRadius: '0.75rem',
  color: 'var(--color-text-primary)',
  fontSize: '12px',
  padding: '8px 12px',
} as const;

const GRID_STROKE = 'var(--color-border-subtle)';
const AXIS_COLOR = 'var(--color-text-muted)';

/* ---- Stat tile ---- */
function StatTile({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color?: string;
}) {
  return (
    <div className="card p-4">
      <p className="eyebrow mb-1.5">{label}</p>
      <p className="font-display text-2xl font-bold tabular leading-none" style={{ color: color ?? 'var(--color-text-primary)' }}>
        {value}
      </p>
      <p className="text-[0.6875rem] text-text-muted mt-1.5">{sub}</p>
    </div>
  );
}

/* ---- Chart card ---- */
function ChartCard({
  title,
  meta,
  empty,
  children,
}: {
  title: string;
  meta?: string;
  empty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="section-title">{title}</h3>
        {meta && <span className="text-xs text-text-muted tabular">{meta}</span>}
      </div>
      <div className="h-52 -ml-2">{children}</div>
      {empty && (
        <p className="text-center text-xs text-text-muted mt-3">No data for this period</p>
      )}
    </div>
  );
}

export function HistoryView() {
  const { getTotalsForDate, getEntriesForDate, getWaterTotalForDate, waterGoal } = useFood();
  const [period, setPeriod] = React.useState<'week' | 'month'>('week');

  const days = getLastNDays(period === 'week' ? 7 : 30);
  const historyData = days.map((date) => {
    const totals = getTotalsForDate(date);
    const entries = getEntriesForDate(date);
    const water = getWaterTotalForDate(date);
    return {
      date,
      displayDate: new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        weekday: period === 'week' ? 'short' : undefined,
      }),
      ...totals,
      water,
      hasEntries: entries.length > 0,
      hasWater: water > 0,
    };
  });

  const daysWithWater = historyData.filter((d) => d.hasWater);
  const totalWater = historyData.reduce((sum, d) => sum + d.water, 0);
  const averageWater = historyData.length > 0 ? totalWater / historyData.length : 0;
  const averageWaterOnLoggedDays = daysWithWater.length > 0 ? totalWater / daysWithWater.length : 0;
  const goalMetDays = historyData.filter((d) => waterGoal.amount > 0 && d.water >= waterGoal.amount).length;
  const loggedFoodDays = historyData.filter((d) => d.hasEntries).length;
  const averageCalories = loggedFoodDays > 0
    ? historyData.reduce((sum, d) => sum + d.calories, 0) / loggedFoodDays
    : 0;

  const noCalories = historyData.every((d) => d.calories === 0);
  const noWater = historyData.every((d) => d.water === 0);
  const noMacros = historyData.every((d) => d.protein === 0 && d.carbs === 0 && d.fat === 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-text-primary tracking-tight">History</h2>
          <p className="text-sm text-text-muted mt-0.5">Trends across your recent days</p>
        </div>

        <div className="flex gap-1 bg-base-surface border border-border-default rounded-lg p-1">
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors duration-150 ${
                period === p
                  ? 'bg-accent-primary text-text-inverse'
                  : 'text-text-muted hover:text-text-primary hover:bg-base-surface-hover'
              }`}
            >
              {p === 'week' ? '7 days' : '30 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Avg water / day"
          value={formatMl(Math.round(averageWater))}
          sub={`${formatMl(Math.round(averageWaterOnLoggedDays))} on logged days`}
          color={WATER_COLOR}
        />
        <StatTile
          label="Water goal met"
          value={`${goalMetDays} / ${historyData.length}`}
          sub={`${historyData.length > 0 ? Math.round((goalMetDays / historyData.length) * 100) : 0}% of period`}
          color={WATER_COLOR}
        />
        <StatTile
          label="Total water"
          value={formatMl(totalWater)}
          sub={`over ${historyData.length} days`}
        />
        <StatTile
          label="Avg calories / day"
          value={Math.round(averageCalories).toLocaleString()}
          sub={`${loggedFoodDays} logged ${loggedFoodDays === 1 ? 'day' : 'days'}`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard title="Calories" meta={`${period === 'week' ? '7' : '30'} days`} empty={noCalories}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={MACRO_COLORS.calories} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={MACRO_COLORS.calories} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="displayDate" stroke={AXIS_COLOR} fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis stroke={AXIS_COLOR} fontSize={10} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: unknown) => [(value as number)?.toLocaleString() ?? '0', 'kcal']} />
              <Area type="monotone" dataKey="calories" stroke={MACRO_COLORS.calories} strokeWidth={2} fillOpacity={1} fill="url(#caloriesGradient)" dot={false} activeDot={{ r: 5, fill: MACRO_COLORS.calories }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Water" meta={`Goal ${formatMl(waterGoal.amount)}`} empty={noWater}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={WATER_COLOR} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={WATER_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="displayDate" stroke={AXIS_COLOR} fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis stroke={AXIS_COLOR} fontSize={10} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: unknown) => [formatMl((value as number) ?? 0), 'water']} />
              <ReferenceLine y={waterGoal.amount} stroke={WATER_COLOR} strokeDasharray="4 4" strokeWidth={1.5} />
              <Area type="monotone" dataKey="water" stroke={WATER_COLOR} strokeWidth={2} fillOpacity={1} fill="url(#waterGradient)" dot={false} activeDot={{ r: 5, fill: WATER_COLOR }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Macronutrients" meta="grams" empty={noMacros}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="displayDate" stroke={AXIS_COLOR} fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis stroke={AXIS_COLOR} fontSize={10} tickLine={false} axisLine={false} width={44} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: unknown, name: unknown) => [`${(value as number)?.toFixed(1)}g`, String(name ?? '')]} />
              <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
              {(['protein', 'carbs', 'fat'] as const).map((macro) => (
                <Line key={macro} type="monotone" dataKey={macro} stroke={MACRO_COLORS[macro]} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: MACRO_COLORS[macro] }} name={macro.charAt(0).toUpperCase() + macro.slice(1)} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Daily totals list */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Daily totals</h3>
          <div className="space-y-2 max-h-[15.5rem] overflow-y-auto pr-1">
            {historyData.slice().reverse().map((day) => {
              const isActive = day.hasEntries || day.hasWater;
              return (
                <div
                  key={day.date}
                  className={`p-3 rounded-xl border transition-colors ${
                    isActive
                      ? 'bg-base-canvas/60 border-border-subtle'
                      : 'bg-transparent border-transparent opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-sm font-medium text-text-primary">{day.displayDate}</span>
                    <span className="font-display font-bold text-text-primary text-sm tabular">
                      {day.calories.toLocaleString()} kcal
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-text-muted tabular">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MACRO_COLORS.protein }} />
                      {day.protein.toFixed(1)}g P
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MACRO_COLORS.carbs }} />
                      {day.carbs.toFixed(1)}g C
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MACRO_COLORS.fat }} />
                      {day.fat.toFixed(1)}g F
                    </span>
                    {day.hasWater && (
                      <span className="inline-flex items-center gap-1" style={{ color: WATER_COLOR }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: WATER_COLOR }} />
                        {formatMl(day.water)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
