# Annotation Pipeline V2 — Unified Decision Record

> Resolves all conflicts across 4 rounds of research (40 agents).
> These decisions are FINAL and authoritative for implementation.
>
> **Inputs:** R1 gap analysis, Master Plan (R1+R2 synthesis), R3 code verification, R4 innovation synthesis, Registry Designs, V1 pipeline code.
>
> **Product owner pre-decision:** Dimension restructuring 13 -> 10 is CONFIRMED.

---

## Decision 1: Build Sequence — Reconciled 6-Layer with 4-Phase Waves

**Conflict:**
- Master Plan proposes a 4-phase build (Foundation -> Deep Analysis -> Registry -> Performance), each with lettered waves (1A, 1B, etc.)
- R4 foundation-architect proposes a 6-layer Cathedral build (Measurement -> Intelligence Core -> Deep Understanding -> Knowledge -> Experience -> Learning), with the principle "you can't improve what you can't measure"

**Decision:** Adopt R4's 6-layer sequencing philosophy, but use Master Plan's wave lettering within each layer for task granularity. Layer 0 (Measurement) is added as a new prerequisite before the Master Plan's Phase 1.

**Reconciled sequence:**

| Layer | Name | Master Plan Equivalent | Key Deliverables |
|-------|------|----------------------|-----------------|
| **0** | Measurement Foundation | NEW (not in Master Plan) | 10 calibration essays, expert ratings, quality scorer, baseline.json |
| **1** | Intelligence Core | Phase 1 (Waves 1A-1D) | Types, score calibration, prompt enhancements, craft features, dimension restructuring (13->10) |
| **2** | Deep Understanding | Phase 2 (Waves 2A-2D) | Structure analyzer, theme/insight, character/voice, prompt builder V2 |
| **3** | Knowledge Amplification | Phase 3 (Waves 3A-3E) | 3 registries, strategy/pattern/signal manifests, registry integration |
| **4** | Experience | Phase 4 (Waves 4A-4C) | SSE streaming, prompt cache optimization, paragraph diff engine |
| **5** | Learning | NEW (R4 only) | Edit signal capture, calibration refinement, pattern discovery (requires production data) |

**Rationale:** R4 is right that Layer 0 measurement is essential — without a baseline, we cannot prove any subsequent layer actually improves quality. But R4's layer numbering maps cleanly onto Master Plan's phases (1->1, 2->2, 3->3, 4->4), with two additions: Layer 0 (measurement) at the start and Layer 5 (learning loop) at the end. The Master Plan's detailed wave lettering (1A, 1B, etc.) is preserved for implementation planning within each layer.

**Impact on Implementation:** Layer 0 adds ~2-3 hours of work before any code changes to pipeline files. Layer 5 is deferred until production data exists (post-launch).

**Risk:** LOW. Layer 0 is small, low-risk, and provides essential infrastructure for all subsequent quality gates.

---

## Decision 2: Weight Philosophy — Content-Heavy (41/59) with 10 Dimensions

**Conflict:**
- R3 score-calibrator proposes per-dimension H/A weight tweaks (0.6/0.4 for word_economy, 0.2/0.8 for originality) within the existing ~50/50 balanced 13-dimension system
- R4 dimension-rethinker proposes shifting from ~50/50 craft/content to 41/59 content-heavy across a restructured 10-dimension system, arguing AOs differentiate on content, not craft

**Decision:** Adopt R4's 41/59 content-heavy philosophy with R3's per-dimension H/A calibration weights applied to the new 10-dimension set.

The 10 dimensions with their content/craft classification:

| Dimension | Weight | Classification | R3 H/A Weights |
|-----------|--------|---------------|----------------|
| Voice, Originality & Irreplaceability | 14% | Content | 0.20 / 0.80 |
| Thematic Depth & Self-Awareness | 13% | Content | 0.30 / 0.70 |
| Emotional Resonance & Vulnerability | 11% | Content | 0.35 / 0.65 |
| Intellectual Vitality & Curiosity | 11% | Content | 0.30 / 0.70 |
| Memorability & Committee Impact | 10% | Content | 0.20 / 0.80 |
| Narrative Craft & Scene Construction | 10% | Craft | 0.55 / 0.45 |
| Agency & Initiative | 9% | Content | 0.25 / 0.75 |
| Structural Coherence & Flow | 8% | Craft | 0.55 / 0.45 |
| Clarity of Purpose & Throughline | 8% | Content | 0.35 / 0.65 |
| Word Economy & Craft | 6% | Craft | 0.60 / 0.40 |

Content total: 14+13+11+11+10+9+8 = 76% (6 dims, effective weighting toward content)
Craft total: 10+8+6 = 24% (3 dims)
Cross-cutting: Narrative Craft is partially content (scene construction) and partially craft.

**Rationale:** R4's dimension restructuring is confirmed by the product owner. R3's H/A calibration analysis is still valid — dimensions where heuristics are strong (word economy, narrative craft, structural coherence) should lean toward heuristic weights, while dimensions where only LLM can judge (voice, memorability, agency) should lean toward annotation weights. Combining both approaches gives us the best of both rounds.

**Impact on Implementation:** 13 existing dimension files must be consolidated into 10 new ones. The `dimensionRegistry`, `eqiCalculator`, `scoreDeriver`, and all essay profiles need weight updates. The `promptBuilder` dimension reference section updates to list 10 dimensions.

**Risk:** MEDIUM. Dimension restructuring touches many files. Mitigated by Layer 0 calibration — we can measure quality before and after the change.

---

## Decision 3: Calibration Starting Point — Layer 0 Measurement First

**Conflict:**
- R4 foundation-architect says create calibration essays first (Layer 0), then measure baseline, then improve
- R3 implementation-planner says start with types + code (Wave 1A), build calibration system as part of Wave 1B

