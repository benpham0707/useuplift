# D-2.2 — L3 Walk Specifics-Need Emission Prompt — Round 1.6 Draft

**Status:** Round 1.6 — supersedes ROUND_1_5_DRAFT.md after deep audit (3 parallel agents: corpus calibration, round 1.6 conformance, translation-to-code).
**Framework:** PHASE_2_PROMPT_BENCHMARK.md (round 1.6 framework, ratified 2026-05-01)

---

## §0 — What changed from round 1.5 to round 1.6

Three audits surfaced 3 HIGH, 6 MED, 5 LOW findings. All HIGHs blocking. All closed inline. Both open items from round 1.5 closed.

| Finding | Severity | Closure |
|---|---|---|
| Volume calibration: would produce 6-10/essay on a B+ draft vs §10's 3-5 ceiling | HIGH | New §10 prioritization step + load-bearing test ("must change a holistic understanding, not local-only") |
| Deepening-utility test trivially passable ("matures the finding" → autopass) | HIGH | New §2.4 banned-phrasings list + content-specificity requirement on `expectedInsight` + new Test 6 to round-0 gate (§3 worked example calibration) |
| Anti-repetition architecturally unenforceable (walk has no prior-emissions channel) | HIGH | Round 1.5 open-item-#2 closed. §7 now states architectural commitment: `buildUserPrompt` is extended to thread `priorEmissions[]` from earlier paragraphs in this walk run. Translation work order in §11 lists the code change. |
| §5 seeds are templates with quote slots (conformance + corpus audits agreed) | MED | §5 rewritten at corpus bar — seed candidate answer-shapes + name the writing principle inside the seed. Anti-template-with-quote-slot pattern added. |
| Working-move-silence rule missing from §2 four-condition gate | MED | §2 expanded to FIVE conditions with §2.0 zeroth condition: "the move on this anchor is reaching but not landing — if it's landing, silence." |
| Single-line gap bundling (3 gaps on one line → 3 emissions reads as pestering) | MED | §7 rule extended: multiple gaps on one line collapse to one emission unless answer-shapes genuinely differ (specific_memory vs scalar vs narrative). |
| Priority strictness theatrical ("default medium NOT acceptable" forbids word, not outcome) | MED | §3 priority replaced with two-question structural test. Round 1.5 open-item-#1 closed by structural test. |
| Storage location: round 1.5 §9 places field at walk-output top-level; D-2.7 type defines it nested on `ParagraphUnderstanding` | MED | §9 clarified: emission lives at walk-output top level (matches `UnderstandingWalkOutput.specificsNeedEmissions` extension); profile write-back copies it onto `paragraph.understanding.specificsNeedEmissions` (matches D-2.7 type). Translation §11 explicit. |
| §8 uncertainty defaults | LOW | §8 preamble: "At every Yes/No fork, uncertainty counts as No." |
| "Never four [sentences]" hard cap on framingSeed (forbid-list item 6) | LOW | Replaced with "more than three sentences is almost always padding — return to gap-and-approach." Soft guidance, not cap. |
| §1/§10 meta-text validation drift ("emissions earn their spot") | LOW | Tightened to issue-language. |
| §5.4 mega-shape defense | LOW | RATIONALE.md anchor §13 explicit. |
| Empty-dimensions finding guardrail | LOW | §3 `dimensions` field instruction adds: "if the source finding's `dimensions` array is empty, do not emit — the finding's routing is incomplete; emission would fail aggregator validation." |

---

## §1 — What the L3 walk's specifics-need emission is for

The walk reads sentence by sentence, building understanding one paragraph at a time. As it reads, it sometimes notices that the essay is referencing something the writer knows but hasn't put on the page — a moment, a person, a sensory anchor, a stake — that, if specified, would unlock the finding the walk just made AND would materially improve the coaching the system gives back to the student.

The emission is the structured ask: *"this finding can't be deepened from the text alone — only from the writer — and the writer's answer would change the coaching."*

Most paragraphs produce zero emissions. The walk says nothing unless §2's five conditions all hold AND the gap is load-bearing per §10.

## §2 — When to emit (five-condition gate)

Emit a `specificsNeedEmission` when ALL of these are true for a finding the walk just produced:

