/**
 * Academic Experience Analysis - Index
 *
 * Exports the comprehensive academic history analysis system.
 *
 * This module provides deep, actionable analysis of academic records:
 * - How admissions officers will evaluate the transcript
 * - What the GPA and course selections mean in context
 * - Where the student stands competitively
 * - Red flags and how to address them
 * - Specific guidance for Additional Info, counselor letters, interviews
 *
 * Usage:
 * ```typescript
 * import { generateAcademicHistoryReport } from './experience';
 *
 * const result = await generateAcademicHistoryReport(input, heuristics, 'ivy_plus');
 * if (result.success) {
 *   console.log(result.report.executiveSummary.oneSentenceRead);
 *   console.log(result.report.admissionsOfficerPerspective.firstImpression);
 * }
 * ```
 */

// Main Report Generator
export {
  AcademicHistoryReportGenerator,
  academicHistoryReportGenerator,
  generateAcademicHistoryReport,
  type AnalysisReportResult,
  type AcademicHistoryReport,
  // Section types
  type GPAAnalysis,
  type GradeDistribution,
  type RigorEvaluation,
  type APAnalysis,
  type MajorPreparation,
  type SubjectDepth,
  type RedFlagsAndConcerns,
  type DetectedIssue,
  type AdmissionsOfficerPerspective,
  type AOQuestion,
  type ActionableGuidance,
  type ResearchContext,
  type ResearchDataPoint,
} from './academicHistoryReport';

// Supporting analyzers (can be used independently if needed)
export {
  SpikeNarrativeAnalyzer,
  spikeNarrativeAnalyzer,
  analyzeSpikeAndNarrative,
  type SpikeNarrativeResult,
} from './spikeNarrativeAnalyzer';

export {
  YearSubjectAnalyzer,
  yearSubjectAnalyzer,
  analyzeYearsAndSubjects,
  type YearSubjectResult,
} from './yearSubjectAnalyzer';

// All types from types.ts (for those who need granular types)
export * from './types';
