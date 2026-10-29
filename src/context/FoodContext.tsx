'use client';

import React, { createContext, useContext, useReducer, useEffect, useMemo, ReactNode } from 'react';
import type {
  FoodEntry,
  DailyTotals,
  MacroGoals,
  UserProfile,
  WaterEntry,
  WaterGoal
} from '@/types/food';
import {
  DEFAULT_GOALS,
  DEFAULT_PROFILE,
  DEFAULT_WATER_GOAL,
  PROFILE_STORAGE_KEY,
  WATER_STORAGE_KEY,
  WATER_GOAL_KEY,
  ACTIVITY_LEVELS,
  GOAL_TYPES
} from '@/types/food';

interface FoodState {
  entries: FoodEntry[];
  goals: MacroGoals;
  profile: UserProfile;
  waterEntries: WaterEntry[];
  waterGoal: WaterGoal;
  selectedDate: string;
}

type FoodAction =
  | { type: 'ADD_ENTRY'; payload: FoodEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'SET_ENTRIES'; payload: FoodEntry[] }
  | { type: 'SET_GOALS'; payload: MacroGoals }
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'ADD_WATER'; payload: WaterEntry }
  | { type: 'DELETE_WATER'; payload: string }
  | { type: 'SET_WATER_GOAL'; payload: WaterGoal }
  | { type: 'SET_SELECTED_DATE'; payload: string }
  | { type: 'HYDRATE'; payload: { entries: FoodEntry[]; waterEntries: WaterEntry[] } };

const STORAGE_KEY = 'calorie-counter-entries';
const GOALS_KEY = 'calorie-counter-goals';
const DATE_KEY = 'calorie-counter-selected-date';

// Stable references so a date with no data doesn't allocate (or invalidate
// memoized consumers) on every call.
const EMPTY_ENTRIES: FoodEntry[] = [];
const EMPTY_WATER_ENTRIES: WaterEntry[] = [];

function getTodayISO(): string {
  if (typeof window === 'undefined') return '1970-01-01';
  return new Date().toISOString().split('T')[0];
}

