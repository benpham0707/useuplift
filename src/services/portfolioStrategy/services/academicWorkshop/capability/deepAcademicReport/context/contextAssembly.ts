/**
 * Context Assembly Module
 *
 * Extracted from deepAcademicReportService.ts (Phase 2 refactoring).
 * Replaces the monolith's assembleContext() method with an enriched version
 * that pre-routes data into section-specific packages.
 *
 * Makes the SAME 3 upstream calls:
 * 1. extractProfileInsights() - deep qualitative insights
 * 2. assembleResearchForStudent() - verified research data
 * 3. generateAcademicPlanningAdvice() - course/workload/major advice
 *
 * Then adds enhanced data routing for section-specific consumption.
 */

import {
  extractProfileInsights,
  type StudentProfile,
} from '../../conversational/insightDrivenAdvisor';

import {
  assembleResearchForStudent,
  type StudentContext,
} from '../../conversational/unifiedResearchAssemblyService';

import {
  generateAcademicPlanningAdvice,
  type AcademicPlanningInput,
} from '../../conversational/academicPlanningAdvisor';

import {
  resolveStudentInterest,
} from '../../conversational/majorResolutionService';

import type { DeepAcademicReportInput } from '../../deepAcademicReportTypes';
import type { EnrichedReportContext } from '../types';

import {
  calculateOverallGPA,
  calculateTierPosition,
  getMajorDisclaimer,
} from './tierCalibration';

// ============================================================================
// MAIN ASSEMBLY FUNCTION
// ============================================================================

/**
 * Assemble enriched context from all upstream services.
 *
 * This function makes the same 3 upstream calls as the original monolith's
 * assembleContext() method, then routes data into section-specific packages
 * for cleaner consumption by report generators.
 *
 * All upstream calls are synchronous (no LLM, ~5ms total).
 */
