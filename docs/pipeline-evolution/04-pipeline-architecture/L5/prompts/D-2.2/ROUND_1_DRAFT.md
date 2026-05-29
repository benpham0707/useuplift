# D-2.2 — L3 Walk Specifics-Need Emission Prompt — Round 1 Draft

**Layer:** L3 (sequentialDeepWalk)
**Output type:** `SpecificsNeedEmission[]` written to `paragraph.understanding.specificsNeedEmissions`
**Status:** Round 1 draft — pending internal round-0 quality gate, then revision, then surface to Tue
**Framework:** PHASE_2_PROMPT_BENCHMARK.md (round 1.6, ratified 2026-05-01)

---

## §1 — What the L3 walk's specifics-need emission is for

The walk reads sentence by sentence, building understanding one paragraph at a time. As it reads, it sometimes notices that the essay is referencing something the writer knows but hasn't put on the page — a moment, a person, a sensory anchor, a stake — that, if specified, would unlock the finding the walk just made.

The emission is the structured ask: *"this finding can't be deepened from the text alone — only from the writer."*

Most paragraphs produce zero emissions. Silence is the audit signal (round 1.6 §3 Test 3): when the walk has nothing the writer needs to fill in, it says nothing. Emissions earn their spot.

## §2 — When to emit (gap-and-approach test)

Emit a `specificsNeedEmission` when ALL of these are true for a finding the walk just produced:

1. **The finding is real** — the walk has named what the essay is doing, with text evidence, and the claim is not a guess.
2. **The finding's depth depends on something not on the page** — re-reading won't close the gap; later paragraphs won't close the gap; only the writer can.
3. **You have an angle for the question** — not "tell me more" but a specific direction the question would go: a moment to recover, a sensory anchor to retrieve, a stakes-context to specify, a person to name. The angle is the *approach*; the gap is the *issue*.

If any of these is false → no emission. Stay silent.

**Examples of false-trigger silence:**
- The walk identifies a metaphor that's working — no gap, no emission. (Round 1.6 §3 Test 3 worked example: Sarika's wheelchair reveal works as written; the system stays silent on Sarika's actual essay.)
- The walk wonders abstractly "what's behind this line?" but has no specific angle — that's a vague question, not an approach. No emission.
- The gap could be closed by re-reading P5 or by waiting for the next paragraph — no emission. Re-read; come back if still gapped.
- The walk could *guess* the answer from text — no emission. The walk's job is understanding from text; only emit when the text genuinely doesn't have it.

**Examples of true-trigger emission:**
- A finding about emotional weight where the essay names a feeling but no embodied moment grounds it. The walk can't deepen "she felt small" without the writer telling us how the smallness *appeared* (the chair she sat in, the sound her hands made, the texture of the moment). Emit: angle is "specific moment recovery."
- A finding about a person who appears as a function (mentor, parent, coach) with no specific feature distinguishing them from any other person in that role. The walk can't deepen the relationship without the writer specifying who this person actually is. Emit: angle is "person-specific detail recovery."
- A finding about stakes (the essay claims something mattered) where the consequence the writer feared or the world-state-that-would-have-been-different is unstated. The walk can't deepen "this was important" without the writer naming what hung on it. Emit: angle is "stakes-specification."

## §3 — Shape of an emission (mapping to `SpecificsNeedEmission`)

Each emission is a record with these fields (matching the D-2.7 type):

```jsonc
{
  "sourceLayer": "l3_walk",                    // fixed for this prompt
  "emittingTrigger": string,                   // the finding that triggered this — by ID or by short description, e.g., "F12 deepeningPotential != null with raisesQuestions[0] citing a moment the writer hasn't shown"
  "anchorParagraph": number,                   // 0-based paragraph index of the finding
  "anchorSentence": number | undefined,        // 0-based sentence index if the gap is sentence-scoped; omit for paragraph-scoped
  "question": string,                          // the actual question the system would surface to the student — short, specific, plain language
  "dimensions": string[],                      // routing tags from your finding's `dimensions` array — pass through unchanged
  "expectedInsight": string,                   // one sentence: what closing this gap would unlock at the finding-level — NOT a re-summary of the question
  "priority": "critical" | "high" | "medium" | "low",  // how much this finding's depth depends on the answer; default 'medium'
  "whyAsked": string,                          // recognition-pattern: WHY does the walk think this gap can only be closed by the writer? Internal — not student-facing.
  "expectedAnswerShape": "scalar" | "short_phrase" | "specific_memory" | "list" | "narrative",  // what shape the answer is likely to take
  "consumers": string[],                       // which downstream layers will consume the answer — for L3 walk emissions, almost always ["l3", "l5"] (re-walk + coaching) and sometimes ["finding_maturity"] when the answer would mature the finding
  "populates": string[],                       // free-form tags naming what the answer will populate downstream — e.g., "groundTruthFacts.byLocation", "finding.evidence", "finding.deepeningPotential"
  "framingSeed": string                        // delivery-pattern seed: a short plain-language sentence the Conversator can polish and surface to the student. Not the final question — the *seed*.
}
```

