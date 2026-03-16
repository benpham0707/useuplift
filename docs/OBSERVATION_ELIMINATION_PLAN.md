# Observation Elimination Plan: The Core Migration

> **The walk currently spends ~300 tokens per sentence on three flat `ObservationEntry[]` arrays. For a 7-paragraph, 35-sentence essay, that's ~10,500 output tokens — roughly $0.15 per essay — producing shallow, schema-forced cataloguing. The Finding system we already built is strictly better. This plan migrates from observations to findings as the primary understanding representation.**

---

## Why This Matters

The walk prompt currently says: "Fill `observedFunctions`, `inferredIntents`, `narrativeContributions` arrays for every sentence."

This is the opposite of what a great reader does. A great reader doesn't catalog every sentence equally — they spend their attention where the essay is interesting. A transitional sentence like "And that's when everything changed" gets the same three arrays as a pivotal sentence that reframes the entire essay's argument. The schema forces breadth; we need depth.

Meanwhile, the Finding system we built in Clusters A-D is strictly superior:

| | ObservationEntry | Finding |
|--|-----------------|---------|
| Granularity | Always per-sentence | Natural: word, sentence group, paragraph, cross-paragraph, essay-level |
| Growth | Replaced wholesale (supersession = array swap) | Maturity lifecycle: hypothesis → developing → confirmed → deepened |
| Intelligence | Flat string + confidence number | Coaching value, dimensions, evidence array, deepening potential, relationships |
| Connections | None (separate system) | `buildsOn[]`, `relatedTo[]`, `raisesQuestions[]` |
| Cost | ~300 tokens per sentence (mandatory) | Variable: 0 tokens for unremarkable sentences, 200+ for pivotal ones |
| Downstream | L3.5, L5, L6 read them via [U] labels | L5, L6 already read findings via [F] labels |

The walk ALREADY produces findings alongside observations. But findings are marked "OPTIONAL — most paragraphs will not produce them." We need to flip this: **findings are the primary output, observations are eliminated.**

### Token Savings

Current walk output budget: `sentenceCount × 300` tokens for observation arrays.

For a typical essay (7 paragraphs, 35 sentences): **~10,500 tokens of observation output.**

After migration, findings at natural granularity + per-sentence one-liners: **~3,000-5,000 tokens** (pivotal paragraphs get rich findings, transitional paragraphs get minimal output).

**Savings: ~50% of walk output tokens. ~$0.07-0.10 per essay.**

Plus: the freed cognitive budget means the LLM can think deeper about what's actually interesting instead of filling arrays for unremarkable sentences.

---

## Target Architecture

### What the Walk Produces (After Migration)

```typescript
interface WalkParagraphOutput {
  /** Rich paragraph reading — same as current ParagraphUnderstanding */
  paragraphUnderstanding: ParagraphUnderstanding;  // role, function, narrativeContribution, etc.

  /** Per-sentence LIGHTWEIGHT understanding — replaces 3 observation arrays */
  sentenceUnderstandings: Array<{
    index: number;
    /** One-line: what this sentence primarily does. Replaces observedFunctions[]. */
    primaryFunction: string;
    /** How significant this sentence is to the essay's architecture */
    significance: 'pivotal' | 'contributing' | 'transitional';
    /** Routing tags (same as current) */
    tags: string[];
    /** Connection references (same as current) */
    connectionRefs: string[];
    /** Craft observations — ONLY for pivotal/contributing sentences */
    craft?: {
      rhythm: string;
      voiceAlignment: string;
      techniques: string[];
    };
    /** Significant word choices — ONLY when genuinely significant */
    significantChoices?: Array<{ word: string; significance: string }>;
  }>;

  /** Findings at NATURAL granularity — the PRIMARY output */
  findings: Finding[];

  /** Back-propagation: finding evolutions for earlier paragraphs */
  findingEvolutions: Array<{
    findingId: string;
    newMaturity: FindingMaturity;
    reasoning: string;
    supersedes?: string;
  }>;

  /** Evolving holistic signals */
  holisticEvolution: { /* same as current */ };

  /** New connections discovered */
  newConnections: Connection[];
}
```

### What Changes for Each Sentence

**Before** (mandatory for every sentence, ~300 tokens):
```json
{
  "index": 0,
  "understanding": {
    "observedFunctions": [
      {"observation": "...", "confidence": 0.9, "evidence": "..."},
      {"observation": "...", "confidence": 0.8, "evidence": "..."}
    ],
    "inferredIntents": [
      {"observation": "...", "confidence": 0.7, "evidence": "..."}
    ],
    "narrativeContributions": [
      {"observation": "...", "confidence": 0.8, "evidence": "..."}
    ],
    "rhetoricalFunctions": ["scene-setting"],
    "paragraphContribution": "...",
    "craft": { "rhythm": "...", "voiceAlignment": "...", "techniques": [...] },
    "significantChoices": [...],
    "connectionRefs": [],
    "tags": [...]
  }
}
```

