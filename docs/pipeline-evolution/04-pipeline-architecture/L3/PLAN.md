# L3 — Sequential Deep Walk Redesign

> ⚠️ **SUPERSEDED 2026-05-10** — the Sweep + 4 parallel lens + Pass 3 architecture
> described below was abandoned. The replacement direction is the **Option 5
> essay-level walk** (see `analysis/essayLevelL3Walk.ts`, wired at
> `analysisOrchestrator.ts:85, 690` since commit `d3209c9`). The disposition of
> what L3.75 was producing is owned by
> [`../L3-75/FIELD_DISPOSITION_TABLE.md`](../L3-75/FIELD_DISPOSITION_TABLE.md):
> 17 fields move to a deterministic composition layer, 28 to lens-direct
> emission per the new L3 design, 4 to a small residue call. Read the
> disposition table for current architectural direction; this Sweep+Lens spec
> is preserved as historical context only.
>
> **Status**: `superseded` — Sweep+Lens architecture replaced by Option 5
> essay-level walk + composition layer.
> **Last updated**: 2026-05-10.

---

## Original spec (preserved as historical context)

> Sweep + 4 parallel lens deep reads + Pass 3 cross-dimension synthesis. Replaces today's monolithic L3 walk + L3.75 synthesis pair.
>
> **Status (historical)**: `draft` — design described in [`L3-75/L3_ABSORBS_L3_75.md`](../L3-75/L3_ABSORBS_L3_75.md); implementation specs (lens schemas, lens prompt skeletons, Pass 3 prompt) NOT YET DRAFTED here.
> **Owner**: Cost chat (provisional, through PR2).
> **Last updated (original)**: 2026-04-26.

---

## Why redesign

Current L3 (`sequentialDeepWalk.ts`, ~1,500 lines) walks paragraphs sequentially with mutating context, achieving 23% cache hit rate. The walk's `holisticEvolution` accumulator is too thin to support the 7+ holistic sections L3.75 needs to produce, forcing L3.75 to do first-pass synthesis on top of walk understanding — duplicated work, attention budget split, regression-prone iteration.

The redesign concentrates per-dimension depth (Story / Meaning / Voice / Admissions lenses, parallel) on top of a lighter Sweep pass. Each lens emits canonical holistic-profile fields directly. A small Pass 3 call produces the 4 genuinely cross-dimension fields. Result: cleaner architecture, better cache utilization, lower cost, no L3.75 layer needed.

## Architecture (locked, per L3.75 retirement plan)

### Pass 1 — Sweep (one Sonnet call)

**Inputs**: essay text + L1/L2/L2.5 outputs.
**Outputs**: sentence/paragraph understanding, connection graph, archetype name + confidence, phaseEstimate, lensDispatch scores (1–5 per lens with rationale).
**Cost target**: ~$0.10–$0.15.

### Pass 2 — Lens deep reads (2–4 parallel Sonnet calls)

Phase-gated cap of 4. Each lens reads sweep output + essay text + (optional) ExperienceProfile + (optional) research block.

| Lens | Emits |
|---|---|
| **Voice & Authenticity** | voiceIdentity (signature, primaryRegister, evolution, authenticVsPerformed, voiceMarkers, voiceWeaknesses, registerShifts), voiceMap (5 dims + stabilityRegions + shifts), craftAssessment.sentenceRhythmProse, craftAssessment.wordPatterns |
| **Meaning Architecture** | thematicArchitecture (centralThesis, thesisEvolution, threads, subtext, contradictions), craftAssessment.imageSystem, meaningGaps[] (consumed by L3.5), valueArchitecture |
| **Story & Narrative Drive** | narrativeStrategy (primaryStrategy with rationale merged, pivotPoints, turningPoint, pacingAnalysis, structuralChoices, arcType), craftAssessment.pacingShape, peakMoments, stakesLadder, emotionalTopography.peakMoments + emotionalProgression |
| **Admissions Impact** | admissionsPositioning (tellabilitySummary, distinctivenessFactors, institutionalFit, redFlags with required fix, memorability, aoTakeaway, archetypeContext.differentiator), characterSignals |

**Cost per lens**: ~$0.06–$0.10. Parallel run wall-time ~5s.

### Pass 3 — Cross-dimension synthesis (one Sonnet call, bounded)

