/**
 * Deep Academic Report Types
 *
 * Type definitions for the 6-section deep academic report that provides
 * PIQ-workshop-level depth and teaching for academic analysis.
 *
 * Philosophy: The report TEACHES, not restates. Every section must provide
 * insight the student cannot derive themselves from reading their transcript.
 * Think "expert advisor who explains WHY" not "summary generator."
 */

import type { NuancedCapabilityAnalysis } from './nuancedCapabilityAnalyzer';
import type { ProfileInsight } from './conversational/insightDrivenAdvisor';
import type { AssembledResearch } from './conversational/unifiedResearchAssemblyService';
import type { AcademicPlanningAdvice } from './conversational/academicPlanningAdvisor';

// ============================================================================
// INPUT
// ============================================================================

export interface DeepAcademicReportInput {
  /** Quantitative analysis from NuancedCapabilityAnalyzer */
  quantitativeAnalysis: NuancedCapabilityAnalysis;

  /** Intended major (if known) */
  intendedMajor?: string;

  /** Current grade level */
  currentGrade: number;

  /** School context */
  schoolContext: {
    type: 'elite_prep' | 'competitive_magnet' | 'well_resourced_suburban' | 'average_public' | 'under_resourced' | 'rural_remote';
    apCoursesAvailable?: number;
  };

  /** Target schools (if known) */
  targetSchools?: string[];
}

// ============================================================================
// MAIN REPORT OUTPUT
// ============================================================================

export interface DeepAcademicReport {
  /** Section 1: Who you are academically */
  academicIdentity: AcademicIdentitySection;

  /** Section 2: Deep dives into each strength */
  strengthDeepDives: StrengthDeepDive[];

  /** Section 3: Deep dives into each challenge */
  challengeDeepDives: ChallengeDeepDive[];

  /** Section 4: What admissions officers see vs what's actually true */
  admissionsOfficerLens: AdmissionsOfficerLensSection;

  /** Section 5: Prioritized roadmap with course strategy */
  strategicRoadmap: StrategicRoadmapSection;

  /** Section 6: Pure data - verified research context */
  researchContext: ResearchContextSection;

  /** Report metadata */
  metadata: ReportMetadata;
}

// ============================================================================
// SECTION 1: ACADEMIC IDENTITY
// ============================================================================

export interface AcademicIdentitySection {
  /** Narrative identity - who they are academically in 2-3 paragraphs */
  narrativeIdentity: string;

  /** Harvard scale rating with explanation of what it means */
  harvardScaleRating: {
    rating: number; // 1-6
    label: string;
    explanation: string;
    biggestLever: string;
  };

  /** First impression an AO would have reading this transcript */
  aoFirstImpression: string;

  /** What their trajectory means in admissions context */
  trajectoryMeaning: string;

  /** The defining pattern in their academic record */
  definingPattern: string;
}

// ============================================================================
// SECTION 2: STRENGTH DEEP DIVES
// ============================================================================

export interface StrengthDeepDive {
  /** Subject or pattern name */
  title: string;

  /** Attention-grabbing observation */
  hook: string;

  /** Why this matters from 3 perspectives */
  whyItMatters: {
    forAdmissionsOfficers: string;
    forYourMajor: string;
    forYourNarrative: string;
  };

  /** What they can't see from their own transcript */
  blindSpotInsight: string;

  /** Specific, actionable guidance */
  actionableGuidance: {
    leverageStrategy: string;
    courseRecommendation: string;
    narrativeAngle: string;
  };

  /** Verified statistics backing this analysis */
  researchBacking: ResearchCitation[];
}

// ============================================================================
// SECTION 3: CHALLENGE DEEP DIVES
// ============================================================================

export interface ChallengeDeepDive {
  /** Challenge name */
  title: string;

  /** Reframing the challenge */
  hook: string;

  /** Why this matters from 3 perspectives */
  whyItMatters: {
    whatAOsSee: string;
    whatItActuallyMeans: string;
    consequenceOfIgnoring: string;
  };

