# L5 ↔ Master Reconciliation — Phase F2 deliverable

> **Purpose.** Resolve every load-bearing contradiction, supersession need, and contract gap between the L5 docs (the deepest workstream) and the rest of the master workspace (per-layer PLANs, cross-cutting docs, MASTER_INTEGRATION_PLAN). Consolidates the gaps surfaced in `MASTER_PLAN_READING_NOTES.md` into a per-issue resolution table. Drives the supersession-aware edits applied in this same phase.
>
> **Scope.** All conflicts identified in F0. Per issue: which docs are involved, the divergence, the resolution (or escalation), the edits required.
>
> **Authority boundary.** Most reconciliations are doc-internal and resolvable by this consolidation. **One Tue-decision is genuinely required: the Q1 redirection-fraction question.** Surfaced explicitly in §1 below.

---

## §0 — How this doc is structured

Per reconciliation issue:

- **Issue ID** (R-1, R-2, …)
- **Severity** (load-bearing / contract / annotation)
- **Docs involved** (which workspace docs reference the conflicting/missing claim)
- **Divergence** (what the docs say differently)
- **Resolution** (the proposed fix)
- **Authority** (this consolidation OR Tue OR future build phase)
- **Edits required** (the specific supersession markers, doc rewrites, schema updates)
- **Status** (resolved / pending Tue / staged)

Issues are ordered by severity (load-bearing first), then by reach (broadest impact first).

---

## R-1 — Q1 redirection-fraction contradiction (LOAD-BEARING, TUE DECISION REQUIRED)

### Severity
Load-bearing. Affects: the L5 docs' canonical "locked decisions" table, the L5 implementation plan's D-4.11 deliverable, the L5 build handoff, and (by extension) the consolidation handoff prompt that brought us to this work.

### Docs involved
- `L5/L5_REDESIGN_INDEX.md` §"The four user-decisions, locked in" — Q1 = **20% redirection fraction**, sourced as "iteration design §11 Q1; user confirmed".
- `L5/L5_E2E_INTEGRITY_AUDIT.md` lines 7–11 — same Q1 = 20% lock asserted at the top of the audit's standing decisions block.
- `L5/L5_BUILD_HANDOFF_PROMPT.md` §4 — same lock.
- `L5/L5_IMPLEMENTATION_PLAN.md` D-4.11 — `Budget redirection mechanism (20% fraction, deeper-treatment allocator)` listed as a Phase 4 deliverable.
- The consolidation handoff prompt that initiated this F0–F7 work — also asserts Q1 = 20%.
- **L5/L5_ITERATION_LOOP_DESIGN.md §1 — explicitly retires this mechanism**: *"No mandated redirection fraction. ... Saved budget is genuine savings, not a slush fund. Extra spend happens **only when a specific edit demonstrably demands it** — and that's exactly what the escalation ladder (§6.4) already encodes."*
- `L5/L5_ITERATION_LOOP_DESIGN.md` §11 Q1 — has **been replaced** with a different question (about `focused_structural` mode scope).
- `L5/L5_ITERATION_LOOP_DESIGN.md` §9 — titled "Where extra spend happens (and where it doesn't)" — formally codifies the retirement: spend is trigger-driven via the existing escalation ladder, NOT scheduled via a redirection fraction.

### Divergence

The INDEX, the E2E audit, the build handoff, and the consolidation prompt all carry Q1 = 20% as a **locked user decision**. The iteration loop design — the doc that originally proposed the 20% mechanism — has since **explicitly retired it** with reasoning, and Q1 in §11 of that doc is now a different question entirely.

