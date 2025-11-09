/**
 * Essay Versioning & History System
 *
 * Comprehensive versioning system that:
 * - Auto-saves on analysis completion
 * - Tracks improvement over time
 * - Shows score deltas between versions
 * - Allows restoring previous versions
 * - Visualizes progress trends
 */

import type { AnalysisResult } from './backendTypes';
import type { ExtracurricularItem } from '../ExtracurricularCard';

// ============================================================================
// TYPES
// ============================================================================

export interface EssayVersion {
  id: string;
  activityId: string;
  timestamp: number; // Unix timestamp
  description: string;
  analysis: {
    nqi: number;
    label: string;
    categoryScores: Array<{
      name: string;
      score: number;
      maxScore: number;
    }>;
    flags: string[];
  };
  metadata: {
    wordCount: number;
    charCount: number;
    depth: 'quick' | 'standard' | 'comprehensive';
    engine: string;
  };
  note?: string; // User-added note about this version
}

export interface VersionHistorySummary {
  activityId: string;
  activityName: string;
  totalVersions: number;
  firstVersion: EssayVersion;
  latestVersion: EssayVersion;
  improvement: {
    nqiDelta: number;
    percentChange: number;
    direction: 'improved' | 'declined' | 'same';
  };
  timeline: Array<{
    timestamp: number;
    nqi: number;
    note?: string;
  }>;
}

export interface VersionComparison {
  from: EssayVersion;
  to: EssayVersion;
  timeDelta: number; // milliseconds
  improvements: {
    nqi: number;
    categories: Array<{
      name: string;
      delta: number;
      direction: 'up' | 'down' | 'same';
    }>;
  };
  textChanges: {
    added: number; // chars added
    removed: number; // chars removed
    netChange: number;
  };
}

// ============================================================================
// STORAGE KEY MANAGEMENT
// ============================================================================

const STORAGE_PREFIX = 'essay_versions';
const MAX_VERSIONS_PER_ACTIVITY = 20; // Keep last 20 versions

function getStorageKey(activityId: string): string {
  return `${STORAGE_PREFIX}:${activityId}`;
}

function getAllVersionKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

// ============================================================================
// VERSION MANAGEMENT
// ============================================================================

/**
 * Save a new version after analysis
 */
export function saveVersion(
  activity: ExtracurricularItem,
  description: string,
  analysis: AnalysisResult,
  metadata: {
    depth: 'quick' | 'standard' | 'comprehensive';
    engine: string;
  }
): EssayVersion {
  const version: EssayVersion = {
    id: `v${Date.now()}`,
    activityId: activity.id,
    timestamp: Date.now(),
    description,
    analysis: {
      nqi: analysis.analysis.narrative_quality_index,
      label: analysis.analysis.reader_impression_label,
      categoryScores: analysis.analysis.categories.map(cat => ({
        name: cat.category,
        score: cat.score,
        maxScore: cat.maxScore,
      })),
      flags: analysis.analysis.flags,
    },
    metadata: {
      wordCount: description.trim().split(/\s+/).filter(Boolean).length,
      charCount: description.length,
      depth: metadata.depth,
      engine: metadata.engine,
    },
  };

  // Get existing versions
  const versions = getVersions(activity.id);

  // Add new version
  versions.push(version);

  // Sort by timestamp (newest first)
  versions.sort((a, b) => b.timestamp - a.timestamp);

  // Keep only last MAX_VERSIONS_PER_ACTIVITY
  const trimmedVersions = versions.slice(0, MAX_VERSIONS_PER_ACTIVITY);

  // Save back to storage
  localStorage.setItem(getStorageKey(activity.id), JSON.stringify(trimmedVersions));

  console.log(`✅ Saved version ${version.id} for activity ${activity.id}`);
  console.log(`   NQI: ${version.analysis.nqi}/100`);
  console.log(`   Total versions: ${trimmedVersions.length}`);

  return version;
}

