/**
 * Dimension Calibration Data
 *
 * Provides context for each rubric dimension:
 * - What does a score mean?
 * - Where does it place you relative to other essays?
 * - What's the competitive benchmark?
 * - What are the tier breakdowns?
 */

import { DimensionCalibration } from './enhancedFeedbackTypes';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPercentileForScore(score: number, dimension: string): string {
  const calibration = DIMENSION_CALIBRATIONS[dimension];
  if (!calibration) return "Unable to determine percentile";

  // Map score to percentile range
  if (score >= 9) return "Top 5%";
  if (score >= 7.5) return "Top 20%";
  if (score >= 6) return "Top 50%";
  if (score >= 4) return "Middle 50%";
  if (score >= 2) return "Bottom 40%";
  return "Bottom 20%";
}

export function getCompetitiveBenchmark(dimension: string): string {
  const calibration = DIMENSION_CALIBRATIONS[dimension];
  return calibration?.competitive_range || "Most competitive essays score 7-9 on this dimension";
}

export function getTierForScore(score: number, dimension: string): number {
  if (score >= 9) return 4; // Elite
  if (score >= 7) return 3; // Strong
  if (score >= 4) return 2; // Adequate
  return 1; // Weak
}

export function explainScore(score: number, dimension: string): string {
  const tier = getTierForScore(score, dimension);

  const explanations: { [key: number]: string } = {
    1: "Your essay needs significant strengthening in this dimension to be competitive. The good news: targeted revision can make a big difference.",
    2: "Your essay is functional but not yet distinctive in this dimension. You're on the right track—now it's about elevating the craft.",
    3: "Your essay is strong in this dimension. You're competitive with most admitted students. Fine-tuning could push you into the elite tier.",
    4: "Your essay is exceptional in this dimension. This is exactly what top schools are looking for. Maintain this standard."
  };

  return explanations[tier] || "Unable to provide context for this score.";
}

// ============================================================================
// DIMENSION CALIBRATIONS
// ============================================================================

