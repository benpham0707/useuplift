> # ⚠️ SUPERSEDED — DO NOT IMPLEMENT
>
> **Status**: SUPERSEDED on 2026-04-24 by [`L3_ABSORBS_L3_75.md`](./L3_ABSORBS_L3_75.md).
>
> **Why superseded**: this redesign preserved L3.75 as a distinct layer with iteration + Meta + Curation + UnderstandingProse, applying inheritance discipline against the redesigned L3 lenses. Subsequent first-principles audit (2026-04-24) found that under inheritance discipline + the cost-recovery convergence-prompt fix, L3.75 has no remaining load-bearing job that doesn't belong to either L3 or L3.5. The lens outputs ARE the holistic profile; only ~4 cross-dimension fields (writerPortrait, entanglements, emotionalTopography.arcTrajectory, momentEarnednessMap.mechanisms) need cross-synthesis, and that's a single small call inside L3 ("Pass 3"), not a layer.
>
> **What this doc still has value for**:
> - The §3 inheritance map (which lens output produces which holistic field) is reusable as the basis for "lens emits profile field directly" in the absorb plan.
> - The §11 fixture-05 stress test demonstrates expected lens-output quality.
> - The §12 failure mode audit catalogs risks that still apply to the smaller cross-synthesis step.
>
> **What this doc gets WRONG**:
> - Treats L3.75 as a layer worth preserving. It isn't.
> - The Meta / Curation / iter_1 / Reread / UnderstandingProse calls are theater — kill them, don't redesign them.
> - The cost projection ($0.26/essay for redesigned L3.75) underestimates savings because it kept the layer.
>
> **Authoritative plan**: see [`L3_ABSORBS_L3_75.md`](./L3_ABSORBS_L3_75.md).

---

# L3.75 Redesign — Holistic Integration Layer

> **Scope:** redesign L3.75 under the architectural pattern established by the L3 redesign — zero-overlap ownership, inheritance discipline from dimension-organized lens outputs, descriptive-only synthesis, evidence-cited claims, downstream field routing. Target: reduce per-essay L3.75 cost from today's ~$0.55–0.72 to ~$0.25–0.35 *while* raising the synthesis quality ceiling to $500/hr-consultant level.
>
> **Siblings:** `COST_DEADWEIGHT_AUDIT.md` (per-layer cost concentration), `OUTPUT_CUT_LIST.md` (field-level redundancy). This document is the authoritative L3.75 design the implementation agent consumes after the L3 redesign lands.
>
> **Source-of-truth prior art:** the L3 redesign (Sweep → 4 parallel lens deep reads: Story & Narrative Drive, Meaning Architecture, Voice & Authenticity, Admissions Impact & Differentiation, each emitting dimension-organized evidence-cited fields with `DownstreamField` routing tags). Current runtime lives in `src/services/essayIntelligence/analysis/holisticSynthesis.ts` and will be replaced end-to-end.

---

## 1. Exclusive-job statement

**L3.75 integrates the L3 Sweep + lens deep-read outputs into essay-whole, dimension-organized, descriptive synthesis profiles that L3.5 judges against, L4 NorthStar narrows from, L5 annotates under, and L6 coaches from — and it does nothing else.**

"Integrates" is a carefully chosen verb: synthesis from already-produced dimension outputs, not re-analysis of the essay. If L3.75 ever re-reads the essay to form a new voice/theme/narrative conclusion the Voice/Meaning/Story lens already produced, that is a leak by definition. Integration is L3.75's sole verb.

---

## 2. Ownership boundaries

### L3.75 OWNS (exclusive)

| Capability | Output field family | One-line contract |
|---|---|---|
| Essay-whole voice identity synthesis | `voiceIdentity` | Inherits Voice lens's `voiceSignature` + distinctiveness + register compounding → 1-paragraph holistic signature + protective tics + risky tics |
| Spatial voice map | `voiceMap` | Inherits Voice lens's `dimensionalRegisters` + `consistencyRegions` + `shifts` → 5-dim baseline/observation/shift spatial structure |
| Cross-lens emotional landscape | `emotionalTopography` | Pulls from Story (arcTrajectory + peakMoments) + Voice (tonalDisposition) + Meaning (stakes) → one emotional arc with undertones + authenticity signal |
| Earned-moment network | `momentEarnednessMap` | Pulls from Meaning (meaningGaps + detail audit) + Story (stakesLadder + setups) + Sweep (connection graph) → backward-tracing mechanism network with density-not-booleans diagnosis |
| Thematic architecture | `thematicArchitecture` | Inherits Meaning's `throughLine` + `subtextMap` + `tensions` + `threadAppearances` → centralThesis + subtext + threads (paragraph-granular) + productive contradictions |
| Narrative strategy | `narrativeStrategy` | Inherits Story's `arcType` + `primaryStrategy` + `pivotPoints` + `turningPoint` + `pacingAnalysis` |
| Character revelation | `characterRevelation` | Cross-pulls Voice (how the writer sounds) + Meaning (what they value + contradict) → writerPortrait "lunch-with" paragraph + values (not qualities) + blindSpots + growthArc |
| Craft assessment (**descriptive only**) | `craftAssessment` | Pulls imageSystem from Meaning, sentenceRhythm/wordPatterns from Voice, pacing shape from Story → describes the craft architecture. **No strengthSignatures. No growthEdges. No judgment.** |
| Admissions positioning | `admissionsPositioning` | Inherits Admissions lens's `tellabilitySummary` + `archetype` + `differentiator` + `memorability` + `redFlags` + `distinctivenessFactors` |
| Cross-dimension entanglements | `entanglements` | Synthesizes moments where ≥2 lens observations converge at the same location — foundational and supporting only (no subtle) |
| Reading strategy | `readingStrategy` | Meta call: declares what this iteration concentrated on and why, based on lens-dispatch outputs and prior-iter deltas |
| Finding promotion & queue curation | `promotedFindings`, `curatedQuestionQueue` | Meta + Curation calls: surfaces lens-emitted walk findings that are now architecturally load-bearing; trims the question queue for the next iter or dispatch |
| Convergence judgment | `metaConvergence` | Meta call: binary converged + reasoning citing delta magnitudes |
| Optional free-form essay understanding prose | `essayUnderstanding.prose` | Only fires on first iter, consumed exclusively by `EssayPortrait.tsx` — writer-facing narrative |

### L3.75 DOES NOT OWN (and cannot leak into)

| Not owned | Layer that owns it | Leak symptom to watch for |
|---|---|---|
| Per-paragraph effectiveness / verdict / growthEdges | **L3.5** | L3.75 emitting `ParagraphAnalysis` fields or using "effective"/"weak"/"works"/"fails" language |
| Dimension scoring (numeric or bucketed) | **L3.5** | L3.75 emitting any 0-100 score, rubric bucket, or grade band |
| Sentence-level isStrength / isProblem | **L3.5** | L3.75 marking any sentence as a strength or problem |
| craftAssessment's strength signatures with evidence | **L3.5 (essay-level)** | Any `strengthSignatures[]` entry emitted by L3.75 |
| craftAssessment's growth edges + pairedImprovement | **L3.5 + L4b ImprovementManifest** | Any `growthEdges[]` with `directive` or `technique` field |
| Strategic framing / what to protect / what to change | **L4 NorthStar** | Any "protect X in revision" or "cut Y" language |
| Improvement prioritization / revision sequence | **L4b ImprovementManifest** | Any ordered fix list with impact labels |
| Writer-facing translation / revision prompts | **L5 deepAnnotationService** | Any second-person imperative ("try X", "consider Y") |
| Coaching angles / conversation hooks | **L6 coachingService** | Any "ask the student whether..." phrasing |
| Re-derivation of what a lens already concluded | **L3 lenses** | Any field whose content is L3.75's own first-pass read instead of a synthesis of named lens outputs |
| Judgment language of any kind | **L3.5 / L4** | `forbidden vocabulary` violations (see §7 Prompts) |

**Sharpest edge:** the current `CraftAssessment` type has `strengthSignatures[]` and `growthEdges[]` with paired-improvement technique + directive + architectural reason + demonstration sketch + expected impact. **All of these exit L3.75.** The redesigned `CraftAssessment` emits *only* descriptive craft architecture (image system prose, rhythm prose, word-pattern prose, pacing-shape prose). L3.5 essay-level then owns strength/growth identification; L4b ImprovementManifest owns the `pairedImprovement` payload. This is the biggest type-level break in the redesign and the clearest zero-overlap discipline gain.

---

## 3. Inheritance map

**Rule:** every L3.75 output field must trace to one or more named lens outputs it synthesizes from. If a field doesn't trace, it is re-analysis and must be cut OR a lens gap must be documented in §15.

Source codes: `SW` = Sweep (Pass 1), `SL` = Story lens, `ML` = Meaning lens, `VL` = Voice lens, `AL` = Admissions lens.

### voiceIdentity
| Field | Source | Synthesis op |
|---|---|---|
| `signature` (1-paragraph) | `VL.voiceSignature` + `VL.distinctivePatterns` | Prose-bind lens's structured signature into a vivid paragraph |
| `primaryRegister` (compound, 2 adjectives) | `VL.registerProfile` | Select best 2-adjective compound from lens's register analysis |
| `distinctivePatterns[]` | `VL.distinctivePatterns` | Direct inheritance (top 3-5 by lens confidence) |
| `evolution` (prose) | `VL.evolution` + `VL.shifts` | Bind shift-timeline into narrative prose |
| `authenticVsPerformed[]` | `VL.authenticitySignals` | Filter lens's signal list to top 3-5 by confidence, carry citations |
| `voiceMarkers[]` (protective tics) | `VL.distinctivePatterns` where `positive=true` | Tag-split lens output |
| `voiceWeaknesses[]` (risky tics) | `VL.registerReaches` or `VL.voiceReaches` | Tag-split lens output |
| `registerShifts[]` | `VL.shifts` filtered to register-only dimension | Filter + project |

