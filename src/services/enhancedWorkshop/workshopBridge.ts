/**
 * Workshop Bridge — Connects the new workshop scoring system to the
 * existing enhanced workshop pipeline.
 *
 * Provides:
 * 1. ScoringResult → EssaySnapshot conversion
 * 2. New 13-dim weights + commands for the improvement planner
 * 3. Essay profile context injection for LLM planning prompts
 *
 * Feature-flagged: Only active when useNewScoringPipeline=true
 */

// Import new workshop system (triggers self-registration of all dimensions, commands, profiles)
import '../../workshop/essay-profiles';
import '../../workshop/dimensions/narrative-craft.dim';
import '../../workshop/dimensions/emotional-resonance.dim';
import '../../workshop/dimensions/intellectual-vitality.dim';
import '../../workshop/dimensions/originality-voice.dim';
import '../../workshop/dimensions/structural-coherence.dim';
import '../../workshop/dimensions/word-economy.dim';
import '../../workshop/dimensions/thematic-depth.dim';
import '../../workshop/dimensions/opening-hook.dim';
import '../../workshop/dimensions/closing-impact.dim';
import '../../workshop/dimensions/growth-transformation.dim';
import '../../workshop/dimensions/authenticity-specificity.dim';
import '../../workshop/dimensions/tonal-sophistication.dim';
import '../../workshop/dimensions/argument-rhetorical.dim';

import { hybridScoringPipeline } from '../../workshop/scoring/hybridScoringPipeline';
import { dimensionRegistry } from '../../workshop/registry/dimensionRegistry';
import { commandRegistry } from '../../workshop/registry/commandRegistry';
import { essayProfileRegistry } from '../../workshop/registry/essayProfileRegistry';
import { strategySelector } from '../../workshop/orchestrator/strategySelector';
import type { ScoringResult, WorkshopEssayType } from '../../workshop/shared/types';
import type { EssaySnapshot } from './types';

// ============================================================================
// SCORING RESULT → ESSAY SNAPSHOT
// ============================================================================

/**
 * Convert a new-system ScoringResult (0-100 scores) to the EssaySnapshot
 * format used by the existing enhanced workshop pipeline (0-10 scores).
 */
export function scoringResultToSnapshot(
  text: string,
  result: ScoringResult
): EssaySnapshot {
  // Convert 0-100 dimension scores to 0-10 scale for backward compatibility
  const dimensionScores: Record<string, number> = {};
  for (const ds of result.dimensionScores) {
    dimensionScores[ds.dimensionId] = Math.round(ds.score / 10 * 10) / 10; // 0-10, 1 decimal
  }

  // Find weakest 3 dimensions
  const sorted = [...result.dimensionScores].sort((a, b) => a.score - b.score);
  const weakestDimensions = sorted.slice(0, 3).map(d => d.dimensionId);

  // Build flags from evidence
  const flags: string[] = [];
  for (const ds of result.dimensionScores) {
    if (ds.score < 25) {
      flags.push(`Very weak: ${ds.dimensionId}`);
    }
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    text,
    wordCount,
    eqi: result.eqi,
    dimensionScores,
    impressionLabel: result.impressionLabel,
    weakestDimensions,
    flags,
  };
}

// ============================================================================
// NEW PIPELINE PRE-ANALYZE
// ============================================================================

/**
 * Pre-analyze essay text using the new 13-dimension hybrid scoring pipeline.
 *
 * Uses heuristic-only mode for speed (no LLM calls, ~2ms).
 * Returns EssaySnapshot compatible with existing enhanced workshop system.
 *
 * @param text - Full essay text
 * @param essayType - Optional essay type for profile-aware scoring
 */
export function preAnalyzeWithNewPipeline(
  text: string,
  essayType?: string
): EssaySnapshot {
  const workshopEssayType = essayType as WorkshopEssayType | undefined;
  const result = hybridScoringPipeline.scoreHeuristicOnly(text, workshopEssayType);
  return scoringResultToSnapshot(text, result);
}

