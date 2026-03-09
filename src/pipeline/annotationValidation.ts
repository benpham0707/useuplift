/**
 * Shared Annotation Validation — Used by both single and batch pipelines
 *
 * Validates LLM-produced annotations against the source text:
 * - Verifies span.text is an exact substring
 * - Verifies or corrects character offsets (CRITICAL: prevents wrong positions)
 * - Validates dimensionId, severity, confidence
 */

import crypto from 'node:crypto';
import { dimensionRegistry } from '../workshop';
import type { EssayAnnotation, RawLLMAnnotation, AnnotationSeverity } from './types';

const VALID_SEVERITIES: ReadonlySet<string> = new Set<AnnotationSeverity>([
  'critical',
  'important',
  'suggestion',
  'strength',
]);

/** Clamp a number to [min, max] */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validate raw LLM annotations against the source text.
 *
 * For each annotation:
 * 1. Verifies span.text exists as an exact substring
 * 2. If offsets are provided, verifies they match — if not, corrects them
 * 3. If no offsets, computes them via indexOf
 * 4. Validates dimensionId, severity, confidence
 */
export function validateAnnotations(
  rawAnnotations: RawLLMAnnotation[],
  sourceText: string,
  logPrefix: string = '[Pipeline]',
): EssayAnnotation[] {
  const validated: EssayAnnotation[] = [];

  for (const raw of rawAnnotations) {
    // 1. Verify span.text exists in the source text
    if (!raw.span?.text) {
      console.warn(`${logPrefix} Skipping annotation: missing span text`);
      continue;
    }

    const spanText = raw.span.text;
    const foundIndex = sourceText.indexOf(spanText);

    if (foundIndex === -1) {
      console.warn(`${logPrefix} Skipping annotation: span text not found in source`);
      continue;
    }

    // 2. Verify or correct offsets
    let startOffset = raw.span.startOffset ?? 0;
    let endOffset = raw.span.endOffset ?? 0;

    // Check if LLM-provided offsets are correct
    const offsetsValid =
      startOffset >= 0 &&
      endOffset > startOffset &&
      endOffset <= sourceText.length &&
      sourceText.substring(startOffset, endOffset) === spanText;

    if (!offsetsValid) {
      // Offsets are wrong or missing — correct them using indexOf
      startOffset = foundIndex;
      endOffset = foundIndex + spanText.length;
    }

    // 3. Compute paragraph index from validated offset
    const paragraphIndex = computeParagraphIndex(sourceText, startOffset);

    // 4. Validate dimensionId
    if (!dimensionRegistry.getDimension(raw.dimensionId)) {
      console.warn(
        `${logPrefix} Skipping annotation: unknown dimensionId "${raw.dimensionId}"`,
      );
      continue;
    }

    // 5. Validate severity
    if (!VALID_SEVERITIES.has(raw.severity)) {
      console.warn(
        `${logPrefix} Skipping annotation: invalid severity "${raw.severity}"`,
      );
      continue;
    }

    validated.push({
      id: crypto.randomUUID(),
      span: {
        text: spanText,
        startOffset,
        endOffset,
        paragraphIndex,
      },
      dimensionId: raw.dimensionId,
      severity: raw.severity,
      isStrength: raw.isStrength ?? (raw.severity === 'strength'),
      insight: raw.insight ?? '',
      suggestion: raw.suggestion ?? '',
      rewriteExample: raw.rewriteExample,
      applicableCommand: raw.applicableCommand,
      confidence: clamp(raw.confidence ?? 0.5, 0, 1),
      stale: false,
    });
  }

  return validated;
}

/**
 * Compute 0-indexed paragraph index from character offset.
 * Paragraphs are delimited by blank lines (double newline).
 */
function computeParagraphIndex(text: string, charOffset: number): number {
  const beforeOffset = text.substring(0, charOffset);
  const breaks = beforeOffset.match(/\n\s*\n/g);
  return breaks ? breaks.length : 0;
}
