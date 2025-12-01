/**
 * Comprehensive Insight System Types
 *
 * Builds on top of TeachingIssue to create rich, specific, actionable insights
 * that showcase our deep understanding of narrative quality and provide
 * sophisticated analysis with comparative examples, multiple solution paths,
 * and focus-mode chat integration.
 *
 * Philosophy: Show we truly understand where their essay is and where it can go.
 */

import type { RubricCategory } from '@/components/portfolio/extracurricular/workshop/backendTypes';
import type { TeachingExample } from '@/services/workshop/teachingExamples';

// ============================================================================
// CORE INSIGHT CARD
// ============================================================================

/**
 * Rich insight card with complete technical analysis, examples, and solutions
 */
export interface InsightCard {
  // Identification
  id: string;
  dimension: RubricCategory;
  dimensionDisplayName: string;
  severity: 'critical' | 'major' | 'minor';

  // Type classification
  type: 'issue' | 'strength' | 'opportunity';

  // Problem/Strength statement
  title: string; // e.g., "Manufactured Phrases Weaken Voice" or "Strong Quantified Impact"
  summary: string; // One-line explanation for list view

  // Technical detection & analysis
  technical: {
    whatWeDetected: string; // Pattern analysis with counts/specifics
    fromYourDraft: DraftQuote[]; // Quoted excerpts with context
    whyThisMatters: string; // Impact on admissions officers
    pointImpact: PointImpact; // Quantified score effect
    patternAnalysis: PatternAnalysis; // Deep pattern breakdown
  };

  // Comparative learning (weak vs strong examples)
  examples: {
    weak: ComparativeExample;
    strong: ComparativeExample;
    contextualNote?: string; // Why this comparison is relevant
  };

  // Multiple solution approaches
  solutions: {
    approaches: SolutionApproach[]; // 3-4 different strategies
    principles: string[]; // Transferable lessons
    difficulty: 'easy' | 'moderate' | 'challenging';
    estimatedTime: string; // e.g., "10-15 minutes"
    priorityRank: number; // 1 = highest priority
  };

  // Chat integration for focused coaching
  chatRouting: {
    prefilledPrompt: string; // What to ask the AI coach
    focusContext: FocusModeContext; // Deep context for chat
    suggestedFollowUps: string[]; // Related questions
  };

  // UI state
  isExpanded?: boolean;
  isCompleted?: boolean;
  userNotes?: string;
}

/**
 * Quote from student's draft with surrounding context
 */
export interface DraftQuote {
  text: string; // The actual quote
  lineNumber?: number; // Approximate line in original
  context: 'beginning' | 'middle' | 'end'; // Where in essay
  surroundingText?: string; // Optional: text before/after for context
  highlightReason: string; // Why we're showing this quote
}

/**
 * Quantified impact on NQI score
 */
export interface PointImpact {
  current: string; // e.g., "-6 points"
  potential: string; // e.g., "+4 to +6 points if fixed"
  confidence: 'high' | 'medium' | 'low'; // Confidence in estimate
  explanation: string; // Why this impact level
}

/**
 * Deep pattern analysis
 */
export interface PatternAnalysis {
  patternType: string; // e.g., "manufactured_phrases", "passive_voice"
  occurrenceCount: number;
  frequency: string; // e.g., "7 times across essay"
  severity: string; // e.g., "Appears in 40% of sentences"
  comparison: string; // e.g., "Top essays average 0-1 instances"
  technicalDetails: string[]; // Specific technical observations
}

/**
 * Comparative example (weak or strong)
 */
export interface ComparativeExample {
  text: string; // The example text
  score: number; // 0-10 quality rating
  annotations: Annotation[]; // What to notice
  context?: string; // Optional: where this came from (e.g., "MIT admit, robotics")
}

/**
 * Annotation highlighting specific elements
 */
export interface Annotation {
  highlight: string; // What to notice
  explanation: string; // Why it matters/what's wrong or right
  category: 'strength' | 'weakness' | 'technique' | 'principle';
}

/**
 * Solution approach with difficulty rating
 */
export interface SolutionApproach {
  name: string; // e.g., "Numeric Substitution (Easy)"
  description: string; // What to do
  difficulty: 'easy' | 'moderate' | 'challenging';
  estimatedTime: string; // e.g., "5 minutes"
  estimatedImpact: string; // e.g., "+2 to +3 points"
  steps?: string[]; // Optional step-by-step
  example?: string; // Optional example of application
  principle: string; // The transferable lesson
}

/**
 * Focus mode context for chat
 */
export interface FocusModeContext {
  issueId: string;
  dimension: RubricCategory;
  severity: 'critical' | 'major' | 'minor';
  title: string;

  // Deep technical context
  technicalAnalysis: string;
  draftQuotes: string[];
  patternDetails: string[];

  // Learning context
  examples: {
    weak: { text: string; problems: string[] };
    strong: { text: string; techniques: string[] };
  };

  // Solution guidance
  solutionApproaches: string[];
  principles: string[];
  estimatedTime: string;

  // Current state
  currentDimensionScore: number;
  targetDimensionScore: number;
  overallNQI: number;
}

// ============================================================================
// DIMENSION SUMMARY (For Accordion UI)
// ============================================================================

/**
 * Complete summary of a rubric dimension with all insights
 */
export interface DimensionSummary {
  // Dimension info
  dimension: RubricCategory;
  name: string; // Display name
  description: string; // What this dimension measures

  // Scoring
  score: number; // 0-10
  maxScore: number; // Usually 10
  percentage: number; // 0-100
  weight: number; // Percentage weight (0-1)
  status: 'critical' | 'needs_work' | 'good' | 'excellent';

