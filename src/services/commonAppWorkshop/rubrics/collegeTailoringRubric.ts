/**
 * College Tailoring Rubric
 *
 * A dedicated scoring system that evaluates how well an essay is TAILORED to a specific college.
 * Works alongside the universal supplemental rubric to provide a "tailoring score."
 *
 * **Purpose**:
 * - Score how well suggestions/essays align with college-specific values
 * - Enable feedback loop: measure if targeted enhancements improve tailoring
 * - Provide college-specific improvement guidance
 *
 * **Architecture**:
 * Universal Score (12 dimensions) + Tailoring Score (8 dimensions) = Complete Assessment
 *
 * **The 8 Tailoring Dimensions**:
 * 1. Value Alignment - How well does the essay demonstrate the college's core values?
 * 2. Research Depth - Does the essay show genuine knowledge of specific programs/resources?
 * 3. Tone Match - Does the voice/style match the college's personality?
 * 4. Cliché Avoidance - Does the essay avoid college-specific overused patterns?
 * 5. Prompt Responsiveness - Does the essay address what THIS college's prompt really asks?
 * 6. Distinctiveness - Would this essay work ONLY for this college, not others?
 * 7. Citation Integration - Are college-specific details naturally woven in?
 * 8. Elite Craft - Does the essay demonstrate college-specific elite markers?
 */

import type { CollegeResearch, CollegeCoreValue, CollegeRedFlag, CollegeGreenFlag } from '../types/collegeResearch';

// ============================================================================
// TYPES
// ============================================================================

/**
 * The 8 tailoring dimensions
 */
export type TailoringDimension =
  | 'value_alignment'      // How well essay demonstrates college's core values
  | 'research_depth'       // Knowledge of specific programs, faculty, resources
  | 'tone_match'           // Voice/style alignment with college personality
  | 'cliche_avoidance'     // Avoiding college-specific overused patterns
  | 'prompt_responsiveness'// Addressing what THIS college's prompt really asks
  | 'distinctiveness'      // Would this essay work ONLY for this college?
  | 'citation_integration' // Natural weaving of college-specific details
  | 'elite_craft';         // Demonstrating college-specific elite markers

/**
 * Score for a single tailoring dimension
 */
export interface TailoringDimensionScore {
  dimension: TailoringDimension;
  score: number; // 0-10
  weight: number; // College-specific weight
  evidence: string[]; // Specific examples from text
  issues: string[]; // Problems detected
  improvements: string[]; // How to improve this dimension
}

/**
 * Complete tailoring assessment
 */
export interface TailoringAssessment {
  college_id: string;
  college_name: string;

  // Overall tailoring score (weighted average)
  tailoring_score: number; // 0-100

  // Individual dimension scores
  dimension_scores: TailoringDimensionScore[];

  // Detected patterns
  values_demonstrated: Array<{
    value_id: string;
    value_name: string;
    evidence: string[];
    strength: 'strong' | 'moderate' | 'weak' | 'absent';
  }>;

  cliches_detected: Array<{
    pattern: string;
    severity: 'critical' | 'moderate' | 'minor';
    location: string;
    fix_suggestion: string;
  }>;

  research_signals: Array<{
    type: 'program' | 'faculty' | 'resource' | 'value' | 'generic';
    content: string;
    specificity: 'specific' | 'generic';
  }>;

  elite_markers_present: string[];
  elite_markers_missing: string[];

  // Improvement guidance
  quick_wins: string[]; // Easy improvements
  strategic_improvements: string[]; // Bigger changes
  tailoring_gap: number; // How much better could this be? (0-100 potential improvement)

  // Comparison metadata
  would_work_for_other_colleges: boolean;
  distinctiveness_note: string;
}

/**
 * College-specific dimension weights
 */
export interface CollegeTailoringWeights {
  college_id: string;
  weights: Record<TailoringDimension, number>;
  critical_dimensions: TailoringDimension[];
  rationale: string;
}

// ============================================================================
// DIMENSION DEFINITIONS
// ============================================================================

export interface TailoringDimensionDefinition {
  id: TailoringDimension;
  name: string;
  description: string;
  what_it_measures: string;

