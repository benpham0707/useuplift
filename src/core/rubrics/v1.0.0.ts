/**
 * Rubric v1.0.0 for Extracurricular/Experience Evaluation
 *
 * This rubric evaluates entries across 11 categories to produce a
 * Narrative Quality Index (NQI) from 0-100.
 *
 * Design Philosophy:
 * - Narrative authenticity over prestige
 * - Emotional resonance + tangible achievement
 * - Reflection, individuality, and real impact
 * - Human voice, not corporate or AI-ish
 */

import { RubricCategory } from '../types/experience';

// ============================================================================
// RUBRIC METADATA
// ============================================================================

export const RUBRIC_VERSION = 'v1.0.0';

// Default weights (balanced for leadership/service activities)
export const RUBRIC_WEIGHTS: Record<RubricCategory, number> = {
  voice_integrity: 0.10,
  specificity_evidence: 0.09,
  transformative_impact: 0.12,
  role_clarity_ownership: 0.08,
  narrative_arc_stakes: 0.10,
  initiative_leadership: 0.10,
  community_collaboration: 0.08,
  reflection_meaning: 0.12,
  craft_language_quality: 0.07,
  fit_trajectory: 0.07,
  time_investment_consistency: 0.07,
};

// Verify weights sum to 1.0
const totalWeight = Object.values(RUBRIC_WEIGHTS).reduce((sum, w) => sum + w, 0);
if (Math.abs(totalWeight - 1.0) > 0.001) {
  throw new Error(`Rubric weights must sum to 1.0, got ${totalWeight}`);
}

// ============================================================================
// ADAPTIVE WEIGHTS BY ACTIVITY TYPE
// ============================================================================

/**
 * Adaptive weighting based on activity category
 * Different activities emphasize different strengths
 */
export const ADAPTIVE_WEIGHTS: Record<string, Partial<Record<RubricCategory, number>>> = {
  // Leadership/Service: Default weights (no override)
  leadership: {},
  service: {},

  // Work (part-time jobs): Lower leadership/fit expectations, higher voice/reflection
  work: {
    initiative_leadership: 0.06,     // Down from 0.10
    fit_trajectory: 0.04,             // Down from 0.07
    voice_integrity: 0.13,            // Up from 0.10
    reflection_meaning: 0.15,         // Up from 0.12
    community_collaboration: 0.10,    // Up from 0.08 (customer/coworker connections)
  },

  // Arts/Personal pursuits: Lower leadership, higher craft/meaning
  arts: {
    initiative_leadership: 0.05,      // Down from 0.10
    role_clarity_ownership: 0.05,     // Down from 0.08
    craft_language_quality: 0.10,     // Up from 0.07
    reflection_meaning: 0.15,         // Up from 0.12
    fit_trajectory: 0.09,             // Up from 0.07 (artistic trajectory matters)
  },

  // Research/Academic: Higher evidence, lower community
  research: {
    specificity_evidence: 0.12,       // Up from 0.09
    community_collaboration: 0.05,    // Down from 0.08
    initiative_leadership: 0.12,      // Up from 0.10 (intellectual initiative)
  },

  // Athletics: Lower reflection, higher time/community
  athletics: {
    reflection_meaning: 0.08,         // Down from 0.12
    time_investment_consistency: 0.11, // Up from 0.07
    community_collaboration: 0.11,    // Up from 0.08
  },
};

/**
 * Get appropriate weights for an activity category
 */
export function getWeightsForCategory(category: string): Record<RubricCategory, number> {
  const baseWeights = { ...RUBRIC_WEIGHTS };
  const overrides = ADAPTIVE_WEIGHTS[category] || {};

  // Apply overrides
  const adjusted = { ...baseWeights, ...overrides };

  // Verify still sums to 1.0
  const sum = Object.values(adjusted).reduce((s, w) => s + w, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
  }

  return adjusted as Record<RubricCategory, number>;
}

// ============================================================================
// CATEGORY DEFINITIONS
// ============================================================================