**Decision:** Layer 0 (calibration essays + quality scorer + baseline) comes first. THEN Wave 1A types.

**Specific first steps, in order:**
1. Create `tests/calibration/essays/` with 10 calibration essays spanning the quality spectrum
2. Create `tests/calibration/expertRatings.ts` with expert-rated scores per dimension
3. Create `tests/calibration/qualityScorer.ts` — runs V1 pipeline on calibration essays, compares to expert ratings, outputs error metrics
4. Run scorer, commit `tests/calibration/baseline.json` — this is the immutable Layer 0 baseline
5. THEN begin Wave 1A (types.ts extensions for the 10-dimension system)

**Rationale:** R4 is correct. Without measurement, we're guessing. Layer 0 is small (~200 lines of code + essay content) and provides the foundation for every quality gate in subsequent layers. Starting with types (R3's approach) means we'd be restructuring dimensions without knowing whether the restructuring actually improves scores.

**Impact on Implementation:** Adds ~2-3 hours before pipeline code changes begin. All subsequent layers must beat baseline as a quality gate.

**Risk:** LOW. Calibration essays can be created from publicly available example essays + synthetic quality-spectrum anchors.

---

## Decision 4: Score Calibration Approach — Static First, Grid Search Later

**Conflict:**
- R3 proposes static per-dimension H/A weights based on heuristic confidence analysis (see Decision 2 table)
- R4 moat-architect proposes grid search calibration against a 500+ expert-rated corpus that evolves over time

**Decision:** Start with R3's static weights (Layer 1), evolve to R4's grid search (Layer 5).

**Phase 1 (Layer 1 — immediate):**
- Implement `ScoreCalibrationConfig` with R3's static H/A weights (the table in Decision 2)
- Replace hardcoded `HEURISTIC_WEIGHT = 0.4` / `ANNOTATION_WEIGHT = 0.6` in `scoreDeriver.ts` with per-dimension lookups
- Add zero-annotation fallback: when no annotations exist for a dimension, collapse to pure heuristic (1.0 / 0.0)
- Add linear ramp: if `annotationCount < minAnnotationsForFullWeight`, blend annotation weight proportionally

**Phase 2 (Layer 5 — after production data):**
- Build calibration corpus from user essays (anonymized, consent-gated)
- Grid search on per-dimension weights to minimize MAE vs expert ratings
- Update weights quarterly based on accumulated data
- After 500+ essays: statistically significant per-dimension weights become a proprietary asset

**Rationale:** R3's static weights are well-reasoned (based on actual dimension code analysis) and ready to ship. R4's grid search is the right long-term approach but requires a corpus that doesn't exist yet. Starting with R3 gets us a 15-30% accuracy improvement on Day 1; R4's approach compounds over time.

**Impact on Implementation:** Layer 1 changes `scoreDeriver.ts` to use `ScoreCalibrationConfig` (new type in `types.ts`). Layer 5 adds a calibration runner and weight update pipeline.

**Risk:** LOW for Phase 1 (static weights are well-analyzed). MEDIUM for Phase 2 (requires production data, privacy considerations).

---

## Decision 5: Response Schema — Object Response in Layer 1, Backward-Compatible Parser

**Conflict:**
- R3 prompt-engineer wants to change LLM response from bare JSON array to `{ annotations, structure, contentAnalysis }` object
- Master Plan is built around the existing array schema
- R3 Appendix has internal disagreement: prompt engineer wants it in Wave 1C, implementation planner puts it in Wave 2D

**Decision:** Change the response schema to an object in Layer 1 (Wave 1C), but make the parser backward-compatible so it handles both array and object responses gracefully.

**Implementation:**

```typescript
// In annotationPipeline.ts parseAnnotations():
private parseAnnotations(responseText: string): {
  annotations: RawLLMAnnotation[];
  structure?: StructureAnalysis;
  contentAnalysis?: ContentAnalysis;
} {
  const parsed = JSON.parse(cleaned);

  // Backward-compatible: handle both array and object responses
  if (Array.isArray(parsed)) {
    return { annotations: parsed as RawLLMAnnotation[] };
  }

  return {
    annotations: parsed.annotations ?? [],
    structure: parsed.structure,
    contentAnalysis: parsed.contentAnalysis,
  };
}
```

**Schema requested from LLM (added in Wave 1C prompt changes):**
```json
{
  "annotations": [...],
  "structure": {
    "arc": "linear|in_medias_res|circular|montage|zoom_lens|braided",
    "beats": [{"type":"hook","paragraph":0,"quality":"strong"}]
  },
  "contentAnalysis": {
    "showDontTellRatio": 0.65,
    "insightDepth": "none|cliche|observation|understanding|connection|wisdom",
    "themeOriginality": "cliche_topic|fresh_treatment|wholly_original",
    "characterRevelationPeak": "none|stated_trait|demonstrated_behavior|moment_of_choice|transformation_shown"
  }
}
```

**Rationale:** Doing this in Layer 1 (not Layer 2) means the structure and content analysis data are available for free as part of the existing Sonnet call when Layer 2 analyzers need them. The backward-compatible parser means existing tests don't break during the transition. The ~90 extra output tokens cost ~$0.001 — negligible.

**Impact on Implementation:** `parseAnnotations()` in `annotationPipeline.ts` gets updated. `promptBuilder.ts` annotation schema section gets the new output format. `types.ts` gets `StructureAnalysis` and `ContentAnalysis` types. Layer 2 analyzers can then use LLM-provided structure/content data alongside their heuristic analysis.

**Risk:** LOW. Backward-compatible parser eliminates breaking risk. Schema change is additive.

---

## Decision 6: Registry Signal Composition — Weighted Average with Floor/Ceiling

**Conflict:**
- R3 Appendix flagged "How signals compose into dimension scores needs more design" as HIGH risk
- R3 registry-architect designed 15 signal manifests, each feeding one dimension, but didn't specify composition
- No round provided a concrete algorithm for combining multiple signals into a single dimension score