**After — transitional sentence** (~30 tokens):
```json
{
  "index": 3,
  "primaryFunction": "Bridges the physical description to the emotional revelation",
  "significance": "transitional",
  "tags": ["transition"]
}
```

**After — pivotal sentence** (~80 tokens + finding handles the depth):
```json
{
  "index": 1,
  "primaryFunction": "Establishes the transactional epistemology — the narrator knows value through physical appraisal",
  "significance": "pivotal",
  "tags": ["frame_establishment", "sensory_grounding", "epistemological_claim"],
  "craft": {
    "rhythm": "Three noun phrases in descending syllable count create a narrowing effect",
    "voiceAlignment": "Consistent with essay's kinesthetic register",
    "techniques": ["concrete_detail", "synesthesia"]
  },
  "significantChoices": [
    {"word": "slid", "significance": "Imports transactional vocabulary — objects move across surfaces like goods across counters"}
  ]
}
```

The depth goes into the FINDING (which captures the architectural insight about this sentence in a structured, growable, referenceable format) — not into three redundant flat arrays.

### What Downstream Consumers Read

| Consumer | Currently Reads | Will Read Instead |
|----------|----------------|-------------------|
| L3.5 (analysisPass) | Observations with [U] labels | Findings with [F] labels + `primaryFunction` |
| L5 (deepAnnotationService) | Observations for [U] label context | Findings for [F] label context (already partially done) |
| L6 (coachingService) | `inferredIntents[]` as mutable state | Findings as the supersession target (finding lifecycle already handles this) |
| L3.75 (holisticSynthesis) | All sentence observations | Findings + paragraph prose |
| Focused analyzer | Observation arrays for delta detection | Finding evolutions for delta detection |
| Edit understanding | Observation changes as impact signal | Finding changes as impact signal |
| Profile router | Passes observations through | Passes `primaryFunction` + findings through |
| Sentence mutator | Replaces observation arrays | Updates `primaryFunction` + coordinates finding store |
| Insight mutator | Routes based on observation supersession | Routes based on finding supersession (already built) |

---

## Migration Phases

### Phase 0: Preparation (No Behavioral Change)

**Goal**: Make findings first-class in every consumer without removing observations yet. Run BOTH systems in parallel so we can compare quality.

**Changes**:

1. **Make walk findings MANDATORY, not optional** — Change the walk prompt from "newFindings are OPTIONAL — most paragraphs will not produce findings" to "Every paragraph MUST produce at least one finding. Transitional paragraphs produce 1 finding about their structural function. Pivotal paragraphs produce 3-5 findings. The finding is the PRIMARY unit of understanding."

2. **Add `primaryFunction: string` to SentenceUnderstanding** — Alongside the existing observation arrays. The walk prompt produces both. This field captures in one sentence what the three arrays try to capture in 6-9 observations.

3. **Add `significance: 'pivotal' | 'contributing' | 'transitional'` to SentenceUnderstanding** — The walk assesses how important each sentence is. This drives whether downstream consumers invest attention.

4. **Teach L3.5 to read findings alongside observations** — The analysis pass already reads [U] labels from observations AND [F] labels from findings. Make findings the PREFERRED context (listed first, more prominently) and observations the fallback.

5. **Teach L5 to prefer findings over observations** — The deep annotation service already calls `buildAnnotationFindingContext()`. Make finding context the PRIMARY source for annotation grounding; observation labels become supplementary.

6. **Teach L6 to use findings for reinterpretation** — When a student offers a reinterpretation, the coaching service should supersede findings (via finding lifecycle) instead of replacing `inferredIntents[]` arrays. The supersession mechanism is already built — we just need to route through it.