  scoring_criteria: {
    excellent: string;  // 9-10
    strong: string;     // 7-8
    adequate: string;   // 5-6
    weak: string;       // 3-4
    poor: string;       // 1-2
  };

  evaluation_questions: string[];
}

export const TAILORING_DIMENSION_DEFINITIONS: Record<TailoringDimension, TailoringDimensionDefinition> = {
  value_alignment: {
    id: 'value_alignment',
    name: 'Value Alignment',
    description: 'How well the essay demonstrates the college\'s core values through concrete examples',
    what_it_measures: 'Whether the essay shows (not tells) alignment with what the college actually values',

    scoring_criteria: {
      excellent: 'Multiple core values demonstrated through specific stories/examples. Evidence is natural, not forced. Shows understanding of WHY these values matter to the college.',
      strong: 'At least 2-3 values demonstrated convincingly. Evidence is specific but could be deeper.',
      adequate: 'Values mentioned or weakly demonstrated. Some evidence but feels surface-level.',
      weak: 'Values not clearly demonstrated. May mention them but without supporting evidence.',
      poor: 'No alignment with college values visible. Could be written for any college.'
    },

    evaluation_questions: [
      'Does the essay demonstrate (not just mention) the college\'s core values?',
      'Is the value demonstration through specific examples, not abstract claims?',
      'Would a dean reading this recognize their college\'s values being embodied?',
      'Are at least 2-3 core values naturally woven into the narrative?',
    ]
  },

  research_depth: {
    id: 'research_depth',
    name: 'Research Depth',
    description: 'Knowledge of specific programs, faculty, resources beyond the obvious',
    what_it_measures: 'Whether the student has done genuine research vs. surface-level browsing',

    scoring_criteria: {
      excellent: 'References specific programs, faculty research, courses, or resources that show deep investigation. Connections feel authentic and relevant to student\'s interests.',
      strong: 'References 2-3 specific elements. Research is evident but could go deeper on the "why this matters to me" connection.',
      adequate: 'References 1-2 specific elements but connections feel surface-level or generic.',
      weak: 'Only references obvious things (campus location, prestige, general reputation).',
      poor: 'No evidence of research. Could be written without visiting the website.'
    },

    evaluation_questions: [
      'Does the essay reference specific programs, courses, or faculty by name?',
      'Are the references relevant to the student\'s stated interests?',
      'Could someone who just read the college\'s homepage write this, or does it show deeper digging?',
      'Are the connections between student interests and college resources specific and authentic?',
    ]
  },

  tone_match: {
    id: 'tone_match',
    name: 'Tone Match',
    description: 'Whether the voice and style align with the college\'s personality',
    what_it_measures: 'Does the essay "sound like" it was written for this college specifically',

    scoring_criteria: {
      excellent: 'Voice perfectly matches college personality. A Stanford essay sounds intellectually curious; an MIT essay sounds hands-on and casual; a Harvard essay sounds ambitious yet grounded.',
      strong: 'Good match overall with minor inconsistencies. Voice generally fits the college culture.',
      adequate: 'Some alignment but voice feels generic. Could work for multiple colleges.',
      weak: 'Voice feels mismatched. Too formal for MIT, too casual for Harvard, etc.',
      poor: 'Complete mismatch. Voice would actively hurt the application at this college.'
    },

    evaluation_questions: [
      'Does the writing style match what this college values?',
      'Would an admissions officer feel this student "gets" their culture?',
      'Is the tone consistent throughout the essay?',
      'Does the essay avoid tone markers that would be red flags for this college?',
    ]
  },

  cliche_avoidance: {
    id: 'cliche_avoidance',
    name: 'Cliché Avoidance',
    description: 'Avoiding patterns that admissions officers see too often for this college',
    what_it_measures: 'Whether the essay avoids college-specific overused patterns and phrases',

    scoring_criteria: {
      excellent: 'No college-specific clichés. Fresh approach that stands out from the thousands of similar essays.',
      strong: 'Mostly cliché-free with 1-2 minor instances that don\'t significantly hurt.',
      adequate: '3-5 clichés present. Essay feels somewhat predictable.',
      weak: 'Multiple major clichés. Essay blends into the stack of similar submissions.',
      poor: 'Cliché-heavy. Uses exactly the phrases admissions officers are tired of seeing.'
    },

    evaluation_questions: [
      'Does the essay avoid using the college\'s own marketing language back at them?',
      'Are there phrases that thousands of other applicants are likely using?',
      'Does the essay take an unexpected angle rather than the obvious one?',
      'Would an admissions officer who reads 50 essays a day find this fresh?',
    ]
  },

  prompt_responsiveness: {
    id: 'prompt_responsiveness',
    name: 'Prompt Responsiveness',
    description: 'Addressing what THIS college\'s specific prompt really asks for',
    what_it_measures: 'Whether the essay answers the actual question, including hidden assessments',

    scoring_criteria: {
      excellent: 'Directly addresses the prompt AND understands its hidden assessment. Every paragraph serves the prompt\'s purpose.',
      strong: 'Addresses the prompt clearly. May miss some nuance of hidden assessment.',
      adequate: 'Answers the surface-level question but misses deeper implications.',
      weak: 'Partially addresses the prompt. Significant tangents or missed elements.',
      poor: 'Doesn\'t answer the actual question. Could be pasted from another application.'
    },

    evaluation_questions: [
      'Does the essay directly address what the prompt asks?',
      'Does it understand the hidden assessment (what the prompt is REALLY testing)?',
      'Is every paragraph serving the prompt\'s purpose?',
      'Would an admissions officer feel their specific question was answered?',
    ]
  },

  distinctiveness: {
    id: 'distinctiveness',
    name: 'Distinctiveness',
    description: 'Whether this essay would work ONLY for this college, not others',
    what_it_measures: 'How college-specific vs. generic the essay is',

    scoring_criteria: {
      excellent: 'This essay could ONLY work for this college. Remove the college name and it would still be obvious which school it\'s for.',
      strong: 'Strongly tailored to this college. Would need significant rewriting for another school.',
      adequate: 'Some tailoring but could work for 2-3 similar colleges with minor changes.',
      weak: 'Largely generic. Could work for many colleges with name swaps.',
      poor: 'Completely generic. Copy-paste with college name insertion.'
    },

    evaluation_questions: [
      'If you removed the college name, would readers still know which college this is for?',
      'Would this essay require significant rewriting to use for a different college?',
      'Are the connections so specific that they couldn\'t apply elsewhere?',
      'Does the essay show why THIS college specifically, not just "a good college"?',
    ]
  },

  citation_integration: {
    id: 'citation_integration',
    name: 'Citation Integration',
    description: 'How naturally college-specific details are woven into the narrative',
    what_it_measures: 'Whether college references feel organic vs. name-dropped',

    scoring_criteria: {
      excellent: 'College details are seamlessly woven into the narrative. References feel essential, not added. Natural flow maintained.',
      strong: 'Good integration with 1-2 references that feel slightly forced.',
      adequate: 'References present but feel like they were inserted rather than organic.',
      weak: 'Name-dropping without real integration. "Stanford\'s Program in X" without meaningful connection.',
      poor: 'No integration or extremely forced references that hurt the narrative.'
    },

    evaluation_questions: [
      'Do college references feel organic to the story being told?',
      'Would removing the college references break the narrative, or is it decorative?',
      'Are references connected to the student\'s actual interests and experiences?',
      'Does the essay flow naturally around college mentions?',
    ]
  },

  elite_craft: {
    id: 'elite_craft',
    name: 'Elite Craft',
    description: 'Demonstrating writing qualities this college specifically values',
    what_it_measures: 'Whether the essay shows college-specific elite writing markers',

    scoring_criteria: {
      excellent: 'Multiple elite markers present. Shows deep understanding of what makes writing excellent for THIS college.',
      strong: '2-3 elite markers present. Demonstrates solid craft for this college.',
      adequate: '1-2 markers present but not fully developed.',
      weak: 'Elite markers absent. Writing is competent but not distinguished for this college.',
      poor: 'Writing actively demonstrates anti-patterns this college dislikes.'
    },

    evaluation_questions: [
      'Does the essay demonstrate the elite craft markers this college values?',
      'Would an admissions officer recognize this as top-tier writing for their school?',
      'Are the college-specific quality markers naturally present?',
      'Does the writing avoid anti-patterns that would hurt at this college?',
    ]
  }
};

