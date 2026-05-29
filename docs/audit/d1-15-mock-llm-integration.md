# D-1.15 — Mock-LLM Iteration Ledger Integration Test

**Date:** 2026-04-30
**Branch:** `feat/integrated-pipeline-build` (HEAD `8fbe84a` at audit time; this doc is the D-1.15.7 deliverable)
**Spec:** `L5_IMPLEMENTATION_PLAN.md` §D-1.15
**Authorization:** Tue's autonomous-build directive (2026-04-30) — "high level of effort and review autonomously, only stop when I need to step in to give high level decision making."

---

## 1. Scope

D-1.15 is the integration test for the iteration loop's continuity wire. Five scenarios exercise the iter-1 → iter-2 flow under different edit shapes:

| # | Scenario | Edit shape | Source essay | iter-1 anchors | Drops | Survivors |
|---|---|---|---|---|---|---|
| 1 | small_edit | single-paragraph revision (P2) | Harvard MITES 2029 | P0/P2/P3 | 0 | 3 |
| 2 | structural_reorder | swap P1 ↔ P2 | UCLA cancer-awareness 2029 | P0/P1/P2/P3 | 0 | 4 |
| 3 | paragraph_delete | remove P2 | UCB cell-tower 2029 | P0/P2/P4 | 1 (P2) | 2 |
| 4 | paragraph_insert | new paragraph after P1 | Harvard MITES 2029 | P1/P2 | 0 | 2 |
| 5 | multi_paragraph_cascade | surgical 1-sentence improvements to P0/P2/P3 (voice-preserving) | UCLA cancer-awareness 2029 | P0/P1/P2/P3 | 0 | 4 |

All five scenarios trigger comprehensive mode in production (`FocusedAnalyzer.selectAnalysisMode` Rule 1: `confidenceLevel='initial'` on a fresh profile). Multi-essay diversity per Tue's directive: harvard-mites-2029 (S1, S4), ucla-cancer-awareness-2029 (S2, S5), ucb-cell-tower-2029 (S3).

---

## 2. Deliverable arc

The D-1.15.x sequence shipped 7 commits (plus 3 prerequisite commits in the same session that closed dead-wire findings before D-1.15.1 could land honestly):

```
8fbe84a D-1.15.6 — Scenario 5 (multi-paragraph cascade) integration test
ccf5a9c D-1.15.5 — Scenario 4 (paragraph insert) integration test
521c8de D-1.15.4 — Scenario 3 (paragraph delete) integration test
afc9cd4 D-1.15.3 — Scenario 2 (structural reorder P1↔P2) integration test
076f7d4 D-1.15.2 — Scenario 1 (small edit) integration test
67be5e6 D-1.15.1 — fixture harness foundation
3b8470f D-1.15.0a — consolidator audit closure (S-1, S-2)
b2d04da D-1.16-prefix — discriminator consumer activation (closes F-04, F-08, F-09)  ← prerequisite
db7d592 D-1.6.6 — drop unused TaughtMove.deepenedBy + supersededBy (closes F-02, F-03)  ← prerequisite
36add83 D-1.6.5 — landing write-back wire (closes F-01)  ← prerequisite
8ab504e D-1.15.0 — taughtMoves[i].landing carve-out ratification
```

D-1.15.0 ratified the spec amendment (`landing` field permitted exactly one `undefined → populated` transition per the D-1.15.0 carve-out). D-1.6.5 / D-1.6.6 / D-1.16-prefix closed dead wires the consolidator audit surfaced before scenarios could land. D-1.15.1 built the harness; D-1.15.2-6 added scenarios; D-1.15.7 (this doc) closes the arc.

---

## 3. Architectural decisions (ratified)

### 3.1 D-0.11 mock-LLM framework deliberately bypassed

The spec said "Use mock-LLM framework (D-0.11)." Implementation uses function-level `vi.mock` at the layer boundary (`detectLanding`) instead.

