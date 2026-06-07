# Master Plan Consolidation — Final Review for Tue Sign-Off (F7)

> **Purpose.** Tue's sign-off gate. The integrated build phase opens against this foundation only after Tue reviews and approves. Surfaces every blocking decision, summarizes every deliverable, names every artifact ready for build-phase entry.
>
> **Scope.** Closes the foundation phase F0–F7. Does NOT include build-phase code (that's the next chat's first deliverable, D-0.1).
>
> **Date written.** 2026-04-26.
> **Author.** This consolidation session.
> **Audience.** Tue (primary) + the build-phase implementer chat (secondary).

---

## §1 — Executive summary

The foundation-phase consolidation has produced a workspace ready for the integrated essay-intelligence pipeline build. **One Tue-decision blocks build-phase entry**: R-1, the Q1 redirection-fraction adjudication. Two further Tue-decisions are recommended (cost cap selection, branch name) but have defaulted recommendations. The fourth Tue-decision (reaffirm Q4/Q-A/Q-B as stable) is procedural.

| Item | Status |
|---|---|
| F0 — Read master workspace + reading notes | ✅ Complete |
| F1 — Implementation status audit (35 components) | ✅ Complete |
| F2 — Reconciliation (14 issues identified) | ✅ Complete (13 resolved by consolidation; 1 pending Tue) |
| F3 — Integration contracts audit (47 seams) | ✅ Complete |
| F4 — MASTER_INTEGRATION_PLAN.md v2 revision | ✅ Complete |
| F5 — INTEGRATED_BUILD_SEQUENCE.md (~168 deliverables) | ✅ Complete |
| F6 — INTEGRATED_BUILD_HANDOFF_PROMPT.md + L5 handoff supersession | ✅ Complete |
| **F7 — Tue sign-off + TQ-1 through TQ-4 decisions** | **PENDING** (this doc) |
| TQ-1 — Q1 redirection adjudication | **PENDING TUE** (load-bearing blocker) |
| TQ-2 — Cost cap selection ($10 vs $25) | Pending; recommendation: $25 |
| TQ-3 — Branch name | Pending; recommendation: `feat/integrated-pipeline-build` |
| TQ-4 — Reaffirm Q4/Q-A/Q-B | Pending; expect reaffirm |

---

## §2 — What changed across the workspace during F0–F6

### Documents created (8 new artifacts)

1. **`cross-cutting/MASTER_PLAN_READING_NOTES.md`** (F0) — per-doc structured reading notes for every workspace doc. ~17K lines effective. Captures 8 cross-cutting reconciliation themes that drove F2.
2. **`cross-cutting/IMPLEMENTATION_STATUS_MATRIX.md`** (F1) — file:line audit of 35 components. 13 functional / 7 partial / 0 only-typed / 9 only-planned. Confirms 16 components require integrated build work (~46% of audited surface). Key findings:
   - `analysisOrchestrator.ts:850` priorAnnotations dead wire confirmed.
   - `reanalysisOrchestrator.ts:1177` is NOT a parallel dead wire (contradicts L5 doc claims). R-12.
   - L3.75 still fully wired at orchestrator lines 520-567; absorption only-planned.
   - 9 NEW L5 types absent from profileTypes.ts.
   - Corpus retrieval inventory mismatch: 3 of 11 types currently wired.
   - `holisticFull` still `priority: 'always'` at profileRouter:1035 — Audit F1 unresolved.
