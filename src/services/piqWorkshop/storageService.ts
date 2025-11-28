/**
 * PIQ Workshop Storage Service
 *
 * Handles local storage caching, auto-save, and version management
 */

import type { AnalysisResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';

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

const STORAGE_PREFIX = 'piq_workshop_';
const AUTO_SAVE_KEY = 'piq_autosave';
const MAX_LOCAL_VERSIONS = 10;
// Cache version - increment to invalidate old caches (Phase 19 teaching fix in v3)
const ANALYSIS_CACHE_VERSION = 'v3';

/**
 * Generate cache key for a specific prompt
 */
function getCacheKey(promptId: string): string {
  return `${STORAGE_PREFIX}${promptId}`;
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

/**
 * Save current state to localStorage (auto-save)
 */
export function saveToLocalStorage(cache: PIQWorkshopCache): void {
  try {
    const key = getCacheKey(cache.promptId);

    // Limit versions in localStorage to MAX_LOCAL_VERSIONS
    const limitedVersions = cache.versions.slice(-MAX_LOCAL_VERSIONS);

    const dataToSave = {
      ...cache,
      versions: limitedVersions,
      lastSaved: Date.now()
    };

    localStorage.setItem(key, JSON.stringify(dataToSave));
    localStorage.setItem(AUTO_SAVE_KEY, key); // Track last auto-save location

    console.log(`✅ Auto-saved to localStorage: ${key}`);
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * Load cached state from localStorage
 */
export function loadFromLocalStorage(promptId: string): PIQWorkshopCache | null {
  try {
    const key = getCacheKey(promptId);
    const data = localStorage.getItem(key);

    if (!data) return null;

    const cache = JSON.parse(data) as PIQWorkshopCache;
    console.log(`✅ Loaded from localStorage: ${key}`);

    return cache;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
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
    console.error('Error checking auto-save:', error);
    return { hasAutoSave: false };
  }
}

/**
 * Clear cache for a specific prompt
 */
export function clearCache(promptId: string): void {
  try {
    const key = getCacheKey(promptId);
    localStorage.removeItem(key);
    console.log(`✅ Cleared cache: ${key}`);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

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
    console.log(`✅ Cached analysis result: ${cacheKey}`);
  } catch (error) {
    console.error('Failed to cache analysis:', error);
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
          console.log(`⚠️ Cache invalidated: missing teaching data (pre-Phase19 cache)`);
          localStorage.removeItem(cacheKey);
          return null;
        }
        
        console.log(`✅ Using cached analysis (${ageInHours.toFixed(1)} hours old)`);
        return cached.result;
      }
    }

    return null;
  } catch (error) {
    console.error('Error retrieving cached analysis:', error);
    return null;
  }
}

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
