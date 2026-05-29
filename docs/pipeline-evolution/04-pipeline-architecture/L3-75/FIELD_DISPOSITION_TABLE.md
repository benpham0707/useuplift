# L3.75 Field Disposition Table

> **Status**: `approved` — design decisions resolved 2026-05-07 (Tue). Extends [`L3_ABSORBS_L3_75.md`](./L3_ABSORBS_L3_75.md) by applying the **structural-composition discipline**: every field that can be produced deterministically from upstream data IS produced deterministically. LLM calls are reserved for the irreducible synthesis residue.
>
> **Purpose**: build spec. The implementation plan writes itself row-by-row from this table.
>
> **Last updated**: 2026-05-07.

---

## TL;DR

L3.75 today emits ~45 distinct output fields across Phase A (4 sections) + Phase B (6 sections) + the SignatureMove micro-call. Today's pipeline pays one large Sonnet synthesis call (~$0.49 on Crochet) to produce all of them.

After this disposition:

| Disposition | Count | Cost | What it means |
|---|---|---|---|
| **DET** — Deterministic composition | 17 fields | $0 | Pure-function aggregation/filtering/topology over L3 walk + L3.5 data. No LLM. |
| **LENS** — Lens-direct LLM emission | 28 fields | (rolled into L3 redesign) | Emitted by a L3 dimension lens prompt as a canonical profile field. Already in absorption plan. |
| **RESIDUE** — Small post-lens synthesis call | 4 fields | ~$0.05 (was $0.08 in absorption plan; reduced by moving more to DET) | One bounded Sonnet call producing only fields that are genuinely cross-dimension and can't be templated. |
| **L35** — Migrated to L3.5 output | 3 fields | $0 (additive on existing call) | Already-locked migrations from absorption plan. |
| **L4B** — Migrated to L4b ImprovementManifest | 1 field | $0 | Already-locked migration. |
| **CUT** — Deleted entirely | 8+ fields | $0 (savings) | Already-locked cuts; no consumer migrations beyond the ones in absorption plan. |
| **MICRO** — Standalone micro-call (SignatureMove) | 1 field | ~$0.04 | Stays as today; validator pattern proven. |

**Net cost**: ~$0.09–0.10/essay for L3.75-equivalent work (was ~$0.49 today, ~$0.30 after consolidated changeset, ~$0.08 in pure absorption plan). The marginal gain over the absorption plan comes from pushing **emotionalTopography.peakMoments + emotionalProgression**, **craftSignatures aggregation**, **stabilityRegions**, **imageSystem aggregation**, **threads.appearances** indices, and **connectionGraphSummary** out of LLM emission entirely.

**Net architectural impact**: same as absorption plan (delete `holisticSynthesis.ts` + iteration orchestration + Meta + Curation), plus a new pure-function module `compositionLayer.ts` (~300–400 lines, fully unit-testable, zero I/O).

---

## Principle: three categories of work

L3.75 today does FOUR things at once. The disposition separates them by who's the right owner:

| Category | What it is | Right owner | Examples |
|---|---|---|---|
| **Aggregation/topology/filtering** | Collecting, counting, sorting, graph-walking over data the walk already produced | Pure function (DET) | `emotionalProgression`, `craftSignatures`, `connectionGraphSummary`, `threads.appearances` |
| **Dimension distillation** | Naming what's there: turning a dimension's observations into a canonical profile field | LLM dimension lens (LENS) | `voiceIdentity.signature`, `thematicArchitecture.centralThesis`, `tellabilitySummary` |
| **Cross-dimension synthesis** | Naming what emerges from ≥2 dimensions interacting | Small LLM residue call (RESIDUE) | `writerPortrait` (Voice + Meaning + Admissions), `entanglements`, `arcTrajectory` |
| **Standalone emergent claim** | Picking ONE thing from many candidates and naming it with craft vocabulary | Validated micro-call (MICRO) | `signatureMove` |

Composition rules are **brittle differently from LLMs**: when structure shifts, they fail loudly (null fallback) rather than degrading gracefully. The discipline that keeps this safe: every DET rule has a defined fallback (elide / smaller version / explicit absent marker), and the calibration constants live in one inspectable place.

---

## Phase A — Voice + Emotion + Earned-ness

### voiceIdentity (5 fields)