**Decision:** Signals compose into a dimension's heuristic score via weighted average, with per-signal weights defined in the signal manifest. This REPLACES the dimension's own `heuristicScore()` function (which currently operates directly on features).

**Algorithm:**

```typescript
function computeDimensionHeuristicScore(
  dimensionId: string,
  features: ExtractedFeatures,
  craftFeatures: CraftFeatures,
  text: string,
): number {
  const signals = signalRegistry.getByDimension(dimensionId);

  if (signals.length === 0) {
    // Fallback to dimension's own heuristic (backward-compatible)
    return dimensionRegistry.getDimension(dimensionId)!.heuristicScore(features).score;
  }

  let totalWeight = 0;
  let weightedSum = 0;

  for (const signal of signals) {
    const score = signal.compute(features, craftFeatures, text);
    const clampedScore = clamp(score, 0, 100);
    weightedSum += clampedScore * signal.weight;
    totalWeight += signal.weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
}
```

**Key design rules:**
1. Each signal manifest specifies its `weight` within its parent dimension (relative, not absolute)
2. Weights are normalized at computation time (sum to 1.0)
3. If no signals are registered for a dimension, fall back to the dimension's existing `heuristicScore()` — this enables incremental migration
4. Signal scores must be 0-100. Signals with different native ranges normalize internally.
5. This replaces only the heuristic side of the H/A fusion. The annotation signal (from `scoreDeriver.computeAnnotationSignal()`) remains unchanged.

**Rationale:** Weighted average is the simplest composition that works. Max would overfit to a single signal; min would be too conservative. Weighted average with per-signal weights lets us tune the contribution of each signal without changing the architecture. The fallback to existing `heuristicScore()` means we can migrate one dimension at a time.

**Impact on Implementation:** `scoreDeriver.ts` calls `computeDimensionHeuristicScore()` instead of `dimension.heuristicScore()` when signals exist. Signal manifests declare their `weight` and `dimensionId`. The `signalRegistry` adds a `getByDimension(dimId)` method.

**Risk:** MEDIUM. Requires careful weight tuning per signal. Mitigated by Layer 0 calibration — we can measure whether signal-based scoring beats raw heuristic scoring.

---

## Decision 7: Grammar as Embedded, Not Standalone Dimension

**Conflict:**
- Master Plan proposes grammar as 14th dimension (`grammar_mechanics`) with weight 0.04
- Product owner confirms 10 dimensions total (no grammar dimension)
- Grammar analysis is identified as a gap by R1, R3, and R4

**Decision:** Grammar analysis happens but feeds into existing dimensions, not as its own dimension.

**Where grammar feeds:**
1. **Word Economy & Craft (6% weight)** — Absorbs: passive voice detection, filler phrase detection, sentence mechanics (comma splices, run-ons). These are already partially measured by this dimension's heuristic.
2. **Narrative Craft & Scene Construction (10% weight)** — Absorbs: tense consistency (affects narrative quality), sentence rhythm issues. A narrative that shifts tenses unintentionally is a craft issue.
3. **Structural Coherence & Flow (8% weight)** — Absorbs: transition quality, paragraph-level mechanics. Poor paragraph structure is a coherence issue.

**Implementation:**
- Add grammar-specific heuristic detectors (comma splice, run-on, tense inconsistency, passive voice) to `craftFeatures.ts` as computed features
- These features feed into the relevant dimensions' signal computation
- The LLM annotation prompt includes: "If you notice grammar or mechanics issues (comma splices, run-on sentences, tense inconsistency), annotate them under the most relevant dimension: word_economy_craft for sentence-level issues, narrative_craft for tense problems, structural_coherence for paragraph-level mechanics."
- No `grammar_mechanics.dim.ts` file is created
- No weight rebalancing needed across 14 dimensions (was going to require reducing each of 13 dims by ~0.003)

**Rationale:** Grammar is a means to an end (clear writing), not an end in itself. AOs don't score grammar separately — they notice when grammar issues interfere with comprehension, voice, or narrative flow. Embedding grammar into the dimensions it actually affects produces more actionable feedback ("this tense shift breaks your narrative momentum" vs "grammar error: tense inconsistency").

**Impact on Implementation:** Removes `grammar-mechanics.dim.ts` from the plan. Removes the weight rebalancing complexity (R3 flagged this as TBD). Grammar heuristics are added to `craftFeatures.ts` and feed into 3 existing dimension signals.

**Risk:** LOW. Simpler than the alternative. Grammar detection still happens, just scored where it matters.

---

## Decision 8: R4 Innovation Prioritization

**Conflict:** R4 proposed ~15 major innovations. Need to classify each as V2 Core, V2 Enhancement, or Post-V2.

**Decision:**

### V2 Core (Layers 0-3, ship with V2 launch)

| Innovation | Layer | Rationale |
|-----------|-------|-----------|
| **Dimension restructuring (13->10)** | 1 | Confirmed by product owner. Foundational scoring change. |
| **Memorability & Committee Impact dimension** | 1 | Part of dimension restructuring. 10% weight. |
| **Agency & Initiative dimension** | 1 | Part of dimension restructuring. 9% weight. |
| **Per-dimension H/A calibration** | 1 | R3's static weights. Immediate accuracy improvement. |
| **Enhanced prompt (few-shot, severity anchors)** | 1 | Low-cost, high-impact. ~475 extra tokens. |
| **Craft feature extraction (25 features)** | 1 | Required by Layer 2 analyzers. |
| **Essay structure decomposition** | 2 | Arc detection + beat mapping. Core content analysis. |
| **Theme & insight analysis** | 2 | Show-don't-tell, cliche detection, insight depth. |
| **Character & voice analysis** | 2 | Revelation hierarchy, growth arc, vulnerability. |
| **3 registries + manifests** | 3 | Extensible knowledge system. Core architecture. |