export interface CategoryDefinition {
  name: RubricCategory;
  display_name: string;
  weight: number;
  definition: string;

  // Scoring anchors (0, 5, 10)
  anchor_0: string;
  anchor_5: string;
  anchor_10: string;

  // Evaluation prompts for LLM
  evaluator_prompts: string[];

  // Writer prompts for students
  writer_prompts: string[];

  // Warning signs (anti-patterns)
  warning_signs: string[];
}

export const RUBRIC_CATEGORIES_DEFINITIONS: Record<RubricCategory, CategoryDefinition> = {

  // ==========================================================================
  // 1) VOICE INTEGRITY — 10%
  // ==========================================================================
  voice_integrity: {
    name: 'voice_integrity',
    display_name: 'Voice Integrity',
    weight: 0.10,
    definition: 'Does this sound like a real person who lived the experience? Voice Integrity captures honesty, specificity of perspective, and a natural cadence (not corporate or AI-ish). We prize clarity and warmth over grandiosity.',

    anchor_0: '"I was responsible for many tasks." (no personality, templated)',
    anchor_5: '"I coordinated volunteer shifts and tracked attendance." (clear but flat)',
    anchor_10: '"Most Wednesdays smelled like bleach and citrus; I learned which regular wanted to talk and which just needed silence." (human, textured, grounded)',

    evaluator_prompts: [
      'Could I pick this student\'s voice out of a pile?',
      'Do sentences feel said, not performed?',
      'Is there specificity of perspective that feels authentic?'
    ],

    writer_prompts: [
      'Where would a close friend nod and say, "Yep, that\'s you"?',
      'What line could only you write?',
      'What sensory detail do you remember from this experience?'
    ],

    warning_signs: [
      '"passionate about"',
      '"thrilled to"',
      '"leveraged synergies"',
      'excessive passive voice',
      'corporate jargon',
      'AI-like phrasing'
    ]
  },

  // ==========================================================================
  // 2) SPECIFICITY & EVIDENCE — 9%
  // ==========================================================================
  specificity_evidence: {
    name: 'specificity_evidence',
    display_name: 'Specificity & Evidence',
    weight: 0.09,
    definition: 'Concrete details, credible scope, and visible outcomes without hype. Not numbers for numbers\' sake—just enough evidence to anchor trust.',

    anchor_0: '"Made a big impact on the community."',
    anchor_5: '"Raised funds and reached 200 students." (basic metrics)',
    anchor_10: '"Secured a $3,200 grant; piloted two Saturday clinics; 47/61 sign-ups returned the next month." (precise, plausible, meaningful)',

    evaluator_prompts: [
      'Do details let me "see" the work?',
      'Are claims calibratable (not magical, not vague)?',
      'Can I verify the scope and outcomes?'
    ],

    writer_prompts: [
      'Which 1–2 facts would make a skeptical reader believe you?',
      'What changed because you acted?',
      'What specific numbers show your impact (people reached, hours invested, funds raised)?'
    ],

    warning_signs: [
      'round, suspicious numbers (e.g., "exactly 1000 people")',
      'unbounded superlatives ("massive impact", "countless hours")',
      'counting tasks without results',
      'vague outcome statements'
    ]
  },

  // ==========================================================================
  // 3) TRANSFORMATIVE IMPACT — 12%
  // ==========================================================================
  transformative_impact: {
    name: 'transformative_impact',
    display_name: 'Transformative Impact (Self & Others)',
    weight: 0.12,
    definition: 'Evidence of change: in you (skills, values, perspective) and in people/systems you touched. Transformation can be small but real.',

    anchor_0: 'No change implied.',
    anchor_5: '"I learned time management." (generic)',
    anchor_10: '"I stopped hoarding tasks; training two freshmen meant the clinic didn\'t stall when I stepped back." (personal + systemic shift)',

    evaluator_prompts: [
      'What is different now that wouldn\'t be without them?',
      'Is the "before → after" legible?',
      'Does impact persist beyond their direct involvement?'
    ],

    writer_prompts: [
      'What did you unlearn?',
      'What persists after you\'re gone?',
      'How did this change your perspective or someone else\'s situation?'
    ],

    warning_signs: [
      'hero arcs with no evidence',
      '"changed my life" without showing how',
      'claiming systemic impact with no mechanism',
      'overstating reach or influence'
    ]
  },

  // ==========================================================================
  // 4) ROLE CLARITY & OWNERSHIP — 8%
  // ==========================================================================
  role_clarity_ownership: {
    name: 'role_clarity_ownership',
    display_name: 'Role Clarity & Ownership',
    weight: 0.08,
    definition: 'Do we know what you actually did, decided, and drove? Titles matter less than choices and responsibilities you owned.',

    anchor_0: 'Title only.',
    anchor_5: 'Lists duties (scheduling, emailing).',
    anchor_10: '"Redesigned intake flow; cut average wait time from 18→9 minutes." (clear agency)',

    evaluator_prompts: [
      'Can I point to a decision that was "theirs"?',
      'Do verbs show initiative?',
      'Is agency clear from the description?'
    ],

    writer_prompts: [
      'Which verbs are truly yours (built, redesigned, negotiated)?',
      'What would have stalled without you?',
      'What decision did you make that changed the outcome?'
    ],

    warning_signs: [
      '"helped with"',
      '"supported"',
      '"was part of"',
      'title-heavy, action-light',
      'no verbs showing decision-making'
    ]
  },

  // ==========================================================================
  // 5) NARRATIVE ARC & STAKES — 10%
  // ==========================================================================
  narrative_arc_stakes: {
    name: 'narrative_arc_stakes',
    display_name: 'Narrative Arc & Stakes',
    weight: 0.10,
    definition: 'A mini-story with context, obstacle, action, and consequence. Stakes can be practical (deadline, constraint) or human (a person you didn\'t want to let down).',

    anchor_0: 'Snapshot with no arc.',
    anchor_5: 'Beginning and end, thin middle.',
    anchor_10: '"Our fridge failed day of the drive; we improvised a dry-ice line and salvaged 80% of perishables." (clear stakes, turning point)',

    evaluator_prompts: [
      'Do I feel tension or risk?',
      'Is there a turning moment?',
      'Does the story have a clear beginning, middle, end?'
    ],

    writer_prompts: [
      'What almost went wrong?',
      'Where did you pivot?',
      'What was at risk if you failed?'
    ],

    warning_signs: [
      'timeline soup (disconnected events)',
      'outcome stated without how we got there',
      'no obstacles or challenges mentioned',
      'flat narrative with no tension'
    ]
  },

  // ==========================================================================
  // 6) INITIATIVE & LEADERSHIP — 10%
  // ==========================================================================
  initiative_leadership: {
    name: 'initiative_leadership',
    display_name: 'Initiative & Leadership Modes',
    weight: 0.10,
    definition: 'Leadership as behavior (starting, persuading, structuring), not rank. Includes quiet leadership: modeling, mentoring, consistency.',

    anchor_0: 'Follows instructions only.',
    anchor_5: 'Coordinates others reliably.',
    anchor_10: '"I couldn\'t get sign-ups until I moved recruiting to the cafeteria line; we tripled interest." (seeing/solving)',

    evaluator_prompts: [
      'Where did they create momentum from zero?',
      'Do they adapt leadership style to context?',
      'Is there evidence of influence without formal authority?'
    ],

    writer_prompts: [
      'When did you lead without the title?',
      'How did you move one reluctant person?',
      'What system did you create or improve?'
    ],

    warning_signs: [
      'leadership = popularity',
      'rank inflation',
      'claiming leadership without behavioral evidence',
      'no examples of initiating or problem-solving'
    ]
  },

  // ==========================================================================
  // 7) COMMUNITY & COLLABORATION — 8%
  // ==========================================================================
  community_collaboration: {
    name: 'community_collaboration',
    display_name: 'Community & Collaboration',
    weight: 0.08,
    definition: 'How they listened, included, and built with others. Shows humility and credit-sharing.',

    anchor_0: '"I did X, I did Y."',
    anchor_5: 'Mentions team.',
    anchor_10: '"Ana caught the budgeting error; we changed to generic supplies and kept bus passes." (others named, real interdependence)',

    evaluator_prompts: [
      'Is respect for others evident?',
      'Are partners/community visible?',
      'Do they share credit authentically?'
    ],

    writer_prompts: [
      'Who saved your plan? Credit them.',
      'What feedback changed your approach?',
      'How did you make space for others\' ideas?'
    ],

    warning_signs: [
      'token "teamwork" sentence',
      'vague "we" with no specifics',
      'no named individuals',
      'excessive "I" with no acknowledgment of others'
    ]
  },

  // ==========================================================================
  // 8) REFLECTION & MEANING — 12%
  // ==========================================================================
  reflection_meaning: {
    name: 'reflection_meaning',
    display_name: 'Reflection & Meaning',
    weight: 0.12,
    definition: 'Thoughtful insight: what you learned and why it matters to who you\'re becoming. Not a moral-of-the-story cliché.',

    anchor_0: 'No reflection.',
    anchor_5: '"It taught me perseverance."',
    anchor_10: '"I mistook silence for agreement; now I pause and ask what we\'re missing." (precise, portable insight)',

    evaluator_prompts: [
      'Is there a real shift in lens?',
      'Would this reflection help them elsewhere?',
      'Does it avoid clichés and show genuine self-awareness?'
    ],

    writer_prompts: [
      'What did you notice about yourself under stress?',
      'What belief do you hold differently now?',
      'What surprised you about this experience?'
    ],

    warning_signs: [
      '"hard work pays off"',
      '"never give up"',
      'generic life lessons',
      'reflection tacked on at the end without integration'
    ]
  },

  // ==========================================================================
  // 9) CRAFT & LANGUAGE QUALITY — 7%
  // ==========================================================================
  craft_language_quality: {
    name: 'craft_language_quality',
    display_name: 'Craft & Language Quality',
    weight: 0.07,
    definition: 'Clean, concise, vivid writing. Strong verbs, tight nouns, sensory or concrete phrasing when useful.',

    anchor_0: 'Clutter, clichés, errors.',
    anchor_5: 'Correct but plain.',
    anchor_10: '"We folded tarps at midnight; the gym echoed like a pool." (polished, economical)',

    evaluator_prompts: [
      'Are words doing work?',
      'Any sentence I want to underline?',
      'Is the writing free of grammatical errors?'
    ],

    writer_prompts: [
      'Replace 2 adjectives with 2 strong verbs.',
      'Cut 10% without losing meaning.',
      'What\'s one vivid detail you can add?'
    ],

    warning_signs: [
      'buzzwords',
      'passive voice spirals',
      'over-long sentences',
      'grammatical errors',
      'repetitive phrasing'
    ]
  },

  // ==========================================================================
  // 10) FIT & TRAJECTORY — 7%
  // ==========================================================================
  fit_trajectory: {
    name: 'fit_trajectory',
    display_name: 'Fit & Trajectory (Contextual Relevance)',
    weight: 0.07,
    definition: 'Signals of continuity: how this experience connects to emerging interests, values, or future learning without sounding transactional.',

    anchor_0: 'Isolated activity.',
    anchor_5: 'Vague link ("inspired me to study X").',
    anchor_10: '"Tutoring ESL parents pushed me toward linguistics courses and a bilingual screening project." (clear arc)',

    evaluator_prompts: [
      'Do I see a thread across entries (or potential for one)?',
      'Is next-step curiosity implicit?',
      'Does it avoid forced "major" tie-ins?'
    ],

    writer_prompts: [
      'What did this make you want to try next?',
      'Which class/club/lab does this naturally touch?',
      'How does this connect to other things you care about?'
    ],

    warning_signs: [
      'forced "major" tie-ins',
      'résumé theater',
      'claiming interest in field with no follow-through',
      'disconnected from other experiences or stated interests'
    ]
  },

  // ==========================================================================
  // 11) TIME INVESTMENT & CONSISTENCY — 7%
  // ==========================================================================
  time_investment_consistency: {
    name: 'time_investment_consistency',
    display_name: 'Time Investment & Consistency',
    weight: 0.07,
    definition: 'Sustained commitment and reliability, proportionate to life context. Quality over sheer hours.',

    anchor_0: 'One-off with no continuity.',
    anchor_5: 'Regular for a semester.',
    anchor_10: 'Multi-term consistency or intentional ramp ("started monthly; by spring, weekly with a handoff plan").',

    evaluator_prompts: [
      'Is there credible continuity?',
      'Do commitments make sense alongside likely constraints?',
      'Is growth or evolution evident over time?'
    ],

    writer_prompts: [
      'How did your role evolve over time?',
      'What did you keep doing when it got boring?',
      'How did you balance this with other commitments?'
    ],

    warning_signs: [
      'hour inflation',
      '"summer spike" with no before/after',
      'inconsistent time claims',
      'no evidence of sustained commitment'
    ]
  },
};

