/**
 * Tier Calibration Module
 *
 * Extracted from deepAcademicReportService.ts (Phase 2 refactoring).
 * Contains GPA-to-college-tier mapping, tier position calculation,
 * and related helper functions.
 *
 * These benchmarks are calibrated with CDS 2024-2025 verified data.
 */

import type { NuancedCapabilityAnalysis } from '../../nuancedCapabilityAnalyzer';
import type { CollegeTierPosition } from '../../deepAcademicReportTypes';
import { resolveStudentInterest } from '../../conversational/majorResolutionService';

// ============================================================================
// TYPES
// ============================================================================

export interface TierInfo {
  name: string;
  examples: string[];
  gpaRange: string;
  median: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// C1+C4: Recalibrated with CDS 2024-2025 verified data (see docs/AUDIT_RUBRIC_TIER_FINDINGS.md)
export const COLLEGE_TIER_BENCHMARKS: TierInfo[] = [
  { name: 'Ivy/Elite (Top 10)', examples: ['Harvard', 'Stanford', 'MIT', 'Princeton', 'Yale', 'Columbia'], gpaRange: '3.90-4.0', median: 3.96 },
  { name: 'Highly Selective (Top 10-25)', examples: ['Northwestern', 'UCLA', 'UC Berkeley', 'Carnegie Mellon', 'Georgetown', 'Georgia Tech'], gpaRange: '3.80-3.89', median: 3.88 },
  { name: 'Selective (Top 25-60)', examples: ['Boston University', 'UT Austin', 'Purdue', 'Ohio State', 'UMass Amherst', 'UW-Madison'], gpaRange: '3.60-3.79', median: 3.72 },
  { name: 'Competitive (Top 60-150)', examples: ['Arizona State', 'Iowa State', 'University of Oregon', 'Temple University'], gpaRange: '3.20-3.59', median: 3.40 },
  { name: 'Accessible', examples: ['Community colleges', 'Open admission institutions'], gpaRange: '2.00-3.19', median: 2.80 },
];

// ============================================================================
// HELPER: Calculate Overall GPA from Subject Patterns
// ============================================================================

export function calculateOverallGPA(analysis: NuancedCapabilityAnalysis): number {
  const patterns = Object.values(analysis.subjectPatterns);
  if (patterns.length === 0) return 3.5;
  const total = patterns.reduce((sum, p) => sum + p.performanceHistory.avgGPA, 0);
  return total / patterns.length;
}

// ============================================================================
// HELPER: Format Subject Name
// ============================================================================

export function formatSubject(subject: string): string {
  return subject
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ============================================================================
// HELPER: Map GPA to College Tier
// ============================================================================

// V5: Soften tier boundary cliff edges — add nearBoundary note when within tolerance
export function getTierForGPA(gpa: number): TierInfo & { nearBoundary?: string } {
  const tiers = COLLEGE_TIER_BENCHMARKS;
  const BOUNDARY_TOLERANCE = 0.03;

  if (gpa >= 3.90) return tiers[0];
  if (gpa >= 3.90 - BOUNDARY_TOLERANCE) return { ...tiers[1], nearBoundary: `Just ${(3.90 - gpa).toFixed(2)} points below Ivy/Elite threshold — at the very top of Highly Selective` };
  if (gpa >= 3.80) return tiers[1];
  if (gpa >= 3.80 - BOUNDARY_TOLERANCE) return { ...tiers[2], nearBoundary: `Just ${(3.80 - gpa).toFixed(2)} points below Highly Selective — at the top of Selective range` };
  if (gpa >= 3.60) return tiers[2];
  if (gpa >= 3.60 - BOUNDARY_TOLERANCE) return { ...tiers[3], nearBoundary: `Just ${(3.60 - gpa).toFixed(2)} points below Selective — at the top of Competitive range` };
  if (gpa >= 3.20) return tiers[3];
  return tiers[4];
}

// ============================================================================
// HELPER: Calculate Tier Position
// ============================================================================

export function calculateTierPosition(analysis: NuancedCapabilityAnalysis): CollegeTierPosition {
  const overallGPA = calculateOverallGPA(analysis);
  const currentTierInfo = getTierForGPA(overallGPA);

  // Find strongest and weakest subject GPAs
  const subjectGPAs = Object.entries(analysis.subjectPatterns)
    .map(([subj, p]) => ({ subject: formatSubject(subj), gpa: p.performanceHistory.avgGPA }))
    .sort((a, b) => b.gpa - a.gpa);

  const strongest = subjectGPAs[0];
  const weakest = subjectGPAs[subjectGPAs.length - 1];

  const strengthTierInfo = strongest ? getTierForGPA(strongest.gpa) : undefined;
  const weaknessTierInfo = weakest ? getTierForGPA(weakest.gpa) : undefined;

  // Calculate what GPA they'd need for the next tier up
  // V5: Use findIndex by name since getTierForGPA may return a spread copy with nearBoundary
  const currentTierIndex = COLLEGE_TIER_BENCHMARKS.findIndex(t => t.name === currentTierInfo.name);
  const nextTierUp = currentTierIndex > 0 ? COLLEGE_TIER_BENCHMARKS[currentTierIndex - 1] : null;

  // V5: Include nearBoundary note in gpaPosition when GPA is near a tier threshold
  const baseGpaPosition = `Your ${overallGPA.toFixed(2)} GPA places you in ${currentTierInfo.name} range (${currentTierInfo.gpaRange})`;
  const gpaPosition = currentTierInfo.nearBoundary
    ? `${baseGpaPosition}. ${currentTierInfo.nearBoundary}`
    : baseGpaPosition;

  return {
    currentTier: currentTierInfo.name,
    tierExamples: currentTierInfo.examples,
    gpaPosition,
    // V5: Compare by name since getTierForGPA may return spread copies
    strengthTier: strongest && strengthTierInfo && strengthTierInfo.name !== currentTierInfo.name
      ? `Your ${strongest.subject} GPA (${strongest.gpa.toFixed(2)}) would place you in ${strengthTierInfo.name} range (${strengthTierInfo.examples.slice(0, 3).join(', ')})`
      : undefined,
    weaknessTier: weakest && weaknessTierInfo && weaknessTierInfo.name !== currentTierInfo.name
      ? `Your ${weakest.subject} GPA (${weakest.gpa.toFixed(2)}) pulls you toward ${weaknessTierInfo.name} range`
      : undefined,
    tierGap: nextTierUp
      ? `To reach ${nextTierUp.name}, you need ${parseFloat(nextTierUp.gpaRange.split('-')[0]).toFixed(2)}+ overall GPA (currently ${(parseFloat(nextTierUp.gpaRange.split('-')[0]) - overallGPA).toFixed(2)} points away)`
      : `You are in the top tier — maintain or improve your current performance`,
  };
}

// ============================================================================
// HELPER: Major Competitiveness Disclaimer
// ============================================================================

export function getMajorDisclaimer(intendedMajor: string | undefined): string | undefined {
  if (!intendedMajor) return undefined;
  const resolved = resolveStudentInterest(intendedMajor);
  if (!resolved) return undefined;
  const majorName = resolved.matched.major;
  const competitiveMajors = ['Computer Science', 'Engineering', 'Business / Economics', 'Nursing'];
  const isCompetitive = competitiveMajors.some(cm =>
    majorName === cm || resolved.matched.specializationOf === cm
  );
  if (!isCompetitive) return undefined;
  return `Note: ${majorName} programs at selective schools are typically more competitive than general admits. Your tier positioning for ${majorName}-specific programs may be 0.5-1 tier higher than shown.`;
}
