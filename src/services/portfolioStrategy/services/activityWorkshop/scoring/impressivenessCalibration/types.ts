/**
 * Impressiveness Calibration Database — Type Definitions
 *
 * Static data module providing field-specific impressiveness knowledge:
 * - 5-level impressiveness ladders per domain (baseline → extraordinary)
 * - Technical depth markers (what specific details MEAN in context)
 * - Field x Major alignment matrix (30 majors x 12 domains)
 * - Pre-built exemplar descriptions for teaching
 *
 * Cost: $0.00 (pure data, no LLM calls)
 * Latency: <1ms per lookup
 *
 * Complements (does NOT replace):
 * - achievementIntelligence.ts — WHAT activities exist at each tier
 * - expertiseSignaling/ — writing quality patterns (expertise vs name-dropping)
 * - tierClassifier.ts — deterministic tier from evidence
 *
 * This module answers: what makes achievements truly IMPRESSIVE in context?
 */

import type { InternalTier } from '../types';

// ============================================================================
// IMPRESSIVENESS LEVEL SYSTEM
// ============================================================================

/**
 * 5-level impressiveness classification.
 * Maps to internal tiers but provides richer context about WHY.
 */
export type ImpressionLevel =
  | 'baseline'       // Tier 5-6: Expected/common, doesn't differentiate
  | 'notable'        // Tier 4: Above average, shows real commitment
  | 'impressive'     // Tier 3: Demonstrated real achievement with external validation
  | 'exceptional'    // Tier 2: Rare accomplishment (top 1-2%)
  | 'extraordinary'; // Tier 1: Field-defining (top 0.01%)

/**
 * Mapping from impression level to typical internal tier range.
 */
export const IMPRESSION_LEVEL_TO_TIER: Record<ImpressionLevel, InternalTier[]> = {
  baseline: [5, 6],
  notable: [4],
  impressive: [3],
  exceptional: [2],
  extraordinary: [1],
};

/**
 * A single entry in the 5-level impressiveness ladder.
 * Each level includes the missing WHY explanation that AOs use.
 */
export interface ImpressionEntry {
  /** The impressiveness level */
  level: ImpressionLevel;

  /** What this level looks like in practice */
  description: string;

  /** What AOs think when they see this — the WHY that's missing today */
  whyImpressive: string;

  /** How common among selective school applicants */
  prevalence: string;

  /** Applicant percentile range (e.g., "top 5-10%") */
  applicantPercentile: string;

  /** What a verified version looks like (vs claimed) */
  verificationMarkers: string[];

  /** What separates this level from the one below */
  differentiatorFromBelow: string;

  /** What separates this level from the one above */
  differentiatorFromAbove: string;

  /** Typical internal tier range this maps to */
  tierRange: InternalTier[];
}

// ============================================================================
// TECHNICAL DEPTH MARKERS
// ============================================================================

/**
 * A field-specific technical detail that carries meaning beyond its surface.
 * Explains what specific terms/patterns MEAN in the context of HS applicants.
 *
 * Example: "IRB approval" in a HS context is extremely rare and signals
 * genuine clinical/behavioral research involvement — not just lab shadowing.
 */
export interface TechnicalDepthMarker {
  /** The technical term or pattern */
  term: string;

  /** What this term means in the field */
  meaning: string;

  /** How rare/significant this is for HS students specifically */
  hsContext: string;

  /** Which impressiveness level this typically indicates */
  indicatesLevel: ImpressionLevel;

  /** Keywords to detect this marker in descriptions */
  detectionKeywords: string[];

  /** How confidently we can identify this marker */
  detectionConfidence: 'high' | 'medium' | 'low';
}

// ============================================================================
// DOMAIN DEFINITION
// ============================================================================

/**
 * Complete impressiveness domain definition.
 * One per activity category, providing deep field-specific context.
 */
export interface ImpressivenessDomain {
  /** Domain identifier (matches achievement database categories) */
  domainId: string;

  /** Display name */
  label: string;

  /** Brief overview of the impressiveness landscape in this field */
  overview: string;

  /** The 5-level impressiveness ladder for this domain */
  ladder: ImpressionEntry[];

  /** Field-specific technical depth markers (~8-15 per domain) */
  technicalDepthMarkers: TechnicalDepthMarker[];
}

// ============================================================================
// MAJOR ALIGNMENT MATRIX
// ============================================================================

/**
 * Alignment strength between an activity domain and an intended major.
 */
export type AlignmentStrength =
  | 'critical'       // This activity IS the major (CS research for CS major)
  | 'strong'         // Directly supports the major
  | 'moderate'       // Tangentially related
  | 'complementary'  // Adds breadth, not depth
  | 'unrelated';     // No meaningful connection

/**
 * A single entry in the field x major alignment matrix.
 */
export interface MajorAlignmentEntry {
  /** The activity domain ID */
  domainId: string;

  /** The major category */
  majorCategory: string;

  /** How strongly this activity aligns with this major */
  alignment: AlignmentStrength;

  /** Why this alignment strength was assigned */
  rationale: string;

