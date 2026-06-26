# Essays Domain — Taxonomy, Gap Map & Work-List

> Cycle-0 MAP for the Essays domain. Current-state grounded in prior codebase audits;
> gaps + priorities drive the GATHER work-list. Updated each cycle (see Cycle Log).

## Current state (what we already have — and its problems)

| Asset | What it is | Verification/recency status |
|-------|-----------|------------------------------|
| `docs/research/` (116 files) | AO **evaluation** knowledge (how readers rate). Rich on character/holistic-review. | Cites "Perplexity Deep Research (Jan 2026)" for headline stats → **synthetic-as-primary, NOT verified**. Mostly undated. Evaluation, not revision craft. |
| Corpus `topTierCraftMoves.ts` (190 moves) | Craft moves on **8 surface-craft axes** (voice/structure/specificity/…). | From 14 essays, 2 schools, undated as field-knowledge. No coverage of reflection/meaning, intellectual-vitality, ethics. |
| Registry strategies/patterns (5+10) | Genuinely advisor-grade craft (in-medias-res, extended-metaphor…). | Tiny; structural-style only; unsourced as field claims. |
| PIQ `teachingExamples.ts` (21) | Weak→strong pairs. | **Synthetic/hand-authored**, not real, not sourced. |
| `top-tier-reference/` (14 essays + human reviews) | Real admit essays + human close-readings + tiered ratings. | Real human ground truth — but 2 schools, all admits, evaluation-not-revision. |

**Net:** we have lots of *evaluation* knowledge (some unverified/synthetic) and *surface-craft*
knowledge, but almost no **verified, dated, applicable revision craft** for the high-weight
dimensions, and **nothing current** on the post-2023 landscape that reshaped essays.

## Taxonomy (subtopics) + gap & priority

Priority = (change-since-2020 × stakes × current-gap). P0 = do first.

