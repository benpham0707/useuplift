// @ts-nocheck
/**
 * Knowledge Assembly Service
 *
 * Central service that assembles ALL relevant knowledge for teaching a specific activity.
 * This is the bridge between our rich knowledge databases and the teaching layer.
 *
 * PHILOSOPHY:
 * ===========
 * The LLM should APPLY knowledge, not INVENT it.
 * This service pre-computes and assembles all the domain expertise so that:
 * 1. Teaching is grounded in real benchmarks and research
 * 2. Citations are verifiable (from our databases, not LLM hallucination)
 * 3. Advice follows proven patterns (from teaching knowledge base)
 * 4. Field-specific expectations are accurate
 *
 * KNOWLEDGE SOURCES INTEGRATED:
 * ============================
 * - extracurricularDatabase (competition hierarchies, tier benchmarks)
 * - extracurricularDatabaseExtended (startups, nonprofits, arts)
 * - impactMetricsFramework (beneficiary thresholds, financial metrics)
 * - majorActivityAlignment (field-specific expectations)
 * - fieldSpecificExpectations (major-based requirements)
 * - spikeDetectionSystem (coherence, archetype criteria)
 * - activityTeachingKnowledgeBase (issue teaching bundles)
 * - activityCitationService (pre-computed citations)
 */

import {
  ActivityWorkshopInput,
  ActivityWorkshopSessionInput,
  AnalysisContext,
} from './types';

import { ActivityCategory, ActivityTier } from '../../types';

// Import knowledge databases
import {
  // Competition hierarchies
  MATH_COMPETITION_HIERARCHY,
  SCIENCE_OLYMPIAD_HIERARCHY,
  CS_COMPETITION_HIERARCHY,
  RESEARCH_COMPETITION_HIERARCHY,
  DEBATE_SPEECH_HIERARCHY,
  ARTS_COMPETITION_HIERARCHY,
  ATHLETICS_HIERARCHY,
  SUMMER_PROGRAMS_HIERARCHY,
  MODEL_UN_HIERARCHY,
  ECONOMICS_BUSINESS_HIERARCHY,

  // Extended hierarchies
  ENTREPRENEURSHIP_STARTUP_HIERARCHY,
  NONPROFIT_SERVICE_HIERARCHY,
  INTERNSHIP_WORK_HIERARCHY,
  PERFORMING_ARTS_HIERARCHY,
  VISUAL_ARTS_HIERARCHY,
  WRITING_JOURNALISM_HIERARCHY,

  // Impact metrics
  IMPACT_TIER_DESCRIPTIONS,
  BENEFICIARY_METRICS,
  FINANCIAL_METRICS,
  LEADERSHIP_METRICS,

  // Major alignment
  MAJOR_ACTIVITY_ALIGNMENT_MATRIX,

  // Spike detection
  SPIKE_DEFINITIONS,
} from '../../knowledge';

// Import field-specific expectations
import {
  getFieldExpectations,
  normalizeMajor,
  FieldExpectations,
} from '../../knowledge/fieldSpecificExpectations';

// Import teaching knowledge base
import {
  ACTIVITY_TEACHING_KNOWLEDGE_BASE,
  ActivityIssueType,
  ActivityTeachingBundle,
  getTeachingForIssue,
} from './activityTeachingKnowledgeBase';

// Import citation service
import { activityCitationService, ActivityCitation } from './activityCitationService';

// Import expert counselor knowledge base types
import {
  ExpertKnowledgeContext,
  ADVANCED_TEACHING_BUNDLES,
} from './expertCounselorKnowledgeBase';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Tier benchmark data with exact criteria and metrics
 */
export interface TierBenchmark {
  tier: 1 | 2 | 3 | 4;
  name: string;
  criteria: string;
  examples: string[];
  metrics: string[];
  admissionImpact: string;
}

/**
 * Issue teaching bundle for a detected issue
 */
export interface IssueTeachingContext {
  issueType: ActivityIssueType;
  theProblem: {
    headline: string;
    explanation: string;
    admissionsImpact: string;
    commonManifestations: string[];
  };
  whyThisWorks: {
    psychology: string;
    research: string;
    quote?: string;
    quoteSource?: string;
  };
  whatToDo: {
    principle: string;
    steps: string[];
  };
  detailPriorities: {
    critical: Array<{ detail: string; whyItMatters: string; example: string }>;
    valuable: string[];
    avoid: string[];
  };
  examples: Array<{
    context: string;
    before: string;
    after: string;
    principle: string;
    whyItWorks: string;
  }>;
  metadata: {
    difficulty: 'simple' | 'moderate' | 'advanced';
    timeToFix: string;
  };
}

/**
 * Field-specific expectations context
 */
export interface FieldExpectationsContext {
  majorName: string;
  normalizedMajor: string;
  expectedActivities: string[];
  bonusActivities: string[];
  warningSignals: string[];
  impactBenchmarks: {
    exceptional: string;
    strong: string;
    baseline: string;
  };
  descriptionExpectations: {
    keyTerms: string[];
    actionVerbs: string[];
    quantificationExamples: string[];
    termsToAvoid: string[];
  };
  relevanceAssessment?: {
    isAligned: boolean;
    alignmentReason: string;
  };
}

/**
 * Sara Harberson tier criteria context
 */
export interface SaraHarbersonCriteria {
  tier: 1 | 2 | 3 | 4;
  tierName: string;
  definition: string;
  evidence: string[];
  examples: string[];
  admissionImpactMultiplier: string;
}

