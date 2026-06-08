# L3 Absorbs L3.75 — Architectural Pivot

> **Status**: `planned` — direction approved by Tue 2026-04-25. Implementation gated on hard preconditions (L3 redesign + 02/03 designs returning).
> **Authoritative replacement for**: [`L3_75_REDESIGN__SUPERSEDED.md`](./L3_75_REDESIGN__SUPERSEDED.md).
> **Workstream**: 01 Cost Recovery — Architecture track (medium-term, post-consolidated-changeset).
> **Last updated**: 2026-04-25.

---

## TL;DR

**Kill L3.75 as a distinct layer. Absorb its work into the redesigned L3.**

- ~90% of what L3.75 emits today (voice/theme/narrative/admissions dimension profiles) is what the new L3 lenses already produce. Lens outputs ARE the holistic profile fields. Inherit directly, don't re-synthesize.
- ~10% of L3.75's work is genuinely cross-dimension (writerPortrait, entanglements, emotionalTopography.arcTrajectory, momentEarnednessMap.mechanisms, connectionGraphSummary). That's one small Sonnet call after the lenses complete — call it **L3 Pass 3**, not L3.75.
- The rest of L3.75 (iter_1, Meta, Curation, Reread orchestration, UnderstandingProse) is regression, theater, or UI-layer drift. **Delete.**

**Net cost impact vs current L3.75**: -$0.47–0.62/essay direct; additional compounded savings downstream (smaller profile injected into L3.5/L4/L5/L6 prompts).

**Net architectural impact**: ~3K lines of code deleted (`holisticSynthesis.ts` + iteration orchestration + Meta + Curation + UnderstandingProse). Cleaner zero-overlap discipline: L3 produces understanding, L3.5 judges, L4 decides, L5 annotates, L6 coaches.

---

## Why this supersedes yesterday's L3.75 redesign

The 2026-04-23 redesign (`L3_75_REDESIGN__SUPERSEDED.md`) tried to make L3.75 lighter via inheritance discipline. The first-principles audit found that "inheritance discipline" applied honestly means "the lens output IS the field — just route it." Adding a layer to bind outputs to fields adds attention budget and cost without adding value.

The audit walked all five jobs L3.75 does today and asked "can the new L3 do this directly?":

| L3.75 job today | Verdict | Where it goes |
|---|---|---|
| Turn walk's per-paragraph understanding into essay-whole dimension profiles | **Lenses already do this.** | Lens emissions ARE the profile fields |
| Cross-dimension synthesis (4 fields: writerPortrait, entanglements, arcTrajectory, earnednessMap) | Genuinely cross-lens; needs one synthesis call | **L3 Pass 3** — bounded scope, one call |
| Validate cross-lens consistency (Meta) | Rare issue (5-10%); L3.5 essay-level judging catches it for free via score-divergence | **L3.5 absorbs** as `contradictionFlags[]` output |
| Refine via iter_1 / reread on lens disagreement | Cost-recovery proves uniform iteration is theater (62.5% firing rate is a regression, not a feature) | **Delete** — convergence-by-default is the norm |
| Writer-facing prose for EssayPortrait UI | Portrait can render from structured fields | **UI absorbs** — render voiceIdentity.signature + thematicArchitecture.centralThesis + writerPortrait + tellabilitySummary directly |

Once each row resolves, no layer remains.

---

## Pipeline shape after the pivot

```
L1 (optional, existing) — Haiku impressions
L2 (optional, existing) — structural cartography
L2.5 (optional, existing) — connection scout

L3 (redesigned, replaces L3 + L3.75):
  Pass 1 — Sweep (Sonnet, 1 call)
    sentenceUnderstanding, paragraph roles, connections, archetype, lensDispatch
  Pass 2 — Lens deep reads (Sonnet, 2-4 parallel calls per lensDispatch)
    Story / Meaning / Voice / Admissions
    Each lens emits its essay-whole dimension profile DIRECTLY into the
    holistic schema — no separate synthesis step.
  Pass 3 — Cross-dimension synthesis (Sonnet, 1 small call, ~3-4K output)
    writerPortrait, entanglements, emotionalTopography.arcTrajectory,
    momentEarnednessMap.mechanisms, connectionGraphSummary

→ L3.5 essay-level + per-paragraph judgment
   (additionally absorbs cross-lens contradiction detection)
→ L4 NorthStar / ScoreMatrix / Manifest
→ L5 annotations
→ L6 coaching
```

