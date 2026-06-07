# Intelligent RAG Architecture Design — Essay Intelligence

> Design proposal. Scope: corpus, taxonomy, and rubric retrieval across L1–L6. Posture: layered judicious retrieval — each layer gets exactly the research it needs.

---

## 0. Verified Asset Inventory

Counts confirmed by reading source. Where seeding-prompt counts differed, actual is reported.

| Asset | File | Count |
|---|---|---|
| Top-tier craft moves | `corpus/topTierCraftMoves.ts` | 190 |
| Move excerpts (few-shot) | `corpus/moveExcerpts.ts` | 53 |
| Essay archetypes | `corpus/essayArchetypes.ts` | 14 (10 Harvard + 4 Hopkins-reserved) |
| Voice × archetype compatibility | `corpus/voiceArchetypeCompatibility.ts` | 98 cells (7×14, exhaustive) |
| Derived move correlations | `corpus/derivedCorrelations.json` | 1,177 (666 KB) |
| Anti-archetypes | `corpus/antiArchetypes.ts` | 11 |
| Corpus limits | `corpus/corpusLimits.ts` | 53 *(prompt said 18 — actual 53)* |
| Reader-bias guards | `corpus/readerBiasGuards.ts` | 14 |
| School-fit vectors | `corpus/schoolFitVectors.ts` | 95 records / 15 schools *(prompt's "15" = schools)* |
| Contextual validity | `corpus/contextualValidity.ts` | 21 |
| Move dependencies (curated) | `corpus/moveDependencies.ts` | 12 |
| Issue pattern index | `taxonomies/issuePatternIndex.ts` | 40 PIQ + 35 CommonApp |
| Cliché library | `taxonomies/clicheLibrary.ts` | 500 phrases *(server-side only, re-exported from `semanticClicheAnalyzer.ts`)* |
| PIQ rubric | `rubrics/piqRubric.ts` | 13 dimensions |
| Authenticity tiers | `rubrics/authenticityTiers.ts` | 4 (distinctive/authentic/emerging/manufactured) |
| Calibration corpus | `tests/calibration/top-tier-reference/essays/` | 14 essays *(prompt said "Harvard-10" — actual 14)* |

Flags: master `ENABLE_CORPUS_RETRIEVAL_L35`; per-layer `_L3`, `_L375`, `_L4`, `_L5`, `_L6`. L6 opt-in only (master does not flip it). Source: `analysis/corpusRetrievalBlocks.ts:175-212`. All paths relative to `src/services/essayIntelligence/`.

---

## 1. Current-State Research-Utilization Matrix

Rows = research assets. Columns = layers. Cell = question this asset answers at that layer. `(filled)` = wired today; `(should)` = empty but justified; `(wrong)` = wired by the wrong asset. Empty cells are intentional.

| Asset | L1 | L2 | L2.5 | L3 | L3.75 | L3.5 | L4 | L5 | L6 |
|---|---|---|---|---|---|---|---|---|---|
| Craft moves (190) | — | — | — | — | — | "Which moves does this paragraph attempt?" `(filled, anchor + per-paragraph)` | "Anchor crystallization to corpus moves" `(filled)` | "Cite [MOVE-#] when teaching" `(should)` | "Show 3 alternative moves on demand" `(should, on-demand only)` |
| Move excerpts (53 few-shot) | — | — | — | — | — | "Calibrate score bands with worked examples" `(should — currently absent)` | — | "Show, don't tell, when student asks 'what would great look like?'" `(should)` | — |
| Essay archetypes (14) | — | "Provisional structural family" `(should — descriptive only)` | — | "Descriptive context — what family is this in?" `(filled, descriptive block)` | "Phase boundary calibration" `(filled)` | "Phase boundary calibration" `(filled, via phaseAssessment.ts:478)` | "Pattern alignment in crystallization" `(filled, crystallizer.ts:2102)` | — | "When student asks 'what kind of essay is this?'" `(should)` |
| Voice × archetype 98-cell matrix | — | — | — | — | "Voice fit check — flag forbidden combos" `(should)` | — | — | "Refuse to suggest forbidden archetypes" `(should — load-bearing)` | "Coaching safety rail — never suggest forbidden archetype" `(should — load-bearing)` |
| Derived correlations (1,177) | — | — | — | — | — | — | — | "When student is about to attempt move X, surface its dependencies" `(should — dormant)` | "On-demand 'what do I need to land this move?'" `(should)` |
| Anti-archetypes (11) | — | — | — | — | — | "Failure-mode detection per paragraph" `(filled, similarity-gated)` | — | "Cite [AP-#] in weakness teaching" `(filled, attribution test)` | — |
| Corpus limits (53) | — | — | — | — | "When does the corpus NOT cover this essay's territory?" `(should — dormant)` | — | "Refuse to teach what corpus can't anchor" `(should — load-bearing)` | "Refuse to extrapolate beyond corpus" `(should — load-bearing)` |
| Reader-bias guards (14) | — | — | — | — | — | "Does my interpretation rest on a stereotype?" `(should)` | "Strip out scoring deltas attributable to stereotype reading" `(should)` | "Don't teach 'lean into your culture'-style guidance unbidden" `(should — load-bearing)` | "Refuse stereotype-coded probes" `(should)` |
| School-fit vectors (95) | — | — | — | — | — | — | — | "When student names a target school" `(should — on-demand only)` | "On-demand school-specific framing" `(should — on-demand only)` |
| Contextual validity (21) | — | — | — | — | "Does the corpus apply to this voice/topic combo?" `(should — dormant)` | — | — | "Soften teaching when corpus validity is low for this essay" `(should)` | — |
| Move dependencies (12 curated) | — | — | — | — | — | "Pre-warn when paragraph attempts move with unmet deps" `(should)` | — | "Teach the dependency, not just the move" `(should)` | — |
| Issue patterns (75) | — | — | — | — | — | "Recognize → emit `patternId` + quoted evidence" `(filled — Port B1 catalog)` | — | "Resolve `patternId` → fix template at L5" `(filled — server-side resolve)` | — |
| Cliché library (500) | — | — | — | — | — | "Anchor cliché-band scores" `(filled via Port F1 — anchors only, no list injection)` | — | "Resolve cliché category for explanation" `(filled — server-side)` | — |
| PIQ rubric (13 dim) | — | — | — | — | — | "Score per dimension when essayType=piq" `(filled — Port A3, gated)` | "Anchor crystallization per dim" `(filled)` | "Per-dim feedback when piq" `(filled)` | — |
| Authenticity tiers (4) | — | — | — | — | — | "Bimodal authenticity signal" `(filled — Port B3)` | — | — | — |
| Calibration corpus (14 essays) | — | — | — | — | — | "Worked few-shot for top-band scoring" `(should — currently no few-shot in L3.5 prompts)` | — | — | — |

Observations:

- L1/L2/L2.5 are correctly empty — corpus injection would break their descriptive contract.
- L3 has one block (descriptive archetypes via `buildDescriptiveArchetypesBlock`, `corpusRetrievalBlocks.ts:527`); evaluative vocabulary is stripped by design.
- L3.5 is the densest consumer and the only place evaluative blocks are appropriate.
- L5 has the largest gap — annotations are where corpus citations help students most; most cells are `(should)`.
- L6 is highest-risk: ~1.8s/turn retrieval cost. Every L6 cell must be on-demand.
- Eight dormant assets carry the highest-leverage unrealized signal: voice×archetype matrix, 1,177 correlations, corpus limits, reader-bias guards, school-fit vectors, contextual validity, curated move dependencies, calibration few-shots.

---

## 2. Target-State Architecture

```
                 ┌────────────────────────────────────────────────────┐
                 │           Essay Intelligence Pipeline              │
                 └────────────────────────────────────────────────────┘

   profile                                                       profile
     │                                                              ▲
     ▼                                                              │
 ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐
 │  L1   │→ │  L2   │→ │ L2.5  │→ │  L3   │→ │ L3.75 │→ │ L3.5  │→ │  L4   │→ │  L5   │
 │ desc  │  │ struct│  │ scout │  │ walk  │  │ synth │  │analyze│  │crystal│  │feedbk │
 └───┬───┘  └───┬───┘  └───┬───┘  └───┬───┘  └───┬───┘  └───┬───┘  └───┬───┘  └───┬───┘
     │ no       │ no       │ no       │ desc-    │ desc-    │ eval-    │ eval-    │ eval-
     │ research │ research │ research │ only     │ only     │ heavy    │ medium   │ heavy
     │          │          │          │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼          ▼          ▼          ▼
                              ┌───────────────────────────────────┐         ┌───────┐
                              │     researchRouter (proposed)      │         │  L6   │
                              │  ┌─────────────────────────────┐   │←────────│ coach │
                              │  │ priority resolver:          │   │ on-demand└───────┘
                              │  │  - always (rubrics, tiers)  │   │ only
                              │  │  - layer-essential          │   │
                              │  │  - profile-conditioned      │   │
                              │  │  - on-demand (L6, L5/school)│   │
                              │  └────────────┬────────────────┘   │
                              │               ▼                    │
                              │  ┌─────────────────────────────┐   │
                              │  │ retrieval mechanism dispatch│   │
                              │  │  - cached-catalog (default) │   │
                              │  │  - BM25 → Haiku rerank      │   │
                              │  │  - direct lookup (rubrics)  │   │
                              │  │  - profile-keyed (cliche)   │   │
                              │  └────────────┬────────────────┘   │
                              │               ▼                    │
                              │  ┌─────────────────────────────┐   │
                              │  │ block builder + budget check│   │
                              │  │  - per-layer cap            │   │
                              │  │  - similarity threshold     │   │
                              │  │  - mutual exclusion         │   │
                              │  └────────────┬────────────────┘   │
                              │               ▼                    │
                              │     telemetry + attribution        │
                              │     (ID labels, fabrication scan)  │
                              └───────────────────────────────────┘

 Profile fields drive retrieval queries:
   voice.register, narrativeStrategy.arcType, thematicArchitecture.centralThesis,
   essayType, piqPromptType, authenticityTier (post-L3.5)
```

The researchRouter is a **sibling** to profileRouter, not a part of it (see §3). Both produce blocks for the same prompt assembler; they compete for token budget under a single prompt-cap policy.

---

## 3. Budget and Priority Framework

**Decision: researchRouter is a separate component from profileRouter.** Rationale:
1. **Different sources of truth.** profileRouter routes student-derived data (paragraphs, connections, voice). researchRouter routes corpus-derived data. Conflating couples profile-shape changes to corpus-shape changes.
2. **Different retrieval mechanics.** Profile is in-process O(1); corpus is async, network-bound, cacheable. One router forces either slow-path profile lookups or sync corpus lookups (defeats cached-catalog).
3. **Different versioning cadence.** Profile evolves with pipeline; corpus evolves with calibration cycles. Coupled versioning forces every prompt to invalidate on every corpus update.

They meet at the prompt assembler. Both produce typed `Block` objects with `tokenEstimate` and `priority`. The assembler runs a single budget pass over the union.

**Priority taxonomy** (extends profileRouter's `'always' | 'connection_driven' | 'proximity' | 'nice_to_have'`):

| Priority | Examples | Behavior under budget pressure |
|---|---|---|
| `always` | PIQ rubric (when essayType=piq), authenticity tiers (L3.5) | Never dropped. Fail the call rather than drop. |
| `layer_essential` | descriptive archetypes (L3), anti-patterns (L3.5 weak paragraphs), anchor moves (L3.5 strong paragraphs) | Drop only if both `always` blocks already at cap. |
| `profile_conditioned` | voice×archetype guards (when voice and archetype both confidently set), corpus limits (when essay topic outside corpus span) | Drop ahead of `layer_essential` if budget tight. |
| `on_demand` | school-fit vectors, move dependencies for a specific attempted move, calibration few-shot exemplars | Only retrieved when triggering condition fires. |

**Token budget allocation when everything is live** (per-layer cap; profile context already consumes the per-rule base from `RULE_BASE_BUDGETS` in `profileRouter.ts:193`):

| Layer | Profile budget (existing) | Research cap (proposed) | Notes |
|---|---|---|---|
| L3 walk | 8,000 | 1,200 | Descriptive archetypes only. Strict cap — L3 cache prefix is the most valuable cache. |
| L3.75 synthesis (iter 0) | 8,000 | 2,000 | Archetypes + corpus limits. **Precondition**: Phase B truncation fix lands first. |
| L3.75 synthesis (iter 1+) | 14,000 | 0 | Convergence iterations get no fresh research — they refine existing understanding only. |
| L3.5 analysis | 8,000 | 4,000 | Anchor moves + anti-patterns + rubric anchors. The densest layer; widest cap. |
| L4 crystallization | 8,000 | 1,500 | Archetype + anchor moves only. |
| L5 feedback | 8,000 | 2,500 | Citations of L3.5-injected blocks; one new retrieval (calibration few-shot for the highest-priority issue) max. |
| L6 coaching | 4,000–8,000 | 800 | On-demand only; never eager. |

**Budget arbitration.** Assembler sums `tokenEstimate` across blocks. If ≤ `TOKEN_BUDGET_HARD_CAP` (16,000, `profileRouter.ts:213`), emit all; else drop in reverse priority (`on_demand` → `profile_conditioned` → `layer_essential`). `always` blocks are never dropped — call fails fast instead. Dropped names recorded in `droppedSections` (mirrors `AssembledProfileContext`). The 10,000-token L3.75 Phase B output cap is a separate output-side limit and is the current blocker for rollout.

---

## 4. Per-Layer RAG Strategy

For each layer: research benefit, forbidden assets, retrieval trigger, token budget, cache strategy, failure mode, injection site.

**L1 / L2 / L2.5** — Forbidden across the board. L1's contract is "notice, don't judge"; L2 maps structure; L2.5 scouts forward leads in the student's text. Any corpus injection would push these layers toward judgment, breaking the descriptive contract. Trigger: never. Budget: 0. Verified: `analysisOrchestrator.ts` does not import `corpusRetrievalBlocks` for these layers.

**L3 — Sequential deep walk** (`sequentialDeepWalk.ts:567-574`).
Benefits: descriptive archetype block (filled). Forbidden: anti-patterns, rubric anchors, authenticity tiers, evaluative voice×archetype matrix. Trigger: eager, once per essay. Budget: 1,200 via `buildDescriptiveArchetypesBlock`. Cache key: `(centralThesis + primaryStrategy + arcType)` hash. Failure: empty block, walk continues. Today's L3 cache prefix is unstable (~23% hit) — fix is a precondition.

**L3.75 — Holistic synthesis** (`holisticSynthesis.ts:1926-1933`).
Benefits: descriptive archetype (filled), corpus limits, contextual validity. Forbidden: anti-patterns, rubric anchors — judgment lives in L3.5. Trigger: eager iter 0 only; iter 1+ refines existing understanding with no fresh research. Budget: 2,000 iter 0; 0 iter 1+. Cache: archetype on thesis/strategy hash; corpus-limits on `(essayType, voice.register, primaryTheme)`. Failure: empty. **Critical precondition**: the iter_1 prompt regression at lines 784-795 (62.5% premature convergence) and the 10,000-token Phase B truncation (~25% drop rate) must be fixed before any research expansion here — adding 2,000 retrieval tokens to a layer that already truncates is a quality regression.

**L3.5 — Analysis pass** (`analysisPass.ts:1957`, `:2036`).
Benefits: anchor moves (filled), anti-patterns (filled), PIQ rubric (Port A3, conditional), authenticity tiers (Port B3), issue patterns (Port B1), cliché anchors (Port F1), voice×archetype guard (proposed), reader-bias guards (proposed), calibration few-shots (proposed; largest gap). Forbidden: descriptive-only blocks; full cliché list (`clicheLibrary.ts:11-14` Rule 4). Trigger: eager anchor + per-paragraph anti-patterns; conditional for rubrics/tiers/voice×archetype. Budget: 4,000 total — 1,200 anchor moves, 600 anti-patterns per paragraph (similarity-gated, often empty), 600 PIQ rubric, 400 authenticity, 600 issue patterns, 600 voice×archetype. Cache: catalog-shape blocks live in cached system prefix; per-paragraph anti-patterns are user-message-only (cannot cache); anchor moves cache on `(thesis hash + voice register)`. Failure: empty per block; baseline quality preserved.

**L4 — Crystallizer** (`crystallizer.ts:2094-2112`).
Benefits: archetype + anchor moves (filled). Forbidden: anti-patterns (consumed at L3.5), per-paragraph retrievals (L4 is essay-level). Trigger: eager, single pair. Budget: 1,500. Cache: same keys as L3.5 anchor moves; reuse the result if hit. Failure: empty.

**L5 — Feedback** (`l5ManifestMerger.ts` and surrounding assemblers).
Benefits: citation of L3.5-injected blocks (no re-retrieval); one on-demand calibration few-shot for the top-priority issue; voice×archetype refusal; corpus limits to silence teaching outside corpus span. Forbidden: re-retrieving anchor moves and anti-patterns — L5 consumes `corpusTelemetry.attribution` and resolves `[MOVE-#] / [AP-#]` labels server-side. Trigger: hybrid (citation automatic; few-shot on-demand). Budget: 2,500 — 1,500 few-shot, 600 voice×archetype refusal, 400 corpus limits. Cache: few-shots indexed by `(dimension, score band)`. Failure: degrade to citation-only. Today this layer is the largest gap; propose extending `l5ManifestMerger.ts` to consume telemetry attribution.

**L6 — Coaching** (`coachingService.ts:2636`).
Benefits: on-demand retrieval keyed to student question — archetype lookup, calibration few-shot, voice×archetype guard. Forbidden: eager retrieval, multi-asset retrieval per turn (one Haiku call per turn max). Trigger: on-demand. Detection: message-classifier (Haiku) emits a `retrievalIntent`; coaching dispatches at most one retrieval. Budget: 800. Cache: archetype + voice×archetype aggressive (essay-stable); few-shots by `(dim, band)`. Failure: silent degrade. Master flag does **not** flip L6 (`corpusRetrievalBlocks.ts:209-212`) — explicit `ENABLE_CORPUS_RETRIEVAL_L6=true` only.

---

## 5. Retrieval Mechanism Comparison

Per asset shape, pick the cheapest mechanism that meets quality.

| Asset shape | Mechanism | Why |
|---|---|---|
| Closed catalog ≤ 200 entries, semantic match needed (craft moves, anti-patterns, archetypes) | **Cached-catalog Haiku** (today's `claudeRetrieval.ts`) | Catalog fits in cached system prompt; per-call user message is the query. No vector index to maintain. Already proven. |
| Larger catalog (cliché library = 500 phrases, 1,177 derived correlations) | **BM25 pre-filter → Haiku rerank** | BM25 narrows 1,177 → top-20 cheaply; Haiku reranks for true semantic match. Avoids loading 666KB JSON into Haiku context. |
| Direct lookup by ID (rubric dimension by name, archetype by id, patternId resolution at L5) | **Direct in-process lookup** | No retrieval — pure indexed map. Owns the source-of-truth resolution path (`patternId` → fix template). |
| Calibration few-shot exemplars (14 essays × per-dim score bands) | **Direct lookup, profile-keyed** | Index by `(essayType, dim, scoreBand)`. ≤200 keys total. No semantic search needed. |
| Voice×archetype matrix (98 cells) | **Direct lookup, profile-keyed** | Two-key lookup: `(voice.register, archetype.id)`. Inject only the rows for the active voice. |
| Future: pgvector | Reject for now | We have no pgvector infra in `essayIntelligence/`. The cached-catalog approach already meets quality and avoids a new dependency. Revisit if catalog passes ~500 entries per asset and Haiku rerank latency becomes the bottleneck. |

**Hybrid case**: school-fit vectors (95 entries across 15 schools). Direct lookup by `(school.id)` returns ~6 records per school; if the student names multiple schools, BM25 across the union gives a stable ordering.

---

## 6. Anti-Contamination Guards

1. **Per-layer hard token caps** (§3). Enforced at the assembler, not at retrieval.
2. **Similarity thresholds**. Anti-patterns `> 0.5` (`corpusRetrievalBlocks.ts:64`); anchor moves `> 0.6` proposed. Below threshold → empty, not weak.
3. **Dependency-cluster mutual exclusion**. The 1,177 correlations form transitive chains. When triggering on attempted move M, inject M's direct dependencies only (depth 1, max 3).
4. **LLM-side "ignore irrelevant research" out clause** in every block. Today's anti-pattern block does this via the similarity-in-label pattern (`AP-1] (match confidence: 0.62)`); extend to all blocks.
5. **Attribution fabrication detector**. `detectFabricatedReferences` (`corpusRetrievalBlocks.ts:560`) scans for labels not in the injected set. Extend to all label families (`[ARCH-#]`, `[PATTERN-#]`, `[CLICHE-#]`, `[FEW-#]`). Target: 0%.
6. **Block-version stamping** via `withPromptBlockVersion(...)` (`piqRubric.ts` pattern); cache invalidation is automatic.
7. **No regex / `.includes()` downstream of LLM injection.** Cliché library is canonical: server-side list, anchor-only injection. Any large phrase/pattern catalog follows the same pattern.

---

## 7. P-Problem Integration

How the RAG addresses each of the five critical problems from `WRITING_SYSTEM_DEEP_RESEARCH_SYNTHESIS.md`.

### P0 — Fabricated Metrics (Integrity)

RAG is adjacent, not the primary fix. P0's primary fix is ground-truth from Conversator (essay facts the student actually stated) plus `[bracketed]` placeholders in rewrites. Research's role is pedagogy: when the system teaches specificity, the calibration few-shot demonstrates real admissions-essay specificity ("[FEW-3] from Sondheim shows what specific looks like — your turn"). Ground-truth is the gating signal; corpus is the demonstration.

### P1 — Learned Helplessness

Research is load-bearing here. The "here are 3 ways other students handled this — which resonates? now you write it" flow: L5 detects a weak opening (anchor-move match confidence < 0.4), researchRouter retrieves 3 archetype openings of similar voice register, coaching mode emits them as references and asks the student to write theirs. Invariant: corpus is the example, student is the writer. The system never auto-rewrites in coaching mode. Research enables *showing* rather than *doing*.

### P2 — Feedback Overload

Research is the **ranking mechanism** that produces the "3 things to focus on" set. Without research, ranking falls back to score deltas, which over-weight small numerical issues. With research: anti-pattern match (high similarity) is a strong "this matters" signal; unmet move-dependency chain is a strong "fix this first" signal; issues without corpus anchor are de-prioritized — they may be right, but we can't show what better looks like, so the student can't act. L5 emits top-3; position 4+ holds for next revision.

### P3 — Score-Centric UX

Research **reframes scores qualitatively**. Instead of `Voice: 7.2/10`, feedback cites: *"Your voice is in the 'plain register' family — see Sondheim and Skatepark for what plain voice does well. Corpus shows plain voice can carry sophisticated ideas; the trade-off is that imagery has to do more work because the prose isn't reaching for effect."* Score moves to a tooltip; the qualitative framing is the headline. The 14-essay calibration corpus is the reference set.

### P4 — Scoring Miscalibration

Research **extends Port G3's anchor pattern**. Anchors today: cliché bands (Port F1), authenticity tiers (Port B3), PIQ rubric per-dim (Port A3). Dimensions lacking corpus anchors (auditable from `analysisPass.ts` block construction): hook effectiveness, ending effectiveness, voice consistency (non-PIQ path), thematic depth, specificity / show-not-tell (positive band only — cliché library covers negative), narrative arc completeness per band. Each gets a calibration few-shot block: *"Band 80-90 looks like [FEW-2] from Skatepark; band 60-70 looks like [FEW-7]. Place this essay between."* The 14-essay corpus has per-paragraph annotations to source these (`tests/calibration/top-tier-reference/ratings/close-reading-rationale.json`).

---

## 8. Corpus Flag Flip Sequence

Phase B truncation gates everything. Once fixed, rollout proceeds one layer at a time with a 24-hour observation window between flips.

**Pre-condition gate** (all green before any flip): L3.75 iter_1 convergence ≤ 15% (today: 62.5%); L3.75 Phase B truncation ≤ 1% (today: ~25%); L3 walk cache prefix hit ≥ 60% (today: ~23%); L5 sharedContext cached.

**Flip order** (per-layer override true; master stays false until step 4):
1. `ENABLE_CORPUS_RETRIEVAL_L3=true` — lowest risk: descriptive only, ~1,200 tokens, no scoring impact.
2. `ENABLE_CORPUS_RETRIEVAL_L4=true` — essay-level, deterministic-shaped; validates surface before exposing L3.5 fan-out.
3. `ENABLE_CORPUS_RETRIEVAL_L375=true` — synthesis. Phase B fix must already be live.
4. `ENABLE_CORPUS_RETRIEVAL_L35=true` — master. Activates L3.5 anchor + per-paragraph anti-pattern AND falls through as default for unset layer flags.
5. L5 wiring (new path, §4) gated behind `ENABLE_CORPUS_FEEDBACK_L5=true`.
6. `ENABLE_CORPUS_RETRIEVAL_L6=true` — explicit opt-in only; last because coaching latency is interactive.

**Observability per flip**: `corpusBlockTokens` p50/p95 within budget; `fallbacksTriggered` ≤ 10%; `attribution.fabricatedReferences` = 0; no regression in §11 primary signals.

**Rollback triggers** (any one auto-flips off): fabricated-reference > 0 in any 1-hour window; p95 retrieval > layer timeout; p95 layer wall-clock + 30%; cache hit drops below baseline.

---

## 9. Dormant Asset Prioritized Rollout

Ranked by `(integration cost⁻¹) × (quality impact)`. Integration cost is days of work; quality impact is the size of the gap closed.

| Rank | Asset | Layer | Block size | Cost | Impact | Order |
|---|---|---|---|---|---|---|
| 1 | Calibration few-shot exemplars (14 essays, per-dim bands) | L3.5 (cached system prefix), L5 (on-demand) | 800 tokens cached + 600 per use | Low: data exists in `tests/calibration/top-tier-reference/ratings/` | Highest: directly addresses P4 (miscalibration) | First |
| 2 | Voice×archetype matrix (98 cells, profile-keyed) | L3.5 (guard), L5 (refusal), L6 (coaching safety) | 600 tokens (rows for active voice only) | Low: file is shipped, just needs wiring | High: prevents coaching malpractice (forbidden archetype suggestions) | Second |
| 3 | Reader-bias guards (14) | L3.5 (interpretation check), L5 (don't-teach-stereotype) | 400 tokens | Low: file shipped | High but bounded: addresses an integrity gap | Third |
| 4 | Corpus limits (53) | L3.75 + L5 + L6 (refuse to extrapolate) | 500 tokens | Low: file shipped | Medium: prevents teaching outside corpus span | Fourth |
| 5 | Contextual validity (21) | L3.75 (validity check), L5 (soften when low) | 400 tokens | Low: file shipped | Medium: calibrates confidence in teaching | Fifth |
| 6 | Curated move dependencies (12) | L3.5 + L5 (teach the dep, not just the move) | 600 tokens (depth-1 for active moves only) | Medium: needs trigger logic | Medium-High: changes the teaching shape from "do X" to "to do X you need Y first" | Sixth |
| 7 | Derived correlations (1,177) | L5 + L6 (on-demand only, BM25 + Haiku rerank) | 400 tokens per query | High: needs BM25 infra | Medium: power-user surface | Last |
| 8 | School-fit vectors (95 entries / 15 schools) | L5 + L6 (on-demand when student names target school) | 600 tokens | Low: file shipped | Low-Medium: only fires when student volunteers school | When student-journey work needs it |
| 9 | Cliché library (500 phrases, full list) | Stays server-side. **Do not change.** | n/a | n/a | Negative: injection violates LLM-first Rule 4 | Never |

The cliché library staying server-side is intentional and correct. Anchors only at the LLM layer; phrase-level resolution is server-side.

---

## 10. Extensibility Model

Schema invariants (any new asset): stable `id`, `provenance` (source essay/paragraph, rating date, rater tier — Hopkins-pending vs Harvard-attested), `corpusVersion` string. Block builders embed the version via `withPromptBlockVersion(...)` (`piqRubric.ts` pattern). Appends are always safe; mutations require version bump.

Backfill (Harvard-10 v2 example): new essays land in `tests/calibration/top-tier-reference/essays/`; close-reading rationale in `ratings/close-reading-rationale.json`; derived assets recomputed (archetype membership, anchor moves, voice×archetype rows, few-shot bands); `corpusVersion` and block-version strings bump; cache invalidates on next request. Rollout gated by §8's observability gates.

Quality gate: provenance present; descriptive-contract lint passes (no evaluative vocabulary in descriptive blocks); calibration delta vs prior version measured via Wave-3a A/B harness (§11) — new version must be no worse on any dimension; Hopkins-reserved entries follow conservative-fit convention (no `native` on unverified combos — `voiceArchetypeCompatibility.ts:24-27`).

---

## 11. Measurement Plan

A/B research-on vs research-off on `tests/output/checkpoint3/` fixtures. Per fixture, run the pipeline twice (per-layer flag off vs on) and compare:

| Signal | Source | Target |
|---|---|---|
| Fabricated-reference rate | `attribution.fabricatedReferences.length` | 0 |
| Block-token cost (p50, p95) | `corpusBlockTokens` | within §3 budgets |
| Retrieval latency (p50, p95) | Σ `attempts[].latencyMs` | < `RETRIEVAL_TIMEOUT_MS` (8s) |
| Fallback rate | `fallbacksTriggered.length / attempts.length` | < 10% per layer |
| L3.75 iter convergence | premature-convergence rate | iter_1 ≤ 15% |
| L3.5 score consistency (P4) | dim-score variance across re-runs | ≥ 20% reduction with few-shots active |
| L5 citation rate | fraction of feedback citing a corpus label | ≥ 60% in research-on runs |
| Cache prefix hit rate | Anthropic cache stats per layer | L3 ≥ 60%; L3.5 ≥ 70%; L4 ≥ 70% |

Retrieval-quality signal: 50-query labeled set per asset (gold = right archetype/move/pattern); measure precision@k, recall@k of `claudeRetrieval.ts`; re-run on every `corpusVersion` bump.

Out of reach: student outcomes (essays shipped, schools admitted) are downstream and confounded. Track but never gate flag-flips on them.

---

## 12. Anti-Patterns Forbidden by Design

1. **Full-catalog injection into every prompt.** Every consumer pulls a retrieved subset; the catalog lives in `claudeRetrieval.ts` cached system prompt, not in downstream prompts.
2. **High-N per-paragraph retrievals.** Anchor moves cap at 3, anti-patterns at 2. More results dilute signal — the LLM ignores them and net quality drops.
3. **Multiple retrievals per layer.** Per-call counts: L3=1, L3.75=1 (iter 0 only), L3.5=1 anchor + 1 per non-anchor paragraph (gated), L4=2, L5≤1, L6≤1/turn.
4. **Corpus injection into descriptive layers** (L1, L2, L2.5, L3 walk-judgment, L3.75 synthesis-judgment). L3 enforces via `buildDescriptiveArchetypesBlock`'s stripped vocabulary; extend the descriptive-contract lint to all descriptive blocks.
5. **Regex / `.includes()` matching downstream of LLM injection.** Cliché library demonstrates the alternative: list stays server-side, anchors only enter LLM context, LLM emits `patternId`, server resolves to template.
6. **Re-retrieval at L4/L5 of L3.5 results.** L5 consumes `corpusTelemetry.attribution`; L4 reuses cached anchor moves.
7. **Eager retrieval at L6.** Fires only on classifier-emitted `retrievalIntent`.
8. **Soft caps with no enforcement.** Every cap is assembler-enforced; over-budget blocks are truncated *before* prompt composition.
9. **Closed taxonomies for LLM-perceived slots.** `VoiceRegister` is closed because the corpus is closed; new perceived slots stay free-text (`patternId` *or* `open: "..."`).

---

## 13. Interaction with Conversator ↔ Analysis Design

Ground-truth (Conversator-collected essay facts) and research (corpus) are **adjacent channels, not overlapping**. They feed the same prompts but answer different questions.

| Question | Channel |
|---|---|
| What did the student claim happened? | Ground-truth |
| Has this kind of essay been done well before, and how? | Research |
| Should we suggest specific numbers? | Research (specific = strong) |
| Are these specific numbers true? | Ground-truth |
| What archetype fits this voice? | Research (voice×archetype) |
| Did the student's voice show up in the session? | Ground-truth |

Where they meet: **fabricated-metric detection** uses ground-truth as gating signal, research provides the pedagogy (few-shot showing specificity done right); **voice fit check** crosses ground-truth voice profile against the matrix; **authenticity** cross-validates Conversator emotional fluency with L3.5 authenticity tier.

Separation: ground-truth lives on `EssayProfile.conversatorContext` (name TBD by Conversator integration design); research lives on retrieved blocks; neither writes to the other. The prompt assembler reads both and composes. Each channel tests in isolation.

---

## 14. Open Questions for Tue

1. **L3.5 cache prefix growth.** Calibration few-shots (~800) + voice×archetype guard (~600) add ~1.4K to the cached system prefix. Acceptable, or do we require a trim elsewhere?
2. **L3 cache prefix stability fix ownership.** Precondition for L3 expansion — does this sit in cost-cutting work or in research rollout?
3. **L5 flag naming.** Propose `ENABLE_CORPUS_FEEDBACK_L5` distinct from master, or fold under master via the default-fall-through pattern?
4. **School-fit confidentiality.** Some entries may encode IEC-style intelligence. Surface all 15 schools to coaching, or tier-gate?
5. **Few-shot generation.** Hand-curate from existing close-reading rationale, or one-shot Sonnet pass over 14 essays to extract per-dim per-band exemplars (faster but adds a corpus pre-processing step on every Harvard-10 v2 update)?
6. **L6 latency budget.** ~1.8s/turn; absorbable in interactive turns, or do we need streaming-first with late citation?
7. **Hopkins-reserved archetype rollout.** 4 of 14 are provisional. Surface in L5/L6 with a confidence tag, or hold until reviews land?

---

## Top-3 Architectural Risks + Mitigations

1. **Risk: corpus injection masks profile-context regressions.** If we add tokens at L3.5 and the layer also has profile context bugs, attribution becomes ambiguous.
   *Mitigation*: every flag-flip A/B holds profile rule fixed; fixture-based regression tests run pre- and post-flip.
2. **Risk: cache prefix bloat from cumulative research blocks.** Each layer's cached system prefix grows with each new asset. At ~3-4 added blocks per layer the prefix can exceed 8K and cache-hit value drops.
   *Mitigation*: per-layer cached-prefix budget enforced at the block builder; new blocks must declare cached vs per-call. `attribution`-side blocks (per-paragraph) are never cached — they go in the user message.
3. **Risk: fabricated references at scale.** The attribution test catches `[MOVE-#]` / `[AP-#]` today; new label families need extension. A regression here is an integrity issue (per P0's logic).
   *Mitigation*: extend `detectFabricatedReferences` to all label families simultaneously with each new block; any non-zero rate triggers automatic rollback.

## Top-3 Highest-ROI First Steps

1. **Land Phase B truncation fix + iter_1 convergence fix** (precondition for everything at L3.75). Without this, L3.75 research expansion is a quality regression.
2. **Calibration few-shots at L3.5 (Asset Rank #1)**. Directly addresses P4 (miscalibration). Data exists in `tests/calibration/top-tier-reference/ratings/`. Cached prefix cost ~800 tokens. Largest expected score-consistency improvement per token spent.
3. **Voice×archetype guard at L5/L6 (Asset Rank #2)**. The lowest-cost coaching-malpractice prevention available — file is shipped, wiring is direct lookup, prevents the highest-severity coaching error class (suggesting a forbidden archetype to a student whose voice cannot execute it).
