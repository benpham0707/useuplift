# 01 — Cost Recovery + Intentional Pipeline Flow

> ⚠️ **DISSOLVED 2026-05-10** — workstream 01's consolidated changeset (Phases A–E)
> is effectively dissolved. The cache fixes shipped piecemeal (no single PR
> ever materialized); the architectural pivot (kill L3.75) was absorbed into
> workstream 04. The cost-recovery decisions D1–D5 are historical. The current
> cost target is **$0.85 cold-start / ≤$1.20 lifecycle** per
> [`../00-index/UNIFIED_PLAN_HOLD_2026_05_10.md`](../00-index/UNIFIED_PLAN_HOLD_2026_05_10.md)
> — substantially tighter than this doc's original ≤$2.00 target. Bridge cost
> cuts are sequenced as Phase 1 of the unified 8-phase plan; L3.75 retirement
> is Phase 7. This file is preserved as historical record only.
>
> **Status**: `dissolved-into-04` — see unified plan + handoff for current execution.
> **Last updated**: 2026-05-10.

---

## Original spec (preserved as historical context)

**Workstream lead**: cost chat (this conversation).
**Goal**: recover $1.60+/essay ($3.60 → ≤$2.00), fix 25% Phase B truncation correctness bug, eliminate dead code.
**Strategy**: single consolidated changeset, one verification run at the end.

**Last updated (original)**: 2026-04-26
**Status (historical)**: `awaiting-integration` — D1, D2, D3 resolved; D4 superseded by D5 (integration gate); changeset frozen until 02 + 03 designs return and integration is reconfirmed.

> **NOTE**: This document is the **immediate consolidated changeset** (Phases A–E, current architecture, single PR). For the medium-term **architectural pivot** (kill L3.75, absorb into L3), see the [Architecture Track](./ARCHITECTURE/) — specifically [`L3_ABSORBS_L3_75.md`](./ARCHITECTURE/L3_ABSORBS_L3_75.md). The two tracks are sequenced: this changeset ships first; the pivot follows once L3 redesign + 02/03 designs land.

> **2026-04-26 — Verification scope correction**: Tue clarified that single-fixture runs are the standard for this project (we never read through all 8). The original 3-fixture verification plan is replaced with a **1-fixture run** at the end (default fixture: 05; cost target ≤$2.00). Multi-fixture follow-up only if fixture 05 reveals a regression class fixture 05 doesn't trip. See [DECISIONS.md § D4 (superseded)](./DECISIONS.md) and [§ D5](./DECISIONS.md).

> **2026-04-26 — Integration gate**: changeset is finalized but does NOT execute until [DECISIONS.md § D5](./DECISIONS.md) gate is satisfied. We will not run the verification fixture in isolation from 02 / 03 designs, the architecture-track pivot's relationship to Phases A–E, and the integrated system iteration plan. Localized improvements ahead of integration risk validating a pipeline shape about to change.

---

## Baseline

| Metric | Value | Source |
|---|---|---|
| Current per-essay cost | ~$3.60 | checkpoint3 treatment avg |
| Historic baseline | ~$1.47 | pre-Harvard-10 |
| Regression unaccounted | ~$2.13 | after H10 ports (~$0.20) subtracted |
| iter_1 firing rate | 62.5% | checkpoint3 (5/8 fixtures) |
| Phase B output size | ~15K tokens (cap 10K) | fixture 05 |
| Phase B truncation failure rate | 25% (2/8) | checkpoint3 fixtures 02, 09 |
| L3 walk cache hit rate | 23% | checkpoint3 telemetry |
| L5 sharedContext caching | absent | code inspection |

---

## Root causes identified (see `AUDITS/`)

1. **iter_1 prompt regression** (commit `0f404e7`, 2026-03-19): convergence prompt added "For complex essays with multiple themes or structural issues: 1–2 iterations max" — read as permission, not cap. Amortized: +$0.25/essay.

2. **Rereads-always-fire** (commit `34f587b8`, 2026-04-09): convergence check moved to AFTER rereads. Rereads now execute unconditionally. Amortized: +$0.10–$0.15/essay.