### V2 Enhancement (Layer 4, ship shortly after V2 launch)

| Innovation | Layer | Rationale |
|-----------|-------|-----------|
| **Streaming SSE** | 4 | UX improvement. Not blocking for launch. |
| **Prompt cache optimization** | 4 | Cost reduction. Can ship incrementally. |
| **Paragraph diff engine** | 4 | Re-analysis cost reduction. Needs production usage patterns. |
| **Emotional intelligence calibration** | 2-4 | ~20 lines to wire vulnerability into teaching tone. Ship when Layer 2 is done. |
| **Draft stage adaptation** | 4 | Add `draftStage` to config. Small but needs UX thought. |

### Post-V2 (Layer 5+, requires production data or significant effort)

| Innovation | Why Deferred | Prerequisites |
|-----------|-------------|--------------|
| **Cognitive load rationing** | Requires session history + diff-based edit detection | Production data, `annotation_interactions` table |
| **Edit-response learning** | Requires `feedback_effectiveness` table + production revision pairs | Production data, privacy design |
| **Metacognitive coaching** | Requires multi-session pattern detection | Production data, `student_patterns` table |
| **Subtext analysis ("Ghost Story")** | High LLM cost per essay, unclear value without user testing | User research, cost analysis |
| **Essay DNA fingerprint** | Requires 50+ essays for basic percentiles, 500+ for archetypes | Production data, `essay_fingerprints` table |
| **Portfolio Intelligence (7 systems)** | Requires multiple analyzed essays per user | Production users with portfolios |
| **Self-improving feedback loop** | The entire Layer 5 — requires production data | All of Layers 0-4 in production |
| **Draft-to-application fit** | Needs `applicationContext` from frontend + portfolio data | Frontend integration |
| **White space/compression detection** | Low priority vs other innovations. Can be a signal in Layer 3. | Signal manifest |
| **Proprietary moat (7 layers)** | Data accumulation over time. Ship Layer 5 tables early, value compounds. | Production scale |

**Rationale:** V2 Core is everything needed for a transformative launch: better scoring, deeper content analysis, extensible knowledge. V2 Enhancement is UX polish that doesn't block launch. Post-V2 is everything that requires production data to work — shipping it without data would produce a worse product than not shipping it.

**Impact on Implementation:** Reduces V2 scope from ~53 files to ~40 files. Layer 5 and post-V2 features are documented but not implemented.

**Risk:** LOW. Core features deliver most of the value. Deferred features require data that doesn't exist yet.

---

## Decision 9: Existing Code Reuse — Don't Reinvent

**Conflict:**
- Master Plan proposes new `summaryGenerator.ts` to generate summaries
- R3 plan-validator found `buildSummary()` already exists in `annotationPipeline.ts` (lines 259-307)
- Master Plan proposes retry logic in `annotationPipeline.ts`
- R3 plan-validator found `callClaudeWithRetry()` already exists in `claude.ts`
- Master Plan proposes `paragraphDiffEngine.ts`
- R3 plan-validator found `reanalysisService.ts` already does partial paragraph diffing
- R3 found `macroStrategies.ts` exists in workshop orchestrator — naming conflict with plan's `strategyRegistry.ts`

**Decision:** Reuse existing code. Specifically:

1. **Summary generation:** Refactor existing `buildSummary()` out of `annotationPipeline.ts` into `summaryGenerator.ts`, then enhance it (add dimension-weight-aware ranking, better templates). Do NOT rewrite from scratch.

2. **Retry logic:** Use existing `callClaudeWithRetry()` from `claude.ts`. Do NOT reimplement exponential backoff. Only add: partial JSON recovery for truncated responses, input validation (min/max text length).

3. **Paragraph diffing:** Enhance existing `reanalysisService.ts` with the hash-based paragraph matching algorithm from R3's design. Do NOT create a separate `paragraphDiffEngine.ts`. Add the hash + Jaccard similarity logic as methods within the existing service.

4. **Strategy naming:** The new `strategyRegistry.ts` registers `StrategyManifest` objects (writing strategies like montage, zoom lens). Existing `macroStrategies.ts` in workshop orchestrator handles improvement strategies (different domain). No naming conflict — they're in different directories and serve different purposes. Keep both names as-is.

5. **`hybridScoringPipeline`:** R3 confirmed it's exported but NOT used by annotation pipeline (annotation pipeline uses `scoreDeriver` directly). This is intentional. Do not wire it in.

**Rationale:** Rewriting working code is waste. The existing implementations have been tested in production. Refactoring and enhancing is faster and safer than reimplementation.

**Impact on Implementation:** Reduces new file count by 2 (no separate `summaryGenerator.ts` as new-from-scratch, no separate `paragraphDiffEngine.ts`). The summary generator is an extraction refactor, not a new file.

**Risk:** LOW. Builds on proven code.

---

## Decision 10: Response Schema Timing Within Wave Structure

**Conflict:**
- R3 prompt-engineer wants response schema change in Wave 1C
- R3 implementation-planner puts it in Wave 2D
- R3 Appendix acknowledges the disagreement but doesn't resolve it

**Decision:** Schema change goes in Wave 1C (prompt enhancements), but the `structure` and `contentAnalysis` fields are OPTIONAL in the schema until Layer 2 analyzers are built.

**Rationale:** Adding the schema in Wave 1C means:
- The LLM starts returning structure/content data early (at zero extra cost beyond ~90 output tokens)
- Layer 2 analyzers (Wave 2A-2C) can immediately consume this data when they're built
- The parser is backward-compatible (handles both array and object responses)
- If the LLM doesn't return `structure`/`contentAnalysis` (e.g., for short activity descriptions), the system continues working with `annotations` only

Waiting until Wave 2D would mean Layer 2 analyzers have to run a full release cycle before they can consume LLM-provided structure data. That's unnecessary delay.

