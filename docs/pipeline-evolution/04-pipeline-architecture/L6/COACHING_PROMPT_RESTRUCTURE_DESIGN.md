# Coaching Prompt Restructure Design (Prompt-Overload Fix)

> **Stage 1.G** of [`CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md`](../../00-index/CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md).
> **Source finding**: ROUND_7 P2-8 (open per `ROUND_7_OPEN_ITEMS.md`).
> **Date**: 2026-05-24.

---

## 1. Problem

ROUND_7 P2-8 root cause: under full enrichment the L6 coaching prompt injects 600–1,100 tokens of verdict-laden content *before* the essay text. Sonnet reads conclusions before evidence — the opposite of how an AO reads.

Two compounding effects:
1. **Per-turn**: every coach response carries this inversion. The LLM anchors on the verdicts before reading the essay, so it weights its response toward the verdict-shaped frame.
2. **Per-round**: each new coaching round adds more enrichment. By round 3+, the prompt is 1500+ tokens of "here's what the system thinks before you read" before the actual student message + essay.

## 2. Goal

Restructure the L6 coaching prompt so:
- Essay text appears BEFORE any verdict-laden injection.
- Verdict-laden enrichment is compacted into one ≤300-token "Diagnostic Snapshot" block.
- Per-round growth is bounded (deferred-area signals stay loaded but un-prefaced).

Target: total verdict-injection tokens ≤300 in any single coaching prompt, regardless of round count.

## 3. Current structure (per `coachingService.ts`)

Approximate ordering today (from ROUND_7 audit):
```
[System prompt — role, constraints]
[Phase-aware framing — "you are coaching a student at {phase}..."]
[7a/7b/7c signals dump — revisionIntelligence, claimEarnednessMap, ...]
[archetypeDistanceProfile + portfolio framing]
[Per-paragraph verdicts + scores]
[Prior coaching turns]
[Student's current message]
[Essay text]
```

The essay is **last** — after 600-1100 tokens of "the system has already judged."

## 4. Target structure

```
[System prompt — role, constraints, calibration]
[Essay text — FULL, unchanged]
[Phase-aware framing — 1 sentence]
[Diagnostic Snapshot — compacted, ≤300 tokens]
[Student's current message]
[(Prior coaching turns — last 2 only, deeper rotated to summary)]
```

### 4.1 Diagnostic Snapshot — what compacts to ≤300 tokens

| Source | Snapshot allocation |
|---|---|
| ExecutiveBrief verdict (from 1.A) | 1 sentence — the calibrated verdict |
| ExecutiveBrief directives 1+2 | The top-2 actions — student's current priorities |
| Phase | 1 sentence — "student is at {phase}; coach at {focus}" |
| Top 3 surfaced L5Annotation `teachingIntent` | 3 bullets — what's actively being taught |
| coherenceResolutions framed/escalated count | "Note: 2 framed contradictions, 1 escalated" — only if present |

Everything else (7a/7b/7c full dumps, full per-paragraph score matrix, archetypeDistanceProfile prose, deep insights) moves to an **opt-in retrieval surface** — the coach can ASK for them via tool-use when a specific topic comes up. Not pre-loaded.

## 5. Approach — compaction + reordering, no new LLM call

This is a single-file change to `coachingService.ts` prompt assembly. No new LLM call. No schema additions (Diagnostic Snapshot is rendered from existing artifacts).

The retrieval surface for the de-loaded content uses an existing pattern (whatever `coachingService.ts` uses for context routing today — likely the existing `ContextRoute` + `ContextSlice` mechanism in types.ts). Phase 8 corpus retrieval can hook in here too.

## 6. Prior-turn handling (per-round compounding fix)

Currently, every prior coach turn is included verbatim. Round 3+ → bloat.

Replacement: last 2 turns verbatim, earlier turns rotated to a one-line summary (LLM-generated at-turn-end and cached). Total prior-turn tokens cap: 800.

## 7. Risks

**R1 — Coach loses context for nuanced questions.** When the student asks "what about my voice register?" the coach no longer has voice signals pre-loaded. Mitigation: retrieval surface returns full voice context on-demand (a single tool-call). Net result: better signal-to-noise on common questions, slight latency on rare deep-dive questions.

**R2 — Snapshot misses the load-bearing context.** Pick wrong 3 annotations → coach gives wrong-shaped response. Mitigation: snapshot is derived from the same `surfaced` + `priority` flags L5's Top-N ranker already calibrates. If those are right, snapshot is right.

**R3 — Essay-text-first changes Sonnet's reading mode.** Sonnet might now spend more tokens "describing the essay" before answering. Mitigation: system prompt explicitly instructs "the essay is provided so you can ground answers in it — do not summarize it back."

**R4 — Prior-turn rotation loses thread continuity.** Round 5+ might "forget" a commitment made in round 1. Mitigation: the rotated summaries explicitly preserve commitments (e.g., "round 1: student committed to rewriting P3"). Plus the L5 carry-forward `taughtMoves` already tracks cross-round teaching state.

## 8. Acceptance gate (Phase 6 regen — coaching path subset)

Phase 6 regen primarily targets cold-start. A coaching subset test:
- Spin up 5 consecutive coaching turns on the Crochet fixture.
- Per-turn input token count: cap 4000 (vs current ~6000+ on round 3+).
- Diagnostic Snapshot render in each prompt is ≤300 tokens (measured).
- Essay text appears before any verdict block (positional check).
- Manual: round-3 response quality ≥ baseline (subjective — Tue reads 3 round-3 responses).

