/**
 * Teaching Sophistication Router — Score-Driven Adaptive Teaching
 *
 * Routes teaching into completely separate paradigms by description score.
 * Each level is a different LENS, not a filtered version of the same advice.
 *
 * Three teaching paradigms:
 * - Foundational (descScore < 5.0): WRITING MECHANICS — teach how to write
 *   (active verbs, quantification, impact framing, structure templates)
 * - Intermediate (5.0-8.0): STRATEGIC POSITIONING — teach how to frame
 *   (committee pitch, competitive differentiation, narrative threading)
 * - Advanced (> 8.0): CHARACTER-LEVEL OPTIMIZATION — surgical word-level
 *   (info density audit, first-three-words framing, school-specific variants)
 *
 * No ban lists. Higher levels don't suppress lower-level content — they
 * focus on entirely different concerns, naturally excluding basics.
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
 * NOTE: The rule scorer tends to reward clarity/ownership/numbers even for
 * simple descriptions — basic-but-clear descriptions often score 7-8/10.
 * Thresholds are calibrated accordingly:
 * - Foundational: < 5.0 (truly weak descriptions — passive, vague, no numbers)
 * - Intermediate: 5.0-8.0 inclusive (competent writing with basic clarity)
 * - Advanced: > 8.0 (genuinely exceptional — rich detail, strong verbs, deep insight)
 */
const THRESHOLDS = {
  foundational: { max: 5.0 },    // exclusive upper bound
  intermediate: { min: 5.0, max: 8.0 }, // inclusive lower, inclusive upper
  advanced: { min: 8.0 },        // exclusive lower bound
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
 * Three completely separate teaching paradigms — not variations of the same
 * prompt with a ban list, but fundamentally different lenses.
 *
 * Foundational: WRITING MECHANICS — teach HOW to write a good description
 * Intermediate: STRATEGIC POSITIONING — teach how to FRAME for admissions
 * Advanced: CHARACTER-LEVEL OPTIMIZATION — every word earns its place
 *
 * Each level operates independently. Higher levels don't reference or suppress
 * lower-level content — they simply focus on entirely different concerns.
 */
export function getSophisticationPromptBlock(level: TeachingSophistication): string {
  switch (level) {
    case 'foundational':
      return `TEACHING LENS: WRITING MECHANICS
This student needs to learn HOW to write a strong activity description. Your job is to teach the craft.

FOCUS AREAS:
1. Verb power — Replace passive/weak verbs with ownership verbs that show agency
   Teach: "Helped with" → "Designed", "Was responsible for" → "Led", "Worked on" → "Built"
2. Quantification — Every claim needs a number or concrete scope
   Teach: "Many students" → "47 students", "Raised money" → "Raised $2,400", "Led team" → "Led team of 8"
3. Impact framing — Move from duties to outcomes
   Teach: "Organized events" → "Organized 6 campus events reaching 200+ students"
4. Description structure — Semicolon-separated fragments that maximize info density
   Teach: Fragment format packs 2-3x more information than flowing sentences
5. Principle explanations — Explain WHY each change matters to admissions officers
   They may not know that AOs spend ~30 seconds per activity list

TEACHING STYLE: Patient, educational, step-by-step. Show before/after for every principle. Provide templates they can follow.`;

    case 'intermediate':
      return `TEACHING LENS: STRATEGIC POSITIONING
This student writes clearly. Your job shifts entirely: teach them to POSITION their activities for competitive admissions.

FOCUS AREAS:
1. Committee framing — How would an AO describe this activity to the admissions committee?
   Craft the one sentence an AO would quote when advocating for this student
2. Competitive differentiation — Thousands of applicants have similar activities
   What makes THIS student's version unique? What detail would an AO remember?
3. Narrative threading — How does this activity connect to their spike/intended major?
   Each description should reinforce the portfolio story, not stand alone
4. Tier-crossing specifics — What concrete changes move a description from "good" to "compelling"?
   Identify the specific gap between their current score and the next tier
5. School-specific framing — The same activity reads differently for MIT vs. Stanford vs. UChicago
   How should they adjust emphasis for their target schools' values?
6. AO psychology — What makes an admissions officer pause and re-read?
   The description should create a mental image, not just list facts

TEACHING STYLE: Strategic, analytical. Assume writing competence. Focus on the "so what?" — why should the committee care about THIS version?`;

    case 'advanced':
      return `TEACHING LENS: CHARACTER-LEVEL OPTIMIZATION
This student writes well. Your job is surgical: optimize every character for maximum admissions impact.

FOCUS AREAS:
1. First-three-words audit — What cognitive frame do the opening words create?
   The reader forms an impression in <1 second. Optimize that first impression
2. Information density — Identify every wasted character. What high-value info is missing?
   At 150 characters, every word must earn its place. Find the dead weight
3. Word-level impression audit — What does each specific word choice signal?
   "Managed" vs "Orchestrated" vs "Scaled" — each creates a different applicant image
4. Competitive landscape — What do other top applicants in this niche typically write?
   Position this student's description to stand out from that specific competitive set
5. Alternative framings — Provide 2-3 rewrites with explicit trade-off analysis
   Different framings emphasize different strengths. Let the student choose strategically
6. School-specific variants — Different rewrites optimized for different institutional priorities
   Research-focused schools vs. community-focused vs. innovation-focused
7. The "stop and re-read" test — Would a tired AO on application #47 pause here?
   If not, the description isn't done. Rewrite until it demands attention

TEACHING STYLE: Precise, surgical. Treat each character as precious real estate. No general advice — only specific word-level interventions with explicit reasoning.`;
  }
}

/**
 * Get a system-level sophistication directive based on the dominant level.
 * Injected into the system prompt to set overall tone for the entire response.
 */
export function getSystemSophisticationDirective(dominant: TeachingSophistication): string {
  switch (dominant) {
    case 'foundational':
      return `This student needs to learn writing mechanics. Teach principles patiently — active verbs, quantification, impact framing, description structure. Show step-by-step transformations with clear before/after examples.`;

    case 'intermediate':
      return `This student writes competently. Shift your entire focus to strategic positioning — committee framing, competitive differentiation, narrative threading, and school-specific emphasis. Assume they already know how to write clearly.`;

    case 'advanced':
      return `This student is a strong writer. Operate surgically at the character level — word choice impressions, information density, competitive landscape positioning, and school-specific optimization. Every piece of advice must be specific to their exact words, not general writing guidance.`;
  }
}