**No L3.75. No iter_1. No Meta. No Curation. No Reread orchestration. No UnderstandingProse.**

---

## Lens ownership of holistic-profile fields

Each lens, in addition to its dimension-organized observations, emits the canonical holistic-profile fields for its dimension. The lens output IS the profile field — no synthesis transformation between them.

### Voice lens emits
- `voiceIdentity.signature` (one-paragraph voice signature — distillation of dimensionalRegisters + distinctivePatterns)
- `voiceIdentity.primaryRegister` (compound 2-adjective)
- `voiceIdentity.evolution`
- `voiceIdentity.authenticVsPerformed[]`
- `voiceIdentity.voiceMarkers[]` (protective tics)
- `voiceIdentity.voiceWeaknesses[]` (risky tics)
- `voiceIdentity.registerShifts[]`
- `voiceMap.*` (5-dimension structure: register, vocabularyFingerprint, sentenceRhythm, perspectiveDistance, tonalDisposition; stabilityRegions; shifts with intentionality)
- Voice-specific craft prose: `craftAssessment.sentenceRhythmProse`, `craftAssessment.wordPatterns`

### Meaning lens emits
- `thematicArchitecture.centralThesis`
- `thematicArchitecture.thesisEvolution`
- `thematicArchitecture.threads[]` (paragraph-granular appearances)
- `thematicArchitecture.subtext`
- `thematicArchitecture.contradictions[]`
- Meaning-specific craft prose: `craftAssessment.imageSystem`
- Setup/payoff structure that feeds Pass 3 earnedness mapping
- `meaningGaps[]` (consumed by L3.5 essay-level for unearned-claim detection)

### Story lens emits
- `narrativeStrategy.primaryStrategy` (includes rationale; `strategyRationale` field deleted)
- `narrativeStrategy.pivotPoints[]`
- `narrativeStrategy.turningPoint`
- `narrativeStrategy.pacingAnalysis`
- `narrativeStrategy.structuralChoices[]`
- `narrativeStrategy.arcType`
- Story-specific craft prose: `craftAssessment.pacingShape`
- Peak moments + stakes ladder that feed Pass 3 earnedness mapping
- `emotionalTopography.peakMoments[]` and `emotionalTopography.emotionalProgression[]`

### Admissions lens emits
- `admissionsPositioning.tellabilitySummary`
- `admissionsPositioning.distinctivenessFactors[]`
- `admissionsPositioning.institutionalFit` (positive signals only)
- `admissionsPositioning.redFlags[]` (each entry MUST carry a `fix` field — entries without fix are dropped)
- `admissionsPositioning.memorability`
- `admissionsPositioning.aoTakeaway`
- `admissionsPositioning.archetypeContext.archetype` (from Sweep) + `differentiator` (from Admissions)
- Character signals (values, qualities) that feed Pass 3 writerPortrait

### Sweep emits (already in L3 redesign)
- Sentence/paragraph understanding
- Connection graph
- Archetype name + confidence
- Phase estimate
- Lens dispatch scores

### Cuts honored at lens-emission time

