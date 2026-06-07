# Backend Handoff — AnnotationV2 UX Contract, Two New Asks

> **Audience:** the backend engineer who owns L3.5 (`analysisPass.ts`),
> phase assessment (`phaseAssessment.ts`), and L5 (`deepAnnotationService.ts`).
> This doc is self-contained — you do not need to read the full UX contract
> to ship the two asks below, but the anchor citations are here if you want
> to.
>
> **Companion doc:** [`docs/UX_CONTRACT_2026_05_12.md`](./UX_CONTRACT_2026_05_12.md)
> (679 lines, locked 2026-05-20). The contract owns the *why*. This doc owns
> the *what to wire*.

---

## 0. TL;DR

Two new fields on `L5AnnotationResult` (defined at
`src/services/essayIntelligence/analysis/deepAnnotationService.ts:308`).
Both unblock student-facing UX that the frontend cannot ship without:

1. **`phaseTransitionLine: string | null`** — LLM-generated 1–2 sentence
   celebratory copy emitted when the essay crosses a phase boundary on
   re-analysis. Drives the §11.5 "Phase-Up Beat" modal.
   Cost target: **$0 new** — fold into the existing `phaseAssessment`
   Sonnet call.

2. **`sentenceEffectiveness: SentenceEffectivenessEntry[]`** — flat list of
   per-sentence effectiveness scores (0–100) sourced from L3.5 output and
   exposed in the L5 result envelope. Drives the 6-tier inline visual
   system (§4.3 + §8 Q1). The numbers **already exist** on
   `AnalysisPassOutput.sentenceAnalyses[i].effectiveness`
   (`profileTypes.ts:4087-4116`) — this is exposure work, not new
   inference.
   Cost target: **$0 new** — pass-through.

No new LLM call. No new prompt. The total backend lift is a typed
pass-through (Ask 2) and a small prompt extension (Ask 1).

Estimated work: **1–2 days, one engineer, one PR each.** Ask 2 should
ship first because the frontend has more work to do consuming it; Ask 1
ships independently and gates the phase-up beat.

---

## 1. Context

The UX contract locks the AnnotationV2 workshop surface end-to-end —
first read (§1–§10) plus the post-edit iteration loop (§11). Across
locking 18 open questions over the week of 2026-05-14 → 2026-05-20, two
backend dependencies surfaced that the UI cannot fake from existing
fields:

| Backend ask | Where the UX needs it | Contract anchor |
|---|---|---|
| `phaseTransitionLine` | §11.5 Phase-Up Beat modal — italic line referencing this essay's specific moves | §11.5.1 (lines 580–622), §11.6 (lines 624–635), §11.7 11-d |
| Per-sentence effectiveness | §4.3 6-tier inline visual (CRITICAL → MASTERFUL) + structural-map effectiveness strip | §4 L5Annotation field table (lines 178–230), §8 Q1 (line 354), §9 item 1 (lines 373–374) |

Both were taken on deliberately at lock time, with the explicit
trade-off recorded in §8 Q1 (chose 6-tier-in-v1 over 3-tier-in-v1
fallback) and §11.7 11-d (chose backend-emitted over UI-registry).

The contract is otherwise stable: `L5Annotation` shape, the three
annotation arrays (paragraph / cross-paragraph / essay-level), and the
6-section `StudentAnalysisDocument` are unchanged.

---

## 2. Ask 1 — `phaseTransitionLine`

### 2.1 What it is

A 15–40 word italic line celebrating a phase crossing on re-analysis,
grounded in **this** essay's content. Frontend renders it inside the
phase-up beat modal:

```
┌──────────────────────────────────────────────────────────────────┐
│                          [phase-icon]                            │
│              You moved from Architecture to Craft                │
│                                                                  │
│         "{phaseTransitionLine}"                                  │
│                                                                  │
│                       [Got it]     [ESC]                         │
└──────────────────────────────────────────────────────────────────┘
```

Good examples (from contract §11.5):

> *"The translator essay's bones hold now — the scenes carry their own
> weight. What's left is the voice in those scenes."*

