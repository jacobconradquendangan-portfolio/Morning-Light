'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FoodSearchResult, FoodSearchResults } from '@/types/foodDatabase';

interface UseFoodSearchOptions {
  debounceMs?: number;
  pageSize?: number;
  enabled?: boolean;
}

interface UseFoodSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: FoodSearchResult[];
  loading: boolean;
  error: string | null;
  totalHits: number;
  hasMore: boolean;
  loadMore: () => void;
  clear: () => void;
  retry: () => void;
}

/**
 * Debounced food search against /api/food/search.
 * Cancels in-flight requests when the query changes (AbortController),
 * so stale responses can never overwrite newer results.
 */
export function useFoodSearch(options: UseFoodSearchOptions = {}): UseFoodSearchReturn {
  const {
    debounceMs = 300,
    pageSize = 20,
    enabled = true,
  } = options;

  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalHits, setTotalHits] = useState(0);
  const [page, setPage] = useState(1);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (searchQuery: string, pageNumber: number, append: boolean) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setTotalHits(0);
        setError(null);
        setLoading(false);
        return;
      }

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: searchQuery.trim(),
          page: String(pageNumber),
          limit: String(pageSize),
        });

        const response = await fetch(`/api/food/search?${params}`, {
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Search failed (${response.status})`);
        }

        const payload = data as FoodSearchResults;

        setResults((prev) => (append ? [...prev, ...payload.results] : payload.results));
        setTotalHits(payload.totalHits);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Search failed');
        if (!append) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [pageSize]
  );

  /**
   * Clears results immediately when the query is emptied, so the UI doesn't
   * briefly show stale matches. Kept out of the debounce effect below to avoid
   * a synchronous setState in an effect body.
   */
  const setQuery = useCallback((next: string) => {
    setQueryState(next);
    if (!next.trim()) {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setResults([]);
      setTotalHits(0);
      setError(null);
      setLoading(false);
      setPage(1);
    }
  }, []);

  // Debounce query changes
  useEffect(() => {
    if (!enabled) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) return;

    debounceRef.current = setTimeout(() => {
      setPage(1);
      void runSearch(trimmed, 1, false);
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, debounceMs, enabled, runSearch]);

  // Abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const loadMore = useCallback(() => {
    if (loading || results.length >= totalHits) return;
    const nextPage = page + 1;
    setPage(nextPage);
    void runSearch(query, nextPage, true);
  }, [loading, results.length, totalHits, page, query, runSearch]);

  const clear = useCallback(() => {
    setQuery('');
  }, [setQuery]);

  const retry = useCallback(() => {
    setPage(1);
    void runSearch(query, 1, false);
  }, [query, runSearch]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    totalHits,
    hasMore: results.length < totalHits,
    loadMore,
    clear,
    retry,
  };
}
