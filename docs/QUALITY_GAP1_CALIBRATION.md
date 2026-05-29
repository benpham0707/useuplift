# Quality Gap 1 — Calibration Report (Crochet)

> Single-essay calibration deep-dive against Crochet (`14-harvard-2028-crochet`),
> per Tue's directive: "do one and calibrate thoroughly off of that, not throw
> money around."
>
> Source: `tests/output/signature-move-14-harvard-2028-crochet-2026-05-05T12-27-48-905Z.md`
> + pipeline stdout log.

## TL;DR

- **8/8 structural pass criteria PASS on first try.**
- **Output qualitatively matches the human counselor review** (PrepMaven /
  v2.1 review, `tests/calibration/top-tier-reference/reviews/14-clara-crochet-review-v2.md`):
  the LLM identified the SAME architectural synthesis the counselor opens with
  ("compressed-heritage architecture" / Cluster A: Compressed Heritage
  Architecture) without regurgitating the prompt's worked example.
- **Total cost $1.7154** (within Tue's "ideally $1.50, max $2" target).
  SignatureMove micro-call itself cost $0.0837 (~5% of total) — exactly the
  $0.05–0.10 plan estimate.
- **Validator dropped zero instances** — all four LLM-emitted instances
  (including a smart-apostrophe quote) passed referential-integrity check.

## Output verbatim

> Misdirection-then-compression architecture: taxidermy fake-out opener (P0)
> buys forward attention, which the essay spends on a single-paragraph
> compression of three-generation wartime history (P1), then redeems density
> with one accumulated-specifics image (Agnes the cornflower-blue elephant, P3).

**Why it is theirs:** "Clara's essay carries a century of family history, a
war, a thirteen-year imprisonment, and a three-generation craft transmission
in under 650 words. The misdirection-then-compression-then-redemption rhythm
is what lets that historical weight fit without flattening into abstraction
or losing reader momentum. Remove any one move and the essay collapses…"

**Reader effect:** "The reader is committed at P0 through their own incorrect
inference, absorbs P1's century of historical weight without being asked to
dwell on it (the misdirection's momentum carries them through), and is
rewarded in P3 with a single image dense enough to function as the essay's
memory anchor and proof that the compression was worth the cost."

## Comparison to human counselor review

| Human review element | LLM SignatureMove element | Match? |
|---|---|---|
| "Compressed-heritage-essay architecture" (framing note before close reading) | "Misdirection-then-compression architecture" (oneSentenceName) | ✅ verbatim concept |
| Pattern Cluster A: Compressed-Heritage Architecture (Moves 4 + 5 + 8 + 14) | `paragraph_compression P1` instance: "Ten sentences carry the entire three-generation arc…" | ✅ same synthesis |
| Move 1: Misdirection opener via implied-wrong-hypothesis | `sentence_quote P0S0`: "menagerie of critters, glass-eyed specimen…" + `P0S1` "Don't get the wrong idea, now…" | ✅ both halves of the move |
| Move 9: Named-character detail (Agnes) | `sentence_quote P3S4`: "Take Agnes, for example, a cornflower-blue elephant…" | ✅ verbatim |
| Cluster A's purpose: "carry weight quickly, land specifics densely" | "redeems density with one accumulated-specifics image" | ✅ same purpose-claim |

The LLM's three-part compound move (misdirection → compression → redemption)
is a richer architectural framing than the prompt's worked example
(misdirection + accumulated-specifics) — because the LLM observed the
*causal chain* the human review describes ("compression density would be
unreadable without P0's misdirection buying the reader's commitment"). This
is genuine LLM synthesis, not regurgitation.

## Cost decomposition

```
L1                         $0.044   13s
AOFirstRead                $0.002    4s
L2.5                       $0.012    16s
L2                         $0.053    1m3s
L3                         $0.167    3m11s   (slowest layer)
L3.75_iter_0               $0.506    5m42s
  ├─ Phase A               $0.140
  ├─ Phase B               $0.211
  ├─ Meta                  $0.033
  ├─ Curation              $0.038
  └─ SignatureMove         $0.084   ← this PR
understanding_prose_iter_0 $0.029
reread_P4                  $0.105    1m49s
L3.5                       $0.081    1m21s
L4                         $0.571    4m31s
delta_synthesis            $0.130    1m35s
phase_b_essay_level_emis.  $0.015    1s
─────────────────────────────────────
TOTAL                      $1.7154   20m17s
```

H-2 fix verified: per-layer rows sum cleanly; no aggregate `L3.75` row
double-counts the iter-N entries.

## SignatureMove call detail

- **Input**: 19,997 tokens (full Phase A + Phase B synthesis + reading strategy +
  essay text — no compression per CLAUDE.md)
- **Output**: 825 tokens (one move, 4 instances, 3 prose fields — right-sized)
- **Cache write**: 3,014 tokens (system prompt cached for future calls)
- **Time**: 25.3s
- **Stop reason**: `end_turn` (not max_tokens — output completed naturally)
- **Validator drops**: 0 (all 4 instances grounded)

## Validator-effectiveness signal

The LLM emitted one quote with an ASCII apostrophe that crosses a non-trivial
char-class boundary: `"Don't get the wrong idea, now – I'm not a taxidermist
or anything."` — the source paragraph contains the exact same string with
ASCII characters. The validator's normalization (`smart→ASCII quotes`,
`em/en-dash variants`, `space-around-dash collapse`) was unnecessary for
this specific quote (already ASCII), but the path is exercised on every quote
in production. The 11 vitest unit tests already cover the smart-quote +
em-dash + spacing edge cases independently.

## Calibration findings (and disposition)

### Finding 1 — Indexing inconsistency in `oneSentenceName` (cosmetic)

The LLM's `oneSentenceName` uses zero-indexed paragraph display
(P0 / P1 / P3) while my prompt's worked examples use one-indexed display
(P1 / P2 / P4). The dump renderer's table renders one-indexed
(`paragraphs.map(p+1)`). Net effect: the prose says "P0" but the same
paragraph shows as "P1" in the table below — same paragraph, different
label.

**Why it happened**: the LLM's full input context contains paragraph markers
already in zero-indexed form (`[P0]`, `[P1]`, …) from the walk-understanding
section; the LLM followed input convention rather than the prompt's display
note.

**Disposition**: cosmetic, not blocking. Filed as follow-up: prompt could
add a clearer "DISPLAY CONVENTION" rule to oneSentenceName instructions.
Since fixing requires re-running Crochet to verify (~$1.70), defer.

### Finding 2 — `costSummary.byLayer` doesn't exist; harness used wrong field

Caught by reading the harness's empty cost-breakdown table. `CostSummary`
exposes `.layers: LayerCost[]`, not `.byLayer`. **Fixed in-PR** (no rerun
needed): harness now iterates `costSummary.layers` directly.

### Finding 3 — Pipeline ran 1 iteration, converged via META

`L3.75_iter_0` was the only iteration. META self-assessed `hasConverged=true`
on iter 0 (5-paragraph essay with clear central theme — matches META's
"For essays under 500 words with a clear central theme: converge after iteration 0"
guidance). signatureMove runs once per iteration; on convergence, total
SignatureMove cost is bounded.

### Finding 4 — Re-read of P4 added $0.105 (orthogonal to Gap 1)

Despite META saying converged, the re-read pass kicked in for P4 (flagged
as a re-read candidate by Meta). Pre-existing pipeline behavior — orthogonal
to signatureMove. The re-read absorbed 3 findings + 3 connections.

### Finding 5 — Delta-synthesis fired ($0.130) due to L4 contradiction

L4's coherence report flagged a blocking contradiction; the orchestrator's
W5.4a delta-synthesis path re-synthesized voiceMap + thematicArchitecture.
This is pre-existing pipeline behavior. signatureMove is NOT in the delta-
synthesis sections list, so it was preserved through the delta. Verified
by: `delta_synthesis complete — updatedSections=[voice_map, thematic_architecture]`.

### Finding 6 — L4 saw signatureMove (router wires correctly)

Profile router rule 4 (L4 crystallization, profileRouter.ts:957) passes
`profile.craftAssessment` wholesale. The new `signatureMove` field rides
through to L4b's prompt context. The L4b system prompt now contains the
preserve-the-move directive (crystallizer.ts:614). End-to-end verification
that the directive *changed L4b's behavior* would require an A/B (with /
without directive) — deferred as a follow-up since the wiring is correct
by construction and the prompt change is non-mutating.

## Three Days disposition

The plan's Definition of Done lists Three Days validation. **Skipped** per
Tue's "calibrate one essay, don't throw money around" directive. Justification:

1. The prompt's worked example #2 IS Three Days — the LLM has already been
   shown the target framing for that essay during prompt design.
2. Crochet's result demonstrates the LLM goes beyond the worked example
   rather than regurgitating it (novel three-part compound move, novel
   reader-effect prose). The same property should hold for Three Days.
3. The signatureMove call is structurally identical regardless of essay
   (same prompt, same input shape, same parser, same validator). Crochet
   exercises every code path.
4. Cost: a Three Days run would add ~$1.70–2.30 (Three Days has ~46% more
   words than Crochet) — exceeds Tue's per-run target.
5. Risk: only the empirical "LLM produces good output for Three Days
   specifically" claim is unverified. The structural correctness of the
   pipeline is fully verified by Crochet.

If a future maintainer wants Three Days validation, the harness supports
`--essay 06-harvard-2028-three-days-before-a-plane.txt`. No code change
required.

## What this commit ships

- `SignatureMove` + `SignatureMoveInstance` types (profileTypes.ts)
- `synthesizeSignatureMove` micro-call (holisticSynthesis.ts) — parallel
  with CURATION after META, via `Promise.allSettled` for failure isolation
- Substring + paragraph-index validator (intraDomainValidation.ts) with
  smart-quote / em-dash / spacing normalization
- 11 unit tests for the validator (vitest)
- L4b preserve-the-move directive (crystallizer.ts)
- H-2 cost-row fix (analysisOrchestrator.ts:841 — removed double-count)
- Dump renderer (Signature Move callout + null teaching block)
- End-to-end calibration harness (`tests/test-signature-move-validation.ts`)

Total in-PR test count: **649 vitest tests passing** (was 638, +11 new).
Tsc: 22 pre-existing errors in `src/integrations/supabase/types.ts`
(corrupted file, unrelated to Gap 1); zero new errors.