/**
 * Complete knowledge context for an activity
 */
export interface ActivityKnowledgeContext {
  // Activity identification
  activityId: string;
  activityTitle: string;
  detectedCategory: ActivityCategory;

  // Tier benchmarks for this activity type
  tierBenchmarks: TierBenchmark[];

  // Teaching bundles for detected issues
  issueTeaching: IssueTeachingContext[];

  // Field-specific expectations
  fieldExpectations: FieldExpectationsContext | null;

  // Pre-computed citations
  citations: ActivityCitation[];

  // Sara Harberson criteria
  saraHarbersonCriteria: SaraHarbersonCriteria;

  // Category-specific insights
  categoryInsights: {
    categoryName: string;
    competitiveContext: string;
    topAchievements: string[];
    commonMistakes: string[];
  };

}

// ============================================================================
// SARA HARBERSON TIER DEFINITIONS
// ============================================================================

const SARA_HARBERSON_TIERS: Record<1 | 2 | 3 | 4, SaraHarbersonCriteria> = {
  1: {
    tier: 1,
    tierName: 'Exceptional (Nationally Recognized)',
    definition:
      'Activities demonstrating national or international recognition, exceptional achievement in the top 1%, or founding organizations with significant documented impact.',
    evidence: [
      'National/international competition finalist or winner',
      'Published research in peer-reviewed journal',
      'Founded organization with 10,000+ beneficiaries or $100K+ impact',
      'Recruited athlete at Division I level',
      'Professional-level artistic achievement (YoungArts, national performance)',
      'Selective program admission (<5% acceptance rate)',
    ],
    examples: [
      'USAMO qualifier (~270 students nationally)',
      'Intel/Regeneron STS Finalist (40 from 2,000 applicants)',
      'Published first-author paper in Nature/Science',
      'Founded nonprofit serving 15,000+ students annually',
      'National Youth Orchestra member (<1% acceptance)',
    ],
    admissionImpactMultiplier: '4.0x (significantly boosts admission probability)',
  },
  2: {
    tier: 2,
    tierName: 'Distinguished (State/Regional Recognition)',
    definition:
      'Activities demonstrating state or regional recognition with documented leadership impact, or significant achievement in competitive domains.',
    evidence: [
      'State competition winner or national qualifier',
      'Regional leadership with measurable impact',
      'Significant fundraising ($10K-100K) with documented beneficiaries',
      'State-level artistic recognition (All-State, regional competitions)',
      'Selective program participant (5-15% acceptance)',
      'Published research in student journal or presented at conference',
    ],
    examples: [
      'AIME qualifier with score 10+ (top 3% of qualifiers)',
      'State Science Olympiad medalist',
      'Student council president with documented policy changes',
      'Raised $50K for verified charity',
      'All-State musician or athlete',
    ],
    admissionImpactMultiplier: '2.5x (meaningfully boosts admission probability)',
  },
  3: {
    tier: 3,
    tierName: 'Solid (School/Local Leadership)',
    definition:
      'Activities demonstrating consistent multi-year commitment with school-level leadership or local impact.',
    evidence: [
      'School club officer with documented contributions',
      'Varsity athlete with consistent performance',
      'Multi-year volunteer with 100+ hours and documented impact',
      'School-level competition awards',
      'Local community leadership role',
      'Consistent participation (3+ years) with progression',
    ],
    examples: [
      'Debate team captain leading team to regional competitions',
      'Varsity letter winner with team contributions',
      'Founded school club with 30+ active members',
      'Regular volunteer (200+ hours) at same organization',
      'School newspaper editor',
    ],
    admissionImpactMultiplier: '1.5x (modest positive contribution)',
  },
  4: {
    tier: 4,
    tierName: 'Participation (General Involvement)',
    definition:
      'Activities showing participation without notable distinction, leadership, or measurable impact.',
    evidence: [
      'Club member without officer role',
      'Occasional volunteer (<100 hours total)',
      'JV athlete without advancement',
      'One-time event participation',
      'Passive membership in organizations',
    ],
    examples: [
      'Member of Spanish Club (attended meetings)',
      'Volunteered at food bank (30 hours over 2 years)',
      'Participated in school play (non-lead role)',
      'Attended summer camp',
      'Member of National Honor Society (no active role)',
    ],
    admissionImpactMultiplier: '1.0x (baseline, expected for college-bound students)',
  },
};

// ============================================================================
// ISSUE MAPPING
// ============================================================================

/**
 * All valid standardized issue types
 */
const VALID_ISSUE_TYPES: Set<ActivityIssueType> = new Set([
  'vague_description',
  'missing_quantification',
  'weak_role_clarity',
  'buried_leadership',
  'hidden_impact',
  'generic_contribution',
  'missing_progression',
  'title_mismatch',
  'buried_achievement',
  'weak_differentiator',
  'resume_speak',
  'missing_context',
  'shallow_depth',
  'authenticity_gap',
  'tier_misperception',
]);

/**
 * Fuzzy mapping for legacy/free-text issues (fallback)
 */