// ============================================================================
// COLLEGE-SPECIFIC WEIGHTS
// ============================================================================

/**
 * Default weights (equal weighting)
 */
const DEFAULT_WEIGHTS: Record<TailoringDimension, number> = {
  value_alignment: 15,
  research_depth: 15,
  tone_match: 10,
  cliche_avoidance: 10,
  prompt_responsiveness: 15,
  distinctiveness: 15,
  citation_integration: 10,
  elite_craft: 10,
};

/**
 * Stanford-specific weights
 * Emphasis: Value alignment (intellectual vitality), distinctiveness, elite craft
 */
export const STANFORD_TAILORING_WEIGHTS: CollegeTailoringWeights = {
  college_id: 'stanford',
  weights: {
    value_alignment: 20,      // Intellectual vitality is THE criterion
    research_depth: 12,       // Important but not as critical as values
    tone_match: 12,           // Should sound like genuine curiosity
    cliche_avoidance: 10,     // Avoid "intellectual vitality" phrase itself
    prompt_responsiveness: 12,// Each prompt has specific hidden assessment
    distinctiveness: 15,      // Essay must feel Stanford-specific
    citation_integration: 7,  // Natural > forced
    elite_craft: 12,          // Rabbit hole depth, genuine uncertainty
  },
  critical_dimensions: ['value_alignment', 'distinctiveness', 'elite_craft'],
  rationale: 'Stanford prioritizes intellectual vitality above all else. Essays must show HOW you think, demonstrate self-directed exploration, and feel distinctly Stanford. Elite craft markers like "rabbit hole depth" and "genuine uncertainty" distinguish top essays.',
};

