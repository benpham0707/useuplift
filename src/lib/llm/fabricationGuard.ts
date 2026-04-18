/**
 * Port G1 — Fabricated-Metrics Anti-Fabrication Guard
 *
 * SAFETY P0. Student copies a rewrite with a fabricated specific number onto
 * a college application → application integrity violation → rescission risk.
 *
 * This module exports a single helper, `buildFabricationGuardBlock()`, that
 * returns a block-version-wrapped FINAL-CHECK instruction to be appended to
 * the END of every generative prompt — L5 deep annotations, L6 coaching
 * responses, inline-editor command prompts, and any future prompt whose
 * output may contain example student-facing prose.
 *
 * CONTRACT:
 *   • The guard runs as a SELF-AUDIT at generation time — the LLM scans its
 *     own draft output for numeric details (percentages, counts, dollar
 *     amounts, durations, ranks, test scores, sizes) and wraps any value NOT
 *     literally present in the student's essay text in [brackets].
 *   • No post-process regex strips unbracketed numbers. The LLM self-audits.
 *     Post-process stripping would be brittle (strip legitimate numbers) and
 *     encode Rule 4 violations (discarding paid output). Prompt-level guard
 *     keeps the LLM in charge of judgment — it knows which numbers are in
 *     the essay and which aren't.
 *   • Compatible with inlineEditor's per-command `[X]` bracket convention at
 *     src/services/inlineEditor/commandPrompts.ts:195-197. Same syntax,
 *     broader enforcement surface.
 *
 * SCOPE:
 *   Generative prompts only (prompts whose output contains sample student
 *   prose). Do NOT inject into purely-analytical prompts:
 *     • L1 first impressions     — descriptive observation, no sample prose
 *     • L3 sequential deep walk  — descriptive observation, no sample prose
 *     • L3.5 analysis pass       — evaluative judgment, no sample prose
 *     • L3.75 holistic synthesis — descriptive observation, no sample prose
 *     • L4 crystallization       — internal synthesis, no sample prose
 *   Analytical prompts that emit JSON classifications (reinterpretation,
 *   context integration, state assessment, theory synthesis) are also out
 *   of scope — they don't write rewrite examples.
 *
 * CONSUMED BY:
 *   • src/services/essayIntelligence/analysis/deepAnnotationService.ts  (L5)
 *   • src/services/essayIntelligence/coaching/coachingService.ts        (L6)
 *   • src/services/inlineEditor/commandPrompts.ts                       (inline edit)
 *
 * Block slot: G1_FABRICATION_GUARD@v1.0.0 (prescriptive level).
 * Ref: docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md Section 3 Port G1 + Section 8.
 */

import { withPromptBlockVersion } from './promptBlockVersions';

// ---------------------------------------------------------------------------
// Block body — prescriptive contract (verbatim)
// ---------------------------------------------------------------------------
// Declared prescriptive in PROMPT_BLOCK_DECLARATIONS so the descriptive-
// contract lint exempts it from forbidden-vocabulary scanning. The body
// intentionally uses directive language ("MUST", "NEVER") — that is the
// point of a prescriptive guard.

// @prompt-block G1_FABRICATION_GUARD
const FABRICATION_GUARD_BODY = `## FINAL CHECK — FABRICATED METRICS GUARD (SAFETY)

Before emitting ANY example text, rewrite sketch, or demonstration, run this self-audit:

1. Scan your output for NUMERIC DETAILS: percentages, counts, dollar amounts, specific durations, ranks, GPAs, test scores, sizes.
2. For each numeric detail, ask: "Is this value LITERALLY PRESENT in the student's essay text above?"
3. If YES — emit the value as-is.
4. If NO — wrap it in brackets: [X%], [N people], [$Y], [Z weeks], [placeholder].
5. NEVER emit a confident specific number the student didn't write. Students may copy your example onto a college application. A fabricated metric is an integrity violation that can result in rescission.

This rule applies to EVERY numeric detail — even plausible-sounding ones. When in doubt, bracket it.`;

/**
 * Returns the G1 FINAL CHECK block wrapped with block-version markers.
 *
 * Intended to be appended to the END of every generative prompt (L5, L6,
 * inlineEditor command prompts, any prompt that emits example prose). The
 * block is a self-audit line the LLM runs before emitting its response.
 *
 * The returned string is self-contained and includes a leading blank line
 * separator convention — callers should concatenate it with a simple
 * `\n\n` prefix or append directly after an existing newline-terminated
 * section.
 */
export function buildFabricationGuardBlock(): string {
  return withPromptBlockVersion(FABRICATION_GUARD_BODY, 'G1_FABRICATION_GUARD');
}
