export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  date: string; // ISO date string (YYYY-MM-DD)
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  createdAt: number; // timestamp for sorting
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserProfile {
  weight: number; // in kg
  height: number; // in cm
  age: number;
  gender: 'male' | 'female';
  activityLevel: ActivityLevel;
  goal: GoalType;
}

export type ActivityLevel =
  | 'sedentary'        // Little or no exercise
  | 'light'            // Light exercise 1-3 days/week
  | 'moderate'         // Moderate exercise 3-5 days/week
  | 'active'           // Hard exercise 6-7 days/week
  | 'veryActive';      // Very hard exercise, physical job

export type GoalType =
  | 'lose'      // Lose weight (deficit)
  | 'maintain'  // Maintain weight
  | 'gain';     // Gain weight (surplus)

export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; multiplier: number }[] = [
  { value: 'sedentary', label: 'Sedentary (little/no exercise)', multiplier: 1.2 },
  { value: 'light', label: 'Light (1-3 days/week)', multiplier: 1.375 },
  { value: 'moderate', label: 'Moderate (3-5 days/week)', multiplier: 1.55 },
  { value: 'active', label: 'Active (6-7 days/week)', multiplier: 1.725 },
  { value: 'veryActive', label: 'Very Active (hard exercise/job)', multiplier: 1.9 },
];

export const GOAL_TYPES: { value: GoalType; label: string; calorieAdjustment: number }[] = [
  { value: 'lose', label: 'Lose Weight', calorieAdjustment: -500 },
  { value: 'maintain', label: 'Maintain Weight', calorieAdjustment: 0 },
  { value: 'gain', label: 'Gain Weight', calorieAdjustment: 500 },
];

export const DEFAULT_GOALS: MacroGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
};

export const DEFAULT_PROFILE: UserProfile = {
  weight: 70,
  height: 175,
  age: 30,
  gender: 'male',
  activityLevel: 'sedentary',
  goal: 'maintain',
};

export const PROFILE_STORAGE_KEY = 'calorie-counter-profile';

export interface WaterEntry {
  id: string;
  amount: number; // in ml
  date: string; // ISO date string (YYYY-MM-DD)
  createdAt: number;
}

export interface WaterGoal {
  amount: number; // in ml
  glassSize: number; // in ml, used by the quick-add button
}

export const DEFAULT_WATER_GOAL: WaterGoal = {
  amount: 2000,
  glassSize: 250,
};

export const WATER_STORAGE_KEY = 'calorie-counter-water';
export const WATER_GOAL_KEY = 'calorie-counter-water-goal';