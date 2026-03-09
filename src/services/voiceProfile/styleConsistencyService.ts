/**
 * Style Consistency Service
 *
 * Provides both fast heuristic checks and optional LLM-powered deep
 * validation to ensure generated text matches a student's voice profile.
 *
 * - quickVoiceCheck: Pure heuristic, < 10ms, no LLM
 * - buildVoiceConstraintBlock: ~200 token directive for LLM prompts
 * - validateVoiceConsistency: Optional Haiku-powered deep check
 */

import { callClaude } from '@/lib/llm/claude';
import type { StudentVoiceProfile } from './types';
import type { DriftSignal, VoiceDriftAnalysis } from './voiceDriftTypes';

// ============================================================================
// TYPES
// ============================================================================

export interface QuickVoiceCheckResult {
  bannedTermsFound: string[];
  vocabularyMismatch: boolean;
  sentenceLengthDeviation: number;
  formalityMismatch: boolean;
  overallConsistent: boolean;
}

export interface VoiceConsistencyResult {
  isConsistent: boolean;
  issues?: string[];
  suggestedFixes?: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

// Common words excluded from long-word ratio (they inflate the count)
const LONG_WORD_EXCEPTIONS = new Set([
  'everything', 'something', 'sometimes', 'understand', 'experience',
  'different', 'important', 'because', 'together', 'community',
  'interesting', 'beautiful', 'education', 'information', 'opportunity',
]);

// Casual markers for formality detection
const CASUAL_MARKERS = [
  "can't", "won't", "don't", "didn't", "isn't", "aren't", "wasn't",
  "weren't", "shouldn't", "wouldn't", "couldn't", "I'm", "I've",
  "I'd", "I'll", "we're", "they're", "it's", "that's", "there's",
  "what's", "who's", "let's", "gonna", "wanna", "kinda", "sorta",
];

// Formal markers
const FORMAL_MARKERS = [
  'furthermore', 'moreover', 'consequently', 'nevertheless', 'therefore',
  'henceforth', 'notwithstanding', 'accordingly', 'wherein', 'thus',
  'hence', 'whereby', 'therein', 'aforementioned',
];

// ============================================================================
// SERVICE
// ============================================================================

export class StyleConsistencyService {

  /**
   * Pure heuristic voice check — NO LLM, < 10ms.
   *
   * Checks banned terms, vocabulary level, sentence length, and formality
   * against the student's voice profile.
   */
  quickVoiceCheck(text: string, profile: StudentVoiceProfile): QuickVoiceCheckResult {
    // 1. Check banned/avoid words (case-insensitive word boundary match)
    const bannedTermsFound: string[] = [];
    const lowerText = text.toLowerCase();
    for (const word of profile.linguistics.avoidWords) {
      const regex = new RegExp(`\\b${escapeRegex(word.toLowerCase())}\\b`, 'i');
      if (regex.test(lowerText)) {
        bannedTermsFound.push(word);
      }
    }

    // 2. Compute average sentence length and deviation
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgSentenceLength = sentenceLengths.length > 0
      ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
      : 0;
    const sentenceLengthDeviation = Math.abs(avgSentenceLength - profile.linguistics.averageSentenceLength);

    // 3. Check formality
    const formalityMismatch = this.checkFormalityMismatch(text, profile.linguistics.formality);

    // 4. Check vocabulary level
    const vocabularyMismatch = this.checkVocabularyMismatch(text, profile.linguistics.vocabularyLevel);

    // 5. Overall consistency
    const overallConsistent =
      bannedTermsFound.length === 0 &&
      sentenceLengthDeviation < 5 &&
      !formalityMismatch;

    return {
      bannedTermsFound,
      vocabularyMismatch,
      sentenceLengthDeviation,
      formalityMismatch,
      overallConsistent,
    };
  }

