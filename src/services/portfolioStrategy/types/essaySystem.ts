/**
 * Essay System Types
 *
 * Comprehensive type definitions for essay analysis, optimization, and guidance.
 * Essays are THE most developable component of an application - a strong essay
 * can elevate an otherwise average profile, while a weak essay can sink a strong one.
 *
 * Key Insight: Essays are evaluated on multiple dimensions, and each essay type
 * (Personal Statement, Why School, Why Major, etc.) has different expectations
 * and evaluation criteria. This system provides grade-appropriate guidance and
 * professional-level feedback.
 *
 * Harvard 1-6 Scale for Essays:
 * 1 = Exceptional - Unforgettable, changes how reader sees the world
 * 2 = Excellent - Compelling, memorable, reveals genuine depth
 * 3 = Good - Solid, clear voice, but missing that special something
 * 4 = Adequate - Competent but generic, could be anyone
 * 5 = Below Average - Unfocused, cliched, or superficial
 * 6 = Concerning - Red flags, inappropriate, or completely misses the mark
 */

import { HarvardScore, HarvardScoreDecimal } from './scoring';
import { GradeLevel, YearPhase } from './timeline';

// ============================================================================
// ESSAY TYPE CLASSIFICATION
// ============================================================================

/**
 * Types of essays in the college application process
 */
export type EssayType =
  // Common App / Coalition
  | 'personal_statement'       // Main essay (650 words)
  | 'additional_information'   // Additional info section

  // Supplemental Categories
  | 'why_school'              // Why [School Name]
  | 'why_major'               // Why this major/program
  | 'community'               // Community you belong to
  | 'extracurricular'         // Elaborate on activity
  | 'intellectual_curiosity'  // What excites you academically
  | 'challenge_setback'       // Overcome obstacle
  | 'diversity'               // What you bring to campus
  | 'creative'                // Creative/unusual prompt
  | 'ethical_dilemma'         // Ethical question response
  | 'future_goals'            // Career/life goals
  | 'leadership'              // Leadership experience
  | 'collaboration'           // Working with others
  | 'failure_learning'        // Learning from failure
  | 'identity'                // Who you are
  | 'short_answer'            // Brief responses (50-150 words)
  | 'list_based'              // Lists (favorite books, etc.)
  | 'roommate_letter'         // Letter to future roommate
  | 'other_supplemental';     // Other supplemental types

/**
 * Essay length categories
 */
export type EssayLengthCategory =
  | 'micro'      // 50-100 words
  | 'short'      // 100-250 words
  | 'medium'     // 250-400 words
  | 'standard'   // 400-650 words
  | 'extended';  // 650+ words

/**
 * Essay status in the writing process
 */
export type EssayStatus =
  | 'not_started'
  | 'brainstorming'
  | 'outlining'
  | 'first_draft'
  | 'revising'
  | 'polishing'
  | 'final';

// ============================================================================
// ESSAY QUALITY DIMENSIONS
// ============================================================================

/**
 * Core quality dimensions for essay evaluation
 */
export type EssayQualityDimension =
  | 'authenticity'           // Genuine voice, real self
  | 'specificity'            // Concrete details, not vague
  | 'insight'                // Shows thinking/reflection
  | 'structure'              // Logical flow, engaging arc
  | 'uniqueness'             // Different from other applicants
  | 'stakes'                 // Why this matters to you
  | 'intellectual_engagement'// Thoughtful engagement with ideas
  | 'memorability'           // Reader remembers this
  | 'voice'                  // Distinctive writing style
  | 'maturity'               // Emotional/intellectual maturity
  | 'self_awareness'         // Understanding of self
  | 'growth_shown'           // Evidence of development
  | 'prompt_response'        // Actually answers the question
  | 'writing_quality';       // Sentence-level craft

/**
 * Individual dimension score
 */
export interface DimensionScore {
  dimension: EssayQualityDimension;
  score: HarvardScoreDecimal;
  weight: number;
  evidence: string[];
  suggestions: string[];
}

/**
 * Essay quality rubric
 */
