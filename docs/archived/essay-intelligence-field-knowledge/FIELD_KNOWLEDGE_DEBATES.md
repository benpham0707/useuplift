> ⚠️ ARCHIVED/SUPERSEDED (2026-06-21). Historical. Current: docs/knowledge-base/INTEGRATION_BLUEPRINT.md (architecture), README.md (KB schema/ops), essays/_MAP.md (build state).

# FIELD-KNOWLEDGE INTEGRATION — Forge Debate Record

> Compressed record of the two designs, the reality-verification that resolved the contested
> claims, and the forced-choice synthesis. Authoritative blueprint: `FIELD_KNOWLEDGE_BLUEPRINT.md`.

---

## The Two Designs (one-line each)

- **Direct (Agent A).** Add a static `rubricDimensions` cross-tag to all 190 moves via a one-time LLM
  backfill; Sonnet-distill docs/research into structured `AdvisorPrinciple` entries (~$2 one-time);
  new `retrieveMovesForDimensionGap` reading findings' holistic dims mapped to rubric; manifest enriched
  by replacing the keyword table. Thorough, structured, more one-time spend, more surfaces.
- **Rethink (Agent B).** Central reframe: five gaps are one problem — *the query text is wrong and the
  catalog is too small.* Name the weak rubric dimension as the query; Haiku judges dimension-fit at rank
  time (no table); compute one `DimensionTarget` per paragraph at L3.5 and have L5 + manifest READ it
  (one query-builder, three consumers); chunk docs/research as a passage band at build time ($0). Elegant,
  LLM-first-aligned, minimal surface — but its keystone (L3.5 can cleanly emit + persist the target) had
  to be verified before adoption.

---

## Reality-Verification Findings (what changed the plan)