/**
 * MIT-specific weights
 * Emphasis: Tone match (casual/maker), research depth, elite craft (build evidence)
 */
export const MIT_TAILORING_WEIGHTS: CollegeTailoringWeights = {
  college_id: 'mit',
  weights: {
    value_alignment: 15,      // Maker culture, collaboration
    research_depth: 15,       // Specific labs, projects, UROP
    tone_match: 18,           // Casual, hands-on, quirky is essential
    cliche_avoidance: 10,     // Avoid "mens et manus" etc.
    prompt_responsiveness: 12,
    distinctiveness: 12,
    citation_integration: 8,
    elite_craft: 10,          // Build evidence, failure as feature
  },
  critical_dimensions: ['tone_match', 'research_depth', 'value_alignment'],
  rationale: 'MIT values makers and doers. The tone must feel casual and hands-on. Essays should show you\'ve BUILT things, not just thought about them. Specific labs and projects matter.',
};

/**
 * Harvard-specific weights
 * Emphasis: Value alignment (leadership/impact), prompt responsiveness, distinctiveness
 */
export const HARVARD_TAILORING_WEIGHTS: CollegeTailoringWeights = {
  college_id: 'harvard',
  weights: {
    value_alignment: 18,      // Leadership, impact, veritas
    research_depth: 12,
    tone_match: 10,           // Ambitious but grounded
    cliche_avoidance: 12,     // Avoid prestige language
    prompt_responsiveness: 15,// Each prompt tests different aspects
    distinctiveness: 15,
    citation_integration: 8,
    elite_craft: 10,          // Impact trajectory, awareness of stakes
  },
  critical_dimensions: ['value_alignment', 'prompt_responsiveness', 'distinctiveness'],
  rationale: 'Harvard seeks future leaders who will make a difference. Essays must show trajectory from who you are to who you\'ll become. Impact matters, but avoid prestige-focused language.',
};

/**
 * Get weights for a specific college
 */
export function getCollegeTailoringWeights(collegeId: string): CollegeTailoringWeights {
  const weightsMap: Record<string, CollegeTailoringWeights> = {
    stanford: STANFORD_TAILORING_WEIGHTS,
    mit: MIT_TAILORING_WEIGHTS,
    harvard: HARVARD_TAILORING_WEIGHTS,
  };

  return weightsMap[collegeId.toLowerCase()] || {
    college_id: collegeId,
    weights: DEFAULT_WEIGHTS,
    critical_dimensions: ['value_alignment', 'research_depth', 'distinctiveness'],
    rationale: 'Using default weights. Add college-specific weights for better tailoring assessment.',
  };
}

