/**
 * Activity Workshop Types
 *
 * Comprehensive type definitions for the activity analysis workshop system.
 *
 * ARCHITECTURE: Separated Stages
 * ==============================
 * Stage 1: ANALYSIS - Deep, comprehensive understanding
 *   - Individual activity classification and assessment
 *   - Portfolio-level pattern detection (spike, coherence)
 *   - Gap identification and strength mapping
 *   - All raw data and scoring
 *
 * Stage 2: TEACHING - Guidance powered by analysis
 *   - Consumes full analysis output
 *   - Provides cited explanations
 *   - Generates upgrade pathways
 *   - Optimizes descriptions
 *   - Creates strategic recommendations
 *
 * Each stage has its own depth and purpose - they should NOT be combined.
 */

import {
  ActivityTier,
  ActivityCategory,
  LeadershipType,
  RecognitionLevel,
  ImpactType,
  SpikeStrength,
} from '../../types';

import { MajorCategory, SpikeType, ImpactTier } from '../../knowledge';

// Import scoring types
import type { PortfolioScoreRubric, ActivityScoreRubric } from './scoring/types';

// ============================================================================
// CITATION TYPES
// ============================================================================

/**
 * Citation source types
 */
export type CitationSourceType =
  | 'database' // From our knowledge databases
  | 'research' // From admissions research
  | 'expert' // From expert counselors (Sara Harberson, etc.)
  | 'statistics' // From competition/program statistics
  | 'school_specific'; // From school-specific preferences

/**
 * Citation for activity feedback
 */
export interface ActivityCitation {
  id: string;
  type: 'tier_justification' | 'red_flag' | 'green_flag' | 'upgrade_path' | 'impact_benchmark' | 'spike_evidence' | 'coherence_factor';
  source: {
    name: string;
    type: CitationSourceType;
    database?: string;
    specificity: string;
  };
  evidence: {
    quote?: string;
    statistic?: string;
    benchmark?: string;
    comparison?: string;
  };
  relevance: string;
}

/**
 * Cited text with inline citations
 */
export interface CitedText {
  text: string;
  citations: ActivityCitation[];
}

// ============================================================================
// ACTIVITY INPUT (Frontend Data)
// ============================================================================

/**
 * Raw activity data from frontend form
 */
export interface ActivityWorkshopInput {
  id: string;
  title: string;
  organization?: string;
  role?: string;
  description: string;
  category: 'work' | 'volunteer' | 'school_activity' | 'project';
  hoursPerWeek: number;
  weeksPerYear: number;
  yearsInvolved?: number;
  gradeLevels?: number[];
  isPaid?: boolean;
  isContinuing?: boolean;
  constraintsContext?: string;
  tags?: string[];
  achievements?: {
    title: string;
    level?: string;
    date?: string;
  }[];
}

/**
 * Complete workshop input
 */
export interface ActivityWorkshopSessionInput {
  activities: ActivityWorkshopInput[];
  studentContext?: {
    intendedMajor?: string;
    targetSchools?: string[];
    gradeLevel?: number;
    firstGen?: boolean;
    lowIncome?: boolean;
    rural?: boolean;
    internationalStudent?: boolean;
  };
}

// ============================================================================
// STAGE 1: ANALYSIS OUTPUT TYPES
// ============================================================================

/**
 * Individual activity analysis - comprehensive assessment
 */
export interface ActivityAnalysis {
  activityId: string;

  // === CLASSIFICATION ===
  classification: {
    tier: ActivityTier;
    tierConfidence: 'high' | 'medium' | 'low';
    tierReasoning: string;
    detectedCategory: ActivityCategory;
    categoryConfidence: number;
  };

  // === RECOGNITION ANALYSIS ===
  recognition: {
    level: RecognitionLevel;
    evidence: string[];
    authenticityScore: number; // 0-100
    authenticityFactors: string[];
  };

  // === LEADERSHIP ANALYSIS ===
  leadership: {
    type: LeadershipType;
    evidence: string[];
    impactScope: 'individual' | 'team' | 'organization' | 'community' | 'regional' | 'national';
    leadershipQuality: 'exceptional' | 'strong' | 'solid' | 'developing' | 'none';
  };

