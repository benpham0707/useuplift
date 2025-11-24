/**
 * Rubric Scorer
 *
 * Applies rubric v1.0.1 to essays with full interaction rule support.
 *
 * CRITICAL FEATURES:
 * 1. Dimension scoring with evidence requirements
 * 2. Interaction rules (dependency caps, boosts, reductions)
 * 3. Rule priority ordering
 * 4. EQI calculation (weighted average → 0-100 scale)
 * 5. Impression label assignment
 * 6. Flag detection (AI-sounding, brag density, etc.)
 *
 * Integrates with:
 * - sceneDetector.ts
 * - dialogueExtractor.ts
 * - interiorityDetector.ts
 * - elitePatternDetector.ts
 */

import { ESSAY_RUBRIC_V1_0_1 as RUBRIC_V1_0_1 } from '../../rubrics/v1.0.1';
import {
  RubricDimensionScore,
  InteractionRule,
  InteractionRuleCondition,
  InteractionRuleEffect,
  ImpressionLabel
} from '../../types/rubric';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DimensionEvidence {
  /** Evidence quotes from essay */
  quotes: string[];

  /** Why this score? */
  justification: string;

  /** Specific anchors met */
  anchors_met: number[]; // Score values (0, 5, 10)
}

export interface DimensionScoreResult {
  /** Dimension name */
  dimension_name: string;

  /** Raw score (0-10) before interaction rules */
  raw_score: number;

  /** Final score (0-10) after interaction rules */
  final_score: number;

  /** Weighted score (final_score * weight) */
  weighted_score: number;

  /** Evidence supporting this score */
  evidence: DimensionEvidence;

  /** Interaction rules that affected this score */
  rules_applied: Array<{
    rule_id: string;
    rule_name: string;
    effect: 'cap_max' | 'boost' | 'reduce';
    value: number;
    reason: string;
  }>;

  /** Was score changed by rules? */
  modified_by_rules: boolean;
}

export interface RubricScoringResult {
  /** Rubric version used */
  rubric_version: string;

  /** All 12 dimension scores */
  dimension_scores: DimensionScoreResult[];

  /** Essay Quality Index (0-100) */
  essay_quality_index: number;

  /** Impression label */
  impression_label: ImpressionLabel;

  /** Flags detected */
  flags: string[];

  /** Prioritized improvement levers */
  prioritized_levers: string[];

  /** Overall assessment */
  assessment: string;
}

// ============================================================================
// RULE APPLICATION ENGINE
// ============================================================================

/**
 * Check if rule condition is satisfied
 */
function checkCondition(
  condition: InteractionRuleCondition,
  dimensionScores: Map<string, number>
): boolean {
  const score = dimensionScores.get(condition.dimension);
  if (score === undefined) return false;

  switch (condition.operator) {
    case '<':
      return score < condition.threshold;
    case '<=':
      return score <= condition.threshold;
    case '>':
      return score > condition.threshold;
    case '>=':
      return score >= condition.threshold;
    case '==':
      return score === condition.threshold;
    default:
      return false;
  }
}

/**
 * Check if rule should be applied
 */
function shouldApplyRule(
  rule: InteractionRule,
  dimensionScores: Map<string, number>
): boolean {
  // All conditions must be satisfied
  return rule.conditions.every(condition => checkCondition(condition, dimensionScores));
}

/**
 * Apply interaction rule effect
 */
function applyEffect(
  effect: InteractionRuleEffect,
  currentScore: number
): number {
  switch (effect.action) {
    case 'cap_max':
      return Math.min(currentScore, effect.value);

    case 'boost':
      return Math.min(10, currentScore + effect.value);

    case 'reduce':
      return Math.max(0, currentScore - effect.value);

    default:
      return currentScore;
  }
}

/**
 * Apply all interaction rules in priority order
 *
 * Rules are sorted by priority (higher = applied first)
 */
