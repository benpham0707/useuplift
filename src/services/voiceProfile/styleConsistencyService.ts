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

// ============================================================================
// SINGLETON
// ============================================================================

export const styleConsistencyService = new StyleConsistencyService();
