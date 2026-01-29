/**
 * Academic Analysis Experience Types
 *
 * Comprehensive output structure that matches the depth and personalization
 * of the Extracurricular Activity Analysis. Every section provides actionable,
 * specific insights rather than generic feedback.
 *
 * Design principles:
 * - Reference specific courses, grades, and patterns
 * - Explain WHY things matter (research-backed)
 * - Provide "Current Read" vs "Stronger Frame" transformations
 * - Include example language for Additional Info/Essays
 * - Use visual tables and progressions where helpful
 */

import type { HarvardScore } from '../types';

// ============================================================================
// SECTION 1: ACADEMIC SPIKE ASSESSMENT
// ============================================================================

export type AcademicSpikeType =
  | 'intellectual_explorer' // Curiosity-driven across domains
  | 'depth_specialist' // Deep expertise in specific area
  | 'rising_star' // Dramatic improvement trajectory
  | 'balanced_achiever' // Consistent excellence across board
  | 'strategic_optimizer' // Calculated course selection
  | 'passionate_specialist' // Clear passion in narrow area
  | 'no_clear_spike'; // No distinctive pattern

export interface AcademicSpikeAssessment {
  spikeType: AcademicSpikeType;
  spikeDescription: string; // 2-3 sentences describing the spike
  admissionsOfficerRead: string; // What AOs will see/remember
  distinctiveness: 'highly_distinctive' | 'moderately_distinctive' | 'common' | 'concerning';
  distinctivenessExplanation: string;
  competitiveAdvantage: string; // How this spike helps in admissions
}

// ============================================================================
// SECTION 2: TRANSCRIPT NARRATIVE QUALITY
// ============================================================================

export interface NarrativeArcElement {
  pattern: string;
  evidence: string[];
  whyItMatters: string;
}

export interface NarrativeBreakdown {
  issue: string;
  evidence: string[];
  howToAddress: string;
  severity: 'critical' | 'moderate' | 'minor';
}

export interface TranscriptNarrative {
  score: number; // 0-10
  academicStory: string; // One-line brand like EC's "Mathematician who..."

  narrativeArcAnalysis: {
    whatsWorking: NarrativeArcElement[];
    whereStoryBreaksDown: NarrativeBreakdown[];
  };

  currentRead: string; // "Your transcript currently reads as..."
  strongerFrame: string; // "A stronger frame would be..."
  transformationAdvice: string; // How to shift from current to stronger
}

// ============================================================================
// SECTION 3: YEAR-BY-YEAR ANALYSIS
// ============================================================================

export type RigorRating = 'maximized' | 'strong' | 'moderate' | 'limited' | 'concerning';
export type GradeRating = 'exceptional' | 'strong' | 'solid' | 'mixed' | 'concerning';
export type StoryContribution = 'pillar' | 'supports' | 'neutral' | 'detracts';
export type YearStatus = 'ready' | 'needs_context' | 'needs_addressing' | 'critical';

export interface YearAnalysis {
  year: string; // "Freshman", "Sophomore", "Junior", "Senior"
  yearWeight: string; // e.g., "35% (most important)"

  rigorUtilization: {
    rating: RigorRating;
    visualRating: string; // "★★★★★" style
    details: string;
    apsTaken: number;
    apsAvailable: number | null;
    utilizationPercent: number | null;
  };

  performance: {
    gpa: number;
    rating: GradeRating;
    underPressure: string; // How they performed in hardest courses this year
    notableCourses: { course: string; grade: string; significance: string }[];
  };

  storyContribution: StoryContribution;
  storyExplanation: string;

  status: YearStatus;
  statusExplanation: string;

  keyMoment?: {
    event: string;
    significance: string;
  };
}

// ============================================================================
// SECTION 4: SUBJECT DEPTH ANALYSIS
// ============================================================================

export type DepthLevel = 'exceptional' | 'strong' | 'adequate' | 'surface' | 'absent';
export type SubjectTrajectory = 'ascending' | 'sustained_high' | 'sustained' | 'declining' | 'flat';
export type NarrativeFit = 'core_pillar' | 'supports_story' | 'neutral' | 'disconnected' | 'contradicts';
export type MajorRelevance = 'required' | 'recommended' | 'complementary' | 'irrelevant';

