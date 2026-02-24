/**
 * Constraint Satisfaction for Score Coherence
 *
 * Defines and enforces logical constraints between rubric dimensions.
 * After LLM scoring, runs a constraint solver to detect violations and
 * either adjust scores or flag them for re-evaluation.
 *
 * The key insight: certain score combinations are logically impossible.
 * If a student scores 2/10 on voice_integrity, it's nearly impossible
 * for them to simultaneously score 9/10 on emotional_resonance, because
 * authentic emotion requires authentic voice.
 *
 * This module encodes these relationships as hard and soft constraints,
 * then propagates adjustments when violations are detected.
 *
 * PIPELINE POSITION: Post-LLM scoring, post-IRT, pre-final-report
 * PERFORMANCE: < 1ms (constraint checking is O(n*m) where n=dimensions, m=constraints)
 *
 * ACCURACY IMPROVEMENT: Catches logically impossible score combinations
 * that neither IRT nor Bayesian updating would flag. For example, IRT
 * would see high-craft-low-voice as anomalous relative to a single
 * theta, but constraint satisfaction captures the specific LOGICAL
 * relationship (voice precedes emotional authenticity).
 */

import {
  DimensionConstraint,
  ConstraintCheckResult,
} from './types';

// ============================================================================
// EXPERIENCE RUBRIC CONSTRAINTS
// ============================================================================

/**
 * Logical constraints for the 11-category experience rubric.
 *
 * These constraints encode domain knowledge about how rubric dimensions
 * relate to each other. They complement the rubric's existing "interaction
 * rules" but operate at a finer granularity and can handle multi-way
 * dependencies.
 *
 * CONSTRAINT TAXONOMY:
 * - Prerequisite constraints: X < threshold → Y can't exceed max
 * - Amplification constraints: X > threshold → Y gets a boost
 * - Mutual exclusion: X high and Y high is implausible
 */
export const EXPERIENCE_CONSTRAINTS: DimensionConstraint[] = [
  // ── Voice-dependent constraints ──────────────────────────────────
  {
    id: 'voice_caps_craft',
    description: 'Without authentic voice, craft quality has limited ceiling',
    antecedent_dimension: 'voice_integrity',
    antecedent_condition: '<',
    antecedent_threshold: 4,
    consequent_dimension: 'craft_language_quality',
    consequent_max: 7,
    severity: 'soft',
    rationale: 'Beautiful writing without authentic voice reads as performative, not genuine craft.',
  },
  {
    id: 'voice_caps_reflection',
    description: 'Deep reflection requires authentic voice to be credible',
    antecedent_dimension: 'voice_integrity',
    antecedent_condition: '<',
    antecedent_threshold: 3,
    consequent_dimension: 'reflection_meaning',
    consequent_max: 6,
    severity: 'hard',
    rationale: 'Canned reflection in inauthentic voice is fundamentally not reflective.',
  },

  // ── Evidence-dependent constraints ───────────────────────────────
  {
    id: 'evidence_caps_impact',
    description: 'Transformative impact claims require evidentiary support',
    antecedent_dimension: 'specificity_evidence',
    antecedent_condition: '<',
    antecedent_threshold: 3,
    consequent_dimension: 'transformative_impact',
    consequent_max: 5,
    severity: 'hard',
    rationale: 'Claims of transformation without specific evidence are unverifiable.',
  },
  {
    id: 'evidence_caps_narrative',
    description: 'Narrative arc needs specifics to create stakes',
    antecedent_dimension: 'specificity_evidence',
    antecedent_condition: '<',
    antecedent_threshold: 3,
    consequent_dimension: 'narrative_arc_stakes',
    consequent_max: 6,
    severity: 'soft',
    rationale: 'Abstract narratives without specifics feel like fiction, not lived experience.',
  },
  {
    id: 'evidence_caps_role',
    description: 'Role clarity needs concrete evidence of contributions',
    antecedent_dimension: 'specificity_evidence',
    antecedent_condition: '<',
    antecedent_threshold: 3,
    consequent_dimension: 'role_clarity_ownership',
    consequent_max: 6,
    severity: 'soft',
    rationale: 'Claimed ownership without evidence is title-dropping.',
  },

  // ── Narrative-dependent constraints ──────────────────────────────
  {
    id: 'narrative_caps_reflection',
    description: 'Deep reflection needs narrative grounding',
    antecedent_dimension: 'narrative_arc_stakes',
    antecedent_condition: '<',
    antecedent_threshold: 4,
    consequent_dimension: 'reflection_meaning',
    consequent_max: 7,
    severity: 'soft',
    rationale: 'Reflection without narrative feels unanchored — where did the insight come from?',
  },

  // ── Structure-dependent constraints ──────────────────────────────
  {
    id: 'no_structure_caps_reflection',
    description: 'Coherent reflection requires structural coherence',
    antecedent_dimension: 'craft_language_quality',
    antecedent_condition: '<',
    antecedent_threshold: 3,
    consequent_dimension: 'reflection_meaning',
    consequent_max: 7,
    severity: 'soft',
    rationale: 'If the writing is incoherent, claimed depth of reflection is undermined.',
  },

  // ── Collaboration-leadership tension ─────────────────────────────
  {
    id: 'no_collab_caps_leadership_high',
    description: 'Extreme leadership claims without collaboration signal fragility',
    antecedent_dimension: 'community_collaboration',
    antecedent_condition: '<',
    antecedent_threshold: 3,
    consequent_dimension: 'initiative_leadership',
    consequent_max: 8,
    severity: 'soft',
    rationale: 'Command-style leadership without collaboration suggests incomplete picture.',
  },

  // ── Time investment and fit ──────────────────────────────────────
  {
    id: 'no_time_caps_fit',
    description: 'Trajectory claims need evidence of sustained engagement',
    antecedent_dimension: 'time_investment_consistency',
    antecedent_condition: '<',
    antecedent_threshold: 3,
    consequent_dimension: 'fit_trajectory',
    consequent_max: 6,
    severity: 'soft',
    rationale: 'Claiming trajectory from a one-off experience lacks credibility.',
  },

  // ── Impact and reflection mutual requirement ─────────────────────
  {
    id: 'impact_needs_reflection',
    description: 'High impact claims need reflective awareness',
    antecedent_dimension: 'reflection_meaning',
    antecedent_condition: '<',
    antecedent_threshold: 3,
    consequent_dimension: 'transformative_impact',
    consequent_max: 6,
    severity: 'soft',
    rationale: 'Claiming transformation without reflecting on it suggests lack of self-awareness.',
  },
];

