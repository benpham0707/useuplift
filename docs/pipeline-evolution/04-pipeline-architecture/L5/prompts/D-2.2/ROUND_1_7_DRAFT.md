# D-2.2 — L3 Walk Specifics-Need Emission Prompt — Round 1.7 Draft

**Status:** Round 1.7 — supersedes ROUND_1_6_DRAFT.md after Tue's directional brainstorm 2026-05-01.
**Framework:** PHASE_2_PROMPT_BENCHMARK.md (round 1.6 framework, ratified 2026-05-01)

---

## §0 — What changed from round 1.6 to round 1.7

Tue's brainstorm reshaped the prompt's purpose. Five directional changes, each load-bearing:

| # | Change | Round 1.6 → 1.7 |
|---|---|---|
| 1 | **Purpose reframing — system-side primary, student-facing secondary** | Emissions are the system flagging writer-side gaps it uses to (a) be transparent about coaching limits, (b) prepare richer coaching for IF user engages, (c) mature findings if user provides answer. Surfacing as student-facing questions is downstream, opt-in, NOT the primary purpose. |
| 2 | **Pragmatic scope** | High-leverage calibrations ship now (volume, surface-vs-deep filter, concept tracker). No deferrals needed. |
| 3 | **Self-sufficient system — must work without answers** | Most users won't answer questions until they trust the product. System's coaching MUST function without the answer. Emissions that the system *needs* to coach at all = anti-pattern (system has under-coached, not flagged a real gap). New §2.4 reframing: answer must *upgrade*, not *enable*, downstream coaching. |
| 4 | **Volume: 3-5 per essay total, competitive selection** | Round 1.6's ~5 per essay with load-bearing test STAYS, tightened to a hard 3-5 cap with explicit competitive selection across the whole essay (not per-sentence). Surface-level emissions banned. Each emission must surface a discovery the writer hasn't made OR unlock a coaching move the system couldn't deliver without. |
| 5 | **Concept tracker — anti-repetition of TEACHING FRAMING, not just gap content** | The first 1-2 times the system teaches "specific > general" via the grandmother-style framing, it's coaching. The 5th time, it's condescending. New `taughtConcept` field on emission + profile-level `taughtConcepts` tracker + prompt instruction to drop concept-teaching framing on subsequent emissions touching the same concept. |

