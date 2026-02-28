/**
 * Teaching Sophistication Router — Score-Driven Adaptive Teaching
 *
 * Routes teaching depth by description score level. Stops giving basic writing
 * tips to advanced writers.
 *
 * Three sophistication tiers:
 * - Foundational (descScore < 4.0): Full writing principles — active verbs,
 *   quantification, impact framing. Current system behavior.
 * - Intermediate (4.0-6.5): Strategic framing, competitive differentiation,
 *   narrative connection, committee pitch. SKIP basic writing tips.
 * - Advanced (> 6.5): Word-level mastery, information density audit,
 *   school-specific optimization, alternative framings.
 *
 * BANNED for intermediate/advanced:
 * - "Use active verbs instead of passive"
 * - "Add specific numbers and metrics"
 * - "Show impact, not just duties"
 * - "Lead with your strongest achievement"
 * - "Replace 'help' with ownership verbs"
 * - "Reorder to put leadership first"
 *
 * Cost: $0 (pure TypeScript logic, no LLM calls)
 */

// ============================================================================
// TYPES
// ============================================================================

/** Teaching sophistication level based on description quality */
export type TeachingSophistication = 'foundational' | 'intermediate' | 'advanced';

/** Classification result with context */
export interface SophisticationClassification {
  level: TeachingSophistication;
  /** Description score that drove the classification */
  descriptionScore: number;
  /** Short rationale for the classification */
  rationale: string;
}

/** Map of activity ID → sophistication level */
export type SophisticationMap = Map<string, SophisticationClassification>;

// ============================================================================
// CLASSIFICATION
// ============================================================================

/**
 * Threshold boundaries for sophistication tiers (1-10 scale).
 *
 * The description rule scorer produces scores clamped to [1, 10].
 * Boundaries:
 * - Foundational: < 4.0 (scores 1.0-3.9)
 * - Intermediate: 4.0-6.5 inclusive (scores 4.0-6.5)
 * - Advanced: > 6.5 (scores 6.6-10.0)
 */
const THRESHOLDS = {
  foundational: { max: 4.0 },    // exclusive upper bound
  intermediate: { min: 4.0, max: 6.5 }, // inclusive lower, inclusive upper
  advanced: { min: 6.5 },        // exclusive lower bound
} as const;

/**
 * Classify a single activity's teaching sophistication based on its description score.
 *
 * Uses description score on the 1-10 scale (clamped by the description rule scorer).
 * Invalid scores (NaN, Infinity) default to 'foundational' (safest — includes all tips).
 */
export function classifyTeachingSophistication(descScore: number): SophisticationClassification {
  // Guard against NaN/Infinity — default to foundational (safest fallback)
  if (!Number.isFinite(descScore)) {
    console.warn(`[SophisticationRouter] Invalid description score: ${descScore}, defaulting to foundational`);
    return {
      level: 'foundational',
      descriptionScore: 0,
      rationale: 'Invalid description score — defaulting to foundational for safety',
    };
  }

  if (descScore < THRESHOLDS.foundational.max) {
    return {
      level: 'foundational',
      descriptionScore: descScore,
      rationale: `Description score ${descScore.toFixed(1)}/10 — needs fundamental writing improvement`,
    };
  }

  if (descScore > THRESHOLDS.advanced.min) {
    return {
      level: 'advanced',
      descriptionScore: descScore,
      rationale: `Description score ${descScore.toFixed(1)}/10 — already strong, focus on word-level mastery`,
    };
  }

  return {
    level: 'intermediate',
    descriptionScore: descScore,
    rationale: `Description score ${descScore.toFixed(1)}/10 — skip basics, focus on strategic framing`,
  };
}

/**
 * Build a sophistication map for all activities being transformed.
 *
 * @param activityScores Array of { activityId, descriptionScoreTotal }
 * @returns Map of activityId → SophisticationClassification
 */
export function buildSophisticationMap(
  activityScores: Array<{ activityId: string; descriptionScoreTotal: number }>
): SophisticationMap {
  const map: SophisticationMap = new Map();
  for (const { activityId, descriptionScoreTotal } of activityScores) {
    map.set(activityId, classifyTeachingSophistication(descriptionScoreTotal));
  }
  return map;
}

/**
 * Get the dominant sophistication level across all activities.
 * Used for system-level prompt guidance.
 *
 * Tie-breaking: prefers intermediate (safe middle ground).
 * Empty map: returns 'foundational' (safest — includes all teaching content).
 */