const FUZZY_MAPPING: Record<string, ActivityIssueType> = {
  // Vagueness patterns
  vague: 'vague_description',
  'lacks specificity': 'vague_description',
  generic: 'vague_description',
  unclear: 'vague_description',

  // Quantification patterns
  'no numbers': 'missing_quantification',
  'no metrics': 'missing_quantification',
  'missing quantif': 'missing_quantification',
  unquantified: 'missing_quantification',

  // Role patterns
  'weak role': 'weak_role_clarity',
  'unclear role': 'weak_role_clarity',
  'role not clear': 'weak_role_clarity',

  // Leadership patterns
  'buried leader': 'buried_leadership',
  'hidden leader': 'buried_leadership',
  'leadership not': 'buried_leadership',

  // Impact patterns
  'unclear impact': 'hidden_impact',
  'hidden impact': 'hidden_impact',
  'no impact': 'hidden_impact',

  // Generic patterns
  'generic contrib': 'generic_contribution',
  'common contrib': 'generic_contribution',
  undifferentiated: 'generic_contribution',

  // Progression patterns
  'no progression': 'missing_progression',
  'missing progress': 'missing_progression',
  static: 'missing_progression',

  // Achievement patterns
  'buried achieve': 'buried_achievement',
  'hidden achieve': 'buried_achievement',
  understated: 'buried_achievement',

  // Resume speak patterns
  'resume speak': 'resume_speak',
  jargon: 'resume_speak',
  buzzword: 'resume_speak',
  corporate: 'resume_speak',

  // Depth patterns
  shallow: 'shallow_depth',
  superficial: 'shallow_depth',
  'lacks depth': 'shallow_depth',

  // Tier patterns
  'tier mismatch': 'tier_misperception',
  overstate: 'tier_misperception',
  inflate: 'tier_misperception',

  // Title patterns
  'title mismatch': 'title_mismatch',
  'title without': 'title_mismatch',

  // Context patterns
  'missing context': 'missing_context',
  'no context': 'missing_context',

  // Differentiation patterns
  'not differentiated': 'weak_differentiator',
  'weak different': 'weak_differentiator',
  'stands out': 'weak_differentiator',

  // Authenticity patterns
  'authenticity': 'authenticity_gap',
  'not authentic': 'authenticity_gap',
  scripted: 'authenticity_gap',
};

/**
 * Map analysis issues to knowledge base issue types
 *
 * STRATEGY:
 * 1. EXACT MATCH FIRST: If the issue string is already a valid issue type, use it directly
 * 2. FUZZY FALLBACK: For legacy free-text issues, use pattern matching
 *
 * This ensures:
 * - New standardized analyses get exact mapping (fast, reliable)
 * - Legacy/cached analyses still work via fuzzy matching
 */
function mapIssuesToKnowledgeBase(issues: string[]): ActivityIssueType[] {
  const detectedIssues: ActivityIssueType[] = [];
  const seenTypes = new Set<ActivityIssueType>();

  for (const issue of issues) {
    const normalizedIssue = issue.toLowerCase().trim();

    // STRATEGY 1: Exact match - issue IS a valid type
    if (VALID_ISSUE_TYPES.has(normalizedIssue as ActivityIssueType)) {
      if (!seenTypes.has(normalizedIssue as ActivityIssueType)) {
        detectedIssues.push(normalizedIssue as ActivityIssueType);
        seenTypes.add(normalizedIssue as ActivityIssueType);
      }
      continue;
    }

    // STRATEGY 2: Fuzzy fallback - pattern matching for legacy issues
    for (const [pattern, issueType] of Object.entries(FUZZY_MAPPING)) {
      if (normalizedIssue.includes(pattern) && !seenTypes.has(issueType)) {
        detectedIssues.push(issueType);
        seenTypes.add(issueType);
        break;
      }
    }
  }

  return detectedIssues;
}

// ============================================================================
// CATEGORY BENCHMARKS
// ============================================================================

/**
 * Get tier benchmarks for a specific activity category
 */
function getTierBenchmarksForCategory(category: ActivityCategory): TierBenchmark[] {
  const benchmarks: TierBenchmark[] = [];

  // Base Sara Harberson criteria for all categories
  for (const tier of [1, 2, 3, 4] as const) {
    const saraData = SARA_HARBERSON_TIERS[tier];
    benchmarks.push({
      tier,
      name: saraData.tierName,
      criteria: saraData.definition,
      examples: saraData.examples,
      metrics: saraData.evidence,
      admissionImpact: saraData.admissionImpactMultiplier,
    });
  }

  // Category-specific enhancements
  switch (category) {
    case 'academic_competition':
      // Add specific competition benchmarks
      if (MATH_COMPETITION_HIERARCHY) {
        benchmarks[0].examples = [
          ...benchmarks[0].examples,
          'USAMO qualifier (top 270 nationally)',
          'IMO team member (top 6 in country)',
          'USACO Camp finalist (top 25)',
        ];
        benchmarks[1].examples = [
          ...benchmarks[1].examples,
          'AIME score 10+ (top 3% of qualifiers)',
          'AMC 10/12 Perfect score',
          'USACO Gold division',
        ];
      }
      break;

    case 'research':
      if (RESEARCH_COMPETITION_HIERARCHY) {
        benchmarks[0].examples = [
          'Regeneron STS Finalist (40 from 2,000)',
          'ISEF Grand Award winner',
          'First-author publication in peer-reviewed journal',
        ];
        benchmarks[1].examples = [
          'ISEF participant (top 7% of regional winners)',
          'Regeneron STS Scholar (300 from 2,000)',
          'Co-authored publication or conference presentation',
        ];
      }
      break;

    case 'entrepreneurship':
      if (ENTREPRENEURSHIP_STARTUP_HIERARCHY) {
        benchmarks[0].metrics = [
          '$100K+ revenue OR 100K+ users',
          'VC funding received',
          'Thiel Fellowship finalist',
          'YC/TechStars participant',
        ];
        benchmarks[1].metrics = [
          '$10K-100K revenue OR 10K-100K users',
          'Competition prize winner (Diamond Challenge, DECA nationals)',
          'Paying customers and recurring revenue',
        ];
        benchmarks[2].metrics = [
          'Revenue-generating business',
          'Active users and product-market fit evidence',
          'Local business award or recognition',
        ];
      }
      break;

    case 'community_service':
      if (BENEFICIARY_METRICS) {
        benchmarks[0].metrics = [
          `${BENEFICIARY_METRICS.direct_beneficiaries.transformational}+ direct beneficiaries`,
          '$100K+ raised with documented impact',
          'Policy change or systemic impact',
        ];
        benchmarks[1].metrics = [
          `${BENEFICIARY_METRICS.direct_beneficiaries.exceptional}+ direct beneficiaries`,
          '$10K-100K raised',
          'Regional recognition or replication',
        ];
        benchmarks[2].metrics = [
          `${BENEFICIARY_METRICS.direct_beneficiaries.strong}+ direct beneficiaries`,
          'Consistent multi-year involvement',
          'Leadership role with documented contributions',
        ];
      }
      break;

    case 'arts_performance':
      benchmarks[0].examples = [
        'YoungArts Winner',
        'National Youth Orchestra/Symphony',
        'Pre-conservatory admission',
        'Professional performance credits',
      ];
      benchmarks[1].examples = [
        'All-State first chair',
        'Regional competition winner',
        'Selective summer program (Interlochen, Tanglewood)',
      ];
      break;

    case 'athletics':
      benchmarks[0].examples = [
        'Division I recruited athlete',
        'National team member',
        'All-American recognition',
        'Olympic development program',
      ];
      benchmarks[1].examples = [
        'All-State selection',
        'State championship medalist',
        'Club/travel team at national level',
      ];
      break;
  }

  return benchmarks;
}

