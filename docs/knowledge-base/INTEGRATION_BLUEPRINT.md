# KB → Generation Integration — Hardened Blueprint

> **⚠️ ARCHITECTURE REVISED per ADR-001 (ACCEPTED 2026-06-26) — read `ADR-001-knowledge-application-architecture.md` first.**
> The relevance mechanism pivoted from a **deterministic dimension-filter** (`Array.filter(dimensions.includes())`
> over a closed `MoveDimension` enum) to **broad-availability + one whole-essay LLM-judged curation pass** ("Phase C",
> hosted in the already-cached, already-whole-essay L3.75 synthesis call). Determinism is demoted to bookkeeping:
> the `surfaceVsExpert` **availability gate** + provenance/ID isolation. Net effect on the items below:
> **Item 9** compiles the KB to **principle digests**, not catalog rows (the DIM_MAP/SUBTOPIC_MAP/F-1 join is **no
> longer load-bearing**); **Item 3** emits **descriptive leads** (soft tag + free text), not a closed-enum routing key;
> **Item 4** is **demoted** from selector to an optional recall-biased pre-narrowing aid + availability gate; **Item 6**
> (the brief) is **elevated to the single curator** (selection, cross-paragraph, absent-but-available, altitude) and
> hosts Phase C; **Item 8** gains a **"≤3 applications surfaced" assertion + the A_C anti-commoditization check**, and
> A/B's the Phase-C arm against the (now-legacy) filter arm. Each affected Item carries an inline "REVISED per ADR-001"
> block; the original filter-arm text is retained, struck-through-by-banner, as the A/B comparison arm and the design
> record. **The two arms are A/B-measurable on the 3 built axes — the eval, not this revision, retires the filter arm.**

> **What changes (curation arm, post-ADR-001):** the 44 verified KB entries (today inert in `docs/`) become a
> generation-feeding asset by **compiling into a cached principle-digest block** held in the whole-essay L3.75
> synthesis call, where a single **LLM curation pass (Phase C)** notices where principles apply across the whole
> essay, **curates to 2–3 by impact with justified cuts**, and **places by altitude** (whole-essay/cross-paragraph →
> Executive Brief; paragraph/sentence → L5 via the existing `corpusContext` seam). A **`source`/`status`/`provenance`
> discipline** preserves verified-first trust; the `surfaceVsExpert` **availability gate** is the only determinism in
> the relevance path. Recognition (L3.5) emits **descriptive leads** (not a retrieval key). The now-dormant **executive
> brief** is enabled, rendered, and made the single curator (the only layer with whole-essay sight). A **two-stage
> editorial eval** (deterministic gates → residual LLM judge), extended with the ≤3-surfaced assertion + A_C, is the
> ship gate. Net: no new vocabulary join, surgical (≤3) low-noise surface, ~$0.05–0.10/essay, measurable lift —
> A/B-proven against the legacy filter arm before the filter is retired.

> **What changes (legacy filter arm — retained for A/B, superseded as the build target):** the 44 verified KB entries
> become a retrievable asset by **compiling into the existing corpus** (Rethink's one-store insight — verified safe
> against the ordinal-remap label seam) while a **`source`/`status`/`provenance` discipline** preserves verified-first
> trust. Recognition (L3.5) emits a structured per-axis diagnostic that **doubles as a closed-enum retrieval key**;
> selection is `Array.filter(dimensions.includes(gap.dimension))` normalized by a load-bearing DIM_MAP/SUBTOPIC_MAP.
> **ADR-001 finding:** this silos knowledge (the F-1 join-break class is intrinsic to it), makes the most contextual
> judgment in the system mechanically (violates LLM-first rules 1 & 3), and is cross-paragraph-blind. Kept below only
> as the measured comparison arm.

This blueprint is the forced-choice synthesis of `forge-design-direct.md` and `forge-design-rethink.md`,
hardened against the code reads in `## Rejected Approaches` and `INTEGRATION_DEBATES.md`.

---

## Verification findings that shaped the plan

| id | severity | issue | resolution |
|----|----------|-------|------------|
| V-1 | — (confirms Rethink) | **Ordinal-remap holds.** `buildCorpusMovesBlock` (corpusRetrievalBlocks.ts:445) labels every injected move `[MOVE-${i+1}]` — the entity `id` (`kb-essays-restraint-001`) is NEVER printed into the analysis prompt; only `displayName`+`mechanism`. `detectFabricatedReferences` (:573-576) validates an ordinal **index range** (`idx<1 || idx>injectedMoveCount`), not the id string. | Compiling KB into the corpus needs **NO `[KB-#]` regex/hash extension**. Rethink's keystone claim is TRUE. The synthetic id is visible only inside the cached *ranking* catalog (validIds-gated), never in student-facing output. |
| V-2 | broken (in Rethink's GAP-4) | **Vocabulary-join hazard.** KB `dimensionTags` are **12-rubric `RubricDimensionName`** values (`reflection_meaning_making`, `originality_specificity_voice`, `emotional_resonance`…). Native `MoveDimension` (corpusTypes.ts:119) is a **disjoint 8-value craft axis** (voice/structure/specificity/emotion/argument/opening/closing/metaphor). Only `voice`/`specificity` overlap. Rethink's `ALL_MOVES.filter(dimensions.includes(gap.dimension))` silently returns **zero candidates** for any cross-vocabulary gap unless DIM_MAP normalizes *both* sides AND the diagnostic emits the same vocabulary. Rethink under-specifies this. | DIM_MAP is **load-bearing, not a footnote.** Make `MoveDimension` the single shared vocabulary; map KB tags into it at compile time; have the L3.5 diagnostic emit `MoveDimension` (closed) + `dimensionOpen?` (escape hatch → similarity fallback). See Item 4. |
| V-3 | confirms Rethink | **Brief has whole-essay sight.** `buildUserPrompt` (executiveBrief.ts:159-189) reads **full essay text** (all paragraphs), `northStar`, `admissionsPositioning`, `coherenceResolutions`, and top-5 L5 annotations. | *absent-but-available* is correctly a **whole-essay judgment at the brief**, not a per-paragraph L3.5 emission. Rethink's scope-cut is sound (per-para can't see global absence; 10× blind calls would be wrong + costly). |
| V-4 | confirms both | **Brief is dormant + unrendered.** `isExecutiveBriefEnabled()` default OFF (executiveBrief.ts:75); **0 references in `presentation/`**. Only consumer is `diagnosticSnapshot.ts` (drops model sentences). | Enable + **greenfield renderer** is a prerequisite for the altitude work (Item 6). |
| V-5 | confirms both | **`:265` master-flag bug.** `retrieveAnchorMoves` (:265) and `retrieveParagraphAntiPatterns` (:313) hard-check `isCorpusRetrievalEnabled()` (master), bypassing the correct per-layer resolvers (:195-212). L5 call site checks `isCorpusRetrievalEnabledForL5()` then the fn re-checks master → silent `[]`. | STAGE_RESOLVER map fix (Item 2). `resolveLayerFlag` already preserves the single-knob (master IS the L35 knob). |
| V-6 | confirms Direct | **`CraftMove.dimensions` EXISTS** (corpusTypes.ts:156) but is **NOT printed** in `getMovesCatalog` (claudeRetrieval.ts:98 prints registers/transferability/difficulty/seen + mechanism only). `surfaceVsExpert` is **genuinely absent** from `CraftMove`. | Direct's pre-flight correction is right (the diagnostic's "dimensions doesn't exist" is wrong). The field is invisible to the router → print it + add `surfaceVsExpert`. |
| V-7 | confirms both | **Heterogeneous KB.** `restraint-001` is rich (mechanics/transfer/failureModes/antiTemplate/`workedExample.usage:"DO NOT SURFACE/MIMIC"`); `ai-in-essays-001` is thin (claim+sources only, no mechanics/workedExample/surfaceVsExpert/antiTemplate/reuse). | Compile + fuel-table must tolerate both via `?? null` — no runtime branch (Rethink). Thin facts carry generate-fuel via `reuse.verbatimReuseOK` quoting, not mechanics. |
| V-8 | confirms both | **Manifest claims hold.** `demonstration: null` hardcoded at every push site (analysisOrchestrator.ts:2493/2528/2559/2587/2697); `matchClaimToTechnique` (:2874) is a 14-route keyword table; `getTechniqueFromConsolidatedCandidates` (:2858) is the preferred resolver. `buildImprovementManifest` (:2454) sync, one async caller (:1432). | GAP-10 re-route is real (Item 10). |
| V-9 | confirms both | **`corpusContext` seam exists.** `analyzeSingleParagraph` (analysisPass.ts:2473) accepts `corpusContext?: string` (:2482) → `buildParagraphPrompt` injects it (:1312-1313). | GAP-3 extends an existing call/seam — no new API call (Item 3). |
| V-10 | confirms (safe) | **No `kb-` id collision.** No native move id starts with `kb-`; 190 native moves; validator checks `directives.length!==5 && modelSentences.length!==3` (:427). | Compiling `kb-${entry.id}` into `moveById` is collision-free; optional `dependsOn` won't break the validator. |

