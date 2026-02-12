/**
 * Deep Academic Report Module
 *
 * Phase 3: Complete modular replacement for the monolith.
 * Provides the full report generation pipeline:
 * - Context assembly and tier calibration
 * - 5 section generators (identity, challenges, roadmap, research, bottom line)
 * - Post-processing validation
 * - Template fallback for LLM failure resilience
 * - Orchestrator that ties everything together
 */

export { generateDeepAcademicReport, getOrGenerateDeepAcademicReport } from './orchestrator';
export { assembleEnrichedContext } from './context/contextAssembly';
export {
  calculateTierPosition,
  calculateOverallGPA,
  getTierForGPA,
  COLLEGE_TIER_BENCHMARKS,
  getMajorDisclaimer,
  formatSubject,
  type TierInfo,
} from './context/tierCalibration';
export type { EnrichedReportContext } from './types';
export * from './types';
