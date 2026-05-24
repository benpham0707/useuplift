# Model Sentences + Decisive Cut-List Design

> **Stage 1.F** of [`CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md`](../../00-index/CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md).
> **Source finding**: counselor-gap memory (`essay-intelligence-counselor-gap.md`) — "the editorial last mile."
> **Date**: 2026-05-24.

---

## 1. Problem

The pipeline today emits ONE `rewriteExample` per ACTION-mode annotation. A counselor would:
- **Write 2–3 candidate revisions** per high-priority sentence, each playing a different angle (tighten / specify / sharpen voice), and let the student pick.
- **Cut decisively** — name sentences and phrases that should DISAPPEAR with high confidence, not just "consider trimming."

Neither exists today. The L5 annotation gives one rewrite + an `wordEconomyCut` field (which is one cut per annotation, framed as a side-effect of a rewrite, not a primary editorial directive).

## 2. Goals

### 2A — Model sentence variants
Per high-priority annotation (priority 1–2), L5 emits 2–3 candidate revisions, each:
- Plays a different angle (specified via a small enum: `tighten`, `specify`, `sharpen_voice`, `restructure`).
- Stands alone — the student picks one, ships it.
- Annotated with a one-sentence rationale.

### 2B — Decisive cut-list
A NEW output surface (sibling to annotations): essay-level cut candidates with confidence scores. Each entry:
- Cites the exact text to delete (sentence or phrase).
- Carries a confidence (0-1) — only ≥0.9 entries surface to the student.
- Carries a rationale (≤25 words).
- Is paired with the annotation/finding that justifies the cut (so the student sees WHY the cut serves their goals).

## 3. Schema additions

### 3.1 Per-annotation: `rewriteVariants`

```ts
export interface L5Annotation {
  // ... existing fields ...
  rewriteExample: string | null;  // existing — kept for back-compat, equivalent to rewriteVariants[0].text

  /**
   * Stage 1.F additions — 2-3 candidate revisions for priority 1-2 ACTION
   * annotations. Each variant plays a different editorial angle. The
   * existing `rewriteExample` is the first variant's text (for back-compat).
   *
   * Null for non-ACTION annotations, AWARENESS/CONNECTION modes, or
   * priority 3-5 annotations.
   */
  rewriteVariants: Array<{
    angle: 'tighten' | 'specify' | 'sharpen_voice' | 'restructure';
    text: string;
    rationale: string;       // ≤25 words
    netWordDelta: number;    // computed: revised words - original words
  }> | null;
}
```

### 3.2 Essay-level: `cutCandidates` (NEW)

```ts
export interface CutCandidate {
  /** Stable ID */
  id: string;
  /** What to delete — sentence or phrase */
  textToDelete: string;
  /** Location anchor */
  location: {
    paragraphIndex: number;
    sentenceIndex: number;
    /** Whether the cut is full-sentence or sub-sentence phrase */
    scope: 'sentence' | 'phrase';
  };
  /** Confidence 0-1; only ≥0.9 surface to student */
  confidence: number;
  /** Why cut — ≤25 words */
  rationale: string;
  /** Which Finding / annotation justifies this cut */
  pairedFindingId: string | null;
  pairedAnnotationId: string | null;
}

export interface L5AnnotationResult {
  // ... existing fields ...

  /**
   * Stage 1.F — decisive cut candidates. Only entries with confidence
   * ≥0.9 should be rendered to the student; lower-confidence entries
   * stay in the result for iteration ledger / carry-forward.
   */
  cutCandidates: CutCandidate[];
}
```

## 4. Where the LLM produces these

### 4.1 Rewrite variants — extend the existing L5 per-paragraph prompt

Add a directive to the existing `deepAnnotationService.ts` paragraph annotation prompt:

```
For ACTION annotations with priority 1 or 2, emit a `rewriteVariants`
array with 2 or 3 entries. Each plays a different editorial angle:

- `tighten`: cut words without losing meaning; preserve voice + claim.
- `specify`: replace abstract phrases with concrete sensory or
  factual detail FROM ELSEWHERE IN THE ESSAY (do not invent).
- `sharpen_voice`: rewrite to make the writer's distinctive voice
  more present; preserve content.
- `restructure`: change the sentence's syntactic shape (subordination,
  fronting, parallelism) for emphasis; preserve content.

You do not need to use all 4 angles — pick the 2-3 most useful for
THIS sentence. Each variant must stand alone. The existing
`rewriteExample` field stays populated as variants[0].text (back-compat).
```

No new call. Marginal output growth ~100-200 tokens per priority-1-2 annotation. Estimated ~6-10 affected annotations per essay × ~150 output tokens = ~1000-1500 extra output tokens per essay. **+~$0.02 per cold-start.**

### 4.2 Cut-list — extend the L5 essay-level annotation pass OR a new lightweight L5 sub-call

The existing `essayLevelAnnotations` path in `deepAnnotationService.ts` can be extended with a cut-list directive. This is preferred over a new call (no extra round-trip).

Prompt addition (essay-level):

