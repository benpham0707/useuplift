/**
 * Nuance Calibration Types — Achievement Intelligence & Hybrid Scoring
 *
 * Types for the nuance calibration layer that sits between the deterministic
 * rule scorer and the final score output. The calibrator uses field-specific
 * achievement data to adjust scores WITHIN tier bounds.
 *
 * Architecture:
 *   Features(Haiku) → Tier(code) → RuleScorer(code) → preliminary scores
 *                                                        ↓
 *   AchievementDB lookup → CalibrationContext (3-5 matching entries)
 *                                                        ↓
 *   NuanceCalibrator(Sonnet) → adjusted scores within tier bounds
 *                                                        ↓
 *                                                  [final score]
 */

import type { InternalTier } from './types';
import type { ImpressionAnalysisResult } from './impressivenessCalibration/types';

// ============================================================================
// ACHIEVEMENT DATABASE TYPES
// ============================================================================

/**
 * A single achievement benchmark entry with deep nuance fields.
 * Extends the original BenchmarkEntry with selectivity, subcategory,
 * role subtypes, and prestige context.
 */
export interface AchievementEntry {
  /** Short activity label */
  activity: string;
  /** Score range at this tier */
  scoreRange: [number, number];
  /** One-line context (same as current BenchmarkEntry) */
  context: string;
  /** Acceptance/selection ratio for quantified calibration */
  selectivityRatio?: string;
  /** Sub-field within the category */
  subcategory: string;
  /** Role granularity beyond contributor/participant */
  roleSubtype?: string;
  /** Prestige rank within subcategory (1=highest, 5=lowest) */
  fieldPrestige: 1 | 2 | 3 | 4 | 5;
  /** What specifically differentiates this from similar achievements */
  keyDifferentiator: string;
}

/**
 * Profile for a subcategory within a field.
 * Describes prestige level, typical tier, and matching keywords.
 */
export interface SubcategoryProfile {
  /** Machine key */
  key: string;
  /** Display name */
  name: string;
  /** Prestige level within parent category (1=highest) */
  prestigeLevel: 1 | 2 | 3 | 4 | 5;
  /** Why this subcategory is more/less prestigious */
  prestigeContext: string;
  /** Typical tier for serious involvement */
  typicalTier: InternalTier;
  /** Keywords unique to this subcategory */
  keywords: string[];
}

/**
 * Achievement ladder entry — ordered progression from beginner to elite.
 */
export interface AchievementLadderEntry {
  /** Level label */
  level: 'beginner' | 'developing' | 'competitive' | 'elite';
  /** Description of what this level looks like */
  description: string;
  /** Typical score range for this level */
  typicalScoreRange: [number, number];
  /** Internal tier this level maps to */
  internalTier: InternalTier;
}

/**
 * Field-specific role hierarchy entry.
 * Different fields value roles differently (PI in research vs captain in sports).
 */
export interface RoleHierarchyEntry {
  /** Role label */
  role: string;
  /** Score modifier (-1 to +1) applied to leadership component */
  scoreModifier: number;
  /** Context for why this role has this modifier */
  context: string;
}

/**
 * Complete achievement category with deep subcategory data.
 */
export interface AchievementCategory {
  /** Display label */
  label: string;
  /** Keywords to match activities to this category */
  keywords: string[];
  /** Subcategories within this field */
  subcategories: SubcategoryProfile[];
  /** Achievement ladder — ordered progression from beginner to elite */
  achievementLadder: AchievementLadderEntry[];
  /** Role hierarchy specific to this field */
  roleHierarchy: RoleHierarchyEntry[];
  /** Achievement entries by internal tier (1-6) */
  tiers: Partial<Record<InternalTier, AchievementEntry[]>>;
}

// ============================================================================
// CALIBRATION CONTEXT TYPES
// ============================================================================

/**
 * Calibration context assembled by the retrieval layer.
 * Everything Sonnet needs for nuanced adjustment.
 */
export interface CalibrationContext {
  /** Best-matching category and subcategory */
  categoryMatch: {
    category: string;
    subcategory: string;
    confidence: 'high' | 'medium' | 'low';
  };
  /** 3-5 most relevant benchmark entries (same tier + adjacent tiers) */
  calibrationEntries: AchievementEntry[];
  /** The achievement ladder for this field */
  achievementLadder: AchievementLadderEntry[];
  /** Field-specific role hierarchy */
  roleHierarchy: RoleHierarchyEntry[];
  /** Subcategory prestige context */
  subcategoryPrestige: SubcategoryProfile | null;
  /** Selectivity context for the activity's recognition level */
  selectivityContext: string | null;
}

// ============================================================================
// NUANCE CALIBRATION I/O TYPES
// ============================================================================

/**
 * Input to the nuance calibration service.
 */
export interface NuanceCalibrationInput {
  /** Activity metadata */
  activity: {
    title: string;
    description: string;
    type?: string;
    position?: string;
  };
  /** Preliminary scores from rule scorer */
  preliminaryScores: {
    activityTotal: number;
    descriptionTotal: number;
    components: {
      tierScore: number;
      recognitionScore: number;
      leadershipScore: number;
      communityScore: number;
      commitmentScore: number;
    };
  };
  /** Tier classification with bounds */
  tierRange: { min: number; max: number };
  /** Component constraints from tier */
  componentConstraints: {
    recognition: { min: number; max: number };
    leadership: { min: number; max: number };
    community: { min: number; max: number };
    commitment: { min: number; max: number };
  };
  /** Field-specific calibration data */
  calibration: CalibrationContext;
  /** Optional expertise signal context — pre-computed by deterministic matcher ($0) */
  expertiseContext?: {
    domainId: string;
    confidence: 'high' | 'medium' | 'low';
    signalCount: number;
    trapCount: number;
    expertiseScore: number;
    topSignals: string[];
    topTraps: string[];
  };
  /** Optional impression analysis — level explanation, major alignment, depth markers ($0) */
  impressionContext?: ImpressionAnalysisResult;
}

/**
 * A single score adjustment made by the calibrator.
 */
export interface ScoreAdjustment {
  /** Which component was adjusted */
  component: string;
  /** Original score from rule scorer */
  originalScore: number;
  /** Adjusted score from calibrator */
  adjustedScore: number;
  /** Reason for the adjustment */
  reason: string;
}

/**
 * Output from the nuance calibration service.
 */
export interface NuanceCalibratedResult {
  /** Adjusted activity total (clamped to tier range) */
  adjustedActivityTotal: number;
  /** Adjusted component scores */
  adjustedComponents: {
    recognitionScore: number;
    leadershipScore: number;
    communityScore: number;
    commitmentScore: number;
  };
  /** What the calibrator adjusted and why */
  adjustments: ScoreAdjustment[];
  /** Whether Sonnet agreed with or adjusted the tier */
  tierAgreement: 'confirmed' | 'adjusted_within_bounds';
  /** Whether calibration was applied or skipped (low confidence) */
  calibrationApplied: boolean;
}

/**
 * Raw JSON output expected from the Sonnet calibration call (single activity).
 */
export interface CalibrationLLMResponse {
  adjustments: Array<{
    component: string;
    adjustedScore: number;
    reason: string;
  }>;
}

/**
 * Raw JSON output expected from the Sonnet BATCH calibration call.
 * Contains adjustments keyed by activity index (0-based).
 */
export interface BatchCalibrationLLMResponse {
  activities: Array<{
    /** Activity index (0-based, matching input order) */
    index: number;
    adjustments: Array<{
      component: string;
      adjustedScore: number;
      reason: string;
    }>;
  }>;
}