> *"You stopped explaining the crochet club and started letting it
> mean something. From here, every word earns its place."*

Anti-patterns (do not emit):

- ❌ "Great job!" / "Way to go!" / "You leveled up!" (generic cheer)
- ❌ "Your essay scored 78 — up from 64." (aggregate metric language)
- ❌ "You should now focus on…" (second-person directive — the line is a
  beat, not coaching)
- ❌ Any line that would read identically applied to a different essay
  (the test: would this exact line work for someone else's essay? If
  yes, regenerate.)

### 2.2 Field shape

Add one field to `L5AnnotationResult` at
`src/services/essayIntelligence/analysis/deepAnnotationService.ts:308`:

```ts
export interface L5AnnotationResult {
  paragraphAnnotations: ParagraphAnnotations[];
  essayLevelAnnotations: L5Annotation[];
  crossParagraphAnnotations: L5Annotation[];
  phase: ImprovementPhaseLevel;
  annotationCount: number;
  surfacedCount: number;
  densityDiagnostics: AnnotationDensityDiagnostic[];

  // NEW — Ask 1
  /**
   * §11 iteration loop: celebratory copy for the phase-up beat.
   *
   * Populated when this run's `phase` differs from the prior run's
   * phase AND the transition assessor judged the shift genuine
   * (`ImprovementPhase.transition.isGenuineShift === true`).
   *
   * LLM-generated 1–2 sentences referencing the essay's specific
   * moves and what the crossing means for THIS essay.
   *
   * Length: 15–40 words.
   * Register: italic, single beat.
   * Forbidden: metrics, scores, second-person commands,
   *            generic praise, copy that would work for another essay.
   *
   * Null when:
   *   - First-ever analysis (no prior phase to compare).
   *   - Phase unchanged from prior run.
   *   - Phase transition assessed as not genuine
   *     (e.g., bouncing across a boundary on a tiny edit).
   *   - LLM declined to produce one (degraded path — UI falls back
   *     to a static registry).
   *
   * Multi-phase crossing: when a single re-analysis crosses 2+
   * phases (rare, possible for massive rewrites), generate ONE line
   * for the highest phase reached. The UI handles intermediate-phase
   * suppression via localStorage.
   */
  phaseTransitionLine: string | null;

  cost: number;
  tokenUsage: { /* unchanged */ };
  timingMs: number;
}
```

### 2.3 Where to produce it — recommended: extend `phaseAssessment`

The `assessPhase()` call at
`src/services/essayIntelligence/analysis/phaseAssessment.ts:1` is a
single Sonnet call that already sees:

- All paragraph analyses (with per-sentence effectiveness + reasoning)
- Holistic context (voice signature, narrative arc, thesis, character)
- `priorPhase` when running re-analysis (input field already wired —
  see `PhaseAssessmentInput.priorPhase` at line 50)
- `transition` output field already detects genuineness (line 163–168
  of the prompt; type at `profileTypes.ts:2021-2025`)

This is the cheapest, lowest-latency place to add the line — the Sonnet
call is already happening, the right context is already in the prompt,
and the genuineness gate is already decided in the same call.

**Recommended diff to the phaseAssessment prompt** (around
`phaseAssessment.ts:163`):

```diff
   "transition": null | {
     "priorLevel": "the prior phase level",
     "isGenuineShift": true | false,
-    "transitionReasoning": "why the shift is/isn't genuine"
+    "transitionReasoning": "why the shift is/isn't genuine",
+    "celebratoryLine": "OR null. When isGenuineShift=true, a 15-40
+      word italic line celebrating the crossing that references THIS
+      essay's specific moves. Null when isGenuineShift=false or
+      when no specific move warrants celebration. Must NOT contain
+      metrics, scores, or generic praise. Test: this line should
+      NOT make sense applied to a different essay."
   }
```

Mirror this on `ImprovementPhase.transition` at `profileTypes.ts:2021`:

```diff
   transition: {
     priorLevel: ImprovementPhaseLevel;
     isGenuineShift: boolean;
     transitionReasoning: string;
+    /**
+     * §11.5 iteration loop: celebratory line for the phase-up beat.
+     * Null when shift is not genuine OR LLM declined.
+     * See L5AnnotationResult.phaseTransitionLine for the consumer.
+     */
+    celebratoryLine: string | null;
   } | null;
```

Then in `deepAnnotationService.ts`'s result assembly (around line 865),
copy through:

```ts
return {
  paragraphAnnotations: allAnnotations.paragraphAnnotations,
  essayLevelAnnotations: allAnnotations.essayLevelAnnotations,
  crossParagraphAnnotations,
  phase: phase.level,
  annotationCount,
  surfacedCount,
  densityDiagnostics,
  // NEW:
  phaseTransitionLine:
    phase.transition?.isGenuineShift === true
      ? phase.transition.celebratoryLine ?? null
      : null,
  cost: totalCost,
  tokenUsage: totalTokenUsage,
  timingMs: Date.now() - startTime,
};
```

The `phase` object reaches L5 via `profile.index.improvementPhase`
(`deepAnnotationService.ts:516`) which is set upstream from
`l35Result.improvementPhase`
(`analysisOrchestrator.ts:940, 1602`). The wiring is already in place;
the diff is purely additive.

### 2.4 Prompt sketch — full

Extend the existing phaseAssessment system prompt with this section
(after the existing TRANSITION assessment block):

```
PHASE-UP CELEBRATORY LINE (only when transition.isGenuineShift = true)

When you have determined the phase shift is genuine, also produce a
15-40 word italic line that will be shown to the student inside a
celebratory modal AFTER they re-analyze.

The line must:
- Reference at least one specific move, scene, choice, or pattern
  unique to THIS essay (no generic phrasing).
- Acknowledge what the crossing means — what kind of work is now done,
  and what kind of work is now possible.
- Stay in third-person observational register (the modal already says
  "You moved from {prior} to {new}" — your line is the *meaning* of the
  move, not another announcement).
- Avoid: metrics, scores, "great job", "way to go", any second-person
  command, any praise that would read identically for another essay.

Calibration test: read your line aloud and ask "could I paste this
under any other essay's phase-up beat?" If yes, rewrite with more
specificity. The line should feel hand-written by a counselor who has
read THIS draft three times.

Set celebratoryLine = null when:
  - The transition is not genuine.
  - The essay's moves don't warrant a celebratory beat (e.g., phase
    shifted because of a structural deletion that fixed a problem but
    didn't add craft).
  - You cannot meet the calibration test above without generic copy.

Better to emit null than to emit a generic line — the UI has a fallback
registry for null cases.
```

The prompt extension adds ~140 tokens to the cached system block and
~30–80 tokens to the output. Cost delta per re-analysis call: **under
$0.001**. No new round-trip.

### 2.5 Multi-phase crossing

Per §11.5: when a single re-analysis crosses 2+ phases (e.g., Foundation
→ Craft after a massive rewrite), generate ONE line targeted at the
highest phase reached. `transition.priorLevel` is already the original
prior phase; `phase.level` is the new (highest) phase; the line should
celebrate the full distance traveled, not each intermediate step.

The frontend tracks intermediate suppression via a `phasesCrossed`
localStorage set — backend does not need to track this.

### 2.6 Failure behavior

If the phaseAssessment Sonnet call returns malformed JSON, the existing
fallback path at `phaseAssessment.ts` should set
`transition.celebratoryLine = null`. The UI registry at
`src/components/annotation-v2-engine/phaseIntent.ts` will render its
static fallback. **Do not emit a degraded auto-generated line** (no
template strings, no "{prior} → {new} accomplished" interpolation) —
null is the explicit signal for "use registry."

### 2.7 Calibration / acceptance

After shipping, hold to these calibration windows for the first 50
re-analysis runs that cross a phase boundary:

| Metric | Target | Action if outside |
|---|---|---|
| `celebratoryLine !== null` rate when `isGenuineShift === true` | 80–95% | <80%: prompt too restrictive; >95%: lower the calibration bar in the prompt |
| Line length (15–40 words) | ≥95% in band | Outside: tighten word-count cue in the prompt |
| Contains a metric, score, or "great job"-class praise | 0% | Any occurrence: add the offending pattern to the forbid list with an example |
| Could-apply-to-another-essay rate (manual spot check, n=10) | ≤10% | >10%: prompt's "test" line isn't biting; add a stronger example pair |

Log `phaseTransitionLine` + the `transitionReasoning` together to a
telemetry table so the calibration check is reproducible without
re-running essays.

---

## 3. Ask 2 — per-sentence effectiveness pass-through

### 3.1 What it is

The L3.5 analysis pass already produces per-sentence effectiveness
scores (0–100) — see `AnalysisPassOutput.sentenceAnalyses[i].effectiveness`
at `profileTypes.ts:4087-4116`, with `effectiveness` produced and clamped
at `analysisPass.ts:1410` and emitted with `effectivenessReasoning`,
`isStrength`, `isProblem`, and `priorityForImprovement`.

These scores **never reach the L5 result envelope**. The frontend
consumes `L5AnnotationResult` only — it has no path to
`profile.paragraphs[i].sentences[j].analysis.effectiveness`. Without
exposure, the UI is forced to derive a 3-tier visual from
`L5Annotation.type + L5Annotation.priority`, which was the v0 plan and
which §8 Q1 explicitly rejected.

The ask: expose the existing scores on `L5AnnotationResult` so the UI
can render the 6-tier system end-to-end.

### 3.2 Why the 6-tier system needs the raw score, not a UI-derived bucket

Contract §4 (line 192) locks the inline tier mapping:

| Tier | Score band | Visual treatment |
|---|---|---|
| CRITICAL | < 40 | wavy red underline |
| NEEDS_WORK | 40–54 | solid amber underline |
| FUNCTIONAL | 55–75 | **no underline** — visual silence |
| STRONG | 76–85 | solid green underline |
| EXCEPTIONAL | 86–95 | solid teal underline |
| MASTERFUL | 96–100 | shimmer purple underline |

The FUNCTIONAL band is the load-bearing one — most sentences in any
half-decent essay land in 55–75 and should render with **no visual
treatment**. UI cannot derive this from `L5Annotation` alone because
L5 doesn't emit annotations for FUNCTIONAL sentences (nothing to teach
→ no annotation). The UI needs to know "P3S2 scored 64, render as
silence" even though there is no L5Annotation anchored there.

Beyond inline tiers, the score grid also drives:

- **Structural-map effectiveness strip** (per the engine's `effectivenessStrip`
  surface in `AnnotationV2Demo.tsx`) — a per-paragraph mini-bar showing
  sentence-by-sentence quality at-a-glance.
- **List-view sort/filter** by effectiveness band.
- **Phase-aware deferred surfacing** — Foundation-phase essays should
  visually suppress STRONG/EXCEPTIONAL underlines (they're not actionable
  at that phase); requires knowing the scores to apply the filter.

### 3.3 Field shape — recommended: flat grid on the result

Add one field to `L5AnnotationResult`:

```ts
/**
 * §4.3 + §8 Q1 6-tier visual: per-sentence effectiveness scores
 * sourced from L3.5 AnalysisPassOutput.sentenceAnalyses[].effectiveness.
 *
 * Flat list keyed by (paragraphIndex, sentenceIndex). The UI maps
 * each entry to a 6-tier band:
 *   <40 CRITICAL | 40-54 NEEDS_WORK | 55-75 FUNCTIONAL (silence)
 *   | 76-85 STRONG | 86-95 EXCEPTIONAL | 96-100 MASTERFUL
 *
 * Coverage: one entry per analyzed sentence. Sentences that L3.5
 * skipped (rare — see analysisPass.ts:1479 fallback) are emitted
 * with effectiveness=60 (the L3.5 fallback value) and
 * confidence='low' so the UI can de-emphasize them.
 *
 * Essay-level annotations and structural annotations without a
 * sentence anchor are not represented here — they have no sentence
 * tier.
 */
sentenceEffectiveness: SentenceEffectivenessEntry[];
```

