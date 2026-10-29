'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { FoodSearchResult } from '@/types/foodDatabase';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { FoodSearchResultRow } from './FoodSearchResultRow';
import { BarcodeScanner } from './BarcodeScanner';
import { Icons } from './Icons';
import { getRecentFoods, addRecentFood, type RecentFood } from '@/lib/cache/indexedDB';

type TabId = 'search' | 'barcode' | 'recent' | 'natural';

interface FoodSearchProps {
  onSelect: (food: FoodSearchResult) => void;
  onClose: () => void;
}

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
  { id: 'search', label: 'Search', icon: Icons.Search },
  { id: 'natural', label: 'Describe', icon: Icons.Sparkles },
  { id: 'barcode', label: 'Barcode', icon: Icons.Barcode },
  { id: 'recent', label: 'Recent', icon: Icons.Clock },
];

/**
 * Natural-language entry requires a CalorieNinjas API key. Its tab is hidden
 * unless one is configured, so users never hit a dead-end button.
 */
function useNaturalLanguageAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/food/natural')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setAvailable(Boolean(d.available));
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return available;
}

export function FoodSearch({ onSelect, onClose }: FoodSearchProps) {
  const [activeTab, setActiveTab] = useState<TabId>('search');
  const [recentFoods] = useState<RecentFood[]>(() => getRecentFoods());
  const [scanning, setScanning] = useState(false);

  const [nlQuery, setNlQuery] = useState('');
  const [nlResults, setNlResults] = useState<FoodSearchResult[]>([]);
  const [nlLoading, setNlLoading] = useState(false);
  const [nlError, setNlError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const naturalAvailable = useNaturalLanguageAvailable();
  const visibleTabs = TABS.filter((t) => t.id !== 'natural' || naturalAvailable);

  const { query, setQuery, results, loading, error, totalHits, hasMore, loadMore, retry } =
    useFoodSearch({ enabled: activeTab === 'search' });

  useEffect(() => {
    if (activeTab === 'search') inputRef.current?.focus();
  }, [activeTab]);

  const handleSelect = useCallback(
    (food: FoodSearchResult) => {
      addRecentFood({
        id: food.id,
        name: food.name,
        source: food.source,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        servingDescription: food.servingDescription,
        servingWeightGrams: food.servingWeightGrams,
      });
      onSelect(food);
    },
    [onSelect]
  );

  const runNaturalLanguage = useCallback(async () => {
    const q = nlQuery.trim();
    if (!q) return;

    setNlLoading(true);
    setNlError(null);

    try {
      const response = await fetch('/api/food/natural', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not parse that description');
      }

      setNlResults(data.foods ?? []);
    } catch (err) {
      setNlError(err instanceof Error ? err.message : 'Something went wrong');
      setNlResults([]);
    } finally {
      setNlLoading(false);
    }
  }, [nlQuery]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center sm:p-6 backdrop-blur-sm"
      style={{ backgroundColor: 'var(--color-overlay-modal)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg h-[88vh] sm:h-auto sm:max-h-[85vh] bg-base-surface rounded-t-2xl sm:rounded-2xl shadow-level4 border border-border-default flex flex-col overflow-hidden animate-slide-up sm:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search food database"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle flex-shrink-0">
          <h2 className="font-display text-lg font-semibold text-text-primary">Add from database</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-base-surface-hover transition-colors"
            aria-label="Close"
          >
            <Icons.Close className="w-5 h-5" size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-border-subtle flex-shrink-0 overflow-x-auto no-scrollbar">
          {visibleTabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? 'bg-accent-primary-muted text-accent-primary'
                    : 'text-text-muted hover:text-text-primary hover:bg-base-surface-hover'
                }`}
              >
                <Icon className="w-4 h-4" size={16} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Search tab */}
        {activeTab === 'search' && (
          <>
            <div className="p-4 border-b border-border-subtle flex-shrink-0">
              <div className="relative">
                <Icons.Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
                  size={16}
                />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search foods (e.g., chicken breast)"
                  className="input-base pl-10"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading && results.length === 0 && <SearchSkeleton />}

              {error && (
                <div className="text-center py-10 px-4">
                  <p className="text-sm text-semantic-error mb-3">{error}</p>
                  <button onClick={retry} className="btn btn-primary text-sm">
                    Try again
                  </button>
                </div>
              )}

              {!loading && !error && query.trim() && results.length === 0 && (
                <EmptyState
                  icon={Icons.Search}
                  title="No foods found"
                  body={`Nothing matched "${query.trim()}". Try a different term, or describe your meal instead.`}
                />
              )}

              {!query.trim() && !error && (
                <EmptyState
                  icon={Icons.Search}
                  title="Search 300,000+ foods"
                  body="Powered by USDA FoodData Central."
                />
              )}

              {results.map((food) => (
                <FoodSearchResultRow key={food.id} food={food} onSelect={handleSelect} />
              ))}

              {hasMore && !loading && (
                <button onClick={loadMore} className="btn btn-secondary w-full text-sm">
                  Load more ({results.length} of {totalHits})
                </button>
              )}

              {loading && results.length > 0 && (
                <p className="text-center text-xs text-text-muted py-2">Loading…</p>
              )}
            </div>
          </>
        )}

        {/* Natural language tab */}
        {activeTab === 'natural' && (
          <>
            <div className="p-4 border-b border-border-subtle flex-shrink-0 space-y-3">
              <div>
                <label htmlFor="nl-query" className="eyebrow block mb-1.5">Describe what you ate</label>
                <textarea
                  id="nl-query"
                  value={nlQuery}
                  onChange={(e) => setNlQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void runNaturalLanguage();
                    }
                  }}
                  placeholder={'e.g., "2 eggs, 1 cup white rice, and a banana"'}
                  rows={2}
                  className="input-base resize-none"
                />
              </div>
              <button
                onClick={() => void runNaturalLanguage()}
                disabled={!nlQuery.trim() || nlLoading}
                className="btn btn-primary w-full"
              >
                <Icons.Sparkles className="w-4 h-4" size={16} />
                {nlLoading ? 'Analyzing…' : 'Analyze meal'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {nlLoading && <SearchSkeleton />}

              {nlError && (
                <div className="text-center py-10 px-4">
                  <p className="text-sm text-semantic-error">{nlError}</p>
                </div>
              )}

              {!nlLoading && !nlError && nlResults.length === 0 && (
                <EmptyState
                  icon={Icons.Sparkles}
                  title="Natural language entry"
                  body="Type a sentence describing your meal and we'll break it into individual items with macros."
                />
              )}

              {nlResults.length > 0 && (
                <p className="px-1 pb-1 text-[0.6875rem] text-text-muted">
                  Check each portion — quantities are estimated from your text.
                </p>
              )}

              {nlResults.map((food, idx) => (
                <FoodSearchResultRow key={`${food.id}-${idx}`} food={food} onSelect={handleSelect} />
              ))}
            </div>
          </>
        )}

        {/* Barcode tab */}
        {activeTab === 'barcode' && (
          <div className="flex-1 overflow-y-auto p-4">
            <BarcodeScanner
              scanning={scanning}
              onStart={() => setScanning(true)}
              onStop={() => setScanning(false)}
              onResult={handleSelect}
            />
          </div>
        )}

        {/* Recent tab */}
        {activeTab === 'recent' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {recentFoods.length === 0 ? (
              <EmptyState
                icon={Icons.Clock}
                title="No recent foods"
                body="Foods you add from the database will show up here for quick re-entry."
              />
            ) : (
              recentFoods.map((food) => (
                <FoodSearchResultRow
                  key={food.id}
                  food={{
                    id: food.id,
                    source: food.source,
                    name: food.name,
                    servingDescription: food.servingDescription,
                    servingWeightGrams: food.servingWeightGrams,
                    calories: food.calories,
                    protein: food.protein,
                    carbs: food.carbs,
                    fat: food.fat,
                  }}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-2" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-xl border border-border-subtle flex items-center gap-3 animate-pulse">
          <div className="w-11 h-11 rounded-lg bg-base-surface-elevated flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-base-surface-elevated rounded w-3/4" />
            <div className="h-3 bg-base-surface-elevated rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
  icon: Icon,
}: {
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}) {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-14 h-14 rounded-2xl bg-base-surface-elevated flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-text-muted" size={24} />
      </div>
      <p className="text-sm font-semibold text-text-primary mb-1">{title}</p>
      <p className="text-xs text-text-muted max-w-xs mx-auto leading-relaxed">{body}</p>
    </div>
  );
}
