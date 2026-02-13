// @ts-nocheck
/**
 * Unified Research Assembly Service
 *
 * This service is the CENTRAL HUB for connecting all research databases
 * to the academic advisor conversation system. It:
 *
 * 1. AGGREGATES research from multiple sources:
 *    - academicResearchFoundation (verified statistics with citations)
 *    - researchBackedGuidanceLayer (GPA calibration, context adjustment)
 *    - fieldSpecificExpectations (major-specific benchmarks)
 *    - academicCourseKnowledgeBase (AP course details)
 *    - collegeExpectationsDatabase (college tier expectations)
 *    - realStakesDatabase (consequences and stakes)
 *
 * 2. SELECTS relevant research based on student profile
 *
 * 3. FORMATS for optimal LLM consumption
 *
 * 4. PRESERVES citations for verified claims
 *
 * DESIGN PRINCIPLE: The LLM should receive rich, specific, verified context
 * so it can provide expert-level advice - not generic platitudes.
 */

import {
  AP_EXAM_STATISTICS,
  NACAC_ADMISSIONS_FACTORS,
  COLLEGE_CDS_DATA,
  VERIFIED_GUIDANCE,
  UNVERIFIABLE_CLAIMS,
  getAPStatistics,
  type VerifiedDataPoint,
} from './academicResearchFoundation';

import {
  generateResearchBackedGuidance,
  getCalibratedGPAInterpretation,
  getMajorCourseRequirements,
  getSchoolValueMatrix,
  type ResearchGuidanceInput,
  type ResearchBackedGuidance,
  type CalibratedAcademicAssessment,
  type ContextAwareRecommendation,
  type SchoolSpecificStrategy,
} from './researchBackedGuidanceLayer';

import {
  CS_EXPECTATIONS,
  ENGINEERING_EXPECTATIONS,
  PREMED_EXPECTATIONS,
  BUSINESS_EXPECTATIONS,
  HUMANITIES_EXPECTATIONS,
  type FieldExpectations,
} from '../../../../knowledge/fieldSpecificExpectations';

import {
  getAPCourse,
  getCoursesForMajor,
  formatPassRate,
  getLoadGuidance,
  type APCourseProfile,
} from './academicCourseKnowledgeBase';

import {
  getMajorExpectations,
  assessMajorReadiness,
  type MajorSpecificExpectation,
} from './collegeExpectationsDatabase';

import {
  resolveStudentInterest,
  getTargetedContext,
  type ResolvedMajor,
  type TargetedMajorContext,
} from './majorResolutionService';

import {
  ADMITTED_STUDENT_PROFILES,
  AP_SCORE_PERCEPTIONS,
  QUICK_FACTS,
  findRelevantFacts,
  getAdmittedProfile,
  type QuickFact,
  type AdmittedStudentProfile,
} from './realStakesDatabase';

import type { NuancedCapabilityAnalysis } from '../nuancedCapabilityAnalyzer';
import type { SubjectArea } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface StudentContext {
  /** Quantitative analysis from profile */
  quantitativeAnalysis: NuancedCapabilityAnalysis;

  /** Intended major (if known) */
  intendedMajor?: string;

  /** Current grade level */
  currentGrade: number;

  /** School context */
  schoolContext?: {
    type: 'elite_prep' | 'competitive_magnet' | 'well_resourced_suburban' | 'average_public' | 'under_resourced' | 'rural_remote';
    apCoursesAvailable?: number;
  };

  /** Target schools (if known) */
  targetSchools?: string[];

  /** Demographic context (if disclosed) */
  demographicContext?: {
    firstGeneration?: boolean;
    lowIncome?: boolean;
    ruralBackground?: boolean;
    immigrantFamily?: boolean;
  };

  /** Test scores (if available) */
  testScores?: {
    sat?: number;
    act?: number;
  };
}

export interface AssembledResearch {
  // -------------------------------------------------------------------------
  // CORE GUIDANCE
  // -------------------------------------------------------------------------

  /** Full research-backed guidance from the guidance layer */
  researchBackedGuidance: ResearchBackedGuidance;

  // -------------------------------------------------------------------------
  // MAJOR-SPECIFIC EXPECTATIONS
  // -------------------------------------------------------------------------