These fields are NEVER emitted (carry-through cuts from `OUTPUT_CUT_LIST.md`):
- `thematicArchitecture.thesisConfidence`
- `narrativeStrategy.arcMomentum`
- `narrativeStrategy.strategyRationale` (merged into `primaryStrategy`)
- `admissionsPositioning.portfolioPosition`
- `admissionsPositioning.archetypeContext.poolDensity`
- `characterRevelation.revealedQualities` (merged into `valuesRevealed`)
- `characterRevelation.intellectualFingerprint` (1-sentence merged into `writerPortrait`)
- `characterRevelation.blindSpots[]` — **CUT entirely** (Decision A, 2026-04-25). Today this field overlaps `admissionsPositioning.redFlags[]` by ~50% per fixture-05 audit. Two fields doing the same job is repetition without payoff. Under the pivot, `redFlags[]` is the single home for "what an AO would notice that the writer doesn't see," with the required `fix` field making each entry actionable. No blindSpots emission anywhere — not in lenses, not in Pass 3, not in L3.5. Consumer migration: `coachingService.ts:4016` (reads `characterRevelation.blindSpots`) re-routes to `admissionsPositioning.redFlags`.
- `thematicArchitecture.threads[].appearances[]` sentence granularity (paragraph-only)
- `craftAssessment.sentencePatterns` numeric distribution (rhythm prose carries the signal)
- `craftAssessment.strengthSignatures[]` — moves to **L3.5 essay-level**
- `craftAssessment.growthEdges[]` with `pairedImprovement` — moves to **L4b ImprovementManifest**

---

## L3 Pass 3 — Cross-dimension synthesis (the only remaining synthesis call)

**Scope**: produces ONLY the four cross-dimension fields the lenses cannot produce in isolation, plus optional connection topology prose.

**Inputs**: all 4 lens outputs (or however many ran per dispatch) + sweep + essay text.

**Outputs**:
1. `characterRevelation.writerPortrait` — lunch-with paragraph cross-pulling Voice (how she sounds) + Meaning (what she values) + Admissions (what an AO notices). One paragraph, specific, citable.
2. `entanglements[]` — locations where ≥2 lens observations converge meaningfully. Cap 3, foundational/supporting only (drop subtle).
3. `emotionalTopography.arcTrajectory` — prose binding Story arc + Voice tonal + Meaning stakes into one emotional-arc narrative.
4. `momentEarnednessMap.moments[].mechanisms[]` — backward-traces each peak moment through the connection graph + setup-payoff map + stakes ladder. Density-not-booleans diagnosis.
5. `connectionGraphSummary` (optional) — topology prose (hub-and-spoke / web / linear chain), hubs, broken chains.

**Schema cap**: 3-4K output tokens, one call, ~$0.08, no iteration.

**Hard rule** (preserved from `L3_75_REDESIGN__SUPERSEDED.md` §7.1 discipline): descriptive only, no judgment vocabulary. Inheritance discipline: every Pass 3 field traces to named lens outputs in its inputs. If a field cannot be produced from lens inputs, that's a lens gap — fix the lens prompt, do NOT let Pass 3 re-read the essay to fill in.

**Anti-drift commitment**: **Pass 3 stays one call, four fields, no iteration. Forever.** If the urge arises to add Meta or Curation or iteration, that is rebuilding the layer we deleted. Document this in the spec; escalate to Tue if proposed.

---

## What L3.5 absorbs

### Cross-lens contradiction detection
Today, L3.75 Meta validates synthesis against lens outputs. Under the pivot, L3.5 sees all lens outputs as context anyway — its scoring pass naturally exposes lens disagreements when scores diverge from understanding. Add an output field:

```typescript
interface AnalysisPassOutput {
  // ... existing scoring fields ...
  contradictionFlags: Array<{
    lens1: 'voice' | 'meaning' | 'story' | 'admissions';
    lens2: 'voice' | 'meaning' | 'story' | 'admissions';
    location: ParagraphLocation;
    claim: string;
    evidence: string;
  }>;
}
```

L4 reads `contradictionFlags[]` to surface in coaching or to demote affected dimensions in the score matrix. Cost: zero additional call. Quality: arguably better than Meta — L3.5 has numerical discipline that catches inconsistency Meta's qualitative check misses.

### Essay-level strengthSignatures
Migrates from `craftAssessment.strengthSignatures` (L3.75) to a new `AnalysisPassOutput.essayStrengthSignatures[]`. L3.5 already does paragraph-level strength assessment; essay-level extension is natural.

