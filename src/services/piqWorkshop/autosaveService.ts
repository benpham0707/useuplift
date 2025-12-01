/**
 * PIQ Workshop Autosave Service
 *
 * Handles automatic saving of essay content with:
 * - 5-second debounce after last keystroke
 * - Immediate save on blur
 * - Immediate save on navigation attempt
 * - Status tracking: idle, editing, saving, saved, offline, error
 * - Retry logic for failed saves (every 30 seconds while offline)
 * - Local backup for offline resilience
 */

import { saveAutosaveVersion, saveOrUpdatePIQEssay } from './piqDatabaseService';
import { saveLocalDraft, clearAllLocalDrafts } from './storageService';

// =============================================================================
// TYPES
// =============================================================================

/** Autosave status states */
export type AutosaveStatus = 
  | 'idle'      // No changes, nothing to save
  | 'editing'   // Changes detected, debounce timer running
  | 'saving'    // Save request in progress
  | 'saved'     // Save completed successfully
  | 'offline'   // Network unavailable, saved locally
  | 'error';    // Save failed

/** Autosave state for external consumption */
export interface AutosaveState {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  lastError: string | null;
  hasUnsavedChanges: boolean;
}

/** Callback for status updates */
export type AutosaveStatusCallback = (state: AutosaveState) => void;

/** Configuration options */
export interface AutosaveConfig {
  /** Debounce delay in milliseconds (default: 5000) */
  debounceMs?: number;
  /** Retry interval in milliseconds when offline (default: 30000) */
  retryIntervalMs?: number;
  /** Maximum retry attempts (default: 10) */
  maxRetryAttempts?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_DEBOUNCE_MS = 5000; // 5 seconds
const DEFAULT_RETRY_INTERVAL_MS = 30000; // 30 seconds
const DEFAULT_MAX_RETRY_ATTEMPTS = 10;

// =============================================================================
// AUTOSAVE MANAGER CLASS
// =============================================================================

/**
 * AutosaveManager handles all autosave logic for a single essay
 * 
 * Usage:
 * ```typescript
 * const manager = new AutosaveManager({
 *   essayId: 'abc-123',
 *   userId: 'user-456',
 *   getToken: () => clerk.getToken({ template: 'supabase' }),
 *   promptText: 'Describe a time...',
 *   promptId: 'piq1',
 *   onStatusChange: (state) => setAutosaveState(state),
 * });
 * 
 * // Call on every content change
 * manager.onContentChange(newContent);
 * 
 * // Call when editor loses focus
 * manager.onBlur();
 * 
 * // Call before navigation
 * await manager.onNavigate();
 * 
 * // Cleanup when unmounting
 * manager.destroy();
 * ```
 */
export class AutosaveManager {
  // Configuration
  private essayId: string | null;
  private userId: string;
  private getToken: () => Promise<string | null>;
  private promptText: string;
  private promptId: string;
  private onStatusChange: AutosaveStatusCallback;
  private config: Required<AutosaveConfig>;

  // State
  private currentContent: string = '';
  private lastSavedContent: string = '';
  private status: AutosaveStatus = 'idle';
  private lastSavedAt: Date | null = null;
  private lastError: string | null = null;
  private hasUnsavedChanges: boolean = false;

  // Timers
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setInterval> | null = null;
  private retryAttempts: number = 0;

  // Flags
  private isDestroyed: boolean = false;
  private isSaving: boolean = false;