```ts
export interface SentenceEffectivenessEntry {
  paragraphIndex: number;
  sentenceIndex: number;
  /** 0-100, clamped. Same value as AnalysisPassOutput.sentenceAnalyses[i].effectiveness. */
  effectiveness: number;
  /**
   * Convenience: the 6-tier band the score maps to.
   * Computed deterministically from `effectiveness`. Emitted so the
   * UI doesn't have to re-encode the thresholds (single source of
   * truth — backend owns the mapping, UI consumes the label).
   */
  tier: 'critical' | 'needs_work' | 'functional' | 'strong' | 'exceptional' | 'masterful';
  /**
   * Routing-grade confidence from L3.5 SentenceAnalysisConfidence.
   * Default 'high' for backward compat with L3.5 outputs predating
   * the confidence field. UI dims tier rendering at 'low'.
   */
  confidence: 'high' | 'moderate' | 'low';
}
```

### 3.4 Mapping function (single source of truth, backend-owned)

```ts
function effectivenessToTier(score: number): SentenceEffectivenessEntry['tier'] {
  if (score < 40) return 'critical';
  if (score < 55) return 'needs_work';
  if (score < 76) return 'functional';
  if (score < 86) return 'strong';
  if (score < 96) return 'exceptional';
  return 'masterful';
}
```

Locate this in a small new module:
`src/services/essayIntelligence/analysis/sentenceTier.ts`. Export the
function so the L4 score matrix, L6 coaching, and any future consumer
use the same thresholds. **Frontend will NOT re-implement these
thresholds** — it consumes the `tier` field as-is. This guarantees a
threshold change is a one-PR backend update, not a coordinated
frontend+backend bump.

### 3.5 Where to assemble — in `deepAnnotationService.ts` result assembly

The result-assembly site at `deepAnnotationService.ts:865` already has
access to `profile` (which carries the L3.5 analyses on
`profile.paragraphs[i].sentences[j].analysis`). Walk it once at the end:

```ts
const sentenceEffectiveness: SentenceEffectivenessEntry[] = [];
for (const para of profile.paragraphs) {
  for (const sent of para.sentences) {
    const a = sent.analysis;
    if (!a) continue; // sentence not analyzed (e.g., walkSkipped paragraph)
    sentenceEffectiveness.push({
      paragraphIndex: para.index,
      sentenceIndex: sent.index,
      effectiveness: a.effectiveness,
      tier: effectivenessToTier(a.effectiveness),
      confidence: a.confidence?.level ?? 'high',
    });
  }
}

return {
  // ... existing fields ...
  sentenceEffectiveness,
  // ... existing fields ...
};
```

Zero new LLM cost. Zero new latency (assembly is microseconds for ~50
sentences). The data already exists on the profile.

### 3.6 Coverage edge cases

| Scenario | Handling |
|---|---|
| Sentence with `analysis === null` (walkSkipped paragraph) | Omit from the grid. UI renders such sentences with no underline (default — same as FUNCTIONAL silence). |
| Essay-level / structural L5Annotation with no sentence anchor | Not in the grid. These render in the Roadmap surface, not inline. |
| L3.5 fallback entry (`analysisPass.ts:1479`) | Include in grid with `effectiveness=60, tier='functional', confidence='low'`. The 'low' tag is the signal for "we couldn't analyze this — treat the tier as a guess." |
| Focused-analysis path (`focusedAnalyzer.ts`) where only one paragraph re-analyzed | The grid should reflect the **current** state: re-analyzed paragraphs get fresh scores, untouched paragraphs carry forward their prior scores from the profile. The walk over `profile.paragraphs[*].sentences[*].analysis` handles this naturally — focused analyzer updates the profile in place; the L5 assembly reads whatever is currently there. |
| PIQ essay where sentences carry `piqDimensions` | Independent — the tier is still based on `effectiveness`. `piqDimensions` continues to surface in the L5Annotation body (see `SentenceAnalysis.piqDimensions` at `profileTypes.ts:781`). |