export const ESSAY_QUALITY_RUBRIC: Record<EssayQualityDimension, Record<HarvardScore, string>> = {
  authenticity: {
    1: 'Unmistakably genuine - only this person could write this essay. Voice is distinctive and real.',
    2: 'Clearly authentic with moments that feel deeply personal. Reader senses the real person.',
    3: 'Generally authentic but some sections feel generic or performed.',
    4: 'Surface-level personal. Could be written by many students with similar experiences.',
    5: 'Feels scripted or like what applicant thinks admissions wants to hear.',
    6: 'Completely inauthentic or clearly written by someone else.',
  },
  specificity: {
    1: 'Vivid, precise details that transport the reader. Every detail earns its place.',
    2: 'Strong specific details that make the story real and memorable.',
    3: 'Some good specific moments but also vague or generic sections.',
    4: 'Mostly tells rather than shows. Relies on abstractions.',
    5: 'Almost entirely abstract. No concrete details to remember.',
    6: 'Completely vague. No specifics whatsoever.',
  },
  insight: {
    1: 'Profound reflection that reveals exceptional self-understanding and intellectual depth.',
    2: 'Thoughtful insights that show genuine reflection and growth.',
    3: 'Some reflection present but insights are somewhat predictable.',
    4: 'Minimal reflection. States what happened without examining why it matters.',
    5: 'No real insight. Just recounts events.',
    6: 'Completely surface-level or insights are actually wrong/immature.',
  },
  structure: {
    1: 'Perfect structure that feels inevitable. Opening hooks, ending resonates, every paragraph earns its place.',
    2: 'Strong structure with engaging flow. Clear arc that builds to meaningful conclusion.',
    3: 'Functional structure but somewhat predictable or some pacing issues.',
    4: 'Basic structure but rambling or rushed in places. Weak opening or ending.',
    5: 'Disorganized or structurally confused. Hard to follow.',
    6: 'No discernible structure. Incoherent.',
  },
  uniqueness: {
    1: 'Completely original - topic, angle, and execution unlike anything reader has seen.',
    2: 'Fresh perspective on topic. Stands out from typical essays on similar subjects.',
    3: 'Some unique elements but general approach is familiar.',
    4: 'Common topic with common approach. Will blend with hundreds of similar essays.',
    5: 'Cliched topic and cliched treatment.',
    6: 'Actively derivative or inappropriate.',
  },
  stakes: {
    1: 'Reader genuinely cares what happens. Stakes feel real and significant.',
    2: 'Clear sense of what matters to the writer and why.',
    3: 'Some stakes established but could be higher or clearer.',
    4: 'Why should we care? Stakes are vague or unconvincing.',
    5: 'No sense of why this matters to anyone.',
    6: 'Actively off-putting or stakes are trivial presented as profound.',
  },
  intellectual_engagement: {
    1: 'Shows exceptional intellectual curiosity and sophisticated thinking.',
    2: 'Demonstrates genuine intellectual engagement with ideas.',
    3: 'Some intellectual content but could go deeper.',
    4: 'Minimal intellectual engagement. Doesn\'t explore ideas.',
    5: 'No intellectual depth whatsoever.',
    6: 'Actively anti-intellectual or shows poor thinking.',
  },
  memorability: {
    1: 'Unforgettable. Reader will think about this essay days later.',
    2: 'Very memorable. Clear images/moments that stick.',
    3: 'Some memorable moments but overall somewhat forgettable.',
    4: 'Will blur with other essays immediately after reading.',
    5: 'Completely forgettable.',
    6: 'Memorable for wrong reasons - off-putting or concerning.',
  },
  voice: {
    1: 'Distinctive, confident voice that\'s impossible to imitate.',
    2: 'Clear voice with personality and style.',
    3: 'Voice present but inconsistent or underdeveloped.',
    4: 'Generic voice. Could be anyone.',
    5: 'No discernible voice. Reads like template.',
    6: 'Voice is actively off-putting or inappropriate.',
  },
  maturity: {
    1: 'Exceptional maturity - perspective beyond years without seeming inauthentic.',
    2: 'Shows real maturity in how experiences are processed.',
    3: 'Age-appropriate maturity with some growth evident.',
    4: 'Somewhat immature in perspective or understanding.',
    5: 'Notably immature for age.',
    6: 'Concerning immaturity or red flags about judgment.',
  },
  self_awareness: {
    1: 'Exceptional self-understanding including awareness of blind spots.',
    2: 'Strong self-awareness with honest assessment of strengths and weaknesses.',
    3: 'Some self-awareness but perhaps too positive or missing key insights.',
    4: 'Limited self-awareness. Doesn\'t seem to understand how they come across.',
    5: 'Lacks self-awareness. Blind to obvious issues.',
    6: 'Actively deluded or concerning lack of perspective.',
  },
  growth_shown: {
    1: 'Compelling arc of growth that feels genuine and significant.',
    2: 'Clear evidence of growth and development over time.',
    3: 'Some growth shown but could be more specific or significant.',
    4: 'Growth is claimed but not demonstrated.',
    5: 'No growth shown. Static presentation.',
    6: 'Regression shown or growth claims are obviously false.',
  },
  prompt_response: {
    1: 'Perfectly addresses prompt while transcending it.',
    2: 'Fully answers prompt with depth and insight.',
    3: 'Answers prompt but could be more direct or complete.',
    4: 'Partially addresses prompt but misses key aspects.',
    5: 'Barely addresses prompt. Off-topic.',
    6: 'Completely ignores prompt.',
  },
  writing_quality: {
    1: 'Exceptional prose - every sentence is crafted, varied, purposeful.',
    2: 'Strong writing with good variety and few errors.',
    3: 'Competent writing with some awkwardness or errors.',
    4: 'Adequate but unpolished. Multiple errors or awkward constructions.',
    5: 'Poor writing quality. Many errors, unclear sentences.',
    6: 'Unacceptable writing quality.',
  },
};

// ============================================================================
// PERSONAL STATEMENT ANALYSIS
// ============================================================================

/**
 * Personal statement topic categories
 */
export type PersonalStatementTopicCategory =
  | 'identity_exploration'    // Who you are
  | 'challenge_growth'        // Overcoming obstacles
  | 'passion_pursuit'         // Deep interest development
  | 'aha_moment'              // Intellectual awakening
  | 'community_impact'        // Making a difference
  | 'family_heritage'         // Cultural/family background
  | 'unique_experience'       // Unusual life experience
  | 'creative_expression'     // Artistic journey
  | 'belief_examination'      // Values and beliefs
  | 'relationship'            // Important person/mentor
  | 'place'                   // Meaningful location
  | 'object'                  // Meaningful object/artifact
  | 'routine_ritual'          // Daily practice with meaning
  | 'contradiction'           // Internal tension
  | 'other';

/**
 * Common pitfalls for personal statements
 */
export interface PersonalStatementPitfall {
  pitfallType: PersonalStatementPitfallType;
  description: string;
  detected: boolean;
  severity: 'critical' | 'significant' | 'minor';
  evidence?: string;
  howToFix: string;
}

