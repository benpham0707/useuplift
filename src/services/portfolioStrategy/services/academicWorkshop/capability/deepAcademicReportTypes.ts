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

  /** What their trajectory means in admissions context — use tier benchmarks */
  trajectoryMeaning: string;

  /** The defining pattern in their academic record */
  definingPattern: string;
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
export const UPLIFT_SCALE_DATABASE: UpliftGradeDescriptor[] = [
  {
    grade: 'A+',
    label: 'Exceptional Scholar',
    description: 'Top 1-2% academic profile nationally. Maximum rigor with near-perfect performance. Strong upward trajectory or sustained excellence. Deep alignment with intended major. Admissions officers would flag this transcript as a standout.',
    schoolFit: 'Highly competitive for Ivy League, Stanford, MIT, Caltech, and top-5 programs in any field.',
  },
  {
    grade: 'A',
    label: 'Outstanding',
    description: 'Top 5% academic profile. High rigor with consistent A-range performance. Clear academic identity with strong major alignment. Transcript tells a compelling story of intellectual curiosity and capability.',
    schoolFit: 'Strong contender at top-20 universities, highly selective liberal arts colleges, and flagship state university honors programs.',
  },
  {
    grade: 'A-',
    label: 'Excellent',
    description: 'Top 10% academic profile. Meaningful rigor with mostly strong grades. Minor inconsistencies offset by clear strengths. Solid trajectory and identifiable academic direction.',
    schoolFit: 'Competitive at top-30 universities, strong match for top-50 schools, and excellent position at selective state universities.',
  },
  {
    grade: 'B+',
    label: 'Very Good',
    description: 'Top 15-20% academic profile. Good rigor with some grade variation. Strengths are visible but so are gaps. May have one area that needs attention or rigor that could be stronger.',
    schoolFit: 'Competitive at top-50 universities, strong match for top-80 schools. May need strong extracurriculars for reach schools.',
  },
  {
    grade: 'B',
    label: 'Solid',
    description: 'Top 25-30% academic profile. Adequate rigor with average performance at that level. Academic story is developing but not yet distinctive. Some strengths but also noticeable areas needing improvement.',
    schoolFit: 'Good fit for large state universities and mid-tier private colleges. Top-50 schools are realistic reaches with strong supplementary profile.',
  },
  {
    grade: 'B-',
    label: 'Developing',
    description: 'Top 35-40% academic profile. Either rigor is present but grades suffer, or grades are fine but rigor is too low. An imbalance exists between challenge and performance that needs addressing.',
    schoolFit: 'Solid at state universities and regional private colleges. Selective schools require significant improvement or exceptional non-academic strengths.',
  },
  {
    grade: 'C+',
    label: 'Below Potential',
    description: 'The transcript signals underperformance. Either the student is capable of more challenge, or capable of better grades at their current level. There is a visible gap between what is and what could be.',
    schoolFit: 'State universities and less selective private colleges are strong matches. More selective schools require a clear narrative of improvement.',
  },
  {
    grade: 'C',
    label: 'Needs Significant Improvement',
    description: 'Multiple areas need attention. Low rigor, inconsistent grades, weak major alignment, or declining trajectory. The transcript does not yet tell a story that admissions officers want to champion.',
    schoolFit: 'Open-admission and less selective institutions. Improvement over remaining semesters could open doors to more selective options.',
  },
  {
    grade: 'C-',
    label: 'At Risk',
    description: 'Significant academic challenges across multiple dimensions. May include declining trajectory, very low rigor, or grades that don\'t meet basic expectations. Immediate course correction needed.',
    schoolFit: 'Community college to university transfer pathway may offer the best long-term strategy. Focus on building a recovery narrative.',
  },
  {
    grade: 'D+',
    label: 'Struggling',
    description: 'Serious academic concerns. Performance is well below what most four-year colleges expect. However, this is not permanent — students who turn things around in their remaining time can still build a compelling narrative.',
    schoolFit: 'Community college is the strongest immediate path. Strong performance there opens transfer opportunities to excellent universities.',
  },
  {
    grade: 'D',
    label: 'Critical',
    description: 'The academic record currently presents major barriers to traditional admissions pathways. A complete strategic reset is needed — but turnaround stories are some of the most powerful narratives in admissions.',
    schoolFit: 'Community college with intentional transfer planning. Gap year programs with academic enrichment may also help reset the trajectory.',
  },
  {
    grade: 'D-',
    label: 'Emergency',
    description: 'Academic performance is at crisis level. Immediate intervention needed — academic support, tutoring, and possibly a conversation about learning differences or personal circumstances affecting performance.',
    schoolFit: 'Focus on stabilization first, college planning second. Community college remains an excellent pathway once academic fundamentals are strengthened.',
  },
  {
    grade: 'F',
    label: 'Requires Immediate Intervention',
    description: 'Academic profile is in freefall or essentially non-functional. This is not about college admissions — this is about getting the right support system in place. Academic counseling, mental health support, and family involvement are priorities.',
    schoolFit: 'College planning is secondary to addressing root causes. With proper support and time, every student can build a viable academic path forward.',
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
