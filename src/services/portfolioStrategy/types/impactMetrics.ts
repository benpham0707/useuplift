/**
 * Impact Metrics Types
 *
 * Comprehensive type definitions for quantifying and demonstrating impact
 * in activities, service, leadership, and other areas. Admissions officers
 * value specific, quantified achievements over vague claims.
 *
 * Key Insight: "Led community service project" vs "Founded tutoring program
 * that improved math scores by 1.5 grade levels for 50 students over 2 years"
 * - the second version is infinitely more compelling.
 *
 * This system provides:
 * - Frameworks for quantifying any type of impact
 * - Guidance on what metrics matter
 * - Templates for different activity types
 * - Red flags for unbelievable claims
 * - Standards for different impact levels
 */

import { HarvardScore, HarvardScoreDecimal, ActivityTierScore } from './scoring';
import { ActivityCategory } from './activities';

// ============================================================================
// IMPACT CLASSIFICATION
// ============================================================================

/**
 * Types of impact
 */
export type ImpactType =
  | 'people_served'           // Number of people directly helped
  | 'people_reached'          // Number of people exposed/reached
  | 'money_raised'            // Funds raised
  | 'money_managed'           // Budget managed
  | 'money_generated'         // Revenue generated
  | 'time_contributed'        // Volunteer hours
  | 'growth_achieved'         // Membership/reach growth
  | 'performance_improved'    // Measurable improvement
  | 'recognition_earned'      // Awards, selections
  | 'resources_created'       // Materials, content created
  | 'policy_changed'          // Rules/policies influenced
  | 'media_coverage'          // Press/media attention
  | 'organization_built'      // Organization created/grown
  | 'skills_taught'           // People trained/taught
  | 'quality_improved';       // Ratings, scores improved

/**
 * Impact scope
 */
export type ImpactScope =
  | 'international'           // Global/multi-country
  | 'national'                // Country-wide
  | 'regional'                // Multi-state/province
  | 'state'                   // State-wide
  | 'local'                   // City/county
  | 'school'                  // School-level
  | 'group';                  // Small group

/**
 * Impact duration
 */
export type ImpactDuration =
  | 'one_time'                // Single event
  | 'short_term'              // Few months
  | 'ongoing'                 // Current, continuing
  | 'sustained'               // Multi-year, established
  | 'permanent';              // Lasting change

// ============================================================================
// IMPACT MEASUREMENT
// ============================================================================

/**
 * Single impact metric
 */
export interface ImpactMetric {
  type: ImpactType;
  metric: string;                 // What's being measured
  value: number | string;         // The number/value
  unit: string;                   // Unit of measurement
  timeframe: string;              // When this was achieved
  verifiable: boolean;            // Can be verified
  verificationMethod?: string;    // How to verify

  // Context
  context: {
    baseline?: string;            // What was the starting point
    benchmark?: string;           // What's typical/expected
    significance: string;         // Why this number matters
  };

  // Quality assessment
  quality: {
    credibility: HarvardScoreDecimal;   // How believable is this
    impressiveness: HarvardScoreDecimal; // How impressive is this
    relevance: HarvardScoreDecimal;      // How relevant to goals
  };
}

/**
 * Complete impact profile for an activity
 */
export interface ActivityImpactProfile {
  activityId: string;
  activityName: string;
  category: ActivityCategory;

  // Primary impact
  primaryImpact: {
    metric: ImpactMetric;
    description: string;
    howAchieved: string;
  };

  // Secondary impacts
  secondaryImpacts: ImpactMetric[];

  // Overall assessment
  overallImpactScore: HarvardScoreDecimal;
  impactScope: ImpactScope;
  impactDuration: ImpactDuration;

  // Narrative
  impactNarrative: {
    oneSentence: string;          // For activities list
    paragraph: string;            // For essays
    fullStory: string;            // For interviews
  };

  // Evidence
  evidence: {
    type: 'document' | 'reference' | 'media' | 'data' | 'testimonial';
    description: string;
    verifiable: boolean;
  }[];

  // Recommendations
  howToQuantifyBetter: string[];
  missingMetrics: string[];
}

// ============================================================================
// IMPACT BENCHMARKS
// ============================================================================

/**
 * What good impact looks like by tier
 */
export interface ImpactBenchmarks {
  activityCategory: ActivityCategory;

