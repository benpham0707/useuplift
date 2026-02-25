/**
 * Prompt Enrichment Formatter
 *
 * Formats PreAnalysisResult into token-budgeted XML blocks for injection
 * into workshop LLM prompts. Each workshop type has a specific formatter
 * tuned for relevance and token budget.
 *
 * IMPORTANT: Enrichment blocks are injected AFTER cached prompt sections
 * to preserve Anthropic prompt caching.
 *
 * Token budgets (approximate):
 * - Common App: ~120 tokens
 * - PIQ: ~110 tokens
 * - Activity Description (Stage 0): ~70 tokens
 * - Activity Scoring: ~85 tokens
 */

import type { PreAnalysisResult, EnrichmentBlock, WritingEngineConfig } from './types';
import { DEFAULT_WRITING_ENGINE_CONFIG } from './types';

// ============================================================================
// FORMATTERS
// ============================================================================

/**
 * Format enrichment for Common App Workshop Stage 1.
 * Includes all signals — essay length justifies full context.
 */
export function formatForCommonApp(result: PreAnalysisResult): EnrichmentBlock {
  const lines: string[] = [
    '<writing_signals>',
    `Register: ${result.register.primaryRegister} (${result.register.formalityScore.toFixed(2)})${formatShiftsSummary(result)}`,
    `Compression: ${result.compression.overallRatio.toFixed(2)} (uniqueness: ${result.compression.uniquenessScore.toFixed(1)}/10)`,
    `AI Risk: ${result.aiDetection.riskLevel} (burstiness=${result.aiDetection.signalSummary.burstiness.toFixed(2)}, vocab_uniformity=${result.aiDetection.signalSummary.vocabularyUniformity.toFixed(2)})`,
    `Stats: ${result.textStats.wordCount} words, ${result.textStats.sentenceCount} sentences, avg ${result.textStats.avgSentenceLength} words/sentence, vocabulary richness ${result.textStats.vocabularyRichness.toFixed(2)}`,
    `Consistency: ${result.register.internalConsistency.toFixed(2)}`,
    '</writing_signals>',
  ];

  const content = lines.join('\n');
  return {
    content,
    estimatedTokens: estimateTokens(content),
    workshopType: 'common_app',
  };
}

/**
 * Format enrichment for PIQ Workshop.
 * Similar to Common App but slightly shorter (PIQs are 350 words max).
 */
export function formatForPIQ(result: PreAnalysisResult): EnrichmentBlock {
  const lines: string[] = [
    '<writing_signals>',
    `Register: ${result.register.primaryRegister} (${result.register.formalityScore.toFixed(2)})${formatShiftsSummary(result)}`,
    `Compression: ${result.compression.overallRatio.toFixed(2)} (uniqueness: ${result.compression.uniquenessScore.toFixed(1)}/10)`,
    `AI Risk: ${result.aiDetection.riskLevel} (burstiness=${result.aiDetection.signalSummary.burstiness.toFixed(2)})`,
    `Stats: ${result.textStats.wordCount} words, ${result.textStats.sentenceCount} sentences, richness ${result.textStats.vocabularyRichness.toFixed(2)}`,
    '</writing_signals>',
  ];

  const content = lines.join('\n');
  return {
    content,
    estimatedTokens: estimateTokens(content),
    workshopType: 'piq',
  };
}

/**
 * Format enrichment for Activity Workshop Stage 0 (Story Extraction).
 * Minimal — just enough context for Haiku to make better extraction decisions.
 */
export function formatForActivityDescription(result: PreAnalysisResult): EnrichmentBlock {
  const lines: string[] = [
    '<writing_signals>',
    `Register: ${result.register.primaryRegister} (${result.register.formalityScore.toFixed(2)})`,
    `AI Risk: ${result.aiDetection.riskLevel}`,
    `Stats: ${result.textStats.wordCount} words, richness ${result.textStats.vocabularyRichness.toFixed(2)}`,
    '</writing_signals>',
  ];

  const content = lines.join('\n');
  return {
    content,
    estimatedTokens: estimateTokens(content),
    workshopType: 'activity_description',
  };
}

/**
 * Format enrichment for Activity Workshop Description Scoring.
 * Includes scoring-relevant signals for Sonnet to calibrate scores.
 */
export function formatForActivityScoring(result: PreAnalysisResult): EnrichmentBlock {
  const lines: string[] = [
    '<writing_signals>',
    `Register: ${result.register.primaryRegister} (${result.register.formalityScore.toFixed(2)})`,
    `Compression: ${result.compression.overallRatio.toFixed(2)} (uniqueness: ${result.compression.uniquenessScore.toFixed(1)}/10)`,
    `AI Risk: ${result.aiDetection.riskLevel} (burstiness=${result.aiDetection.signalSummary.burstiness.toFixed(2)}, vocab_uniformity=${result.aiDetection.signalSummary.vocabularyUniformity.toFixed(2)})`,
    `Stats: ${result.textStats.wordCount} words, avg ${result.textStats.avgSentenceLength} words/sentence`,
    '</writing_signals>',
  ];

  const content = lines.join('\n');
  return {
    content,
    estimatedTokens: estimateTokens(content),
    workshopType: 'activity_scoring',
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format register shifts into a brief summary.
 */
function formatShiftsSummary(result: PreAnalysisResult): string {
  const shifts = result.register.registerShifts;
  if (shifts.length === 0) return '';

  const shiftIndices = shifts
    .slice(0, 3) // max 3 shifts to report
    .map(s => s.sentenceIndex)
    .join(',');

  return `, ${shifts.length} register shift${shifts.length > 1 ? 's' : ''} at sentence${shifts.length > 1 ? 's' : ''} ${shiftIndices}`;
}

/**
 * Rough token estimate: ~4 characters per token for English text.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Check if an enrichment block exceeds its budget.
 */
export function isWithinBudget(
  block: EnrichmentBlock,
  config: WritingEngineConfig = DEFAULT_WRITING_ENGINE_CONFIG
): boolean {
  const budget = config.tokenBudgets[block.workshopType];
  return block.estimatedTokens <= budget;
}