export interface SubjectAnalysis {
  subject: string;
  depthLevel: DepthLevel;
  depthScore: number; // 0-5
  yearsOfStudy: number;
  trajectory: SubjectTrajectory;
  highestLevel: string; // e.g., "AP Physics C: E&M" or "Dual Enrollment Calc III"
  courseProgression: string; // e.g., "Honors → AP → Dual Enrollment"

  narrativeFit: NarrativeFit;
  narrativeExplanation: string;

  majorAlignment?: MajorRelevance;
  majorAlignmentNote?: string;

  competitivePosition: string; // "Among CS applicants at top schools..."

  analysis: string; // Detailed analysis paragraph
  recommendation: string; // What to do about this subject
}

// ============================================================================
// SECTION 5: COURSE SELECTION CRAFT
// ============================================================================

export interface RigorProgressionAnalysis {
  pattern: string; // "Built from Honors to AP to Dual Enrollment"
  strength: 'excellent' | 'good' | 'adequate' | 'weak' | 'concerning';
  visualProgression: string; // ASCII visual of rigor by year
  specificExamples: string[];
  analysis: string;
}

export interface IntellectualCourageAnalysis {
  score: number; // 0-10
  pattern: string;
  evidenceFor: string[]; // Choices showing courage
  evidenceAgainst: string[]; // Choices showing avoidance
  interpretation: string;
  admissionsRead: string;
}

export interface DepthBreadthAnalysis {
  pattern: 'deep_specialist' | 'broad_explorer' | 'strategic_balance' | 'scattered' | 'shallow';
  visualMap: string; // ASCII representation of depth by subject
  analysis: string;
  strengthForMajor: string;
  concernsIfAny: string;
}

export interface TimingAnalysis {
  pattern: string;
  juniorYearAssessment: string; // Critical - 35% weight
  seniorYearAssessment: string; // Watch for decline
  riskLevel: 'low' | 'moderate' | 'high';
  riskExplanation: string;
}

export interface CourseSelectionCraft {
  rigorProgressionAnalysis: RigorProgressionAnalysis;
  intellectualCourageAnalysis: IntellectualCourageAnalysis;
  depthBreadthAnalysis: DepthBreadthAnalysis;
  timingOfChallenges: TimingAnalysis;
}

// ============================================================================
// SECTION 6: RED NARRATIVE ANALYSIS
// ============================================================================

export type ConcernSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

export interface PotentialConcern {
  concern: string;
  evidence: string[];
  severity: ConcernSeverity;
  likelyAdmissionsRead: string; // "AOs might think..."
  canBeExplained: boolean;
  mitigationStrategy: {
    approach: string;
    whereToAddress: 'additional_info' | 'counselor_letter' | 'essay' | 'interview' | 'let_record_speak';
    draftLanguage?: string; // Example language to use
  };
}

export interface PatternSignal {
  detected: boolean;
  evidence: string[];
  impact: string;
  howToAddress: string;
}

export interface RedNarrativeAnalysis {
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  summaryOfConcerns: string;

  potentialConcerns: PotentialConcern[];

  gpaProtectionSignals: PatternSignal;
  rigorAvoidanceSignals: PatternSignal;
  seniorDeclineSignals: PatternSignal;
  majorMismatchSignals: PatternSignal;
}

// ============================================================================
// SECTION 7: MAJOR ALIGNMENT
// ============================================================================

export type ProofStrength = 'compelling' | 'solid' | 'adequate' | 'weak' | 'absent';
export type RequirementStatus = 'exceeded' | 'met' | 'partially_met' | 'missing';

export interface DirectProof {
  evidence: string[];
  strength: ProofStrength;
  whatItProves: string;
}

export interface RequirementItem {
  requirement: string;
  status: RequirementStatus;
  details: string;
  evidence?: string;
}

export interface MajorAlignmentAnalysis {
  score: number; // 0-10
  intendedMajor: string;

  directProofOfAbility: DirectProof;

  requiredCoursework: RequirementItem[];

  depthDemonstration: {
    analysis: string;
    competitivePosition: string; // "Among CS applicants at MIT..."
  };

  credibilityAssessment: {
    level: 'highly_credible' | 'credible' | 'somewhat_credible' | 'questionable' | 'contradicted';
    explanation: string;
    redFlags: string[];
    greenFlags: string[];
  };

  essayRecommendation: string;
}