/**
 * Logical constraints for the 12-dimension essay rubric.
 */
export const ESSAY_CONSTRAINTS: DimensionConstraint[] = [
  {
    id: 'scene_caps_reflection',
    description: 'Deep reflection requires grounding in a lived scene',
    antecedent_dimension: 'show_dont_tell_craft',
    antecedent_condition: '<',
    antecedent_threshold: 5,
    consequent_dimension: 'reflection_meaning_making',
    consequent_max: 8,
    severity: 'hard',
    rationale: 'Reflection without concrete scene reads as platitude, not insight.',
  },
  {
    id: 'voice_caps_interiority',
    description: 'Authentic interiority requires authentic voice',
    antecedent_dimension: 'originality_specificity_voice',
    antecedent_condition: '<',
    antecedent_threshold: 4,
    consequent_dimension: 'character_interiority_vulnerability',
    consequent_max: 7,
    severity: 'soft',
    rationale: 'Generic voice can\'t convincingly convey specific inner experience.',
  },
  {
    id: 'vulnerability_requires_interiority',
    description: 'Vulnerability score can\'t exceed interiority',
    antecedent_dimension: 'character_interiority_vulnerability',
    antecedent_condition: '<',
    antecedent_threshold: 5,
    consequent_dimension: 'ethical_awareness_humility',
    consequent_max: 7,
    severity: 'soft',
    rationale: 'True humility requires the inner awareness that interiority demonstrates.',
  },
  {
    id: 'opening_caps_structure',
    description: 'Weak opening limits structural impression',
    antecedent_dimension: 'opening_power_scene_entry',
    antecedent_condition: '<',
    antecedent_threshold: 3,
    consequent_dimension: 'structure_pacing_coherence',
    consequent_max: 7,
    severity: 'soft',
    rationale: 'Reader who isn\'t hooked by opening judges structure less generously.',
  },
  {
    id: 'context_caps_originality',
    description: 'Lack of context allows prestige bias to inflate originality',
    antecedent_dimension: 'context_constraints_disclosure',
    antecedent_condition: '<',
    antecedent_threshold: 4,
    consequent_dimension: 'originality_specificity_voice',
    consequent_max: 8,
    severity: 'soft',
    rationale: 'Perceived originality may be privilege without context disclosure.',
  },
  {
    id: 'craft_caps_economy',
    description: 'Line-level craft cannot exceed scene-level craft by much',
    antecedent_dimension: 'show_dont_tell_craft',
    antecedent_condition: '<',
    antecedent_threshold: 4,
    consequent_dimension: 'word_economy_craft',
    consequent_max: 8,
    severity: 'soft',
    rationale: 'Tight sentences in an all-telling essay still misses the mark.',
  },
];

// ============================================================================
// CONSTRAINT EVALUATION ENGINE
// ============================================================================

/**
 * Check a single constraint against observed scores.
 */
