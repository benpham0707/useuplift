/**
 * Deep Academic Report Types
 *
 * Type definitions for the 4-section deep academic report that provides
 * teaching-depth analysis of a student's academic profile.
 *
 * Philosophy: The report TEACHES, not restates. Every section must provide
 * insight the student cannot derive themselves from reading their transcript.
 * No fluff, no rhetorical questions — every sentence must contain data,
 * a concrete insight, or an actionable recommendation.
 *
 * Structure:
 * 1. Academic Identity — who you are + strengths/weaknesses + tier position + Uplift rating
 * 2. Challenges & Admissions Reality — issues + AO perspective + tier impact (merged)
 * 3. Strategic Roadmap — prioritized actions and course strategy
 * 4. Research Context — verified data (template, no LLM)
 *
 * Note: Root cause diagnosis, study strategy advice, and "why you struggled"
 * analysis is NOT in this report — that feeds into the conversational advisor
 * where we build a deeper profile through dialogue.
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
  /** Top-of-report summary: 3-5 bullets capturing the essential takeaways.
   *  Generated from all sections after they're complete — the "if you read nothing else" section. */
  bottomLine: BottomLineSummary;

  /** Section 1: Who you are academically + strengths/weaknesses + tier + Uplift rating */
  academicIdentity: AcademicIdentitySection;

  /** Section 2: Challenges with AO perspective + tier impact (merged) */
  challengesAndReality: ChallengesAndRealitySection;

  /** Section 3: Prioritized roadmap with course strategy */
  strategicRoadmap: StrategicRoadmapSection;

  /** Section 4: Pure data - verified research context */
  researchContext: ResearchContextSection;

  /** Report metadata */
  metadata: ReportMetadata;
}

/** Top-of-report summary generated AFTER all sections are complete.
 *  Synthesizes the 3-5 most important takeaways from the entire report.
 *  This is what gets read first — every bullet must be self-contained and impactful. */
export interface BottomLineSummary {
  /** Uplift letter grade + one-line explanation */
  rating: string;

  /** Current tier positioning with school examples */
  positioning: string;

  /** The single biggest strength and what it means */
  biggestStrength: string;

  /** The single biggest risk and what it costs them */
  biggestRisk: string;

  /** The #1 action that would most improve their position */
  topAction: string;
}

// ============================================================================
// SECTION 1: ACADEMIC IDENTITY
// ============================================================================

export interface AcademicIdentitySection {
  /** Narrative identity - who they are academically in 2-3 paragraphs */
  narrativeIdentity: string;

  /** Notable strengths — concise, non-obvious insights about their top strengths
   *  These are additive to the narrative (things the student can't see themselves),
   *  NOT a restatement of "you're good at Math" */
  notableStrengths: NotableStrength[];

  /** Notable weaknesses — concise overview of where they're falling short.
   *  Previews the Challenges section without being repetitive.
   *  Tone adapts: strong students get gentle nudge, struggling students get reality check. */
  notableWeaknesses: NotableWeakness[];

  /** College tier position — maps their GPA to concrete school tiers for urgency.
   *  Shows where they currently sit, where strengths could take them, and where
   *  weaknesses are dragging them. Uses real school names for visceral impact. */
  tierPosition: CollegeTierPosition;

  /** Uplift Scale Rating — subjective A+ through F assessment integrated into identity.
   *  Considers rigor, major alignment, trends, difficulty sensitivity — not just GPA.
   *  Includes what the grade means and what kind of schools fit. */
  upliftRating: UpliftRating;
}

/** Where the student sits in the college tier landscape.
 *  Maps abstract GPA numbers to concrete school names for urgency.
 *  Shows how their strengths and weaknesses create a tier gap. */
export interface CollegeTierPosition {
  /** Current overall tier: e.g. "Selective (Top 50-100)" */
  currentTier: string;

  /** Example schools at their current tier */
  tierExamples: string[];

  /** Where their GPA sits within this tier */
  gpaPosition: string;

  /** If their strongest subjects were their overall: what tier would they be in? */
  strengthTier?: string;

  /** If their weakest subjects defined them: what tier would they drop to? */
  weaknessTier?: string;

  /** What it would take to reach the next tier up */
  tierGap: string;
}

/** Concise strength highlight — the non-obvious insight, not a restatement */
export interface NotableStrength {
  /** Subject or pattern name */
  subject: string;