**Impact on Implementation:** `promptBuilder.ts` adds the object schema in Wave 1C. `annotationPipeline.ts` parser handles both formats in Wave 1C. Layer 2 analyzers consume the data when built (Waves 2A-2C).

**Risk:** LOW. The schema change is additive and backward-compatible.

---

## Decision 11: `macroStrategies.ts` vs `strategyRegistry.ts` Naming

**Conflict:** R3 plan-validator flagged that `macroStrategies.ts` exists in `src/workshop/orchestrator/` — naming differentiation needed from the plan's new `strategyRegistry.ts`.

**Decision:** Keep both. They are in different domains:

- `src/workshop/orchestrator/macroStrategies.ts` — **Improvement strategies** (how to improve an essay: "strengthen opening", "add specificity", "restructure for impact"). Used by the orchestrator to plan improvements.
- `src/workshop/registry/strategyRegistry.ts` — **Writing strategies** (structural techniques an essay uses: montage, zoom lens, bracket structure, extended metaphor, in medias res). Used by the annotation pipeline to detect and teach essay patterns.

The names are different enough in context. No renaming needed.

**Risk:** LOW.

---

## Decision 12: Dimension Weight Rebalancing Math

**Conflict:** R3 plan-validator flagged that adding grammar as a 14th dimension at 0.04 weight requires reducing 13 existing dimensions by ~0.003 each — "specific strategy TBD." But now grammar is NOT a standalone dimension (Decision 7).

**Decision:** Since grammar is embedded into existing dimensions (Decision 7), there is no weight rebalancing needed for grammar. The only rebalancing is the dimension restructuring from 13 to 10 dimensions (Decision 2).

**The new 10 dimensions sum to exactly 1.00:**
14 + 13 + 11 + 11 + 10 + 10 + 9 + 8 + 8 + 6 = 100%

**Migration from 13 to 10:**

| Old Dimension(s) | New Dimension | Old Weight | New Weight |
|------------------|---------------|-----------|-----------|
| `originality_voice_authenticity` + `authenticity_specificity_detail` | Voice, Originality & Irreplaceability | 8% + 10% = 18% | 14% |
| `thematic_depth_reflection` + `growth_transformation_arc` | Thematic Depth & Self-Awareness | 9% + 8% = 17% | 13% |
| `emotional_resonance_vulnerability` | Emotional Resonance & Vulnerability | 8% | 11% |
| `intellectual_vitality_curiosity` | Intellectual Vitality & Curiosity | 8% | 11% |
| NEW | Memorability & Committee Impact | 0% | 10% |
| `narrative_craft_storytelling` + `tonal_sophistication` | Narrative Craft & Scene Construction | 9% + 6% = 15% | 10% |
| NEW | Agency & Initiative | 0% | 9% |
| `structural_coherence_flow` + `opening_hook_engagement` + `closing_impact_resolution` | Structural Coherence & Flow | 8% + 7% + 6% = 21% | 8% |
| `argument_rhetorical_craft` | Clarity of Purpose & Throughline | 7% | 8% |
| `word_economy_craft` | Word Economy & Craft | 7% | 6% |

**Key weight changes:**
- Content dimensions get elevated (Emotional Resonance 8% -> 11%, Intellectual Vitality 8% -> 11%)
- Craft/structural dimensions get compressed (Structural absorbs opening+closing but drops from 21% combined to 8%)
- Two new content dimensions added (Memorability 10%, Agency 9%)
- Merged dimensions lose combined weight (Voice+Authenticity 18% -> 14%, Thematic+Growth 17% -> 13%) because signal overlap was inflating scores

**Impact on Implementation:** 13 `.dim.ts` files must be consolidated into 10. All essay profile `dimensionWeightOverrides` must be updated with new dimension IDs. `eqiCalculator` weight normalization handles the rest.

**Risk:** MEDIUM. Requires touching many files. Layer 0 calibration catches regressions.

---

## Decision 13: Heuristic Score Functions for New Dimensions

**Conflict:** Two new dimensions (Memorability, Agency) have no existing heuristic scorers. R4 describes what they measure but doesn't provide heuristic implementations.

**Decision:** New dimensions start with weak heuristics (confidence 0.5) and lean heavily on annotation weight (H/A = 0.20/0.80). The heuristics will improve over time as we understand the signal space.

**Memorability & Committee Impact — Initial Heuristics:**
- Check for a "hook" — a specific, unusual image or moment in the first paragraph (sensory words + low-frequency nouns)
- Measure detail specificity across the essay (named entities, numbers, proper nouns per 100 words)
- Detect the "only you could write this" signal: high vocabulary richness + low cliche count + high sensory density
- Score range: 30-70 (narrow range reflects low heuristic confidence)

**Agency & Initiative — Initial Heuristics:**
- Count action verbs with the subject "I" (active agent)
- Detect "things happened TO me" vs "I caused change" patterns: passive constructions about self vs active ones
- Check for initiative markers: "I started", "I created", "I decided", "I led", "I built"
- Penalize purely reactive narratives: "I was told", "I had to", "they made me"
- Score range: 30-70

**Rationale:** These dimensions are inherently LLM-judgment-heavy (even R4 acknowledges heuristic confidence is low for subjective qualities). Starting with weak heuristics + strong annotation weight is correct. As Layer 5's grid search accumulates data, the H/A balance will shift if heuristics prove more reliable than expected.

**Impact on Implementation:** Two new `.dim.ts` files with simple heuristic functions. R3's H/A weights of 0.20/0.80 ensure the LLM dominates scoring for these dimensions.

**Risk:** LOW. Weak heuristics with high annotation weight is the safe default.

---

## Decision 14: Prompt Caching Block Size

