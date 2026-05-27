# Corpus Wiring Design (8 Dormant Types into L5)

> **Stage 1.H** of [`CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md`](../../00-index/CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md).
> **Source finding**: `L5_FEEDBACK_REDESIGN.md §2/§5`, `L5_CONSUMPTION_AUDIT.md rows 202-215`, `IMPLEMENTATION_STATUS_MATRIX.md row 24`.
> **Date**: 2026-05-24.

---

## 1. Problem

`L5_FEEDBACK_REDESIGN.md` flagged 11 corpus types needed for the L5 redesign. **Only 3 are wired today**: `CraftMove`, `EssayArchetype`, `VoiceRegister` (per `corpusRetrievalBlocks.ts:46`). The remaining **8 types exist as data but never reach the student via L5**.

The dormant 8:
| Type | Cells | Note |
|---|---|---|
| `voiceArchetypeCompatibility` | 98 | Voice × archetype fit matrix |
| `corpusLimits` | 18 | Bounded claims about what the corpus does/doesn't show |
| `readerBiasGuards` | 14 | Explicitly typed with `appliesTo: 'L5'` — never consulted |
| `schoolFitVectors` | 95 | School-shape fit vectors |
| `antiArchetypes` | 11 | The 11 cliché archetypes to avoid |
| `moveDependencies` | 12 | When move X requires move Y |
| `contextualValidity` | 21 | Conditions under which a move works |
| `deliberateAbsences` | 16 | What good essays deliberately omit |

Plus two resolver gaps:
- `[AP-#]` anti-pattern reference resolver — L3.5 may emit `[AP-3]` references; L5 has no code to turn them into teaching.
- `patternId` resolver — L3.5 validates patternId against a 75-pattern index; L5 has no resolver.

## 2. Goal

Wire each dormant type to its L5 consumption site so the type's signal actually changes annotations. Wire the two resolvers so anti-pattern + patternId citations from L3.5 reach the student as teaching.

## 3. Approach — per-type producer + consumer + flag, incremental

For each of the 10 items (8 types + 2 resolvers), the design declares:
1. **Producer**: where the corpus data lives (file path), what shape it has.
2. **Retrieval block**: a new entry in `corpusRetrievalBlocks.ts` that fetches the type when needed.
3. **Consumer**: which L5 prompt builder reads the block; what changes in the annotation output as a result.
4. **Flag**: per-type `ENABLE_CORPUS_RETRIEVAL_*` flag (consistent with Phase 8 pattern).

Sequenced by leverage (highest first; ship incrementally):

| Order | Type / resolver | Why this priority |
|---|---|---|
| 1 | `readerBiasGuards` | Self-typed `appliesTo: 'L5'` — explicit waste. 14 guards. |
| 2 | `antiArchetypes` + `[AP-#]` resolver | Anti-archetypes are the most teaching-relevant — the "cliché check." |
| 3 | `patternId` resolver | L3.5 already validates against the 75-pattern index; L5 just needs to read. |
| 4 | `voiceArchetypeCompatibility` | High-cell-count, big surface area, but lower per-essay leverage. |
| 5 | `corpusLimits` | Calibration anchor for the AI — bounds claims it can make. |
| 6 | `deliberateAbsences` | Counselor-grade negative-space signal. |
| 7 | `contextualValidity` | Move-validity gating. |
| 8 | `moveDependencies` | Higher-order — sequence depends on 7. |
| 9 | `schoolFitVectors` | Largest (95 cells); requires per-school student profile to be useful, depends on workshop wiring. |

Items 1–3 ship in Stage 2 of this session (high-leverage, low-coupling). Items 4–9 ship as Phase 8 corpus activation per the existing roadmap.

## 4. Wiring pattern (per-type template)

### 4.1 Retrieval block (new entries in `corpusRetrievalBlocks.ts`)

Follow the existing pattern for `retrieveAnchorMoves` / `retrieveParagraphAntiPatterns` / `retrievePhaseArchetypes`:

```ts
export async function retrieveReaderBiasGuards(
  profile: Readonly<EssayProfile>,
  telemetry?: CorpusTelemetry,
): Promise<ReaderBiasGuard[]> {
  if (!isCorpusRetrievalEnabled('READER_BIAS_GUARDS')) return [];
  // ... read from corpus file, filter by relevance, return ...
}

export function buildReaderBiasGuardsBlock(
  guards: ReaderBiasGuard[],
): string {
  if (guards.length === 0) return '';
  return `\nREADER BIAS GUARDS (avoid these AO-reading-failure modes):\n${
    guards.map((g, i) => `[BG-${i + 1}] ${g.label}: ${g.summary}`).join('\n')
  }`;
}
```

### 4.2 Consumer (new injection points in `deepAnnotationService.ts`)

