/**
 * Achievement Retrieval — Smart Matching & Calibration Context Assembly
 *
 * Enhanced matching that goes beyond keyword search to find the most relevant
 * calibration entries from the Achievement Intelligence Database.
 *
 * 3-stage matching:
 * 1. Category match — keyword matching with confidence scoring
 * 2. Subcategory classification — narrow to subcategory using evidence signals
 * 3. Achievement-level matching — select entries at right tier level
 *
 * Cost: $0.00 (pure TypeScript logic)
 * Latency: <1ms (pre-built index maps)
 */

import type { ExtractedEvidence, TierClassification, InternalTier } from './types';
import type {
  CalibrationContext,
  AchievementEntry,
  SubcategoryProfile,
} from './nuanceCalibrationTypes';
import {
  ACHIEVEMENT_DATABASE,
  getCategoryKeywordIndex,
  getSubcategoryKeywordIndex,
  getAchievementCategory,
  getSubcategoryProfile,
  getEntriesForTier,
} from './achievementIntelligence';

// ============================================================================
// STAGE 1: CATEGORY MATCHING
// ============================================================================

interface CategoryMatchResult {
  category: string;
  confidence: 'high' | 'medium' | 'low';
  matchScore: number;
}

/**
 * Match an activity to its best category using keyword overlap + evidence signals.
 *
 * Uses both the activity's text (title, description, role) and extracted evidence
 * (categoryMatch from feature extraction) for redundant matching.
 */
function matchCategory(
  evidence: ExtractedEvidence,
  activityMeta: { title: string; type?: string; description?: string }
): CategoryMatchResult {
  // If feature extractor already identified the category with high confidence, trust it
  if (evidence.categoryMatch.confidence === 'high' && ACHIEVEMENT_DATABASE[evidence.categoryMatch.category]) {
    return {
      category: evidence.categoryMatch.category,
      confidence: 'high',
      matchScore: 1.0,
    };
  }

  // Build text to search against
  const searchText = [
    activityMeta.title,
    activityMeta.type,
    activityMeta.description,
    evidence.role.title,
    ...evidence.recognitions.map(r => r.name),
    ...evidence.impact.tangibleOutcomes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Score each category by keyword overlap
  const categoryKeywordIndex = getCategoryKeywordIndex();
  const categoryScores: Record<string, number> = {};

  // Tokenize search text into words for matching
  const searchWords = searchText.split(/\s+/).filter(w => w.length > 2);

  for (const word of searchWords) {
    // Exact keyword match
    const matches = categoryKeywordIndex.get(word);
    if (matches) {
      for (const cat of matches) {
        categoryScores[cat] = (categoryScores[cat] ?? 0) + 1;
      }
    }
  }

  // Also try multi-word phrase matching (2-word phrases)
  for (let i = 0; i < searchWords.length - 1; i++) {
    const phrase = `${searchWords[i]} ${searchWords[i + 1]}`;
    const matches = categoryKeywordIndex.get(phrase);
    if (matches) {
      for (const cat of matches) {
        categoryScores[cat] = (categoryScores[cat] ?? 0) + 2; // Phrases worth more
      }
    }
  }

  // Boost the feature extractor's category if it matched at all
  if (evidence.categoryMatch.category && categoryScores[evidence.categoryMatch.category] !== undefined) {
    categoryScores[evidence.categoryMatch.category] += 3;
  } else if (evidence.categoryMatch.category && ACHIEVEMENT_DATABASE[evidence.categoryMatch.category]) {
    // Even if no keyword match, feature extractor category gets a base score
    categoryScores[evidence.categoryMatch.category] = (categoryScores[evidence.categoryMatch.category] ?? 0) + 2;
  }

  // Find best match
  const sorted = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    // Fallback to feature extractor's category even if low confidence
    if (evidence.categoryMatch.category && ACHIEVEMENT_DATABASE[evidence.categoryMatch.category]) {
      return {
        category: evidence.categoryMatch.category,
        confidence: 'low',
        matchScore: 0.2,
      };
    }
    return { category: '', confidence: 'low', matchScore: 0 };
  }

  const [bestCategory, bestScore] = sorted[0];
  const secondScore = sorted.length > 1 ? sorted[1][1] : 0;

  // Determine confidence based on score and gap to second
  let confidence: 'high' | 'medium' | 'low';
  if (bestScore >= 4 && bestScore > secondScore * 1.5) {
    confidence = 'high';
  } else if (bestScore >= 2) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    category: bestCategory,
    confidence,
    matchScore: Math.min(bestScore / 6, 1), // Normalize to 0-1
  };
}

// ============================================================================
// STAGE 2: SUBCATEGORY CLASSIFICATION
// ============================================================================

/**
 * Classify the activity's subcategory within the matched category.
 *
 * Uses evidence signals (scope, recognitions, role type) and keyword matching
 * to narrow to the most relevant subcategory.
 */
function classifySubcategory(
  categoryKey: string,
  evidence: ExtractedEvidence,
  activityMeta: { title: string; type?: string; description?: string }
): SubcategoryProfile | null {
  const category = getAchievementCategory(categoryKey);
  if (!category || category.subcategories.length === 0) return null;

  const searchText = [
    activityMeta.title,
    activityMeta.type,
    activityMeta.description,
    evidence.role.title,
    ...evidence.recognitions.map(r => r.name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const subcategoryKeywordIndex = getSubcategoryKeywordIndex();

  // Score each subcategory
  const scores: Array<{ subcategory: SubcategoryProfile; score: number }> = [];

  for (const sub of category.subcategories) {
    let score = 0;

    // Keyword match from index
    for (const keyword of sub.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += keyword.includes(' ') ? 3 : 1; // Multi-word matches worth more
      }
    }

    // Title exact match bonus
    const titleLower = activityMeta.title.toLowerCase();
    for (const keyword of sub.keywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }

    scores.push({ subcategory: sub, score });
  }

  // Sort by score
  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0 || scores[0].score === 0) {
    // Return the first subcategory as default (usually the most general)
    return category.subcategories[0] ?? null;
  }

  return scores[0].subcategory;
}