function applyInteractionRules(
  rawScores: Map<string, number>,
  rules: InteractionRule[]
): {
  finalScores: Map<string, number>;
  rulesApplied: Map<string, Array<{
    rule_id: string;
    rule_name: string;
    effect: InteractionRuleEffect['action'];
    value: number;
    reason: string;
  }>>;
} {
  // Sort rules by priority (descending)
  const sortedRules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // Start with raw scores
  const finalScores = new Map(rawScores);
  const rulesApplied = new Map<string, Array<any>>();

  // Apply each rule
  for (const rule of sortedRules) {
    if (shouldApplyRule(rule, finalScores)) {
      for (const effect of rule.effects) {
        const currentScore = finalScores.get(effect.dimension) || 0;
        const newScore = applyEffect(effect, currentScore);

        // Only record if score changed
        if (newScore !== currentScore) {
          finalScores.set(effect.dimension, newScore);

          // Track applied rule
          if (!rulesApplied.has(effect.dimension)) {
            rulesApplied.set(effect.dimension, []);
          }

          rulesApplied.get(effect.dimension)!.push({
            rule_id: rule.rule_id,
            rule_name: rule.name,
            effect: effect.action,
            value: effect.value,
            reason: effect.reason || rule.description || ''
          });
        }
      }
    }
  }

  return { finalScores, rulesApplied };
}

// ============================================================================
// SCORING HELPERS
// ============================================================================

/**
 * Calculate EQI from dimension scores
 *
 * EQI = Σ(final_score * weight) * 10
 */
function calculateEQI(dimensionScores: DimensionScoreResult[]): number {
  let weightedSum = dimensionScores.reduce(
    (sum, dim) => sum + dim.weighted_score,
    0
  );
  
  // ADJUSTMENT: Normalize scores. 
  // The previous model was overly harsh. We are shifting the curve slightly.
  // If raw sum suggests ~40-45, we want to push towards ~50-55 range for competent essays.
  // We'll add a small baseline boost for completion/coherence if not already high.
  
  let eqi = weightedSum * 10;
  
  // Curve adjustment: Boost scores in the 30-60 range to be more encouraging
  if (eqi > 30 && eqi < 60) {
      eqi += 5; // +5 point bump for competent but flawed essays
  }

  return Math.min(100, Math.round(eqi * 10) / 10); // Cap at 100, round to 1 decimal
}

/**
 * Get impression label for EQI score
 */
function getImpressionLabel(eqi: number): ImpressionLabel {
  const labels = RUBRIC_V1_0_1.impression_labels;

  for (const label of labels) {
    if (eqi >= label.eqi_min && eqi <= label.eqi_max) {
      return label.label;
    }
  }

  // Fallback (should never reach here)
  return 'template_like_rebuild';
}

/**
 * Detect flags based on scores and patterns
 */
function detectFlags(
  dimensionScores: DimensionScoreResult[],
  essayText: string
): string[] {
  const flags: string[] = [];

  // Get scores by name
  const scoreMap = new Map(
    dimensionScores.map(d => [d.dimension_name, d.final_score])
  );

  // Flag: AI-sounding (low craft + low vulnerability)
  const craft = scoreMap.get('show_dont_tell_craft') || 0;
  const vulnerability = scoreMap.get('character_interiority_vulnerability') || 0;
  const voice = scoreMap.get('originality_specificity_voice') || 0;

  if (craft < 5 && vulnerability < 4 && voice < 5) {
    flags.push('ai_sounding_pattern');
  }

  // Flag: Brag density (high achievement, low humility)
  const humility = scoreMap.get('ethical_awareness_humility') || 0;
  const context = scoreMap.get('context_constraints_disclosure') || 0;

  if (humility < 4 && context < 5) {
    // Check for achievement markers
    const achievementMarkers = [
      'won', 'first place', 'award', 'champion', 'top', 'best', 'president',
      'founded', 'started', 'led', 'managed', 'organized'
    ];
    const achievementCount = achievementMarkers.filter(
      marker => essayText.toLowerCase().includes(marker)
    ).length;

    if (achievementCount >= 3) {
      flags.push('high_brag_density');
    }
  }

  // Flag: No scene (critical deficiency)
  const scene = scoreMap.get('show_dont_tell_craft') || 0;
  if (scene < 4) {
    flags.push('missing_scene_critical');
  }

  // Flag: No vulnerability (68% of elite essays have this)
  if (vulnerability < 5) {
    flags.push('missing_vulnerability_elite_pattern');
  }

  // Flag: Weak opening
  const opening = scoreMap.get('opening_power_scene_entry') || 0;
  if (opening < 4) {
    flags.push('weak_opening_loses_reader');
  }

  // Flag: All tell, no show
  const dialogue = scoreMap.get('dialogue_action_texture') || 0;
  if (scene < 5 && dialogue < 4) {
    flags.push('all_tell_no_show');
  }

  // Flag: Generic (low originality + low specificity)
  if (voice < 5 && context < 5) {
    flags.push('generic_lacks_specificity');
  }

  return flags;
}

