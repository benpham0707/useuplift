# Phase 6a — Candidate-Store Consumption (L4b + L5) with Gap-Filling

**Status**: Planning (awaiting review before implementation)
**Branch**: `feat/forge-plan-pipeline-refactor`
**Depends on**: Phase 5 (commit `842afc7`)
**Blocks**: Phase 8 (E2E validation gate)

---

## Goal

Rewire L4b Consolidator + L5 Materialization to treat the `ImprovementCandidateStore` as the **primary source of truth** for improvement reasoning, WITHOUT losing any of the 14 signal categories the audit found the legacy scraper currently reads. The scraper code stays as dead code until Phase 6b (post-E2E).

## Non-goals

- Deleting the legacy scraper path (that's Phase 6b after E2E validates the new path).
- Changing L3/L3.5/L3.75 emission (that was Phase 5).
- Changing L4a (North Star + Score Matrix core).

---

## The gap audit, in one table

From the exploration pass. **14 signal categories** the scraper currently uses; each gets a preservation strategy:

| # | Signal | Currently read at | Gap-fill for Phase 6a |
|---|--------|-------------------|----------------------|
| 1 | **Architectural reasoning** (`architecturalReason`, `unlocksNext`) | L4b LLM re-derives from North Star | L4b gets candidates as input + re-derives arch reason from NorthStar — **NOT** scraped from legacy path |
| 2 | **Transformative insight** (1 per essay) | L4b coachingMap.transformativeInsight | L4b still produces, grounded in candidate+NorthStar. Already flows to L5 shared context |
| 3 | **Protected strengths** | L4b coachingMap.protectedStrengths | L4b still produces. L5 still reads. Not candidate-derivable — protective counter-signal |
| 4 | **Emergent patterns** (strings) | L4b coachingMap.emergentPatterns[] | L4b still produces from score matrix + candidates. Already wired to L5 (Phase 2) |
| 5 | **Score tensions** (strings) | L4b coachingMap.scoreTensions[] | L4b still produces from score matrix dimensions. Already wired to L5 (Phase 2) |
| 6 | **Coherence contradictions** | L4b adversarial pass | L4b still produces. Unchanged. L5 still reads |
| 7 | **Finding lineage** | L3.75 Finding.lineage[] | Candidates carry `sourceFindingId` — L4b reads Finding state when present |
| 8 | **Word economy signals** | L5 pre-call enrichment | **Unchanged.** L5 still calls `buildPreCallEnrichment` per paragraph |
| 9 | **Anti-pattern phrases** | L5 pre-call enrichment | **Unchanged.** Pre-call block still injected |
| 10 | **Voice map shifts** | L5 `renderHolisticContext` | **Unchanged.** L5 still reads from profile |
| 11 | **Sentence craft techniques** | L5 sentence detail | **Unchanged.** L5 still reads from profile |
| 12 | **AO archetype context** | L5 `renderHolisticContext` | **Unchanged.** L5 still reads from profile |
| 13 | **Earned-ness mechanism detail** | L5 per-paragraph context | **Unchanged.** L5 still reads from profile |
| 14 | **Cross-paragraph patterns** (L4a) | L5 shared context | **Unchanged.** Already flows via scoreMatrix |

**Net gap-fills required:** Signals 1, 2, 3, 4, 5, 7 need the L4b prompt reframed around candidates. Signals 6, 8-14 are untouched — L5 already reads them correctly.

---

## Doctrine clarification

The L4b LLM call is **not** "scraping." It's an LLM-driven interpretation of holistic context into priorities. The problem Phase 6a solves isn't "deletion of heuristic scraper" — it's **"redirecting L4b's interpretation task from 'infer priorities from holistic residue' to 'consolidate candidates that already exist'."**

This is a strictly smaller, more grounded task for the LLM:
- **Before (legacy):** L4b reads profile residue → LLM *guesses* what to prioritize → no traceable lineage
- **After (Phase 6a):** L4b reads `candidateStore.getActive()` → LLM *selects + groups* the 3-7 most impactful → each priority carries `consolidatedFrom: [candidateId, ...]` for full lineage

---

## Implementation (9 edits, ordered by dependency)

### Edit 1 — Extend `CoachingMap.priorities[]` type with lineage

**File**: `src/services/essayIntelligence/profileTypes.ts`

Add `consolidatedFrom?: string[]` to each priority entry. Array of candidate IDs this priority absorbed. Already partially supported by the audit note.

**Also add** (if not present): `consolidatedCandidateCount?: number` on `CoachingMap` as a diagnostic for post-run logging.

### Edit 2 — Build L4b candidate context block

**File**: `src/services/essayIntelligence/analysis/crystallizer.ts`

Add a new helper `buildL4bCandidateContext(candidateStore: ImprovementCandidateStore): string` that serializes active candidates in a compact table the LLM can read:

```
=== IMPROVEMENT CANDIDATES (source of truth for coaching) ===
[L3|P2S1|high] observation | suggestedChange | technique=SUMMARY-TO-SCENE
[L3.5|P2S1|critical] observation | suggestedChange | technique=null
[L3.75|P2|high] observation | suggestedChange | technique=SOMATIC VULNERABILITY
...

Total: 12 active candidates (L3=4, L3.5=5, L3.75=3)
```

Sorted by coachingValue (critical → high → medium → diagnostic). Max ~15 candidates after Phase 5 realistically.

### Edit 3 — Rewrite `buildSystemPromptL4b`

**File**: `crystallizer.ts:531`

Reframe the L4b task from "derive priorities from scratch" to "consolidate these candidates into 3-7 priorities."

Key changes:
- New opening: "You receive a pre-generated set of improvement candidates from L3/L3.5/L3.75. Your job is to CONSOLIDATE them into 3-7 prioritized improvements that the student will see, grouped by architectural theme. Do NOT invent improvements not grounded in the candidate set."
- Consolidation rules: "Each priority in your output MUST cite `consolidatedFrom: [candidate IDs]`. A priority can merge multiple candidates that point at the same architectural theme. Candidates you do NOT cite become superseded — they did not survive consolidation."
- Architectural reasoning is still re-derived: "For each priority, read the North Star's structural role for the target paragraph(s) and write `architecturalReason` that ties the improvement to the paragraph's role in the essay architecture."
- Keep protectedStrengths, emergentPatterns, scoreTensions, transformativeInsight production unchanged — those come from the LLM's holistic view, not from candidates.
- Emergency carve-out: if the candidate set is empty (shouldn't happen post-fresh-analysis because orchestrator throws), emit a single priority with consolidatedFrom=[] explaining the empty state, so L5 doesn't crash.

### Edit 4 — Wire candidate context into the L4b call

**File**: `crystallizer.ts:2095-2125` (the L4b call block)

Change `buildCallInstructionL4b(northStar, scoreMatrix, paragraphCount)` to accept + inject the candidate store context:

```ts
const l4bCallInstruction = buildCallInstructionL4b(
  northStar,
  scoreMatrix,
  paragraphCount,
  candidateStore, // NEW
);
```

`buildCallInstructionL4b` prepends `buildL4bCandidateContext(candidateStore)` to the user prompt, before the existing `=== L4a CRYSTALLIZATION OUTPUT ===` block.

### Edit 5 — Parse `consolidatedFrom` in `buildCoachingMap`

**File**: `crystallizer.ts:1292` (buildCoachingMap function)

When parsing each `priority` entry from the LLM response, also parse `consolidatedFrom: string[]` — filter to valid candidate IDs (drop unknown IDs with a debug log). Attach to the returned CoachingMap.priorities[i].

### Edit 6 — Apply consolidation lifecycle after L4b

**File**: `src/services/essayIntelligence/analysis/analysisOrchestrator.ts`

After `coordinator.applyScoreMatrix(...)` (or wherever L4 result is applied), call:

```ts
const consolidatedIds = coachingMap?.priorities
  ?.flatMap((p) => p.consolidatedFrom ?? []) ?? [];

const allActiveIds = coordinator.getImprovementCandidateStore()
  .getActive()
  .map((c) => c.id);

const supersededIds = allActiveIds.filter((id) => !consolidatedIds.includes(id));

coordinator.applyConsolidation(consolidatedIds, supersededIds);
```

This drives the lifecycle: every candidate L4b cited becomes `consolidated`, every candidate it ignored becomes `superseded`. Clean bookkeeping, no data loss (superseded candidates stay in store, just excluded from `getActive()`).

### Edit 7 — Convert L4b graceful-degradation to PipelineError

**File**: `crystallizer.ts:2164-2175`

The current catch block defaults to empty coherenceReport + no priorities when L4b fails. Doctrine forbids this.

```ts
} catch (l4bError) {
  throw PipelineError.l4bConsolidationFailed(
    l4bError instanceof Error ? l4bError : new Error(String(l4bError)),
    candidateStore.size,
  );
}
```

Remove the `l4bDegraded = true` branch entirely. Remove the `l4bDegraded?: boolean` result field (or keep if external consumers read it — verify first).

### Edit 8 — Thread candidateStore through crystallization entry point

**File**: `crystallizer.ts` — the main `crystallize()` method

Accept `candidateStore: ImprovementCandidateStore` as a required parameter (or read from coordinator on entry). Pass it down through to `buildCallInstructionL4b` in edit 4.

**File**: `analysisOrchestrator.ts` — the L4 call site

Pass `coordinator.getImprovementCandidateStore()` as the new arg when calling `crystallizerService.crystallize(...)`.

### Edit 9 — Surface candidate lineage in L5 shared context

**File**: `src/services/essayIntelligence/analysis/deepAnnotationService.ts` (`buildSharedContext`)

The current L5 shared context already includes `coachingMap.priorities` — but now each priority carries `consolidatedFrom: string[]`. Enrich the rendered block so L5 sees:

```
=== COACHING PRIORITIES ===
Priority 1: <priority text>
  Target: P2, P4
  Architectural reason: <...>
  Unlocks next: <...>
  Expected impact: transformative
  Consolidated from 3 candidates:
    [L3.5|P2S1|critical] <observation>
    [L3|P2|high] <observation>
    [L3.75|P4|high] <observation>
```

This gives L5 explicit grounding: the annotation it writes for P2S1 can cite back to the specific candidate that surfaced the problem. No new data sources — just pulling the consolidated candidates from the store using the IDs in `consolidatedFrom`.

**Rendering helper**: new `buildL5PriorityLineageBlock(coachingMap, candidateStore)` in a small new file `analysis/priorityLineage.ts` or inline in `deepAnnotationService.ts`.

---

## Fail-fast gates added this phase

1. **Empty active candidate set before L4b call** (orchestrator, pre-crystallize) → `PipelineError.emptyCandidateStore` — this should never fire post-fresh-analysis because L3/L3.5/L3.75 all run before L4. If it fires, a prior layer silently skipped emission.
2. **L4b Sonnet failure** → `PipelineError.l4bConsolidationFailed` (edit 7).
3. **L4b output with unknown candidate IDs in `consolidatedFrom`** → currently logged as debug + filtered. Consider escalating to PipelineError if >50% of IDs are invalid (indicates the LLM is hallucinating candidate IDs). *Decision: log for now, escalate in Phase 6b after observing real behavior.*

## Anti-goals — what Phase 6a does NOT do

- Does NOT delete `buildCoachingMap`, `buildCoherenceReport`, or any legacy scraper code paths (Phase 6b).
- Does NOT change the L5 annotation validator rules (Phase 6c if needed).
- Does NOT touch researchEnrichment.ts (Phase 7).
- Does NOT remove the `degraded` signal on result types if any consumer reads it (verify first, remove in Phase 6b if unused).

## Tests to add (Phase 6a runtime suite)

`tests/test-scope2-phase6a-runtime.ts` — aim for ~30 cases:

1. `buildL4bCandidateContext`: serializes active candidates, excludes superseded, sorts by coachingValue, formats each line correctly, handles empty store stub.
2. `buildCoachingMap` with new `consolidatedFrom`: parses string[] correctly, filters invalid IDs, returns empty array when absent.
3. Orchestrator consolidation apply: given a CoachingMap with priorities[{consolidatedFrom}], calls markConsolidated with the right IDs and markSuperseded with the complement.
4. `PipelineError.l4bConsolidationFailed` replacing degraded return: a mocked L4b failure throws instead of returning `l4bDegraded=true`.
5. `buildL5PriorityLineageBlock`: renders priority lineage with full candidate text, handles missing candidates gracefully.

## Validation sequence before committing

1. `npx tsc --noEmit` clean
2. Run all prior phase runtime tests (Phases 1-5) — 176 expected to pass
3. Run new Phase 6a runtime tests
4. Manual diff-review of crystallizer.ts to confirm scraper code paths are still present (just not called on the new path)
5. Hidden consumer sweep: grep for `l4bDegraded` to make sure no downstream code relies on the degraded signal

## Risk register

| Risk | Mitigation |
|------|-----------|
| L4b LLM ignores candidates and invents new priorities | Prompt explicitly forbids it + `consolidatedFrom` parsing flags empty arrays. Phase 8 catches quality regressions |
| Candidate store empty on fresh run (L3/L3.5/L3.75 under-emitted) | Orchestrator throws `emptyCandidateStore` before L4b even runs. Fails loudly, not silently |
| Scraper dead code becomes confusing in the file | Add a clear `/* LEGACY — kept as dead code for Phase 6b deletion */` marker above buildCoachingMap (old shape). Still compiled, never called |
| L5 priority lineage rendering blows up token budget | Lineage block capped at top 5 candidates per priority. Observation text truncated to 120 chars |
| Consumers of `l4bDegraded: boolean` break | Grep sweep in validation step 5 above. Likely only internal logs |

## Post-Phase 6a acceptance criteria

Before marking Phase 6a complete:
- [ ] All 14 signal categories from audit still flowing to L5 (verified by reading rendered shared context on a real run)
- [ ] Every `priority` in a fresh run carries non-empty `consolidatedFrom`
- [ ] Candidate store shows `consolidated` + `superseded` lifecycle state after L4b apply
- [ ] L4b Sonnet failure throws PipelineError, not silent degradation
- [ ] `tsc --noEmit` clean
- [ ] All prior-phase runtime tests still pass
- [ ] New Phase 6a runtime tests pass

---

## What Phase 6a does NOT guarantee — read before approving

This phase is **architecturally sound** but the quality improvement is **empirically unverified until Phase 8 E2E**. Specific things Phase 8 must validate:

1. Do L4b's consolidated priorities actually match the quality of the legacy LLM-rederived priorities on the piano-essay baseline?
2. Do L5 annotations carry specific candidate lineage that makes teaching more concrete?
3. Does the token spend drop (fewer re-derivation passes) or stay flat?
4. Does the new path produce fewer fabricated improvements (ones not grounded in real analysis)?

If Phase 8 shows any regression on the piano-essay baseline, Phase 6a is reverted via `git revert` (one commit) and we diagnose before retrying. This is why Phase 6b (scraper deletion) must wait.
