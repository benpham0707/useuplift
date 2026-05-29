# Executive Brief Design

> **Stage 1.A** of [`CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md`](../../00-index/CONSOLIDATED_IMPLEMENTATION_PLAN_2026_05_24.md).
> **Decision locked**: D5 — option (a) new Sonnet micro-call (NOT fold into L4b, NOT deterministic render).
> **Date**: 2026-05-24.

---

## 1. Problem

Counselor-gap memory: pipeline outputs 3,001 lines for a 491-word essay. Actionable directives are scattered across 7+ sections of the dump. A counselor would write a one-page brief at the top: "here are 5 things to do, here are 3 model sentences I'd write, here's whether this is competitive."

Students don't read 3,000 lines. They read the top. There is no top today.

## 2. Goal

A <300-word brief at the top of every dump, every coaching session, every workshop surface. Format:

```
EXECUTIVE BRIEF — {Essay Title}

VERDICT — {1 sentence: competitive read at target school tier}

5 DIRECTIVES (in priority order)
1. {action: concrete revision the student should do, ≤20 words}
2. {action}
3. {action}
4. {action}
5. {action}

3 MODEL SENTENCES (the editorial last mile)
Original: "{sentence that needs revision}"
Revision: "{counselor-grade revision}"
Why: "{one-sentence rationale}"
... (×3)
```

Length cap: ≤300 words total. Every word earns its place. No diagnostic language ("the essay demonstrates..."), no hedging ("you might consider..."), no metrics in prose.

## 3. Why a new Sonnet micro-call (option a), not fold or render

**Option (b) fold into L4b** — saves the +$0.05–$0.10 cost but:
- L4b is already the largest L4 prompt; growing it by another section pushes against max_tokens.
- Brief revision (prompt tuning, calibration) couples to L4b changes — touching one risks the other.
- L4b's job is consolidation across paragraphs, not editorial top-line; mixing the two confuses the prompt's goal.

**Option (c) deterministic render** — saves the cost but:
- Verdict line requires LLM judgment (competitive read), not template composition.
- Model sentences are editorial craft, not extraction.
- Would force the brief into template-y language — exactly what the counselor-gap memory says we're missing.

**Option (a) new Sonnet micro-call** — costs +$0.05–$0.10 per cold-start but:
- Clean separation: revisable independently, easy to A/B, easy to swap to Haiku later if calibration holds.
- Reads compressed L4 + L5 surface only (post-everything), so it has the strategic frame + actionable signals + cuts already made.
- Smallest LLM scope: brief generation is well-defined, ~1500 token output cap.

## 4. Inputs (compressed L4+L5 surface)

The brief micro-call sees:
- `EssayNorthStar` (entire — strategic frame, ~400 tokens).
- `ParagraphScoreMatrix.coherenceResolutions[]` (from 1.B — for context on terminated contradictions).
- `L5AnnotationResult.essayLevelAnnotations` + top 5 surfaced paragraph annotations by priority (the actionable spine, ~600 tokens).
- `aoFirstRead.{putDownRisk, committeeOneLiner}` (for verdict grounding, ~150 tokens).
- `EssayProfile.thematicArchitecture.thesis` (1 sentence).
- `EssayUnderstanding.prose` truncated to first 200 words (writer portrait for character).

Total input ~1500-2000 tokens (most cached if part of a session). Output 200-300 tokens.

## 5. Output schema

```ts
export interface ExecutiveBrief {
  /** Calibrated competitive verdict — 1 sentence */
  verdict: string;
  /** Target school tier this verdict references */
  targetTier: 'ivy_elite' | 'highly_selective' | 'very_selective' | 'selective' | 'competitive' | 'accessible';
  /** 5 directives, priority 1 = read this first */
  directives: Array<{
    rank: 1 | 2 | 3 | 4 | 5;
    action: string;          // ≤20 words
    rationale: string;       // ≤30 words — the WHY, references the strategic frame
    affectedParagraphs: number[];
  }>;
  /** 3 model sentences (the editorial last mile) */
  modelSentences: Array<{
    originalSentence: string;
    originalLocation: { paragraphIndex: number; sentenceIndex: number };
    revisedSentence: string;
    rationale: string;       // ≤25 words
  }>;
  /** Word count of the entire brief render (cap enforcement) */
  totalWordCount: number;
  cost: number;
  timingMs: number;
}
```

`totalWordCount` is computed post-emission; if >300, the call is re-run with explicit re-tightening (one retry max).

## 6. Prompt sketch

