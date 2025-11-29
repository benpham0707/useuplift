/**
 * Local Recovery Banner
 * 
 * Non-blocking banner shown at the top of the editor when a local draft
 * is detected that's newer than the server version.
 * 
 * Features:
 * - Shows timestamp and word count of local draft
 * - "Restore local draft" button to replace editor content
 * - "Dismiss" button to ignore and use server version
 * - Subtle animation on appearance
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CloudOff, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatSaveTime } from '@/services/piqWorkshop/storageService';

// =============================================================================
// TYPES
// =============================================================================

interface LocalRecoveryBannerProps {
  /** Whether to show the banner */
  isVisible: boolean;
  /** Timestamp when local draft was saved */
  localSavedAt: number;
  /** Word count of local draft */
  wordCount?: number;
  /** Callback when user clicks "Restore local draft" */
  onRestore: () => void;
  /** Callback when user dismisses the banner */
  onDismiss: () => void;
  /** Whether restore is in progress */
  isRestoring?: boolean;
  /** Optional additional className */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LocalRecoveryBanner({
  isVisible,
  localSavedAt,
  wordCount,
  onRestore,
  onDismiss,
  isRestoring = false,
  className,
}: LocalRecoveryBannerProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800',
        'rounded-lg p-3 mb-4',
        'animate-in fade-in slide-in-from-top-2 duration-300',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <CloudOff className="w-5 h-5 text-amber-600 dark:text-amber-500" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Unsynced local changes found
          </h4>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            We found a newer draft from this device saved {formatSaveTime(localSavedAt)}
            {wordCount !== undefined && ` (${wordCount} words)`}.
            Would you like to restore it?
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              variant="default"
              onClick={onRestore}
              disabled={isRestoring}
              className="h-7 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Restore local draft
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              disabled={isRestoring}
              className="h-7 text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200"
            >
              Dismiss
            </Button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onDismiss}
          disabled={isRestoring}
          className="flex-shrink-0 p-1 rounded-md text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// COMPACT VARIANT
// =============================================================================

interface CompactLocalRecoveryBannerProps {
  isVisible: boolean;
  onRestore: () => void;
  onDismiss: () => void;
  isRestoring?: boolean;
  className?: string;
}

/**
 * A more compact version of the recovery banner for tight spaces
 */
export function CompactLocalRecoveryBanner({
  isVisible,
  onRestore,
  onDismiss,
  isRestoring = false,
  className,
}: CompactLocalRecoveryBannerProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800',
        'rounded-md px-3 py-2',
        'flex items-center justify-between gap-2',
        'animate-in fade-in slide-in-from-top-2 duration-300',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
        <span className="text-xs text-amber-800 dark:text-amber-300">
          Newer local draft found
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onRestore}
          disabled={isRestoring}
          className="h-6 px-2 text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900"
        >
          {isRestoring ? 'Restoring...' : 'Restore'}
        </Button>
        <button
          onClick={onDismiss}
          disabled={isRestoring}
          className="p-1 rounded text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default LocalRecoveryBanner;