### voiceMap
| Field | Source | Synthesis op |
|---|---|---|
| `register.baseline` + `observations[]` | `VL.dimensionalRegisters.register` | Direct carry |
| `vocabularyFingerprint.*` + `domains[]` | `VL.dimensionalRegisters.vocabulary` + `VL.vocabularyDomains` | Direct carry + domain aggregation |
| `sentenceRhythm.*` | `VL.dimensionalRegisters.rhythm` | Direct carry |
| `perspectiveDistance.*` | `VL.dimensionalRegisters.perspective` | Direct carry |
| `tonalDisposition.*` + `dominantQualities[]` | `VL.dimensionalRegisters.tonal` + `VL.tonalQualities` | Direct carry |
| `stabilityRegions[]` | `VL.consistencyRegions` | Direct carry |
| `shifts[]` (with `intentionality`) | `VL.shifts` | Direct carry |

### emotionalTopography
| Field | Source | Synthesis op |
|---|---|---|
| `arcTrajectory` (prose) | `SL.arcTrajectory` + `SL.emotionalRegister[]` | Bind Story's arc + emotional-register sequence into one arc-prose |
| `peakMoments[]` | `SL.peakMoments` | Direct carry (filter duplicates) |
| `undertones[]` | `ML.subtextMap.emotionalUndertones` + `VL.tonalDisposition.dominantQualities` | Cross-pull + dedupe |
| `emotionalProgression[]` | `SL.emotionalRegister[]` paragraph-indexed | Project to paragraph-granular array |
| `showVsTell[]` | `ML.detailAudit.showVsTellLocations` | Direct carry (filter to top 5) |
| `authenticityAssessment` | `VL.authenticityAssessment` + `SL.emotionalAuthenticitySignals` | Cross-pull to one paragraph |

### momentEarnednessMap
| Field | Source | Synthesis op |
|---|---|---|
| `moments[].location + momentType + description + payload` | `SL.peakMoments` + `ML.payoffMoments` | Unify peak set (dedupe by location) |
| `moments[].mechanisms[]` | `SW.connections` + `ML.setupEarningMap` + `SL.stakesLadder[]` | Backward-trace: for each moment, find every earlier `SW.connection` with `to.location` at the moment + every `ML.setupEarningMap` entry targeting it + every `SL.stakesLadder` rung before it |
| `moments[].gaps[]` | `ML.meaningGaps` filtered to moment-adjacent | When `mechanisms.length < 2`, attach nearby `meaningGaps` entries |
| `structuralObservation` | Derived from density distribution | Count-bucket prose: "5 of 7 moments carry ≥3 mechanisms; 2 moments (P4S2, P9S1) carry 0 — setup-payoff architecture is strong in the body, thin at the frame" |

### thematicArchitecture
| Field | Source | Synthesis op |
|---|---|---|
| `centralThesis` | `ML.throughLine.thesis` | Direct carry (lens produces the canonical thesis) |
| `thesisEvolution` | `ML.throughLine.evolutionNarrative` | Direct carry |
| `threads[]` (paragraph-granular appearances) | `ML.threadAppearances` | Project sentence-granular lens output to paragraph granular; drop threads with <2 appearances after projection |
| `subtext` | `ML.subtextMap.centralSubtext` | Direct carry |
| `contradictions[]` | `ML.tensions[]` filtered `significance≥supporting` | Direct carry (cap 2) |

`thesisConfidence` is **CUT** from the schema (§10). Lens's own confidence lives on the lens output and L3.5/L4 read it from there.

### narrativeStrategy
| Field | Source | Synthesis op |
|---|---|---|
| `primaryStrategy` (includes rationale) | `SL.strategyType` + `SL.strategyRationale` | Merge the two into one prose field |
| `pivotPoints[]` | `SL.pivotPoints` | Direct carry |
| `turningPoint` | `SL.turningPoint` | Direct carry (null when lens emits null) |
| `pacingAnalysis` | `SL.pacingAnalysis` | Direct carry |
| `structuralChoices[]` | `SL.structuralChoices` filtered | Dedupe against `craftAssessment.sentencePatterns` textually |
| `arcType` | `SL.arcType` | Direct carry |

`arcMomentum`, `strategyRationale` (standalone), and `structuralChoices` overlaps with `sentencePatterns` are **CUT** per `OUTPUT_CUT_LIST.md` §A + §B.

### characterRevelation
| Field | Source | Synthesis op |
|---|---|---|
| `writerPortrait` (lunch-with paragraph) | `VL.writerVoiceFingerprint` + `ML.valueArchitecture` + `AL.characterSignals` | Cross-pull: bind voice-as-person + values-demonstrated + AO-readable qualities into one paragraph |
| `valuesRevealed[]` | `ML.valueArchitecture.revealedValues` | Direct carry (cap 4, each must cite text) |
| `growthArc` | `SL.growthArc` if present, else `ML.throughLine.growthNarrative` | Direct carry |
| `blindSpots[]` | `ML.tensions[]` where `significance=subtle` + `AL.redFlags` unconfirmed | Cross-pull (cap 3) |

`intellectualFingerprint` is **CUT as a separate field** — a single-sentence "how you think" line is merged into `writerPortrait`. `revealedQualities` is **CUT** (merged survivors into `valuesRevealed`). See `OUTPUT_CUT_LIST.md`.

### craftAssessment (DESCRIPTIVE ONLY)

| Field | Source | Synthesis op |
|---|---|---|
| `imageSystem` (prose, architecture + progression) | `ML.imageAnchors` + `ML.metaphorSystems` | Bind lens output into architecture-prose (not a list of images) |
| `sentenceRhythmProse` | `VL.dimensionalRegisters.rhythm.baseline` + `VL.sentenceRhythmObservations` | Bind rhythm observations into prose (no numeric distribution stats) |
| `wordPatterns` (prose) | `VL.vocabularyDomains` + `VL.distinctivePatterns` | Bind lexical-cluster descriptions into prose |
| `pacingShape` (prose) | `SL.pacingAnalysis` with craft focus | Project Story's pacing with craft-layer lens |

**Cut from the type entirely:**
- `strengthSignatures[]` → moves to L3.5 essay-level output
- `growthEdges[]` with `pairedImprovement` → moves to L4b ImprovementManifest
- Numeric `sentencePatterns` distribution statistics → dropped; rhythm prose carries the information density

### admissionsPositioning
| Field | Source | Synthesis op |
|---|---|---|
| `tellabilitySummary` (30-sec AO pitch) | `AL.tellabilitySummary` | Direct carry |
| `distinctivenessFactors[]` | `AL.distinctivenessFactors` | Direct carry (cap 3-5) |
| `institutionalFit` (positive signals only) | `AL.institutionalFit.signals` | Direct carry; drop negative-fit half |
| `redFlags[]` (each with structural pattern + fix) | `AL.redFlags` with `fix` field required | Direct carry; drop entries where lens did not supply a fix |
| `memorability` (prose, "do not cut these") | `AL.memorability` | Direct carry |
| `aoTakeaway` | `AL.aoTakeaway` | Direct carry (cap AO questions to 1-2) |
| `archetypeContext.archetype` | `SW.archetype.name` | Direct carry from Sweep |
| `archetypeContext.differentiator` | `AL.archetypeDifferentiator` | Direct carry |

**Cut from type:** `portfolioPosition` (duplicates institutionalFit + aoTakeaway), `archetypeContext.poolDensity` (not actionable).

### entanglements
| Field | Source | Synthesis op |
|---|---|---|
| Full list | Cross-lens merge: pairs of lens observations citing the same location | Scan location-indexed observations across VL/ML/SL/AL; emit entanglement when ≥2 dimensions carry meaningful observations at the same `[paragraph, sentence]` location AND the intersection adds meaning beyond the individual observations. Cap 3 total. |
| `significance` | Derived | Drop `subtle` entirely (per `OUTPUT_CUT_LIST.md`); emit only `foundational` + `supporting` |

### Meta/Curation/prose

| Field | Source | Synthesis op |
|---|---|---|
| `readingStrategy` | Synthesizer's own iteration decisions | What this iteration concentrated on; declared in the Meta call |
| `promotedFindings[]` | `SW.walkFindings` + lens `findings[]` cumulative | Meta call filters to those now architecturally load-bearing |
| `curatedQuestionQueue[]` | Lens `questionsForNextPass[]` + unresolved `meaningGaps` | Curation call: prune, merge, rank |
| `metaConvergence` | Delta magnitudes across iter-N vs iter-(N-1) | Meta call computes converged + reasoning |
| `essayUnderstanding.prose` | All 10 synthesized sections | Separate light call; first iter only |

**Inheritance integrity check (run at L3.75 entry):** every lens output field carrying a `DownstreamField` routing tag pointing at `l3_75.*` must be consumed by this map. Fields carrying `DownstreamField` → `l3_5.*` or `l4.*` or `l5.*` pass through untouched. If a lens emits a field claiming `l3_75.X` but X is not in this map, fail the iteration with a "lens→L3.75 wiring gap" error (§13 failure mode).

---

## 4. Architectural decision — Phase A/B split

**Decision: collapse to a single synthesis call. The A/B split does not survive the redesign.**