  /** Field-specific expectations for their intended major */
  majorExpectations?: {
    major: string;
    tierBenchmarks: {
      expected: string[];
      bonus: string[];
      warningSignals: string[];
    };
    impactBenchmarks: {
      exceptional: Array<{ metric: string; threshold: string }>;
      strong: Array<{ metric: string; threshold: string }>;
      baseline: Array<{ metric: string; threshold: string }>;
    };
    genuineInterestMarkers: {
      earlySignals: string[];
      developmentPattern: string[];
      matureIndicators: string[];
    };
    commonMistakes: Array<{
      mistake: string;
      whyItHurts: string;
      howToFix: string;
    }>;
    descriptionExpectations: {
      keyTerms: string[];
      actionVerbs: string[];
      quantificationExamples: string[];
      avoidTerms: string[];
    };
  };

  // -------------------------------------------------------------------------
  // AP COURSE DETAILS
  // -------------------------------------------------------------------------

  /** Relevant AP courses for their major/profile */
  relevantAPCourses: Array<{
    course: APCourseProfile;
    relevanceToMajor: 'essential' | 'strongly_recommended' | 'recommended' | 'helpful';
    verifiedStatistics?: {
      passRate: string;
      score5Rate: string;
      citation: string;
    };
  }>;

  // -------------------------------------------------------------------------
  // VERIFIED STATISTICS
  // -------------------------------------------------------------------------

  /** Verified statistics that can be cited */
  verifiedStatistics: Array<{
    claim: string;
    value: string | number;
    citation: string;
    relevance: string;
  }>;

  // -------------------------------------------------------------------------
  // COLLEGE EXPECTATIONS
  // -------------------------------------------------------------------------

  /** College tier expectations for their targets */
  collegeExpectations?: {
    tier: string;
    gpaRange: string;
    apCourseRange: string;
    apScoreExpectations: string;
    majorSpecificExpectations?: MajorSpecificExpectation;
  };

  /** Admitted student profile for their major */
  admittedProfile?: AdmittedStudentProfile;

  // -------------------------------------------------------------------------
  // STAKES AND CONSEQUENCES
  // -------------------------------------------------------------------------

  /** Relevant quick facts for their situation */
  relevantFacts: QuickFact[];

  /** AP score perceptions */
  apScorePerceptions: typeof AP_SCORE_PERCEPTIONS;

  // -------------------------------------------------------------------------
  // LLM-READY FORMAT
  // -------------------------------------------------------------------------

  /** Fully formatted context optimized for LLM consumption */
  llmFormattedContext: string;

  /** Data quality indicators */
  dataQuality: {
    hasVerifiedStatistics: boolean;
    hasMajorSpecificGuidance: boolean;
    hasSchoolSpecificStrategy: boolean;
    hasContextAdjustment: boolean;
    overallConfidence: number;
  };
}

// ============================================================================
// MAIN ASSEMBLY FUNCTION
// ============================================================================

/**
 * Assemble all relevant research for a student's academic advising session.
 *
 * This is the MAIN ENTRY POINT for getting comprehensive research context
 * to inform LLM responses.
 */