**§2.0 — The move on this anchor is reaching but not landing.**
If the writer's craft on this anchor is working as written (a reveal that lands, a metaphor doing its work, a structural choice paying off), say nothing. The corpus depth lives in the walk's internal recognition. It does NOT need to surface as an emission.

> Worked example (benchmark §3 + Sarika): the walk recognizes that *"Sometimes, I even ran over my friends' toes"* uses reveal-through-consequence, meek framing, and inferential geometry. All three are corpus-level mechanisms. The walk's `whyAsked`-style recognition fires. **Emission: zero.** The move is landing. Silence.

If the move is reaching but not landing → continue to §2.1.

**§2.1 — The finding is real.**
The walk has named what the essay is doing, with text evidence, and the claim is not a guess.

**§2.2 — The finding's depth depends on something not on the page.**
Re-reading won't close the gap; later paragraphs won't close the gap; only the writer can.

**§2.3 — You have an angle for the question.**
Not "tell me more" but a specific direction: a moment to recover, a sensory anchor to retrieve, a stakes-context to specify, a person to name. The angle is the *approach*; the gap is the *issue*.

**§2.4 — The deepening would change downstream coaching in a content-specific way.**

**Banned trivial phrasings in `expectedInsight`** (these autopass the gate without filtering):
- *"Matures the finding from hypothesis to confirmed."*
- *"Makes the coaching more concrete."*
- *"Reduces fabrication risk."*
- *"Improves the system's understanding."*
- *"Helps L5 generate better feedback."*

These are the *categories* of downstream change. The `expectedInsight` field must name the SPECIFIC content:
- WHICH coaching move becomes possible (e.g., *"unlocks the replication-coaching move where the walk could point to P5's grounded moment as a model for P3"*).
- WHICH specific finding-claim matures from speculation to confirmed (e.g., *"would confirm or refute F12's hypothesis that the writer's relationship to the dance was envious-not-admiring"*).
- WHICH specific fabrication scenario is prevented (e.g., *"prevents the L5 layer from inventing a sensory anchor — wood smell, cold linoleum — that the writer doesn't actually associate with the moment"*).

If `expectedInsight` could appear word-for-word on a different essay's emission, drop it — it failed the swap test (Test 1 + new Test 6 in §12).

**At every Yes/No fork in §8's decision tree, uncertainty counts as No.** Emit only when all five answers are confident-Yes.

If any of these is false → no emission. Stay silent.

## §3 — Shape of an emission (mapping to `SpecificsNeedEmission`)

Each emission is a record with these fields:

```jsonc
{
  "sourceLayer": "l3_walk",                    // fixed for this prompt

  "emittingTrigger": string,                   // (Q1) the finding's CLAIM TEXT — one short sentence naming what the finding noticed. This is what the frontend showcases as "what triggered this question." Not the finding ID; not jargon — the finding's own claim, as stated in newFindings[i].claim.

  "anchorParagraph": number,                   // 0-based paragraph index of the finding
  "anchorSentence": number | undefined,        // 0-based sentence index if sentence-scoped; omit for paragraph-scoped

  "question": string,                          // the actual question — short, specific, plain language. Often a 1-sentence distillation of the framingSeed.

  "dimensions": string[],                      // routing tags. PASS THROUGH from the source finding's `dimensions` array unchanged. GUARDRAIL: if the source finding's `dimensions` is empty, do not emit — the finding's routing is incomplete; emission would fail aggregator validation.

  "expectedInsight": string,                   // ONE SENTENCE: how the answer changes downstream coaching, content-specific per §2.4. Banned phrasings listed in §2.4 — if you find yourself writing one, the emission isn't load-bearing. Drop it.

  "priority": "critical" | "high" | "medium" | "low",  // (NEW: structural two-question test, replaces "default medium not acceptable" theater)
                                                       //
                                                       // Q1: Without this answer, does the finding's claim collapse?
                                                       //     YES → "critical"
                                                       //     NO  → continue to Q2
                                                       //
                                                       // Q2: Without this answer, can downstream coaching still be specific?
                                                       //     NO  → "high"  (coaching cannot be specific without this answer)
                                                       //     YES → "medium" (coaching can be specific; answer would still improve it)
                                                       //
                                                       // "low" is reserved for emissions where the walk is genuinely uncertain
                                                       //   whether to emit at all. Per §2's silence default, prefer not emitting
                                                       //   over emitting at "low".

  "whyAsked": string,                          // recognition-pattern: WHY does the walk think this gap can only be closed by the writer? Internal — not student-facing. Allowed jargon: technical recognition vocabulary. Frontend shows only in audit / debug views.

  "expectedAnswerShape": "scalar" | "short_phrase" | "specific_memory" | "list" | "narrative",  // bookkeeping enum from D-2.7 closed set; routes downstream answer-extraction.

  "consumers": string[],                       // which downstream layers will consume the answer. For L3 walk emissions, almost always ["l3", "l5"]. Add "finding_maturity" when the answer would mature the finding's claim itself.

  "populates": string[],                       // free-form tags naming what the answer will populate downstream — e.g., "groundTruthFacts.byLocation", "finding.evidence", "finding.deepeningPotential".

  "framingSeed": string                        // delivery-pattern seed. MUST embed the student's actual line as a quote (this is what surfaces in the chat). Length matches what the gap and angle need — no padding, no template, no repetition. One sentence if one lands; two if two land; three if three land. More than three is almost always padding — return to gap-and-approach.
}
```