/**
 * Generate prioritized improvement levers
 *
 * These are ordered by:
 * 1. Highest weight dimensions with lowest scores
 * 2. Critical deficiencies (scene, vulnerability)
 * 3. Quick wins (high impact, easier fixes)
 */
function generatePrioritizedLevers(
  dimensionScores: DimensionScoreResult[]
): string[] {
  const levers: Array<{ lever: string; priority: number }> = [];

  // Calculate impact score (weight * gap from 10)
  dimensionScores.forEach(dim => {
    const dimension = RUBRIC_V1_0_1.dimensions.find(d => d.name === dim.dimension_name);
    if (!dimension) return;

    const gap = 10 - dim.final_score;
    const impact = dimension.weight * gap;

    // Only include if gap >= 2 and score < 8
    if (gap >= 2 && dim.final_score < 8) {
      levers.push({
        lever: `Improve ${dimension.display_name} (current: ${dim.final_score}/10, weight: ${Math.round(dimension.weight * 100)}%)`,
        priority: impact
      });
    }
  });

  // Sort by priority (descending)
  levers.sort((a, b) => b.priority - a.priority);

  // Return top 5 levers
  return levers.slice(0, 5).map(l => l.lever);
}

/**
 * Generate overall assessment
 */
function generateAssessment(
  eqi: number,
  impressionLabel: ImpressionLabel,
  flags: string[]
): string {
  const labelDescriptions: Record<ImpressionLabel, string> = {
    arresting_deeply_human: 'This essay stops the reader on the page with its authenticity and unique insight.',
    compelling_clear_voice: 'Strong narrative craft and distinct voice make this compelling.',
    competent_needs_texture: 'Competent and readable, but needs more scene, stakes, or reflection depth.',
    readable_but_generic: 'Coherent but lacks the specificity, vulnerability, or narrative arc of elite essays.',
    template_like_rebuild: 'Requires significant rebuild to meet quality standards.'
  };

  const lines: string[] = [];

  lines.push(`EQI: ${eqi}/100 — ${labelDescriptions[impressionLabel]}`);

  if (flags.length > 0) {
    lines.push('');
    lines.push('Critical Issues:');
    flags.forEach(flag => {
      const flagDescriptions: Record<string, string> = {
        ai_sounding_pattern: 'Essay has AI-sounding pattern (low craft + vulnerability + voice)',
        high_brag_density: 'High achievement density without humility or context',
        missing_scene_critical: 'No concrete scene (critical deficiency)',
        missing_vulnerability_elite_pattern: '68% of elite essays show vulnerability - this lacks it',
        weak_opening_loses_reader: 'Weak opening reduces reader generosity to rest of essay',
        all_tell_no_show: 'All abstract telling, no showing through scene or dialogue',
        generic_lacks_specificity: 'Generic - needs unique details and authentic voice'
      };

      lines.push(`- ${flagDescriptions[flag] || flag}`);
    });
  }

  return lines.join('\n');
}

// ============================================================================
// MAIN SCORER
// ============================================================================

/**
 * Score essay using rubric v1.0.1 with full interaction rules
 *
 * @param dimensionRawScores - Raw scores (0-10) for each dimension with evidence
 * @param essayText - Full essay text for flag detection
 * @returns Complete scoring result
 */
