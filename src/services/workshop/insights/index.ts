/**
 * Comprehensive Insights System - Main Export
 *
 * This is the primary entry point for the insights system.
 * Import from here to access all insights functionality.
 *
 * Example usage:
 * ```typescript
 * import { generateCompleteInsights } from '@/services/workshop/insights';
 *
 * const insights = generateCompleteInsights(coachingOutput, draftText);
 * ```
 */

// Main orchestrator
export { generateCompleteInsights } from '../insightsAggregator';

// Type definitions
export type {
  InsightCard,
  DraftQuote,
  PointImpact,
  PatternAnalysis,
  ComparativeExample,
  Annotation,
  SolutionApproach,
  FocusModeContext,
  DimensionSummary,
  StrengthInsight,
  OpportunityInsight,
  PortfolioContributionInsights,
  InsightsState,
  SeverityCalculation,
  ExampleMatchCriteria,
  ChatPromptOptions,
} from '../insightTypes';

// Pattern detection
export { PATTERN_GROUPS, getPatternsForDimension, getPatternById } from '../issuePatterns';
export type { IssuePattern, PatternGroup } from '../issuePatterns';

// Transformation utilities
export {
  transformIssueToInsight,
  extractQuotesFromDraft,
  generatePatternAnalysis,
  calculateDynamicSeverity,
  calculatePointImpact,
  matchComparativeExamples,
  generateSolutionApproaches,
  generateChatPrompt,
} from '../insightsTransformer';

// Strength & opportunity detection
export { detectStrengths, detectOpportunities } from '../strengthOpportunityDetector';

// Dimension grouping & portfolio insights
export {
  groupInsightsByDimension,
  generatePortfolioContributionInsights,
  calculateTargetNQI,
  calculatePotentialGain,
} from '../insightsAggregator';