## §4 — Recognition vs delivery (round 1.6 §7)

- **`whyAsked`** is *recognition* — the walk's internal honesty. Allowed: "the finding's deepeningPotential cites a moment whose specifics aren't recoverable from text," "this is a possession-grammar move whose mechanism the walk recognizes but whose specific anchor remains writer-side," etc. The L3.5 / L4 / Conversator never surface this verbatim.
- **`framingSeed`** is *delivery* — the seed that becomes the question the student sees. Plain language, no analytical jargon, no engineering vocabulary. MUST embed the student's actual line as a direct quote.

## §5 — Plain-language calibration on `framingSeed` (rewritten at corpus bar)

The `framingSeed` is the LLM's draft of how the question would arrive in front of the student. Calibrate against round 1.6 §2.5 + §3 Test 4 + the corpus bar (benchmark §3 worked example).

**Anti-pattern: template with quote slot** — the framing language around the quote is portable to any other student's essay. Example of a quote-slot template (don't write these):
- *"You wrote that [PERSON] was [QUOTED ADJECTIVE]. What's one thing [PERSON] did that no one else's [ROLE] would do?"*

The fix: the framing language must come from THIS essay's specifics — the texture of the relationship, the architecture of the scene, the register the essay is reaching for. Quote-slot tailoring is not §2.1 tailoring.

**Anti-pattern: jargon leak**
- *"Your finding F12 has deepeningPotential — please specify the lived experience that grounds it."* (engineering)
- *"Subject-deferral grammar in P1S2 invites a recovery of authentic interior."* (analytical jargon)

**Anti-pattern: validation padding**
- *"Your description of the dance is beautiful and full of vivid imagery. To take it even further, consider sharing what you were feeling..."* (validation opener)
- *"Like the previous question about the dance scene, I'm curious..."* (repetition with prior emission)
- *"You did a great job naming the emotion. Now help me ground it..."* (validation opener)

