/**
 * Post-Processing Validation Module
 *
 * Validates and cleans LLM-generated report sections before they reach the user.
 * Catches common LLM mistakes that prompt engineering alone cannot prevent:
 *
 * 1. AP exam rate / class GPA conflation (A1 fix)
 *    - Detects sentences that illogically compare AP exam pass rates with class GPAs
 *    - Strips conflated sentences from challenge fields
 *
 * 2. Stat duplication across challenges (A7 fix)
 *    - Tracks cited percentages across challenges
 *    - Flags when the same data point appears in multiple challenges
 */

import type {
  AcademicIdentitySection,
  ChallengesAndRealitySection,
  StrategicRoadmapSection,
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationIssue {
  type: 'ap_gpa_conflation' | 'stat_duplication' | 'low_relevance_challenge' | 'cross_section_contradiction';
  severity: 'error' | 'warning';
  section: string;
  description: string;
  action: 'stripped' | 'flagged';
}

export interface ValidationResult {
  issues: ValidationIssue[];
  cleaned: {
    challenges: ChallengesAndRealitySection;
    identity: AcademicIdentitySection;
  };
}

// ============================================================================
// CONFLATION DETECTION HELPERS
// ============================================================================

/**
 * Detects whether a text contains both AP exam rate language AND class GPA language,
 * which would constitute an illogical conflation of two unrelated metrics.
 */
function hasAPGPAConflation(text: string): boolean {
  // V1: Expanded conflation detection — catches more LLM phrasing patterns
  const examLanguage = /test.?taker|scores?\s+[1-5]|scores?\s+3|pass\s*rate|passing\s+score|exam\s+performance|AP\s+exam|national.+pass|percent.+score|nationwide.+score/i;
  const classGPA = /(earned|received|got|achieved|your)\s+(a\s+)?[0-9]\.[0-9]|GPA\s+of\s+[0-9]\.[0-9]|[0-9]\.[0-9]{1,2}\s+in\s+the\s+(class|course)|their\s+[0-9]\.[0-9]|you\s+earned/i;
  return examLanguage.test(text) && classGPA.test(text);
}

/**
 * Strips conflated sentences from text, keeping all non-conflated content.
 * Returns the original text if stripping would leave it empty.
 */
function stripConflatedSentences(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const cleaned = sentences.filter(s => !hasAPGPAConflation(s));
  if (cleaned.length === 0) {
    // V2: All sentences conflated — return a safe replacement instead of the original
    return '[This analysis contained a statistical comparison error and was simplified. See Research Context for verified data.]';
  }
  return cleaned.join(' ');
}

// ============================================================================
// STAT DUPLICATION DETECTION
// ============================================================================

/**
 * Extracts percentage-like values from text for deduplication tracking.
 */
function extractPercentages(text: string): string[] {
  const matches = text.match(/\d{1,3}(?:\.\d+)?%/g);
  return matches || [];
}

// V3: Helper to remove sentences containing a specific percentage
function stripPercentage(text: string, pct: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const cleaned = sentences.filter(s => !s.includes(pct));
  return cleaned.length > 0 ? cleaned.join(' ') : text;
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

export function validateReportOutput(
  identity: AcademicIdentitySection,
  challenges: ChallengesAndRealitySection,
  _intendedMajor?: string,
  roadmap?: StrategicRoadmapSection,  // R18: Also validate roadmap
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Deep-clone sections before modifying
  const cleanedChallenges = structuredClone(challenges);
  const cleanedIdentity = structuredClone(identity);

  // =========================================================================
  // 1. AP exam rate / class GPA conflation detection in challenges
  // =========================================================================

  for (let i = 0; i < cleanedChallenges.challenges.length; i++) {
    const challenge = cleanedChallenges.challenges[i];
    const fieldsToCheck: Array<'issue' | 'aoImpact' | 'tierImpact'> = ['issue', 'aoImpact', 'tierImpact'];

    for (const field of fieldsToCheck) {
      if (hasAPGPAConflation(challenge[field])) {
        const original = challenge[field];
        challenge[field] = stripConflatedSentences(original);
        issues.push({
          type: 'ap_gpa_conflation',
          severity: 'error',
          section: `challenges[${i}].${field}`,
          description: `Conflated AP exam rate with class GPA in challenge "${challenge.title}": "${original.slice(0, 120)}..."`,
          action: 'stripped',
        });
      }
    }
  }

  // =========================================================================
  // 2. Stat duplication detection across challenges
  // =========================================================================

  const statUsage = new Map<string, number[]>();

  for (let i = 0; i < cleanedChallenges.challenges.length; i++) {
    const challenge = cleanedChallenges.challenges[i];
    const allText = `${challenge.issue} ${challenge.aoImpact} ${challenge.tierImpact}`;
    const percentages = extractPercentages(allText);

    for (const pct of percentages) {
      const existing = statUsage.get(pct);
      if (existing) {
        existing.push(i);
      } else {
        statUsage.set(pct, [i]);
      }
    }
  }

  // V3: Strip duplicate stats from later challenges (keep first occurrence)
  for (const [pct, challengeIndices] of statUsage.entries()) {
    if (challengeIndices.length > 1) {
      issues.push({
        type: 'stat_duplication',
        severity: 'warning',
        section: `challenges[${challengeIndices.join(',')}]`,
        description: `Statistic "${pct}" cited in ${challengeIndices.length} different challenges — removed from later occurrences`,
        action: 'stripped',
      });
      // Remove the duplicate stat from all challenges after the first
      for (let k = 1; k < challengeIndices.length; k++) {
        const idx = challengeIndices[k];
        const challenge = cleanedChallenges.challenges[idx];
        challenge.issue = stripPercentage(challenge.issue, pct);
        challenge.aoImpact = stripPercentage(challenge.aoImpact, pct);
        challenge.tierImpact = stripPercentage(challenge.tierImpact, pct);
      }
    }
  }

  // =========================================================================
  // R18: Roadmap stat duplication check (percentages within priority descriptions)
  // =========================================================================

  if (roadmap) {
    const roadmapStatUsage = new Map<string, number[]>();
    for (let i = 0; i < roadmap.priorities.length; i++) {
      const percentages = extractPercentages(roadmap.priorities[i].description);
      for (const pct of percentages) {
        const existing = roadmapStatUsage.get(pct);
        if (existing) {
          existing.push(i);
        } else {
          roadmapStatUsage.set(pct, [i]);
        }
      }
    }

    for (const [pct, priorityIndices] of roadmapStatUsage.entries()) {
      if (priorityIndices.length > 1) {
        issues.push({
          type: 'stat_duplication',
          severity: 'warning',
          section: `roadmap.priorities[${priorityIndices.join(',')}]`,
          description: `Statistic "${pct}" cited in ${priorityIndices.length} different roadmap priorities`,
          action: 'flagged',
        });
      }
    }
  }

  return {
    issues,
    cleaned: {
      challenges: cleanedChallenges,
      identity: cleanedIdentity,
    },
  };
}
