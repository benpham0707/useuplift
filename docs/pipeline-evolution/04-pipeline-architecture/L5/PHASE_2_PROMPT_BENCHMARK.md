# Phase 2 Prompt Benchmark — Round-1.5 Draft

**Date:** 2026-05-01
**Branch:** `feat/integrated-pipeline-build`
**HEAD:** `a4d1d8c` (round-1) → round-1.5 in flight
**Status:** Round-1.5 draft. **Awaiting Tue ratification before any Phase 2 prompt drafting begins.**
**Scope:** This doc ratifies the framing, principle stack, and per-layer extension templates that every Phase 2 prompt (D-2.2, D-2.3, D-2.4, D-2.5, D-2.6) measures against. It is the round-0 quality gate that fires before length/tone/evidence-grounding checks at every prompt revision round.

---

## §0 — What changed from round-1 to round-1.5

Round 1 cited "good vs bad" examples drawn from the four Supabase edge-function prompts (workshop-analysis, validate-workshop, teaching-layer, piq-chat). Tue's 2026-05-01 input identified the bar I was operating at: those examples are competent but operate at v1-review depth (paragraph-level, no mechanism). The corpus standard lives at v2.1-review depth — sentence-by-sentence with named craft moves, mechanism + detection + failure mode taxonomy, cross-topic transplantation discipline, ~20K–30K words per essay review.

Round 1.5 is grounded entirely in the **14-essay calibration-review corpus** at `tests/calibration/top-tier-reference/reviews/` (see `PHASE_2_CORPUS_DIGEST.md` for the full source-material extraction — 38 named craft moves, 8 transplantation excerpts, 5 commentary-gap passages, 20 cross-topic example library entries, all verbatim with file:line citations).

**Specific changes:**

- **§3 restructured.** Corpus is now the primary source for craft-depth moves. Edge-function prompts are cited only for *counselor-tone* moves where `piq-chat/systemPrompt.ts` does it genuinely well — the corpus's depth speaks for craft.
- **§1 anti-pattern recognition tests** sharpened with corpus-bar pass/fail examples.
- **Tue's three specific corrections applied verbatim** in §3.5 — "Use Their Language" rewrite (match-energy-then-pivot-to-specifics rather than gesture at "reads like a resume"), self-discovery one-deep-question rewrite (the system demonstrates it's already imagined the moment, the student builds forward), LED→wordplay-as-target replaced with corpus instances like Daniella's "walking on eggshells / empty egg carton" and Michelle's "Eely-noise" thematic syllable-seeding.
- **NEW §6 — Transplantation discipline as Phase 2 requirement.** Per the methodology v2.1, every named craft move must transplant to immigration / science / grief / mundane-daily-activity topics. This is the corpus's central rigor test. Phase 2 emissions / findings / suggestions inherit it as a load-bearing structural requirement.
- **NEW §7 — The calibration-review analytical voice pattern.** Catalogues what depth-per-move looks like in the corpus vs surface commentary, with verbatim excerpts. Phase 2 prompts that produce analysis or feedback must embody this voice — the prose moves from *what is happening on the page* to *what the move does to the reader's cognition / emotion / trust*, and specifies the grammatical, prosodic, or structural unit doing the work.
- **§4, §5 anti-pattern + extension examples** re-anchored to corpus quotes.
- **§8/§9/§10/§11** re-numbered (old §6/§7/§8/§9 shifted by two for the new sections).

The bar throughout: an emission that reads as competent-but-not-memorable fails the benchmark even if it passes typecheck and the LLM-first rules. Standard is calibration-review depth, not edge-prompt-fixture depth.

---

## §1 — How this doc was built

**Foundation reads** (Track A, complete): every Phase 0 + Phase 1 file Phase 2 reads from or extends, at the file:line level. Documented in `PHASE_2_FOUNDATION_GROUND_STATE.md`.

**Calibration corpus extraction** (Track D-Corpus, complete): the 14 v2-standard close-reading reviews of admitted top-tier essays at `tests/calibration/top-tier-reference/reviews/`. Methodology lock at `reviews/METHODOLOGY.md`. Reviews follow the v2.1 standard: sentence-by-sentence reading, named craft moves with Detection / Function / How-to / Failure-mode taxonomy, replication-focused transplantation, weakness-analysis minimized to ~10–15% of review content. Digest at `PHASE_2_CORPUS_DIGEST.md`.

**Edge function prompt extraction** (Track B, complete, but de-emphasized in round 1.5): four Supabase edge-function prompts — `workshop-analysis`, `validate-workshop`, `teaching-layer`, `piq-chat`. These produce decent-but-not-at-our-level output; round 1.5 cites them only for the counselor-tone moves where `piq-chat/systemPrompt.ts` is genuinely strong. The rest of the craft-depth grounding comes from the corpus.

**Spec-drift name correctness applied** (per Tue's 2026-04-30 directive): every production method cited has been grep-verified against current `src/`. Conceptual names from prior spec docs are flagged where they appear.

**Tue's three load-bearing corrections** (2026-04-30) shape the principle stack:
1. **Span-citation is finding-level, not emission-level.** Findings carry the quoted span. Emissions cite the finding and inherit the anchor. Don't enforce per-emission anchor fields.
2. **Connection is aspiration, not per-suggestion gate.** Strong essays (the Harvard ballerina-mouse exemplar at the time, now grounded across all 14 corpus essays) deepen one through-line across paragraphs. Train the system to recognize and reinforce existing connection architecture; don't mechanically attach a `connectsTo` field to every suggestion.
3. **Trained dispositions, not MUST rules.** The goal is the LLM's thinking and recognition pattern lands close to a $500/hr counselor's — naturally tending toward specificity, connection-awareness, and depth because the prompt teaches that thinking, not because the prompt mandates a checklist.

---

## §2 — The three load-bearing principles

Every Phase 2 prompt extension measures against these three principles. They're three faces of the same counselor disposition: *read the particular thing, recognize what it's becoming, help it become the strongest version of that*.

### §2.1 — Tailored, not generic

The feedback is specific to THIS essay's text and architecture (Tue's §5a from the original handoff prompt).

**Operational rule:** the LLM reads the actual essay's voice, register, narrative architecture, central images, through-line(s), thematic vocabulary domains, and the student's attempted argument — and grounds every emission in those specifics. A future contributor reading the LLM's output should see the student's essay, not a template.

**Calibration-corpus exemplar of "tailored":** Sarika's review walks the 39-word opening sentence and identifies six craft moves operating simultaneously — grammatical-subject displacement via subordinate-clause accumulation; specialized-register deployment ("pirouetted," "tutu," "grand jeté"); possessive direction (three "her" possessives bound to the mouse, zero to the narrator); graduated-technicality verb chain (glide → twirl → pirouette → following the motion); color specificity in modifier position ("rose-colored," not "pink"); and meter-content congruence (the sentence is rhythmically a waltz). The analysis isn't "this opening is vivid" — it's "the grammar performs subject-deferral, and by the time the reader reaches the end, they've forgotten the narrator was the sentence's subject because they're watching a mouse perform ballet technique" (`05-sarika-i-too-can-dance-review-v2.md:44`).

That kind of tailored reading — moving from "what is happening on the page" to "what this specific grammatical / prosodic / structural unit is doing to the reader" — is the benchmark.

**Anti-pattern:** feedback that could appear word-for-word on a different student's essay. Generic counselor language like "consider adding sensory detail" or "show, don't tell" without grounding in this essay's specific moments. Surface commentary that names *effects* ("vivid imagery," "compelling voice") without naming the *mechanism* underneath the effect.

**Recognition test (round-0 quality gate):** sample 3-5 emissions and ask *"could each of these appear word-for-word on a different student's essay?"* If yes for any → the prompt is failing this principle. Revise.

