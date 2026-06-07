# L5 Experience Target

> **Step 1.5 deliverable.** What the student should see, hear, and feel when they open Uplift's feedback on their essay — derived from Tue's framing in this session, not from today's UI and not from the L5 redesign doc's surface sketch (focus-mode card / qualitative summary lede / deferred drawer / score accordion). Those are primitives. This document is the experience.

> **Standing.** The audit's `proposed consumer` and `verdict` columns are re-measured against this document. The L5 generation architecture (resolver + tiered Sonnet) is re-measured against this document. Any L5 design decision that this document's principles do not motivate is, by default, suspect. The principles are the yardstick.

---

## 1. The framing, in one paragraph

The student opens their feedback and feels that **the system has read their essay carefully**, **understands what they are trying to do**, **knows what is working and why**, **knows what is not yet working and why**, **offers them multiple legitimate paths forward at every point of friction**, and **scaffolds them toward becoming the student who could do this themselves on the next essay, the next paragraph, the next sentence**. Nothing said is generic. Nothing said is repeated. Every piece of guidance is tied to a specific moment in *their* essay, anchored to a specific principle, framed by a specific stake, and pointed at a specific way of working — and at every focus point, the student gets to choose which of several legitimate moves speaks most to them.

This is not "feedback." This is **integrated coaching at the granularity of one essay, scaffolded toward the student's autonomy.**

---

## 2. The seven teaching moves

Every focus point in the student's essay carries seven teaching moves, layered together. None of them is optional. Removing any one degrades the experience back toward today's L5 — annotated suggestions without the connective tissue that makes them land.

### Move 1 — **Why** (the principle)

Every suggestion explains the *principle* it embodies. Not "do this," but "this matters because [the principle]."

The principle is:

- **named** — drawn from the corpus's 190 craft moves, the 14 archetypes, the 75 issue patterns, the 11 anti-archetypes — by *name*, not paraphrase. "Grammatical subject displacement," not "your subject choice." "Plain-prose register against high-stakes scene," not "tonal mismatch."
- **explained at the level of *why it works*** — the mechanism. What happens in the reader's mind when this move lands. What goes wrong when it doesn't.
- **tied to evidence** — corpus citation. The named move appears in [source essay] at [paragraph] — quoted. Or the named anti-pattern appears across N reviewed admits with these specific failure modes.
- **register-matched** — at Foundation phase, the principle is structural ("the reader doesn't yet know what's at stake"); at Polish phase, it is sentence-level ("this passive verb is carrying load that an active verb would carry better"). Same essay, different register.

The principle is *what the student should still remember* if they forgot every other word of the feedback — because the principle transfers.

### Move 2 — **How** (the mechanics)

Every suggestion explains *how* to execute it — concretely, in mechanics the student can follow. Not "tighten this opening," but: "the opening currently does three things in two sentences — names the place, names the action, names the feeling. Try doing one. Pick which of the three carries the most weight for the reader, and let the other two emerge in the next two sentences."

Mechanics are:

- **operationalized** — the student knows what to do, in what order, with what to attend to.
- **non-prescriptive on the *what*** — the mechanics are *how to find your version*, not *the version we wrote for you*. A rewrite example may appear (per Move 4 — Iteration), but the mechanics live above it: "the *kind* of move this is; here's how that kind of move works; here's what to attend to as you try it."
- **at the right granularity** — sentence-level mechanics for sentence-level fixes; paragraph-level mechanics for paragraph-level fixes; structural mechanics for structural fixes. Mismatching granularity (sentence-level mechanics for a structural problem) is itself a failure.

### Move 3 — **Internalization** (transfer to autonomy)

Every suggestion is framed so the student walks away **able to apply it themselves** to the next paragraph, the next essay, the next sentence — without the system. The transfer signal is:

- **the principle name they can hold onto** (Move 1), so they recognize the same shape when it appears elsewhere
- **the mechanics they can follow** (Move 2), so they have a procedure
- **the diagnostic question** that lets them ask themselves "is the same thing happening over here?" — for example, "where else in your essay does the reader not yet know what's at stake?" — pointing them at adjacent paragraphs without naming them
- **the *generalizable lesson*** stated explicitly — "openings often try to do too much because the writer is afraid of being unclear; clarity comes from picking what to lead with, not from front-loading"

The system *is* trying to put itself out of a job for this student over the arc of their writing. That intent is felt — without being stated as such.

### Move 4 — **Iteration** (try, miss, adjust)

Every suggestion supports the student in **trying it themselves**, **missing**, **adjusting**, and **trying again**, with the system's role being supportive, not evaluative. Concretely:

- The student can attempt a rewrite and submit it for read.
- The system reads what they wrote, against the principle (Move 1) and the mechanics (Move 2), and gives a *response* — not a grade. "What you have now lands the place but the action is still doing two things; consider which one matters more to the next paragraph." Or: "this lands. The reader is in the scene by sentence two."
- "Lands" is decided **by the student**, not the system. The system can name when its diagnostic concern has been addressed; the student decides whether the move now feels like *theirs*. The student can keep iterating past the system's "this works" if they want to push further.
- Iteration loops are cheap (selective carry-forward — see §6) so the student can iterate as many times as they want without friction.

