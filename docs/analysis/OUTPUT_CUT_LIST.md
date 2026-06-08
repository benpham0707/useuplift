# Essay Intelligence Output — Cut List & Actionability Audit

**Source:** `tests/output/phase-b-dump.json` (fixture `05-harvard-2028-i-too-can-dance`, full pipeline, 2026-04-21) + upstream inspection of L3/L3.75/L4/L5 schemas.

**Purpose:** identify every emitted field that (a) repeats another field, (b) is pure diagnosis the writer can't act on, or (c) fills a schema slot with filler. Three goals served by this cut list:

1. **Writer-first lens.** If a field can't change what the writer does in the next revision, it's a candidate to cut. We do not diagnose for the sake of diagnosing.
2. **Signal density.** Every redundant line makes the genuinely useful lines harder to find. Tight output > complete output.
3. **Token economy.** Cuts land in output-token spend, the most expensive line item. Cap-and-trim at the prompt level.

The central framing — every field belongs in one of three buckets:

- **ACTIONABLE** — gives the writer something specific to do in revision.
- **CONTEXTUAL** — doesn't prescribe action, but confirms the writer's mental model of what they wrote, or reveals how an AO will read it. Still valuable: builds trust + informs judgment.
- **DIAGNOSTIC-FOR-OWN-SAKE** — facts about the essay that don't change revision behavior. **Default: cut.**

Keep ACTIONABLE. Keep CONTEXTUAL when tight and non-redundant. Cut DIAGNOSTIC.

---

## Part A — Redundant / duplicate fields (cut or merge)