---

## What L4b absorbs

### `pairedImprovement` ownership
The technique + directive + architectural reason + demonstration sketch payload migrates from `craftAssessment.growthEdges[].pairedImprovement` (L3.75) to L4b ImprovementManifest. L4b already owns technique vocabulary + prioritization; pairing the improvement with the manifest entry is a natural fit.

---

## What gets deleted (the kill list)

When this pivot lands, the following code goes away:

### Files to delete entirely
- `src/services/essayIntelligence/analysis/holisticSynthesis.ts` (~2,500 lines)

### Functions/sections to delete from existing files
- `analysisOrchestrator.ts` — Phase 3 L3.75 growth cycle (~200 lines around line 503-569 + 1097, 1361)
- `holisticMutator.ts` — applyFullSupersession + iteration delta application (~150 lines)
- `editUnderstandingService.ts` — analysisMode field already deleted by Phase E1 of consolidated changeset
- `runningUnderstandingManager.ts` — emotionalArc already deleted by Phase E2

### Schema fields to delete (with consumer migrations)
See "Cuts honored at lens-emission time" above. Each deletion lands with a 1-line consumer change:
- `analysisPass.ts:942` drops `thesisConfidence` read
- `analysisPass.ts:957` + `deepAnnotationService.ts:1119` rename `craftAssessment.sentencePatterns` → distributed lens-owned prose fields
- `deepAnnotationService.ts:1129` reads `aoTakeaway` instead of `portfolioPosition`
- `coachingService.ts:2807` reads `archetypeContext.differentiator` instead of `poolDensity`
- `readinessScoring.ts:74,153` replaces `thesisConfidence` gate with `centralThesis presence + threads.length >= 3`
- `diffEngine.ts:115` replaces `thesisConfidence` delta with `centralThesis` string-diff + `primaryStrategy` string-diff

### Telemetry to delete
- `corpusTelemetryPersistence` calls from L3.75 (corpus-retrieval gates flip to lenses directly via the RAG architecture)
- Convergence telemetry (Phase A2) repurposes from L3.75 iteration to L3-Pass-3 single-call cost — schema simplifies

---

## Risks and honest mitigations

### Risk 1: Lens prompts balloon to absorb L3.75's responsibilities
If Voice lens must now emit voiceIdentity.signature prose AND dimensionalRegisters AND shifts AND authenticity signals, prompt size grows.

**Mitigation**: each lens still focuses on ONE dimension. voiceIdentity.signature is a natural distillation the lens already has the material for — it's not a new task, it's naming what the lens already saw. Cap lens output ~3-4K tokens; the lens-per-dimension focus keeps attention budget clean. If a lens overruns, the fix is splitting (two voice lens calls — one for spatial dimensionalRegisters, one for narrative voiceIdentity), not collapsing back to L3.75.

### Risk 2: Pass 3 grows into L3.75 by accident
If Pass 3 absorbs more responsibilities over time (5 fields, 6 fields, "we should add a meta call to validate"), we've rebuilt L3.75 under a new name.

**Mitigation**: hard-coded scope in spec — 4 fields, 1 call, no iteration. Any proposal to extend Pass 3 must be reviewed against this doc's anti-drift commitment. If genuinely needed, the answer is making a lens richer, not making Pass 3 a layer.

### Risk 3: Cross-lens contradictions ship silently to L3.5
Real risk if L3.5 doesn't actively detect contradictions.

**Mitigation**: `contradictionFlags[]` output field on AnalysisPassOutput is explicit. L3.5 system prompt instructs it to scan lens outputs for cross-dimension conflicts and emit flags. L4 reads flags and either resolves in score reasoning or surfaces in coaching. Quality is at least as good as today's Meta call (which mostly returns converged=true anyway).

### Risk 4: Lens underperformance on a specific essay propagates without iteration safety net
A bad lens read on an unusual essay reaches L3.5 directly with no L3.75 validation pass.

