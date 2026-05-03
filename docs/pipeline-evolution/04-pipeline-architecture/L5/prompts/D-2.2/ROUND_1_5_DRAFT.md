# D-2.2 — L3 Walk Specifics-Need Emission Prompt — Round 1.5 Draft

**Status:** Round 1.5 — supersedes ROUND_1_DRAFT.md. Tue's directional input applied 2026-05-01.
**Framework:** PHASE_2_PROMPT_BENCHMARK.md (round 1.6, ratified 2026-05-01)

---

## §0 — What changed from round 1 to round 1.5

Tue's calibration on the four open design questions:

| Q | Round 1 default | Round 1.5 ratified | Change rationale |
|---|---|---|---|
| Q1 — finding ID vs claim text | claim text only | claim text in `emittingTrigger` + student's actual line embedded in `framingSeed` (two jobs covered by two fields, no new field needed) | Frontend needs both: (a) showcase what triggered it (claim text) and (b) anchor the question in the student's actual sentence (quote in seed). One field can't do both jobs; two existing fields can. Most efficient. |
| Q2 — seed length 1 vs up-to-3 | up to three | quality-driven, not length-driven; whatever the gap and angle need, no padding, no repetition across emissions in the same essay | Tue's "tailored, mostly unique, no repetitive citing for the sake of it." A 1-sentence seed where 1 lands is right; a 3-sentence seed where 3 are needed is right; padding to a target count is wrong. |
| Q3 — emit on every finding vs writer-dominant only | writer-dominant only | quality-driven volume, no quota, no cap; emit when the gap is real, has an angle, and answering would materially improve coaching | Tue's "right number with highest quality. More if more, less if less." Per-essay emission count is whatever the essay actually surfaces, not what the prompt forces. |
| Q4 — priority explicit vs default-medium | explicit per-emission | explicit per-emission, AND the walk must articulate why the answer would improve coaching quality (deepening-utility test) | Tue's "deepening is actually smart and necessary. Improves reliability and quality of outputs. Not for the sake of it." Forces the walk to think about whether the emission is load-bearing or theatrical. |

---

## §1 — What the L3 walk's specifics-need emission is for

The walk reads sentence by sentence, building understanding one paragraph at a time. As it reads, it sometimes notices that the essay is referencing something the writer knows but hasn't put on the page — a moment, a person, a sensory anchor, a stake — that, if specified, would unlock the finding the walk just made AND would materially improve the coaching the system gives back to the student.

The emission is the structured ask: *"this finding can't be deepened from the text alone — only from the writer — and the writer's answer would change the coaching."*

Most paragraphs produce zero emissions. Silence is the audit signal (round 1.6 §3 Test 3): when the walk has nothing the writer needs to fill in, or when a gap exists but answering wouldn't change the coaching, it says nothing. Emissions earn their spot.

## §2 — When to emit (gap-and-approach + deepening-utility test)

Emit a `specificsNeedEmission` when ALL of these are true for a finding the walk just produced:

1. **The finding is real** — the walk has named what the essay is doing, with text evidence, and the claim is not a guess.
2. **The finding's depth depends on something not on the page** — re-reading won't close the gap; later paragraphs won't close the gap; only the writer can.
3. **You have an angle for the question** — not "tell me more" but a specific direction the question would go: a moment to recover, a sensory anchor to retrieve, a stakes-context to specify, a person to name. The angle is the *approach*; the gap is the *issue*.
4. **(NEW Q4) The deepening would improve coaching reliability/quality** — name how the answer changes downstream: which finding matures, which coaching emission becomes more concrete, which fabrication risk drops. If you can't articulate the load-bearing improvement, the emission is theatrical. Drop it.

If any of these is false → no emission. Stay silent.