export type PersonalStatementPitfallType =
  | 'mission_trip_cliche'     // Privilege realization from helping "less fortunate"
  | 'sports_injury'           // Generic sports setback narrative
  | 'dead_grandparent'        // Loss without genuine insight
  | 'immigrant_hardship'      // Hardship without unique angle
  | 'divorce_trauma'          // Family issues without growth
  | 'debate_tournament'       // Competition narrative without depth
  | 'research_summary'        // Technical description without personal connection
  | 'resume_in_prose'         // Just listing accomplishments
  | 'thesaurus_abuse'         // Trying too hard to sound smart
  | 'too_many_topics'         // Unfocused, tries to cover everything
  | 'admissions_bait'         // Writing what you think they want
  | 'no_specific_details'     // All abstract, no concrete moments
  | 'starting_with_quote'     // Opening with someone else's words
  | 'ending_with_lesson'      // Forced moral at the end
  | 'passive_voice_overuse'   // Distances writer from experience
  | 'first_world_problems'    // Privileged problems without self-awareness
  | 'victim_narrative'        // All suffering, no agency
  | 'hero_narrative'          // Self-aggrandizing without humility
  | 'too_safe'                // Doesn't take any risks
  | 'trying_too_hard';        // Overwritten, try-hard prose

/**
 * Complete personal statement analysis
 */
export interface PersonalStatementAnalysis {
  // Basic info
  essayId: string;
  wordCount: number;
  status: EssayStatus;
  analyzedAt: string;

  // Topic analysis
  topicCategory: PersonalStatementTopicCategory;
  topicOriginality: HarvardScoreDecimal;
  topicAssessment: string;
  topicRecommendations: string[];

  // Quality scores
  overallScore: HarvardScoreDecimal;
  dimensionScores: DimensionScore[];
  weightedScore: number;

  // Narrative analysis
  narrativeArc: {
    hasOpeningHook: boolean;
    hookQuality: HarvardScoreDecimal;
    hasRisingAction: boolean;
    hasTurningPoint: boolean;
    hasResolution: boolean;
    endingQuality: HarvardScoreDecimal;
    arcAssessment: string;
  };

  // Voice analysis
  voiceAnalysis: {
    distinctiveness: HarvardScoreDecimal;
    consistency: HarvardScoreDecimal;
    ageAppropriateness: boolean;
    toneDescription: string;
    voiceStrengths: string[];
    voiceConcerns: string[];
  };

  // Pitfall detection
  pitfallsDetected: PersonalStatementPitfall[];
  pitfallRiskLevel: 'high' | 'moderate' | 'low' | 'none';

  // Comparative analysis
  comparativePosition: {
    percentileEstimate: number;
    standOutFactors: string[];
    blendInFactors: string[];
    competitiveAtTier: 'T5' | 'T10' | 'T20' | 'T50' | 'T100';
  };

  // Improvement roadmap
  improvementRoadmap: {
    priority1: ImprovementSuggestion;
    priority2: ImprovementSuggestion;
    priority3: ImprovementSuggestion;
    additionalSuggestions: ImprovementSuggestion[];
    expectedScoreWithImprovements: HarvardScoreDecimal;
  };

  // Reader experience
  readerExperience: {
    firstImpression: string;
    memorableMoments: string[];
    confusingMoments: string[];
    emotionalImpact: 'strong' | 'moderate' | 'weak' | 'none';
    likelyAdmissionsReaction: string;
  };
}

/**
 * Improvement suggestion
 */
export interface ImprovementSuggestion {
  area: EssayQualityDimension | 'structure' | 'topic' | 'specifics' | 'other';
  currentState: string;
  suggestion: string;
  example?: string;
  expectedImpact: HarvardScoreDecimal; // Score improvement
  effort: 'high' | 'medium' | 'low';
  priority: number;
}

// ============================================================================
// SUPPLEMENTAL ESSAY ANALYSIS
// ============================================================================

/**
 * Why School essay analysis
 */
export interface WhySchoolEssayAnalysis {
  essayId: string;
  schoolName: string;
  wordCount: number;
  wordLimit: number;
  status: EssayStatus;
  analyzedAt: string;

  // Overall score
  overallScore: HarvardScoreDecimal;

  // Specificity to school
  schoolSpecificity: {
    score: HarvardScoreDecimal;
    specificProgramsMentioned: string[];
    specificProfessorsMentioned: string[];
    specificResourcesMentioned: string[];
    specificCultureElements: string[];
    genericStatements: string[];
    couldApplyToOtherSchools: boolean;
    assessment: string;
  };

  // Connection to self
  personalConnection: {
    score: HarvardScoreDecimal;
    connectionToValues: string;
    connectionToGoals: string;
    connectionToActivities: string;
    authenticReasons: string[];
    superficialReasons: string[];
    assessment: string;
  };

  // Research demonstrated
  researchDepth: {
    score: HarvardScoreDecimal;
    evidenceOfVisit: boolean;
    evidenceOfStudentContact: boolean;
    evidenceOfClassResearch: boolean;
    evidenceOfProfessorResearch: boolean;
    knowledgeLevel: 'deep' | 'moderate' | 'surface' | 'minimal';
    assessment: string;
  };

  // Future vision
  futureVision: {
    score: HarvardScoreDecimal;
    specificPlans: string[];
    connectionToCareer: string;
    fourYearVision: string;
    beyondCollegeVision: string;
    assessment: string;
  };

  // Common mistakes
  mistakesDetected: {
    mistake: WhySchoolMistake;
    detected: boolean;
    evidence?: string;
  }[];

