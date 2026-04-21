# Wave-3a Corpus Knowledge Substrate — Manifest

**Version**: 3a.1.0 (Hopkins-integrated + Architecture-C rescoring)
**Last modified**: 2026-04-20
**Source-of-truth**: `tests/calibration/top-tier-reference/reviews/*-review-v2.md`
**Methodology**: v2.1 (sentence-level granularity, transferability load-test)
**Architecture**: C — hand-curated structure + derived correlations + RAG retrieval (Phase 2 pending)

## Final counts (post-Hopkins integration)

| Artifact | Count | Change |
|---|---|---|
| Craft moves (consolidated, deduplicated) | **190** | +54 (Hopkins integration) |
| Move excerpts (atomized for few-shot retrieval) | **53** | unchanged (Wave-3b backfill candidate) |
| Essay archetypes | **14** (all fully attested) | +4 Hopkins hydrated |
| Move hard-dependencies (Tier 1 gates) | **12** | slimmed from 26 (Architecture C) |
| **Derived correlations (NEW — auto-generated)** | **1,177** | strong=321, suggested=856 |
| **Per-move retrieval index (NEW)** | **190 moves indexed** | zero-cost retrieval |
| Voice × archetype compatibility cells | **98** (7 voices × 14 archetypes — full coverage) | Hopkins cells now attested, PROVISIONAL labels largely removed |
| Deliberate absences | **16** | unchanged |
| Anti-archetypes | **11** | unchanged |
| Contextual-validity patterns | **21** | unchanged |
| Reader-bias guards | **14** | +4 Hopkins-sourced |
| School-fit vectors | **15** (2 directly attested: Harvard, Hopkins; 13 inferred) | unchanged |
| Corpus limits ("cannot teach when...") | **18** | unchanged |

## Provenance breakdown

### Fully attested (v2.1 reviews exist)
- 10 Harvard 2028 essays (essays 05-14)
- All move catalog entries cite specific essay + paragraph + excerpt
- All fully-attested archetype recipes derived from sentence-level reviews

### Reserved (pending parallel-track Hopkins reviews)
- 4 archetype slots: `splash-of-color-small-risk-growth`, `building-a-universe-interdisciplinary-obsession`, `korean-sticky-notes-cultural-reclamation`, `ordering-the-disorderly-intellectual-metaphor`
- Stable IDs already locked so downstream code can reference them
- `provenance: 'pending-hopkins-reviews'`
- Voice×archetype compatibility for these slots is conservative (`risky` or `reachable`, never `native`) — will be re-tightened when Hopkins reviews land
- Hopkins reviews will land at `tests/calibration/top-tier-reference/reviews/01-emily-*-v2.md` … `04-ellie-*-v2.md`

### Directly attested school-fit
- Harvard (10 admit-claimed essays in v2.1 reviews)
- Johns Hopkins (4 admit-claimed essays — reviews pending)

### Inferred school-fit (from cross-school analysis in attested reviews)
- Stanford, Yale, Princeton, MIT, Caltech, UChicago, Brown, Columbia, Penn, Cornell, Dartmouth, Duke, Northwestern
- Each marked honestly with `corpusEvidence: "Inferred from cross-school-fit analysis... Not directly attested by admit data."`

## Integrity gates (all passing)

```
npx tsx tests/corpus/test-corpus-integrity.ts
npx tsc --noEmit
```

Both clean. Specific checks:

1. ✅ Every moveId reference resolves
2. ✅ Every essayId is real
3. ✅ moveDependencies DAG is acyclic
4. ✅ Fully-attested archetypes have non-empty load-bearing arrays
5. ⚠ 85 of 136 moves lack an excerpt (warning — Wave-3b backfill candidate)
6. ✅ No move has empty sourceEssays
7. ✅ Voice × archetype matrix covers all 98 cells
8. ✅ Contextual-validity exemplars resolve
9. ✅ Reserved Hopkins archetypes are consistent
10. ✅ SchoolFitVector archetypeAffinities resolve
11. ✅ Reader-bias guards target at least one pipeline layer
12. ✅ Manifest counts match actual data sizes

## Source-of-truth pointers

| Artifact | Location |
|---|---|
| Essay text | `tests/calibration/top-tier-reference/essays/` |
| v2.1 reviews | `tests/calibration/top-tier-reference/reviews/` |
| Methodology | `tests/calibration/top-tier-reference/reviews/METHODOLOGY.md` |
| Provenance | `tests/calibration/top-tier-reference/PROVENANCE.md` |
| Working extraction notes | `docs/wave-3a/CORPUS_EXTRACTION_WORKSHEET.md` |

## Inference-vs-attestation honesty notes

1. **Hopkins archetype recipes are placeholders.** The four Hopkins archetype IDs are reserved with `provenance: 'pending-hopkins-reviews'` and empty `loadBearingMoveIds`/`structuralStages` arrays. The integrity test allows reserved archetypes to have empty arrays specifically; once Hopkins reviews land, the test will re-tighten.

2. **Voice×archetype compatibility for Hopkins-reserved archetypes is conservative.** All cells for the 4 reserved archetypes are rated `risky` or `reachable`, never `native`, until Hopkins reviews establish actual fit signals.

3. **School-fit for non-Harvard/non-Hopkins schools is inferred.** Each non-attested school's vector carries `corpusEvidence: "Inferred from cross-school-fit analysis... Not directly attested by admit data."` Inferences are derived from Part V of attested Harvard reviews where each review evaluates how the essay would fare elsewhere.

4. **Excerpts are partial coverage.** 53 excerpts cover the load-bearing moves and provide at least one excerpt for each major archetype's central craft moves. The remaining 83 moves can be exemplified directly from their `sourceEssays` field; richer atomized excerpts are a Wave-3b enrichment task.

5. **Dependency DAG is conservative.** 26 explicit dependency relations are encoded — only those derivable from explicit review observations (Sarika's metaphor architecture cluster, Marcus's extended-metaphor architecture, Michael's identity-distinction → mirror-gap closing). Many additional implicit dependencies could be added; over-encoding risks invented relationships.

## How downstream consumers should import

```typescript
import {
  TOP_TIER_CRAFT_MOVES,
  ESSAY_ARCHETYPES,
  VOICE_ARCHETYPE_COMPATIBILITY,
  CORPUS_LIMITS,
  READER_BIAS_GUARDS,
  CORPUS_MANIFEST,
} from '@/services/essayIntelligence/corpus';
```

The barrel re-exports all data files and types. Naming is intentionally distinct from the sibling `archetypes/archetypeTypes.ts` module (Round 7c categorical archetypes); see comment in `corpusTypes.ts` for the rationale.

## Wave-3b entry points

Pipeline integration tasks unblocked by this substrate:

- **L3 (Understanding pass)** — `selective-childhood-voice-bleed`, `verb-possession-of-specialized-register`, `extended-metaphor-priming` are detection candidates
- **L3.5 (Analysis pass)** — anchor examples drawn from `MOVE_EXCERPTS` with `anchorLevel ≥ 9`
- **L3.75 (Holistic synthesis)** — `bait-and-switch architecture detection`, `metaphor-literalization detection`, `compression-density evaluation`
- **L4 (Crystallization)** — `ESSAY_ARCHETYPES` recipes for archetype-distance scoring
- **L5 (Feedback)** — `ANTI_ARCHETYPES` for failure-pattern coaching with corpus-alternative redirects
- **L6 (Conversation)** — `READER_BIAS_GUARDS` injected as corrective instructions; `CORPUS_LIMITS` consulted before suggesting moves to students whose drafts exhibit limiting conditions
