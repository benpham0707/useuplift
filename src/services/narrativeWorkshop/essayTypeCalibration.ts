/**
 * Essay Type-Specific Calibration System
 *
 * Different essay types (Common App Personal Statement, UC PIQs, Why Us, Supplementals)
 * require different scoring rubrics and expectations. This system ensures we maintain
 * world-class understanding and insight quality across all essay types.
 *
 * Philosophy:
 * - Common App (650 words): Deep character exploration, narrative craft, vulnerability
 * - UC PIQs (350 words): Concise impact demonstration, specific examples, quantification
 * - Why Us (200-650 words): Research depth, specific resources, genuine fit
 * - Supplementals: Varies by prompt type (community, challenge, identity, intellectual vitality)
 *
 * Based on analysis of 20 elite essays across types from Harvard, Princeton, Stanford,
 * MIT, Yale, Berkeley, Duke, Northwestern, Dartmouth.
 */

// ============================================================================
// ESSAY TYPE DEFINITIONS
// ============================================================================

export type EssayType =
  | 'personal_statement'      // Common App or Coalition (650 words)
  | 'uc_piq'                   // UC Personal Insight Questions (350 words)
  | 'why_us'                   // Why School/Why Major (200-650 words)
  | 'community'                // Community essay (varies)
  | 'challenge_adversity'      // Challenge/setback essay
  | 'intellectual_vitality'    // Intellectual curiosity essay
  | 'identity_background'      // Identity/background essay
  | 'activity_to_essay'        // Expanding on activity (150-650 words)
  | 'supplemental_other';      // Other supplemental prompts

export interface EssayTypeProfile {
  type: EssayType;
  typicalWordCount: number;
  primaryGoal: string;
  secondaryGoals: string[];

  // Dimension weight adjustments (relative to base rubric)
  dimensionWeightAdjustments: Record<string, number>;

  // Specific expectations
  mustHave: string[];
  niceToHave: string[];
  canSkip: string[];

  // Elite benchmarks from corpus
  eliteExamples: string[];  // Essay IDs from exemplar corpus

  // Scoring calibration
  scoringNotes: string;
}

// ============================================================================
// ESSAY TYPE PROFILES
// ============================================================================