/**
 * Get category-specific insights
 */
function getCategoryInsights(category: ActivityCategory): ActivityKnowledgeContext['categoryInsights'] {
  const insights: Record<ActivityCategory, ActivityKnowledgeContext['categoryInsights']> = {
    academic_competition: {
      categoryName: 'Academic Competition',
      competitiveContext:
        'Academic competitions have clear, verifiable hierarchies. AOs know exactly which competitions matter and at what level. Generic claims like "won competitions" without specifics are red flags.',
      topAchievements: [
        'USAMO/IMO for math',
        'USACO Platinum/Camp for CS',
        'ISEF Grand Award for science',
        'TOC for debate',
      ],
      commonMistakes: [
        'Listing participation without placement',
        'Not specifying division (JV vs Varsity, Novice vs Open)',
        'Claiming "national" for local competitions',
        'Missing score/ranking metrics',
      ],
    },
    research: {
      categoryName: 'Research',
      competitiveContext:
        'Research quality is judged by: independence of contribution, rigor of methodology, and external validation (publication, awards). Lab volunteering without intellectual contribution is Tier 4.',
      topAchievements: [
        'First-author peer-reviewed publication',
        'Regeneron STS/ISEF finalist',
        'Conference presentation at professional meeting',
        'Patent or significant contribution to published work',
      ],
      commonMistakes: [
        'Overstating contribution ("conducted research" vs "assisted with pipetting")',
        'No tangible output (no paper, poster, or presentation)',
        'Not explaining the research in accessible terms',
        'Claiming professor\'s work as own',
      ],
    },
    entrepreneurship: {
      categoryName: 'Entrepreneurship',
      competitiveContext:
        'AOs are highly skeptical of "CEO" and "Founder" titles. They look for traction: revenue, users, external validation. A business with customers is more impressive than a nonprofit with a website.',
      topAchievements: [
        'Revenue-generating business with real customers',
        'VC funding or accelerator acceptance',
        'App with significant user base',
        'Competition win (Thiel, Diamond Challenge)',
      ],
      commonMistakes: [
        'CEO of company with no revenue/users',
        'Founder of "nonprofit" filed senior year',
        'Claiming impact without metrics',
        'Business idea vs. actual business',
      ],
    },
    community_service: {
      categoryName: 'Community Service',
      competitiveContext:
        'Quality over quantity. 50 hours of deep, sustained impact beats 500 hours of passive volunteering. AOs look for: measurable beneficiaries, sustained commitment, initiative beyond showing up.',
      topAchievements: [
        'Founded program with 1000+ beneficiaries',
        'Measurable community change (policy, resources)',
        'Multi-year sustained commitment with progression',
        'External recognition (Presidential Service Award at Gold level)',
      ],
      commonMistakes: [
        'Voluntourism (week-long overseas trips)',
        'Hours without impact description',
        'Generic "helped the community" language',
        'Starting new initiative senior year',
      ],
    },
    arts_performance: {
      categoryName: 'Performing Arts',
      competitiveContext:
        'Performing arts have clear hierarchies: All-State > All-Region > school ensemble. Selective programs (Interlochen, YoungArts) provide external validation. Private lessons alone don\'t distinguish.',
      topAchievements: [
        'YoungArts Award',
        'All-State/All-National selection',
        'Selective conservatory summer program',
        'Professional performance credits',
      ],
      commonMistakes: [
        'Not specifying chair/section in ensemble',
        'Listing years of lessons without achievements',
        'Missing competition placements',
        'Not clarifying selective vs. pay-to-play programs',
      ],
    },
    arts_visual: {
      categoryName: 'Visual Arts',
      competitiveContext:
        'Visual arts are evaluated through: portfolio quality, external recognition (Scholastic, exhibitions), and consistency of practice. Admissions officers may request portfolios for art-focused applicants.',
      topAchievements: [
        'Scholastic Art Gold Key at national level',
        'Gallery exhibition or museum acquisition',
        'Commission work or professional sales',
        'Art school pre-college program acceptance',
      ],
      commonMistakes: [
        'No external validation of quality',
        'Listing classes without achievements',
        'Missing portfolio or work samples',
        'Not clarifying juried vs. open exhibitions',
      ],
    },
    athletics: {
      categoryName: 'Athletics',
      competitiveContext:
        'Athletic achievement has the clearest hierarchy: recruited athlete > All-State > All-Conference > Varsity letter. Non-recruited athletes should emphasize leadership, teamwork, and time management lessons.',
      topAchievements: [
        'Division I/II recruited athlete',
        'All-State or All-American selection',
        'State/national championship medalist',
        'National team or Olympic development',
      ],
      commonMistakes: [
        'Claiming "recruited" without actual recruitment',
        'JV for 4 years without explanation',
        'Not clarifying sport-specific achievements',
        'Missing statistics or rankings',
      ],
    },
    leadership_governance: {
      categoryName: 'Student Leadership',
      competitiveContext:
        'Leadership titles are common and often meaningless. What matters: what you CHANGED, who you INFLUENCED, what RESULTED from your leadership. "President" who maintained status quo is Tier 3-4.',
      topAchievements: [
        'Implemented lasting policy or program change',
        'Led initiative affecting 100+ students',
        'External recognition for leadership',
        'Elected position with documented impact',
      ],
      commonMistakes: [
        'Title without describing impact',
        'No quantification of people affected',
        'Passive voice ("was president" vs "led initiative")',
        'Multiple presidencies in senior year',
      ],
    },
    stem_project: {
      categoryName: 'STEM Projects',
      competitiveContext:
        'Personal projects demonstrate initiative and technical depth. AOs value: complexity, real users/impact, and what you learned. GitHub profiles and working demos are powerful evidence.',
      topAchievements: [
        'App with significant downloads/users',
        'Open source project with contributors',
        'Hardware project solving real problem',
        'Publication or patent from project',
      ],
      commonMistakes: [
        'Tutorial project claimed as original',
        'No evidence of completion or deployment',
        'Technical jargon without clear impact',
        'Solo claim on obvious team project',
      ],
    },
    work_experience: {
      categoryName: 'Work Experience',
      competitiveContext:
        'Work experience shows maturity, especially for students from families where work is necessary. AOs value: increased responsibility over time, skills learned, and balancing work with academics.',
      topAchievements: [
        'Promotion or increased responsibility',
        'Customer-facing role with metrics',
        'Started at company and rose to leadership',
        'Technical skill development through work',
      ],
      commonMistakes: [
        'Not explaining family financial context if relevant',
        'Missing hours/duration specifics',
        'Generic job description',
        'Not highlighting what you learned',
      ],
    },
    internship: {
      categoryName: 'Internship',
      competitiveContext:
        'Internship quality varies widely. Selective internships (RSI, MITES, company programs with <10% acceptance) are Tier 1-2. Generic internships depend on what you contributed.',
      topAchievements: [
        'RSI, MITES, or equivalent (<5% acceptance)',
        'Company internship with project ownership',
        'Research internship with publication',
        'Selective pre-college program',
      ],
      commonMistakes: [
        'Not specifying selectivity of program',
        'No concrete deliverable or contribution',
        'Confusing shadowing with internship',
        'Pay-to-play programs presented as merit',
      ],
    },
    family_responsibilities: {
      categoryName: 'Family Responsibilities',
      competitiveContext:
        'Family responsibilities demonstrate maturity and can provide important context for limited extracurriculars. AOs appreciate honesty about caregiving, work obligations, or family business contributions.',
      topAchievements: [
        'Significant caregiving responsibility (sibling, parent)',
        'Family business contribution with real role',
        'Translation/interpretation for family',
        'Managing household while parents work',
      ],
      commonMistakes: [
        'Understating significant responsibilities',
        'Not connecting to time constraints',
        'Generic description without specifics',
        'Not explaining cultural context if relevant',
      ],
    },
    other: {
      categoryName: 'Other Activities',
      competitiveContext:
        'Unique activities can be powerful differentiators if presented well. The key is showing depth, consistency, and why this matters to you. Unusual pursuits are memorable.',
      topAchievements: [
        'Deep expertise in unusual field',
        'External recognition or publication',
        'Community built around interest',
        'Innovative application of hobby',
      ],
      commonMistakes: [
        'Not explaining why this matters',
        'Missing depth or progression',
        'Too many varied hobbies (jack of all trades)',
        'Not connecting to broader narrative',
      ],
    },
    // Additional categories with sensible defaults
    arts_literary: {
      categoryName: 'Literary Arts',
      competitiveContext: 'Literary achievements are evaluated through external recognition.',
      topAchievements: ['Scholastic Writing Gold Key', 'Publication in literary magazine', 'Competition wins'],
      commonMistakes: ['No external validation', 'Missing publication details'],
    },
    cultural_heritage: {
      categoryName: 'Cultural Heritage',
      competitiveContext: 'Cultural activities show depth of connection to heritage.',
      topAchievements: ['Leadership in cultural organization', 'Community teaching or outreach'],
      commonMistakes: ['Surface-level participation', 'No impact description'],
    },
    religious_faith: {
      categoryName: 'Religious/Faith Activities',
      competitiveContext: 'Faith activities show values and community connection.',
      topAchievements: ['Youth leadership role', 'Community service through faith'],
      commonMistakes: ['No active role described', 'Missing impact'],
    },
    special_interest: {
      categoryName: 'Special Interest',
      competitiveContext: 'Special interests show authentic passion.',
      topAchievements: ['Deep expertise', 'External recognition', 'Teaching others'],
      commonMistakes: ['No depth shown', 'Too many varied interests'],
    },
    summer_program: {
      categoryName: 'Summer Program',
      competitiveContext: 'Summer programs vary in selectivity.',
      topAchievements: ['RSI, SSP, TASP (<5% acceptance)', 'Research output', 'Selective pre-college'],
      commonMistakes: ['Pay-to-play presented as merit', 'No concrete takeaway'],
    },
  };

  return insights[category] || insights.other;
}