| ID | Severity | Claim tested | Finding |
|----|----------|--------------|---------|
| V-1 | keystone-HOLDS | L3.5 `analyzeSingleParagraph` makes a per-para Sonnet call with extensible JSON output, persisted per-para | TRUE. `analysisPass.ts:2473`; output `AnalysisPassOutput` (`profileTypes.ts:4274`) already extended many times (Port B1/B3, D-0.16); persisted at `essayProfileManager.ts:2333-2342`. Adding `dimensionTarget` is the established pattern. Rethink keystone adopted wholesale. |
| V-2 | weak→refined | L3.5 can emit the 12-rubric enum directly | TRUE but requires a **net-new import** of `RubricDimensionName` from `core/essay/types/essay.ts:129` — essayIntelligence imports nothing from `core/essay/types` today. Rethink omitted this dependency; added to blueprint. |
| V-3 | corrects-both | findings' dimension enum | Findings carry `HolisticDimension[]` (8 values, `profileTypes.ts:211/3929`). The only holistic→rubric bridge (`teachingContentRouter.ts:258 DIMENSION_TO_RUBRIC_AFFINITY`) is lossy/string-keyed and emits non-12-enum values. → L3.5-direct emission (Rethink) is strictly cleaner; Direct's `inferRubricDimsFromObservation` bridge rejected. |
| V-4 | confirms-both | GAP-3: which functions need the gate swap | EXACTLY 2 carry `stageTag` (`retrieveAnchorMoves:263`, `retrievePhaseArchetypes:357`). `retrieveParagraphAntiPatterns` has NO stageTag → stays master-gated (no change). `isEnabledForStage` is net-new. All gates bail master-first (`:265/313/359`); telemetry passed in, so per-layer flag is a no-op today. |
| V-5 | corrects-Rethink | `buildSystemPrompt:228` takes args (Rethink) | FALSE for this file. `claudeRetrieval.ts:228 buildSystemPrompt()` takes **NO** args. Rethink conflated it with `analysisPass.ts:425 buildSystemPrompt(piq, essayType)` — a different function. Catalog-band wiring corrected. |
| V-6 | corrects-Direct/Rethink | manifest route count + null sites | `matchClaimToTechnique` has **14** routes (Rethink correct; diagnostic's 17 wrong), `:2877-2890`. `demonstration` null at `:2493/2528/2559/2587/2697` (both designs' line cites slightly off). `buildImprovementManifest` is **sync**, ONE live call at `:1432` inside async `analyzeEssay` → safe to make async. |
| V-7 | corrects-Rethink | docs/research clean `###` chunking | 4 docs exist (incl. RED_FLAGS_FOUNDATION); 106/112/44/60 `###` headings (~322 total). BUT ~27/106 CHARACTER sections are **table-led** → naive "split + skip<25w + truncate600" yields ~60-90 ugly table-fragment passages. **Table-strip guard mandatory** — added. Net clean passages ~210-240. |
| V-8 | corrects-both (safety) | detectFabricatedReferences vs `[PRIN-n]` | Regex `/\[(MOVE\|AP)-(\d+)\]/g` (`:567`). `[PRIN-n]` would be **invisible** (silent attribution hole, NOT a false positive) — a model could cite `[PRIN-99]` unflagged. Safer fix: generalize to `/\[([A-Z]+)-(\d+)\]/g` + per-kind count map (Item 6). |
| V-9 | confirms-both | catalog caching + token fit | `runRanking` caches the catalog system prompt (`cacheSystemPrompt:true :251`); catalogs memoized; `getCatalogContentHash:139` combines all bands (must add new band to BOTH it and `buildSystemPrompt`). Current catalog ~12K tok (not the doc's 6-7K); +passages +principles ≈ 31.5K → ~16% of Haiku 200K context, fits one cached prompt; NO system-prompt size cap (`RETRIEVAL_MAX_TOKENS=800` is output only). |
| V-10 | confirms-both | L5 essay-level retrieval + no per-para attribution | `retrieveAnchorMoves(essayText,…)` called ONCE (`:966`), injected once (`:970`); per-para loop + `paraRelevantContext` hook exist (`:981-1004`/`:986`); `detectFabricatedReferences` runs once essay-wide post-loop (`:1235`), NOT per-para. Per-para rewire strengthens the rail. |
| V-11 | confirms | demonstration source field | `SourceEssayCitation.excerpt` is real (`corpusTypes.ts:170`) → `sourceEssays[0].excerpt` is valid demonstration text. |

---

## Forced-Choice Synthesis (per gap)

| Gap | Decision | Rationale |
|-----|----------|-----------|
| GAP-1 (taxonomy) | **hybrid (rethink primary)** | Rank-time dimension judgment with the dim name in the query (Rethink) — LLM-first-correct, free, no drift. NO 190-tag table (Direct). Coverage-reporting value of Direct's idea kept via telemetry (Item 7). |
| GAP-2 (retrieval direction) | **rethink + refined** | Weak-dimension-name-as-query (Rethink) verified keystone-sound. Refined: 12-enum import dependency (V-2), soft voice rank-penalty 0.15 keeping the 0.4 floor. |
| GAP-3 (flag bug) | **hybrid** | Both identical and correct; verified only 2 functions need the swap (V-4). |
| GAP-4 (manifest) | **rethink + refined** | Manifest routing IS the same retrieval call (Rethink). Refined with verified lines (14 routes, null sites, sync→async one async caller, V-6). Keyword table kept as dead fallback (migration rule). |
| GAP-5 (narrow corpus) | **rethink** | Substantially resolved by GAP-6 passages; residual authoring telemetry-gated, not front-loaded. Direct's upfront Sonnet authoring rejected as guessing. |
| GAP-6 (encode docs) | **rethink + refined** | Build-time chunk-as-passage ($0, ~80% breadth) over Sonnet distillation (~$2). Refined: mandatory table-strip guard (V-7). Distillation deferred to O-3. |
| GAP-7 (registries) | **hybrid** | Both agree: bring strategy/pattern CONTENT as passages, don't merge pipelines, drop dead signals. |
| GAP-8 (RAG) | **both → Open Question O-1** | Off critical path; second demonstration source for real pairs at scale, later. |
| GAP-9 (per-span L5) | **rethink** | Dissolves into GAP-2: L5 reads L3.5's persisted `dimensionTarget` per paragraph (V-10). Teaching-framed block from Direct (Item 5). |
| GAP-10 (ingestion) | **both → Open Question O-2** | Parallel content track; rights unconfirmed (O-4). |

---

## Key Insights

1. **The keystone held.** Rethink's elegant reframe ("compute the target once at L3.5, three consumers
   read it") was the highest-risk claim. Verification confirmed L3.5 is a per-paragraph Sonnet call with
   an already-extended output schema and a clean persistence site — so the reframe is adopted wholesale,
   not weakened to a hybrid. The single refinement is a net-new `core/essay/types` import.

2. **Two designs, two complementary blind spots.** Rethink under-specified the 12-enum import (V-2),
   mis-cited `buildSystemPrompt` (V-5), and used a naive chunker (V-7). Direct over-engineered: a static
   tag table, a $2 distillation pass, and a lossy holistic→rubric bridge — all of which verification
   showed to be unnecessary or worse than the rank-time / direct-emission alternative. The blueprint takes
   Rethink's spine and Direct's teaching-block + line-level rigor.

3. **The real smoking gun is the manifest, not just the flags.** Even with retrieval fully on, the
   student-facing `buildImprovementManifest` resolved technique via a 14-route keyword table and hardcoded
   `demonstration: null` — so the corpus literally could not reach the student. Both source plans missed
   this (it surfaced in the diagnostic as GAP-4). Routing it through the same dimension-targeted call is
   what actually converts analytical depth into advisor-grade action — the stated goal.

4. **$0 critical-path one-time cost.** Chunk-as-passage eliminates the source plans' $1.50-3.05 one-time
   spend. The only one-time tokens are an optional, deferred distillation pass (O-3).

5. **A latent safety hole was found en route.** `detectFabricatedReferences` would silently miss any
   non-MOVE/AP label — generalizing it now (Item 6) is forward-safety for the passage band.
