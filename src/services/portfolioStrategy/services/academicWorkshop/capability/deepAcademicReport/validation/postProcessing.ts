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
        // C3: If stripping left only the generic placeholder, add specificity
        const placeholder = '[This analysis contained a statistical comparison error and was simplified. See Research Context for verified data.]';
        if (challenge[field] === placeholder) {
          challenge[field] = `[The ${field} analysis for "${challenge.title}" contained a statistical comparison error. See Research Context for verified AP data.]`;
        }
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

  // =========================================================================
  // C3: Enhanced conflation detection — also check roadmapConnection field
  // =========================================================================

  for (let i = 0; i < cleanedChallenges.challenges.length; i++) {
    const challenge = cleanedChallenges.challenges[i];
    if (hasAPGPAConflation(challenge.roadmapConnection)) {
      const original = challenge.roadmapConnection;
      challenge.roadmapConnection = stripConflatedSentences(original);
      issues.push({
        type: 'ap_gpa_conflation',
        severity: 'error',
        section: `challenges[${i}].roadmapConnection`,
        description: `Conflated AP exam rate with class GPA in challenge "${challenge.title}" roadmapConnection: "${original.slice(0, 120)}..."`,
        action: 'stripped',
      });
      // C3: If stripping left only the placeholder, add specificity
      const placeholder = '[This analysis contained a statistical comparison error and was simplified. See Research Context for verified data.]';
      if (challenge.roadmapConnection === placeholder) {
        challenge.roadmapConnection = `[The roadmap connection for "${challenge.title}" contained a statistical comparison error. See Research Context for verified AP data and the Roadmap for strategic guidance.]`;
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

// ============================================================================
// H2 + C2: ROADMAP POST-PROCESSING
// ============================================================================

/** Score band definitions for deterministic mapping (C2) */
const SCORE_BANDS: Array<{ min: number; max: number; label: string }> = [
  { min: 0, max: 30, label: 'Major misalignment' },
  { min: 30, max: 55, label: 'Developing alignment' },
  { min: 55, max: 75, label: 'Moderate alignment' },
  { min: 75, max: 90, label: 'Strong alignment' },
  { min: 90, max: 100, label: 'Exceptional alignment' },
];

function getCorrectBandLabel(score: number): string {
  for (const band of SCORE_BANDS) {
    if (score >= band.min && score < band.max) return band.label;
  }
  // score === 100
  return 'Exceptional alignment';
}

/**
 * Post-process roadmap section: fix score band labels (C2) and detect
 * recommend/avoid contradictions (H2).
 */
export function fixRoadmapPostProcessing(roadmap: StrategicRoadmapSection): {
  roadmap: StrategicRoadmapSection;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const cleaned = structuredClone(roadmap);

  // =========================================================================
  // C2: Deterministic score band mapping
  // =========================================================================

  const score = cleaned.majorAlignment.score;
  const correctLabel = getCorrectBandLabel(score);
  const assessment = cleaned.majorAlignment.assessment;

  // Check if the LLM stated a different band label
  const allLabels = SCORE_BANDS.map(b => b.label);
  const statedLabel = allLabels.find(label =>
    assessment.toLowerCase().includes(label.toLowerCase())
  );

  if (statedLabel && statedLabel !== correctLabel) {
    // Override the first sentence to use the correct band
    const sentences = assessment.split(/(?<=[.!?])\s+/);
    if (sentences.length > 0) {
      sentences[0] = sentences[0].replace(
        new RegExp(statedLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        correctLabel
      );
      cleaned.majorAlignment.assessment = sentences.join(' ');
    }
    issues.push({
      type: 'cross_section_contradiction',
      severity: 'warning',
      section: 'roadmap.majorAlignment',
      description: `Score ${score} maps to "${correctLabel}" but LLM stated "${statedLabel}" — overridden`,
      action: 'stripped',
    });
  }

  // =========================================================================
  // H2: Detect courses in both recommended AND avoid lists
  // =========================================================================

  const avoidedCourses = new Set(
    cleaned.courseStrategy.avoid.map(a => a.course.toLowerCase())
  );

  // Check recommended list for contradictions
  for (const rec of cleaned.courseStrategy.recommended) {
    if (avoidedCourses.has(rec.course.toLowerCase())) {
      issues.push({
        type: 'cross_section_contradiction',
        severity: 'warning',
        section: `roadmap.courseStrategy.recommended: ${rec.course}`,
        description: `"${rec.course}" appears in both recommended and avoid lists — contradiction`,
        action: 'stripped',
      });
      // Auto-fix: remove "consider" language from the rationale
      rec.rationale = rec.rationale.replace(/\bconsider\b/gi, 'evaluate carefully whether to');
    }
  }

  // Check priority actionItems for mentions of avoided courses
  for (let i = 0; i < cleaned.priorities.length; i++) {
    for (let j = 0; j < cleaned.priorities[i].actionItems.length; j++) {
      const item = cleaned.priorities[i].actionItems[j];
      for (const avoidCourse of avoidedCourses) {
        if (item.toLowerCase().includes(avoidCourse)) {
          issues.push({
            type: 'cross_section_contradiction',
            severity: 'warning',
            section: `roadmap.priorities[${i}].actionItems[${j}]`,
            description: `Action item mentions avoided course "${avoidCourse}" — flagged`,
            action: 'flagged',
          });
        }
      }
    }
  }

  return { roadmap: cleaned, issues };
}