// ============================================================================
// KNOWLEDGE ASSEMBLY SERVICE CLASS
// ============================================================================

export class KnowledgeAssemblyService {
  /**
   * Assemble complete knowledge context for an activity
   */
  assembleKnowledgeContext(
    activity: ActivityWorkshopInput,
    analysis: AnalysisContext['activities'][string],
    studentContext?: ActivityWorkshopSessionInput['studentContext']
  ): ActivityKnowledgeContext {
    const detectedCategory = (analysis?.classification?.detectedCategory ||
      this.detectCategory(activity)) as ActivityCategory;
    const tier = (analysis?.classification?.tier || 4) as 1 | 2 | 3 | 4;

    // 1. Get tier benchmarks for category
    const tierBenchmarks = getTierBenchmarksForCategory(detectedCategory);

    // 2. Map detected issues to teaching bundles
    const issues = analysis?.descriptionQuality?.issues || [];
    const mappedIssues = mapIssuesToKnowledgeBase(issues);
    const issueTeaching = this.assembleIssueTeaching(mappedIssues);

    // 3. Get field expectations if major provided
    const fieldExpectations = studentContext?.intendedMajor
      ? this.assembleFieldExpectations(studentContext.intendedMajor, activity, analysis)
      : null;

    // 4. Get pre-computed citations
    const redFlags = (analysis?.redFlags || []).map((f) => f.flag);
    const greenFlags = (analysis?.greenFlags || []).map((f) => f.flag);
    const citations = activityCitationService.getAllCitations(activity, tier, redFlags, greenFlags);

    // 5. Get Sara Harberson criteria for assigned tier
    const saraHarbersonCriteria = SARA_HARBERSON_TIERS[tier];

    // 6. Get category insights
    const categoryInsights = getCategoryInsights(detectedCategory);

    return {
      activityId: activity.id,
      activityTitle: activity.title,
      detectedCategory,
      tierBenchmarks,
      issueTeaching,
      fieldExpectations,
      citations,
      saraHarbersonCriteria,
      categoryInsights,
    };
  }

