/**
 * Universal Supplemental Essay Rubric System
 *
 * 12 Universal Dimensions that apply to ALL supplemental essay types.
 * These dimensions are weighted differently per essay type (see typeWeightMatrices.ts).
 *
 * Architecture mirrors PIQ Workshop's proven approach:
 * - Universal dimensions (like PIQ's 13)
 * - Type-specific weights (like PIQ's 8 prompt types)
 * - Issue detection patterns
 * - Quality tier definitions
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * The 12 universal dimensions for supplemental essays
 */
export type SupplementalDimension =
  | 'specificity_evidence'      // Concrete details, numbers, names, examples
  | 'authenticity_voice'        // Genuine voice vs essay-speak
  | 'personal_connection'       // How personally connected to student's life
  | 'fit_demonstration'         // Mutual fit between student and institution
  | 'narrative_clarity'         // Clear structure, logical flow
  | 'growth_transformation'     // Evidence of genuine change/learning
  | 'vulnerability_balance'     // Honest self-reflection without oversharing
  | 'reflection_insight'        // Depth of thinking, self-awareness
  | 'research_depth'            // Deep investigation beyond surface
  | 'strategic_coherence'       // How well essay fits larger application
  | 'prompt_responsiveness'     // Does essay answer what was asked
  | 'impact_memorability';      // Will this essay stick with reader

/**
 * Score for a single dimension (0-10 scale)
 */
export interface DimensionScore {
  dimension: SupplementalDimension;
  score: number; // 0-10
  confidence: number; // 0-1, how confident in this score
  evidence: string[]; // Quotes/observations supporting score
  issues: string[]; // Issue IDs detected
}

/**
 * Quality tier based on overall score
 */
export type QualityTier = 'excellent' | 'strong' | 'needs_work' | 'weak';

/**
 * Complete dimension definition with scoring criteria
 */
export interface DimensionDefinition {
  id: SupplementalDimension;
  name: string;
  description: string;
  what_it_measures: string;

  // Scoring rubric
  scoring_criteria: {
    excellent: string;  // 9-10
    strong: string;     // 7-8
    adequate: string;   // 5-6
    weak: string;       // 3-4
    poor: string;       // 1-2
  };

  // Detection markers
  positive_markers: string[];  // Things that indicate high score
  negative_markers: string[];  // Things that indicate low score
  red_flag_phrases: string[];  // Auto-flag phrases
}

// ============================================================================
// DIMENSION DEFINITIONS
// ============================================================================