export function getDominantSophistication(map: SophisticationMap): TeachingSophistication {
  // Empty map → foundational (safest default, never omits teaching content)
  if (map.size === 0) {
    return 'foundational';
  }

  const counts = { foundational: 0, intermediate: 0, advanced: 0 };
  for (const classification of map.values()) {
    counts[classification.level]++;
  }

  // Return the most common level; use strict > for tie-breaking
  if (counts.foundational > counts.intermediate && counts.foundational > counts.advanced) return 'foundational';
  if (counts.advanced > counts.intermediate && counts.advanced > counts.foundational) return 'advanced';
  if (counts.intermediate > counts.foundational && counts.intermediate > counts.advanced) return 'intermediate';

  // Tie: default to intermediate (safe middle ground — doesn't omit content,
  // doesn't give insulting basic tips to competent writers)
  return 'intermediate';
}

// ============================================================================
// PROMPT BLOCKS
// ============================================================================

/**
 * Content BANNED from intermediate and advanced teaching.
 * These are commoditized tips that waste characters for competent writers.
 */
const BANNED_CONTENT = [
  'use active verbs instead of passive',
  'add specific numbers and metrics',
  'show impact, not just duties',
  'lead with your strongest achievement',
  "replace 'help' with ownership verbs",
  'reorder to put leadership first',
  'use strong action verbs',
  'quantify your achievements',
  'avoid passive voice',
  'start with a verb',
] as const;

/**
 * Get the sophistication-specific prompt block to inject into the teaching prompt.
 * This controls WHAT kind of teaching the model provides for each activity.
 */
export function getSophisticationPromptBlock(level: TeachingSophistication): string {
  switch (level) {
    case 'foundational':
      return `TEACHING DEPTH: FOUNDATIONAL
This student's description needs fundamental improvement. Provide:
- Full writing principle explanations (active verbs, quantification, impact framing)
- Step-by-step guidance on transforming weak descriptions
- Before/after examples showing each principle in action
- Basic structure templates they can follow
- Explain WHY each change matters (they may not know)`;

    case 'intermediate':
      return `TEACHING DEPTH: INTERMEDIATE
This student already writes competently — DO NOT waste their time with basics.
BANNED content (never include any of these):
${BANNED_CONTENT.map(b => `  - "${b}"`).join('\n')}

Instead focus on:
- Strategic framing for target school committees
- Competitive differentiation (what makes THIS student's version unique)
- Narrative connection across activities (spike reinforcement)
- Tier-crossing specifics (what separates a 5 from a 7)
- Committee pitch sentence (the one line an AO would quote)
- How to frame this activity for THEIR specific intended major/schools`;

    case 'advanced':
      return `TEACHING DEPTH: ADVANCED — WORD-LEVEL MASTERY
This student writes well. Every character must be intentional.
BANNED content (never include any of these):
${BANNED_CONTENT.map(b => `  - "${b}"`).join('\n')}

Focus exclusively on:
- Word-by-word audit: what impression does each word create?
- First-three-words cognitive frame analysis (what does the reader assume?)
- Information density audit: identify wasted characters and missing high-value info
- School-specific optimization (different rewrites for different school priorities)
- Competitive landscape positioning (what do OTHER applicants in this niche write?)
- Committee advocacy sentence (craft the exact sentence an AO would use to champion this student)
- Alternative framings with explicit trade-off analysis
- "Stop and re-read" test: would an AO pause and re-read this? If not, rewrite until they would`;
  }
}

/**
 * Get a system-level sophistication directive based on the dominant level.
 * Injected into the system prompt to set overall tone.
 */
export function getSystemSophisticationDirective(dominant: TeachingSophistication): string {
  switch (dominant) {
    case 'foundational':
      return `Most activities need fundamental description improvement. Teach writing principles clearly and show step-by-step transformations.`;

    case 'intermediate':
      return `This student writes competently. Skip basic writing tips entirely — they know to use active verbs and add numbers. Focus on strategic framing, competitive differentiation, and narrative cohesion that separates good from great.`;

    case 'advanced':
      return `This student is a strong writer. Your teaching must match their level — word-level precision, information density optimization, school-specific framing, and competitive positioning. Basic writing advice would insult their intelligence and waste their time.`;
  }
}