  // Tier 1 (National/Elite) benchmarks
  tier1: {
    description: string;
    examples: {
      metric: string;
      benchmark: string;
      example: string;
    }[];
  };

  // Tier 2 (State/Excellent) benchmarks
  tier2: {
    description: string;
    examples: {
      metric: string;
      benchmark: string;
      example: string;
    }[];
  };

  // Tier 3 (Regional/Good) benchmarks
  tier3: {
    description: string;
    examples: {
      metric: string;
      benchmark: string;
      example: string;
    }[];
  };

  // Tier 4 (Participation) benchmarks
  tier4: {
    description: string;
    examples: {
      metric: string;
      benchmark: string;
      example: string;
    }[];
  };
}

/**
 * Community service impact benchmarks
 */
export const COMMUNITY_SERVICE_BENCHMARKS: ImpactBenchmarks = {
  activityCategory: 'community_service',
  tier1: {
    description: 'National/international impact, founded significant organization',
    examples: [
      { metric: 'People served', benchmark: '5,000+', example: 'Food program serving 5,000 families annually across 3 states' },
      { metric: 'Money raised', benchmark: '$100,000+', example: 'Raised $150K for medical equipment' },
      { metric: 'Organization built', benchmark: 'National scope', example: 'Founded nonprofit with 50 chapters' },
    ],
  },
  tier2: {
    description: 'State/regional impact, significant local organization',
    examples: [
      { metric: 'People served', benchmark: '500-5,000', example: 'Tutoring program serving 300 students' },
      { metric: 'Money raised', benchmark: '$10,000-$100,000', example: 'Raised $25K through annual event' },
      { metric: 'Volunteers led', benchmark: '50+', example: 'Coordinated 75 volunteers' },
    ],
  },
  tier3: {
    description: 'Local impact, meaningful contribution',
    examples: [
      { metric: 'People served', benchmark: '50-500', example: 'Regular service at food bank, 100+ families helped' },
      { metric: 'Hours contributed', benchmark: '200+', example: '250 hours over 3 years' },
      { metric: 'Volunteers led', benchmark: '10-50', example: 'Led team of 15 volunteers' },
    ],
  },
  tier4: {
    description: 'Participation, minimal quantifiable impact',
    examples: [
      { metric: 'People served', benchmark: '<50', example: 'Participated in service days' },
      { metric: 'Hours contributed', benchmark: '<100', example: '50 hours over high school' },
      { metric: 'Role', benchmark: 'Participant', example: 'Volunteer at events' },
    ],
  },
};

/**
 * Research impact benchmarks
 */
export const RESEARCH_BENCHMARKS: ImpactBenchmarks = {
  activityCategory: 'research',
  tier1: {
    description: 'Published in major journal, significant discovery',
    examples: [
      { metric: 'Publication', benchmark: 'First/co-author in peer-reviewed journal', example: 'First-author paper in Nature Communications' },
      { metric: 'Citation', benchmark: '10+ citations', example: 'Work cited in 15 subsequent papers' },
      { metric: 'Impact', benchmark: 'Novel discovery', example: 'Discovered new antibiotic compound' },
    ],
  },
  tier2: {
    description: 'Conference presentation, significant project',
    examples: [
      { metric: 'Publication', benchmark: 'Conference paper or contributing author', example: 'Presented at IEEE conference' },
      { metric: 'Competition', benchmark: 'Major competition finalist', example: 'Regeneron STS Scholar' },
      { metric: 'Patent', benchmark: 'Patent filed', example: 'Provisional patent for invention' },
    ],
  },
  tier3: {
    description: 'Meaningful research contribution',
    examples: [
      { metric: 'Duration', benchmark: '6+ months', example: '8 months in university lab' },
      { metric: 'Contribution', benchmark: 'Identified contribution', example: 'Ran experiments contributing to lab paper' },
      { metric: 'Presentation', benchmark: 'Local/school', example: 'Presented at school symposium' },
    ],
  },
  tier4: {
    description: 'Research exposure/observation',
    examples: [
      { metric: 'Duration', benchmark: '<3 months', example: 'Summer research program' },
      { metric: 'Role', benchmark: 'Observer/assistant', example: 'Shadowed graduate students' },
      { metric: 'Output', benchmark: 'None', example: 'No tangible output' },
    ],
  },
};

