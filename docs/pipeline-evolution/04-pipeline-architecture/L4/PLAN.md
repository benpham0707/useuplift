# L4 — Crystallizer (NorthStar + ScoreMatrix + Manifest) Extension

> L4's NorthStar concept already designed (see `ESSAY_NORTH_STAR_DESIGN.md`). Under the integrated iteration L4b absorbs `pairedImprovement` payload migrated from L3.75 craftAssessment.growthEdges. NOT a full redesign — L4's three-call architecture stays.
>
> **Status**: `draft` — NorthStar concept stable; L4b extension pending.
> **Owner**: Cost chat through PR4 (long-term L4 ownership: 03 RAG per `FILE_OWNERSHIP.md`).
> **Last updated**: 2026-04-26.

## L4 today

Three calls in `crystallizer.ts`:
- **L4a-NorthStar**: architecture-of-meaning crystallization (5 conceptual dimensions per `ESSAY_NORTH_STAR_DESIGN.md`).
- **L4a-ScoreMatrix**: rubric scoring with corpus anchoring.
- **L4b-Manifest**: improvement priorities.

All three are massively input-dominated (~36–42K tokens each). Cost-recovery Tier 5.1 (deferred) targets shared-cache restructure.

## What changes under the integrated iteration

### L4b absorbs `pairedImprovement` payload

Today: `craftAssessment.growthEdges[].pairedImprovement` is emitted by L3.75 (technique + directive + architectural reason + demonstration sketch + expected impact). L4b reads it and re-orders by priority.

Under the pivot: L3.75 deleted; L4b emits `pairedImprovement` directly because:
- L4b already owns technique vocabulary (`TECHNIQUE_VOCABULARY` from `techniqueVocabulary.ts`).
- L4b already owns prioritization.
- One prompt seeing both "what to fix" AND "in what order" beats two prompts agreeing.

**Schema change**: `ImprovementManifestEntry` gains `pairedImprovement: { technique, directive, architecturalReason, demonstrationSketch, expectedImpact }` directly on the entry (instead of receiving it from upstream).

**Prompt change**: L4b prompt extended with TECHNIQUE_VOCABULARY block + "for every priority entry, generate the pairedImprovement payload" directive. Output cap raised by ~2–3K tokens.

**Cost impact**: +$0.03–$0.05 on L4b output; offset by –$0.04 on L3.75 craftAssessment shrink. Roughly neutral.

### NorthStar prompt update against new profile shape

NorthStar reads the holistic profile as context. Post-pivot, profile fields come from lens emissions + Pass 3 instead of L3.75 synthesis. Field names mostly identical, but cuts apply:

- `thesisConfidence` removed
- `arcMomentum` removed
- `intellectualFingerprint` removed (line in writerPortrait instead)
- `revealedQualities` merged into `valuesRevealed`
- `portfolioPosition` removed
- `archetypeContext.poolDensity` removed
- `craftAssessment.sentencePatterns` numeric → renamed to `sentenceRhythmProse`
- `blindSpots` cut

NorthStar prompt grep + remove these reads. Substitute signals where needed (already documented in pivot doc consumer-migration list).

### ScoreMatrix — minor rework

ScoreMatrix scores rubric dimensions against the profile. Same field-rename migrations as NorthStar. Per `INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md`, ScoreMatrix already pulls corpus anchors via `craftMoves` and `antiArchetypes` retrieval at L3.5 stage; no new RAG work at L4.

## Open question — L4 caching restructure (deferred)

Cost-recovery Tier 5.1 proposes moving 80% of L4's repeated profile+synthesis context into a cached system block. Three calls share ~80% of input; one cache write + two cheap reads saves $0.20–0.25/essay.

This is L4-track work, NOT L3.75-pivot work. Deferred until after PR4 lands. Per `FILE_OWNERSHIP.md`, RAG owns final L4 shape long-term — so the caching restructure should coordinate with RAG architecture.

## Verification plan

Single-fixture (fixture 05). Success gates:
- L4b emits `pairedImprovement` per manifest entry.
- NorthStar runs without reads of cut fields.
- ScoreMatrix unchanged.
- Total L4 cost neutral or below baseline.

## Sequencing

PR4 — lands after PR3 (L3.5 extension). Can prompt-draft in parallel.

## Cross-references

- NorthStar concept: [`./ESSAY_NORTH_STAR_DESIGN.md`](./ESSAY_NORTH_STAR_DESIGN.md)
- Master plan: [`../MASTER_INTEGRATION_PLAN.md`](../MASTER_INTEGRATION_PLAN.md)
- Upstream: [`../L3-5/PLAN.md`](../L3-5/PLAN.md)
- Downstream: [`../L5/L5_REDESIGN_INDEX.md`](../L5/L5_REDESIGN_INDEX.md)
- RAG integration: [`../../03-intelligent-rag/INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md`](../../03-intelligent-rag/INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md)