**Mitigation**:
- L3.5's contradictionFlags catches inter-lens issues.
- Phase-aware lens dispatch in Sweep can run more lenses on unusual essays (e.g. ambiguous-voice essays trigger an extra Voice deep-read with different prompt focus rather than iterating L3.75).
- Prevention > cure: invest in lens prompt quality, not in a downstream validation layer that catches lens failures after they've shipped.

### Risk 5: Lens duplication of essay reads
Each lens reads the essay independently — 4 lens calls + sweep call all read the essay text. Some duplicate work vs today's walk-then-synthesize architecture.

**Mitigation**: this is a cost the L3 redesign already accepted (lens approach trades duplicated read for concentrated dimension depth — quality ceiling rationale). NOT a new cost from killing L3.75. Mitigated further by essay-text shared cache block (Tier 5.3 in cost-recovery backlog) — essay text becomes a single cache write, all lens calls cache-read it at 10× cheaper.

### Risk 6: Migration disruption (consumer renames)
~6 consumer-side line changes across analysisPass / coaching / deepAnnotation / readinessScoring / diffEngine.

**Mitigation**: each is a 1-line change. Land all in the same PR as the L3 redesign. Coordinated migration is cheaper than the layer it deletes.

### Risk 7: This pivot conflicts with chats 02 (Conversator) and 03 (RAG)
Both chats had assumed L3.75 as a stable injection point or context surface.

**Mitigation**: see [HANDOFFS.md H7](../shared/HANDOFFS.md). The pivot SIMPLIFIES injection surfaces — lens prompts are cleaner injection points than a multi-phase synthesis layer. ExperienceProfile (02) and research blocks (03) inject into lens user prompts directly via the cached-blocks contract. No worse than today, arguably better.

---

## Cost model

### Today (current architecture, before consolidated changeset lands)
- L3.75 total: $0.55–0.70/essay average

### After consolidated changeset lands (Phases A-E in PLAN.md, preserves L3.75)
- L3.75 total: ~$0.30–0.40/essay (iter_1 fix + Phase B output cuts + cache markers)

### After this pivot lands (kills L3.75, absorbs into L3)
- L3.75 calls: $0 (layer deleted)
- L3 lens emissions: lenses emit profile fields directly — no incremental cost beyond what the L3 redesign already pays
- L3 Pass 3 cross-dimension synthesis: ~$0.08/essay (1 small Sonnet call)
- L3.5 contradictionFlags: ~$0 (output schema addition; no new call)
- UnderstandingProse: $0 (UI renders from fields)

**Net L3.75 → L3-absorption savings vs today**: ~$0.47–0.62/essay direct.

**Compounded downstream savings**: L3.5/L4/L5/L6 prompts inject the holistic profile as context. With the layer deleted and field cuts honored, that profile is ~25–35% smaller. L4's three calls each read it (~$0.04–0.06 saved per call × 3 = $0.12–0.18 on L4 alone). Plus L5 (10 paragraph calls reading sharedContext) and L6 read savings.

**Total pipeline impact of this pivot**: ~$0.62–0.85/essay saved beyond what the consolidated changeset recovers.

---

## Sequencing — when this pivot lands

This is **NOT** part of the immediate consolidated changeset (Phases A-E in [`../PLAN.md`](../PLAN.md)). The changeset operates on the current architecture and ships first.

**Required preconditions before this pivot can ship**:
1. ✅ Consolidated changeset lands and verifies (Phase B convergence fix, Phase C output cuts, Phase D cache stabilization).
2. ⬜ L3 redesign lands (lenses + sweep schemas exist in code).
3. ⬜ Conversator (02) and RAG (03) design docs land — confirms ExperienceProfile and research block injection points compatible with lens-direct injection.
4. ⬜ Tue approves architectural pivot.

**Once those land, the pivot is one PR**:
- Add Pass 3 spec + lens emission of profile fields.
- Add `contradictionFlags[]` to L3.5 output.
- Migrate ~6 consumer reads.
- Delete `holisticSynthesis.ts` + iteration orchestration + Meta + Curation + UnderstandingProse.
- Delete deprecated profile fields per cuts list.
- Update consumer renames in same commit.
- Single 3-fixture verification run.