The L5 *output* contains the seeds of the iteration loop (the principle, the mechanics, the diagnostic, a rewrite example as one possible target — see Move 6 on multiplicity); the iteration *loop* (when it fires, what it carries forward, how it judges) is detailed in `L5_ITERATION_LOOP_DESIGN.md` (forthcoming, parallel investigation in flight).

### Move 5 — **Connection** (across the essay)

Every suggestion **points outward** — to other moments in *this essay* where the same shape, the same principle, the same opportunity, or the same failure mode appears. Examples of the kind of connections L5 must make:

- "Remember in P2 you established the smell of grease as a sensory anchor. P5 reaches for it again and almost lands — here's the missing half-sentence."
- "The pattern you have in P3 (a question the narrator asks themselves and answers in the next sentence) is a load-bearing rhythm in this essay. Don't lose it in revision. P4 needs it too — right after the pivot."
- "The voice register you found in P3 — plain, declarative, almost flat — is what makes the moment land. P1 currently fights it. The redesign question is whether to bring P1 down to P3's register, or to make the shift between them intentional."

Connections come from the L3 walk's `newConnections[]`, the L3.75 `entanglements[]`, the cross-paragraph patterns in L4, and from L5's own synthesis. The student should feel that the system is **reading the essay as a whole**, not as a list of paragraphs.

A connection without a teaching purpose is fluff. Every connection ties to a Move 1 (principle), a Move 2 (mechanics), and a Move 7 (contribution).

### Move 6 — **Multiplicity** (divergent paths, the student chooses)

This is the move that most violates today's L5 and the redesign doc's "Tier 2 picks the top three" framing. Every focus point — every place the system would otherwise produce *one* rewrite or *one* suggestion — surfaces **multiple legitimate paths forward**, each substantively different from the others, each cited from a different exemplar where possible, each named, each carrying its own framing.

Concretely, at a single sentence the system might offer:

- **Path A — frame as scene.** "The current sentence summarizes; you could land us in scene instead. Here's how scene-landing works (Move 2). Citation: [MOVE-12] Sondheim P3. This path raises the stakes of P2 by giving the reader a body in space."
- **Path B — frame as voice-shift moment.** "The current sentence is a register-shift opportunity that the essay isn't taking yet — going *plainer* here would echo the discipline of P3. Citation: [MOVE-grammatical-subject-displacement]. This path threads voice through the structural pivot."
- **Path C — frame as memory introduction.** "Or, the current sentence can introduce a memory that supplies the reader the context P4 will need. Citation: [MOVE-flashback-as-anchor]. This path saves you a sentence in P4 — which is currently doing too much."
- **Path D — frame as question.** "Or, the current sentence becomes a question the rest of the paragraph answers. This is structurally the riskiest; it works only if the answer in P3 lands harder than it currently does."

Each path is **substantively different** — different mechanism, different stakes, different feel, different downstream consequences for the rest of the essay. The system *resists convergence*: if all four paths come back rhyming with each other, that's a failure signal, not a confidence signal.

The student picks. The student may pick none — none may be right; the student's own move may be the answer. The system makes that explicit: "these are paths the corpus shows work for moments like this; what you do with this sentence is yours."

**Two tiers of multiplicity:**