### §2.2 — Flexible, not formulaic (read on the essay's own terms)

The system reads each essay on the terms of *what THAT essay is reaching for*, not against a fixed essay-type lens.

**Operational rule:** during the L3 walk, the LLM DISCOVERS what kind of essay this is — what purpose it's reaching for, what its central reach is — and every later layer's lens is shaped by that recognition. A quiet contemplative essay (Clara's compressed-heritage architecture; Sarika's interior transformation) isn't trying to be a high-stakes dramatic narrative; judging it by stakes/tension/climax misreads it. The reading is open: what is THIS particular essay reaching for?

**Calibration-corpus exemplar:** the corpus contains nine distinct archetypes — Sarika (interior transformation via metaphor-possession), Francisco (community-integration via peak-scene density), Billy (strategic balance via direct self-analytical prose), Orlee (bait-and-switch via voice-carrying biographical load), Marcus (child-memory-as-prophecy via extended-metaphor + refusal-close), Michelle (metaphor-literalization via scientific mechanism beneath metaphor), Michael (plain-voice sacrifice via time-stamped ritual + mirror-gap close), Lauren (obsession-as-autobiography via domain-insider + art-to-policy ladder), Clara (compressed-heritage via one-paragraph family history + consistent metaphor). All admitted to Harvard 2028. The "best version of THIS essay" lives at the archetype level, not at a single rubric.

**Anti-pattern:** closed-taxonomy "essay-type lens" thinking. "This is a vulnerability essay → apply vulnerability lens" or "this is a leadership essay → apply leadership lens." Rule 3 of `feedback_llm-first-design.md` (no closed taxonomies for LLM perception) bans this directly.

**Architectural carrier:** the L3 walk's reading-strategy discovery already exists at `holisticSynthesis.ts:741` (PHASE_META prompt). The benchmark elevates this to load-bearing: every later layer's prompt MUST reference the discovered reading strategy by name when emitting analysis or feedback. This makes the whole pipeline's output coherent to ONE student's essay rather than a pre-determined rubric.

**Recognition test:** *"could each emission appear on an essay reaching for a fundamentally different purpose?"* If yes → the prompt is applying a generic lens, not reading on this essay's own terms. Revise.

### §2.3 — Best-of-its-kind, not best-by-rubric

Every suggestion points toward the strongest version of what THIS essay is reaching for, not toward a template of what a "good essay" looks like in the abstract.

**Operational rule:** the system's improvement suggestions are oriented toward THIS essay's purpose-on-its-own-terms. A defiant-irreverent essay (Orlee's bra-shopping; Lauren's Sondheim murder-game) and a quiet-introspective essay (Michael's three-years-alone; Sarika's interior-transformation) get fundamentally different specific suggestions because their purposes differ — but both get the same QUALITY of thinking from the system: deep, particular, oriented toward the strongest version of what THIS essay is becoming.

**Calibration-corpus exemplar:** Marcus's review identifies the "Until I became one" three-word hinge as the structural pivot that "converts the preceding paragraph from memory to prophecy, retroactively reframing all earlier content" (`10-marcus-the-zoo-review-v2.md:75-87`). The suggestion at this point isn't "raise the stakes" or "add sensory detail" — those would be rubric moves. The corpus-bar suggestion is: *the three-words-isolated-as-its-own-paragraph move only works if the prior paragraph was rendered fully without foreshadowing the future meaning; if you tip the reader off, the pivot collapses*. The advice is specific to THIS architectural choice's success conditions.

**Anti-pattern:** rubric-driven suggestions that rank dimensions on a fixed scale. If the system observes "stakes are low" in a quiet contemplative essay and recommends "raise the stakes," that's rubric-thinking — pointing toward a generic strong essay, not toward THIS essay's strongest version. The strongest version of a quiet contemplative essay deepens the restraint, not adds tension.

**Best-of-its-kind judgment is LLM judgment** (Rule 1 of `feedback_llm-first-design.md`). The system doesn't carry a database of "best vulnerability essay shapes" or "best identity essay shapes" to pattern-match into. The walk reads the essay, recognizes what it's reaching for, and articulates what the strongest version of THAT reach would look like.

**Recognition test:** *"if this suggestion landed perfectly, would the result be the strongest version of THIS essay, or a closer approximation of a generic strong essay?"* If the latter → the prompt is applying a rubric template, not best-of-its-kind judgment. Revise.

---

## §3 — The round-0 quality gate (two-test swap pattern)

At every prompt revision round (round 1, round 2, round 3+), this gate fires BEFORE any other quality check (length, tone, evidence-grounding, anti-fluff, anti-repetition):

1. **Sample 3-5 emissions** from the round's output (or from the prompt's worked examples on round 1).
2. **Test 1 — Tailored swap:** could each emission appear word-for-word on a *different student's essay*? If yes for any → revise.
3. **Test 2 — Purpose swap:** could each emission appear on an essay *reaching for a fundamentally different purpose*? If yes for any → revise.
4. **Only after both swap tests pass** → check length, tone, evidence-grounding, anti-fluff, anti-repetition, connection-aspiration recognition.

If a prompt fails the swap tests, the prompt's *thinking pattern* is broken (it's grading from a rubric, not reading a particular essay). Fix the disposition, not by adding required fields. Per Tue's three corrections: trained dispositions, not MUST rules.

The swap tests run on **finding-level emissions** (where the span anchor lives), not on every downstream suggestion derived from a finding. A suggestion derived from a tailored finding inherits the anchor; the suggestion itself can be locally focused without re-citing the span.

**Worked example — what passes the swap tests:** Sarika's reveal-through-consequence move. Verbatim from the essay: *"Sometimes, I even ran over my friends' toes."* (9 words.) The corpus-bar finding-level emission about this sentence isn't "powerful reveal." It's: *"the wheelchair appears via consequence (toe-running) not via declaration; the reader runs a backward-causal search (what activity causes toe-running? → vehicles, carts, wheels → wheelchair); the inference IS the reveal; the meek framing ('Sometimes, I even') gets past the reader's defenses by signaling 'incidental unfortunate thing' rather than 'central biographical disclosure.' The move only works when the inferential path from action to fact is narrow enough that 95%+ of readers reliably make the inference; 'I made things harder for everyone' is too ambiguous and would fail."* This emission could not appear on a different student's essay — it's specific to this 9-word sentence's grammar and inference-mechanism. Passes Test 1. It also could not appear on an essay reaching for a different purpose — the move is specific to mid-essay biographical-fact disclosure, and the same prose elements would mean something different in a defiant-irreverent essay (where short sentences perform aggression, not meekness). Passes Test 2.

**Worked example — what fails the swap tests:** "This sentence shows vulnerability through specific detail." Could appear on Sarika's wheelchair sentence, on Michael's mother-as-pride-and-joy sentence, on Orlee's congenital-foot-deformity sentence, on Daniella's empty-egg-carton sentence. Fails Test 1 immediately.

---

## §4 — Principles to imitate (corpus-grounded)

Round 1 catalogued framing moves drawn from edge-function prompts. Round 1.5 grounds every named move in the calibration corpus first; the edge-prompt counselor-tone moves come second.

### §4.1 — From the calibration corpus (craft-depth source)

The 14 reviews surface 38 named craft moves with full Detection / Function / How-to / Failure-mode taxonomy (full catalogue in `PHASE_2_CORPUS_DIGEST.md` §2). Phase 2 prompts inherit these as the standard for what *named craft observations* sound like. Five top-priority moves to internalize:

#### **Verb-possession of specialized register onto non-specialized object** (`05-sarika-i-too-can-dance-review-v2.md:359-373`)

