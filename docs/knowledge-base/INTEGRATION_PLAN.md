# Integration Plan — Wiring the Knowledge Base into Generation

> **⚠️ PARTIALLY SUPERSEDED (2026-06-21, FOUNDATION_AUDIT R-2).** This is the original narrative vision.
> Authoritative since: the hardened **`INTEGRATION_BLUEPRINT.md`** (architecture) + **`EDITORIAL_EVAL_GATE_SPEC.md` v2**
> (the eval). Where this doc describes the eval as a "2-D HELPFUL∧ORIGINAL gate / ship only what lifts,"
> that framing was RETRACTED — the eval gates only the falsifiable hygiene/originality/non-regression axes;
> editorial-lift is ADVISORY (no ground truth). Read the BLUEPRINT + EVAL_SPEC v2 for what to build.

> How the 44 (→ growing) verified KB entries become a system that **recognizes** what an essay needs
> and **utilizes** the right techniques from the countless options to **lift** the writing to admit-level —
> efficiently and optimally. Reconciles the prior architecture verdicts
> ([`FIELD_KNOWLEDGE_BLUEPRINT.md`](../archived/essay-intelligence-field-knowledge/FIELD_KNOWLEDGE_BLUEPRINT.md)
> + [`FIELD_KNOWLEDGE_CRITIQUE_AND_REVISION.md`](../archived/essay-intelligence-field-knowledge/FIELD_KNOWLEDGE_CRITIQUE_AND_REVISION.md), now archived)
> with the KB we actually built.

## Verified baseline (2026-06-19): GREENFIELD

- 44 KB entries exist in `docs/knowledge-base/essays/entries/` (facts ×23, reflection ×8, restraint ×6, rhythm ×7) — **connected to nothing**.
- Retrieval infra exists (`claudeRetrieval.ts` cached-Haiku catalog ranking) but: the **master-flag bug is still live** (`corpusRetrievalBlocks.ts:265`, per-layer flags are no-ops), the KB is **not** in the catalog, `MoveDimension` is **still 8**, no `DimensionTarget`/dimension-retrieval, the **executive brief is still unrendered + flag-off**, manifest still uses the keyword table. Nothing from the prior blueprint shipped.
- So: integrate from clean ground, applying every prior lesson at once.

## The core insight — the entry schema already IS the pipeline

Each KB-entry field maps to a generation stage. Integration is mostly *routing existing fields to the right layer*, not new modeling:

| Entry field | Pipeline job | Stage |
|---|---|---|
| `detectionSignal`, `failureModes` | **RECOGNIZE** — is this technique present / botched / *missing*? | L3.5 diagnosis |
| `subtopic`/`dimensionTags`, `surfaceVsExpert` | **RETRIEVE** — dimension-targeted, expert-led (suppress surface) | retrieval |
| `mechanics`, `application` | **GENERATE** — the transferable fuel (NOT the example) | synthesis + L5 |
| `workedExample.usage:do-not-mimic`, `antiTemplate`, `reuse` (verbatim vs reExpress) | **ORIGINALITY** — fresh, tailored, non-regurgitated | generation-time guards |
| `claim` + `sources` | **TRUST** — verified facts quoted exactly | grounding |
| (editorial eval + 2-D gate) | **MEASURE** — ship only what lifts | gate |

The KB wasn't built generically and then forced to fit — it was built *for* this pipeline. That's why integration can be efficient.

## The loop: RECOGNIZE → RETRIEVE → GENERATE → MEASURE

```
RECOGNIZE  L3.5 reads each paragraph/essay and, using entries' detectionSignal/failureModes as the
           diagnostic vocabulary, emits per-unit signals across the ~18 craft axes + facts/positioning:
           {dimension, status: present-strong | present-weak | botched | ABSENT-but-available, intent}.
           "ABSENT-but-available" is the key recognition: an opportunity to deploy a technique the essay
           ISN'T using (this is how the system offers the *plethora*, not just fixes what's broken).

RETRIEVE   For each weak/absent signal, dimension-targeted retrieval over the KB catalog returns the
           matching entries, EXPERT-FIRST (surfaceVsExpert='expert' ranked above 'surface'; surface
           suppressed — we never coach what a base model volunteers). Returns MULTIPLE options per gap
           = the selectable palette. Reuses claudeRetrieval's cached catalog (no RAG, no new provider).

GENERATE   Two altitudes, coordinated:
           • SYNTHESIS (executive brief, enabled+rendered): KB fed as in-context REASONING SCAFFOLD
             (mechanics only, moves NEVER named to the student); the brief is the move-COORDINATOR —
             it sequences the work (a new ordering/dependency slot: "fix P2's stakes before P4's
             reflection") and picks which few techniques matter to the whole-essay strategy.
           • PER-SPAN (L5): applies the chosen technique to the specific span, generating fresh prose
             from `mechanics` (never the worked example — do-not-mimic), governed by `antiTemplate` +
             the close-register variance gate + restraint/deletion pass; facts quoted via verbatimReuseOK,
             framing re-expressed per reExpressPerUser.

MEASURE    Every change gates on the editorial eval (treatment vs baseline vs admit-bar, cross-family
           judges) + the 2-D generative gate (HELPFUL ∧ ORIGINAL) + the variance gate. Ship per-axis
           only when it lifts. This is what makes it "optimal" — no unproven wiring.
```

