'use client';

import React, { useState } from 'react';
import { useFood } from '@/context/FoodContext';
import type { UserProfile } from '@/types/food';
import { ACTIVITY_LEVELS, GOAL_TYPES } from '@/types/food';
import { Icons } from './Icons';

type NumericField = 'weight' | 'height' | 'age';

type ProfileDraft = {
  weight: string;
  height: string;
  age: string;
  gender: UserProfile['gender'];
  activityLevel: UserProfile['activityLevel'];
  goal: UserProfile['goal'];
};

const NUMERIC_RANGES: Record<NumericField, { min: number; max: number; label: string }> = {
  weight: { min: 20, max: 500, label: 'Weight' },
  height: { min: 50, max: 300, label: 'Height' },
  age: { min: 1, max: 120, label: 'Age' },
};

function toDraft(profile: UserProfile): ProfileDraft {
  return {
    weight: String(profile.weight),
    height: String(profile.height),
    age: String(profile.age),
    gender: profile.gender,
    activityLevel: profile.activityLevel,
    goal: profile.goal,
  };
}

function validateDraft(draft: ProfileDraft): Partial<Record<NumericField, string>> {
  const errors: Partial<Record<NumericField, string>> = {};
  (Object.keys(NUMERIC_RANGES) as NumericField[]).forEach((field) => {
    const { min, max, label } = NUMERIC_RANGES[field];
    const raw = draft[field].trim();
    if (raw === '') {
      errors[field] = `${label} is required`;
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      errors[field] = `${label} must be a number`;
    } else if (value < min || value > max) {
      errors[field] = `${label} must be between ${min} and ${max}`;
    }
  });
  return errors;
}

function draftToProfile(draft: ProfileDraft): UserProfile {
  return {
    weight: Number(draft.weight),
    height: Number(draft.height),
    age: Number(draft.age),
    gender: draft.gender,
    activityLevel: draft.activityLevel,
    goal: draft.goal,
  };
}