export const DIMENSION_CALIBRATIONS: { [dimension: string]: DimensionCalibration } = {

  // ===========================================================================
  // 1. OPENING HOOK
  // ===========================================================================
  opening_power_scene_entry: {
    dimension_name: "Opening Hook & Scene Entry",
    percentile_map: {
      "0-3": "Bottom 20%",
      "4-6": "Middle 50%",
      "7-8": "Top 20%",
      "9-10": "Top 5%"
    },
    competitive_range: "Most admitted students: 7-9",
    elite_threshold: 8.5,
    tiers: [
      {
        tier_number: 1,
        tier_name: "Weak Opening",
        score_range: "0-3",
        description: "Generic, abstract, or clichéd opening. Announces topic instead of showing it.",
        examples: [
          "Starts with 'I have always been interested in...'",
          "Opens with dictionary definition or famous quote",
          "Generic statement that could apply to anyone"
        ],
        advancement_criteria: [
          "Start with a specific moment or visual detail",
          "Drop reader into a scene",
          "Avoid announcing your topic—show it instead"
        ]
      },
      {
        tier_number: 2,
        tier_name: "Adequate Opening",
        score_range: "4-6",
        description: "Functional opening with some specificity, but not yet compelling.",
        examples: [
          "Starts with a specific event but lacks vivid detail",
          "Opens with background/context before getting to the story",
          "Clear but predictable structure"
        ],
        advancement_criteria: [
          "Add sensory detail (what did you see, hear, feel?)",
          "Start in the middle of the action (in medias res)",
          "Create intrigue or tension immediately"
        ]
      },
      {
        tier_number: 3,
        tier_name: "Strong Opening",
        score_range: "7-8",
        description: "Vivid, specific opening that drops reader into a scene. Creates immediate interest.",
        examples: [
          "Opens with dialogue or action",
          "Specific sensory details in first sentence",
          "Unexpected or intriguing detail that makes you want to read more"
        ],
        advancement_criteria: [
          "Elevate craft with literary techniques (paradox, juxtaposition)",
          "Ensure opening foreshadows theme",
          "Make every word count"
        ]
      },
      {
        tier_number: 4,
        tier_name: "Exceptional Opening",
        score_range: "9-10",
        description: "Masterful opening that combines vivid scene-setting with voice, theme, and intrigue.",
        examples: [
          "Opens with surprising statement or paradox",
          "Voice is immediately distinct and authentic",
          "Reader is hooked and invested by end of first paragraph"
        ],
        advancement_criteria: [
          "Already elite—maintain this standard"
        ]
      }
    ]
  },

  // ===========================================================================
  // 2. NARRATIVE ARC & STAKES
  // ===========================================================================
  narrative_arc_stakes_turn: {
    dimension_name: "Narrative Arc & Stakes",
    percentile_map: {
      "0-3": "Bottom 30%",
      "4-6": "Middle 50%",
      "7-8": "Top 25%",
      "9-10": "Top 10%"
    },
    competitive_range: "Most admitted students: 6-8",
    elite_threshold: 8,
    tiers: [
      {
        tier_number: 1,
        tier_name: "Flat / List",
        score_range: "0-3",
        description: "List of events with no clear problem or conflict. Resume prose.",
        examples: [
          "'I did X, then Y, then Z' with no connective tissue",
          "No clear stakes or tension",
          "Events happen but don't build toward anything"
        ],
        advancement_criteria: [
          "Identify a clear problem or conflict",
          "Establish what's at risk if you fail",
          "Show cause-and-effect between events"
        ]
      },
      {
        tier_number: 2,
        tier_name: "Linear Story",
        score_range: "4-6",
        description: "Clear problem and solution, but predictable. May be summary-heavy.",
        examples: [
          "'I had a problem, I worked hard, I solved it'",
          "Stakes are implied but not deeply felt",
          "Tells the reader about struggle instead of showing it"
        ],
        advancement_criteria: [
          "Dramatize the struggle—show specific moments of difficulty",
          "Raise the stakes (what would failure actually mean?)",
          "Add a distinct turning point or moment of decision"
        ]
      },
      {
        tier_number: 3,
        tier_name: "Engaging Story",
        score_range: "7-8",
        description: "Clear conflict, turning point, and stakes. Reader is invested in outcome.",
        examples: [
          "Tension builds throughout the narrative",
          "Stakes are clear and meaningful",
          "Uses scenes (showing) not just summary (telling)"
        ],
        advancement_criteria: [
          "Use sophisticated structure (in medias res, non-linear)",
          "Deepen emotional stakes",
          "Perfect the balance of scene and summary"
        ]
      },
      {
        tier_number: 4,
        tier_name: "Compelling Story",
        score_range: "9-10",
        description: "Masterful structure with high tension, clear stakes, and deep resolution.",
        examples: [
          "Reader is emotionally invested",
          "Outcome feels earned, not predetermined",
          "Sophisticated use of narrative techniques"
        ],
        advancement_criteria: [
          "Already elite—maintain this standard"
        ]
      }
    ]
  },

  // ===========================================================================
  // 3. CHARACTER / VULNERABILITY
  // ===========================================================================
  character_interiority_vulnerability: {
    dimension_name: "Character & Vulnerability",
    percentile_map: {
      "0-3": "Bottom 40%",
      "4-6": "Middle 50%",
      "7-8": "Top 25%",
      "9-10": "Top 10%"
    },
    competitive_range: "Most admitted students: 6-8",
    elite_threshold: 7.5,
    tiers: [
      {
        tier_number: 1,
        tier_name: "Surface-Level",
        score_range: "0-3",
        description: "No meaningful vulnerability. Maintains polished exterior throughout.",
        examples: [
          "Only positive emotions shared",
          "No admission of doubt, fear, or uncertainty",
          "Feels like a highlight reel"
        ],
        advancement_criteria: [
          "Share a moment of genuine doubt or struggle",
          "Admit something unflattering or uncomfortable",
          "Show messy, real interiority"
        ]
      },
      {
        tier_number: 2,
        tier_name: "Acknowledgment",
        score_range: "4-6",
        description: "Mentions vulnerability but doesn't explore it deeply.",
        examples: [
          "'It was hard' without showing HOW it was hard",
          "Surface-level admission ('I wasn't sure I could do it')",
          "Vulnerability quickly resolved or glossed over"
        ],
        advancement_criteria: [
          "Linger in the discomfort—don't rush past it",
          "Show vulnerability through specific moments/reactions",
          "Explore the internal conflict, not just external obstacles"
        ]
      },
      {
        tier_number: 3,
        tier_name: "Authentic",
        score_range: "7-8",
        description: "Meaningful vulnerability that reveals character and builds connection.",
        examples: [
          "Specific moments of doubt, fear, or failure",
          "Honest about limitations or mistakes",
          "Reader connects with the human behind the achievement"
        ],
        advancement_criteria: [
          "Go even deeper—what was the REAL fear underneath?",
          "Use vulnerability to reveal values or identity",
          "Balance vulnerability with agency"
        ]
      },
      {
        tier_number: 4,
        tier_name: "Profound",
        score_range: "9-10",
        description: "Deep, brave vulnerability that transforms the essay. Unforgettable humanity.",
        examples: [
          "Willingness to share uncomfortable truths",
          "Vulnerability feels essential to the story",
          "Reader is moved by the honesty"
        ],
        advancement_criteria: [
          "Already elite—maintain this standard"
        ]
      }
    ]
  },

  // ===========================================================================
  // 4. SHOW DON'T TELL / CRAFT
  // ===========================================================================
  show_dont_tell_craft: {
    dimension_name: "Show Don't Tell / Craft",
    percentile_map: {
      "0-4": "Bottom 40%",
      "5-6": "Middle 50%",
      "7-8": "Top 25%",
      "9-10": "Top 10%"
    },
    competitive_range: "Most admitted students: 7-8",
    elite_threshold: 8,
    tiers: [
      {
        tier_number: 1,
        tier_name: "Summary-Heavy",
        score_range: "0-4",
        description: "Tells about experiences instead of showing them. Abstract and vague.",
        examples: [
          "'I worked hard and learned a lot'",
          "No sensory details or specific moments",
          "Relies on adjectives instead of action"
        ],
        advancement_criteria: [
          "Replace abstractions with concrete details",
          "Show physical actions and reactions",
          "Use dialogue or sensory imagery"
        ]
      },
      {
        tier_number: 2,
        tier_name: "Some Scenes",
        score_range: "5-6",
        description: "Mix of showing and telling. Some concrete details but inconsistent.",
        examples: [
          "Has specific details but doesn't fully develop scenes",
          "Some sensory language mixed with summary",
          "Shows in some places, tells in others"
        ],
        advancement_criteria: [
          "Expand summary into full scenes",
          "Add sensory details throughout",
          "Let actions and dialogue do more work"
        ]
      },
      {
        tier_number: 3,
        tier_name: "Consistent Showing",
        score_range: "7-8",
        description: "Primarily shows through scenes, dialogue, and sensory detail.",
        examples: [
          "Vivid sensory imagery throughout",
          "Uses dialogue effectively",
          "Reader experiences events alongside the writer"
        ],
        advancement_criteria: [
          "Elevate craft with literary techniques",
          "Perfect word choice and imagery",
          "Every sentence does work"
        ]
      },
      {
        tier_number: 4,
        tier_name: "Masterful Craft",
        score_range: "9-10",
        description: "Sophisticated use of literary techniques. Every detail serves the story.",
        examples: [
          "Imagery is both vivid and meaningful",
          "Masterful control of pace and scene",
          "Writing feels effortless but intentional"
        ],
        advancement_criteria: [
          "Already elite—maintain this standard"
        ]
      }
    ]
  },

  // ===========================================================================
  // 5-10: Additional dimensions would follow same pattern
  // ===========================================================================
  // (Reflection, Intellectual Vitality, Originality, Structure, Word Economy, Context)
  // For brevity, I'll add simplified versions:

  reflection_meaning_making: {
    dimension_name: "Reflection & Meaning-Making",
    competitive_range: "Most admitted students: 6-8",
    elite_threshold: 8,
    percentile_map: { "0-3": "Bottom 30%", "4-6": "Middle 50%", "7-8": "Top 20%", "9-10": "Top 5%" },
    tiers: [
      { tier_number: 1, tier_name: "No Reflection", score_range: "0-3", description: "Pure narrative with no meaning-making", examples: [], advancement_criteria: ["Add reflection on what you learned"] },
      { tier_number: 2, tier_name: "Surface Reflection", score_range: "4-6", description: "Generic insights or life lessons", examples: [], advancement_criteria: ["Make insights specific to YOUR experience"] },
      { tier_number: 3, tier_name: "Meaningful Reflection", score_range: "7-8", description: "Specific, earned insights", examples: [], advancement_criteria: ["Connect insights to future/broader applications"] },
      { tier_number: 4, tier_name: "Profound Reflection", score_range: "9-10", description: "Sophisticated meaning-making", examples: [], advancement_criteria: ["Already elite"] }
    ]
  },

  intellectual_vitality_curiosity: {
    dimension_name: "Intellectual Vitality",
    competitive_range: "Most admitted students: 6-8",
    elite_threshold: 7.5,
    percentile_map: { "0-3": "Bottom 30%", "4-6": "Middle 50%", "7-8": "Top 25%", "9-10": "Top 10%" },
    tiers: [
      { tier_number: 1, tier_name: "Passive", score_range: "0-3", description: "No sense of curiosity or intellectual engagement", examples: [], advancement_criteria: ["Show what fascinates you"] },
      { tier_number: 2, tier_name: "Interest", score_range: "4-6", description: "States interest but doesn't show depth", examples: [], advancement_criteria: ["Show HOW you engage with ideas"] },
      { tier_number: 3, tier_name: "Engaged", score_range: "7-8", description: "Clear intellectual curiosity and self-driven learning", examples: [], advancement_criteria: ["Show unexpected connections or discoveries"] },
      { tier_number: 4, tier_name: "Voracious", score_range: "9-10", description: "Infectious intellectual passion", examples: [], advancement_criteria: ["Already elite"] }
    ]
  },

  originality_specificity_voice: {
    dimension_name: "Originality & Voice",
    competitive_range: "Most admitted students: 6-8",
    elite_threshold: 8,
    percentile_map: { "0-3": "Bottom 30%", "4-6": "Middle 50%", "7-8": "Top 20%", "9-10": "Top 5%" },
    tiers: [
      { tier_number: 1, tier_name: "Generic", score_range: "0-3", description: "Could be written by anyone", examples: [], advancement_criteria: ["Add details only YOU would know"] },
      { tier_number: 2, tier_name: "Somewhat Specific", score_range: "4-6", description: "Has some personality but not distinctive", examples: [], advancement_criteria: ["Amplify your unique lens"] },
      { tier_number: 3, tier_name: "Distinctive", score_range: "7-8", description: "Clear voice and specific details", examples: [], advancement_criteria: ["Push voice even further"] },
      { tier_number: 4, tier_name: "Unforgettable", score_range: "9-10", description: "Unmistakably YOU", examples: [], advancement_criteria: ["Already elite"] }
    ]
  },

  structure_pacing_coherence: {
    dimension_name: "Structure & Pacing",
    competitive_range: "Most admitted students: 6-8",
    elite_threshold: 7.5,
    percentile_map: { "0-3": "Bottom 30%", "4-6": "Middle 50%", "7-8": "Top 25%", "9-10": "Top 10%" },
    tiers: [
      { tier_number: 1, tier_name: "Disorganized", score_range: "0-3", description: "Hard to follow", examples: [], advancement_criteria: ["Create clear structure"] },
      { tier_number: 2, tier_name: "Functional", score_range: "4-6", description: "Easy to follow but basic", examples: [], advancement_criteria: ["Vary sentence length and structure"] },
      { tier_number: 3, tier_name: "Smooth", score_range: "7-8", description: "Flows well with good transitions", examples: [], advancement_criteria: ["Use sophisticated structure"] },
      { tier_number: 4, tier_name: "Masterful", score_range: "9-10", description: "Perfect control of pace and flow", examples: [], advancement_criteria: ["Already elite"] }
    ]
  },

  word_economy_craft: {
    dimension_name: "Word Economy",
    competitive_range: "Most admitted students: 6-8",
    elite_threshold: 8,
    percentile_map: { "0-3": "Bottom 30%", "4-6": "Middle 50%", "7-8": "Top 20%", "9-10": "Top 5%" },
    tiers: [
      { tier_number: 1, tier_name: "Wordy", score_range: "0-3", description: "Lots of filler and redundancy", examples: [], advancement_criteria: ["Cut unnecessary words"] },
      { tier_number: 2, tier_name: "Some Excess", score_range: "4-6", description: "Generally clear but could be tighter", examples: [], advancement_criteria: ["Make every word count"] },
      { tier_number: 3, tier_name: "Tight", score_range: "7-8", description: "Crisp, efficient prose", examples: [], advancement_criteria: ["Perfect word choice"] },
      { tier_number: 4, tier_name: "Pristine", score_range: "9-10", description: "Not a word wasted", examples: [], advancement_criteria: ["Already elite"] }
    ]
  },

  context_constraints_disclosure: {
    dimension_name: "Context & Constraints",
    competitive_range: "Context-dependent (not always applicable)",
    elite_threshold: 8,
    percentile_map: { "0-3": "Bottom 40%", "4-6": "Middle 50%", "7-8": "Top 30%", "9-10": "Top 15%" },
    tiers: [
      { tier_number: 1, tier_name: "No Context", score_range: "0-3", description: "Assumes privilege without acknowledgment", examples: [], advancement_criteria: ["Provide relevant context"] },
      { tier_number: 2, tier_name: "Some Context", score_range: "4-6", description: "Mentions constraints but minimal", examples: [], advancement_criteria: ["Show how constraints shaped experience"] },
      { tier_number: 3, tier_name: "Clear Context", score_range: "7-8", description: "Appropriately contextualizes achievements", examples: [], advancement_criteria: ["Use context to deepen narrative"] },
      { tier_number: 4, tier_name: "Context as Asset", score_range: "9-10", description: "Context enhances rather than excuses", examples: [], advancement_criteria: ["Already elite"] }
    ]
  }

};

/**
 * Get full calibration data for a dimension
 */
export function getCalibrationForDimension(dimension: string): DimensionCalibration | null {
  return DIMENSION_CALIBRATIONS[dimension] || null;
}

/**
 * Get tier information for a specific score
 */
export function getTierInfo(score: number, dimension: string): {
  current: any;
  next: any;
} | null {
  const calibration = DIMENSION_CALIBRATIONS[dimension];
  if (!calibration) return null;

  const tierNumber = getTierForScore(score, dimension);
  const currentTier = calibration.tiers.find(t => t.tier_number === tierNumber);
  const nextTier = calibration.tiers.find(t => t.tier_number === tierNumber + 1);

  return {
    current: currentTier || null,
    next: nextTier || null
  };
}