export const DIMENSION_DEFINITIONS: Record<SupplementalDimension, DimensionDefinition> = {

  specificity_evidence: {
    id: 'specificity_evidence',
    name: 'Specificity & Evidence',
    description: 'Concrete details, numbers, names, examples vs. vague claims',
    what_it_measures: 'How specific and evidence-backed the content is',

    scoring_criteria: {
      excellent: 'Abundant quantification (numbers, metrics, specific names). Proper nouns, places, dates. Rich sensory detail. Before/after comparisons where relevant.',
      strong: 'Good specificity with some quantification. Mostly specific but occasional vague phrases.',
      adequate: 'Mix of specific and vague. Some numbers but not consistent.',
      weak: 'Mostly vague language ("many," "various," "lots of"). Missing key specifics.',
      poor: 'Almost entirely vague. No concrete evidence provided.'
    },

    positive_markers: [
      'Specific numbers and metrics',
      'Named people, places, organizations',
      'Exact dates or time periods',
      'Sensory details (sights, sounds, smells)',
      'Before/after comparisons with data',
      'Specific course names, professor names',
      'Quantified impact (people helped, hours spent)'
    ],

    negative_markers: [
      'Vague quantifiers (many, some, various, several)',
      'Generic descriptions (great program, amazing opportunity)',
      'Unsubstantiated claims',
      'No sensory grounding',
      'Abstract concepts without concrete examples'
    ],

    red_flag_phrases: [
      'many people',
      'various opportunities',
      'significant impact',
      'lots of',
      'several things',
      'some people',
      'a great program',
      'amazing experiences'
    ]
  },

  authenticity_voice: {
    id: 'authenticity_voice',
    name: 'Authenticity & Voice',
    description: 'Genuine voice vs. essay-speak, age-appropriate vocabulary, natural rhythm',
    what_it_measures: 'Whether the writing sounds like the student, not a template or AI',

    scoring_criteria: {
      excellent: 'No essay-speak whatsoever. Rhythmic variety (short + long sentences). >80% active voice. Sounds like THEM, not a template. Age-appropriate vocabulary.',
      strong: 'Mostly natural but 1-2 essay-speak phrases slip in. Good sentence variety.',
      adequate: 'Some essay-speak present. Voice inconsistent across essay.',
      weak: 'Heavy essay-speak ("this taught me," "through this experience"). Passive voice dominant.',
      poor: 'Sounds like ChatGPT or template. No authentic voice present.'
    },

    positive_markers: [
      'Conversational rhythm',
      'Sentence variety (short and long)',
      'Active voice dominant',
      'Age-appropriate vocabulary',
      'Unique phrases or expressions',
      'Personal speech patterns visible'
    ],

    negative_markers: [
      'Essay-speak phrases',
      'Passive voice dominant',
      'Monotone rhythm (all similar sentence length)',
      'Overly sophisticated vocabulary',
      'AI-like parallel structure',
      'Template language'
    ],

    red_flag_phrases: [
      'this experience taught me',
      'through this, I learned',
      'in conclusion',
      'it is important to note',
      'delve into',
      'furthermore',
      'moreover',
      'firstly, secondly, thirdly',
      'I realized that',
      'this made me understand',
      'I came to appreciate',
      'I have always been passionate',
      'I have always been interested',
      'I have always loved'
    ]
  },

  personal_connection: {
    id: 'personal_connection',
    name: 'Personal Connection',
    description: 'How personally connected the content is to the student\'s actual life',
    what_it_measures: 'Whether claims are grounded in personal experience',

    scoring_criteria: {
      excellent: 'Every claim grounded in personal experience. Clear "why this matters to ME" thread throughout.',
      strong: 'Strong personal connection with occasional generic moments.',
      adequate: 'Some personal connection but feels partially disconnected from lived experience.',
      weak: 'Mostly generic with personal details sprinkled in.',
      poor: 'Could be anyone\'s essay. No personal anchor.'
    },

    positive_markers: [
      'Specific personal anecdotes',
      'Clear connection to past experiences',
      'Explanation of personal significance',
      '"I" statements with specific actions',
      'Unique details only they would know'
    ],

    negative_markers: [
      'Generic statements anyone could make',
      'No personal anecdotes',
      'Claims without personal backing',
      'Could swap in anyone\'s name'
    ],

    red_flag_phrases: [
      'everyone should',
      'people often',
      'it is said that',
      'generally speaking'
    ]
  },

  fit_demonstration: {
    id: 'fit_demonstration',
    name: 'Fit Demonstration',
    description: 'Evidence of mutual fit between student and institution',
    what_it_measures: 'Whether student shows understanding of and alignment with institution',

    scoring_criteria: {
      excellent: 'Clear mutual value proposition. Shows what student brings AND what they\'ll gain. Demonstrates deep understanding of institution\'s culture/values.',
      strong: 'Good fit demonstration with minor gaps in either direction (giving or receiving).',
      adequate: 'Shows interest but unclear on mutual benefit. One-sided.',
      weak: 'Generic fit that could apply to any college/program.',
      poor: 'No fit demonstrated. Just applying because of rankings/prestige.'
    },

    positive_markers: [
      'Mentions specific institutional values',
      'Shows what student will contribute',
      'Shows what student will gain',
      'Demonstrates cultural understanding',
      'Names specific opportunities for engagement'
    ],

    negative_markers: [
      'Only mentions rankings/prestige',
      'One-sided (only receiving, not giving)',
      'Generic reasons (location, weather, reputation)',
      'Could apply to any similar institution'
    ],

    red_flag_phrases: [
      'top-ranked',
      'prestigious',
      'best in the nation',
      'dream school',
      'perfect weather'
    ]
  },

  narrative_clarity: {
    id: 'narrative_clarity',
    name: 'Narrative Clarity',
    description: 'Clear structure, logical flow, reader can follow the story',
    what_it_measures: 'How easy it is for the reader to follow and understand',

    scoring_criteria: {
      excellent: 'Crystal clear arc. Reader never confused. Smooth transitions. Opening hooks, body delivers, ending lands.',
      strong: 'Clear overall but one or two rough transitions.',
      adequate: 'Mostly followable but structure isn\'t tight.',
      weak: 'Confusing structure. Reader has to work to follow.',
      poor: 'No clear structure. Ideas scattered.'
    },

    positive_markers: [
      'Clear opening hook',
      'Smooth transitions',
      'Logical paragraph progression',
      'Strong closing that connects to opening',
      'Each paragraph has clear purpose'
    ],

    negative_markers: [
      'Abrupt topic changes',
      'Unclear transitions',
      'Wandering focus',
      'Weak or missing conclusion',
      'Paragraphs don\'t connect'
    ],

    red_flag_phrases: []
  },

  growth_transformation: {
    id: 'growth_transformation',
    name: 'Growth & Transformation',
    description: 'Evidence of genuine change, learning, or development',
    what_it_measures: 'Whether student shows real growth, not just claims it',

    scoring_criteria: {
      excellent: 'Clear before/after belief shift. Transformation earned through struggle. Specific evidence of behavioral change. No "I learned" statements - shows growth through action.',
      strong: 'Growth present but slightly quick or not fully earned.',
      adequate: 'Some growth shown but feels manufactured or instant.',
      weak: 'States growth without demonstrating it ("I learned teamwork").',
      poor: 'No growth visible or claims feel false.'
    },

    positive_markers: [
      'Before/after contrast shown',
      'Growth through struggle (not instant)',
      'Behavioral change demonstrated',
      'Specific examples of change',
      'Belief shift articulated'
    ],

    negative_markers: [
      '"I learned" statements without evidence',
      'Instant transformation',
      'Generic lessons',
      'Growth stated but not shown',
      'Clichéd takeaways'
    ],

    red_flag_phrases: [
      'I learned that',
      'this taught me to',
      'I realized that',
      'I came to understand',
      'and then I knew'
    ]
  },

  vulnerability_balance: {
    id: 'vulnerability_balance',
    name: 'Vulnerability Balance',
    description: 'Honest self-reflection without oversharing or victimhood',
    what_it_measures: 'Whether student is appropriately vulnerable and honest',

    scoring_criteria: {
      excellent: 'Genuine emotional honesty. Shows specific struggles without wallowing. Balances vulnerability with strength. Physical emotion symptoms present where appropriate.',
      strong: 'Good vulnerability but one moment feels slightly forced or slightly too much.',
      adequate: 'Either too guarded (won\'t show weakness) or overshares (trauma dumping).',
      weak: 'Significant imbalance - either robotic or excessive sharing.',
      poor: 'No vulnerability or inappropriate levels.'
    },

    positive_markers: [
      'Specific struggles named',
      'Emotional honesty without wallowing',
      'Physical emotion symptoms where appropriate',
      'Owns failures/mistakes',
      'Balance of struggle and strength'
    ],

    negative_markers: [
      'Trauma dumping',
      'Victim mentality',
      'Defensive retreat from vulnerability',
      'No struggles shown (too guarded)',
      'Manufactured drama'
    ],

    red_flag_phrases: [
      'vulnerability is strength',
      'asking for help isn\'t weakness',
      'time stood still',
      'my soul trembled',
      'tears streamed down my face'
    ]
  },

  reflection_insight: {
    id: 'reflection_insight',
    name: 'Reflection & Insight',
    description: 'Depth of thinking, self-awareness, ability to extract meaning',
    what_it_measures: 'Whether student can think deeply about their experiences',

    scoring_criteria: {
      excellent: 'Profound insights that transcend the specific situation. Universal wisdom earned through experience. Clear self-realization. Micro-to-macro structure (specific → universal).',
      strong: 'Good insight but occasionally generic or surface-level.',
      adequate: 'Some reflection but doesn\'t dig deep enough.',
      weak: 'Surface observations only. Generic lessons ("hard work pays off").',
      poor: 'No reflection present. Just describes what happened.'
    },

    positive_markers: [
      'Universal insight from specific experience',
      'Self-awareness demonstrated',
      'Micro-to-macro structure',
      'Nuanced thinking',
      'Original insights (not clichéd)'
    ],

    negative_markers: [
      'Generic lessons',
      'Surface observations',
      'No self-awareness',
      'Clichéd wisdom',
      'Just describes without reflecting'
    ],

    red_flag_phrases: [
      'hard work pays off',
      'never give up',
      'teamwork makes the dream work',
      'believe in yourself',
      'everything happens for a reason'
    ]
  },

  research_depth: {
    id: 'research_depth',
    name: 'Research Depth',
    description: 'Evidence of deep investigation beyond surface-level',
    what_it_measures: 'How thoroughly student has researched (for applicable types)',

    scoring_criteria: {
      excellent: 'Names specific resources others miss. Shows investigation beyond website (course syllabi, professor research, student publications). Evidence of conversations with current students/alumni.',
      strong: 'Good research but relies mostly on publicly available info.',
      adequate: 'Basic research. Could have gotten all info from one website visit.',
      weak: 'Surface research. Generic information.',
      poor: 'No research evident. Could be writing about any school.'
    },

    positive_markers: [
      'Specific professor names and research',
      'Specific course names and descriptions',
      'References to student publications/projects',
      'Evidence of campus visit insights',
      'Conversations with students/alumni mentioned',
      'Non-obvious facts about institution'
    ],

    negative_markers: [
      'Only mentions things on main website',
      'Generic program descriptions',
      'Rankings-focused',
      'No specific names',
      'Could apply to similar institutions'
    ],

    red_flag_phrases: [
      'world-renowned',
      'top-ranked program',
      'best professors',
      'excellent reputation'
    ]
  },

  strategic_coherence: {
    id: 'strategic_coherence',
    name: 'Strategic Coherence',
    description: 'How well this essay fits within the larger application narrative',
    what_it_measures: 'Whether this essay adds strategic value to application',

    scoring_criteria: {
      excellent: 'Essay fills a clear gap in application. Shows new dimension not covered elsewhere. Strategic topic choice. Doesn\'t repeat other essays.',
      strong: 'Good strategic fit but some overlap with other materials.',
      adequate: 'Somewhat strategic but doesn\'t feel intentional.',
      weak: 'Random topic choice. Doesn\'t consider application holistically.',
      poor: 'Actively hurts application (repeats, contradicts, or adds nothing).'
    },

    positive_markers: [
      'Shows new dimension of applicant',
      'Complements other essays',
      'Strategic topic choice',
      'Fills gap in application',
      'Adds unique value'
    ],

    negative_markers: [
      'Repeats main essay themes',
      'Contradicts other materials',
      'Random/unfocused topic',
      'Adds no new information',
      'Seems like obligation, not strategy'
    ],

    red_flag_phrases: []
  },

  prompt_responsiveness: {
    id: 'prompt_responsiveness',
    name: 'Prompt Responsiveness',
    description: 'Does the essay actually answer what was asked?',
    what_it_measures: 'Whether student directly addresses the prompt',

    scoring_criteria: {
      excellent: 'Directly and completely answers the prompt. Every paragraph connects to the question. No tangents.',
      strong: 'Mostly responsive but one section feels tangential.',
      adequate: 'Addresses prompt but not head-on. Dancing around it.',
      weak: 'Partially answers prompt. Significant tangents.',
      poor: 'Doesn\'t answer the prompt. Wrong essay for the question.'
    },

    positive_markers: [
      'Direct answer to prompt',
      'All content connects to question',
      'Clear thesis related to prompt',
      'Stays on topic throughout'
    ],

    negative_markers: [
      'Tangential content',
      'Indirect answer',
      'Drifts from prompt',
      'Generic essay not tailored to prompt'
    ],

    red_flag_phrases: []
  },

  impact_memorability: {
    id: 'impact_memorability',
    name: 'Impact & Memorability',
    description: 'Will this essay stick with the reader?',
    what_it_measures: 'Whether reader will remember this essay',

    scoring_criteria: {
      excellent: 'Reader will remember this essay tomorrow. Unique angle, memorable phrases, emotional resonance. "Coffee test" - would discuss this with colleagues.',
      strong: 'Good essay but might blend with others.',
      adequate: 'Competent but forgettable.',
      weak: 'Generic. Will not be remembered.',
      poor: 'Actively unmemorable or negatively memorable.'
    },

    positive_markers: [
      'Unique angle or approach',
      'Memorable phrases or images',
      'Emotional resonance',
      'Surprising or unexpected content',
      'Would want to discuss with others'
    ],

    negative_markers: [
      'Generic approach',
      'No memorable moments',
      'Predictable content',
      'Blends with other essays',
      'Nothing stands out'
    ],

    red_flag_phrases: []
  }
};

