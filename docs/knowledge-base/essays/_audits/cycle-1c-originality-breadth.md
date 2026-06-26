# Cycle 1c — Deep Audit: Helpfulness, Breadth, Originality (anti-regurgitation)

> Triggered by the directive: the knowledge must let the system create FRESH, ORIGINAL, tailored
> versions — not regurgitate variations of the studied examples. Three measurement methods: an
> adversarial re-verification of the prior (cycle-1b) finding; deterministic lexical-overlap
> (objective, no judge); and an independent qualitative analyst (helpfulness + structural template +
> tailoring). Corpus generated on **Sonnet** (production tier), entries 004 (craft) + 001 (fact),
> each applied to 3 diverse fresh essays.

## A. The prior (cycle-1b) finding was OVER-STATED — corrected

Adversarial re-verification found the "prune generic craft" correction rested on confounds:
- **Model confound (fatal):** cycle-1b ran on **Opus** (craft-saturated); production generates on
  **Sonnet/Haiku**. The finding's own "saturation" logic predicts weaker models WOULD benefit from
  craft. → The craft-no-lift result was likely an Opus-ceiling artifact.
- **No power:** N=4, 1/4 vs 3/4 ≈ coin-flip (~31%).
- **Unattributed:** the one clear craft loss (P3 re-bow) conflates "bad entry" with "generator
  applied a good entry badly."
- **Wrong instrument:** cycle-1b measured "more expert," never originality — and "more specific" and
  "regurgitated" are positively correlated, so that gate *rewards* the regurgitation failure mode.

**Correction:** the "prune craft entries" decision (cycle-1b correction #2) is **REVERSED/on-hold**.
This cycle's Sonnet re-test supports the reversal — see B.

## B. Helpfulness (on Sonnet, production tier) — caveated

Treatment beat baseline on all 6 cases (CRAFT 1 slight, CRAFT 2 clear, CRAFT 3 slight, FACT 1/2/3
clear). **Caveat: blinding was compromised** (the generator left the A/B key in the corpus header),
so treat the *margin* cautiously; the *direction* is corroborated by the analyst's content-level
reasoning. Key reads:
- **CRAFT entries DO help on Sonnet** (3/3 craft treatment wins, 2 slight) — contradicting cycle-1b's
  Opus craft-1/4. Confirms the model confound: craft knowledge adds value to the model that actually
  generates in production. The 2 slight craft wins were partly scaffolding-density, not pure content.
- **FACT entries help most and cleanly** (3/3 clear, content-driven): they supply the exact legal
  hinge that resolves the student's stated confusion — information the base model can't reconstruct.

## C. Originality / anti-regurgitation — the core question

- **Lexical (deterministic, objective):** treatment vs the entry's worked example = **4-gram Jaccard
  0.0000 on all pairs**; longest shared run 8–11 chars (trivial). The 3 craft treatments are also
  lexically distinct from each other (cross-Jaccard ≈0). → **No phrase-level regurgitation. The system
  generates fresh prose; it does not recombine the studied example.**
- **Content/tailoring:** each output is grounded in the student's OWN material (mole/grinding-stone;
  game player-constraints; Marcus's specific non-complaint; Creole register-switching). Fresh, not
  reskinned. Most tailored: coding & Creole; least: Indian/engineering (cultural specifics thin).
- **Structural (the one real risk):** the 3 CRAFT rewrites share a rhetorical skeleton — *"I used to
  think X → I realized the opposite/backward → [standalone aphorism] → transfer to another domain →
  I'm still learning."* The **transfer beat IS the technique** (good, intended). The *"used-to-think /
  opposite / I'm-still-learning" packaging + obligatory aphorism* is NOT part of the technique and
  would read as formulaic across many users. Partly inherited from the worked example's own structure.
  → Template-risk: **MODERATE-HIGH on craft**, low/appropriate on fact.
- **Fact-specific:** (a) the entry's own Mexican/folklorico example was NOT leaked — clean; (b) the
  verbatim **SFFA ruling quote was reused — CORRECT** (you want the real legal text, not a paraphrase);
  (c) BUT the entry's "identity is the soil, character is the fruit" **metaphor was passed through
  near-verbatim** in treatments — mild regurgitation (the baseline's paraphrase "identity is context,
  character is the deliverable" was the healthier behavior).

## D. Corrections adopted

1. **G2 becomes a 2-D gate: helpful AND original.** An entry passes only if it (i) lifts generation
   AND (ii) produces output below a lexical-overlap ceiling vs its own worked example/source, passes a
   structural-template check, and is tailored to the user. **"Won by copying" = FAIL.** (See README.)
2. **Reverse "prune craft."** Craft entries help the production model; KEEP them — but hold them to the
   originality + anti-template bar.
3. **Schema: tag worked examples as private + add an anti-template directive.** A worked example is a
   teaching aid for the system's own understanding/validation — **do-not-surface, do-not-mimic**. Each
   entry distinguishes **verbatim-reuse content** (verified quotes/facts — reproduce exactly) from
   **illustrative framing** (metaphors, example prose, rhetorical packaging — re-express freshly per
   user, never copy). Craft entries carry an explicit instruction: the MOVE is mandatory; the *framing
   sentences must vary* (rotate forms; ban the default "used-to-think → opposite → I'm-still-learning"
   arc + obligatory aphorism).
4. **Mirror the codebase's anti-copy discipline** (`ragService.ensureNoCopying` 8+word→principle): the
   2-D gate's overlap check is the KB-build-time analog.
5. **Fix the test harness:** never put the blind key in the judged file (this round's leak). Future
   helpfulness A/B uses ≥2 cross-family judges + position-swap (per the re-verification's Axis 5).

## E. Net answer to the directive

The entries DO help generation (clearly on facts; yes on craft for the production model). Breadth is
real — one technique → many distinct, tailored applications. Originality is **strong lexically and in
content** (no regurgitation of the studied examples) with **one fixable structural risk** (an emerging
craft rhetorical template + verbatim metaphor passthrough on facts). The fixes above convert
"original by luck" into "original by gate."
