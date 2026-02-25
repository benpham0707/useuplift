/**
 * Writing Analytics Types
 * Phase 4 implementation — feedback loops and effectiveness tracking
 */

import type { EditingCommand } from '../inlineEditor/types';

/** Analytics event for tracking writing improvements */
export interface WritingAnalyticsEvent {
  id: string;
  userId: string;
  sessionId: string;
  eventType: 'suggestion_shown' | 'suggestion_accepted' | 'suggestion_rejected' | 'score_change' | 'inline_edit' | 'command_used' | 'pre_analysis_run';
  eventData: Record<string, unknown>;
  createdAt: string;
}

/** Aggregated prompt effectiveness metrics */
export interface PromptEffectiveness {
  id: string;
  promptHash: string;
  promptType: 'suggestion' | 'inline_edit' | 'teaching';
  workshop: 'common_app' | 'piq' | 'activity';
  totalShown: number;
  totalAccepted: number;
  avgScoreImprovement: number;
  avgSatisfaction: number;
  lastUpdated: string;
}

/** Comparison between two versions of an essay */
export interface VersionComparison {
  scoreDelta: Record<string, number>;
  overallDelta: number;
  improvements: string[];
  regressions: string[];
  unchanged: string[];
  editCount: number;
  mostImpactfulEdit: string;
}

/** Data about a suggestion for analytics tracking */
export interface SuggestionData {
  suggestionId: string;
  workshop: string;
  dimension?: string;
  promptHash?: string;
  generatedText: string;
  context?: Record<string, unknown>;
}

/** Date range for analytics queries */
export interface DateRange {
  start: string;
  end: string;
}
