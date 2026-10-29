'use client';

import React from 'react';
import { Icons } from './Icons';

export type TabId = 'log' | 'water' | 'goal' | 'history' | 'profile';

export interface TabDef {
  id: TabId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

export const TABS: readonly TabDef[] = [
  { id: 'log', label: 'Log', description: 'Track today’s meals', icon: Icons.Log },
  { id: 'water', label: 'Water', description: 'Hydration intake', icon: Icons.Droplet },
  { id: 'goal', label: 'Goals', description: 'Daily targets', icon: Icons.Target },
  { id: 'history', label: 'History', description: 'Trends & past days', icon: Icons.Chart },
  { id: 'profile', label: 'Profile', description: 'Body & activity', icon: Icons.Settings },
] as const;

/* ============================================================================
   BRAND MARK
   ============================================================================ */

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-9 h-9 rounded-xl bg-accent-primary flex items-center justify-center flex-shrink-0 shadow-accent">
        <Icons.Fire className="w-5 h-5 text-text-inverse" size={20} />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="font-display font-semibold text-text-primary text-[0.9375rem] leading-tight truncate">
            Morning Light
          </p>
          <p className="text-[0.6875rem] text-text-muted leading-tight truncate">Calorie Counter</p>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   DESKTOP SIDEBAR  (≥ lg)
   ============================================================================ */

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-60 bg-base-surface border-r border-border-default"
      aria-label="Primary"
    >
      <div className="px-5 h-16 flex items-center border-b border-border-subtle">
        <BrandMark />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 ${
                isActive
                  ? 'bg-accent-primary-muted text-accent-primary'
                  : 'text-text-secondary hover:bg-base-surface-hover hover:text-text-primary'
              }`}
            >
              <span
                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 ${
                  isActive ? 'bg-accent-primary/15' : 'bg-base-canvas group-hover:bg-base-surface-elevated'
                }`}
              >
                <tab.icon className="w-[18px] h-[18px]" size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold truncate">{tab.label}</span>
                <span
                  className={`block text-[0.6875rem] truncate ${
                    isActive ? 'text-accent-primary/70' : 'text-text-muted'
                  }`}
                >
                  {tab.description}
                </span>
              </span>
              {isActive && <span className="w-1 h-6 rounded-full bg-accent-primary flex-shrink-0" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-border-subtle">
        <p className="text-[0.6875rem] text-text-muted leading-relaxed">
          Data is stored locally on this device.
        </p>
      </div>
    </aside>
  );
}

/* ============================================================================
   MOBILE BOTTOM NAV  (< lg)
   ============================================================================ */

function BottomNav({ activeTab, onTabChange }: SidebarProps) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-base-surface/95 backdrop-blur-xl border-t border-border-default safe-area-bottom"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around px-1 pt-1.5 pb-1.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-1.5 rounded-lg transition-colors duration-150 ${
                isActive ? 'text-accent-primary' : 'text-text-muted active:text-text-primary'
              }`}
            >
              {isActive && (
                <span
                  className="absolute -top-1.5 w-8 h-[3px] rounded-full bg-accent-primary"
                  aria-hidden="true"
                />
              )}
              <tab.icon className="w-[22px] h-[22px]" size={22} />
              <span className="text-[0.625rem] font-semibold tracking-wide truncate max-w-full px-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ============================================================================
   MOBILE TOP BAR  (< lg)
   ============================================================================ */

function MobileTopBar({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-base-canvas/90 backdrop-blur-xl border-b border-border-subtle safe-area-top">
      <div className="flex items-center justify-between gap-3 px-4 h-14">
        <BrandMark compact />
        <h1 className="sr-only">{title}</h1>
        {action}
      </div>
    </header>
  );
}

/* ============================================================================
   APP SHELL
   ============================================================================ */

interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  /** Optional header slot rendered on desktop above the content. */
  header?: React.ReactNode;
  /** Optional sticky action rendered in the mobile top bar. */
  mobileAction?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ activeTab, onTabChange, header, mobileAction, children }: AppShellProps) {
  const activeTabDef = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  return (
    <div className="min-h-screen bg-base-canvas">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

      <div className="lg:pl-60">
        <MobileTopBar title={activeTabDef.label} action={mobileAction} />

        {header}

        {/* pb-24 clears the mobile bottom nav; lg resets it. */}
        <main className="pb-24 lg:pb-10">{children}</main>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
