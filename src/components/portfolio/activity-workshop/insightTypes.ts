/**
 * insightTypes.ts — Shared types, constants, and helpers for activity insight components.
 *
 * Extracted from ActivityInsightCard.tsx to be reused across:
 *   - InsightSummaryCard
 *   - InsightDetailView (+ tab sections)
 *   - ScoreBreakdown
 */

// ============================================================================
// ACTIVITY INSIGHT DATA (canonical interface)
// ============================================================================

export interface ActivityInsightData {
  activityId: string;
  title: string;
  rank: number;
  combinedScore: number;
  activityScore: {
    total: number;
    breakdown: {
      tierAssessment: { score: number; weight: number };
      recognitionLevel: { score: number; weight: number };
      commitmentProgression: { score: number; weight: number };
      communityCharacter: { score: number; weight: number };
      leadershipImpact: { score: number; weight: number };
    };
  };
  descriptionScore: {
    total: number;
    breakdown: {
      specificity: { score: number; weight: number };
      impactClarity: { score: number; weight: number };
      authenticityVoice: { score: number; weight: number };
      actionLanguage: { score: number; weight: number };
      quantification: { score: number; weight: number };
    };
  };
  tier: 1 | 2 | 3 | 4;
  totalHours: number;
  greenFlags: Array<{ flag: string; strength: string; evidence: string; admissionsValue: string }>;
  redFlags: Array<{ flag: string; severity: string; evidence: string; implication: string }>;
  storyRole: string;
  centralityScore: number;
  teachingDepth: 'deep' | 'medium' | 'quick';

  // Strength teaching (from stage2 — rich coaching data)
  strengthTeaching: Array<{
    strength: string;
    whyItMatters: string;
    theProblem?: string;
    psychology?: string;
    research?: string;
    quote?: string;
    quoteSource?: string;
    howToLeverage: string;
    inApplications: string;
    references: Array<{ quotedText: string; type: string; label: string }>;
  }>;

  // Celebration & Teaching (from stage2)
  celebrationHeadline: string;
  celebrationStrengths: string[];
  improvementTeaching: Array<{
    issue: string;
    whyItMatters: string;
    whyItMattersPsychology?: string;
    whyItMattersResearch?: string;
    whyItMattersQuote?: string;
    whyItMattersQuoteSource?: string;
    howToFix: string;
    exampleBefore: string;
    exampleAfter: string;
    transformationAnalysis?: string;
    priority: string;
    references: Array<{ quotedText: string; type: string; label: string }>;
  }>;
  descriptionOptimization: {
    original: string;
    optimized: string;
    originalCharCount: number;
    optimizedCharCount: number;
    changes: Array<{ change: string; reason?: string }>;
  } | null;
  narrativeGuidance: {
    howToTalkAboutThis: string;
    uniqueAngle: string;
    connectionToStory: string;
    interviewTips?: string[];
  } | null;

  // Scoring detail
  summaryOneLiner: string;
  topStrength: string;
  topImprovement: string;
  improvementPaths: string[];

  // Narrative potential (from stage1)
  essayWorthiness: string;
  uniqueAngles: string[];

  // Leadership & Impact (from stage1)
  leadershipType: string;
  impactScope: string;
  impactType: string;
  impactNarrative: string;

  // School fit (from stage1)
  bestFitSchoolTypes: string[];

  // Narrative connections (from finalNarrative)
  narrativeThreads: Array<{ name: string; activityIds: string[] }>;
  elevations: Array<{
    elevatingActivityId: string;
    elevatingTitle: string;
    mechanism: string;
    strength: string;
  }>;

  // Quick encouragement (for non-deep-teaching activities)
  quickCelebration: string | null;
  quickTip: string | null;

  // Per-activity readiness (from stage1.commonAppReadiness)
  descriptionReady: boolean;
  descriptionIssues: string[];

