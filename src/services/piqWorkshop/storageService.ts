/**
 * PIQ Workshop Storage Service
 *
 * Handles local storage caching, auto-save, and version management
 * 
 * Version 2 additions:
 * - Dual key support: essay:{essayId}:draft (new) + piq_workshop_{promptId} (legacy)
 * - Local recovery detection
 * - Server timestamp comparison
 */

import type { AnalysisResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';

// =============================================================================
// TYPES
// =============================================================================

export interface DraftVersion {
  id: string;
  text: string;
  timestamp: number;
  score: number;
  wordCount: number;
  savedToCloud: boolean;
  analysisSnapshot?: AnalysisResult;
}

export interface PIQWorkshopCache {
  promptId: string;
  promptTitle: string;
  currentDraft: string;
  lastSaved: number;
  analysisResult: AnalysisResult | null;
  versions: DraftVersion[];
  autoSaveEnabled: boolean;
}

/** New format for local draft storage */
export interface LocalDraft {
  essayId: string | null;
  promptId: string;
  content: string;
  savedAt: number; // Unix timestamp
  lastServerTimestamp?: string; // ISO string for comparison
  wordCount: number;
}

/** Result of checking for local recovery */
export interface LocalRecoveryResult {
  hasRecovery: boolean;
  localDraft?: LocalDraft;
  isNewerThanServer: boolean;
  timeDifferenceMs?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_PREFIX = 'piq_workshop_';
const DRAFT_PREFIX = 'essay:';
const DRAFT_SUFFIX = ':draft';
const AUTO_SAVE_KEY = 'piq_autosave';
const MAX_LOCAL_VERSIONS = 10;
// Cache version - increment to invalidate old caches (Phase 19 teaching fix in v3)
const ANALYSIS_CACHE_VERSION = 'v3';
// Minimum time difference to consider local draft as "newer" (30 seconds)
const RECOVERY_THRESHOLD_MS = 30 * 1000;

// =============================================================================
// KEY GENERATORS
// =============================================================================

/**
 * Generate cache key for a specific prompt (legacy format)
 */
function getLegacyCacheKey(promptId: string): string {
  return `${STORAGE_PREFIX}${promptId}`;
}

/**
 * Generate draft key for a specific essay (new format)
 * Format: essay:{essayId}:draft
 */
function getDraftKey(essayId: string): string {
  return `${DRAFT_PREFIX}${essayId}${DRAFT_SUFFIX}`;
}

/**
 * Generate hash for analysis caching
 */
export function generateAnalysisCacheKey(essayText: string, promptId: string): string {
  const normalized = essayText.trim().toLowerCase();
  const combined = normalized + promptId;
  let hash = 0;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Include version in cache key to invalidate old caches
  return `analysis_${ANALYSIS_CACHE_VERSION}_${Math.abs(hash).toString(36)}`;
}

// =============================================================================
// NEW LOCAL DRAFT FUNCTIONS (v2)
// =============================================================================

/**
 * Save a local draft to localStorage
 * Saves to both new (essay:{essayId}:draft) and legacy (piq_workshop_{promptId}) formats
 */
export function saveLocalDraft(
  essayId: string | null,
  promptId: string,
  content: string,
  lastServerTimestamp?: string
): void {
  try {
    const now = Date.now();
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    const localDraft: LocalDraft = {
      essayId,
      promptId,
      content,
      savedAt: now,
      lastServerTimestamp,
      wordCount,
    };

    // Save to new format if we have an essay ID
    if (essayId) {
      const newKey = getDraftKey(essayId);
      localStorage.setItem(newKey, JSON.stringify(localDraft));
    }

    // Also save to legacy format for backward compatibility
    const legacyKey = getLegacyCacheKey(promptId);
    const existingLegacy = localStorage.getItem(legacyKey);
    let legacyCache: PIQWorkshopCache;

    if (existingLegacy) {
      legacyCache = JSON.parse(existingLegacy);
      legacyCache.currentDraft = content;
      legacyCache.lastSaved = now;
    } else {
      legacyCache = {
        promptId,
        promptTitle: '',
        currentDraft: content,
        lastSaved: now,
        analysisResult: null,
        versions: [],
        autoSaveEnabled: true,
      };
    }

    localStorage.setItem(legacyKey, JSON.stringify(legacyCache));
    localStorage.setItem(AUTO_SAVE_KEY, legacyKey);

  } catch (error) {
  }
}

/**
 * Get a local draft by essay ID (new format)
 */
export function getLocalDraftByEssayId(essayId: string): LocalDraft | null {
  try {
    const key = getDraftKey(essayId);
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as LocalDraft;
  } catch (error) {
    return null;
  }
}

/**
 * Get a local draft by prompt ID (legacy format, extracts from PIQWorkshopCache)
 */
export function getLocalDraftByPromptId(promptId: string): LocalDraft | null {
  try {
    const key = getLegacyCacheKey(promptId);
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    const cache = JSON.parse(data) as PIQWorkshopCache;
    if (!cache.currentDraft) return null;

    return {
      essayId: null,
      promptId: cache.promptId,
      content: cache.currentDraft,
      savedAt: cache.lastSaved,
      wordCount: cache.currentDraft.trim().split(/\s+/).filter(Boolean).length,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if there's a local draft that should be recovered
 * Compares local draft timestamp with server timestamp
 * 
 * @param essayId - The essay ID to check
 * @param promptId - The prompt ID to check (fallback)
 * @param serverTimestamp - The server's last updated timestamp (ISO string)
 */
export function checkLocalRecovery(
  essayId: string | null,
  promptId: string,
  serverTimestamp?: string
): LocalRecoveryResult {
  try {
    // Try new format first if we have an essay ID
    let localDraft: LocalDraft | null = null;
    
    if (essayId) {
      localDraft = getLocalDraftByEssayId(essayId);
    }
    
    // Fall back to legacy format
    if (!localDraft) {
      localDraft = getLocalDraftByPromptId(promptId);
    }

    if (!localDraft || !localDraft.content) {
      return { hasRecovery: false, isNewerThanServer: false };
    }

    // If no server timestamp provided, assume local is newer
    if (!serverTimestamp) {
      return {
        hasRecovery: true,
        localDraft,
        isNewerThanServer: true,
      };
    }

    // Compare timestamps
    const serverTime = new Date(serverTimestamp).getTime();
    const localTime = localDraft.savedAt;
    const timeDiff = localTime - serverTime;

    // Local is considered newer if it's at least RECOVERY_THRESHOLD_MS ahead
    const isNewer = timeDiff > RECOVERY_THRESHOLD_MS;

    return {
      hasRecovery: isNewer,
      localDraft: isNewer ? localDraft : undefined,
      isNewerThanServer: isNewer,
      timeDifferenceMs: timeDiff,
    };

  } catch (error) {
    return { hasRecovery: false, isNewerThanServer: false };
  }
}

/**
 * Clear local draft after successful sync
 */
export function clearLocalDraft(essayId: string): void {
  try {
    const key = getDraftKey(essayId);
    localStorage.removeItem(key);
  } catch (error) {
  }
}

/**
 * Clear both old and new format drafts for a prompt
 */
export function clearAllLocalDrafts(essayId: string | null, promptId: string): void {
  try {
    if (essayId) {
      clearLocalDraft(essayId);
    }
    clearCache(promptId);
  } catch (error) {
  }
}

// =============================================================================
// LEGACY FUNCTIONS (maintained for backward compatibility)
// =============================================================================

/**
 * Save current state to localStorage (auto-save)
 * @deprecated Use saveLocalDraft instead for new code
 */
export function saveToLocalStorage(cache: PIQWorkshopCache): void {
  try {
    const key = getLegacyCacheKey(cache.promptId);

    // Limit versions in localStorage to MAX_LOCAL_VERSIONS
    const limitedVersions = cache.versions.slice(-MAX_LOCAL_VERSIONS);

    const dataToSave = {
      ...cache,
      versions: limitedVersions,
      lastSaved: Date.now()
    };

    localStorage.setItem(key, JSON.stringify(dataToSave));
    localStorage.setItem(AUTO_SAVE_KEY, key); // Track last auto-save location

  } catch (error) {
  }
}

/**
 * Load cached state from localStorage
 */
export function loadFromLocalStorage(promptId: string): PIQWorkshopCache | null {
  try {
    const key = getLegacyCacheKey(promptId);
    const data = localStorage.getItem(key);

    if (!data) return null;

    const cache = JSON.parse(data) as PIQWorkshopCache;

    return cache;
  } catch (error) {
    return null;
  }
}

/**
 * Check if there's a recent auto-save (within last 24 hours)
 */
export function hasRecentAutoSave(): { hasAutoSave: boolean; promptId?: string; lastSaved?: number } {
  try {
    const lastSaveKey = localStorage.getItem(AUTO_SAVE_KEY);
    if (!lastSaveKey) return { hasAutoSave: false };

    const data = localStorage.getItem(lastSaveKey);
    if (!data) return { hasAutoSave: false };

    const cache = JSON.parse(data) as PIQWorkshopCache;
    const hoursSinceLastSave = (Date.now() - cache.lastSaved) / (1000 * 60 * 60);

    if (hoursSinceLastSave < 24) {
      return {
        hasAutoSave: true,
        promptId: cache.promptId,
        lastSaved: cache.lastSaved
      };
    }

    return { hasAutoSave: false };
  } catch (error) {
    return { hasAutoSave: false };
  }
}

/**
 * Clear cache for a specific prompt
 */
export function clearCache(promptId: string): void {
  try {
    const key = getLegacyCacheKey(promptId);
    localStorage.removeItem(key);
  } catch (error) {
  }
}

// =============================================================================
// ANALYSIS CACHING
// =============================================================================

/**
 * Cache analysis result
 */
export function cacheAnalysisResult(
  essayText: string,
  promptId: string,
  result: AnalysisResult
): void {
  try {
    const cacheKey = generateAnalysisCacheKey(essayText, promptId);
    const cacheData = {
      result,
      timestamp: Date.now(),
      essayText, // Store for validation
      promptId
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
  }
}

/**
 * Get cached analysis result if it exists and is valid
 */
export function getCachedAnalysisResult(
  essayText: string,
  promptId: string
): AnalysisResult | null {
  try {
    const cacheKey = generateAnalysisCacheKey(essayText, promptId);
    const data = localStorage.getItem(cacheKey);

    if (!data) return null;

    const cached = JSON.parse(data);

    // Validate cache is for same text (in case of hash collision)
    if (cached.essayText.trim() === essayText.trim() && cached.promptId === promptId) {
      const ageInHours = (Date.now() - cached.timestamp) / (1000 * 60 * 60);

      // Cache valid for 7 days
      if (ageInHours < 24 * 7) {
        // Safety check: invalidate cache if workshopItems exist but no teaching data
        // This ensures Phase 19 data is present
        const workshopItems = cached.result?.workshopItems;
        if (workshopItems?.length > 0 && !workshopItems[0]?.teaching) {
          localStorage.removeItem(cacheKey);
          return null;
        }
        
        return cached.result;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

// =============================================================================
// VERSION SNAPSHOT UTILITIES
// =============================================================================

/**
 * Create a new version snapshot
 */
export function createVersionSnapshot(
  text: string,
  score: number,
  analysisResult?: AnalysisResult
): DraftVersion {
  return {
    id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    timestamp: Date.now(),
    score,
    wordCount: text.trim().split(/\s+/).length,
    savedToCloud: false,
    analysisSnapshot: analysisResult
  };
}

/**
 * Format timestamp for display
 */
export function formatSaveTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInMinutes < 24 * 60) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // Show date and time for older saves
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