**The walk must also avoid emission inflation** (Tue's Q3 calibration):
- Don't emit if a previous emission in the same essay already covers this gap or this angle. Repetitive emissions waste the student's attention and the system's runs.
- Don't emit if the gap is genuinely small and the walk's other findings already capture the essay's depth. Small gaps stay silent.
- Don't emit just because you've gone several paragraphs without an emission. Quota-thinking violates round 1.6 §3 Test 3.
- Do emit multiple gaps per paragraph if the paragraph has multiple distinct, load-bearing gaps each with their own angle. The volume is whatever the paragraph genuinely surfaces.

## §3 — Shape of an emission (mapping to `SpecificsNeedEmission`)

Each emission is a record with these fields (matching the D-2.7 type):

```jsonc
{
  "sourceLayer": "l3_walk",                    // fixed for this prompt
  "emittingTrigger": string,                   // (Q1) the finding's CLAIM TEXT — one short sentence naming what the finding noticed. This is what the frontend showcases as "what triggered this question." Not the finding ID; not jargon — the finding's own claim, as stated in newFindings[i].claim.
  "anchorParagraph": number,                   // 0-based paragraph index of the finding
  "anchorSentence": number | undefined,        // 0-based sentence index if the gap is sentence-scoped; omit for paragraph-scoped
  "question": string,                          // the actual question the system would surface to the student — short, specific, plain language. Often a 1-sentence distillation of the framingSeed.
  "dimensions": string[],                      // routing tags from your finding's `dimensions` array — pass through unchanged
  "expectedInsight": string,                   // (Q4) ONE SENTENCE: how the answer changes downstream coaching — which finding matures, which suggestion becomes concrete, which fabrication risk drops. NOT a re-summary of the question. If you can't write this honestly, the emission fails the deepening-utility test — drop it.
  "priority": "critical" | "high" | "medium" | "low",  // (Q4) explicit per emission. Critical = finding's whole claim collapses without the answer; high = finding stays true but coaching can't be specific without it; medium = answer would improve coaching but finding stands as-is; low = answer is nice-to-have. Default 'medium' is NOT acceptable — choose per emission.
  "whyAsked": string,                          // recognition-pattern: WHY does the walk think this gap can only be closed by the writer? Internal — not student-facing. Allowed jargon: technical recognition vocabulary.
  "expectedAnswerShape": "scalar" | "short_phrase" | "specific_memory" | "list" | "narrative",  // what shape the answer is likely to take
  "consumers": string[],                       // which downstream layers will consume the answer — for L3 walk emissions, almost always ["l3", "l5"] (re-walk + coaching); add "finding_maturity" when the answer would mature the finding's claim
  "populates": string[],                       // free-form tags naming what the answer will populate downstream — e.g., "groundTruthFacts.byLocation", "finding.evidence", "finding.deepeningPotential"
  "framingSeed": string                        // (Q1 + Q2) delivery-pattern seed. MUST embed the student's actual line as a quote (this is what surfaces in the chat). Length is whatever the gap and angle genuinely need — no padding, no template-padding, no repetition. One sentence if one lands; two if two land; three if three land. Never four. Never fewer than the seed needs to carry the student's line + the gap + the angle.
}
```

## §4 — Recognition vs delivery (round 1.6 §7)

Two of the fields above split along the recognition/delivery line:

- **`whyAsked`** is *recognition* — the walk's internal honesty about why this gap can only be closed by the writer. Allowed jargon: "the finding's deepeningPotential cites a moment whose specifics aren't recoverable from text," "this is a possession-grammar move that would land harder with a sensory-anchor," etc. The L3.5 / L4 / Conversator never surface this verbatim. Frontend shows it only in audit / debug views.
- **`framingSeed`** is *delivery* — the seed that becomes the question the student sees. Plain language, no analytical jargon, no engineering vocabulary. Round 1.6 §2.5 + §10 forbid-list item 12 apply. The `framingSeed` MUST embed the student's actual line as a direct quote — that's what anchors the question to the student's writing in the chat.

The Conversator polishes `framingSeed` into the student-facing question; the walk doesn't have to write the final question, just a seed that carries the student's line + the gap + the angle.

## §5 — Plain-language calibration on `framingSeed` (Q2 efficiency applied)

The `framingSeed` is the LLM's draft of how the question would arrive in front of the student. Calibrate against round 1.6 §2.5 + §3 Test 4 + Tue's Q2 efficiency directive (no padding, no repetition, length matches the gap):

**Wrong (jargon leak):**
- *"Your finding F12 has deepeningPotential — please specify the lived experience that grounds it."*
- *"Subject-deferral grammar in P1S2 invites a recovery of authentic interior at that moment."*

**Wrong (validation padding — round 1.6 §5.7 + Q2 anti-repetition):**
- *"Your description of the dance is beautiful and full of vivid imagery. To take it even further, consider sharing what you were feeling..."* (validation padding)
- *"Like the previous question about the dance scene, I'm curious what you were feeling..."* (repetition with a prior emission)
- *"You did a great job naming the emotion. Now help me ground it in a specific moment..."* (validation padding)

**Right (issue-and-approach, plain coaching register, length matches):**
- 1-sentence seed (where one lands): *"You wrote that watching her dance was 'freeing' — what did being the kid who couldn't move that way actually feel like?"*
- 2-sentence seed (where two lands): *"You said your friends 'didn't get it' — what did one specific moment look like? Even one real conversation, where you can hear what they said, would land harder than the summary."*
- 3-sentence seed (where three lands — only when the angle genuinely needs all three): *"You wrote that your grandmother was 'kind.' What's one thing she did that no one else's grandmother would do? Pick the most specific one — that's the version that lets us see her, not just hear about her."*

The seed must always quote the student's actual line. The seed must lead with the issue, not validation. The seed length is dictated by what the gap needs, not by a template.

## §6 — Issue-and-approach calibration (round 1.6 §2.4 + §3 Test 3)

Repeating from §5 because this is the most common failure mode:

If removing the seed's first sentence loses nothing important, the first sentence is filler. Revise to start with the second sentence.

**Wrong (validation as opener):**
- *"Your description of the dance is beautiful. What were you feeling at that moment?"* — first sentence is filler; the seed is "What were you feeling at that moment?" alone is the actual ask.

**Right (issue as opener):**
- *"You wrote that watching her dance was 'freeing' — what were *you* feeling?"* — quote-then-gap-then-angle, no padding.

## §7 — Anti-repetition discipline (NEW — Q2 calibration)

Within a single essay analysis, emissions must not feel like the same template applied twice. Concretely:

- **Don't quote the same student line in two seeds** unless the second emission targets a genuinely different gap on the same line. If the line has two distinct gaps (e.g., emotion-grounding AND person-specification), emit twice with different angles. If both emissions would say "tell me what you were feeling," emit once.
- **Don't use the same angle phrasing across emissions.** "What did one specific moment look like?" is a good angle once; using it in three seeds in the same essay reads as template, not analysis. Vary the language.
- **Don't surface the same gap from two different findings.** If two findings both want a sensory anchor for the same scene, the walk is double-counting — the emission goes once, citing whichever finding's claim is more load-bearing.
- **Cross-paragraph awareness:** if P2 already emitted a "ground the emotion in a moment" question, P5 emitting another "ground the emotion in a moment" question without distinct material is repetition. Walk's responsibility to track what's already been emitted in this run.

The aggregator (D-2.7) will catch identical or near-identical emissions via its dedup contract (anchor + shape + framing-seed Jaccard). But the walk should not lean on dedup — emissions that the walk itself recognizes as repetitive should not be emitted at all. Dedup is the safety net, not the primary discipline.

## §8 — How to derive the emission from the walk's existing recognition

The walk already has the recognition machinery: every finding carries `deepeningPotential` (what further investigation could reveal) and `raisesQuestions` (questions for further investigation). These are the upstream signal.

A specifics-need emission is the *sub-set* of those recognitions where:
- The answer can come ONLY from the writer (not from re-reading or later paragraphs)
- AND the answer would materially improve coaching reliability / quality

**Decision tree for each finding the walk produces:**

```
Is `deepeningPotential` populated?
  No  → no emission. Finding is mature as-stated.
  Yes ↓

Among `raisesQuestions[]`, is at least one question the text cannot answer?
  No  → no emission. Re-reading or later paragraphs will close the gap.
  Yes ↓

Can you state the angle — what shape the answer will take, what specific direction?
  No  → no emission. Vague question without angle is filler.
  Yes ↓

(Q4 deepening-utility test) Would the answer materially improve coaching?
  Articulate how (which finding matures, which suggestion becomes concrete, which fabrication risk drops). If you can't articulate it → no emission, drop it.
  Yes ↓

(Q2 anti-repetition test) Has this gap, on this anchor, with this angle, already been emitted in this essay's run?
  Yes → no emission. Repetitive.
  No  → emit.
```

The walk's existing fields (`deepeningPotential`, `raisesQuestions`, finding's `evidence` array, finding's `claim`) are the source material. The emission is the structured, actionable, non-repetitive distillation.

## §9 — Where in the L3 walk schema this lands

The walk's existing output schema has `paragraphUnderstanding`, `sentenceUnderstandings[]`, `holisticEvolution`, `priorSentenceUpdates[]`, `newConnections[]`, `newFindings[]`, `findingEvolutions[]`. The new field is at the same level:

```jsonc
{
  "paragraphUnderstanding": { ... },
  "sentenceUnderstandings": [ ... ],
  "holisticEvolution": { ... },
  "priorSentenceUpdates": [ ... ],
  "newConnections": [ ... ],
  "newFindings": [ ... ],
  "findingEvolutions": [ ... ],
  "specificsNeedEmissions": [                  // NEW — paragraph-scoped, optional, default empty
    { /* emission record per §3 */ }
  ]
}
```

If empty → omit or write `[]`. Either is acceptable per the aggregator's optional-field handling (D-2.8).

## §10 — Volume expectations (Q3 quality-driven, no quota)

There is no target emission count per paragraph or per essay. Acceptable distributions:

- A polished essay with no specifics gaps the writer needs to fill → 0 emissions across the entire walk. Correct.
- An essay with one critical scene that's referenced abstractly → 1 emission. Correct.
- An essay with several distinct gaps each on different anchors with different angles → 3-5 emissions. Correct.
- An essay where every paragraph has the same emotional-grounding gap → emit ONCE on the strongest anchor; the rest fold into that. NOT 5 emissions of the same shape.

What's banned:
- Quota-thinking ("I should have at least 3 emissions across this 5-paragraph essay")
- Forced silence ("no more than 1 emission per paragraph")
- Volume as a quality signal ("more emissions = better walk")

The right volume is whatever the essay actually surfaces under §2's four conditions and §7's anti-repetition discipline.

---

## Round-0 quality gate self-check (after round 1.5 revision)

**Test 1 — Tailored swap.** Could this prompt's emissions appear word-for-word on a different student's essay? With Q1's calibration, both `emittingTrigger` (finding's claim text) and `framingSeed` (embedded student line) are essay-specific. Cannot swap. PASS.