export function assembleResearchForStudent(context: StudentContext): AssembledResearch {
  // 1. Generate core research-backed guidance
  const researchBackedGuidance = generateResearchBackedGuidance({
    quantitativeAnalysis: context.quantitativeAnalysis,
    schoolContext: context.schoolContext,
    demographicContext: context.demographicContext
      ? {
          socioeconomic: {
            firstGeneration: context.demographicContext.firstGeneration,
            householdIncome: context.demographicContext.lowIncome ? 'low' : 'middle',
          },
          geographic: {
            urbanVsRural: context.demographicContext.ruralBackground ? 'rural' : 'urban',
          },
          family: {
            recentImmigrant: context.demographicContext.immigrantFamily,
          },
        }
      : undefined,
    intendedMajor: context.intendedMajor,
    targetSchools: context.targetSchools,
    testScores: context.testScores,
  });

  // 2. Get field-specific expectations
  const majorExpectations = getMajorSpecificExpectations(context.intendedMajor);

  // 3. Get relevant AP courses
  const relevantAPCourses = getRelevantAPCourses(context.intendedMajor, context.quantitativeAnalysis);

  // 4. Collect verified statistics
  const verifiedStatistics = collectVerifiedStatistics(context);

  // 5. Get college expectations
  const collegeExpectations = getCollegeExpectationsForStudent(context);

  // 6. Get admitted student profile
  const admittedProfile = context.intendedMajor ? getAdmittedProfile(context.intendedMajor) : undefined;

  // 7. Get relevant facts
  const relevantFacts = getRelevantFactsForStudent(context);

  // 8. Calculate data quality
  const dataQuality = calculateDataQuality(
    researchBackedGuidance,
    majorExpectations,
    collegeExpectations,
    verifiedStatistics
  );

  // 9. Format for LLM consumption
  const llmFormattedContext = formatForLLM({
    context,
    researchBackedGuidance,
    majorExpectations,
    relevantAPCourses,
    verifiedStatistics,
    collegeExpectations,
    admittedProfile,
    relevantFacts,
  });

  return {
    researchBackedGuidance,
    majorExpectations,
    relevantAPCourses,
    verifiedStatistics,
    collegeExpectations,
    admittedProfile,
    relevantFacts,
    apScorePerceptions: AP_SCORE_PERCEPTIONS,
    llmFormattedContext,
    dataQuality,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get field-specific expectations based on intended major
 */
function getMajorSpecificExpectations(intendedMajor?: string): AssembledResearch['majorExpectations'] | undefined {
  if (!intendedMajor) return undefined;

  const majorLower = intendedMajor.toLowerCase();
  let fieldExpectations: FieldExpectations | undefined;

  // Map intended major to field expectations
  if (majorLower.includes('computer') || majorLower.includes('cs') || majorLower.includes('software')) {
    fieldExpectations = CS_EXPECTATIONS;
  } else if (majorLower.includes('engineer') && !majorLower.includes('software')) {
    fieldExpectations = ENGINEERING_EXPECTATIONS;
  } else if (majorLower.includes('med') || majorLower.includes('bio') || majorLower.includes('health')) {
    fieldExpectations = PREMED_EXPECTATIONS;
  } else if (majorLower.includes('business') || majorLower.includes('econ') || majorLower.includes('finance')) {
    fieldExpectations = BUSINESS_EXPECTATIONS;
  } else if (
    majorLower.includes('english') ||
    majorLower.includes('history') ||
    majorLower.includes('philosophy') ||
    majorLower.includes('literature') ||
    majorLower.includes('writing')
  ) {
    fieldExpectations = HUMANITIES_EXPECTATIONS;
  }

  if (!fieldExpectations) return undefined;

  return {
    major: intendedMajor,
    tierBenchmarks: {
      expected: fieldExpectations.tierExpectations.expectedActivities,
      bonus: fieldExpectations.tierExpectations.bonusActivities,
      warningSignals: fieldExpectations.tierExpectations.warningSignals,
    },
    impactBenchmarks: {
      exceptional: fieldExpectations.impactBenchmarks.exceptional,
      strong: fieldExpectations.impactBenchmarks.strong,
      baseline: fieldExpectations.impactBenchmarks.baseline,
    },
    genuineInterestMarkers: {
      earlySignals: fieldExpectations.genuineInterestMarkers.earlySignals,
      developmentPattern: fieldExpectations.genuineInterestMarkers.developmentPattern,
      matureIndicators: fieldExpectations.genuineInterestMarkers.matureIndicators,
    },
    commonMistakes: fieldExpectations.commonMistakes,
    descriptionExpectations: {
      keyTerms: fieldExpectations.descriptionExpectations.keyTerms,
      actionVerbs: fieldExpectations.descriptionExpectations.actionVerbs,
      quantificationExamples: fieldExpectations.descriptionExpectations.quantificationExamples,
      avoidTerms: fieldExpectations.descriptionExpectations.avoidTerms,
    },
  };
}

/**
 * Get relevant AP courses for the student's major and profile
 */
function getRelevantAPCourses(
  intendedMajor?: string,
  quantAnalysis?: NuancedCapabilityAnalysis
): AssembledResearch['relevantAPCourses'] {
  const courses: AssembledResearch['relevantAPCourses'] = [];

  // Get courses relevant to their major
  const majorCourses = intendedMajor ? getCoursesForMajor(intendedMajor) : [];

  for (const { course, relevance } of majorCourses.slice(0, 5)) {
    // Get verified statistics for this course
    const apStats = getAPStatistics(course.name);
    const verifiedStatistics = apStats
      ? {
          passRate: `${(apStats.passRate.value * 100).toFixed(0)}%`,
          score5Rate: `${(apStats.fiveRate.value * 100).toFixed(0)}%`,
          citation: `${apStats.passRate.citation.source} ${apStats.passRate.citation.document}`,
        }
      : undefined;

    courses.push({
      course,
      relevanceToMajor: mapRelevanceLevel(relevance),
      verifiedStatistics,
    });
  }

  // Add courses based on their strong subjects
  if (quantAnalysis) {
    for (const [subject, pattern] of Object.entries(quantAnalysis.subjectPatterns)) {
      if (pattern.relativeStrength > 0.1) {
        // Strong subject - suggest relevant AP
        const apCourse = getAPCourseForSubject(subject as SubjectArea);
        if (apCourse && !courses.find((c) => c.course.name === apCourse.name)) {
          const apStats = getAPStatistics(apCourse.name);
          courses.push({
            course: apCourse,
            relevanceToMajor: 'recommended',
            verifiedStatistics: apStats
              ? {
                  passRate: `${(apStats.passRate.value * 100).toFixed(0)}%`,
                  score5Rate: `${(apStats.fiveRate.value * 100).toFixed(0)}%`,
                  citation: `${apStats.passRate.citation.source} ${apStats.passRate.citation.document}`,
                }
              : undefined,
          });
        }
      }
    }
  }

  return courses.slice(0, 8); // Limit to 8 most relevant
}

function mapRelevanceLevel(relevance: string): 'essential' | 'strongly_recommended' | 'recommended' | 'helpful' {
  if (relevance.includes('essential') || relevance.includes('critical')) return 'essential';
  if (relevance.includes('strongly') || relevance.includes('expected')) return 'strongly_recommended';
  if (relevance.includes('recommended')) return 'recommended';
  return 'helpful';
}

function getAPCourseForSubject(subject: SubjectArea): APCourseProfile | undefined {
  const subjectToAP: Record<SubjectArea, string> = {
    math: 'AP Calculus BC',
    science: 'AP Physics C: Mechanics',
    english: 'AP English Literature',
    social_studies: 'AP US History',
    foreign_language: 'AP Spanish Language',
    computer_science: 'AP Computer Science A',
  };

  const apName = subjectToAP[subject];
  return apName ? getAPCourse(apName) : undefined;
}

/**
 * Collect verified statistics relevant to the student
 */
function collectVerifiedStatistics(context: StudentContext): AssembledResearch['verifiedStatistics'] {
  const stats: AssembledResearch['verifiedStatistics'] = [];

  // NACAC rigor importance - find in array
  const rigorFactor = NACAC_ADMISSIONS_FACTORS.find((f) => f.factor.includes('Rigor'));
  if (rigorFactor) {
    stats.push({
      claim: 'Curriculum rigor importance',
      value: `${(rigorFactor.percentConsiderable.value * 100).toFixed(0)}% rate as "considerably important"`,
      citation: `${rigorFactor.percentConsiderable.citation.source} ${rigorFactor.percentConsiderable.citation.document}`,
      relevance: 'Validates importance of taking challenging courses',
    });

    // Add trend data if available
    if (rigorFactor.trend) {
      stats.push({
        claim: 'Rigor importance trend',
        value: rigorFactor.trend,
        citation: rigorFactor.percentConsiderable.citation.source,
        relevance: 'Rigor is increasingly valued by colleges',
      });
    }
  }

  // Add grades importance
  const gradesFactor = NACAC_ADMISSIONS_FACTORS.find((f) => f.factor.includes('Grades in College Prep'));
  if (gradesFactor) {
    stats.push({
      claim: 'Grades in college prep importance',
      value: `${(gradesFactor.percentConsiderable.value * 100).toFixed(0)}% rate as "considerably important"`,
      citation: `${gradesFactor.percentConsiderable.citation.source} ${gradesFactor.percentConsiderable.citation.document}`,
      relevance: 'Grades remain the most important factor',
    });
  }

  // Add relevant AP statistics based on major using smart resolution
  if (context.intendedMajor) {
    const targetedContext = getTargetedContext(context.intendedMajor);

    // Use the resolution service's targeted statistics instead of hardcoded lookups
    for (const stat of targetedContext.relevantStatistics.slice(0, 5)) {
      const apStats = AP_EXAM_STATISTICS[stat.examName];
      if (apStats) {
        stats.push({
          claim: `${stat.examName} performance`,
          value: `${(stat.passRate * 100).toFixed(0)}% pass rate, ${(stat.fiveRate * 100).toFixed(0)}% score 5`,
          citation: stat.citation,
          relevance: `Relevant course for ${context.intendedMajor} applicants`,
        });
      }
    }

    // Add relevant verified guidance statements
    for (const guidanceItem of targetedContext.relevantGuidance) {
      stats.push({
        claim: guidanceItem.key,
        value: guidanceItem.statement,
        citation: guidanceItem.citation,
        relevance: `Research-backed guidance for ${context.intendedMajor}`,
      });
    }
  }

  // Add CDS data for target schools
  if (context.targetSchools?.length) {
    const stanfordCDS = COLLEGE_CDS_DATA.stanford;
    if (stanfordCDS?.factors?.rigorOfCurriculum) {
      stats.push({
        claim: 'Stanford rigor rating',
        value: stanfordCDS.factors.rigorOfCurriculum.value,
        citation: stanfordCDS.factors.rigorOfCurriculum.citation.document,
        relevance: 'Elite schools rate curriculum rigor as "very important"',
      });
    }
  }

  return stats;
}

/**
 * Get college expectations for the student's target tier
 */
function getCollegeExpectationsForStudent(context: StudentContext): AssembledResearch['collegeExpectations'] | undefined {
  // Determine target tier based on GPA and schools
  // B1 fix: NuancedCapabilityAnalysis has no overallGPA property — calculate from subjectPatterns
  const patterns = Object.values(context.quantitativeAnalysis.subjectPatterns);
  const overallGPA = patterns.length > 0
    ? patterns.reduce((sum, p) => sum + p.performanceHistory.avgGPA, 0) / patterns.length
    : 3.5;
  let tier: string;

  // C1: Recalibrated tier thresholds (CDS 2024-2025 verified)
  if (overallGPA >= 3.9 || context.targetSchools?.some((s) => s.toLowerCase().includes('harvard') || s.toLowerCase().includes('stanford'))) {
    tier = 'ivy_elite';
  } else if (overallGPA >= 3.8) {
    tier = 'highly_selective';
  } else if (overallGPA >= 3.6) {
    tier = 'selective';
  } else if (overallGPA >= 3.2) {
    tier = 'competitive';
  } else {
    tier = 'accessible';
  }

  // Get major-specific expectations using smart resolution
  let majorSpecificExpectations: MajorSpecificExpectation | undefined;
  if (context.intendedMajor) {
    const resolved = resolveStudentInterest(context.intendedMajor);
    majorSpecificExpectations = resolved?.matched;
  }

  return {
    tier,
    gpaRange: tier === 'ivy_elite' ? '3.9-4.0+ (unweighted)' : tier === 'highly_selective' ? '3.7-3.9' : '3.3-3.7',
    apCourseRange: tier === 'ivy_elite' ? '8-12 AP courses' : tier === 'highly_selective' ? '5-8 AP courses' : '3-5 AP courses',
    apScoreExpectations: tier === 'ivy_elite' ? '4s and 5s expected' : tier === 'highly_selective' ? '4s preferred' : '3s acceptable',
    majorSpecificExpectations,
  };
}

/**
 * Get relevant quick facts based on student situation
 */
function getRelevantFactsForStudent(context: StudentContext): QuickFact[] {
  const tags: string[] = [];

  // Add tags based on context using smart resolution
  if (context.intendedMajor) {
    const resolved = resolveStudentInterest(context.intendedMajor);
    if (resolved) {
      const majorLower = resolved.matched.major.toLowerCase();
      const parentLower = resolved.parent?.major.toLowerCase() || '';

      // Generate tags from the resolved major and its parent
      if (majorLower.includes('computer science') || majorLower.includes('software')) {
        tags.push('cs', 'bc', 'calculus');
      }
      if (majorLower.includes('engineering') || parentLower.includes('engineering')) {
        tags.push('engineering', 'physics');
      }
      if (majorLower.includes('med') || majorLower.includes('bio') || majorLower.includes('nursing')) {
        tags.push('premed', 'bio', 'chem');
      }
      if (majorLower.includes('business') || majorLower.includes('finance') || majorLower.includes('accounting') || majorLower.includes('marketing') || parentLower.includes('business')) {
        tags.push('business');
      }
      if (majorLower.includes('physics') || majorLower.includes('math')) {
        tags.push('physics', 'calculus');
      }
      if (majorLower.includes('history') || majorLower.includes('humanities') || majorLower.includes('english')) {
        tags.push('humanities');
      }
    }
  }

  // Add general tags
  tags.push('rigor', 'nacac');

  // Check for specific situations
  const trajectory = context.quantitativeAnalysis.progressionTrajectory.historical.overallTrend;
  if (trajectory === 'improving') tags.push('trajectory', 'improve');
  if (trajectory === 'declining') tags.push('trajectory');

  return findRelevantFacts(tags, 5);
}

/**
 * Calculate data quality indicators
 */
function calculateDataQuality(
  guidance: ResearchBackedGuidance,
  majorExpectations: AssembledResearch['majorExpectations'] | undefined,
  collegeExpectations: AssembledResearch['collegeExpectations'] | undefined,
  verifiedStats: AssembledResearch['verifiedStatistics']
): AssembledResearch['dataQuality'] {
  return {
    hasVerifiedStatistics: verifiedStats.length > 0,
    hasMajorSpecificGuidance: !!majorExpectations,
    hasSchoolSpecificStrategy: guidance.schoolStrategies.length > 0,
    hasContextAdjustment: guidance.contextAwareRecommendations.length > 0,
    overallConfidence: guidance.confidence,
  };
}

/**
 * Format assembled research for LLM consumption
 *
 * DESIGN PRINCIPLES:
 * 1. FOCUS ON ACADEMICS - No extracurriculars, competitions, or activities (USACO, GitHub, etc.)
 * 2. DEEP COURSE KNOWLEDGE - Challenge factors, success strategies, fears, readiness indicators
 * 3. MAJOR-AWARE - Prioritize courses that matter for their specific major
 * 4. COMPREHENSIVE - Give the LLM everything it needs to provide expert-level academic guidance
 * 5. ACTIONABLE - Include specific, practical information the LLM can use
 */
function formatForLLM(data: {
  context: StudentContext;
  researchBackedGuidance: ResearchBackedGuidance;
  majorExpectations: AssembledResearch['majorExpectations'] | undefined;
  relevantAPCourses: AssembledResearch['relevantAPCourses'];
  verifiedStatistics: AssembledResearch['verifiedStatistics'];
  collegeExpectations: AssembledResearch['collegeExpectations'] | undefined;
  admittedProfile: AdmittedStudentProfile | undefined;
  relevantFacts: QuickFact[];
}): string {
  const sections: string[] = [];
  const majorName = data.context.intendedMajor || 'Undeclared';

  // =========================================================================
  // SECTION 1: CALIBRATED ACADEMIC ASSESSMENT
  // =========================================================================
  const assessment = data.researchBackedGuidance.academicAssessment;
  sections.push(`## CALIBRATED ACADEMIC ASSESSMENT

**Overall Calibration:**
- Harvard-Scale Rating: ${assessment.calibratedRating}/6 (adjusted for school context)
- Contextual Percentile: Top ${100 - assessment.contextualPercentile}% within their school type
- GPA Interpretation: A ${data.context.quantitativeAnalysis?.performanceFingerprint?.expectedGPAs?.honors?.toFixed(2) || 'N/A'} at this school type is equivalent to approximately ${(data.context.quantitativeAnalysis?.performanceFingerprint?.expectedGPAs?.honors || 0) + (data.context.schoolContext?.type === 'elite_prep' ? 0.2 : data.context.schoolContext?.type === 'competitive_magnet' ? 0.15 : 0)}/4.0 at an average public school

**Course Rigor Assessment:**
- Current Rigor Level: ${assessment.rigorAssessment.level.toUpperCase()}
- Rigor Maximization: ${assessment.rigorAssessment.maximization}% of available rigor being taken
- Missing Critical Courses: ${assessment.rigorAssessment.missingCriticalCourses.length > 0 ? assessment.rigorAssessment.missingCriticalCourses.join(', ') : 'None identified yet'}
- AO Recommendation: ${assessment.rigorAssessment.recommendation}

**Grade Trajectory Analysis:**
- Pattern: ${assessment.trajectoryAssessment.pattern}
- How Admissions Officers Interpret This: "${assessment.trajectoryAssessment.aoInterpretation}"
- Strategic Impact: ${assessment.trajectoryAssessment.impact}`);

  // =========================================================================
  // SECTION 2: MAJOR-SPECIFIC COURSE REQUIREMENTS (Academic Focus)
  // =========================================================================
  if (data.admittedProfile) {
    sections.push(`## COURSE REQUIREMENTS FOR ${majorName.toUpperCase()} APPLICANTS

**Essential Courses (Admissions officers expect to see these):**
${data.admittedProfile.expectedCourses
  .filter(c => c.expectationLevel === 'essential')
  .map(c => `- **${c.course}**: ${c.reasoning}`)
  .join('\n')}

**Strongly Expected Courses:**
${data.admittedProfile.expectedCourses
  .filter(c => c.expectationLevel === 'strongly_expected')
  .map(c => `- **${c.course}**: ${c.reasoning}`)
  .join('\n')}

**Recommended Courses (Shows depth but not required):**
${data.admittedProfile.expectedCourses
  .filter(c => c.expectationLevel === 'recommended' || c.expectationLevel === 'helpful')
  .slice(0, 3)
  .map(c => `- ${c.course}: ${c.reasoning}`)
  .join('\n')}

**Key Admissions Insight:** ${data.admittedProfile.keyInsight}

**Verified Course Expectations:**
${data.admittedProfile.verifiedFacts?.slice(0, 4).map(f => `- ${f}`).join('\n') || 'See verified statistics section'}`);
  }

  // =========================================================================
  // SECTION 3: DEEP COURSE PROFILES (The Core Academic Knowledge)
  // =========================================================================
  if (data.relevantAPCourses.length > 0) {
    // Get the top 4 most relevant courses and pull FULL profiles
    const topCourses = data.relevantAPCourses.slice(0, 4);

    const courseDetails = topCourses.map(({ course, relevanceToMajor, verifiedStatistics }) => {
      const profile = course;
      return `
### ${profile.name} (${relevanceToMajor} for ${majorName})

**Quick Stats:**
- Difficulty: ${profile.perceivedDifficulty} (Tier ${profile.difficultyTier}/5)
- Weekly Time Commitment: ${profile.weeklyHours.minimum}-${profile.weeklyHours.intensive} hours (typical: ~${profile.weeklyHours.typical} hrs/week)
${verifiedStatistics ? `- Pass Rate: ${verifiedStatistics.passRate} | Score 5 Rate: ${verifiedStatistics.score5Rate} (${verifiedStatistics.citation})` : `- Pass Rate: ${formatPassRate(profile.passRate)} | Score 5 Rate: ${formatPassRate(profile.fiveRate)}`}

**What Makes This Course Challenging:**
${profile.challengeFactors.map(f => `- ${f}`).join('\n')}

**How Students Succeed in This Course:**
${profile.successStrategies.map(s => `- ${s}`).join('\n')}

**Prerequisites & Preparation:**
- Required Background: ${profile.prerequisites.join(', ')}
- Ideal Preparation: ${profile.idealPreparation}

**Common Fears (With Reality Checks):**
${profile.commonFears.slice(0, 2).map(f => `
*Fear:* "${f.fear}"
*Reality:* ${f.reality}
*Advice:* ${f.advice}`).join('\n')}

**Readiness Indicators:**
*Signs They're Ready:*
${profile.readinessIndicators.ready.map(r => `- ${r}`).join('\n')}

*Signs They're NOT Ready (Be honest about these):*
${profile.readinessIndicators.notReady.map(r => `- ${r}`).join('\n')}

**Ideal Student Profile:** ${profile.idealStudentProfile}

**Course Pairings:**
- Works Well With: ${profile.pairsWellWith.join(', ')}
- Avoid Taking Simultaneously With: ${profile.avoidTakingWith.length > 0 ? profile.avoidTakingWith.join(', ') : 'No major conflicts'}

**College Credit:** Typically ${profile.typicalCredits} credits | Natural Progression: ${profile.naturalProgression || 'College-level continuation'}`;
    }).join('\n\n---\n');

    sections.push(`## DEEP COURSE PROFILES (Use This for Detailed Academic Guidance)

The following courses are prioritized for ${majorName} applicants. Use this detailed knowledge when discussing course selection, addressing fears, or assessing readiness.
${courseDetails}`);
  }

  // =========================================================================
  // SECTION 4: VERIFIED STATISTICS (Citable Data Only)
  // =========================================================================
  if (data.verifiedStatistics.length > 0) {
    sections.push(`## VERIFIED STATISTICS (Safe to Cite)

These statistics come from official sources and can be cited directly:

${data.verifiedStatistics.map(s => `**${s.claim}**
- Value: ${s.value}
- Source: ${s.citation}
- Why It Matters: ${s.relevance}`).join('\n\n')}`);
  }

  // =========================================================================
  // SECTION 5: COURSE LOAD GUIDANCE BY GRADE
  // =========================================================================
  const gradeNum = data.context.currentGrade as 9 | 10 | 11 | 12;
  const loadGuidance = getLoadGuidance(gradeNum, data.context.schoolContext?.type || 'average_public');

  if (loadGuidance) {
    sections.push(`## COURSE LOAD GUIDANCE (Grade ${gradeNum})

**Typical AP/Honors Load for Grade ${gradeNum} at ${data.context.schoolContext?.type?.replace(/_/g, ' ') || 'their school type'}:**
- Minimum Expected: ${loadGuidance.rigorousCourses.minimum} rigorous courses
- Typical Load: ${loadGuidance.rigorousCourses.typical} rigorous courses
- Ambitious but Achievable: ${loadGuidance.rigorousCourses.ambitious} rigorous courses
- Maximum Recommended: ${loadGuidance.rigorousCourses.maximum} rigorous courses

**Grade-Specific Notes:**
${loadGuidance.notes.map(n => `- ${n}`).join('\n')}`);
  }

  // =========================================================================
  // SECTION 6: COLLEGE TIER EXPECTATIONS (Academic Focus)
  // =========================================================================
  if (data.collegeExpectations) {
    sections.push(`## COLLEGE TIER EXPECTATIONS (${data.collegeExpectations.tier.replace(/_/g, ' ').toUpperCase()})

**Academic Benchmarks:**
- Expected GPA Range: ${data.collegeExpectations.gpaRange}
- Expected AP Course Count: ${data.collegeExpectations.apCourseRange}
- AP Score Expectations: ${data.collegeExpectations.apScoreExpectations}

**For ${majorName} Specifically:**
${data.collegeExpectations.majorSpecificExpectations ? `
- Key Courses: ${data.collegeExpectations.majorSpecificExpectations.coreCourses?.slice(0, 4).join(', ') || 'See course requirements above'}
- Differentiating Factor: ${data.collegeExpectations.majorSpecificExpectations.differentiatingFactor || 'Taking the most rigorous path available'}` : 'See major-specific course requirements above'}`);
  }

  // =========================================================================
  // SECTION 7: CONTEXT-AWARE ADJUSTMENTS
  // =========================================================================
  if (data.researchBackedGuidance.contextAwareRecommendations.length > 0) {
    sections.push(`## CONTEXT-SPECIFIC RECOMMENDATIONS

Based on this student's specific circumstances:

${data.researchBackedGuidance.contextAwareRecommendations
  .slice(0, 4)
  .map(r => `**${r.factor}** (Impact: ${r.impact})
- Recommendation: ${r.recommendation}
- Research Basis: ${r.researchBasis}`)
  .join('\n\n')}`);
  }

  // =========================================================================
  // SECTION 8: QUICK REFERENCE FACTS (Academic Only)
  // =========================================================================
  // Filter to only academic-related facts
  const academicFacts = data.relevantFacts.filter(f =>
    f.category === 'ap_score' ||
    f.category === 'consequence' ||
    f.tags.some(t => ['rigor', 'gpa', 'course', 'ap', 'grades', 'trajectory'].includes(t.toLowerCase()))
  );

  if (academicFacts.length > 0) {
    sections.push(`## QUICK REFERENCE FACTS (Academic)

${academicFacts.slice(0, 6).map(f => `- ${f.fact} ${f.source ? `(Source: ${f.source})` : ''}`).join('\n')}`);
  }

  // =========================================================================
  // SECTION 9: CITATION & ACCURACY GUIDELINES
  // =========================================================================
  sections.push(`## RESPONSE GUIDELINES

**When Citing Statistics:**
- AP exam data: "College Board 2024 data shows..."
- Admissions factors: "NACAC 2023 research indicates..."
- College expectations: "Per [College]'s Common Data Set..."

**DO NOT:**
- Make up percentages like "X% of admits took Y course" (colleges don't publish this)
- Fabricate specific statistics without sources
- Cite extracurricular benchmarks (this system focuses on academics/coursework)

**DO:**
- Use the deep course knowledge above to address specific fears and concerns
- Reference the readiness indicators when assessing if a student should take a course
- Cite verified statistics when discussing pass rates, rigor importance, etc.
- Use qualitative language when data isn't available: "selective colleges generally expect..." rather than fake numbers`);

  return sections.join('\n\n' + '='.repeat(80) + '\n\n');
}

// ============================================================================
// EXPORTS
// ============================================================================

export const unifiedResearchAssemblyService = {
  assembleResearchForStudent,
};

// Quick access functions
export { getMajorSpecificExpectations, getRelevantAPCourses, collectVerifiedStatistics };
