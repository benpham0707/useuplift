/**
 * Cross-Validator — Post-extraction conflict detection
 *
 * Pure-code service that compares extracted evidence against structured
 * Common App metadata fields. Detects conflicts between description claims
 * and structured data, flagging:
 *   1. Commitment conflicts (extracted years/hours vs structured fields)
 *   2. Scope-commitment mismatches (national scope with minimal hours)
 *   3. Impact credibility issues (large impact claims with minimal time)
 *
 * Cost: $0.00 (pure logic, no LLM)
 * Latency: <1ms
 */

import type { ExtractedEvidence, ValidationFlags } from './types';

export interface StructuredFields {
  hoursPerWeek?: number;
  weeksPerYear?: number;
  yearsInvolved?: number;
  gradeLevels?: number[];
  isPaid?: boolean;
}

/**
 * Cross-validate extracted evidence against structured Common App fields.
 * Returns flags indicating detected conflicts.
 */
export function crossValidateEvidence(
  evidence: ExtractedEvidence,
  structured: StructuredFields
): ValidationFlags {
  const flags: string[] = [];
  let commitmentConflict = false;
  let scopeCommitmentMismatch = false;
  let impactCredibilityIssue = false;

  // --- Rule 1: Commitment conflict ---
  // Description claims vs structured fields for years
  if (
    structured.yearsInvolved != null &&
    structured.yearsInvolved > 0 &&
    evidence.commitment.yearsActive > structured.yearsInvolved + 1.5
  ) {
    commitmentConflict = true;
    flags.push(
      `Years conflict: description claims ${evidence.commitment.yearsActive} years, structured fields say ${structured.yearsInvolved} year(s)`
    );
  }

  // Description claims vs structured fields for hours (3x threshold)
  if (
    structured.hoursPerWeek != null &&
    structured.hoursPerWeek > 0 &&
    evidence.commitment.hoursPerWeek > structured.hoursPerWeek * 3
  ) {
    commitmentConflict = true;
    flags.push(
      `Hours conflict: description implies ${evidence.commitment.hoursPerWeek} hrs/wk, structured fields say ${structured.hoursPerWeek} hrs/wk`
    );
  }

  // --- Rule 2: Scope-commitment mismatch ---
  // National/international scope with minimal time commitment
  const isHighScope =
    evidence.scope.level === 'national' || evidence.scope.level === 'international';
  const isMinimalCommitment =
    (structured.hoursPerWeek ?? evidence.commitment.hoursPerWeek) < 3 &&
    (structured.yearsInvolved ?? evidence.commitment.yearsActive) < 1;

  if (isHighScope && isMinimalCommitment) {
    // Exempt one-time national awards/competitions: check if recognitions exist
    const hasNationalRecognition = evidence.recognitions.some(
      r =>
        (r.level === 'national' || r.level === 'international') &&
        r.isVerifiable
    );
    if (!hasNationalRecognition) {
      scopeCommitmentMismatch = true;
      flags.push(
        `Scope-commitment mismatch: ${evidence.scope.level} scope with <3 hrs/wk and <1 year commitment, no verifiable national recognition`
      );
    }
  }

  // --- Rule 3: Impact credibility ---
  // Verified significant impact with very minimal time investment
  if (
    evidence.impact.impactQuality === 'verified_significant' &&
    (structured.hoursPerWeek ?? evidence.commitment.hoursPerWeek) < 2 &&
    (structured.weeksPerYear ?? evidence.commitment.weeksPerYear) < 26
  ) {
    impactCredibilityIssue = true;
    flags.push(
      `Impact credibility: claims verified_significant impact with <2 hrs/wk and <26 wks/yr`
    );
  }

  return {
    commitmentConflict,
    scopeCommitmentMismatch,
    impactCredibilityIssue,
    flags,
  };
}
