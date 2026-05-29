// ============================================================================
// parseMEMGap — deterministic parser for MomentEarnednessMap gap strings
// ============================================================================
//
// L3.75's MomentEarnednessMap emits each gap as a free-text string with the
// pattern:   "<earningMechanismType>—<description>"
//
// Example (from Crochet essay):
//   "intellectual_scaffolding—the essay elides the entire learning process.
//    P2 ends with cyclical failure, P3S1 opens with achieved mastery."
//
// This parser splits on the em-dash (or en-dash), validates the prefix against
// `EarningMechanismType`, and returns a typed { mechanism, description } pair.
// When the prefix doesn't match a known mechanism — or when there is no em/en-dash
// separator at all — the parser returns `{ mechanism: 'unclassified',
// description: fullString, parsed: false }`. The downstream rewrite generator
// degrades gracefully on 'unclassified' (Q6a decision).
//
// Hyphen-minus ('-') is intentionally NOT treated as a separator: it appears
// inside English prose too often ("first-person", "two-thirds") to be safe.
//
// Why a parser instead of a prompt change to L3.75: Q2 decision. The L3.75
// layer is the highest-cost layer in the pipeline and we've agreed to make only
// conservative cuts to it. A parser ships immediately, is back-compat with
// existing profiles, and degrades open. If telemetry shows parse-failure rate
// > 10% in production, revisit the prompt change with hard data.

import type { EarningMechanismType } from '../profileTypes';

const VALID_MECHANISMS: readonly EarningMechanismType[] = [
  'sensory_grounding',
  'emotional_setup',
  'stakes_establishment',
  'character_revelation',
  'thematic_preparation',
  'intellectual_scaffolding',
  'comedic_subversive_setup',
] as const;

const VALID_MECHANISM_SET: ReadonlySet<string> = new Set<string>(VALID_MECHANISMS);

/**
 * Parse result. `parsed: true` means the prefix matched a known mechanism;
 * `parsed: false` means the parser fell back to 'unclassified' (and the
 * downstream rewriter should rely on architecturalReason + the unparsed
 * description string to understand the gap).
 */
export interface ParsedMEMGap {
  mechanism: EarningMechanismType | 'unclassified';
  description: string;
  parsed: boolean;
}

/**
 * Splits a MEM gap string on the first em-dash (U+2014) or en-dash (U+2013).
 * Falls back to 'unclassified' on any input that doesn't yield a known
 * EarningMechanismType prefix.
 *
 * Specifically:
 *   - Trims surrounding whitespace.
 *   - Empty / whitespace-only input → unclassified with empty description.
 *   - No em-dash or en-dash anywhere → unclassified with full input as description.
 *   - Has em/en-dash but prefix not in EarningMechanismType → unclassified with
 *     FULL ORIGINAL string as description (so the rewriter sees the raw gap text).
 *   - Has em/en-dash AND prefix matches (case-insensitive) → typed mechanism +
 *     trimmed description after the separator. Multiple em-dashes in the
 *     description are preserved (split only on the FIRST occurrence).
 */
export function parseMEMGap(gapString: string): ParsedMEMGap {
  const trimmed = gapString.trim();

  if (trimmed.length === 0) {
    return { mechanism: 'unclassified', description: '', parsed: false };
  }

  // Match: prefix (no em/en-dash chars) + optional whitespace + separator +
  // optional whitespace + rest. Non-greedy `+?` ensures we split on the FIRST
  // em-dash, leaving any later em-dashes inside the description intact.
  const separatorRegex = /^([^—–]+?)\s*[—–]\s*(.*)$/;
  const match = trimmed.match(separatorRegex);

  if (!match) {
    // No em-dash or en-dash anywhere. Likely a malformed gap string from
    // L3.75; return the whole thing as description so the rewriter sees the
    // raw signal.
    return { mechanism: 'unclassified', description: trimmed, parsed: false };
  }

  const [, rawPrefix, rawDescription] = match;
  const prefixNormalized = rawPrefix.trim().toLowerCase();

  if (VALID_MECHANISM_SET.has(prefixNormalized)) {
    return {
      mechanism: prefixNormalized as EarningMechanismType,
      description: rawDescription.trim(),
      parsed: true,
    };
  }

  // Em-dash found but prefix didn't match a known mechanism. Preserve the
  // FULL ORIGINAL string as the description so no information is lost; the
  // rewriter falls back to architecturalReason for the gap classification.
  return { mechanism: 'unclassified', description: trimmed, parsed: false };
}