// ============================================================================
// ELITE CRAFT MARKERS BY COLLEGE
// ============================================================================

export interface EliteCraftMarker {
  marker_id: string;
  name: string;
  description: string;
  detection_signals: string[];
  anti_patterns: string[];
  example: string;
}

export const STANFORD_ELITE_MARKERS: EliteCraftMarker[] = [
  {
    marker_id: 'rabbit_hole_depth',
    name: 'Rabbit Hole Depth',
    description: 'Shows intellectual path: question → deeper question → unexpected connections',
    detection_signals: [
      'Follows a chain of questions',
      'Makes unexpected connections between fields',
      'Shows genuine curiosity beyond assignment',
      'References specific sources discovered through exploration',
    ],
    anti_patterns: [
      'Surface-level interest mention',
      'Generic "I\'m curious about..." without depth',
      'Curiosity that stops at first answer',
    ],
    example: 'That CRISPR article led me to bioethics papers, which led me to philosophy of science, which led me to question how we even define "natural"...',
  },
  {
    marker_id: 'genuine_uncertainty',
    name: 'Genuine Uncertainty',
    description: 'Admits what you don\'t know, comfortable with ambiguity',
    detection_signals: [
      'Acknowledges limitations of own understanding',
      'Asks questions without neat answers',
      'Shows comfort with complexity',
      'Doesn\'t oversimplify difficult topics',
    ],
    anti_patterns: [
      'False confidence',
      'Premature conclusions',
      'Oversimplification of complex topics',
    ],
    example: 'I still don\'t know if gene drives are ethical, but I know the question keeps me up at night...',
  },
  {
    marker_id: 'self_directed_exploration',
    name: 'Self-Directed Exploration',
    description: 'Learning that happened outside requirements, beyond assignments',
    detection_signals: [
      'Reading/research beyond class requirements',
      'Self-initiated projects',
      'Exploration during free time',
      'Following curiosity without external motivation',
    ],
    anti_patterns: [
      'Only class-based learning',
      'Externally motivated exploration',
      'Curiosity only when graded',
    ],
    example: 'My AP Bio teacher didn\'t assign this—I spent my summer break reading papers because I couldn\'t stop thinking about it...',
  },
  {
    marker_id: 'cross_domain_connection',
    name: 'Cross-Domain Connection',
    description: 'Links seemingly unrelated fields or ideas',
    detection_signals: [
      'Connects multiple disciplines',
      'Sees patterns across domains',
      'Applies ideas from one field to another',
      'Unexpected but logical connections',
    ],
    anti_patterns: [
      'Single-domain focus only',
      'Forced connections',
      'Generic "interdisciplinary" claims without specifics',
    ],
    example: 'Studying jazz improvisation actually changed how I approach chemistry experiments—both require structured freedom...',
  },
];

export const MIT_ELITE_MARKERS: EliteCraftMarker[] = [
  {
    marker_id: 'build_evidence',
    name: 'Build Evidence',
    description: 'Shows version numbers, iterations, prototypes—proof of making',
    detection_signals: [
      'Mentions specific versions/iterations',
      'Describes prototypes and failures',
      'Shows progression from v1 to vN',
      'Specific technical details',
    ],
    anti_patterns: [
      'Abstract interest without building',
      'Theory without application',
      '"I want to make..." without evidence of making',
    ],
    example: 'The first prototype caught fire. The second worked for 12 seconds. By v7, it could sustain flight for 3 minutes...',
  },
  {
    marker_id: 'failure_as_feature',
    name: 'Failure as Feature',
    description: 'Celebrates productive failure, learns from what didn\'t work',
    detection_signals: [
      'Specific failures described without shame',
      'Learning from what went wrong',
      'Iteration based on failure analysis',
      'Comfort with not succeeding immediately',
    ],
    anti_patterns: [
      'Only success stories',
      'Failure mentioned but minimized',
      'Lessons learned feel generic',
    ],
    example: 'The circuit fried three times before I realized I\'d been reading the schematic upside down. Best lesson in humility I ever got...',
  },
  {
    marker_id: 'collaborative_credit',
    name: 'Collaborative Credit',
    description: 'Names partners, shares credit, shows team thinking',
    detection_signals: [
      'Names specific collaborators',
      'Describes role within team',
      'Credits others for contributions',
      'Shows how collaboration made work better',
    ],
    anti_patterns: [
      'Solo hero narrative',
      'Vague "team" mention without specifics',
      'Taking all credit',
    ],
    example: 'Sarah handled the mechanical design while I focused on electronics. Neither of us could have built this alone...',
  },
];