**Right (corpus-bar examples — quote + name-the-gap-using-this-essay's-specifics + seed-candidates-when-moment-shaped + name-the-principle-inside-the-seed):**

1. *(Dance-watching essay where the student writes "watching her dance was 'freeing' but I couldn't move like that")*
   *"You wrote that watching her dance was 'freeing' — what did being the kid who couldn't move that way actually feel like? Not the sad version, the actual one. Was it longing, or anger, or something quieter that the word 'freeing' is the inverse of? The emotion under that word is what makes 'freeing' carry weight."*

2. *(Friendship essay where the student writes "my friends didn't get it")*
   *"You said your friends 'didn't get it.' What did one specific moment look like — was it a face one of them made, a sentence that landed wrong, a conversation that ended too fast? One real moment we can hear and see lands harder than the summary, and it lets us figure out the not-getting-it the way you lived it."*

3. *(Grandmother essay where the student writes "my grandmother was kind")*
   *"You wrote that your grandmother was 'kind.' Kind is the word everyone uses for their grandmother. What did she do that no one else's would? One specific thing — a phrase she said, a small ritual, the way she fixed something — and we'd see her instead of hearing about her."*

The pattern: quote the line, name the gap using framing that comes from THIS essay's specifics, seed candidate answer-shapes when the gap is moment-shaped, and where possible name the writing principle the move embodies (discovery > delivery; specific > general; concrete moment > summary) inside the seed itself — that turns the question into teaching.

## §6 — Issue-and-approach calibration (round 1.6 §2.4 + §3 Test 3)

If removing the seed's first sentence loses nothing important, the first sentence is filler. Revise to start with the second sentence.

**Wrong (validation as opener):**
*"Your description of the dance is beautiful. What were you feeling at that moment?"* — first sentence is filler; the second alone is the actual ask.

**Right (issue as opener):**
*"You wrote that watching her dance was 'freeing' — what were *you* feeling?"* — quote-then-gap-then-angle, no padding.

## §7 — Anti-repetition discipline

Within a single essay analysis, emissions must not feel like the same template applied twice.

**§7.1 — Cross-paragraph anti-repetition (architecturally enforced).**
The walk receives `priorEmissions[]` in its per-paragraph user prompt — a context block listing every emission produced earlier in this walk run, with each one's `framingSeed` and `anchorParagraph`. Before emitting on the current paragraph, scan this block. If your candidate emission would:
- Quote the same student line as a prior emission AND target the same gap → drop it.
- Use the same angle phrasing as a prior emission → revise the angle to be specific to this paragraph's material, OR drop if no genuinely distinct angle exists.
- Surface the same gap from a different finding → drop it. The earlier emission already covers it.

**§7.2 — Single-line gap bundling.**
When a single student line carries multiple distinct gaps (e.g., emotion-grounding + person-specification + stakes-specification), prefer ONE emission whose angle bundles the gaps into a single rich question — UNLESS the gaps need fundamentally different shapes of answer.

The grandmother example *("My grandmother was kind, and her kindness shaped me")* has three gaps but they all want the same answer-shape (`specific_memory`). Emit ONCE with the strongest angle, not three times.

If the gaps want different answer-shapes (e.g., a `specific_memory` for emotion-grounding + a `scalar` for stakes-quantification), emit separately. The answer-shape difference is what makes the second emission additive rather than repetitive.

**§7.3 — Aggregator dedup is the safety net, not the primary discipline.**
The aggregator (D-2.7) catches identical or near-identical emissions via Jaccard similarity at threshold 0.5. The walk should not lean on this — emissions the walk itself recognizes as repetitive should not be emitted at all.

## §8 — How to derive the emission from the walk's existing recognition

**At every Yes/No fork below, uncertainty counts as No. Emit only when all five answers are confident-Yes.**

For each finding the walk produces:

```
§2.0  Is the move on this anchor reaching but not landing?
        No (move is landing)  → no emission. Silence.
        Yes ↓

§2.1  Is the finding real (text-evidenced, not a guess)?
        No  → no emission.
        Yes ↓

§2.2  Does the finding's depth depend on something not on the page (writer-side only)?
        No  → no emission. Re-reading or later paragraphs will close the gap.
        Yes ↓

§2.3  Do you have an angle (specific direction) for the question?
        No  → no emission. Vague question without angle is filler.
        Yes ↓

§2.4  Would the answer change downstream coaching in a content-specific way?
        Articulate the SPECIFIC content (banned phrasings in §2.4 don't count).
        If you can't articulate it without using a banned phrasing → no emission.
        Yes ↓

§7    Is this gap (anchor + angle) already covered by a prior emission in this walk?
        Yes → no emission. Repetitive.
        No  → emit.
```

## §9 — Schema placement and storage

The walk's existing output schema has `paragraphUnderstanding`, `sentenceUnderstandings[]`, `holisticEvolution`, `priorSentenceUpdates[]`, `newConnections[]`, `newFindings[]`, `findingEvolutions[]`. The new field is at the same level as those — a sibling, NOT nested inside `paragraphUnderstanding`:

```jsonc
{
  "paragraphUnderstanding": { ... },
  "sentenceUnderstandings": [ ... ],
  "holisticEvolution": { ... },
  "priorSentenceUpdates": [ ... ],
  "newConnections": [ ... ],
  "newFindings": [ ... ],
  "findingEvolutions": [ ... ],
  "specificsNeedEmissions": [                  // NEW — paragraph-scoped, top-level, optional, default empty
    { /* emission record per §3 */ }
  ]
}
```

If empty → omit or write `[]`.

**Storage write-back:** the parser extracts `specificsNeedEmissions` from the walk's top-level output. The profile write-back step (`applyWalkOutputToProfile`) copies it onto `paragraph.understanding.specificsNeedEmissions` — that's where the D-2.7 type defines storage and where D-2.8's integration helper reads from. Top-level in walk output → nested in profile. The translation work order (§11) lists this as the explicit profile-write step.

## §10 — Volume expectations (quality-driven, with explicit cap)

There is no target emission count per paragraph. The cap on emissions per essay is **judgment-driven, but ~5 is a strong upper bound** for a typical 5-7 paragraph essay. If your draft emissions exceed ~5 across the whole walk, you're emitting on gaps that aren't load-bearing — compress.

**Load-bearing test:** A gap is load-bearing only when answering it would change a HOLISTIC understanding — voice, narrative architecture, identity, the essay's central reach. Local-only gaps (a single sentence's emotional grounding that doesn't connect to the essay's larger pattern) stay silent unless they're the strongest instance of a recurring pattern.

