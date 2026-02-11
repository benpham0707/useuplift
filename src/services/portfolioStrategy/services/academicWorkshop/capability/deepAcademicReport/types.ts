/**
 * Deep Academic Report Types
 *
 * Re-exports all types from the parent module and adds new types
 * for the Phase 2 enriched context assembly.
 */

// Re-export all types from the parent types file
export * from '../deepAcademicReportTypes';
export { UPLIFT_SCALE_DATABASE } from '../deepAcademicReportTypes';

// Re-export TierInfo from the tier calibration module
export type { TierInfo } from './context/tierCalibration';

// ============================================================================
// NEW: Enriched Report Context
// ============================================================================

import type { NuancedCapabilityAnalysis } from '../nuancedCapabilityAnalyzer';
import type { ProfileInsight } from '../conversational/insightDrivenAdvisor';
import type { AssembledResearch } from '../conversational/unifiedResearchAssemblyService';
import type { AcademicPlanningAdvice } from '../conversational/academicPlanningAdvisor';
import type { DeepAcademicReportInput, CollegeTierPosition } from '../deepAcademicReportTypes';

/**
 * Enriched context assembled from all upstream services,
 * pre-routed into section-specific data packages.
 *
 * This replaces the flat AssembledReportContext with a structure
 * that makes it clear which data feeds which report section.
 */
export interface EnrichedReportContext {
  /** Raw quantitative analysis */
  quantitativeAnalysis: NuancedCapabilityAnalysis;

  /** Calculated overall GPA */
  overallGPA: number;

  /** Pre-calculated tier position */
  tierPosition: CollegeTierPosition;

  /** Major competitiveness disclaimer (if applicable) */
  majorDisclaimer?: string;

  /** Original input */
  input: DeepAcademicReportInput;

  /** Section-specific data packages */
  forIdentity: {
    profileInsightsFull: ProfileInsight[];
    genuineInterestMarkers: string[];
    synthesis: NuancedCapabilityAnalysis['synthesis'];
    // R19: Surface research-backed guidance for richer identity narrative
    calibratedRating?: number;
    rigorAssessment?: { level: string; maximization: number; missingCriticalCourses: string[]; recommendation: string };
    // R21: Surface key insight about admitted students for identity section
    admittedProfileKeyInsight?: string;
  };

  forChallenges: {
    commonMistakes: Array<{ mistake: string; whyItHurts: string; howToFix: string }>;
    verifiedStats: AssembledResearch['verifiedStatistics'];
    courseRecommendations: AcademicPlanningAdvice['courseRecommendations'];
  };

  forRoadmap: {
    expectedCourses: Array<{ course: string; expectationLevel: string; reasoning: string }>;
    trajectoryActionItems: string[];
    planningAdvice: AcademicPlanningAdvice;
  };

  forResearch: {
    allStudentAPCourses: Array<{ name: string; grade: number; level: string }>;
    majorRequirements?: {
      major: string;
      minimumCourses: string[];
      competitiveCourses: string[];
      beyondCourses: string[];
    };
    relevantAPCourses: AssembledResearch['relevantAPCourses'];
  };

  // R16: Surface the rich LLM-formatted research context
  llmFormattedContext?: string;

  /** Full upstream service outputs (for template fallback compatibility) */
  assembledResearch: AssembledResearch;
  planningAdvice: AcademicPlanningAdvice;
  profileInsights: ProfileInsight[];
}