3. **`cross-cutting/L5_AND_MASTER_RECONCILIATION.md`** (F2) — 14 reconciliation issues with per-issue resolution + edits required. R-1 (Q1 redirection) escalated to Tue. R-2 through R-14 resolvable by consolidation. Includes the L3.75 absorption supersession marker template + per-mechanism re-mapping table.
4. **`cross-cutting/INTEGRATION_CONTRACTS.md`** (F3) — 47 seams audited. 24 functional / 4 partial / 19 only-planned. Per-seam: producer, consumer, symmetry, carry-forward, failure surface, status, gap → integrated build. Drives F5's per-deliverable contracts.
5. **`MASTER_INTEGRATION_PLAN.md`** (F4 v2) — substantial revision of draft v1 (preserved at `MASTER_INTEGRATION_PLAN__draft_v1_archive.md`). Now ~600 lines (vs 220 in v1). Integrates: target pipeline shape with absorption, per-layer status with F1 audit, cross-cutting infrastructure section, four locked decisions table with R-1 caveat, standing charter principles, audit-findings → PR scope cross-reference (24 of 26 findings scoped), Phase 0–6.5 sequencing detail, dependency graph, expanded cross-layer commitments (with R-5 cost harmonization), four open Tue questions (TQ-1 through TQ-4), reading order for build session.
6. **`INTEGRATED_BUILD_SEQUENCE.md`** (F5) — ~168 deliverables across Phase 0–6.5. Per-deliverable: contract, behavior spec, failure surface, validation path, dependency/blocks, effort estimate. Extends L5_IMPLEMENTATION_PLAN's 95 deliverables with ~73 more for L3 redesign + L3.75 absorption execution + L3.5/L4 extensions + corpus expansion + focused_structural + L6 light update. Two cap options ($10 / $25).
7. **`INTEGRATED_BUILD_HANDOFF_PROMPT.md`** (F6) — build-phase handoff prompt naming integrated system iteration build, referencing master workspace + INTEGRATED_BUILD_SEQUENCE.md, carrying standing charter forward. Repeats charter 3× per discipline.
8. **`cross-cutting/CONSOLIDATION_FINAL_REVIEW.md`** (this F7 doc).

### Documents revised in-place (existing docs)

- `MASTER_INTEGRATION_PLAN.md` — replaced with v2 (draft v1 archived).
- `L5/L5_BUILD_HANDOFF_PROMPT.md` — marked SUPERSEDED at top, original preserved below.

### Documents NOT revised in-place (deferred per F2 §Y)

The following supersession edits are STAGED (per F2 R-2) but NOT yet applied as in-place rewrites. These are tightly coupled to the L3 redesign that the build phase will execute as Phase 4 sub-phase 4a, so applying the per-doc rewrites prematurely creates risk of churn. They land at build-phase Phase 4a as part of the L3 redesign work:

- `cross-cutting/RE_ANALYSIS_LIFECYCLE_DESIGN.md` — §2 + §3 + §4 step 5 + §5 step 5 + §7 layer re-run rules table need rewriting per absorption (R-2) + focused_structural integration (R-4). **Build-phase deliverable D-4e.3.**
- `L4/ESSAY_NORTH_STAR_DESIGN.md` — line 69 needs supersession update per R-2. Build-phase Phase 4a.
- `L5/L5_EXPERIENCE_TARGET.md` — absorption note needed at top of §5; references stand. Build-phase Phase 4a or earlier (purely textual, no code dependency).
- `L5/L5_ITERATION_LOOP_DESIGN.md` — §3 inventory rows 11-19 + §4.5 per-section policy + §10 F1 mitigation + §11 Q5 need rewriting per absorption + R-1 outcome. Build-phase Phase 4a or earlier.
- `L5/L5_E2E_INTEGRITY_AUDIT.md` — §1.3 step 11 + §3.2 SpecificsNeed contributors + §6.2 no-fallback diff need updating per absorption. Build-phase Phase 4a or earlier.
- `L5/L5_CONSUMPTION_AUDIT.md` — cost convention table + rows 49–110 layer-of-origin annotations + row 95 blindSpots verdict change per Decision A. Build-phase Phase 4a or earlier.
- `L5/L5_FEEDBACK_REDESIGN.md` — §1.2 + §2 + §11.2 absorption annotations. Build-phase Phase 4a or earlier.
- `L5/L5_IMPLEMENTATION_PLAN.md` — D-4.1 + D-4.3 rewrite per absorption (lens-targeted re-run instead of section-mask); D-4.11 deletion or rewrite per R-1 outcome. Build-phase Phase 4a (D-4a) or earlier.