  constructor(params: {
    essayId: string | null;
    userId: string;
    getToken: () => Promise<string | null>;
    promptText: string;
    promptId: string;
    onStatusChange: AutosaveStatusCallback;
    initialContent?: string;
    config?: AutosaveConfig;
  }) {
    this.essayId = params.essayId;
    this.userId = params.userId;
    this.getToken = params.getToken;
    this.promptText = params.promptText;
    this.promptId = params.promptId;
    this.onStatusChange = params.onStatusChange;
    this.currentContent = params.initialContent || '';
    this.lastSavedContent = params.initialContent || '';
    
    this.config = {
      debounceMs: params.config?.debounceMs ?? DEFAULT_DEBOUNCE_MS,
      retryIntervalMs: params.config?.retryIntervalMs ?? DEFAULT_RETRY_INTERVAL_MS,
      maxRetryAttempts: params.config?.maxRetryAttempts ?? DEFAULT_MAX_RETRY_ATTEMPTS,
    };

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Call this whenever the essay content changes
   */
  onContentChange(content: string): void {
    if (this.isDestroyed) return;

    this.currentContent = content;
    this.hasUnsavedChanges = content !== this.lastSavedContent;

    if (this.hasUnsavedChanges) {
      this.updateStatus('editing');
      this.startDebounceTimer();
      
      // Always save to local storage immediately
      this.saveToLocal();
    }
  }

  /**
   * Call when the editor loses focus (blur event)
   * Triggers immediate save if there are unsaved changes
   */
  async onBlur(): Promise<void> {
    if (this.isDestroyed || !this.hasUnsavedChanges) return;

    this.cancelDebounceTimer();
    await this.performSave();
  }

  /**
   * Call before navigation attempts
   * Returns true if it's safe to navigate, false if save failed
   */
  async onNavigate(): Promise<boolean> {
    if (this.isDestroyed || !this.hasUnsavedChanges) return true;

    this.cancelDebounceTimer();
    const success = await this.performSave();
    return success;
  }

  /**
   * Force an immediate save
   */
  async forceSave(): Promise<boolean> {
    if (this.isDestroyed) return false;

    this.cancelDebounceTimer();
    return await this.performSave();
  }

  /**
   * Update the essay ID (e.g., after first save creates the essay)
   */
  setEssayId(essayId: string): void {
    this.essayId = essayId;
  }

  /**
   * Get current autosave state
   */
  getState(): AutosaveState {
    return {
      status: this.status,
      lastSavedAt: this.lastSavedAt,
      lastError: this.lastError,
      hasUnsavedChanges: this.hasUnsavedChanges,
    };
  }

  /**
   * Clean up timers and event listeners
   */
  destroy(): void {
    this.isDestroyed = true;
    this.cancelDebounceTimer();
    this.cancelRetryTimer();

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private updateStatus(status: AutosaveStatus, error?: string): void {
    this.status = status;
    if (error) {
      this.lastError = error;
    }
    
    this.onStatusChange({
      status: this.status,
      lastSavedAt: this.lastSavedAt,
      lastError: this.lastError,
      hasUnsavedChanges: this.hasUnsavedChanges,
    });
  }

  private startDebounceTimer(): void {
    this.cancelDebounceTimer();
    
    this.debounceTimer = setTimeout(async () => {
      if (!this.isDestroyed && this.hasUnsavedChanges) {
        await this.performSave();
      }
    }, this.config.debounceMs);
  }

  private cancelDebounceTimer(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private startRetryTimer(): void {
    this.cancelRetryTimer();
    
    this.retryTimer = setInterval(async () => {
      if (this.isDestroyed) {
        this.cancelRetryTimer();
        return;
      }

      if (this.hasUnsavedChanges && !this.isSaving) {
        this.retryAttempts++;
        
        if (this.retryAttempts > this.config.maxRetryAttempts) {
          this.cancelRetryTimer();
          this.updateStatus('error', 'Max retry attempts reached');
          return;
        }

        await this.performSave();
      }
    }, this.config.retryIntervalMs);
  }

  private cancelRetryTimer(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
    this.retryAttempts = 0;
  }

  private async performSave(): Promise<boolean> {
    if (this.isSaving || !this.hasUnsavedChanges) {
      return true;
    }

    // Check if we're online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateStatus('offline');
      this.startRetryTimer();
      return false;
    }

    this.isSaving = true;
    this.updateStatus('saving');

    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const contentToSave = this.currentContent;

      // If no essay ID yet, create the essay first
      if (!this.essayId) {
        const essayResult = await saveOrUpdatePIQEssay(
          token,
          this.userId,
          this.promptId,
          this.promptText,
          contentToSave
        );

        if (!essayResult.success) {
          throw new Error(essayResult.error || 'Failed to create essay');
        }

        this.essayId = essayResult.essayId!;
      }

      // Save autosave version
      const versionResult = await saveAutosaveVersion(
        token,
        this.userId,
        this.essayId,
        contentToSave
      );

      if (!versionResult.success) {
        throw new Error(versionResult.error || 'Failed to save version');
      }

      // Also update the essay's draft_current
      await saveOrUpdatePIQEssay(
        token,
        this.userId,
        this.promptId,
        this.promptText,
        contentToSave
      );

      // Success!
      this.lastSavedContent = contentToSave;
      this.hasUnsavedChanges = this.currentContent !== contentToSave;
      this.lastSavedAt = new Date();
      this.lastError = null;
      
      // Clear local backup after successful save (both new and legacy formats)
      clearAllLocalDrafts(this.essayId, this.promptId);
      
      this.cancelRetryTimer();
      this.updateStatus('saved');

      return true;

    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Save to local as backup
      this.saveToLocal();
      
      // Check if it's a network error
      if (
        errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('Failed to fetch')
      ) {
        this.updateStatus('offline', errorMessage);
        this.startRetryTimer();
      } else {
        this.updateStatus('error', errorMessage);
        this.startRetryTimer();
      }

      return false;

    } finally {
      this.isSaving = false;
    }
  }

  private saveToLocal(): void {
    try {
      saveLocalDraft(
        this.essayId,
        this.promptId,
        this.currentContent,
        this.lastSavedAt?.toISOString()
      );
    } catch (error) {
    }
  }

  private handleOnline = (): void => {
    if (this.hasUnsavedChanges && !this.isSaving) {
      this.performSave();
    }
  };

  private handleOffline = (): void => {
    if (this.hasUnsavedChanges) {
      this.updateStatus('offline');
      this.saveToLocal();
    }
  };
}

// =============================================================================
// HOOK UTILITIES
// =============================================================================

/**
 * Format the last saved time for display
 */
export function formatLastSaved(date: Date | null): string {
  if (!date) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 5) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Get display text for autosave status
 */
export function getStatusDisplayText(state: AutosaveState): string {
  switch (state.status) {
    case 'idle':
      return state.lastSavedAt 
        ? `All changes saved · ${formatLastSaved(state.lastSavedAt)}`
        : 'No changes';
    case 'editing':
      return 'Editing...';
    case 'saving':
      return 'Saving...';
    case 'saved':
      return `All changes saved · ${formatLastSaved(state.lastSavedAt)}`;
    case 'offline':
      return 'Offline – changes saved locally';
    case 'error':
      return 'Autosave failed – retrying...';
    default:
      return '';
  }
}