  /** Teaching-oriented analysis */
  teaching: {
    rootCauseDiagnosis: string;
    stepByStepFix: string[];
    timeframe: string;
    beforeAfterExample: string;
  };

  /** Verified statistics backing this analysis */
  researchBacking: ResearchCitation[];
}

// ============================================================================
// SECTION 4: ADMISSIONS OFFICER LENS
// ============================================================================

export interface AdmissionsOfficerLensSection {
  /** What AOs notice first when reading this transcript */
  firstGlance: string;

  /** Gap between student perception and AO perception */
  blindSpots: BlindSpot[];

  /** The story their course choices accidentally tell */
  unintendedNarrative: string;

  /** How to fix the narrative */
  narrativeControlStrategy: string;
}

export interface BlindSpot {
  /** What the student thinks */
  studentPerception: string;

  /** What AOs actually see */
  aoReality: string;

  /** How to bridge the gap */
  howToFix: string;
}

// ============================================================================
// SECTION 5: STRATEGIC ROADMAP
// ============================================================================

export interface StrategicRoadmapSection {
  /** Top 3 priorities in order */
  priorities: StrategicPriority[];

  /** Specific course strategy for next year */
  courseStrategy: {
    recommended: CourseStrategyItem[];
    avoid: CourseAvoidItem[];
    rationale: string;
  };

  /** Major alignment analysis */
  majorAlignment: {
    score: number; // 0-100
    assessment: string;
    missingPieces: string[];
    strengthsToLeverage: string[];
  };

  /** How to optimize trajectory from here */
  trajectoryOptimization: string;
}

export interface StrategicPriority {
  priority: number; // 1, 2, 3
  title: string;
  description: string;
  impact: 'critical' | 'high' | 'moderate';
  actionItems: string[];
}

export interface CourseStrategyItem {
  course: string;
  rationale: string;
  risk: 'low' | 'medium' | 'high';
  expectedOutcome: string;
}

export interface CourseAvoidItem {
  course: string;
  reason: string;
}

// ============================================================================
// SECTION 6: RESEARCH CONTEXT (Pure data, no LLM)
// ============================================================================

export interface ResearchContextSection {
  /** Verified AP statistics for relevant courses */
  apStatistics: Array<{
    course: string;
    passRate: string;
    fiveRate: string;
    citation: string;
  }>;

  /** College tier expectations */
  collegeTierExpectations: Array<{
    tier: string;
    gpaRange: string;
    rigorExpectation: string;
  }>;

  /** Major-specific requirements from resolution service */
  majorRequirements?: {
    major: string;
    minimumCourses: string[];
    competitiveCourses: string[];
    beyondCourses: string[];
  };

  /** NACAC admissions factor importance */
  admissionsFactors: Array<{
    factor: string;
    importance: string;
    citation: string;
  }>;
}

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface ResearchCitation {
  claim: string;
  value: string;
  source: string;
}

export interface ReportMetadata {
  /** Time to generate in ms */
  generationTimeMs: number;

  /** Total estimated cost */
  estimatedCost: number;

  /** Token usage breakdown */
  tokenUsage: {
    input: number;
    output: number;
  };

  /** Which sections used LLM vs template */
  sectionSources: Record<string, 'llm' | 'template'>;

  /** Whether fallback was used */
  usedFallback: boolean;
}

// ============================================================================
// INTERMEDIATE TYPES (for internal orchestration)
// ============================================================================

/** All data gathered before LLM calls */
export interface AssembledReportContext {
  /** Raw quantitative analysis */
  quantitativeAnalysis: NuancedCapabilityAnalysis;

  /** Profile insights from insightDrivenAdvisor */
  profileInsights: ProfileInsight[];

  /** Assembled research from unifiedResearchAssemblyService */
  assembledResearch: AssembledResearch;

  /** Planning advice from academicPlanningAdvisor */
  planningAdvice: AcademicPlanningAdvice;

  /** Student input */
  input: DeepAcademicReportInput;
}