/**
 * Leadership impact benchmarks
 */
export const LEADERSHIP_BENCHMARKS: ImpactBenchmarks = {
  activityCategory: 'leadership_governance',
  tier1: {
    description: 'Transformational leadership at scale',
    examples: [
      { metric: 'Organization size', benchmark: '200+ people', example: 'President, 1500-student school' },
      { metric: 'Change achieved', benchmark: 'Policy/structural change', example: 'Led initiative that changed school policy' },
      { metric: 'Growth', benchmark: '100%+ growth', example: 'Grew club from 20 to 80 members' },
    ],
  },
  tier2: {
    description: 'Significant leadership with measurable impact',
    examples: [
      { metric: 'Organization size', benchmark: '50-200 people', example: 'Captain of varsity team' },
      { metric: 'Achievement', benchmark: 'Significant accomplishment', example: 'Led team to state championship' },
      { metric: 'Budget', benchmark: '$5,000+', example: 'Managed $10K budget' },
    ],
  },
  tier3: {
    description: 'Leadership role with some impact',
    examples: [
      { metric: 'Organization size', benchmark: '15-50 people', example: 'President of medium club' },
      { metric: 'Events', benchmark: '3+ events organized', example: 'Organized 5 club events' },
      { metric: 'Growth', benchmark: '20-50% growth', example: 'Grew membership 30%' },
    ],
  },
  tier4: {
    description: 'Minor leadership or participation',
    examples: [
      { metric: 'Role', benchmark: 'Committee member', example: 'On planning committee' },
      { metric: 'Organization size', benchmark: '<15 people', example: 'Led small project team' },
      { metric: 'Duration', benchmark: '<1 year', example: 'Leadership for one semester' },
    ],
  },
};

// ============================================================================
// QUANTIFICATION GUIDANCE
// ============================================================================

/**
 * How to quantify impact by activity type
 */
export interface QuantificationGuide {
  activityCategory: ActivityCategory;
  description: string;

  // What to measure
  metricsToTrack: {
    metric: string;
    importance: 'primary' | 'secondary' | 'supporting';
    howToMeasure: string;
    howToVerify: string;
  }[];

  // Questions to answer
  questionsToAnswer: string[];

  // Common mistakes
  quantificationMistakes: {
    mistake: string;
    betterApproach: string;
  }[];

  // Example transformations
  weakToStrong: {
    weak: string;
    strong: string;
    improvement: string;
  }[];
}

/**
 * Community service quantification guide
 */
export const COMMUNITY_SERVICE_QUANTIFICATION: QuantificationGuide = {
  activityCategory: 'community_service',
  description: 'Quantify who you helped, how much, and the measurable difference you made',

  metricsToTrack: [
    { metric: 'Number of people directly served', importance: 'primary', howToMeasure: 'Track individual beneficiaries', howToVerify: 'Sign-in sheets, organization records' },
    { metric: 'Hours contributed', importance: 'secondary', howToMeasure: 'Log hours consistently', howToVerify: 'Organization verification' },
    { metric: 'Measurable outcome improvement', importance: 'primary', howToMeasure: 'Before/after measurements', howToVerify: 'Test scores, surveys, data' },
    { metric: 'Resources mobilized', importance: 'secondary', howToMeasure: 'Track money, materials, volunteers', howToVerify: 'Receipts, records' },
    { metric: 'Sustainability/continuation', importance: 'supporting', howToMeasure: 'Does program continue?', howToVerify: 'Program still running' },
  ],

  questionsToAnswer: [
    'How many people did you directly help?',
    'What measurable difference did you make in their lives?',
    'What resources did you mobilize (money, volunteers, materials)?',
    'What did you specifically do vs. what did the organization do?',
    'Will the impact continue after you leave?',
  ],

  quantificationMistakes: [
    { mistake: 'Only counting hours', betterApproach: 'Focus on outcomes, not inputs' },
    { mistake: 'Claiming organization\'s impact as yours', betterApproach: 'Specify your individual contribution' },
    { mistake: 'Vague "helped the community"', betterApproach: 'Specific beneficiaries and outcomes' },
    { mistake: 'Inflating numbers', betterApproach: 'Be accurate and verifiable' },
  ],

  weakToStrong: [
    {
      weak: 'Volunteered at food bank',
      strong: 'Distributed 500+ grocery boxes to 200 families over 2 years; recruited and trained 15 new volunteers',
      improvement: 'Added specific numbers, timeframe, and personal contribution',
    },
    {
      weak: 'Tutored students',
      strong: 'Tutored 12 middle schoolers in math; students\' grades improved average 1.5 letter grades',
      improvement: 'Quantified students and measurable outcome',
    },
  ],
};