export function ProfileView() {
  const { profile, setProfile, calculateBMR, calculateTDEE, calculateGoalsFromProfile } = useFood();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(() => toDraft(profile));

  const errors = validateDraft(draft);
  const hasErrors = Object.keys(errors).length > 0;

  const previewProfile = hasErrors ? profile : draftToProfile(draft);
  const activeProfile = isEditing ? previewProfile : profile;

  const calculatedGoals = calculateGoalsFromProfile(activeProfile);
  const bmr = calculateBMR(activeProfile);
  const tdee = calculateTDEE(activeProfile);

  const handleNumericChange = (field: NumericField, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleChange = <K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (Object.keys(validateDraft(draft)).length > 0) return;
    setProfile(draftToProfile(draft));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(toDraft(profile));
    setIsEditing(false);
  };

  const metricFields: { key: NumericField; label: string; unit: string; step: string }[] = [
    { key: 'weight', label: 'Weight', unit: 'kg', step: '0.1' },
    { key: 'height', label: 'Height', unit: 'cm', step: '1' },
    { key: 'age', label: 'Age', unit: 'years', step: '1' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-text-primary tracking-tight">Profile</h2>
          <p className="text-sm text-text-muted mt-0.5">Your body stats drive your calorie targets</p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="btn btn-ghost text-sm px-3 py-1.5">Cancel</button>
            <button onClick={handleSave} disabled={hasErrors} className="btn btn-primary text-sm px-3.5 py-1.5">Save</button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="btn btn-primary text-sm px-3.5 py-1.5">
            <Icons.Edit className="w-4 h-4" size={16} />
            Edit
          </button>
        )}
      </div>

      {/* BMR / TDEE */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-5 text-center">
          <div className="w-10 h-10 rounded-xl bg-accent-primary-muted flex items-center justify-center mx-auto mb-3">
            <Icons.Fire className="w-5 h-5 text-accent-primary" size={20} />
          </div>
          <p className="font-display text-3xl font-bold text-accent-primary tabular leading-none">
            {bmr.toLocaleString()}
          </p>
          <p className="text-xs font-medium text-text-secondary mt-2">BMR</p>
          <p className="text-[0.6875rem] text-text-muted mt-0.5">Basal metabolic rate · kcal/day</p>
        </div>

        <div className="card p-5 text-center">
          <div className="w-10 h-10 rounded-xl bg-semantic-success-muted flex items-center justify-center mx-auto mb-3">
            <Icons.Chart className="w-5 h-5 text-semantic-success-light" size={20} />
          </div>
          <p className="font-display text-3xl font-bold text-semantic-success-light tabular leading-none">
            {tdee.toLocaleString()}
          </p>
          <p className="text-xs font-medium text-text-secondary mt-2">TDEE</p>
          <p className="text-[0.6875rem] text-text-muted mt-0.5">Total daily expenditure · kcal/day</p>
        </div>
      </div>

      {/* Calculated goals preview */}
      <div className="card p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="section-title">Calculated targets</h3>
          <span className="badge badge-accent">
            <Icons.Target className="w-3 h-3" size={12} />
            From profile
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'calories', label: 'Calories', unit: '', color: 'var(--color-macro-calories)' },
            { key: 'protein', label: 'Protein', unit: 'g', color: 'var(--color-macro-protein)' },
            { key: 'carbs', label: 'Carbs', unit: 'g', color: 'var(--color-macro-carbs)' },
            { key: 'fat', label: 'Fat', unit: 'g', color: 'var(--color-macro-fat)' },
          ].map(({ key, label, unit, color }) => (
            <div key={key} className="bg-base-canvas/50 border border-border-subtle rounded-xl p-3.5 text-center">
              <p className="font-display text-xl font-bold tabular" style={{ color }}>
                {calculatedGoals[key as keyof typeof calculatedGoals].toLocaleString()}
                <span className="text-xs font-normal text-text-muted">{unit}</span>
              </p>
              <p className="text-[0.6875rem] text-text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Profile form */}
      <div className="card p-5 lg:p-6">
        <h3 className="section-title mb-4">Body &amp; activity</h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricFields.map(({ key, label, unit, step }) => (
            <div key={key}>
              <label htmlFor={`profile-${key}`} className="eyebrow block mb-1.5">
                {label} <span className="normal-case tracking-normal">({unit})</span>
              </label>
              <input
                id={`profile-${key}`}
                type="number"
                min={NUMERIC_RANGES[key].min}
                max={NUMERIC_RANGES[key].max}
                step={step}
                value={draft[key]}
                onChange={(e) => handleNumericChange(key, e.target.value)}
                disabled={!isEditing}
                aria-invalid={isEditing && !!errors[key]}
                aria-describedby={errors[key] ? `${key}-error` : undefined}
                className={`input-base tabular disabled:opacity-60 ${isEditing && errors[key] ? 'border-semantic-error' : ''}`}
              />
              {isEditing && errors[key] && (
                <p id={`${key}-error`} className="text-xs text-semantic-error mt-1.5" role="alert">{errors[key]}</p>
              )}
            </div>
          ))}

          <div>
            <label htmlFor="profile-gender" className="eyebrow block mb-1.5">Gender</label>
            <select
              id="profile-gender"
              value={draft.gender}
              onChange={(e) => handleChange('gender', e.target.value as 'male' | 'female')}
              disabled={!isEditing}
              className="input-base disabled:opacity-60"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {/* Activity level */}
        <div className="mt-6">
          <p className="eyebrow mb-2.5">Activity level</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {ACTIVITY_LEVELS.map(({ value, label, multiplier }) => {
              const isActive = draft.activityLevel === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChange('activityLevel', value)}
                  disabled={!isEditing}
                  aria-pressed={isActive}
                  className={`text-left px-3.5 py-3 rounded-xl border transition-all duration-150 disabled:cursor-not-allowed ${
                    isActive
                      ? 'border-accent-primary bg-accent-primary-muted'
                      : 'border-border-subtle bg-base-canvas/40 hover:border-border-strong disabled:hover:border-border-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-medium truncate ${isActive ? 'text-accent-primary' : 'text-text-primary'}`}>
                      {label}
                    </span>
                    <span className="text-xs text-text-muted tabular flex-shrink-0">×{multiplier}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Goal */}
        <div className="mt-6">
          <p className="eyebrow mb-2.5">Goal</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {GOAL_TYPES.map(({ value, label, calorieAdjustment }) => {
              const isActive = draft.goal === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChange('goal', value)}
                  disabled={!isEditing}
                  aria-pressed={isActive}
                  className={`text-left px-3.5 py-3 rounded-xl border transition-all duration-150 disabled:cursor-not-allowed ${
                    isActive
                      ? 'border-accent-primary bg-accent-primary-muted'
                      : 'border-border-subtle bg-base-canvas/40 hover:border-border-strong disabled:hover:border-border-subtle'
                  }`}
                >
                  <span className={`block text-sm font-medium ${isActive ? 'text-accent-primary' : 'text-text-primary'}`}>
                    {label}
                  </span>
                  <span className="block text-xs text-text-muted tabular mt-0.5">
                    {calorieAdjustment > 0 ? '+' : ''}{calorieAdjustment} kcal/day
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulas */}
        <div className="mt-6 pt-5 border-t border-border-subtle">
          <div className="flex items-center gap-2 mb-3">
            <Icons.Sparkles className="w-4 h-4 text-accent-primary" size={16} />
            <h4 className="text-sm font-semibold text-text-primary">How your targets are calculated</h4>
          </div>
          <div className="space-y-2 text-xs text-text-secondary">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 p-3 rounded-lg bg-base-canvas/50 border border-border-subtle">
              <span className="font-semibold text-text-primary sm:w-32 flex-shrink-0">BMR</span>
              <code className="font-mono text-accent-primary">10×weight + 6.25×height − 5×age + (5 male / −161 female)</code>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 p-3 rounded-lg bg-base-canvas/50 border border-border-subtle">
              <span className="font-semibold text-text-primary sm:w-32 flex-shrink-0">TDEE</span>
              <code className="font-mono text-accent-primary">BMR × activity multiplier</code>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 p-3 rounded-lg bg-base-canvas/50 border border-border-subtle">
              <span className="font-semibold text-text-primary sm:w-32 flex-shrink-0">Target kcal</span>
              <code className="font-mono text-accent-primary">TDEE + goal adjustment (−500 / 0 / +500)</code>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 p-3 rounded-lg bg-base-canvas/50 border border-border-subtle">
              <span className="font-semibold text-text-primary sm:w-32 flex-shrink-0">Macros</span>
              <code className="font-mono text-accent-primary">Lose 35/35/30 · Maintain 30/40/30 · Gain 25/45/30</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