**Rollback strategy**: tagged commit before the delete; if verification fails on quality gates, revert is one `git reset`. The lens emissions are additive (lenses already produce dimension-organized observations; "emit the holistic field" is a prompt extension, not a structural change), so rollback risk is bounded.

---

## Cross-layer integration check

Inherited verbatim from `L3_75_REDESIGN__SUPERSEDED.md` §10 — every consumer's reads remain satisfied:

- **L3.5** reads voiceIdentity / emotionalTopography / thematicArchitecture / narrativeStrategy / characterRevelation / craftAssessment / admissionsPositioning fields → all emitted by lenses + Pass 3.
- **L4 NorthStar / ScoreMatrix / Manifest** reads full holistic profile → composed of lens emissions + Pass 3.
- **L5 deepAnnotationService** reads the profile field-by-field for per-paragraph annotation context → all fields exist.
- **L6 coachingService** reads coaching vectors per dimension → all emitted.
- **EssayPortrait UI** renders writerPortrait (Pass 3) + tellabilitySummary (Admissions lens) + centralThesis (Meaning lens) + voiceIdentity.signature (Voice lens). No prose call needed.

The consumer-rename list (analysisPass:942, :957; deepAnnotationService:1119, :1129; coachingService:2807; readinessScoring:74,153; diffEngine:115) is the full migration surface.

---

## What still has value from the superseded redesign

Yesterday's `L3_75_REDESIGN__SUPERSEDED.md` is preserved in this directory as reference. Specific reusable pieces:

1. **§3 Inheritance map** — directly reusable as the lens-emits-profile-field mapping. Each row maps "which lens output produces which holistic field" — under the pivot, that becomes "lens emits this field, no synthesis transformation".
2. **§7 Discipline directives** — descriptive-only language rules, forbidden vocabulary, citation requirements, cap discipline — reapply verbatim to lens prompts AND to Pass 3 prompt.
3. **§11 Fixture-05 stress test** — the expected outputs (centralThesis, tellabilitySummary, writerPortrait shapes) demonstrate what lens + Pass 3 emissions should look like at $500/hr quality.
4. **§12 Failure mode audit** — risks like "generic tellabilitySummary", "evaluation contamination", "redFlags without fix" still apply at the lens emission level. Mitigations move from L3.75 parse-time to lens parse-time.

---

## Locked decisions (no Tue input needed — confidence HIGH)

These are settled in the plan. Decisions where the audit found one clearly correct answer and no remaining ambiguity. Logged here for traceability — if any prove wrong in implementation, supersede the entry with reasoning.

1. **Pass 3 is a separate post-lens synthesis step, NOT a 5th lens.** Pass 3 has a structural dependency on lens outputs as inputs and runs only after the parallel lens batch completes. Calling it a parallel lens pretends the dependency doesn't exist. Confidence: HIGH.

2. **Sweep stays minimal — no holistic-section emissions from Sweep.** Sweep emits archetype + connection graph + lensDispatch + sentence/paragraph understanding. `connectionGraphSummary` topology prose belongs in Pass 3 because it benefits from full lens context. Confidence: HIGH.

3. **Lenses emit findings directly to `findingStore`. No L3.75 finding-promotion step.** Today's L3.75 promotes walk findings; under the pivot, lens prompts already produce `raisesQuestions`/`coachingValue`/`maturity` and write directly via `findingStore.add()`. Pass 3 does not own findings. Confidence: HIGH.

4. **Architectural pivot is a FOLLOW-UP PR, not part of the cost-recovery changeset.** Cost-recovery ships first under current architecture (single PR, single verification run). Pivot ships after its hard preconditions land (L3 redesign, 02/03 designs). Two separate PRs, two separate verification runs. Confidence: HIGH.