  // Improvement recommendations
  improvements: ImprovementSuggestion[];
}

export type WhySchoolMistake =
  | 'only_rankings_prestige'    // Only mentions rankings/reputation
  | 'generic_location'          // Just mentions city without specifics
  | 'sports_only'               // Only mentions sports/athletics
  | 'copied_website'            // Clearly just copied from website
  | 'no_personal_connection'    // All about school, nothing about self
  | 'wrong_school_name'         // Mentions wrong school (copy-paste error)
  | 'factually_incorrect'       // Wrong information about school
  | 'too_many_programs'         // Mentions too much, seems unfocused
  | 'size_only'                 // Only mentions small classes/attention
  | 'repeats_application';      // Just repeats info from elsewhere in app

/**
 * Why Major essay analysis
 */
export interface WhyMajorEssayAnalysis {
  essayId: string;
  intendedMajor: string;
  wordCount: number;
  status: EssayStatus;
  analyzedAt: string;

  overallScore: HarvardScoreDecimal;

  // Origin story
  originStory: {
    score: HarvardScoreDecimal;
    hasSpecificMoment: boolean;
    momentDescription?: string;
    isDeeplyPersonal: boolean;
    assessment: string;
  };

  // Evidence of passion
  passionEvidence: {
    score: HarvardScoreDecimal;
    academicEvidence: string[];
    extracurricularEvidence: string[];
    independentExploration: string[];
    depthDemonstrated: 'exceptional' | 'strong' | 'moderate' | 'surface' | 'none';
    assessment: string;
  };

  // Understanding of field
  fieldUnderstanding: {
    score: HarvardScoreDecimal;
    showsRealKnowledge: boolean;
    mentionsCurrentIssues: boolean;
    understandsCareerPaths: boolean;
    sophisticationLevel: 'expert' | 'informed' | 'basic' | 'naive';
    assessment: string;
  };

  // Future goals
  futureGoals: {
    score: HarvardScoreDecimal;
    goalsArticulated: string[];
    goalsRealistic: boolean;
    goalsConnectToMajor: boolean;
    assessment: string;
  };

  // Common mistakes
  mistakesDetected: {
    mistake: WhyMajorMistake;
    detected: boolean;
    evidence?: string;
  }[];

  improvements: ImprovementSuggestion[];
}

export type WhyMajorMistake =
  | 'since_childhood'           // "I've wanted to be X since I was 5"
  | 'family_pressure'           // Reveals doing it for parents
  | 'salary_focused'            // Only mentions money
  | 'no_evidence'               // Claims interest with no supporting activities
  | 'too_narrow'                // Only one aspect of broad field
  | 'too_broad'                 // Vague about why this specific major
  | 'contradicts_activities'    // Major doesn't match extracurriculars
  | 'just_good_at_it'           // Only mentions being good, not passion
  | 'influenced_by_media'       // Inspired by TV show without deeper exploration
  | 'unrealistic_goals';        // Goals disconnected from major requirements

/**
 * Community essay analysis
 */
export interface CommunityEssayAnalysis {
  essayId: string;
  communityDescribed: string;
  wordCount: number;
  status: EssayStatus;
  analyzedAt: string;

  overallScore: HarvardScoreDecimal;

  // Community definition
  communityDefinition: {
    score: HarvardScoreDecimal;
    communityType: 'geographic' | 'cultural' | 'interest' | 'identity' | 'circumstance' | 'chosen' | 'other';
    isUnique: boolean;
    isWellDefined: boolean;
    assessment: string;
  };

  // Role in community
  roleAnalysis: {
    score: HarvardScoreDecimal;
    roleDescribed: string;
    isActive: boolean;
    showsContribution: boolean;
    showsGrowthFromCommunity: boolean;
    mutualBenefit: boolean;
    assessment: string;
  };

  // What you bring to campus
  campusContribution: {
    score: HarvardScoreDecimal;
    perspectivesOffered: string[];
    skillsOffered: string[];
    experiencesOffered: string[];
    diversityContribution: string;
    assessment: string;
  };

  improvements: ImprovementSuggestion[];
}

/**
 * Activity/Extracurricular elaboration essay analysis
 */
export interface ActivityEssayAnalysis {
  essayId: string;
  activityName: string;
  wordCount: number;
  status: EssayStatus;
  analyzedAt: string;

  overallScore: HarvardScoreDecimal;

  // Why this activity
  whyThisActivity: {
    score: HarvardScoreDecimal;
    personalSignificance: string;
    differentFromDescription: boolean;
    addsDimension: boolean;
    assessment: string;
  };

  // Depth revealed
  depthRevealed: {
    score: HarvardScoreDecimal;
    specificMoments: string[];
    challengesFaced: string[];
    growthShown: string[];
    skillsDeveloped: string[];
    assessment: string;
  };

  // Impact shown
  impactAnalysis: {
    score: HarvardScoreDecimal;
    impactOnSelf: string;
    impactOnOthers: string;
    impactOnActivity: string;
    quantifiedResults?: string[];
    assessment: string;
  };

  // Connection to identity
  identityConnection: {
    score: HarvardScoreDecimal;
    revealsSomethingNew: boolean;
    consistentWithProfile: boolean;
    assessment: string;
  };

  improvements: ImprovementSuggestion[];
}

// ============================================================================
// ESSAY PORTFOLIO ANALYSIS
// ============================================================================

/**
 * Complete essay portfolio (all essays for application)
 */
export interface EssayPortfolioAnalysis {
  // Metadata
  userId: string;
  analyzedAt: string;
  totalEssays: number;
  completedEssays: number;

