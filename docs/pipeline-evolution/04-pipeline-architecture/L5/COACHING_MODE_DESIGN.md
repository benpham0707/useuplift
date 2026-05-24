# Coaching Mode Design (Questions + Principles alongside Rewrite)

> **Stage 1.D** of [`CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md`](../../00-index/CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md).
> **Source finding**: `WRITING_SYSTEM_DEEP_RESEARCH_SYNTHESIS.md` P1 (learned helplessness from auto-rewrite); `L5_FEEDBACK_REDESIGN.md §1.8` item "no coaching mode."
> **Date**: 2026-05-24.

---

## 1. Problem

Today every L5 annotation is **rewrite-shaped**. ACTION mode forces `rewriteExample`. Even AWARENESS / CONSEQUENCE / CONNECTION modes carry implicit "here's what you should do" framing.

Research (`WRITING_SYSTEM_DEEP_RESEARCH_SYNTHESIS.md` P1, multiple studies): when a writing tool gives auto-rewrites, students copy them, internalize less, and develop *learned helplessness* on the underlying skill. The pedagogical gold standard is:

1. Ask a focused question that surfaces the problem.
2. State the principle in one sentence.
3. Show 1-2 corpus exemplars of the principle in action.
4. The student writes their own revision.

The student becomes a better writer; the rewrite doesn't get internalized as "AI did this for me."

## 2. Goal

Add a per-annotation `coachingMode` toggle that selects between:
- **`rewrite`** — current behavior; `rewriteExample` + variants (1.F).
- **`ask`** — questions + principle + exemplars; NO `rewriteExample`.

Not all annotations get coaching mode. The student picks per essay (e.g. "I want rewrites" vs "I want coaching"). Per-annotation override: even a "rewrite" essay can have `ask`-mode annotations on issues the student should learn (e.g. cliché diagnosis — internalize what cliché feels like).

Per `L5_EXPERIENCE_TARGET §7.2` (cited in audit): both paths per focus point, not a hard mode toggle. So the long-term shape is both-paths-always-available; this design ships the **toggle** as v1 and leaves both-paths as a v2.

## 3. Schema additions

```ts
export type L5CoachingMode = 'rewrite' | 'ask';

export interface L5Annotation {
  // ... existing fields ...

  /**
   * Stage 1.D — coaching mode. 'rewrite' (default, current behavior) emits
   * rewriteExample + rewriteVariants. 'ask' emits askMode payload + no
   * rewriteExample. Selected by upstream essay-level mode AND per-annotation
   * override.
   */
  coachingMode: L5CoachingMode;

  /**
   * Stage 1.D — populated only when coachingMode === 'ask'. Null for
   * rewrite-mode annotations.
   */
  askMode: {
    /** 1-3 focused questions surfacing the problem; ≤25 words each */
    questions: string[];
    /** The principle the questions point to; 1 sentence */
    principle: string;
    /** Corpus exemplars of the principle in action; 1-2 entries */
    exemplars: Array<{
      excerpt: string;          // ≤80 words
      source: 'corpus' | 'this_essay';
      sourceRef: string;        // corpus path or paragraph index
      whyExemplar: string;      // ≤25 words
    }>;
  } | null;
}
```

```ts
// Per-essay coaching mode (NEW field on EssayProfile or its index)
export interface ProfileIndex {
  // ... existing fields ...
  coachingMode: L5CoachingMode | 'mixed';  // default 'mixed'
}
```

## 4. Mode selection rules

Per-annotation `coachingMode` is decided by:
1. **Essay-level setting** — if the profile's `coachingMode === 'rewrite'`, all annotations default to `rewrite`. If `'ask'`, all default to `ask`. If `'mixed'`, rule 2 decides.
2. **LLM per-annotation override** — the L5 prompt asks the LLM to assign `coachingMode` per annotation based on what's pedagogically right (e.g. cliché diagnosis → `ask`; word-economy cut → `rewrite`).
3. **Mode-locked annotations** — some annotation types (e.g. STRUCTURAL `restructure_paragraph` directives) are always `rewrite` because the move is too complex to coach via questions alone. Hard-coded list maintained in `deepAnnotationService.ts`.

