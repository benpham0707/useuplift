/**
 * Character Dimension Assessment Rubrics
 *
 * 7-dimensional character assessment framework used in Stage 2.
 * Each dimension is scored on the Harvard 1-6 scale with detailed criteria.
 *
 * DIMENSIONS:
 * 1. Intellectual Vitality - Curiosity, depth of thought, love of learning
 * 2. Leadership Quality - Initiative, influence, vision
 * 3. Community Impact - Service, contribution, empathy
 * 4. Personal Growth - Self-awareness, resilience, maturity
 * 5. Resilience/Grit - Overcoming challenges, persistence
 * 6. Creativity/Innovation - Original thinking, problem-solving
 * 7. Authenticity/Voice - Genuine self-expression, unique perspective
 */

import { HarvardScore, CharacterDimension } from '../types';

// ============================================================================
// DIMENSION DEFINITIONS
// ============================================================================

export interface DimensionRubric {
  dimension: CharacterDimension;
  name: string;
  description: string;
  weight: number; // Relative importance (weights sum to 1.0)
  levelCriteria: Record<HarvardScore, LevelCriteria>;
  evidenceTypes: string[];
  redFlags: string[];
  commonMistakes: string[];
}

export interface LevelCriteria {
  score: HarvardScore;
  label: string;
  description: string;
  indicators: string[];
  examples: string[];
}

// ============================================================================
// DIMENSION WEIGHTS
// ============================================================================

/**
 * Weights for each character dimension in overall assessment
 * Calibrated based on admissions research
 */
export const DIMENSION_WEIGHTS: Record<CharacterDimension, number> = {
  intellectual_vitality: 0.20,
  leadership_quality: 0.15,
  community_impact: 0.12,
  personal_growth: 0.15,
  resilience_grit: 0.13,
  creativity_innovation: 0.10,
  authenticity_voice: 0.15,
};

// ============================================================================
// INTELLECTUAL VITALITY RUBRIC
// ============================================================================

export const INTELLECTUAL_VITALITY_RUBRIC: DimensionRubric = {
  dimension: 'intellectual_vitality',
  name: 'Intellectual Vitality',
  description: 'Demonstrates genuine curiosity, depth of thought, and passion for learning',
  weight: DIMENSION_WEIGHTS.intellectual_vitality,
  levelCriteria: {
    1: {
      score: 1,
      label: 'Exceptional',
      description: 'Extraordinary intellectual depth that shapes their environment',
      indicators: [
        'Original research or scholarship at professional level',
        'Self-directed learning that exceeds curriculum significantly',
        'Intellectual work recognized by experts in the field',
        'Clear, unique intellectual identity that drives all activities',
      ],
      examples: [
        'Published research in peer-reviewed journal',
        'Created curriculum adopted by schools',
        'Developed novel theory or methodology',
        'Invited to speak at academic conferences',
      ],
    },
    2: {
      score: 2,
      label: 'Outstanding',
      description: 'Exceptional intellectual engagement that stands out clearly',
      indicators: [
        'Independent projects demonstrating deep expertise',
        'Actively pursues knowledge beyond requirements',
        'Can articulate sophisticated understanding of complex topics',
        'Intellectual pursuits show clear passion and direction',
      ],
      examples: [
        'Self-taught advanced topics (e.g., machine learning, quantum physics)',
        'Research internship with meaningful contribution',
        'Founded academic club with substantive programming',
        'Deep expertise in niche academic area',
      ],
    },
    3: {
      score: 3,
      label: 'Strong',
      description: 'Clear intellectual curiosity that goes beyond academics',
      indicators: [
        'Engages with ideas beyond classroom requirements',
        'Shows intellectual initiative in some areas',
        'Can discuss academic interests with genuine enthusiasm',
        'Some evidence of independent intellectual exploration',
      ],
      examples: [
        'Extensive reading in area of interest',
        'Academic competition participation with depth',
        'Thoughtful personal projects',
        'Seeks out advanced coursework',
      ],
    },
    4: {
      score: 4,
      label: 'Good',
      description: 'Capable student with some intellectual interests',
      indicators: [
        'Solid academic performance',
        'Completes advanced coursework successfully',
        'Some extracurricular academic engagement',
        'Can articulate academic interests when asked',
      ],
      examples: [
        'AP/honors courses with good grades',
        'Participates in academic clubs',
        'Shows interest in some subjects',
      ],
    },
    5: {
      score: 5,
      label: 'Average',
      description: 'Meets expectations without standing out intellectually',
      indicators: [
        'Adequate academic performance',
        'Limited intellectual engagement beyond requirements',
        'Difficulty articulating intellectual passions',
      ],
      examples: [
        'Standard coursework completion',
        'No evidence of self-directed learning',
      ],
    },
    6: {
      score: 6,
      label: 'Concerning',
      description: 'Lacks intellectual engagement or curiosity',
      indicators: [
        'Minimal academic engagement',
        'No evidence of intellectual curiosity',
        'Avoids challenging material',
      ],
      examples: [
        'Below-average academic performance',
        'No intellectual interests evident',
      ],
    },
  },
  evidenceTypes: [
    'Course selection and performance',
    'Independent projects or research',
    'Reading habits and self-education',
    'Academic competitions',
    'Essays discussing intellectual interests',
    'Teacher recommendations',
  ],
  redFlags: [
    'Course selection doesn\'t match stated interests',
    'No evidence of learning beyond requirements',
    'Intellectual interests seem performative',
    'Can\'t discuss interests with depth',
  ],
  commonMistakes: [
    'Listing courses taken without showing engagement',
    'Claiming interests without evidence',
    'Confusing grades with intellectual vitality',
  ],
};