  // Overall portfolio assessment
  portfolioScore: HarvardScoreDecimal;
  portfolioAssessment: string;

  // Individual analyses
  personalStatement?: PersonalStatementAnalysis;
  supplementals: {
    schoolName: string;
    essays: (WhySchoolEssayAnalysis | WhyMajorEssayAnalysis | CommunityEssayAnalysis | ActivityEssayAnalysis | GenericSupplementalAnalysis)[];
    schoolEssayScore: HarvardScoreDecimal;
  }[];

  // Portfolio-level analysis
  portfolioCoherence: {
    score: HarvardScoreDecimal;
    thematicConsistency: boolean;
    voiceConsistency: boolean;
    redundanciesFound: string[];
    gapsFound: string[];
    assessment: string;
  };

  // Story coverage
  storyCoverage: {
    aspectsCovered: string[];
    aspectsMissing: string[];
    dimensionsRevealed: string[];
    dimensionsMissing: string[];
    overallCoverage: 'comprehensive' | 'good' | 'adequate' | 'incomplete';
    assessment: string;
  };

  // Strengths and weaknesses
  portfolioStrengths: string[];
  portfolioWeaknesses: string[];

  // Strategic recommendations
  strategicRecommendations: {
    priority: number;
    essay: string;
    recommendation: string;
    expectedImpact: string;
  }[];

  // Time allocation recommendation
  timeAllocationRecommendation: {
    essay: string;
    recommendedHours: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    rationale: string;
  }[];
}

/**
 * Generic supplemental analysis (for essay types not specifically categorized)
 */
export interface GenericSupplementalAnalysis {
  essayId: string;
  essayType: EssayType;
  prompt: string;
  wordCount: number;
  wordLimit: number;
  status: EssayStatus;
  analyzedAt: string;

  overallScore: HarvardScoreDecimal;
  dimensionScores: DimensionScore[];

  promptResponse: {
    score: HarvardScoreDecimal;
    answersPrompt: boolean;
    directness: 'very_direct' | 'direct' | 'indirect' | 'off_topic';
    assessment: string;
  };

  contentAnalysis: {
    mainPoints: string[];
    evidenceUsed: string[];
    insightsPresent: string[];
    assessment: string;
  };

  improvements: ImprovementSuggestion[];
}

// ============================================================================
// GRADE-SPECIFIC ESSAY GUIDANCE
// ============================================================================

/**
 * Grade-appropriate essay guidance
 */
export interface GradeSpecificEssayGuidance {
  gradeLevel: GradeLevel;
  phase: YearPhase;

  // What to focus on now
  currentPriorities: {
    priority: string;
    rationale: string;
    actions: string[];
  }[];

  // What's premature
  prematureActions: {
    action: string;
    whyPremature: string;
    whenAppropriate: GradeLevel;
  }[];

  // Appropriate activities
  appropriateActivities: {
    activity: string;
    description: string;
    benefit: string;
  }[];

  // Development milestones
  milestones: {
    milestone: string;
    targetDate: string;
    importance: 'critical' | 'important' | 'helpful';
  }[];
}

/**
 * Grade-specific essay expectations
 */
export const GRADE_ESSAY_EXPECTATIONS: Record<GradeLevel, {
  personalStatementStatus: string;
  supplementalStatus: string;
  focus: string;
  doNot: string;
}> = {
  '9th': {
    personalStatementStatus: 'Not applicable - focus on experiences that will become essay topics',
    supplementalStatus: 'Not applicable',
    focus: 'Live interesting experiences. Notice moments that matter. Keep a journal.',
    doNot: 'Start writing college essays or worrying about prompts.',
  },
  '10th': {
    personalStatementStatus: 'Not applicable - continue building experiences',
    supplementalStatus: 'Not applicable',
    focus: 'Reflect on experiences. Practice analytical writing in English class.',
    doNot: 'Draft college essays yet. Focus on living, not documenting.',
  },
  '11th': {
    personalStatementStatus: 'Brainstorming in spring, first draft in summer',
    supplementalStatus: 'Research school-specific prompts late junior year',
    focus: 'Identify potential topics. Practice personal writing. Start summer before senior year.',
    doNot: 'Wait until fall senior year. Rush the brainstorming process.',
  },
  '12th': {
    personalStatementStatus: 'Complete first draft by end of summer. Polish September-October.',
    supplementalStatus: 'Draft along with applications. Earlier schools first.',
    focus: 'Quality over quantity. Deep revision, not just editing. Get feedback.',
    doNot: 'Write night before deadline. Submit without multiple revisions.',
  },
  'gap_year': {
    personalStatementStatus: 'Strengthen with gap year experiences and reflection',
    supplementalStatus: 'Update with gap year context',
    focus: 'Integrate gap year meaningfully. Show growth and intentionality.',
    doNot: 'Submit same essays as last year without updates.',
  },
  'transfer': {
    personalStatementStatus: 'New essay with college perspective',
    supplementalStatus: 'Transfer-specific essays required',
    focus: 'Why transfer, why now, why this school. Show college-level growth.',
    doNot: 'Rehash high school essays. Badmouth current school.',
  },
};

// ============================================================================
// ESSAY TOPIC SELECTION
// ============================================================================

/**
 * Topic evaluation for personal statement
 */
export interface TopicEvaluation {
  topicDescription: string;
  category: PersonalStatementTopicCategory;