3. **Phase B output exceeds its own cap**: `SYNTHESIS_MAX_TOKENS_PHASE_B = 10000` but fixture 05 emits ~15K. Fixtures 02 and 09 fail at byte positions 15,732 and 30,037. jsonrepair cannot recover dropped fields. Correctness bug, not just cost.

4. **L3 walk cache prefix instability**: user prompt re-assembled each paragraph with mutating holisticEvolution, paragraph-specific scoutLeads, paragraph-specific assembledContext. Anthropic cache requires exact prefix match → 77% of input paid twice. Cost: +$0.08–$0.12/essay.

5. **L5 sharedContext missing `cache_control`**: identical content assembled for 10 per-paragraph calls, no cache marker. Cost: +$0.03–$0.06/essay.

6. **Dead code**: `analysisMode` computed by LLM, never read. `runningUnderstanding.emotionalArc` computed, never read. `arcMomentum` stored in two places with unclear authority. `checkpoint_failed` errors silently swallowed.

---

## The consolidated changeset

Five phases. One PR. One verification run at the end.

### Phase A — Observability (instrumentation, no behavior change)

Foundation for verifying every other phase.

#### A1. Cost-ledger split
**File**: `src/lib/llm/claude.ts`
**Change**: split the existing cost log into `fresh_input`, `cache_read`, `cache_create`, `output` with $ breakdown each. Add `layer`, `subcall`, `fixture`, `stopReason`, `cache_hit_rate`, `total_usd`.
**Output**: JSONL appended to `tests/output/run-ledger/{fixture}-{timestamp}.jsonl`.
**Schema**: see [CONTRACTS.md § Cost ledger schema](../shared/CONTRACTS.md).

#### A2. Convergence telemetry
**File**: `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` at iteration-loop exit (~1097, ~1361).
**Change**: emit on every iteration exit:
```typescript
{
  event: "iteration_exit",
  iteration, convergenceReason, isConverged,
  rereadCandidatesCount, rereadsExecuted,
  phaseA_output_tokens, phaseB_output_tokens, phaseB_stopReason
}
```

#### A3. Phase B truncation flag
**File**: `src/services/essayIntelligence/analysis/holisticSynthesis.ts:2048–2052`.
**Change**: when `stopReason === 'max_tokens'`, attach `_truncated: true` to parse result AND emit ledger event. Keep existing warning log.

**Validation of Phase A**: on the final verification run, ledger must:
- Show non-zero `cache_read` on L3 walk P2+.
- Sum of `total_usd` matches `calculateCost()` top-line to ≤1%.
- Emit `iteration_exit` events for every iteration.

---

### Phase B — iter_1 convergence regression fix

#### B1. Convergence prompt rewrite
**File**: `src/services/essayIntelligence/analysis/holisticSynthesis.ts:784–795`.

Replace the current convergence bar block with (reviewed at commit time):

```
CONVERGENCE BAR: Converge after iteration 0 by default.

Iteration 0 is the primary synthesis pass. Re-reads that follow it enrich
the profile directly — they do not require a second synthesis pass.

Iterate a second time ONLY IF iteration 0 produced a structural contradiction
that would make coaching give OBJECTIVELY WRONG advice without resolution.
Examples of qualifying contradictions:
- Thesis self-contradicts across paragraphs in a way the synthesis didn't resolve.
- A central synthesis claim is falsified by re-read evidence.
- Two synthesis findings are mutually exclusive at the coaching level.

Do NOT iterate for:
- "We could go deeper on X" — refinement, not reversal.
- "The essay has multiple themes" — complexity is a description, not a trigger.
- "The voice signature could be more specific" — refinements integrate into the profile.

When in doubt, CONVERGE. 90% understanding now beats 95% understanding after $0.25.
```

Removes the "complex essays 1–2 iterations max" permission.

#### B2. reReadCandidate curation guidance
**File**: same.
**Change**: in the prompt section that curates `reReadCandidates`, add:
```
WHEN you set hasConverged=true: emit AT MOST 2 reReadCandidates, and only for
testing a specific finding that could reverse a coaching recommendation.
Enrichment re-reads ("this paragraph has more texture worth exploring") are
NOT load-bearing and should not be emitted when converged.
```
No orchestrator code change — the prompt owns the gate, LLM owns judgment.