// ============================================================================
// STAGE 3: ACHIEVEMENT-LEVEL MATCHING
// ============================================================================

/**
 * Select 3-5 calibration entries at the right achievement level.
 *
 * Strategy: Get entries from the same tier, plus 1 from above and 1 from below
 * to give Sonnet context about what "up" and "down" looks like.
 */
function selectCalibrationEntries(
  categoryKey: string,
  subcategoryKey: string | null,
  tier: TierClassification
): AchievementEntry[] {
  const entries: AchievementEntry[] = [];
  const internalTier = tier.internalTier;

  // Get entries at the same tier
  const sameTierEntries = getEntriesForTier(categoryKey, internalTier);
  const subcategoryMatches = subcategoryKey
    ? sameTierEntries.filter(e => e.subcategory === subcategoryKey)
    : sameTierEntries;

  // Prefer subcategory matches, fall back to any entries at this tier
  const primaryEntries = subcategoryMatches.length > 0 ? subcategoryMatches : sameTierEntries;
  entries.push(...primaryEntries.slice(0, 3));

  // Get 1 entry from tier above (if exists)
  if (internalTier > 1) {
    const aboveTier = (internalTier - 1) as InternalTier;
    const aboveEntries = getEntriesForTier(categoryKey, aboveTier);
    const aboveSubcat = subcategoryKey
      ? aboveEntries.filter(e => e.subcategory === subcategoryKey)
      : aboveEntries;
    const aboveEntry = aboveSubcat.length > 0 ? aboveSubcat[0] : aboveEntries[0];
    if (aboveEntry) entries.push(aboveEntry);
  }

  // Get 1 entry from tier below (if exists)
  if (internalTier < 6) {
    const belowTier = (internalTier + 1) as InternalTier;
    const belowEntries = getEntriesForTier(categoryKey, belowTier);
    const belowSubcat = subcategoryKey
      ? belowEntries.filter(e => e.subcategory === subcategoryKey)
      : belowEntries;
    const belowEntry = belowSubcat.length > 0 ? belowSubcat[0] : belowEntries[0];
    if (belowEntry) entries.push(belowEntry);
  }

  // Cap at 5 entries
  return entries.slice(0, 5);
}

/**
 * Extract selectivity context from calibration entries.
 */
function extractSelectivityContext(entries: AchievementEntry[]): string | null {
  const withSelectivity = entries.filter(e => e.selectivityRatio);
  if (withSelectivity.length === 0) return null;

  return withSelectivity
    .map(e => `${e.activity}: ${e.selectivityRatio}`)
    .join('; ');
}

// ============================================================================
// MAIN PUBLIC FUNCTION
// ============================================================================

/**
 * Assemble complete calibration context for an activity.
 *
 * Takes extracted evidence + tier classification + activity metadata,
 * returns everything Sonnet needs for nuanced score adjustment.
 *
 * Pure TypeScript, no LLM calls, O(1) lookup via pre-built index maps.
 */
export function getCalibrationContext(
  evidence: ExtractedEvidence,
  tier: TierClassification,
  activityMeta: { title: string; type?: string; description?: string }
): CalibrationContext {
  // Stage 1: Match category
  const categoryMatch = matchCategory(evidence, activityMeta);

  // If no category matched, return empty context (graceful degradation)
  if (!categoryMatch.category || categoryMatch.confidence === 'low' && categoryMatch.matchScore < 0.1) {
    return {
      categoryMatch: {
        category: categoryMatch.category || 'unknown',
        subcategory: 'unknown',
        confidence: 'low',
      },
      calibrationEntries: [],
      achievementLadder: [],
      roleHierarchy: [],
      subcategoryPrestige: null,
      selectivityContext: null,
    };
  }

  // Stage 2: Classify subcategory
  const subcategory = classifySubcategory(categoryMatch.category, evidence, activityMeta);

  // Stage 3: Select calibration entries
  const calibrationEntries = selectCalibrationEntries(
    categoryMatch.category,
    subcategory?.key ?? null,
    tier
  );

  // Assemble full context
  const category = getAchievementCategory(categoryMatch.category);

  return {
    categoryMatch: {
      category: categoryMatch.category,
      subcategory: subcategory?.key ?? 'unknown',
      confidence: categoryMatch.confidence,
    },
    calibrationEntries,
    achievementLadder: category?.achievementLadder ?? [],
    roleHierarchy: category?.roleHierarchy ?? [],
    subcategoryPrestige: subcategory ?? null,
    selectivityContext: extractSelectivityContext(calibrationEntries),
  };
}

// ============================================================================
// SERVICE CLASS (singleton pattern per codebase convention)
// ============================================================================

export class AchievementRetrievalService {
  getCalibrationContext(
    evidence: ExtractedEvidence,
    tier: TierClassification,
    activityMeta: { title: string; type?: string; description?: string }
  ): CalibrationContext {
    return getCalibrationContext(evidence, tier, activityMeta);
  }
}

export const achievementRetrievalService = new AchievementRetrievalService();