For each block, decide where it lands:
- **System prompt** (cached forever): for stable, broad-applicability blocks like `readerBiasGuards`.
- **Shared user prefix** (cached per-essay): for blocks that vary per-essay archetype.
- **Per-paragraph tail** (uncached): never used — too expensive.

Default: stable blocks → system prompt; archetype-conditional → shared user prefix.

### 4.3 Output expectation

Each consumed block should produce a measurable annotation effect:
- **`readerBiasGuards` → annotations cite `[BG-#]` references** in their `teachingRationale` when the bias applies.
- **`antiArchetypes` + `[AP-#]` resolver → annotations cite `[AP-#]` references** in `teachingRationale`; annotations that the L3.5 flagged as `[AP-3]` get resolved to specific anti-archetype teaching.
- **`patternId` → annotations whose `patternId` matches a known pattern get an annotation field `patternName` for student-readable display.**

### 4.4 Flag

Per-type `ENABLE_CORPUS_RETRIEVAL_{TYPE}` flag, all default off. A master `ENABLE_CORPUS_RETRIEVAL_L5=true` flag enables ALL — convenient for the regen.

## 5. Resolvers (items 2 + 3 — `[AP-#]` and `patternId`)

`L3.5` emits these as text references in its output today (per `L5_FEEDBACK_REDESIGN.md §1.8`). L5 needs to:
1. Scan annotation `teachingRationale` and `content` for `[AP-N]` and `patternId: "..."` references.
2. Look up the referenced anti-archetype or pattern in the corpus.
3. Replace the bare reference with student-readable teaching (template: "this triggers the {antiArchetypeName} anti-pattern — {one-sentence explanation}").

Module: `src/services/essayIntelligence/analysis/corpusReferenceResolver.ts` (new). Idempotent post-processor; runs after L5 annotation generation, before density-diagnostics.

Fabrication guard: if a reference doesn't resolve (e.g. `[AP-99]` when only 11 anti-archetypes exist), log warning and strip the reference rather than rendering a broken citation.

## 6. Risks

**R1 — Prompt size explosion.** Wiring 8 retrieval blocks could add 5000+ tokens. Mitigation: per-type flag gating; only enable items 1–3 in this session. Phase 6 regen measures the prompt-size delta; if it busts max_tokens, throttle.

**R2 — Spurious citations.** LLM cites `[BG-7]` in `teachingRationale` but the bias doesn't actually apply. Mitigation: post-call validator checks that cited bias is also IN the retrieval block for this essay — if not, strip the citation. (Same pattern as attribution detection at `deepAnnotationService.ts:847`.)

**R3 — Resolver false positives.** A literal `[AP-3]` in essay text gets resolved as a reference. Mitigation: only resolve references in L5-OUTPUT fields (`teachingRationale`, `content`), never in essay-quoted spans (`spanText`, `originalSentence`).

**R4 — Item-9 schoolFitVectors complexity.** Defer — needs per-school student profile wiring that doesn't exist. Out of scope this session.

## 7. Acceptance gate (Phase 6 regen — items 1-3 only)

- **`readerBiasGuards`**: ≥1 L5 annotation per fixture cites a `[BG-#]` reference. All cited references match the retrieved set (zero spurious).
- **`antiArchetypes` + resolver**: any L3.5 `[AP-#]` reference in the L5 output is resolved to a student-readable teaching note. Zero raw `[AP-#]` strings reach the student render.
- **`patternId` resolver**: any annotation with `patternId !== null` has a populated `patternName` field. Zero raw pattern IDs reach the student render.
- **Prompt-size guard**: total L5 system prompt + shared prefix ≤ 8000 tokens (current ~6500; +1500 budget for new blocks).
- **No regression**: 20-30 annotation density holds; mode diversity holds.

## 8. Cost impact (items 1-3 only)

| Type | Block size | Where | Per-essay cost |
|---|---|---|---|
| readerBiasGuards | ~400 tokens | System prompt (cached) | +$0.0015 first-call, 0 after |
| antiArchetypes | ~600 tokens | Shared user prefix (cached) | +$0.0022 first-paragraph-call, 0 after N calls |
| `[AP-#]` resolver | 0 tokens (post-processor) | n/a | $0 |
| patternId resolver | 0 tokens (post-processor) | n/a | $0 |
| **Total** | | | **+~$0.004 per cold-start** |

## 9. Implementation notes (Stage 2)

- Modules: `corpusRetrievalBlocks.ts` (extend), `corpusReferenceResolver.ts` (new).
- Types: new corpus type definitions if not already in `profileTypes.ts` (most should already exist — verify against actual corpus file shapes).
- Wire site: `deepAnnotationService.ts` system prompt builder (`buildSystemPrompt`) for `readerBiasGuards`; per-paragraph context assembly for `antiArchetypes`. Resolver runs post-`validateAnnotations`.
- Flags as noted above.

