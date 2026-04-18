/**
 * Port F1 — Cliché Library Re-Export
 *
 * Re-exports the `CLICHE_REFERENCE` catalog owned by
 * `src/services/commonAppWorkshop/services/semanticClicheAnalyzer.ts` so
 * downstream essay-intelligence consumers (e.g., a future L5 ACTION-mode
 * rewrite prompt that wants to cite the library's category names) have a
 * stable import path from within the essayIntelligence tree.
 *
 * This file is SERVER-SIDE ONLY. It is NOT injected into any LLM prompt.
 * Per `docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md` §5 row 2, injecting the
 * 500-phrase list into a prompt would (a) bloat the cached L3.5 system
 * prompt from ~4K to ~15K tokens and (b) invite regex-style `.includes()`
 * matching downstream, which violates LLM-first-design Rule 4.
 *
 * The L3.5 port surface for F1 is anchor extension, not list injection —
 * see `analysisPass.ts` (SCORE 38 / SCORE 52 bands, block F1_CLICHE_ANCHORS).
 *
 * Ref: docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §3 Port F1 + §5 Row 2 + §8.
 */

export { CLICHE_REFERENCE } from '../../commonAppWorkshop/services/semanticClicheAnalyzer';

/**
 * Structural type alias for the re-exported catalog. Each top-level key is a
 * category name (e.g., `opening_cliches`, `performed_vulnerability`); each
 * value is a string[] of canonical phrases. Exposed as a type for future
 * downstream consumers that want to walk category keys generically.
 *
 * NOTE: Kept structurally loose (`Record<string, readonly string[]>`) rather
 * than deriving from `typeof CLICHE_REFERENCE` — the source file carries
 * `// @ts-nocheck`, so a `typeof` derivation would pull in `any`.
 */
export type ClicheCategoryMap = Record<string, readonly string[]>;