#### B3. Schema field rename
**File**: same + consumers.
**Change**: `selfAssessedConvergence.remainingOpportunities` → `reversingContradictions`. Grep callers (expect ~2–5 sites), update.
**Contract**: [CONTRACTS.md § selfAssessedConvergence](../shared/CONTRACTS.md).

---

### Phase C — Phase B output size reduction (correctness + cost)

Target: Phase B output ≤ 8,000 tokens. Eliminate truncation class.

#### C1. QUANTITY DISCIPLINE prompt block
**File**: `holisticSynthesis.ts` `SYSTEM_PROMPT_PHASE_B`.

Add:
```
QUANTITY DISCIPLINE
Fewer, higher-signal. Every entry pays for itself:
- strengthSignatures: 5–8 distinct patterns. Duplicates will be silently dropped.
- growthEdges: 3–6. EVERY entry MUST have a concrete pairedImprovement.
  No pairedImprovement → do not emit.
- threads: 3–5. Merge threads sharing 70%+ evidence.
- blindSpots / redFlags: 0–3 each, no structural overlap between the two arrays.
Target total Phase B output: 5,500–7,000 tokens. Above 8,000 = failure.
```

#### C2. Post-parse enforcement
**File**: new `src/services/essayIntelligence/analysis/phaseBPostParse.ts`, called from Phase B parse path.

Logic:
- `strengthSignatures.slice(0, 8)`.
- Drop `growthEdges` entries missing `pairedImprovement`.
- `threads.slice(0, 5)`.
- Evidence-overlap dedup between `blindSpots` and `redFlags` (redFlag wins on collision).

#### C3. Low-consumer field deletions

Safe deletions (no product-logic migration needed):
- `craftAssessment.sentencePatterns.*` numeric distribution stats (keep `rhythm` prose).
- `thematicArchitecture.threads[].appearances[]` sentence granularity (reduce to paragraph array).
- `narrativeStrategy.strategyRationale` (merge 1-sentence into `primaryStrategy` via prompt).

**KEEP for this PR** (migration cost > benefit, plus poolDensity per D1): `thesisConfidence`, `arcMomentum`, `revealedQualities` (per D2), `intellectualFingerprint`, `portfolioPosition`, `poolDensity` numeric (per D1).

**Decisions**: D1 (poolDensity = keep), D2 (revealedQualities = keep both) — both resolved 2026-04-26.

#### C4. Safety buffer (resolved per D3)

Raise `SYNTHESIS_MAX_TOKENS_PHASE_B` from 10000 → 12000. Pure defense against discipline variance. Target stays ≤8K, buffer prevents truncation class recurrence. **Decision**: D3 = raise to 12000 (2026-04-26).

**Expected size math**:
- Array caps save: 21→8 sigs (~3,600t) + 11→6 edges (~1,200t) + 6→5 threads (~200t) = **~5,000t**.
- C3 deletions save: ~1,000–1,500t.
- Baseline: 15,012t. Target: ~8,500–9,500t. With 12K cap: 2.5K–3.5K headroom.

---

### Phase D — Silent cache bleeds

#### D1. L3 walk essay-text cached block
**File**: `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts:616–667`.
**Change**: restructure userPrompt into messages array. First message = essay text (+ L1/L2/scout header), marked `cache_control: ephemeral`. Subsequent messages = mutating content (accumulating walk, target paragraph).

Narrow scope: essay text only. Does NOT reorganize holisticEvolution or scout output. Those stay in subsequent uncached blocks. Reserves cache budget for 02/03 to add their own blocks later.

**Contract**: [CONTRACTS.md § L3 walk user prompt structure](../shared/CONTRACTS.md).

#### D2. L5 sharedContext cache marker
**File**: `src/services/essayIntelligence/analysis/deepAnnotationService.ts:1815–1835`.
**Change**: split `userMessage` into messages array: `[sharedContext with cache_control: ephemeral, paragraph-specific prompt]`.

