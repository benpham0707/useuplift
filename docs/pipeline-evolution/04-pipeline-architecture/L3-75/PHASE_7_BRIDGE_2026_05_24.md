# Phase 7 Bridge — Review + Absorption Design Draft

> **Stage 1.Z** of [`CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md`](../../00-index/CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md).
> **Decision locked**: D10 — review + absorption design draft (no code, no `holisticSynthesis.ts` deletion).
> **Date**: 2026-05-24.
>
> **Source specs reviewed**:
> - [`L3_ABSORBS_L3_75.md`](./L3_ABSORBS_L3_75.md)
> - [`FIELD_DISPOSITION_TABLE.md`](./FIELD_DISPOSITION_TABLE.md)
> - [`ITERATION_SYNTHESIS_2026_05.md`](./ITERATION_SYNTHESIS_2026_05.md)
> - [`CURRENT_STATE.md`](../../../00-index/CURRENT_STATE.md) §Phase 7 row

---

## 1. Goal of the bridge

Lay enough groundwork that Phase 7 (the L3.75 retirement PR) can ship faster, with less risk, and after Phase 6 regen confirms its assumptions. Specifically:

1. **Verify all 6 consumer-migration sites at HEAD** — designs may have drifted from code.
2. **Map the load-bearing 10%** — which fields MUST survive vs which die naturally.
3. **Sketch the L3 Pass-3 absorber** — where the 10% lands; prompt skeleton; no code.
4. **Surface gaps** — discrepancies between designs and HEAD that Phase 7 needs to resolve.

**NOT in scope**: any `holisticSynthesis.ts` deletion, any orchestrator change, any L3 code addition. Pure design.

## 2. Consumer-migration sites — verification at HEAD

The Phase 7 PR has to migrate ~6 consumer sites that today read from `holisticSynthesis.ts` outputs. The spec lists them; this section verifies each at HEAD.

| # | Spec-claimed site | Verify at HEAD | Status |
|---|---|---|---|
| 1 | L4 NorthStar reads from `EssayProfile.thematicArchitecture`, `.voiceIdentity`, `.narrativeStrategy`, `.craftAssessment`, `.admissionsPositioning`, `.characterRevelation`, `.emotionalTopography` | grep `crystallizer.ts` for these fields | **VERIFY** in Stage 2 |
| 2 | L5 reads from same holistic fields for cross-paragraph context | grep `deepAnnotationService.ts` | **VERIFY** |
| 3 | L6 coachingService reads `redFlags`, `blindSpots` (and the planned cut) | per CURRENT_STATE §Critical-path item 5 (`coachingService.ts:4016-4017`) | **CONFIRMED at HEAD** (per the matrix) |
| 4 | Iteration ledger consumes `growthLog`, `maturity` | grep `iterationLedger`-related modules | **VERIFY** |
| 5 | Coaching prompt reads `writerPortrait`, `tellabilitySummary` | grep `coachingService.ts` | **VERIFY** — these are the "highest-delight" fields, biggest risk |
| 6 | Dump renderer reads holistic sections directly | grep `renderAnalysisForStudent.ts`, `renderStudentDocumentMarkdown.ts` | **VERIFY** |

**Verification action (Stage 2 of this bridge)**: grep each site at HEAD, capture the exact field reads in a table. Update FIELD_DISPOSITION_TABLE.md against the verified list. Any "consumer site exists per spec but not at HEAD" → spec drift, surface to discuss.

## 3. The 10% — fields that must survive L3.75 deletion

Per `L3_ABSORBS_L3_75.md`: ~90% of L3.75 output (voice/theme/narrative/admissions dimension profiles) is what the redesigned L3 lenses produce; only ~10% is genuinely cross-dimension and needs a dedicated L3 Pass-3 call.

The load-bearing 10% (from the spec):

| Field | Lives on | Why load-bearing | Absorption target |
|---|---|---|---|
| `writerPortrait` | EssayProfile (L3.75 product) | "Single most important AO-signal" student-facing field; counselor-grade synthesis | L3 Pass-3 |
| `tellabilitySummary` | EssayProfile | Calibrated AO-summary of the essay; consumed by Brief (1.A) and coach | L3 Pass-3 |
| `entanglements` | EssayProfile.thematicArchitecture | Cross-thread relationships; can't be derived from any single lens | L3 Pass-3 |
| `emotionalTopography.arcTrajectory` | EssayProfile | The arc IS cross-paragraph by nature | L3 Pass-3 |
| `momentEarnednessMap.mechanisms` | EssayProfile | Cross-moment patterns; lens-orthogonal | L3 Pass-3 |
| `connectionGraphSummary` | EssayProfile | Whole-essay connection graph (per Phase 5 prereq) | L3 Pass-3 |

The 90% that dies naturally: voice signature blocks, theme list, narrative strategy fields, admissions positioning prose, character revelation lists, craft assessment growth edges, etc. — all of these are produced by the redesigned L3 lens reads (per `L3_PIPELINE_REDESIGN.md` sweep+lens architecture or its Option-5 successor).

**Risk if mis-classified**: a "90%-dies-naturally" field that turns out to be load-bearing → Phase 7 deletes it → quality regression. Mitigation: per-field consumer trace before Stage 2 implementation of Phase 7.

## 4. L3 Pass-3 absorber — prompt skeleton

The 10% lands in a single new Sonnet call (Pass 3 of the L3 lens architecture), after the lens deep-reads. Inherits all lens outputs.