**Inputs**: all lens outputs + sweep + essay text.
**Outputs (4 fields, no more)**:
1. `characterRevelation.writerPortrait` — lunch-with paragraph cross-pulling Voice + Meaning + Admissions
2. `entanglements[]` — locations where ≥2 lens observations converge meaningfully (cap 3, foundational/supporting only; subtle dropped)
3. `emotionalTopography.arcTrajectory` — prose binding Story arc + Voice tonal + Meaning stakes
4. `momentEarnednessMap.moments[].mechanisms[]` — backward-trace through connection graph + setups + stakes; density-not-booleans

Optional 5th: `connectionGraphSummary` (topology prose).

**Cost target**: ~$0.08. **Hard caps**: 3–4K output tokens, one call, no iteration. Anti-drift commitment.

## Discipline directives (every Pass 2 lens prompt)

Inherit from `L3-75/L3_75_REDESIGN__SUPERSEDED.md` §7 (the discipline still applies, just at lens level instead of L3.75 level):

- **Descriptive only.** No "weak", "strong", "effective", "would benefit from" vocabulary.
- **Citation required.** Every claim cites paragraph + sentence.
- **Inheritance discipline.** Lens emits its own dimension; never re-derives what Sweep already produced.
- **Cap discipline.** Each list-valued field has hard ceilings (threads ≤ 5, redFlags ≤ 4 with fix, distinctivenessFactors ≤ 5, etc).
- **No `blindSpots[]` emission anywhere.** redFlags is the canonical home (Decision A, 2026-04-25).

## Outstanding work to draft

Per yesterday's cohesion audit, these need to land before PR2:

- [ ] Lens prompt skeletons (4 lenses, production-draft) — `L3/LENS_PROMPT_TEMPLATES.md`
- [ ] Pass 3 prompt (production-draft) — `L3/PASS_3_PROMPT.md` or inline in this PLAN
- [ ] Lens output schemas (TypeScript types) — coordinate with implementation
- [ ] Sweep output schema (TypeScript type) — same
- [ ] Profile-write semantics: who writes which fields, atomicity strategy, schema validation
- [ ] Pass 3 dispatch behavior: waits on all lenses or fires on whichever ran (per dispatch deferral)

## Verification plan

Single-fixture (fixture 05). Success gates:
- Sweep output ≤ 3K tokens
- Each lens output ≤ 4K tokens
- Pass 3 output ≤ 4K tokens
- Total L3 cost ≤ $0.40/essay (vs current ~$0.50–0.70 L3 + L3.75 combined)
- Profile completeness check passes (every required field has a writer)
- Discipline gates: no forbidden vocabulary; every claim cited; no `blindSpots[]`

## Cross-layer integrations

- **Cost-recovery Phase B convergence prompt** validates the "iteration is theatre" claim that justifies deleting iter_1 here. Lands first.
- **Cost-recovery Phase D1** establishes cached-block pattern in `sequentialDeepWalk.ts`; lens prompts inherit the pattern.
- **02 Conversator** injects ExperienceProfile at lens user prompts (post-essay-text, pre-target-paragraph).
- **03 RAG** injects research blocks at lens user prompts; archetype context block at Sweep + Voice + Admissions specifically.
- **L3.5 extension** consumes lens outputs + Pass 3 + Sweep directly; no L3.75 intermediary.

## Cross-references

- Authoritative architecture: [`../L3-75/L3_ABSORBS_L3_75.md`](../L3-75/L3_ABSORBS_L3_75.md)
- Reference (superseded but reusable §3, §7, §11): [`../L3-75/L3_75_REDESIGN__SUPERSEDED.md`](../L3-75/L3_75_REDESIGN__SUPERSEDED.md)
- Master integration: [`../MASTER_INTEGRATION_PLAN.md`](../MASTER_INTEGRATION_PLAN.md)
- Conversator integration: [`../../02-conversator-ground-truth/CONVERSATOR_ANALYSIS_GROUND_TRUTH_DESIGN.md`](../../02-conversator-ground-truth/CONVERSATOR_ANALYSIS_GROUND_TRUTH_DESIGN.md)
- RAG integration: [`../../03-intelligent-rag/INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md`](../../03-intelligent-rag/INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md)