- **Lateral options** live inside the focus-point itself. Different ways to frame *this* sentence, *this* paragraph. Source: MOVE_DEPENDENCIES (lateral move suggestions), CONTEXTUAL_VALIDITY_PATTERNS (different contexts that recast the same craft choice), DELIBERATE_ABSENCES (what *not* doing also offers).
- **Architectural options** live in a separate "different shape" surface. Different ways to frame *this section* or *this essay overall*. Source: ESSAY_ARCHETYPES (alternative architectures), ANTI_ARCHETYPES.transplantPath (where the current shape isn't working, what corpus shows works instead), the L4 northStar.trajectory.plausiblePaths[].

Multiplicity at architectural scale is rarer (an essay isn't reframed every revision) but appears at clear pivot points — usually after the first revision when the foundation is in place but the structural shape is still up for grabs.

### Move 7 — **Contribution** (architectural stake)

Every suggestion explains **what this move contributes to the essay overall** and **how it gets the essay closer to what it's trying to do**. Not "this is a better sentence," but "*this raises the stakes of your opening, which is what makes P4 land*" or "*this fix protects the voice you established in P3 from being broken when the structural pivot hits in P5*."

Contribution is:

- **architectural** — the suggestion is justified by what it does for the *whole essay*, not just for the local moment.
- **causally explicit** — the chain "if you make this change, then [X] becomes possible" is named. Most suggestions are leaf moves on a dependency tree; the student should feel the tree, not just the leaves.
- **tied to the North Star** — the L4 `northStar` map exists for this. The contribution names which through-line element the suggestion advances, which structural role it strengthens, which distinctiveness factor it deepens.

The student should be able to read any focus item and answer the question "if I do this, what happens to my essay?" — without having to guess.

---

## 3. The non-repetition contract

The most important principle. Without this, the seven moves layer into noise. Stated as a hard contract:

> **No two pieces of guidance the student reads in a single feedback session may carry the same teaching weight.** Every piece must contribute *unique purpose*, *unique evidence*, *unique stakes*. Generic teaching, register-drift teaching, and "show don't tell" teaching that could apply to any essay is *forbidden*.

Concretely, this means:

- **No principle named twice across the essay's feedback in the same session**, unless the second naming is *deepening* the first ("you saw this principle in P2 — here's what its more demanding form looks like in P5"). Naming the same principle twice as parallel observations is *redundancy* and treated as a failure.
- **No two divergent paths within a focus point may be paraphrases of each other.** If Path A and Path B describe the same move with different words, one is dropped.
- **No two focus items in the focus surface may be the same shape of teaching applied to different paragraphs.** "P2 needs to land in scene; P5 needs to land in scene" is *one* focus item with two locations, not two focus items.
- **No suggestion may be teachable from a generic essay-writing source.** "Use sensory detail" is not a suggestion. "The smell of grease in P2 is the only sensory anchor in this essay; P5's resolution would land harder if you reached for a sensory anchor of comparable specificity — here are three possibilities the essay's existing material supports" is a suggestion.
- **No restating of what the student wrote.** Description-back ("you describe the kitchen and your father's hands") is forbidden. Every observation either *judges*, *teaches*, or *connects* — descriptive observations live at L1, not at L5.

The non-repetition contract is enforced **at composition**, not at filtering. The Tier 2 synthesis pass (or whatever architectural mechanism owns top-N selection) must be prompted with the contract explicitly. A post-generation Haiku check compares pairs of focus items and pairs of paths within a focus item for paraphrase-rate, and re-runs synthesis once if the rate exceeds a threshold. Soft-flag, not delete (per LLM-first Rule 4 — quality lives at the prompt, not at regex).

---

## 4. The student journey

What the student actually experiences, in order, with timing.

### 4.1 First thirty seconds — orientation

The student opens the feedback. The first thing they see is **the lede** — one or two sentences that name what is most alive about their essay, anchored to a specific moment and cited from the essay text. Not a score. Not a grade. A read.

Examples of the right shape:

- "Your opening lands the reader inside the kitchen by the second sentence, and the smell of grease in P2 carries that anchoring forward — but the resolution in P5 reaches for a structural payoff the middle of the essay hasn't earned yet. The work this revision is asking for is in P3 and P4."
- "The voice you found in P3 — plain, declarative, almost flat — is doing the load-bearing work of this essay. P1 currently fights it; P5 currently abandons it. The redesign question is whether to bring everything to P3's register, or to make the shifts intentional."

After the lede, the student sees **what's been earned this revision** (if there's prior state) — concrete, cited progress. "Your opening hooks much harder now; here's the sentence that made the difference." This is *only* there if the student has iterated; on first pass, it's absent.

After that, the student sees the **focus surface** — the small number of areas the system is asking them to attend to *this revision* — and a sense that there is more in reserve, which they can look at when they're ready.

The **score** is in an accordion, collapsed by default. Numbers exist; they are not the lede.

### 4.2 The next five minutes — focus engagement

The student picks a focus point (or the system suggests starting with one). On engagement, they see:

- **The principle** (Move 1) — named, explained, cited from corpus.
- **The mechanics** (Move 2) — concrete, operationalized.
- **The contribution** (Move 7) — what this changes for the essay.
- **The connections** (Move 5) — where else in the essay this matters.
- **The paths** (Move 6) — multiple legitimate moves they could try, each cited and framed.

The student can:

- **read and move on** — internalizing what they read, without writing yet.
- **pick a path and try** — choose Path A (or B, or C, or none-of-the-above), and attempt their own version.
- **ask the system a question** — "what if I tried [their idea]?" — and get a response that engages with their idea, not deflects to the system's paths.

The student is in control of pace. The system *does not* push them through the focus surface; it presents, and waits.

### 4.3 The iteration loop — try, read, adjust

The student attempts a rewrite. They submit it. The system reads.

The iteration response is **specifically not** a fresh full-pipeline pass at full cost. The system carries forward the priors that are still valid (voice profile, North Star, score-band anchors, the non-edited paragraphs' analyses, the findings that haven't been superseded), and re-derives only what the edit actually changed. The cost savings on iteration are reinvested in *deeper teaching on the changed parts* — richer exemplar retrieval, deeper connection mapping to surrounding context, more careful diagnosis of whether the change *landed against the prior critique's intent*.

Iteration response shape:

- **Did this land?** The system names whether the diagnostic concern has been addressed. Not a grade — a *read*. "What you have now lands the place but the action is still doing two things." Or: "This lands. The reader is in the scene by sentence two. Whether it's the version you want is yours."
- **What this opens up.** When a focus item lands, the system surfaces what becomes possible next. "With P2 landing, P4's resolution has the runway it needs." This is the dependency-chain unlock from L4 `coachingMap.priorities[].unlocksNext`, surfaced inline.
- **What's next.** The student returns to the focus surface; the focus surface is updated — landed items move to a *learned* state (cited but not re-taught), unaddressed items remain, and any items the edit *revealed* (problems the prior version was hiding) appear new.

Iteration is *fast*, *cheap*, and *deepening*. The student should feel the system is **getting to know their essay better** with every iteration, not resetting.

### 4.4 The "I'm done" moment

There is no system-imposed "done." The student decides. The signals the system surfaces to support the student's own judgment:

- **What the essay is doing now**, qualitatively — a fresh lede that names the current state.
- **What the essay isn't doing yet** — the deferred surface, with honesty about whether those items are *worth pursuing* given how far the essay has come, or whether they are diminishing-returns work the student doesn't need to do.
- **What this essay is, in admissions terms** — the L3.75 `admissionsPositioning` read, surfaced honestly. Not a score; a reading. "This essay is doing X well; the reader will leave with Y; the kind of student it positions you as is Z."

The student leaves the session with a **read of where their essay is**, not a verdict. The verdict is theirs.

---

## 5. The surfaces — derived from the moves and journey

> **[NOTE — L3.75 absorption applies. Per [`L3-75/L3_ABSORBS_L3_75.md`](../L3-75/L3_ABSORBS_L3_75.md) (APPROVED 2026-04-25), the L3.75 layer is being retired and its work absorbed into L3 lenses (Voice / Meaning / Story / Admissions) + L3 Pass 3 + L3.5 (contradictionFlags, essayStrengthSignatures) + L4b (pairedImprovement). The fields referenced in surface input lists below — `voiceIdentity`, `voiceMap`, `thematicArchitecture`, `narrativeStrategy`, `admissionsPositioning`, `momentEarnednessMap`, `entanglements`, `emotionalTopography`, `craftAssessment.*` sub-fields — still exist; their layer-of-origin changes. Mechanisms that operated on "the L3.75 layer as a callable" are re-mapped per the table at [`cross-cutting/L5_AND_MASTER_RECONCILIATION.md`](../cross-cutting/L5_AND_MASTER_RECONCILIATION.md) §R-2.]**

The seven moves and the journey above motivate the following surfaces. Some survive from the redesign doc; some do not; some are new. Each surface has explicit input contracts that tie back to the audit.

### 5.1 The lede

Single bounded surface. One or two sentences naming what is most alive about the essay, plus one or two sentences naming the work this revision is for. Cited.

- **Inputs (audit references):** L4 `coachingMap.transformativeInsight` (lede candidate per redesign §2 italics), L3.75 `admissionsPositioning.tellabilitySummary`, L3.75 `voiceIdentity.signature`, L4 `northStar.distinctivenessSignature.articulation`, L4 `coherenceReport.northStarAssessment` (if available — the irreplaceability test).
- **Generation:** Tier 2 synthesis pass owns the lede. Inputs above are signal sources; the prose is LLM-generated against the non-repetition contract.
- **Acceptance test:** read in isolation, the lede must (a) name something specific to *this* essay (corpus-cited or text-cited), (b) avoid score language, (c) name what the student should attend to in this revision.

### 5.2 The progress strip (iteration only)

Surface that appears only on iteration N>1. Names what's been earned this revision. Cited per item.

- **Inputs:** carry-forward state — the prior `taughtMoves[]` ledger (what was taught last turn), the diff against the new analysis (which prior critiques the edit addressed), the score-trajectory delta on dimensions where it's significant.
- **Generation:** Tier 2 synthesis, given the carry-forward state, names 1–3 concrete progress items. Each cites the sentence that made the difference.
- **Acceptance test:** every progress line names a specific sentence or move, attributed to the student's edit, with the principle it embodied.

### 5.3 The focus surface

Where the seven moves live, layered per focus point. Several focus points (3–7 typically; *not* a hard top-3 cap, see §7 below). Each focus point is its own card, with all seven moves expressed.

- **Inputs (audit references, partial — full list in audit's `proposed consumer` column):**
  - **Principle (Move 1):** L3.5 `patternMatches[]` + `symptomType` resolved at L5, L3 `newFindings[]` resolved as `[F-#]`, corpus `TOP_TIER_CRAFT_MOVES` resolved as `[MOVE-#]` with `MOVE_EXCERPTS` exemplar.
  - **Mechanics (Move 2):** the issuePatternIndex's full fix-strategy template at `src/services/piq/issuePatterns.ts`, paired with corpus move's `mechanism` field.
  - **Internalization (Move 3):** Tier 1 generation against the "the student can apply this elsewhere" prompt instruction.
  - **Iteration (Move 4):** the rewrite example exists per Move 6's path multiplicity, but the *response* to the student's attempt is the iteration loop's job.
  - **Connection (Move 5):** L3 `newConnections[]`, L3.75 `entanglements[]`, L4 `scoreMatrix.crossParagraphPatterns[]`.
  - **Multiplicity (Move 6):** lateral options from `MOVE_DEPENDENCIES.enables[]`, `CONTEXTUAL_VALIDITY_PATTERNS`, `DELIBERATE_ABSENCES`; architectural options from `ESSAY_ARCHETYPES`, `ANTI_ARCHETYPES.transplantPath`, L4 `northStar.trajectory.plausiblePaths[]`.
  - **Contribution (Move 7):** L4 `coachingMap.priorities[].architecturalReason`, L4 `coachingMap.priorities[].unlocksNext`, L4 `northStar.structuralRolesMap[].weight`, L4 `coachingMap.protectedStrengths[].whyProtect`.
- **Generation:** Tier 1 produces per-paragraph annotations carrying all seven moves; Tier 2 synthesizes across paragraphs and selects, ranks, and composes the focus surface against the non-repetition contract.
- **Acceptance test:** every focus point answers all seven moves substantively and uniquely.

### 5.4 The connection map

A separate, persistent surface. Visualizes the cross-paragraph fabric of the essay — the threads, the echoes, the load-bearing relationships. This is *not* a deferred drawer; it is a **standing read of the essay as a whole**, available throughout the session.

- **Inputs:** L3 `newConnections[]`, L3.75 `entanglements[]`, L3.75 `thematicArchitecture.threads[]`, L4 `northStar.throughLineMap.journey[]`, L4 `northStar.structuralRolesMap[]`.
- **Generation:** mostly deterministic — the connections exist as data; Tier 0 hydrates them with prose summaries pulled from the upstream layers, and Tier 1/2 augments with focus-relevant emphasis.
- **Acceptance test:** the student should be able to point at any paragraph and see what it is connected to and what those connections *do* in the essay.

### 5.5 The "different shape" drawer

Architectural multiplicity (Move 6's second tier). Different ways the essay overall could be structured. Surfaces only when there is a substantive alternative the corpus supports.

- **Inputs:** `ESSAY_ARCHETYPES` (full set), `ANTI_ARCHETYPES.transplantPath` (where current shape is failing, what corpus shows works), L4 `northStar.trajectory.plausiblePaths[]`, `VOICE_ARCHETYPE_COMPATIBILITY` (filters which alternative shapes are compatible with the student's established voice).
- **Generation:** Tier 2 synthesis decides whether to expose this surface this turn. On iteration N>1, this surface is *less* likely to fire (architectural decisions usually settle by iteration 2 or 3). On first pass with a structurally weak essay, it is *more* likely to fire.
- **Acceptance test:** when fired, it offers 2–3 substantively different architectural alternatives, each with what would change, what would stay, and a transplant path.

### 5.6 The voice anchor

A small persistent surface that names the student's voice as *the system reads it* — register, distinctive patterns, what is authentic, what is performed. This is the surface that makes the student feel the system *knows their voice*; it grounds every other surface (so when the system suggests a path, the student can ask "is this me?" and the voice anchor tells them).

- **Inputs:** L3.75 `voiceIdentity.{signature, primaryRegister, distinctivePatterns, voiceMarkers, authenticVsPerformed}`, L3.75 `voiceMap.{vocabularyFingerprint, sentenceRhythm, perspectiveDistance, tonalDisposition}` — most of which the audit has currently marked "no consumer found" and which the redesign should rewire here.
- **Generation:** Tier 0 deterministic synthesis from the L3.75 fields into a 3–4 sentence prose surface plus a short list of "voice markers" (things the student does that are theirs).
- **Acceptance test:** when the student reads the voice anchor, they should recognize themselves — not the system's projection of them.

### 5.7 The score accordion (collapsed by default)

The L4 score matrix, exposed for students who want it. With band anchors — calibration excerpts that show what an 80 looks like vs. a 90 in this dimension — pulled from `MOVE_EXCERPTS` filtered by `(dimension, band)`.

- **Inputs:** L4 `scoreMatrix.paragraphs[]`, L3.5 `essayAuthenticityTier`, L3.5 `narrativeQualityIndex`, `MOVE_EXCERPTS` filtered.
- **Generation:** mostly deterministic; the band-anchor pairing is a precomputed index lookup.
- **Acceptance test:** the score accordion never *leads* the experience but is honest when expanded.

### 5.8 The deferred surface — re-cast

The redesign doc's "deferred drawer" stays but is re-cast. **It is not "the things we cut from top-3."** It is **"the things we noticed but that aren't the right work for *this revision* given where the essay is."** Each deferred item carries enough state (diagnosis + principle + evidence + citations) to be promoted into focus when the student is ready, but the framing the student reads is "*not now, here's why*," not "*we ranked these lower*."

- **Inputs:** Tier 2's overflow of focus candidates, with deferred-rationale ("why not this revision") generated per item.
- **Acceptance test:** every deferred item has a *reason it's deferred*, and the student can promote it to focus on the next revision.

### 5.9 The iteration response (iteration only)

When the student submits a rewrite, the response surface. Carries the "did this land" read (per §4.3), the "what this opens up" surface, and the updated focus surface.

- **Inputs:** carry-forward state + selective re-derivation per the iteration loop design (forthcoming).
- **Generation:** to be specified by `L5_ITERATION_LOOP_DESIGN.md`. The experience target's contract on this surface: it must feel *deepening*, not *resetting*.

### 5.10 The conversator seam

Throughout, the student can ask the system questions in natural language. The system responds at the granularity the question deserves — small clarifications get small responses; substantive challenges get substantive responses; "what if I tried [their idea]" gets engaged with on its own terms.

The conversator (L6) is *not* an addendum to L5. It is the **medium through which all of L5's surfaces are explored**. The surfaces above are *what L5 produces*; the conversator is *how the student moves through them*.

This document leaves the L6 design out of scope but specifies the seam: every surface above must be addressable by L6 (the student can ask about any of it), and every L5 output must include enough state for L6 to ground its responses without re-deriving (citations, principle names, mechanic structure, contribution causal chain).

---

## 6. The selective carry-forward principle (placeholder for iteration design)

Per the parallel investigation in flight (`L5_ITERATION_LOOP_DESIGN.md`), the iteration loop carries forward only what is **effective**, **best**, and **expensive-to-re-derive**. Drops what didn't land, what was superseded, what's stale.

The dual purpose:

1. **Quality booster and deepener** — the system reads the essay with N-iterations of accumulated understanding, not from scratch. The student feels continuity, not amnesia.
2. **Cost and resource optimization** — savings from valid carry-forward fund deeper teaching where the edits actually demand fresh thinking. Cheap iterations don't *just* save money; they *redirect* the saved budget into richer exemplar retrieval, deeper connection mapping, more careful diagnosis on the parts that changed.

This experience target depends on the iteration loop design landing both halves correctly. If iteration is expensive, the student iterates less, the journey collapses to "feedback once and submit." If iteration is shallow, the experience flattens to "feedback ranked, repeated each turn." Both are failure modes.

The experience target's contract on the iteration loop:

- The student should feel the system *is reading their essay better each turn*, not the same way each turn.
- The student should be able to iterate as many times as they want without friction.
- The system should never re-teach a landed lesson (per the non-repetition contract, which extends *across* turns, not just within one).

When `L5_ITERATION_LOOP_DESIGN.md` returns, this section is replaced with a precise specification of what carries forward, what re-derives, and how saved budget redirects to deeper teaching.

---

## 7. Where this document overrides the L5 redesign doc

The redesign doc (`docs/L5_FEEDBACK_REDESIGN.md`) is mostly compatible with this experience target, but the following commitments are **changed**:

### 7.1 The "exactly three focus items" cap is wrong

The redesign doc (§3.2, §7.2) commits to *exactly three focus items* as an operational cap, citing Sommers / cognitive load research. That cap is wrong as stated. The right principle:

- **The number of focus items is determined by the essay**, not by a fixed cap. A clean essay at polish phase may have 1–2 genuine focus items; a structurally unfinished essay at foundation phase may have 4–7 substantive ones (and force-trimming to three would silence real teaching).
- The cap that *is* operational: **no two focus items may be redundant** (per the non-repetition contract). The set is naturally small because redundancy is forbidden, not because the system arbitrarily stops at three.
- The deferred surface still exists; items go there when they are *not the right work for this revision*, not when they fail a top-3 lottery.

The "implementation rates drop after 2–3 focus areas" research is a real signal but it points at *cognitive load on the student*, not at *the system arbitrarily capping output*. The experience target solves cognitive load through the focus surface's design (one card at a time, the student paces themselves) and through the deferred surface's framing (these aren't ranked-lower; they aren't this revision's work). Not through a hard top-N.

### 7.2 Coaching mode and rewrite mode are not toggles

The redesign doc (§6.1) treats coaching and rewrite as two views of one body, with mode selection happening upstream of L5. The experience target rejects the binary:

- Every focus item carries **both** the principle/mechanics/diagnostic *and* multiple rewrite paths (Move 6 multiplicity).
- The student is not "in coaching mode" or "in rewrite mode." They are working on their essay, and at every focus point, they have access to both *the teaching* and *the paths*.
- The "default mode" decision dissolves. Rewrite paths are not the default form of feedback; they are *one of* the resources surfaced at each focus point, alongside the principle and the mechanics. The student picks which to engage with.

This eliminates the "Q1 default-mode" open question in the redesign doc.

### 7.3 The qualitative summary is a lede, not a section

The redesign doc (§3.2) frames the qualitative progress summary as a four-field structured surface (lede, achievementsThisRevision, remainingGap, scoreSection, authenticityTier). The experience target collapses this:

- The **lede** is its own surface (§5.1).
- The **progress strip** is its own surface (§5.2), iteration-only.
- The **remaining gap** is dissolved into the focus surface — there is no "what's remaining" prose summary; the focus surface *is* what remains.
- The **score section** is the score accordion, separate (§5.7).
- The **authenticity tier** lives in the lede when it matters; it is not a fixed sub-field.

### 7.4 The "corpusUnanchored: true" affordance is too system-centric

The redesign doc surfaces corpus-unanchored items with UI dimming (Q3 in the open questions). The experience target rejects this as a leak of internal state:

- The student does not need to know whether a citation is anchored. They need to know **whether the principle being taught is real**. Citation is the spine for the *system*'s grounding; absence of citation is the system's signal that the teaching is more speculative — and that should affect *what the system says*, not how the UI renders it.
- If a focus item has no citation, the system writes its prose more carefully ("we're noticing a pattern that the corpus doesn't have an exact analogue for, but the principle holds because…") — not dimmer.
- Citation is the system's discipline, not the student's UX.

### 7.5 The "PROVISIONAL Hopkins-pending" is the system's problem, not the student's

The redesign doc (Q5 in open questions) asks whether to surface PROVISIONAL markers to the student. The experience target answers: **no.** PROVISIONAL is corpus-version state, not student-relevant information. The system either has confidence in its read or it doesn't; if it doesn't, the prose says so without inheriting internal corpus markers verbatim.

### 7.6 The five mile markers reorder

The doc's M1→M7 sequence stands for the implementation, but M5 (UI rendering) is no longer downstream. Surfaces are derived from the experience target, not from "what the existing annotation-v2 components support." M5 becomes parallel to M2/M3 — UI surfaces are designed against this document, components rebuilt where existing ones don't fit, and L5 generation and UI rendering converge on the same target rather than UI inheriting whatever L5 emits.

---

## 8. The non-negotiables

These are the experience principles that, if violated, mean the experience fails *regardless of any other metric*. They override cost, latency, and prompt-engineering convenience.

1. **Zero generic teaching.** Every piece of guidance must be tied to a specific moment in the student's essay, anchored to a specific principle, framed by a specific stake. "Use vivid imagery" is not a piece of guidance; it is a leak of laziness.

2. **Zero unmotivated suggestions.** Every suggestion must answer Move 1 (why this matters) and Move 7 (what this contributes to the essay). A suggestion that lacks either is a suggestion the system doesn't actually understand the purpose of, and it should not ship.

3. **Zero suggestion without an internalization path.** Every suggestion must answer Move 3 (how the student can apply this themselves elsewhere). A suggestion without transfer is a suggestion that creates dependency, not autonomy.

4. **Zero repetition.** Per §3, the non-repetition contract. Including across iteration turns.

5. **Zero convergence pressure.** Move 6 multiplicity is non-negotiable. The system's job is to surface paths and let the student choose, not to converge on the "best" one.

6. **Zero verdict language.** The system reads, names, teaches, scaffolds. It does not grade, judge, rank-on-quality, or pronounce-good-or-bad. Numbers exist (in the accordion) but never lead. The student decides when their essay is done.

7. **Zero amnesia across iterations.** The selective carry-forward design must hold; each iteration must feel deepening, not resetting.

8. **Zero leak of internal state.** The student does not see citation-anchoring booleans, PROVISIONAL markers, model confidence levels, fabrication-flagged citations, prompt-engineering scaffolding, or any other internal-system metadata. The student sees an experience.

These eight are the contract. Every L5 design decision below them is negotiable.

---

## 9. The audit's verdict column, re-measured

The L5 consumption audit (`docs/L5_CONSUMPTION_AUDIT.md`) was written with `proposed consumer` and `verdict` columns anchored partially in today's UI. With this experience target as the new yardstick, several rows must be re-examined:

- **Voice surface rewires** (rows 51, 53, 60–65, 94 — all the L3.75 voice and characterRevelation fields the audit marked `rewire` to "T1 prompt — voice anchor") now have a *concrete persistent surface* (§5.6), not just a prompt slot. Their rewire targets sharpen.
- **`momentEarnednessMap` fields** (rows 72–75) — now clearly load-bearing for Move 7 contribution framing and Move 6 multiplicity (the `gaps[]` field literally enumerates "what would need to be added to earn this moment" — exactly the multiplicity-path source).
- **`L5Annotation.northStarConnection`** (row 229) — currently consumed only by a grounding diagnostic. Under this experience target, it is **the** Move 7 contribution surface input. Verdict moves from "keep (load-bearing teaching field)" to "keep + central to Move 7."
- **The cut bucket of L5 telemetry-only outputs** (rows 225, 228, 232, 237, 238, 239, 240, 246) — still cut. None of them serves any of the seven moves.
- **The "exactly three" Tier 2 framing** — this experience target challenges it (§7.1). The audit's references to "T2 → top-3 focus" need to be rewritten as "T2 → focus surface, sized by essay, redundancy-forbidden."
- **The "deferred drawer" framing** — this experience target re-casts deferred (§5.8). The audit's `T2 deferred drawer` rewires need re-framing as "not-this-revision," not "ranked-lower."
- **The four manifest fields** (essaySpecificDemo / demonstration / technique / stakes — rows 230, 233, 234, 236, 241–242) — re-examined. They reach today's UI. Whether they reach the *right* student experience: only `stakes` cleanly maps to Move 1's "stake-framed" requirement; the others are adequate inputs for the focus surface but the surface itself isn't the manifest. The redesign's adapter has to translate L5 output into the focus surface's input shape — not into the manifest. Manifest existence as a downstream consumer is not the same as student-experience adequacy.

The audit will be revised in a second pass that incorporates this document's surfaces and contracts, and the revised verdicts presented for sign-off together with the experience target.

---

## 10. Open questions for Tue

These are real product/architectural calls that this document leaves undecided. Each has multiple defensible answers; the experience target's contract holds regardless of the answer to each.

### Q1. Lede generation seam — Tier 2 or its own pass?

Tier 2 synthesis owns ranking and the focus surface. The lede is its own register (qualitative, holistic, voice-aware). It may benefit from being a *separate* small Sonnet pass that reads only the L3.75 holistic + L4 northStar + carry-forward state — and is unconcerned with focus-item ranking. Cleaner separation, marginal cost (~$0.005). Or fold into Tier 2 and trust the synthesis prompt to differentiate registers. Cleaner architecture, riskier prose. **Decision needed.**

### Q2. Multiplicity path count — fixed or essay-dependent?

§5.3 specifies "multiple legitimate paths" without committing to a number. Realistic ranges: 2 minimum (binary choice is still choice), 4–5 maximum (more becomes overwhelming). Should the count be fixed (always 3, say) or essay-dependent (the system surfaces as many genuinely-different paths as the corpus supports for that focus point, with a soft cap of 5)? **Decision needed.**

### Q3. The connection map — visualized or prose?

§5.4 specifies a "connection map" as a persistent surface. The shape is open: an actual graph visualization (paragraphs as nodes, threads as edges, with weights), or a prose narrative ("this essay has three threads: A, B, C; A appears in P1, P3, P5; B appears in P2 and is echoed in P5"), or both at different zoom levels. The graph is more inspectable; the prose is more readable. **Decision needed.**

### Q4. The "voice anchor" — when does it appear?

§5.6 specifies a small persistent voice anchor. Open: does it appear *throughout* the session (always-visible top-of-screen surface), *on demand* (a "what is my voice" button), or *contextually* (auto-surfaces when a focus item involves voice)? **Decision needed.**

### Q5. The "different shape" drawer firing condition

§5.5 specifies it fires "when there is a substantive alternative the corpus supports." The judgment of "substantive" is the open question. Options: (a) LLM judges per turn — surfaces when it has a real architectural alternative to offer. (b) Phase-conditioned — fires automatically at foundation phase, never at polish. (c) Friction-conditioned — fires when the score-trajectory is flat across iterations (the current shape isn't working). **Decision needed.**

### Q6. The conversator (L6) and L5 — composed or layered?

§5.10 describes L6 as "the medium through which all of L5's surfaces are explored." Open: is L6 a *re-derivation* layer (reads L5's output and engages student in conversation about it, sometimes calling back into the pipeline), or is L6 a *composition* layer (L5 produces structured surfaces; L6's prompt explicitly references those surfaces and grounds responses in them, no re-derivation)? The first is more flexible; the second is cheaper and more coherent. **Decision needed.**

### Q7. The "I'm done" surface — system-suggested or student-only?

§4.4 says "the student decides; the system does not impose 'done'." But the system can *offer signals* — "your essay is in a clean state; further work would be diminishing returns" — without imposing. Open: how strong should those signals be? Silent (the student feels done because nothing in the focus surface is alive)? Soft ("the focus surface is mostly cited as 'protect; don't damage' — you're in a different mode now")? Explicit ("based on the dimensions and the corpus comparison, this essay is at the upper band; further iteration is yours to choose, not ours to push")? **Decision needed.**

### Q8. Iteration loop carry-forward boundaries

The full design lives in `L5_ITERATION_LOOP_DESIGN.md` (in flight). But one boundary question is for Tue: when the student edits a paragraph in a way that ripples to other paragraphs (e.g., introduces a new image in P2 that shifts the meaning of P5), does the system *automatically* re-read P5 (cost: more re-derivation, less carry-forward saved), or does it *flag* the ripple to the student ("your edit in P2 may affect P5 — want me to re-read?") and let them choose? The first is more thorough; the second respects the student's pace and cost-recovery. **Decision needed.** (This question lives here, not in the iteration design doc, because the answer is experience-shape, not architecture.)

---

## 11. What this document is not

- It is not a prompt-engineering document. The Tier 1 / Tier 2 prompts that produce these surfaces are downstream artifacts; this document is the *contract* the prompts must satisfy.
- It is not a UI specification. Surface shapes are named (lede, focus card, connection map, voice anchor, score accordion, deferred surface, iteration response); their visual rendering, layout, and interactive affordances are downstream of this document, not in it.
- It is not a cost model. Cost lives in the iteration loop design and the audit. This document specifies what the experience must *be*; the cost trajectory must support it, but the experience target does not negotiate against cost. Cost-recovery from the iteration loop's selective carry-forward is what *makes* this experience target affordable; the loop design must deliver.
- It is not a measurement plan. Metrics for whether the experience target is being met (citation rate, non-repetition rate, multiplicity rate, internalization signal, iteration-deepening signal) are downstream and will be specified together with the revised audit.

---

## 12. Closing principle

The student should feel that **the system has given them an experience that takes their essay seriously, and offers them genuine pathways forward, without taking the essay away from them**.

That is the entire target. Every other commitment in this document supports it.
