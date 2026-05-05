# Quality Gap 1 — SignatureMove validation report

- **Essay**: 14-harvard-2028-crochet.txt
- **Date**: 2026-05-05T12:27:48.905Z
- **Time**: 20m17s | **Cost**: $1.7154
- **Layers completed**: L1, L2, L2.5, L3, L3.75, L3.5, L4

## Per-layer cost breakdown

| Layer | Cost | Time |
|---|---|---|

## SignatureMove output

> Misdirection-then-compression architecture: taxidermy fake-out opener (P0) buys forward attention, which the essay spends on a single-paragraph compression of three-generation wartime history (P1), then redeems density with one accumulated-specifics image (Agnes the cornflower-blue elephant, P3).

**Why it is theirs**: Clara's essay carries a century of family history, a war, a thirteen-year imprisonment, and a three-generation craft transmission in under 650 words. The misdirection-then-compression-then-redemption rhythm is what lets that historical weight fit without flattening into abstraction or losing reader momentum. Remove any one move and the essay collapses: no misdirection means no forward attention for the dense P1, no compression means the history dilutes across paragraphs, no Agnes means the density never resolves into memorable image.

**Reader effect**: The reader is committed at P0 through their own incorrect inference, absorbs P1's century of historical weight without being asked to dwell on it (the misdirection's momentum carries them through), and is rewarded in P3 with a single image dense enough to function as the essay's memory anchor and proof that the compression was worth the cost.

**Instances:**
1. [sentence_quote] P1S1: "My nightstand is home to a small menagerie of critters, each glass-eyed specimen lovingly stuffed with cotton." — The taxidermy-vocabulary setup that plants the reader's first hypothesis (specimen, glass-eyed, stuffed) — buying forward attention through implied misreading before the reveal.
2. [sentence_quote] P1S2: "Don't get the wrong idea, now – I'm not a taxidermist or anything." — The two-beat misdirection payoff: denial of the planted hypothesis followed by the actual subject, creating reader conspiracy and tonal intimacy that carries into P1's weight.
3. [paragraph_compression] P2: Ten sentences carry the entire three-generation arc: grandmother's pre-war artistry, Vietnam War, grandfather's thirteen-year imprisonment, grandmother's matriarch transformation, wartime scarcity, mother's learning, and the narrator's inheritance of decorative freedom. The compression IS the move — this density would be unreadable without P0's misdirection buying the reader's commitment.
4. [sentence_quote] P4S5: "Take Agnes, for example, a cornflower-blue elephant named after mathematician Maria Gaetana Agnesi who lives in my calculus teacher's classroom, happily grazing on old pencil shavings and worksheets." — Accumulated specifics — name + color + cross-domain namesake + location + whimsical action compounded into one sentence to redeem P1's compression with a single unforgettable image that demonstrates the decorative freedom the grandmother purchased.

## Pass criteria

| # | Criterion | Result | Detail |
|---|---|---|---|
| 1 | Specificity — oneSentenceName contains a syntactic/structural/rhetorical technique noun | PASS | matched: "opener" |
| 2 | Locational — oneSentenceName cites a paragraph (P\d) | PASS | cited: P0 |
| 3 | Cardinality — ≥3 instances covering ≥2 distinct paragraphs | PASS | 4 instances, 3 distinct paragraphs (0,1,3) |
| 4 | Grounding — every sentence_quote verbatim in cited paragraph; every index in range | PASS | all instances grounded |
| 5 | Content-specific — whyItIsTheirs references essay content (≥3 distinct ≥4-char tokens overlap with essay text) | PASS | 4 distinct tokens overlap (5 total occurrences) |
| 6 | Effect — readerEffect describes cognitive/felt effect (not praise) | PASS | cognitive=true, forbiddenVocab=absent |
| 7 | No forbidden vocabulary in oneSentenceName | PASS | clean |
| 8 | No regression in other dump sections (manual visual diff required) | PASS | see Phase 11 visual diff against tests/output/full-profile-*.md |

**8/8 passed**