### Why the split exists today
Today's L3.75 does first-pass analysis from the raw walk: it reads sentence-level understanding + paragraph roles + holisticEvolution accumulator, and *produces* voice/emotion/earnedness/thematic/narrative/character/craft/admissions/entanglements largely from scratch. Output balloons to ~18K tokens when attempted in one call, truncating reliably on craft-phase essays. The split (Phase A: voice+emotion+earnedness+entanglements, 8K; Phase B: thematic+narrative+character+craft+admissions, 10K) exists for *output-token budget*, not for architectural reason.

### Why it doesn't survive the redesign
Under inheritance discipline, L3.75 is no longer producing voice/theme/narrative/admissions from raw walk. It is *synthesizing* from already-structured lens outputs. Concretely:
- Voice fields become prose binds + direct carries from `VL` structured output. Voice emission drops from ~2.5K tokens to ~1.5K tokens.
- Theme fields become direct carries from `ML`. Emission drops from ~2K to ~1.2K.
- Narrative fields become direct carries from `SL`. Emission drops from ~1.5K to ~1K.
- CraftAssessment sheds `strengthSignatures[]` (21 entries worth) and `growthEdges[]` (11 entries with pairedImprovement). Emission drops from ~2.3K to ~700 tokens.
- AdmissionsPositioning drops portfolioPosition, poolDensity, negative-fit half. Emission drops from ~1.5K to ~800.

Projected single-call output: ~7.5K–8.5K tokens. Max tokens = 10K gives ~20–30% headroom. Well within one Sonnet call.

### Why single-call is better than split under inheritance
- **Coherent entanglements.** Entanglements are cross-dimension; splitting voice+emotion from theme+narrative means entanglements must be produced in one phase without seeing the other's output. Today this works because both phases get the same raw walk input; post-redesign, entanglements should see all four lens outputs *and* the in-flight synthesis, which only a single call achieves.
- **Consistent `writerPortrait`.** The lunch-with paragraph cross-pulls voice + meaning + admissions. A split forces Phase B to reproduce voice conclusions (leak) or cite Phase A's output from prior-call state (brittle).
- **One output-schema contract.** Two phases = two schemas = two parsers = two failure modes. Collapsing shrinks the JSON-repair surface area.
- **Cache hit rate.** A single synthesis call reads the same input (sweep + 4 lens outputs + essay text) once, enabling one cache write + potential future reads on iter1.

### Pressure test
- *"What if output still truncates on dense essays?"* Raise `max_tokens` to 12K (still cheap: 12K × $15/1M = $0.18 ceiling). Concretely: fixture 05 Phase B today hits 10K hard; under inheritance the same essay projects to ~7.5K. Headroom is architectural, not aspirational.
- *"What if the single call degrades on attention across 4 lens outputs + essay + sweep simultaneously?"* Sonnet handles ~40K input tokens routinely; lens outputs sum to ~8K + sweep 3K + essay 2K + system 2K = ~15K input. Attention budget is comfortable.
- *"What about parallelism?"* Today A and B run in parallel (~5s wall). Single call is ~8-10s wall. Net latency regression = 3-5s — acceptable; caching on iter1 recovers this.

**Decision locked:** one synthesis call, `max_tokens = 10000`, `temperature = 0.3` (tighter than today's 0.4 because inheritance requires less generativity).

---

## 5. Architectural decision — iteration loop

The growth cycle survives the redesign, but under **delta-only discipline** that matches the lighter synthesis workload.

### Growth cycle shape (redesigned)

```
iter_0:
  [1] SYNTHESIZE (single call)             ← reads Sweep + 4 lens outputs + essay
  [2] META          (single call, 3K tok)  ← reads iter_0 synthesis + lens questions + walk findings
       emits: readingStrategy, promotedFindings, curatedQuestionQueue, metaConvergence, rereadCandidates
  [3] gate: converged? → EXIT (most essays)
  [4] pick top-K reread candidates (K ≤ 2)

iter_1:
  [5] REREAD        (0-K calls)            ← scoped per-paragraph re-read with lens-delta focus
  [6] DELTA-SYNTH   (single call)          ← ONLY sections affected by rereads + unresolved questions
  [7] META          (single call)          ← convergence on iter_1 (forced exit after iter_1)

[8] UNDERSTANDING-PROSE (iter_0 only, fire-and-forget) ← single light call, writer-facing narrative
```

### Delta-only discipline on iter_1

**Rule:** iter_1 re-emits ONLY sections where (a) a reread produced materially new understanding, OR (b) the Meta call flagged specific unresolved questions targeting that section. Sections with no delta are not touched — they are inherited verbatim from iter_0 in the profile.

Concretely, `DeltaSynthesisOutput` carries `affectedSections: HolisticSectionType[]` naming the subset being re-emitted. HolisticMutator applies supersession only to named sections. This already exists in the current runtime — preserved.

Why this matters: today's iter_1 cost is $0.48 because it re-emits all 10 sections even when only 1-2 changed. Under delta-only with typical 1-2 section coverage, iter_1 projects to ~$0.08-0.15. Meta's own cost ~$0.03 stays constant.

### Meta convergence firing

Meta emits `metaConvergence: { converged: boolean; reasoning: string; deltaMagnitudes: Record<HolisticSectionType, 'none' | 'minor' | 'material'> }`. The convergence function is:

```
converged = every section delta ∈ {'none', 'minor'}
         AND no unresolved question in the queue targets a section with 'material' potential
         AND rereadCandidates.length === 0
```

This is an LLM-driven assessment, not a formula — Meta's system prompt specifies the criteria, the LLM judges and supplies reasoning. The boolean drives a hard gate: converged=true exits the cycle, no iter_1 fired.

**iter_1 forced exit.** After one delta-synth + one meta, the cycle exits regardless of convergence. The iter1 budget ceiling is hard-coded (reread ≤ 2 paragraphs, delta-synth ≤ 4 sections). Anything still unresolved becomes a `l3_75.remainingQuestions[]` output → propagates to L6 coaching for student-facing resolution. This matches the today's 11-run sample where 10/11 exited at iter_0 and the lone iter_1 cost $0.475 (with today's full-resynth bug): post-redesign, iter_1 is bounded at ~$0.25 worst case.

### Reread candidate selection

Meta flags up to 2 reread candidates from these sources:
1. **Lens-flagged disagreement:** a lens emitted `walkDisagreement: { paragraphIndex, reason }` because its read conflicts with the walk's understanding at that paragraph.
2. **Unresolved `meaningGaps`** from Meaning lens where `severity='blocking'`.
3. **Voice-lens `intentionalityAmbiguity`** at `confidence < 0.6` (shift present but unresolved intentional vs unintentional).

Threshold: a candidate survives only if it carries a specific actionable signal the reread could resolve. Generic "this paragraph might benefit from a second look" never survives. The current 73%/run reread rate is a calibration bug, not a feature — under the redesign, expected rate drops to 15-25%/run.

**What a reread inherits:** the specific lens signal (not the full essay re-walk), the paragraph text, the paragraph's current lens observations. It emits ONLY an updated per-paragraph understanding patch with `rereadReason: 'lens-disagreement' | 'meaning-gap' | 'voice-ambiguity'`. Delta-synth then picks up the patch.

### Why this survives the L3 redesign

Question arose in design: with 4 parallel lens deep-reads doing concentrated per-dimension analysis up front, is the iteration loop still needed? Answer: yes, but for different reasons than today.
- Today: iteration exists because first-pass synthesis is coarse and needs refinement.
- Redesign: iteration exists because lenses run in parallel and occasionally produce *cross-lens disagreements* that only a holistic view can resolve (e.g., Voice says "authentic throughout", but Meaning flags a `meaningGap` at P7 where the authenticity claim and the subtext claim conflict). Meta detects these; reread resolves them.

Without iteration, those cross-lens disagreements silently ship to L3.5/L4. With iteration, they're either resolved or flagged as open questions for L6. Quality-load-bearing. Keep.

---

## 6. Architectural decision — UnderstandingProse

**Decision: keep; fire on iter_0 only, after Meta converges (or after iter_1 exits); single Sonnet call, fire-and-forget from the orchestrator's perspective but still awaited before L3.5 starts.**