/**
 * Research quantification guide
 */
export const RESEARCH_QUANTIFICATION: QuantificationGuide = {
  activityCategory: 'research',
  description: 'Quantify your specific contribution, findings, and recognition',

  metricsToTrack: [
    { metric: 'Time committed', importance: 'secondary', howToMeasure: 'Hours per week × weeks', howToVerify: 'Mentor verification' },
    { metric: 'Specific contribution', importance: 'primary', howToMeasure: 'What did YOU do?', howToVerify: 'Described in paper/presentation' },
    { metric: 'Publication/presentation', importance: 'primary', howToMeasure: 'Where published/presented', howToVerify: 'Published record' },
    { metric: 'Competition results', importance: 'primary', howToMeasure: 'Placement/award', howToVerify: 'Competition records' },
    { metric: 'Practical application', importance: 'supporting', howToMeasure: 'Is it being used?', howToVerify: 'Adoption records' },
  ],

  questionsToAnswer: [
    'What was your specific contribution to the research?',
    'What did you discover or create?',
    'Where was it published or presented?',
    'What competitions did you enter and how did you place?',
    'Is your work being used or cited?',
  ],

  quantificationMistakes: [
    { mistake: 'Claiming lab\'s work as yours', betterApproach: 'Specify your individual contribution' },
    { mistake: 'Only describing topic', betterApproach: 'Describe your specific work and findings' },
    { mistake: 'No tangible output', betterApproach: 'Create poster, paper, presentation' },
  ],

  weakToStrong: [
    {
      weak: 'Did research in biology lab',
      strong: 'Designed and ran 50+ experiments on protein interactions; discovered novel binding mechanism; first-author paper submitted to JBC',
      improvement: 'Specific contribution, quantity, and output',
    },
    {
      weak: 'Worked with professor on AI project',
      strong: 'Developed ML model improving prediction accuracy 15%; code open-sourced with 200+ GitHub stars; presented at regional symposium',
      improvement: 'Quantified improvement, external validation',
    },
  ],
};

// ============================================================================
// IMPACT VERIFICATION
// ============================================================================

/**
 * Impact verification assessment
 */
export interface ImpactVerification {
  metric: ImpactMetric;

  // Verification status
  verificationStatus: 'verified' | 'verifiable' | 'unverifiable' | 'suspicious';

  // How verified
  verificationMethod?: {
    method: string;
    source: string;
    date: string;
  };

  // Credibility assessment
  credibility: {
    score: HarvardScoreDecimal;
    concerns: string[];
    strengths: string[];
  };

  // Red flags
  redFlags: {
    flag: string;
    severity: 'critical' | 'concerning' | 'minor';
    explanation: string;
  }[];

  // Recommendations
  howToStrengthen: string[];
}

/**
 * Red flags for impact claims
 */
export const IMPACT_RED_FLAGS = {
  numbers: [
    { flag: 'Round numbers only', description: '1000, 500, 100 - real data is messier', severity: 'minor' as const },
    { flag: 'Implausibly large numbers', description: 'Claims that seem too large for context', severity: 'concerning' as const },
    { flag: 'Inconsistent numbers', description: 'Numbers don\'t add up or contradict', severity: 'critical' as const },
  ],
  claims: [
    { flag: 'Founded but can\'t verify', description: 'Organization doesn\'t exist online', severity: 'critical' as const },
    { flag: 'Leadership without evidence', description: 'Claims leadership but no one knows them', severity: 'concerning' as const },
    { flag: 'Impact without mechanism', description: 'Claims impact but unclear how', severity: 'concerning' as const },
  ],
  context: [
    { flag: 'Scale doesn\'t match resources', description: 'High school student with $1M budget', severity: 'concerning' as const },
    { flag: 'Time impossible', description: '40 hours/week with other activities', severity: 'critical' as const },
    { flag: 'Awards that don\'t exist', description: 'Unverifiable awards/competitions', severity: 'critical' as const },
  ],
};