**Contract**: [CONTRACTS.md § L5 user prompt structure](../shared/CONTRACTS.md).

---

### Phase E — Dead-code cleanup

#### E1. Delete `analysisMode` computation
**File**: `src/services/essayIntelligence/analysis/editUnderstandingService.ts:892, 1175, 1414, 1429–1430`.
**Change**: remove field from output schema, prompt, type, logging.

#### E2. Delete `runningUnderstanding.emotionalArc`
**Files**: `src/services/essayIntelligence/analysis/runningUnderstandingManager.ts:73, 149–150, 224`; `sequentialDeepWalk.ts` write sites; type definition.
**Change**: delete field + writes.

#### E3. Checkpoint swallow observability
**File**: `src/services/essayIntelligence/analysis/analysisOrchestrator.ts:618` (the `safeCheckpoint` catch).
**Change**: add `ledger.event: 'checkpoint_failed'` emission in catch. Do not change swallow behavior.

---

## Deferred / out-of-scope for this PR

Move to backlog:

- **Phase 2.3 (L2.5 single-paragraph gate)** — edge case, minimal impact.
- **Phase 3.2 (`arcMomentum` dedup)** — folded into deferred schema cleanup.
- **Phase 3.5 (focused-mode decision)** — product decision; may be affected by 02's revision flows.
- **Phase 3.6 (profileRouter O(n²))** — perf, not cost.
- **Tier 5.1 (L4 three-call caching)** — see [HANDOFFS.md § H4](../shared/HANDOFFS.md) — coordinate with 03 RAG before doing this.
- **Tier 5.2 (69 always-priority demotion)** — depends on H4 outcome.
- **Tier 5.3 (essay-text shared cache across layers)** — depends on 02/03 injection surfaces stabilizing.

---

## Verification plan (revised 2026-04-26)

**Single 1-fixture run** at the end of the changeset, gated on integration (see D5). No intermediate runs. No multi-fixture pre-budget.

**Fixture**: `05-harvard-2028-i-too-can-dance` — median, well-understood, has full prior cost ledger for delta comparison.

**Cost target**: ≤$2.00. If the changeset's expected effects land, post-cuts cost is independently visible in a single run.

**Why one fixture**:
- Tue's clarification: we never read through all 8 fixtures; single-fixture runs are the project standard.
- A test run exercises the entire pipeline, so the fixture choice should be the one most diagnostically useful, not the most numerous.
- If post-cuts cost is materially over $2.00, that itself is the signal to investigate — not a reason to pre-pay for fixtures 02 and 09.

**Conditional follow-up** (NOT pre-budgeted):
- If fixture 05 passes cost + correctness + quality gates → done.
- If fixture 05 reveals a Phase B truncation regression class fixture 05 doesn't trip (because 05 was previously NEAR cap, not OVER), THEN — and only then — schedule a follow-up run on fixture 02 or 09. Discuss before spending.

**Success gates** — ALL must pass:

**Cost**:
1. Fixture 05 total: ≤ $2.00 (from $3.60; ≥44% recovery).
2. Ledger: iter_1 did NOT fire on fixture 05.
3. L3 walk `cache_read_tokens` on P2+ ≥ essay_text_size.
4. L5 `cache_read_tokens` on P2+ ≥ sharedContext_size.

**Correctness**:
5. Phase B JSON parses cleanly. No `_truncated: true` flag.
6. Phase B output tokens: between 5,500 and 9,500.
7. `strengthSignatures.length ≤ 8`.
8. Every `growthEdges[]` entry has non-empty `pairedImprovement`.
9. `threads.length ≤ 5`.

**Quality (qualitative — Tue reviews)**:
10. `writerPortrait` reads as rich as pre-change.
11. `tellabilitySummary` is a coherent AO summary.
12. `pivotPoints` still at paragraph+sentence granularity.

**Fail path**:
- Cost gate fail → diagnose which phase; targeted re-verification on that phase only (still single-fixture).
- Correctness gate fail → mandatory stop. Revise. Single re-run on fixture 05 unless we identify the failure as fixture-specific, then escalate to a second fixture.
- Quality gate fail → Tue reviews; discuss revert vs refinement.