### What it consumes
- The full `HolisticSynthesisOutput` (post-convergence, so stable).
- The essay text.
- NOT the lens outputs directly — prose operates on the synthesis, not the raw material. (If the synthesis can't support the prose, the gap is in synthesis, not prose.)

### What it emits
A single `essayUnderstanding.prose: string` — 3-5 paragraphs, writer-facing, describing what the system understood the essay to be. Narrative prose, not analytical. Consumed exclusively by `EssayPortrait.tsx`.

### Why it fires once (iter_0) not per-iter
Prose is a writer-facing rendering of the stable understanding profile. It has no downstream consumers beyond the portrait UI. Firing per-iteration would produce 2× cost and likely 2 different prose outputs, picking the later one for no quality gain. Firing once post-convergence is sufficient.

### Why it survives
It's $0.05-0.08 per essay, consumed by a real UI component, and has no overlap with any other L3.75 output or downstream layer. It's a thin writer-facing translation of the synthesis. Cost-benefit is net positive.

### When it skips
- If post-convergence synthesis is flagged `isComplete=false` OR `missingSections.length > 0`. Don't produce writer-facing prose on an incomplete understanding — misleads the writer.
- On `DeltaSynthesis` only runs (ripple re-analysis mode from Focused analysis path). Those runs patch the profile; the prose from the original comprehensive run remains in place.

### Bug preserved-fix: `response.text` → `response.content`
Per `COST_DEADWEIGHT_AUDIT.md §D4`, this call was silently failing pre-Phase-B-session. Post-fix, it must be audited in the cost ledger. The redesigned runtime asserts non-empty `prose` at parse time and records the call in cost telemetry.

---

## 7. System prompts

All prompts written as production-draft. Discipline directives, anti-generic ❌/✅ examples, citation requirements, inheritance rules. System prompts are cacheable blocks; user prompts carry per-call inputs.

### 7.1 SYNTHESIZER — system prompt

```
You are the HOLISTIC INTEGRATION LAYER of an essay-intelligence pipeline. You
sit between the 4 lens deep-reads (Story & Narrative Drive, Meaning
Architecture, Voice & Authenticity, Admissions Impact & Differentiation) that
just produced dimension-organized observations, and the analysis layer that
judges them.

YOUR EXCLUSIVE JOB: integrate the lens outputs into essay-whole, dimension-
organized, DESCRIPTIVE synthesis profiles. You produce the holistic foundation
downstream layers judge from, narrow from, annotate under, and coach from.

=== THE ONE RULE: DESCRIPTIVE SYNTHESIS, NEVER JUDGMENT ===

You describe WHAT IS. You never evaluate HOW WELL. Evaluation belongs to the
analysis layer, not here.

FORBIDDEN VOCABULARY — any emission containing these fails the contract:
  weak, strong, effective, ineffective, successful, fails, impressive,
  lacking, excellent, poor, mediocre, masterful, sophisticated, clumsy,
  awkward, well-crafted, poorly executed, high-quality, low-quality,
  should, needs to, must, would benefit from, could be better

CONTAMINATION EXAMPLES — banned even when vocabulary is "safe":
  ❌ "The writer has a particularly authentic and engaging conversational style"
     (evaluative framing: "particularly", "engaging")
  ❌ "The emotional journey works well, building meaningfully to a satisfying resolution"
     (evaluative framing: "works well", "satisfying")
  ❌ "The metaphor system is richly sustained across paragraphs"
     (evaluative framing: "richly")

✅ "The writer uses second-person address in reflective passages (P2S1,
     P5S3) and switches to fragmented, staccato sentences during action
     sequences (P3S1-S4). Vocabulary draws from two registers: clinical
     medical terminology (P4: 'intubation', 'tachycardia') and informal
     family speech (P1, P6: 'Gram always said')."

=== THE SECOND RULE: INHERITANCE DISCIPLINE ===

You are INTEGRATING, not ANALYZING. Every field you emit must trace to one
or more named lens outputs. If you find yourself forming a new voice/theme/
narrative conclusion from the essay text that the lenses did not already
conclude, STOP — that is re-analysis and it is a contract violation. The
fix for a missed conclusion is better lens prompts in the next cycle, not
re-derivation here.

LENS OUTPUT ROUTING YOU RECEIVE:
- Voice lens → voiceIdentity, voiceMap, parts of emotionalTopography,
  parts of characterRevelation, rhythm/word patterns for craftAssessment
- Meaning lens → thematicArchitecture, momentEarnednessMap (gaps + setups),
  imageSystem for craftAssessment, parts of characterRevelation
- Story lens → narrativeStrategy, momentEarnednessMap (stakes + peaks),
  arcTrajectory for emotionalTopography, pacingShape for craftAssessment
- Admissions lens → admissionsPositioning, character signals for
  characterRevelation
- Sweep → archetype name, connection graph (feeds earnedness network),
  descriptiveNoticing (back-reference only)

CROSS-LENS SYNTHESIS POINTS (where you are NOT just carrying forward):
- emotionalTopography: bind Story arc + Voice tonal + Meaning stakes into
  one prose arc
- momentEarnednessMap: backward-trace each peak moment through the
  connection graph + setup-earning map + stakes ladder
- characterRevelation.writerPortrait: cross-pull voice-as-person + values-
  demonstrated + AO-readable qualities into a single "who-this-writer-is"
  paragraph
- entanglements: emit only where ≥2 lens observations converge at the
  same [paragraph, sentence] AND the convergence adds meaning beyond each
  individual observation

=== THE THIRD RULE: EVIDENCE CITATION ===

Every claim that references essay content must cite location:
  - Sentence-level: [paragraph, sentence] e.g. "[4, 2]" or "P4S2"
  - Paragraph-level: "P3"
  - Range: "P3–P5"
  - Textual quote: 3-8 words from the essay in "quotes"
Claims carried from lens outputs inherit the lens's citations. If a lens
did not cite, do not fabricate a citation — describe the claim without one
and let the integrity-check flag it.

=== THE FOURTH RULE: CAP DISCIPLINE ===

For list-valued fields, emit the MINIMUM COUNT that captures the essential
signal. Do not fill arrays. Hard ceilings:

- thematicArchitecture.threads: 3–5 max
- thematicArchitecture.contradictions: 1–2 max
- narrativeStrategy.pivotPoints: 2–4 max
- narrativeStrategy.structuralChoices: 3 max
- characterRevelation.valuesRevealed: 4 max
- characterRevelation.blindSpots: 3 max
- admissionsPositioning.distinctivenessFactors: 3–5 max
- admissionsPositioning.redFlags: 4 max (each MUST carry a fix; drop those
  without)
- admissionsPositioning.aoTakeaway: AO questions capped to 1–2
- entanglements: 3 max — foundational + supporting ONLY, never "subtle"
- voiceMap.shifts: dedupe co-located shifts; max 5 essay-wide
- momentEarnednessMap.moments: 4–7 (only the moments the lenses actually
  flagged as peaks or payoffs)

Quality over quantity. Each entry must be distinct — if two entries would
cite overlapping text or describe the same pattern, emit the stronger one
only.

=== THE FIFTH RULE: NO JUDGMENT FIELDS IN CRAFT ASSESSMENT ===

craftAssessment is DESCRIPTIVE ONLY. Emit these fields:
  imageSystem (prose): architecture + progression of metaphors
  sentenceRhythmProse (prose): rhythm shape across the essay
  wordPatterns (prose): lexical clusters + register
  pacingShape (prose): acceleration/deceleration across structural beats

Do NOT emit:
  strengthSignatures (any array with "quality" + "evidence")
  growthEdges (any array)
  pairedImprovement (any technique+directive structure)

If the urge arises to name a craft strength or weakness, STOP — that is
the next layer's job. Your job here ended at "here is what the craft is
doing."

=== OUTPUT ===

Return ONE JSON object matching the schema in §10 of this spec. No
markdown, no preamble, no explanation. Every paragraph index is 0-based.
Every sentence index is 0-based within its paragraph.
```

### 7.2 SYNTHESIZER — user prompt structure

```
=== ESSAY TEXT ===
{essay text with [P0], [P1], ... markers}

=== SWEEP OUTPUT (Pass 1) ===
Archetype: {sweep.archetype.name} (confidence {sweep.archetype.confidence})
Phase estimate: {sweep.phaseEstimate}
Descriptive noticing:
  imageAnchors: {sweep.descriptiveNoticing.imageAnchors[]}
  diction: {sweep.descriptiveNoticing.diction}
  rhythm: {sweep.descriptiveNoticing.rhythm}
  surfaceTextures: {sweep.descriptiveNoticing.surfaceTextures}
Paragraph roles: {sweep.paragraphs[].role}
Connection graph:
  {sweep.connections[] — id, from, to, type, significance}

=== VOICE LENS OUTPUT ===
{complete VL output — voiceSignature, dimensionalRegisters{register,vocabulary,
rhythm,perspective,tonal}, stabilityRegions, shifts, authenticitySignals,
distinctivePatterns, registerReaches, vocabularyDomains, tonalQualities,
writerVoiceFingerprint, questionsForNextPass}

=== MEANING LENS OUTPUT ===
{complete ML output — throughLine{thesis,evolutionNarrative,growthNarrative},
subtextMap{centralSubtext,emotionalUndertones}, threadAppearances, tensions,
setupEarningMap, payoffMoments, meaningGaps, imageAnchors, metaphorSystems,
detailAudit, valueArchitecture, questionsForNextPass}

=== STORY LENS OUTPUT ===
{complete SL output — arcType, arcTrajectory, strategyType, strategyRationale,
pivotPoints, turningPoint, pacingAnalysis, emotionalRegister[], stakesLadder,
peakMoments, structuralChoices, growthArc, emotionalAuthenticitySignals,
questionsForNextPass}

=== ADMISSIONS LENS OUTPUT ===
{complete AL output — tellabilitySummary, archetypeDifferentiator,
distinctivenessFactors, institutionalFit{signals}, redFlags{with fix},
memorability, aoTakeaway, characterSignals, questionsForNextPass}

=== INHERITANCE MAP (§3 of your spec) ===
{the §3 table, rendered as a compact reference block so the model can
 self-check its output trace against the allowed sources}

=== PRIOR VOICE PROFILE ===
{if priorVoiceProfile present — priorVoiceBlock rendering}

=== AI RISK SIGNAL ===
{if any — buildAiRiskSignalBlock rendering}

Produce the HolisticSynthesisOutput JSON per the schema.
```

### 7.3 META — system prompt

```
You are the META VALIDATION layer of an essay-intelligence synthesizer. You
have just received an iteration of the holistic synthesis produced from 4
lens deep-reads. Your task:

1. VALIDATE the synthesis against the lens outputs it was supposed to
   integrate — did it honor the inheritance map, or did it re-derive fields
   it should have carried forward?
2. DECLARE the reading strategy — what did this iteration concentrate on,
   and why?
3. PROMOTE FINDINGS — surface lens-emitted walk findings that are now
   architecturally load-bearing given the full synthesis view.
4. IDENTIFY REREAD CANDIDATES — up to 2 paragraphs that would materially
   change the synthesis if re-examined against a specific lens-flagged
   signal (lens-disagreement, blocking meaning-gap, voice-ambiguity < 0.6
   confidence). Generic "look at P3 again" candidates FAIL — each candidate
   must cite the specific signal and name which section the reread would
   update.
5. JUDGE CONVERGENCE. Produce a per-section delta magnitude against the
   prior iteration (or 'baseline' on iter_0) and a boolean convergence
   decision.

=== CONVERGENCE CRITERIA ===

converged = TRUE when ALL of:
  - every section delta ∈ {'none', 'minor'}
  - no unresolved question in the lens questionQueue targets a section
    with 'material' potential
  - rereadCandidates.length === 0
  - no inheritance violation detected in step 1

converged = FALSE when ANY of those fail. Your reasoning must cite
specific evidence — not "the synthesis seems stable" but "VL.shifts P7S2
has confidence 0.4 and the synthesis emitted it as intentional — that's
a material resolution gap."

=== FORBIDDEN OPERATIONS ===

You do NOT re-synthesize. You do NOT produce new holistic fields. You do
NOT judge essay quality. You only validate + strategize + promote +
identify + judge convergence.

=== OUTPUT ===

Return JSON matching the MetaOutput schema in §10.3. No markdown, no preamble.
```

### 7.4 CURATION — system prompt

```
You are the QUESTION CURATION layer. You have the cumulative question queue
from the walk + the 4 lens deep-reads + prior iterations. Many questions
are now obsolete (the synthesis answered them implicitly), some are
redundant (multiple lenses raised the same question from different angles),
some are still load-bearing for the next iteration or for student-facing
coaching.

YOUR JOB: produce a curated queue with each question tagged for routing.

ROUTING TAGS:
- 'resolved_by_synthesis' — the current synthesis answers this; drop
- 'reread_target' — this question should fire a reread in iter_1
- 'deep_dive_candidate' — warrants a dedicated deep-dive call on this
  essay (post-L3.75, pre-L3.5)
- 'coaching_handoff' — resolves only with student input; hand to L6
- 'cross_essay' — resolves only by comparing this essay to prior student
  essays; hand to portfolio-level analysis

MERGE near-duplicates within the curated set. Cap the curated queue at 6
questions total — quality over quantity.

=== OUTPUT ===

Return JSON matching the CurationOutput schema in §10.4.
```

### 7.5 UNDERSTANDINGPROSE — system prompt

```
You are a writer-facing narrator. You have received the complete, converged
holistic synthesis of a college application essay. Your task: produce 3-5
paragraphs of prose that describe what the system understood the essay to
be. This is read by the WRITER in the EssayPortrait UI.

Tone: reflective, specific, warm. Second-person permitted ("You opened with
..."). Cite paragraph numbers sparingly (max 5 in the whole prose).

Do NOT judge. Do NOT prescribe revision. Do NOT explain what the system
thinks could change. Those belong elsewhere. YOUR task is only to narrate
the writer's own essay back to them at the architectural level so they can
see what the system is reading.

Length: ~500-800 words total. Paragraphs 3-5. No lists, no headings.

=== OUTPUT ===

Plain text prose. No JSON, no preamble.
```

### 7.6 DELTA-ITER_1 — system prompt

```
You are the DELTA SYNTHESIS layer. You have the iter_0 holistic synthesis
and a set of REREAD OUTPUTS that have produced materially new understanding
for specific paragraphs and specific lens signals. Your task: re-emit ONLY
the holistic sections whose content materially changes given the new
understanding — nothing else.

INHERIT iter_0 synthesis verbatim for every section not named in
affectedSections. Never re-emit a section that did not materially change.
If the reread resolves a voice shift's intentionality at P7S2, you may
update voiceMap.shifts and possibly voiceIdentity.registerShifts. You do
NOT also update thematicArchitecture "for consistency" — leave it alone.

DISCIPLINE RULES (from §7.1) apply to every re-emitted section with no
exception: descriptive only, inheritance-traced, cap-enforced.

=== OUTPUT ===

Return JSON matching the DeltaSynthesisOutput schema — affectedSections[]
naming which sections are re-emitted, and the re-emitted sections keyed
by name. No markdown.
```

### 7.7 REREAD — system prompt

```
You are the SCOPED REREAD layer. You have been given ONE paragraph to
re-examine against ONE specific lens-flagged signal. Your task: produce an
updated per-paragraph understanding patch that resolves that signal.

Inputs you receive:
- The paragraph text
- The signal type: 'lens-disagreement' | 'meaning-gap' | 'voice-ambiguity'
- The specific lens observation(s) that raised the signal
- The current paragraph understanding (walk output + lens observations)

You do NOT re-walk the entire essay. You do NOT emit new connections
outside this paragraph. You do NOT emit holistic synthesis fields.

YOUR OUTPUT:
- A patch to ParagraphUnderstanding and/or affected SentenceUnderstandings
- A resolution of the signal: either 'resolved' with updated fields, or
  'unresolvable' with reasoning (student-facing question)

The resolution feeds back into DELTA-SYNTH which updates only the affected
holistic sections.

=== OUTPUT ===

Return JSON matching the RereadOutput schema in §10.7.
```

---

## 8. User-prompt structure recap

Each call's user prompt:

| Call | User-prompt inputs | Approx input tokens |
|---|---|---|
| SYNTHESIZER | Essay + Sweep + 4 lens outputs + (prior voice profile) + (AI risk) + inheritance map reference | ~15K |
| META | iter_N synthesis + iter_(N-1) synthesis (if present) + lens questionQueue + walk findings + inheritance-map reference + activity log | ~12K (iter_0), ~18K (iter_1) |
| CURATION | cumulative question queue + current synthesis section-by-section headlines | ~5K |
| UNDERSTANDINGPROSE | Full converged synthesis + essay text | ~10K |
| DELTA-ITER_1 | iter_0 synthesis + reread outputs + meta's affectedSections list + inheritance-map reference | ~14K |
| REREAD | Target paragraph text + signal + lens observation(s) + current paragraph understanding | ~4K |

---

## 9. Output schemas (with downstream routing)

### 9.1 `HolisticSynthesisOutput` (redesigned)

Each field tagged `→ L3.5:…` / `→ L4:…` / `→ L5:…` / `→ L6:…` indicating which downstream consumer reads it. Dead fields (no tag) are re-audited and cut.

```typescript
interface HolisticSynthesisOutput {
  voiceIdentity: {
    signature: string;           // → L3.5.essayVoiceContext, L4.northStar.voice, L6.voiceCoaching
    primaryRegister: string;     // → L4.northStar.voice, L6.voiceCoaching
    distinctivePatterns: string[]; // → L4.protect, L6.voiceCoaching
    evolution: string;           // → L3.5, L6.voiceCoaching
    authenticVsPerformed: Array<{ location: [number,number]; assessment: 'authentic'|'performed'; reasoning: string }>;
                                 // → L3.5 (per-paragraph authenticity context), L6
    voiceMarkers: string[];      // → L4.protect, L6
    voiceWeaknesses: string[];   // → L4b.priorityFeeder, L6
    registerShifts: Array<{ paragraph: number; from: string; to: string; driver: string }>;
                                 // → L5.cross-paragraph annotations, L6
    // CUT: register (legacy single-word), distinctivePatterns duplication with voiceMarkers,
    //      consistency (legacy), authenticityLevel (legacy), authenticity (legacy)
  };

  voiceMap: VoiceMap;            // unchanged structurally; carry-through from VL
                                 // → L5.per-paragraph rhythm labels, L6.voiceCoaching

  emotionalTopography: {
    arcTrajectory: string;       // → L3.5.essayEmotionContext, L4.northStar.emotion, L6
    peakMoments: Array<{ location: [number,number]; emotion: string; intensity: 'low'|'moderate'|'high'|'peak' }>;
                                 // → L4b.priorityFeeder (protect peaks), L5, L6
    undertones: string[];        // → L6, audit-render
    emotionalProgression: Array<{ paragraph: number; register: string; shift: string }>;
                                 // → L5.cross-paragraph
    showVsTell: Array<{ location: [number,number]; assessment: 'shown'|'told'|'mixed'; detail: string }>;
                                 // → L5.per-paragraph annotations, L4b
    authenticityAssessment: string; // → L4.northStar, L6
  };

  momentEarnednessMap: {
    moments: EarnedMoment[];     // → L4b.priorityFeeder (unearned moments = top priority),
                                 //   L5.per-paragraph annotations, L6
    structuralObservation: string; // → L4.northStar.structure, L6
  };

  thematicArchitecture: {
    centralThesis: string;       // → L3.5 (the canonical thesis all judgment scores against),
                                 //   L4.northStar.throughLine (LOAD-BEARING), L5, L6
    thesisEvolution: string;     // → L4.northStar, L6
    threads: Array<{ thread: string; introducedAt: { paragraph: number; sentence?: number }; appearances: Array<{ paragraph: number }>; strength: ThreadStrength }>;
                                 // → L5.cross-paragraph, L6
                                 // Note: appearances are paragraph-granular, not sentence
    subtext: string;             // → L4.northStar, L6
    contradictions: string[];    // → L4.northStar.tensions, L6
    // CUT: thesisConfidence (not actionable)
  };

  narrativeStrategy: {
    primaryStrategy: string;     // (includes rationale) → L3.5, L4.northStar.structure, L6
    pivotPoints: Array<{ location: { paragraph: number; sentence?: number }; description: string }>;
                                 // → L3.5, L5, L6
    turningPoint: { paragraph: number; sentence: number } | null;
                                 // → L3.5.structuralAnchors, L4.northStar.structure, L5 (CRITICAL)
    pacingAnalysis: string;      // → L4, L5, L6
    structuralChoices: string[]; // → L4.northStar.structure
    arcType: string;             // → L4.northStar.structure
    // CUT: arcMomentum, strategyRationale (merged into primaryStrategy)
  };

  characterRevelation: {
    writerPortrait: string;      // → L3.5.writerContext, L4.northStar.voice+character, L6 (HIGHEST-DELIGHT)
    valuesRevealed: string[];    // → L4.northStar.character, L6, portfolio
    growthArc: string;           // → L4, L6
    blindSpots: string[];        // → L4b, L6
    // CUT: intellectualFingerprint (merged 1-sentence into writerPortrait),
    //      revealedQualities (merged into valuesRevealed),
    //      essayOnlyPortrait (legacy)
  };

  craftAssessment: {             // DESCRIPTIVE ONLY
    imageSystem: string;         // → L5.annotations, L6
    sentenceRhythmProse: string; // → L5, L6
    wordPatterns: string;        // → L5, L6
    pacingShape: string;         // → L5, L6
    // CUT: strengthSignatures (→ L3.5 essay-level now)
    // CUT: growthEdges + pairedImprovement (→ L4b ImprovementManifest now)
    // CUT: sentencePatterns numeric distribution (→ implied by sentenceRhythmProse)
  };

  entanglements: Array<{
    id: string;
    dimensions: HolisticDimension[];
    location: ParagraphLocation;
    description: string;
    crossRefs: HolisticDimension[];
    significance: 'foundational' | 'supporting'; // DROPPED 'subtle'
  }>;                            // → L4.northStar.entanglements (LOAD-BEARING for distinctiveness),
                                 //   L5.cross-paragraph annotations
                                 // Cap: 3 max

  admissionsPositioning: {
    tellabilitySummary: string;  // → L4.northStar.admissions, L6 (CRITICAL for writer)
    distinctivenessFactors: string[]; // → L4b.protect, L6
    institutionalFit: string;    // positive signals only, negative-fit half cut
                                 // → L4, portfolio, L6
    redFlags: Array<{ pattern: string; fix: string }>; // entries without fix dropped at parse time
                                 // → L4b.priorityFeeder, L5, L6
    memorability: string;        // → L4b.protect, L6
    aoTakeaway: string;          // 1-2 AO questions max → L6
    archetypeContext: {
      archetype: string;         // → L6
      differentiator: string | null; // → L4.northStar.distinctiveness, L6
      // CUT: poolDensity
    };
    // CUT: portfolioPosition (duplicated institutionalFit + aoTakeaway)
  };

  newConnections?: Array<SweepConnection>;
                                 // holistic-view connections the walk + lenses missed
                                 // → profileMutator.applyNewConnections, L5
  connectionGraphSummary?: string; // → L6

  promotedFindings?: Finding[];  // Meta-call output → L4, L6
  remainingQuestions?: UnderstandingQuestion[]; // unresolved after iter_1 → L6

  connectionUpgrades?: Array<ConnectionUpgrade>; // → profileMutator
}
```

### 9.2 `MetaOutput`

```typescript
interface MetaOutput {
  readingStrategy: ReadingStrategy;
  inheritanceViolations: Array<{
    field: string;               // e.g. "voiceIdentity.signature"
    issue: 'not-traced'|'over-derived'|'fabricated-citation';
    fix: string;
  }>;
  promotedFindings: Finding[];
  rereadCandidates: Array<{
    paragraphIndex: number;
    signalType: 'lens-disagreement' | 'meaning-gap' | 'voice-ambiguity';
    signalDetail: string;
    targetSection: HolisticSectionType;
    rationale: string;
  }>;                            // max 2
  deltaMagnitudes: Record<HolisticSectionType, 'none'|'minor'|'material'>;
  metaConvergence: {
    converged: boolean;
    reasoning: string;
  };
}
```

### 9.3 `CurationOutput`

```typescript
interface CurationOutput {
  curatedQuestions: Array<{
    question: string;
    sourceLenses: Array<'voice'|'meaning'|'story'|'admissions'|'walk'>;
    routing: 'resolved_by_synthesis' | 'reread_target' | 'deep_dive_candidate'
           | 'coaching_handoff' | 'cross_essay';
    priority: 'load_bearing' | 'enriching' | 'marginal';
  }>;                            // max 6
  droppedCount: number;          // telemetry
  droppedReasons: Record<string, number>; // for audit
}
```

### 9.4 `DeltaSynthesisOutput`

```typescript
interface DeltaSynthesisOutput {
  affectedSections: HolisticSectionType[];
  sections: Partial<HolisticSynthesisOutput>; // only the named sections
  resolutions: Array<{
    rereadParagraph: number;
    signal: string;
    resolved: boolean;
    studentFacingQuestion?: string; // if unresolvable
  }>;
}
```

### 9.5 `RereadOutput`

```typescript
interface RereadOutput {
  paragraphIndex: number;
  signalType: 'lens-disagreement' | 'meaning-gap' | 'voice-ambiguity';
  paragraphUnderstandingPatch?: Partial<ParagraphUnderstanding>;
  sentenceUnderstandingPatches: Array<{
    sentenceIndex: number;
    patch: Partial<SentenceUnderstanding>;
  }>;
  resolution: 'resolved' | 'unresolvable';
  resolutionReasoning: string;
  unresolvedStudentQuestion?: string; // if unresolvable
}
```

---

## 10. Cross-layer integration check

Every field L3.5 / L4 / L5 / L6 consumes from L3.75 must be emitted; every field L3.75 emits must be consumed by someone.

### What L3.5 reads (from analysisPass.ts:200-221, 807-957)
- `narrativeStrategy.turningPoint` → **EMITTED** ✅
- `narrativeStrategy.pivotPoints` → **EMITTED** ✅
- `voiceIdentity.signature`, `voiceIdentity.evolution` → **EMITTED** ✅
- `emotionalTopography.arcTrajectory` + `peakMoments` → **EMITTED** ✅
- `thematicArchitecture.centralThesis`, `.thesisEvolution` → **EMITTED** ✅
- `thematicArchitecture.thesisConfidence` → **CUT; consumer updates** → analysisPass line 942 must stop rendering confidence score into L3.5 prompt. Replace with: inherit confidence from `ML.throughLine.thesisConfidence` directly if needed, or drop the rendering (quality audit found thesisConfidence not actionable in L3.5 prompt — dropping is cleanest).
- `narrativeStrategy.primaryStrategy`, `.pacingAnalysis` → **EMITTED** ✅
- `characterRevelation.writerPortrait`, `.valuesRevealed` → **EMITTED** ✅
- `admissionsPositioning.tellabilitySummary` → **EMITTED** ✅
- `craftAssessment.sentencePatterns`, `.wordPatterns`, `.imageSystem` → `sentencePatterns` renamed to `sentenceRhythmProse`; **consumer updates** → analysisPass line 957 renames field.

### What L4 reads (via profileRouter assembly, northStarMutator, crystallizer)
- Full `HolisticSynthesisOutput` injected as context for L4 crystallization.
- NorthStar LOAD-BEARING reads: `thematicArchitecture.centralThesis + subtext + contradictions`, `narrativeStrategy.arcType + structuralChoices + turningPoint + pivotPoints`, `voiceIdentity.signature + primaryRegister + distinctivePatterns`, `emotionalTopography.arcTrajectory`, `admissionsPositioning.tellabilitySummary + differentiator`, `characterRevelation.writerPortrait + valuesRevealed`, `entanglements` (foundational only).
- ScoreMatrix reads: all dimension fields for rubric scoring context.
- ImprovementManifest reads: `redFlags + fix`, `voiceWeaknesses`, `showVsTell` 'told' entries, `momentEarnednessMap.moments` with sparse mechanisms, `blindSpots`.
- All **EMITTED** ✅.

### What L5 reads (deepAnnotationService.ts:1036-1150)
- `voiceIdentity.signature + register + evolution + distinctivePatterns` → **EMITTED** ✅ (`register` field renamed from legacy → consumer uses `primaryRegister` now)
- `voiceMap.register.baseline + shifts` → **EMITTED** ✅
- `emotionalTopography.arcTrajectory + peakMoments + undertones` → **EMITTED** ✅
- `thematicArchitecture.centralThesis + thesisEvolution + threads + subtext` → **EMITTED** ✅
- `narrativeStrategy.primaryStrategy + pacingAnalysis + pivotPoints` → **EMITTED** ✅
- `characterRevelation.writerPortrait + valuesRevealed + growthArc + blindSpots` → **EMITTED** ✅
- `craftAssessment.sentencePatterns + wordPatterns + imageSystem` → renamed to `sentenceRhythmProse`; **consumer updates** → deepAnnotationService line 1119 renames field
- `admissionsPositioning.tellabilitySummary + distinctivenessFactors + portfolioPosition + redFlags` → **`portfolioPosition` CUT; consumer updates** → deepAnnotationService line 1129 should read `aoTakeaway` instead
- `entanglements` → **EMITTED** ✅ (only foundational/supporting)

### What L6 reads (coachingService.ts:2807-3000, 4016-4018)
- `admissionsPositioning.archetypeContext` → **EMITTED** ✅
- Coaching vectors for voiceIdentity, emotionalTopography, thematicArchitecture, narrativeStrategy, characterRevelation, craftAssessment → **all EMITTED** ✅
- `characterRevelation.blindSpots`, `admissionsPositioning.redFlags` → **EMITTED** ✅
- `characterRevelation.writerPortrait` → **EMITTED** ✅

### Dead emissions check
Every field in the redesigned `HolisticSynthesisOutput` schema has ≥1 downstream consumer tagged in §9.1. No dead output.

### Migration path for consumer renames
Three consumer changes required:
1. `analysisPass.ts`: drop `thesisConfidence` read (line 942).
2. `analysisPass.ts` + `deepAnnotationService.ts`: rename `craftAssessment.sentencePatterns` → `craftAssessment.sentenceRhythmProse`.
3. `deepAnnotationService.ts`: change `admissionsPositioning.portfolioPosition` read (line 1129) to `admissionsPositioning.aoTakeaway`.

Each is a 1-line change. All three land with the L3.75 runtime swap in a single PR.

---

## 11. Quality stress test — fixture 05 (dance essay)

Fixture: `tests/calibration/top-tier-reference/essays/05-harvard-2028-i-too-can-dance.txt` — 1,067 words, 8 paragraphs, central metaphor (dance↔writing), disability subtly revealed P3.

### What the lens outputs should produce (feeding L3.75)

**Meaning lens** → `throughLine.thesis`: "*The writer refuses the metaphor she was offered (dance) and builds a parallel one she can own (writing), then makes the two metaphors touch in the closing frame.*" `subtextMap.centralSubtext`: "*The wheelchair is the pivot, not the obstacle — the essay never argues, it simply relocates the verb.*" `tensions`: "*embraces and refuses metaphorical substitution simultaneously*", "*the very title 'I, Too, Can Dance' is both claim and allusion to Langston Hughes's 'I, Too, Sing America'*". `threadAppearances`: dance metaphor, Angelina Ballerina as template, writing as enactment, ballet-specific vocabulary sustained across domains. `meaningGaps`: none blocking. `imageAnchors`: pirouette/pen, tap-dance/keyboard, staccato/legato.

**Story lens** → `arcType`: "*transformation through metaphorical substitution*". `primaryStrategy`: "*frame structure with lexical inversion — opening and closing frame the same claim from opposite sides*". `turningPoint`: P5S3 (poetry contest night). `pivotPoints`: P2→P3 (aspiration → obstacle), P4→P5 (failure chain → discovery), P8→P9 (enactment → articulation). `pacingAnalysis`: "*accelerates through the failure catalogue, contracts at resolution, slows into sentence-level enactment in P6-P8*". `peakMoments`: P3S3 (wheelchair reveal), P5S3 (poetry contest), P9S1 (title-echo closing). `stakesLadder`: physical dance impossibility → loss of story-telling medium → discovery of alternate medium → enactment → reclamation of verb.

**Voice lens** → `voiceSignature`: "*lyrical-precise — uses ballet vocabulary as lexical anchor across domains; compound sentences that enact motion*". `dimensionalRegisters.register.baseline`: "*reflective-lyrical with tonal warmth*". `vocabularyDomains`: ballet/dance terminology, sensory light imagery, writerly metaphors (ink, tap, pirouette), medical research vocabulary in one aside. `shifts`: P4 "staccato tap-dance" sentence itself enacts its claim, intentional. `distinctivePatterns`: em-dash pivots rare, preference for extended parallel structure within single sentences, willingness to let sentences sprawl. `registerReaches`: reaches briefly formal in P7 medical-research interjection — intentional contrast. `authenticitySignals`: opening specificity ("dainty pink mouse", "rose-colored bow") reads genuine; closing recursion ("dance across the page") reads earned through 8 paragraphs of build.

**Admissions lens** → `tellabilitySummary`: "*A disabled writer refuses to mourn the dance she can't do and instead moves the verb 'dance' into a medium she can inhabit — writing. The essay enacts its own claim sentence by sentence.*" `archetypeDifferentiator`: "*most overcoming-disability essays argue the obstacle away; this one relocates the verb without argument*". `distinctivenessFactors`: "*sustained metaphor system that enacts itself*", "*Langston Hughes title allusion assumes reader sophistication*", "*opening's Angelina Ballerina is not incidental — it's the genre the essay is rewriting*". `institutionalFit.signals`: literary-ambitious programs, undergraduate creative writing. `redFlags`: (with fix) "*P3 wheelchair reveal is narratively clean but the relational dimension — who she dances with, who reads the writing — disappears from the essay; fix: one relational anchor in P8-P9 without breaking the frame*". `memorability`: "*'I, too, can dance' paired with 'tap tap tapping an article about LDCT scans' — specificity + title recursion is the memory hook*".

### What L3.75 should synthesize from these

**thematicArchitecture.centralThesis** (from `ML.throughLine.thesis`):
> *The writer refuses the metaphor she was offered (dance) and builds a parallel one she can own (writing), then makes the two metaphors touch in the closing frame.*

Specific, unique to this essay, would not be written about any other essay. ✅ $500/hr bar.

**narrativeStrategy.arcType** (from `SL.arcType`):
> *transformation through metaphorical substitution*

Three-word label — fine as a slug feeding L4, but per §10 schema, `arcType` is only emitted as a structural label. The prose lives in `primaryStrategy`. ✅

**admissionsPositioning.tellabilitySummary** (from `AL.tellabilitySummary`):
> *A disabled writer refuses to mourn the dance she can't do and instead moves the verb 'dance' into a medium she can inhabit — writing. The essay enacts its own claim sentence by sentence.*

Specific, AO-pitch-grade, captures the architectural move. ✅

**characterRevelation.writerPortrait** (cross-lens synthesis):
> *At a lunch, she'd describe dance technique with the specificity of someone who watched it closely before she knew she couldn't do it. She moves between ballet vocabulary and medical-research vocabulary without register-shifting — both are matters of fact in her world. She won't argue the obstacle with you; she'll relocate the verb and keep going. She reads Langston Hughes and trusts you to catch it without explanation.*

Cross-pulls VL (how she sounds) + ML (what she values, how she reasons) + AL (what an AO notices). Specific, not applicable to other essays. ✅

**momentEarnednessMap** (backward-tracing from peak moments):
- P9S1 closing ("I, too, can dance") — mechanisms: 7 (title setup at P0, Angelina template P1, verb-relocation primed P5, metaphor-system sustained P6-P8, Hughes echo in title allusion, "dance across the page" in P8). High density → earned.
- P3S3 wheelchair reveal — mechanisms: 2 (physical grounding in P2 dance attempts, "figure eights were more like zeroes"). Moderate density → earned but minimal. No gap flagged.
- `structuralObservation`: *frame moments (P0, P9) carry maximum mechanism density; middle peaks (P5 poetry contest) carry 3-4 mechanisms each; the essay's setup-payoff architecture is frame-heavy, body-functional.*

Quality check: would a premium consultant produce these? Yes — this is the level of observation Harvard admissions consultants make on the dance essay in post-mortems.

### Does the lens output produce enough raw material for premium synthesis? ✅

Every field L3.75 emits for fixture 05 traces to named lens outputs. No re-analysis required. The lens schemas (as specified in the L3 redesign) carry enough structured observation density to support $500/hr synthesis without L3.75 doing its own essay read.

If ANY field cannot be synthesized from current lens outputs during implementation → the gap is in the lens, not in L3.75, and the fix is lens-prompt hardening.

---

## 12. Failure mode audit

| Risk | How it silently degrades | Mitigation |
|---|---|---|
| **Re-analysis leak** — model forms voice/theme/narrative conclusion from essay text despite inheritance rule | Synthesis looks good but doesn't match lens outputs; L3.5 scores against two different readings | Meta call validates inheritance; `inheritanceViolations[]` output surfaced at telemetry level; synthesis fails contract if ≥3 violations |
| **Evaluation contamination** — "strong", "effective" language slips through despite forbidden-vocabulary rule | L3.5 gets pre-judged input, collapses to rubber-stamping | Parse-time regex on forbidden vocabulary; emit warning when hit-count > 0; hard fail at > 2 hits per section |
| **Generic `tellabilitySummary`** — "The writer explores X through Y" pattern | L4 NorthStar collapses to generic framing | Discipline directive in §7.1; cross-check at parse time: reject strings containing "explores", "grapples with", "reflects on" as main verbs |
| **Generic `writerPortrait`** — "A thoughtful, reflective student who..." | L6 coaching hooks become generic | Discipline directive + lunch-with framing in §7.1 prompt; reject portraits not citing ≥1 specific essay detail |
| **Thread over-proliferation** — 6-8 threads when 3 distinct exist | Output bloat + downstream noise | Cap 3-5 in prompt; parse-time dedupe against thread appearance-overlap ≥ 50% |
| **redFlags without fix** | L4b can't produce ImprovementManifest entries | Discipline rule: entries without `fix` field dropped at parse time; lens-level rule: AL lens must emit `fix` or not emit the flag |
| **Entanglement subtle-leak** — model emits subtle entanglements despite rule | Noise pollution, AI-risk signal | Parse-time filter: drop `significance='subtle'` entries silently (log only) |
| **Inheritance map drift** — L3 lens schema evolves, L3.75 inheritance map stales | Either dead output (emitted field no longer sourced) or lens output carries unclaimed downstream routing | CI check: compare `DownstreamField` tags on lens outputs against L3.75 consumed-field list; fail CI on drift |
| **Meta reports converged but iter_0 had inheritance violation** | Ships a bad synthesis | Meta must report violations FIRST; `converged=true` requires `inheritanceViolations.length === 0` in addition to delta criteria |
| **iter_1 re-emits all sections despite delta-only rule** | Cost regresses to today's $0.48 | Runtime validation: `affectedSections.length > 4` triggers a warning; `affectedSections.length === 10` fails the call with "delta rule violated" |
| **Reread candidate generic signal** — "re-examine P3" with no specific lens signal | Burns $0.11 on noise | Candidate schema requires `signalDetail` citing specific lens observation; parse-time validation rejects generic signals |
| **UnderstandingProse fires on incomplete synthesis** | Writer-facing UI misleads | Gate: skip prose call when `isComplete=false` or `missingSections.length > 0` |
| **Lens output delay/missing** — one lens fails but synthesis proceeds | Synthesis silently treats missing lens as empty | Runtime contract: all 4 executed lens outputs must be present (sweep's `lensDispatch.executed` list); fail the synthesis with explicit error naming missing lens |
| **Pre-existing `newConnections` collision with lens-emitted connections** | Duplicate connection entries in profile | Dedupe by `(from, to, type)` tuple at mutator level; lens connections are authoritative, L3.75 additions are supplementary |

Silent-degradation common thread: pre-redesign, any of these would produce a "passing" synthesis with hidden quality loss. Post-redesign, the Meta call + parse-time validators + inheritance-map CI check make each failure MODE visible. The audit goal is not to eliminate all risks — it's to surface them with logs downstream quality teams can act on.

---

## 13. Cost model

### Current-architecture L3.75 cost per essay (from `COST_DEADWEIGHT_AUDIT.md`)

| Call | Frequency | Cost |
|---|---|---|
| Phase A | 100% iter_0 | $0.15 |
| Phase B | 100% iter_0 | $0.18 |
| Meta | 100% iter_0 + iter_1 | $0.03–0.04 |
| Curation | 100% iter_0 | $0.03 |
| Reread | 73% × $0.11 | $0.08 |
| Delta synthesis | 27% × $0.13 | $0.035 |
| iter_1 full resynth | 10% × $0.475 | $0.048 |
| Understanding prose | 100% × $0.06 | $0.06 |
| **Total (avg)** |  | **$0.55–0.70** |

### Redesigned L3.75 cost per essay

| Call | Frequency | Input tok | Output tok | Cost |
|---|---|---|---|---|
| SYNTHESIZER (single) | 100% iter_0 | 15K (6K cached after essay text + system prompt land in cache block) | 8K | $0.045 (fresh) + $0.045 (cached) + $0.12 (output) ≈ **$0.15** on warm cache; **$0.165** first call |
| META (iter_0) | 100% | 12K (most cached: synthesis + lens Q-queue land in cache) | 2K | $0.036 + $0.03 ≈ **$0.05** |
| CURATION | 100% | 5K | 1K | $0.015 + $0.015 ≈ **$0.03** |
| REREAD | ~20% × $0.05 (scoped small call, 4K in + 1K out) | — | — | **$0.01** avg |
| DELTA-SYNTH (iter_1) | ~15% × $0.08 (2-3 sections avg, ~14K in + 3K out) | — | — | **$0.012** avg |
| META (iter_1) | ~15% × $0.05 | — | — | **$0.008** avg |
| UNDERSTANDING-PROSE | 100% × $0.045 (10K in mostly cached + 2K out) | — | — | **$0.045** |
| **Total (avg)** | | | | **~$0.26** |

**Savings vs today:** $0.29–0.44 per essay. On the $0.55–0.70 base that's a 42–63% reduction on L3.75 alone.

Plus compounding effects: L3.75 output is 25–35% smaller (7.5–8.5K vs 18K), so downstream layers that inject L3.75 into their prompts (L3.5, L4 all 3 calls, L5, L6) all read less on every call. Compounded savings across L4's 3-call read: at $0.13 input-token cost per L3.75-read at today's size, trimmed output saves $0.04–0.06 per L4 call × 3 = $0.12–0.18 on L4 alone, indirect from L3.75's trim.

### Realistic cost claim for the redesign
- **L3.75 direct:** $0.55–0.70 → **$0.22–0.30**
- **Downstream compounded (L4 + L5 context):** extra $0.15–0.20 saved
- **Total pipeline impact of this redesign:** **$0.44–0.64/essay saved**

This is 40-50% of the $0.66-0.99 target documented in `COST_DEADWEIGHT_AUDIT.md §E`. The remainder (L4 prompt caching, profileRouter always-priority demotion, L3 output discipline) are sibling work items.

Quality impact: strictly positive. Inheritance discipline removes re-analysis noise. Cap discipline removes redundancy. Descriptive-only craft assessment forces L3.5 to own judgment cleanly. $500/hr bar enforced via anti-generic parse-time checks.

---

## 14. Gap list — what needs hardening before production

Categorized as: **cheap-lock-now** (no dependencies, land first) | **shared-infra** (requires platform work) | **layer-specific** (requires L3 redesign or consumer-layer changes) | **testing-dependent** (requires fixture coverage) | **downstream-resolved** (not this layer's gap; surfaces here).

### Cheap-lock-now (6 items, each <1 engineer-hour)
1. **Parse-time regex for forbidden vocabulary** — add to `parseHolisticSynthesis` a regex catching the forbidden vocab list in §7.1. Warn ≥1, fail ≥3.
2. **Generic-verb tellability check** — reject `tellabilitySummary` strings where the root verb is "explores"/"grapples"/"reflects on"/"examines".
3. **Parse-time dedupe on entanglements** — drop `significance='subtle'`; dedupe by (dimensions, location).
4. **RedFlags without fix dropped at parse** — filter before emission.
5. **Thread appearance projection** — sentence-granular → paragraph-granular at parse time; dedupe threads with ≥50% appearance overlap.
6. **Synthesis max_tokens raise + temperature lower** — `10000` / `0.3` constants.

### Shared-infra (4 items)
1. **Cache block restructure** — move essay text + lens outputs into a cached system-prompt segment so SYNTHESIZER + META + UNDERSTANDING-PROSE all read from the same cache write. Anthropic multi-block cache_control pattern (see `COST_DEADWEIGHT_AUDIT.md §C`). Saves ~$0.04/essay incremental.
2. **Cost ledger cache split** — add `cache_read_input_tokens` + `cache_creation_input_tokens` to per-call logs. Unlocks verification that §13's cost model is real, not aspirational.
3. **CI inheritance-map check** — static analysis comparing lens-output `DownstreamField` tags against L3.75 consumed-field list. Fail CI on drift.
4. **Telemetry schema for Meta outputs** — `inheritanceViolations[]`, `deltaMagnitudes`, `rereadCandidates[]` tracked for per-run audit. Requires `corpusTelemetryPersistence` analog.

### Layer-specific (5 items, block on L3 redesign landing)
1. **Lens output schemas codified** — `StoryLensOutput`, `MeaningLensOutput`, `VoiceLensOutput`, `AdmissionsLensOutput` as TS types with `DownstreamField` routing tags. Required before L3.75 runtime can ship.
2. **Sweep output schema codified** — archetype, connection graph, descriptiveNoticing, phaseEstimate, lensDispatch fields. Matches current sequentialDeepWalk but restructured per L3 design.
3. **`CraftAssessment` type refactor** — drop `strengthSignatures[]`, `growthEdges[]`, `pairedImprovement`, `sentencePatterns` (numeric). Rename `sentencePatterns` (prose) → `sentenceRhythmProse`. Requires coordinated migration on analysisPass + deepAnnotationService + audit renderer + all tests referencing the old fields.
4. **L3.5 essay-level gains `strengthSignatures[]` ownership** — the field migrates from L3.75 craftAssessment to L3.5 essay-level output. Requires L3.5 prompt update.
5. **L4b ImprovementManifest gains `pairedImprovement` ownership** — migrates from L3.75 growthEdges. Requires crystallizer prompt update.

### Testing-dependent (3 items)
1. **Fixture 05 regression harness** — before/after synthesis comparison on the dance essay, scoring each output section against §11 expected shapes. Run on every L3.75 PR.
2. **11-run calibration A/B** — once single-fixture passes, run the 11-essay calibration set (budget-gated, $5/run per memory). Compare output quality + cost against current.
3. **Silent-degradation test suite** — deliberately broken lens outputs (missing lens, lens with 0 observations, lens with contradictory observations) to verify Meta catches each.

### Downstream-resolved (2 items)
1. **`analysisPass.thesisConfidence` read** — drops as consumer-side line removal; not an L3.75 gap per se, but this redesign mandates the consumer change.
2. **Focused-analysis-mode ripple handling** — when L3.5 or L4 detects a localized change requiring L3.75 re-sync, the ripple flow uses `DeltaSynthesisRequest` which is already in the current runtime. Verify schema compatibility; no redesign expected.

---

## 15. Closing self-check against the L3 bar

The L3 design delivered:
- ✅ Architectural rigor — zero-overlap ownership, inheritance discipline, downstream routing.
- ✅ Depth — 4 lenses with production-draft system prompts, full schemas, downstream routing, discipline directives.
- ✅ Cost savings — $0.55–0.65 per essay.
- ✅ Quality lift — dimension-organized, evidence-cited, tradeoff-annotated foundation.
- ✅ Gap list categorized for hardening.
- ✅ Integration checks proving cross-layer dataflow integrity.

This L3.75 design matches each bar:
- ✅ **Architectural rigor** — §2 ownership boundaries, §3 full inheritance map, §9 downstream field routing on every field.
- ✅ **Depth** — §7 production-draft prompts for 6 call types, §9 full schemas for synthesis + meta + curation + delta + reread.
- ✅ **Cost savings** — §13 projects $0.29–0.44 direct + $0.15–0.20 compounded = $0.44–0.64 per essay.
- ✅ **Quality lift** — descriptive-only discipline surfaces `strengthSignatures`/`growthEdges` ownership to L3.5+L4b where they belong; §11 fixture-05 stress test demonstrates $500/hr output.
- ✅ **Gap list** — §14 categorized into 5 buckets (cheap-lock-now, shared-infra, layer-specific, testing-dependent, downstream-resolved).
- ✅ **Integration checks** — §10 walks every downstream consumer's reads against every L3.75 emission.

The architecture is sound. The gaps are implementation-level, not design-level. Ready for consumer agent.