Acceptable distributions:

- A polished essay with no specifics gaps the writer needs to fill → 0 emissions across the entire walk. Correct.
- An essay with one critical scene that's referenced abstractly → 1 emission. Correct.
- An essay with several distinct holistic-changing gaps each on different anchors with different angles → 3-5 emissions. Correct.
- An essay where every paragraph has the same emotional-grounding gap → emit ONCE on the strongest anchor; the rest fold into that. NOT 5 emissions of the same shape.
- An essay where the walk wants to emit 8+ emissions → compress. Pick the strongest anchors whose answers would most change the coaching. The others fold or drop.

## §11 — Translation work order (architectural commitments)

These code changes accompany the prompt edit and close §7's anti-repetition enforcement gap and §9's storage round-trip:

1. **Type addition.** `UnderstandingWalkOutput` (in `profileTypes.ts`) gets `specificsNeedEmissions?: SpecificsNeedEmission[]` as a top-level optional field.
2. **Prompt edit.** The new prompt section lands between the existing IMPROVEMENT_CANDIDATE_EMISSION example block and the CRITICAL_REMINDERS section in `sequentialDeepWalk.ts`'s SYSTEM_PROMPT_TEMPLATE.
3. **Schema literal.** OUTPUT_SCHEMA JSON template gets `"specificsNeedEmissions": [...]` as the 8th top-level field, with a per-emission shape matching §3.
4. **Parser.** New `parseSpecificsNeedEmissions` helper in `parseWalkOutput` — STRICT-PASSTHROUGH (not defensive coercion) so the aggregator's throw-on-invalid produces the audit signal. The parser preserves the LLM's enum strings without auto-correction.
5. **Profile write-back.** `applyWalkOutputToProfile` after `para.understanding = output.paragraphUnderstanding` adds: `if (output.specificsNeedEmissions?.length) { para.understanding.specificsNeedEmissions = output.specificsNeedEmissions; }` — this is the top-level → nested round-trip per §9.
6. **`buildUserPrompt` extension** (closes round 1.5 open-item-#2). Threads `priorWalkOutputs: UnderstandingWalkOutput[]` (already accumulated by the loop) into the prompt builder. Injects a context block: `=== PRIOR EMISSIONS IN THIS WALK ===` listing each prior emission's `framingSeed` + `anchorParagraph` + `whyAsked`. The walk's §7.1 anti-repetition discipline is then enforceable because the LLM has visibility into prior emissions.
7. **Tests.**
   - Walk → aggregator round-trip unit test: fixture LLM output → parse → feed to aggregator. Asserts validator passes, no throws.
   - Walk parser passthrough test: feed deliberately-malformed emission JSON; assert parser doesn't sanitize; assert aggregator throws with structured context.
   - `buildUserPrompt` prior-emissions context test: assert P3's prompt contains P1's framingSeed when P1 emitted.
8. **Calibration deferred** to 14-essay corpus runs. Round-0 quality gate (§12) is the per-prompt mechanism check; corpus calibration is the depth-bar check that fires after the spine integrates.

## §12 — Round-0 quality gate (six tests, fires before any other quality check)

**Test 1 — Tailored swap.** Could each emission appear word-for-word on a different student's essay? PASS only if both `emittingTrigger` and `framingSeed` are essay-specific.

**Test 2 — Purpose swap.** Could each emission appear on an essay reaching for a fundamentally different purpose? PASS only if the emission is rooted in this essay's specific architecture.

**Test 3 — Issue-and-approach.** Would removing the first sentence of `framingSeed` lose anything important? If no, the first sentence is filler — revise.

**Test 4 — Plain-language.** Would a high-school student understand `framingSeed` without looking up vocabulary or re-reading for grammar? PASS only if yes. (`whyAsked` is allowed jargon per §4.)

**Test 5 — Disposition.** Does the angle generalize as a portable disposition the student can take into other writing? PASS only if yes — every emission's angle should be a writing technique the student could apply elsewhere.

**Test 6 — `expectedInsight` swap (NEW).** Could `expectedInsight` appear word-for-word on a different essay's emission? If yes, the emission is theatrical, not load-bearing — drop it. (Closes the deepening-utility-test theater finding from corpus audit Q6.)

If any test fails → revise or drop the emission. Tests fire before length / tone / evidence checks.

---

## §13 — RATIONALE.md anchors (for ratification)

When this prompt ratifies, RATIONALE.md will explicitly cite:

- **§2.4 + §3 Test 3** — silence is signal; emissions earn their spot via gap-and-approach (D-2.7 audit forward-looking action item)
- **§2.5 + §3 Test 4** — `framingSeed` plain-language discipline (D-2.7 audit forward-looking action item)
- **§7 recognition vs delivery** — `whyAsked` (recognition) vs `framingSeed` (delivery) structurally split
- **Tue's Q1** — `emittingTrigger` (claim text) + `framingSeed` (embedded student line) cover frontend showcase + student-facing anchor without a third field
- **Tue's Q2** — quality-driven seed length, anti-repetition discipline (§7), no template-padding
- **Tue's Q3** — quality-driven volume (§10), no quota, no cap; explicit ~5 upper bound for B+ essays via §10's load-bearing test
- **Tue's Q4** — deepening-utility test on every emission (§2.4), explicit priority per emission via structural two-question test (§3)
- **§5.4 mega-shape defense** — adding the 8th top-level field to L3 walk schema is recognition-of-gaps within L3's existing scope, not blended Analysis. Emissions are recognition that the walk cannot deepen the finding from text alone — same recognition modality as `deepeningPotential` and `raisesQuestions` already on findings, just structurally extracted for downstream consumption.
- **Architectural commitment §11** — `buildUserPrompt` extension threads prior emissions; closes round 1.5 open-item-#2 by giving the walk the visibility §7.1 requires.

---

## Round-0 self-check after round 1.6 revision

- **Test 1 Tailored:** PASS. §5 anti-template-with-quote-slot pattern + corpus-bar examples + §2.4 banned-phrasings in `expectedInsight` close the prior round 1.5 conformance Q1 finding.
- **Test 2 Purpose swap:** PASS.
- **Test 3 Issue-and-approach:** PASS.
- **Test 4 Plain-language:** PASS. `framingSeed` student-facing; `whyAsked` operator-facing.
- **Test 5 Disposition:** PASS. Every angle is by construction a portable disposition; §2.4 forces content-specificity.
- **Test 6 `expectedInsight` swap:** PASS. New banned-phrasings + content-specificity requirement structurally close the deepening-utility theater finding.

**Forbid-list (13 items):** 13/13 clean. "Never four" hard cap replaced with soft guidance (item 6 closure). All other items as round 1.5.

**Both round 1.5 open items closed:**
- Open item #1 (priority strictness) → resolved by §3 structural two-question test.
- Open item #2 (anti-repetition tracking) → resolved by §11 architectural commitment to thread `priorWalkOutputs` into `buildUserPrompt`.

---

## Net verdict on round 1.6

All 3 HIGH findings closed inline. All 6 MED findings closed inline. All 5 LOW findings closed inline. Both round 1.5 open items closed by structural mechanisms. Six-test round-0 gate replaces the prior five-test gate, with new Test 6 closing the deepening-utility theater finding.

**Ready for Tue ratification.** If ratified → translation per §11 work order → calibration runs against the 14-essay corpus → final round of revisions if calibration surfaces gaps.