function evaluateConstraint(
  constraint: DimensionConstraint,
  scores: Record<string, number>
): {
  violated: boolean;
  antecedent_score: number;
  consequent_score: number;
  consequent_max_allowed: number;
  excess: number;
} {
  const antScore = scores[constraint.antecedent_dimension];
  const conScore = scores[constraint.consequent_dimension];

  if (antScore === undefined || conScore === undefined) {
    return {
      violated: false,
      antecedent_score: antScore ?? 0,
      consequent_score: conScore ?? 0,
      consequent_max_allowed: 10,
      excess: 0,
    };
  }

  // Check if antecedent condition is met
  let conditionMet = false;
  switch (constraint.antecedent_condition) {
    case '<':  conditionMet = antScore < constraint.antecedent_threshold; break;
    case '<=': conditionMet = antScore <= constraint.antecedent_threshold; break;
    case '>':  conditionMet = antScore > constraint.antecedent_threshold; break;
    case '>=': conditionMet = antScore >= constraint.antecedent_threshold; break;
    case '==': conditionMet = antScore === constraint.antecedent_threshold; break;
  }

  if (!conditionMet) {
    // Condition not met → constraint not active → no violation
    return {
      violated: false,
      antecedent_score: antScore,
      consequent_score: conScore,
      consequent_max_allowed: 10,
      excess: 0,
    };
  }

  // Condition met → check if consequent exceeds max
  const violated = conScore > constraint.consequent_max;
  const excess = violated ? conScore - constraint.consequent_max : 0;

  return {
    violated,
    antecedent_score: antScore,
    consequent_score: conScore,
    consequent_max_allowed: constraint.consequent_max,
    excess,
  };
}

/**
 * Run all constraints against a set of dimension scores.
 *
 * @param scores - Dimension scores to check
 * @param rubricType - Which constraint set to use
 * @param autoFix - If true, adjust violated scores to satisfy constraints
 * @returns Complete constraint check result
 */
export function checkConstraints(
  scores: Record<string, number>,
  rubricType: 'experience' | 'essay' = 'experience',
  autoFix: boolean = false
): ConstraintCheckResult {
  const constraints = rubricType === 'essay'
    ? ESSAY_CONSTRAINTS
    : EXPERIENCE_CONSTRAINTS;

  const violations: ConstraintCheckResult['violations'] = [];
  let totalAdjustment = 0;
  let hasHardViolations = false;

  // Working copy of scores for auto-fix
  const adjustedScores = { ...scores };

  for (const constraint of constraints) {
    const result = evaluateConstraint(constraint, adjustedScores);

    if (result.violated) {
      violations.push({
        constraint,
        antecedent_score: result.antecedent_score,
        consequent_score: result.consequent_score,
        consequent_max_allowed: result.consequent_max_allowed,
        excess: Math.round(result.excess * 100) / 100,
        suggested_adjustment: -result.excess,
      });

      if (constraint.severity === 'hard') {
        hasHardViolations = true;
      }

      if (autoFix) {
        // Apply adjustment
        adjustedScores[constraint.consequent_dimension] = constraint.consequent_max;
        totalAdjustment += result.excess;
      }
    }
  }

  // If auto-fixing, run constraints again to handle cascading adjustments
  // (one adjustment may create new violations)
  if (autoFix && violations.length > 0) {
    let iterations = 0;
    let moreViolations = true;

    while (moreViolations && iterations < 5) {
      moreViolations = false;
      iterations++;

      for (const constraint of constraints) {
        const result = evaluateConstraint(constraint, adjustedScores);
        if (result.violated) {
          adjustedScores[constraint.consequent_dimension] = constraint.consequent_max;
          totalAdjustment += result.excess;
          moreViolations = true;
        }
      }
    }
  }

  return {
    total_constraints: constraints.length,
    violations_found: violations.length,
    violations,
    adjusted_scores: autoFix ? adjustedScores : undefined,
    total_adjustment: Math.round(totalAdjustment * 100) / 100,
    has_hard_violations: hasHardViolations,
  };
}

/**
 * Get a human-readable summary of constraint violations.
 */
export function summarizeViolations(result: ConstraintCheckResult): string {
  if (result.violations_found === 0) {
    return 'All score coherence constraints satisfied.';
  }

  const lines: string[] = [
    `${result.violations_found} constraint violation(s) detected:`,
    '',
  ];

  for (const v of result.violations) {
    const severity = v.constraint.severity === 'hard' ? 'HARD' : 'soft';
    lines.push(
      `[${severity}] ${v.constraint.description}`
    );
    lines.push(
      `  ${v.constraint.antecedent_dimension}=${v.antecedent_score} (< ${v.constraint.antecedent_threshold}) ` +
      `→ ${v.constraint.consequent_dimension}=${v.consequent_score} (max allowed: ${v.consequent_max_allowed})`
    );
    lines.push(`  Excess: ${v.excess.toFixed(1)}, Rationale: ${v.constraint.rationale}`);
    lines.push('');
  }

  if (result.has_hard_violations) {
    lines.push('WARNING: Hard constraint violations detected — scores may be unreliable.');
  }

  return lines.join('\n');
}