**Recommendation**: deferred-edits land at build-phase Phase 0 D-0.18 (cross-phase audit) — the build-phase implementer applies the textual updates per F2 R-2 as part of Phase 0's audit pass. This keeps the foundation phase tightly scoped to NEW artifacts without churning the existing docs prematurely.

### Cross-reference path fixes (R-9)

Various L5 docs still reference cross-doc paths via `docs/L5_*.md` (pre-migration). **Recommendation**: build-phase Phase 0 D-0.18 cross-phase audit applies the path fixes as a mechanical sweep.

### README directory map (R-11)

The README still says "8 L5 docs" but the L5_BUILD_HANDOFF_PROMPT is now superseded. **Recommendation**: build-phase Phase 0 cleanup updates README to clarify "5 governing docs + 1 implementation plan + 1 superseded handoff (preserved for reference)".

---

## §3 — What's set and what's open

### What's set (no Tue input needed)

- **L3.75 absorption** — Decision B APPROVED 2026-04-25 stands. Lens-of-origin re-mapping per F2 R-2 applied across foundation docs (notes); deeper per-doc rewrites deferred to build-phase Phase 4a.
- **`blindSpots[]` cut** — Decision A APPROVED 2026-04-25 stands. Single source of truth: `admissionsPositioning.redFlags[]` with required `fix` field.
- **`pairedImprovement` migration** to L4b — confirmed by F1 audit. Schema lives on `ImprovementManifestEntry` post-migration.
- **`focused_structural` mode** — design is clear per L5_ITERATION_LOOP_DESIGN §4.4b. Build-phase deliverables in INTEGRATED_BUILD_SEQUENCE Phase 4 sub-phase 4e.
- **L6 light update** scope — 4 read-site migrations confirmed.
- **Conversator service ownership** — clarified per F2 R-6: NEW essay-intelligence service distinct from L6 proper.
- **Cost trajectory harmonization** (R-5) — applied in MASTER_INTEGRATION_PLAN v2 §10.
- **Audit findings → PR scope** (R-8) — 24 of 26 findings scoped in v2 §7.
- **SpecificsNeed lens-of-origin contributor table** (R-7) — applied in MASTER_INTEGRATION_PLAN v2 §4.2 + INTEGRATION_CONTRACTS.md §9.
- **`reanalysisOrchestrator.ts:1177` is NOT a dead wire** (R-12) — F1 audit confirmed; D-1.9 of build sequence revised accordingly.
- **Audit Finding F1 (L4 context bloat)** scoped to Phase 4 sub-phase 4c (R-13).
- **Corpus retrieval expansion** (R-14) scoped to Phase 4 sub-phase 4e with 9 per-type deliverables.
- **L5_BUILD_HANDOFF_PROMPT.md** — marked SUPERSEDED.

### What's open (Tue decisions)

- **TQ-1 — R-1 Q1 redirection-fraction adjudication.** **LOAD-BEARING.** See §4 for full detail.
- **TQ-2 — Cost cap selection.** Recommendation: Option B ($25 cap). See §5 for full detail.
- **TQ-3 — Branch name.** Recommendation: `feat/integrated-pipeline-build`. See §5.
- **TQ-4 — Reaffirm Q4 / Q-A / Q-B.** Procedural reaffirmation. See §5.

---

## §4 — TQ-1 — Q1 redirection-fraction adjudication (Tue decision required)

### The contradiction

The L5 INDEX, E2E audit, build handoff, and the consolidation handoff prompt that initiated this F0–F7 work all assert **Q1 = 20% redirection fraction** as a locked user decision. Source: "iteration design §11 Q1; user confirmed."

The L5_ITERATION_LOOP_DESIGN.md §1 — the doc that originally proposed the 20% mechanism — has since **explicitly retired it** with reasoning:

> *"No mandated redirection fraction. ... Saved budget is genuine savings, not a slush fund. Extra spend happens **only when a specific edit demonstrably demands it** — and that's exactly what the escalation ladder (§6.4) already encodes. No mandated redirection fraction."*

§9 of the iteration design (titled "Where extra spend happens (and where it doesn't)") formally codifies the retirement: spend is trigger-driven via the existing escalation ladder Levels 1-4, NOT scheduled via a redirection fraction. §11 Q1 is now a different question entirely (about `focused_structural` mode scope).