// ============================================================================
// LEADERSHIP QUALITY RUBRIC
// ============================================================================

export const LEADERSHIP_QUALITY_RUBRIC: DimensionRubric = {
  dimension: 'leadership_quality',
  name: 'Leadership Quality',
  description: 'Shows initiative, influences others positively, and demonstrates vision',
  weight: DIMENSION_WEIGHTS.leadership_quality,
  levelCriteria: {
    1: {
      score: 1,
      label: 'Exceptional',
      description: 'Transformative leader who creates lasting change',
      indicators: [
        'Founded organization with significant impact',
        'Led initiative affecting 1000+ people',
        'Demonstrated vision that others follow',
        'Creates opportunities for others to lead',
      ],
      examples: [
        'Founded nonprofit with measurable community impact',
        'Led school-wide policy change',
        'Built team that continues after their departure',
        'Mentored multiple leaders',
      ],
    },
    2: {
      score: 2,
      label: 'Outstanding',
      description: 'Clear leader who drives meaningful change',
      indicators: [
        'Holds significant leadership position with impact',
        'Initiated new programs or improvements',
        'Others look to them for guidance',
        'Demonstrates both vision and execution',
      ],
      examples: [
        'Student body president with initiatives',
        'Team captain who transformed team culture',
        'Started successful club from scratch',
        'Led major community project',
      ],
    },
    3: {
      score: 3,
      label: 'Strong',
      description: 'Effective leader in their domain',
      indicators: [
        'Holds leadership position with some achievements',
        'Takes initiative within their role',
        'Respected by peers',
        'Can point to specific contributions',
      ],
      examples: [
        'Club president with some new initiatives',
        'Section leader who mentors others',
        'Organized events or projects',
        'Demonstrates reliability and responsibility',
      ],
    },
    4: {
      score: 4,
      label: 'Good',
      description: 'Shows leadership potential',
      indicators: [
        'Has held some leadership roles',
        'Participates actively in groups',
        'Takes responsibility when asked',
      ],
      examples: [
        'Club officer with basic responsibilities',
        'Group project leader',
        'Informal leadership in some contexts',
      ],
    },
    5: {
      score: 5,
      label: 'Average',
      description: 'Follows rather than leads',
      indicators: [
        'Participates but doesn\'t take initiative',
        'No formal leadership experience',
        'Reliable but not proactive',
      ],
      examples: [
        'Active club member',
        'Team player without leadership',
      ],
    },
    6: {
      score: 6,
      label: 'Concerning',
      description: 'No leadership evidence',
      indicators: [
        'No involvement in group activities',
        'No evidence of initiative',
      ],
      examples: [
        'Limited extracurricular involvement',
        'No collaborative experiences',
      ],
    },
  },
  evidenceTypes: [
    'Formal leadership positions',
    'Initiatives started or led',
    'Impact on organizations',
    'Peer testimonials',
    'Examples of influence',
  ],
  redFlags: [
    'Many titles without accomplishments',
    'Leadership positions held briefly',
    'Can\'t describe what they actually did',
    'No evidence others followed their lead',
  ],
  commonMistakes: [
    'Equating titles with leadership',
    'Listing positions without impact',
    'Not showing how they influenced others',
  ],
};