| Field | Disposition | Source | Composition rule / LLM contract | Fallback when source null | Calibration |
|---|---|---|---|---|---|
| `signature` | LENS (Voice) | Voice lens prompt | Lens emits a one-paragraph distillation of dimensional observations | "(voice signature unavailable)" elided from UI | — |
| `register` | LENS (Voice) | Voice lens | Single string from primary-register taxonomy | Inherit from L3 walk `holisticEvolution.voiceSignature` first-pass | — |
| `distinctivePatterns` | DET | L3 walk `craftProfile.voiceConsistency` across paragraphs | Aggregate distinct voice descriptors mentioned in ≥2 paragraphs; cap 5; sort by frequency desc | Empty array (renderer skips section) | `MIN_PATTERN_PARAGRAPHS = 2`, `MAX_PATTERNS = 5` |
| `evolution` | LENS (Voice) | Voice lens | Lens emits a narrative-of-voice-movement string | Elide section | — |
| `authenticVsPerformed[]` | DET | L3 walk `paragraphUnderstanding.emotionalRegister.authenticity` per paragraph | Filter paragraphs where authenticity field flags performed/authentic divergence; emit one entry per flag | Empty array | `AUTHENTICITY_FLAG_THRESHOLD` (string-pattern match against performed-language indicators) |

**Why split**: `signature`, `register`, `evolution` are dimension distillation — naming requires LLM voice perception. `distinctivePatterns` and `authenticVsPerformed` are aggregation/filtering of data the walk already named.

### voiceMap (7 fields)

| Field | Disposition | Source | Composition rule / LLM contract | Fallback | Calibration |
|---|---|---|---|---|---|
| `register.baseline` + `register.observations[]` | LENS (Voice) | Voice lens | Lens emits 1 baseline string + ≤2 observations per dimension | Default to L3 walk `holisticEvolution.voiceSignature` | `MAX_OBS_PER_DIM = 2` (already in prompt) |
| `vocabularyFingerprint.baseline` + `observations[]` + `domains[]` | LENS (Voice) | Voice lens | Same. `domains[]` extracted from sentenceUnderstandings tags + significantChoices | Empty arrays | — |
| `sentenceRhythm.baseline` + `observations[]` | LENS (Voice) | Voice lens | Same shape | Default from L3 walk `craftProfile.rhythmPattern` aggregated | — |
| `perspectiveDistance.baseline` + `observations[]` | LENS (Voice) | Voice lens | Same shape | Empty | — |
| `tonalDisposition.baseline` + `observations[]` + `dominantQualities[]` | LENS (Voice) | Voice lens. `dominantQualities[]` is closed enum of TonalQuality | Same shape | Empty | — |
| `shifts[]` | LENS (Voice) | Voice lens | Lens emits 1 entry per detected voice shift with intentionality assessment | Empty (signals no detected shifts) | `INTENTIONALITY_LOW_CONFIDENCE = 0.6` (already in prompt) |
| `stabilityRegions[]` | **DET** | L3 walk `craftProfile.voiceConsistency` per paragraph + `voiceMap.shifts[]` | Run-length encode paragraphs between shifts; emit each run with paragraphs[] + characterizing voice from walk | Empty array if essay has voice shift in every paragraph | `MIN_RUN_LENGTH = 2` (single-paragraph regions skip; renderer drops) |

**Why split**: dimension baselines + observations need lens perception (naming the register, picking textual evidence). Shifts need intentionality reasoning. **Stability regions are pure inverse — wherever shifts aren't, voice is stable.** No LLM call needed.

### emotionalTopography (6 fields)