### 3.7 Pairing per-annotation effectiveness (optional convenience, recommended)

For each `L5Annotation` whose `location.sentenceIndex !== null`, also
emit the anchored sentence's effectiveness directly on the annotation:

```ts
export interface L5Annotation {
  // ... existing fields ...

  /**
   * §4.3 6-tier visual convenience: the effectiveness score of the
   * sentence this annotation anchors to, if any.
   *
   * Null when location.sentenceIndex is null (paragraph-anchored
   * annotation), or when the anchored sentence has no analysis
   * (walkSkipped).
   *
   * Identical to looking up `sentenceEffectiveness` by
   * (paragraphIndex, sentenceIndex). Emitted for UI convenience so
   * popup rendering doesn't require a second lookup pass.
   */
  anchorEffectiveness: number | null;
}
```

This is technically derivable UI-side, but exposing it on the
annotation reduces the popup-render code path from "lookup in grid" to
"read field." Recommended but not required — if backend prefers to skip
it, UI absorbs the lookup. Tag the decision in the PR description so
frontend knows which path to build.

### 3.8 Calibration — sanity-check the existing scores

L3.5 effectiveness scoring is already production-validated, but the
6-tier system is a new consumer with stricter calibration needs. Spot
check before shipping:

| Check | Target | Action |
|---|---|---|
| Score distribution across a 10-essay sample, by tier | FUNCTIONAL (55–75) should be 50–70% of all sentences | If FUNCTIONAL is <30%, scores are bi-modal (CRITICAL + STRONG with no middle) — L3.5 prompt may be over-confident; calibrationReflection should be reviewed |
| MASTERFUL (96–100) rate | <2% of all sentences | If >5%, L3.5 is giving away top scores too easily; tighten the calibration anchor |
| CRITICAL (<40) rate | <5% of all sentences | If >15%, L3.5 is too harsh; usually a sign the calibration anchor paragraph is too generous |
| Within-paragraph score variance | Should track `sentenceScoreStdev` on `AnalysisPassOutput` | If stdev is consistently <5, scores are clustered (anti-clustering reflection not biting) |

These are sanity checks against the live L3.5 output, not new asks. If
distributions look off, the fix is at the L3.5 prompt level — not on
the exposure work for this ticket.

---

## 4. Recommended integration sequence

| Order | Ticket | Why this order |
|---|---|---|
| 1 | Ask 2: per-sentence effectiveness pass-through | Frontend has the larger downstream lift (6-tier inline visuals + structural-map strip + tier-aware filters). Shipping this first unblocks the most parallel UI work. Zero LLM risk — pure exposure. |
| 2 | Ask 1: `phaseTransitionLine` | Frontend impact is bounded (one modal). Has a small LLM-prompt change requiring calibration → may need 1–2 prompt iterations. Independent of Ask 2. |
| 3 (after both land) | Threshold calibration sweep | Run the Ask 1 calibration windows (§2.7) and Ask 2 sanity checks (§3.8) against the next 50 re-analyses; tune prompts if outside band. |

Each ask is a standalone PR. No coordinated cutover required. Frontend
should put both consumers behind a `?ux=v2` query flag during the
calibration sweep so production traffic isn't exposed to half-baked
tiers if a prompt shift moves the distribution.

---

## 5. Test plan

### 5.1 Type / contract

- `npx tsc --noEmit` clean.
- New unit test:
  `tests/test-l5-result-shape.ts` — assert `phaseTransitionLine`,
  `sentenceEffectiveness`, `anchorEffectiveness` are present on the
  result and well-typed.
- New unit test:
  `tests/test-sentence-tier-mapping.ts` — exhaustive table-driven test
  of `effectivenessToTier` covering boundary scores (39, 40, 54, 55,
  75, 76, 85, 86, 95, 96, 100).

### 5.2 Behavioral — Ask 1