## 5. Prompt-side changes

`deepAnnotationService.ts` per-paragraph annotation prompt gets a new section:

```
COACHING MODE — per-annotation decision

Each annotation must declare `coachingMode`:

- 'rewrite' — emit rewriteExample (+ rewriteVariants for priority 1-2).
  Use when: the move is complex enough that a model rewrite teaches
  faster than a question; OR the student is in 'rewrite' essay mode.

- 'ask' — emit askMode payload (questions, principle, exemplars).
  No rewriteExample, no rewriteVariants. Use when: the issue benefits
  from the student internalizing the principle (cliché, voice
  authenticity, show-don't-tell, structural pivot recognition);
  OR the student is in 'ask' essay mode.

If the essay's profile.index.coachingMode is 'rewrite' or 'ask',
default to that mode unless the annotation is in the mode-locked
list (provided below). If 'mixed', decide per-annotation based on
pedagogical fit.

For ASK mode, the questions must be ANSWERABLE BY THE STUDENT —
not rhetorical, not leading. The principle must be writable on an
index card. The exemplars must come from the corpus retrieval block
(when wired — see CORPUS_WIRING_DESIGN.md) OR another paragraph of
THIS essay. Never invented.
```

## 6. Where exemplars come from

Two sources, both already partial-wired:

- **Corpus exemplars**: `MOVE_EXCERPTS` (53 anchored, used for calibration in 1.C) + `CraftMove` (already retrieved per `corpusRetrievalBlocks.ts`). The corpus-wiring design (1.H) extends this.
- **This-essay exemplars**: when another paragraph of the same essay demonstrates the principle, cite it. Cheaper than corpus, more grounded for the student.

## 7. Risks

**R1 — Pedagogical wrong-call.** LLM picks `ask` for an issue where the student really needed a rewrite (e.g. word-level grammar). Mitigation: mode-locked list + explicit prompt directive ("grammar, mechanics, word-economy cuts: always rewrite, never ask"). Plus the per-annotation override path lets the student request a rewrite if `ask` isn't what they wanted.

**R2 — Questions become rhetorical.** "Why did you choose to use a cliché here?" is a bad coaching question (leading). Mitigation: prompt directive "questions must surface what the student doesn't yet see — not what you've concluded." Post-call validator scans for leading-question patterns ("why did you...", "didn't you mean to...").

**R3 — Exemplar fabrication.** LLM invents a corpus exemplar. Mitigation: fabrication guard checks every exemplar's `excerpt` against the corpus or essay text. Reject + fall back to no-exemplar `ask` mode (questions + principle only).

**R4 — Mode confusion for the student.** Student gets a mix of rewrite + ask annotations and doesn't know what to do. Mitigation: render-side handles this — `ask` annotations have a distinct visual treatment (the engine's `AskCard` vs `RewriteCard`). Out of scope for this design (frontend).

**R5 — Coupling with Brief (1.A) and Variants (1.F).** Brief lists "5 directives" — what if 3 of them are `ask` mode (no rewrite)? Mitigation: Brief directives are layer-1 actions (always concrete); `ask`-mode annotations are layer-2 teaching. Brief never inherits `ask` shape — it always tells the student WHAT to do next, even if individual annotations coach.

## 8. Acceptance gate (Phase 6 regen)

- **Both modes present in the fixture output** (assuming `coachingMode === 'mixed'`): ≥1 `rewrite` annotation, ≥1 `ask` annotation.
- **Ask-mode payload integrity**: questions ≤25 words each, principle 1 sentence, exemplars cite real sources (post-call validator passes).
- **Mode-locked compliance**: every annotation in the locked list is `rewrite` mode (grammar, structural directives, word-economy cuts).
- **No leading questions**: zero questions matching the "rhetorical / leading" anti-pattern.
- **Manual gut-check** on 5 `ask` annotations: would the questions actually help a student grow?

