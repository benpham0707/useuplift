# FORGE DEBATES — Concept Suppression / Surfacing / Cross-Essay Convergence

Record of the two competing designs, the reality-verification that resolved them, and the synthesis decisions.

## The two designs (compressed)

**Direct (A).** GAP-1: `userSuppressed?:boolean` + `suppressedAt?` on every `ConceptLibraryEntry.instances[]`; `/concept/suppress` + `/reapply` routes flip all instances by exact tag, 404 on no-match. GAP-2: deterministic surfacing filter → suppressed tags move to a `[USER-SUPPRESSED]` context block; mirror a `SUPPRESSED_LABEL` at 3 analysis render sites. GAP-3: union query over `essay_understanding`, group by exact tag, no new table. GAP-4 (env-flagged): cross-essay reuse-of-tag when mechanism matches. GAP-5: convergence harness, 15×3=45 calls ≈$1.69, precision/recall/stability bars, flag flips on pass.

**Rethink (B).** Reframe: the unit is the EMISSION, the student signal is "I've got this" (writer mastery), not "suppress." GAP-1+2 MERGED: replace `gapResolved:boolean` with `resolution?:{source:'detector'|'writer_claim'|'cross_essay',...}`; CLAIM mechanism = flip resolution → "cap relaxes → LLM stops minting." Route `/concept-mastery {claim|reapply}`, HTTP-409 + `availableTags` on no-match, mutator co-located with the write path. GAP-3: read-time projection, no table. GAP-4+5 reframed as CITED cross-essay retrieval ("cite essayId+tag+sameMechanismBecause"), `priorTeaching?` field, valid citation collapses, invalid FAILS OPEN to teaching; tags never need to converge → GAP-4 dissolves. No-flag dark gate.

## Verification findings

| # | Severity | Finding |
|---|----------|---------|
| F1 | **broken** | **CAP INVERSION.** Rethink's core GAP-1/2 mechanism is backwards. Verified `profileTypes.ts:6369-6373` ("when prior instances are RESOLVED, the cap RELAXES and NEW instances can fire FRESH TEACHING") + filter `sequentialDeepWalk.ts:1070` & `essayLevelEmissionService.ts:430` (`unresolved = instances.filter(i => !i.gapResolved).length`) + prompt `:97`. Marking resolved → fewer unresolved → cap relaxes → MORE teaching. Routing suppression through resolution amplifies the concept the student wanted silenced. |
| F2 | **broken** | **NO STUDENT SURFACE FOR CONCEPTS.** Both designs assumed concept teaching reaches the student and just needs filtering. Verified: `buildImprovementManifest` (`analysisOrchestrator.ts:2454`) is built from L4 `coachingMap.priorities`, `findingStore.getActiveSortedByCoachingValue()`, L3.75/L3 growth edges — NEVER `conceptLibrary`/`specificsNeedEmissions`/`questionQueue`. Coaching (`coachingService.ts:4428`) reads ONLY `improvementManifest`. `questionQueue` readers are all analysis-internal (aggregator, profileManager, holisticSynthesis, orchestrator); coaching reads it nowhere. So neither the questionQueue path nor the conceptLibrary reaches the student today. |
| F3 | weak | Direct's `userSuppressed` on all instances is per-instance; the student's unit is the concept. Concept-level rollup is cleaner. |
| F4 | weak | Direct's mirror-label at 3 analysis render sites filters at the cap/analysis layer (wrong layer) and one site (`findingMaturityRefresh`) is dormant. |
| F5 | incomplete | Direct's GAP-4 env flag is a misconfiguration surface; Rethink's dark-code gate is cleaner. |
| F6 | confirmed-moot | `findingMaturityRefresh.refreshFindingMaturity` has ZERO callers in `src/` (only a comment at `specificsNeedAggregatorIntegration.ts:141`). The "parallel emitter re-emission bug" is moot in production. |
| F7 | confirmed-feasible | Harness can replay `runEssayLevelEmissionPass(profile, store)` in isolation; FindingStore stub = `FindingStore.deserialize({findings:[],nextId:1})` (`findingStore.ts:441`); fixtures exist at `tests/output/full-profile-*.json`. Prompt is system+user split (`essayLevelEmissionService.ts:252-268`) — cross-essay block goes in `buildUserPrompt`. |
| F8 | confirmed | `gapResolved` blast radius = exactly 4 sites: def `profileTypes.ts:6393`, `sequentialDeepWalk.ts:1070`, `essayLevelEmissionService.ts:335`+`:430`, `findingMaturityRefresh.ts:284` (dormant). Additive `writerMastery` field touches none of them — zero migration risk. |
| F9 | confirmed | `essay_understanding` carries `user_id` + `profile_cache`; `buildStudentDigest` (`essayCoachingRoutes.ts:250-254`) already runs the exact union query the archive needs. |

## Synthesis decisions

- **GAP-1/2 → hybrid, cap channel REJECTED.** New `writerMastery` channel on instances (separate from `gapResolved`), honored by a deterministic surface filter (Direct's instinct), NOT by the cap (kills F1). Concept-level rollup (F3). HTTP-409 + `availableTags` + write-path co-location (Rethink's clean route).
- **Surface → honest.** Item 2 split into (2a) filter — correct regardless of surface — and (2b) plumb concepts into the manifest (the surface coaching already reads). Surface choice flagged as Open Question 1; do not pretend questionQueue→chat exists (F2).
- **GAP-3 → refined.** Read-time projection reusing the verified `buildStudentDigest` query, exact-tag grouping (Direct's "discard substring matching"), no table.
- **GAP-4/5 → rethink + Direct scaffolding.** Cited-retrieval reframe adopted: falsifiable citations, fail-open-to-teaching, dissolves tag-clustering (verified the dissolution holds against the existing prose-tag reuse policy `:98`). Grafted Direct's concrete fixture format, $1.55 cost math, stability=mean-pairwise-Jaccard, 4 enforced bars, $5-cap abort. No-flag dark gate (F5).

## Key insights

1. **The pivotal correction is the cap inversion** — Rethink built its entire suppression mechanism on a backwards reading of the cap. Resolving a concept is the system's way of saying "the student fixed it, so we can teach the next instance," not "stop teaching." Suppression and resolution are opposite-signed and must not share a channel.
2. **The surface doesn't exist** — both designs filtered a stream that never reaches students. The real Stage-1 work is partly building the surface (plumb concepts into the manifest), not just filtering it. Being honest about this is the difference between a plan that compiles and a plan that ships value.
3. **Cited retrieval > tag clustering** — asking the LLM to cite a real prior `essayId+tag` and justify same-mechanism in prose is falsifiable (deterministic corpus check) and structurally fail-safe (bad citation → teach anyway, never silently suppress). It dissolves the need for tag strings to converge across essays.
4. **Additive over retype** — keeping `gapResolved` and adding `writerMastery` (vs Rethink's full retype to `resolution`) gives zero migration risk across the 4 verified readers and preserves the detector's intended cap-relaxation behavior.