  // === IMPACT ANALYSIS ===
  impact: {
    type: ImpactType;
    evidence: string[];
    quantifiableMetrics: {
      metric: string;
      value: number | string;
      tier: ImpactTier;
      verified: boolean;
    }[];
    impactScore: number; // 0-100
    impactNarrative: string;
  };

  // === TIME INVESTMENT ANALYSIS ===
  timeInvestment: {
    totalHours: number;
    hoursPerWeek: number;
    weeksPerYear: number;
    yearsInvolved: number;
    commitmentLevel: 'exceptional' | 'significant' | 'moderate' | 'minimal';
    progressionEvidence: string[];
  };

  // === RED FLAGS ===
  redFlags: {
    flag: string;
    severity: 'critical' | 'moderate' | 'minor';
    evidence: string;
    implication: string;
  }[];

  // === GREEN FLAGS ===
  greenFlags: {
    flag: string;
    strength: 'exceptional' | 'strong' | 'notable';
    evidence: string;
    admissionsValue: string;
  }[];

  // === DESCRIPTION QUALITY ===
  descriptionQuality: {
    specificity: number;
    impactClarity: number;
    uniqueness: number;
    actionVerbs: number;
    quantification: number;
    overallScore: number;
    issues: string[];
    strengths: string[];
  };

  // === DATABASE MATCHES ===
  databaseMatches: {
    database: string;
    matchedEntry: string;
    tier: number;
    relevance: number;
    insight: string;
  }[];

  // === NARRATIVE POTENTIAL ===
  narrativePotential: {
    storytellingValue: 'high' | 'medium' | 'low';
    uniqueAngles: string[];
    emotionalResonance: string;
    growthArc: string;
    essayWorthiness: 'excellent' | 'good' | 'possible' | 'unlikely';
  };

  // === SCHOOL FIT ===
  schoolFit: {
    bestFitSchoolTypes: string[];
    alignedValues: string[];
    potentialConcerns: string[];
  };
}

/**
 * Portfolio-level analysis - comprehensive assessment
 */
export interface PortfolioAnalysis {
  // === INDIVIDUAL ACTIVITY ANALYSES ===
  activities: Record<string, ActivityAnalysis>;

  // === TIER DISTRIBUTION ===
  tierDistribution: {
    tier1: number;
    tier2: number;
    tier3: number;
    tier4: number;
    portfolioTier: ActivityTier;
    tierRationale: string;
  };

  // === SPIKE ANALYSIS ===
  spikeAnalysis: {
    hasSpike: boolean;
    spikeType?: SpikeType;
    spikeStrength: SpikeStrength;
    spikeActivities: string[];
    spikeEvidence: string[];
    spikeAuthenticity: number; // 0-100
    spikeNarrative: string;
    spikeDevelopmentStage: 'mature' | 'developing' | 'emerging' | 'absent';
  };

  // === COHERENCE ANALYSIS ===
  coherenceAnalysis: {
    score: number; // 0-100
    assessment: 'exceptional' | 'strong' | 'moderate' | 'weak' | 'scattered';
    primaryTheme: string;
    secondaryThemes: string[];
    thematicConnections: {
      activity1: string;
      activity2: string;
      connection: string;
      strength: 'strong' | 'moderate' | 'weak';
    }[];
    disconnectedActivities: {
      activityId: string;
      reason: string;
    }[];
    narrativeThread: string;
  };

  // === MAJOR ALIGNMENT ===
  majorAlignment?: {
    intendedMajor: MajorCategory;
    alignmentScore: number;
    stronglyAligned: string[];
    moderatelyAligned: string[];
    misaligned: string[];
    gaps: string[];
    competitiveBenchmark: string;
  };

  // === DEPTH VS BREADTH ===
  depthBreadthProfile: {
    profile: 'deep_spike' | 'focused' | 'balanced' | 'broad' | 'scattered';
    depthScore: number;
    breadthScore: number;
    optimalBalance: string;
  };

