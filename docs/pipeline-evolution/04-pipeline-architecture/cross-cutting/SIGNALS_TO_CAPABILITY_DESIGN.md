# Signals → Capability Design

> **Stage 1.E** of [`CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md`](../../00-index/CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md).
> **Source finding**: ROUND_7 P2-7 (open per `ROUND_7_OPEN_ITEMS.md`).
> **Date**: 2026-05-24.

---

## 1. Problem

ROUND_7 P2-7: the 7a/7b/7c signals (`revisionIntelligence`, `claimEarnednessMap`, `rhetoricalInventory`, `archetypeDistanceProfile`, etc.) land in the coach prompt **only**. No code gates behavior on them. No routing fires. No follow-up is demanded. Impact = "did Sonnet happen to read this section" — **non-deterministic**.

The signals were built but never **wired as capabilities**. Classic integration-debt (per memory `pitfalls_integration_debt.md`).

## 2. Goal

Convert every signal from inert prompt inventory to one of three deterministic shapes:
1. **Gate** — a code-level conditional that changes routing (e.g. if `claimEarnednessMap` shows ≥2 unearned claims, force ACTION-mode annotations on those).
2. **Consuming finding** — a deterministic Finding entry that downstream layers process (e.g. `revisionIntelligence.stuckPattern` becomes a Finding that L5 must address).
3. **Coach handler** — a registered handler the L6 coaching agent triggers when the student touches a signal-tagged topic.

If a signal can't be expressed as one of these three, it has no business in the prompt inventory — surface that gap (likely a signal that's diagnostic-for-its-own-sake, on the Phase 7 cut list).

## 3. Signal inventory (initial — verify against current `profileTypes.ts`)

From ROUND_7 audit + memory references:

| Signal | Lives on | Today's effect | Proposed shape |
|---|---|---|---|
| `revisionIntelligence` | EssayProfile / L4 | Prompt inventory only | **Gate** — if revision phase 4+ and no `stuckPattern`, suppress certain phase-1 directives in L5 |
| `claimEarnednessMap` | L3.75 holistic / L4 | Prompt inventory only | **Consuming finding** — emit a `Finding` per unearned claim; L5 must produce an ACTION annotation referencing it |
| `rhetoricalInventory` | L3.75 / L4 | Prompt inventory only | **Coach handler** — when student asks "how do I add more X," handler retrieves rhetorical inventory + suggests targeted moves |
| `archetypeDistanceProfile` | L4 admissionsPositioning | Prompt inventory only | **Gate** — if distance >0.7, L5 prompt routing prioritizes differentiator-shaped annotations |
| `signatureMove` (already wired post-2026-04, verify) | L3.75 | Already gates L4 preserve-move directive | Already capability — keep as-is, use as template |
| `strongestBreakoutDimension` (7b) | L4 | Prompt inventory only | **Consuming finding** — emit a `Finding` of type `breakout_dimension`; L5 must surface ≥1 annotation that builds on it |
| ROUND_7 D3-M1 contradiction (7b vs 7c) | both | Surfaces as a contradiction | Handled by 1.B (Coherence-resolution); no new wire needed here |

Verify the list against current `profileTypes.ts` and `L3-75/FIELD_DISPOSITION_TABLE.md` during Stage 2. New signals may have landed since ROUND_7.

## 4. Approach — per-signal contract

For each signal, the design landing in this PR specifies a contract:

```ts
interface SignalCapabilityContract {
  signalId: string;
  source: 'L3.75' | 'L4' | 'L3.5';
  shape: 'gate' | 'consuming_finding' | 'coach_handler';
  // For gates:
  gateRules?: {
    condition: string;            // doc-only, the rule
    affectedRouting: string;      // doc-only, what changes
  };
  // For consuming findings:
  findingType?: string;           // Finding.type slot
  findingEmission?: string;       // doc-only — when the producer emits
  surfaceRequirement?: string;    // doc-only — what L5/coach must surface
  // For handlers:
  handlerTrigger?: string;        // doc-only — student turn shape that fires it
  handlerContract?: string;       // doc-only — what the handler returns
}
```

Contract definitions live in a new doc table (Phase 2 will turn them into code).

## 5. Template — reuse the authenticity-round pattern

The authenticity classification (PS2 / Port B3, shipped) is the same shape-fix: it took an inert inference and made it capability via `essayAuthenticityTier` + L5 read-site gating. Use as the working template.

## 6. Risks

**R1 — Over-determinism collapses LLM judgment.** Hard-gating off a signal might mask cases where the LLM correctly *should* override. Mitigation: gates set defaults; LLM can override in its prompt response if it provides reasoning. Soft determinism (preferred path, escapable) per memory `feedback_llm-first-design.md` Rule 6.

**R2 — Findings storm.** If every signal emits findings unconditionally, the FindingStore explodes and L5 promotes 50+ findings into annotations (busting the 20-30 density lock). Mitigation: each signal has an emission threshold (e.g. `claimEarnednessMap` emits only when ≥2 unearned claims) AND existing `findingPromotion` filter (already shipped 0a.3) gates surfacing.

**R3 — Signal contradiction.** Two signals could demand opposing gate behavior. Mitigation: handled by Coherence-resolution (1.B) — contradictions get resolved at L4 before gates fire.