  /** The non-obvious insight about this strength (what they can't see themselves) */
  insight: string;

  /** How it connects to their intended major / path */
  majorRelevance: string;
}

/** Concise weakness highlight — previews Challenge Analysis without being repetitive.
 *  Tone is calibrated: strong students get a motivational nudge, struggling students
 *  get a reality check without feeling doomed. */
export interface NotableWeakness {
  /** Subject or pattern name */
  area: string;

  /** Concise description of the gap — how far behind they are (1-2 sentences) */
  gap: string;

  /** Why it matters for their path — consequence if not addressed (1 sentence) */
  consequence: string;
}

/** Uplift Scale Rating — a subjective, holistic academic grade.
 *  NOT just GPA. Considers rigor, major alignment, trends, difficulty sensitivity,
 *  and school context. An all-A student in easy classes won't get an A. */
export interface UpliftRating {
  /** Letter grade: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F */
  grade: UpliftGrade;

  /** What this specific grade means for THIS student — not the generic definition */
  explanation: string;
}

/** All possible Uplift Scale grades */
export type UpliftGrade =
  | 'A+' | 'A' | 'A-'
  | 'B+' | 'B' | 'B-'
  | 'C+' | 'C' | 'C-'
  | 'D+' | 'D' | 'D-'
  | 'F';

/** Uplift Scale grade descriptor — what each grade generally means */
export interface UpliftGradeDescriptor {
  grade: UpliftGrade;
  label: string;
  description: string;
  schoolFit: string;
}

/**
 * UPLIFT SCALE DATABASE
 *
 * Holistic academic grade descriptors. The grade a student receives is SUBJECTIVE —
 * it factors in rigor, major alignment, grade trends, difficulty sensitivity, school
 * context, and more. A student with all A's in regular classes might be a B- on the
 * Uplift Scale because they're not challenging themselves. A student with B+'s in all
 * AP courses might be an A- because they're pushing at the highest level available.
 */
// Each Uplift grade maps directly to a school tier — the grade IS the tier indicator.
// Students should understand: "My grade is B → I'm competitive at these specific schools."
export const UPLIFT_SCALE_DATABASE: UpliftGradeDescriptor[] = [
  {
    grade: 'A+',
    label: 'Exceptional',
    description: 'You are among the strongest academic profiles nationally. Maximum rigor with near-perfect performance, clear major alignment, and a transcript that stands out to any admissions officer.',
    schoolFit: 'Highly competitive for Harvard, Stanford, MIT, Princeton, Yale, and similar Ivy/Elite schools.',
  },
  {
    grade: 'A',
    label: 'Outstanding',
    description: 'Your academic profile is excellent. High rigor with consistent strong performance, a clear academic identity, and strong alignment with your intended major.',
    schoolFit: 'Strong contender at Northwestern, UCLA, UC Berkeley, Georgetown, Carnegie Mellon, and similar Highly Selective schools.',
  },
  {
    grade: 'A-',
    label: 'Excellent',
    description: 'Your profile is very strong with meaningful rigor and mostly excellent grades. You have clear academic strengths and a solid direction, with only minor inconsistencies.',
    schoolFit: 'Competitive at NYU, Boston College, UW-Madison, UCSB, Tulane, and similar Very Selective schools.',
  },
  {
    grade: 'B+',
    label: 'Very Good',
    description: 'You have a good academic profile with solid rigor. Your strengths are visible, though there are some gaps or areas where you could push harder. You\'re on the right track.',
    schoolFit: 'Well-positioned for Boston University, UT Austin, Ohio State, Purdue, and similar Selective schools. Stretch for Very Selective with strong senior year.',
  },
  {
    grade: 'B',
    label: 'Solid',
    description: 'Your profile shows real capability, but your academic story isn\'t fully developed yet. You have clear strengths alongside areas that need work. There\'s meaningful room to grow.',
    schoolFit: 'Competitive at schools like Purdue, UMass Amherst, Rutgers, and similar Selective schools. Boston University and UT Austin are realistic reaches.',
  },
  {
    grade: 'B-',
    label: 'Developing',
    description: 'Your profile has potential but shows an imbalance — either you\'re taking hard courses with mixed results, or getting decent grades without enough challenge. Something needs to shift.',
    schoolFit: 'Solid position at Arizona State, Iowa State, University of Oregon, Temple, and similar Competitive schools. Selective schools need a clear improvement narrative.',
  },
  {
    grade: 'C+',
    label: 'Below Potential',
    description: 'Your transcript suggests you\'re capable of more than what you\'re showing. There\'s a gap between your potential and your current performance that needs attention.',
    schoolFit: 'Less selective state and private universities are strong matches. More selective schools need to see a clear turnaround.',
  },
  {
    grade: 'C',
    label: 'Needs Significant Improvement',
    description: 'Multiple areas of your academic profile need attention — rigor, grades, or both. Your transcript doesn\'t yet tell the story that will get you into the schools you probably want.',
    schoolFit: 'Open-admission and less selective institutions are your strongest matches right now. Improvement over the next semesters can expand your options.',
  },
  {
    grade: 'C-',
    label: 'At Risk',
    description: 'Your academic profile has significant challenges that need immediate attention. This isn\'t permanent, but it requires a serious course correction starting now.',
    schoolFit: 'Consider a community college to university transfer pathway — it\'s a proven strategy that many successful students use.',
  },
  {
    grade: 'D+',
    label: 'Struggling',
    description: 'Your performance is well below what most four-year colleges expect. This is not permanent — students who turn things around can still build a compelling story.',
    schoolFit: 'Community college is your strongest immediate path. Strong performance there opens transfer opportunities to excellent universities.',
  },
  {
    grade: 'D',
    label: 'Critical',
    description: 'Your academic record currently presents major barriers. A strategic reset is needed — but turnaround stories are some of the most powerful narratives in admissions.',
    schoolFit: 'Community college with intentional transfer planning. Gap year programs may also help reset your trajectory.',
  },
  {
    grade: 'D-',
    label: 'Emergency',
    description: 'Your academic performance needs immediate intervention — academic support, tutoring, and possibly a conversation about what\'s affecting your schoolwork.',
    schoolFit: 'Focus on stabilization first, college planning second. Community college is an excellent pathway once fundamentals are strengthened.',
  },
  {
    grade: 'F',
    label: 'Requires Immediate Intervention',
    description: 'This isn\'t about college right now — it\'s about getting the right support in place. Academic counseling, mental health support, and family involvement come first.',
    schoolFit: 'College planning comes after addressing root causes. With support and time, every student can build a viable academic path.',
  },
];