## 10. Open question for Tue (Stage 2 gate)

The corpus data lives somewhere — `src/services/essayIntelligence/corpus/external/` is gitignored (per memory) but the audit doc references the 8 types as if they exist. Verify location before Stage 2 — if the data is missing or partial, ship the wire-up but the retrieval returns empty and the gate becomes "no regression vs no-wire."

If data is partial (e.g. only 6 of 14 readerBiasGuards populated), ship anyway — the wire-up unblocks future data growth.

---

## CORRECTIONS — appended 2026-05-24 (HEAD verification)

### CW-C1 — antiArchetypes + `[AP-#]` resolver: ALREADY PARTIALLY SHIPPED
- **Already at HEAD**:
  - Resolver block at `corpusRetrievalBlocks.ts:104` ("Total distinct [AP-#] labels referenced in LLM output across all calls"), `:470` (block formatting: `[AP-${i+1}]: ${ap.id} (match confidence: ${ap.similarity.toFixed(2)})`), `:475` (LLM directive: "If this paragraph demonstrates one of these patterns, cite the [AP-#] label").
  - Data at `corpus/antiArchetypes.ts` and re-exported via `corpus/claudeRetrieval.ts:33` (`import { ANTI_ARCHETYPES } from './antiArchetypes'`).
  - Fabrication-attribution scan at `analysisPass.ts:2087-2091` (`apRefs = referenced.filter((r) => r.startsWith('[AP-'))`).
  - `corpusMetadata.antiArchetypes` count exposed at `corpusTypes.ts:584`.
- **Real delta for this sub-item**: only the L5-side consumer wiring (resolver in `validateAnnotations`-adjacent code) may be new — the upstream production + L3.5/L4 wiring is live.

### CW-C2 — readerBiasGuards: confirmed NOT shipped
- HEAD grep: zero hits for `readerBiasGuards` anywhere under `src/`. Neither data, type, nor retrieval. Full wire-up is net-new.

### CW-C3 — patternId resolver: unverified
- `patternId` field exists in profileTypes but no dedicated resolver block was located. Stage 2 must start by greping for a resolver in `corpusRetrievalBlocks.ts` plus checking what cites patternId today.

### Net delta for plan §4 items 1-3
- Item 1 `readerBiasGuards` — fully greenfield wire-up.
- Item 2 `antiArchetypes` + `[AP-#]` — mostly already shipped; only L5 consumer-side surface may be new.
- Item 3 `patternId` resolver — needs HEAD verification before any code.

### CW-C4 — final disposition: (B) drop Item 7 from Stage 2 (2026-05-27)

Deeper HEAD verification + Tue's call. Final sub-item status:

| Sub-item | Status | Evidence |
|---|---|---|
| 1. `readerBiasGuards` | NOT SHIPPED + NO DATA | `find src/services/essayIntelligence/corpus -name "*bias*"` returns zero; no data file, no resolver, no consumer wire. Authoring the 14 entries is content work outside Stage 2 scope. |
| 2. `antiArchetypes` + `[AP-#]` | SHIPPED | Data at `corpus/antiArchetypes.ts`; resolver at `corpusRetrievalBlocks.ts:104, 470, 475`; fabrication-attribution scan at `analysisPass.ts:2087-2091`. |
| 3. `patternId` resolver | SHIPPED | `getPatternById` consumed at `coaching/teachingContentRouter.ts:100-106`. Producer + catalog (`patternCatalogBlock.ts`) + validator (`analysisPass.ts:1633`) + consumer-side helper all live. |

**Decision:** Item 7 is **dropped from Stage 2.** Two of three sub-items are already shipped at HEAD. Sub-item 1 (`readerBiasGuards`) is dropped because data-greenfield + retrieval-greenfield together would be premature scaffolding — empty section in the L5 prompt with no behavioral effect.

**Correct future sequence for `readerBiasGuards`:**
1. Author the 14 entries (one per archetype × bias-pattern). This is a domain-judgment task — what biases each archetype is at risk of reinforcing (model-minority, sympathy-bait, hero-savior, etc.) and what the L5 guard should flag.
2. Define the schema in `corpus/readerBiasGuards.ts` (mirror `antiArchetypes.ts` shape).
3. Ship retrieval + L5 consumer wire as a single bundled change, once data exists.

Doing (1) without (2)+(3) is fine — content can land first, code follows. Doing (2)+(3) without (1) is the anti-pattern this disposition rejects.

**Status:** Item 7 closed. The remaining 5 dormant types in the original design (`voiceArchetypeCompatibility`, `corpusLimits`, `schoolFitVectors`, `moveDependencies`, `contextualValidity`, `deliberateAbsences`) stay deferred per their original §1 dormant status.