## §4 — Recognition vs delivery (round 1.6 §7)

Two of the fields above split along the recognition/delivery line:

- **`whyAsked`** is *recognition* — the walk's internal honesty about why this gap can only be closed by the writer. Allowed jargon: "the finding's deepeningPotential cites a moment whose specifics aren't recoverable from the text," "this is a possession-grammar move that would land harder with a sensory-anchor," etc. The L3.5 / L4 / Conversator never surface this verbatim.
- **`framingSeed`** is *delivery* — the seed that will become the question the student sees. Plain language, no analytical jargon, no engineering vocabulary. Round 1.6 §2.5 + §10 forbid-list item 12 apply here. NOT "your essay exhibits subject-deferral grammar"; YES "you're describing the dancer at the start, but I want to hear what *you* were feeling watching her — not the way it looked, the way it felt to be the kid who couldn't move that way."

The Conversator polishes `framingSeed` into the student-facing question; the walk doesn't have to write the final question, just the seed.

## §5 — Plain-language calibration on `framingSeed`

The `framingSeed` is the LLM's draft of how the question would arrive in front of the student. Calibrate it against round 1.6 §2.5 + §3 Test 4:

**Wrong (jargon leak):**
- *"Your finding F12 has deepeningPotential — please specify the lived experience that grounds it."*
- *"Subject-deferral grammar in P1S2 invites a recovery of authentic interior at that moment."*
- *"Your possession-metaphor in P3 would benefit from a sensory anchor."*

**Right (plain coaching register):**
- *"You wrote that watching her dance was 'freeing' — but I want to know what *you* were feeling. Not how it looked. What did being the kid who couldn't move like that feel like, in your body, at that moment?"*
- *"You said your friends 'didn't get it' — what did one specific moment look like? A real conversation, where you can hear what they said?"*
- *"You described your grandmother as 'kind' — what's one thing she did that no one else's grandmother would do?"*

The seed names the student's actual line, the gap, and the angle. Three sentences max. No engineering vocabulary. No "your essay exhibits / your prose / your finding."

## §6 — Issue-and-approach calibration (round 1.6 §2.4 + §3 Test 3)

The seed must lead with the issue and the move, not with validation of what's already working:

**Wrong (validation padding — round 1.6 §5.7):**
- *"Your description of the dance is beautiful and full of vivid imagery. To take it even further, consider sharing what you were feeling…"*
- *"You've done a great job naming the emotion. Now help me ground it in a specific moment…"*

**Right (issue-and-approach):**
- *"You wrote that watching her dance was 'freeing' — but I want to know what *you* were feeling at that moment."*
- *"The emotion is named but not embodied. What did it feel like, physically, to be the kid who couldn't move like that?"*

If removing the seed's first sentence loses nothing important, the first sentence is filler. Revise to start with the second sentence.

## §7 — How to derive the emission from the walk's existing recognition

The walk already has the recognition machinery: every finding carries `deepeningPotential` (what further investigation could reveal) and `raisesQuestions` (questions for further investigation). These are the upstream signal.

A specifics-need emission is the *sub-set* of those recognitions where the answer can come ONLY from the writer.

**Decision tree:**

For each finding the walk produces:
- Is `deepeningPotential` populated?
  - No → no emission. The finding is mature enough as-stated.
  - Yes → continue.
- Among `raisesQuestions[]`, is at least one question that the text cannot answer (only the writer can)?
  - No → no emission. The walk's own re-reading or later paragraphs will close the gap.
  - Yes → continue. Pick the strongest question — the one whose answer would most concretely deepen the finding.
- Can you state the *approach* — what shape the answer will take, and what specific angle the question would take to get it?
  - No → no emission. A vague question without an angle is filler.
  - Yes → emit, with `whyAsked` naming the recognition and `framingSeed` carrying the plain-language coaching version of the question.

The walk's existing fields (`deepeningPotential`, `raisesQuestions`, the finding's `evidence` array, the finding's `claim`) are the source material. The emission is the structured, actionable distillation.

## §8 — Where in the L3 walk schema this lands

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

The wiring in `sequentialDeepWalk.ts` parses this array (if present) and writes it to `paragraph.understanding.specificsNeedEmissions` on the profile.

## §9 — Open design questions for round 1.5 (surface to Tue with the prompt)

These are questions where I have a working choice but want Tue's calibration before round 1.5 ratification:

1. **Should the emission cite the finding ID, or the finding's claim text?** Round 1 chooses claim text (more readable in audit; finding IDs are less stable across walks). If Tue prefers ID for downstream traceability, switch to `findingId` reference.
2. **Should `framingSeed` be one sentence or up to three?** Round 1 chooses up to three sentences (matches the corpus's coaching register where one sentence is too compressed). If Tue prefers strictly one-sentence seeds, will tighten and revise the examples.
3. **Should the L3 walk emit on EVERY finding with deepeningPotential, or only on findings where the writer's answer is the dominant unlock?** Round 1 chooses the latter (writer's-answer-dominant), which keeps emission count low and protects silence-is-signal. If Tue wants more emissions for richer queue, will widen.
4. **Default priority — should it be 'medium' or should the walk be asked to explicitly choose per emission?** Round 1 chooses explicit per-emission (forces the walk to think about how much the finding depends on this specific answer). If Tue prefers medium-default-with-override, will switch.

