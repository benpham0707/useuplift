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
// Tighter ranges for student-friendly specificity — each tier spans ~0.10-0.20 GPA
export const COLLEGE_TIER_BENCHMARKS: TierInfo[] = [
  { name: 'Ivy/Elite', examples: ['Harvard', 'Stanford', 'MIT', 'Princeton', 'Yale', 'Columbia'], gpaRange: '3.90-4.0', median: 3.96 },
  { name: 'Highly Selective', examples: ['Northwestern', 'UCLA', 'UC Berkeley', 'Carnegie Mellon', 'Georgetown', 'Georgia Tech'], gpaRange: '3.80-3.89', median: 3.85 },
  { name: 'Very Selective', examples: ['NYU', 'Boston College', 'UW-Madison', 'UCSB', 'Tulane', 'William & Mary'], gpaRange: '3.70-3.79', median: 3.75 },
  { name: 'Selective', examples: ['Boston University', 'UT Austin', 'Purdue', 'Ohio State', 'UMass Amherst', 'Rutgers'], gpaRange: '3.50-3.69', median: 3.60 },
  { name: 'Competitive', examples: ['Arizona State', 'Iowa State', 'University of Oregon', 'Temple University', 'SUNY schools'], gpaRange: '3.20-3.49', median: 3.35 },
  { name: 'Accessible', examples: ['Community colleges', 'Open admission institutions'], gpaRange: 'Below 3.20', median: 2.80 },
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
  if (gpa >= 3.90 - BOUNDARY_TOLERANCE) return { ...tiers[1], nearBoundary: `You're very close to Ivy/Elite territory — at the top of Highly Selective` };
  if (gpa >= 3.80) return tiers[1];
  if (gpa >= 3.80 - BOUNDARY_TOLERANCE) return { ...tiers[2], nearBoundary: `You're right at the edge of Highly Selective — at the top of Very Selective` };
  if (gpa >= 3.70) return tiers[2];
  if (gpa >= 3.70 - BOUNDARY_TOLERANCE) return { ...tiers[3], nearBoundary: `You're close to Very Selective — at the top of Selective range` };
  if (gpa >= 3.50) return tiers[3];
  if (gpa >= 3.50 - BOUNDARY_TOLERANCE) return { ...tiers[4], nearBoundary: `You're near the Selective threshold — at the top of Competitive range` };
  if (gpa >= 3.20) return tiers[4];
  return tiers[5];
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
  const currentTierIndex = COLLEGE_TIER_BENCHMARKS.findIndex(t => t.name === currentTierInfo.name);
  const nextTierUp = currentTierIndex > 0 ? COLLEGE_TIER_BENCHMARKS[currentTierIndex - 1] : null;

  // Student-friendly GPA position (no raw decimals for diffs)
  const baseGpaPosition = `Your ${overallGPA.toFixed(2)} GPA places you in the ${currentTierInfo.name} range — schools like ${currentTierInfo.examples.slice(0, 3).join(', ')}`;
  const gpaPosition = currentTierInfo.nearBoundary
    ? `${baseGpaPosition}. ${currentTierInfo.nearBoundary}.`
    : baseGpaPosition;

  return {
    currentTier: currentTierInfo.name,
    tierExamples: currentTierInfo.examples,
    gpaPosition,
    strengthTier: strongest && strengthTierInfo && strengthTierInfo.name !== currentTierInfo.name
      ? `If your entire transcript matched your ${strongest.subject} performance (${strongest.gpa.toFixed(2)}), you'd be in ${strengthTierInfo.name} range — schools like ${strengthTierInfo.examples.slice(0, 3).join(', ')}`
      : undefined,
    weaknessTier: weakest && weaknessTierInfo && weaknessTierInfo.name !== currentTierInfo.name
      ? `If your entire transcript matched your ${weakest.subject} performance (${weakest.gpa.toFixed(2)}), you'd drop to ${weaknessTierInfo.name} range`
      : undefined,
    tierGap: nextTierUp
      ? `To move up to ${nextTierUp.name} (schools like ${nextTierUp.examples.slice(0, 2).join(', ')}), you'll need a ${parseFloat(nextTierUp.gpaRange.split('-')[0]).toFixed(2)}+ GPA — that means mostly A's and A-'s in your remaining courses`
      : `You're in the top tier — keep doing what you're doing`,
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
  return `Important: ${majorName} is one of the most competitive majors. ${majorName} programs at selective schools have higher expectations than general admission — so you may need stronger grades than a typical applicant to the same school.`;
}