export const HARVARD_ELITE_MARKERS: EliteCraftMarker[] = [
  {
    marker_id: 'impact_trajectory',
    name: 'Impact Trajectory',
    description: 'Shows past → present → future arc with increasing impact',
    detection_signals: [
      'Clear progression of involvement',
      'Expanding scale of impact',
      'Future vision grounded in past action',
      'Leadership that grew organically',
    ],
    anti_patterns: [
      'Future promises without past evidence',
      'Static involvement',
      'Disconnected future plans',
    ],
    example: 'I started by tutoring one student. That became a program serving 50. Now I\'m working on scaling it statewide...',
  },
  {
    marker_id: 'awareness_of_stakes',
    name: 'Awareness of Stakes',
    description: 'Understands why problems matter beyond personal interest',
    detection_signals: [
      'Connects personal interest to larger issues',
      'Shows understanding of systemic context',
      'Awareness of who is affected',
      'Doesn\'t oversimplify complex social issues',
    ],
    anti_patterns: [
      'Self-focused motivation only',
      'Naive view of complex problems',
      '"I want to help" without understanding why help is needed',
    ],
    example: 'I didn\'t just want to help immigrants—I needed to understand why the system makes it so hard in the first place...',
  },
];

/**
 * Get elite craft markers for a specific college
 */
export function getEliteCraftMarkers(collegeId: string): EliteCraftMarker[] {
  const markersMap: Record<string, EliteCraftMarker[]> = {
    stanford: STANFORD_ELITE_MARKERS,
    mit: MIT_ELITE_MARKERS,
    harvard: HARVARD_ELITE_MARKERS,
  };

  return markersMap[collegeId.toLowerCase()] || [];
}

// ============================================================================
// SCORING UTILITIES
// ============================================================================

/**
 * Calculate weighted tailoring score from dimension scores
 */
export function calculateTailoringScore(
  dimensionScores: TailoringDimensionScore[],
  weights: Record<TailoringDimension, number>
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const score of dimensionScores) {
    const weight = weights[score.dimension] || 10;
    weightedSum += score.score * weight;
    totalWeight += weight;
  }

  // Convert from 0-10 scale to 0-100
  return Math.round((weightedSum / totalWeight) * 10);
}

/**
 * Get quality tier from tailoring score
 */
export function getTailoringTier(score: number): 'excellent' | 'strong' | 'adequate' | 'weak' | 'poor' {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'strong';
  if (score >= 55) return 'adequate';
  if (score >= 40) return 'weak';
  return 'poor';
}

/**
 * Generate improvement suggestions based on dimension scores
 */
export function generateTailoringImprovements(
  dimensionScores: TailoringDimensionScore[],
  collegeId: string
): { quick_wins: string[]; strategic_improvements: string[] } {
  const quick_wins: string[] = [];
  const strategic_improvements: string[] = [];

  const weights = getCollegeTailoringWeights(collegeId);
  const critical = new Set(weights.critical_dimensions);

  for (const score of dimensionScores) {
    if (score.score < 6) {
      const improvement = `Improve ${TAILORING_DIMENSION_DEFINITIONS[score.dimension].name}: ${score.issues[0] || 'Score below threshold'}`;

      if (critical.has(score.dimension)) {
        strategic_improvements.push(improvement);
      } else {
        quick_wins.push(improvement);
      }
    }
  }

  return { quick_wins, strategic_improvements };
}