Run an essay through the full pipeline twice — once at Foundation
phase, once after a substantial rewrite that lifts it to Architecture:

- **Run 1 (first-ever analysis):** `phaseTransitionLine === null`.
  `transition === null` upstream confirms.
- **Run 2 (re-analysis, phase shift, genuine):**
  `phaseTransitionLine !== null`, 15–40 words, italic-suitable copy,
  references at least one specific essay element (a paragraph image,
  a scene, a phrase).
- **Run 3 (re-analysis, no phase shift):** `phaseTransitionLine === null`.
- **Run 4 (re-analysis, phase shift judged not genuine — e.g., a
  trivial edit that bumps a single sentence score across a boundary):**
  `phaseTransitionLine === null`. Confirm `transition.isGenuineShift === false`.

Reference fixture: use `tests/output/full-profile-14-harvard-2028-crochet.md`
as the baseline essay (491 words, $1.69 to fully analyze — well under
the $5 hard cap per memory `feedback_cost_budget.md`).

### 5.3 Behavioral — Ask 2

Same essay:

- `sentenceEffectiveness.length` equals the number of analyzed
  sentences (count from `profile.paragraphs[*].sentences` where
  `analysis !== null`).
- For each entry, `effectiveness` matches `analysis.effectiveness`
  exactly (no rounding, no transformation).
- `tier` always matches `effectivenessToTier(effectiveness)`.
- Each L5Annotation with `location.sentenceIndex !== null` has
  `anchorEffectiveness` matching its anchor sentence's grid entry.
- A focused-analysis re-run that touches one paragraph leaves the
  other paragraphs' grid entries identical to the prior run.

### 5.4 Cost / latency regression

Before/after both PRs:

- L5 call wall-clock latency: no measurable change (assembly is
  microseconds).
- phaseAssessment cost: ≤$0.001 increase per call. Acceptable inside
  the per-essay $1.50 target (memory `feedback_cost_budget.md`).

---

## 6. Telemetry

Add two log lines to the existing L5 telemetry stream (whatever
`buildCorpusTelemetryRecord` writes to, around
`deepAnnotationService.ts:857`):

```
[L5] phaseTransitionLine: emitted={true|false} length={N} priorPhase={X} newPhase={Y}
[L5] sentenceEffectiveness: count={N} tier_dist={critical:C,needs_work:N,functional:F,strong:S,exceptional:E,masterful:M}
```

The tier distribution log is what powers the §3.8 calibration check
without re-running essays. Persist to whatever table the existing
`persistCorpusTelemetry` writes to, or a sibling table — coordinate
with whoever owns the telemetry pipeline.

---

## 7. Out of scope (informational — not asked for)

The contract notes other backend gaps that the UI ships around. **Do
not pick these up under this ticket.** Listed so you know they were
considered and explicitly deferred:

From §9 (first-read gaps):

1. ~~Per-sentence effectiveness score~~ — now in scope as Ask 2.
2. Rewrite metadata (`registerMatch`, `divergenceDimension`,
   `variantCount`). Engine's RewriteCard would surface these; v1 ships
   without. Add to v1.1 if the metadata row tests well.
3. Multiple rewrite variants per annotation. L5 emits one; engine
   supports 1–2. Not a v1 blocker.
4. `sentenceIndex` as a *score* (vs an *anchor*). Subsumed by Ask 2.
5. `connectionLabel` for cross-refs. UI derives from `teachingIntent`.

From §11.6 (iteration-loop gaps):

1. **Stable annotation IDs across runs.** Currently `crypto.randomUUID()`.
   If matcher mismatch rate exceeds 15% in production, revisit —
   content-hashed IDs (`sha1(paragraphIndex + sentenceIndex + type +
   content-stem)`) would let the diff matcher (§11.3) collapse to ID
   equality and drop ~80% of its logic. Not a v1 blocker; gated on
   telemetry.
2. **Explicit resolution signal** —
   `resolvedFromPriorAnnotationId: string | null` per annotation. Would
   tighten the `rewrite_applied` vs `edit_addressed` distinction in the
   Resolved drawer. Currently inferred UI-side.