---

## Items

### Item 2 — `:265` master-flag bug → STAGE_RESOLVER map  *(Source: converged direct+rethink)*

**Before** (corpusRetrievalBlocks.ts:265, :313):
```ts
export async function retrieveAnchorMoves(anchorText, profile, telemetry, stageTag = 'anchor') {
  if (!isCorpusRetrievalEnabled()) return [];   // BUG: master flag ignores per-layer rollout
```
L5 calls with `stageTag='feedback'`, checks `isCorpusRetrievalEnabledForL5()`, then this re-checks master → silent `[]`.

**After:**
```ts
// New: stage → per-layer resolver. CORRECTED 2026-06-21 (FOUNDATION_AUDIT C-6): the stage union has
// 8 members (anchor|paragraph|phase|walk|synthesis|crystallizer|feedback|coaching), so a TOTAL
// `Record<...>` would TS2741-fail; use `Partial<Record<...>>` + the `?? master` default. Also fixed the
// semantics: `crystallizer` IS the L4 layer (was wrongly mapped to `phase`); `phase` = phaseAssessment,
// which has NO per-layer flag → falls through to master.
const STAGE_RESOLVER: Partial<Record<CorpusRetrievalAttempt['stage'], () => boolean>> = {
  walk:         isCorpusRetrievalEnabledForL3,
  synthesis:    isCorpusRetrievalEnabledForL375,
  crystallizer: isCorpusRetrievalEnabledForL4,   // crystallizer IS L4
  feedback:     isCorpusRetrievalEnabledForL5,
  coaching:     isCorpusRetrievalEnabledForL6,
  // anchor + paragraph (L3.5 — master IS the L35 knob) and phase (phaseAssessment, no per-layer flag)
  // intentionally OMITTED → resolveStageFlag's `?? isCorpusRetrievalEnabled` default gates them on master.
};
function resolveStageFlag(stage: CorpusRetrievalAttempt['stage']): boolean {
  return (STAGE_RESOLVER[stage] ?? isCorpusRetrievalEnabled)();
}
```
Swap `:265` and `:313` to `if (!resolveStageFlag(stageTag)) return [];`. Add `stageTag` param to `retrieveParagraphAntiPatterns`/`retrievePhaseArchetypes` (defaulted `'paragraph'`/`'phase'`).

**Integration points:** corpusRetrievalBlocks.ts:265, :313, :359; resolvers at :195-212 (already correct).
**Cost:** $0. ~12 lines.
**Verify:** `ENABLE_CORPUS_RETRIEVAL_L5=true` (master unset) → L5 retrieval fires; master-only still gates anchor/paragraph. Unit test the resolver map.

---

### Item 8 — Editorial eval gate (deterministic-first → residual judge)  *(Source: rethink Stage-split + direct's gold-wiring; refined)*

> **⚠️ SUPERSEDED (2026-06-20) — DO NOT BUILD FROM THIS SECTION.** This Item 8 was harshly red-teamed and
> found NOT-BUILDABLE-AS-SPECCED and over-claiming (it would reward bland/commoditized output — "worse than
> no gate"). The authoritative spec is **`EDITORIAL_EVAL_GATE_SPEC.md` v2**, which: splits into Stage-1
> (KB-absent, buildable now over cached profiles) vs Stage-2 (dormant until Item 9); adds an
> **anti-commoditization check (A_C)**; demotes A3 + B2 to advisory; **forbids `qualityScorer`** (wrong
> pipeline — it scores legacy `annotationPipeline`, not `essayIntelligence`); uses a **persisted-profile
> cost model** (the real A/B run is ~$22–43, not $1.5); and reframes GREEN as **hygiene + gross-quality
> recognition, NOT editorial-correctness/lift**. The cost-summary line for Item 8 below (~$1.5/run) is also
> stale. See `FOUNDATION_AUDIT.md` C-2/C-7.

> **➕ AMENDED per ADR-001 (2026-06-26) — the eval is the arbiter that retires the filter arm.** Item 8 is
> **unchanged as the originality boundary**; ADR-001 adds two things and one job (fold into `EDITORIAL_EVAL_GATE_SPEC.md`
> v2 — that spec stays authoritative):
> 1. **"≤3 applications surfaced" assertion** — a deterministic Stage-1 check that the curation arm never surfaces more
>    than 3 KB applications per essay. This replaces the structural bound the old filter's `slice(0,2)` gave for free;
>    in the curation arm, bounded noise is a model judgment, so the gate must assert it (ADR-001 "the one real risk").
> 2. **Wire the anti-commoditization check (A_C)** — already specced in EVAL v2; ADR-001 makes it load-bearing because
>    the curation arm's strength and its risk are the same mechanism (a weak prompt could surface bland/generic
>    applications that pass lexical+variance gates). A_C is the catch.
> 3. **A/B job:** run the **Phase-C curation arm vs the legacy `selectMovesForDiagnostics` filter arm** through this
>    gate on the 3 built axes; let **A_C + the ≤3 assertion + B2 advisory-lift decide** which ships. Neither arm ships
>    un-measured — the curation arm especially. This A/B is what actually retires the filter arm (ADR-001 acceptance
>    commits the build to curation but defers the *retirement* of the filter to this measurement).