  /**
   * Assemble knowledge context WITH expert counselor intelligence
   *
   * Enhanced version that includes advanced admissions psychology,
   * constraint intelligence, school-specific insights, narrative arc
   * detection, authenticity assessment, and character trait mapping.
   *
   * IMPORTANT: Accepts a pre-built expertContext to avoid redundant assembly.
   * The caller (Stage 2) assembles expert context ONCE for the whole batch
   * and passes it here. This prevents N redundant assemblies.
   */
  assembleEnrichedKnowledgeContext(
    activity: ActivityWorkshopInput,
    analysis: AnalysisContext['activities'][string],
    prebuiltExpertContext?: ExpertKnowledgeContext,
    studentContext?: ActivityWorkshopSessionInput['studentContext']
  ): ActivityKnowledgeContext {
    // Get base knowledge context (Sara Harberson, category insights, teaching bundles, etc.)
    const baseContext = this.assembleKnowledgeContext(activity, analysis, studentContext);

    // Use pre-built expert context if available (avoids redundant assembly)
    if (!prebuiltExpertContext) {
      return baseContext;
    }

    // Enrich issue teaching with advanced teaching bundles from expert context
    const advancedIssues = prebuiltExpertContext.advancedIssues;
    for (const advIssue of advancedIssues) {
      // Only add issues that aren't already covered by base teaching bundles
      const alreadyCovered = baseContext.issueTeaching.some(
        it => it.issueType === advIssue.issueType
      );
      if (!alreadyCovered) {
        baseContext.issueTeaching.push({
          issueType: advIssue.issueType as ActivityIssueType,
          theProblem: {
            headline: advIssue.theProblem.headline,
            explanation: advIssue.theProblem.explanation,
            admissionsImpact: advIssue.theProblem.admissionsImpact,
            commonManifestations: advIssue.theProblem.commonManifestations,
          },
          whyThisWorks: {
            psychology: advIssue.whyThisWorks.psychology,
            research: advIssue.whyThisWorks.research,
            quote: advIssue.whyThisWorks.admissionsQuote,
            quoteSource: advIssue.whyThisWorks.quoteSource,
          },
          whatToDo: {
            principle: advIssue.whatToDo.principle,
            steps: advIssue.whatToDo.steps,
          },
          detailPriorities: {
            critical: advIssue.whatToDo.steps.slice(0, 3).map(step => ({
              detail: step,
              whyItMatters: 'Critical for admissions impact',
              example: advIssue.examples[0]?.after || step,
            })),
            valuable: [],
            avoid: [],
          },
          examples: advIssue.examples.map(ex => ({
            context: ex.context,
            before: ex.before,
            after: ex.after,
            principle: ex.principleApplied,
            whyItWorks: ex.principleApplied,
          })),
          metadata: {
            difficulty: 'moderate' as const,
            timeToFix: '10-15 minutes',
          },
        });
      }
    }

    // Return enriched context — expert context is NOT stored here
    // because it's already in the system prompt (avoids double injection)
    return baseContext;
  }