/**
 * Full analysis using the new pipeline (with selective LLM calls).
 * More accurate but costs ~$0.012-0.022 and takes ~2-3s.
 */
export async function fullAnalyzeWithNewPipeline(
  text: string,
  essayType?: string
): Promise<EssaySnapshot> {
  const result = await hybridScoringPipeline.score(text, {
    essayType: essayType as WorkshopEssayType,
  });
  return scoringResultToSnapshot(text, result);
}

// ============================================================================
// NEW DIMENSION WEIGHTS
// ============================================================================

/**
 * Get the 13-dimension rubric weights from the dimension registry.
 * Returns in the Record<string, number> format the planner expects.
 */
export function getNewRubricWeights(): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const dim of dimensionRegistry.getAll()) {
    weights[dim.id] = dim.weight;
  }
  return weights;
}

// ============================================================================
// NEW VALID COMMANDS
// ============================================================================

/**
 * Get all valid editing commands from both the old system and the new registry.
 * Returns a Set of command ID strings.
 */
export function getExpandedValidCommands(): ReadonlySet<string> {
  const commands = new Set<string>();

  // Old 15 commands (always valid)
  const oldCommands = [
    'make_concrete', 'show_dont_tell', 'clarify_learning', 'add_stakes',
    'strengthen_voice', 'cut_filler', 'add_evidence', 'deepen_vulnerability',
    'connect_to_theme', 'fix_hook', 'sharpen_ending', 'expand_moment',
    'compress', 'add_dialogue', 'remove_cliche',
  ];
  for (const cmd of oldCommands) {
    commands.add(cmd);
  }

  // New commands from the registry
  for (const cmd of commandRegistry.getAll()) {
    commands.add(cmd.id);
  }

  return commands;
}

// ============================================================================
// PROFILE-AWARE CONTEXT
// ============================================================================

/**
 * Build profile-aware context for the LLM planning prompt.
 * Returns an addendum string to inject into the planning prompt,
 * or empty string if no profile exists.
 */
export function buildProfileContext(essayType?: string): string {
  if (!essayType) return '';

  const profile = essayProfileRegistry.getProfile(essayType as WorkshopEssayType);
  if (!profile) return '';

  const parts: string[] = [];

  // Anti-patterns
  if (profile.antiPatterns.length > 0) {
    parts.push('## Common Mistakes for This Essay Type');
    parts.push('Watch for these anti-patterns and flag them if detected:');
    for (const ap of profile.antiPatterns) {
      parts.push(`- ${ap}`);
    }
  }

  // Preferred command ordering
  if (profile.preferredCommands.length > 0) {
    parts.push('');
    parts.push('## Preferred Commands for This Essay Type');
    parts.push(`Prioritize these commands (in order): ${profile.preferredCommands.slice(0, 8).join(', ')}`);
  }

  // Teaching tone
  if (profile.teachingTone) {
    parts.push('');
    parts.push('## Teaching Tone');
    parts.push(`Formality: ${profile.teachingTone.formality}, Encouragement: ${profile.teachingTone.encouragement}, Directness: ${profile.teachingTone.directness}`);
  }

  return parts.join('\n');
}

// ============================================================================
// STRATEGY RECOMMENDATIONS
// ============================================================================

/**
 * Get strategy recommendations for an essay type.
 * Wraps the strategy selector for easy access from the enhanced workshop.
 */
export function getStrategyRecommendations(
  essayType: string,
  scoringResult?: ScoringResult
) {
  return strategySelector.selectStrategies(essayType as WorkshopEssayType, scoringResult);
}

// ============================================================================
// SINGLETON
// ============================================================================

export const workshopBridge = {
  preAnalyzeWithNewPipeline,
  fullAnalyzeWithNewPipeline,
  scoringResultToSnapshot,
  getNewRubricWeights,
  getExpandedValidCommands,
  buildProfileContext,
  getStrategyRecommendations,
};