export function scoreWithRubric(
  dimensionRawScores: Array<{
    dimension_name: string;
    score: number;
    evidence: DimensionEvidence;
  }>,
  essayText: string
): RubricScoringResult {
  // Build raw score map
  const rawScoreMap = new Map(
    dimensionRawScores.map(d => [d.dimension_name, d.score])
  );

  // Apply interaction rules
  const { finalScores, rulesApplied } = applyInteractionRules(
    rawScoreMap,
    RUBRIC_V1_0_1.interaction_rules
  );

  // Build dimension score results
  const dimension_scores: DimensionScoreResult[] = dimensionRawScores.map(rawDim => {
    const dimension = RUBRIC_V1_0_1.dimensions.find(d => d.name === rawDim.dimension_name);
    if (!dimension) {
      throw new Error(`Unknown dimension: ${rawDim.dimension_name}`);
    }

    const raw_score = rawDim.score;
    const final_score = finalScores.get(rawDim.dimension_name) || raw_score;
    const weighted_score = final_score * dimension.weight;

    const rules_applied = rulesApplied.get(rawDim.dimension_name) || [];
    const modified_by_rules = rules_applied.length > 0;

    return {
      dimension_name: rawDim.dimension_name,
      raw_score,
      final_score,
      weighted_score,
      evidence: rawDim.evidence,
      rules_applied,
      modified_by_rules
    };
  });

  // Calculate EQI
  const essay_quality_index = calculateEQI(dimension_scores);

  // Get impression label
  const impression_label = getImpressionLabel(essay_quality_index);

  // Detect flags
  const flags = detectFlags(dimension_scores, essayText);

  // Generate levers
  const prioritized_levers = generatePrioritizedLevers(dimension_scores);

  // Generate assessment
  const assessment = generateAssessment(essay_quality_index, impression_label, flags);

  return {
    rubric_version: 'v1.0.1',
    dimension_scores,
    essay_quality_index,
    impression_label,
    flags,
    prioritized_levers,
    assessment
  };
}

/**
 * Get scoring summary for quick inspection
 */
export function getScoringSummary(result: RubricScoringResult): string {
  const lines: string[] = [];

  lines.push(`📊 RUBRIC SCORING (${result.rubric_version})`);
  lines.push(`EQI: ${result.essay_quality_index}/100`);
  lines.push(`Impression: ${result.impression_label}`);
  lines.push(``);

  lines.push(`📈 DIMENSION SCORES:`);
  result.dimension_scores.forEach(dim => {
    const dimension = RUBRIC_V1_0_1.dimensions.find(d => d.name === dim.dimension_name);
    const emoji = dim.final_score >= 8 ? '✅' : dim.final_score >= 6 ? '⚠️' : '❌';
    const weight = dimension ? `${Math.round(dimension.weight * 100)}%` : '';

    let line = `  ${emoji} ${dimension?.display_name || dim.dimension_name}: ${dim.final_score}/10 (${weight})`;

    if (dim.modified_by_rules) {
      line += ` [Modified: ${dim.raw_score} → ${dim.final_score}]`;
    }

    lines.push(line);
  });

  if (result.flags.length > 0) {
    lines.push(``);
    lines.push(`🚩 FLAGS (${result.flags.length}):`);
    result.flags.forEach(flag => {
      lines.push(`  - ${flag}`);
    });
  }

  if (result.prioritized_levers.length > 0) {
    lines.push(``);
    lines.push(`🎯 TOP IMPROVEMENT LEVERS:`);
    result.prioritized_levers.forEach((lever, i) => {
      lines.push(`  ${i + 1}. ${lever}`);
    });
  }

  lines.push(``);
  lines.push(`💬 ASSESSMENT:`);
  lines.push(result.assessment.split('\n').map(l => `  ${l}`).join('\n'));

  return lines.join('\n');
}

/**
 * Helper: Create dimension evidence from quotes and justification
 */
export function createEvidence(
  quotes: string[],
  justification: string,
  anchors_met: number[] = []
): DimensionEvidence {
  return {
    quotes,
    justification,
    anchors_met
  };
}

/**
 * Helper: Get dimension definition by name
 */
export function getDimensionDefinition(dimensionName: string) {
  return RUBRIC_V1_0_1.dimensions.find(d => d.name === dimensionName);
}

/**
 * Helper: Get all dimension names
 */
export function getAllDimensionNames(): string[] {
  return RUBRIC_V1_0_1.dimensions.map(d => d.name);
}

/**
 * Helper: Validate dimension scores
 */
export function validateDimensionScores(
  scores: Array<{ dimension_name: string; score: number }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check all dimensions present
  const allDimensions = getAllDimensionNames();
  const providedDimensions = scores.map(s => s.dimension_name);

  const missing = allDimensions.filter(d => !providedDimensions.includes(d));
  if (missing.length > 0) {
    errors.push(`Missing dimensions: ${missing.join(', ')}`);
  }

  // Check score ranges
  scores.forEach(s => {
    if (s.score < 0 || s.score > 10) {
      errors.push(`${s.dimension_name}: score ${s.score} out of range [0, 10]`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
