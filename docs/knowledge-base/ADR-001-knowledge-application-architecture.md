# ADR-001 — Knowledge-Application Architecture (how the KB reaches generation)

**Status:** ACCEPTED (owner-confirmed by Tue 2026-06-26; proposed 2026-06-25). INTEGRATION_BLUEPRINT Items 3/4/6/8/9 revised per this ADR on 2026-06-26 (see each Item's "REVISED per ADR-001" note).
**Supersedes:** the deterministic dimension-filter selection in INTEGRATION_BLUEPRINT Items 3/4 as *the relevance mechanism*. Both arms remain A/B-measurable on the 3 built axes through the editorial eval gate — acceptance commits the build to the curation arm; the eval, not this ADR, retires the filter arm.

## Question
How should verified craft knowledge reach the generation system and get APPLIED, such that it is
(a) usable ANYWHERE relevant (not siloed to where a tag matches), (b) LOW-NOISE (surgical — the few things
that matter, never scattered), and (c) applied with INTELLIGENCE (the system notices WHERE in the essay a
principle applies and applies it freshly). A $0 design study (3 parallel grounded audits) was run before
building, because this is an architecture decision, not an implementation detail.

## Study findings (3 angles, convergent)
**Empirical / noise (grounded, quantified):** the live corpus channel is noisy + siloed + currently inert.
The cached catalog is **~16.6K tokens** (190 moves; the code comment's "6–7K" is a 2.4× self-misreport);
the ranker attends all 190 moves to surface 3 (**63:1 dilution**, →78:1 with the KB added); the generator
only ever sees a **3-move, mechanism-only surface** — the richest fields (`excerpt`, `detectionSignal`,
`universalApplication`) reach no generator. Adding the KB to this channel "makes the haystack bigger to find
the same 3 needles." Per-paragraph anti-pattern retrieval is an N× fan-out into a non-cached block.

**First-principles + adversarial:** the ideal (from counselor cognition) = internalized repertoire surfaced
*associatively*, relevance judged at **whole-essay** altitude, **few selected by judgment** (not
match-then-trim), availability ≠ surfacing, altitude chosen per-intervention. Stressed both candidates: the
**dimension-filter fails on siloing** (the F-1 vocabulary-join class is intrinsic to it), **mechanical
application** (a `.filter()` over a closed `MoveDimension` enum owns the most contextual judgment in the
system — violates LLM-first rules 1 & 3), and **cross-paragraph blindness** (per-paragraph diagnosis can't
see absence or whole-essay patterns). The curation approach's only weaknesses: cost (~$0.01–0.02/essay,
negligible) and noise-if-prompt-weak (fixable at the prompt + eval layer).

**Design (buildable):** hold the whole KB as a cached **principle-digest** block in the already-cached,
already-whole-essay L3.75 synthesis call (a new "Phase C"); the model NOTICES where principles apply
(whole-essay, once — not per-paragraph), CURATES to 2–3 by whole-essay impact with justified cuts, and
PLACES by altitude (whole-essay/cross-paragraph → Executive Brief; paragraph/sentence → L5 via the existing
`corpusContext` seam). ~$0.05–0.10/essay; reuses existing infra; no new vocabulary join.

## Decision
**Adopt broad-availability + one whole-essay LLM-judged curation pass.** Demote determinism to bookkeeping:
the `surfaceVsExpert` **availability gate** (a surface move literally can't be selected — legitimate, not a
relevance judgment) + provenance/ID isolation (ordinal remap; `digestRef` never rendered). The LLM owns
relevance, selection, and placement.

### The 3 commitments that matter most
1. **One whole-essay LLM pass owns relevance + selection + altitude.** Never let `Array.filter(dimensions.includes())`
   decide what applies. A pre-narrowing filter MAY exist for cost at scale, but it must hand a **generous,
   recall-biased pool** to the LLM; if it ever returns a small set that becomes the answer, the silo is back.
2. **Per-paragraph `craftDiagnostics` are DESCRIPTIVE LEADS, not a closed-enum selection key.** Keep cheap
   local detection; feed it to the whole-essay pass as leads (soft tag + free text), which is free to surface
   a principle the per-paragraph pass never tagged. This **dissolves the DIM_MAP/SUBTOPIC_MAP/F-1 join class
   of bugs entirely** — there is no join to break.
3. **Concentrate selection + cross-paragraph + absent-but-available at the whole-essay (brief) altitude** —
   the only layer with full sight. The brief is the single curator, not a bolt-on.

### The one real risk (must be measured, not assumed)
Bounded noise stops being a structural guarantee (the filter's `slice(0,2)`) and becomes a model judgment.
Mitigation: the curation forcing-function ("justify every cut"); an eval-gate **"≤3 applications surfaced"**
assertion; the A_C anti-commoditization check. **Measurable today:** A/B this design's Phase-C arm vs the
blueprint's `selectMovesForDiagnostics` arm through the EDITORIAL_EVAL_GATE on the 3 built axes; let A_C +
the ≤3 assertion + B2 advisory-lift decide. Neither arm ships un-measured — this one especially, because its
strength and its risk are the same mechanism.

## What this changes in INTEGRATION_BLUEPRINT (revise before building)
- **Item 3 (craftDiagnostics):** keep, but reframe output as descriptive leads; `dimension` becomes a soft
  tag + free text (OpenEnum), NOT a closed-enum routing key.
- **Item 4 (selectMovesForDiagnostics):** demoted — no longer the selector. Becomes (at most) a recall-biased
  pre-narrowing aid + the `surfaceVsExpert` availability gate. The relevance decision moves to the whole-essay pass.
- **Item 6 (brief):** elevated — the single curator: selection, cross-paragraph, absent-but-available, altitude.
- **Item 9 (compile):** still compile KB → a representation, but as **principle digests** (claim+mechanics+
  failureModes, re-expressed fluently), not catalog rows. DIM_MAP/SUBTOPIC_MAP and the F-1 join are **no longer
  load-bearing** (kept only if a pre-narrowing aid is built at scale). `workedExample` still NEVER hydrated.
- **Item 8 (eval):** unchanged as the originality boundary; ADD the ≤3-surfaced assertion + wire A_C.
- **Empirical fixes regardless of arm:** the master-flag bug (already fixed via STAGE_RESOLVER), the catalog
  16.6K self-misreport comment, and the thin 3-move generation surface (feed the teachable fields internally).

## How the decision satisfies the 3 requirements
| Requirement | Satisfied by |
|-------------|--------------|
| Any knowledge anywhere (no siloing) | Whole KB available to a whole-essay pass; no tag-gate; F-1 join class deleted |
| Low noise (surgical) | Impact-ranked curation to 2–3 with justified cuts + eval ≤3 assertion + A_C |
| Smart when/where | One whole-essay LLM pass owns relevance + placement + altitude (counselor-cognition match) |

## Scaling note
At 44 entries the digest block is ~7K cached tokens (free). Past ~150 entries (~the ~18-axis vision), add a
**soft semantic shortlist** (Haiku, over the holistic profile) to bound tokens — a recall aid, NOT a
per-paragraph tag-gate, so universality + judgment are preserved. Not needed at current scale; ship without it.