### The retirement reasoning

Per §1 of the iteration design:

1. **The carry-forward already delivers the quality booster** — iteration N's L5 receives priorAnnotations + carry-forward context + matured findings. That's structurally deeper than iter-1 cold pass at no extra cost.
2. **A mandated fixed-fraction redirection violates LLM-first Rule 2** (no quotas / forced structure).
3. **Tue's correction**: "we don't need to force findings or a certain amount." Right — extra spend should be *triggered by the edit*, not *scheduled*.

### Two reasonable resolutions

**Resolution A (recommended): The retirement is correct. Update the locked-decisions table to reflect the iteration loop design's current state.**

- Q1 becomes "no mandated redirection fraction; extra spend is triggered by escalation ladder per §6.4 and §9 of iteration design".
- Source citations updated: iteration loop design §1 + §9 (instead of §11 Q1).
- D-4.11 from L5 implementation plan (Budget redirection mechanism) is **deleted**. Replaced by D-4d.16 (cost trajectory test) which verifies the existing escalation ladder produces the iteration loop design's predicted cost trajectory without redirection.
- The L5 implementation plan's $10 cap allocation does not change — the redirection mechanism wasn't a separate budget line; it was a runtime allocation policy.
- Per-doc supersession markers applied across INDEX, E2E audit, build handoff, consolidation prompt, MASTER_INTEGRATION_PLAN v2 §5, and INTEGRATED_BUILD_HANDOFF_PROMPT §4: each gains a "Q1 = no redirection fraction; trigger-driven via escalation ladder" entry.

**Resolution B: The 20% lock holds. Iteration loop design's §1 retirement is the over-correction.**

- Iteration loop design §1 prose updates: "redirect 20% of carry-forward savings into deeper treatment of changed paragraphs per Q1".
- §9 prose updates: extra spend has both trigger-driven (escalation ladder) AND scheduled (20% redirection) sources. The redirection allocator is added back.
- D-4.11 from L5 implementation plan stays as in L5-only plan: implements 20% allocator that routes savings into deeper treatment.
- Iteration loop design §11 Q1 can become a different sub-question or get renumbered to keep Q1 = redirection.

### Recommendation

**Resolution A**. The retirement reasoning in iteration design §1 is internally coherent and traces to a documented user correction. The carry-forward already delivers the quality booster for free; adding a mandated redirection fraction on top is mechanism complexity that the design has correctly outgrown.

**However**, this is Tue's call. Both resolutions are internally consistent; the question is which represents Tue's current intent.

### Impact of Tue's choice

**If Resolution A**:
- L5 docs (INDEX, E2E audit) get supersession markers applied.
- INTEGRATED_BUILD_SEQUENCE.md D-4d.16 stands; D-4.11 of L5 implementation plan deleted.
- MASTER_INTEGRATION_PLAN.md v2 §5 revised: Q1 entry updates to no-redirection.
- INTEGRATED_BUILD_HANDOFF_PROMPT.md §4 revised: Q1 entry updates.

**If Resolution B**:
- L5_ITERATION_LOOP_DESIGN.md §1 + §9 revised to restore mechanism.
- INTEGRATED_BUILD_SEQUENCE.md adds D-4d.18 (the 20% allocator).
- MASTER_INTEGRATION_PLAN.md v2 §5: Q1 entry stands as 20%.
- INTEGRATED_BUILD_HANDOFF_PROMPT.md §4: Q1 entry stands as 20%.

Either way, the build phase opens with a clean Q1 — but it must be one or the other. **The build phase does not open until Tue selects.**

---

## §5 — TQ-2, TQ-3, TQ-4

### TQ-2 — Cost cap selection

**Two options** per INTEGRATED_BUILD_SEQUENCE.md §10:

**Option A — $10 cap (L5-only baseline, tightened)**: 5 mid-build API touchpoints + final E2E + slack. Hard halt at $9. Tight; may force deferring some Phase 4 verifications.