**Verification**: Run the full pipeline on 3 test essays. Compare:
- Finding count and quality (should be higher with mandatory findings)
- Observation count (should be unchanged — we haven't removed them)
- L3.5 scoring quality (should be at least as good with finding context added)
- L5 annotation quality (should improve with finding grounding)

**Risk**: LOW. Everything is additive. Observations still exist as fallback.

### Phase 1: Walk Output Evolution

**Goal**: Change the walk prompt to produce the new output format. Observations are no longer produced. Findings + `primaryFunction` + `significance` are the primary output.

**Changes**:

1. **Rewrite walk output schema** — Replace the `sentenceUnderstandings` section of the walk prompt. Remove `observedFunctions`, `inferredIntents`, `narrativeContributions` arrays. Add `primaryFunction`, `significance`, optional `craft` and `significantChoices`.

2. **Change `computeWalkMaxTokens()`** — Current formula: `sentenceCount × 500`. New formula: `sentenceCount × 200 + findingBudget`. The per-sentence cost drops dramatically; the finding budget is flexible.

3. **Update `parseWalkOutput()`** — Handle the new output shape. Build backward-compatible `SentenceUnderstanding` objects from the new fields (so existing consumers don't break immediately).

4. **Update back-propagation model** — Currently replaces observation arrays wholesale. Now operates on findings: back-propagation means finding evolutions (maturity changes, supersessions). The finding lifecycle already handles this.

5. **Update `sentenceMutator.ts`** — Apply `primaryFunction` and `significance` updates instead of observation array replacements.

**Backward compatibility bridge**: During Phase 1, `parseWalkOutput()` synthesizes minimal `ObservationEntry[]` from the new fields:
```typescript
// Bridge: generate observation-like data from new format for consumers not yet migrated
sentenceUnderstanding.observedFunctions = [{
  observation: walkOutput.primaryFunction,
  confidence: 1.0,
  evidence: '(derived from primaryFunction)',
}];
sentenceUnderstanding.inferredIntents = [];  // empty — findings handle this now
sentenceUnderstanding.narrativeContributions = [];  // empty
```

This bridge lets us deploy Phase 1 without waiting for every consumer to migrate.

**Verification**: Run the full pipeline on 3 test essays.
- Walk output tokens should drop ~40-50%
- Walk cost should drop proportionally
- Finding count should be HIGHER (mandatory, not optional)
- Finding quality should be RICHER (LLM has more cognitive budget)
- L3.5 scoring should be at least as good (reading findings + primaryFunction)
- L5/L6 should be at least as good (finding-grounded context)

**Risk**: MEDIUM. The walk prompt change is the biggest single-point risk. If the LLM produces poor findings, quality drops everywhere. Mitigated by the backward compatibility bridge (can revert if needed).

### Phase 2: Consumer Migration

**Goal**: Every downstream consumer reads findings and `primaryFunction` instead of observation arrays. Remove the backward compatibility bridge.

**Changes (in order)**:

1. **L3.5 analysis pass** — Replace [U] label construction from observations with [F] label construction from findings + `primaryFunction`. The analysis prompt already sees findings; just make them primary and remove the observation section.

2. **L5 deep annotation service** — Replace `buildObservationLabelSummary()` with finding-based context. Already has `buildAnnotationFindingContext()` — make it the sole source.

3. **Holistic synthesis** — Replace the observation-reading code (lines 768-773) with finding-based context. L3.75 should read findings + paragraph prose, not raw sentence observations.

4. **L6 coaching reinterpretation** — Replace `inferredIntents[]` mutation with finding supersession. When a student says "I meant X, not Y," create a new finding with `source: 'coaching'` that supersedes the relevant walk finding. The finding lifecycle already handles this.

5. **Focused analyzer** — Replace `newObservations` output with `findingEvolutions` output. The focused walk produces finding deltas, not observation array replacements.

6. **Edit understanding service** — Replace observation-change counting with finding-change counting as impact signal.

7. **Cross-domain validation** — Replace observation text collection with finding text collection.

8. **Profile router** — Update context assembly to pass `primaryFunction` + findings instead of full observation arrays. Token savings cascade to every downstream prompt.

9. **Insight mutator** — Update routing logic to use finding supersession instead of observation array replacement.

**Verification**: Full pipeline on 3 test essays. Compare quality metrics against Phase 0 baseline (before any changes). Quality should be EQUAL OR BETTER (findings are richer context than observations).

**Risk**: MEDIUM-LOW. Each consumer migration is independent and testable. Can be done one at a time.

### Phase 3: Type Cleanup

**Goal**: Remove `ObservationEntry[]` from `SentenceUnderstanding`. Clean up dead code.

**Changes**:

1. **Make observation arrays optional in `SentenceUnderstanding`**:
```typescript
observedFunctions?: ObservationEntry[];  // DEPRECATED — use findings
inferredIntents?: ObservationEntry[];    // DEPRECATED — use findings
narrativeContributions?: ObservationEntry[];  // DEPRECATED — use findings
```

2. **Add new fields to `SentenceUnderstanding`**:
```typescript
primaryFunction: string;
significance: 'pivotal' | 'contributing' | 'transitional';
findingRefs: string[];  // which findings reference this sentence
```

3. **Remove backward compatibility bridge** from `parseWalkOutput()`.

4. **Remove observation-specific code** from sentenceMutator, insightMutator, focusedAnalyzer, analysisPass, deepAnnotationService, holisticSynthesis.

5. **Keep `ObservationEntry` type** — L3.5 still uses it for `SentenceAnalysis.strengths[]` and `.weaknesses[]` (evaluative, not descriptive). Those are a DIFFERENT use case and should stay.

**Risk**: LOW. All consumers already migrated in Phase 2. This is cleanup.

---

## The Coaching Reinterpretation Migration (Detailed)

This is the hardest single migration point. Currently:

```
Student says: "I meant that paragraph to be ironic"
→ coachingService reads inferredIntents[] for targeted sentences
→ Stage 4 (Sonnet) evaluates: which intents confirmed, which superseded
→ insightMutator REPLACES inferredIntents[] with updated array
```

After migration:

```
Student says: "I meant that paragraph to be ironic"
→ coachingService reads findings scoped to targeted sentences
→ Stage 4 (Sonnet) evaluates: which findings confirmed, which superseded
→ findingStore creates new finding (source: 'coaching', claim: student's reading)
→ findingStore supersedes contradicted findings (maturity → 'superseded')
→ Growth log records the reinterpretation
```

This is BETTER because:
- Finding supersession preserves history (the original finding still exists at 'superseded' maturity)
- The student's reading becomes a first-class finding with evidence and scope
- The growth engine can investigate the divergence (text says X, student says Y → coaching opportunity)
- No mutable state on SentenceUnderstanding — findings are the single source of truth

### What Changes in coachingService.ts

1. **`gatherTargetedObservations()`** → **`gatherTargetedFindings()`**: Instead of reading `sentence.understanding.inferredIntents`, read findings scoped to the targeted paragraphs/sentences from the FindingStore.

2. **Stage 4 reinterpretation prompt**: Change [U] labels to [F] labels. The prompt already evaluates "confirmed vs superseded" — just change what it's evaluating.

3. **Post-Stage-4 mutation**: Instead of calling `coordinator.applyLightTouchUpdate({ type: 'inferred_intent', intentUpdates })`, call `coordinator.supersedeFinding(findingId)` and `coordinator.addFinding(studentReading)`.

4. **Remove the `FIX C3.2: Precise supersession` block** (lines 1296-1398): This 100-line block exists because observation supersession is blunt (array replacement). Finding supersession is PRECISE by design — each finding is individually superseded or confirmed. The entire block becomes unnecessary.

---

## Risk Mitigation

### Quality Regression Detection

At each phase, run the pipeline on 3 diverse test essays:
1. A strong essay (should produce deep findings, Level 4-5 understanding)
2. A weak essay (should produce structural findings, Foundation-phase coaching)
3. An essay after student edits (should produce focused re-analysis)

Compare:
- **Finding count**: Should increase (mandatory, not optional)
- **Finding maturity distribution**: Should show natural spread (not all hypothesis)
- **Walk output tokens**: Should decrease ~40-50% in Phase 1
- **Walk output cost**: Should decrease proportionally
- **L3.5 scoring quality**: Score distributions should be similar
- **L5 annotation quality**: Annotations should be more architecturally grounded
- **L6 coaching quality**: Coaching should reference findings, not generic observations

### Rollback Strategy

Phase 0 is fully additive — no rollback needed.
Phase 1 has the backward compatibility bridge — can revert walk prompt and bridge produces old format.
Phase 2 is per-consumer — can revert individual consumers independently.
Phase 3 is cleanup — no rollback needed (all consumers already migrated).

---

## Implementation Estimate

| Phase | Scope | Files Changed | Risk |
|-------|-------|---------------|------|
| Phase 0: Preparation | Make findings mandatory, add primaryFunction, teach consumers to prefer findings | 5-6 files | LOW |
| Phase 1: Walk Evolution | Rewrite walk prompt + output schema, add bridge | 2 files | MEDIUM |
| Phase 2: Consumer Migration | Migrate 9 consumers from observations to findings | 9 files | MEDIUM-LOW |
| Phase 3: Type Cleanup | Remove deprecated observation arrays, clean up dead code | 6-8 files | LOW |

Phase 0 can be implemented alongside Gaps 1, 2, 4 (they're independent).
Phase 1 should follow Phase 0 + testing.
Phases 2-3 can be done incrementally, one consumer at a time.

---

## Dependency on Gaps 1, 2, 4

This migration is INDEPENDENT of the three additive gaps (essay understanding prose, persistent question queue, maturity analysis). They can be implemented in any order. However:

- **Gap 1 (essay understanding prose) benefits from this migration**: The synthesis call that produces the prose will read findings (richer) instead of observations (shallower).
- **Gap 2 (persistent question queue) is unaffected**: Questions are produced by L3.75, not by the walk's observation arrays.
- **Gap 4 (maturity analysis) benefits from this migration**: More findings = more maturity data = better gap detection.

**Recommended order**: Gaps 1+2+4 first (additive, low risk), then Phase 0 of this migration (also additive), then Phase 1+ (walk evolution).
