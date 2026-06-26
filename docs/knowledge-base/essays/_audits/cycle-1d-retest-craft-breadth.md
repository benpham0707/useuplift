# Cycle 1d — Anti-Template Retest, Harvard-Craft Benchmark, Craft-Breadth Audit

## 1. Anti-template fix — SURFACE cleared, DEEP-STRUCTURE template survives

Applied `antiTemplate` directive + `workedExample.usage` (do-not-mimic) to all 8 craft entries + `reuse` (verbatim-vs-re-express) to the fact entry. Re-generated on Sonnet, 5 diverse passages in 5 deliberately-different rhetorical forms.

- **Deterministic (objective): cleared.** Cross-rewrite 4-gram Jaccard = 0.0000 (all 10 pairs); vs worked-example = 0.0000; signature-phrase scan ("used to think / realized the opposite / I'm still learning") = clean on all 5.
- **Structural (judge): PARTIALLY cleared.** Surface forms genuinely vary, but a subtler DEEP-STRUCTURE template survived: all 5 run the same *cognitive choreography* — anti-obvious opener → one concrete micro-observation → pivot to a **metacognitive** capacity → **transfer to a second domain in the final sentence**. The old arc was paraphrased into the substrate, not removed. 4 of 5 closers are structurally "I now [do X thinking-habit] [in domain Y]."
- **The escapee:** R2 (Ramadan) — it refuses the transfer-resolution and ends unresolved ("I've stopped trying to explain it neatly"), which is exactly why it reads most human.
- **Fix (next iteration):** vary the **insight register** (not always a portable thinking-habit — allow relational, moral, sensory, deliberately-unresolved endings) and make **transfer optional** (sometimes no second-domain landing). The anti-template directive must target the *substrate choreography*, not just surface phrasing.

## 2. Harvard-craft benchmark — 1/5 at-bar, 4/5 near-bar (craft floor high, restraint gap consistent)

Judged the 5 rewrites' prose craft against real admit essays (Francisco, Clara/crochet, Lauren) + their human reviews. Scope-fair: single-paragraph rewrites judged on craft quality, not whole-essay completeness.

- **At-bar: R2 (Ramadan)** — the self-interrupting aside ("a sentence I would never write except that it happened"), unusual working diction ("strange and angular"), and the restrained non-resolution clear the bar; a line could sit in an admit essay.
- **Near-bar: R1, R3, R4, R5** — strong floor (hard numbers, beat-drop pacing, anticlimax, voice-asides, domain-insider specificity — the replicable corpus moves transferred), but each falls a half-step short the same way.
- **The consistent gap = RESTRAINT at the close.** 4 of 5 *explain their own insight* in the final sentence; the admits drop an image (Francisco's "ambulance on my chest"), a memory-anchor (Clara's Agnes), or an earned counterintuitive claim and walk away. The needed skill is **deletion** — knowing when to stop talking. (Ties to the counselor-gap memory: "converting analytical depth into editorial action"; cut-list/deletion-confidence.)
- Other admit-only craft missing: a **memory-anchor** (one over-specified unforgettable concrete rendered as a thing/person), **double-payload diction** (vehicle carries a second theme-aligned connotation), and **subtext** (imply, don't state).

## 3. Craft-breadth audit — we are NOT yet at "a plethora"; it's a promotion+deepening problem

The 14 human admit-essay reviews name **~200 distinct craft moves across ~21 dimensions.** Our system:
- tags moves on only **8 dimensions** (voice/structure/specificity/emotion/argument/opening/closing/metaphor) → the expert craft on **tone-modulation, rhythm, syntax, diction, pacing, dialogue, humor, restraint, motif, juxtaposition, subtext, typography** is *under-indexed* (filed under voice/structure, not retrievable by the axis that carries it);
- is **~40–50% surface-adjacent** (moves a base model already volunteers: "open with a scene," "add a detail," "use a metaphor," "circle back");
- has **verified KB depth in exactly ONE craft subtopic** (reflection, 8 entries); every expert axis has **zero**.

**The "plethora" is mostly promotion + deepening of the expert layer, not from-scratch** — the reviews already name the moves; the work is (a) expose them, (b) flag surface-vs-expert, (c) build verified KB depth on the empty expert axes.

### Prioritized craft work-list (value-over-base-model × top-essay-usage)
- **P0:** RESTRAINT/understatement (highest value — LLMs over-explain; confirmed the #1 gap by the Harvard benchmark), RHYTHM/sentence-music, COMPLEXITY/subtext/irony, TONE/register-modulation.
- **P1:** DICTION/word-precision (most-named in reviews, thinnest in KB), SYNTAX-as-craft, PACING/time-control, MOTIF/recurrence, JUXTAPOSITION, HUMOR/wit.
- **P2:** de-surface the rich-but-shallow axes (specificity, opening, closing, structure) — tag surface vs expert so coaching *skips* the base-model-obvious and leads with the non-obvious; rebalance imagery from "extended metaphor" toward metaphor-literalization/recursive/verb-possession.
- **Structural:** expand `MoveDimension` 8 → ~18 axes + re-tag the 190 moves (single highest-leverage change — most expert moves already exist, just invisible to retrieval); add a `surfaceVsExpert` flag so the system suppresses what the base LLM already volunteers.

## Convergent conclusion
The reflection move is SOLVED (executes cleanly, now varies surface form, generates fresh tailored prose). The remaining gap to genuine top-essay craft AND to "a plethora of sophisticated choices" is the SAME gap: the **expert craft layer** — restraint first, then rhythm/subtext/tone/diction — which is under-indexed in the corpus and has zero verified KB depth. The highest-leverage next moves: (1) build a verified RESTRAINT subtopic + a "deletion/know-when-to-stop" discipline; (2) expand the dimension schema 8→18 + surface/expert flag so the existing expert moves become retrievable; (3) deep-build the P0 expert axes to the reflection subtopic's standard. The deep-structure anti-template iteration (vary insight register + transfer-optionality) rides along.