| # | Subtopic | Gap | Priority |
|---|----------|-----|----------|
| E1 | **Post-SFFA identity & "diversity" in essays** (how students may discuss race/identity post-Jun-2023; the ruling's "experience" carve-out; how schools rewrote prompts) | Near-zero verified; HIGH change/stakes; tons of stale pre-2023 advice online | **P0** |
| E2 | **AI in essays** — school policies, acceptable use, detection, disclosure norms (2023–2026) | Near-zero; HIGH change; fast-moving | **P0** |
| E3 | **Reflection / meaning-making craft** — verified, applicable revision moves from named experts/books (the prior loop's biggest empty dimension) | Near-zero *verified applicable* craft; high stakes | **P0** |
| E4 | **Current supplemental-essay expectations** at top schools — "Why Us / Why Major / community / intellectual curiosity" (2024–2026 prompts + what AOs say) | Thin/stale | **P1** |
| E5 | **UC PIQ** — current reader guidance, what UC values (test-blind context) | Thin | **P1** |
| E6 | **Common App essay** — current prompts, the "additional info"/community-disruptions field, length/format norms (2024–2026) | Thin | **P1** |
| E7 | **Overdone / instant-reject topics & how they've evolved** (2020–2026) | Have (unverified, undated); needs recency + sourcing | **P2** |
| E8 | **The 30-second read** — what AOs actually do first, reader workload, what survives a tired 11pm read | Have (evaluation); needs sourcing | **P2** |
| E9 | **Voice / originality / "irreplaceability" craft** — verified applicable moves | Partial (corpus); needs sourcing + recency | **P2** |
| E10 | **Authenticity vs performance; "trauma essay" ethics; vulnerability calibration** (named-expert guidance) | Thin | **P2** |

## Cycle 1 batch (P0 + one P1 to exercise breadth)

E1 (post-SFFA identity), E2 (AI in essays), E3 (reflection/meaning-making craft), E4 (current
supplement expectations). Rationale: the two highest-change/highest-stakes policy subtopics
(E1, E2) stress the verification + recency spine hardest; E3 attacks the prior loop's biggest
*applicability* gap; E4 exercises school-specific breadth. Each → GATHER (strict-source,
recency-prioritized) → adversarial VERIFY → APPLY (schema entries) → CONNECT.

## Cycle Log

- **Cycle 0 (2026-06-18):** Scaffolding + this MAP. Work-list set. No entries yet.
- **Cycle 1 GATHER — E4 supplement-expectations (2026-06-18):** 8 entries written
  (`essays-supplement-expectations-001..008`). Schools: Yale (Why Yale + academic-topic),
  Stanford (intellectual vitality + distinctive contribution), MIT (field-of-study +
  collaboration/community), UMich (Why-this-College + community, via entry 006). Plus 3
  cross-cutting craft/landscape entries: Why-Us copy-paste failure (006), Why-Major =
  engagement-not-resume (007), post-SFFA community/identity supplement surge (008).
  All VERIFIED. Prompt-specific entries (001-005) are `volatile` (re-verify each Aug);
  craft/landscape entries (006-008) `semi-stable`. Cross-links proposed to
  `essays-postsffa-identity-001` (not yet created).
- **Cycle 1 GATHER — E1 post-SFFA identity (2026-06-18):** 7 entries written
  (`essays-post-sffa-identity-001..007`), all `VERIFIED`. Coverage: ruling carve-out (001) +
  anti-circumvention bound (002); institutional prompt response 2023-24 incl. named-school text
  + Sonja Starr counts (003); expert craft gate — specific experience vs category (004); AO
  guardrails / data-redaction reality (005); no-forced-trauma ethics + empirical no-surge (006);
  unchanged Common App prompts → framing burden on writer (007). Sources: SCOTUS opinion (via
  Stanford Law + McGuireWoods reproductions — supremecourt.gov PDF 403'd the fetcher), Harvard
  official FAQ, Sonja Starr (Indiana Law Journal), Inside Higher Ed (×3), College Essay Guy,
  NAACP LDF. NOTE: actual entry ids use `post-sffa-identity` (matches this MAP's subtopic name);
  E4's cross-links point to `essays-postsffa-identity-001` (no hyphen) — id convention needs
  reconciling next cycle. Could not fetch primary supremecourt.gov PDF (403); quotes verified via
  ≥2 independent reproductions. 2026-27 supplement wording is volatile — re-verify next cycle.

- **Craft-breadth P0 — RESTRAINT/understatement (2026-06-18):** 6 entries written
  (`essays-restraint-001..006`), all `VERIFIED`, `freshnessClass: stable`, every entry tagged
  `surfaceVsExpert: "expert"`. Builds the #1 craft-breadth gap from the cycle-1d Harvard-craft
  benchmark (LLMs over-explain; admits drop an image and walk away). Six named expert moves:
  001 name-central-fact-once-then-orbit-via-effects (Hemingway omission + Sarika wheelchair-named-
  once); 002 reveal-through-consequence (Sarika "ran over my friends' toes" + Palahniuk); 003
  embodied-not-named emotion (Palahniuk Thought Verbs + Marcus "slumped against the wall" vs
  Francisco "I felt honored" failure); 004 end-on-image-delete-the-explanatory-sentence — the
  headline P0 (Sawyer/CEG + CollegeVine + Bauld + Francisco abstract-gain-list failure + cycle-1d
  benchmark); 005 the calibrated "almost" that refuses tidy closure (Michael "almost gotten used
  to" + cycle-1d at-bar Ramadan unresolved close + Quad/CEG); 006 single-explicit-bridge / subtext
  (Hemingway "Hills Like White Elephants" + Francisco double-connotation "ambulance" + Sawyer
  show-then-tell). SOURCE SELECTION: kept Hemingway (Tier-2 primary craft text), Palahniuk
  LitReactor (Tier-2), Sawyer/CEG (Tier-2), CollegeVine + Quad (Tier-2 firms), Bauld (named
  ex-Brown/Columbia AO, Tier-2). DROPPED College MatchPoint unresolved-ending article (no named
  author/credentials -> Tier-3 by source bar; context only, not a verifier). Bauld book PDF was
  binary-unreadable via fetcher; his cliche-of-the-lesson teaching confirmed via book summary +
  author site + on-record AO role. CRAFT-MISSING INVENTORY: every move sourced to >=1 named
  authority + >=1 admit instance; the personal-statement-specific application of Hemingway's
  omission to the central-fact (001) and the "one-bridge-maximum" over-bridging failure (006) are
  corpus-derived, flagged for a named-college-practitioner cross-source next cycle. Next P0 craft
  axes: rhythm/sentence-music, subtext/complexity, tone-modulation (per `_craft-taxonomy.md`).

- **Craft-breadth P0 — RHYTHM/sentence-music (2026-06-19):** 7 entries written
  (`essays-rhythm-001..007`), all `VERIFIED`, `freshnessClass: stable`, every entry
  `surfaceVsExpert: "expert"`. Second-densest craft axis in the admit reviews, near-zero in KB.
  Seven non-obvious expert moves (deliberately NOT "vary sentence length" — that's the surface
  baseline): 001 meter-content congruence (Sarika waltz opener "DAIN-ty/PINK/MOUSE" + Le Guin
  read-aloud/"mind's ear"); 002 calibrated beat-drop ON the cognitive pivot, with the long-runway
  precondition (Francisco "I realized something was not right." + Le Guin pace/choppy-fault);
  003 parataxis vs hypotaxis chosen for cognitive effect + structural switching (Daniella "I whisk,
  I sift, I stir" + Fish subordinating/additive + Hale "and"-cadence); 004 fragment-progression
  time-compression (Billy "Halfway there, two-thirds, three quarters." + Tufte short-sentences/
  fragments); 005 sound-count↔list-length matching/onomatopoeic patterning (Michelle "Swipe, swipe,
  swipe" + Sarika "tap tap tapping"→3 list items + Le Guin sound-as-rhythm); 006 chiasmus for
  reversal, EARNED not decorative (Michelle "biology helped me understand, art helped me be
  understood" + Tufte parallelism + Fish balanced form); 007 dense/plain alternation + cadenced
  close at the paragraph level (Sarika dense→plain + "I, too, can dance" cadence + Le Guin "not
  three long / not three short" + Hale cadence). SOURCE SELECTION: KEPT Le Guin *Steering the Craft*
  (Tier-2, the strongest sound/rhythm authority — explicit read-aloud method + pacing rules, used in
  5 of 7 entries), Stanley Fish *How to Write a Sentence* (Tier-2, the only named source giving the
  parataxis/hypotaxis COGNITIVE-EFFECT distinction; corroborated ×2 independent reviews to clear the
  Tier-2 bar), Tufte *Artful Sentences* (Tier-2, syntax-creates-rhythm; short-sentence + parallelism
  chapters), Hale *Sin and Syntax* (Tier-2, cadence/"and"-music). REJECTED Gary Provost's "This
  sentence has five words…" length-variation passage as the BAR — it is the canonical SURFACE move
  (duration-variation, no beat-content congruence); referenced only in 001/002 provenance to mark
  the floor the entries exceed. CRAFT-MISSING INVENTORY: (a) all 7 moves are anchored to ≥1 admit
  instance (raw-text-verified) AND ≥1 named authority. (b) Hale and Tufte quotes are from publisher/
  reference pages + reviews, not the books' interiors (fetcher can't open the books); their craft
  claims are corroborated but the verbatim phrasings should be cross-checked against the texts next
  cycle. (c) The "earned chiasmus vs fortune-cookie" placement rule (006) and the "beat-drop must
  land on the TURN, not a side-detail" precision (002) are reasoned from the admit instances +
  restraint-004, not a single named source stating them as such — flagged as corpus/synthesis-
  derived for a named cross-source. (d) The scansion in 001 (stress marks) is the review's, verified
  present in the raw opener but is one analyst's ear; a second prosodic reading would strengthen it.