```
You are an admissions counselor writing the executive brief for one
essay. The student will read this BEFORE the diagnostic dump. Most
students never read past the brief — make every word earn its place.

CONSTRAINTS (mandatory):
- Total length: ≤300 words.
- VERDICT: ONE sentence stating where this essay stands at
  {targetTier}. Forbidden: "could be," "might be," "shows promise."
  Required: a calibrated read ("competitive at," "below the bar
  for," "exceptional but with one cost").
- 5 DIRECTIVES: ordered by priority, ≤20 words each. Imperative
  voice. Each names a concrete action AND a target location
  (paragraph or sentence). Forbidden: "consider," "perhaps,"
  "explore."
- 3 MODEL SENTENCES: pick the 3 sentences where a single rewrite
  unlocks the most. Quote the original; write the revision (your
  editorial craft); explain in ≤25 words why.

CALIBRATION:
- A 95-level essay's brief reads: "Exceptional. Three tiny
  refinements." Most don't get this.
- A 75-level essay's brief reads: "Competitive but needs X. Here's
  X." Five directives, all real.
- A 55-level essay's brief reads: "Not yet competitive. The
  foundation is here. Two structural moves change the read." Three
  directives are structural, not craft.

OUTPUT FORMAT: strict JSON matching the ExecutiveBrief schema. No
markdown. No additional prose.
```

## 7. Cost impact

| | Cold-start | Lifecycle |
|---|---|---|
| Sonnet call cost (input ~1500 cached + ~500 uncached, output ~300) | ~$0.05-0.08 | Same (single brief per analysis run) |
| Marginal vs no brief | +$0.05-0.08 | +$0.05-0.08 |

Within the $1.20 lifecycle target headroom. Worth it for the perceived-quality gain (the audit's "highest perceived-quality-per-dollar" item).

## 8. Risks

**R1 — Brief contradicts the dump.** If the brief says "competitive" and the dump's deep analysis flags 5 P0 problems, the student loses trust in either layer. Mitigation: brief consumes the resolved + framed contradictions from 1.B; it never sees raw signals. Plus: post-generation coherence check — brief verdict must align with L4 ScoreMatrix avg paragraph score (if avg <50 and brief says "competitive at Ivy," reject and re-run).

**R2 — Template-y output.** LLM falls back to generic counselor-speak ("strong voice with room to grow"). Mitigation: prompt explicitly forbids hedge words + requires concrete revision targets in every directive. Post-call validator scans for forbidden phrases ("consider", "perhaps", "explore", "demonstrates", "shows promise") — if any present, re-run with a stricter directive.

**R3 — Model sentences fabricate content.** The biggest risk — counselor-grade rewrites that introduce metrics or claims not in the essay. Mitigation: prompt instructs "rewrite EXISTING sentences without adding new claims, metrics, or events. You may sharpen voice, tighten word economy, add specificity FROM ELSEWHERE IN THE ESSAY — never invented." Plus: a sentence-level fabrication guard (reuses existing `fabricationGuard.ts` pattern) checks the revisedSentence against essay text and L5 known-content set.

**R4 — Word-count overrun.** A 300-word cap is tight. Mitigation: maxTokens hard cap at 600 output tokens (~450 words); post-call word-count validator with a single retry. If retry fails, surface a degraded brief flagged as `_truncated: true` rather than no brief at all.

## 9. Where in the pipeline

- **When**: post-L5 (after annotations + ranker), part of the dump composition path.
- **Wire site**: `analysisOrchestrator.ts` final phase — call after `deepAnnotationService.generateAnnotations()` returns, before assembler convergence emits the dump.
- **Render site**: `presentation/renderAnalysisForStudent.ts` — emit brief at the top, before all existing sections.
- **Feature flag**: `ENABLE_EXECUTIVE_BRIEF=true` (default off until Phase 6 regen approves it; then default on).

## 10. Acceptance gate (Phase 6 regen)

- **Brief present**, ≤300 words, in the Crochet dump.
- **Contains** exactly 5 directives + 3 model sentences + 1 verdict.
- **No forbidden words** in the brief render ("consider", "might", etc.).
- **Verdict aligns** with L4 ScoreMatrix avg (verdict tier within ±1 tier of ScoreMatrix-implied tier).
- **Model sentences pass fabrication guard** — no invented metrics or events.
- **Tue's editorial gut**: would you put this in front of a student?

## 11. Cost / kill-switch math

Per-essay marginal: +$0.05–0.08. Within the $0.85 cold-start target's tolerance. Kill switch via `ENABLE_EXECUTIVE_BRIEF=false` — single-line env disable; degrades to current state (no brief, full dump).

## 12. Open question for Tue (Stage 2 gate)

Target tier (`ivy_elite` ... `accessible`) — where does it come from? Three options:
- (i) Passed in from the workshop surface (student picked a school list).
- (ii) Inferred from `admissionsPositioning.archetypeContext` (existing field).
- (iii) Always the highest tier in the student's stated portfolio (default Ivy unless explicit).

Recommendation: (ii) for default, (i) when explicitly provided. (iii) feels arbitrary.

---

## CORRECTIONS — appended 2026-05-24 (HEAD verification)

### EB-C1 — confirmed greenfield
- HEAD grep for `executiveBrief`, `ExecutiveBrief`, the design's `directives`, `modelSentences`, `verdict` schema fields — zero hits across `src/`. No layer emits a brief, no schema supports one.
- **Stage 2 delta**: full design is net-new code. Sonnet micro-call + `ExecutiveBrief` type + integration hook into L6 / render layer.
- Locked decision per plan §0.5: target tier inferred from `admissionsPositioning.archetypeContext` as default; workshop override when explicit.