## 9. Cost impact

- Per-turn prompt input shrinks ~25-40% on rounds 2+.
- Cached prefix grows (snapshot is regenerated per turn, so it's not cached; but the system prompt + essay text ARE more cacheable now).
- Net per-turn cost: down 10-25% on rounds 2+ (estimate). Zero new round-trips.

## 10. Implementation notes (for Stage 2)

- File: `coachingService.ts` — single prompt-assembly refactor.
- New helper: `buildDiagnosticSnapshot(profile, executiveBrief, l5Result, phase): string` — pure function, ≤300 token output. Module: `coachingService/diagnosticSnapshot.ts` (new).
- Prior-turn rotation: extend the existing turn-management code to rotate-to-summary at turn 3+. Summary generation is a small Haiku call at turn END, cached on the turn record.
- Retrieval surface: reuse existing ContextRoute mechanism. Add new ContextSlice types for the demoted content (`'voiceFullProfile'`, `'paragraphScoreMatrixFull'`, `'archetypeDistanceProfileFull'`).
- Feature flag: `ENABLE_COACHING_PROMPT_RESTRUCTURE=true`. Default off until Phase 6 confirms quality holds.

## 11. Open question for Tue (Stage 2 gate)

The "rotate to summary at turn 3+" approach adds a Haiku call per coaching turn (after the response, async). Acceptable, or hard-coded summary template preferred?

Recommendation: Haiku summary. Templates produce uniform-tone summaries that lose the per-turn texture (student's actual concern, what got committed). +$0.001–0.002 per turn for the summary call — negligible.

---

## CORRECTIONS — appended 2026-05-24 (HEAD verification)

### CPR-C1 — partial verification: L6 prompt assembly NOT fully verified
- **Already at HEAD**: `coachingService.ts` is the L6 service. `revisionIntelligence` is wired into context assembly at `:2225`. Prior-turn injection mechanism exists.
- **NOT verified by HEAD grep alone**: the current order of essay-text vs verdicts in `promptBlocks.ts` and exact `buildCoachingPrompt` shape were not deeply inspected. The design assumes the current prompt puts verdicts BEFORE essay text (§3) — that claim was not confirmed against HEAD.
- **Implementation gate**: before any code, Stage 2 must start with a thorough read of `coachingService/promptBlocks.ts` to confirm (a) current prompt section ordering, (b) current Diagnostic-Snapshot-like compaction (does anything similar already exist?), (c) current prior-turn rotation behavior. Only then proceed.
- **Pre-existing assets**: `buildDiagnosticSnapshot` does NOT exist at HEAD (`coachingService/diagnosticSnapshot.ts` is new). `ContextRoute` mechanism per §10 — needs HEAD verification before §10 wiring claims.

### CPR-C2 — design's mental model doesn't match HEAD prompt structure (2026-05-27 follow-up)

Inspected `promptBlocks.ts:2328 buildCoachingPrompt()` and `coachingService.ts:2660 runStage3CoachingResponse` user-prompt assembly. **The design's premise — "essay text moves BEFORE verdicts" — does not apply.** Findings:

1. **There is no single "essay text" block in the L6 prompt.** Essay-text content reaches the model through findings + checklist + improvementQueue + dynamicProfileContext sections, not as a literal verbatim block.
2. **There are no "verdicts" as a distinct block either.** What the design calls "600-1100 tokens of verdict-laden injection" is distributed across ~20 small sidecar sections (sessionArc, journal, momentum, checklist, improvementQueue, edgeProtocol, priorStrategic, mirror, learningStyle, etc.). No single section is the "verdict" target.
3. **The system prompt is the 17-block coaching identity assembly** (identity, voice, essayType, responseStructure, knowledge, dynamics, priorities, phase, …). It is byte-stable for caching and unrelated to per-turn verdict-vs-essay-text ordering.
4. **The current "verdict-y" content is gated by relevance, not load-bearing.** Many sidecar sections emit `''` when conditions aren't met. The "compounding 1100 tokens per turn" claim needs measurement against actual turn fixtures before being treated as fact.

**Implication for Stage 2:** the design as written cannot be implemented — there is no `verdicts` slot to reorder, no monolithic block to compact. Three options Tue can choose between:

  - **(a) Rescope to "compact the sidecar list."** Audit the 20 sidecar sections, identify the 5-6 that under-deliver vs. their token cost, gate them more aggressively. Measurable, smaller delta, no schema change.
  - **(b) Rescope to "Diagnostic Snapshot ABOVE the conversation."** Build a new ≤300-token summary block (Brief verdict + top 3 directives + phase + 1-line essay diagnosis) that prepends the user prompt. Net-new block, not a reorder.
  - **(c) Drop Item 4 from Stage 2.** The L6 prompt isn't the bottleneck the design assumed.

**Recommendation:** (b). Pairs naturally with Stage 2.A Executive Brief (now shipped flagged) — the Brief becomes the data source for the Diagnostic Snapshot block in L6. Requires a redesigned §4 and §5; current text targets the wrong structure.

**Status:** Item 4 BLOCKED on Tue's choice between (a)/(b)/(c) and corresponding design rewrite.