The retirement reasoning in §1: (a) carry-forward already delivers the quality booster for free (iteration N's L5 receives priorAnnotations + carry-forward context + matured findings — structurally deeper than iter-1 cold pass at no extra cost); (b) a mandated fixed-fraction redirection violates LLM-first Rule 2 (no quotas / forced structure); (c) Tue's correction "we don't need to force findings or a certain amount" — extra spend should be *triggered by the edit*, not *scheduled*.

The retirement reasoning is internally coherent and traces to a documented user correction. The "20% locked" position carries forward verbatim from an earlier iteration of the design that the iteration loop design itself moved past.

### Resolution

**Tue must adjudicate.** Two reasonable resolutions:

**Resolution A (recommended): The retirement is correct. Update the locked-decisions table to reflect the iteration loop design's current state.**

- Revise the four locked decisions: Q1 becomes "no mandated redirection fraction; extra spend is triggered by escalation ladder per §6.4 and §9 of iteration design". Source: iteration loop design §1 + §9.
- Delete D-4.11 from the L5 implementation plan (Budget redirection mechanism). Replace with a deliverable that ensures the existing escalation ladder's Levels 1–4 are correctly wired to the iteration ledger and IterationRecord reports actual escalation level per iteration.
- The L5 implementation plan's $10 cap allocation does not change — the redirection mechanism wasn't a separate budget line; it was a runtime allocation policy.
- Apply consistent supersession markers across INDEX, E2E audit, build handoff, consolidation prompt: each of those docs gains a `[SUPERSEDED — see L5_ITERATION_LOOP_DESIGN.md §1; user-confirmation predates the iteration design's evolution; awaiting Tue re-confirmation in F7]` marker on the Q1 row.

**Resolution B: The 20% lock holds. Iteration loop design's §1 retirement is the over-correction.**

- Restore the redirection fraction mechanism in the iteration loop design.
- Keep D-4.11 as planned.
- Iteration loop design §1 prose updates: "redirect 20% of carry-forward savings into deeper treatment of changed paragraphs per Q1".
- §9 prose updates: extra spend has both trigger-driven (escalation ladder) AND scheduled (20% redirection) sources.

### Authority
**Tue.** Both resolutions are internally consistent; the question is which represents Tue's current intent. Surface this in F7's CONSOLIDATION_FINAL_REVIEW.md as the primary blocking question for build-phase entry.

### Edits required
- **Pending Tue's decision.** Apply markers below in F7 once decided.
- *If A:* per-doc supersession markers + D-4.11 rewrite + LOCKED_DECISIONS update.
- *If B:* iteration loop design §1 + §9 + §11 Q1 rewrite to restore the mechanism.

### Status
**PENDING TUE.** Highest-priority Tue-decision for the foundation phase.

---

## R-2 — L3.75 absorption pervasiveness (LOAD-BEARING, broad supersession edits)

### Severity
Load-bearing. The most pervasive reconciliation. Affects: every L5 doc, RE_ANALYSIS_LIFECYCLE_DESIGN, ESSAY_NORTH_STAR_DESIGN, CONSUMPTION_AUDIT cost table.

### Docs involved
- **Authoritative**: `L3-75/L3_ABSORBS_L3_75.md` — Decision B APPROVED 2026-04-25. The pivot kills L3.75 as a discrete layer; absorbs work into L3 lenses (Voice/Meaning/Story/Admissions) + Pass 3 + L3.5 (contradictionFlags + essayStrengthSignatures) + L4b (pairedImprovement). Code consequence: ~3K lines deleted (`holisticSynthesis.ts` + iteration orchestration + Meta + Curation + UnderstandingProse).
- **Affected docs that reference "L3.75" as a discrete layer with discrete behavior**:
  - `cross-cutting/RE_ANALYSIS_LIFECYCLE_DESIGN.md` — §2 conditional re-run rule + §3 escalation-gated holistic refresh + §4 step 5 in comprehensive procedure + §5 step 5 ripple handling + §7 layer re-run rules table. All framed around L3.75 as discrete callable layer with section-level invalidation.
  - `L4/ESSAY_NORTH_STAR_DESIGN.md` — line 69: "After L3.75 (Holistic Synthesis): The North Star reaches maturity."
  - `L5/L5_EXPERIENCE_TARGET.md` — §5 surface inputs reference L3.75 fields throughout (voiceIdentity, voiceMap, momentEarnednessMap, etc.).
  - `L5/L5_ITERATION_LOOP_DESIGN.md` — §3 inventory rows 11–19 (L3.75 sections) + §4.5 per-section policy (10 sections) + §10 F1 voice-section-refresh + §11 Q5 (L3.75 prompt-mask architecture).
  - `L5/L5_E2E_INTEGRITY_AUDIT.md` — §1.3 step 11 (L3.75 targeted-refresh prompt with section masks) + §3.2 SpecificsNeed contributors (L3.75 holistic) + §6.2 no-fallback diff applied to iteration design's L3.75 references.
  - `L5/L5_CONSUMPTION_AUDIT.md` — rows 49–110 (L3.75 fields) + cost convention table (L3.75 = ~$0.10).
  - `L5/L5_FEEDBACK_REDESIGN.md` — §1.2 input contract + §2 signal inventory + §11.2 failure mode (L3.75 partial).
  - `L5/L5_IMPLEMENTATION_PLAN.md` — D-4.1 "L3.75 targeted-refresh prompt variant + section-mask handling" + D-4.3 "L3.75 targeted-refresh contamination check".

### Divergence

The L3.75 absorption decision says: post-pivot, L3.75 fields are still produced (the field shapes mostly unchanged) but produced by L3 lenses + Pass 3, NOT by a separate L3.75 layer. Mechanisms that operate on "the L3.75 layer as a callable" — targeted refresh with section masks, single-Sonnet-call section invalidation, periodic backstops — must re-map to per-lens mechanisms.

### Resolution

**This consolidation resolves it.** The L3.75 absorption is APPROVED and authoritative. Every affected doc gets a structured supersession marker template and per-section guidance.

**Supersession marker template** (apply to all affected sections):

```markdown
> **[NOTE — L3.75 absorption applies. Per `L3-75/L3_ABSORBS_L3_75.md` (APPROVED 2026-04-25), the L3.75 layer is being retired and its work absorbed into L3 lenses (Voice/Meaning/Story/Admissions) + L3 Pass 3 + L3.5 (contradictionFlags, essayStrengthSignatures) + L4b (pairedImprovement). The fields referenced below still exist, but their layer-of-origin changes. Mechanisms that operated on "the L3.75 layer as a callable" are re-mapped per the table at `cross-cutting/L5_AND_MASTER_RECONCILIATION.md` §R-2.]**
```

**Per-mechanism re-mapping table** (lands in this doc; referenced from supersession markers):

| Pre-absorption mechanism | Post-absorption mechanism |
|---|---|
| L3.75 single Sonnet call producing 10 sections | 4 lens calls (Voice/Meaning/Story/Admissions, parallel Sonnet) producing dimension-organized outputs + 1 Pass 3 Sonnet call producing 4 cross-dimension fields. Total ~$0.40 vs old ~$0.10 (NOTE: L3 cost rises but L3.75 cost goes to $0; net cost is lower per absorption decision §Cost model). |
| L3.75 "section-by-section invalidation flags" | Per-lens invalidation flags. Voice lens re-runs invalidate voiceIdentity + voiceMap + voice-craft prose. Meaning lens re-runs invalidate thematicArchitecture + craftAssessment.imageSystem + meaningGaps. Story lens re-runs invalidate narrativeStrategy + emotionalTopography.peakMoments + craftAssessment.pacingShape. Admissions lens re-runs invalidate admissionsPositioning + characterSignals. Pass 3 re-runs invalidate writerPortrait + entanglements + emotionalTopography.arcTrajectory + momentEarnednessMap.mechanisms. |
| L3.75 "targeted refresh prompt with section masks (single Sonnet call)" | Lens-targeted re-run mechanism: per-lens invalidation flags route to selective lens re-runs; Pass 3 re-runs only if cross-dimension fields are invalidated. NO single-call section-mask alternative. |
| L3.75 "$0.10 single Sonnet call" cost convention | L3 lens cost ~$0.06–$0.10 each × 1–4 lenses + Pass 3 ~$0.08. Re-run cost depends on invalidation scope. |
| L3.75 holisticEvolution per-paragraph snapshot | Carries to L3 walk Pass 1 (Sweep). The walk produces holisticEvolution snapshots; lens deep reads consume them as input. |
| L3.75 "iter_1 / Meta / Curation / Reread" sub-mechanisms | DELETED entirely per absorption decision. NO migration; convergence-by-default replaces iteration. |
| L3.75 UnderstandingProse | DELETED entirely. EssayPortrait UI renders from structured fields (voiceIdentity.signature + thematicArchitecture.centralThesis + writerPortrait + tellabilitySummary + narrativeStrategy.primaryStrategy). |
| L3.75 "10 sections atomic regeneration" pattern | Replaced by lens emissions ARE the holistic-profile field writes (no synthesis transformation). Each lens emits its dimension's holistic-profile fields directly. Pass 3 emits the 4 cross-dimension fields. |

**Per-doc edits required**:

1. **`cross-cutting/RE_ANALYSIS_LIFECYCLE_DESIGN.md`** — Add the absorption note at top. Rewrite §2 (L3.75 holistic re-run rules → "lens re-run rules"). Rewrite §3 (focused-mode holistic sections → "focused-mode lens-section rules"). Update §4 step 5 (comprehensive content + structural edit procedures). Update §5 step 5 (focused ripple handling level-3 holistic refresh → "lens-targeted refresh"). Update §7 layer re-run rules summary table — replace "L3.75 Holistic Synthesis" row with "L3 Lens (per-lens) + Pass 3" rows.

2. **`L4/ESSAY_NORTH_STAR_DESIGN.md`** — Update line 69: "After L3.75 (Holistic Synthesis): The North Star reaches maturity" becomes "After L3 (Sweep + Lens deep reads + Pass 3): The North Star reaches maturity. Lens emissions populate the holistic-profile fields the North Star reads; Pass 3 produces the cross-dimension fields (writerPortrait, entanglements, arcTrajectory, momentEarnednessMap.mechanisms) that the North Star uses to articulate the architecture-of-meaning."

3. **`L5/L5_EXPERIENCE_TARGET.md`** — Add absorption note at top of §5. Per-surface input lists reference fields that still exist; layer-of-origin updates implicit via the absorption note.

4. **`L5/L5_ITERATION_LOOP_DESIGN.md`** — Add absorption note. Rewrite §3 inventory rows 11–19 to reference per-lens carry-forward units (Voice lens, Meaning lens, etc.) instead of "L3.75 voiceIdentity", "L3.75 voiceMap", etc. Rewrite §4.5 per-lens policy table replacing "section" with "lens emission". Update §10 F1 (voice register-shift detector flags → triggers Voice lens re-run, NOT a "voice section" of L3.75).

5. **`L5/L5_E2E_INTEGRITY_AUDIT.md`** — Add absorption note. Rewrite §1.3 step 11: "L3.75 holistic synthesis runs in targeted-refresh mode" becomes "L3 Pass 2 — affected lens(es) re-run; Pass 3 re-runs if cross-dimension fields invalidated. Lens-targeted invalidation flags are computed by editUnderstandingService. NO fallback to per-section calls within a single call." Rewrite §3.2 SpecificsNeed contributor table — split L3.75 row into Voice lens / Meaning lens / Story lens / Admissions lens / Pass 3 contributors.

6. **`L5/L5_CONSUMPTION_AUDIT.md`** — Add absorption note. Cost convention table: replace "L3.75 (holisticSynthesis) Sonnet ~$0.10" with "L3 Pass 2 lenses 4× Sonnet ~$0.06–$0.10 each (parallel) + L3 Pass 3 1× Sonnet ~$0.08". Rows 49–110 each gain a "Layer-of-origin (post-absorption)" annotation. Row 95 `characterRevelation.blindSpots[]` verdict CHANGES from `rewire` to `cut` per absorption Decision A.

7. **`L5/L5_FEEDBACK_REDESIGN.md`** — Add absorption note. §1.2 input contract gets a layer-of-origin update note. §2 signal inventory rows referencing L3.75 each gain a "(post-absorption: emitted by [lens or Pass 3])" annotation.

8. **`L5/L5_IMPLEMENTATION_PLAN.md`** — D-4.1 rewrites from "L3.75 targeted-refresh prompt variant + section-mask handling" to "Lens-targeted re-run mechanism: per-lens invalidation flags + selective lens re-runs + optional Pass 3 re-run". D-4.2 prompt revision changes accordingly. D-4.3 contamination check rewrites to "lens-mask honoring check" — the check becomes: when only Voice lens is flagged invalid, do Meaning/Story/Admissions lenses come back unchanged (carried forward) and does Voice lens output cleanly replace? Mid-build API touchpoint #4 budget unchanged ($1.00–$1.50). The Phase 4 totals do NOT change.

### Authority
**This consolidation.** The absorption decision is approved; the supersession edits are mechanical applications of an authoritative decision.

### Edits required
Apply the supersession markers + per-doc rewrites in this F2 work. (Surface a list of file edits in F7's CONSOLIDATION_FINAL_REVIEW.md.)

### Status
**STAGED.** The supersession marker template + the re-mapping table are committed in this doc; per-doc rewrites are queued for the F4 (master plan revision) and F7 (final review) phases of this consolidation. **Suggest applying the absorption notes as headers in F4 (in MASTER_INTEGRATION_PLAN) and queueing the deeper per-doc rewrites for the build phase's first deliverable (since the rewrites are tightly coupled to the L3 redesign that the build phase will execute).**

---

## R-3 — L4 pairedImprovement absorption (CONTRACT, narrow supersession)

### Severity
Contract. Narrow but load-bearing for the L5 → L4 → manifest contract.

### Docs involved
- **Authoritative**: `L4/PLAN.md` — L4b absorbs `pairedImprovement` payload (technique + directive + architecturalReason + demonstrationSketch + expectedImpact). Schema change to `ImprovementManifestEntry`.
- **Affected**: `L5` docs — reference `coachingMap.priorities[].pairedImprovement` extensively for Move 7 contribution framing.

### Divergence

L5 docs reference `pairedImprovement` as an existing field on coaching map priorities. L4/PLAN says L4b will EMIT this field directly post-absorption (instead of receiving it from L3.75). The field SHAPE stays; the source/owner changes from L3.75 to L4b.

### Resolution

This is a CONTRACT-level reconciliation. The L5 docs' assumption ("`coachingMap.priorities[].pairedImprovement` exists") holds post-absorption; the producer changes. F2 needs to verify the L4b output shape matches what L5 reads.

Per L4/PLAN.md, the absorbed schema lives on `ImprovementManifestEntry` (not on `coachingMap.priorities[].pairedImprovement`). This is a SHAPE difference that needs F4 to reconcile:

- L4 today: pairedImprovement on `craftAssessment.growthEdges[].pairedImprovement` (L3.75 emit) AND L4b reads it into `ImprovementManifestEntry`.
- L4 post-absorption: pairedImprovement on `ImprovementManifestEntry` directly (L4b emit). L5 reads from `ImprovementManifestEntry` per the manifest merger pattern, OR L5 reads from `coachingMap.priorities[].pairedImprovement` per the sub-field structure.

**Need to check**: does the L5 prompt currently read `coachingMap.priorities[].pairedImprovement` as a sub-field, or does L5 read from a different path? If different, the absorption is shape-compatible. If the same, the absorption needs an additional adapter.

### Authority
This consolidation, with verification from F1 implementation audit.

### Edits required
- F1 audit results will name the exact L5 read site for pairedImprovement.
- Either: (a) confirm L5 reads from `ImprovementManifestEntry` (manifest-merger path) and absorption is clean; (b) note an L5 prompt adjustment is needed in F4/F5.

### Status
**STAGED, awaiting F1 audit confirmation.**

---

## R-4 — `focused_structural` mode introduction (CONTRACT, integration into RE_ANALYSIS_LIFECYCLE)

### Severity
Contract. Affects mode-selection unification between iteration loop and re-analysis lifecycle.

### Docs involved
- **Source of proposal**: `L5/L5_ITERATION_LOOP_DESIGN.md` §4.4b — proposes NEW `focused_structural` mode between focused and comprehensive. Re-derives only structural reads (L2 cartography, narrativeStrategy/thematicArchitecture/momentEarnedness sections, northStar.throughLineMap, scoreMatrix.crossParagraphPatterns, coachingMap, cross-para L5). Carries voiceIdentity, voiceMap, characterRevelation, craftAssessment, L1, unchanged paragraphs' L3/L3.5 understanding. Cost target ~$0.40–0.50 vs $1.12 comprehensive. Saves ~$0.80 on common reorder edits.
- **Doesn't yet integrate**: `cross-cutting/RE_ANALYSIS_LIFECYCLE_DESIGN.md` — §1 decision tree only has 2 modes (comprehensive | focused) with sub-modes; §7 unified spec's `selectAnalysisMode()` rules route reorders to comprehensive directly.
- **Existing code**: `focusedAnalyzer.selectAnalysisMode()` at `focusedAnalyzer.ts:705–783` per the iteration design — also routes reorders to comprehensive (rule 3).

### Divergence

The iteration loop design's §4.4b adds a 3rd mode that the cross-cutting lifecycle spec doesn't have. The cross-cutting spec is otherwise the unified definition of `handleTextChange` — adding a mode there integrates the change cleanly.

### Resolution

**Update RE_ANALYSIS_LIFECYCLE_DESIGN.md to integrate `focused_structural`.** Apply per the iteration design's §4.4b spec:

- Decision tree (§1): add `focused_structural` between comprehensive and focused.
- Mode selection rules (§7): rules 3 and 4 (structural change → comprehensive) split. Rule 3 becomes "structural reorder/insert/delete WITHOUT alongside transformative paragraph rewrites → focused_structural". Rule 4 becomes "structural change WITH transformative rewrites → comprehensive".
- New section §4b (or extend §4) describing focused_structural's procedure: index remap + L2 re-derive + targeted L3.75 (post-absorption: targeted lens re-runs) + targeted L4 + cross-para L5; carry voice/character/craft/L1/unchanged-paragraph reads with index re-keying.
- §6 edge cases: confirm reorder + minor content edit on adjacent paragraph stays focused_structural; reorder + transformative rewrite escalates to comprehensive.
- §7 layer re-run rules summary table: add `focused_structural` column; populate per the iteration design's lens-by-lens carry list.

### Authority
This consolidation, applied in F4 alongside the absorption integration.

### Edits required
RE_ANALYSIS_LIFECYCLE_DESIGN.md gets the new mode. The iteration loop design § 4.4b stands as authoritative reference.

### Status
**STAGED for F4 application.**

---

## R-5 — Cost trajectory canonical numbers (CONTRACT, harmonization)

### Severity
Contract / annotation. Affects: how the master plan presents cost discipline.

### Docs involved
- `MASTER_INTEGRATION_PLAN.md` — $2.00 round-1 cap, $0.30 round-5 (selective re-analysis).
- `cross-cutting/RE_ANALYSIS_LIFECYCLE_DESIGN.md` — $0.75 fresh → $0.04 polish (25x reduction).
- `L5/L5_ITERATION_LOOP_DESIGN.md` §8 — $1.035 → $0.275 (~3.8x reduction).

### Divergence

Three different canonical cost trajectories. Each is internally consistent but they don't compose:
- Master plan claims a $2 round-1 ceiling, $0.30 round-5 floor.
- Re-analysis lifecycle's $0.75 → $0.04 (25x) is a 5-paragraph foundation-phase essay assuming polish-mode $0.04 minimum on the smallest possible edit.
- Iteration loop design's $1.035 → $0.275 (3.8x) is a 5-paragraph essay across a typical 5-iteration lifecycle.

Per L5_ITERATION_LOOP_DESIGN §11 Q7: "Comprehensive-mode baseline alignment. §8's $1.035 baseline doesn't match PLAN.md's $0.75 exactly because the table includes craft-phase L5. Harmonize numbers across docs, or accept the order-of-magnitude agreement?"

### Resolution

Harmonize at the master plan level (F4):

- **Round-1 cost**: $1.00–$2.00 depending on essay phase. Foundation-phase ~$1.00 (5-paragraph), Polish-phase ~$2.00 (10-paragraph craft-heavy).
- **Round-N cost** (selective re-analysis): $0.05–$0.30 depending on edit type. Word-level focused ~$0.05; paragraph rewrite focused ~$0.20; structural reorder via `focused_structural` ~$0.30.
- **Cumulative session cost** (5 iterations): $1.40–$2.50 typical.
- The 25x reduction in RE_ANALYSIS_LIFECYCLE_DESIGN refers to the smallest-edge case (single word change, no ripple). The 3.8x in iteration loop design refers to the typical case across a representative iteration mix.

### Authority
This consolidation, applied in F4.

### Edits required
- MASTER_INTEGRATION_PLAN gets the harmonized cost table.
- RE_ANALYSIS_LIFECYCLE_DESIGN's $0.75 → $0.04 stays valid as a per-edge-case quote, with a cross-reference note to the master plan's typical-case range.
- Iteration loop design §8 stays valid; §11 Q7 closes.

### Status
**STAGED for F4 application.**

---

## R-6 — L6 iteration-aware extension (LOAD-BEARING, contract gap)

### Severity
Load-bearing. The L5 docs' assumptions about L6 require L6/PLAN.md to expand.

### Docs involved
- `L5/L5_ITERATION_LOOP_DESIGN.md` §7.3 + §11 — TaughtMove ledger reads include L6 ("Conversator continuous-chat handler reads when student asks 'have we worked on this before?'"). L6 itself is part of the iteration loop's quality booster path.
- `L5/L5_E2E_INTEGRITY_AUDIT.md` §1.6–1.7 + §4 — L6/Conversator's coaching reads finalized profile + iteration ledger context after L5 carry-forward stabilizes.
- `L6/PLAN.md` — light update only, 4 field renames, no iteration-awareness expansion.

### Divergence

L5 work assumes L6 evolves to support cross-iteration coaching (taught-moves ledger reading, iteration-aware framing); L6 plan stays minimal.

### Resolution

L6's role splits naturally:

- **L6 proper** (`coachingService.ts`, `coachingPlanner.ts`) stays a light-update workstream as L6/PLAN.md describes — field renames + reading the new profile shape.
- **The Conversator** (`src/services/essayIntelligence/conversator/`) is a NEW essay-intelligence service distinct from L6. Per L5_E2E_INTEGRITY_AUDIT §4, the Conversator owns continuous chat + dig firing + dig answer extraction. Reads taughtMoves ledger.
- **L6's reads of taughtMoves** become OPTIONAL — L6's coaching can reference taughtMoves IF L6 is the active coach in that turn. The Conversator owns it as primary reader.

This means:
- L6/PLAN.md stays as-is (4 field renames).
- The Conversator service is a NEW workstream, owned by the L5 redesign (not L6 update).
- F4 master plan must articulate the L6 vs Conversator service-ownership distinction clearly.

### Authority
This consolidation.

### Edits required
- F4: clearer service-ownership map distinguishing L6 (existing) from Conversator (new).
- L6/PLAN.md gets a small note at the top: "Note: the Conversator is a sibling service to L6, owned by the L5 redesign. L6 itself is the existing coaching service whose updates this plan describes. The Conversator is new code at `src/services/essayIntelligence/conversator/` per L5_E2E_INTEGRITY_AUDIT §4."

### Status
**STAGED for F4 application.**

---

## R-7 — SpecificsNeed signal sources (CONTRACT, lens-attribution rewrite)

### Severity
Contract. Reconciles the SpecificsNeed signal's per-layer contributors with the L3.75 absorption.

### Docs involved
- `L5/L5_E2E_INTEGRITY_AUDIT.md` §3.2 — SpecificsNeed contributor table. Lists 8 contributors across L3 walk / L3.5 / L3.75 (multiple) / L4 northStar / FindingStore.
- `L3/PLAN.md` — Voice/Meaning/Story/Admissions lens emissions.
- `L3-75/L3_ABSORBS_L3_75.md` — lens ownership of holistic-profile fields.

### Divergence

§3.2 says "L3.75 holistic" emits SpecificsNeed entries from `momentEarnednessMap.gaps[]`, `intentBridge.alignments[]` mismatch, `voiceIdentity.authenticVsPerformed[]` flagged "performed", `admissionsPositioning.redFlags[]`. Post-absorption, these emissions come from different lenses + Pass 3.

### Resolution

Rewrite §3.2 contributor table per lens-of-origin:

| Layer (post-absorption) | Contributor | Trigger | expectedAnswerShape | Consumers | Populates |
|---|---|---|---|---|---|
| L3 walk (Sweep) | newFindings[] with deepeningPotential + raisesQuestions[] | Walk identifies finding whose claim can't be deepened | specific_memory or narrative | finding_maturity, l3_lenses, l5 | finding.evidence[], groundTruthFacts.byLocation |
| L3 Pass 2 — Voice lens | voiceIdentity.authenticVsPerformed[] flagged "performed" | Voice flagged performed but evidence is thin | short_phrase | l3_lens_voice, l5 | voiceIdentity.authenticVsPerformed[] confirmation/refutation |
| L3 Pass 2 — Meaning lens | meaningGaps[] (essay-level meaning gaps) | Theme can't be earned from text alone | specific_memory or narrative | l3_lens_meaning, l5 | meaning gaps resolution |
| L3 Pass 2 — Story lens | momentEarnednessMap.moments[].gaps[] (after Pass 3 emit) — see Pass 3 row; Story lens contributes peakMoments + stakesLadder upstream | Pass 3 gaps emitted from Story-lens upstream signals | specific_memory or narrative | l3_pass3, l5 | momentEarnednessMap.moments[].mechanisms |
| L3 Pass 2 — Admissions lens | admissionsPositioning.redFlags[] | Red flag identified but severity context missing | short_phrase or narrative | l3_lens_admissions, l4, l5 | admissionsPositioning.redFlags[] resolution |
| L3 Pass 3 | momentEarnednessMap.moments[].gaps[] | Moment isn't earned | specific_memory or narrative | l3_pass3, l5 | momentEarnednessMap.moments[].mechanisms (added), storyFragments.byMoment |
| L3 Pass 3 | (NEW: intentBridge — moved to L4 per absorption — see L4 row) | (no longer L3) | — | — | — |
| L3.5 analysis | sentenceAnalyses[].confidence === 'low' AND sensitivityNote names student-side | Sentence's effectiveness depends on lived experience anchor not in text | short_phrase or specific_memory | l3_5, l5 | groundTruthFacts.byLocation, intentSignals.bySentence |
| L4 northStar | northStar.intentBridge.alignments[] with mismatch | System read diverges from inferred student intent | short_phrase or narrative | l4, l5 | intentBridge.alignments[] resolution, intentSignals.essayLevel |
| L4 northStar | confidence === 'hypothesis' on key fields | northStar uncertain; student confirmation locks it | short_phrase | l4, l5 | northStar.confidence, northStar.intentBridge |
| FindingStore | Finding.maturity === 'hypothesis' AND iterationsAlive ≥ 2 | Hypothesis isn't maturing on text alone | short_phrase or specific_memory | finding_maturity, l3_lenses, l5 | finding.evidence[], finding maturity transition |

**Note on `intentBridge.alignments[]`**: per L3-75/L3_ABSORBS_L3_75.md, the intentBridge moves with L4 northStar (which already owns it today), not with L3 lens emissions. Confirm in F1 audit.

### Authority
This consolidation.

### Edits required
- L5_E2E_INTEGRITY_AUDIT.md §3.2 contributor table rewrite per the lens-of-origin map above.

### Status
**STAGED for F2 application as part of L3.75 absorption supersession.**

---

## R-8 — PIPELINE_ARCHITECTURE_AUDIT findings unsequenced (CONTRACT, surface in F4)

### Severity
Contract. Several critical audit findings are not explicitly scoped into any planned PR.

### Docs involved
- `cross-cutting/PIPELINE_ARCHITECTURE_AUDIT.md` — 26 findings, esp. CRITICAL F1 (L4 context bloat 120K → 5–8K) and F2 (L3.5 mode selection cheaped out for architecture phase).
- `MASTER_INTEGRATION_PLAN.md` — 6-PR sequencing doesn't explicitly scope F1 / F2 / F18 / F22 / etc.

### Divergence

The audit was written 2026-04-07. The MASTER_INTEGRATION_PLAN was drafted 2026-04-26. Several audit findings are "fix at the L4 context assembly" or "fix L3.5 mode selection" — these are part of the cost-recovery PR or the L4 extension PR but not explicitly named.

### Resolution

F4 master plan revision adds a "Audit findings → PR scope" cross-reference section:

- **F1 (L4 context bloat)** → Cost-recovery PR1 (Phase D cache stabilization includes L4 profile-router holisticFull → holisticSummaries change). Confirm at F4.
- **F2 (L3.5 mode selection)** → L3.5 extension PR3 includes mode-selection rule update for architecture phase. Add to L3-5/PLAN.md.
- **F5 (understanding prose failed)** → DELETED entirely per L3.75 absorption. UnderstandingProse goes away; the audit finding F5 is structurally resolved.
- **F6 (only 2 findings)** → addressed by L3.75 absorption (lenses emit findings directly via `findingStore.add()`) + L3.5 contradictionFlags + L4b absorbed pairedImprovement.
- **F11 (60% profile underutilized)**, **F12 (coaching collapse)**, **F18 (describes when should prescribe)**, **F19 (5-6 insights repeated 50 times)**, **F20 (before/after rare)**, **F22 (artifacts hidden)**, **F23 (no post-session deliverable)**, **F24 (coaching breaks under stress)**, **F25 (responses too long)**, **F26 (no student writing)** → all addressed by the L5 redesign + Conversator. F4 should explicitly map.

### Authority
This consolidation, applied in F4.

### Edits required
F4 master plan adds the audit-findings-to-PR cross-reference table.

### Status
**STAGED for F4 application.**

---

## R-9 — Cross-references after migration (ANNOTATION)

### Severity
Annotation. Path-fix only.

### Docs involved
- `L5/L5_REDESIGN_INDEX.md` lines 92–98.
- `L5/L5_BUILD_HANDOFF_PROMPT.md` reading list.
- `L5/L5_CONSUMPTION_AUDIT.md` cross-references.
- Various L5 docs that reference each other via `docs/L5_*.md` paths (pre-migration).

### Divergence

The L5 docs were migrated from `docs/` root to `docs/pipeline-evolution/04-pipeline-architecture/L5/`. Cross-references inside the docs still use the old paths.

### Resolution

Update all cross-references to use relative paths within the L5/ directory or the workspace root.

### Authority
This consolidation.

### Edits required
- Walk each L5 doc, update any `docs/L5_*.md` reference to relative path.

### Status
**STAGED for F2 application** (mechanical edits, can be applied as a follow-up pass).

---

## R-10 — L5_BUILD_HANDOFF_PROMPT supersession (ANNOTATION)

### Severity
Annotation. Status update only.

### Docs involved
- `L5/L5_BUILD_HANDOFF_PROMPT.md` — original L5-only build handoff.

### Divergence

This is being replaced by the integrated build handoff prompt (F6 deliverable).

### Resolution

Mark L5_BUILD_HANDOFF_PROMPT.md as `[SUPERSEDED — see INTEGRATED_BUILD_HANDOFF_PROMPT.md]` at top.

### Authority
This consolidation, applied in F6.

### Status
**STAGED for F6 application.**

---

## R-11 — README.md doc count (ANNOTATION)

### Severity
Annotation.

### Docs involved
- `README.md` — directory map says 8 L5 docs.
- L5/L5_REDESIGN_INDEX.md — says "five governing docs" + 1 implementation plan.

### Divergence

The 8th doc is L5_BUILD_HANDOFF_PROMPT.md (now superseded). README implies 8 active docs.

### Resolution

After F6 applies the SUPERSEDED marker to L5_BUILD_HANDOFF_PROMPT.md, update README directory map to clarify: "L5/ contains 5 governing docs + 1 implementation plan + 1 superseded handoff (preserved for reference)".

### Authority
This consolidation, applied post-F6.

### Status
**STAGED for F6 application.**

---

## §X — Reconciliation summary

| ID | Severity | Status | Authority |
|---|---|---|---|
| R-1 Q1 redirection contradiction | LOAD-BEARING | **PENDING TUE** | Tue |
| R-2 L3.75 absorption pervasiveness | LOAD-BEARING | STAGED for F4/F7 | Consolidation |
| R-3 L4 pairedImprovement absorption | CONTRACT | STAGED awaiting F1 | Consolidation |
| R-4 focused_structural mode integration | CONTRACT | STAGED for F4 | Consolidation |
| R-5 Cost trajectory harmonization | CONTRACT | STAGED for F4 | Consolidation |
| R-6 L6 vs Conversator service-ownership | LOAD-BEARING | STAGED for F4 | Consolidation |
| R-7 SpecificsNeed lens-of-origin rewrite | CONTRACT | STAGED for F2 | Consolidation |
| R-8 Audit-findings → PR scope | CONTRACT | STAGED for F4 | Consolidation |
| R-9 Cross-reference path fixes | ANNOTATION | STAGED for F2 | Consolidation |
| R-10 L5_BUILD_HANDOFF supersession | ANNOTATION | STAGED for F6 | Consolidation |
| R-11 README.md doc count | ANNOTATION | STAGED for F6 | Consolidation |

**1 Tue-decision required (R-1).** All other reconciliations resolvable by this consolidation.

---

## §Y — Application order

1. **Now (this F2 deliverable lands)**: §R-7 L5_E2E_INTEGRITY_AUDIT §3.2 SpecificsNeed contributor table rewrite per lens-of-origin map. §R-9 path fixes (mechanical sweep).
2. **F4 (master plan revision)**: §R-2 absorption notes added at top of master plan. §R-4 focused_structural mode integrated. §R-5 cost harmonization. §R-6 service-ownership map. §R-8 audit-findings-to-PR cross-reference.
3. **F6 (handoff)**: §R-10 L5_BUILD_HANDOFF supersession. §R-11 README directory map update.
4. **F7 (final review)**: §R-1 surfaces to Tue for adjudication. Once Tue decides, the appropriate per-doc edits land. **Until R-1 is decided, the build phase does not open.**
5. **Build phase first deliverable**: §R-2 deeper per-doc rewrites in the L5 docs (since the rewrites are tightly coupled to the L3 redesign that the build phase will execute as PR2 in the master plan sequence).

---

> **End of L5 ↔ master reconciliation.** F3 (integration contracts), F4 (master plan revision), F5 (build sequence), F6 (handoff), F7 (final review) execute against this map.