  /**
   * Assemble issue teaching bundles
   */
  private assembleIssueTeaching(issueTypes: ActivityIssueType[]): IssueTeachingContext[] {
    const contexts: IssueTeachingContext[] = [];

    for (const issueType of issueTypes) {
      const bundle = getTeachingForIssue(issueType);
      if (!bundle) continue;

      // Bundle uses snake_case properties: the_problem, why_this_works, detail_priorities, transformations
      contexts.push({
        issueType,
        theProblem: {
          headline: bundle.the_problem.headline,
          explanation: bundle.the_problem.explanation,
          admissionsImpact: bundle.the_problem.admissions_impact,
          commonManifestations: bundle.the_problem.common_manifestations,
        },
        whyThisWorks: {
          psychology: bundle.why_this_works.psychology,
          research: bundle.why_this_works.research_insight,
          quote: bundle.why_this_works.admissions_quote,
          quoteSource: bundle.why_this_works.quote_source,
        },
        whatToDo: {
          // detail_priorities uses must_include, nice_to_have, avoid
          principle: `Focus on: ${bundle.detail_priorities.must_include.slice(0, 2).join('; ')}`,
          steps: bundle.detail_priorities.must_include
            .slice(0, 4)
            .map((item) => item),
        },
        detailPriorities: {
          critical: bundle.detail_priorities.must_include.map((item) => ({
            detail: item,
            whyItMatters: 'Critical for AO evaluation',
            example: bundle.transformations[0]?.after || item,
          })),
          valuable: bundle.detail_priorities.nice_to_have,
          avoid: bundle.detail_priorities.avoid,
        },
        examples: bundle.transformations.map((ex) => ({
          context: ex.context,
          before: ex.before,
          after: ex.after,
          principle: ex.principle_applied,
          whyItWorks: ex.why_it_works,
        })),
        metadata: {
          difficulty: bundle.difficulty,
          timeToFix: bundle.time_to_fix,
        },
      });
    }

    return contexts;
  }

  /**
   * Assemble field expectations context
   */
  private assembleFieldExpectations(
    intendedMajor: string,
    activity: ActivityWorkshopInput,
    analysis: AnalysisContext['activities'][string]
  ): FieldExpectationsContext | null {
    try {
      const normalizedMajor = normalizeMajor(intendedMajor);
      const expectations = getFieldExpectations(normalizedMajor);

      if (!expectations) return null;

      // Assess relevance of this activity to the major
      const detectedCategory = analysis?.classification?.detectedCategory || 'other';
      const isAligned = expectations.expected_activities.some(
        (exp) =>
          exp.toLowerCase().includes(detectedCategory.toLowerCase()) ||
          activity.title.toLowerCase().includes(exp.toLowerCase()) ||
          activity.description.toLowerCase().includes(exp.toLowerCase())
      );

      return {
        majorName: intendedMajor,
        normalizedMajor,
        expectedActivities: expectations.expected_activities,
        bonusActivities: expectations.bonus_activities || [],
        warningSignals: expectations.warning_signals || [],
        impactBenchmarks: {
          exceptional: expectations.impact_benchmarks?.exceptional || 'Top-tier achievement in field',
          strong: expectations.impact_benchmarks?.strong || 'Significant contribution with metrics',
          baseline: expectations.impact_benchmarks?.baseline || 'Participation with learning evidence',
        },
        descriptionExpectations: {
          keyTerms: expectations.description_expectations?.key_terms || [],
          actionVerbs: expectations.description_expectations?.action_verbs || [],
          quantificationExamples: expectations.description_expectations?.quantification_examples || [],
          termsToAvoid: expectations.description_expectations?.terms_to_avoid || [],
        },
        relevanceAssessment: {
          isAligned,
          alignmentReason: isAligned
            ? `This activity aligns with expectations for ${intendedMajor} applicants`
            : `This activity may not directly support a ${intendedMajor} application - consider how to connect it to your major interest`,
        },
      };
    } catch {
      return null;
    }
  }

  /**
   * Detect activity category from input
   */
  private detectCategory(activity: ActivityWorkshopInput): ActivityCategory {
    const combined = `${activity.title} ${activity.description}`.toLowerCase();

    if (
      combined.includes('olympiad') ||
      combined.includes('competition') ||
      combined.includes('amc') ||
      combined.includes('usaco') ||
      combined.includes('debate')
    ) {
      return 'academic_competition';
    }
    if (combined.includes('research') || combined.includes('lab') || combined.includes('publication')) {
      return 'research';
    }
    if (
      combined.includes('founded') ||
      combined.includes('startup') ||
      combined.includes('business') ||
      combined.includes('ceo')
    ) {
      return 'entrepreneurship';
    }
    if (combined.includes('volunteer') || combined.includes('nonprofit') || combined.includes('community')) {
      return 'community_service';
    }
    if (
      combined.includes('orchestra') ||
      combined.includes('band') ||
      combined.includes('theater') ||
      combined.includes('dance')
    ) {
      return 'arts_performance';
    }
    if (combined.includes('varsity') || combined.includes('sport') || combined.includes('team')) {
      return 'athletics';
    }
    if (activity.isPaid) {
      return 'work_experience';
    }

    return activity.category as ActivityCategory || 'other';
  }