export const ESSAY_TYPE_PROFILES: Record<EssayType, EssayTypeProfile> = {
  // ========================================================================
  // COMMON APP / COALITION PERSONAL STATEMENT (650 words)
  // ========================================================================
  personal_statement: {
    type: 'personal_statement',
    typicalWordCount: 650,
    primaryGoal: 'Reveal character, values, and growth through narrative',
    secondaryGoals: [
      'Demonstrate vulnerability and self-awareness',
      'Show narrative craft and writing ability',
      'Create memorable, authentic voice',
      'Extract universal insights from specific experiences'
    ],

    dimensionWeightAdjustments: {
      'opening_power_scene_entry': 1.2,           // 20% boost - critical for engagement
      'narrative_arc_stakes_turn': 1.15,          // 15% boost - story structure matters
      'character_interiority_vulnerability': 1.25, // 25% boost - vulnerability is key
      'show_dont_tell_craft': 1.2,                // 20% boost - craft expected
      'reflection_meaning_making': 1.15,          // 15% boost - depth required
      'dialogue_action_texture': 1.0,             // Neutral - nice but not required
      'originality_specificity_voice': 1.3,       // 30% boost - CRITICAL for standing out
      'structure_pacing_coherence': 1.1,          // 10% boost - matters for readability
      'sentence_level_craft': 1.15,               // 15% boost - writing quality matters
      'context_constraints_disclosure': 1.0,      // Neutral - helpful but not required
      'school_program_fit': 0.0,                  // N/A for personal statements
      'ethical_awareness_humility': 1.1           // 10% boost - maturity signal
    },

    mustHave: [
      'Specific scene or moment (not abstract summary)',
      '2+ vulnerability moments with concrete details',
      'Clear narrative arc (before → turning point → after)',
      'Authentic voice with personal/cultural markers',
      'Philosophical depth (portable insight beyond activity)',
      'Show > Tell ratio of at least 70%'
    ],

    niceToHave: [
      'Sustained metaphor or thematic threading',
      'Dialogue at key moments',
      'Sensory details in opening',
      '3+ quantified details',
      'Unconventional topic or angle',
      'Circular or non-linear structure'
    ],

    canSkip: [
      'School-specific references',
      'Academic achievements (unless central to narrative)',
      'Comprehensive activity list'
    ],

    eliteExamples: [
      'harvard_phoenix_metaphor',
      'princeton_novel_writing',
      'princeton_hot_sauce',
      'princeton_jon_snow',
      'princeton_religious_questioning',
      'princeton_rowing',
      'duke_amputation_surgery',
      'dartmouth_immigration_seeds',
      'unc_color_guard',
      'northwestern_big_eater',
      'yale_adhd_advocacy'
    ],

    scoringNotes: `
      Personal statements are judged primarily on CHARACTER REVELATION and NARRATIVE CRAFT.

      Elite essays (90-100):
      - Multiple vulnerability moments (2+)
      - Sustained metaphor or micro→macro structure
      - Authentic voice that could only be this student
      - Philosophical insight that's portable
      - Opening hooks in first 10 words

      Strong essays (80-89):
      - Some vulnerability and honesty
      - Clear narrative arc with turning point
      - Authentic voice with cultural/personal markers
      - Reflection with depth (not generic)
      - Good use of sensory detail and showing

      Competent essays (70-79):
      - Limited vulnerability
      - Linear structure with attempted arc
      - Some specific details and voice
      - Generic reflection ("taught me X")
      - Functional craft

      Weak essays (<70):
      - No vulnerability (perfectionism facade)
      - No narrative arc (just chronology)
      - Generic voice, could be anyone
      - Telling > showing
      - Abstract reflection only
    `
  },

  // ========================================================================
  // UC PERSONAL INSIGHT QUESTIONS (350 words)
  // ========================================================================
  uc_piq: {
    type: 'uc_piq',
    typicalWordCount: 350,
    primaryGoal: 'Demonstrate specific impact, skills, or growth with concrete evidence',
    secondaryGoals: [
      'Quantify outcomes wherever possible',
      'Show problem-solving and adaptability',
      'Reveal character through action',
      'Be concise and efficient with words'
    ],

    dimensionWeightAdjustments: {
      'opening_power_scene_entry': 1.1,           // 10% boost - still important but less space
      'narrative_arc_stakes_turn': 1.0,           // Neutral - less room for extended arc
      'character_interiority_vulnerability': 1.15, // 15% boost - honesty still matters
      'show_dont_tell_craft': 1.25,               // 25% boost - CRITICAL in short space
      'reflection_meaning_making': 1.1,           // 10% boost - brief but meaningful
      'dialogue_action_texture': 0.8,             // 20% reduction - less room for dialogue
      'originality_specificity_voice': 1.3,       // 30% boost - specificity is KING in PIQs
      'structure_pacing_coherence': 1.05,         // 5% boost - efficiency matters
      'sentence_level_craft': 1.1,                // 10% boost - every word counts
      'context_constraints_disclosure': 1.4,      // 40% boost - QUANTIFICATION critical
      'school_program_fit': 0.0,                  // N/A
      'ethical_awareness_humility': 1.05          // 5% boost - balance confidence + humility
    },

    mustHave: [
      'Specific, quantified impact (numbers, scale, outcomes)',
      'Concrete action taken (not abstract interest)',
      'Clear problem or challenge addressed',
      'Honest acknowledgment of struggle or growth',
      'Efficient language (no word waste)'
    ],

    niceToHave: [
      'Brief opening scene (10-20 words)',
      'One vulnerability moment',
      'Skill transfer to broader context',
      'Cultural or personal specificity',
      'Future connection or trajectory'
    ],

    canSkip: [
      'Extended narrative arc',
      'Sustained metaphor (not enough space)',
      'Multiple dialogue exchanges',
      'Lengthy reflection (keep to 1-2 sentences)'
    ],

    eliteExamples: [
      'berkeley_chemistry_failure',
      'berkeley_filipino_ambition',
      'berkeley_tech_community_service',
      'berkeley_translator_leader',
      'berkeley_clammy_hands',
      'berkeley_f_to_determination',
      'berkeley_history_passion'
    ],

    scoringNotes: `
      UC PIQs are judged on SPECIFICITY, IMPACT, and EFFICIENCY.

      Elite PIQs (90-100):
      - Quantified impact (20,000 students, 19% → B, one ton of food)
      - Specific problem → specific action → specific outcome
      - Honest about challenges ("19% on quiz," "clammy hands")
      - Efficient language (no fluff, every sentence adds value)
      - Authentic voice despite brevity

      Strong PIQs (80-89):
      - Some quantification (numbers present)
      - Clear action and outcome
      - Some honesty about struggle
      - Good specificity
      - Concise writing

      Competent PIQs (70-79):
      - Vague outcomes ("helped many people")
      - General action ("worked hard")
      - Limited honesty
      - Some specific details but gaps
      - Some word waste

      Weak PIQs (<70):
      - No numbers or specific outcomes
      - Abstract statements ("passionate about X")
      - No vulnerability
      - Generic language
      - Wordy, inefficient

      CRITICAL: UC readers explicitly look for EVIDENCE of impact. "I learned leadership"
      means nothing. "I organized 12 volunteers, secured venue, raised $3,200" means everything.
    `
  },

  // ========================================================================
  // WHY US / WHY MAJOR (200-650 words)
  // ========================================================================
  why_us: {
    type: 'why_us',
    typicalWordCount: 400,
    primaryGoal: 'Demonstrate genuine fit through specific research and personal connection',
    secondaryGoals: [
      'Name specific professors, courses, programs, resources',
      'Connect past experiences to future opportunities',
      'Show intellectual curiosity and preparation',
      'Avoid generic praise'
    ],

    dimensionWeightAdjustments: {
      'opening_power_scene_entry': 0.9,           // 10% reduction - less important here
      'narrative_arc_stakes_turn': 0.8,           // 20% reduction - not narrative-focused
      'character_interiority_vulnerability': 0.9, // 10% reduction - less central
      'show_dont_tell_craft': 1.0,                // Neutral
      'reflection_meaning_making': 1.1,           // 10% boost - why this matters
      'dialogue_action_texture': 0.7,             // 30% reduction - rarely used
      'originality_specificity_voice': 1.4,       // 40% boost - SPECIFICITY critical
      'structure_pacing_coherence': 1.0,          // Neutral
      'sentence_level_craft': 1.05,               // 5% boost
      'context_constraints_disclosure': 1.2,      // 20% boost - context matters
      'school_program_fit': 2.0,                  // 100% boost - THIS IS THE WHOLE POINT
      'ethical_awareness_humility': 1.0           // Neutral
    },

    mustHave: [
      '3+ specific resources (professors, courses, programs, centers)',
      'Connection to past experience or future goals',
      "Evidence of research (can't be copy-pasted for another school)",
      'Avoid generic praise ("prestigious," "world-class")',
      'Why YOU + why THIS SCHOOL = mutual fit'
    ],

    niceToHave: [
      'Specific professor research interest or methodology',
      'Unique program feature not found elsewhere',
      'Campus visit anecdote or interaction',
      'Specific courses by name and number',
      "Connection to school's values or mission"
    ],

    canSkip: [
      'Extended personal narrative',
      'Vulnerability moments (not the focus)',
      'Sensory description',
      'Metaphors'
    ],

    eliteExamples: [
      // Why Us essays typically not in public exemplar corpus
      // Principles: Name professor research (not just name), cite specific course,
      // reference unique program, connect to past experience
    ],

    scoringNotes: `
      Why Us essays are judged on RESEARCH DEPTH and GENUINE FIT.

      Elite Why Us (90-100):
      - Names 4+ specific resources (Professor X's work on Y, Course ABC 123, Z Center)
      - Shows deep research (methodology, unique offerings)
      - Clear past → present → future arc
      - Could ONLY be written for this school
      - Avoids all generic praise

      Strong Why Us (80-89):
      - Names 3 specific resources
      - Good research but less depth
      - Clear connection to goals
      - Mostly school-specific
      - Minimal generic praise

      Competent Why Us (70-79):
      - Names 2 resources
      - Surface-level research
      - Vague connection to goals
      - Some copy-pasteable sections
      - Some generic praise

      Weak Why Us (<70):
      - Generic resources ("great professors," "amazing facilities")
      - No evidence of research
      - Could be written for any top school
      - Heavy generic praise ("prestigious," "world-class")
      - No personal connection

      RED FLAGS:
      - "I want to attend X because it's a top-ranked school"
      - "The beautiful campus" or "great location"
      - "World-class faculty" without names
      - No specific courses, professors, or programs named
    `
  },

  // ========================================================================
  // COMMUNITY ESSAY
  // ========================================================================
  community: {
    type: 'community',
    typicalWordCount: 500,
    primaryGoal: 'Demonstrate impact on and connection to a community',
    secondaryGoals: [
      'Define your community specifically',
      'Show action taken and impact created',
      'Reveal values and commitment',
      'Demonstrate cultural awareness'
    ],

    dimensionWeightAdjustments: {
      'opening_power_scene_entry': 1.1,
      'narrative_arc_stakes_turn': 1.05,
      'character_interiority_vulnerability': 1.1,
      'show_dont_tell_craft': 1.2,
      'reflection_meaning_making': 1.2,          // Boost - community values matter
      'dialogue_action_texture': 1.05,
      'originality_specificity_voice': 1.25,
      'structure_pacing_coherence': 1.0,
      'sentence_level_craft': 1.1,
      'context_constraints_disclosure': 1.3,     // Boost - context is community
      'school_program_fit': 0.5,                 // Reduced - may connect to school
      'ethical_awareness_humility': 1.3          // Boost - humility + awareness key
    },

    mustHave: [
      'Specific community definition (not generic "my community")',
      'Concrete actions taken',
      'Measurable or observable impact',
      'Personal values revealed through community work',
      'Respect for community (not savior complex)'
    ],

    niceToHave: [
      'Community members named or described',
      'Challenges overcome',
      'Long-term commitment shown',
      'Cultural specificity',
      'Bidirectional learning (what community taught you)'
    ],

    canSkip: [
      'School-specific fit',
      'Extended personal vulnerability'
    ],

    eliteExamples: [
      'berkeley_tech_community_service',  // 20,000 students benefited
      'berkeley_translator_leader'        // NHS food drive, journalism mentorship
    ],

    scoringNotes: `
      Community essays judged on IMPACT, VALUES, and HUMILITY.

      Elite (90-100):
      - Specific community (not generic "my school")
      - Quantified impact or specific evidence
      - Values shown through action
      - Humility (learning from community, not saving them)
      - Cultural awareness

      Avoid: Savior complex, generic communities, vague impact
    `
  },

  // ========================================================================
  // CHALLENGE / ADVERSITY ESSAY
  // ========================================================================
  challenge_adversity: {
    type: 'challenge_adversity',
    typicalWordCount: 500,
    primaryGoal: 'Demonstrate resilience, growth, and problem-solving through adversity',
    secondaryGoals: [
      'Show vulnerability without victimhood',
      'Demonstrate agency in response',
      'Reveal character through how you handled it',
      'Extract growth and learning'
    ],

    dimensionWeightAdjustments: {
      'opening_power_scene_entry': 1.15,
      'narrative_arc_stakes_turn': 1.3,          // CRITICAL - challenge → response → growth
      'character_interiority_vulnerability': 1.4, // CRITICAL - vulnerability central
      'show_dont_tell_craft': 1.2,
      'reflection_meaning_making': 1.25,
      'dialogue_action_texture': 1.1,
      'originality_specificity_voice': 1.2,
      'structure_pacing_coherence': 1.1,
      'sentence_level_craft': 1.1,
      'context_constraints_disclosure': 1.2,
      'school_program_fit': 0.0,
      'ethical_awareness_humility': 1.25         // Growth requires humility
    },

    mustHave: [
      'Specific challenge (not vague "hardship")',
      'Honest vulnerability about struggle',
      'Your agency and actions in response',
      'Growth or learning demonstrated',
      'Balance vulnerability + resilience (not victimhood)'
    ],

    niceToHave: [
      'Turning point moment',
      'Quantified before/after',
      'Ongoing nature of challenge',
      'How it shapes current perspective',
      'Helping others with similar challenges'
    ],

    canSkip: [
      'School fit',
      'Extensive achievement list'
    ],

    eliteExamples: [
      'berkeley_chemistry_failure',       // 19% → B through strategy
      'berkeley_f_to_determination',      // Two F-s → self-discovery
      'berkeley_clammy_hands',            // Anxiety → debate champion
      'princeton_novel_writing',          // Harsh criticism → 10 drafts
      'yale_adhd_advocacy'                // Institutional bias → self-advocacy
    ],

    scoringNotes: `
      Challenge essays judged on HONESTY, AGENCY, and GROWTH.

      Elite (90-100):
      - Specific challenge with vulnerability
      - Clear agency in response (what YOU did)
      - Measurable growth or change
      - Balance vulnerability + strength
      - Avoids victimhood or blame

      Avoid: Vague challenges, excessive victimhood, no agency, trauma dumping
    `
  },

  // ========================================================================
  // INTELLECTUAL VITALITY / CURIOSITY
  // ========================================================================
  intellectual_vitality: {
    type: 'intellectual_vitality',
    typicalWordCount: 500,
    primaryGoal: 'Demonstrate genuine intellectual curiosity and love of learning',
    secondaryGoals: [
      'Show self-directed exploration',
      'Connect across disciplines',
      'Reveal thought process',
      'Demonstrate depth beyond coursework'
    ],

    dimensionWeightAdjustments: {
      'opening_power_scene_entry': 1.2,
      'narrative_arc_stakes_turn': 1.1,
      'character_interiority_vulnerability': 1.05,
      'show_dont_tell_craft': 1.3,              // CRITICAL - show curiosity
      'reflection_meaning_making': 1.4,         // CRITICAL - intellectual depth
      'dialogue_action_texture': 1.0,
      'originality_specificity_voice': 1.3,     // Unique angle matters
      'structure_pacing_coherence': 1.1,
      'sentence_level_craft': 1.15,
      'context_constraints_disclosure': 1.1,
      'school_program_fit': 0.8,
      'ethical_awareness_humility': 1.15        // Intellectual humility
    },

    mustHave: [
      'Specific intellectual pursuit (topic, question, discipline)',
      'Self-directed exploration (not just assigned work)',
      'Depth beyond surface level',
      'Your thought process revealed',
      'Genuine curiosity (not résumé building)'
    ],

    niceToHave: [
      'Interdisciplinary connections',
      'Unusual source of inspiration',
      'Ongoing questions or uncertainty',
      'How you pursued learning independently',
      'Connecting abstract concepts to concrete experiences'
    ],

    canSkip: [
      'Extensive vulnerability',
      'School-specific fit'
    ],

    eliteExamples: [
      'harvard_research_nanoparticles',   // Flow cytometry depth
      'princeton_religious_questioning',  // Science as experiment on faith
      'berkeley_history_passion',         // Avatar → Chinese philosophy
      'princeton_hot_sauce'               // Culinary curiosity across cultures
    ],

    scoringNotes: `
      Intellectual vitality essays judged on DEPTH, CURIOSITY, and AUTHENTICITY.

      Elite (90-100):
      - Specific intellectual pursuit with depth
      - Self-directed exploration beyond class
      - Thought process revealed (not just outcomes)
      - Genuine curiosity (not résumé padding)
      - Connections across disciplines

      Avoid: Generic love of learning, all coursework, no depth, résumé listing
    `
  },

  // ========================================================================
  // IDENTITY / BACKGROUND
  // ========================================================================
  identity_background: {
    type: 'identity_background',
    typicalWordCount: 500,
    primaryGoal: 'Reveal how identity shapes perspective and experiences',
    secondaryGoals: [
      'Cultural specificity and authenticity',
      'Complexity and nuance (not stereotypes)',
      'Growth or evolution in understanding',
      'Connection to values and worldview'
    ],

    dimensionWeightAdjustments: {
      'opening_power_scene_entry': 1.15,
      'narrative_arc_stakes_turn': 1.1,
      'character_interiority_vulnerability': 1.2,
      'show_dont_tell_craft': 1.25,
      'reflection_meaning_making': 1.3,
      'dialogue_action_texture': 1.1,
      'originality_specificity_voice': 1.5,     // CRITICAL - authentic voice
      'structure_pacing_coherence': 1.05,
      'sentence_level_craft': 1.15,
      'context_constraints_disclosure': 1.4,    // Context is identity
      'school_program_fit': 0.5,
      'ethical_awareness_humility': 1.2
    },

    mustHave: [
      'Specific cultural/identity details (language, customs, experiences)',
      'Complexity (not one-dimensional portrayal)',
      'Personal reflection on identity',
      'Authentic voice with cultural markers',
      'Connection to values or perspective'
    ],

    niceToHave: [
      'Evolution in understanding',
      'Tensions or negotiations',
      'Intersectionality',
      'How identity informs future goals',
      'Specific sensory/cultural details'
    ],

    canSkip: [
      'School fit',
      'Achievement listing'
    ],

    eliteExamples: [
      'dartmouth_immigration_seeds',      // Mexican farming heritage, Spanish
      'berkeley_filipino_ambition',       // Second-gen Filipino pressure → motivation
      'berkeley_translator_leader',       // Childhood translator → leader
      'princeton_religious_questioning'   // Kosher observance in secular lab
    ],

    scoringNotes: `
      Identity essays judged on AUTHENTICITY, COMPLEXITY, and SPECIFICITY.

      Elite (90-100):
      - Rich cultural/identity specifics (language, customs, details)
      - Nuanced (not stereotypical)
      - Personal reflection on identity
      - Authentic voice unique to this student
      - Connection to values/worldview

      Avoid: Stereotypes, victimhood, one-dimensional, generic immigrant narrative
    `
  },

  // ========================================================================
  // ACTIVITY TO ESSAY (Expanding on Common App activity)
  // ========================================================================
  activity_to_essay: {
    type: 'activity_to_essay',
    typicalWordCount: 400,
    primaryGoal: 'Go beyond résumé to reveal character, growth, or impact',
    secondaryGoals: [
      'Specific moments over summary',
      'Internal experience over external achievement',
      'Growth or learning revealed',
      'Uniqueness of your role/approach'
    ],

    dimensionWeightAdjustments: {
      'opening_power_scene_entry': 1.2,
      'narrative_arc_stakes_turn': 1.15,
      'character_interiority_vulnerability': 1.2,
      'show_dont_tell_craft': 1.3,
      'reflection_meaning_making': 1.15,
      'dialogue_action_texture': 1.1,
      'originality_specificity_voice': 1.25,
      'structure_pacing_coherence': 1.05,
      'sentence_level_craft': 1.1,
      'context_constraints_disclosure': 1.2,
      'school_program_fit': 0.0,
      'ethical_awareness_humility': 1.1
    },

    mustHave: [
      "Go beyond what's in activity list",
      'Specific moment or scene',
      'Internal experience (not just achievement)',
      'What this reveals about you',
      "Show, don't summarize"
    ],

    niceToHave: [
      'Challenges or failures',
      'Specific skills developed',
      'Impact on others',
      'Evolution over time',
      'Unique approach or role'
    ],

    canSkip: [
      'Comprehensive activity summary',
      'School fit'
    ],

    eliteExamples: [
      'princeton_rowing',                 // Pain paradox reveals psychology
      'unc_color_guard',                  // Confidence journey
      'princeton_novel_writing'           // 6-year writing evolution
    ],

    scoringNotes: `
      Activity essays judged on DEPTH beyond RÉSUMÉ.

      Elite (90-100):
      - Specific moment (not summary)
      - Internal experience revealed
      - Growth or learning shown
      - Goes beyond activity list
      - Unique perspective/approach

      Avoid: Résumé repetition, achievement listing, no interiority
    `
  },

  // ========================================================================
  // OTHER SUPPLEMENTAL
  // ========================================================================
  supplemental_other: {
    type: 'supplemental_other',
    typicalWordCount: 300,
    primaryGoal: 'Varies by prompt - default to authenticity and specificity',
    secondaryGoals: [
      'Address prompt directly',
      'Specific examples and evidence',
      'Authentic voice',
      'Efficiency with words'
    ],

    dimensionWeightAdjustments: {
      // Balanced approach - no extreme adjustments
      'opening_power_scene_entry': 1.0,
      'narrative_arc_stakes_turn': 1.0,
      'character_interiority_vulnerability': 1.0,
      'show_dont_tell_craft': 1.1,
      'reflection_meaning_making': 1.0,
      'dialogue_action_texture': 0.9,
      'originality_specificity_voice': 1.2,
      'structure_pacing_coherence': 1.0,
      'sentence_level_craft': 1.05,
      'context_constraints_disclosure': 1.1,
      'school_program_fit': 0.8,
      'ethical_awareness_humility': 1.0
    },

    mustHave: [
      'Direct response to prompt',
      'Specific examples',
      'Authentic voice',
      'Efficient use of word count'
    ],

    niceToHave: [
      'Personal anecdote',
      'Concrete details',
      'Reflection'
    ],

    canSkip: [
      'Extended narrative arc',
      'Multiple vulnerability moments'
    ],

    eliteExamples: [],

    scoringNotes: `
      Supplemental essays judged on PROMPT RESPONSE and AUTHENTICITY.
      Adapt scoring based on specific prompt type.
    `
  }
};