  // === HIDDEN GEMS ===
  hiddenGems: {
    undersoldActivities: {
      activityId: string;
      currentPresentation: string;
      trueValue: string;
      whyUndersold: string;
    }[];
    workFamilyContributions: {
      present: boolean;
      activities: string[];
      value: string;
    };
    constrainedExcellence: {
      present: boolean;
      context: string;
      activities: string[];
    };
  };

  // === COMPETITIVE ASSESSMENT ===
  competitiveAssessment: {
    overallStrength: 'exceptional' | 'strong' | 'competitive' | 'developing' | 'needs_work';
    strengthAreas: string[];
    weaknessAreas: string[];
    differentiators: string[];
    commonalities: string[];
    competitiveEdge: string;
  };

  // === GAPS IDENTIFIED ===
  gapsIdentified: {
    gap: string;
    severity: 'critical' | 'significant' | 'minor';
    impactOnApplication: string;
    affectedSchools: string[];
  }[];

  // === COMMON APP READINESS ===
  commonAppReadiness: {
    readyForSubmission: boolean;
    activitiesCount: number;
    topActivitiesIdentified: string[];
    orderingRecommendation: string[];
    descriptionReadiness: {
      activityId: string;
      ready: boolean;
      issues: string[];
    }[];
  };

  // === CONFIDENCE METRICS ===
  analysisConfidence: {
    overallConfidence: number;
    dataQuality: number;
    classificationConfidence: number;
    spikeConfidence: number;
    factors: {
      factor: string;
      impact: 'positive' | 'negative';
      score: number;
    }[];
  };
}

// ============================================================================
// STAGE 2: TEACHING OUTPUT TYPES
// ============================================================================

/**
 * Teaching for a single activity - powered by analysis
 */
export interface ActivityTeaching {
  activityId: string;

  // === TIER EXPLANATION ===
  tierExplanation: {
    assignedTier: ActivityTier;
    explanation: CitedText;
    benchmarksUsed: {
      tier: ActivityTier;
      benchmark: string;
      source: string;
      studentMeets: boolean;
      gap?: string;
    }[];
    whatMakesThisTier: CitedText;
    whatWouldChangeIt: CitedText;
  };

  // === STRENGTH TEACHING ===
  strengthTeaching: {
    strength: string;
    whyItMatters: CitedText;
    howToLeverage: string;
    inApplications: string;
  }[];

  // === IMPROVEMENT TEACHING ===
  improvementTeaching: {
    issue: string;
    whyItMatters: CitedText;
    howToFix: string;
    exampleBefore: string;
    exampleAfter: string;
    priority: 'high' | 'medium' | 'low';
  }[];

  // === UPGRADE PATHWAY ===
  upgradePathway?: {
    currentTier: ActivityTier;
    targetTier: ActivityTier;
    feasibility: 'high' | 'medium' | 'low';
    timeRequired: string;
    steps: {
      step: number;
      action: string;
      rationale: CitedText;
      milestone: string;
      timeframe: string;
      resources?: string[];
    }[];
    successIndicators: string[];
    risks: string[];
  };

  // === DESCRIPTION OPTIMIZATION ===
  descriptionOptimization: {
    originalDescription: string;
    optimizedDescription: string;
    characterCount: number;
    changesExplained: {
      change: string;
      reason: string;
    }[];
    alternativeVersions?: string[];
  };

  // === NARRATIVE GUIDANCE ===
  narrativeGuidance: {
    howToTalkAboutThis: CitedText;
    uniqueAngle: string;
    connectionToStory: string;
    interviewTips: string[];
    essayPotential?: {
      viable: boolean;
      angle: string;
      cautionAreas: string[];
    };
  };
}

/**
 * Portfolio-level teaching - powered by full analysis
 */
export interface PortfolioTeaching {
  // === INDIVIDUAL ACTIVITY TEACHING ===
  activities: Record<string, ActivityTeaching>;

  // === PORTFOLIO NARRATIVE TEACHING ===
  narrativeTeaching: {
    twoSentencePitch: string;
    extendedPitch: string;
    archetype: SpikeType | 'well_rounded' | 'emerging';
    archetypeExplanation: CitedText;
    howToPresent: CitedText;
    narrativeStrengths: string[];
    narrativeWeaknesses: string[];
  };

