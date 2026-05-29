# Coherence-Resolution Design

> **Stage 1.B** of [`CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md`](../../00-index/CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md).
> **Decision locked**: D6 — option (a) L4 prompt extension (NOT dedicated post-L4 resolver).
> **Date**: 2026-05-24.

---

## 1. Problem

Pipeline self-flags contradictions across signals (e.g. ROUND_7 D3-M1: `7b.strongestBreakoutDimension='claim'` while same claim is `UNEARNED` per `claimEarnednessMap`). Counselor-gap memory: ~11 contradictions per fixture reach the student surface RAW today.

Self-contradiction destroys trust faster than any single bad insight. A counselor would never put a contradictory verdict in front of a student — they'd resolve it (one wins) or frame it (both are partially true under different conditions).

## 2. Goal

Before the student-facing render, the L4 crystallizer **resolves** each contradiction into one of three terminal states:
1. **resolved** — one side wins, with reasoning. The losing side is not surfaced.
2. **framed** — both sides are partially true under different conditions. Both surface, but the contradiction is named and explained, not left implicit.
3. **escalated** — the contradiction reflects a genuine ambiguity that the student should be aware of and decide about (rare).

No raw contradiction reaches L5 (and thus the student) unframed.

## 3. Why L4 prompt extension (option a), not a dedicated resolver

The L4 crystallizer already sees `coherenceReport.contradictions` (per `contradictionConsumer.ts:44-86`). The gap is that resolution is **incidental** in the current L4 prompt — sometimes the LLM weaves contradictions into reasoning, sometimes it doesn't. Making it a **structural directive** in the prompt is the lowest-cost intervention.

A dedicated resolver call (option b) adds:
- +$0.02–0.05 per essay (one extra Sonnet call)
- Round-trip latency
- A new schema field (`coherenceResolution`) that L5 has to consume
- Coordination burden if L4 and the resolver disagree

The directive in-prompt has none of these and reuses L4's existing context.

## 4. Approach — L4 prompt block

Added to `crystallizer.ts` `buildSystemPromptL4Unified()` (the shared system prompt across all three L4 modes — the unified path is now default-on per Stage 0.E):

```
CONTRADICTION HANDLING (mandatory — applies to all three modes)

You see `coherenceReport.contradictions` and `contradictionFlags` (when
emitted by L3.5). For EVERY contradiction, you must terminate it in
your output via one of three states:

1. RESOLVED — one side wins. State which, in one sentence, and why
   the other is wrong (or partially wrong in a way the student should
   not act on). The losing side will not surface to the student.
   USE THIS when the evidence is genuinely lopsided.

2. FRAMED — both sides are partially true under different conditions.
   Name BOTH conditions and BOTH partial truths in one sentence each,
   so the student sees a coherent both/and instead of a flat
   contradiction. USE THIS when both sides have real evidence.

3. ESCALATED — the contradiction reflects a real ambiguity the
   student should decide about (e.g. "is this claim earned?"
   genuinely depends on a choice the student makes about scope).
   USE THIS sparingly — student decisions only, not pipeline
   uncertainty.

Forbidden: leaving any contradiction unaddressed in your output.
If you cannot reach a terminal state, default to FRAMED with a
"both signals see something real" framing — DO NOT silently drop
either side.

Output every termination on a new `coherenceResolution` entry in
your JSON output (schema below). L5 reads this to decide what
surfaces and how.
```

## 5. Schema additions

### 5.1 L4 output (NorthStar, ScoreMatrix, L4b — whichever crystallizer surface emits resolutions; recommend ScoreMatrix output since contradictions are scoring-context)

```ts
export interface CoherenceResolution {
  /** The contradiction being resolved. Stable identifier — references coherenceReport.contradictions[i] or L3.5 contradictionFlags[j]. */
  contradictionId: string;
  /** Terminal state */
  state: 'resolved' | 'framed' | 'escalated';
  /** When 'resolved': which side wins. When 'framed': both, with the conditions that make each true. When 'escalated': the decision the student must make. */
  reasoning: string;
  /** Which signals to surface to L5 — IDs of the contradicting elements that remain visible. */
  surfaceSignals: string[];
  /** When 'resolved': IDs of the suppressed signal (the losing side). L5 must not render these. */
  suppressedSignals: string[];
}
```

Add `coherenceResolutions: CoherenceResolution[]` to `ParagraphScoreMatrix` (paragraph-scope) and to `EssayNorthStar` (essay-scope, if essay-level contradictions exist).