**Rationale:** D-0.11's value-add is *prompt-string → response-fixture lookup with parser robustness*. D-1.15's contract is *ledger-state assertions*, not parser robustness. The boundary-level vi.mock approach matches D-1.8's pattern (which mocked `detectLanding` directly) and D-1.10's pattern (which exercised seam primitives without touching the LLM mock framework). D-1.16's failure-injection test WILL use D-0.11's `mockLlmFailure` directly — that's where parser-robustness contracts live.

Closure note added to `L5_IMPLEMENTATION_PLAN.md` §D-1.15. Source rationale at `tests/fixtures/d1-15/scenarios.ts:23-39`.

### 3.2 Iter-1 setup via direct seam primitives

`buildIter1Profile` calls `createInitialProfile + incrementIteration + bufferTaughtMoves + flushTaughtMovesForIteration + iterations.push` directly — does NOT drive `analyzeEssay`.

**Rationale:** D-1.10 already proved the seam primitives compose correctly. Driving the full pipeline on iter-1 would require mocking 8+ services (firstImpressions, structuralCartographer, scoutPass, sequentialDeepWalk, holisticSynthesis, analysisPass, crystallizer, deepAnnotationService) plus auxiliary services (growthEngine, findingPromotion, manifest merge, re-read step) for no additional diagnostic value at the iter-2 boundary D-1.15 actually tests.

Source rationale at `tests/fixtures/d1-15/iter1Setup.ts:8-44`.

### 3.3 Iter-2 tests at the `buildPriorAnnotationsForOrchestrator` seam

D-1.15's iter-2 phase calls `buildPriorAnnotationsForOrchestrator` directly with mocked `detectLanding`, then manually pushes the iter-2 IterationRecord — does NOT drive `processEdit` end-to-end.

**Rationale (three-fold):**
1. All five scenarios trigger comprehensive mode (Rule 1 — confidence='initial'). Driving processEdit through to comprehensive means stubbing `analyzeEssayWithBrief` which itself wraps the 8+ layer services.
2. The contracts D-1.15 actually asserts (priorAnnotations Map, landing population via D-1.6.5, iter-2 commit shape, recentDecisions) all live at the builder seam. Mocking layers above it would add noise without diagnostic value.
3. processEdit's orchestration concerns are tested by D-1.10 (coordinator), D-1.11 (decisions), and D-1.12 (halt-on-error) at their own seam levels.

Source rationale at `tests/integration/phase1-iteration-ledger.ts:23-71`.

### 3.4 Layered assertion pattern

Every scenario uses 5 nested describe blocks:
1. **mock surface** — landingDetector firing pattern (call count, input shape)
2. **priorAnnotations Map** — population, key remap semantics
3. **D-1.6.5 landing write-back** — the carve-out producer wire
4. **iter-2 ledger commit** — IterationRecord shape, recentDecisions
5. **iter-2 essay structure** — text-level edit verification

When a scenario test fails, the describe block name pinpoints the broken contract. Per Tue's diagnosability directive (2026-04-30): "targeted enough where we know exactly what to tweak."

### 3.5 Multi-essay diversity

Three distinct admitted essays from elite-examples-2025.ts. Each scenario uses a real essay (provenance commented in `scenarios.ts`). Per Tue's "don't bias toward one essay" directive — three essays cover narrative-introspective, advocacy, and political-civic registers; 4-5 paragraph counts.

---

## 4. Audit findings — closed inline

### Per-deliverable closures