```
DECISIVE CUT-LIST (separate from annotations)

Scan the essay for sentences or sub-sentence phrases that should be
CUT decisively (not just revised). Emit each candidate to the
`cutCandidates` field with:
- exact text to delete (must match essay verbatim — fabrication
  guard will reject otherwise)
- confidence 0.0-1.0 — only emit if ≥0.7; only entries ≥0.9 will
  surface to the student
- rationale ≤25 words — what the cut accomplishes
- pairedFindingId / pairedAnnotationId — the diagnostic finding
  this cut serves

Cut-list entries must be GENUINE deletions, not "trim a bit." A
cut means the essay reads BETTER with the text gone. If you're
not sure, set confidence <0.9 and let it sit below the surfacing
threshold.

Avoid cutting:
- Sentences that carry load-bearing thesis claims.
- Sentences that introduce specific narrative pivots.
- Voice signatures the writer has earned.

Bias toward cutting:
- Telling-not-showing summaries.
- Stage-direction throat-clears ("I want to talk about...").
- Filler transitions that don't advance the arc.
- Redundant claims (the second time the writer says the same thing).
```

Marginal output growth ~50-150 tokens per essay (cut-list is small by design — ≥0.9 candidates are rare). **+~$0.005 per cold-start.**

## 5. Render path

- **rewriteVariants**: when L5Annotation has `rewriteVariants !== null`, the UI surface (annotation popup, RewriteCard) renders each variant in tabs / accordions; default tab is variants[0]. Out of scope for this design (frontend handoff).
- **cutCandidates**: filter to confidence ≥0.9 at render time. Render as a separate "Cut-list" section in the dump and Executive Brief. The Brief's directives may reference cuts.

## 6. Risks

**R1 — Fabrication in revisions.** Variants invent metrics, events, characters. Mitigation: existing `fabricationGuard.ts` pattern + prompt directive "do not invent — pull specifics FROM ELSEWHERE IN THE ESSAY." Post-call sentence-level guard on every variant.

**R2 — Cut-list over-confidence.** LLM marks 0.95 confidence on cuts that would harm the essay (e.g. cutting a thesis sentence). Mitigation: prompt's "Avoid cutting" list; post-call validator that bails out cuts of sentences flagged as `pivotPoint` or `turningPoint` in NarrativeStrategy. Even a 0.95-confidence cut on a pivot sentence is wrong.

**R3 — Variant homogeneity.** All 3 variants read the same — different word, same shape. Mitigation: each variant must declare its `angle`; post-call validator checks that the 3 variants use 3 different angles (or that variants array length matches distinct angles).

**R4 — Output size growth busts max_tokens.** Per-paragraph L5 call max is 2000. Adding 2-3 variants to several annotations could push against it. Mitigation: variants are budgeted at ≤80 words each; for priority-1-2 annotations only (cap on number of variant-emitting annotations per paragraph at 2).

## 7. Acceptance gate (Phase 6 regen)

- **≥1 priority-1 annotation per fixture has 2 or 3 `rewriteVariants`** with distinct angles.
- **All variants pass fabrication guard** (no invented content).
- **No cut candidate violates the "Avoid cutting" pivot/turning-point check.**
- **≥0.9-confidence cut candidates: 1-5 per fixture** (band check — 0 means LLM is conservative, >5 means LLM is over-cutting).
- **Each surfaced cut has a `pairedFindingId` or `pairedAnnotationId`** (otherwise it's an orphan cut, reject).
- **Tue's editorial gut**: are the variants worth the student picking between? Are the cuts decisive enough?

## 8. Cost impact

| Item | Per cold-start |
|---|---|
| Rewrite variants (output growth in per-paragraph L5 calls) | +~$0.02 |
| Cut-list (output growth in essay-level L5 call) | +~$0.005 |
| **Total** | **+~$0.025** |

Within $0.85 cold-start headroom.

## 9. Implementation notes (Stage 2)

- File: `deepAnnotationService.ts` prompt builders + parsers + validators.
- New types: `CutCandidate`, `rewriteVariants` array shape — both on `profileTypes.ts`.
- Validators: extend existing `validateAnnotations()` to handle variants array + cut candidates.
- Fabrication guard: extend to scan every `rewriteVariants[i].text` and `cutCandidates[i].textToDelete`.
- Feature flag: `ENABLE_REWRITE_VARIANTS=true`, `ENABLE_CUT_LIST=true`. Independent flags so we can A/B.

## 10. Open question for Tue (Stage 2 gate)

Should cut-list cuts that exceed 5 emit a warning ("essay needs significant cutting — consider a structural review")? Or just truncate to the top 5 by confidence?

Recommendation: warning + truncate to 5. If the LLM wants to cut 8 sentences, that's a structural-phase essay; the student needs a structural directive in the Brief, not 8 cuts.

---

## CORRECTIONS — appended 2026-05-24 (HEAD verification)

### MSC-C1 — confirmed greenfield
- HEAD grep: `rewriteVariants`, `cutCandidates`, `CutCandidate`, `cutList`, `modelSentences` — zero hits anywhere under `src/`.
- **Existing baseline**: `L5Annotation.rewriteExample` is a single string (`deepAnnotationService.ts:211` / type defn). No variant array, no per-essay cut-list collection.
- **Stage 2 delta**: full design is net-new. Two new schema fields (`rewriteVariants: ModelSentence[]`, `cutCandidates: CutEntry[]`), L5 prompt directives, fabrication guard extension to scan both new field arrays.
- Locked decision per plan §0.5: warning + truncate to top 5 by confidence; "essay needs structural review" surfaces when LLM wanted more than 5.