function loadFromStorage(): FoodEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function loadGoalsFromStorage(): MacroGoals {
  if (typeof window === 'undefined') return DEFAULT_GOALS;
  try {
    const stored = localStorage.getItem(GOALS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_GOALS;
  } catch {
    return DEFAULT_GOALS;
  }
}

function loadProfileFromStorage(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

function loadDateFromStorage(): string {
  if (typeof window === 'undefined') return getTodayISO();
  try {
    const stored = localStorage.getItem(DATE_KEY);
    return stored || getTodayISO();
  } catch {
    return getTodayISO();
  }
}

function loadWaterFromStorage(): WaterEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(WATER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function loadWaterGoalFromStorage(): WaterGoal {
  if (typeof window === 'undefined') return DEFAULT_WATER_GOAL;
  try {
    const stored = localStorage.getItem(WATER_GOAL_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_WATER_GOAL;
  } catch {
    return DEFAULT_WATER_GOAL;
  }
}

function getInitialState(initialDate?: string): FoodState {
  return {
    entries: [],
    goals: DEFAULT_GOALS,
    profile: DEFAULT_PROFILE,
    waterEntries: [],
    waterGoal: DEFAULT_WATER_GOAL,
    selectedDate: initialDate || '1970-01-01',
  };
}

/**
 * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
 * BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) + s
 * where s = +5 for males, -161 for females
 */
function calculateBMR(profile: UserProfile): number {
  const { weight, height, age, gender } = profile;
  const s = gender === 'male' ? 5 : -161;
  return 10 * weight + 6.25 * height - 5 * age + s;
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * TDEE = BMR × Activity Level Multiplier
 */
function calculateTDEE(profile: UserProfile): number {
  const bmr = calculateBMR(profile);
  const activity = ACTIVITY_LEVELS.find(a => a.value === profile.activityLevel);
  const multiplier = activity?.multiplier ?? 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate macro goals based on TDEE and goal type
 */
function calculateGoalsFromProfile(profile: UserProfile): MacroGoals {
  const tdee = calculateTDEE(profile);
  const goal = GOAL_TYPES.find(g => g.value === profile.goal);
  const adjustment = goal?.calorieAdjustment ?? 0;
  const targetCalories = Math.round(tdee + adjustment);

  // Macro distribution based on goal
  let proteinRatio = 0.30;
  let carbRatio = 0.40;
  let fatRatio = 0.30;

  if (profile.goal === 'lose') {
    proteinRatio = 0.35;
    carbRatio = 0.35;
    fatRatio = 0.30;
  } else if (profile.goal === 'gain') {
    proteinRatio = 0.25;
    carbRatio = 0.45;
    fatRatio = 0.30;
  }

  const proteinGrams = Math.round((targetCalories * proteinRatio) / 4);
  const carbGrams = Math.round((targetCalories * carbRatio) / 4);
  const fatGrams = Math.round((targetCalories * fatRatio) / 9);

  return {
    calories: targetCalories,
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams,
  };
}

function foodReducer(state: FoodState, action: FoodAction): FoodState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        entries: action.payload.entries,
        waterEntries: action.payload.waterEntries,
        waterGoal: loadWaterGoalFromStorage(),
        goals: loadGoalsFromStorage(),
        profile: loadProfileFromStorage(),
        selectedDate: loadDateFromStorage(),
      };
    case 'ADD_ENTRY': {
      const newEntries = [...state.entries, action.payload];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      }
      return { ...state, entries: newEntries };
    }
    case 'DELETE_ENTRY': {
      const newEntries = state.entries.filter((e) => e.id !== action.payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      }
      return { ...state, entries: newEntries };
    }
    case 'SET_ENTRIES': {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(action.payload));
      }
      return { ...state, entries: action.payload };
    }
    case 'SET_GOALS': {
      if (typeof window !== 'undefined') {
        localStorage.setItem(GOALS_KEY, JSON.stringify(action.payload));
      }
      return { ...state, goals: action.payload };
    }
    case 'SET_PROFILE': {
      if (typeof window !== 'undefined') {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(action.payload));
      }
      // Auto-calculate goals when profile changes
      const calculatedGoals = calculateGoalsFromProfile(action.payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem(GOALS_KEY, JSON.stringify(calculatedGoals));
      }
      return { ...state, profile: action.payload, goals: calculatedGoals };
    }
    case 'ADD_WATER': {
      const newWaterEntries = [...state.waterEntries, action.payload];
      if (typeof window !== 'undefined') {
        localStorage.setItem(WATER_STORAGE_KEY, JSON.stringify(newWaterEntries));
      }
      return { ...state, waterEntries: newWaterEntries };
    }
    case 'DELETE_WATER': {
      const newWaterEntries = state.waterEntries.filter((w) => w.id !== action.payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem(WATER_STORAGE_KEY, JSON.stringify(newWaterEntries));
      }
      return { ...state, waterEntries: newWaterEntries };
    }
    case 'SET_WATER_GOAL': {
      if (typeof window !== 'undefined') {
        localStorage.setItem(WATER_GOAL_KEY, JSON.stringify(action.payload));
      }
      return { ...state, waterGoal: action.payload };
    }
    case 'SET_SELECTED_DATE': {
      if (typeof window !== 'undefined') {
        localStorage.setItem(DATE_KEY, action.payload);
      }
      return { ...state, selectedDate: action.payload };
    }
    default:
      return state;
  }
}