// ============================================================================
// COMMUNITY IMPACT RUBRIC
// ============================================================================

export const COMMUNITY_IMPACT_RUBRIC: DimensionRubric = {
  dimension: 'community_impact',
  name: 'Community Impact',
  description: 'Demonstrates genuine service, contribution, and empathy for others',
  weight: DIMENSION_WEIGHTS.community_impact,
  levelCriteria: {
    1: {
      score: 1,
      label: 'Exceptional',
      description: 'Created transformative, sustainable community change',
      indicators: [
        'Founded or led organization with measurable impact',
        'Created sustainable solution to community problem',
        'Impact continues beyond their involvement',
        'Deep, genuine commitment to cause',
      ],
      examples: [
        'Founded tutoring program serving 100+ students annually',
        'Advocacy that changed local policy',
        'Created sustainable infrastructure for service',
      ],
    },
    2: {
      score: 2,
      label: 'Outstanding',
      description: 'Significant, sustained community contribution',
      indicators: [
        'Deep commitment to specific cause (500+ hours)',
        'Leadership role in service organization',
        'Measurable positive outcomes',
        'Clear personal connection to cause',
      ],
      examples: [
        'Led major community service initiative',
        'Long-term mentorship with results',
        'Organized events benefiting hundreds',
      ],
    },
    3: {
      score: 3,
      label: 'Strong',
      description: 'Meaningful, consistent community engagement',
      indicators: [
        'Regular service commitment (100+ hours)',
        'Some leadership or specialized role',
        'Clear care for those served',
        'Consistent with one organization',
      ],
      examples: [
        'Weekly volunteer at same organization for years',
        'Active in school service club with projects',
        'Tutoring with documented student improvement',
      ],
    },
    4: {
      score: 4,
      label: 'Good',
      description: 'Some community involvement',
      indicators: [
        'Participates in service activities',
        'Some volunteer hours',
        'Basic empathy and care',
      ],
      examples: [
        'Participates in service events',
        'Some volunteer experience',
      ],
    },
    5: {
      score: 5,
      label: 'Average',
      description: 'Minimal community engagement',
      indicators: [
        'Limited volunteer experience',
        'Service feels obligatory',
      ],
      examples: [
        'Required service hours only',
        'One-time events',
      ],
    },
    6: {
      score: 6,
      label: 'Concerning',
      description: 'No community engagement',
      indicators: [
        'No service or volunteer experience',
        'No evidence of care for community',
      ],
      examples: [
        'No volunteer work',
      ],
    },
  },
  evidenceTypes: [
    'Volunteer hours and consistency',
    'Impact metrics',
    'Leadership in service',
    'Personal connection to cause',
    'Sustainability of contribution',
  ],
  redFlags: [
    'Service tourism (mission trips without follow-up)',
    'Hours without impact',
    'No connection to community served',
    'Service only for college apps',
  ],
  commonMistakes: [
    'Listing hours without showing impact',
    'Many causes without depth in any',
    'Can\'t articulate why they serve',
  ],
};

// ============================================================================
// PERSONAL GROWTH RUBRIC
// ============================================================================