**R4 — Coverage gap.** Some signals may not fit the three shapes cleanly. Mitigation: that's the audit signal — those signals are diagnostic-for-its-own-sake, candidate for Phase 7 cut list.

## 7. Acceptance gate (Phase 6 regen)

- Each in-scope signal has a contract written (this doc).
- Stage 2 implements ≥3 of the 6 signal contracts (highest-value first — `claimEarnednessMap` consuming finding, `archetypeDistanceProfile` gate, `signatureMove` template reuse).
- For each shipped contract: post-regen evidence trace showing the signal **changed** the output (annotation surfaced because of it, routing took a different path because of it).
- Distribution: ≥1 L5 annotation per fixture cites a consuming-finding signal in its `teachingRationale`.

## 8. Cost impact

Zero new LLM calls. Existing prompts grow modestly (each gate adds a routing condition to the existing prompt; each consuming finding is post-call deterministic). Estimate: ~+$0.005 per cold-start across all gates combined.

## 9. Out of scope this design

- Handlers (the L6 coach-handler shape) — depends on the Coaching Mode redesign (1.D). Sequenced: ship gates + consuming findings first; handlers iterate against 1.D's shape.
- New signals (e.g. essay portfolio coordination) — that's a separate capability project, not a wire-up.

## 10. Implementation notes (Stage 2)

- New module: `src/services/essayIntelligence/capabilities/signalRouter.ts` — registers per-signal gates + consuming-finding emitters. Idempotent (running it twice is a no-op).
- Wire site: `analysisOrchestrator.ts` — call `signalRouter.routeAll(profile)` post-L4, before L5.
- L5 read-site: existing `priorAnnotationsBuilder` + `findingPromotion` paths consume the emitted findings. No L5 prompt change needed (the findings flow through the existing `Finding` channel).
- Feature flag: `ENABLE_SIGNAL_ROUTING=true`. Per-signal sub-flags for incremental rollout.

## 11. Open question for Tue (Stage 2 gate)

Per-signal flagging (6 sub-flags) vs single master flag — preference?

Recommendation: per-signal flags. Lets us A/B the highest-leverage signals individually (`claimEarnednessMap` first), measure each one's effect, ship cumulatively.

---

## CORRECTIONS — appended 2026-05-24 (HEAD verification)

### S2C-C1 — `revisionIntelligence` already wired (one of the named signals)
- **Already at HEAD**: `revisionIntelligence` is fully shipped — produced at `src/services/essayIntelligence/history/revisionIntelligence.ts`, stored at `profileTypes.ts:2636` (`revisionIntelligence?: RevisionIntelligenceSignals | null`), consumed at `coachingService.ts:2225`. This signal is NOT inert.
- **Implication for §3 table**: the row covering `revisionIntelligence` should be re-marked "Capability shipped." It's the *example* of what the design wants, not a target.

### S2C-C2 — Other named signals confirmed inert
- HEAD grep returned ZERO hits for `claimEarnednessMap`, `rhetoricalInventory`, `archetypeDistanceProfile` anywhere under `src/services/essayIntelligence/`. The design's diagnosis ("loaded in prompt, no gate / no Finding / no Handler") cannot even be verified — these signals don't have producers either. Either (a) they exist under different names and need re-grepping, or (b) they're proposed signals that don't exist yet.
- **Stage 2 implementation gate**: before any code, confirm each named signal HAS a producer at HEAD. Building a signal router for non-existent signals is a wasted implementation.

### S2C-C3 — `signalRouter.ts` module path
- HEAD grep: `src/services/essayIntelligence/capabilities/` directory — verify existence before creating the new module per §10. Path may need adjustment.

### S2C-C4 — confirmed: the three named signals do not exist anywhere (2026-05-27 follow-up)

Repeated HEAD grep across the **entire `src/` tree** (not just `essayIntelligence/`):

| Signal | Hits across `src/**/*.ts` |
|---|---|
| `claimEarnednessMap` / `claimEarnedness` | **0** |
| `rhetoricalInventory` | **0** |
| `archetypeDistanceProfile` | **0** |

These are not under different names. They are not built anywhere. The design's §3 table assumes they are inert "prompt inventory" awaiting capability conversion — but **there is nothing to convert.** No producer means no signal means nothing for the router to gate / consume / handle.

**Implication for Stage 2:** the only nameable signal in the design's scope that actually has a producer is `revisionIntelligence`, and that one is **already fully wired** (producer at `history/revisionIntelligence.ts`, consumed at `coachingService.ts:2225`). Per S2C-C1, it is not inert.

**Three options Tue can choose between:**

  - **(a) Drop Item 5 entirely.** The premise — "loaded in prompt, no gate" — does not apply at HEAD. Nothing to ship.
  - **(b) Rescope to "build the three signal producers first, then wire."** Substantially bigger project than the design implies — each signal is a new analysis pass. Likely a multi-session effort, not a Stage 2 commit.
  - **(c) Rescope to "audit the actual inert prompt inventory."** Walk the system + user prompts for L4/L5/L6 and identify what IS loaded but never gates anything. The list may be entirely different from the design's three names.

**Recommendation:** (a). The router architecture is sound but applies to no current signal — and shipping a router for zero inputs is dead code. If (c) produces a real inert-signal list later, the router idea can be revived.

**Status:** Item 5 BLOCKED on Tue's choice between (a)/(b)/(c).

