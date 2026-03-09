/**
 * Readiness Scoring — Four granularity-level readiness functions.
 *
 * Each function returns 0-100. Together they compose the ReadinessScores object
 * that feeds improvement phase detection (detectImprovementPhase()).
 *
 * These scores are a heuristic proxy for essay quality — they exist to determine
 * the feedback zoom level, not to be shown to students.
 *
 * Calibration targets (starting estimates):
 * | Quality         | Essay | Paragraph | Sentence | Word | Expected Phase      |
 * |-----------------|-------|-----------|----------|------|---------------------|
 * | Strong essay    | ~80   | ~75       | ~70      | ~60  | Craft or Polish     |
 * | Average essay   | ~60   | ~50       | ~50      | ~45  | Architecture        |
 * | Weak essay      | ~25   | ~40       | ~35      | ~30  | Foundation          |
 * | Near-final      | ~90   | ~85       | ~80      | ~75  | Polish/Distinction  |
 *
 * Spec: docs/plan-sections/04-profile-manager.md Section 5
 */

import type {
  EssayProfile,
  ReadinessScores,
  SentenceProfile,
} from '../profileTypes';

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Compute readiness scores across all four granularity levels.
 * These feed improvement phase detection.
 */
export function computeReadinessScores(profile: Readonly<EssayProfile>): ReadinessScores {
  return {
    essay: essayReadiness(profile),
    paragraph: paragraphReadiness(profile),
    sentence: sentenceReadiness(profile),
    word: wordReadiness(profile),
  };
}

// ============================================================================
// ESSAY READINESS (0-100)
// ============================================================================

/**
 * Essay readiness: thesis + arc + voice + holistic population.
 *
 * - Thesis present and confident: 0-30 points
 *   - thesisConfidence >= 0.8 → 30
 *   - thesisConfidence >= 0.5 → 20
 *   - thesisConfidence >= 0.3 → 10
 *   - absent/zero → 0
 *
 * - Arc coherent: 0-25 points
 *   - Narrative strategy identified (10) + turning point exists (10)
 *   + arc momentum not 'stalling' (5)
 *
 * - Voice map populated with stability regions: 0-20 points
 *   - Voice signature present (10) + at least one stability region (5)
 *   + intentionality assessed for all shifts (5)
 *
 * - Holistic sections populated: 0-25 points
 *   - 3-4 points per non-empty holistic section
 *
 * - Critical weaknesses: -12 each, max -25
 */
export function essayReadiness(profile: Readonly<EssayProfile>): number {
  let score = 0;

  // --- Thesis (0-30) ---
  const thesisConf = profile.thematicArchitecture.thesisConfidence;
  if (thesisConf >= 0.8) {
    score += 30;
  } else if (thesisConf >= 0.5) {
    score += 20;
  } else if (thesisConf >= 0.3) {
    score += 10;
  }

  // --- Arc coherence (0-25) ---
  // Narrative strategy identified
  if (profile.narrativeStrategy.primaryStrategy.length > 0) {
    score += 10;
  }
  // Turning point exists (pivot points)
  if (profile.narrativeStrategy.pivotPoints.length > 0) {
    score += 10;
  }
  // Arc momentum — check pacing analysis isn't suggesting stalling
  if (
    profile.narrativeStrategy.pacingAnalysis.length > 0 &&
    !profile.narrativeStrategy.pacingAnalysis.toLowerCase().includes('stalling')
  ) {
    score += 5;
  }

  // --- Voice map (0-20) ---
  // Voice signature present
  if (profile.voiceIdentity.signature.length > 0) {
    score += 10;
  }
  // At least one stability observation (observations indicate coverage)
  const hasStabilityObservation =
    profile.voiceMap.register.observations.length > 0 ||
    profile.voiceMap.sentenceRhythm.observations.length > 0;
  if (hasStabilityObservation) {
    score += 5;
  }
  // Intentionality assessed for all shifts
  const shifts = profile.voiceMap.shifts;
  if (shifts.length > 0) {
    const allAssessed = shifts.every(
      (s) => s.intentionality.assessment !== 'ambiguous' || s.intentionality.confidence >= 0.6,
    );
    if (allAssessed) {
      score += 5;
    }
  } else {
    // No shifts — voice consistency is fine, give the points
    score += 5;
  }

  // --- Holistic sections populated (0-25) ---
  // 7 holistic sections, ~3-4 points each
  const holisticSections: Array<{ content: unknown; weight: number }> = [
    { content: profile.voiceIdentity.signature, weight: 4 },
    { content: profile.emotionalTopography.arcTrajectory, weight: 4 },
    { content: profile.thematicArchitecture.centralThesis, weight: 4 },
    { content: profile.narrativeStrategy.primaryStrategy, weight: 3 },
    { content: profile.characterRevelation.writerPortrait, weight: 4 },
    { content: profile.craftAssessment.strengthSignatures, weight: 3 },
    { content: profile.admissionsPositioning.tellabilitySummary, weight: 3 },
  ];

  for (const section of holisticSections) {
    if (isPopulated(section.content)) {
      score += section.weight;
    }
  }

  // --- Critical weaknesses (-12 each, max -25) ---
  let penalties = 0;

  // Red flags in admissions positioning
  if (profile.admissionsPositioning.redFlags.length > 0) {
    penalties += 12;
  }
  // No coherent thesis after L3 (thesis confidence very low AND we've processed paragraphs)
  if (
    profile.thematicArchitecture.thesisConfidence < 0.2 &&
    profile.metadata.paragraphsCovered.length >= profile.paragraphs.length &&
    profile.paragraphs.length > 0
  ) {
    penalties += 12;
  }
  // Voice entirely inconsistent (more unintentional shifts than intentional)
  const unintentionalShifts = shifts.filter(
    (s) => s.intentionality.assessment === 'unintentional',
  );
  const intentionalShifts = shifts.filter(
    (s) => s.intentionality.assessment === 'intentional',
  );
  if (shifts.length >= 3 && unintentionalShifts.length > intentionalShifts.length * 2) {
    penalties += 12;
  }

  score -= Math.min(penalties, 25);

  return clamp(score, 0, 100);
}