  // Score rationale data (from scoring pipeline)
  activityScoreRationales: {
    tierAssessment: { rationale: string; tier: number };
    recognitionLevel: { rationale: string; level: string };
    leadershipImpact: { rationale: string; isApplicable: boolean; role: string; impactScope: string };
    communityCharacter: { rationale: string; primaryTrait: string; authenticitySignal: string };
    commitmentProgression: { rationale: string; years: number; showsProgression: boolean };
  } | null;
  descriptionScoreRationales: {
    specificity: { rationale: string };
    impactClarity: { rationale: string };
    authenticityVoice: { rationale: string };
    actionLanguage: { rationale: string };
    quantification: { rationale: string };
  } | null;
  tierExplanation: {
    explanation: string;
    whatMakesThisTier: string;
    whatWouldChangeIt: string;
    benchmarks: Array<{
      tier: number;
      benchmark: string;
      source: string;
      studentMeets: boolean;
      gap?: string;
      evidence?: string;
    }>;
  } | null;
  activityOverallRationale: string;
  descriptionOverallRationale: string;
  combinedScoreRationale: string;

  // --- New fields: Stage 0 story context ---
  storyEssence: string;
  archetype: string;
  roleExplanation: string;

  // --- New fields: Stage 1 richer analysis ---
  recognition: string;
  narrativeStorytelling: string;
  narrativeEmotionalResonance: string;
  narrativeGrowthArc: string;
  schoolFitAlignedValues: string[];
  schoolFitConcerns: string[];

  // --- New fields: Scoring richer per-activity data ---
  tierJustification: string;
  comparisonBenchmarks: { similarTo: string; above: string; below: string } | null;
  descriptionStrengths: string[];
  descriptionImprovements: string[];
  suggestedRewrite: string;

  // --- New fields: Teaching upgrade pathway ---
  upgradePathway: {
    currentTier: number;
    targetTier: number;
    feasibility: string;
    timeRequired: string;
    steps: Array<{ step: number; action: string; milestone: string; timeframe: string }>;
    successIndicators: string[];
    risks: string[];
  } | null;

  // --- New fields: Teaching essay potential ---
  essayPotential: { viable: boolean; angle: string; cautionAreas: string[] } | null;

  // --- New fields: Teaching description alternatives ---
  descriptionAlternatives: string[];

  // --- New fields: Scoring teaching transformation ---
  transformation: {
    currentScore: number;
    revisionLevel: string;
    principle: { name: string; whyItMatters: string; applicationToActivity: string };
    rewrite: {
      original: string;
      suggested: string;
      characterCount: number;
      changesApplied: Array<{ element: string; original: string; transformed: string; rationale: string }>;
    };
    alternatives: Array<{ angle: string; rewrite: string; whenToUse: string }>;
    citations: Array<{ source: string; sourceName: string; insight: string; application: string }>;
    expectedScoreImprovement: { projectedScore: number; improvingComponents: string[]; rationale: string };
  } | null;
}

// ============================================================================
// STORY ROLE COLOR SYSTEM
// ============================================================================

export interface RoleColorConfig {
  accent: string;
  bannerLight: string;
  bannerDark: string;
  label: string;
  textAccent: string;
}

export const ROLE_COLORS: Record<string, RoleColorConfig> = {
  core_identity: {
    accent: 'bg-purple-500',
    bannerLight: 'from-purple-50 to-violet-50',
    bannerDark: 'dark:from-purple-950/40 dark:to-violet-950/40',
    label: 'Core Identity',
    textAccent: 'text-purple-600 dark:text-purple-400',
  },
  passion_pursuit: {
    accent: 'bg-blue-500',
    bannerLight: 'from-blue-50 to-cyan-50',
    bannerDark: 'dark:from-blue-950/40 dark:to-cyan-950/40',
    label: 'Passion',
    textAccent: 'text-blue-600 dark:text-blue-400',
  },
  obligation: {
    accent: 'bg-amber-500',
    bannerLight: 'from-amber-50 to-orange-50',
    bannerDark: 'dark:from-amber-950/40 dark:to-orange-950/40',
    label: 'Obligation',
    textAccent: 'text-amber-600 dark:text-amber-400',
  },
  impact_vehicle: {
    accent: 'bg-emerald-500',
    bannerLight: 'from-emerald-50 to-teal-50',
    bannerDark: 'dark:from-emerald-950/40 dark:to-teal-950/40',
    label: 'Impact',
    textAccent: 'text-emerald-600 dark:text-emerald-400',
  },
  exploration: {
    accent: 'bg-teal-500',
    bannerLight: 'from-teal-50 to-cyan-50',
    bannerDark: 'dark:from-teal-950/40 dark:to-cyan-950/40',
    label: 'Exploration',
    textAccent: 'text-teal-600 dark:text-teal-400',
  },
};