interface FoodContextType extends FoodState {
  addEntry: (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => void;
  deleteEntry: (id: string) => void;
  setGoals: (goals: MacroGoals) => void;
  setProfile: (profile: UserProfile) => void;
  addWater: (amount: number, date?: string) => void;
  deleteWater: (id: string) => void;
  setWaterGoal: (goal: WaterGoal) => void;
  getWaterForDate: (date: string) => WaterEntry[];
  getWaterTotalForDate: (date: string) => number;
  setSelectedDate: (date: string) => void;
  getEntriesForDate: (date: string) => FoodEntry[];
  getTotalsForDate: (date: string) => DailyTotals;
  calculateBMR: (profile: UserProfile) => number;
  calculateTDEE: (profile: UserProfile) => number;
  calculateGoalsFromProfile: (profile: UserProfile) => MacroGoals;
}

const FoodContext = createContext<FoodContextType | undefined>(undefined);

export function FoodProvider({ children, initialDate }: { children: ReactNode; initialDate?: string }) {
  const [state, dispatch] = useReducer(foodReducer, initialDate, getInitialState);

  useEffect(() => {
    const entries = loadFromStorage();
    const waterEntries = loadWaterFromStorage();
    dispatch({ type: 'HYDRATE', payload: { entries, waterEntries } });
  }, []);

  function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  const addEntry = (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => {
    const newEntry: FoodEntry = {
      ...entry,
      id: generateId(),
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_ENTRY', payload: newEntry });
  };

  const deleteEntry = (id: string) => {
    dispatch({ type: 'DELETE_ENTRY', payload: id });
  };

  const setGoals = (goals: MacroGoals) => {
    dispatch({ type: 'SET_GOALS', payload: goals });
  };

  const setProfile = (profile: UserProfile) => {
    dispatch({ type: 'SET_PROFILE', payload: profile });
  };

  const addWater = (amount: number, date?: string) => {
    if (amount <= 0) return;
    const newEntry: WaterEntry = {
      id: generateId(),
      amount,
      date: date ?? state.selectedDate,
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_WATER', payload: newEntry });
  };

  const deleteWater = (id: string) => {
    dispatch({ type: 'DELETE_WATER', payload: id });
  };

  const setWaterGoal = (goal: WaterGoal) => {
    dispatch({ type: 'SET_WATER_GOAL', payload: goal });
  };

  // Index entries by date once per entries-array identity. HistoryView calls
  // the per-date selectors 30+ times in a single render (7/30 days x totals +
  // entries + water); without this each call re-scanned the full entry list.
  // Grouping is O(n) and each lookup is then O(1).
  const entriesByDate = useMemo(() => {
    const index = new Map<string, FoodEntry[]>();
    for (const entry of state.entries) {
      const bucket = index.get(entry.date);
      if (bucket) {
        bucket.push(entry);
      } else {
        index.set(entry.date, [entry]);
      }
    }
    for (const bucket of index.values()) {
      bucket.sort((a, b) => a.createdAt - b.createdAt);
    }
    return index;
  }, [state.entries]);

  const waterByDate = useMemo(() => {
    const index = new Map<string, WaterEntry[]>();
    for (const entry of state.waterEntries) {
      const bucket = index.get(entry.date);
      if (bucket) {
        bucket.push(entry);
      } else {
        index.set(entry.date, [entry]);
      }
    }
    for (const bucket of index.values()) {
      bucket.sort((a, b) => a.createdAt - b.createdAt);
    }
    return index;
  }, [state.waterEntries]);

  const getEntriesForDate = (date: string): FoodEntry[] => {
    return entriesByDate.get(date) ?? EMPTY_ENTRIES;
  };

  const getWaterForDate = (date: string): WaterEntry[] => {
    return waterByDate.get(date) ?? EMPTY_WATER_ENTRIES;
  };

  const getWaterTotalForDate = (date: string): number => {
    const entries = waterByDate.get(date);
    if (!entries) return 0;
    let total = 0;
    for (const entry of entries) total += entry.amount;
    return total;
  };

  const setSelectedDate = (date: string) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  };

  const getTotalsForDate = (date: string): DailyTotals => {
    const entries = entriesByDate.get(date);
    if (!entries) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    return entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  return (
    <FoodContext.Provider
      value={{
        ...state,
        addEntry,
        deleteEntry,
        setGoals,
        setProfile,
        addWater,
        deleteWater,
        setWaterGoal,
        getWaterForDate,
        getWaterTotalForDate,
        setSelectedDate,
        getEntriesForDate,
        getTotalsForDate,
        calculateBMR,
        calculateTDEE,
        calculateGoalsFromProfile,
      }}
    >
      {children}
    </FoodContext.Provider>
  );
}

export function useFood() {
  const context = useContext(FoodContext);
  if (!context) {
    throw new Error('useFood must be used within a FoodProvider');
  }
  return context;
}