// ============================================================================
// SECTION 2: CHALLENGES & ADMISSIONS REALITY (merged)
// ============================================================================

/** Merged section: challenges + AO perspective + tier impact.
 *  No "What You Think" assumptions — just the issue, why AOs care, and the tier impact.
 *  Root cause diagnosis belongs in the conversational advisor, not here. */
export interface ChallengesAndRealitySection {
  /** What AOs notice first when reading this transcript (2-3 sentences) */
  firstGlance: string;

  /** 2-3 distinct challenges with AO perspective and tier impact baked in */
  challenges: ChallengeWithAOContext[];

  /** The story their course choices accidentally tell (2-3 sentences) */
  unintendedNarrative: string;

  /** How to reshape the narrative (2-3 sentences, actionable) */
  narrativeControlStrategy: string;
}

/** A challenge with full AO context and tier impact.
 *  Each challenge answers: What's the issue? How do AOs read it?
 *  How does it affect their school positioning? What's the fix? */
export interface ChallengeWithAOContext {
  /** Challenge name (short, distinct from other challenges) */
  title: string;

  /** What the issue is — factual, specific, no rhetorical questions (2-3 sentences) */
  issue: string;

  /** How admissions officers interpret this specifically (2-3 sentences) */
  aoImpact: string;

  /** How this shifts their college tier positioning — use school names (1-2 sentences) */
  tierImpact: string;

  /** Brief pointer to the roadmap action (1-2 sentences) */
  roadmapConnection: string;

  /** Verified statistics backing this analysis */
  researchBacking: ResearchCitation[];
}

// ============================================================================
// SECTION 3: STRATEGIC ROADMAP
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
// SECTION 4: RESEARCH CONTEXT (Pure data, no LLM)
// ============================================================================

export interface ResearchContextSection {
  /** Verified AP statistics for relevant courses, with student performance context */
  apStatistics: Array<{
    course: string;
    passRate: string;
    fiveRate: string;
    citation: string;
    /** Student's class grade if they took this course (null if not taken) */
    studentGrade?: string;
    /** Brief context connecting this stat to the student's performance */
    studentContext?: string;
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
