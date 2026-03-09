/**
 * Portfolio Intelligence Types
 * Cross-essay analysis for theme overlap, narrative gaps, and coverage optimization.
 */

/** Input: a set of essays to analyze holistically */
export interface PortfolioAnalysisInput {
  essays: PortfolioEssay[];
  /** Target school tier for gap analysis */
  targetTier?: 'ivy_elite' | 'highly_selective' | 'very_selective' | 'selective';
  /** Specific school ID for school-specific gap analysis */
  collegeId?: string;
}

export interface PortfolioEssay {
  /** Unique essay identifier */
  id: string;
  /** Essay text */
  text: string;
  /** Essay type (e.g., 'common_app', 'why_us', 'activity', 'piq') */
  essayType: string;
  /** Target school (optional) */
  collegeId?: string;
}

/** Extracted themes from a single essay */
export interface EssayThemeExtraction {
  essayId: string;
  essayType: string;
  /** Primary theme (the central narrative) */
  primaryTheme: ThemeCluster;
  /** Secondary themes (supporting narratives) */
  secondaryThemes: ThemeCluster[];
  /** Key qualities demonstrated */
  qualitiesDemonstrated: string[];
}

export interface ThemeCluster {
  /** Short label (2-5 words) */
  label: string;
  /** Category: identity, growth, passion, community, challenge, intellectual, creative */
  category: ThemeCategory;
  /** Key phrases from the essay that support this theme */
  evidence: string[];
  /** Strength of this theme in the essay (0-1) */
  strength: number;
}

export type ThemeCategory =
  | 'identity'
  | 'growth'
  | 'passion'
  | 'community'
  | 'challenge'
  | 'intellectual'
  | 'creative'
  | 'leadership'
  | 'service';

/** Overlap between two essays */
export interface ThemeOverlap {
  essayIds: [string, string];
  overlappingTheme: string;
  overlapCategory: ThemeCategory;
  severity: 'low' | 'medium' | 'high';
  /** Specific suggestion for differentiation */
  suggestion: string;
}

/** A narrative gap — something the portfolio doesn't cover */
export interface NarrativeGap {
  /** What's missing */
  dimension: string;
  /** Why it matters for admissions */
  importance: 'critical' | 'important' | 'nice_to_have';
  /** What the student could do about it */
  suggestion: string;
}

/** Coverage analysis for a specific dimension */
export interface CoverageDimension {
  dimension: string;
  /** How many essays touch this (0 = gap) */
  essayCount: number;
  /** How strongly it's covered (0-1) */
  strength: number;
  /** Target strength for the chosen tier */
  target: number;
  /** Status */
  status: 'strong' | 'adequate' | 'weak' | 'missing';
}

/** Full portfolio analysis result */
export interface PortfolioAnalysis {
  /** Per-essay theme extractions */
  essayThemes: EssayThemeExtraction[];
  /** Detected overlaps between essays */
  overlaps: ThemeOverlap[];
  /** Narrative gaps (things not covered) */
  gaps: NarrativeGap[];
  /** Coverage breakdown by dimension */
  coverage: CoverageDimension[];
  /** Overall portfolio diversity score (0-100) */
  diversityScore: number;
  /** Executive summary */
  summary: string;
  /** Total LLM cost */
  totalCost: number;
}