// ============================================================================
// CALIBRATION FUNCTIONS
// ============================================================================

/**
 * Get adjusted dimension weights for essay type
 */
export function getAdjustedWeights(
  essayType: EssayType,
  baseDimensionScores: Record<string, number>
): Record<string, number> {
  const profile = ESSAY_TYPE_PROFILES[essayType];
  const adjustedScores: Record<string, number> = {};

  Object.keys(baseDimensionScores).forEach(dimension => {
    const baseScore = baseDimensionScores[dimension];
    const adjustment = profile.dimensionWeightAdjustments[dimension] || 1.0;

    // Apply adjustment but cap at 0-10
    adjustedScores[dimension] = Math.min(10, Math.max(0, baseScore * adjustment));
  });

  return adjustedScores;
}

/**
 * Get essay type profile
 */
export function getEssayTypeProfile(essayType: EssayType): EssayTypeProfile {
  return ESSAY_TYPE_PROFILES[essayType];
}

/**
 * Get must-have checklist for essay type
 */
export function getMustHaveChecklist(essayType: EssayType): string[] {
  return ESSAY_TYPE_PROFILES[essayType].mustHave;
}

/**
 * Get elite examples for essay type
 */
export function getEliteExamplesForType(essayType: EssayType): string[] {
  return ESSAY_TYPE_PROFILES[essayType].eliteExamples;
}