export const PERSONAL_GROWTH_RUBRIC: DimensionRubric = {
  dimension: 'personal_growth',
  name: 'Personal Growth',
  description: 'Demonstrates self-awareness, maturity, and continuous development',
  weight: DIMENSION_WEIGHTS.personal_growth,
  levelCriteria: {
    1: {
      score: 1,
      label: 'Exceptional',
      description: 'Remarkable maturity and self-understanding',
      indicators: [
        'Exceptional emotional intelligence',
        'Clear evidence of transformation',
        'Helps others with their growth',
        'Wisdom beyond their years',
      ],
      examples: [
        'Transformed adversity into purpose',
        'Demonstrates sophisticated self-awareness',
        'Mentors others through challenges',
      ],
    },
    2: {
      score: 2,
      label: 'Outstanding',
      description: 'Strong self-awareness and maturity',
      indicators: [
        'Articulates clear personal development',
        'Learned from failures and setbacks',
        'Shows genuine reflection',
        'Changed behavior based on learning',
      ],
      examples: [
        'Clear growth narrative with evidence',
        'Overcame significant challenge',
        'Shows evolution in activities/interests',
      ],
    },
    3: {
      score: 3,
      label: 'Strong',
      description: 'Good self-awareness and some growth',
      indicators: [
        'Can reflect on experiences',
        'Some evidence of change over time',
        'Acknowledges weaknesses',
        'Shows learning from experiences',
      ],
      examples: [
        'Discusses lessons learned',
        'Shows improvement over time',
        'Demonstrates self-reflection',
      ],
    },
    4: {
      score: 4,
      label: 'Good',
      description: 'Basic self-awareness',
      indicators: [
        'Some reflection ability',
        'Acknowledges room for growth',
      ],
      examples: [
        'Can discuss strengths/weaknesses',
        'Shows some maturity',
      ],
    },
    5: {
      score: 5,
      label: 'Average',
      description: 'Limited self-awareness',
      indicators: [
        'Difficulty articulating growth',
        'Limited reflection',
      ],
      examples: [
        'Surface-level self-description',
      ],
    },
    6: {
      score: 6,
      label: 'Concerning',
      description: 'No evidence of self-awareness',
      indicators: [
        'Cannot discuss personal growth',
        'Blames others for setbacks',
      ],
      examples: [
        'No reflection evident',
      ],
    },
  },
  evidenceTypes: [
    'Personal essays',
    'Evolution of activities/interests',
    'Response to challenges',
    'Self-reflection quality',
  ],
  redFlags: [
    'Blames others consistently',
    'No acknowledgment of weaknesses',
    'Growth narratives feel fabricated',
    'No change over four years',
  ],
  commonMistakes: [
    'Claiming growth without evidence',
    'Overly negative self-assessment',
    'Generic growth statements',
  ],
};

// ============================================================================
// RESILIENCE/GRIT RUBRIC
// ============================================================================

export const RESILIENCE_GRIT_RUBRIC: DimensionRubric = {
  dimension: 'resilience_grit',
  name: 'Resilience/Grit',
  description: 'Shows persistence through challenges and ability to overcome adversity',
  weight: DIMENSION_WEIGHTS.resilience_grit,
  levelCriteria: {
    1: {
      score: 1,
      label: 'Exceptional',
      description: 'Overcame extraordinary challenges',
      indicators: [
        'Succeeded despite significant adversity',
        'Used challenges to fuel achievement',
        'Helps others through similar struggles',
        'Demonstrates remarkable persistence',
      ],
      examples: [
        'Excelled academically while facing major hardship',
        'Built success from significantly disadvantaged position',
        'Transformed obstacle into opportunity',
      ],
    },
    2: {
      score: 2,
      label: 'Outstanding',
      description: 'Clear evidence of overcoming significant challenges',
      indicators: [
        'Persisted through meaningful adversity',
        'Maintained performance despite setbacks',
        'Demonstrates long-term commitment',
        'Bounced back from failures',
      ],
      examples: [
        'Recovered from academic setback',
        'Continued activity despite major obstacle',
        'Maintained commitments through hardship',
      ],
    },
    3: {
      score: 3,
      label: 'Strong',
      description: 'Shows persistence and resilience',
      indicators: [
        'Stuck with commitments through difficulties',
        'Learned from setbacks',
        'Demonstrates determination',
      ],
      examples: [
        'Improved after initial struggles',
        'Long-term commitment to activity',
        'Handled normal challenges well',
      ],
    },
    4: {
      score: 4,
      label: 'Good',
      description: 'Some evidence of persistence',
      indicators: [
        'Maintained activities over time',
        'Handled minor setbacks',
      ],
      examples: [
        'Multi-year commitment',
        'Some recovery from difficulty',
      ],
    },
    5: {
      score: 5,
      label: 'Average',
      description: 'Limited evidence of resilience',
      indicators: [
        'Drops activities when challenging',
        'Limited long-term commitments',
      ],
      examples: [
        'Short-term involvement pattern',
      ],
    },
    6: {
      score: 6,
      label: 'Concerning',
      description: 'Pattern of giving up',
      indicators: [
        'Quits when faced with difficulty',
        'No long-term commitments',
      ],
      examples: [
        'Pattern of incomplete commitments',
      ],
    },
  },
  evidenceTypes: [
    'Challenges overcome',
    'Long-term commitments',
    'Response to setbacks',
    'Persistence patterns',
  ],
  redFlags: [
    'Pattern of quitting',
    'Always blames circumstances',
    'No evidence of handling difficulty',
    'Fabricated adversity narratives',
  ],
  commonMistakes: [
    'Manufacturing hardship',
    'Not acknowledging privilege',
    'Confusing normal challenges with adversity',
  ],
};