| Field | Disposition | Source | Composition rule / LLM contract | Fallback | Calibration |
|---|---|---|---|---|---|
| `arcTrajectory` | RESIDUE | Story lens emotionalProgression + Voice lens tonalDisposition + Meaning lens stakes | One sentence binding three lens outputs into the emotional-arc narrative | Concat per-paragraph emotional registers as fallback prose | — |
| `peakMoments[]` | **DET** | L3 walk `paragraphUnderstanding.emotionalRegister.strongestMoment` + `dominantEmotion` per paragraph | Filter paragraphs where `strongestMoment != null`; emit `{ location, emotion: dominantEmotion, intensity: classifyByDepth }` | Empty array | `INTENSITY_MAP = { high: ['peak', 'high'], moderate: ['moderate'], low: ['low'] }` derived from walk's `emotionalRegister.depth` |
| `undertones[]` | **DET** | L3 walk `emotionalRegister.dominantEmotion` (aggregated) − `emotionalRegister.showVsTell == 'told'` emotions | Set-difference: emotions present in walk but never told explicitly | Empty array | `MIN_UNDERTONE_OCCURRENCES = 2` (single-paragraph emotion isn't an undertone) |
| `emotionalProgression[]` | **DET** | L3 walk `emotionalRegister` per paragraph | Map each paragraph to `{ paragraph: i, register: dominantEmotion, shift: deltaFromPrior }` | Empty for first paragraph (no prior) | Shift-detection: string-similarity threshold or category change |
| `showVsTell[]` | **DET** | L3 walk `emotionalRegister.showVsTell` per paragraph + per-sentence | Aggregate sentences where showVsTell is explicit assessment; cap 4 | Empty array | `MAX_SHOW_VS_TELL_ENTRIES = 4` (already in prompt) |
| `authenticityAssessment` | LENS (Voice or Story) | Voice or Story lens emits one ≤40-word headline | Lens-direct | Inherit from L3 walk if cross-paragraph authenticity is consistent | `MAX_WORDS = 40` |

**The win here is large**: 4 of 6 emotionalTopography fields are pure aggregation. Today's L3.75 reads the walk's per-paragraph emotional data and re-types it into these arrays — that's exactly what a pure function does, faster, deterministically, free.

### momentEarnednessMap (2 fields)

| Field | Disposition | Source | Composition rule / LLM contract | Fallback | Calibration |
|---|---|---|---|---|---|
| `moments[]` (location, momentType, description, payload, gaps[]) | RESIDUE (location selection) + DET (gap detection) | Pass 3 names moments + payloads; gaps come from connection-graph absence checks | Pass 3 emits `{ location, momentType, description, payload }`; pure function adds `gaps[]` by checking which mechanism types have zero arrows pointing AT the moment in the connection graph | Empty moments array means essay lacks identifiable peak structure | `MECHANISM_ABSENCE_THRESHOLD = 0` (zero arrows = gap) |
| `moments[].mechanisms[]` | **PASS 3 RESIDUE** (per L3_ABSORBS plan) | Connection graph + setup-payoff arrows | One Sonnet call traces arrows backward from each peak moment, naming each as one of 7 mechanism types with contribution prose | Empty mechanisms array (signals unearned moment) | `MECHANISM_TYPES` (closed enum) |
| `structuralObservation` | LENS (Story) | Story lens | One-sentence essay-level setup-payoff architecture summary | Default from connection-graph topology | — |

**Subtlety**: moments themselves are SELECTED by Pass 3 (the residue call) because picking which paragraphs count as peak moments requires synthetic judgment. But once selected, the **mechanisms list** for each moment IS produced by Pass 3 (LLM, since it's tracing connections to named mechanism types), and the **gap detection** for each moment is a pure-function inverse (mechanism types absent from the mechanisms list = gaps).

---

## Phase B — Theme + Narrative + Character + Craft + Admissions + Cross-cutting

### thematicArchitecture (6 fields)

| Field | Disposition | Source | Composition rule / LLM contract | Fallback | Calibration |
|---|---|---|---|---|---|
| `centralThesis` | LENS (Meaning) | Meaning lens | Distill essay's central meaning into one sentence | Use L3 walk `holisticEvolution.centralThesis` from final paragraph | — |
| `thesisConfidence` | **CUT** | (was numeric 0-1) | — | — | Decision per absorption plan |
| `thesisEvolution` | LENS (Meaning) | Meaning lens | Narrative of how thesis emerges and crystallizes | Concat per-paragraph centralThesis updates from walk | — |
| `threads[].thread` + `.strength` | LENS (Meaning) | Meaning lens | Lens names threads and assigns strength enum | Empty | `THREAD_STRENGTH_ENUM` (closed) |
| `threads[].introducedAt` + `.appearances[]` (paragraph-only) | **DET** | L3 walk per-paragraph `narrativeContribution` + tags | For each thread named by Meaning lens, scan walk paragraphs for matching tags or thread-name occurrences; emit paragraph-only locations | Empty appearances (means thread is hinted/dropped) | `THREAD_MATCH_PATTERN` per-thread tag matching |
| `subtext` | LENS (Meaning) | Meaning lens | "Implied but never stated" — lens distillation | Empty (renderer elides if absent) | — |
| `contradictions[]` | **DET (with LENS validation)** | L3.5 `contradictionFlags[]` (per absorption plan) | Project from L3.5's flagged contradictions where `lens1 == 'meaning' \|\| lens2 == 'meaning'` | Empty array | — |

**Win**: thread appearances (the index lists) are pure pattern-matching. Today the LLM is asked to enumerate "which paragraphs each thread appears in" — that's a search over walk data, not synthesis.

### narrativeStrategy (8 fields)

| Field | Disposition | Source | Composition rule / LLM contract | Fallback | Calibration |
|---|---|---|---|---|---|
| `primaryStrategy` (with embedded rationale, per absorption Decision Cuts) | LENS (Story) | Story lens | One-sentence strategy + embedded reasoning | — | — |
| `strategyRationale` | **CUT** (merged into primaryStrategy) | — | — | — | Per absorption plan |
| `arcType` | LENS (Story) | Story lens | Single string: transformation / revelation / journey / mosaic / circular / accumulation | Inherit from L3 walk `holisticEvolution.arcMomentum` | `ARC_TYPE_ENUM` |
| `arcMomentum` | **CUT** | — | — | — | Per absorption plan |
| `turningPoint` | LENS (Story) | Story lens | Single location or null | Null | — |
| `pivotPoints[]` | LENS (Story) | Story lens | Lens emits 1 entry per pivot with description | Empty | `MAX_PIVOT_POINTS = 5` |
| `pacingAnalysis` | LENS (Story) | Story lens | Prose on pacing | — | — |
| `structuralChoices[]` | **DET** | L3 walk `paragraphUnderstanding.role` distinct values + structural tags | Aggregate distinct structural roles + significant tags across paragraphs into a deduped list | Empty | `STRUCTURAL_TAG_VOCAB` (closed list of tags counted as structural) |

### characterRevelation (6 fields)

| Field | Disposition | Source | Composition rule / LLM contract | Fallback | Calibration |
|---|---|---|---|---|---|
| `writerPortrait` | **PASS 3 RESIDUE** | Voice signature + signatureMove + Admissions character signals + walk's strongestMoments | Lunch-with paragraph cross-pulling 3 lens outputs | Concat default with explicit "(portrait incomplete)" marker | — |
| `valuesRevealed[]` | LENS (Admissions) | Admissions lens (with revealedQualities merged in per absorption) | Lens emits values shown not told | Empty | — |
| `revealedQualities[]` | **CUT** (merged into valuesRevealed) | — | — | — | Per absorption plan |
| `growthArc` | LENS (Story or Character) | Story or Character lens | Lens emits interpretive growth-arc claim ("the arc tracks not just X but Y"). Templating can't produce the second-layer reframe; walk's `narrativeContribution` captures architectural function, not narrator status. | Empty string (UI elides section) | — |
| `intellectualFingerprint` | **CUT** (1-sentence merged into writerPortrait) | — | — | — | Per absorption plan |
| `blindSpots[]` | **CUT** entirely | — | — | — | Per absorption plan Decision A |

### craftAssessment (5 fields)

| Field | Disposition | Source | Composition rule / LLM contract | Fallback | Calibration |
|---|---|---|---|---|---|
| `craftSignatures[]` | **DET** | L3 walk `sentenceUnderstandings[].craft.techniques[]` per sentence + per-paragraph `craftProfile` | Aggregate techniques across all sentences; for each technique, emit `{ quality, evidence: top-1 quote, paragraphs: [indices where it appears] }`; cap 8; sort by frequency desc | Empty | `MIN_TECHNIQUE_OCCURRENCES = 2`, `MAX_SIGNATURES = 8` |
| `craftPatterns[]` (without `pairedImprovement`) | LENS (distributed: Voice for rhythm/word patterns, Meaning for image system, Story for pacing) | Each lens emits patterns in its dimension | — | Empty | `MAX_PATTERNS = 5` |
| `craftPatterns[].pairedImprovement` | **L4B** (per absorption plan) | — | Migrated to L4b ImprovementManifest | — | Per absorption plan |
| `imageSystem` | **DET** | Walk's `connections.imageRecurrences[]` + per-sentence techniques where `'imagery' \|\| 'metaphor' \|\| 'personification'` | Compose prose from image-recurrence list + cross-paragraph imagery threads: "Images: X (P1, P3, P5), Y (P2, P4) — [detected pattern: recurring/transforming/isolated]" | "(no image system detected)" | `RECURRING_IMAGE_THRESHOLD = 2`, `TRANSFORMING_IMAGE_DETECT` (semantic shift between occurrences) |
| `sentencePatterns` | **CUT** (numeric distribution stats) — replaced by LENS prose `sentenceRhythmProse` from Voice lens | — | — | — | Per absorption plan |
| `wordPatterns` | LENS (Voice) | Voice lens | Prose on recurring words / register tendencies / vocabulary choices | — | — |

**The big DET wins here**: craftSignatures is a pure aggregate over walk data. imageSystem is essentially formatting `imageRecurrences[]` (already in walk's connection graph) plus a templated pattern-naming. Both are wasteful LLM work today.

### admissionsPositioning (8 fields)

| Field | Disposition | Source | Composition rule / LLM contract | Fallback | Calibration |
|---|---|---|---|---|---|
| `tellabilitySummary` | LENS (Admissions) | Admissions lens | 30-second AO description, perspective-shifted to admissions | — | — |
| `distinctivenessFactors[]` | LENS (Admissions) | Admissions lens | Specific to THIS essay's execution | Empty | — |
| `institutionalFit` | LENS (Admissions) | Admissions lens | Positive signals only (per absorption) | Empty | — |
| `redFlags[]` (each WITH `fix` field per absorption) | LENS (Admissions) | Admissions lens | Each entry must have actionable fix; entries without fix dropped | Empty | `REDFLAG_REQUIRES_FIX = true` |
| `memorability` | LENS (Admissions) | Admissions lens | Elements that persist after 50 essays | — | — |
| `portfolioPosition` | **CUT** | — | — | — | Per absorption plan |
| `aoTakeaway` | LENS (Admissions) | Admissions lens | What an AO would conclude | — | — |
| `archetypeContext.archetype` | LENS (Sweep — already in absorption) | Sweep emits archetype name | — | — | — |
| `archetypeContext.poolDensity` | **CUT** | — | — | — | Per absorption plan |
| `archetypeContext.differentiator` | LENS (Admissions) | Admissions lens | Within-archetype distinctiveness | Null | — |

### Cross-cutting: entanglements + connections + findings

| Field | Disposition | Source | Composition rule / LLM contract | Fallback | Calibration |
|---|---|---|---|---|---|
| `entanglements[]` | **PASS 3 RESIDUE** | All lens outputs + walk | One call: locations where ≥2 lens observations converge meaningfully. Cap 3, foundational/supporting only | Empty | `MAX_ENTANGLEMENTS = 3`, drop `subtle` significance |
| `connectionGraphSummary` (prose) | **DET** | L3 walk `profile.connections.all` + topology | Compute graph stats: max-degree (hub), components (islands), longest-path (linear), branching factor; render templated prose: "Hub-and-spoke topology with P{n} as primary hub. {k} structural islands at P{a}, P{b}." | "Sparse connections — essay's architecture is paragraph-isolated" | `HUB_THRESHOLD = max-degree ≥ 4`, `LINEAR_THRESHOLD = longest-path == n-1`, `WEB_THRESHOLD = avg-degree ≥ 2.5` |
| `newConnections[]` (cross-essay echoes invisible to walk) | LENS (likely Meaning + Story) | Distributed across lenses that see full essay | Lenses emit entries for connections the walk couldn't see | Empty | — |
| `connectionUpgrades[]` | DET | Walk's connections + lens-detected stronger context | Pure compute: if a lens cites a walk connection with new reverseIllumination or stronger evidence, emit upgrade record pointing to walk's connection ID | Empty | — |
| `newFindings[]` | DIRECT (already in walk + lens emissions) | Walk + lenses write directly to FindingStore | Already-locked decision per absorption #3 | — | — |
| `findingEvolutions[]` | LENS / RESIDUE on demand | Walk emits within paragraph; lenses can mature on full-essay view | Already-locked: lens prompts produce findingEvolutions when full-essay view shifts maturity | — | — |

**connectionGraphSummary** is the cleanest example of "this should never have been an LLM call." Graph topology is `O(V+E)` compute; the prose template is 5 sentences max. Today's LLM call burns tokens to redescribe what `networkx`-style algorithms produce in microseconds.

---

## SignatureMove (standalone micro-call)

| Field | Disposition | Source | Composition rule / LLM contract | Fallback | Calibration |
|---|---|---|---|---|---|
| `signatureMove` (whole struct or null) | **MICRO** (separate validated call) | Validated Sonnet micro-call against full essay + lens outputs | Same as today (proven pattern post-Gap-1). Validator drops to null on substring drift / paragraph-index drift / generic vocabulary | Null (essay's craft is distributed, not concentrated) | `SIGNATURE_MOVE_MAX_TOKENS = 3000`, `MIN_INSTANCES = 3`, substring + paragraph-index validators |

**Why MICRO not RESIDUE**: signatureMove is a different kind of synthesis — it's *selecting one move from many candidates and naming it with craft vocabulary*. The validator pattern (substring grounding + paragraph-index check + null-on-drift) makes it reliably implementable. Combining it with Pass 3's writerPortrait/entanglements/arcTrajectory/mechanisms call would dilute both.

---

## Disposition counts — final tally

| Disposition | Phase A | Phase B | Cross-cutting | Total |
|---|---|---|---|---|
| **DET** (deterministic) | 7 | 5 | 5 | **17** |
| **LENS** (lens-direct) | 7 | 20 | 1 | **28** |
| **PASS 3 / RESIDUE** | 2 | 1 | 1 | **4** (writerPortrait, arcTrajectory, mechanisms, entanglements) |
| **L35** (migrated) | 0 | 1 (strengthSignatures→L3.5) + 2 (contradictionFlags + ess. authenticity from existing L3.5) | 0 | **3** |
| **L4B** (migrated) | 0 | 1 (pairedImprovement) | 0 | **1** |
| **CUT** | 0 | 8+ | 0 | **8+** (thesisConfidence, arcMomentum, strategyRationale, portfolioPosition, poolDensity, revealedQualities, intellectualFingerprint, blindSpots, sentencePatterns numeric, threads.appearances sentence granularity) |
| **MICRO** | 0 | 0 | 1 (signatureMove) | **1** |

---

## Composition Layer — module spec

A new pure-function module: `src/services/essayIntelligence/analysis/compositionLayer.ts`.

**Contract**:
- Pure functions only. No I/O, no LLM calls, no async (except where consuming async data structures).
- Each function takes typed inputs (subsets of `EssayProfile` + L3.5 outputs) and returns a typed slice of the holistic profile.
- Each function has 3+ unit tests including null-slot, empty-array, and single-item edge cases.
- All calibration constants live at the top of the file as named exports, grouped by section.

**Functions** (one per DET disposition):

```typescript
// Voice
export function composeVoiceDistinctivePatterns(profile): VoicePattern[];
export function composeVoiceAuthenticVsPerformed(profile): AuthenticityFlag[];
export function composeVoiceStabilityRegions(profile, voiceShifts): StabilityRegion[];

// Emotion
export function composeEmotionalPeakMoments(profile): PeakMoment[];
export function composeEmotionalUndertones(profile): string[];
export function composeEmotionalProgression(profile): ProgressionEntry[];
export function composeEmotionalShowVsTell(profile): ShowVsTellEntry[];

// Theme
export function composeThreadAppearances(profile, threadNames: string[]): Map<string, ParagraphIndex[]>;
export function projectMeaningContradictionsFromL35(l35Output): string[];

// Narrative
export function composeStructuralChoices(profile): string[];

// Craft
export function composeCraftSignatures(profile): CraftSignature[];
export function composeImageSystem(profile): string;

// Connections
export function composeConnectionGraphSummary(connections): string;
export function composeConnectionUpgrades(walkConnections, lensCitations): ConnectionUpgrade[];

// Earnedness (gap detection only — moments come from RESIDUE)
export function composeEarnednessGaps(moment, mechanisms): MechanismType[];
```

**Calibration constants block** — keyed per `EssayType` (`'common_app' | 'supplement' | 'piq'`):

```typescript
type CompositionCalibration = {
  voice: {
    MIN_PATTERN_PARAGRAPHS: number;
    MAX_PATTERNS: number;
    MIN_STABILITY_RUN_LENGTH: number;
  };
  emotion: {
    MAX_SHOW_VS_TELL_ENTRIES: number;
    MIN_UNDERTONE_OCCURRENCES: number;
    INTENSITY_MAP: Record<'high' | 'moderate' | 'low', readonly string[]>;
  };
  theme: {
    MIN_THREAD_APPEARANCES: number;
  };
  craft: {
    MIN_TECHNIQUE_OCCURRENCES: number;
    MAX_SIGNATURES: number;
    RECURRING_IMAGE_THRESHOLD: number;
    MAX_PATTERNS: number;
  };
  connections: {
    HUB_DEGREE_THRESHOLD: number;
    WEB_AVG_DEGREE_THRESHOLD: number;
  };
};

export const CALIBRATION: Record<EssayType, CompositionCalibration> = {
  common_app: {
    // Personal statement (~650 words, 4–7 paragraphs). Default profile.
    voice: { MIN_PATTERN_PARAGRAPHS: 2, MAX_PATTERNS: 5, MIN_STABILITY_RUN_LENGTH: 2 },
    emotion: { MAX_SHOW_VS_TELL_ENTRIES: 4, MIN_UNDERTONE_OCCURRENCES: 2, INTENSITY_MAP: { /* ... */ } },
    theme: { MIN_THREAD_APPEARANCES: 1 },
    craft: { MIN_TECHNIQUE_OCCURRENCES: 2, MAX_SIGNATURES: 8, RECURRING_IMAGE_THRESHOLD: 2, MAX_PATTERNS: 5 },
    connections: { HUB_DEGREE_THRESHOLD: 4, WEB_AVG_DEGREE_THRESHOLD: 2.5 },
  },
  piq: {
    // PIQ (~350 words, 2–4 paragraphs). Lower thresholds — fewer paragraphs to support patterns.
    voice: { MIN_PATTERN_PARAGRAPHS: 2, MAX_PATTERNS: 3, MIN_STABILITY_RUN_LENGTH: 2 },
    emotion: { MAX_SHOW_VS_TELL_ENTRIES: 3, MIN_UNDERTONE_OCCURRENCES: 2, INTENSITY_MAP: { /* ... */ } },
    theme: { MIN_THREAD_APPEARANCES: 1 },
    craft: { MIN_TECHNIQUE_OCCURRENCES: 2, MAX_SIGNATURES: 5, RECURRING_IMAGE_THRESHOLD: 2, MAX_PATTERNS: 3 },
    connections: { HUB_DEGREE_THRESHOLD: 3, WEB_AVG_DEGREE_THRESHOLD: 2.0 },
  },
  supplement: {
    // Short supplement (~150–250 words, 1–3 paragraphs). Aggressive caps — short essays should
    // not over-emit patterns. Single-paragraph supplements skip stability-region computation.
    voice: { MIN_PATTERN_PARAGRAPHS: 1, MAX_PATTERNS: 2, MIN_STABILITY_RUN_LENGTH: 1 },
    emotion: { MAX_SHOW_VS_TELL_ENTRIES: 2, MIN_UNDERTONE_OCCURRENCES: 1, INTENSITY_MAP: { /* ... */ } },
    theme: { MIN_THREAD_APPEARANCES: 1 },
    craft: { MIN_TECHNIQUE_OCCURRENCES: 1, MAX_SIGNATURES: 3, RECURRING_IMAGE_THRESHOLD: 2, MAX_PATTERNS: 2 },
    connections: { HUB_DEGREE_THRESHOLD: 2, WEB_AVG_DEGREE_THRESHOLD: 1.5 },
  },
};
```

**Calibration test surface**: each composition function must be tested against all 3 essayType calibrations using genre-representative fixtures. Crochet (`common_app`), a PIQ fixture, and a short supplement fixture form the calibration test suite. Snapshot parity gates run per-genre.

**Tuning protocol**: if post-launch telemetry shows an essayType-genre over- or under-firing on any composition, the change is editing `CALIBRATION[essayType]` constants — not adding new code paths.

**Test coverage requirements**:
- Each composition function has ≥3 unit tests with synthetic `EssayProfile` fixtures.
- Test cases must include: empty walk, single-paragraph essay, walk with no significantChoices, walk with all-null emotional registers.
- Calibration-edge tests: thresholds at exactly the boundary value.

---

## Residue Call (Pass 3) — contract

Renamed from absorption plan's "Pass 3" to emphasize what it actually is: the small, bounded, irreducible-synthesis call.

**Inputs**: All lens outputs + sweep + essay text + walk's connection graph + setup-payoff arrows.

**Outputs (4 fields)**:

1. `characterRevelation.writerPortrait` — lunch-with paragraph (cross-pulls Voice + Meaning + Admissions; not templated because human-energy framing is irreducibly emergent).
2. `entanglements[]` — locations where ≥2 lens observations converge. Cap 3, foundational/supporting only.
3. `emotionalTopography.arcTrajectory` — one sentence binding Story arc + Voice tonal + Meaning stakes (templated alternatives produce stitched-together prose; an LLM produces emotionally coherent prose).
4. `momentEarnednessMap.moments[].mechanisms[]` — backward-traces each peak moment through the connection graph; names mechanism types from closed enum with contribution prose.

**Hard constraints**:
- Output cap 3,000 tokens.
- Single Sonnet call.
- No iteration. Forever. (Anti-drift commitment from absorption plan.)
- Descriptive only — no judgment vocabulary.
- Inheritance discipline: every emitted field traces to named lens outputs in inputs. No re-reading the essay to fill lens gaps; that's a lens prompt fix.
- Validator pattern (drop-to-null on drift) applied per-field.

**Cost estimate**: ~$0.04–0.06 per essay (smaller than absorption's $0.08 because we've moved peakMoments + emotionalProgression + connectionGraphSummary out of this call into DET).

---

## Verification strategy — snapshot parity gate

**Before any L3.75 retirement ships**:

1. Implement `compositionLayer.ts` against the existing Crochet + Three Days dumps (already on disk per R6 JSON persistence).
2. For each DET function, produce its output against both fixtures' walk data.
3. Diff against the existing L3.75 output for the equivalent field.
4. Acceptance: composition output is **semantically equivalent or richer** for every field.
   - "Equivalent" = same paragraphs/sentences cited, same techniques named, same topology classification.
   - "Richer" = composition surfaces patterns L3.75 missed (rare but possible — exhaustive aggregation can outperform LLM sampling).
   - "Worse" = LLM identified something via context that templates miss → that field gets reclassified from DET to LENS or RESIDUE in this table, and we update the architecture.

**This verification is zero-API-cost.** It uses the persisted Crochet + Three Days JSON dumps. Failures here are surfaced before any pipeline run.

**After snapshot parity passes**:
- One $1.70 dump regen run on Crochet to verify the full new pipeline (Sweep + lenses + composition + residue + L3.5 + L4 + L5).
- Compare against Crochet's prior dump for: dimension coverage parity, AO Gut Reaction quality, signatureMove preservation, R1 ≤5.

---

## Dependencies on other workstreams

This plan inherits all preconditions from `L3_ABSORBS_L3_75.md`:

1. ✅ Cost-recovery R1 prompt fix (just shipped, commit `f181f84`).
2. ⬜ L3 redesign lands (lenses + sweep schemas exist).
3. ⬜ Conversator (02) and RAG (03) design docs land.
4. ⬜ Tue approves implementation.

It adds one new dependency:

5. ⬜ **Composition Layer specifications signed off** (this doc) — without explicit calibration constants and rule definitions, the snapshot parity gate has nothing to test against.

---

## Lens-failure behavior

When a lens times out or returns malformed JSON, behavior depends on whether walk-side data exists for the affected fields:

**Inherit-from-walk where the walk has an equivalent.** Walk's `holisticEvolution` produces thinner versions of several lens-emitted fields. When a lens fails, composition functions check for the walk-side equivalent and use it as the field value:

| Lens-emitted field | Walk-side equivalent | Inherit on lens failure? |
|---|---|---|
| `thematicArchitecture.centralThesis` | `holisticEvolution.centralThesis` (final paragraph) | Yes |
| `voiceIdentity.signature` (1-paragraph distillation) | `holisticEvolution.voiceSignature` (one-line) | Partial — use the one-line as fallback signature |
| `narrativeStrategy.arcType` | `holisticEvolution.arcMomentum` (cut, but value still flows during transition) | No (arcMomentum is being cut anyway) |
| `voiceMap.shifts[]` | (no walk equivalent) | No — emit empty array |
| `admissionsPositioning.tellabilitySummary` | (no walk equivalent — perspective shift requires AO frame) | No — emit empty string, UI elides section |
| `narrativeStrategy.primaryStrategy` | (no walk equivalent) | No — emit empty |
| `signatureMove` | (no walk equivalent — selection logic only at synthesis time) | No — emit `null` (already the validator's drift behavior) |

**Composition functions that depend on lens-emitted upstream data** (e.g., `composeThreadAppearances` needs Meaning lens to name threads first) emit an empty result on upstream lens failure. They never fabricate.

**Hard rule**: no L3.75-style synthesis-as-fallback. If both the lens fails AND the walk has no equivalent, the field is absent from the profile and the renderer elides it. Better to surface gaps than to paper over them with hallucinated synthesis.

This rule is documented in each composition function's JSDoc contract and tested with synthetic null-lens fixtures.

---

## Resolved decisions (2026-05-07, Tue)

All five open questions resolved at design review:

| # | Question | Decision | Reasoning |
|---|---|---|---|
| 1 | `growthArc` — DET or LENS? | **LENS** (Story or Character lens) | Templating produces architectural-function listing, not growth narrative. The interpretive reframe ("the arc tracks not just X but Y") is irreducibly emergent. |
| 2 | `institutionalFit` — DET or LENS? | **LENS** (Admissions lens) | Today's output reframes essay content into institutional signals ('crochet as wizardry'). DET would type-cast every essay in same archetype to identical fit. |
| 3 | `arcTrajectory` — RESIDUE or DET? | **RESIDUE** (Pass 3 LLM) | Templating produces register listing, not arc shape. Synthesis claims like "not cathartic—cumulative" and cross-section gap detection require simultaneous lens-output reading. |
| 4 | Calibration constants — `as const` or per-essayType config? | **Per-essayType from start** | `CALIBRATION[essayType]` keyed by `'common_app' \| 'supplement' \| 'piq'`. PS / PIQ / supplement have different sensible thresholds; pre-paying complexity beats refactor later. |
| 5 | Lens-failure behavior | **Inherit from walk where equivalent exists; emit empty otherwise** | No L3.75-style fallback synthesis. Walk's `holisticEvolution` is descriptive, real signal — using it as a fallback is honest, not degraded. |

---

## What this table commits us to

If approved, this table becomes the build spec. Implementation order:

1. Implement `compositionLayer.ts` against existing Crochet + Three Days persisted JSON. ($0)
2. Snapshot parity gate per-field. ($0)
3. Specify lens prompts (LENS rows) per L3 redesign. (already in plan)
4. Specify residue call prompt (4 fields, validator-per-field). ($0 spec)
5. One verification dump regen on Crochet. (~$1.70)
6. If parity passes + verification clean: ship the absorption PR (delete L3.75, wire composition + residue + lens emissions, migrate consumers).

Total marginal API spend before retirement: $1.70 (the one verification run shared with R1 + R2 + R3 + R4 + R6).