export function assembleEnrichedContext(input: DeepAcademicReportInput): EnrichedReportContext {
  // =========================================================================
  // Step 1: Make the same 3 upstream calls as the original monolith
  // =========================================================================

  // 1. Profile insights from insightDrivenAdvisor
  const studentProfile: StudentProfile = {
    quantitativeAnalysis: input.quantitativeAnalysis,
    intendedMajor: input.intendedMajor,
    currentGrade: input.currentGrade,
    schoolContext: {
      type: input.schoolContext.type,
    },
  };
  const profileInsights = extractProfileInsights(studentProfile);

  // 2. Assembled research from unifiedResearchAssemblyService
  const studentContext: StudentContext = {
    quantitativeAnalysis: input.quantitativeAnalysis,
    intendedMajor: input.intendedMajor,
    currentGrade: input.currentGrade,
    // R15: Pass target schools to upstream research service for school-specific context
    targetSchools: input.targetSchools,
    schoolContext: input.schoolContext.apCoursesAvailable
      ? { type: input.schoolContext.type, apCoursesAvailable: input.schoolContext.apCoursesAvailable }
      : { type: input.schoolContext.type },
  };
  const assembledResearch = assembleResearchForStudent(studentContext);

  // 3. Planning advice from academicPlanningAdvisor
  const planningInput: AcademicPlanningInput = {
    quantitativeAnalysis: input.quantitativeAnalysis,
    intendedMajor: input.intendedMajor,
    currentGrade: input.currentGrade,
    schoolContext: {
      type: input.schoolContext.type,
      // V7: Pass through actual school data instead of hardcoding empty arrays
      apCoursesAvailable: input.schoolContext.apCoursesAvailable
        ? (Array.isArray(input.schoolContext.apCoursesAvailable) ? input.schoolContext.apCoursesAvailable : [])
        : [],
      honorsCoursesAvailable: [],
      dualEnrollmentAvailable: false,
    },
  };
  const planningAdvice = generateAcademicPlanningAdvice(planningInput);

  // =========================================================================
  // Step 2: Calculate derived values
  // =========================================================================

  const overallGPA = calculateOverallGPA(input.quantitativeAnalysis);
  const tierPosition = calculateTierPosition(input.quantitativeAnalysis);
  const majorDisclaimer = getMajorDisclaimer(input.intendedMajor);

  // =========================================================================
  // Step 3: Extract and route section-specific data
  // =========================================================================

  // --- forIdentity ---
  // Flatten genuineInterestMarkers from { earlySignals, developmentPattern, matureIndicators } to string[]
  const genuineInterestMarkersRaw = assembledResearch.majorExpectations?.genuineInterestMarkers;
  const genuineInterestMarkers: string[] = genuineInterestMarkersRaw
    ? [
        ...genuineInterestMarkersRaw.earlySignals,
        ...genuineInterestMarkersRaw.developmentPattern,
        ...genuineInterestMarkersRaw.matureIndicators,
      ]
    : [];

  // --- forChallenges ---
  const commonMistakes = assembledResearch.majorExpectations?.commonMistakes ?? [];
  const verifiedStats = assembledResearch.verifiedStatistics;
  const courseRecommendations = planningAdvice.courseRecommendations;

  // --- forRoadmap ---
  const expectedCourses = assembledResearch.admittedProfile?.expectedCourses ?? [];
  const trajectoryActionItems = planningAdvice.trajectoryAssessment?.actionItems ?? [];

  // --- forResearch ---
  // Extract all student AP courses by iterating ALL subjectPatterns
  const allStudentAPCourses: Array<{ name: string; grade: number; level: string }> = [];
  for (const pattern of Object.values(input.quantitativeAnalysis.subjectPatterns)) {
    for (const course of pattern.performanceHistory.courses) {
      if (course.level === 'ap' || course.level === 'ib') {
        allStudentAPCourses.push({
          name: course.name,
          grade: course.grade,
          level: course.level,
        });
      }
    }
  }

  // Major requirements from resolution service
  let majorRequirements: EnrichedReportContext['forResearch']['majorRequirements'];
  if (input.intendedMajor) {
    const resolved = resolveStudentInterest(input.intendedMajor);
    if (resolved) {
      majorRequirements = {
        major: resolved.matched.major,
        minimumCourses: resolved.mergedRequirements.minimum,
        competitiveCourses: resolved.mergedRequirements.competitive,
        beyondCourses: resolved.mergedBeyondCourses,
      };
    }
  }

  const relevantAPCourses = assembledResearch.relevantAPCourses;

  // =========================================================================
  // Step 4: Build enriched context
  // =========================================================================

  return {
    quantitativeAnalysis: input.quantitativeAnalysis,
    overallGPA,
    tierPosition,
    majorDisclaimer,
    input,

    forIdentity: {
      profileInsightsFull: profileInsights,
      genuineInterestMarkers,
      synthesis: input.quantitativeAnalysis.synthesis,
      // R19: Surface calibrated rating and rigor assessment
      calibratedRating: assembledResearch.researchBackedGuidance?.academicAssessment?.calibratedRating,
      rigorAssessment: assembledResearch.researchBackedGuidance?.academicAssessment?.rigorAssessment,
      // R21: Surface key insight about admitted students for identity section
      admittedProfileKeyInsight: assembledResearch.admittedProfile?.keyInsight,
    },

    forChallenges: {
      commonMistakes,
      verifiedStats,
      courseRecommendations,
    },

    forRoadmap: {
      expectedCourses,
      trajectoryActionItems,
      planningAdvice,
    },

    forResearch: {
      allStudentAPCourses,
      majorRequirements,
      relevantAPCourses,
    },

    // R16: Surface llmFormattedContext from assembled research
    llmFormattedContext: assembledResearch.llmFormattedContext,

    // Full upstream outputs for fallback compatibility
    assembledResearch,
    planningAdvice,
    profileInsights,
  };
}