// ============================================================================
// CREATIVITY/INNOVATION RUBRIC
// ============================================================================

export const CREATIVITY_INNOVATION_RUBRIC: DimensionRubric = {
  dimension: 'creativity_innovation',
  name: 'Creativity/Innovation',
  description: 'Demonstrates original thinking and creative problem-solving',
  weight: DIMENSION_WEIGHTS.creativity_innovation,
  levelCriteria: {
    1: {
      score: 1,
      label: 'Exceptional',
      description: 'Truly innovative thinker who creates new things',
      indicators: [
        'Created something genuinely new',
        'Innovation recognized externally',
        'Solves problems in novel ways',
        'Creative work has real impact',
      ],
      examples: [
        'Invented product or process',
        'Published creative work professionally',
        'Won recognition for innovation',
        'Created original art/music/writing at high level',
      ],
    },
    2: {
      score: 2,
      label: 'Outstanding',
      description: 'Strong creative abilities with evidence',
      indicators: [
        'Creates original work regularly',
        'Unique approach to problems',
        'Creative skills recognized',
        'Combines ideas in new ways',
      ],
      examples: [
        'Award-winning creative work',
        'Unique projects that stand out',
        'Creative entrepreneurship',
      ],
    },
    3: {
      score: 3,
      label: 'Strong',
      description: 'Shows creative thinking',
      indicators: [
        'Has creative outlet or hobby',
        'Shows some original thinking',
        'Engages in creative activities',
      ],
      examples: [
        'Active in arts or creative writing',
        'Original approach to projects',
        'Creative problem-solving evident',
      ],
    },
    4: {
      score: 4,
      label: 'Good',
      description: 'Some creative engagement',
      indicators: [
        'Participates in creative activities',
        'Can think outside the box sometimes',
      ],
      examples: [
        'Takes art/music classes',
        'Shows creativity in schoolwork',
      ],
    },
    5: {
      score: 5,
      label: 'Average',
      description: 'Limited creative expression',
      indicators: [
        'Follows established patterns',
        'Limited creative engagement',
      ],
      examples: [
        'No creative activities',
      ],
    },
    6: {
      score: 6,
      label: 'Concerning',
      description: 'No creative evidence',
      indicators: [
        'No creative expression',
        'Only does what\'s required',
      ],
      examples: [
        'Purely conformist approach',
      ],
    },
  },
  evidenceTypes: [
    'Creative work portfolio',
    'Innovation projects',
    'Problem-solving examples',
    'Original ideas implemented',
  ],
  redFlags: [
    'Claims creativity without portfolio',
    'Work seems derivative',
    'No evidence of original thought',
  ],
  commonMistakes: [
    'Equating participation with creativity',
    'Not showing actual creative work',
    'Claiming innovation without evidence',
  ],
};

// ============================================================================
// AUTHENTICITY/VOICE RUBRIC
// ============================================================================