/**
 * Get scoring calibration notes for essay type
 */
export function getScoringNotes(essayType: EssayType): string {
  return ESSAY_TYPE_PROFILES[essayType].scoringNotes;
}

/**
 * Determine essay type from prompt or content analysis
 */
export function inferEssayType(
  promptText: string | null | undefined,
  wordCount: number,
  essayText: string
): EssayType {
  if (!promptText) {
    // Use word count and content heuristics
    if (wordCount >= 600) return 'personal_statement';
    if (wordCount <= 360) return 'uc_piq';
    return 'supplemental_other';
  }

  const prompt = promptText.toLowerCase();

  // UC PIQ detection
  if (prompt.includes('uc') || prompt.includes('personal insight')) {
    return 'uc_piq';
  }

  // Why Us detection
  if (prompt.includes('why') && (prompt.includes('school') || prompt.includes('university') || prompt.includes('college') || prompt.includes('major'))) {
    return 'why_us';
  }

  // Community detection
  if (prompt.includes('community') || prompt.includes('belong')) {
    return 'community';
  }

  // Challenge detection
  if (prompt.includes('challenge') || prompt.includes('adversity') || prompt.includes('setback') || prompt.includes('obstacle')) {
    return 'challenge_adversity';
  }

  // Intellectual vitality detection
  if (prompt.includes('intellectual') || prompt.includes('curiosity') || prompt.includes('learn') && prompt.includes('enjoy')) {
    return 'intellectual_vitality';
  }

  // Identity detection
  if (prompt.includes('identity') || prompt.includes('background') || prompt.includes('culture') || prompt.includes('who you are')) {
    return 'identity_background';
  }

  // Activity expansion detection
  if (prompt.includes('activity') || prompt.includes('expand') && prompt.includes('meaningful')) {
    return 'activity_to_essay';
  }

  // Default based on word count
  if (wordCount >= 600) return 'personal_statement';
  if (wordCount <= 360) return 'uc_piq';

  return 'supplemental_other';
}
