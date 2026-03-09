/**
 * Scoring Telemetry Types
 *
 * Type definitions for the scoring telemetry system. Captures detailed traces
 * of every scoring decision for:
 *   1. Calibration drift detection — are LLM adjustments diverging from rules?
 *   2. Coverage gap analysis — which domains lack calibration data?
 *   3. Domain-level score distribution — are scores realistic per category?
 *
 * Table: `scoring_telemetry` (Supabase)
 * Upsert key: `fingerprint` (same activity re-scored overwrites, not duplicates)
 *
 * Privacy: fingerprints are SHA-256 hashes — no user data is recoverable.
 * No user IDs are stored.
 */

// ============================================================================
// DOMAIN RESOLUTION TRACE
// ============================================================================

/**
 * Trace of how the KB resolved an activity's domain/category.
 *
 * Captures which category was matched, the method used (direct keyword,
 * proxy from a similar domain, or universal fallback), and supporting
 * context for debugging calibration gaps.
 */
export interface DomainResolutionTrace {
  /** Activity fingerprint (SHA-256 hex) */
  fingerprint: string;
  /** Resolved top-level category ID (e.g., "stem_research", "athletics") */
  resolvedCategory: string;
  /** Resolved subcategory, if any (e.g., "ml_ai", "team_sport") */
  resolvedSubcategory: string | null;
  /** Confidence of the resolution */
  resolutionConfidence: 'high' | 'medium' | 'low';
  /** How the category was resolved */
  resolutionMethod: 'direct' | 'proxy' | 'universal';
  /** Categories considered similar (for proxy/universal analysis) */
  similarDomains: string[];
  /** If proxy method was used, which domain served as proxy */
  proxyDomainUsed: string | null;
  /** Number of calibration entries available for this domain */
  calibrationEntriesCount: number;
  /** The keyword or term that triggered the match, if any */
  matchedTerm: string | null;
  /** Domain-specific context string (e.g., "competitive_robotics", "clinical_research") */
  domainSpecificContext: string | null;
}

// ============================================================================
// LLM ADJUSTMENT TRACE
// ============================================================================

/**
 * Trace of how Sonnet nuance calibration adjusted scores from rule scoring.
 *
 * Captures the delta between rule-based and LLM-adjusted scores per component,
 * whether calibration was applied, and the tier bounds enforced.
 */
export interface LLMAdjustmentTrace {
  /** Total score from deterministic rule scorer */
  ruleScoreTotal: number;
  /** Total score after LLM adjustment */
  llmScoreTotal: number;
  /** Net delta (llmScoreTotal - ruleScoreTotal) */
  delta: number;
  /** Per-component adjustments */
  componentAdjustments: Array<{
    component: string;
    ruleScore: number;
    llmScore: number;
    reason: string;
  }>;
  /** Whether nuance calibration was applied (false = skipped due to low confidence) */
  calibrationApplied: boolean;
  /** Tier score range that constrained the adjustments */
  tierRange: { min: number; max: number };
}

// ============================================================================
// TELEMETRY RECORD (one per scored activity)
// ============================================================================

/**
 * A single telemetry record for one scored activity.
 *
 * Written to Supabase `scoring_telemetry` table on every scoring run.
 * Upserted on `fingerprint` — re-scoring the same activity overwrites
 * the previous record.
 */
