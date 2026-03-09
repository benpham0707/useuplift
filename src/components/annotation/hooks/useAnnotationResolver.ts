/**
 * useAnnotationResolver — memoized anchor resolution hook.
 *
 * Wraps resolveAnchors() in a useMemo so that resolved annotations
 * are only recomputed when the annotations, text, or text hash change.
 */

import { useMemo } from 'react';
import type { EssayAnnotation } from '../../../pipeline/types';
import type { ResolvedAnnotation } from '../types';
import { resolveAnchors } from '../utils/anchorResolver';

/**
 * Resolve annotation text spans to character offsets in the current text.
 *
 * @param annotations - Annotations from the analysis result
 * @param currentText - The current essay text (may differ from analyzed text)
 * @param textHash - SHA-256 hash of the text that was analyzed
 * @returns Resolved annotations with character offsets and anchor method
 */
export function useAnnotationResolver(
  annotations: EssayAnnotation[] | undefined,
  currentText: string,
  textHash: string,
): ResolvedAnnotation[] {
  return useMemo(() => {
    if (!annotations || annotations.length === 0 || !currentText) {
      return [];
    }

    return resolveAnchors(annotations, currentText, textHash);
  }, [annotations, currentText, textHash]);
}