**Conflict:**
- R3 perf-engineer describes a 3-tier prompt caching system (static ~800 tokens, essay-type ~300 tokens, dynamic ~200 tokens)
- R4 cost-optimizer notes Anthropic requires cache blocks >= 1,024 tokens and recommends combining Tiers 1+2

**Decision:** Combine Tiers 1 and 2 into a single cache block (>= 1,024 tokens per essay type). The system prompt is structured as:

```
[TIER 1+2 COMBINED — ~1,100-1,300 tokens, cached per essay type]
  Role definition
  10 dimension reference (updated for 10 dims)
  Annotation JSON schema (with object response format)
  Severity calibration anchors
  Few-shot examples (1 good + 1 bad annotation)
  Profile block (essay-type-specific weights, anti-patterns, tone)

[TIER 3 — DYNAMIC, ~200-400 tokens, never cached]
  Teaching sophistication level
  Expertise context (activities only)
  College context (Why Us only)
  Structure/content analysis instructions
```

This ensures the combined block exceeds Anthropic's 1,024-token minimum for cache eligibility. Cache hit rate:
- Same essay type, same session: ~90% (full Tier 1+2 cache hit)
- Different essay type, same session: ~0% (different profile block = different prefix)
- Cross-user, same essay type within 5-min window: ~90% (Anthropic's cross-request caching)

**Impact on Implementation:** `promptBuilder.ts` restructures the system prompt to put all static + profile content before the dynamic content. Profile block moves from "dynamic" to "semi-static" (cached per essay type).

**Risk:** LOW.

---

## Decision 15: Essay Profile Overrides for 10 Dimensions

**Conflict:** Existing 7 essay profiles have `dimensionWeightOverrides` keyed to the 13-dimension IDs. Dimension restructuring changes all IDs.

**Decision:** Update all 7 essay profiles with new dimension IDs and recalibrated overrides. R4 provides initial per-profile adjustments:

- **Common App (personal_statement):** Memorability +3%, Voice +2%, Agency +2% (from Structural)
- **Analytical/supplemental:** Clarity +3%, Intellectual Vitality +2% (from Memorability)
- **Why Us:** Clarity +4%, Agency +2% (from Narrative Craft)
- **Activity (activity_to_essay):** Agency +3%, Clarity +2%, Word Economy +1% (from Thematic)
- **PIQ:** Word Economy +2%, Voice +1% (from Structural) — PIQ's 350-word limit makes economy critical
- **Narrative:** Narrative Craft +2%, Memorability +2% (from Clarity) — narrative essays should prioritize storytelling
- **Academic:** Intellectual Vitality +3%, Clarity +2% (from Memorability) — academic essays prioritize intellectual engagement

**Impact on Implementation:** 7 essay profile files need `dimensionWeightOverrides` updated.

**Risk:** LOW. Profile overrides are small weight shifts. Layer 0 calibration validates.

---

## Unified Implementation Sequence

```
LAYER 0: MEASUREMENT FOUNDATION (prerequisite, ~3 hours)
  0A: Create 10 calibration essays (quality spectrum: 2 weak, 3 developing, 3 good, 2 excellent)
  0B: Create expert ratings per dimension
  0C: Create quality scorer (runs V1 pipeline, compares to expert)
  0D: Commit baseline.json
  GATE 0: Calibration suite runs, baseline committed.

LAYER 1: INTELLIGENCE CORE (~2-3 days)
  1A: Foundation types (new types in types.ts for 10-dimension system)
       - StructureAnalysis, ContentAnalysis, ScoreCalibrationConfig
       - DimensionCalibration per-dimension H/A weights
  1B: Dimension restructuring (13 -> 10 dimension files)
       - Consolidate dimension files, update weights
       - Update essay profiles with new dimension IDs
       - Update eqiCalculator, scoreDeriver
       GATE 1B: 10 dims sum to 1.00, tsc passes
  1C: Score calibration + prompt enhancements
       - Replace hardcoded H/A weights with per-dimension config
       - Add few-shot examples to prompt
       - Change response schema to object format
       - Add word-count-aware annotation scaling
       GATE 1C: Quality >= 15% above Layer 0 baseline
  1D: Craft feature extraction
       - craftFeatures.ts with 25 new features + 1,029 word list entries
       GATE 1D: All features computed, tsc passes

  1B, 1C, 1D can run in PARALLEL after 1A.

LAYER 2: DEEP UNDERSTANDING (~2-3 days)
  2A: Structure analyzer (arc detection + beat mapping)
  2B: Theme & insight analysis (show-don't-tell, cliche, coherence, depth)
  2C: Character & voice analysis (revelation, growth, consistency, vulnerability)
  2D: Prompt Builder V2 (inject heuristic hypotheses into LLM prompt)

  2A, 2B, 2C can run in PARALLEL after 1D.
  2D runs after 2A + 2B + 2C.
  GATE 2: Quality >= 10% above Layer 1. Structure arc correct on 8/10 calibration essays.

LAYER 3: KNOWLEDGE AMPLIFICATION (~2-3 days)
  3A: Registry infrastructure (3 registries)
  3B: Strategy manifests (5) — PARALLEL after 3A
  3C: Pattern manifests (10) — PARALLEL after 3A
  3D: Signal manifests (15) — PARALLEL after 3A
  3E: Registry integration into pipeline — after 3A-3D
  GATE 3: Quality >= 8% above Layer 2. All manifests registered, tsc passes.

LAYER 4: EXPERIENCE (~1-2 days, can ship after V2 launch)
  4A: SSE streaming pipeline
  4B: Prompt cache optimization
  4C: Enhanced paragraph diff in reanalysisService
  GATE 4: First annotation < 3s. Re-analysis < 50% of full cost.

LAYER 5: LEARNING (post-launch, requires production data)
  5A: annotation_interactions + user_feedback_profiles tables
  5B: Edit signal capture in reanalysisService
  5C: Calibration corpus builder + grid search weight optimizer
  5D: Pattern discovery aggregator
  GATE 5: After 1 month, EQI error >= 10% below Layer 4.
```

---

## Final Dimension Specification (10 Dimensions)

### 1. Voice, Originality & Irreplaceability (14%)

**Absorbs:** `originality_voice_authenticity` (8%) + `authenticity_specificity_detail` (10%)

**ID:** `voice_originality_irreplaceability`

**What it measures:** Does this essay sound like a real, specific person? Could anyone else have written it? Does the writing voice feel authentic, not performed?

**Key signals:** Vocabulary uniqueness, first-person authenticity (not AI-speak), concrete-to-generic ratio, cliche avoidance, sensory detail density, "only you could write this" specificity.

**Heuristic confidence:** WEAK (0.45-0.70). Voice authenticity is inherently subjective.

**H/A weights:** 0.20 / 0.80 (lean heavily on LLM judgment)

**Why merged:** R4 identified ~70% signal overlap. Both dimensions score cliches, AI terms, sensory details, first-person rate. Merging eliminates double-counting.

---

### 2. Thematic Depth & Self-Awareness (13%)

**Absorbs:** `thematic_depth_reflection` (9%) + `growth_transformation_arc` (8%)

**ID:** `thematic_depth_self_awareness`

**What it measures:** Does the essay explore ideas at multiple levels? Is there genuine insight — not just event description? Does the writer demonstrate self-knowledge, including comfort with complexity and contradiction?

**Key signals:** Reflection markers, insight depth (6-level scale), thematic coherence, growth arc completeness (before/catalyst/after), self-awareness level (surface to existential).

**Heuristic confidence:** MODERATE-WEAK (0.50-0.70).

**H/A weights:** 0.30 / 0.70

**Why merged:** R4 identified ~60% overlap. Growth arc is a narrow sub-concern of thematic depth. A growth essay without thematic depth is empty; thematic depth without growth is incomplete.

---

### 3. Emotional Resonance & Vulnerability (11%)

**Absorbs:** `emotional_resonance_vulnerability` (8%), elevated to 11%.

**ID:** `emotional_resonance_vulnerability`

**What it measures:** Does the reader FEEL something? Is the writer appropriately vulnerable — sharing struggle with purpose, not trauma-dumping or being too guarded?

**Key signals:** Emotion word density, vulnerability markers, show-don't-tell ratio, vulnerability calibration (sweet spot 50-80), embodied experience indicators.

**Heuristic confidence:** MODERATE (0.55-0.75).

**H/A weights:** 0.35 / 0.65

**Why elevated:** AOs consistently cite vulnerability as a differentiator. Previous 8% underweighted its importance.

---

### 4. Intellectual Vitality & Curiosity (11%)

**Absorbs:** `intellectual_vitality_curiosity` (8%), elevated to 11%.

**ID:** `intellectual_vitality_curiosity`

**What it measures:** Does the writer demonstrate how they think, not just what they think? Is there genuine curiosity — connecting ideas across domains, questioning assumptions?

**Key signals:** Question density, domain-crossing connections, "ideas as tools" vs name-dropping, intellectual vocabulary (without pretension).

**Heuristic confidence:** MODERATE-WEAK (0.50-0.75).

**H/A weights:** 0.30 / 0.70

**Why elevated:** Stanford literally uses this as a rating criterion. Every T20 school values it.

---

### 5. Memorability & Committee Impact (10%) — NEW

**ID:** `memorability_committee_impact`

**What it measures:** Would an AO remember this essay a week later? Would they bring it up in committee? Is there a "hook" — a specific image, moment, or angle that sticks?

**Key signals:** Hook presence and strength, detail specificity, unexpected angle, "water cooler test" (would AO tell a colleague about this?), freshness of theme treatment.

**Heuristic confidence:** WEAK (0.40-0.60). Memorability is deeply subjective.

**H/A weights:** 0.20 / 0.80

**Why new:** R4's biggest gap finding. An essay can score well on all existing dimensions and still be completely forgettable. This dimension captures the "committee room effect" that drives actual admission decisions.

---

### 6. Narrative Craft & Scene Construction (10%)

**Absorbs:** `narrative_craft_storytelling` (9%) + `tonal_sophistication` (6%)

**ID:** `narrative_craft_scene_construction`

**What it measures:** Can the writer construct a scene? Is there sentence rhythm, dialogue quality, pacing control? Is the tone consistent and intentional?

**Key signals:** Scene indicators (sensory detail + action + dialogue), sentence rhythm variance, dialogue naturalness, tonal consistency across paragraphs, verb strength ratio, tense consistency.

**Grammar absorption:** Tense inconsistency issues are scored here (tense shifts break narrative quality).

**Heuristic confidence:** STRONG (0.60-0.95).

**H/A weights:** 0.55 / 0.45

**Why merged:** R4 identified ~50% overlap. `tonal_sophistication` heuristic confidence was only 0.50 — the dimension itself admits it's "genuinely hard to assess deterministically." Folding it into narrative craft, where heuristics are strong, gives tonal analysis a better home.

---

### 7. Agency & Initiative (9%) — NEW

**ID:** `agency_initiative`

**What it measures:** Did the student ACT or were they acted upon? Does the essay show someone who causes change rather than reacting to it?

**Key signals:** Active vs passive self-references, initiative markers ("I started", "I created", "I decided"), causation language, reactive vs proactive narrative framing.

**Heuristic confidence:** WEAK (0.45-0.65).

**H/A weights:** 0.25 / 0.75

**Why new:** 2025 AO trend: agency is a strong predictor of college success. Essays where things happen TO the student vs essays where the student causes change read very differently. Zero current coverage.

---

### 8. Structural Coherence & Flow (8%)

**Absorbs:** `structural_coherence_flow` (8%) + `opening_hook_engagement` (7%) + `closing_impact_resolution` (6%)

**ID:** `structural_coherence_flow`

**What it measures:** Is the essay well-organized? Does it flow logically? Does the opening hook the reader? Does the closing land? Are transitions smooth?

**Key signals:** Paragraph structure, transition quality, opening type classification, closing type classification, pacing balance, arc detection confidence.

**Grammar absorption:** Paragraph-level mechanics (transitions, paragraph organization) score here.

**Heuristic confidence:** STRONG (0.65-0.90).

**H/A weights:** 0.55 / 0.45

**Why compressed:** R4 correctly notes that opening and closing are specific instances of structural quality, not standalone concerns. Giving 2 paragraphs 12% weight was disproportionate. Structural coherence covers the whole essay including its opening and closing.

---

### 9. Clarity of Purpose & Throughline (8%)

**Replaces:** `argument_rhetorical_craft` (7%), elevated and reframed.

**ID:** `clarity_of_purpose_throughline`

**What it measures:** Is there a clear throughline? Does the reader understand what this essay is about and why it matters? Can you summarize the essay's core message in one sentence?

**Key signals:** Topic sentence clarity, thematic consistency across paragraphs, purpose statement presence (implicit or explicit), tangent detection, argument coherence.

**Heuristic confidence:** MODERATE (0.50-0.75).

**H/A weights:** 0.35 / 0.65

**Why reframed:** R4 notes `argument_rhetorical_craft` "systematically penalizes personal narratives (the dominant essay form)." A personal narrative doesn't make "arguments" in the rhetorical sense — but it DOES need a clear throughline. Reframing to "purpose and throughline" works for both narrative and analytical essay types.

---

### 10. Word Economy & Craft (6%)

**Continues:** `word_economy_craft` (7%), slightly reduced.

**ID:** `word_economy_craft`

**What it measures:** Is every word earning its place? Is the writing tight, precise, and free of filler?

**Key signals:** Filler phrase count, passive voice ratio, redundancy score, adverb density, "to be" verb frequency, sentence length distribution.

**Grammar absorption:** Sentence-level grammar (comma splices, run-ons, word choice) scores here.

**Heuristic confidence:** STRONG (0.80).

**H/A weights:** 0.60 / 0.40

**Why reduced:** Word economy is a "hygiene factor" — it needs to be adequate but doesn't differentiate great essays from good ones. R4 philosophy: AOs differentiate on content, not craft. A perfectly crafted essay about nothing memorable is still forgettable.

---

### Summary: Weights and H/A Table

| # | Dimension | ID | Weight | H/A | Classification |
|---|-----------|----|----|-----|---------------|
| 1 | Voice, Originality & Irreplaceability | `voice_originality_irreplaceability` | 14% | 0.20/0.80 | Content |
| 2 | Thematic Depth & Self-Awareness | `thematic_depth_self_awareness` | 13% | 0.30/0.70 | Content |
| 3 | Emotional Resonance & Vulnerability | `emotional_resonance_vulnerability` | 11% | 0.35/0.65 | Content |
| 4 | Intellectual Vitality & Curiosity | `intellectual_vitality_curiosity` | 11% | 0.30/0.70 | Content |
| 5 | Memorability & Committee Impact | `memorability_committee_impact` | 10% | 0.20/0.80 | Content |
| 6 | Narrative Craft & Scene Construction | `narrative_craft_scene_construction` | 10% | 0.55/0.45 | Craft |
| 7 | Agency & Initiative | `agency_initiative` | 9% | 0.25/0.75 | Content |
| 8 | Structural Coherence & Flow | `structural_coherence_flow` | 8% | 0.55/0.45 | Craft |
| 9 | Clarity of Purpose & Throughline | `clarity_of_purpose_throughline` | 8% | 0.35/0.65 | Content |
| 10 | Word Economy & Craft | `word_economy_craft` | 6% | 0.60/0.40 | Craft |
| | **Total** | | **100%** | | **Content: 65%, Craft: 24%, Mixed: 10%** |

---

## Appendix A: Conflicts Checked but Found Non-Conflicting

The following were investigated for conflicts but found to be consistent across rounds:

1. **Feature extractor approach:** All rounds agree on parallel module (`craftFeatures.ts`), not wrapping or extending `featureExtractor.ts`. No conflict.

2. **LLM model selection:** All rounds agree Sonnet for annotation, Haiku for cost-sensitive support tasks. No conflict.

3. **Registry pattern:** All rounds agree on following existing `dimensionRegistry` self-registering pattern. No conflict.

4. **Deep dive integration:** All rounds agree deep dives should pull from pattern library (Layer 3) rather than LLM improvisation. No conflict.

5. **Cost per essay target:** All rounds agree on $0.015-0.025 per essay with optimizations (down from $0.03-0.05 current). No conflict.

6. **Essay profile count:** 7 existing profiles, all rounds agree no new profiles needed for V2. Activity profiles get more granular overrides. No conflict.

---

## Appendix B: Open Questions for Product Owner

These are not conflicts between rounds — they are decisions that require product input:

1. **Calibration essay sourcing:** Should we use published example essays (publicly available), synthetic essays (generated for calibration), or both? Legal/IP considerations for published essays.

2. **Layer 5 privacy design:** When we track `annotation_interactions` and `user_feedback_profiles`, what consent model? Opt-in, opt-out, or mandatory for service improvement?

3. **Portfolio intelligence scope:** R4 proposes 7 portfolio intelligence systems (Decision 8, Post-V2). Which 2-3 should be prioritized first? Story deduplication and identity coherence seem highest-value.

4. **Memorability dimension user-facing name:** "Memorability & Committee Impact" is accurate but potentially intimidating to students. Consider "Distinctiveness" or "What Makes You Memorable" for the UI label.

5. **Layer 4 launch timing:** Should streaming (4A) and prompt caching (4B) ship as part of V2 launch, or immediately after? Depends on launch timeline pressure.