  // Evaluation criteria
  evaluation: {
    uniqueness: {
      score: HarvardScoreDecimal;
      assessment: string;
      percentWhoWriteAboutThis: number;
    };
    depthPotential: {
      score: HarvardScoreDecimal;
      assessment: string;
      insightsAvailable: string[];
    };
    personalSignificance: {
      score: HarvardScoreDecimal;
      assessment: string;
    };
    revealsPotential: {
      score: HarvardScoreDecimal;
      whatItReveals: string[];
      whatItMisses: string[];
    };
    writability: {
      score: HarvardScoreDecimal;
      structureOptions: string[];
      challenges: string[];
    };
  };

  // Overall assessment
  overallScore: HarvardScoreDecimal;
  recommendation: 'pursue' | 'consider' | 'caution' | 'avoid';
  reasoning: string;

  // If pursuing, suggestions
  approachSuggestions?: {
    angleToTake: string;
    openingIdea: string;
    structureSuggestion: string;
    pitfallsToAvoid: string[];
  };

  // Alternative topics to consider
  alternativeTopics?: {
    topic: string;
    whyBetter: string;
  }[];
}

/**
 * Topic brainstorming guidance
 */
export interface TopicBrainstormingGuide {
  // Questions to ask yourself
  reflectionQuestions: {
    category: string;
    questions: string[];
  }[];

  // Exercises to uncover topics
  exercises: {
    name: string;
    description: string;
    timeRequired: string;
    expectedOutput: string;
  }[];

  // Warning signs of bad topics
  topicRedFlags: {
    redFlag: string;
    whyProblematic: string;
    exception: string;
  }[];

  // What makes a great topic
  greatTopicCharacteristics: string[];
}

// ============================================================================
// ESSAY WRITING PROCESS GUIDANCE
// ============================================================================

/**
 * Essay writing stage guidance
 */
export interface WritingStageGuidance {
  stage: EssayStatus;

  // What this stage is for
  purpose: string;
  typicalDuration: string;

  // Goals for this stage
  goals: string[];

  // Activities
  activities: {
    activity: string;
    description: string;
    timeEstimate: string;
  }[];

  // Checkpoints before moving to next stage
  checkpoints: {
    checkpoint: string;
    mustPass: boolean;
  }[];

  // Common mistakes at this stage
  commonMistakes: {
    mistake: string;
    howToAvoid: string;
  }[];

  // When to move to next stage
  readyForNextStage: string[];
}

/**
 * Complete essay writing process
 */