// ============================================================================
// PARAGRAPH READINESS (0-100)
// ============================================================================

/**
 * Paragraph readiness: effectiveness distribution.
 *
 * - % paragraphs with effectiveness >= 60 maps to 0-70 points (linear)
 * - Bonus: % paragraphs with effectiveness >= 80 maps to 0-30 additional
 * - Penalty: each paragraph < 40 effectiveness subtracts 5 (floor at 0)
 */
export function paragraphReadiness(profile: Readonly<EssayProfile>): number {
  const paragraphs = profile.paragraphs;
  if (paragraphs.length === 0) return 0;

  const analyzed = paragraphs.filter((p) => p.analysis !== null);
  if (analyzed.length === 0) return 0;

  // % of analyzed paragraphs with effectiveness >= 60
  const above60Count = analyzed.filter((p) => (p.analysis?.effectiveness ?? 0) >= 60).length;
  const above60Ratio = above60Count / analyzed.length;
  let score = above60Ratio * 70;

  // Bonus: % with effectiveness >= 80
  const above80Count = analyzed.filter((p) => (p.analysis?.effectiveness ?? 0) >= 80).length;
  const above80Ratio = above80Count / analyzed.length;
  score += above80Ratio * 30;

  // Penalty: each paragraph < 40 effectiveness
  const below40Count = analyzed.filter((p) => (p.analysis?.effectiveness ?? 0) < 40).length;
  score -= below40Count * 5;

  return clamp(Math.round(score), 0, 100);
}

// ============================================================================
// SENTENCE READINESS (0-100)
// ============================================================================

/**
 * Sentence readiness: problem-free ratio + average effectiveness.
 *
 * Formula: (problemFreeRatio * 70) + (avgEffectiveness / 100 * 30)
 */
export function sentenceReadiness(profile: Readonly<EssayProfile>): number {
  const allSentences = getAllAnalyzedSentences(profile);
  if (allSentences.length === 0) return 0;

  // Problem-free ratio (sentences where isProblem = false)
  const problemFreeCount = allSentences.filter((s) => !s.analysis!.isProblem).length;
  const problemFreeRatio = problemFreeCount / allSentences.length;

  // Average effectiveness
  const totalEffectiveness = allSentences.reduce(
    (sum, s) => sum + (s.analysis?.effectiveness ?? 0),
    0,
  );
  const avgEffectiveness = totalEffectiveness / allSentences.length;

  const score = (problemFreeRatio * 70) + (avgEffectiveness / 100 * 30);

  return clamp(Math.round(score), 0, 100);
}

// ============================================================================
// WORD READINESS (0-100)
// ============================================================================

/**
 * Word readiness: word-level weakness absence.
 *
 * % of sentences with no word-level weaknesses x 100.
 * Word-level weaknesses are entries in weaknesses array that reference
 * word/phrase-level issues (short observations about specific word choices).
 */
export function wordReadiness(profile: Readonly<EssayProfile>): number {
  const allSentences = getAllAnalyzedSentences(profile);
  if (allSentences.length === 0) return 0;

  // A sentence has word-level weaknesses if any weakness references a specific
  // word or phrase (heuristic: weakness observation is short and mentions specific text)
  const noWordWeaknessCount = allSentences.filter((s) => {
    const weaknesses = s.analysis?.weaknesses ?? [];
    // Consider a weakness word-level if it's specific to word/phrase choice
    const hasWordLevelWeakness = weaknesses.some((w) => isWordLevelWeakness(w.observation));
    return !hasWordLevelWeakness;
  }).length;

  const ratio = noWordWeaknessCount / allSentences.length;

  return clamp(Math.round(ratio * 100), 0, 100);
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Check if a holistic section field is populated (non-empty string or non-empty array).
 */
function isPopulated(content: unknown): boolean {
  if (typeof content === 'string') return content.length > 0;
  if (Array.isArray(content)) return content.length > 0;
  return content !== null && content !== undefined;
}

/**
 * Get all sentences across all paragraphs that have analysis data.
 */
function getAllAnalyzedSentences(profile: Readonly<EssayProfile>): SentenceProfile[] {
  const sentences: SentenceProfile[] = [];
  for (const para of profile.paragraphs) {
    for (const sentence of para.sentences) {
      if (sentence.analysis !== null) {
        sentences.push(sentence);
      }
    }
  }
  return sentences;
}

/**
 * Heuristic: determine if a weakness observation is about word-level issues.
 *
 * Word-level weaknesses typically mention specific words, phrases, or word choices.
 * We use keyword signals to identify them.
 */
function isWordLevelWeakness(observation: string): boolean {
  const wordLevelSignals = [
    'word choice',
    'word-level',
    'phrasing',
    'diction',
    'vocabulary',
    'verb choice',
    'adjective',
    'adverb',
    'cliche',
    'cliché',
    'overused',
    'vague language',
    'imprecise',
    'redundant word',
    'filler word',
    'passive voice',
    'weak verb',
    'generic term',
    'abstract language',
  ];
  const lower = observation.toLowerCase();
  return wordLevelSignals.some((signal) => lower.includes(signal));
}