**Option B — $25 cap (recommended for integrated build)**: 9 mid-build API touchpoints + 3-iteration E2E (including focused_structural verification) + fix-cycles + ~$10 slack buffer. Hard halt at $24, warn at $20.

**Recommendation: Option B.** The L5-only $10 cap was tight; the integrated build's expanded scope (L3 redesign mid-build calibration, L3.75 absorption verification, corpus 8-type wiring smoke, focused_structural mode validation, L4 context compression verification, L3.5 contradictionFlags calibration) genuinely needs more headroom. The $15 increase buys 4 additional mid-build touchpoints + 1 additional E2E iteration + slack. Each touchpoint validates a specific load-bearing prompt or mechanism that the foundation cannot self-validate.

**Tue's call.** Per `feedback_cost_budget.md` user feedback ("$5 hard cap per test run; ask before any API call >$5 even inside an approved range"), Option B respects the per-run cap (each touchpoint ≤$2; final E2E in two halves of $1.30 + $0.40); the aggregate is the integrated cap.

### TQ-3 — Branch name

**Recommendation: `feat/integrated-pipeline-build`** (branched from current `feat/wave-3a-phase-3b-3c`).

Replaces L5-only's `feat/l5-redesign-build` since the build now covers all workstreams. All deliverables land in this branch. Merge to main only after Tue review at Phase 6.

### TQ-4 — Reaffirm Q4 / Q-A / Q-B

These are stable per all foundation docs. Recommend reaffirm.

| Decision | Locked answer | Stable? |
|---|---|---|
| Q4 — landing-detector confidence floor | 0.7 to count as `addressed`; below → `partially_addressed` | Stable |
| Q-A — Conversator availability | Continuous chat surface, always available; analysis-initiated dig questions fire at specific moments | Stable |
| Q-B — specifics dig origination | Analysis-driven (B1). Analysis layers produce structured signals; Conversator is targeted inquiry agent | Stable |

---

## §6 — Build-phase entry conditions

The build phase opens against `INTEGRATED_BUILD_HANDOFF_PROMPT.md` after:

1. **Tue reads this F7 doc.**
2. **Tue adjudicates TQ-1 (R-1 Q1)** with Resolution A or B selected. Per-doc supersession edits scheduled per §4 outcome.
3. **Tue selects TQ-2 (cost cap)** with Option A or B.
4. **Tue confirms TQ-3 (branch name)** as `feat/integrated-pipeline-build` or alternative.
5. **Tue reaffirms TQ-4 (Q4 / Q-A / Q-B stability).**
6. **Tue's sign-off** is recorded in this doc (a follow-up edit captures the outcomes per §7 below).
7. **The deferred per-doc edits** (per §2 deferred list) are scheduled for build-phase Phase 0 cross-phase audit (D-0.18 in INTEGRATED_BUILD_SEQUENCE).

After Tue sign-off, a new chat opens with `INTEGRATED_BUILD_HANDOFF_PROMPT.md` as the system prompt. The new chat reads the foundation, then begins D-0.1 (IterationLedger types).

---

## §7 — Tue sign-off section (to be filled in by Tue)

When Tue reads this doc and approves the foundation, edit this section with the outcomes:

### TQ-1 — Q1 redirection-fraction adjudication

- **Tue's selection**: **Resolution A** (retirement is correct; "If it was retired let's not use it. Retirement was the right decision.")
- **Date**: 2026-04-26
- **Effect**: Q1 = no mandated redirection fraction. Extra spend triggered by escalation ladder per L5_ITERATION_LOOP_DESIGN §6.4 + §9. D-4.11 from L5 implementation plan deleted. Per-doc supersession markers scheduled at build-phase Phase 0 D-0.18.

### TQ-2 — Cost cap selection

- **Tue's selection**: **Option A ($10 cap, with re-evaluation after consumption)**
- **Date**: 2026-04-26
- **Reasoning**: "Let's keep it to $10 for now and after that see what we get from that and if we should enable a higher budget and continue. I just want to be smart about expenditure." Stage-gated approach: hold $10 hard cap; mid-build, if a verification touchpoint genuinely needs more headroom, escalate for incremental budget rather than expanding pre-emptively.
- **Effect**: INTEGRATED_BUILD_SEQUENCE.md §10 Option A allocation applies. Hard halt at $9. Build-phase escalations to Tue when a touchpoint would exceed allocation; do not silently expand.