**Test 2 — Purpose swap.** Could this prompt's emissions appear on an essay reaching for a fundamentally different purpose? The §2 trigger conditions and §6 issue-and-approach shape generalize structurally; the *content* of each emission is anchored to the specific finding's claim. The thinking pattern generalizes, the emission's content doesn't. PASS.

**Test 3 — Issue-and-approach.** Walk every example seed in §5 — does the first sentence lead with the issue or with validation? Each seed in §5 leads with the student's specific line + the gap, not with praise. §6 makes the discipline explicit with anti-pattern examples. PASS.

**Test 4 — Plain-language.** Walk the seeds. "the kid who couldn't move that way," "what did one specific moment look like," "what's one thing she did that no one else's grandmother would do" — all high-school-readable, no analytical jargon. The `whyAsked` field intentionally allows recognition jargon (per §4); not student-facing. PASS for student-facing, by-design for internal recognition.

**Test 5 — Disposition.** Does this prompt produce observations that generalize as portable dispositions for the student? With Q4's deepening-utility test, every emission articulates how the answer changes downstream coaching — which by construction names a portable angle ("ground the emotion in a moment," "specify the person beyond their function," "name the concrete stakes"). The angle IS the portable disposition the student takes into other writing. PASS (upgraded from "arguable pass" in round 1).

