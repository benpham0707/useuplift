/**
 * preCallEnrichment.ts — Zero-LLM-cost enrichment for L5 paragraph prompts.
 *
 * Runs deterministic pattern detection against the paragraph text to surface:
 *   (1) REWRITE SCAFFOLDS — BEFORE/AFTER transformation patterns from
 *       `TRANSFORMATION_EXAMPLES` (matched by category via telling-phrase
 *       detection).
 *   (2) DETECTED ANTI-PATTERN PHRASES — exact 5-12 word clichéd phrases
 *       lifted from `TELLING_PHRASE_PATTERNS` that the LLM should quote
 *       verbatim in `antiPatternExample`.
 *   (3) WORD ECONOMY SIGNALS — long sentences (>28 words) and filler
 *       patterns (e.g., "in order to", "the fact that") flagged as
 *       candidate cuts in Polish/Distinction phase essays.
 *
 * Infrastructure reused (zero new services, zero new LLM calls):
 *   - detectTellingPhrases (coaching/teachingContentRouter.ts:198)
 *   - TRANSFORMATION_EXAMPLES (commonAppWorkshop/data/transformationExamples.ts:82)
 *
 * Usage: `const enrichment = await buildPreCallEnrichment(para, phase.level);`
 * Then pass `enrichment` to `buildParagraphPrompt()` as the 8th parameter.
 * The enrichment.promptBlock is injected into the paragraph prompt
 * immediately before the GENERATION INSTRUCTIONS section.
 *
 * Scope 1 GAP-6 / GAP-7 / GAP-8. Reference: docs/specs/FORGE_PLAN_SCOPE1.md Phase 3.
 */

import type { ParagraphProfile } from '../profileTypes';

export interface PreCallEnrichment {
  /** Full enrichment block, ready to append to buildParagraphPrompt() sections.
   *  Empty string when no scaffolds, phrases, or word-economy signals matched. */
  promptBlock: string;
  /** Pre-matched telling phrases (candidates for antiPatternExample field) */
  detectedPhrases: string[];
  /** Whether any scaffolds or signals are available */
  hasScaffolds: boolean;
}

/**
 * Filler patterns for word economy detection (GAP-7).
 *
 * Intentionally narrow list to avoid false positives — real students use
 * phrases like "in order to" and "the fact that" idiomatically, so this is
 * a SIGNAL not a judgment. The LLM still decides whether to suggest a cut
 * based on the sentence's architectural function.
 */
const FILLER_PATTERNS: readonly string[] = [
  'in order to',
  'the fact that',
  'it is important to note',
  'as a result of',
  'due to the fact',
  'at this point in time',
  'for the purpose of',
  'despite the fact that',
  'in the event that',
  'whether or not',
  'basically',
  'essentially',
  'the way in which',
  'with regard to',
];

/** Long-sentence threshold — sentences above this word count get flagged. */
const LONG_SENTENCE_THRESHOLD_WORDS = 28;

/**
 * Build the pre-call enrichment block for a single paragraph.
 *
 * @param para The paragraph profile (used for text + sentence structure)
 * @param phaseLevel Current improvement phase — word economy diagnostics
 *                   only fire for 'polish' and 'distinction' phases
 * @returns Enrichment object; `promptBlock` is empty when nothing matched
 */
export async function buildPreCallEnrichment(
  para: Readonly<ParagraphProfile>,
  phaseLevel: string,
): Promise<PreCallEnrichment> {
  const paraText = para.sentences.map((s) => s.text).join(' ');
  const lines: string[] = [];
  const detectedPhrases: string[] = [];

  // ── GAP-6 / GAP-8: REWRITE SCAFFOLDS + DETECTED ANTI-PATTERN PHRASES ──
  try {
    const { detectTellingPhrases } = await import('../coaching/teachingContentRouter');
    const matches = await detectTellingPhrases(paraText, 3);

    // Extract raw phrases for antiPatternExample candidates
    for (const match of matches) {
      // Content format: 'TELLING PHRASE DETECTED: "<phrase>" (category)\n  BEFORE: ...'
      const phraseMatch = /TELLING PHRASE DETECTED:\s*"([^"]+)"/.exec(match.content);
      if (phraseMatch?.[1]) {
        detectedPhrases.push(phraseMatch[1]);
      }
    }

    if (matches.length > 0) {
      lines.push('REWRITE SCAFFOLDS — adapt (do not copy verbatim):');
      for (const match of matches) {
        // Indent the multi-line BEFORE/AFTER/TECHNIQUE block
        const indented = match.content.split('\n').map((l) => `  ${l}`).join('\n');
        lines.push(indented);
      }

      if (detectedPhrases.length > 0) {
        lines.push('');
        lines.push(
          'DETECTED ANTI-PATTERN PHRASES (use for antiPatternExample when annotating at these locations):',
        );
        for (const phrase of detectedPhrases) {
          lines.push(`  "${phrase}"`);
        }
      }
    }
  } catch (err) {
    // Non-fatal — enrichment is additive. Log with layer prefix for diagnostic
    // visibility per X28 correction from R2 audit (silent-swallow catches
    // violate Operating Doctrine rule 5).
    console.warn(
      '[preCallEnrichment] telling-phrase detection failed:',
      err instanceof Error ? err.message : err,
    );
  }

  // ── GAP-7: Word economy diagnostics (Polish / Distinction only) ──
  if (phaseLevel === 'polish' || phaseLevel === 'distinction') {
    const diagnostics: string[] = [];
    for (const s of para.sentences) {
      const words = s.text.trim().split(/\s+/);
      const wordCount = words.length;
      const lowerText = s.text.toLowerCase();
      const matchedFillers = FILLER_PATTERNS.filter((p) => lowerText.includes(p));
      if (wordCount > LONG_SENTENCE_THRESHOLD_WORDS || matchedFillers.length > 0) {
        const fillerNote = matchedFillers.length > 0
          ? ` — filler: "${matchedFillers.join('", "')}"`
          : '';
        diagnostics.push(`  S${s.index} (${wordCount} words)${fillerNote}`);
      }
    }

    if (diagnostics.length > 0) {
      if (lines.length > 0) lines.push('');
      lines.push('WORD ECONOMY SIGNALS (pre-detected, for wordEconomyCut suggestions):');
      lines.push(...diagnostics);
      lines.push(
        'When a rewriteExample ADDS net words to this paragraph, populate wordEconomyCut with ' +
          'a specific sentence to cut that the rewrite renders redundant.',
      );
    }
  }

  return {
    promptBlock: lines.length > 0 ? lines.join('\n') : '',
    detectedPhrases,
    hasScaffolds: lines.length > 0,
  };
}