  /**
   * Format knowledge context for prompt injection
   */
  formatForPrompt(context: ActivityKnowledgeContext): string {
    const sections: string[] = [];

    // Section 1: Sara Harberson Tier Criteria
    sections.push(`## SARA HARBERSON TIER CRITERIA

**Current Assessment: ${context.saraHarbersonCriteria.tierName}**

${context.saraHarbersonCriteria.definition}

**Evidence Required for This Tier:**
${context.saraHarbersonCriteria.evidence.map((e) => `- ${e}`).join('\n')}

**Examples at This Tier:**
${context.saraHarbersonCriteria.examples.map((e) => `- ${e}`).join('\n')}

**Admission Impact:** ${context.saraHarbersonCriteria.admissionImpact}`);

    // Section 2: Category-Specific Benchmarks
    sections.push(`## BENCHMARKS FOR ${context.categoryInsights.categoryName.toUpperCase()}

**Competitive Context:**
${context.categoryInsights.competitiveContext}

**Top Achievements in This Category:**
${context.categoryInsights.topAchievements.map((a) => `- ${a}`).join('\n')}

**Common Mistakes to Avoid:**
${context.categoryInsights.commonMistakes.map((m) => `- ${m}`).join('\n')}`);

    // Section 3: Tier Benchmarks
    const tierData = context.tierBenchmarks.find((t) => t.tier === context.saraHarbersonCriteria.tier);
    if (tierData) {
      sections.push(`## TIER ${tierData.tier} SPECIFIC CRITERIA

**Name:** ${tierData.name}
**Criteria:** ${tierData.criteria}

**Key Metrics:**
${tierData.metrics.map((m) => `- ${m}`).join('\n')}

**Examples:**
${tierData.examples.map((e) => `- ${e}`).join('\n')}`);
    }

    // Section 4: Issue Teaching Bundles
    if (context.issueTeaching.length > 0) {
      sections.push(`## TEACHING BUNDLES FOR DETECTED ISSUES

Use these research-backed teaching structures for the issues detected:`);

      for (const issue of context.issueTeaching) {
        sections.push(`
### ISSUE: ${issue.issueType.toUpperCase().replace(/_/g, ' ')}

**THE PROBLEM:**
${issue.theProblem.headline}

${issue.theProblem.explanation}

*Admissions Impact:* ${issue.theProblem.admissionsImpact}

**WHY THIS WORKS (Psychology):**
${issue.whyThisWorks.psychology}

*Research:* ${issue.whyThisWorks.research}
${issue.whyThisWorks.quote ? `\n*Expert Quote:* "${issue.whyThisWorks.quote}" — ${issue.whyThisWorks.quoteSource}` : ''}

**WHAT TO DO:**
Principle: ${issue.whatToDo.principle}

Steps:
${issue.whatToDo.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**CRITICAL DETAILS TO INCLUDE:**
${issue.detailPriorities.critical
  .slice(0, 3)
  .map((c) => `- **${c.detail}**: ${c.whyItMatters}\n  Example: "${c.example}"`)
  .join('\n')}

**AVOID:**
${issue.detailPriorities.avoid.map((a) => `- ${a}`).join('\n')}

**TRANSFORMATION EXAMPLE:**
Before: "${issue.examples[0]?.before || 'Generic description'}"
After: "${issue.examples[0]?.after || 'Specific, impactful description'}"
Principle: ${issue.examples[0]?.principle || 'Specificity builds credibility'}`);
      }
    }

    // Section 5: Field Expectations
    if (context.fieldExpectations) {
      sections.push(`## FIELD EXPECTATIONS FOR ${context.fieldExpectations.majorName.toUpperCase()}

**Expected Activities for This Major:**
${context.fieldExpectations.expectedActivities.map((a) => `- ${a}`).join('\n')}

**Bonus Activities (Stand Out):**
${context.fieldExpectations.bonusActivities.map((a) => `- ${a}`).join('\n')}

**Warning Signals:**
${context.fieldExpectations.warningSignals.map((w) => `- ${w}`).join('\n')}

**Impact Benchmarks:**
- Exceptional: ${context.fieldExpectations.impactBenchmarks.exceptional}
- Strong: ${context.fieldExpectations.impactBenchmarks.strong}
- Baseline: ${context.fieldExpectations.impactBenchmarks.baseline}

**Relevance Assessment:**
${context.fieldExpectations.relevanceAssessment?.alignmentReason || 'Assessment pending'}`);
    }

    // Section 6: Citations to Reference
    if (context.citations.length > 0) {
      sections.push(`## CITATIONS TO REFERENCE

Use these citations to back your teaching with evidence:`);

      for (const citation of context.citations.slice(0, 5)) {
        sections.push(`
[${citation.id}] ${citation.source.name}
Type: ${citation.type}
Evidence: ${citation.evidence.statistic || citation.evidence.benchmark || citation.evidence.quote || 'N/A'}
Relevance: ${citation.relevance}`);
      }
    }

    // NOTE: Expert Counselor Intelligence is injected via the SYSTEM PROMPT
    // (buildExpertTeachingPrompt / buildExpertAnalysisPrompt), NOT here.
    // This prevents double injection — the system prompt provides the reasoning
    // framework, and this prompt provides the per-activity knowledge data.

    return sections.join('\n\n---\n\n');
  }
}

// Export singleton instance
export const knowledgeAssemblyService = new KnowledgeAssemblyService();