// ============================================================================
// IMPACT IMPROVEMENT
// ============================================================================

/**
 * How to improve impact for an activity
 */
export interface ImpactImprovementPlan {
  activityId: string;
  currentImpactScore: HarvardScoreDecimal;
  targetImpactScore: HarvardScoreDecimal;

  // Current state
  currentMetrics: ImpactMetric[];
  currentWeaknesses: string[];
  currentStrengths: string[];

  // Improvement strategies
  improvementStrategies: {
    strategy: string;
    description: string;
    expectedImpact: string;
    effort: 'high' | 'medium' | 'low';
    timeline: string;
  }[];

  // Specific actions
  actions: {
    action: string;
    deadline: string;
    expectedMetricImprovement: string;
  }[];

  // New metrics to track
  newMetricsToTrack: {
    metric: string;
    howToMeasure: string;
    target: string;
  }[];

  // Expected outcome
  expectedOutcome: {
    newTier: ActivityTierScore;
    newMetrics: ImpactMetric[];
    newNarrative: string;
  };
}

/**
 * Generic impact improvement strategies
 */
export const IMPACT_IMPROVEMENT_STRATEGIES: {
  category: string;
  strategies: {
    strategy: string;
    description: string;
    applicableTo: ActivityCategory[];
  }[];
}[] = [
  {
    category: 'Scale',
    strategies: [
      { strategy: 'Expand reach', description: 'Serve more people, reach more locations', applicableTo: ['community_service', 'leadership_governance', 'cultural_heritage'] },
      { strategy: 'Recruit volunteers', description: 'Build team to multiply impact', applicableTo: ['community_service', 'leadership_governance'] },
      { strategy: 'Replicate model', description: 'Help others start similar programs', applicableTo: ['community_service', 'entrepreneurship'] },
    ],
  },
  {
    category: 'Recognition',
    strategies: [
      { strategy: 'Enter competitions', description: 'Get external validation through competitions', applicableTo: ['research', 'stem_project', 'academic_competition'] },
      { strategy: 'Seek media coverage', description: 'Get press coverage for work', applicableTo: ['community_service', 'entrepreneurship'] },
      { strategy: 'Publish/present', description: 'Share work through publications or conferences', applicableTo: ['research', 'arts_literary'] },
    ],
  },
  {
    category: 'Measurement',
    strategies: [
      { strategy: 'Track outcomes, not outputs', description: 'Measure actual change, not just activity', applicableTo: ['community_service', 'leadership_governance'] },
      { strategy: 'Before/after measurement', description: 'Establish baseline and measure change', applicableTo: ['community_service', 'research'] },
      { strategy: 'Get testimonials', description: 'Collect stories from those impacted', applicableTo: ['community_service', 'cultural_heritage'] },
    ],
  },
  {
    category: 'Sustainability',
    strategies: [
      { strategy: 'Formalize organization', description: 'Create structure that outlasts you', applicableTo: ['community_service', 'leadership_governance', 'entrepreneurship'] },
      { strategy: 'Train successors', description: 'Ensure program continues after you leave', applicableTo: ['community_service', 'leadership_governance'] },
      { strategy: 'Secure funding', description: 'Get ongoing funding for sustainability', applicableTo: ['community_service', 'entrepreneurship'] },
    ],
  },
];

// ============================================================================
// IMPACT NARRATIVE
// ============================================================================

/**
 * Convert metrics to compelling narrative
 */
export interface ImpactNarrative {
  // For activities list (150 characters)
  shortForm: string;

  // For essays (1-2 sentences)
  mediumForm: string;

  // For interviews (full story)
  longForm: string;

  // Key statistics to memorize
  keyStats: {
    stat: string;
    context: string;
    usageGuidance: string;
  }[];

  // Story elements
  storyElements: {
    problem: string;
    action: string;
    result: string;
    lesson: string;
  };
}

/**
 * Convert raw metrics to narrative
 */
export function generateImpactNarrative(
  activityName: string,
  role: string,
  metrics: ImpactMetric[]
): ImpactNarrative {
  // This would be implemented with actual logic
  // Placeholder structure
  return {
    shortForm: '',
    mediumForm: '',
    longForm: '',
    keyStats: [],
    storyElements: {
      problem: '',
      action: '',
      result: '',
      lesson: '',
    },
  };
}