// ============================================================================
// QUALITY TIER DEFINITIONS
// ============================================================================

export interface QualityTierDefinition {
  tier: QualityTier;
  score_range: { min: number; max: number };
  name: string;
  description: string;
  universal_markers: string[];
}

export const QUALITY_TIER_DEFINITIONS: Record<QualityTier, QualityTierDefinition> = {
  excellent: {
    tier: 'excellent',
    score_range: { min: 85, max: 100 },
    name: 'Excellent - Would Stand Out',
    description: 'Essay that would make an admissions officer sit up and take notice',
    universal_markers: [
      '8+ dimensions score 8.0 or higher',
      'No dimension below 6.0',
      'At least 3 dimensions at 9.0+',
      'Zero essay-speak or AI patterns',
      'Reader would remember this essay'
    ]
  },

  strong: {
    tier: 'strong',
    score_range: { min: 70, max: 84 },
    name: 'Strong - Competitive',
    description: 'Solid essay that would be competitive at selective schools',
    universal_markers: [
      'Most dimensions 7.0-8.0',
      'No more than 2 dimensions below 6.0',
      'Clear strengths in 3+ dimensions',
      'Mostly authentic voice with minor slips',
      'Good essay but might blend with others'
    ]
  },

  needs_work: {
    tier: 'needs_work',
    score_range: { min: 50, max: 69 },
    name: 'Needs Work - Forgettable',
    description: 'Essay that needs significant revision to be competitive',
    universal_markers: [
      'Mix of 5-7 scores',
      'Multiple dimensions below 6.0',
      'Voice inconsistent or templated',
      'Generic lessons or statements present',
      'Competent but unmemorable'
    ]
  },

  weak: {
    tier: 'weak',
    score_range: { min: 0, max: 49 },
    name: 'Weak - Needs Major Revision',
    description: 'Essay that would likely hurt the application',
    universal_markers: [
      'Multiple dimensions below 5.0',
      'Heavy essay-speak or AI patterns',
      'No authentic voice',
      'Generic throughout',
      'Would hurt application'
    ]
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get dimension definition by ID
 */
export function getDimensionDefinition(dimension: SupplementalDimension): DimensionDefinition {
  return DIMENSION_DEFINITIONS[dimension];
}

/**
 * Get all dimension IDs
 */
export function getAllDimensions(): SupplementalDimension[] {
  return Object.keys(DIMENSION_DEFINITIONS) as SupplementalDimension[];
}

/**
 * Get quality tier for a score
 */
export function getQualityTier(score: number): QualityTier {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'strong';
  if (score >= 50) return 'needs_work';
  return 'weak';
}

/**
 * Get quality tier definition
 */
export function getQualityTierDefinition(tier: QualityTier): QualityTierDefinition {
  return QUALITY_TIER_DEFINITIONS[tier];
}

/**
 * Check if phrase is a red flag for any dimension
 */
export function isRedFlagPhrase(phrase: string): { isRedFlag: boolean; dimensions: SupplementalDimension[] } {
  const lowerPhrase = phrase.toLowerCase();
  const flaggedDimensions: SupplementalDimension[] = [];

  for (const [dimensionId, definition] of Object.entries(DIMENSION_DEFINITIONS)) {
    for (const redFlag of definition.red_flag_phrases) {
      if (lowerPhrase.includes(redFlag.toLowerCase())) {
        flaggedDimensions.push(dimensionId as SupplementalDimension);
        break;
      }
    }
  }

  return {
    isRedFlag: flaggedDimensions.length > 0,
    dimensions: flaggedDimensions
  };
}

/**
 * Get score band description (9-10, 7-8, etc.)
 */
export function getScoreBandDescription(dimension: SupplementalDimension, score: number): string {
  const def = DIMENSION_DEFINITIONS[dimension];
  if (score >= 9) return def.scoring_criteria.excellent;
  if (score >= 7) return def.scoring_criteria.strong;
  if (score >= 5) return def.scoring_criteria.adequate;
  if (score >= 3) return def.scoring_criteria.weak;
  return def.scoring_criteria.poor;
}