  // Issue breakdown
  issueCount: {
    critical: number;
    major: number;
    minor: number;
    total: number;
  };

  // Strength count
  strengthCount: number;
  opportunityCount: number;

  // Potential improvement
  potentialGain: {
    min: number;
    max: number;
    display: string; // e.g., "+6 to +8 points"
    confidence: 'high' | 'medium' | 'low';
  };

  // Score interpretation
  interpretation: {
    currentLevel: string; // e.g., "Developing but weak"
    targetLevel: string; // e.g., "Strong and distinctive"
    gapAnalysis: string; // What's missing
    keyPriority: string; // Top thing to focus on
  };

  // All insights for this dimension (issues + strengths + opportunities)
  insights: InsightCard[];

  // Progress tracking
  completedIssues: number;
  totalIssues: number;

  // UI state
  isExpanded: boolean;
  lastUpdated?: number;
}

// ============================================================================
// PORTFOLIO CONTRIBUTION ENRICHMENT
// ============================================================================

/**
 * Enhanced insights for Portfolio Contribution tab
 * Holistic, big-picture analysis
 */
export interface PortfolioContributionInsights {
  // Overall assessment
  overallScore: number;
  tier: string; // e.g., "Exceptional", "Strong", "Solid"
  percentile: string; // e.g., "top 5-10%"

  // Strategic positioning
  positioning: {
    recommendedUse: string; // "Centerpiece", "Supporting", etc.
    narrativeStrength: string; // How strong is the storytelling
    impactCredibility: string; // How credible is the impact
    differentiationPotential: string; // How unique/memorable
  };

  // Key insights (most important things to know)
  keyInsights: {
    strengths: string[]; // Top 3-5 things working well
    criticalGaps: string[]; // Top 3-5 things missing
    biggestOpportunity: string; // Single most impactful fix
    strategicAdvice: string; // How to use this activity
  };

  // Comparative context
  comparative: {
    vsTypicalApplicant: string; // How this compares to average
    vsTopApplicants: string; // How this compares to top 10%
    competitiveAdvantage: string[]; // What makes this stand out
    competitiveWeakness: string[]; // What holds this back
  };

  // Admissions officer perspective
  officerPerspective: {
    firstImpression: string; // What they'll notice first
    credibilityAssessment: string; // Will they believe it
    memorabilityFactor: string; // Will they remember it
    flagsTriggers: string[]; // Any concerns or red flags
    positiveSignals: string[]; // What makes them excited
  };

  // Improvement roadmap
  roadmap: {
    quickWins: Array<{ action: string; impact: string; time: string }>;
    strategicMoves: Array<{ goal: string; approach: string; timeframe: string }>;
    aspirationalTarget: string; // What could this become
  };
}

/**
 * Strength insight (not just issues!)
 */
export interface StrengthInsight {
  dimension: RubricCategory;
  title: string; // e.g., "Exceptional Vulnerability & Authenticity"
  whatWorking: string; // Specific things they're doing right
  examples: string[]; // Quotes from their essay showing strength
  whyItMatters: string; // Why this is impressive
  howToAmplify: string; // How to make it even stronger
  rarityFactor: string; // How uncommon this is (e.g., "Top 10% show this")
}

/**
 * Opportunity insight (not a problem, but room for elevation)
 */
export interface OpportunityInsight {
  dimension: RubricCategory;
  title: string; // e.g., "Untapped Potential for Dialogue"
  currentState: string; // What they have now
  potentialState: string; // What it could become
  whyItMatters: string; // Why this would elevate the essay
  howToCapture: string; // Specific way to add this
  estimatedImpact: string; // Potential score gain
}

// ============================================================================
// OVERALL INSIGHTS STATE
// ============================================================================

/**
 * Complete state for insights system
 */
export interface InsightsState {
  // Score overview
  currentNQI: number;
  initialNQI: number;
  targetNQI: number;
  potentialGain: number;

  // Dimension summaries (12 dimensions)
  dimensions: DimensionSummary[];

  // All insights (flat list for filtering/sorting)
  allInsights: InsightCard[];

  // Categorized insights
  issues: InsightCard[];
  strengths: StrengthInsight[];
  opportunities: OpportunityInsight[];

  // Portfolio contribution
  portfolioInsights: PortfolioContributionInsights;

  // Filters
  filters: {
    severity: 'all' | 'critical' | 'major' | 'minor';
    dimension: RubricCategory | 'all';
    type: 'all' | 'issue' | 'strength' | 'opportunity';
    status: 'all' | 'not_started' | 'in_progress' | 'completed';
  };

  // Sort
  sortBy: 'priority' | 'score' | 'dimension' | 'impact' | 'difficulty';

  // UI state
  selectedInsight: InsightCard | null;
  showDetailView: boolean;

  // Progress tracking
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Severity calculation inputs
 */
export interface SeverityCalculation {
  dimensionScore: number; // 0-10
  dimensionWeight: number; // 0-1
  issueImpact: number; // Estimated point impact
  issueFrequency: number; // How often it occurs
  rarityInStrongEssays: number; // How rare in top essays (0-1)
}

/**
 * Example matching criteria
 */
export interface ExampleMatchCriteria {
  issueType: string;
  dimension: RubricCategory;
  activityCategory?: string;
  culturalContext?: string;
  preferredTier?: 1 | 2 | 3; // Which tier of examples to prioritize
}

/**
 * Chat prompt generation options
 */
export interface ChatPromptOptions {
  severity: 'critical' | 'major' | 'minor';
  dimension: RubricCategory;
  includeQuotes: boolean;
  includeExamples: boolean;
  tone: 'encouraging' | 'direct' | 'collaborative';
}

export default InsightCard;