Prompt skeleton (decision-useful, not implementation-ready):

```
You are the synthesis pass for an essay. Five lens reads have already
completed (Story, Meaning, Voice, Admissions, plus the sweep). Your
job is the cross-dimension fabric that NO single lens produces:

1. WRITER PORTRAIT — 250-400 words of synthesized prose answering
   "who is this writer?" Counselor-grade. Draws from all five lens
   outputs. Forbidden: generic positive framing ("strong voice,"
   "thoughtful reflection"). Required: specific moves, scenes,
   patterns this writer makes that another writer wouldn't.

2. TELLABILITY SUMMARY — AO-facing 60-100 word summary answering
   "what does an admissions officer remember 30 minutes after
   reading this?" One specific scene + one specific phrase + one
   takeaway. Calibrated against the AO First Read findings.

3. ENTANGLEMENTS — cross-thread relationships. For each thematic
   thread pair, name whether they reinforce, complicate, or
   tension each other. Cite the evidence (P#S#).

4. ARC TRAJECTORY — the emotional + intellectual arc as a single
   curve across paragraphs. ≤80 words prose + a structured
   arc-shape tag.

5. MOMENT EARNEDNESS MECHANISMS — the patterns by which moments
   become earned vs unearned in THIS essay. Not a per-moment list
   (that's the moment map); the meta-patterns.

6. CONNECTION GRAPH SUMMARY — top 5 most-connected nodes (themes,
   characters, motifs, moves) ranked by graph centrality + a
   one-sentence why-it-matters per node.

OUTPUT: strict JSON matching the schema. Each field's prose must
read like a counselor wrote it — specific, opinionated, grounded.
```

Estimated cost: ~$0.08-0.15 per call (input includes all lens outputs ~25-40K tokens; output ~2-3K tokens). Replaces L3.75 iter_0 ($0.53) + understanding_prose ($0.03) + delta_synthesis ($0.08) → net savings ~$0.50-0.55 per cold-start. That's the Phase 7 cost win.

## 5. Gap list — what Phase 7 has to resolve

Items where the spec and HEAD disagree, or where the spec is silent:

1. **L4 unified-cache + Phase 7 interaction**: L4_UNIFIED_CACHE is now default-on (per Stage 0.E). The L4 system prompts read certain L3.75 fields. After Phase 7, the cached prefix changes shape. Cache bust on rollout day acceptable; just flag it.

2. **L5 priorAnnotations carry-forward and L3.75 retirement**: priorAnnotations builder reads from iterationLedger (commit `9fa1e95`-era), which currently consumes some L3.75 outputs (`growthLog`?). Phase 7 has to verify the ledger schema doesn't depend on holisticSynthesis types.

3. **L3.5 contradictionFlags + L3.75 contradictions**: L3.5 producer for contradictionFlags is unbuilt today (per `IMPLEMENTATION_STATUS_MATRIX.md` Row 12). Phase 5 ships that producer. Phase 7 has to ensure the migration absorbs both contradiction surfaces, not just L3.75's.

4. **focusedAnalyzer warm-edit path**: hardcodes `evidence: ''` (per CURRENT_STATE Phase 8 deferred items). Phase 7's L3 Pass-3 may or may not be exercised in focused mode. Decision needed.

5. **The "dies naturally" 90% map**: spec asserts the lens reads reproduce everything. The mapping table that PROVES this (field-by-field, lens-by-lens) is not in any current doc. Phase 7 needs to author that mapping table before deletion.

## 6. Bridge deliverables (Stage 2 of THIS session)

Per D10 (review + absorption design draft, no code):

1. **Consumer-migration grep table** — run the §2 verification, fill in the table, surface drift.
2. **Field-survival mapping** — the table in §3 expanded to ALL holistic fields, not just the load-bearing 10%. Each field: dies-naturally (which lens produces it) OR absorbed (Pass-3) OR cut entirely (per OUTPUT_CUT_LIST.md bundled into Phase 7 anyway).
3. **Pass-3 prompt skeleton** — the §4 sketch hardened to be implementation-ready (input shape, output schema, calibration test, cost estimate).
4. **Gap list document** — §5 turned into a doc with proposed resolutions, each Tue-approvable.

## 7. Hand-off to Phase 7 (when it ships)

This bridge's output becomes Phase 7's day-1 starting state. Phase 7 PR:
1. Reads the consumer-migration grep table.
2. Reads the field-survival mapping.
3. Implements the Pass-3 prompt against the skeleton.
4. Migrates consumers per the table.
5. Resolves gaps per the gap list.
6. Deletes `holisticSynthesis.ts`.
7. Phase-7-specific regen confirms ($0.85 cold-start target).

## 8. Phase 7 risks (preview, not this session's concern)

- The 10%/90% split is an estimate; if it's actually 20%/80% the Pass-3 call grows and the cost savings shrink.
- writerPortrait quality could regress if Pass-3 prompt isn't carefully calibrated against L3.75's current output.
- Spec drift not caught in Stage 2 bridge becomes a production bug.

## 9. Open question for Tue (Stage 2 of this bridge)

When the bridge's deliverables (§6) are ready, present as:
- (a) One bundled bridge doc (single ~1500-line doc with all 4 deliverables).
- (b) Four separate docs.

Recommendation: (b) — easier to review and update incrementally. The four become Phase 7's PR description sections.