  /** Numeric boost factor for scoring (0-1, where 1 = maximum boost) */
  boostFactor: number;

  /** Sub-activities within this domain that are especially strong for this major */
  strongSubActivities: string[];
}

/**
 * A major category in the alignment matrix.
 * Covers all 42 majors in collegeExpectationsDatabase.ts.
 */
export interface MajorCategory {
  /** Category identifier */
  id: string;

  /** Display name */
  label: string;

  /** Alternative names that resolve to this category */
  aliases: string[];
}

// ============================================================================
// EXEMPLAR DESCRIPTIONS
// ============================================================================

/**
 * A pre-built exemplar description for teaching.
 * 150 characters max, demonstrating excellence at a specific tier.
 */
export interface ExemplarDescription {
  /** Unique identifier */
  id: string;

  /** The domain this exemplar belongs to */
  domainId: string;

  /** The impressiveness level this demonstrates */
  level: ImpressionLevel;

  /** The exemplar description text (max 150 characters) */
  text: string;

  /** Why this description works — for teaching injection */
  whyItWorks: string;

  /** Which scoring dimensions this demonstrates strength in */
  demonstratesDimensions: ExemplarDimension[];

  /** Internal tier this targets */
  targetTier: InternalTier;
}

/**
 * Scoring dimensions that an exemplar can demonstrate.
 * Maps to the description scoring components.
 */
export type ExemplarDimension =
  | 'role_ownership'       // specificity component
  | 'evidence_of_impact'   // impactClarity component
  | 'action_precision'     // actionLanguage component
  | 'quantification'       // quantification component
  | 'differentiation';     // authenticityVoice component

// ============================================================================
// ANALYSIS RESULT TYPES
// ============================================================================

/**
 * Result from analyzing an activity's impressiveness.
 * Returned by `analyzeImpressiveness()` — the core engine function.
 */
export interface ImpressionAnalysisResult {
  /** Determined impressiveness level */
  level: ImpressionLevel;

  /** The full impression entry with WHY explanation */
  impressionContext: ImpressionEntry;

  /** Technical depth markers detected in the description */
  detectedMarkers: DetectedMarker[];

  /** Major alignment assessment (if intended major provided) */
  majorAlignment: MajorAlignmentResult | null;

  /** Suggested tier adjustment (-1 to +1) based on impressiveness context */
  tierBoost: number;

  /** Relevant pre-built exemplar descriptions for teaching */
  exemplars: ExemplarDescription[];

  /** Confidence in this analysis */
  confidence: 'high' | 'medium' | 'low';

  // ── Legacy fields for backward compat with expertiseSignaling consumer code ──

  /** Percentile range string (e.g., "top 5-10%") — used by orchestrator logging */
  percentileRange?: string;

  /** Level explanation — where this activity sits relative to applicant pool */
  levelExplanation?: string;

  /** Summary suitable for prompt injection (1-3 sentences) */
  promptSummary?: string;

  /** Flat technical depth markers for nuanceCalibrationService consumption */
  technicalDepthMarkers?: Array<{ marker: string; significance: string; rarity: string }>;
}

/**
 * A detected technical depth marker with match details.
 */
export interface DetectedMarker {
  /** The marker that was detected */
  marker: TechnicalDepthMarker;

  /** Which keywords matched */
  matchedKeywords: string[];

  /** How strong the match is (0-1) */
  matchStrength: number;
}

/**
 * Major alignment result for a specific activity.
 */
export interface MajorAlignmentResult {
  /** Alignment strength */
  alignment: AlignmentStrength;

  /** Legacy compat: maps alignment to relevance string for nuanceCalibrationService */
  relevance?: 'critical' | 'core' | 'supporting' | 'complementary' | 'unrelated';

  /** Why this alignment was determined */
  rationale: string;

  /** Numeric boost factor (0-1) */
  boostFactor: number;

  /** The resolved major category */
  resolvedMajor: string;

  /** Sub-activities that are especially relevant */
  strongSubActivities: string[];
}

// ============================================================================
// BACKWARD COMPATIBILITY — Maps to existing portfolio calibrator output
// ============================================================================

/**
 * Maps AlignmentStrength to the existing 'core' | 'supporting' | 'unrelated'
 * used by portfolioCalibrator.ts MajorRelevanceAnnotation.
 */
export function alignmentToRelevance(
  alignment: AlignmentStrength
): 'core' | 'supporting' | 'complementary' | 'unrelated' {
  switch (alignment) {
    case 'critical':
    case 'strong':
      return 'core';
    case 'moderate':
      return 'supporting';
    case 'complementary':
      return 'complementary';
    case 'unrelated':
      return 'unrelated';
  }
}

/**
 * Maps AlignmentStrength to legacy 3-value relevance for backward compat.
 */
export function alignmentToLegacyRelevance(
  alignment: AlignmentStrength
): 'core' | 'supporting' | 'unrelated' {
  switch (alignment) {
    case 'critical':
    case 'strong':
      return 'core';
    case 'moderate':
    case 'complementary':
      return 'supporting';
    case 'unrelated':
      return 'unrelated';
  }
}