## What makes generation BETTER (the quality mechanisms, concretely)

1. **Expert-not-surface, enforced by retrieval.** `surfaceVsExpert` suppresses the ~40-50% of moves a base model already volunteers and leads with the non-obvious (restraint/rhythm/subtext) → the student gets craft they could NOT get from prompting. (Also cheaper: no generation spent on the obvious.)
2. **The right altitude (the prior frame verdict).** Knowledge feeds the SYNTHESIS layer where strategy + dot-connecting happen — not just per-span. The sequencing/dependency slot lets the system do the one thing retrieval alone can't: cross-paragraph coordination, the signature of expert judgment.
3. **Originality by construction.** do-not-mimic + antiTemplate (deep-structure) + the close-register variance gate + verbatim-vs-reExpress → fresh, tailored prose, never reskinned examples (proven: 0.00 lexical overlap; variance gate clears the template).
4. **Restraint/deletion pass.** The #1 admit-gap: a final pass cuts the explanatory sentence, ends on the image/consequence — the move the base model never volunteers.
5. **Verified confidence.** Facts are quoted from verified sources (the eval showed confident-correct >> hedged; confident-wrong backfires — so verification is the moat).

## What makes the system RECOGNIZE + UTILIZE the countless strategies (the palette mechanics)

1. **Expand `MoveDimension` 8 → ~18** (+ `surfaceVsExpert` flag) and re-tag — so the expert craft on rhythm/restraint/subtext/tone/etc. becomes *retrievable by the axis that carries it* (today it's invisible to the router). **Single highest-leverage structural change** — most expert moves already exist, just unfindable.
2. **"ABSENT-but-available" recognition.** Diagnosis surfaces not just weaknesses but *unused opportunities* across all 18 axes — the mechanism by which the system offers a plethora of selectable upgrades, not a fix-list.
3. **Multiple options per gap.** Retrieval returns several techniques per dimension; the brief selects/sequences; the student gets choices, in their own essay's terms.

## Efficient build order (lift-per-effort; each gated by MEASURE)

**Tier 0 — the gate (build FIRST, measurement-first).** Editorial eval harness (treatment/baseline/admit-bar, cross-family judges, 2-D + variance gates) targeting `essayIntelligence`. Nothing downstream is provable without it. Reuse `tests/calibration/` loaders + the human `top-tier-reference/` gold.

**Tier 1 — connect the KB + turn the lights on (cheap, high lift).**
- KB → generated catalog band(s) loaded by `claudeRetrieval` (mirror the existing generated-catalog pattern). Keyed by subtopic/dimension + surfaceVsExpert.
- Fix the master-flag bug (`corpusRetrievalBlocks.ts:265` → per-layer resolver) + enable L3.5/L5.
- Dimension-targeted recognition+retrieval (extend `DimensionTarget` to the craft axes; expert-first).
- → Prove first lift on the eval. This alone connects 44 entries to generation.

**Tier 2 — the altitude + palette (higher ceiling).**
- Enable + RENDER the executive brief; feed KB as in-context reasoning scaffold (moves never named); add the sequencing/dependency slot; make the brief the move-coordinator.
- Expand `MoveDimension` 8→18 + `surfaceVsExpert`; re-tag the 190 corpus moves → expert craft retrievable.
- Route the student-facing manifest through dimension-targeted retrieval (kill the keyword table).

**Tier 3 — runtime originality + ongoing depth.**
- antiTemplate + close-register variance gate + restraint pass as generation-time guards (with the deterministic overlap check, the build-time analog of `ensureNoCopying`).
- Keep deepening craft axes (subtext → tone-modulation → diction → …) to verified depth — each shipped only when it lifts the eval.

**Critical path to first measurable lift: Tier 0 → Tier 1.** Tiers 2–3 raise the ceiling.

## Non-goals / risks (carried from the critique)
- **Don't merge the two annotation pipelines** (essayIntelligence vs `src/pipeline/annotationPipeline`) — bring content over, not architecture.
- **Never surface worked examples or name moves to the student** (do-not-mimic; the brief uses them as silent scaffold).
- **Don't ship unproven** — the eval gate is non-negotiable; "won by copying" or "no lift over baseline" = fail.
- **Don't re-introduce generic craft** — surfaceVsExpert suppression is load-bearing.
- **RAG stays off the critical path** — the cached in-context catalog suffices at this scale.

## Open questions (resolve during impl)
- **O-1:** KB store form — generated TS catalog band (like `reviewPassages.generated.ts`) vs a small data module. Default: generated band, regenerated from `docs/knowledge-base/` entries.
- **O-2:** Recognition cost — does adding ~18-axis diagnosis to L3.5 fit one call (+output tokens) or need a dedicated craft-diagnosis pass? Measure tokens; prefer extending the existing call.
- **O-3:** The sequencing/dependency slot's exact shape on `executiveBrief` output + how the manifest renders a *coordinated plan* vs a flat list.
- **O-4:** Re-tagging 190 corpus moves to 18 dims — LLM-assisted one-time pass, human-spot-checked (cost ~trivial, off per-essay budget).