---

## Pre-execution integration gate (D5)

**The changeset is finalized but execution is held until ALL of the following are satisfied:**

| # | Gate | Status |
|---|---|---|
| 1 | 02 Conversator design doc returns | pending |
| 2 | 02's `02-conversator-ground-truth/PLAN.md` updated with real plan | pending |
| 3 | 03 RAG design doc returns | pending |
| 4 | 03's `03-intelligent-rag/PLAN.md` updated with real plan | pending |
| 5 | H7 lens-direct injection acks resolved by 02 and 03 | pending |
| 6 | H1, H2, H3, H4, H5, H6 reviewed against returned designs and either resolved or explicitly carried forward with rationale | pending |
| 7 | Architecture-track pivot relationship to Phases A–E re-confirmed (no Phase A–E item undermined by L3.75 retirement plan) | pending |
| 8 | Cost chat re-evaluates Phases A–E against integrated picture; confirms each is still load-bearing | pending |
| 9 | Tue final approval of integrated execution plan | pending |

**Why this gate exists**:
- Each phase of A–E touches files 02 and 03 will inject into. If 02 and 03's designs imply prompt-block ordering changes that haven't been encoded into [CONTRACTS.md § L3 walk user prompt structure](../shared/CONTRACTS.md) v3 / [§ L5 user prompt structure](../shared/CONTRACTS.md) v3, the verification run validates a structure that will be re-changed within days.
- The Architecture track's `L3_ABSORBS_L3_75.md` plans Phase B (iter_1 prompt) and Phase C (Phase B output cuts) work that the changeset is also doing — but in a different shape (lens-direct emission instead of cap+discipline). If the architecture track's lens-direct plan is the right long-term answer, the changeset must be the **bridge**, not a parallel solution.
- One verification run that proves both "the changeset works" AND "the integrated system stays coherent through 02/03 + Architecture pivot" is worth far more than a 3-fixture run that proves only the first.

**Status update procedure**: as each gate item resolves, this table is updated AND `00-index/CURRENT_STATE.md` reflects the new posture.

---

## Status tracking

| Phase | Status | Notes |
|---|---|---|
| A1 Cost ledger | `approved` | held by D5 integration gate |
| A2 Convergence telemetry | `approved` | held by D5 integration gate |
| A3 Truncation flag | `approved` | held by D5 integration gate |
| B1 Convergence prompt | `approved` | held by D5; coordinate with Architecture track (L3.75 retirement may obviate) |
| B2 Reread curation | `approved` | held by D5; coordinate with Architecture track |
| B3 Schema rename | `approved` | held by D5; Contract v2 queued |
| C1 QUANTITY DISCIPLINE | `approved` | held by D5; coordinate with Architecture track (lens-direct emission may obviate Phase B prompt entirely) |
| C2 Post-parse enforcement | `approved` | held by D5 |
| C3 Low-consumer deletions | `approved` | D1 resolved (poolDensity = keep), D2 resolved (revealedQualities = keep both) |
| C4 Max_tokens buffer | `approved` | D3 resolved (raise to 12000) |
| D1 L3 essay-text cache | `approved` | held by D5; coordinate with Architecture track (lens-direct emission keeps L3 walk file) |
| D2 L5 sharedContext cache | `approved` | held by D5 |
| E1 Delete analysisMode | `approved` | held by D5 |
| E2 Delete emotionalArc | `approved` | held by D5 |
| E3 Checkpoint telemetry | `approved` | held by D5 |

---

## Links

- [DECISIONS.md](./DECISIONS.md) — open decisions for Tue
- [AUDITS/](./AUDITS/) — forensic audit outputs that informed this plan
- [ARCHITECTURE/](./ARCHITECTURE/) — medium-term architectural plans (L3.75 retirement)
- [POST_RUN/](./POST_RUN/) — verification run results (populated after execution)
- [CONTRACTS.md](../shared/CONTRACTS.md) — binding interfaces
- [HANDOFFS.md](../shared/HANDOFFS.md) — cross-chat dependencies
- [CHANGE_LOG.md](../shared/CHANGE_LOG.md) — committed change history