  /**
   * Build a ~200 token voice constraint block for LLM prompt injection.
   * More directive than getPromptSummary — uses MUST/BANNED language.
   */
  buildVoiceConstraintBlock(profile: StudentVoiceProfile): string {
    const lines: string[] = [];

    lines.push('VOICE CONSTRAINTS (MUST FOLLOW):');
    lines.push(`- Write at ${profile.linguistics.formality} formality level`);
    lines.push(`- Target ~${profile.linguistics.averageSentenceLength} word sentences (variety: ${profile.linguistics.sentenceLengthVariety}/10)`);
    lines.push(`- Vocabulary: ${profile.linguistics.vocabularyLevel}`);

    if (profile.linguistics.avoidWords.length > 0) {
      lines.push(`- BANNED WORDS: ${profile.linguistics.avoidWords.join(', ')}`);
    }

    if (profile.linguistics.signatureWords.length > 0) {
      lines.push(`- PRESERVE these signature words: ${profile.linguistics.signatureWords.join(', ')}`);
    }

    lines.push(`- Energy: ${profile.personality.energy}, Humor: ${profile.personality.humor}`);

    if (profile.preservationWarnings.length > 0) {
      lines.push(`- DO NOT CHANGE: ${profile.preservationWarnings.join('; ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Optional LLM-powered deep voice consistency check.
   * Uses Haiku for speed (~500ms).
   */
  async validateVoiceConsistency(
    text: string,
    profile: StudentVoiceProfile,
    _context?: string
  ): Promise<VoiceConsistencyResult> {
    const systemPrompt = `You are a voice consistency analyser. Compare student text against their voice profile.

VOICE PROFILE:
- Register: ${profile.register.primary}${profile.register.secondary ? ` / ${profile.register.secondary}` : ''}
- Formality: ${profile.linguistics.formality}
- Vocabulary: ${profile.linguistics.vocabularyLevel}
- Avg sentence length: ${profile.linguistics.averageSentenceLength} words
- Energy: ${profile.personality.energy}
- Humor: ${profile.personality.humor}
- Signature words: ${profile.linguistics.signatureWords.join(', ')}
- Avoid words: ${profile.linguistics.avoidWords.join(', ')}
- Preservation warnings: ${profile.preservationWarnings.join('; ')}

Return STRICTLY VALID JSON:
{
  "isConsistent": boolean,
  "issues": ["issue1", "issue2"],
  "suggestedFixes": ["fix1", "fix2"]
}`;

    const userPrompt = `TEXT TO CHECK:\n"${text}"`;

    try {
      const response = await callClaude<VoiceConsistencyResult>({
        systemPrompt,
        userPrompt,
        model: HAIKU_MODEL,
        temperature: 0.2,
        maxTokens: 500,
        useJsonMode: true,
        cacheSystemPrompt: true,
      });

      return response.content;
    } catch (error) {
      console.error('[StyleConsistencyService] LLM validation failed:', error);
      // Fall back to heuristic check
      const quick = this.quickVoiceCheck(text, profile);
      return {
        isConsistent: quick.overallConsistent,
        issues: [
          ...quick.bannedTermsFound.map(t => `Uses avoided word: "${t}"`),
          ...(quick.formalityMismatch ? ['Formality level does not match profile'] : []),
          ...(quick.vocabularyMismatch ? ['Vocabulary level does not match profile'] : []),
          ...(quick.sentenceLengthDeviation >= 5 ? [`Sentence length deviates by ${quick.sentenceLengthDeviation.toFixed(1)} words from profile average`] : []),
        ],
      };
    }
  }

  /**
   * Compare text against a voice profile baseline. Returns detailed drift analysis.
   * Pure deterministic — NO LLM, <10ms.
   *
   * Checks 5 dimensions:
   * 1. Sentence length (avg) vs profile baseline
   * 2. Vocabulary level (long word ratio) vs profile
   * 3. Formality (casual/formal marker balance) vs profile
   * 4. Contraction rate vs profile baseline
   * 5. Energy level (exclamation frequency, short sentences)
   */
  compareToBaseline(text: string, profile: StudentVoiceProfile): VoiceDriftAnalysis {
    const signals: DriftSignal[] = [];

    // Shared text analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const lowerText = text.toLowerCase();

    // 1. Sentence length drift
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgSentenceLength = sentenceLengths.length > 0
      ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
      : 0;
    const sentLenBaseline = profile.linguistics.averageSentenceLength;
    const sentLenDeviation = sentLenBaseline > 0
      ? Math.abs(avgSentenceLength - sentLenBaseline) / sentLenBaseline
      : 0;
    signals.push({
      dimension: 'sentence_length',
      baseline: sentLenBaseline,
      current: Math.round(avgSentenceLength * 10) / 10,
      deviation: Math.round(sentLenDeviation * 100) / 100,
      severity: toSeverity(sentLenDeviation),
      explanation: sentLenDeviation < 0.1
        ? 'Sentence length matches profile'
        : `Average sentence length is ${avgSentenceLength.toFixed(1)} words vs profile baseline of ${sentLenBaseline} words`,
    });

    // 2. Vocabulary level drift
    const longWords = words.filter(w => {
      const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
      return clean.length > 8 && !LONG_WORD_EXCEPTIONS.has(clean);
    });
    const longRatio = wordCount > 0 ? longWords.length / wordCount : 0;
    const vocabBaselineMap: Record<string, number> = {
      sophisticated: 0.20,
      clear: 0.12,
      simple: 0.05,
    };
    const vocabBaseline = vocabBaselineMap[profile.linguistics.vocabularyLevel] ?? 0.12;
    const vocabDeviation = vocabBaseline > 0
      ? Math.abs(longRatio - vocabBaseline) / vocabBaseline
      : 0;
    signals.push({
      dimension: 'vocabulary_level',
      baseline: vocabBaseline,
      current: Math.round(longRatio * 100) / 100,
      deviation: Math.round(vocabDeviation * 100) / 100,
      severity: toSeverity(vocabDeviation),
      explanation: vocabDeviation < 0.1
        ? 'Vocabulary level matches profile'
        : `Long word ratio is ${(longRatio * 100).toFixed(0)}% vs expected ${(vocabBaseline * 100).toFixed(0)}% for "${profile.linguistics.vocabularyLevel}" vocabulary`,
    });

    // 3. Formality drift
    let casualCount = 0;
    for (const marker of CASUAL_MARKERS) {
      if (lowerText.includes(marker.toLowerCase())) casualCount++;
    }
    let formalCount = 0;
    for (const marker of FORMAL_MARKERS) {
      if (lowerText.includes(marker.toLowerCase())) formalCount++;
    }
    // Map to numeric: casual=0, semi-formal=1, formal=2
    const formalityBaselineMap: Record<string, number> = {
      casual: 0,
      'semi-formal': 1,
      formal: 2,
    };
    const formalityBaseline = formalityBaselineMap[profile.linguistics.formality] ?? 1;
    let detectedFormality: number;
    if (formalCount > casualCount + 2) {
      detectedFormality = 2;
    } else if (casualCount > formalCount + 2) {
      detectedFormality = 0;
    } else {
      detectedFormality = 1;
    }
    const formalityDeviation = Math.abs(detectedFormality - formalityBaseline) / 2; // Normalize to 0-1
    signals.push({
      dimension: 'formality',
      baseline: formalityBaseline,
      current: detectedFormality,
      deviation: Math.round(formalityDeviation * 100) / 100,
      severity: toSeverity(formalityDeviation),
      explanation: formalityDeviation < 0.1
        ? 'Formality level matches profile'
        : `Text formality is ${['casual', 'semi-formal', 'formal'][detectedFormality]} vs profile "${profile.linguistics.formality}"`,
    });

    // 4. Contraction rate drift
    // Match contractions but exclude possessives (word's where 's is possessive)
    const contractionPattern = /\b(?:can't|won't|don't|didn't|doesn't|isn't|aren't|wasn't|weren't|couldn't|wouldn't|shouldn't|haven't|hasn't|hadn't|I'm|I've|I'd|I'll|we're|we've|we'd|we'll|they're|they've|they'd|they'll|you're|you've|you'd|you'll|he's|she's|it's|that's|there's|here's|who's|what's|let's)\b/gi;
    const contractions = text.match(contractionPattern) || [];
    const contractionRate = wordCount > 0 ? contractions.length / wordCount : 0;
    // Derive baseline contraction rate from formality
    const contractionBaselineMap: Record<string, number> = {
      casual: 0.08,
      'semi-formal': 0.04,
      formal: 0.01,
    };
    const contractionBaseline = contractionBaselineMap[profile.linguistics.formality] ?? 0.04;
    const contractionDeviation = contractionBaseline > 0
      ? Math.abs(contractionRate - contractionBaseline) / contractionBaseline
      : 0;
    signals.push({
      dimension: 'contraction_rate',
      baseline: contractionBaseline,
      current: Math.round(contractionRate * 1000) / 1000,
      deviation: Math.round(contractionDeviation * 100) / 100,
      severity: toSeverity(contractionDeviation),
      explanation: contractionDeviation < 0.1
        ? 'Contraction usage matches profile'
        : `Contraction rate is ${(contractionRate * 100).toFixed(1)}% vs expected ${(contractionBaseline * 100).toFixed(1)}% for "${profile.linguistics.formality}" writing`,
    });

    // 5. Energy drift
    const exclamationCount = (text.match(/!/g) || []).length;
    const exclamationRate = sentences.length > 0 ? exclamationCount / sentences.length : 0;
    const shortSentences = sentenceLengths.filter(l => l <= 5).length;
    const shortSentenceRate = sentenceLengths.length > 0 ? shortSentences / sentenceLengths.length : 0;
    // Combine into energy score: 0 = low, 0.5 = medium, 1 = high
    const detectedEnergy = Math.min(1, (exclamationRate * 2 + shortSentenceRate) / 2);
    const energyBaselineMap: Record<string, number> = {
      high: 0.7,
      medium: 0.35,
      low: 0.1,
    };
    const energyBaseline = energyBaselineMap[profile.personality.energy] ?? 0.35;
    const energyDeviation = energyBaseline > 0
      ? Math.abs(detectedEnergy - energyBaseline) / energyBaseline
      : 0;
    signals.push({
      dimension: 'energy',
      baseline: energyBaseline,
      current: Math.round(detectedEnergy * 100) / 100,
      deviation: Math.round(energyDeviation * 100) / 100,
      severity: toSeverity(energyDeviation),
      explanation: energyDeviation < 0.1
        ? 'Energy level matches profile'
        : `Detected energy is ${detectedEnergy < 0.25 ? 'low' : detectedEnergy < 0.55 ? 'medium' : 'high'} vs profile "${profile.personality.energy}"`,
    });

    // Calculate overall drift score (weighted average mapped to 0-100)
    const weights: Record<DriftSignal['dimension'], number> = {
      sentence_length: 0.25,
      vocabulary_level: 0.25,
      formality: 0.20,
      contraction_rate: 0.15,
      energy: 0.15,
    };
    const severityToNumeric: Record<DriftSignal['severity'], number> = {
      none: 0,
      low: 25,
      medium: 55,
      high: 90,
    };
    const driftScore = Math.round(
      signals.reduce((sum, s) => sum + severityToNumeric[s.severity] * weights[s.dimension], 0)
    );
    const isAcceptable = driftScore < 40;

    return {
      driftScore,
      signals,
      isAcceptable,
      summary: buildDriftSummary(signals, driftScore),
    };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private checkFormalityMismatch(text: string, expected: 'formal' | 'semi-formal' | 'casual'): boolean {
    const lowerText = text.toLowerCase();

    let casualCount = 0;
    for (const marker of CASUAL_MARKERS) {
      if (lowerText.includes(marker.toLowerCase())) casualCount++;
    }

    let formalCount = 0;
    for (const marker of FORMAL_MARKERS) {
      if (lowerText.includes(marker.toLowerCase())) formalCount++;
    }

    // Determine detected formality
    let detected: 'formal' | 'semi-formal' | 'casual';
    if (formalCount > casualCount + 2) {
      detected = 'formal';
    } else if (casualCount > formalCount + 2) {
      detected = 'casual';
    } else {
      detected = 'semi-formal';
    }

    // Mismatch if detected is more than 1 step away
    const levels = ['casual', 'semi-formal', 'formal'];
    const expectedIdx = levels.indexOf(expected);
    const detectedIdx = levels.indexOf(detected);
    return Math.abs(expectedIdx - detectedIdx) > 1;
  }

  private checkVocabularyMismatch(text: string, expected: 'sophisticated' | 'clear' | 'simple'): boolean {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return false;

    // Count long words (> 8 chars) excluding common exceptions
    const longWords = words.filter(w => {
      const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
      return clean.length > 8 && !LONG_WORD_EXCEPTIONS.has(clean);
    });
    const longRatio = longWords.length / words.length;

    // Map ratio to level
    let detected: 'sophisticated' | 'clear' | 'simple';
    if (longRatio > 0.2) {
      detected = 'sophisticated';
    } else if (longRatio > 0.08) {
      detected = 'clear';
    } else {
      detected = 'simple';
    }

    // Mismatch if more than 1 step away
    const levels = ['simple', 'clear', 'sophisticated'];
    const expectedIdx = levels.indexOf(expected);
    const detectedIdx = levels.indexOf(detected);
    return Math.abs(expectedIdx - detectedIdx) > 1;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Map relative deviation (0-1+) to severity bucket */
function toSeverity(deviation: number): DriftSignal['severity'] {
  if (deviation < 0.1) return 'none';
  if (deviation < 0.25) return 'low';
  if (deviation < 0.5) return 'medium';
  return 'high';
}

/** Build a human-readable drift summary */
function buildDriftSummary(signals: DriftSignal[], driftScore: number): string {
  const drifted = signals.filter(s => s.severity !== 'none');
  if (drifted.length === 0) {
    return 'Text is consistent with the student\'s voice profile.';
  }

  const highDrift = drifted.filter(s => s.severity === 'high');
  const medDrift = drifted.filter(s => s.severity === 'medium');

  const parts: string[] = [];
  parts.push(`Voice drift score: ${driftScore}/100.`);

  if (highDrift.length > 0) {
    parts.push(`High drift in: ${highDrift.map(s => s.dimension.replace(/_/g, ' ')).join(', ')}.`);
  }
  if (medDrift.length > 0) {
    parts.push(`Moderate drift in: ${medDrift.map(s => s.dimension.replace(/_/g, ' ')).join(', ')}.`);
  }

  if (driftScore >= 40) {
    parts.push('Consider revising to better match the student\'s authentic voice.');
  }

  return parts.join(' ');
}

// ============================================================================
// SINGLETON
// ============================================================================

export const styleConsistencyService = new StyleConsistencyService();