// ============================================================================
// RUBRIC INTERACTION RULES
// ============================================================================

/**
 * Dynamic tradeoffs between categories that should inform scoring adjustments
 */
export const RUBRIC_INTERACTION_RULES = {
  voice_redeems_metrics: 'Voice can redeem average metrics; metrics rarely redeem hollow voice. A 9 in Voice with a 6 in Evidence often reads stronger than the reverse.',

  arc_amplifies_impact: 'Arc & Stakes amplify Impact. A modest outcome told with clear stakes feels more significant than a large outcome told flatly.',

  reflection_converts_logistics: 'Reflection converts logistics into growth. Weak Reflection caps the ceiling of seemingly "big" roles.',

  specificity_controls_credibility: 'Specificity controls credibility. Without it, high scores elsewhere should be throttled.',

  community_informs_leadership: 'Community & Leadership co-inform. Command-style leadership with low collaboration suggests fragility; collaborative leadership boosts durability.',
};

// ============================================================================
// NQI CALCULATION
// ============================================================================

/**
 * Map display names back to category keys
 */
const DISPLAY_NAME_TO_KEY: Record<string, RubricCategory> = Object.entries(RUBRIC_CATEGORIES_DEFINITIONS).reduce((acc, [key, def]) => {
  acc[def.display_name] = key as RubricCategory;
  return acc;
}, {} as Record<string, RubricCategory>);