A verb from a specialized domain is applied directly to an object outside that domain, with no simile and no hedge. Sarika's *"my pencil pirouettes perfect O's on paper"* (`05-harvard-2028-i-too-can-dance.txt:13`) treats writing-tools as dancing-bodies. The grammar claims the object *is in the domain of* the specialized register, which is more immersive than similarity-processing.

**Why this matters for Phase 2:** distinguishes possession-grammar from comparison-grammar. Surface commentary calls Sarika's pencil-pirouettes "lovely imagery"; mechanism analysis says it's the strongest metaphor-form available because *the reader processes a world in which pencils dance, not a world where pencils are similar to dancers*. Phase 2 emissions about metaphor must distinguish these two modes.

**Failure mode:** verb whose literal action is incompatible with the object's actual behavior breaks the image. *"My pencil sutures"* feels surgical-invasive. *"My pencil pirouettes"* works because pencils rotate while drawing.

#### **Reveal-through-consequence-via-short-punchline** (`05-sarika-i-too-can-dance-review-v2.md:201`)

A central biographical fact is disclosed through a short sentence describing a consequence whose cause the reader can reliably infer; discovery is more intimate than delivery. *"Sometimes, I even ran over my friends' toes."* (`05-harvard-2028-i-too-can-dance.txt:7`)

**Why this matters for Phase 2:** Phase 2 emissions about disclosure-mechanism must distinguish "declaration" from "consequence-with-narrow-inferential-path." Surface commentary says "powerful reveal"; corpus-bar analysis specifies the inferential path and names the trust-effect (discovered conclusion > delivered conclusion).

**Failure mode:** ambiguous inferential path leaves the reader without the reveal. The action's cause must be reliably inferable.

#### **Hidden-thesis via parallel-triplet early** (`05-sarika-i-too-can-dance-review-v2.md:148`)

A sentence early in the essay containing three parallel clauses with anaphora encodes the essay's thesis structure; the closing answers the triplet's form or content, producing structural payoff readers feel without noticing. Sarika's *"I longed for my whole being to melt into the magical melodies of music; I longed to enchant the world with my own stories; and I longed for the smile that glimmered on every dancer's face"* (`05-harvard-2028-i-too-can-dance.txt:5`) plants three desires; the closing resolves all three through writing.

**Why this matters for Phase 2:** Phase 2 emissions about structural foreshadowing must look at the *form* of the closing and trace it back to early-essay structural plants, not just the *content* of the closing.

**Failure mode:** closing that doesn't structurally resolve the triplet leaves the triplet ornamental.

#### **Compressed-biography-in-one-sentence** (`14-clara-crochet-review-v2.md:272`)

Load-bearing family-member biography is compressed into a single sentence with multiple specifics (name, rank, duration, conditions). Clara's *"The Viet Cong imprisoned my grandfather, a colonel in the South Vietnam Air Force, in a grueling labor camp for thirteen years."* (`14-harvard-2028-crochet.txt:3`) carries a person and a war in one sentence.

**Why this matters for Phase 2:** Phase 2 emissions about compression must name the specific information-density (3+ load-bearing specifics in one sentence) and recognize that compression is a craft choice with positive value, not a deficit.

**Failure mode:** under-specified compression flattens; over-specified compression stops the prose.

#### **Metaphor-fact collapse** (`11-michelle-fish-out-of-water-review-v2.md:135-137`)

The figure (fish out of water) IS the fact (osmoregulation). The writer didn't invent the metaphor; she discovered her experience corresponded to a real biological mechanism. Michelle's *"I later learned in biology that when a freshwater fish goes in saltwater, it osmoregulates—it drinks a lot of water and urinates less. This used to hold true for my school day, when I constantly chugged water to fill awkward silences and lubricate my tongue to form better vowels."* (`11-harvard-2028-fish-out-of-water.txt:12`)

**Why this matters for Phase 2:** corpus-bar mechanism analysis must distinguish metaphor-as-figure from metaphor-as-fact. When the metaphor and the fact are identical, the essay isn't using figurative language anymore; it's describing a literal phenomenon. This collapse is what produces distinctive force, and surface commentary lumps it with "extended metaphor."

**Failure mode:** forcing a fact-collapse where the figure doesn't actually correspond to a literal mechanism reads as reach.

### §4.2 — From `piq-chat/systemPrompt.ts` (counselor-tone source only)