The dossier's "2-D HELPFUL∧ORIGINAL eval" **does not exist in code** (only `runCalibration.ts` rubric-scoring + `run-checkpoint3-ab.ts` correlation/citation/hallucination). It is a **build** and the true Tier-0 blocker — nothing downstream is provable without it.

**Stage 1 — deterministic (FREE, runs on every diff):**
```ts
// tests/calibration/editorialEval.ts
interface Stage1Result { passed: boolean; lexicalOverlap: number; formTargetVariance: number; failureModeHits: string[]; }
```
1. **Lexical-overlap ceiling.** Trigram overlap of generated feedback vs the hydrated `workedExample.after` (loaded eval-side only, never in runtime prompt), **excluding `reuse.verbatimReuseOK` spans** from the numerator. `> 0.15` → fail.
2. **Close-register variance gate.** Haiku tags each treatment output's FORM (sensory/relational/observational/rhetorical-question) × TARGET. If any (FORM×TARGET) cell exceeds `2/N`, the batch is templating at deep structure (survives 0.00 lexical overlap) → fail. Catches the `post-sffa-001` soil/fruit regression.
3. **failureModes-as-checklist.** For each applied move, scan output against that move's `fuel.failureModes` (e.g. "named once then explained anyway") → hit = fail.

**Stage 2 — LLM judge (residual only):** cross-family position-swapped Sonnet judge, shown `{essay, baseline-feedback, treatment-feedback, human close-read}` randomized; picks `moreHelpful` + `reachesBar`; **agreement across swap required**. Runs ONLY on Stage-1 survivors (~30-50% fewer judge calls). Seed thresholds from `tests/calibration/top-tier-reference/expert-ratings.json` tiers.

**Ship gate:** `HELPFUL ∧ ORIGINAL`. "Won by copying" or "no lift over baseline" = FAIL.

**Integration points:** new `tests/calibration/editorialEval.ts`; extend `tests/corpus/run-checkpoint3-ab.ts` A/B skeleton; gold at `tests/calibration/top-tier-reference/`.
**Cost:** Stage 1 ~$0 (deterministic + one cheap Haiku FORM-tag pass). Stage 2 ~$1.5/run (residual). Total well under $5 cap.
**Verify:** run baseline-vs-baseline → expect no-lift (sanity null); run a known-good restraint treatment → expect HELPFUL pass + ORIGINAL pass.

---

### Item 9 — Compile KB into a cached principle-digest block (+ provenance discipline)  *(Source: HYBRID — rethink one-store + direct verified-first/status; REVISED per ADR-001)*