export interface ScoringTelemetryRecord {
  /** Activity fingerprint (SHA-256 hex) */
  fingerprint: string;
  /** Activity title */
  activityTitle: string;
  /** Activity category (from Common App or user input) */
  activityCategory: string;
  /** ISO timestamp of when this scoring occurred */
  scoredAt: string;
  /** Knowledge base version (e.g., "2.1.0") */
  kbVersion: string;
  /** Scoring model version (e.g., "claude-sonnet-4-5-20250929") */
  modelVersion: string;
  /** Internal 6-tier classification (1-6) */
  internalTier: number;
  /** Full domain resolution trace */
  domainResolution: DomainResolutionTrace;
  /** Total score from deterministic rule scorer */
  ruleScoreTotal: number;
  /** Full LLM adjustment trace */
  llmAdjustmentTrace: LLMAdjustmentTrace;
  /** Final activity score after all adjustments */
  finalScoreTotal: number;
  /** Description score total (how well the description is written) */
  descriptionScoreTotal: number;
  /** Expertise confidence level from the expertise signaling library */
  expertiseConfidence: 'high' | 'medium' | 'low' | null;
  /** Expertise domain matched (e.g., "machine_learning", "clinical_research") */
  expertiseDomain: string | null;
  /** Overall signal strength of the activity */
  overallSignalStrength: 'strong' | 'moderate' | 'weak';
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Aggregate statistics for a single domain/category.
 *
 * Used by the analytics dashboard to show score distributions,
 * LLM adjustment patterns, and confidence breakdowns per category.
 */
export interface DomainStats {
  /** Category ID (e.g., "stem_research") */
  categoryId: string;
  /** Number of scored activities in this category */
  sampleCount: number;
  /** Score distribution percentiles */
  scoreDistribution: { p10: number; p25: number; p50: number; p75: number; p90: number };
  /** Average delta between rule and LLM scores */
  avgLLMDelta: number;
  /** Average rule score total */
  avgRuleScore: number;
  /** Average final score total */
  avgFinalScore: number;
  /** Breakdown of domain resolution confidence levels */
  confidenceBreakdown: { high: number; medium: number; low: number };
  /** Rate of proxy domain usage (0-1) */
  proxyUsageRate: number;
  /** Rate of universal fallback usage (0-1) */
  universalFallbackRate: number;
}

/**
 * Calibration drift report for a single category.
 *
 * Compares recent LLM adjustment deltas against the baseline to detect
 * when the model's behavior is shifting relative to rule-based scoring.
 * Flags drift when |difference| > 0.3 on 20+ samples.
 */
export interface DriftReport {
  /** Category ID */
  categoryId: string;
  /** Time window in days for the "recent" window */
  windowDays: number;
  /** Average delta in the recent window */
  currentAvgDelta: number;
  /** Average delta across all historical data (baseline) */
  baselineAvgDelta: number;
  /** Absolute difference between current and baseline */
  driftMagnitude: number;
  /** Whether drift exceeds the threshold (|diff| > 0.3 on 20+ samples) */
  isDrifting: boolean;
  /** Number of samples in the recent window */
  sampleCount: number;
  /** Human-readable recommendation */
  recommendation: string;
}

/**
 * Coverage gap report across all categories.
 *
 * Identifies categories where the KB lacks calibration data,
 * resulting in high rates of proxy usage or universal fallback.
 */
export interface CoverageGapReport {
  /** List of categories with coverage gaps, sorted by priority */
  gaps: Array<{
    /** Category ID */
    categoryId: string;
    /** Total number of scorings in this category */
    totalScorings: number;
    /** Rate of low-confidence resolutions (0-1) */
    lowConfidenceRate: number;
    /** Rate of proxy domain usage (0-1) */
    proxyUsageRate: number;
    /** Rate of universal fallback usage (0-1) */
    universalFallbackRate: number;
    /** Priority: high if >25% universal, medium if >15% proxy, low otherwise */
    priority: 'high' | 'medium' | 'low';
  }>;
}

// ============================================================================
// SUPABASE ROW TYPE
// ============================================================================

/**
 * Shape of a row in the `scoring_telemetry` Supabase table.
 * Used for type-safe Supabase queries.
 */
export interface ScoringTelemetryRow {
  id: string;
  fingerprint: string;
  activity_category: string;
  activity_title: string | null;
  scored_at: string;
  kb_version: string;
  model_version: string;
  internal_tier: number;
  domain_resolution: DomainResolutionTrace;
  rule_score_total: number;
  llm_adjustment_trace: LLMAdjustmentTrace;
  final_score_total: number;
  description_score_total: number | null;
  expertise_confidence: 'high' | 'medium' | 'low' | null;
  expertise_domain: string | null;
  overall_signal_strength: 'strong' | 'moderate' | 'weak' | null;
  created_at: string;
  updated_at: string;
}