  // === SPIKE TEACHING ===
  spikeTeaching: {
    currentState: CitedText;
    whatMakesASpike: CitedText;
    studentSpikeAssessment: CitedText;
    developmentStrategy?: {
      strategy: string;
      focusActivities: string[];
      deprioritizeActivities: string[];
      newOpportunities: string[];
      timeline: string;
      rationale: CitedText;
    };
  };

  // === COHERENCE TEACHING ===
  coherenceTeaching: {
    currentCoherence: CitedText;
    whatMakesCoherence: CitedText;
    connectingActivities: {
      activity1: string;
      activity2: string;
      howToConnect: string;
    }[];
    addressingDisconnects: {
      activityId: string;
      issue: string;
      solutions: string[];
      recommendation: string;
    }[];
    strengtheningStrategies: CitedText[];
  };

  // === COMMON APP STRATEGY ===
  commonAppStrategy: {
    recommendedOrder: string[];
    orderRationale: CitedText;
    whatToHighlight: {
      activityId: string;
      why: string;
      how: string;
    }[];
    whatToMinimize: {
      activityId: string;
      why: string;
      alternativeApproach: string;
    }[];
    overallPositioning: CitedText;
    characterCountStrategy: string;
  };

  // === GAP FILLING GUIDANCE ===
  gapFillingGuidance: {
    gap: string;
    severity: 'critical' | 'significant' | 'minor';
    solutions: {
      solution: string;
      feasibility: 'high' | 'medium' | 'low';
      timeRequired: string;
      impact: string;
    }[];
    recommendedApproach: CitedText;
  }[];

  // === STRATEGIC RECOMMENDATIONS ===
  strategicRecommendations: {
    immediate: CitedText[]; // Do now
    shortTerm: CitedText[]; // Next 3-6 months
    longTerm: CitedText[]; // Next 1-2 years
    activitiesToStop: {
      activityId: string;
      reason: string;
      alternative?: string;
    }[];
    activitiesToDeepen: {
      activityId: string;
      howToDeepen: string;
      expectedOutcome: string;
    }[];
    newActivitiesToConsider: {
      suggestion: string;
      rationale: CitedText;
      fitWithProfile: string;
      feasibility: 'high' | 'medium' | 'low';
    }[];
  };

  // === SCHOOL-SPECIFIC GUIDANCE ===
  schoolSpecificGuidance?: {
    school: string;
    fitScore: number;
    strengths: string[];
    concerns: string[];
    positioningTips: string[];
  }[];
}

// ============================================================================
// COMPLETE WORKSHOP OUTPUT
// ============================================================================

/**
 * Complete activity workshop result - both stages
 */
export interface ActivityWorkshopResult {
  sessionId: string;
  analyzedAt: string;
  version: string;

  // Stage 1 Output
  analysis: PortfolioAnalysis;

  // Stage 2 Output
  teaching: PortfolioTeaching;