Where `piq-chat` is genuinely strong is **counselor character + voice** — not in craft-depth analysis (which it doesn't attempt), but in how the LLM should sound when conveying analysis to a high-school student. Three moves to imitate for *tone framing*, with explicit acknowledgment that the depth of WHAT is being conveyed comes from the corpus, not from `piq-chat`'s one-shot output.

#### **Counselor identity established viscerally** (`piq-chat/systemPrompt.ts:12-16`)

*"You are a warm, insightful UC PIQ essay coach who genuinely cares about helping students tell their authentic stories. You're like that English teacher who actually gets it — the one who makes you excited to revise because they see what your essay could become."*

Not a role description; a CHARACTER. The LLM internalizes the disposition by inhabiting the character. Phase 2 emissions inherit this character framing — every emission sounds like a specific teacher who actually gets it, not like "a system."

#### **Sound-Like / Not-Like-This voice training by demonstration** (`piq-chat/systemPrompt.ts:32-50`)

*"Sound Like This: 'Okay, so here's what I'm noticing...' / 'This part? Chef's kiss. Keep it exactly as is.' / 'Real talk: this ending is a little flat.'"* / *"Not Like This: 'Per the rubric guidelines...' / 'Your score in dimension X is suboptimal...'"*

The LLM learns tone by seeing it. Phase 2 prompts include the equivalent for the layer's emission type — not "your sentence shows vulnerability" but the corpus-grounded register suited to high-school student readership.

#### **Self-discovery questions** (`piq-chat/systemPrompt.ts:26, 113`)

The principle is correct (Socratic questions, not lectures); the cited example phrasing ("What scared you about that moment?" / "Why did THAT detail stick with you?") is below the bar. See §4.3 for the corpus-bar version.

### §4.3 — Tue's specific corrections (applied verbatim)

Round 1 cited three illustrative examples that operate below the corpus bar. Round 1.5 replaces them with corpus-grounded versions.

#### Correction A — "Use Their Language" rewrite

**What round 1 had** (problematic, robotic, gestures-at-specifics): *"If they say 'Why is my score trash?' don't respond with 'Your NQI of 58 indicates...' Say 'Your score is low because right now this reads like a resume, not a story.'"*

**What round 1.5 has** (matches energy → immediately specific to THIS essay):

The pattern: reflect the student's word back ("trash," "ugh," "lame"), then go *immediately* to specifics about *this essay's actual move*. No generic setup. No "this reads like a resume" gesture. The pivot to specifics is the whole point.

> Student: *"Why is my score trash?"*
>
> Counselor (corpus-bar version): *"Your score is 'trash' because in P2 you tell us 'I demonstrated leadership and grew as a person' instead of telling us about Mrs. Chen — the assistant principal — saying 'I don't have ten thousand dollars to give you' across the table from you and the way your hands shook holding the budget you'd written. The whole paragraph is you listing attributes you want us to see; the moment with Mrs. Chen would have shown them. The list version is what you think we want; the Mrs. Chen version is what actually happened."*

What's load-bearing about this rewrite:
- Quote the student's word back ("trash"), not euphemize.
- Cite the specific paragraph (P2) and the specific phrase the student wrote (verbatim).
- Name the specific moment that should have replaced it (Mrs. Chen + the budget + the hands shaking).
- Make the contrast on what the TWO versions accomplish (what-the-student-thinks-we-want vs what-actually-happened).
- Don't use "this reads like a resume" — that's still generic. Use the actual dynamic happening in THIS student's prose.

#### Correction B — Self-discovery question rewrite

**What round 1 had** (surface-level fishing): *"What scared you about that moment?" / "Why did THAT detail stick with you?" / "What were you ACTUALLY thinking in that moment?"*

**What round 1.5 has** (one deep question that demonstrates the system's already-imagined-it):

The pattern: ONE deep question that demonstrates the system has *already* imagined the moment in vivid specific detail. The student doesn't catch up — they build forward. Quantity → quality. Ask fewer questions; ask better ones.

> Student is writing about cooking with their mom. The system has read the draft and observed cooking-with-mom is the central scene-of-fulfillment but the prose is general ("we baked together and I felt close to her"). The corpus-bar dig question:
>
> *"Is it the moment you both peer through the oven glass, watching the cookies dome and crack — the same physical posture you've held together since you were small enough to need a stool, except now you don't, and that small loss-of-need is part of the bonding? Or is it the warmth hitting your face as you open the oven, the heat carrying both the chocolate-smell and the recognition that you just heard yourself laugh in your mother's exact rhythm — the inheritance arriving through your own throat without permission? Or is it something else entirely — something about the timing, or about what doesn't get said while the timer counts down?"*

What's load-bearing about this rewrite:
- The system proposes TWO specific candidate moments rendered with sensory detail (oven-glass-peering with the stool-loss; warmth-on-face with the inherited-laugh).
- Each candidate moment names what makes it load-bearing for THIS student (the small loss-of-need; the inheritance-without-permission). The architecture is named, not just the moment.
- A third option ("or something else entirely") frees the student to redirect rather than picking from a forced binary.
- The question demonstrates the system has done the imaginative work; the student can either pick, redirect, or push deeper — but they're never catching up to a generic question.

The corpus parallel: this is what Sarika's review does at line 44 when it says "the *sentence* is a microcosm of the *essay*. Specifically: the grammar performs subject-deferral, and by the time the reader reaches the end, they've forgotten the narrator was the sentence's subject because they're watching a mouse perform ballet technique." The analysis demonstrates that it has already reconstructed the cognitive event the grammar is performing. The student / reader doesn't catch up; they accept or push deeper.

#### Correction C — Original-wordplay-as-target rewrite

**What round 1 had** (competent but flat — operates at v1-review depth): *"I traced the circuit three times before realizing I'd swapped the resistor values. The LED stayed dark. My lab partner had already left."*

**What round 1.5 has** (corpus-bar instances of original wordplay):

Tue cited a target like *"The LED stayed dark, so I stayed till dark. Long before the sun rose, light filled the room..."* — wordplay (stayed dark / stayed till dark / light filled the room) where the prose itself enacts the metaphor. The corpus has multiple instances at this bar.

> **Daniella's literalized-dead-idiom** (`08-harvard-2028-cookies.txt:5`): *"Baking them is like walking on eggshells — and I have an empty egg carton to prove it."* The cliché is taken literally — Daniella has used up her eggs, which is evidence she has indeed been walking on eggshells (crushing them). The "to prove it" frame turns the joke into evidence-offering (lawyer-voice applied to baking).
>
> **Michelle's thematic-syllable-seed** (`11-harvard-2028-fish-out-of-water.txt:4`): *"When I was ten, my dad told me we were moving to somewhere called 'Eely-noise.'"* The state name arrives as the child heard it — preserving the "eel" (a fish) at the syllabic level, before the essay has announced its fish metaphor. The metaphor is planted in the very phonetics of the opening.
>
> **Sarika's verb-migration with retroactive payoff** (`05-harvard-2028-i-too-can-dance.txt:5, 15`): paragraph 2 says *"the way she wove her body into the delicate threads of the Sugar Plum Fairy's song"* — verb "wove" applied to a dancer. Paragraph 7 says *"I weave my heart, my soul, my very being into my words as I read them out loud, until they become almost like a chant."* — same verb migrates from dance to writing. The reader doesn't notice consciously, but the verb's reappearance creates unconscious continuity.

These are corpus-bar instances of original wordplay. None could appear on a different student's essay. None could be transplanted to an essay reaching for a different purpose without significant restructuring. They each do 2-4 craft moves simultaneously.

What "good at the corpus standard" means: multi-layered craft-density where the sentence's specifics (verb choice, register, possessive direction, rhythm, specificity-level, image-coupling) reinforce each other rather than competing. Phase 2 prompts that produce examples or recommendations must operate at this density, or they don't pass.

---

## §5 — One-shot tendencies to NOT carry over

The edge function prompts are constrained by being one-shot. Their structures co-locate Understanding + Analysis + Feedback into a single call because they have to. Our interconnected pipeline explicitly separates these layers. Carrying over their structural choices would re-import the antipatterns the L5 design explicitly removed.

### §5.1 — Closed taxonomies for LLM perception

**Antipattern:** `workshop-analysis/index.ts:207-225`'s `experienceFingerprint` shape — six fixed dimensions (`unusualCircumstance | unexpectedEmotion | contraryInsight | specificSensoryAnchor | uniqueRelationship | culturalSpecificity`) with required JSON shape. The LLM can only express uniqueness in those six shapes; "ironic juxtaposition" or "structural inversion" or "vocabulary domain collision" can't be expressed.

**Why it's banned:** Rule 3 of `feedback_llm-first-design.md`. The taxonomy becomes a ceiling on system intelligence.

**Corpus contrast:** the calibration reviews catalogue 38+ named craft moves across 11 categories — and those are the moves *observed in 14 essays*. There's no theoretical limit. New moves get named when they show up. A six-shape closed taxonomy would have failed to catch Marcus's "Until I became one" three-word hinge, Michelle's metaphor-fact collapse, Daniella's literalization-of-dead-idiom, or any of the 35+ other moves that don't fit the taxonomy.

**What to do instead:** the LLM describes uniqueness freely in prose. The system uses 3-4 functional routing tags (e.g., `appliesToParagraph`, `crossParagraph`, `affectsScoring`) for downstream routing — not perception.

### §5.2 — Banned-phrase regex / blocklists

**Antipattern:** `teaching-layer/index.ts`'s "Don't use AI-sounding words ('tapestry', 'testament', 'delve', 'showcase', 'underscore')" — closed banned-word list. `validate-workshop/index.ts:55-67`'s "Red flags: 'journey', 'passion', 'grew as a person', lists of 3 adjectives."

**Why it's banned:** Rule 4 of `feedback_llm-first-design.md`. The LLM will always produce novel phrasings that dodge the regex.

**Corpus contrast:** the calibration reviews call out *specific weak phrases in specific essays* with mechanism analysis. Sarika's review names "glimmered" on the smile (`05-sarika-i-too-can-dance-review-v2.md:150`) as in the same decorative register as "sparkled," "shimmered," "twinkled" — but the analysis specifies *why this register is weak in this context* (the rest of the essay uses precise verbs like "pirouetted," "scampered," "stippled"; "glimmered" is the one slip; the local pattern is identifiable). That's not a banned-word list; it's a contextual judgment about register-consistency.

**What to do instead:** the prompt teaches the *thinking* — "would this language make an AO read this as a 'smart kid generic essay' instead of a 'compelling human story'?" — and lets the LLM apply that thinking to whatever specific phrasing this essay uses. When weakness is named, it's named with mechanism, not regex.

### §5.3 — Character-count minimums

**Antipattern:** `teaching-layer/index.ts:226-241` — `problem.hook: 80-120 chars`, `description: 400-600 chars`, etc. Hard char ranges per field force padding when the natural output is shorter.

**Why it's banned:** violates the "every word earns its spot" rule. A 50-word teaching moment that lands precisely is stronger than a 400-word teaching moment padded to fit a minimum.

**Corpus contrast:** Clara's essay carries a century of family history, a war, a thirteen-year imprisonment, and a three-generation craft transmission in five paragraphs (~650 words). The compression is the craft. A character-count minimum would have padded the corpus-bar move out of existence.

**What to do instead:** name the *quality bar* in the prompt ("the hook should make a high-school student want to read further"), not the length budget. Length serves content.

### §5.4 — Single-call output mega-shapes

**Antipattern:** `workshop-analysis/index.ts` does voiceFingerprint + experienceFingerprint + 12-dimension rubric + surgical workshop items in one call. Co-locates Understanding + Analysis + Feedback.

**Why our pipeline separates these:** Phase 1 explicitly separated Understanding (L3) from Analysis (L3.5) from Feedback (L5) so that:
- L3 stays evaluation-free (the FORBIDDEN VOCABULARY rule at `sequentialDeepWalk.ts:192`).
- L3.5 judges with full Understanding context.
- L5 prescribes with both Understanding and Analysis context.

**Corpus contrast:** the calibration reviews themselves separate these passes. v2.1 methodology runs three sequential passes — Pass 1 (first read, surface obvious moves), Pass 2 (looking for what Pass 1 missed; structurally-important moves are often found here), Pass 3 (stress-testing; where does the essay fail; where is praise overstated). Each pass operates at a different evaluative posture. Co-locating them in a single LLM call would lose the layered context that makes each pass good.

**What to do instead:** every Phase 2 prompt extension preserves the layer's existing scope. L3 walk emits findings + specifics-need within Understanding-only framing. L3.5 emits analysis + specifics-need within evaluative framing. They DON'T blend.

### §5.5 — Closed-enum scoring/magnitude classifications on contextual judgments

**Antipattern:** `teaching-layer/index.ts:71`'s `changeMagnitude: 'surgical' | 'moderate' | 'structural'` enum.

**Why partially banned:** routing/bookkeeping closed enums (e.g., `coachingValue: 'critical' | 'high' | 'medium' | 'contextual' | 'diagnostic'` at `findingStore.ts`) ARE acceptable per Rule 6 (system bookkeeping). What's banned is closed enums on contextual judgments the LLM should describe freely.

**The line:** if the enum drives downstream system routing or display, it's bookkeeping (acceptable). If the enum captures the LLM's judgment of contextual quality, it's perception (banned — describe freely).

For Phase 2 specifics-need emissions: `expectedAnswerShape: 'scalar' | 'short_phrase' | 'specific_memory' | 'list' | 'narrative'` is bookkeeping (drives Conversator answer-extractor routing). Acceptable. `consumers: Array<'l3' | 'l3_5' | 'l3_75' | 'l4' | 'l5' | 'finding_maturity'>` is bookkeeping. Acceptable.

### §5.6 — Mandatory predictive numeric outputs

**Antipattern:** `teaching-layer/index.ts:77`'s `estimatedImpact: { nqiGain: number, dimensionsAffected: string[] }` — demands the LLM produce a numeric NQI prediction.

**Why it's banned:** the LLM doesn't know the gain. Producing a number suggests certainty the system doesn't have. Deterministic-formula-dressed-as-LLM-judgment.

**What to do instead:** the LLM describes the expected effect in prose. Sortable signals derive from the LLM's qualitative output via a separate Haiku classifier or deterministic rule.

---

## §6 — Transplantation discipline as Phase 2 requirement (NEW)

The methodology v2.1 makes transplantation the load-bearing test: a craft move's analysis hasn't gone deep enough until a writer with a different life, writing on a different topic, can do this specific thing on their own material. Per `METHODOLOGY.md:72-85`: *"If a move is named but its replication mechanism isn't clear, the analysis hasn't gone deep enough yet. Go deeper."*

This is a structural requirement for Phase 2 prompts.

### §6.1 — Why transplantation is load-bearing for our system

The system isn't producing essays; it's producing *the analytical and coaching framework students apply to their own essays*. If the system observes "Sarika's verb-possession move works" but can't generalize the mechanism to other topics, then the observation is essay-locked — coaching that can't transplant is coaching tied to one student's biography and useless for the next student.

The corpus's transplantation discipline names the *abstract structural / grammatical / cognitive property* the move depends on, then produces three or more examples across genuinely different domains that preserve that property while changing every surface detail.

### §6.2 — Honest vs hand-wavy transplantations

From `PHASE_2_CORPUS_DIGEST.md` §3, the marker for honest transplantation is:

**Honest:** the rule names the abstract property (grammatical form, inferential geometry, cognitive condition). Three or more examples in genuinely different domains preserve the property while changing surface content. Failure-conditions are named.

> Sarika's verb-possession transplantation (`05-sarika-i-too-can-dance-review-v2.md:371`): *"do not compare the two with 'like' or 'as if.' Take a verb from the old identity's specialized vocabulary and apply it directly to an object of the new identity. 'My pencil pirouettes.' 'My keyboard breathes.' 'My notebook sprints.' The grammar claims the new identity is *of the domain of* the old identity, not merely *similar to* it."* Three transplantations in three different domains preserve the grammatical operation.

**Hand-wavy:** says "write like Sarika" or "use vivid imagery" without naming the abstract property the move depends on. Examples would be locked to the original domain or wouldn't preserve any structural constraint.

### §6.3 — Phase 2 prompt requirement

Every Phase 2 prompt that produces named craft observations or coaching suggestions must produce them in a form that transplants. Specifically:

- A finding's `claim` field is written so it could plausibly apply to an essay on a different topic if the underlying grammatical/structural operation were preserved.
- A specifics-need emission's `whyAsked` field names the analytical condition that triggered the emission, not the surface content (so the same trigger-condition could fire on a different essay).
- A coaching suggestion's `suggestedChange` names the operation, not the specific replacement text — the LLM emits the operation; the student applies it to their own material.

**The transplantation test as a quality gate:** at every prompt revision round, after the round-0 swap tests pass, take 2-3 emissions and ask *"if this move were extracted as a coaching principle, could a different student apply it to a different topic?"* If no — the emission is essay-locked; the prompt is producing observations that don't generalize. Revise the prompt to teach the LLM to observe at the structural-property level, not the surface-content level.

This test is the second-tier round-0 quality gate (after the swap tests).

---

## §7 — The calibration-review analytical voice pattern (NEW)

What unifies the 14 corpus reviews is a prose voice that does specific things surface-level commentary doesn't. Phase 2 prompts that produce analysis or feedback must embody this voice — moving from *what is happening on the page* to *what the move does to the reader's cognition / emotion / trust*, and specifying the grammatical, prosodic, or structural unit doing the work.

Twelve recurring depth-moves from the corpus reviews (full catalogue + verbatim excerpts in `PHASE_2_CORPUS_DIGEST.md` §1):

### §7.1 — Naming what surface commentary GOT vs MISSED at the mechanism level

> *"Three things named correctly: the arc, the imagery-sharing, and the effect of maturity. Three categories of things undersold: the *mechanism* behind each effect (not comparison but possession; not imagery but meter; not maturity but restraint), the *structural foreshadowing* in paragraph 2, and the *allusion structure* in the title. This review locates what the commentary glosses."* (`05-sarika-i-too-can-dance-review-v2.md:28`)

The pattern: separate the *what* level (which surface commentary handles competently) from the *mechanism* level (which surface commentary almost never reaches). Each pair refuses the surface label and substitutes the operative grammatical / prosodic / voice mechanism beneath it.

### §7.2 — Sentence-as-microcosm-of-essay framing

> *"The essay's first sentence establishes a subject and refuses to stay with her. This is not accidental — it's the rhetorical move the whole essay is going to execute at scale. […] The *sentence* is a microcosm of the *essay*."* (`05-sarika-i-too-can-dance-review-v2.md:44`)

Connect micro-craft (one sentence's grammar) to macro-architecture (the whole essay's stance). Sentences are small-scale enactments of the essay's whole rhetorical claim. The grammar is the thesis.

### §7.3 — Cross-sentence verb-migration tracing

> *"The essay plants the weaving metaphor in paragraph 2 as a description of dance, then migrates the verb to describe writing in paragraph 7. The reader doesn't notice consciously, but the verb's reappearance creates unconscious continuity."* (`05-sarika-i-too-can-dance-review-v2.md:116`)

Track a single lexical item across paragraph distance and name the unconscious-continuity effect it produces.

### §7.4 — Rhythmic / metrical analysis with stress-pattern markings

> *"Move 6 — The sentence is rhythmically a waltz. Read it aloud. The stress pattern is built as three-beat measures: 'DAIN-ty / PINK / MOUSE'; 'TU-tu / TWIRL-ing / as she pi-rou-ET-ted'…"* (`05-sarika-i-too-can-dance-review-v2.md:76`)

Perform scansion on prose. Stress-mark phrase-level rhythm and name the meter-content congruence as a separate craft signal. Rhythm arrives at the reader's ear before meaning arrives at their conscious mind.

### §7.5 — "What this sentence does NOT do" framing

> *"What the sentence does not do: it does not say 'I was in a wheelchair.' It does not say 'my disability prevented me.' It does not announce the narrator's body in any declarative way."* (`05-sarika-i-too-can-dance-review-v2.md:189`)

Name the absent move as informative. Craft is a function of refused options as much as taken options. Restraint is positive, not subtractive.

### §7.6 — Possession-vs-comparison distinction

> *"Possession ('my pencil pirouettes') *erases* the distinction. The pencil is claimed as an object that can do ballet. The reader processes *a world in which pencils dance*. This is a more immersive cognitive state than similarity-processing."* (`05-sarika-i-too-can-dance-review-v2.md:363-367`)

Distinguish two metaphor-grammar modes that surface commentary lumps together as "metaphor." Name the cognitive state each mode produces.

### §7.7 — Reveal-mechanism as inferential geometry

> *"The reader encounters 'ran over my friends' toes' and has to run a backward-causal search: What kind of activity causes toe-running? → vehicles, carts, wheels → a wheelchair. The inference arrives within milliseconds for most readers, but the inference *is the reveal*."* (`05-sarika-i-too-can-dance-review-v2.md:191-193`)

Model the reader's cognition step-by-step. Name the trust-effect (discovered conclusion > delivered conclusion).

### §7.8 — Failure-mode specification for every move

> *"Failure mode: if the verb is too alien to the object (too big a leap), the reader gets confused. 'My pencil sutures' would feel surgical-invasive. 'My pencil pirouettes' works because *the pencil can plausibly rotate* — pirouetting is a kind of rotation, and pencils rotate while drawing."* (`05-sarika-i-too-can-dance-review-v2.md:373`)

Every named move pairs with how it goes wrong. The failure mode often clarifies the move better than the success.

### §7.9 — Punctuation-as-emphasis-mechanism

> *"'Not. My. Idea.' uses typographic emphasis via sentence punctuation rather than italics or all-caps. […] period-separation reads as SPEECH emphasis — the cadence of a person insisting verbally."* (`09-orlee-bra-shopping-review-v2.md:39`)

Distinguish two emphasis-grammars by the kind of voice they produce in the reader's head.

### §7.10 — Childhood-voice bleed as deliberate craft choice

> *"'At the speed of light' is childhood-voice hyperbole. […] The phrase signals that we're in the narrator's fourth-grade-self's perception, not his eighteen-year-old narration. […] The adult narrator is letting the child see."* (`07-billy-peabody-skatepark-review-v2.md:44`)

Identify selective register-shift performing a specific cognitive function (granting reader access to the child's actual perception, not the adult's reconstructed memory).

### §7.11 — Strategic-architecture identification

> *"Lichterman names the essay's strategic function: Billy's *other* application materials (leadership, environmental engineering aspirations) portray him as hyper-controlled; this essay exists to balance that portrayal by demonstrating spontaneity-capacity."* (`07-billy-peabody-skatepark-review-v2.md:20`)

Embed the essay in the wider application context. Read its choices against that context. The essay's craft serves a candidate-positioning goal.

### §7.12 — Cumulative-effect-of-specificity-oscillation

> *"Pattern across the paragraph: Francisco oscillates between specific grounding ('80 people,' 'stomach ulcers') and generic abstraction ('significant life style change,' 'it was awkward'). The specific moments earn the reader's trust; the abstract moments squander it. […] one abstraction cancels multiple specificities."* (`06-francisco-three-days-before-a-plane-review-v2.md:185-187`)

Name a *cumulative reader-state* effect produced by sentence-by-sentence oscillation. Reader trust integrates across the prose, not summed sentence-by-sentence.

### §7.13 — What unifies these patterns

Every excerpt moves from *what is happening on the page* to *what the move does to the reader's cognition / emotion / trust*, and specifies the grammatical, prosodic, or structural unit doing the work. None is content with effect-naming alone.

**Phase 2 prompts must embody this voice.** When emitting analysis or feedback, the LLM's output reads at this depth: not "your opening is vivid" but "your opening's verb 'flickered' is doing X, and that X produces this specific effect in the reader's working memory; the alternative verb you might choose, 'glittered,' would produce this different effect because Y."

If the prompt produces emissions at a shallower level — naming effects without specifying mechanisms — it fails the calibration-review voice test, regardless of whether it passes the swap tests and the transplantation test.

---

## §8 — Per-layer extension templates (the principles distributed)

Each Phase 2 prompt extension lives in a specific layer with a specific existing scope. The principles deepen when distributed across layers — different from the one-shot version where they'd all be jammed into a single call.

### §8.1 — L3 walk extension (D-2.2) — `sequentialDeepWalk.ts`

**Where it lives:** the `SYSTEM_PROMPT_TEMPLATE` at line 186. ~500 lines. Single coherent prompt.

**What D-2.2 adds:** ~30-50 lines naming the specifics-need contract. Output schema gains `specificsNeedEmissions: SpecificsNeedEmission[]` either at top level or per-finding (decided at round-1 draft).

**Trained disposition (NOT a rule):** when a finding's `deepeningPotential` cannot be advanced by re-reading the text alone, AND the student's lived experience would resolve it, the finding emits a specifics-need entry. The emission flows from the finding (which carries the span citation per Tue's §1 correction); the emission itself names what to ask and what answer shape would resolve it.

**Anti-pattern explicitly forbidden:** "every finding with deepeningPotential != null MUST emit." That re-introduces the closed-taxonomy / formulaic-emission antipattern. The emission is a *judgment* the LLM makes ("I cannot advance this from text alone, but the student would know"), not a *consequence* of a checkbox.

**Three principles applied at this layer:**
- **Tailored:** the finding's quoted span anchors the emission to THIS essay's text.
- **Flexible:** the L3 walk's reading-strategy discovery (held in `holisticEvolution`) shapes which findings reach the deepeningPotential threshold for THIS essay's purpose.
- **Best-of-its-kind:** the emission asks for the answer that would help THIS essay reach its strongest version, not for a generic "tell me more about your background" question.

**Corpus-bar example of the trained disposition:** Sarika's "longing-triplet" hidden thesis (`05-harvard-2028-i-too-can-dance.txt:5`). If the L3 walk identifies the triplet as a structural plant but cannot determine *which longing's resolution is the essay's intended payoff*, the system emits a specifics-need: *"the triplet plants three longings (self-dissolution, agency over stories, the smile); the closing resolves all three through writing; was the third longing — the smile — the one you most felt was yours, or did you build the closing to resolve all three because the structure demanded it? The answer changes whether the essay's emotional center is in the dancers' faces (specific image) or in the act of writing itself (abstract claim)."*

That emission is finding-derived (the triplet IS the finding; the span is the triplet's text), is essay-specific (the triplet is Sarika's), and asks a question that demonstrates the system has already imagined the structural mechanics — the student doesn't catch up.

**Production-name verified:** the production method is `walkEssay` on `SequentialDeepWalkService` at `sequentialDeepWalk.ts:534`. The prompt is at `SYSTEM_PROMPT_TEMPLATE` (line 186, returned by `buildSystemPrompt()` at line 180).

### §8.2 — L3.5 analysis extension (D-2.3) — `analysisPass.ts`

**Where it lives:** multiple system prompts (anchor-paragraph + parallel-paragraph + essay-level mode). The L3.5 layer is the FIRST evaluative layer (per `analysisPass.ts:5`).

**What D-2.3 adds:** prompt extension naming the specifics-need contract on `sentenceAnalyses[]` where `confidence === 'low'` AND `sensitivityNote` references student-side anchors. Output schema gains `specificsNeedEmissions: SpecificsNeedEmission[]` per paragraph analysis.

**Trained disposition:** when a sentence's effectiveness depends on a lived-experience anchor not in the text, the analysis emits a specifics-need entry. The emission flows from the sentence's confidence shape (which carries the reasoning + sensitivityNote); the emission asks for the anchor that would resolve the confidence ambiguity.

**Anti-pattern explicitly forbidden:** "every low-confidence sentence MUST emit." Many low-confidence sentences resolve from re-reading or from broader Understanding context; only the ones that *truly* need student input emit.

**Corpus-bar example:** Francisco's specificity-oscillation pattern (`06-francisco-three-days-before-a-plane-review-v2.md:185-187`). The L3.5 analysis would observe an abstract phrase ("significant life style change") adjacent to grounded specifics ("80 people, stomach ulcers") and produce a confidence-low judgment with sensitivityNote: *the abstract phrase is dragging the cumulative-trust average down, but the abstraction may be hiding either (a) genuinely vague memory the writer is glossing, or (b) a specific moment the writer assumed wasn't worth specifying — which would resolve through asking the student what specifically changed in the lifestyle*. Specifics-need emission: *"the phrase 'significant life style change' is doing abstract work where every adjacent phrase is grounded; was there a specific moment — a meal, a conversation, a Tuesday — where you noticed your daily pattern had shifted? Naming that one moment would let the abstraction resolve into a scene the way the rest of the paragraph does."*

### §8.3 — L3.75 holistic extension (D-2.4) — `holisticSynthesis.ts`

**Where it lives:** four system prompts.
- `SYSTEM_PROMPT_PHASE_A` at line 328 (voiceIdentity + voiceMap + emotionalTopography + momentEarnednessMap + entanglements).
- `SYSTEM_PROMPT_PHASE_B` at line 524 (thematicArchitecture + narrativeStrategy + characterRevelation + craftAssessment + admissionsPositioning).
- `SYSTEM_PROMPT_META` at line 741 (walk validation + reading strategy + convergence).
- `SYSTEM_PROMPT_CURATION` at line 810 (question queue curation).

**What D-2.4 adds:** prompt extensions across PHASE_A and PHASE_B for emissions from four contributors:
- `momentEarnednessMap.gaps[]` (PHASE_A) — moments that aren't earned; gaps name what's missing.
- `voiceIdentity.authenticVsPerformed[]` flagged "performed" (PHASE_A) — voice flagged but evidence is thin.
- `admissionsPositioning.redFlags[]` (PHASE_B) — red flag identified but severity depends on context the essay doesn't show.
- L4's `intentBridge.alignments[]` mismatches (cross-references L4; emission lives at L4 layer per §8.4).

**Distribution decision (round-1.5 default):** emissions emit per phase. Phase A's extension covers voice/earned-ness emissions. Phase B's extension covers admissions/redFlags emissions. The CURATION phase is unchanged (it merges into the queue at iteration-cycle synthesis).

**Length-budget caution:** PHASE_A is currently 8K max-tokens; PHASE_B is 10K. Output schema additions MUST NOT push token usage past these limits. Emissions go in a separate top-level `specificsNeedEmissions[]` array, kept short (1-2 sentences each per emission).

**Corpus-bar example:** Marcus's "Until I became one" three-word hinge (`10-harvard-2028-the-zoo.txt:3`). The L3.75 PHASE_B `narrativeStrategy.pivotPoints` would identify this hinge as the structural pivot. The corpus-bar specifics-need emission isn't "what does this pivot mean to you" — it's: *"the hinge converts the otter-watching scene from memory to prophecy; the prior paragraph would not work as setup if it foreshadowed the future meaning, so you've rendered fourth-grade you fully in fourth-grade-you's perception. Was that selective rendering deliberate (you knew the pivot was coming and engineered the prior paragraph's innocence) or did you discover the pivot in revision after the prior paragraph was already written? The question is load-bearing because if you engineered it forward, you can engineer the same move on different material; if you discovered it backward, you need a different process to find the next one."*

### §8.4 — L4 northStar extension (D-2.5) — `crystallizer.ts`

**Where it lives:** `buildSystemPromptL4aNorthStar` at line 360. "You are the Crystallizer — a literary-architectural analyst."

**What D-2.5 adds:** prompt extension naming the specifics-need contract on `confidence === 'hypothesis'` for key fields (`throughLineMap.transformation`, `distinctivenessSignature.articulation`, `intentBridge.alignments`). Emissions ask for the student confirmation that would lock the hypothesis from 'hypothesis' to 'emerging' or 'full'.

**Trained disposition:** when a northStar field is 'hypothesis' confidence AND student input would resolve the ambiguity (vs needing more text or another iteration), the emission asks for that input.

**Anti-pattern explicitly forbidden:** "every 'hypothesis' field MUST emit." Some hypotheses resolve through re-reading (re-walk on iteration N+1); some resolve through carry-forward (the hypothesis matures across iterations). The emission asks for student input only when student input is the *honest* resolution path.

**Corpus-bar example:** Lichterman's strategic-architecture identification of Billy's essay (`07-billy-peabody-skatepark-review-v2.md:20`) — *"this essay exists to balance [the rest of the application]'s hyper-controlled portrayal by demonstrating spontaneity-capacity."* If the L4 northStar reads Billy's essay's `distinctivenessSignature` as 'hypothesis' confidence — uncertain whether the spontaneity-demonstration is the load-bearing strategic role — the emission would name the candidate strategic functions (the spontaneity-capacity reading vs the family-portrait reading vs the architectural-aesthetics reading) and ask which one the student understood themselves to be writing toward. The student's answer locks the hypothesis to 'emerging.'

### §8.5 — FindingStore stuck-hypothesis extension (D-2.6) — NEW SERVICE

**Critical scope expansion** (from `PHASE_2_FOUNDATION_GROUND_STATE.md` §3): there is NO existing finding-maturity-refresh service in the codebase. The spec said "extend the existing maturity-refresh Haiku call's prompt" but the existing call doesn't exist. **D-2.6 must build a new service.** Surfaced for Tue's ratification before the service lands.

**Recommended shape:** new file `src/services/essayIntelligence/findings/findingMaturityRefresh.ts`. Per-finding Haiku call against findings whose `maturity === 'hypothesis'` AND `iterationsAlive ≥ 2` (computed from `lineage[]` timestamp + `IterationLedger.iterations[]` chronology).

**Trained disposition:** a finding stuck at hypothesis maturity for 2+ iterations is the system's signal that text-alone re-reading isn't advancing it. Either student input would (→ emit specifics-need) OR the finding is genuinely speculative and should mature toward `superseded` (→ no emit; FindingStore handles via existing maturity lifecycle).

**Cost target:** ~$0.005/finding × ~3-5 stuck findings per iteration = ~$0.015-$0.025/iteration.

**Production-name verified:** the new service file is `src/services/essayIntelligence/findings/findingMaturityRefresh.ts`. The existing FindingStore at `src/services/essayIntelligence/findings/findingStore.ts` is pure infrastructure (Rule 6) and doesn't change.

---

## §9 — The prompt revision protocol (per-prompt Tue ratification)

Per Tue's directive: every Phase 2 prompt revision round gets Tue's ratification at every round (rounds 1, 2, 3+). Don't close a prompt at "passes typecheck" — close at "Tue ratifies the output quality."

### §9.1 — Round flow

1. **Round 0 (this doc):** benchmark ratified before any prompt drafting begins.
2. **Round 1:** agent drafts the prompt against the benchmark. Round-1 quality gates: swap-tests + transplantation-test + calibration-review-voice-test, applied to 3-5 imagined emissions. Round-1 draft surfaced to Tue with worked examples.
3. **Round 2:** Tue reviews round-1 draft, critiques output quality (real or simulated). Agent iterates.
4. **Round 3+:** until Tue ratifies the output quality.

### §9.2 — Per-round artifacts

Per the standing operational charter (`L5_IMPLEMENTATION_PLAN.md` §9.4):
- The prompt itself (committed as `prompts/<name>.prompt.ts` or inline in the calling service).
- `<name>.RATIONALE.md` — what the prompt is trying to do, what alternatives were considered, why this version won, what failure modes it's designed against.
- `<name>.fixtures.md` — canonical input examples + accepted outputs (mock outputs derived from existing on-disk fixtures or, post-mid-build-API-touchpoint, real outputs archived).

### §9.3 — Mid-build API touchpoint (D-2.9)

After all five Phase 2 prompts (D-2.2, D-2.3, D-2.4, D-2.5, D-2.6) ratify through round 3+, the D-2.9 sanity check runs ONE essay against the chain. Cost budget: $0.50–$1.00. Pre-spend Tue ratification: name the fixture, expected token count, expected cost, await Tue's "proceed?" before the API call fires.

If a layer is silent when it should emit, the prompt extension is wrong → return to that prompt's round 4. Hard cap at 2 D-2.9 runs. If second run still silent, halt and escalate.

---

## §10 — What Phase 2 prompts MUST NOT do

Distilling the principles + corrections + LLM-first rules into a forbid-list (these are structural constraints, NOT closed-taxonomy filters on output content):

1. **Don't enforce per-emission span anchor fields.** Findings carry the span. Emissions cite the finding (or finding ID); the anchor is inherited.
2. **Don't enforce per-suggestion `connectsTo` fields.** Connection is aspiration, not gate.
3. **Don't mandate "MUST emit on condition X" rules.** Train the disposition; let the LLM judge whether emission serves the student.
4. **Don't introduce closed taxonomies on LLM perception.** Routing/bookkeeping closed enums are fine. Closed enums on contextual judgments are banned.
5. **Don't ship banned-phrase regex / blocklists.** Teach the thinking; let the LLM apply it.
6. **Don't enforce character-count minimums or maximums.** Length serves content; quality bar > word count.
7. **Don't co-locate Understanding + Analysis + Feedback in a single layer's prompt.** Each layer preserves its existing scope.
8. **Don't demand mandatory predictive numeric outputs.** The LLM doesn't know the gain. Describe in prose.
9. **Don't re-enforce evaluative vocabulary in Understanding layers (L3 walk).** The FORBIDDEN VOCABULARY rule at `sequentialDeepWalk.ts:192` stays load-bearing.
10. **Don't mask LLM silence with centrist defaults.** No `?? 'medium'`, `?? 'high'`, `?? 'general'` patterns. If the LLM doesn't emit, the absence is the audit signal.
11. **Don't produce surface effect-naming when corpus-bar mechanism analysis is reachable.** "This sentence shows vulnerability" fails. "This sentence's verb 'X' is doing Y because Z" passes.
12. **Don't produce essay-locked observations.** Every named craft observation must transplant to a different topic by preserving an abstract structural / grammatical / cognitive property.

---

## §11 — Open scope expansions awaiting Tue ratification

| # | Item | Detail |
|---|---|---|
| 1 | D-2.6 builds a new service | The existing maturity-refresh call doesn't exist; D-2.6 builds `findingMaturityRefresh.ts`. Estimated effort: 6-8h vs spec's 4-5h. Surfaced in `PHASE_2_FOUNDATION_GROUND_STATE.md` §3. **Awaiting Tue's ratification.** |
| 2 | This benchmark itself | Round-1.5 draft. Awaiting Tue's review of: (a) the three principles operationalization, (b) the corpus-grounded principles-to-imitate cataloguing, (c) the antipatterns-to-not-carry-over framing, (d) the per-layer extension templates with corpus-grounded examples, (e) the round-0 swap-test gate + transplantation test + calibration-review voice test, (f) the new sections §6 and §7. |

---

## §12 — Surface to Tue (round-1.5 draft ready)

This document is round-1.5. Per Tue's per-prompt-revision discipline, the next step is Tue review.

**Specific questions for Tue's round-1.5 review:**

1. **Tue's three corrections in §4.3** — does the rewrite of "Use Their Language" (match-energy → immediately specific) match your intent? Does the cooking-with-mom self-discovery question rewrite (one deep question with two candidate moments + structural significance + a third "or something else entirely" option) operate at the bar you wanted? Does the original-wordplay-as-target replacement (Daniella's eggshells, Michelle's Eely-noise, Sarika's verb-migration) replace the LED example correctly?

2. **§6 Transplantation discipline as Phase 2 requirement** — does elevating this from "good idea" to "structural requirement, second-tier round-0 quality gate" match your intent? Or is it overweighted and should be a softer guideline?

3. **§7 Calibration-review analytical voice pattern** — the 12 depth-moves catalogued from the corpus. Does the level of detail match what you want every Phase 2 emission to embody? Specifically — the requirement "every emission embodies this voice" might be too strong for short emissions (e.g., a one-line specifics-need entry). Should the requirement scale with emission size, OR should every emission regardless of size meet the depth bar?

4. **§8 per-layer extension templates** — each layer now has a corpus-bar example of the trained disposition (Sarika's longing-triplet for L3 walk; Francisco's specificity-oscillation for L3.5; Marcus's three-word hinge for L3.75; Lichterman's strategic-architecture for L4). Are these the right corpus moves to anchor each layer? Would different ones serve better?

5. **§3 round-0 quality gate** — three tests now (Tailored swap, Purpose swap, Transplantation), then calibration-review voice. Is the order right? Or should one of the new tests fire higher in priority than the swap tests?

6. **D-2.6 scope expansion** (§11 #1) — ratify *yes, build the new service as part of D-2.6* OR redirect.

7. **The benchmark itself**: does this round-1.5 draft give you enough to ratify, OR are there sections that need more depth before round 2? Specifically — the corpus's 14 reviews carry 38+ named craft moves; this benchmark cites ~8 of them. Should I cite more to widen the bar's representation, or is the depth-per-citation more useful than breadth?

**Prompt drafting begins ONLY after Tue ratifies this benchmark.** Per the per-prompt-Tue-review directive, no Phase 2 prompt draft (D-2.2 through D-2.6) lands in code until Tue has signed off on the framing this doc establishes.

---

> **End of round-1.5 draft.** Awaiting Tue ratification.