**Verdict:** 5 PASS. Forbid-list 13/13 still clean (Q3's no-quota and Q2's anti-repetition both close former edge cases). Round 1.5 ready for Tue ratification.

---

## Open items for Tue (round 1.5 → round 1.6 surface)

Two minor items where round 1.5 has a working choice but Tue may want to calibrate:

1. **§3 `priority` field — explicit-no-default vs explicit-with-medium-fallback.** Round 1.5 says "default 'medium' is NOT acceptable." Strict. Trade: forces every emission to carry honest priority, but adds cognitive load on the walk. If Tue wants medium-fallback for ergonomics, will switch.
2. **§7 anti-repetition tracking — should the walk receive a "previously emitted in this essay" context block, or is per-paragraph self-discipline enough?** Round 1.5 chose self-discipline (the walk has sequential context across paragraphs already). If Tue wants explicit prior-emissions context block, will add to the prompt's input.

Both are calibration items, not flaws.

---

## RATIONALE.md anchors (for ratification)

When this prompt ratifies (round 1.6 from this draft pending Tue's review), RATIONALE.md will explicitly cite:
- §2.4 + §3 Test 3 — silence is signal; emissions earn their spot via gap-and-approach (D-2.7 audit forward-looking action item)
- §2.5 + §3 Test 4 — `framingSeed` plain-language discipline (D-2.7 audit forward-looking action item)
- §7 — recognition (`whyAsked`) vs delivery (`framingSeed`) structurally split
- Tue's Q1 calibration — `emittingTrigger` (claim text) + `framingSeed` (embedded student line) cover frontend showcase + student-facing anchor without a third field
- Tue's Q2 calibration — quality-driven seed length, anti-repetition discipline, no template-padding
- Tue's Q3 calibration — quality-driven volume, no quota, no cap
- Tue's Q4 calibration — deepening-utility test on every emission, explicit priority per emission, deepening-must-improve-coaching