  // Cost tracking
  costTracking: {
    analysisCost: number;
    teachingCost: number;
    totalCost: number;
    tokensUsed: {
      analysis: { input: number; output: number };
      teaching: { input: number; output: number };
    };
  };
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export interface ActivityWorkshopSession {
  sessionId: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  input: ActivityWorkshopSessionInput;
  analysis?: PortfolioAnalysis;
  teaching?: PortfolioTeaching;
  context: {
    analysisComplete: boolean;
    teachingComplete: boolean;
    lastError?: string;
  };
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/**
 * Activity Analysis Service - Stage 1
 */
export interface IActivityAnalysisService {
  analyzeActivity(activity: ActivityWorkshopInput, portfolioContext?: Partial<PortfolioAnalysis>): Promise<ActivityAnalysis>;
  analyzePortfolio(input: ActivityWorkshopSessionInput): Promise<PortfolioAnalysis>;
}

/**
 * Activity Teaching Service - Stage 2
 */
export interface IActivityTeachingService {
  teachActivity(activity: ActivityWorkshopInput, analysis: ActivityAnalysis, portfolioAnalysis: PortfolioAnalysis): Promise<ActivityTeaching>;
  teachPortfolio(input: ActivityWorkshopSessionInput, analysis: PortfolioAnalysis): Promise<PortfolioTeaching>;
}

/**
 * Activity Citation Service
 */
export interface IActivityCitationService {
  getCitationsForTier(activity: ActivityWorkshopInput, tier: ActivityTier): ActivityCitation[];
  getCitationsForRedFlag(flag: string, activity: ActivityWorkshopInput): ActivityCitation[];
  getCitationsForGreenFlag(flag: string, activity: ActivityWorkshopInput): ActivityCitation[];
  getCitationsForUpgrade(activity: ActivityWorkshopInput, currentTier: ActivityTier, targetTier: ActivityTier): ActivityCitation[];
  getCitationsForSpike(spikeType: SpikeType, strength: SpikeStrength): ActivityCitation[];
  getCitationsForCoherence(score: number, assessment: string): ActivityCitation[];
  attachCitations(text: string, citations: ActivityCitation[]): CitedText;
}

/**
 * Complete Activity Workshop Service
 */
export interface IActivityWorkshopService {
  // Full pipeline
  analyzePortfolio(input: ActivityWorkshopSessionInput): Promise<ActivityWorkshopResult>;

  // Stage 1 only
  runAnalysis(input: ActivityWorkshopSessionInput): Promise<PortfolioAnalysis>;

  // Stage 2 only (requires analysis)
  runTeaching(input: ActivityWorkshopSessionInput, analysis: PortfolioAnalysis): Promise<PortfolioTeaching>;

  // Session management
  getSession(sessionId: string): Promise<ActivityWorkshopSession | null>;
  updateSession(sessionId: string, updates: Partial<ActivityWorkshopSession>): Promise<void>;
}

// ============================================================================
// 4-STAGE PIPELINE HANDOFF TYPES (v4.0)
// ============================================================================
// Each stage passes rich context to the next for deeper comprehension

/**
 * Stage 0 Output: Story Detection
 * Identifies WHO the student is before analyzing WHAT they do
 */
export interface StoryContext {
  // === STUDENT NARRATIVE IDENTITY ===
  narrativeIdentity: {
    /** Core theme that unifies this student's activities */
    primaryTheme: string;
    /** Secondary interests/passions */
    secondaryThemes: string[];
    /** One-sentence story of who this student is */
    storyEssence: string;
    /** Student archetype classification */
    archetype: 'innovator' | 'leader' | 'scholar' | 'creative' | 'advocate' | 'builder' | 'competitor' | 'explorer' | 'caretaker' | 'polymath';
    /** Confidence in archetype detection */
    archetypeConfidence: number;
  };

  // === DETECTED NARRATIVE THREADS ===
  narrativeThreads: {
    /** Thread name/description */
    thread: string;
    /** Activities that contribute to this thread */
    activityIds: string[];
    /** Strength of this thread */
    strength: 'strong' | 'emerging' | 'weak';
    /** Evidence for this thread */
    evidence: string;
  }[];

  // === CONTEXTUAL FACTORS ===
  contextualFactors: {
    /** Family/work obligations detected */
    hasWorkFamilyObligations: boolean;
    workFamilyContext?: string;
    /** Resource constraints detected */
    hasResourceConstraints: boolean;
    constraintsContext?: string;
    /** Geographic limitations detected */
    hasGeographicLimitations: boolean;
    geographicContext?: string;
    /** First-gen indicators */
    firstGenIndicators: boolean;
    /** International student indicators */
    internationalIndicators: boolean;
  };

  // === ACTIVITY STORY ROLES ===
  activityStoryRoles: {
    /** Activity ID */
    activityId: string;
    /** Role in the student's story */
    storyRole: 'core_identity' | 'skill_building' | 'impact_vehicle' | 'passion_pursuit' | 'obligation' | 'exploration' | 'filler';
    /** How central this is to who they are */
    centralityScore: number; // 0-100
    /** Brief explanation */
    roleExplanation: string;
  }[];

  // === SPIKE HYPOTHESIS ===
  spikeHypothesis: {
    /** Do we see a potential spike? */
    likelySpike: boolean;
    /** What area is the spike in? */
    spikeArea?: string;
    /** Which activities form the spike? */
    spikeActivityIds: string[];
    /** How developed is this spike? */
    maturity: 'mature' | 'developing' | 'emerging' | 'absent';
    /** Evidence supporting spike hypothesis */
    evidence: string;
  };

  // === STAGE METADATA ===
  metadata: {
    generatedAt: string;
    modelUsed: string;
    tokensUsed: { input: number; output: number };
    cost: number;
  };
}

/**
 * Stage 1 Output: Context-Aware Analysis
 * Full analysis enriched with story understanding
 */
export interface AnalysisContext extends PortfolioAnalysis {
  // === STORY-ENRICHED ANALYSIS ===
  storyEnrichment: {
    /** Story context that informed this analysis */
    storyContextUsed: boolean;
    /** How story context changed the analysis */
    storyInfluencedScores: {
      activityId: string;
      originalTierEstimate: ActivityTier;
      adjustedTier: ActivityTier;
      adjustmentReason: string;
    }[];
  };

  // === TEACHING CANDIDATES ===
  teachingCandidates: {
    /** Activities that qualify for deep teaching */
    deepTeachingIds: string[];
    /** Activities that need medium teaching */
    mediumTeachingIds: string[];
    /** Activities that get quick encouragement only */
    quickEncouragementIds: string[];
    /** Activities too strong to need teaching */
    skipTeachingIds: string[];
    /** Selection criteria used */
    selectionCriteria: {
      deepThreshold: number;
      mediumThreshold: number;
      skipThreshold: number;
    };
  };

  // === TEACHING PRIORITIES ===
  teachingPriorities: {
    activityId: string;
    priority: 1 | 2 | 3 | 4 | 5;
    reason: string;
    expectedImpact: 'transformative' | 'significant' | 'moderate' | 'minimal';
    teachingFocus: string[];
  }[];

  // === PORTFOLIO-LEVEL TEACHING NEEDS ===
  portfolioTeachingNeeds: {
    /** Primary issue to address portfolio-wide */
    primaryIssue: string;
    primaryIssueSeverity: 'critical' | 'significant' | 'moderate' | 'minor';
    /** Secondary issues */
    secondaryIssues: string[];
    /** Key strengths to celebrate */
    strengthsToHighlight: string[];
    /** Strategic gaps to address */
    strategicGaps: string[];
  };

  // === SCORING RUBRIC (1-10 Scale) ===
  scoring?: {
    /** Full portfolio scoring rubric */
    portfolioRubric: PortfolioScoreRubric;
    /** Quick lookup by activity ID */
    activityScoresById: Record<string, ActivityScoreRubric>;
    /** Whether scoring was run */
    scoringComplete: boolean;
  };

  // === STAGE METADATA ===
  analysisMetadata: {
    generatedAt: string;
    modelUsed: string;
    tokensUsed: { input: number; output: number };
    cost: number;
    storyContextProvided: boolean;
  };
}

/**
 * Stage 2 Output: Conditional Teaching
 * Teaching delivered only to activities that need it
 */
export interface TeachingContext {
  // === TEACHING DELIVERED ===
  teachingDelivered: {
    activityId: string;
    teachingDepth: 'deep' | 'medium' | 'quick';
    teaching: ActivityTeaching;
  }[];

  // === QUICK ENCOURAGEMENTS ===
  quickEncouragements: {
    activityId: string;
    /** Warm, celebratory acknowledgment */
    celebration: string;
    /** Why this activity is already strong */
    strengthReason: string;
    /** Optional quick tip (not full teaching) */
    quickTip?: string;
  }[];

  // === SKIPPED ACTIVITIES ===
  skippedActivities: {
    activityId: string;
    reason: 'already_excellent' | 'no_improvement_path' | 'max_teaching_reached';
    status: string;
  }[];

  // === PORTFOLIO-LEVEL TEACHING ===
  portfolioTeaching: {
    /** Narrative synthesis teaching */
    narrativeTeaching: {
      currentState: string;
      recommendation: string;
      twoSentencePitch: string;
    };
    /** Coherence teaching */
    coherenceTeaching: {
      currentScore: number;
      improvements: string[];
    };
    /** Strategic direction */
    strategicDirection: string;
  };

  // === TEACHING QUALITY METRICS ===
  qualityMetrics: {
    /** Celebration-first adherence */
    celebrationFirst: boolean;
    /** Research citations included */
    citationsIncluded: number;
    /** Before/after examples included */
    examplesIncluded: number;
    /** Average teaching depth score */
    averageDepth: number;
  };

  // === STAGE METADATA ===
  teachingMetadata: {
    generatedAt: string;
    modelUsed: string;
    tokensUsed: { input: number; output: number };
    cost: number;
    activitiesTaught: number;
    activitiesSkipped: number;
  };
}

/**
 * Stage 3 Output: Portfolio Synthesis
 * Final actionable strategy
 */
export interface SynthesisContext {
  // === FINAL PORTFOLIO ASSESSMENT ===
  finalAssessment: {
    /** Harvard 1-6 scale equivalent */
    harvardScale: 1 | 2 | 3 | 4 | 5 | 6;
    harvardScaleRationale: string;
    /** Overall portfolio strength */
    overallStrength: 'exceptional' | 'strong' | 'competitive' | 'developing' | 'needs_work';
    /** Confidence in assessment */
    confidence: number;
  };

  // === ORDERED ACTIVITY LIST ===
  orderedActivities: {
    rank: number;
    activityId: string;
    reason: string;
    /** Optimized description for Common App */
    finalDescription: string;
    characterCount: number;
  }[];

  // === ACTION PLAN ===
  actionPlan: {
    /** Immediate actions (this week) */
    immediate: {
      action: string;
      activityId?: string;
      impact: string;
    }[];
    /** Short-term actions (1-3 months) */
    shortTerm: {
      action: string;
      activityId?: string;
      impact: string;
      deadline?: string;
    }[];
    /** Long-term strategy (3+ months) */
    longTerm: {
      action: string;
      activityId?: string;
      impact: string;
    }[];
  };

  // === SCHOOL FIT SUMMARY ===
  schoolFitSummary?: {
    school: string;
    fitLevel: 'excellent' | 'good' | 'moderate' | 'challenging';
    keyStrengths: string[];
    keyConcerns: string[];
  }[];

  // === FINAL MESSAGE ===
  finalMessage: {
    /** Celebratory summary */
    celebration: string;
    /** Key takeaway */
    keyTakeaway: string;
    /** Encouraging closing */
    closing: string;
  };

  // === SCORING SUMMARY ===
  scoringSummary?: {
    /** Overall portfolio score (1-10) */
    overallScore: number;
    /** Harvard 1-6 equivalent */
    harvardScale: 1 | 2 | 3 | 4 | 5 | 6;
    /** Average activity score */
    averageActivityScore: number;
    /** Average description score */
    averageDescriptionScore: number;
    /** Activity scores ordered by combined score (highest first) */
    rankedActivities: {
      activityId: string;
      combinedScore: number;
      rank: number;
    }[];
  };

  // === COMPLETE PIPELINE COST ===
  pipelineCost: {
    stage0: number;
    stage1: number;
    stage2: number;
    stage3: number;
    total: number;
  };

  // === STAGE METADATA ===
  synthesisMetadata: {
    generatedAt: string;
    modelUsed: string;
    tokensUsed: { input: number; output: number };
    cost: number;
  };
}

/**
 * Complete 4-Stage Pipeline Result
 */
export interface ActivityWorkshopPipelineResult {
  sessionId: string;
  version: '4.0.0';
  completedAt: string;

  // All stage outputs
  stage0: StoryContext;
  stage1: AnalysisContext;
  stage2: TeachingContext;
  stage3: SynthesisContext;

  // Legacy compatibility
  analysis: PortfolioAnalysis;
  teaching: PortfolioTeaching;

  // Total cost
  totalCost: number;
}