3. **Snapshot integration** — `EssaySnapshot` (`profileTypes.ts:5074+`)
   exists and could enrich Resolved drawer entries. v1 uses
   `revisedSentenceText` only.

If any of these become urgent based on production signal, open a fresh
ticket against this doc.

---

## 8. Anchor cite appendix

Backend files this work touches:

| File | Lines | What |
|---|---|---|
| `src/services/essayIntelligence/analysis/deepAnnotationService.ts` | 308–333 | `L5AnnotationResult` interface — add the two fields |
| `src/services/essayIntelligence/analysis/deepAnnotationService.ts` | 865–876 | Result assembly site — populate the two fields |
| `src/services/essayIntelligence/analysis/phaseAssessment.ts` | 98–168 | System prompt — extend with celebratoryLine section |
| `src/services/essayIntelligence/profileTypes.ts` | 2021–2025 | `ImprovementPhase.transition` — add `celebratoryLine` |
| `src/services/essayIntelligence/analysis/sentenceTier.ts` | *new file* | `effectivenessToTier()` mapping function |

Backend files this work reads but does NOT modify:

| File | Lines | What |
|---|---|---|
| `src/services/essayIntelligence/profileTypes.ts` | 4083–4116 | `AnalysisPassOutput.sentenceAnalyses[]` — source of effectiveness scores (already exists) |
| `src/services/essayIntelligence/profileTypes.ts` | 716–783 | `SentenceAnalysis` — same scores nested on `SentenceProfile.analysis` |
| `src/services/essayIntelligence/profileTypes.ts` | 1983–2031 | `ImprovementPhase` — already has `transition.isGenuineShift` |
| `src/services/essayIntelligence/analysis/analysisPass.ts` | 1410, 1459–1480 | Where `effectiveness` is clamped + emitted (don't change) |
| `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` | 940, 1602 | Where phase is set on `profile.index.improvementPhase` |
| `src/services/essayIntelligence/analysis/focusedAnalyzer.ts` | 1596, 1956–1960 | Focused-analysis path that re-runs `assessPhase` with `priorPhase` |

Frontend consumers (FYI for backend, no backend change required):

| File | What |
|---|---|
| `src/components/annotation-v2-engine/phaseIntent.ts` | UI fallback registry for `phaseTransitionLine === null` |
| `src/components/annotation-v2-engine/InsightCard.tsx` | Renders the 6-tier inline visuals |
| `src/components/annotation-v2-engine/effectivenessStrip.tsx` | Renders the structural-map effectiveness strip |
| `src/pages/AnnotationV2Demo.tsx` | Workshop surface integrating all consumers |

UX contract cross-references:

| Contract section | What it specifies |
|---|---|
| §4 (lines 178–230) | `L5Annotation` field consumption table — read this to see how each existing field is rendered |
| §4.3 + §8 Q1 | 6-tier inline visual system — the consumer of Ask 2 |
| §5 (lines 233+) | Three-array routing (paragraph / cross-paragraph / essay-level) — unchanged |
| §7 | Phase-aware UX rules — context for Ask 1 |
| §11 (lines 412+) | Iteration loop — full §11.5 is the consumer of Ask 1 |
| §11.5.1 (lines 580–622) | Original ask 1 spec — read for the WHY |
| §11.6 (lines 624–635) | Informational backend gaps — what's NOT in this ticket |

---

## Authority

- **Authored:** 2026-05-21, Claude (backend handoff from UX contract
  locking session)
- **Source contract:** [`docs/UX_CONTRACT_2026_05_12.md`](./UX_CONTRACT_2026_05_12.md)
  — locked 2026-05-20
- **Status:** Ready for backend pickup. Ship in any order; recommended
  Ask 2 first.
- **Re-open this doc if:** the `L5AnnotationResult` shape on backend
  diverges from §2.2 / §3.3, the 6-tier thresholds in §3.4 change, or
  the prompt extension in §2.4 produces calibration miss outside the
  windows in §2.7.