### TQ-3 — Branch name

- **Tue's selection**: **`feat/integrated-pipeline-build`** (agreed)
- **Date**: 2026-04-26

### TQ-4 — Q4 / Q-A / Q-B reaffirmation

- **Tue's confirmation**: **Reaffirm.** Q4 = 0.7 confidence floor. Q-A = continuous chat + dig at moments. Q-B = analysis-driven (B1).
- **Date**: 2026-04-26

### Sign-off

- **Tue signs off on integrated build phase entry**: 2026-04-26
- **Build-phase chat opens against `INTEGRATED_BUILD_EXECUTION_HANDOFF.md`**.

---

## §8 — Foundation phase summary

### What was produced

| Phase | Output | Lines (effective) | Time invested |
|---|---|---|---|
| F0 | MASTER_PLAN_READING_NOTES.md | ~17K | ~12 hours of reading + ~3 hours of synthesis |
| F1 | IMPLEMENTATION_STATUS_MATRIX.md | ~13K | ~3 hours of agent dispatch + verification |
| F2 | L5_AND_MASTER_RECONCILIATION.md | ~14K | ~4 hours of reconciliation work |
| F3 | INTEGRATION_CONTRACTS.md | ~10K | ~2 hours of seam-by-seam audit |
| F4 | MASTER_INTEGRATION_PLAN v2 | ~13K | ~3 hours of revision |
| F5 | INTEGRATED_BUILD_SEQUENCE.md | ~16K | ~4 hours of deliverable enumeration |
| F6 | INTEGRATED_BUILD_HANDOFF_PROMPT.md + L5 supersession | ~9K + 1 marker | ~2 hours |
| F7 | This doc | ~5K | ~1 hour |
| **Total** | **8 new docs + 2 in-place revisions** | **~97K lines effective** | **~34 hours** |

### Reconciliation issues resolved

- 14 reconciliation issues identified (R-1 through R-14).
- 13 resolved by this consolidation.
- 1 (R-1) escalated to Tue as TQ-1.

### Implementation status of the codebase (per F1)

- 13 components functional today.
- 7 components partial (need extension).
- 9 components only-planned (need greenfield).
- 47 integration seams audited. 24 functional. 4 partial. 19 only-planned.

### Build phase scope (per F5)

- ~168 deliverables across Phase 0–6.5.
- ~12–18 weeks of focused engineering.
- Cost cap pending Tue selection ($10 vs $25).

---

## §9 — Closing

The foundation is ready. The integrated build phase opens against `INTEGRATED_BUILD_HANDOFF_PROMPT.md` after Tue's sign-off captures the four TQ outcomes in §7 above.

The system Tue described over weeks of design work now has a foundation that genuinely deserves the name "ultimate master plan." Every layer's PLAN has been reconciled with every other layer's PLAN and with the L5 docs. Every component's actual implementation status is known and documented. Every layer-to-layer integration contract is named, symmetric, and validated. The MASTER_INTEGRATION_PLAN.md is the horizontal master view, fully coherent. The INTEGRATED_BUILD_SEQUENCE.md is the vertical execution spine, executable deliverable-by-deliverable. The L5 docs are reconciled against the absorption decisions (with deferred per-doc rewrites scheduled for build-phase Phase 0 audit). The cross-cutting docs are integrated with the layer story. The standing charter (no fallbacks, agent dispatch, continuous revision, system-level review) is articulated as workspace-wide discipline. The build-phase handoff prompt is ready to open a new chat that executes the integrated build coherently.

When Tue reads the consolidated workspace, the impression should be: **the entire system iteration has been thought through to depth across every layer, every seam, every cross-cutting concern. The build phase, when it opens, opens against a foundation that does not collapse under it.**

That is what every phase of the foundation work was for. Tue's sign-off in §7 closes it.

---

> **End of consolidation final review.** Build phase opens after Tue signs off.
