/**
 * Save Status Indicator
 * 
 * Displays the current autosave status in the editor header.
 * Shows different states: saving, saved, offline, error
 * 
 * States:
 * - idle: No changes
 * - editing: Changes detected, waiting for debounce
 * - saving: Save request in progress
 * - saved: All changes saved (shows relative time)
 * - offline: Network unavailable, saved locally
 * - error: Save failed, retrying
 */

import React, { useEffect, useState } from 'react';
import { Check, Cloud, CloudOff, Loader2, AlertCircle, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutosaveStatus, AutosaveState } from '@/services/piqWorkshop/autosaveService';
import { formatLastSaved } from '@/services/piqWorkshop/autosaveService';

// =============================================================================
// TYPES
// =============================================================================

interface SaveStatusIndicatorProps {
  /** Current autosave state */
  state: AutosaveState;
  /** Optional additional className */
  className?: string;
  /** Whether to show the icon */
  showIcon?: boolean;
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

interface StatusConfig {
  icon: React.ElementType;
  iconClassName: string;
  getText: (state: AutosaveState) => string;
  animate?: boolean;
}

const statusConfigs: Record<AutosaveStatus, StatusConfig> = {
  idle: {
    icon: Cloud,
    iconClassName: 'text-muted-foreground',
    getText: (state) => state.lastSavedAt 
      ? `Saved ${formatLastSaved(state.lastSavedAt)}`
      : 'No changes',
  },
  editing: {
    icon: Pencil,
    iconClassName: 'text-muted-foreground',
    getText: () => 'Editing...',
  },
  saving: {
    icon: Loader2,
    iconClassName: 'text-primary',
    getText: () => 'Saving...',
    animate: true,
  },
  saved: {
    icon: Check,
    iconClassName: 'text-green-600 dark:text-green-500',
    getText: (state) => `All changes saved${state.lastSavedAt ? ` · ${formatLastSaved(state.lastSavedAt)}` : ''}`,
  },
  offline: {
    icon: CloudOff,
    iconClassName: 'text-amber-600 dark:text-amber-500',
    getText: () => 'Offline – changes saved locally',
  },
  error: {
    icon: AlertCircle,
    iconClassName: 'text-red-600 dark:text-red-500',
    getText: () => 'Autosave failed – retrying...',
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function SaveStatusIndicator({ 
  state, 
  className,
  showIcon = true,
}: SaveStatusIndicatorProps) {
  const config = statusConfigs[state.status];
  const Icon = config.icon;
  const text = config.getText(state);

  // Force re-render every minute to update relative timestamps
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn(
      'flex items-center gap-1.5 text-xs',
      className
    )}>
      {showIcon && (
        <Icon 
          className={cn(
            'w-3.5 h-3.5 flex-shrink-0',
            config.iconClassName,
            config.animate && 'animate-spin'
          )} 
        />
      )}
      <span className={cn(
        'text-muted-foreground whitespace-nowrap',
        state.status === 'error' && 'text-red-600 dark:text-red-500',
        state.status === 'offline' && 'text-amber-600 dark:text-amber-500',
        state.status === 'saved' && 'text-green-600 dark:text-green-500',
      )}>
        {text}
      </span>
    </div>
  );
}

// =============================================================================
// HOOK FOR EASY USAGE
// =============================================================================

/**
 * Hook to create a simple autosave state for testing/mocking
 */
export function useAutosaveState(initialStatus: AutosaveStatus = 'idle'): AutosaveState {
  return {
    status: initialStatus,
    lastSavedAt: initialStatus === 'saved' ? new Date() : null,
    lastError: null,
    hasUnsavedChanges: false,
  };
}

export default SaveStatusIndicator;