| Field | Duplicates | Recommendation |
|---|---|---|
| `craftAssessment.strengthSignatures` (**21 entries** in fixture 05) | Many entries restate each other. Examples: S1 "Extended metaphor sustained" ≈ S9 "Architectural control through extended metaphor" ≈ S17 "choreographed the mice" ≈ S20 "Parallel structure enacts thesis" — all four describe the dance-metaphor spine. S3 "Frame structure through exact repetition" = S21 "Exact repetition with one-word addition" literally the same observation. S11 "comma after I creates pause" and S2 "Anaphoric parallel structure" cite same text evidence. | **Cap to 6–8 in prompt.** Instruct: "Emit the most essential 6-8 signatures. Each must name a *distinct* craft technique. If two entries would cite overlapping text or describe the same pattern, pick the strongest one only." Estimated cut: ~60% of this field's tokens. |
| `craftAssessment.growthEdges` (11 entries) | Overlaps with `characterRevelation.blindSpots` (G3 wheelchair integration = blindSpot #3; G5 solitary writing = blindSpot #4). Some entries (G1, G6, G7) are actually *strengths* misfiled. | **Cap to 4–6.** Instruct: "Only emit growth edges that (a) have a concrete fix in `pairedImprovement` AND (b) are not already captured in `blindSpots` or `redFlags`." Cut ~50% of tokens. |
| `characterRevelation.blindSpots` ↔ `admissionsPositioning.redFlags` | ~50% overlap. Blindspot #3 (wheelchair as obstacle) = redFlag #3. Blindspot #4 (relational dimension disappears) = redFlag #1. The two fields read as the same observations rephrased for a different audience. | **Merge into a single `gapsAndRisks` list with `audience: 'writer' \| 'ao'` on each entry.** Or give each a strict, non-overlapping contract (e.g., blindSpots = "what the writer doesn't see about themselves as a person," redFlags = "what an AO would notice about the essay's ARGUMENT"). Right now both slide into each other. |
| `thematicArchitecture.threads` (6 entries in fixture 05) | "Dance as metaphor" *(dominant)* + "Transformation through metaphorical substitution" *(dominant)* overlap heavily — second is the dynamic form of the first. "Angelina Ballerina as aspirational standard" is a sub-thread of the dance thread. | **Cap to 3-4 threads.** Add prompt rule: "Threads must be genuinely distinct — if two threads share >50% of their appearance locations, merge them." Cut ~30% tokens. |
| `admissionsPositioning.portfolioPosition` (~200 words) | Duplicates `institutionalFit` + `aoTakeaway`. All three fields discuss "what this essay surfaces / doesn't surface." | **Cut `portfolioPosition` entirely.** Its job is subsumed by `institutionalFit` (signal to AO) + `aoTakeaway` (AO's conclusion). |
| `admissionsPositioning.institutionalFit` | Overlaps with `distinctivenessFactors` + `aoTakeaway`. | **Keep but cap to 2-3 sentences.** The detailed "Less strong fit for institutions seeking: X, Y, Z" breakdown is not actionable for the writer. |
| `narrativeStrategy.structuralChoices` (5 entries) | #1 (frame structure) + #5 (sentence lengthening contraction) restate what `imageSystem` + `sentencePatterns` + `strengthSignatures` already cover. | **Cap to 3; dedupe against `sentencePatterns` + `strengthSignatures`.** |
| `characterRevelation.valuesRevealed` ↔ `revealedQualities` | Conceptually different (values = what she cares about, qualities = how she acts) but LLM conflates them. Fixture 05 values #3 "Storytelling as connection" appears again in `aoTakeaway` and `blindSpots`. | **Pick one field; cap to 4-5.** The distinction isn't clear enough in the current prompt to justify two fields. Values is the more AO-useful framing; drop `revealedQualities`. |
| `thematicArchitecture.contradictions` (3) | #1 and #3 are the same observation (essay both embraces and refuses metaphorical substitution). | **Cap to 2-3; instruct "no near-duplicates."** |
| Evidence strings across `strengthSignatures` | Multiple entries cite same quotes. S1 and S9 cite "pirouettes perfect O's." S3 and S21 cite the title/closing frame. | **Instruct: "Each signature must cite *new* evidence not used by a prior signature in this call."** |

---

## Part B — Diagnostic-for-its-own-sake (writer can't act on it)

These are facts the system produces that tell the writer *about* their essay but don't change what they'd do in revision. They're diagnosis without treatment. Audit by asking: "if the writer read this field, what would they DO differently?"

| Field | Why it doesn't help the writer | Recommendation |
|---|---|---|
| `thematicArchitecture.thesisConfidence` (number, e.g. `1.0`) | A confidence number without an explanation is not actionable. If confidence is 0.3, the writer can't tell what to do about it. If it's 1.0, they've already succeeded; telling them doesn't change anything. | **Cut.** Or turn into `thesisClarity: 'explicit' \| 'implied' \| 'absent'` with a paired note only when not explicit. |
| `narrativeStrategy.arcMomentum` (single word: `"releasing"`) | A one-word diagnostic label. Writer doesn't know what to do with "releasing" vs "building" vs "sustaining." | **Cut.** If kept, must be paired with an actionable note ("momentum releasing into P10 — if you want sustained energy, consider X"). |
| `narrativeStrategy.arcType` (single-word label) | Similar. Labels like `"transformation through discovery"` are analytically neat but don't guide revision. | **Demote** to a subtitle/badge that frames the following prose, not a standalone field. |
| `admissionsPositioning.archetypeContext.poolDensity` (`"common"`/`"saturated"`/etc) | Tells the writer their archetype is common — but doesn't help them revise. The `differentiator` sub-field IS actionable ("preserve the Hughes allusion, the architectural frame") but density alone is noise. | **Cut `poolDensity`; keep only `archetype` name + `differentiator`.** |
| `admissionsPositioning.archetypeContext.archetype` (name only) | Informational — "overcoming disability through finding alternative path" tells writer their archetype but without the differentiator, it reads as judgment ("you're writing a cliché"). | **Keep only when paired with `differentiator`.** If no differentiator, don't emit archetype at all. |
| `craftAssessment.sentencePatterns` word-count statistics ("11 of 24 sentences begin with subject-verb structure; 4 begin with temporal markers") | Micro-statistics. Writer can't act on "11 of 24" — it's a distribution, not a pattern they'd reshape. The *rhythmic* observations (accelerating through failures, contracting at resolution) ARE useful; the counts are not. | **Cut statistical breakdowns. Keep rhythm/pacing observations.** |
| `characterRevelation.intellectualFingerprint` (prose describing cognitive style) | Impressive-sounding diagnosis. Writer can't revise their cognitive style. Can make the field feel pompous without delivering revision guidance. | **Demote to a single-sentence "how you think" line within the `writerPortrait` rather than its own field.** Or cut. |
| `entanglements[].significance: 'foundational' \| 'supporting' \| 'subtle'` — when the entanglement is labeled `"subtle"` | Subtle entanglements are by definition weak cross-dimension signals. Writer doesn't know how to respond to "P3's voice shift subtly entangles with theme." | **Only emit `foundational` and `supporting`; drop `subtle`.** Cap to 3 entanglements total. |
| `thematicArchitecture.threads[].appearances` (sentence-level location array) | Fixture 05 emits 24 appearance objects across 6 threads at sentence granularity. There's no UI that renders a thread-by-paragraph heatmap yet. The writer sees the thread name + description only. All the appearance detail is stored-but-unread. | **Drop to paragraph granularity.** If no UI consumes sentence-level thread appearances, stop emitting them. |
| `admissionsPositioning.institutionalFit` "Less strong fit for institutions seeking: X, Y, Z" | Tells writer which institutions are a worse fit. Not revision-actionable — writer is applying where they're applying. Might actively demoralize. | **Cut the negative-fit half; keep only "signals fit for institutions that value X, Y, Z."** |
| `admissionsPositioning.aoTakeaway` "Questions that remain" at end of field | Often ends with 4-5 questions ("Can they collaborate? Do they seek mentorship?") that aren't answerable from the essay. Reads as AO speculation, not writer guidance. | **Cap AO questions to 1-2 most essential, OR migrate them into `redFlags` with concrete fixes.** |
| `narrativeStrategy.strategyRationale` | Often a rephrase of `primaryStrategy` with "because X" appended. | **Merge into `primaryStrategy`; no separate field.** |

---

## Part C — Borderline: keep only if rendered well or tightened

These fields have potential value but currently deliver it inconsistently. Keep with changes.

| Field | Condition to keep |
|---|---|
| `entanglements[]` | Keep 2-3 foundational only. Render with a clear label ("How these dimensions tie together at this moment") and only show when the entanglement *could* inform revision — e.g., "if you change X at P6S3, you'd be breaking the connection that supports the theme crystallization." |
| `characterRevelation.valuesRevealed` | Keep but cap to 3-5 AND enforce "each must cite specific text showing the value, not just assert it." |
| `craftAssessment.imageSystem` | Keep — this is one of the highest-signal fields. But instruct: "Describe the image system's *architecture* and *progression*, not just list the images." Fixture 05's imageSystem does this right. |
| `thematicArchitecture.contradictions` | Keep 1-2 but REFRAME each as: "Your essay both X and Y — which one do you want the reader to land on?" Turns observation into actionable tension. |
| `narrativeStrategy.pacingAnalysis` | Keep only if it names *specific pacing choices tied to specific locations* (fixture 05 does). Cut if it drifts into generic "the pacing works well." |
| `admissionsPositioning.memorability` | Keep — high signal. But rule: each memorable element must be **actionable in reverse** — i.e., tell the writer what NOT to cut if they're trimming. |

---

## Part D — Do not cut: core writer-facing value

These are the fields that justify the $3.60/essay spend. They are either directly actionable or directly shape what the writer should protect vs change.

| Field | Why it earns keep |
|---|---|
| `thematicArchitecture.centralThesis` | Writer needs to know the system's reading of their thesis to trust everything downstream. |
| `thematicArchitecture.subtext` | High-value: names the hidden argument, often different from what writer thought they were doing. Informs whether to make subtext explicit or leave it implicit. |
| `characterRevelation.writerPortrait` | The "lunch-with" framing is the single highest-delight field. Writer sees how they come across as a person, which shifts revision priorities from "make it sound smart" to "keep what makes me me." |
| `admissionsPositioning.tellabilitySummary` | Writer sees the 30-sec AO summary. If it's not what they wanted the essay to be about, that's the single most important signal they can get. |
| `admissionsPositioning.redFlags` | Writer-actionable. Each flag names a structural pattern + AO reaction + (should) name a fix. |
| `admissionsPositioning.distinctivenessFactors` | Tells writer what to PROTECT in revision. The opposite of red flags — what's working that could be accidentally lost. |
| `admissionsPositioning.memorability` | Similar: what the writer should not cut. |
| `admissionsPositioning.archetypeContext.differentiator` | Names what specifically distinguishes this execution from the pool. Actionable protection signal. |
| `admissionsPositioning.aoTakeaway` | The single-paragraph AO conclusion. Writer uses this to calibrate whether the essay is landing. |
| `narrativeStrategy.pivotPoints` | Localized (P/S anchors) + actionable: writer can strengthen, reframe, or add transition at each pivot. |
| `narrativeStrategy.turningPoint` | Single location. Writer knows where the essay's hinge is — critical for structural revision. |
| `craftAssessment.growthEdges` with `pairedImprovement` | The only fields that are unambiguously actionable. Each has technique name + directive + architectural reason. Keep every one that has the pair. Cut the ones without. |
| `craftAssessment.imageSystem` | Writer learns the architecture of their own metaphor system. Informs revision at a level they may not have consciously designed. |
| `craftAssessment.wordPatterns` (lexical clusters) | Writer learns their vocabulary register and where it shifts. Useful for polishing and consistency. |
| `craftAssessment.strengthSignatures` (the top 6-8) | Tells writer what's working — protection signal + confidence. |
| L4 priorities / ImprovementManifest | The actionable backbone of the coaching flow. Every item has paragraph + technique + directive. |
| L5 per-paragraph annotations | Direct revision guidance anchored to specific sentences. |
| `essayUnderstanding.prose` | The essay portrait's top narrative — confirms system understood what the writer was trying to do. |
| `voiceIdentity.signature` + `voiceMap.shifts` | Writer learns their voice + where it unintentionally drifts — both high-signal. |
| `momentEarnednessMap` (the moments marked earned vs. unearned) | Actionable: tells writer which emotional beats need more grounding. |

---

## Concrete prompt-level changes (zero API cost to implement)

These are the exact edits to L3.75 Phase B prompts + related layers that enact the cuts above.

### 1. Hard caps on list fields
Add to SYSTEM_PROMPT_PHASE_B in `holisticSynthesis.ts`:

```
=== QUANTITY DISCIPLINE ===
For every list-valued field, EMIT THE MINIMUM COUNT THAT CAPTURES THE ESSENTIAL SIGNAL. Do not fill arrays. Target caps (hard ceilings, not floors):

- thematicArchitecture.threads: 3-5 max
- thematicArchitecture.contradictions: 1-3 max
- narrativeStrategy.pivotPoints: 2-4 max
- narrativeStrategy.structuralChoices: 3 max
- characterRevelation.valuesRevealed: 4 max
- characterRevelation.revealedQualities: 4 max
- characterRevelation.blindSpots: 3 max
- craftAssessment.strengthSignatures: 6-8 max — each must name a DISTINCT craft technique, cite NEW evidence not used by a prior signature
- craftAssessment.growthEdges: 4-6 max — MUST have pairedImprovement; omit edges without a fix
- admissionsPositioning.distinctivenessFactors: 3-5 max
- admissionsPositioning.redFlags: 4 max
- entanglements: 3 max — foundational only, drop 'subtle'

Quality over quantity. An 8-signature list with 8 distinct signatures beats a 21-signature list with 8 distinct signatures hidden among 13 restatements.
```

### 2. Fields to delete outright

Remove from the output schema (and downstream types):

- `thematicArchitecture.thesisConfidence`
- `narrativeStrategy.arcMomentum`
- `narrativeStrategy.strategyRationale` (merge into `primaryStrategy`)
- `admissionsPositioning.portfolioPosition`
- `admissionsPositioning.archetypeContext.poolDensity`
- `characterRevelation.revealedQualities` (merge survivors into `valuesRevealed`)
- `characterRevelation.intellectualFingerprint` (merge a single-sentence version into `writerPortrait`)
- `thematicArchitecture.threads[].appearances[]` sentence-level — drop to paragraph level
- `craftAssessment.sentencePatterns` numeric distribution statistics — keep only rhythm/pacing prose

### 3. Reframing for actionability
Wrap diagnostic fields in a "what you'd do with this" clause:

- `contradictions[]`: "Your essay both X and Y. Which one do you want the reader to land on?"
- `redFlags[]`: each must name the structural pattern AND a specific fix.
- `archetypeContext.differentiator`: frame as "PROTECT IN REVISION — what distinguishes this execution."
- `memorability[]`: frame as "DO NOT CUT THESE IF TRIMMING."

### 4. Dedup check at parse time
In `parsePhaseB`, add a post-parse check:
- If two `strengthSignatures` cite the same text evidence substring, keep the first and drop the second.
- If a `growthEdges` entry lacks `pairedImprovement`, drop it.
- If `blindSpots` and `redFlags` both mention the same structural pattern (detected by textual similarity threshold), keep only the one with the more concrete framing.

---

## Expected impact

- **Token savings (output side):** ~25-35% reduction in Phase B output tokens on craft-phase essays. On fixture 05, craftAssessment alone is 23KB of 60KB total output; cutting strengthSignatures + growthEdges to their disciplined sizes saves ~10KB = ~2.5K tokens × $15/1M = **$0.04/essay** at the output layer.
- **Token savings (input side, downstream):** Phase B output is read by L3.5, L4, L5, and coaching. Every cut compounds through those readers. Rough estimate: another $0.06/essay across downstream reads.
- **Writer experience:** Output becomes scannable. The 21-signature wall of fixture 05 becomes 8 distinct signatures the writer can actually absorb. Red flags become directly actionable.
- **Product integrity:** The system stops diagnosing for its own sake. Every emitted field earns its place by either moving revision forward or anchoring the writer's mental model of what they wrote.

---

## Not cut from this audit (explicit keeps)

Everything in Part D. Especially: the full `writerPortrait`, `tellabilitySummary`, `memorability`, `redFlags` (with fix mandate), `pivotPoints`, `growthEdges` (with pairedImprovement), `imageSystem`, and the L4/L5 improvement pipeline. Those are the product's actual value delivery — the rest is scaffolding.
