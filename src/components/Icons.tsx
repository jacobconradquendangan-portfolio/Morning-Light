'use client';

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

const createIcon = (paths: React.ReactNode, name: string) => {
  const Component = (props: IconProps) => (
    <svg
      className={props.className}
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
  Component.displayName = name;
  return Component;
};

export const Icons = {
  // Navigation icons
  Log: createIcon(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </>,
    'Log'
  ),

  // Meal type icons
  Breakfast: createIcon(
    <>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
      <path d="M12 6v6l4 2" />
    </>,
    'Breakfast'
  ),
  Lunch: createIcon(
    <>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </>,
    'Lunch'
  ),
  Dinner: createIcon(
    <>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </>,
    'Dinner'
  ),
  Snack: createIcon(
    <>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </>,
    'Snack'
  ),

  // Water tracking
  Droplet: createIcon(
    <>
      <path d="M12 2.7 6.9 8.1a7 7 0 1 0 10.2 0z" />
    </>,
    'Droplet'
  ),
  Glass: createIcon(
    <>
      <path d="M6 3h12l-1.5 16.5a2 2 0 0 1-2 1.5h-5a2 2 0 0 1-2-1.5z" />
      <line x1="6.6" y1="9" x2="17.4" y2="9" />
    </>,
    'Glass'
  ),

  Utensils: createIcon(
    <>
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-4" />
      <line x1="7" y1="15" x2="17" y2="15" />
    </>,
    'Utensils'
  ),

  // Actions
  Add: createIcon(
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>,
    'Add'
  ),
  Edit: createIcon(
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>,
    'Edit'
  ),
  Delete: createIcon(
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>,
    'Delete'
  ),
  ChevronDown: createIcon(
    <>
      <polyline points="6 9 12 15 18 9" />
    </>,
    'ChevronDown'
  ),
  ChevronLeft: createIcon(
    <>
      <polyline points="15 18 9 12 15 6" />
    </>,
    'ChevronLeft'
  ),
  ChevronRight: createIcon(
    <>
      <polyline points="9 18 15 12 9 6" />
    </>,
    'ChevronRight'
  ),
  Close: createIcon(
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>,
    'Close'
  ),

  // Food database
  Search: createIcon(
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>,
    'Search'
  ),
  Barcode: createIcon(
    <>
      <path d="M3 5v14" />
      <path d="M8 5v14" />
      <path d="M12 5v14" />
      <path d="M17 5v14" />
      <path d="M21 5v14" />
    </>,
    'Barcode'
  ),
  Camera: createIcon(
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </>,
    'Camera'
  ),
  Clock: createIcon(
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>,
    'Clock'
  ),
  Sparkles: createIcon(
    <>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
    </>,
    'Sparkles'
  ),

  // Check icon
  Check: createIcon(
    <>
      <polyline points="20 6 9 17 4 12" />
    </>,
    'Check'
  ),

  // Alert icon
  Alert: createIcon(
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </>,
    'Alert'
  ),

  // Refresh/Reset icon
  Refresh: createIcon(
    <>
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </>,
    'Refresh'
  ),

  // Macro icons
  Fire: createIcon(
    <>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5a6.5 6.5 0 0 1-7 4z" />
      <path d="M11 19.5C7.5 17 4 14 4 11a7 7 0 0 1 14 0c0 3-3.5 6-7 8.5" />
    </>,
    'Fire'
  ),
  Protein: createIcon(
    <>
      <path d="M10 18v-6a2 2 0 0 1 4 0v6" />
      <path d="M4 14h16" />
      <path d="M4 20h16" />
    </>,
    'Protein'
  ),
  Carbs: createIcon(
    <>
      <path d="M8 2v20" />
      <path d="M16 2v20" />
      <path d="M4 10h20" />
      <path d="M4 14h20" />
    </>,
    'Carbs'
  ),
  Fat: createIcon(
    <>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </>,
    'Fat'
  ),

  // Settings/Goals
  Target: createIcon(
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>,
    'Target'
  ),
  Chart: createIcon(
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </>,
    'Chart'
  ),
  Settings: createIcon(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>,
    'Settings'
  ),
};

export type IconName = keyof typeof Icons;