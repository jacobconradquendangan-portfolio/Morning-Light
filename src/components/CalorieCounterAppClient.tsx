'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FoodProvider, useFood } from '@/context/FoodContext';
import { DailySummary } from './DailySummary';
import { FoodList } from './FoodList';
import { WaterTracker } from './WaterTracker';
import { AppShell, TABS, type TabId } from './AppShell';
import { ProfileView } from './ProfileView';
import { FoodEntryForm } from './FoodEntryForm';
import { ErrorBoundary } from './ErrorBoundary';
import { Icons } from './Icons';
import { WaterChip } from './WaterChip';
import { GoalTabView } from './GoalTabView';
import { HistoryView } from './HistoryView';
import type { FoodEntry } from '@/types/food';

const TAB_LABELS: Record<TabId, string> = {
  log: 'Food log',
  water: 'Water intake',
  goal: 'Goals',
  history: 'History',
  profile: 'Profile',
};

interface CalorieCounterAppClientProps {
  initialDate: string;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function CalorieCounterContent() {
  const { selectedDate, setSelectedDate } = useFood();
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('log');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);

  const isToday = selectedDate === todayISO();
  const showDateNav = activeTab === 'log';

  const openForm = useCallback((entry?: FoodEntry | null) => {
    setEditingEntry(entry ?? null);
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingEntry(null);
  }, []);

  const navigateToWater = useCallback(() => setActiveTab('water'), []);
  const jumpToToday = useCallback(() => setSelectedDate(todayISO()), [setSelectedDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  /* ---- Loading skeleton (pre-hydration) ---- */
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-base-canvas">
        <div className="lg:pl-60">
          <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-6xl mx-auto">
            <div className="h-14 rounded-xl bg-base-surface animate-pulse" />
            <div className="h-56 rounded-2xl bg-base-surface animate-pulse" />
            <div className="h-40 rounded-2xl bg-base-surface animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /* ---- Desktop header ---- */
  const header = (
    <header className="hidden lg:flex sticky top-0 z-30 bg-base-canvas/85 backdrop-blur-xl border-b border-border-subtle">
      <div className="w-full px-8 h-16 flex items-center justify-between gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold text-text-primary tracking-tight truncate">
            {TAB_LABELS[activeTab]}
          </h1>
          <p className="text-xs text-text-muted truncate">
            {TABS.find((t) => t.id === activeTab)?.description}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {showDateNav && (
            <div className="flex items-center gap-2 bg-base-surface border border-border-default rounded-lg p-1">
              <button
                onClick={() => {
                  const d = new Date(selectedDate + 'T00:00:00Z');
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-base-surface-hover transition-colors"
                aria-label="Previous day"
              >
                <Icons.ChevronLeft className="w-5 h-5" size={20} />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto min-w-[10rem] px-3 py-1.5 bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-semibold text-text-primary tabular text-center"
                aria-label="Select date"
              />

              <button
                onClick={() => {
                  const d = new Date(selectedDate + 'T00:00:00Z');
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-base-surface-hover transition-colors"
                aria-label="Next day"
              >
                <Icons.ChevronRight className="w-5 h-5" size={20} />
              </button>
            </div>
          )}

          {activeTab === 'log' && (
            <button onClick={() => openForm(null)} className="btn btn-primary">
              <Icons.Add className="w-5 h-5" size={20} />
              Add food
            </button>
          )}
        </div>
      </div>
    </header>
  );

  /* ---- Mobile top-bar action ---- */
  const mobileAction = showDateNav ? (
    <button
      onClick={jumpToToday}
      disabled={isToday}
      className="text-xs font-semibold text-accent-primary disabled:text-text-muted px-2 py-1"
    >
      {isToday ? 'Today' : 'Jump to today'}
    </button>
  ) : undefined;

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab} header={header} mobileAction={mobileAction}>
      <ErrorBoundary label={TAB_LABELS[activeTab]} resetKey={activeTab}>
        {activeTab === 'log' && (
          <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 max-w-6xl mx-auto space-y-5">
            {/* Two-column on desktop: summary rail + food log */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 items-start">
              <div className="space-y-5 order-2 lg:order-1">
                <FoodList onOpenForm={openForm} />
              </div>

              <div className="space-y-4 order-1 lg:order-2 lg:sticky lg:top-24">
                <ErrorBoundary label="Summary" resetKey={activeTab}>
                  <DailySummary />
                </ErrorBoundary>
                <WaterChip onNavigateToWater={navigateToWater} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'water' && (
          <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 max-w-3xl mx-auto">
            <WaterTracker />
          </div>
        )}

        {activeTab === 'goal' && (
          <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 max-w-4xl mx-auto">
            <GoalTabView />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 max-w-6xl mx-auto">
            <HistoryView />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 max-w-4xl mx-auto">
            <ProfileView />
          </div>
        )}
      </ErrorBoundary>

      {/* Mobile-only floating add button */}
      {activeTab === 'log' && (
        <button
          onClick={() => openForm(null)}
          className="lg:hidden fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-accent-primary text-text-inverse shadow-accent flex items-center justify-center active:scale-95 transition-transform safe-area-bottom"
          aria-label="Add food"
        >
          <Icons.Add className="w-7 h-7" size={28} />
        </button>
      )}

      {isFormOpen && (
        <FoodEntryForm key={editingEntry?.id ?? 'new'} onClose={closeForm} editingEntry={editingEntry} />
      )}
    </AppShell>
  );
}

export function CalorieCounterAppClient({ initialDate }: CalorieCounterAppClientProps) {
  return (
    <FoodProvider initialDate={initialDate}>
      <CalorieCounterContent />
    </FoodProvider>
  );
}