/**
 * Get all versions for an activity
 */
export function getVersions(activityId: string): EssayVersion[] {
  try {
    const key = getStorageKey(activityId);
    const data = localStorage.getItem(key);
    if (!data) return [];

    const versions = JSON.parse(data) as EssayVersion[];
    // Sort by timestamp (newest first)
    return versions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to load versions:', error);
    return [];
  }
}

/**
 * Get latest version for an activity
 */
export function getLatestVersion(activityId: string): EssayVersion | null {
  const versions = getVersions(activityId);
  return versions[0] || null;
}

/**
 * Get version by ID
 */
export function getVersionById(activityId: string, versionId: string): EssayVersion | null {
  const versions = getVersions(activityId);
  return versions.find(v => v.id === versionId) || null;
}

/**
 * Delete a specific version
 */
export function deleteVersion(activityId: string, versionId: string): boolean {
  try {
    const versions = getVersions(activityId);
    const filtered = versions.filter(v => v.id !== versionId);

    if (filtered.length === versions.length) {
      return false; // Version not found
    }

    localStorage.setItem(getStorageKey(activityId), JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete version:', error);
    return false;
  }
}

/**
 * Delete all versions for an activity
 */
export function deleteAllVersions(activityId: string): void {
  localStorage.removeItem(getStorageKey(activityId));
}

/**
 * Add a note to a version
 */
export function addVersionNote(activityId: string, versionId: string, note: string): boolean {
  try {
    const versions = getVersions(activityId);
    const version = versions.find(v => v.id === versionId);

    if (!version) return false;

    version.note = note;
    localStorage.setItem(getStorageKey(activityId), JSON.stringify(versions));
    return true;
  } catch (error) {
    console.error('Failed to add note:', error);
    return false;
  }
}

// ============================================================================
// VERSION ANALYSIS
// ============================================================================

/**
 * Get summary of version history for an activity
 */
export function getVersionHistorySummary(
  activity: ExtracurricularItem
): VersionHistorySummary | null {
  const versions = getVersions(activity.id);

  if (versions.length === 0) return null;

  const latest = versions[0];
  const first = versions[versions.length - 1];

  const nqiDelta = latest.analysis.nqi - first.analysis.nqi;
  const percentChange = first.analysis.nqi > 0
    ? ((nqiDelta / first.analysis.nqi) * 100)
    : 0;

  return {
    activityId: activity.id,
    activityName: activity.name,
    totalVersions: versions.length,
    firstVersion: first,
    latestVersion: latest,
    improvement: {
      nqiDelta,
      percentChange,
      direction: nqiDelta > 0 ? 'improved' : nqiDelta < 0 ? 'declined' : 'same',
    },
    timeline: versions.map(v => ({
      timestamp: v.timestamp,
      nqi: v.analysis.nqi,
      note: v.note,
    })).reverse(), // Oldest to newest for timeline
  };
}

/**
 * Compare two versions
 */
export function compareVersions(
  activityId: string,
  fromVersionId: string,
  toVersionId: string
): VersionComparison | null {
  const from = getVersionById(activityId, fromVersionId);
  const to = getVersionById(activityId, toVersionId);

  if (!from || !to) return null;

  const nqiDelta = to.analysis.nqi - from.analysis.nqi;

  // Compare category scores
  const categoryComparisons = to.analysis.categoryScores.map(toCat => {
    const fromCat = from.analysis.categoryScores.find(c => c.name === toCat.name);
    const delta = fromCat ? toCat.score - fromCat.score : 0;

    return {
      name: toCat.name,
      delta,
      direction: (delta > 0.1 ? 'up' : delta < -0.1 ? 'down' : 'same') as 'up' | 'down' | 'same',
    };
  });

  // Text changes
  const fromChars = from.description.length;
  const toChars = to.description.length;

  return {
    from,
    to,
    timeDelta: to.timestamp - from.timestamp,
    improvements: {
      nqi: nqiDelta,
      categories: categoryComparisons,
    },
    textChanges: {
      added: Math.max(0, toChars - fromChars),
      removed: Math.max(0, fromChars - toChars),
      netChange: toChars - fromChars,
    },
  };
}

/**
 * Get improvement trends (for visualization)
 */
export function getImprovementTrends(activityId: string): {
  timestamps: number[];
  nqiScores: number[];
  categoryTrends: Map<string, number[]>;
} {
  const versions = getVersions(activityId).reverse(); // Oldest to newest

  const timestamps = versions.map(v => v.timestamp);
  const nqiScores = versions.map(v => v.analysis.nqi);

  // Build category trends
  const categoryTrends = new Map<string, number[]>();

  if (versions.length > 0) {
    const categories = versions[0].analysis.categoryScores.map(c => c.name);

    for (const catName of categories) {
      const scores = versions.map(v => {
        const cat = v.analysis.categoryScores.find(c => c.name === catName);
        return cat ? cat.score : 0;
      });
      categoryTrends.set(catName, scores);
    }
  }

  return {
    timestamps,
    nqiScores,
    categoryTrends,
  };
}

// ============================================================================
// CACHING & SMART LOADING
// ============================================================================

/**
 * Check if we have a recent cached version (within last 5 minutes)
 */
export function hasRecentCache(activityId: string): boolean {
  const latest = getLatestVersion(activityId);
  if (!latest) return false;

  const fiveMinutes = 5 * 60 * 1000;
  return (Date.now() - latest.timestamp) < fiveMinutes;
}

/**
 * Get cached description if recent
 */
export function getCachedDescription(activityId: string): string | null {
  if (!hasRecentCache(activityId)) return null;

  const latest = getLatestVersion(activityId);
  return latest?.description || null;
}

/**
 * Clean up old versions across all activities (housekeeping)
 */
export function cleanupOldVersions(): void {
  const keys = getAllVersionKeys();
  let totalRemoved = 0;

  for (const key of keys) {
    try {
      const data = localStorage.getItem(key);
      if (!data) continue;

      const versions = JSON.parse(data) as EssayVersion[];

      // Keep only versions from last 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const filtered = versions.filter(v => v.timestamp > thirtyDaysAgo);

      if (filtered.length < versions.length) {
        totalRemoved += versions.length - filtered.length;
        if (filtered.length > 0) {
          localStorage.setItem(key, JSON.stringify(filtered));
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error(`Failed to clean up ${key}:`, error);
    }
  }

  if (totalRemoved > 0) {
    console.log(`🧹 Cleaned up ${totalRemoved} old versions`);
  }
}

// ============================================================================
// EXPORT/IMPORT
// ============================================================================

/**
 * Export version history for backup
 */
export function exportVersionHistory(activityId: string): string {
  const versions = getVersions(activityId);
  return JSON.stringify(versions, null, 2);
}

/**
 * Import version history from backup
 */
export function importVersionHistory(activityId: string, jsonData: string): boolean {
  try {
    const versions = JSON.parse(jsonData) as EssayVersion[];

    // Validate structure
    if (!Array.isArray(versions)) {
      throw new Error('Invalid format: not an array');
    }

    for (const v of versions) {
      if (!v.id || !v.timestamp || !v.description || !v.analysis) {
        throw new Error('Invalid version structure');
      }
    }

    // Merge with existing versions
    const existing = getVersions(activityId);
    const merged = [...existing, ...versions];

    // Remove duplicates by ID
    const uniqueMap = new Map<string, EssayVersion>();
    for (const v of merged) {
      uniqueMap.set(v.id, v);
    }

    const unique = Array.from(uniqueMap.values());
    unique.sort((a, b) => b.timestamp - a.timestamp);

    // Save
    localStorage.setItem(getStorageKey(activityId), JSON.stringify(unique));

    return true;
  } catch (error) {
    console.error('Failed to import version history:', error);
    return false;
  }
}