## 9. Cost impact

Marginal. `askMode` payload is ~150-250 tokens output per ask-annotation vs ~80-150 for rewriteExample-only. With a mix of modes, output grows modestly: ~+200-400 tokens per cold-start. **+~$0.005 per cold-start.**

## 10. Implementation notes (Stage 2)

- File: `deepAnnotationService.ts` — prompt + validators + post-call hooks.
- New types: `L5CoachingMode`, `askMode` shape on `L5Annotation` (profileTypes.ts).
- Mode-locked list: small constant array in `deepAnnotationService.ts` (annotation `type` × `teachingIntent` combinations that lock to rewrite).
- Feature flag: `ENABLE_COACHING_MODE=true`. Off by default until Phase 6 confirms quality.
- L5 redesign coordination: this design coexists with the in-flight L5 redesign per `L5_FEEDBACK_REDESIGN.md`. Surface conflict early in Stage 2 — if the redesign restructures the annotation shape, this PR may need to fork.

## 11. Open question for Tue (Stage 2 gate)

Default essay-level `coachingMode` for v1?

Recommendation: `'mixed'`. The LLM picks per-annotation; we observe what the distribution looks like in the regen; we tune (or expose an essay-level toggle to the student) in v2.

Alternatives:
- `'rewrite'` default: keeps the current student experience; only opt-in askmode. Slower learning curve for the new mode.
- `'ask'` default: leans hardest into the pedagogy; but students used to rewrites may be frustrated initially.

---

## CORRECTIONS — appended 2026-05-24 (HEAD verification)

### CM-C1 — name collision with existing `CoachingMode` (BLOCKER for Stage 2)
- **Already at HEAD**: `CoachingMode` is an existing per-turn enum at `profileTypes.ts:303-308` (`'first_encounter' | 'revision_response' | 'iteration_deep' | 'architecture' | 'polish'`). Detected by `detectCoachingMode()` at `reanalysisOrchestrator.ts:463`, consumed throughout `coachingService.ts:898, 912, 1046, 1185`.
- **What this design's "coaching mode" actually means**: a per-annotation toggle between `'rewrite'` (current behavior — LLM writes the revision) and `'ask'` (LLM emits questions + principle + exemplars, student writes their own revision). This is a SEPARATE pedagogical concept; the existing `CoachingMode` is about per-turn coaching strategy (first-encounter response vs. iteration vs. polish), not about who-writes-the-revision.
- **Also already at HEAD**: `L5TeachingMode` (`'awareness' | 'consequence' | 'connection' | 'action'`) at `profileTypes.ts:5006`, consumed at `deepAnnotationService.ts:166`. This is a third, different concept (pedagogical *intent*, not who writes the rewrite).
- **Implication**: shipping a third `coachingMode` field as-named in this design will cause naming collision + reviewer confusion + likely silent bugs in any code that conflates the two enums.

### CM-C2 — rename required before Stage 2 implementation
- The design needs a new field name that signals "who-writes-the-revision" without collision. Candidates: `revisionMode` (`'rewrite' | 'ask'`), `studentInvitation` (`'rewrite_demo' | 'ask_for_revision'`), `editorialMode`, or `responsibilityMode`. Tue to decide.
- This is a **design-edit gate**, not just an implementation note. The body of the design (§2, §3, §5, §10) all refer to "coachingMode" and need a search-and-replace plus a clarifying preamble explaining what the field is NOT (it is not a synonym for the existing L6 `CoachingMode`).

### CM-C3 — confirmed schema is greenfield
- HEAD grep: zero hits for `askMode`, `askPayload`, the design's `questions` + `principle` + `exemplars` payload shape on L5 annotations. The full schema is net-new (just needs a non-colliding name).