### 5.2 L5 consumer

`deepAnnotationService.ts`:
- Before emitting any annotation that would surface a contradicting signal, check `coherenceResolutions[].suppressedSignals` — if the signal is in a `suppressed` list, do not surface the annotation.
- When surfacing a `framed` contradiction, the annotation must include the framing reasoning (not just one side raw).

## 6. Risks

**R1 — L4 ignores the directive.** The prompt says "mandatory" but LLMs sometimes drop directives. Mitigation: post-call validator in `crystallizer.ts` parses the L4 output, counts the contradictions in input vs the `coherenceResolutions` in output; if any contradiction lacks a resolution, log a warning + escalate to `framed` with a default framing. Don't fail the call.

**R2 — Over-resolution.** L4 might "resolve" contradictions that genuinely shouldn't be resolved (collapsing two real signals into one). Mitigation: bias the prompt toward `framed` (says "default to FRAMED if you can't reach a terminal state") and review the resolved-vs-framed-vs-escalated distribution after the regen — if `resolved` is >70%, the LLM is collapsing real signal.

**R3 — Cache invalidation.** Adding to the L4 system prompt changes its hash → busts the cache one time on rollout. Acceptable single-cost cold-start.

**R4 — Interaction with the Calibration Few-shot (1.C).** Both add to L4 system prompt. Order: calibration first (top), contradiction handling second. Combined prompt growth ~+1500 tokens cached — negligible per-call but worth measuring against Phase B budget.

## 7. Acceptance gate (Phase 6 regen)

- **Zero raw contradictions reach the student render.** Diff `tests/output/full-profile-14-harvard-2028-crochet.md` against the May 5 dump — no two L5 annotations or holistic sections should make directly opposing claims.
- **Every input `coherenceReport.contradictions[i]` has a corresponding `coherenceResolutions[j]` entry** with state ∈ {resolved, framed, escalated}.
- **Distribution check**: resolved ≤70%, framed 20–60%, escalated <10%. Outside that band → prompt re-tune.
- **No annotation surfaces a signal that's in a `suppressedSignals` list** (post-render scan).
- **Manual scan on Crochet fixture**: would Tue's editorial gut accept this as "the contradictions are handled"?

## 8. Migration

- L5 read-site change is the load-bearing migration. Until L5 enforces `suppressedSignals`, the L4 emission is informational. Stage 2 ships them together so the gate is meaningful.
- Backward compat: if `coherenceResolutions` is absent (pre-this-PR essays in cache or storage), L5 falls back to current behavior (raw signal surfacing). No errors.

## 9. Cost impact

Zero new round-trips. L4 system prompt grows by ~400-600 tokens (cached). L4 output grows by ~50-150 tokens per contradiction × ~11 = ~700-1500 output tokens. Net: **~+$0.01–0.02 per cold-start.**

## 10. Open question for Tue (Stage 2 gate)

`coherenceResolutions` lives on `ParagraphScoreMatrix` (per-paragraph) or on `EssayNorthStar` (essay-scope) — or both? The current contradictions in `coherenceReport` and `L3.5 contradictionFlags` are mixed-scope. Recommend: both. ScoreMatrix for paragraph-scope, NorthStar for essay-scope. L5 consumes both.

Alternative: a single essay-level `coherenceResolutions` field on `EssayProfile` (downstream of L4). Cleaner but loses the per-paragraph scope.

---

## CORRECTIONS — appended 2026-05-24 (HEAD verification)

### CR-C1 — partial-shipping baseline
- **Already at HEAD**: `CoherenceReport` is produced today by L4b (`crystallizer.ts:160, 565, 585+` — explicit "ACTIVE INVESTIGATION of contradictions ACROSS profile sections" at `:665`). `contradictions: CoherenceIssue[]` exists in the output. L4b mentions coherenceReport as part of its OUTPUT, NOT as an absent feature.
- **Confirmed NOT at HEAD**: grep `coherenceResolution\|CoherenceResolution` returns ZERO. Neither the prompt directive forcing terminal-state assignment (`resolved`/`framed`/`escalated`) nor the schema field exists.

### Real Stage 2 delta
The L4 crystallizer prompt extension (§4) and `CoherenceResolution[]` schema field (§5.1) are net-new. The L5 enforcement wire-site is also net-new. Locked decision per plan §0.5: ship the field on BOTH `ParagraphScoreMatrix` AND `EssayNorthStar`. No further design-vs-HEAD friction expected.