5. **L3.5 absorbs cross-lens contradiction detection via `contradictionFlags[]` output field.** No new call — schema addition to existing `AnalysisPassOutput`. L3.5 already sees all lens outputs as scoring context; numerical discipline catches inconsistency that qualitative Meta missed. Confidence: HIGH on structural correctness; calibration empirical post-launch.

6. **`strengthSignatures[]` migrates to L3.5 essay-level output.** Strength is judgment; L3.75 was supposed to be descriptive (it isn't, today). L3.5 is judgment by definition. Adding essay-level signatures to L3.5's existing paragraph-level work is a natural extension. Confidence: HIGH on the migration; calibration empirical.

7. **`pairedImprovement` payload migrates to L4b ImprovementManifest.** L4b already owns technique vocabulary + prioritization. Pairing the fix with the manifest entry at L4b means one prompt sees both "what to fix" and "in what order" — better coherence than two prompts agreeing. Roughly cost-neutral on the swap. Confidence: HIGH.

8. **UnderstandingProse call deleted; EssayPortrait UI renders from structured fields.** Portrait composes: voiceIdentity.signature + thematicArchitecture.centralThesis + writerPortrait (Pass 3) + tellabilitySummary + narrativeStrategy.primaryStrategy with light glue in React. Field-direct rendering is honest signal — if the fields are weak, the portrait should reflect that, not be papered over. Confidence: HIGH.

9. **`craftAssessment` becomes an aggregated profile struct populated from lens emissions, not its own synthesis.** Voice contributes sentenceRhythmProse + wordPatterns; Meaning contributes imageSystem; Story contributes pacingShape. Profile-write code merges them into a single `craftAssessment` field for consumer convenience — no synthesis call. Consumers see one struct; data comes from three lens sources. Confidence: HIGH.

10. **Voice lens stays as ONE call; if attention overruns at 3-4K output, split is the documented fallback.** Don't preemptively split — adds cost without proven need. Cap each section in the prompt (voiceIdentity ~800t, voiceMap ~1.5K, craft prose ~600, signals/markers ~500). If post-launch telemetry shows quality degradation, split into spatial-only + narrative-distillation calls (~$0.06 → $0.12 voice cost). Confidence: HIGH on the start-single rule; MEDIUM on whether split becomes necessary (handled empirically).

11. **All cut fields land in the pivot PR, not deferred.** Because the pivot PR already touches all consumers via the L3.75 deletion migration, deferred cuts (`thesisConfidence`, `arcMomentum`, `revealedQualities`, `intellectualFingerprint`, `portfolioPosition`) land here too. Their consumer migrations (analysisPass:942 thesisConfidence drop, readinessScoring:74 substitution, diffEngine:115 string-diff swap, deepAnnotationService:1129 portfolioPosition→aoTakeaway, coachingService:2807 poolDensity→differentiator) all land in the same commit. Confidence: HIGH that consolidation is correct; MEDIUM on coordinated-migration execution risk (mechanical, ~25 files).

12. **Anti-drift on Pass 3 enforced via spec, not via code.** The plan documents "4 fields, 1 call, no iteration, forever." Any future proposal to extend Pass 3 must answer "why isn't this a richer lens prompt instead?" before it lands. Discipline commitment, not structural guarantee — but explicit and reviewable. Confidence: HIGH on the principle; enforcement depends on review discipline.

13. **Telemetry-driven course-correction protocol.** If post-pivot telemetry shows: contradictionFlags rate <5% or >30%, OR strengthSignatures count outside 4–10 range, OR portrait UX regression signal — that's the trigger for prompt re-tuning, not for re-introducing L3.75. The architecture stays; the prompts adapt. Confidence: HIGH on the protocol.

14. **Rollback strategy: tagged commit before the delete.** If verification fails on quality gates, `git reset` to the tag is the rollback. Lens emissions are additive (lenses already produce dimension-organized observations; "emit the holistic field" is a prompt extension, not a structural change), so rollback risk is bounded. Confidence: HIGH.

---

## Open decisions (Tue input required)

**None remaining as of 2026-04-25.** Both prior open decisions resolved:

### Decision A — `blindSpots[]` ownership → **RESOLVED 2026-04-25: CUT entirely**

**Decision**: `characterRevelation.blindSpots[]` deleted from the schema. Not emitted by any lens, Pass 3, or L3.5. `admissionsPositioning.redFlags[]` is the single canonical home for "what an AO would notice that the writer doesn't see," with the required `fix` field making each entry actionable.

**Tue's reasoning (2026-04-25)**: blindSpots adds an extra layer of complexity for not much value or worth in return. More risk it might negatively affect the system by stretching its thinking unnecessarily. We already have ~50% overlap with redFlags — let's just make redFlags effective and cover what we need without two separate parts doing the same job.

**Migration impact**:
- Lens prompts: no `blindSpots` emission. Voice lens does NOT emit `voiceWeaknesses → blindSpots` cross-pull. Meaning lens does NOT emit subtle-tensions-as-blindSpots. Admissions lens emits `redFlags[]` only.
- L3.5: no `blindSpots[]` field added.
- Pass 3: never carried this field.
- Consumer: `coachingService.ts:4016` re-routes from `characterRevelation.blindSpots` to `admissionsPositioning.redFlags`.
- `OUTPUT_CUT_LIST.md`'s "blindSpots ↔ redFlags 50% overlap" finding is structurally resolved.

**Confidence**: HIGH. Cleanest possible resolution — eliminates redundancy entirely, reduces lens prompt scope, simplifies L3.5 responsibilities, removes a field that was unclear about its job (judgment? description? cross-lens?). Single source of truth wins.

### Decision B — Architectural pivot approval in principle → **APPROVED 2026-04-25**

**Decision**: pivot direction approved. Plan status moves from `draft` to `planned`. The pivot will execute when its hard preconditions land (L3 redesign + 02/03 designs return + cost-recovery changeset verifies).

**Tue's reasoning (2026-04-25)**: L3.75 deletion doesn't seem necessary as a layer. The deletion plan covers how to retain L3.75's main value while making the system more efficient, effective, and simple — organized, efficient, and optimal.

**Effect**:
- Workstreams 02 (Conversator) and 03 (RAG) MUST design around lens-direct injection, not L3.75 surfaces. Handoff H7 transitions from "open" to "ack required" — both chats need to confirm compatibility.
- L3 redesign MUST produce lenses that emit canonical profile fields directly (not just dimension-organized observations).
- Cost-recovery changeset still ships first under current architecture (preserves L3.75 short-term). Pivot follows.
- Approval is "direction-locked," not "implementation-locked." Specific lens schemas, Pass 3 prompt details, and consumer migrations finalize when L3 redesign + 02/03 designs return.

**Confidence**: HIGH on direction. MEDIUM on timing (depends on when L3 redesign and 02/03 docs land). Implementation-detail risk handled via the telemetry course-correction protocol (locked decision #13).

---

## Closing self-check

The same bars yesterday's redesign claimed to meet:
- **Architectural rigor** ✅ — zero-overlap is cleaner than ever (L3 = understanding, L3.5 = judgment, L4 = strategy, L5 = annotation, L6 = coaching). No L3.75 to muddy the boundary.
- **Depth** ✅ — lens prompts get the full discipline directives + cap discipline + descriptive-only language from §7 of the superseded doc. Pass 3 inherits the same.
- **Cost savings** ✅ — $0.62–0.85/essay vs ~$0.44 in the superseded plan. Bigger because the layer is gone.
- **Quality lift** ✅ — lens-direct emission is more deterministic than synthesis. Pass 3 is bounded scope. L3.5 contradictionFlags is a real validation step, not theater.
- **Gap list** ✅ — 5 open decisions above; all are scoped questions, not architectural unknowns.
- **Integration checks** ✅ — every consumer read mapped to a lens or Pass 3 emission.

The architecture is sound. The gaps are implementation-level and sequence-dependent on L3 redesign + 02/03 docs. **Ready for Tue's review and for downstream chat coordination.**