| Deliverable | Findings closed inline | Severity |
|---|---|---|
| D-1.15.0 | three-agent audit (FINDING-1, R-3, H-4) — see commit body 8ab504e | LOW + MED |
| D-1.15.0a | consolidator S-1, S-2 (stale field enumeration in carve-out comment) | HIGH + MED |
| D-1.15.1 | C-1, C-4, C-8, R-2, R-5, R-6 (MED), H-2 (MED), H-4 (MED) | MED + LOW |
| D-1.15.2 | C-5 (MED, doc'd), R-1, R-3, R-4, R-6, R-7, R-9 (MED-HIGH), H-4 (MED), H-7 (MED) | MED-HIGH |
| D-1.15.3 | single-agent audit clean | INFO |
| D-1.15.4 | single-agent audit clean (Q5 MED — known C-5 extension) | LOW + MED |
| D-1.15.5 | single-agent audit clean (Q2 LOW — convention-clarification) | LOW |
| D-1.15.6 | three-agent audit (C-4 threshold-coupling, C-5 fixture-description) | MED |

### Cross-cutting findings (consolidator)

- **S-2** (LOW): L5_IMPLEMENTATION_PLAN.md:754 spec line was stale re: D-0.11 bypass. **Closed inline by this audit doc** — added a "Implementation deviations" footnote to the spec line ratifying the three architectural decisions above.
- **S-6** (MED): test stdout volume during iteration telemetry. Twenty-four `[IterationTelemetry]` lines emitted across the D-1.15 suite (mostly drop telemetry from S3 + S5). **Deferred** — non-blocking; could be addressed with a `ITERATION_TELEMETRY_QUIET` environment flag if a future deliverable wants quiet test output.

---

## 5. Known gaps (deferred to future deliverables)

| # | Gap | Source | Disposition |
|---|---|---|---|
| 1 | paragraph-merge edit shape | `scenarios.ts` C-4 closure | Deferred to D-1.16 failure-injection scenarios |
| 2 | paragraph-split edit shape | `scenarios.ts` C-4 closure | Deferred to D-1.16 failure-injection scenarios |
| 3 | transformative-significance pure rewrite (>50% paragraphs touched) | `scenarios.ts` C-4 closure | Deferred to D-1.17 cross-phase audit |
| 4 | ~~Scenario 5b — multi-survivor cascade~~ | D-1.15.6 audit C-5/C-6 | **CLOSED in D-1.15.6a** — Tue's product-direction clarification (2026-04-30) replaced Scenario 5's edit shape with surgical 1-sentence-per-paragraph voice-preserving improvements. Overlap stays > 0.30, all 4 priors survive as `modified`, all 4 detectors fire. The gap is now closed within the original 5-scenario contract (no spec expansion). The product-direction signal also sharpens the system's intended use: improvement paths preserve voice, not full rewrites. |
| 5 | iter-2 IterationRecord synthesis fidelity (manual push omits `events`, `comprehensiveBaselineCost` placeholder, `escalationLevel`, `costBreakdown`) | D-1.15.2 C-5 closure | Deferred unless Phase 2+ surfaces regression |
| 6 | brief→editScope translation untested (test hard-codes `structural` shape; the live derivation in `editUnderstandingService.computeEditDiff` → `briefBuilder` → `commitIterationRecord` isn't exercised) | D-1.15.4 Q5 | Deferred to D-1.16 / D-1.17 |
| 7 | telemetry stdout volume in tests | consolidator S-6 | Cosmetic — defer or address with env flag |
| 8 | ~~Scenario 5's coverage gap flagged in fixture provenance~~ | D-1.15.6 C-5 closure | **CLOSED in D-1.15.6a alongside item 4.** The provenance string was rewritten to describe the new surgical-voice-preserving cascade behavior (4 surviving priors, 4 landing detections); no caveat remains. |

### Item 4 — closed

Originally surfaced as needing Tue's ratification (would have expanded to 6 scenarios). Tue's product-direction clarification (2026-04-30) closed it differently — by REPLACING Scenario 5's edit shape rather than adding a 5b. The revised Scenario 5 uses surgical 1-sentence-per-paragraph improvements that preserve voice and authentic meaning (the kind of coaching-style edit the system actually encourages), keeping overlap > 0.30 so all 4 priors survive as `modified`. The multi-survivor cascade is now inside the 5-scenario contract; no expansion needed; product-direction signal preserved in the fixture's edit shape.

D-1.15.6a is the closure commit.

---

## 6. Test surface summary

### Final counts (HEAD `8fbe84a`)

- Total: **363 passed | 2 skipped | 0 failed** (`npx vitest run`)
- typecheck: **clean** (`npx tsc --noEmit`)
- D-1.15.x specifically: **71 sub-cases** (30 harness smoke + 41 scenario integration)
- Cumulative session API spend: **$0** (zero API calls)

### Per-scenario sub-case breakdown

| Scenario | Sub-cases | Files |
|---|---|---|
| Harness smoke | 30 | `tests/integration/d1-15-harness.test.ts` |
| Scenario 1 (small edit) | 11 | `tests/integration/phase1-iteration-ledger.ts` |
| Scenario 2 (structural reorder) | 8 | same |
| Scenario 3 (paragraph delete) | 7 | same |
| Scenario 4 (paragraph insert) | 8 | same |
| Scenario 5 (multi-paragraph cascade) | 7 | same |

### Cumulative project test count progression (this session)

```
277 (start of session)
278 (D-1.15.0)
278 (D-1.15.0a — comment-only)
284 (D-1.6.5)
284 (D-1.6.6 — code-only)
292 (D-1.16-prefix)
322 (D-1.15.1 — harness +30)
333 (D-1.15.2 — Scenario 1 +11)
341 (D-1.15.3 — Scenario 2 +8)
348 (D-1.15.4 — Scenario 3 +7)
356 (D-1.15.5 — Scenario 4 +8)
363 (D-1.15.6 — Scenario 5 +7)
363 (D-1.15.7 — this audit doc, no test changes)
```

---

## 7. Verdict

**D-1.15 contract met.** The five scenarios honestly exercise the iter-1 → iter-2 integration spine: priorAnnotations Map population, paragraph remap semantics (D-1.7), D-1.6.5 landing write-back, drop-on-delete telemetry (D-1.7 round-2 LOW-1), and iter-2 IterationRecord commit shape across small_edit / structural_reorder / paragraph_delete / paragraph_insert / multi_paragraph_cascade.

**Architectural deviations from spec literal** (D-0.11 bypass, seam-direct iter-1 setup, builder-seam iter-2 testing) are ratified and documented at three levels: source files, this audit doc, and an "Implementation deviations" footnote on the spec line itself. No silent divergence.

**Eight items** enumerated above. Items 4 and 8 (the Scenario 5 multi-survivor cascade gap) **closed in D-1.15.6a** by replacing Scenario 5's edit shape with surgical voice-preserving improvements per Tue's product-direction clarification — the gap is now inside the 5-scenario contract, no spec expansion needed. Items 1, 2, 3 (paragraph-merge / -split / transformative pure rewrite) remain deferred to D-1.16/D-1.17. Item 5 (iter-2 IterationRecord synthesis fidelity) deferred. Items 6, 7 are operational/cosmetic.

**Three-agent ratification audit pattern** held across all six scenario commits (heavier on D-1.15.0/1/2/6 where the architectural decisions were made; lighter on D-1.15.3/4/5 where patterns inherited from earlier scenarios).

**Cost discipline:** zero API spend across the entire D-1.15.x arc, including consolidator audits. The harness's deterministic seeding + multi-essay diversity (drawn from already-paid-for elite-examples-2025.ts) honored the cost-budget memory's spirit.

D-1.15 unblocks D-1.16 (failure-injection test using D-0.11's `mockLlmFailure`).

---

## 8. Next deliverables

Per the L5_IMPLEMENTATION_PLAN dependency graph:

- **D-1.16** — Failure-injection test (`tests/integration/phase1-failure-injection.ts`). For every error-throwing path in the orchestrator and the priorAnnotations builder, mock-inject the error and verify halt + structured telemetry. Effort: 4-6 hours. Will use D-0.11's `mockLlmFailure` directly.
- **D-1.17** — Phase 1 cross-phase integrity audit (`docs/audit/phase-1-integrity-audit.md`). Re-read iteration design; verify Phase 1 deliverables honor every contract. Effort: 3-5 hours.
- **D-1.18** — Phase 1 cumulative cost-ledger check. Effort: 30 min.

After D-1.18, Phase 1 closes and Phase 2 (SpecificsNeed aggregator) starts.