export const AUTHENTICITY_VOICE_RUBRIC: DimensionRubric = {
  dimension: 'authenticity_voice',
  name: 'Authenticity/Voice',
  description: 'Expresses genuine self and unique perspective',
  weight: DIMENSION_WEIGHTS.authenticity_voice,
  levelCriteria: {
    1: {
      score: 1,
      label: 'Exceptional',
      description: 'Unmistakably authentic with powerful voice',
      indicators: [
        'Completely unique perspective',
        'Voice is unmistakable and memorable',
        'Deeply genuine in all materials',
        'Clear sense of self that guides choices',
      ],
      examples: [
        'Essays are distinctively theirs',
        'Activities reflect genuine passion',
        'Consistent authentic narrative',
      ],
    },
    2: {
      score: 2,
      label: 'Outstanding',
      description: 'Strong authentic voice throughout',
      indicators: [
        'Essays feel genuinely personal',
        'Activities align with stated interests',
        'Clear individual perspective',
        'Not trying to be someone else',
      ],
      examples: [
        'Cohesive personal narrative',
        'Unique take on common experiences',
        'Genuine passion evident',
      ],
    },
    3: {
      score: 3,
      label: 'Strong',
      description: 'Authentic in most areas',
      indicators: [
        'Generally genuine presentation',
        'Some unique voice in essays',
        'Mostly coherent narrative',
      ],
      examples: [
        'Essays show personality',
        'Activities reflect interests',
      ],
    },
    4: {
      score: 4,
      label: 'Good',
      description: 'Some authenticity',
      indicators: [
        'Reasonably genuine',
        'Some personal voice',
      ],
      examples: [
        'Adequate personal expression',
      ],
    },
    5: {
      score: 5,
      label: 'Average',
      description: 'Generic presentation',
      indicators: [
        'Essays could be anyone\'s',
        'Follows expected patterns',
      ],
      examples: [
        'Standard responses',
        'Predictable narrative',
      ],
    },
    6: {
      score: 6,
      label: 'Concerning',
      description: 'Feels fabricated or inauthentic',
      indicators: [
        'Materials seem manufactured',
        'Inconsistencies suggest inauthenticity',
        'No genuine self emerges',
      ],
      examples: [
        'Essays feel AI-generated',
        'Activities don\'t match stated interests',
      ],
    },
  },
  evidenceTypes: [
    'Essay voice and content',
    'Activity coherence',
    'Interview presentation',
    'Consistency across materials',
  ],
  redFlags: [
    'Essays don\'t match activities',
    'Voice sounds generic/AI',
    'Inconsistencies in narrative',
    'Seems to be playing a part',
  ],
  commonMistakes: [
    'Trying to seem like "ideal applicant"',
    'Using clichés extensively',
    'Hiding real personality',
  ],
};

// ============================================================================
// AGGREGATE FUNCTIONS
// ============================================================================

export const ALL_DIMENSION_RUBRICS: DimensionRubric[] = [
  INTELLECTUAL_VITALITY_RUBRIC,
  LEADERSHIP_QUALITY_RUBRIC,
  COMMUNITY_IMPACT_RUBRIC,
  PERSONAL_GROWTH_RUBRIC,
  RESILIENCE_GRIT_RUBRIC,
  CREATIVITY_INNOVATION_RUBRIC,
  AUTHENTICITY_VOICE_RUBRIC,
];

export const DIMENSION_RUBRICS: Record<CharacterDimension, DimensionRubric> = {
  intellectual_vitality: INTELLECTUAL_VITALITY_RUBRIC,
  leadership_quality: LEADERSHIP_QUALITY_RUBRIC,
  community_impact: COMMUNITY_IMPACT_RUBRIC,
  personal_growth: PERSONAL_GROWTH_RUBRIC,
  resilience_grit: RESILIENCE_GRIT_RUBRIC,
  creativity_innovation: CREATIVITY_INNOVATION_RUBRIC,
  authenticity_voice: AUTHENTICITY_VOICE_RUBRIC,
};

/**
 * Calculate weighted character score from dimension scores
 */
export function calculateWeightedCharacterScore(
  dimensionScores: Record<CharacterDimension, HarvardScore>
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const dimension of Object.keys(DIMENSION_WEIGHTS) as CharacterDimension[]) {
    const score = dimensionScores[dimension];
    const weight = DIMENSION_WEIGHTS[dimension];

    if (score !== undefined) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 4;
}

/**
 * Get dimension rubric by name
 */
export function getDimensionRubric(dimension: CharacterDimension): DimensionRubric {
  return DIMENSION_RUBRICS[dimension];
}

/**
 * Get criteria for specific dimension and score level
 */
export function getLevelCriteria(
  dimension: CharacterDimension,
  score: HarvardScore
): LevelCriteria {
  return DIMENSION_RUBRICS[dimension].levelCriteria[score];
}

// ============================================================================
// EXPORTS
// ============================================================================

export const characterDimensionRubrics = {
  DIMENSION_WEIGHTS,
  ALL_DIMENSION_RUBRICS,
  DIMENSION_RUBRICS,
  calculateWeightedCharacterScore,
  getDimensionRubric,
  getLevelCriteria,
};