**Plus new round-0 Test 7** (worth-the-writer's-time): every emission must pass "would answering surface a discovery OR unlock a coaching upgrade?"

All round 1.6 closures retained (volume cap, working-move silence, single-line bundling, structural priority, storage placement, anti-repetition, deepening-utility content-specificity).

---

## §1 — What the L3 walk's specifics-need emission is for

The walk reads the essay sentence by sentence. As it reads, it sometimes notices that the essay is referencing something the writer knows but hasn't put on the page. The emission is the system's structured flag that *"my read of this finding has a writer-side gap. I'm coaching around it as well as I can from the text. IF the writer answers, my coaching gets sharper. If they don't, I still coach — well — without the answer."*

**Primary consumer: the system itself.** Emissions are how the walk acknowledges what it can't fully resolve from text alone, and how downstream layers (L3.5, L4, L5) know which findings carry residual writer-side dependence.

**Secondary consumer (opt-in): the student.** IF the user engages the dig flow, the Conversator may surface 3-5 of the highest-quality emissions per essay as questions. Whether and when to surface is a downstream decision driven by the user's engagement signals — NOT a default behavior.

**Self-sufficiency principle.** Most users will not answer questions until they trust Uplift. The system's coaching MUST work at high quality WITHOUT answers. An emission whose downstream coaching cannot function without the answer is an anti-pattern — it means the walk has under-coached from text, not that it has flagged a real writer-side gap.

Most paragraphs produce zero emissions. The walk says nothing unless §2's six conditions all hold AND the gap survives §10's competitive selection across the whole essay.

## §2 — When to emit (six-condition gate)

Emit a `specificsNeedEmission` candidate (final selection happens in §10) when ALL of these are true for a finding the walk just produced. **At every Yes/No fork below, uncertainty counts as No.**

**§2.0 — The move on this anchor is reaching but not landing.**
If the writer's craft on this anchor is working as written (a reveal that lands, a metaphor doing its work, a structural choice paying off), say nothing. The corpus depth lives in the walk's internal recognition. It does NOT need to surface as an emission.

> Worked example (benchmark §3 + Sarika): the walk recognizes that *"Sometimes, I even ran over my friends' toes"* uses reveal-through-consequence, meek framing, inferential geometry — corpus-level mechanisms. The walk's `whyAsked`-style recognition fires. **Emission: zero.** The move is landing. Silence.

**§2.1 — The finding is real.**
The walk has named what the essay is doing, with text evidence, and the claim is not a guess.

**§2.2 — The finding's depth depends on something not on the page.**
Re-reading won't close the gap; later paragraphs won't close the gap; only the writer can.

**§2.3 — You have an angle for the question.**
Not "tell me more" but a specific direction: a moment to recover, a sensory anchor to retrieve, a stakes-context to specify, a person to name.

**§2.4 — The answer would UPGRADE downstream coaching, not ENABLE it (self-sufficiency principle).**

The system's coaching on this gap MUST be functional without the writer's answer. The emission's value is in making *good coaching* into *better coaching*, not in unblocking coaching that wouldn't otherwise run.

**Self-sufficiency test:** Can you write strong, specific, text-grounded coaching for this gap RIGHT NOW, without imagining the writer's answer?
- **No** → the walk has under-coached. Don't emit. Re-coach harder from the text the walk already has.
- **Yes** → continue. The coaching exists; the answer would make it sharper.

**Banned trivial phrasings in `expectedInsight`** (these autopass the gate without filtering):
- *"Matures the finding from hypothesis to confirmed."*
- *"Makes the coaching more concrete."*
- *"Reduces fabrication risk."*
- *"Improves the system's understanding."*
- *"Helps L5 generate better feedback."*

These are categories. Name the SPECIFIC content:
- WHICH coaching move becomes possible (e.g., *"unlocks the replication-coaching move pointing to P5's grounded moment as a model for P3"*).
- WHICH specific finding-claim matures (e.g., *"would confirm or refute F12's hypothesis that the writer's relationship to the dance was envious-not-admiring"*).
- WHICH specific fabrication scenario is prevented (e.g., *"prevents the L5 layer from inventing a sensory anchor — wood smell, cold linoleum — that the writer doesn't actually associate with the moment"*).

**§2.5 — Surface-vs-deep test: the emission must dig at a discovery OR a coaching-unlock.**

An emission earns its spot only if answering it would either:
- **(a) Surface a discovery** the writer hasn't made about their own essay — a pattern, an inversion, a hidden choice, an unowned emotion.
- **(b) Unlock a coaching move** the system genuinely could not deliver without the answer (NOT "would benefit from" — *could not deliver*).

**Surface-level (banned):**
- *"What were you feeling at that moment?"* — generic, no angle, no discovery seeded.
- *"Can you describe your grandmother more?"* — vague, no specific direction.
- *"What did your friend look like?"* — sensory request without load-bearing reason.

**Deep (the bar):**
- *"You wrote 'freeing' for watching something you couldn't do. That's a strange word — what's the version that's true? Longing dressed up? Envy you don't want to name? The honest word is what makes the rest land."* — seeds discovery (writer probably hasn't named the actual emotion), seeds three candidates, teaches the principle (the honest word > the easy word).
- *"Your grandmother appears twice — P1 and P5. In P1 she's 'kind.' In P5 she's 'kind.' Same word both times. What's between those scenes that the essay isn't showing? The repetition tells me you're protecting something specific by staying general."* — surfaces a discovery (writer hasn't seen the cross-paragraph pattern), load-bearing for the essay's arc.

If the emission doesn't pass the discovery-OR-unlock test → drop it. Most "What did you feel?" questions fail this test.

If any of §2.0-§2.5 is false → no emission candidate. Stay silent.

## §3 — Shape of an emission (mapping to `SpecificsNeedEmission`)

```jsonc
{
  "sourceLayer": "l3_walk",                    // fixed for this prompt

  "emittingTrigger": string,                   // the finding's CLAIM TEXT — one short sentence naming what the finding noticed. What the frontend showcases as "what triggered this question." Not the finding ID; not jargon.

  "anchorParagraph": number,                   // 0-based paragraph index of the finding
  "anchorSentence": number | undefined,        // 0-based sentence index if sentence-scoped; omit for paragraph-scoped

  "question": string,                          // the actual question — short, specific, plain language. 1-sentence distillation of the framingSeed.

  "dimensions": string[],                      // routing tags. PASS THROUGH from the source finding's `dimensions` array unchanged. GUARDRAIL: if the source finding's `dimensions` is empty, do not emit.

  "expectedInsight": string,                   // ONE SENTENCE: how the answer UPGRADES coaching (per §2.4). Banned phrasings in §2.4 — if you find yourself writing one, the emission isn't load-bearing. Drop it.

  "expectedDiscovery": string | null,          // (NEW round 1.7) ONE SENTENCE: what the writer would DISCOVER about their own essay from answering — a pattern, an inversion, a hidden choice, an unowned emotion. null if the emission's value is purely a coaching-unlock with no discovery component (per §2.5 disjunction). Both null AND empty `expectedInsight` upgrade-language → emission failed §2.5; drop.

  "taughtConcept": string,                     // (NEW round 1.7) short tag naming the writing principle this emission teaches — free-form, NOT a closed taxonomy. Examples: "specific_over_general", "discovery_over_delivery", "concrete_moment_over_summary", "honest_word_over_easy_word", "show_through_consequence", "register_calibration", "repetition_as_signal". Used by the concept tracker (§8) to detect re-teaching across emissions.

  "priority": "critical" | "high" | "medium" | "low",  // structural two-question test:
                                                       //   Q1: Without this answer, does the finding's claim collapse? YES → critical
                                                       //   Q2: Without this answer, can downstream coaching still be specific?
                                                       //       NO → high (coaching cannot be specific without it)
                                                       //       YES → medium (coaching can be specific; answer would still upgrade it)
                                                       //   "low" reserved for emissions where the walk is uncertain whether to emit at all
                                                       //   (per §2 silence default, prefer not emitting over emitting at "low").

  "whyAsked": string,                          // recognition-pattern: WHY does the walk think this gap can only be closed by the writer? Internal — not student-facing. Allowed jargon.

  "expectedAnswerShape": "scalar" | "short_phrase" | "specific_memory" | "list" | "narrative",  // bookkeeping enum from D-2.7 closed set; routes downstream answer-extraction.

  "consumers": string[],                       // for L3 walk emissions, almost always ["l3", "l5"]. Add "finding_maturity" when answer would mature the finding's claim itself.

  "populates": string[],                       // free-form tags naming what the answer will populate downstream.

  "framingSeed": string                        // delivery-pattern seed. MUST embed the student's actual line as a quote. Length matches what the gap and angle need. More than three sentences is almost always padding. AND: framing must adapt to whether `taughtConcept` has been taught before (per §5 + §8).
}
```

## §4 — Recognition vs delivery

- **`whyAsked`** is *recognition* — internal, jargon-allowed, not student-facing.
- **`framingSeed`** is *delivery* — student-facing, plain language, MUST embed student's line. Adapts based on concept-tracker (§5 + §8).
- **`expectedDiscovery`** is *recognition* of what the writer would learn — internal articulation of why this emission earns its spot per §2.5; not surfaced verbatim to student.
- **`expectedInsight`** is *recognition* of what the system would gain — internal articulation per §2.4; not surfaced verbatim to student.

## §5 — Plain-language calibration on `framingSeed` (concept-tracker-aware)

The `framingSeed` adapts its framing based on whether the concept being taught has already been taught in this run (per the concept tracker, §8).

**Mode A — Concept not yet taught (or taught only once before): teach the concept inside the seed.**
Quote the student's line, name the gap using framing rooted in this essay's specifics, seed candidate answer-shapes when the gap is moment-shaped, name the writing principle the move embodies inside the seed itself.

Example (first time teaching `specific_over_general` in this essay):
*"You wrote that your grandmother was 'kind.' Kind is the word everyone uses for their grandmother. What did she do that no one else's would? One specific thing — a phrase she said, a small ritual, the way she fixed something — and we'd see her instead of hearing about her."*

**Mode B — Concept already taught 2+ times in this run: terse, no re-teaching.**
Drop the principle-naming framing. Trust the writer has internalized the concept. Go straight to issue-and-approach.

Example (third emission this run touching `specific_over_general`):
*"In P5 you wrote your dad was 'supportive.' Same pattern — what's the specific thing he did?"*

The terse mode references the prior teaching by mirroring its structural shape ("same pattern") without re-explaining. Respects the writer's intelligence.

**Mode C — Concept taught 3+ times: stop emitting on this concept entirely for this run.**
The concept tracker (§8) blocks emission. The writer has heard the lesson; further emissions on the same concept are condescending. The system continues to coach AROUND the gap from text, but stops asking.

**Anti-pattern: template with quote slot.**
Even in Mode A, the framing language around the quote must come from THIS essay's specifics — the texture of the relationship, the architecture of the scene, the register the essay is reaching for. Quote-slot tailoring is not §2.1 tailoring (round 1.6 audit Q1 finding).

**Anti-pattern: jargon leak.**
*"Your finding F12 has deepeningPotential."* (engineering)
*"Subject-deferral grammar in P1S2 invites recovery of authentic interior."* (analytical jargon)

**Anti-pattern: validation padding.**
*"Your description of the dance is beautiful and full of vivid imagery..."* (validation opener — round 1.6 §5.7)

## §6 — Issue-and-approach calibration

If removing the seed's first sentence loses nothing important, the first sentence is filler. Revise to start with the second sentence. Quote-then-gap-then-angle, no padding.

## §7 — Anti-repetition discipline

**§7.1 — Cross-paragraph anti-repetition (architecturally enforced).**
The walk receives `priorEmissions[]` in its per-paragraph user prompt — listing every emission produced earlier in this walk run, with `framingSeed`, `anchorParagraph`, `taughtConcept`. Before emitting, scan this block. Drop emissions that:
- Quote the same student line + target the same gap as a prior emission.
- Use the same angle phrasing → revise the angle to be specific to this paragraph's material, OR drop if no genuinely distinct angle exists.
- Surface the same gap from a different finding → drop. The earlier emission already covers it.

**§7.2 — Single-line gap bundling.**
When a single student line carries multiple distinct gaps, prefer ONE emission whose angle bundles them — UNLESS the gaps need fundamentally different answer-shapes (e.g., `specific_memory` vs `scalar`). The grandmother sentence's three gaps all want `specific_memory` → emit ONCE.

**§7.3 — Concept-level anti-repetition (NEW round 1.7).**
See §8.

**§7.4 — Aggregator dedup is the safety net.**
The aggregator (D-2.7) catches identical or near-identical emissions via Jaccard at threshold 0.5. The walk should not lean on this — emissions the walk itself recognizes as repetitive should not be emitted at all.

## §8 — Concept tracker discipline (NEW round 1.7)

**Purpose.** Prevent the walk from re-teaching the same writing principle (e.g., specific > general) repeatedly to the same student in the same run. The first 1-2 teachings are coaching; the 3rd onward is condescending.

**Mechanism.**

1. **Each emission carries a `taughtConcept` tag** (§3). Free-form, but reusable across emissions. The walk picks the tag that names the underlying principle being taught — if the gap is "abstract emotion needs concrete moment," the tag is `concrete_moment_over_summary`.

2. **The profile carries `taughtConcepts: { tag: string, firstTaughtAt: { paragraph: number, sentence?: number }, timesTaught: number }[]`** — accumulated across the walk and across walk passes for this essay.

3. **The walk receives the current state of `taughtConcepts[]` in its per-paragraph user prompt** (alongside the prior-emissions block from §7.1). Each entry tells the walk: "this concept has been taught N times already in this essay's analysis history."

4. **Mode selection per emission (per §5):**
   - `timesTaught == 0` or `timesTaught == 1` → **Mode A** (concept-teaching framing in `framingSeed`).
   - `timesTaught == 2` → **Mode B** (terse, no re-teaching, "same pattern" reference allowed).
   - `timesTaught >= 3` → **Mode C** (do not emit on this concept; coach around it from text only).

5. **After emission generation, the walk increments `timesTaught` for each emitted `taughtConcept`.** Mechanically: the parser updates the profile's `taughtConcepts[]` from the emissions just produced. Cross-pass: the next walk pass (after a writer iteration or re-analysis) reads the current state.

**Worked scenario (a 5-paragraph essay):**

- P1 walk: emits 1 emission with `taughtConcept: "specific_over_general"`. `taughtConcepts.specific_over_general.timesTaught: 1`.
- P2 walk: would emit on a `specific_over_general` gap; sees `timesTaught: 1`; emits in Mode A again. `timesTaught: 2`.
- P3 walk: would emit on another `specific_over_general` gap; sees `timesTaught: 2`; emits in Mode B (terse, "same pattern"). `timesTaught: 3`.
- P4 walk: would emit on a 4th `specific_over_general` gap; sees `timesTaught: 3`; **does NOT emit on this concept** (Mode C). The walk continues to coach around the gap from text, but stops asking.
- P4 walk: encounters a `discovery_over_delivery` gap (different concept); `timesTaught: 0`; emits in Mode A.

Across the essay total: 3 emissions on `specific_over_general` (Mode A, A, B), 1 emission on `discovery_over_delivery` (Mode A) = 4 total, within §10's 3-5 cap.

**Forbid-list compliance.** `taughtConcept` is free-form (per Rule 3 — no closed taxonomy on perception). The walk picks whatever tag fits; if the same underlying concept gets two different tags across emissions (e.g., `concrete_moment_over_summary` vs `specific_over_general`), the tracker treats them separately — not catastrophic, but worth a note in the prompt that the walk should reuse existing tags from `taughtConcepts[]` when applicable.

## §9 — Schema placement and storage

`specificsNeedEmissions` is a sibling of `paragraphUnderstanding` at the walk-output top level — NOT nested:

```jsonc
{
  "paragraphUnderstanding": { ... },
  "sentenceUnderstandings": [ ... ],
  "holisticEvolution": { ... },
  "priorSentenceUpdates": [ ... ],
  "newConnections": [ ... ],
  "newFindings": [ ... ],
  "findingEvolutions": [ ... ],
  "specificsNeedEmissions": [ /* per §3 */ ]
}
```

**Storage write-back:** the parser extracts `specificsNeedEmissions` from the walk's top-level output. The profile write-back step copies it onto `paragraph.understanding.specificsNeedEmissions` (D-2.7 type location). The parser ALSO updates `profile.taughtConcepts` based on the emitted concepts (§8 step 5).

## §10 — Volume: 3-5 per essay total, competitive selection across the whole essay

**Hard ceiling: 3-5 emissions per essay.** Not per paragraph, not per sentence — per whole essay. Most essays land at 3.

**Selection is competitive.** The walk identifies all candidate emissions across all paragraphs (everything that passes §2's six-condition gate AND §7's anti-repetition AND §8's concept-tracker), then picks the 3-5 that:
- Have the highest discovery-or-coaching-unlock value (§2.5 / Test 7)
- Are non-overlapping (different anchors, different concepts taught, different angles)
- Together cover the essay's most load-bearing writer-side gaps

**A 5-paragraph essay with 8 candidate gaps → 3-5 emit, the others drop.** The dropped candidates aren't lost forever — if the writer iterates and the gaps remain, the next walk pass surfaces a fresh 3-5 (with concept-tracker preventing re-teaching).

**A 5-paragraph essay with 0 real gaps → 0 emit.** The cap is a CEILING, not a target. Silence is the default.

**Surface-level emissions banned.** Round 1.7 §2.5 + Test 7 (round-0 gate §12) close this. An emission like "What were you feeling at that moment?" generically applied → drop, regardless of how few emissions you have so far.

**Iteration model.** If the writer engages with the dig flow and answers some emissions, the next walk pass:
- Updates findings based on the answers
- Identifies a fresh set of candidate gaps (deeper layer, since prior gaps closed)
- Concept tracker prevents re-teaching concepts already covered
- Produces a fresh 3-5 emissions (or fewer if essay matured)

If the writer doesn't engage, the 3-5 emissions stand on their own — the system uses them as transparency markers in coaching, not as blockers. Coaching downstream of unanswered emissions remains high quality (per §2.4 self-sufficiency).

## §11 — Translation work order (architectural commitments)

These code changes accompany the prompt edit:

1. **Type addition.** `UnderstandingWalkOutput` (in `profileTypes.ts`) gets `specificsNeedEmissions?: SpecificsNeedEmission[]` as a top-level optional field.
2. **Type addition.** `SpecificsNeedEmission` interface gets `expectedDiscovery: string | null` and `taughtConcept: string` fields. (Round 1.7 expands D-2.7 type.)
3. **Type addition.** `EssayProfile` (or sub-structure) gets `taughtConcepts: { tag: string; firstTaughtAt: { paragraph: number; sentence?: number }; timesTaught: number }[]` field for the concept tracker.
4. **Prompt edit.** New prompt section in `sequentialDeepWalk.ts` SYSTEM_PROMPT_TEMPLATE between IMPROVEMENT_CANDIDATE_EMISSION example and CRITICAL_REMINDERS.
5. **Schema literal.** OUTPUT_SCHEMA JSON template gets `"specificsNeedEmissions": [...]` as 8th top-level field with per-emission shape per §3 (including new `expectedDiscovery` and `taughtConcept`).
6. **Parser.** New `parseSpecificsNeedEmissions` helper — STRICT-PASSTHROUGH (not defensive coercion).
7. **Profile write-back.** `applyWalkOutputToProfile` after `para.understanding = output.paragraphUnderstanding`:
   - `if (output.specificsNeedEmissions?.length) para.understanding.specificsNeedEmissions = output.specificsNeedEmissions`
   - For each emitted `taughtConcept`, increment `profile.taughtConcepts[tag].timesTaught` (or create entry).
8. **`buildUserPrompt` extension** (closes round 1.5 open-item-#2). Threads `priorWalkOutputs: UnderstandingWalkOutput[]` AND `taughtConcepts[]` from profile into the prompt builder. Injects two context blocks:
   - `=== PRIOR EMISSIONS IN THIS WALK ===` listing each prior emission's `framingSeed` + `anchorParagraph` + `taughtConcept` + `whyAsked`.
   - `=== CONCEPTS ALREADY TAUGHT IN THIS ESSAY ===` listing each `taughtConcept` with `timesTaught` and `firstTaughtAt`.
9. **Aggregator validation extension.** D-2.7's `specificsNeedAggregator.ts` validator extends to require `taughtConcept` (non-empty string) and accept `expectedDiscovery` (string OR null).
10. **Tests.**
    - Walk → aggregator round-trip with new fields
    - Concept-tracker mode-A/B/C transitions
    - Cross-pass concept persistence (walk pass 1 → walk pass 2 sees prior `timesTaught`)
    - Volume cap enforcement (8 candidates → max 5 emit)
    - Surface-vs-deep test enforcement on fixture seeds
11. **Calibration deferred** to 14-essay corpus runs.

## §12 — Round-0 quality gate (seven tests)

**Test 1 — Tailored swap.** Could each emission appear word-for-word on a different student's essay? PASS only if both `emittingTrigger` and `framingSeed` are essay-specific.

**Test 2 — Purpose swap.** Could each emission appear on an essay reaching for a fundamentally different purpose? PASS only if rooted in this essay's specific architecture.

**Test 3 — Issue-and-approach.** Would removing `framingSeed`'s first sentence lose anything? If no, the first sentence is filler.

**Test 4 — Plain-language.** Would a high-school student understand `framingSeed` without looking up vocabulary? PASS only if yes.

**Test 5 — Disposition.** Does the angle generalize as a portable disposition the student can take into other writing? PASS only if yes.

**Test 6 — `expectedInsight` swap.** Could `expectedInsight` appear word-for-word on a different essay's emission? If yes, the emission is theatrical — drop.

**Test 7 — Worth the writer's time (NEW round 1.7).** Would answering this emission either:
- (a) Surface a discovery the writer hasn't made about their own essay, OR
- (b) Unlock a coaching move the system genuinely could not deliver without the answer?

If neither → drop. Surface-level emissions ("what were you feeling") fail this test. The writer's time is the scarce resource; only emissions worth it earn the surface.

If any test fails → revise or drop the emission.

---

## §13 — RATIONALE.md anchors (for ratification)

When this prompt ratifies, RATIONALE.md will explicitly cite:

- **§2.4 + §3 Test 3** — silence is signal; emissions earn their spot via gap-and-approach (D-2.7 audit forward-looking action item)
- **§2.5 + §3 Test 4** — `framingSeed` plain-language discipline (D-2.7 audit forward-looking action item)
- **§7 recognition vs delivery** — `whyAsked`/`expectedDiscovery`/`expectedInsight` (recognition) vs `framingSeed` (delivery) structurally split
- **Tue's brainstorm calibration #1** — system-side primary purpose, student-facing surface secondary
- **Tue's brainstorm calibration #3** — self-sufficiency principle: answer upgrades, not enables
- **Tue's brainstorm calibration #4** — 3-5 per essay total, competitive selection, surface-level banned via Test 7
- **Tue's brainstorm calibration #5** — concept tracker (§8) prevents re-teaching framing across the run
- **§5.4 mega-shape defense** — adding 8th top-level walk field is recognition-of-gaps within L3's existing scope, not blended Analysis
- **Architectural commitment §11** — `buildUserPrompt` extension threads prior emissions AND `taughtConcepts[]`; closes round 1.5 open-item-#2 by giving the walk the visibility §7.1 + §8 require

---

## Round-0 self-check after round 1.7 revision

- **Test 1 Tailored:** PASS (§5 anti-template-with-quote-slot + corpus-bar examples)
- **Test 2 Purpose swap:** PASS
- **Test 3 Issue-and-approach:** PASS
- **Test 4 Plain-language:** PASS (`framingSeed` student-facing; `whyAsked`/`expectedDiscovery`/`expectedInsight` operator-facing)
- **Test 5 Disposition:** PASS (every angle is by construction a portable disposition)
- **Test 6 `expectedInsight` swap:** PASS (banned-phrasings + content-specificity)
- **Test 7 Worth the writer's time:** PASS (§2.5 surface-vs-deep test + `expectedDiscovery` field + concept tracker preventing condescending re-teaching)

**Forbid-list (13 items):** 13/13 clean. `taughtConcept` is free-form (Rule 3 compliant — no closed taxonomy on perception). All other items as round 1.6.

**Both round 1.5 open items closed structurally** (priority via two-question test; anti-repetition via §11 architectural commitment).

**All round 1.6 closures retained** (volume cap, working-move silence, single-line bundling, structural priority, storage placement, anti-repetition cross-paragraph, deepening-utility content-specificity).

**All Tue brainstorm calibrations applied** (system-side primary, self-sufficiency, 3-5 cap with competitive selection, concept tracker, surface-vs-deep filter).

---

## Net verdict on round 1.7

Tue's five brainstorm calibrations applied. All round 1.6 closures retained. Six previous round-0 gate tests retained + new Test 7 closes the surface-level emission gap. Concept tracker is the structurally novel element of round 1.7 — it requires type extensions, profile-state additions, and prompt-context threading per §11.

**Ready for the three-audit deep pass:**
- Corpus calibration audit — does the new system-side primary framing + 3-5 cap + concept tracker produce emissions at the corpus depth bar without over-teaching?
- Round 1.6 conformance audit — do the new mechanisms (concept tracker, expectedDiscovery, Test 7) honor every applicable principle?
- Translation-to-code audit — what's the work order for the new fields, profile-state additions, and concept-tracker threading?