export const DEFAULT_ROLE: RoleColorConfig = ROLE_COLORS.exploration;

export function getRoleConfig(storyRole: string): RoleColorConfig {
  return ROLE_COLORS[storyRole] || DEFAULT_ROLE;
}

// ============================================================================
// ROLE BADGE CLASS (inline badge styling per storyRole)
// ============================================================================

export function getRoleBadgeClass(storyRole: string): string {
  switch (storyRole) {
    case 'core_identity':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
    case 'passion_pursuit':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
    case 'obligation':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
    case 'impact_vehicle':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    default:
      return 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300';
  }
}

// ============================================================================
// TIER LABELS
// ============================================================================

export const TIER_LABELS: Record<number, string> = {
  1: 'T1 Elite',
  2: 'T2 Strong',
  3: 'T3 Solid',
  4: 'T4 Basic',
};

// ============================================================================
// SCORE HELPERS
// ============================================================================

export function getScoreColor(score: number): string {
  if (score >= 8.0) return '#22c55e'; // green-500
  if (score >= 6.0) return '#14b8a6'; // teal-500
  if (score >= 4.0) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
}

export function getScoreTextColor(score: number): string {
  if (score >= 8.0) return 'text-green-600 dark:text-green-400';
  if (score >= 6.0) return 'text-teal-600 dark:text-teal-400';
  if (score >= 4.0) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export interface ScoreTheme {
  hex: string;
  textClass: string;
  barClass: string;
  bgTint: string;
}

export function getScoreTheme(score: number): ScoreTheme {
  if (score >= 8.0) return {
    hex: '#22c55e',
    textClass: 'text-green-500 dark:text-green-400',
    barClass: 'bg-gradient-to-r from-green-500 to-emerald-400',
    bgTint: 'bg-green-500/8 dark:bg-green-500/15',
  };
  if (score >= 6.0) return {
    hex: '#14b8a6',
    textClass: 'text-teal-500 dark:text-teal-400',
    barClass: 'bg-gradient-to-r from-teal-500 to-cyan-400',
    bgTint: 'bg-teal-500/8 dark:bg-teal-500/15',
  };
  if (score >= 4.0) return {
    hex: '#f59e0b',
    textClass: 'text-amber-500 dark:text-amber-400',
    barClass: 'bg-gradient-to-r from-amber-500 to-yellow-400',
    bgTint: 'bg-amber-500/8 dark:bg-amber-500/15',
  };
  return {
    hex: '#ef4444',
    textClass: 'text-red-500 dark:text-red-400',
    barClass: 'bg-gradient-to-r from-red-500 to-rose-400',
    bgTint: 'bg-red-500/8 dark:bg-red-500/15',
  };
}

// ============================================================================
// PRIORITY BADGES
// ============================================================================

export const PRIORITY_BADGE: Record<string, { className: string; label: string }> = {
  high: { className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300', label: 'High Priority' },
  medium: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', label: 'Medium' },
  low: { className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', label: 'Low' },
};

export const ELEVATION_STRENGTH_BADGE: Record<string, string> = {
  transformative: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  strong: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  moderate: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  subtle: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};