---

## Round-0 quality gate self-check (before surfacing to Tue)

Walking each test against this draft:

**Test 1 — Tailored swap.** Could this prompt's emissions appear word-for-word on a different student's essay? The seed format quotes the student's actual line and names the specific gap; the emission references the specific finding by claim text. Cannot swap. PASS.

**Test 2 — Purpose swap.** Could this prompt's emissions appear on an essay reaching for a fundamentally different purpose? §2's three trigger conditions and §6's issue-and-approach shape are essay-purpose-agnostic at the structural level (any essay can have a finding whose depth depends on the writer), but the *specific* seeds are anchored to the finding's claim, which is purpose-specific. The prompt's *thinking pattern* generalizes; the emission's *content* doesn't. PASS.

**Test 3 — Issue-and-approach.** Walk every example seed in §5 — does the first sentence lead with the issue or with validation? Each seed in §5 leads with the student's specific line + the gap, not with praise. PASS. The §6 contrast pair makes the discipline explicit. NOTED: Tue's calibration on §5 examples is in scope for round 1.5; the discipline is named but the example coverage may be thin.

**Test 4 — Plain-language.** Walk the seeds. "the kid who couldn't move like that," "what did being X feel like," "what's one thing she did that no one else's grandmother would do" — all high-school-readable, no analytical jargon. The `whyAsked` field intentionally allows recognition jargon (per §4 recognition/delivery split); that's not student-facing. PASS for student-facing, by-design for internal recognition.

**Test 5 — Disposition.** Does this prompt produce observations that generalize as portable dispositions for the student? The emissions don't directly produce student-facing teaching — they produce questions the Conversator surfaces. The coaching that comes back from the answer (downstream of D-2.2) is where disposition-portability fires. The prompt's job is to surface askable gaps, not to deliver portable dispositions. ARGUABLE PASS — the Conversator inherits the burden of disposition-portability.

**Verdict on self-check:** 4 PASS + 1 ARGUABLE PASS. The arguable one (Test 5) is where this prompt deliberately defers — it's a *question-surfacing* prompt, not a *teaching* prompt; disposition-portability fires at L5 / Conversator. Surfacing to Tue with this caveat for round 1.5 calibration.

---

## Round 1.6 forbid-list (13 items) walk

- Item 1 (closed character/word counts): none. PASS.
- Item 2 (length minimums on emissions): none — seeds are guidance ("up to three sentences max"), not gates. PASS.
- Item 3 (length minimums on questions): none. PASS.
- Item 4 (closed taxonomies on perception): the only closed enums are bookkeeping (sourceLayer fixed, expectedAnswerShape from the D-2.7 closed set, priority from the D-2.7 closed set, consumers from the D-2.7 closed set). None constrain LLM perception of the essay. PASS.
- Item 5 (banned-phrase regex): none. PASS.
- Item 6 (centrist defaults masking silence): the prompt's default is silence (§2 — most paragraphs produce zero emissions). No fallback question is invented when the gap is unclear. PASS.
- Item 7 (must-have-X rules): no rule that "every paragraph must emit at least one specifics-need." Silence is explicit default. PASS.
- Item 8 (numeric mandates): none. PASS.
- Item 9 (rubric-grading): none — the prompt produces emissions, not scores. PASS.
- Item 10 (validation-by-MUST): the §2 trigger condition is "ALL of these are true" — that's a precondition gate, not a validation requirement. The walk fails the gate by simply not emitting (silence), not by being told it FAILED. PASS.
- Item 11 (validation padding): the §6 contrast pair and §3 Test 3 pre-emptively close validation-padding leaks into seed text. PASS.
- Item 12 (analytical jargon leaking to student-facing): §4 recognition/delivery split + §5 seed examples + §3 Test 4 cover this. PASS.
- Item 13 (generalization shortcuts): the prompt's three trigger conditions generalize across all essay types and all finding types — no implementation lock-in to specific corpus moves. PASS.

13/13 forbid-list clean.

---

## Forward-looking RATIONALE.md anchors

When this prompt ratifies, the RATIONALE.md will explicitly cite:
- §2.4 + §3 Test 3 — silence is signal; emissions earn their spot via gap-and-approach (per D-2.7 audit forward-looking action item)
- §2.5 + §3 Test 4 — `framingSeed` plain-language discipline (per D-2.7 audit forward-looking action item)
- §7 — recognition (`whyAsked`) vs delivery (`framingSeed`) structurally split

Plus the per-prompt design choices in §9 with Tue's round 1.5 calibration captured.