export const ESSAY_WRITING_STAGES: Record<EssayStatus, WritingStageGuidance> = {
  not_started: {
    stage: 'not_started',
    purpose: 'Preparation phase - gathering materials and mental preparation',
    typicalDuration: 'Varies',
    goals: ['Understand the prompt', 'Gather materials', 'Set timeline'],
    activities: [
      { activity: 'Read prompt carefully', description: 'Understand what\'s really being asked', timeEstimate: '15 min' },
      { activity: 'Review application holistically', description: 'Know what story you\'re already telling', timeEstimate: '30 min' },
      { activity: 'Set deadline and milestone dates', description: 'Work backwards from submission', timeEstimate: '15 min' },
    ],
    checkpoints: [
      { checkpoint: 'Understand prompt requirements', mustPass: true },
      { checkpoint: 'Know word limit', mustPass: true },
      { checkpoint: 'Have timeline set', mustPass: true },
    ],
    commonMistakes: [
      { mistake: 'Skipping to drafting', howToAvoid: 'Brainstorming saves time in the long run' },
      { mistake: 'Misunderstanding prompt', howToAvoid: 'Read prompt multiple times, paraphrase it' },
    ],
    readyForNextStage: ['Prompt understood', 'Timeline set', 'Ready to brainstorm'],
  },
  brainstorming: {
    stage: 'brainstorming',
    purpose: 'Generate many ideas without judgment',
    typicalDuration: '2-5 days',
    goals: ['Generate 10+ potential topics', 'Explore unexpected angles', 'Don\'t censor yourself'],
    activities: [
      { activity: 'Free writing', description: 'Write continuously for 15 minutes about any topic', timeEstimate: '15 min x 5' },
      { activity: 'Memory mining', description: 'List specific moments that shaped you', timeEstimate: '1 hour' },
      { activity: 'Values inventory', description: 'What do you care about most deeply?', timeEstimate: '30 min' },
      { activity: 'Talk it out', description: 'Discuss ideas with someone who knows you', timeEstimate: '1 hour' },
    ],
    checkpoints: [
      { checkpoint: 'Have 10+ potential topics', mustPass: true },
      { checkpoint: 'At least 3 feel personal and specific', mustPass: true },
      { checkpoint: 'Haven\'t rejected ideas too quickly', mustPass: false },
    ],
    commonMistakes: [
      { mistake: 'Stopping at first good idea', howToAvoid: 'Keep brainstorming even after finding something' },
      { mistake: 'Only considering "impressive" topics', howToAvoid: 'Small moments can be powerful' },
      { mistake: 'Asking "what do they want"', howToAvoid: 'Focus on what\'s true for you' },
    ],
    readyForNextStage: ['Multiple viable topics identified', 'Can articulate why each matters', 'Ready to choose and outline'],
  },
  outlining: {
    stage: 'outlining',
    purpose: 'Structure the essay before writing full prose',
    typicalDuration: '1-2 days',
    goals: ['Choose topic', 'Determine structure', 'Identify key moments'],
    activities: [
      { activity: 'Topic selection', description: 'Evaluate topics and choose one', timeEstimate: '1 hour' },
      { activity: 'Story arc mapping', description: 'Beginning, middle, end with key beats', timeEstimate: '45 min' },
      { activity: 'Detail listing', description: 'Specific moments, images, dialogue to include', timeEstimate: '30 min' },
      { activity: 'Opening brainstorm', description: 'Generate 5+ possible opening lines/scenes', timeEstimate: '30 min' },
    ],
    checkpoints: [
      { checkpoint: 'Topic chosen with confidence', mustPass: true },
      { checkpoint: 'Know opening, key moments, and ending', mustPass: true },
      { checkpoint: 'Have specific details ready', mustPass: true },
    ],
    commonMistakes: [
      { mistake: 'Over-outlining', howToAvoid: 'Leave room for discovery in drafting' },
      { mistake: 'Outline too abstract', howToAvoid: 'Include specific scenes and details' },
      { mistake: 'Trying to include everything', howToAvoid: 'Focus on one main thread' },
    ],
    readyForNextStage: ['Clear structure in mind', 'Key moments identified', 'Opening concept ready'],
  },
  first_draft: {
    stage: 'first_draft',
    purpose: 'Get ideas on paper without perfectionism',
    typicalDuration: '2-4 days',
    goals: ['Complete full draft', 'Don\'t edit while writing', 'Follow the outline loosely'],
    activities: [
      { activity: 'Drafting session 1', description: 'Write opening and first third', timeEstimate: '1-2 hours' },
      { activity: 'Drafting session 2', description: 'Write middle section', timeEstimate: '1-2 hours' },
      { activity: 'Drafting session 3', description: 'Write ending and conclusion', timeEstimate: '1-2 hours' },
      { activity: 'Read through', description: 'Read full draft aloud', timeEstimate: '30 min' },
    ],
    checkpoints: [
      { checkpoint: 'Complete draft exists', mustPass: true },
      { checkpoint: 'Near word count target', mustPass: false },
      { checkpoint: 'Main story is told', mustPass: true },
    ],
    commonMistakes: [
      { mistake: 'Editing while drafting', howToAvoid: 'Keep writing, fix later' },
      { mistake: 'Perfectionism paralysis', howToAvoid: 'First draft is supposed to be rough' },
      { mistake: 'Going way over word count', howToAvoid: 'Aim for 80-90% of limit in first draft' },
    ],
    readyForNextStage: ['Complete draft exists', 'Have let it sit for 24+ hours', 'Ready for critical review'],
  },
  revising: {
    stage: 'revising',
    purpose: 'Major structural and content improvements',
    typicalDuration: '1-2 weeks',
    goals: ['Strengthen structure', 'Deepen insights', 'Cut what doesn\'t work'],
    activities: [
      { activity: 'Structural analysis', description: 'Does the arc work? Restructure if needed', timeEstimate: '2 hours' },
      { activity: 'Specificity pass', description: 'Replace vague with specific', timeEstimate: '1 hour' },
      { activity: 'Insight deepening', description: 'Push reflection further', timeEstimate: '1 hour' },
      { activity: 'Feedback round', description: 'Get feedback, sit with it, decide what to use', timeEstimate: '2-3 days' },
      { activity: 'Major revision', description: 'Implement significant changes', timeEstimate: '2-3 hours' },
    ],
    checkpoints: [
      { checkpoint: 'Structure is strong', mustPass: true },
      { checkpoint: 'Specific details throughout', mustPass: true },
      { checkpoint: 'Insights are genuine', mustPass: true },
      { checkpoint: 'Gotten external feedback', mustPass: true },
    ],
    commonMistakes: [
      { mistake: 'Keeping weak sections out of attachment', howToAvoid: 'Be willing to cut' },
      { mistake: 'Taking all feedback', howToAvoid: 'You know your story best' },
      { mistake: 'Surface editing instead of revising', howToAvoid: 'Focus on content, not commas' },
    ],
    readyForNextStage: ['Content is strong', 'Structure works', 'Ready for polish'],
  },
  polishing: {
    stage: 'polishing',
    purpose: 'Sentence-level refinement and final touches',
    typicalDuration: '3-5 days',
    goals: ['Perfect prose', 'Eliminate errors', 'Strengthen opening/closing'],
    activities: [
      { activity: 'Opening refinement', description: 'Make first lines perfect', timeEstimate: '1 hour' },
      { activity: 'Closing refinement', description: 'Make last lines resonate', timeEstimate: '1 hour' },
      { activity: 'Sentence-level editing', description: 'Vary length, eliminate redundancy', timeEstimate: '2 hours' },
      { activity: 'Read aloud', description: 'Catch awkward phrasing', timeEstimate: '30 min' },
      { activity: 'Proofread', description: 'Grammar, spelling, punctuation', timeEstimate: '30 min' },
      { activity: 'Final feedback', description: 'Fresh eyes on polished draft', timeEstimate: '1 day' },
    ],
    checkpoints: [
      { checkpoint: 'Opening hooks immediately', mustPass: true },
      { checkpoint: 'Closing resonates', mustPass: true },
      { checkpoint: 'No grammatical errors', mustPass: true },
      { checkpoint: 'Within word count', mustPass: true },
    ],
    commonMistakes: [
      { mistake: 'Over-editing voice out', howToAvoid: 'Keep your natural voice' },
      { mistake: 'Not reading aloud', howToAvoid: 'This catches so much' },
      { mistake: 'Last-minute major changes', howToAvoid: 'Polish, don\'t rewrite' },
    ],
    readyForNextStage: ['Proud of the essay', 'Error-free', 'Ready to submit'],
  },
  final: {
    stage: 'final',
    purpose: 'Essay is complete and ready for submission',
    typicalDuration: 'N/A',
    goals: ['Submit confidently', 'Move on to next essay'],
    activities: [
      { activity: 'Final read', description: 'One last read before submission', timeEstimate: '15 min' },
      { activity: 'Copy to application', description: 'Transfer to application carefully', timeEstimate: '10 min' },
      { activity: 'Preview submission', description: 'Check formatting in preview', timeEstimate: '5 min' },
    ],
    checkpoints: [
      { checkpoint: 'Essay is error-free', mustPass: true },
      { checkpoint: 'Copied correctly to application', mustPass: true },
      { checkpoint: 'Formatting is correct', mustPass: true },
    ],
    commonMistakes: [
      { mistake: 'Copy-paste errors', howToAvoid: 'Check every character' },
      { mistake: 'Wrong essay in wrong place', howToAvoid: 'Triple-check school names' },
      { mistake: 'Continuing to edit after final', howToAvoid: 'Trust your process' },
    ],
    readyForNextStage: ['Submitted', 'Moving on'],
  },
};