/**
 * Calculate Narrative Quality Index (0-100) from category scores
 */
export function calculateNQI(
  categoryScores: Record<string, number>,
  customWeights?: Record<RubricCategory, number>
): number {
  const weights = customWeights || RUBRIC_WEIGHTS;
  let weightedSum = 0;

  for (const [category, score] of Object.entries(categoryScores)) {
    // Try to find weight by key first, then by display name
    let weight = weights[category as RubricCategory];

    if (weight === undefined) {
      // Try mapping from display name
      const categoryKey = DISPLAY_NAME_TO_KEY[category];
      if (categoryKey) {
        weight = weights[categoryKey];
      }
    }

    if (weight === undefined) {
      throw new Error(`Unknown category: ${category}`);
    }
    weightedSum += score * weight;
  }

  // Scale 0-10 weighted average to 0-100
  return Math.round(weightedSum * 10 * 10) / 10; // Round to 1 decimal
}

/**
 * Determine reader impression label from NQI
 */
export function getReaderImpressionLabel(nqi: number): string {
  if (nqi >= 90) return 'captivating_grounded';
  if (nqi >= 80) return 'strong_distinct_voice';
  if (nqi >= 70) return 'solid_needs_polish';
  if (nqi >= 60) return 'patchy_narrative';
  return 'generic_unclear';
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  version: RUBRIC_VERSION,
  weights: RUBRIC_WEIGHTS,
  categories: RUBRIC_CATEGORIES_DEFINITIONS,
  interaction_rules: RUBRIC_INTERACTION_RULES,
  calculateNQI,
  getReaderImpressionLabel,
};