> **🔁 REVISED per ADR-001 (2026-06-26) — build this shape, not the catalog-row shape below.**
>
> **What to build (curation arm):** still compile the 44 KB entries into a single derived artifact, but as
> **principle digests**, not catalog rows. Each digest is `{ kbSourceId, status, claim, mechanics, failureModes,
> antiTemplate, reuse }` re-expressed **fluently** (prose the curation LLM reads), NOT `{displayName, mechanism,
> detectionSignal, dimensions[], compatibleRegisters}` ranking rows. The whole digest set is held as **one cached
> block** injected into the L3.75 synthesis call's system prefix (Phase C — Item 6), where the LLM reads all of it
> every essay. There is **no ranking pass over digests**, so:
> - **DIM_MAP / SUBTOPIC_MAP and the entire F-1 join class are NO LONGER LOAD-BEARING.** Drop them from the critical
>   path. The reason they existed — to make `Array.filter(dimensions.includes())` match across disjoint vocabularies —
>   is gone because there is no `.filter()` deciding relevance. Keep `MoveDimension` only as a **descriptive tag** for
>   provenance/debugging and the availability gate; a missing DIM_MAP key is now a cosmetic gap, not a silent
>   candidate-drop. (Retain the DIM_MAP/SUBTOPIC_MAP code ONLY if Item 4's optional pre-narrowing aid is later built
>   at scale — see ADR-001 "Scaling note"; not needed ≤150 entries.)
> - **`surfaceVsExpert` stays load-bearing** as the availability gate: a `surface` digest is excluded from the cached
>   block entirely (it literally cannot be curated). This is the one piece of determinism ADR-001 keeps in the
>   relevance path — legitimate, because "the base model already volunteers this" is an availability fact, not a
>   relevance judgment.
> - **`workedExample` still NEVER hydrated** into the digest block or any runtime prompt (V-7: `usage:DO-NOT-MIMIC`).
>   It remains eval-side only (Item 8 Stage 1 overlap check).
> - **Provenance/ID isolation unchanged in spirit:** digests carry `kbSourceId`/`status`/`source`; none is rendered to
>   the student. If a digest's principle is PLACED into L5 via `corpusContext`, it rides the existing ordinal-remap
>   seam (V-1) exactly as a native move would — no `[KB-#]` extension.
> - **`INCLUDE_KB` build flag** is retained: it now gates whether the digest block is injected into the Phase-C call
>   (KB-on/off for the eval's A/B).
>
> **What changes structurally:** the `kbGenerationTable.generated.ts` artifact (sub-point 4 below) becomes the PRIMARY
> output (it already holds claim/mechanics/transfer/failureModes/antiTemplate/reuse — exactly the digest fields); the
> `KB_CRAFT_MOVES.push({...})` catalog-row compile (sub-point 5) is **demoted to the legacy filter arm** and built only
> if the A/B keeps it. The digest block is rendered by a teaching-framed builder (mirror `buildDescriptiveArchetypesBlock`,
> NOT `buildCorpusMovesBlock`).
>
> **Verify (curation arm):** the digest block compiles to ~7K cached tokens at 44 entries (ADR-001 scaling note);
> `surface`-tagged entries are absent from the block; grep the rendered student output for `kb-` → zero; a `restraint`
> essay's Phase-C curation surfaces a restraint principle **without any DIM_MAP/SUBTOPIC_MAP join existing in the path.**
>
> ---
> *Legacy filter-arm spec (retained for A/B; superseded as the build target by the block above):*

**This is the decisive fork. Decision: compile into the corpus (Rethink), with a provenance/status discipline grafted on (Direct), because the code proves the band's only real advantage — id-isolation — is already provided by the ordinal-remap seam (V-1).**

**Before:** `moveById = new Map(TOP_TIER_CRAFT_MOVES...)` (claudeRetrieval.ts:76); 190 native moves; KB inert in `docs/`.

**After — one store, one retriever, one hash, provenance preserved:**

1. **`CraftMove` extension** (corpusTypes.ts:135, all optional → back-compat):
```ts
export interface CraftMove {
  // ...existing...
  dimensions: MoveDimension[];
  surfaceVsExpert?: 'expert' | 'surface';   // NEW (V-6: genuinely absent today)
  source?: 'native' | 'kb';                  // NEW — provenance band (Direct's discipline)
  status?: 'VERIFIED' | 'CONTESTED' | 'PROVISIONAL'; // NEW — KB trust, null for native
  kbSourceId?: string | null;                // NEW — points to GENERATE fuel; NEVER printed
}
```
2. **`MoveDimension` 8 → 18** (corpusTypes.ts:119) — closed union is acceptable HERE (the corpus is a curated index, not a perception surface; OpenEnum lives on the L3.5 diagnostic, Item 3): add `restraint, rhythm, subtext, tone, diction, reflection, character, positioning, imagery, originality`.
3. **DIM_MAP (V-2 — load-bearing):** human-curated `KB-tag → MoveDimension(18)` map, applied at compile time to KB `dimensionTags` AND used as the L3.5 diagnostic's emit vocabulary (Item 3). Both sides land in ONE vocabulary so the Item-4 `.filter()` actually matches. **CORRECTION 2026-06-21:** V-2 (and COH-5) called the KB tags "12-rubric `RubricDimensionName`" and claimed the map was missing `authentic_voice` — both inaccurate. The real KB vocabulary is **11 distinct MIXED tags** (rubric-dimension names + craft-axis names): `authentic_voice, character_interiority_vulnerability, context_constraints_disclosure, emotional_resonance, imagery_figurative_language, intellectual_vitality_curiosity, originality_specificity_voice, reflection_meaning_making, school_program_fit, specificity, voice`. The DIM_MAP below was **verified to cover all 11** (so the compile-time "every tag has a DIM_MAP entry" assert PASSES today). One mapping is LOSSY and flagged for the 8→18 design: `intellectual_vitality_curiosity → 'argument'` is a poor fit — add a dedicated `intellectual`/`curiosity` MoveDimension in the expansion rather than collapsing it into `argument`.
```ts
const DIM_MAP: Record<string, MoveDimension> = {
  reflection_meaning_making: 'reflection',
  originality_specificity_voice: 'originality',
  character_interiority_vulnerability: 'character',
  emotional_resonance: 'emotion',
  authentic_voice: 'voice',
  imagery_figurative_language: 'imagery',
  intellectual_vitality_curiosity: 'argument',
  context_constraints_disclosure: 'positioning',
  school_program_fit: 'positioning',
  specificity: 'specificity', voice: 'voice',
  // ↑ verified COMPLETE for all 11 real mixed tags (rubric-dim + craft-axis names). No more keys needed.
};
```
4. **GENERATE side-table** `kbGenerationTable.generated.ts` (mirrors `reviewPassages.generated.ts`; `docs/` stays source-of-truth):
```ts
export interface KbGenerationFuel {
  kbSourceId: string;
  status: 'VERIFIED' | 'CONTESTED' | 'PROVISIONAL';
  mechanics: string | null;        // thin facts → null, no branch
  transfer: string[];
  failureModes: string[];
  antiTemplate: string | null;
  reuse: { verbatimReuseOK: string[]; reExpressPerUser: string | null } | null;
  // workedExample DELIBERATELY ABSENT — never enters runtime (usage:DO-NOT-MIMIC)
}
export const KB_GENERATION_FUEL: Record<string, KbGenerationFuel> = { /* generated */ };
```
5. **Compile script** `scripts/compileKbIntoCorpus.ts` (~140 lines, $0 API). Per entry per `application`:
```ts
KB_CRAFT_MOVES.push({
  id: `kb-${entry.id}`,
  displayName: `${entry.subtopic}: ${app.kind}`,
  mechanism: truncate(entry.claim, 240),
  detectionSignal: app.content,
  antiPatterns: app.failureModes ?? [],
  // FIX F-1 (FATAL, 2026-06-21): the L3.5 diagnostic emits SUBTOPIC axes (restraint/rhythm/subtext/
  // tone/diction), but KB `dimensionTags` only ever map (via DIM_MAP) to {reflection/originality/
  // character/emotion/voice/imagery/argument/positioning/specificity} — DISJOINT from the subtopic axes.
  // So a `restraint/botched` gap would `.filter(dimensions.includes('restraint'))` → ZERO KB candidates.
  // The join must include the entry's `subtopic` (which IS the signature axis) as a dimension. SUBTOPIC_MAP:
  //   restraint→'restraint', rhythm→'rhythm', reflection-meaning-making→'reflection',
  //   post-sffa-identity/supplement-expectations→'positioning', ai-in-essays→'positioning' (+ originality).
  // dimensions = de-dup union of (subtopic-mapped) + (dimensionTags-mapped). VERIFY end-to-end that a
  // `restraint/botched` diagnostic now retrieves the restraint entries before claiming the join works.
  dimensions: dedupe([
    ...(SUBTOPIC_MAP[entry.subtopic] ? [SUBTOPIC_MAP[entry.subtopic]] : []),
    ...(app.dimensionTags ?? []).map(t => DIM_MAP[t]).filter(Boolean), // D-2: tags are per-application only; no top-level entry.dimensionTags exists
  ]) as MoveDimension[],
  compatibleRegisters: ['all'],
  surfaceVsExpert: app.surfaceVsExpert ?? 'expert',  // KB is expert-led by construction
  source: 'kb',
  status: entry.status,
  kbSourceId: `kb-${entry.id}`,
  // …transferability/difficulty defaults
});
KB_GENERATION_FUEL[`kb-${entry.id}`] = { kbSourceId, status: entry.status,
  mechanics: app.mechanics ?? null, transfer: app.transfer ?? [],
  failureModes: app.failureModes ?? [], antiTemplate: app.antiTemplate ?? null,
  reuse: app.reuse ?? null };
// Entries with workedExample.usage containing "DO NOT SURFACE/MIMIC" → workedExample dropped from BOTH artifacts.
```
6. **Merge + ordinal-remap safety** (claudeRetrieval.ts:76):
```ts
const ALL_MOVES = [...TOP_TIER_CRAFT_MOVES, ...(INCLUDE_KB ? KB_CRAFT_MOVES : [])];
const moveById = new Map(ALL_MOVES.map(m => [m.id, m]));
```
`INCLUDE_KB` build flag (default true) gives an on/off for the eval's KB-on/off comparison.
7. **Catalog print** (getMovesCatalog:98) — add `| dims:${m.dimensions.join(',')} | ${(m.surfaceVsExpert ?? 'expert').toUpperCase()}`. ~190→234 lines, ~6.5K→~8K tokens, **$0/essay** (cache-read; one cache-write per TTL). `kbSourceId`/`status`/`source` are **never printed** to the catalog → provenance lives off the ranked surface (no provenance-blurring in the ranking line itself; see V-1 + Provenance resolution below).

**Provenance discipline (Direct's contribution, the answer to "does merging blur trust?"):**
- `status`/`source` carried on the move + fuel, NOT in the printed catalog line → an unsourced corpus move and a VERIFIED KB move compete head-to-head on craft relevance (Rethink's win) **without** the model being told to privilege a "verified" label it can't audit.
- **Verified-first stable sort** at selection (Item 4): among equal-dimension expert candidates, `status==='VERIFIED'` and `source==='kb'` sort ahead of unsourced native moves. Trust is enforced at *selection ordering*, not at ranking-prompt time.
- `detectFabricatedReferences` **unchanged** (V-1): KB moves are `[MOVE-#]`-class at injection; the index-range detector already covers them.

**Integration points:** corpusTypes.ts:119/135/156; claudeRetrieval.ts:76/98/138 (hash auto-includes via getMovesCatalog); new `scripts/compileKbIntoCorpus.ts`; new `src/services/essayIntelligence/corpus/kbGenerationTable.generated.ts`.
**Cost:** $0 API to compile; ~$0/essay at runtime (cache-read). **Absorbs GAP-1 (the compile IS the connection) and GAP-5 (8→18 + surfaceVsExpert in the same pass).**
**Verify:** `getCatalogContentHash` changes; `moveById.get('kb-essays-restraint-001')` resolves; ranking a restraint-shaped paragraph returns the KB move; grep student-facing output for `kb-` → zero (ordinal-remap holds).

---

### Item 1 — KB reaches the pipeline  *(Source: ABSORBED into Item 9)*

No separate `getKbCatalog`/`{{KB}}`/`kbById`/`retrieveKbBySignal`. The compile step (Item 9) wires the KB into the one existing retriever. `retrieveMovesBySignal` now ranks across all 234 moves; KB moves are hydrated through the existing `moveById.get(r.id)!` seam (claudeRetrieval.ts:293-305). **Cost: $0.** **Verify:** covered by Item 9 verify.

---

### Item 3 — `craftDiagnostics` on `AnalysisPassOutput` (descriptive leads)  *(Source: rethink scope-cut + direct field shape; REVISED per ADR-001)*

> **🔁 REVISED per ADR-001 (2026-06-26) — emit DESCRIPTIVE LEADS, not a closed-enum routing key.**
> The per-paragraph diagnostic is kept (cheap local detection is genuinely useful) but it **no longer doubles as the
> retrieval/selection key** — the whole-essay Phase-C pass (Item 6) owns relevance and is free to surface a principle
> the per-paragraph pass never tagged. Concretely:
> - **`dimension` flips from closed `MoveDimension` to a soft tag + free text** (OpenEnum). Use `dimensionOpen: string`
>   as the primary signal and keep `dimension?: MoveDimension | null` only as an optional coarse hint. The diagnostic
>   must NOT be the thing a `.filter()` matches on — there is no such filter in the curation arm.
> - **`intent` (text, MUST cite the paragraph) is the load-bearing field** the Phase-C pass reads. The leads are
>   "here's what this paragraph is doing / failing at, in the analyst's words," fed into the whole-essay curation as
>   soft context — not a typed contract.
> - Everything else (present/weak/botched status, ≤5/paragraph, no `absent` per-para, the `corpusContext` seam, cost
>   ~$0.002/essay) is **unchanged**. This is why ADR-001 says the F-1 join class "dissolves": with no closed-enum key,
>   there is no vocabulary to mis-join.
>
> Revised shape:
> ```ts
> export interface CraftDiagnostic {
>   dimensionOpen: string;             // PRIMARY — free-text lead, the analyst's own words
>   dimension?: MoveDimension | null;  // optional coarse hint ONLY; never a routing/selection key
>   status: 'present-strong' | 'present-weak' | 'botched';
>   intent: string;                    // ≤20w, MUST cite text — load-bearing for Phase-C
>   evidenceSentenceIndex?: number;
> }
> ```
> The closed-`dimension` version below is the legacy filter-arm shape (it was the retrieval key there).
>
> ---
> *Legacy filter-arm spec (retained for A/B):*

Recognition today is free-text `weaknesses/strengths`; there is no structured per-axis channel and no producer for *absent-but-available*.

**After** — extend the existing per-paragraph call (V-9, no new API call), emitting **present/weak/botched ONLY** (per-paragraph can judge what's *written*; it cannot see global absence — V-3):
```ts
// profileTypes.ts (Port precedent :4274; OpenEnum like symptomTypeOpen:4297)
export interface CraftDiagnostic {
  dimension: MoveDimension;          // closed — shared vocabulary with the corpus (V-2)
  dimensionOpen?: string | null;     // escape hatch → similarity fallback in Item 4
  status: 'present-strong' | 'present-weak' | 'botched';  // NO absent-but-available here
  intent: string;                    // ≤20w, MUST cite text
  evidenceSentenceIndex?: number;
}
// AnalysisPassOutput.craftDiagnostics?: CraftDiagnostic[]   (optional → persisted-profile back-compat)
```
**Prompt SPEC** (added to `buildParagraphPrompt`, fed the KB `failureModes` digest as the diagnostic vocabulary):
```
Emit one diagnostic per craft axis that has a clear signal IN THIS PARAGRAPH.
status: present-strong | present-weak | botched. Do NOT emit "absent" — you see one
paragraph, not the essay. Every `intent` must quote the text it refers to. Cap 5/paragraph.
JSON example:
{"craftDiagnostics":[{"dimension":"restraint","status":"botched","intent":"names 'asthma' as subject 4×; should orbit via effects","evidenceSentenceIndex":1}]}
```
Persist via `applyParagraphAnalysis` (analysisOrchestrator.ts:2333, optional).
**Integration points:** profileTypes.ts (CraftDiagnostic + AnalysisPassOutput); analysisPass.ts:2473/buildParagraphPrompt:1236.
**Cost:** +~120 output tokens/paragraph ≈ **$0.002/essay** (no new call). *(Direct's "+300 tok / $0.025" over-counted; Rethink's scope-cut to present/weak/botched is the cheaper, correct shape.)*
**Verify:** asthma essay P-with-restraint → `{dimension:'restraint',status:'botched'}`; no `absent` ever emitted per-para.

---

### Item 4 — DEMOTED: availability gate + optional recall-biased pre-narrowing (NOT the selector)  *(Source: rethink filter-primary; REVISED per ADR-001)*

> **🔁 REVISED per ADR-001 (2026-06-26) — Item 4 is NO LONGER THE SELECTOR.** ADR-001 commitment #1: never let
> `Array.filter(dimensions.includes())` decide what applies. The relevance + selection + altitude decision moves
> **wholesale to the whole-essay Phase-C pass (Item 6).** What survives of Item 4:
> - **The `surfaceVsExpert` availability gate** — the ONE deterministic filter kept. Applied at compile (Item 9): a
>   `surface` digest never enters the cached block. (`m.surfaceVsExpert !== 'expert'` exclusion is legitimate — an
>   availability fact, not a relevance call.)
> - **Provenance/verified-first ordering** — retained as bookkeeping for any place two digests are otherwise
>   equivalent; it orders, it does not select.
> - **At current scale (≤150 entries): NO pre-narrowing filter at all.** The whole digest block (~7K cached tokens)
>   goes to Phase-C; the LLM sees everything. `selectMovesForDiagnostics` as specced below is **not built** for the
>   curation arm.
> - **At scale (>150 entries, the ~18-axis vision):** an OPTIONAL pre-narrowing aid MAY be added — but per ADR-001 it
>   must be a **soft semantic shortlist (Haiku over the holistic profile) that hands a generous, recall-biased pool to
>   Phase-C**, NOT a per-paragraph closed-enum tag-gate. **Hard rule:** if the pre-narrower ever returns a small set
>   that becomes the answer, the silo is back — it must over-include, never decide.
>
> **The risk ADR-001 names:** bounded noise was the filter's `slice(0,2)` guarantee; it is now a model judgment.
> Mitigation lives in Item 8 (the **≤3-applications-surfaced assertion** + **A_C anti-commoditization**) and the
> Phase-C "justify every cut" forcing-function (Item 6) — NOT in this filter.
>
> **Verify (curation arm):** with no pre-narrowing filter, a `restraint` essay still gets a restraint principle
> (Phase-C, not `.filter()`); a `surface`-tagged digest never appears (gate at Item 9 compile); the A/B harness can
> swap THIS arm (legacy `selectMovesForDiagnostics`) against the Phase-C arm and let the eval decide (ADR-001 risk clause).
>
> ---
> *Legacy filter-arm spec (retained as the A/B comparison arm; superseded as the selector):*

Retrieval today is similarity-led (claudeRetrieval.ts:276 "most relevant to this paragraph") with a post-rank filter only on voice/transferability/difficulty (:279-291) — **never dimension, never surface-suppression.**

**After** — `selectMovesForDiagnostics(diagnostics, voice)`:
```ts
for (const gap of diagnostics.filter(d => d.status !== 'present-strong')) {
  let candidates = ALL_MOVES
    .filter(m => m.dimensions.includes(gap.dimension))        // V-2: both sides DIM_MAP-normalized
    .filter(m => (m.surfaceVsExpert ?? 'expert') === 'expert')// suppression GUARANTEED, not prompt-dependent
    .filter(m => m.compatibleRegisters.includes('all') || m.compatibleRegisters.includes(voice));
  // Provenance: verified-first stable sort (Direct's discipline)
  candidates.sort((a,b) => rank(b) - rank(a));  // VERIFIED+kb > native-unsourced, ties stable
  if (candidates.length === 0) {
    if (gap.dimensionOpen) candidates = await retrieveMovesBySignal(gap.intent, {voiceRegisters:[voice]}, 5); // similarity safety net
    else continue;                                            // no surface fallback — skip
  } else if (candidates.length > 1) {
    candidates = await haikuTiebreak(candidates.map(c=>c.id), gap); // ONE Haiku call over ~5 ids, not 234
  }
  selected.push(...candidates.slice(0, /* k */ 2));
}
```
Most gaps resolve by `.filter()` ($0); ranking is demoted to an intra-dimension tiebreaker over a handful of ids (cheaper than today's 234-id rank). Surface moves *literally cannot be selected*. "Multiple options per gap" = the `candidates` array the brief later picks from.
**Integration points:** new selector in corpusRetrievalBlocks.ts; deepAnnotationService.ts:966 shifts from one essay-level `retrieveAnchorMoves` to per-gap selection.
**Cost:** ~$0.01-0.02/essay (most filter-resolved; a few tiebreakers, cached). Depends on Item 3 (diagnostic key) + Item 9 (`surfaceVsExpert`/`dimensions` on all moves).
**Verify:** a `restraint/botched` gap → KB restraint move selected by filter alone (0 ranking calls); a `surface`-tagged move never appears; `dimensionOpen` gap → similarity fallback fires.

---

### Item 5 — `MoveDimension` 8→18 + `surfaceVsExpert` on native moves  *(Source: ABSORBED into Item 9; re-tag is rethink's cheaper one-pass)*

Done in the Item 9 compile pass: the union expansion is a type edit; the 190 native moves get `{dimensions(re-tagged), surfaceVsExpert}` via a **one-time Sonnet re-tag script** (`scripts/retagNativeMoves.ts`, reads `mechanism`+`detectionSignal`+`displayName` per move). Expert definition: *"the base model does NOT reliably volunteer this"* → expert; everything it volunteers → surface (suppressed). Human spot-check, written back to `topTierCraftMoves.ts`.
**Cost:** ~$0.50-$2 one-time, **off per-essay budget**, under $5 cap. **Verify:** 40-move spot-check sample; rhythm-001-style moves no longer buried in `voice`.

---

### Item 6 — Phase C (whole-essay KB curation) + enable/render brief as the single curator  *(Source: rethink brief-owns-plethora + direct renderer; ELEVATED per ADR-001)*

> **🔁 ELEVATED per ADR-001 (2026-06-26) — this Item is now the relevance mechanism, not a bolt-on.**
> ADR-001 concentrates **selection + cross-paragraph + absent-but-available + altitude at the whole-essay layer** —
> the only layer with full sight. Item 4 no longer selects; this does. Two coupled pieces:
>
> **(A) Phase C — the curation pass (NEW; hosted in the cached L3.75 synthesis call).**
> Inject the Item-9 **principle-digest block** (whole KB, ~7K cached tokens, `surface` excluded) into the already-cached,
> already-whole-essay L3.75 synthesis call. In one pass over the full essay (NOT per-paragraph — per-para is blind to
> absence and 10× the cost), the model:
> 1. **NOTICES** where each available principle does / could apply, using the L3.5 `craftDiagnostics` **descriptive
>    leads** (Item 3) as soft context — free to surface a principle no lead tagged.
> 2. **CURATES to 2–3 applications by whole-essay impact**, with a **forcing-function: justify every cut** (this is the
>    primary noise control now that the filter's `slice(0,2)` is gone — see Item 8's ≤3 assertion + A_C).
> 3. **PLACES each by altitude:**
>    - whole-essay / cross-paragraph (incl. *absent-but-available*) → the **Executive Brief** (piece B below);
>    - paragraph / sentence → **L5**, via the existing `corpusContext` seam (analysisPass.ts:2482 → buildParagraphPrompt:1312) —
>      the SAME seam Item 3 uses, no new call.
> 4. Emits a structured `curatedApplications[]` (`{kbSourceId, altitude, placement, justification, cutReasons[]}`) —
>    `kbSourceId` carried for provenance, **never rendered**; principles PLACED into L5 ride the ordinal-remap seam (V-1).
>
> Cost: ~$0.05–0.10/essay (one whole-essay pass; reuses the existing L3.75 Sonnet call — the digest block is a cached
> prefix, so the marginal cost is the curation output tokens). **No new vocabulary join, no `.filter()` deciding
> relevance** — this is the entire ADR-001 win.
>
> **(B) Executive Brief — the surface for whole-essay-altitude curation (was: "producer of plethora").**
> Everything below (enable flag, greenfield `renderExecutiveBrief`, `dependsOn` sequencing slot, topo-sort, the plethora
> prompt) **still applies**, with one reframe: the brief no longer *originates* selection — it **renders the whole-essay /
> cross-paragraph slice of Phase-C's `curatedApplications`** (including the ≤3 absent-but-available items). The plethora
> instruction stays, but it is now Phase-C's output being surfaced, not an independent brief-time generation. The brief
> remains "never names a move or `kbSourceId`," teaches in the student's terms, and is **gated on Item 8 lift** before enable.
>
> **Verify (curation arm):** Phase-C emits ≤3 curated applications with justifications + cut-reasons; whole-essay items
> render in the brief, paragraph items reach L5 via `corpusContext`; grep student output for technique names / `kb-` →
> zero; A/B vs the legacy Item-4 arm through Item 8 shows lift with ORIGINAL held and the ≤3 assertion green.
>
> ---
> *Original Item 6 (brief renderer/sequencing details — still built; the "producer of plethora" framing is now "surface for Phase-C output"):*

The brief is the only whole-essay layer (V-3) and is dormant+unrendered (V-4). It becomes the producer of *absent-but-available* coaching.

1. **Enable + greenfield renderer.** `renderExecutiveBrief()` in `presentation/` (0 refs today), called at top of `renderStudentDocumentMarkdown.ts`, guarded by `isExecutiveBriefEnabled()` (off → renders nothing). **Never names a move or `kbSourceId`.** Topo-sorts directives by `dependsOn` (cycle → drop back-edges → rank fallback).
2. **Sequencing slot.** `ExecutiveBriefDirective` (profileTypes.ts:2920) `+ dependsOn?: number[]` (optional; validator:427 checks count only → unbroken — V-10).
3. **Plethora pass + KB scaffold** in `buildUserPrompt` (:159): inject `KB_GENERATION_FUEL[selected].mechanics` (from Item-4 selections, never `workedExample`, never named) + a plethora instruction:
```
Across the 18 craft axes, name UP TO 3 moves this essay does NOT use but could, given its
material. Teach each in the student's own terms — do NOT name the technique, do NOT reproduce
any phrasing from the private scaffold. This is the ONE place absent-but-available is produced.
```
**Integration points:** executiveBrief.ts:74 (flag), :159 (prompt), profileTypes.ts:2920 (dependsOn); new `presentation/renderExecutiveBrief.ts`; renderStudentDocumentMarkdown.ts. **Enable gated on Item 8 lift.**
**Cost:** +~$0.01-0.03/essay (one Sonnet call, exists). **Verify:** brief renders; emits ≤3 absent-but-available items; topo-sort handles a cyclic `dependsOn` without crashing; grep output for technique names → zero.

---

### Item 7 — Runtime originality constraints + ship-boundary gate  *(Source: converged; gate folded into Item 8 per rethink)*

At generation (L5 + brief), inject from `KB_GENERATION_FUEL[selected]`: `antiTemplate` + `reuse.reExpressPerUser` + `verbatimReuseOK` as **DO-NOT / DO-EXACTLY constraints** in the prompt (facts quote verbatim; framing re-expresses). The deterministic overlap + close-register variance gate lives in **Item 8 Stage 1** ($0 runtime, enforced at the ship boundary) — `antiTemplate`-style deep-structure templates survive 0.00 lexical overlap, so the variance gate (not a runtime lexical check) is the real catch. Honors the `post-sffa-001.reExpressPerUser` soil/fruit regression record.
**Cost:** $0 (prompt constraints + eval-side gate). **Verify:** a fact entry quotes its source verbatim; a restraint entry's output is lexically+structurally distinct from `workedExample.after` (Item 8 Stage 1 passes).

---

### Item 10 — Manifest re-route  *(Source: rethink — trivial post-Item-9, no new call)*

`buildImprovementManifest` (analysisOrchestrator.ts:2454) reads the already-computed `craftDiagnostics` (Item 3) → `selectMovesForDiagnostics` (Item 4) → `fuel.mechanics`/`fuel.transfer` for `technique`/`demonstration` (re-expressed, never `workedExample`). **Delete `matchClaimToTechnique` (:2874)**; keep `getTechniqueFromConsolidatedCandidates` (:2858) as preferred, KB-selection as fallback. `demonstration` is no longer hardcoded null. No new retrieval call (reuses Item-4 output). `ImprovementEntry` already has `technique`/`demonstration`/`sourceRef`.
**Cost:** ~$0 (reuses computed selections). *(Direct's "+$0.10/essay per-item demo-gen" is avoided — Rethink's reuse-the-fuel approach removes the cost hot-spot entirely.)*
**Verify:** asthma manifest entry → `technique` from restraint fuel, `demonstration` non-null & student-specific; `matchClaimToTechnique` fully removed (grep zero refs).

---

## Execution Order

> **🔁 REVISED per ADR-001 (2026-06-26) — curation-arm critical path:**
> **Item 2 → Item 8 (Stage-1 + ≤3 assertion + A_C) → Item 9 (principle-digest block) → Item 3 (descriptive leads) →
> Item 6 Phase C (whole-essay curation) → MEASURE (A/B vs legacy Item-4 arm).**
> Changes from the legacy path below: **Item 4 leaves the critical path** (it's no longer the selector — built only as
> the A/B comparison arm, if at all); **Item 6 / Phase C enters the critical path** as the relevance mechanism; **Item 9
> produces a digest block, not catalog rows** (no DIM_MAP/SUBTOPIC_MAP on the path). MEASURE is still the gate that ends
> the critical path and decides which arm ships.
>
> *Legacy filter-arm order (retained for the A/B comparison build):*

Dependency-ordered. **Critical path: Item 2 → Item 8 → Item 9 → Item 3 → Item 4** (everything else hangs off these).

| # | Item | Depends on | Verify step |
|---|------|-----------|-------------|
| 1 | **Item 2** flag fix | — | `ENABLE_CORPUS_RETRIEVAL_L5=true` fires L5; master-only still gates anchor |
| 2 | **Item 8** editorial eval (Stage 1 then Stage 2) | — | baseline-vs-baseline → null; known-good treatment → HELPFUL∧ORIGINAL pass |
| 3 | **Item 9** compile KB→corpus (absorbs 1+5) | — | hash changes; `moveById.get('kb-…')` resolves; output grep `kb-` = 0 |
| 4 | **MEASURE** first lift | 2,3 | eval with `INCLUDE_KB` on vs off → KB-on lifts, ORIGINAL holds. **Critical path ends here.** |
| 5 | **Item 3** craftDiagnostics | 9 (shared vocab) | botched/weak emitted, never `absent` per-para |
| 6 | **Item 4** selectMovesForDiagnostics | 3, 9 | filter resolves most gaps; surface never selected; open→similarity |
| 7 | **Item 6** enable+render brief+plethora | 4 (selections), 8 (lift gate) | renders; ≤3 absent items; no technique names; topo-sort safe |
| 8 | **Item 7** originality constraints | 4, 6 (consumers), 8 (gate) | verbatim facts; distinct framing |
| 9 | **Item 10** manifest re-route | 3, 4, 9 | non-null demonstration; `matchClaimToTechnique` removed |

---

## Cost Summary

| Item | One-time | Per-essay delta | Notes |
|------|----------|-----------------|-------|
| 2 flag fix | $0 | $0 | code only |
| 8 eval | $0 | $0 (off critical path) | ~$1.5/run Stage 2 residual; Stage 1 free |
| 9 compile (+1,+5) | $0 API compile; ~$0.50-$2 native re-tag | **~$0** | cache-read; ~8K-tok catalog |
| 3 craftDiagnostics | $0 | ~$0.002 | extends existing call |
| 4 selection | $0 | ~$0.01-0.02 | mostly `.filter()`; few cached tiebreakers |
| 6 brief | $0 | ~$0.01-0.03 | one existing Sonnet call |
| 7 originality | $0 | $0 | prompt constraints + eval gate |
| 10 manifest | $0 | ~$0 | reuses computed fuel |
| **Per-essay total delta** | — | **~$0.03-0.05** | well under ≤$1.50 (≤$0.85 target) |
| **One-time** | **~$0.50-$2** | — | native re-tag, off per-essay budget, under $5 cap |
| **Eval per-run** | — | — | **~$1.5/run** (residual judge), under $5 HARD CAP |

---

## Existing Infrastructure Leveraged

- **`claudeRetrieval.ts` cached catalog + ranking** (getMovesCatalog:93 / runRanking:236 / parseRanking:171 / validIds gate:187 / hydrate seam:293-305) — KB rides this verbatim via the compile (Item 9). No second store/retriever/hash.
- **Ordinal-remap label seam** (`buildCorpusMovesBlock`:445 → `detectFabricatedReferences`:573 index-range) — V-1: id-isolation for free; no `[KB-#]` extension.
- **Per-layer flag resolvers** (corpusRetrievalBlocks.ts:195-212) — Item 2 wires the bypassed ones in.
- **`corpusContext` injection seam** (analysisPass.ts:2482 → buildParagraphPrompt:1312) — Item 3 extends, no new call.
- **`AnalysisPassOutput` extension precedent** (profileTypes.ts:4274, ~10×) + OpenEnum (`…Open?:string`) — Item 3 craftDiagnostics shape.
- **`buildDescriptiveArchetypesBlock`:527** (teaching-framed, anti-evaluation invariant) — the model for any KB generation block; do NOT copy `buildCorpusMovesBlock`:431 (calibration-framed).
- **`generateExecutiveBrief`:375** + whole-essay `buildUserPrompt`:159 (reads full text + coherenceResolutions, V-3) — Item 6 adapts.
- **`run-checkpoint3-ab.ts` A/B skeleton** + `top-tier-reference/` gold + `expert-ratings.json` tiers — Item 8 extends.
- **`reviewPassages.generated.ts`** — the generated-artifact pattern Item 9's `kbGenerationTable.generated.ts` mirrors.

---

## Open Questions

1. **DIM_MAP curation (V-2).** The 12-rubric→18-MoveDimension map must be human-curated and complete; a missing key silently drops a KB dimension at compile. Mitigation: assert at compile time that every observed KB `dimensionTags` value has a DIM_MAP entry (fail the build otherwise).
2. **Native re-tag drift (Item 5).** Re-tagging 190 moves with a coarser/expanded axis risks mis-tagging `surfaceVsExpert`. Human spot-check is in the plan; sample size (40) is a guess — tighten if eval shows surface leakage.
3. **`INCLUDE_KB` build-flag granularity.** It's coarse (whole-KB on/off) vs the band's per-layer flags. Acceptable because the eval compares treatment/baseline regardless, but a per-subtopic include would help debugging. Defer unless eval needs it.
4. **Plethora cap (Item 6).** "Up to 3 absent moves" is a heuristic; whether 3 is the right ceiling for a 491-word essay vs a 650-word Common App needs the eval to tune.

---

## Rejected Approaches

- **Separate KB band (`getKbCatalog`/`{{KB}}`/`kbById`/`retrieveKbBySignal`/`[KB-#]` extension)** — Direct's GAP-1/9 Option-1. **Killed by V-1:** the band's headline advantage (id-isolation so synthetic ids never reach the model) is already delivered by the ordinal-remap seam, so the band buys a second store/retriever/hash/regex-extension for no isolation gain — *and* it can't let a verified KB move compete head-to-head against a native move (separate ranking calls). The compile (Item 9) is strictly less infra.
- **Full-hydrate-in-catalog (Option-3)** — 44 rich entries ≈ 30-50K tokens blows the Phase-B 17K cap and surfaces `workedExample` into the ranking surface (never-surface violation). Rejected by both designs; confirmed by V-7 (`workedExample.usage` is explicitly DO-NOT-SURFACE).
- **Structured-prompt-assembly (Option-2)** — re-implements ranking, loses cached-catalog economics. Rejected.
- **`absent-but-available` per-paragraph in L3.5** — Direct's GAP-3. **Killed by V-3:** a single paragraph cannot judge whole-essay absence; 10 blind per-para calls guessing global absence is both wrong and ~10× cost. Moved to the brief (Item 6), which has whole-essay sight.
- **Full-judge editorial eval (no deterministic pre-pass)** — Direct's GAP-8. Rethink's Stage-1-deterministic split carries ~70% of HELPFUL∧ORIGINAL signal for $0 and removes 30-50% of judge calls; adopted.
- **Per-item demonstration generation in the manifest (+$0.10/essay)** — Direct's GAP-10 cost hot-spot. Rethink's reuse-the-fuel approach (Item 10) gets `demonstration` from already-computed `fuel.transfer` for ~$0; adopted.
- **Rethink's bare `.filter(dimensions.includes(gap.dimension))` without DIM_MAP rigor** — **Killed by V-2:** KB tags (12-rubric) and native moves (8/18-craft) are disjoint vocabularies; the filter silently returns zero candidates cross-vocabulary. Retained Rethink's filter-primary architecture but made DIM_MAP a load-bearing, build-asserted normalizer on BOTH the corpus side and the diagnostic emit vocabulary (Items 3, 9).