// ============================================================================
// ESSAY CONSTANTS
// ============================================================================

/**
 * Default dimension weights for essay scoring
 */
export const DEFAULT_ESSAY_DIMENSION_WEIGHTS: Record<EssayQualityDimension, number> = {
  authenticity: 0.15,
  specificity: 0.12,
  insight: 0.12,
  structure: 0.08,
  uniqueness: 0.10,
  stakes: 0.08,
  intellectual_engagement: 0.08,
  memorability: 0.10,
  voice: 0.08,
  maturity: 0.03,
  self_awareness: 0.03,
  growth_shown: 0.03,
  prompt_response: 0.00, // Only for supplementals
  writing_quality: 0.00, // Baseline expectation
};

/**
 * Supplemental essay dimension weights
 */
export const SUPPLEMENTAL_DIMENSION_WEIGHTS: Record<EssayQualityDimension, number> = {
  authenticity: 0.12,
  specificity: 0.15,
  insight: 0.10,
  structure: 0.05,
  uniqueness: 0.08,
  stakes: 0.05,
  intellectual_engagement: 0.08,
  memorability: 0.08,
  voice: 0.05,
  maturity: 0.02,
  self_awareness: 0.02,
  growth_shown: 0.02,
  prompt_response: 0.15, // Much more important for supplementals
  writing_quality: 0.03,
};

/**
 * Word count guidelines by essay type
 */
export const ESSAY_WORD_COUNT_GUIDELINES: Record<EssayType, {
  typical: { min: number; max: number };
  sweet_spot: number;
  notes: string;
}> = {
  personal_statement: {
    typical: { min: 500, max: 650 },
    sweet_spot: 620,
    notes: 'Use the full space. Under 500 looks like you have nothing to say.',
  },
  additional_information: {
    typical: { min: 0, max: 650 },
    sweet_spot: 250,
    notes: 'Only use if needed. Explain circumstances, not make excuses.',
  },
  why_school: {
    typical: { min: 200, max: 500 },
    sweet_spot: 400,
    notes: 'Be specific enough to show research. Don\'t pad.',
  },
  why_major: {
    typical: { min: 150, max: 400 },
    sweet_spot: 300,
    notes: 'Focus on genuine passion evidence.',
  },
  community: {
    typical: { min: 200, max: 350 },
    sweet_spot: 300,
    notes: 'Define community clearly and show your role.',
  },
  extracurricular: {
    typical: { min: 150, max: 350 },
    sweet_spot: 250,
    notes: 'Add dimension not visible in activities list.',
  },
  intellectual_curiosity: {
    typical: { min: 200, max: 400 },
    sweet_spot: 350,
    notes: 'Show genuine engagement with ideas.',
  },
  challenge_setback: {
    typical: { min: 200, max: 400 },
    sweet_spot: 350,
    notes: 'Focus on growth and learning, not suffering.',
  },
  diversity: {
    typical: { min: 200, max: 350 },
    sweet_spot: 300,
    notes: 'What unique perspective do you bring?',
  },
  creative: {
    typical: { min: 100, max: 500 },
    sweet_spot: 350,
    notes: 'Take a risk but stay appropriate.',
  },
  ethical_dilemma: {
    typical: { min: 200, max: 400 },
    sweet_spot: 350,
    notes: 'Show nuanced thinking, not certainty.',
  },
  future_goals: {
    typical: { min: 150, max: 350 },
    sweet_spot: 300,
    notes: 'Be specific and realistic.',
  },
  leadership: {
    typical: { min: 200, max: 350 },
    sweet_spot: 300,
    notes: 'Show impact, not just position.',
  },
  collaboration: {
    typical: { min: 150, max: 300 },
    sweet_spot: 250,
    notes: 'Demonstrate ability to work with others.',
  },
  failure_learning: {
    typical: { min: 200, max: 350 },
    sweet_spot: 300,
    notes: 'Own the failure, focus on learning.',
  },
  identity: {
    typical: { min: 200, max: 400 },
    sweet_spot: 350,
    notes: 'Be genuine, avoid stereotypes.',
  },
  short_answer: {
    typical: { min: 50, max: 150 },
    sweet_spot: 100,
    notes: 'Be concise and specific.',
  },
  list_based: {
    typical: { min: 50, max: 250 },
    sweet_spot: 150,
    notes: 'Show personality through choices.',
  },
  roommate_letter: {
    typical: { min: 200, max: 350 },
    sweet_spot: 300,
    notes: 'Be personable and genuine.',
  },
  other_supplemental: {
    typical: { min: 150, max: 400 },
    sweet_spot: 300,
    notes: 'Follow the specific prompt closely.',
  },
};