// ============================================================================
// SECTION 8: COMPETITIVE POSITIONING
// ============================================================================

export type SchoolTier = 'ivy_plus' | 'top_20' | 'top_50' | 'state_flagship' | 'any';
export type Position = 'significantly_above' | 'above_average' | 'at_average' | 'below_average' | 'significantly_below';
export type RigorPosition = 'top_5%' | 'top_10%' | 'top_25%' | 'average' | 'below_average';

export interface GPAPosition {
  yourGPA: number;
  benchmarkForTier: string; // "74% of Harvard admits have 4.0+"
  position: Position;
  context: string; // What this means for the student
}

export interface RigorPositionAnalysis {
  yourRigor: string; // "13 APs + 2 Dual Enrollment"
  benchmarkForTier: string; // "Average Harvard admit has 8 APs"
  position: RigorPosition;
  context: string;
}

export interface CompetitivenessAssessment {
  qualifiesAcademically: boolean;
  assessment: string;
  differentiators: string[];
  concerns: string[];
  whatHappensNext: string; // What they need beyond academics
}

export interface TierOutlook {
  tier: string;
  academicStanding: string;
  additionalFactorsNeeded: string;
}

export interface CompetitivePositioning {
  targetSchoolTier: SchoolTier;

  gpaPosition: GPAPosition;
  rigorPosition: RigorPositionAnalysis;

  overallCompetitiveness: CompetitivenessAssessment;

  tierOutlook: TierOutlook[];
}

// ============================================================================
// SECTION 9: SPECIFIC IMPROVEMENTS
// ============================================================================

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type AddressLocation = 'additional_info' | 'counselor_letter' | 'essay' | 'interview' | 'mid_year_grades';

export interface ImmediateAction {
  action: string;
  priority: Priority;
  timeline: string;
  impact: string;
  howTo: string;
  draftLanguage?: string;
}

export interface CourseRecommendation {
  recommendation: string;
  rationale: string;
  majorBenefit: string;
  feasibility: 'easy' | 'moderate' | 'difficult';
}

export interface NarrativeFramingAdvice {
  weakness: string;
  currentImplicitNarrative: string;
  strongerFrame: string;
  whereToAddress: AddressLocation;
  draftLanguage: string;
}

export interface SpecificImprovements {
  immediateActions: ImmediateAction[];
  courseRecommendations: CourseRecommendation[];
  narrativeFramingAdvice: NarrativeFramingAdvice[];
  counselorLetterGuidance: string[];
  interviewPrepPoints: string[];
}

// ============================================================================
// SECTION 10: TEACHING INSIGHTS
// ============================================================================

export interface TeachingLesson {
  topic: string;
  whatResearchShows: string;
  applicationToYou: string;
  actionableInsight: string;
  citation?: string;
}

export interface TeachingInsights {
  keyLessons: TeachingLesson[];
  misconceptionsAddressed: {
    misconception: string;
    truth: string;
    whyItMatters: string;
  }[];
}

// ============================================================================
// FULL ANALYSIS EXPERIENCE
// ============================================================================

export interface AcademicAnalysisExperience {
  // Meta
  generatedAt: string;
  studentContext: {
    intendedMajor: string;
    schoolType: string;
    targetSchoolTier: SchoolTier;
  };

  // Harvard Score Summary
  harvardScore: HarvardScore;
  harvardLabel: string;
  executiveSummary: string; // 3-4 sentence overview

  // Detailed Sections
  spikeAssessment: AcademicSpikeAssessment;
  transcriptNarrative: TranscriptNarrative;
  yearByYearAnalysis: YearAnalysis[];
  subjectAnalysis: SubjectAnalysis[];
  courseSelectionCraft: CourseSelectionCraft;
  redNarrativeAnalysis: RedNarrativeAnalysis;
  majorAlignment: MajorAlignmentAnalysis;
  competitivePositioning: CompetitivePositioning;
  specificImprovements: SpecificImprovements;
  teachingInsights: TeachingInsights;

  // Cost tracking
  analysisMetadata: {
    llmCallsMade: number;
    totalCost: number;
    processingTimeMs: number;
  };
}

// ============================================================================
// PARTIAL RESULTS (for progressive generation)
// ============================================================================

export interface PartialExperienceResult {
  section: string;
  success: boolean;
  data?: unknown;
  error?: string;
}
