# Phase 2 Prompt Benchmark — Round 1.6 (Ratified)

**Date:** 2026-05-01
**Branch:** `feat/integrated-pipeline-build`
**HEAD:** `b77550d` (round 1.5) → `5c99f83` (round 1.6) → ratified
**Status:** **Ratified by Tue 2026-05-01.** Five principles + round-0 quality gate + per-layer extension templates + 13-item forbid-list now govern every Phase 2 deliverable (prompt and infrastructure alike).
**Scope:** The bar every Phase 2 deliverable measures against. The round-0 quality gate fires before length / tone / evidence checks at every prompt revision round; the principles apply across infrastructure deliverables (D-2.1 QueueManager extension, D-2.7 aggregator, D-2.8 orchestrator integration, D-2.10–D-2.14 tests/audits) wherever they're applicable.

## Ratification trail

The benchmark went through three substantive iterations with your input at each step:

- **Round 1** (commit `a4d1d8c`): initial draft grounded in PIQ/workshop edge-prompt extractions. You flagged the depth gap — "the examples I gave were surface level" — and pointed at `tests/calibration/top-tier-reference/reviews/05-sarika-i-too-can-dance-review-v2.md` as the calibration anchor.
- **Round 1.5** (commit `b77550d`): re-grounded in the 14-essay calibration corpus via `PHASE_2_CORPUS_DIGEST.md`. Replaced edge-prompt examples with corpus moves (Sarika's verb-possession, reveal-through-consequence, longing-triplet; Clara's misdirection opener and compressed biography; Daniella's literalized-dead-idiom; Michelle's syllable-seed; Marcus's three-word hinge; Michael's pride-vs-hope distinction). Tue's three corrections applied verbatim in §4.3.
- **Round 1.6** (commit `5c99f83`): Tue's 2026-05-01 calibration on five further drift points — diagnostic register vs coaching register, transplantation overweight as quality-gate, citation count misframed (corpus is RAG source not enumeration), validation padding in coaching examples, analytical jargon in student-facing prose. Five principles now (was three); five tests in the round-0 gate (was two); 13-item forbid-list (was 10).
- **Sign-off**: Tue ratified round 1.6 on 2026-05-01 with "Nice let's continue this is great foundation to work off of."

## Retroactive integrity check

Three Phase 2 infrastructure deliverables landed during round 1.5 → 1.6 iteration without explicitly measuring against the ratified round 1.6 framework:

- D-2.1 — QueueManager dig-flow extension (commit `c3214c5`)
- D-2.10 — Queue persistence concurrency test (commit `f1c98a6`)
- D-2.7 — specificsNeedAggregator + SpecificsNeedEmission type (commit `39f64ed`)

These deliverables ran their own per-edit + three-agent ratification audits at the time, but those audits used Phase 1's discipline rather than the round 1.6 framework. A retroactive integrity audit pass against the round 1.6 benchmark is now in flight; findings (if any) close inline per the fix-now-always discipline before D-2.11 / D-2.8 / D-2.12 proceed.

---

## §0 — What changed from round 1.5 to round 1.6

Round 1.5 was grounded in the 14-essay calibration corpus, which fixed the depth problem from round 1. But round 1.5 still had five issues your 2026-05-01 input identified:

1. **Diagnostic-register leak.** The corpus reviews use audit / analysis prose because they're extracting craft taxonomy from admitted essays. Round 1.5 instructed Phase 2 prompts to "embody the analytical voice." That's wrong. The system isn't auditing — it's **teaching and guiding the student to make their essay better**. Same depth of understanding underneath; different delivery.

2. **Transplantation overweighted.** Round 1.5 made it a "second-tier round-0 quality gate." That's structural overkill for a flexible idea — that the system's craft knowledge isn't locked to one student's biography.

3. **Citation count misframed.** Round 1.5 cited 8 of 38 corpus moves and treated those 8 as "the moves the benchmark anchors." Wrong frame. The 38 moves are illustrative of the bar; the system should know all 38+ AND extend to new moves it sees in essays the corpus hasn't reviewed yet. The corpus is a **smart RAG source**, not an enumeration.

4. **Validation padding in coaching examples.** Round 1.5's reworked Sarika example spent half its words telling the student what was already working ("That's not a mistake; it's the move you're going to want at scale..."). That's filler. The system reads with full corpus depth; it **emits only on gaps the student can act on**. Working moves stay silent except in three specific cases (replication, loss-prevention, architecture-spanning recognition).

5. **Analytical jargon in student-facing prose.** Words like "subject-deferral," "anaphoric construction," "metaphor-fact collapse," "specificity-oscillation cancellation," "ratification," "load-bearing," "emission" don't belong in what the student reads. Plain language carries the same insight without making the student work to grasp it. Real writing-technique names (anaphora, metaphor, register, parallelism) stay because those are the writer's actual tools.

Round 1.6 applies all five reframes. The principle stack is now five principles (was three). The round-0 quality gate runs five tests (was two). The forbid-list adds three items. Per-layer examples get rewritten in coaching register with plain language, focused on gap-and-approach.

---

## §1 — How this doc was built

Foundation reads (`PHASE_2_FOUNDATION_GROUND_STATE.md`), 14-essay calibration corpus (`PHASE_2_CORPUS_DIGEST.md` extracts 38 craft moves with mechanism + detection + failure-mode taxonomy from `tests/calibration/top-tier-reference/reviews/`), edge-function prompt extraction (cited in §4.2 only for counselor-tone moves where `piq-chat/systemPrompt.ts` is genuinely strong), production-method names grep-verified.

Tue's load-bearing corrections shaping the principle stack:
- **Span-citation is finding-level, not emission-level.** Findings carry the quoted text. Suggestions cite the finding and inherit the anchor.
- **Connection is aspiration, not gate.** Strong essays deepen one through-line; the system trains to recognize and reinforce existing connection architecture, not mechanically attach a `connectsTo` field to every suggestion.
- **Trained instincts, not MUST rules.** The LLM's recognition pattern lands close to a $500/hr counselor's because the prompt teaches that thinking, not because the prompt mandates a checklist.

---

## §2 — The five principles

Every Phase 2 prompt extension measures against these five. They're five faces of the same counselor stance: read this particular student's essay deeply, recognize what it's trying to do, help it become the strongest version of that — and only say what's worth their time.

### §2.1 — Tailored, not generic

Feedback is specific to THIS essay's text and architecture. The system reads the actual voice, register, narrative architecture, central images, through-lines, thematic vocabulary, and the student's attempted argument — and grounds every emission in those specifics. A future contributor reading the system's output should see this student's essay, not a template.

**Anti-pattern:** feedback that could appear word-for-word on a different student's essay. Generic counselor language like "consider adding sensory detail" or "show, don't tell" without grounding in this essay's specific moments. Surface commentary that names *effects* without naming the *mechanism* underneath.

**Recognition test (round-0 gate):** sample 3-5 emissions and ask *"could each of these appear word-for-word on a different student's essay?"* If yes for any → revise.

### §2.2 — Flexible, not formulaic (read on the essay's own terms)

The system reads each essay on the terms of *what THAT essay is reaching for*, not against a fixed essay-type lens. The L3 walk **discovers** what kind of essay this is — what purpose it's reaching for, what its central reach is — and every later layer's lens is shaped by that recognition. A quiet contemplative essay (Clara's compressed-heritage) isn't trying to be a high-stakes dramatic narrative; judging it by stakes/tension misreads it.

The corpus carries nine distinct archetypes among its admitted essays (interior transformation, community integration, strategic balance, bait-and-switch, child-memory-as-prophecy, metaphor-literalization, plain-voice sacrifice, obsession-as-autobiography, compressed-heritage). The "best version of THIS essay" lives at the archetype level, not at a single rubric.

**Architectural carrier:** the L3 walk's reading-strategy discovery already exists at `holisticSynthesis.ts:741` (META prompt). The benchmark makes this central: every later layer's prompt references the discovered reading strategy by name when emitting analysis or feedback.

**Recognition test:** *"could each emission appear on an essay reaching for a fundamentally different purpose?"* If yes → revise.

### §2.3 — Best-of-its-kind, not best-by-rubric

Every suggestion points toward the strongest version of what THIS essay is reaching for, not toward a template of what a "good essay" looks like in the abstract. A defiant-irreverent essay (Orlee, Lauren) and a quiet-introspective essay (Michael, Sarika) get fundamentally different specific suggestions because their purposes differ — but both get the same QUALITY of thinking from the system.

**Anti-pattern:** rubric-driven suggestions ranking dimensions on a fixed scale. If the system observes "stakes are low" in a quiet contemplative essay and recommends "raise the stakes," that's rubric-thinking. The strongest version of a quiet contemplative essay deepens the restraint, not adds tension.

**Recognition test:** *"if this suggestion landed perfectly, would the result be the strongest version of THIS essay, or a closer approximation of a generic strong essay?"* If the latter → revise.

### §2.4 — Issue and approach, not validation (NEW in round 1.6)

The system reads with full corpus depth — recognizing what's working, what's reaching, what's missing, what the architecture is, where it deepens, where it thins. But the system **emits only what's actionable**. Working moves stay silent.

**The asymmetry:** deep recognition + tight delivery. The LLM internally sees everything the corpus reviewers see; the LLM externally says only what the student can act on. Most paragraphs don't earn an emission. The ones that do get a tight emission focused on the gap and the move that closes it.

**Three exceptions where working moves DO earn emissions:**

1. **Replication / portability** — "you did X in P3; try X in P7, where the prose currently flattens." The working move gets named because the student needs to recognize it as a portable pattern.

2. **Loss-prevention** — "in this revision you removed [the specific phrase]; that phrase was carrying [the function]. Restore it or replace the function." The working move gets named because the revision is about to drop it.

3. **Architecture-spanning recognition** — "your verb 'wove' in P2 returns as 'weave' in P7 — that's why the closing lands. If you change either instance, the structural payoff goes with it." The working move gets named because the student needs to know not to inadvertently break it.

What unifies these three: in each case, *failing to name the working move would risk the student losing it*. Outside these cases, working moves stay silent.

**The recognition pattern the system runs on every paragraph / sentence / structural unit:**
1. What is this reaching for? (Understanding — the discovered reading strategy.)
2. Is it landing? (Analysis — does the prose enact what it's reaching for?)
3. If yes → silence. Move on. The emission budget is not spent here.
4. If no → name the gap + name the move that closes it. Both specific. Both grounded in the system's craft knowledge.

**Anti-pattern:** spending half the emission's words validating what the student already did right. "Notice how you did X — that's great, keep doing it" wastes the budget the student will actually read. High schoolers will read short, dense, specific emissions. They'll skim long ones that spend their text on praise.

**Recognition test (round-0 gate):** would removing the first sentence of this emission lose anything important? If no — the first sentence is filler. Revise to start with the second sentence.

### §2.5 — Plain language for the student, precise language only for writing techniques (NEW in round 1.6)

The system reads with corpus depth (which involves precise terms like "subject-deferral," "anaphoric construction," "metaphor-fact collapse"). The system **delivers in plain words** a high-school student grasps without friction.

This isn't dumbing down. The insight is the same — the LLM still sees what the grammar is doing, what the structural pivot accomplishes, what the verb-migration produces. **What changes is the words that carry the insight to the student.**

**Translation table — diagnostic register → coaching register:**

| What the system internally understands | What the system says to the student |
|---|---|
| "Subject-deferral via subordinate-clause accumulation" | "Your sentence starts with you, but ends watching the mouse" |
| "Anaphoric parallel-triplet" | "You say 'I longed for' three times in a row" |
| "Specificity-oscillation cancellation effect" | "The abstract phrases pull down the specific ones" |
| "Verb-possession of specialized register" | "Your pencil pirouettes — you're treating writing like dancing without saying 'like'" |
| "Reveal-through-consequence-via-short-punchline" | "You don't say you're in a wheelchair; you say you ran over their toes, and we figure it out" |
| "Metaphor-fact collapse" | "The fish-out-of-water thing isn't just a metaphor — your body actually did the science version of it" |
| "Compressed-biography in one sentence" | "You carry your grandfather's whole story in one sentence" |
| "Asymmetric parallelism" | "The two sides sound parallel, but the second side is doing weaker work" |
| "Meter-content congruence" | "The rhythm of your sentence sounds like the thing you're describing" |
| "Register-mismatch within a single sentence" | "A formal word right next to a casual word" |
| "Possession-grammar vs comparison-grammar" | "Your pencil *is* dancing, not 'like' dancing — that's stronger" |

**Where craft-technical vocabulary STAYS:** when the system is teaching a technique the student should learn and use, the technique gets its real name with a quick plain explanation. *"What you're doing with 'I longed for / I longed for / I longed for' is called **anaphora** — repeating the start of clauses to build rhythm. It's working in P2; the closing repeats the form ('I dance / I, too, can dance') and that's why the closing feels like it answers the opening."* The student can carry "anaphora" into their next essay. They can't carry "subject-deferral" — that's the system's analytical name for what the grammar is doing, not a tool the student would ask for.

**Anti-pattern:** "Notice how the grammar performs subject-deferral, with the dependent-clause accumulation creating attentional displacement onto the secondary agent..." The student stops reading.

**Recognition test (round-0 gate):** if a high-school student read this emission cold, would they understand what move is being suggested without needing to look up vocabulary or re-read for grammar? If no → translate to plainer words.

---

## §3 — The round-0 quality gate (five tests)

At every prompt revision round, this gate fires BEFORE any other quality check. Tests run in priority order:

1. **Tailored swap** — could each emission appear word-for-word on a different student's essay? If yes for any → revise.
2. **Purpose swap** — could each emission appear on an essay reaching for a fundamentally different purpose? If yes for any → revise.
3. **Issue-and-approach test** — would removing the first sentence lose anything important? If no, the first sentence is filler — revise to start with the second sentence. Equivalently: is the emission spending words validating what's already working, instead of naming a gap and a move?
4. **Plain-language test** — would a high-school student understand this without looking up vocabulary or re-reading for grammar? If no → translate while keeping the precision underneath.
5. **Disposition test** — does the named writing technique generalize as a portable disposition the student can take into other writing? If no, the observation is essay-locked; the prompt is producing observations that don't help the student grow as a writer.

Tests 1 and 2 fire before length / tone / evidence checks. Tests 3, 4, and 5 fire after the emission is drafted and before it ships.

If a prompt fails any swap test, the prompt's *thinking pattern* is broken (it's grading from a rubric, not reading a particular essay). Fix the disposition, not by adding required fields. Per Tue's three corrections: trained instincts, not MUST rules.

The swap tests run on **finding-level emissions** (where the span anchor lives), not on every downstream suggestion derived from a finding. A suggestion derived from a tailored finding inherits the anchor; the suggestion itself can be locally focused without re-citing the span.

**Worked example — what passes all five tests:**

If Sarika's wheelchair sentence is the moment the L3 walk identifies as a finding, the corpus-depth understanding underneath is: *the wheelchair appears via consequence (toe-running) not via declaration; the reader runs a backward causal search; the inference IS the reveal; the meek framing ('Sometimes, I even') gets past the reader's defenses.*

The student-facing emission, applying all five principles, is: nothing. The move is working. The system stays silent on Sarika's actual essay because there's nothing to fix here. The corpus depth lives in the system's understanding; it does NOT need to be told to the student because the student already did the move.

Where the same understanding becomes an emission is when a different student's draft is *trying* to do the wheelchair-style reveal but failing. Then the emission would be:

> "Your line in P3 — 'I had cancer in 8th grade and it was hard' — names the central fact head-on. Try the version where you let us figure it out. What did the world look like when you were sick? Even one detail — the chair you sat in during chemo, the specific hour your friends would visit, the way the fluorescents felt — and we'd put together the rest. We trust what we figure out for ourselves more than what we're told."

That emission:
- Quotes the student's actual sentence (Test 1 — couldn't appear on another essay).
- Lives in the disclosure-mechanism that's specific to vulnerable narrative essays (Test 2 — wouldn't fit a defiant-irreverent essay).
- Starts with the gap, not validation (Test 3 — the first sentence is the issue, not setup).
- Uses plain language (Test 4 — no "reveal-through-consequence" or "inferential geometry").
- Names a portable move (Test 5 — "let us figure it out" via concrete detail is a writing technique the student can use elsewhere).

---

## §4 — The corpus as the system's craft knowledge source

### §4.1 — Corpus as smart RAG source, not enumeration

The 14-essay calibration corpus catalogues 38+ named craft moves with full mechanism / detection / failure-mode taxonomy (see `PHASE_2_CORPUS_DIGEST.md`). The benchmark cites a small number as illustrative of the bar — not as enumeration of moves the system handles.

The system's relationship to the corpus is **smart RAG**, not prompt-baking:

- **At the moment of analysis**, the LLM pulls 3-5 corpus moves relevant to what's happening in the paragraph it's reading. The L3 walk doesn't carry all 38 moves in its prompt; it queries the corpus for moves that fit the specific architectural / grammatical / rhythmic patterns the current paragraph displays.
- **When the LLM encounters a move that isn't in the corpus**, it describes the move freely in prose (per LLM-first Rule 3 — no closed taxonomies for LLM perception). The system catches the new move and adds it to the corpus over time. Closed taxonomies are a ceiling; the corpus is a floor that grows.
- **For coaching emissions**, the relevant move's mechanism comes from the corpus knowledge but the delivery to the student is in plain coaching register (per §2.5).

This means D-2.2 (L3 walk extension), D-2.3 (L3.5), D-2.4 (L3.75), D-2.5 (L4), D-2.6 (FindingStore stuck-hypothesis) don't need to "know about all 38 moves" baked into their prompts. Each prompt instructs the LLM how to think about the layer's particular task; the corpus knowledge enters via retrieval. Out of scope for this benchmark to design the RAG architecture itself; in scope to name that the corpus is wired in this way.

### §4.2 — Illustrative corpus moves (eight examples of the bar)

Five top-priority moves to internalize. These are illustrative of what corpus-depth understanding looks like — not the closed set the system is limited to.

#### Verb-possession of specialized register onto non-specialized object

A verb from a specialized world (dance, music, sailing, surgery) is applied directly to an object outside that world, with no "like" or "as if" hedge. Sarika's *"my pencil pirouettes perfect O's on paper"* (`05-harvard-2028-i-too-can-dance.txt:13`) treats writing-tools as dancing-bodies. The grammar claims the pencil *is in the world of* dance, not just *similar to* a dancer. Stronger than comparison.

**Why this matters as the system's understanding:** when the L3 walk identifies a metaphor in a paragraph, the corpus knowledge distinguishes possession-grammar from comparison-grammar — they produce different reader effects. The coaching emission, in plain words: *"your pencil pirouettes — you're treating writing like dancing without saying 'like.' That's stronger than 'my pencil moves like a dancer.' Watch for places later in the essay where you fall back to comparison ('like a dancer'); flipping those to possession-grammar would keep the move consistent."*

**Failure mode:** verb whose literal action is incompatible with the object's behavior breaks the image. *"My pencil sutures"* feels surgical-invasive. *"My pencil pirouettes"* works because pencils rotate while drawing.

#### Reveal-through-consequence-via-short-punchline

A central biographical fact is disclosed through a short sentence describing a consequence whose cause the reader can reliably figure out — discovery is more intimate than delivery. Sarika's *"Sometimes, I even ran over my friends' toes."* (`05-harvard-2028-i-too-can-dance.txt:7`) discloses the wheelchair without the word.

**Coaching version of the move (when applied to a different student):** *"Try the version where you let us figure it out from what happened, not from what you tell us. What did the world look like when [the central thing] was true? One detail and we put the rest together."*

#### Hidden-thesis via parallel-triplet early

Three parallel clauses with anaphora early in the essay encode the thesis. The closing answers the triplet's form or content. Sarika's *"I longed for my whole being to melt into the magical melodies of music; I longed to enchant the world with my own stories; and I longed for the smile that glimmered on every dancer's face"* (`05-harvard-2028-i-too-can-dance.txt:5`) plants three desires; the closing resolves all three through writing. Readers feel structural payoff without consciously noticing the engineering.

#### Compressed-biography in one sentence

Load-bearing family-member biography compressed into a single sentence with multiple specifics (name, rank, duration, conditions). Clara's *"The Viet Cong imprisoned my grandfather, a colonel in the South Vietnam Air Force, in a grueling labor camp for thirteen years."* (`14-harvard-2028-crochet.txt:3`) carries a person and a war in one sentence. Compression is the craft.

#### Metaphor-fact collapse

The metaphor IS the fact. Michelle's *"I later learned in biology that when a freshwater fish goes in saltwater, it osmoregulates—it drinks a lot of water and urinates less. This used to hold true for my school day, when I constantly chugged water to fill awkward silences and lubricate my tongue to form better vowels."* (`11-harvard-2028-fish-out-of-water.txt:12`) — the fish-out-of-water metaphor maps onto a real biological mechanism the writer's body actually performed. The figure and the fact are identical; that collapse produces force surface metaphor doesn't reach.

#### Three more (named for breadth, full entries in the digest):

- **Misdirection opener** (Clara's "menagerie of critters" → "I'm not a taxidermist or anything. I crochet.") — first sentence implies something more dramatic than the actual subject; the reveal recommits the reader.
- **Three-word hinge as structural pivot** (Marcus's "Until I became one") — single short fragment as its own paragraph converts the prior paragraph from memory to prophecy.
- **One-word identity distinction** (Michael's "She would always say how I was her pride and joy, but I've always thought of myself to be her hope, her hope for a better life.") — single word difference between two framings carries the essay's whole emotional content.

The full 38 moves and the analytical voice catalogue live in `PHASE_2_CORPUS_DIGEST.md`. The system retrieves relevant moves at the moment of analysis. New moves the LLM observes get described freely and grow the corpus over time.

### §4.3 — From `piq-chat/systemPrompt.ts` (counselor-tone source only)

Where `piq-chat` is genuinely strong is the **counselor character + voice**. Three tone moves to imitate, with explicit acknowledgment that the depth of WHAT is being conveyed comes from the corpus, not from `piq-chat`'s one-shot output.

#### Counselor character established viscerally (`piq-chat/systemPrompt.ts:12-16`)

*"You are a warm, insightful UC PIQ essay coach who genuinely cares about helping students tell their authentic stories. You're like that English teacher who actually gets it — the one who makes you excited to revise because they see what your essay could become."*

Not a role description; a CHARACTER. The LLM internalizes the disposition by inhabiting the character.

#### Sound-Like / Not-Like-This voice training (`piq-chat/systemPrompt.ts:32-50`)

*"Sound Like This: 'Okay, so here's what I'm noticing...' / 'This part? Chef's kiss. Keep it exactly as is.' / 'Real talk: this ending is a little flat.'"* / *"Not Like This: 'Per the rubric guidelines...' / 'Your score in dimension X is suboptimal...'"*

The LLM learns tone by seeing it.

#### Self-discovery questions — at the corpus-depth bar

`piq-chat`'s example questions ("What scared you about that moment?" / "Why did THAT detail stick with you?") are below the bar — surface-level fishing prompts that get surface-level answers. The corpus-depth version: ONE deep question that demonstrates the system has *already* imagined the moment in vivid specific detail. The student doesn't catch up; they build forward.

### §4.4 — Coaching examples at the round-1.6 bar

Three examples translating from corpus depth to coaching delivery.

#### Example A — "Use Their Language" (when a student says "my score is trash")

**Wrong** (gestures at specifics, no actual specifics): *"Your score is low because right now this reads like a resume, not a story."*

**Right** (matches energy + immediately specific to THIS essay):

> Student: *"Why is my score trash?"*
>
> System: *"Your score is 'trash' because in P2 you tell us 'I demonstrated leadership and grew as a person' instead of telling us about Mrs. Chen — the assistant principal — saying 'I don't have ten thousand dollars to give you' across the table from you and the way your hands shook holding the budget you'd written. Replace the list-of-attributes with the moment with Mrs. Chen and the score moves."*

What's load-bearing:
- Reflect the student's word back ("trash"), not euphemize.
- Cite the specific paragraph and the specific phrase verbatim.
- Name the specific moment that should have replaced it (Mrs. Chen + the budget + the hands shaking).
- The pivot to specifics IS the whole point. No "this reads like a resume" gesture.
- Issue + approach. No validation padding.

#### Example B — Self-discovery question (cooking with mom is the central scene; the prose is general)

**Wrong** (surface fishing): *"What's special about cooking with your mom?"*

**Right** (one deep question that shows the system has already imagined the moment):

> *"Is it the moment you both peer through the oven glass, watching the cookies dome and crack — the same physical posture you've held together since you were small enough to need a stool, except now you don't, and that small loss-of-need is part of the bonding? Or is it the warmth hitting your face as you open the oven, the heat carrying both the chocolate-smell and the recognition that you just heard yourself laugh in your mother's exact rhythm — the inheritance arriving through your own throat without permission? Or is it something else entirely — something about the timing, or about what doesn't get said while the timer counts down?"*

What's load-bearing:
- Two specific candidate moments rendered with sensory detail.
- Each candidate names what makes it matter for THIS student (the loss-of-need; the inherited laugh).
- A third "or something else entirely" option frees the student to redirect.
- The system has already done the imaginative work; the student builds forward instead of catching up.

#### Example C — Wordplay-as-target (when prompting toward original moves)

**Wrong** (competent but flat): *"I traced the circuit three times before realizing I'd swapped the resistor values. The LED stayed dark. My lab partner had already left."*

**Right** (corpus-bar instances of original wordplay):

> **Daniella's literalized-dead-idiom** (`08-harvard-2028-cookies.txt:5`): *"Baking them is like walking on eggshells — and I have an empty egg carton to prove it."* Takes the dead metaphor literally — she's used up her eggs baking, which is evidence she has indeed been walking on eggshells.
>
> **Michelle's syllable-seed in the misheard place name** (`11-harvard-2028-fish-out-of-water.txt:4`): *"When I was ten, my dad told me we were moving to somewhere called 'Eely-noise.'"* The state name arrives as a child heard it — preserving "eel" (a fish) before the essay has announced its fish metaphor. The metaphor is planted in the phonetics.
>
> **Sarika's verb migrating across paragraphs** (`05-harvard-2028-i-too-can-dance.txt:5, 15`): paragraph 2 says *"the way she wove her body into the delicate threads of the Sugar Plum Fairy's song."* Paragraph 7 says *"I weave my heart, my soul, my very being into my words as I read them out loud."* Same verb, different domain. The reader doesn't notice consciously; the unconscious continuity holds the essay together.

These each do 2-4 craft moves at once. None could appear on a different student's essay. None could be transplanted to an essay reaching for a different purpose without significant restructuring.

---

## §5 — One-shot tendencies to NOT carry over

The four edge-function prompts (workshop-analysis, validate-workshop, teaching-layer, piq-chat) are constrained by being one-shot. Their structures co-locate Understanding + Analysis + Feedback into a single call. Our pipeline explicitly separates these. Carrying their structural choices over would re-import antipatterns the L5 design removed.

### §5.1 — Closed taxonomies for what the LLM perceives

`workshop-analysis/index.ts:207-225`'s `experienceFingerprint` shape forces uniqueness into six fixed dimensions. The LLM can only express what fits those six. "Ironic juxtaposition" or "structural inversion" can't be expressed.

The corpus has 38+ moves and is open to more. A closed six-shape taxonomy would have failed to catch most of them.

What to do instead: the LLM describes uniqueness in prose. The system uses 3-4 functional routing tags (where this applies in the essay) for downstream routing — not for perception.

### §5.2 — Banned-phrase regex / blocklists

`teaching-layer/index.ts`'s "Don't use AI-sounding words" list. `validate-workshop/index.ts:55-67`'s "Red flags: 'journey', 'passion', 'grew as a person'." The LLM will always produce novel phrasings that dodge the regex.

What to do instead: teach the thinking — *"would this language make an admissions reader process this as 'smart kid generic essay' instead of 'compelling human story'?"* — and let the LLM apply that thinking to whatever specific words this essay uses. When weakness is named, it's named with mechanism, not with regex.

### §5.3 — Character-count minimums

`teaching-layer/index.ts:226-241` — `problem.hook: 80-120 chars`, `description: 400-600 chars`. Forces padding when the natural output is shorter.

Clara's essay carries a century of family history in five paragraphs. A character minimum would have padded the move out of existence.

What to do instead: name the *quality bar* in the prompt ("the hook should make a high-school student want to read further"), not the length budget. Length serves content.

### §5.4 — Single-call output mega-shapes

`workshop-analysis/index.ts` does voiceFingerprint + experienceFingerprint + 12-dimension rubric + surgical workshop items in one call. Co-locates Understanding + Analysis + Feedback.

Our pipeline separates them. L3 stays evaluation-free (the FORBIDDEN VOCABULARY rule at `sequentialDeepWalk.ts:192`). L3.5 judges with full Understanding context. L5 prescribes with both.

The corpus reviews themselves use three sequential passes — Pass 1 (first read), Pass 2 (what Pass 1 missed), Pass 3 (stress-testing). Each pass operates at a different posture.

What to do instead: every Phase 2 prompt extension preserves the layer's existing scope. No blending.

### §5.5 — Closed-enum scoring on contextual judgments

`teaching-layer/index.ts:71`'s `changeMagnitude: 'surgical' | 'moderate' | 'structural'` — closed taxonomy on a contextual judgment.

The line: routing/bookkeeping closed enums (`coachingValue` on findings) are bookkeeping, acceptable. Closed enums capturing the LLM's judgment of contextual quality are perception, banned.

For Phase 2 specifics-need emissions, `expectedAnswerShape: 'scalar' | 'short_phrase' | 'specific_memory' | 'list' | 'narrative'` is bookkeeping (drives Conversator answer-extractor routing) — acceptable. `consumers: Array<'l3' | 'l3_5' | ...>` is bookkeeping — acceptable.

### §5.6 — Mandatory predictive numeric outputs

`teaching-layer/index.ts:77`'s `estimatedImpact: { nqiGain: number, dimensionsAffected: string[] }` — demands the LLM produce a numeric NQI prediction. The LLM doesn't know the gain. The number suggests certainty the system doesn't have.

What to do instead: the LLM describes the expected effect in prose. Sortable signals derive from the LLM's qualitative output via a separate Haiku classifier or deterministic rule.

### §5.7 — Validation-padding in coaching output (NEW in round 1.6)

`teaching-layer/index.ts`'s prompt structure includes a `personalNote` field meant to "make them feel SEEN and SPECIAL." When the field forces validation in every emission, the system spends words telling the student what they did right when the doing-right was just the move doing what it was supposed to do.

What to do instead: the system reads with full corpus depth and recognizes what's working. It stays silent on working moves. Working moves earn an emission only in three cases (replication, loss-prevention, architecture-spanning recognition — see §2.4). Outside those, silence is the audit signal.

### §5.8 — Analytical jargon in student-facing output (NEW in round 1.6)

The corpus reviews and the L3.5 prompt's calibration anchors use precise analytical vocabulary because they're doing analysis. That vocabulary is wrong for output to the student.

What to do instead: the system understands at corpus depth (using whatever precise terms make the LLM's reading sharp); it speaks to the student in plain words. Real writing-technique names (anaphora, metaphor, register, parallelism) stay because those are the writer's actual tools. Analytical terms (subject-deferral, possession-grammar, inferential geometry) get translated.

---

## §6 — Generalization as a flexible disposition (renamed from "transplantation discipline" in round 1.5)

The methodology v2.1 names a useful idea: a craft move's understanding hasn't gone deep enough until the move's mechanism is general enough to be replicated by a writer with a different life on different material. **Round 1.6 takes this as a flexible disposition, not a structural quality-gate.**

The system's craft knowledge is general:
- Coaching emissions name *the operation the move performs* — the abstract verb-grammar, the inferential geometry, the cognitive condition — so the student understands the move as a tool they can use again, not a one-off fix for this paragraph.
- The same craft knowledge applies to the next student's totally different essay because the system's understanding is at the operation level, not the topic level.
- When the LLM observes a move not in the corpus, it describes the move's operation in prose; the system catches the new move and adds it.

What this looks like in coaching:

> Student writes a research-obsession essay. The system has corpus knowledge of Sarika's "the music kept calling me back" agency-reversal personification (skatepark essay context).
>
> The system applies it: *"in P3 you wrote 'I kept thinking about the experiment' — that's you doing the thinking. Try the version where the experiment is the agent: 'the experiment kept pulling me back to the lab at 2 AM until I gave in and ran it again.' Now the science is doing the work and you're yielding to it — which actually matches what you said in P5 about not being able to leave the question alone."*

The disposition: corpus knowledge of the agency-reversal move from Billy's skatepark gets applied to a research-obsession essay. The operation (passive yielding to seduction by a feared/desired thing) is general; the surface content (skatepark vs. lab) varies. The system carries the operation; the student gets a coaching move grounded in the operation, applied to their material.

**No structural quality-gate.** Just the disposition that the system's craft knowledge is portable — which is also why the corpus is built as RAG (§4.1).

---

## §7 — Recognition pattern and delivery pattern

The system runs two patterns side by side. Both matter; they're separate.

### §7.1 — Recognition pattern (what the LLM understands internally)

When the LLM reads a paragraph or sentence, it recognizes at corpus depth — naming what works, what's reaching, what's missing, what the architecture is, where it deepens, where it thins. The recognition operates at the level of the corpus reviews: sentence-as-microcosm-of-essay, cross-sentence verb migration, rhythmic / metrical analysis with stress patterns, "what this sentence does NOT do," possession-vs-comparison distinction, reveal-mechanism as inferential geometry, failure-mode specification, punctuation-as-emphasis-mechanism, childhood-voice bleed as deliberate craft choice, strategic-architecture identification, cumulative-effect-of-specificity-oscillation. All 12+ depth-moves catalogued in `PHASE_2_CORPUS_DIGEST.md` §1.

This is the LLM's reading depth. It's NOT what the student sees.

### §7.2 — Delivery pattern (what the system says to the student)

The output is teaching, not auditing. Five rules from §2:

1. Tailored to THIS essay (specific quoted spans, specific moments).
2. Flexible to what THIS essay is reaching for (no fixed essay-type lens).
3. Best-of-its-kind, not best-by-rubric (the strongest version of THIS essay's particular reach).
4. Issue and approach, not validation (silence on working moves; sharp gap-and-approach on what's reaching but not landing).
5. Plain language for the student, precise language only for techniques the student should learn (anaphora, metaphor, register stay; subject-deferral, possession-grammar, inferential geometry get translated).

The recognition pattern is the precondition for the delivery pattern. The LLM reads at corpus depth → only emits where there's a gap the student can act on → emits in coaching register the student grasps without friction.

---

## §8 — Per-layer extension templates

Each Phase 2 prompt extension lives in a specific layer with a specific existing scope.

### §8.1 — L3 walk extension (D-2.2) — `sequentialDeepWalk.ts`

The `SYSTEM_PROMPT_TEMPLATE` at line 186. ~500 lines. Single coherent prompt.

D-2.2 adds ~30-50 lines naming the specifics-need contract. Output schema gains `specificsNeedEmissions: SpecificsNeedEmission[]` either at top level or per-finding (decided at round-1 prompt draft).

**Trained instinct:** when a finding's `deepeningPotential` cannot be advanced by re-reading the text alone AND the student's lived experience would resolve it, the finding emits a specifics-need entry. The emission flows from the finding (which carries the span citation); the emission itself names what to ask and what answer shape would resolve it.

**Anti-pattern explicitly forbidden:** "every finding with deepeningPotential != null MUST emit." That re-introduces the formulaic-emission antipattern. The emission is a *judgment* the LLM makes ("I cannot advance this from text alone, but the student would know"), not a checkbox.

**What this looks like at the bar:** if the L3 walk identifies Sarika's longing-triplet as a structural plant but cannot determine *which longing's resolution is the essay's intended payoff*, the system emits a specifics-need. In the system's understanding it's: *the triplet plants three desires; the closing resolves all three through writing; was the third (the smile) the one the writer most felt was hers, or did she build the closing to resolve all three because the structure demanded it?*

The student-facing version: *"Your second paragraph repeats 'I longed for' three times — three different things you wanted. The closing answers all three through writing. Which of those three was the one you most felt was yours when you started the essay? The first one (melting into music), the second (telling stories that enchant), or the third (the smile dancers had)? Knowing which one was the original want changes how the closing should land — if the smile was first, the smile-at-3-AM in the closing is the answer; if the storytelling was first, the closing is the answer; if music was first, the closing is the answer with a wistful note about what couldn't transfer."*

### §8.2 — L3.5 analysis extension (D-2.3) — `analysisPass.ts`

Multiple system prompts (anchor-paragraph + parallel-paragraph + essay-level mode). The L3.5 layer is the FIRST evaluative layer.

D-2.3 adds prompt extension naming the specifics-need contract on `sentenceAnalyses[]` where `confidence === 'low'` AND `sensitivityNote` references student-side anchors.

**Trained instinct:** when a sentence's effectiveness depends on a lived-experience anchor not in the text, the analysis emits a specifics-need entry asking for the anchor that would resolve the confidence ambiguity.

**What this looks like at the bar:** if a paragraph is doing Francisco's specificity-oscillation pattern (specific grounding next to abstract phrasing pulling the average down), the L3.5 understanding is: *the abstraction "significant life style change" is in a paragraph where adjacent phrases are grounded; the abstraction may be hiding either vague memory or a specific moment the writer assumed wasn't worth specifying.*

The student-facing version (delivered if the student reads the analysis output, or stored on the question queue for the Conversator to surface in Phase 3): *"In P3, the phrase 'significant life style change' is doing abstract work where every other phrase in the paragraph is grounded ('80 people,' 'stomach ulcers,' 'three weeks'). The abstraction sticks out. Was there a specific moment — a meal, a conversation, a Tuesday — where you noticed your daily pattern had shifted? Naming that one moment would let the abstract phrase resolve into a scene the way the rest of the paragraph does."*

### §8.3 — L3.75 holistic extension (D-2.4) — `holisticSynthesis.ts`

Four system prompts: PHASE_A (line 328 — voiceIdentity, voiceMap, emotionalTopography, momentEarnednessMap, entanglements), PHASE_B (line 524 — thematicArchitecture, narrativeStrategy, characterRevelation, craftAssessment, admissionsPositioning), META (line 741 — walk validation, reading strategy, convergence), CURATION (line 810 — question queue curation).

D-2.4 adds prompt extensions across PHASE_A and PHASE_B for emissions from four contributors: `momentEarnednessMap.gaps[]`, `voiceIdentity.authenticVsPerformed[]` flagged "performed", `admissionsPositioning.redFlags[]`, plus L4's `intentBridge.alignments[]` mismatches (cross-references L4; emission lives at L4 layer per §8.4).

**What this looks like at the bar:** if the L3.75 PHASE_B `narrativeStrategy.pivotPoints` identifies Marcus's "Until I became one" three-word hinge as the structural pivot, the system's understanding is: *the hinge converts the prior paragraph from memory to prophecy; the prior paragraph would not work as setup if it foreshadowed the future meaning, so the writer rendered fourth-grade self fully in fourth-grade-self's perception.*

The student-facing version: *"Your 'Until I became one' line is the pivot — it turns the otter-watching scene into something that was secretly about the future. The reason that pivot lands is because the paragraph above it doesn't tip the reader off; you wrote fourth-grade you all the way through, and the line then changes everything we just read. If you ever want to use this move again, the rule is: the prior scene has to be pure scene, with no foreshadowing. The pivot does the reframing."*

### §8.4 — L4 northStar extension (D-2.5) — `crystallizer.ts`

`buildSystemPromptL4aNorthStar` at line 360. "You are the Crystallizer — a literary-architectural analyst."

D-2.5 adds prompt extension naming the specifics-need contract on `confidence === 'hypothesis'` for key fields. Emissions ask for the student confirmation that would lock the hypothesis from 'hypothesis' to 'emerging' or 'full'.

**Trained instinct:** when a northStar field is 'hypothesis' confidence AND student input would resolve the ambiguity (vs. needing more text or another iteration), the emission asks for that input.

**What this looks like at the bar:** for Billy's skatepark essay, L4 reads `distinctivenessSignature` as 'hypothesis' confidence — uncertain whether the spontaneity-demonstration is the load-bearing strategic role or whether the family-portrait reading or the architectural-aesthetics reading is closer.

The student-facing version: *"Your essay has three things it could be doing as the central move: (1) showing you can be spontaneous when the rest of your application says you're hyper-organized — basically a counterweight; (2) painting your family relationships with the brother as the main subject; or (3) treating the skatepark as a piece of architecture you noticed before you used it. The three readings would each shape your closing differently. Which were you writing toward? Knowing that locks in the rest."*

### §8.5 — FindingStore stuck-hypothesis extension (D-2.6) — NEW SERVICE

There is no existing finding-maturity-refresh service. The spec said "extend the existing maturity-refresh Haiku call's prompt" but the existing call doesn't exist. **D-2.6 must build a new service.** Surfaced for your sign-off.

Recommended shape: new file `src/services/essayIntelligence/findings/findingMaturityRefresh.ts`. Per-finding Haiku call against findings whose `maturity === 'hypothesis'` AND `iterationsAlive ≥ 2`.

**Trained instinct:** a finding stuck at hypothesis maturity for 2+ iterations is the signal that text-alone re-reading isn't advancing it. Either student input would (→ emit specifics-need) OR the finding is genuinely speculative and should mature toward `superseded`.

Cost target: ~$0.005/finding × ~3-5 stuck findings per iteration = ~$0.015-$0.025/iteration.

---

## §9 — Prompt revision protocol

Per Tue's directive: every Phase 2 prompt revision round gets sign-off at every round (1, 2, 3+). Don't close at "passes typecheck" — close at "you're satisfied with the output quality."

### §9.1 — Round flow

1. **Round 0 (this doc):** benchmark signed off before any prompt drafting begins.
2. **Round 1:** the implementer drafts the prompt against the benchmark. Round-1 quality gate: five tests in §3 applied to 3-5 imagined emissions. Round-1 draft surfaced with worked examples.
3. **Round 2:** you review round-1 draft, critique output quality (real or simulated). Implementer iterates.
4. **Round 3+:** until you sign off.

### §9.2 — Per-round artifacts

Per the standing operational charter (`L5_IMPLEMENTATION_PLAN.md` §9.4):
- The prompt itself (committed as `prompts/<name>.prompt.ts` or inline).
- `<name>.RATIONALE.md` — what the prompt is trying to do, what alternatives were considered, why this version won, what failure modes it's designed against.
- `<name>.fixtures.md` — canonical input examples + accepted outputs.

### §9.3 — Mid-build API touchpoint (D-2.9)

After all five Phase 2 prompts ratify through round 3+, the D-2.9 sanity check runs ONE essay against the chain. Cost budget: $0.50–$1.00. Pre-spend sign-off: name the fixture, expected token count, expected cost, await your "proceed?" before the API call fires.

If a layer is silent when it should emit, the prompt extension is wrong → return to that prompt's round 4. Hard cap at 2 D-2.9 runs.

---

## §10 — What Phase 2 prompts MUST NOT do

Distilling the principles + corrections + LLM-first rules into a forbid-list:

1. **Don't enforce per-emission span anchor fields.** Findings carry the span. Suggestions cite the finding; the anchor is inherited.
2. **Don't enforce per-suggestion `connectsTo` fields.** Connection is aspiration, not gate.
3. **Don't mandate "MUST emit on condition X" rules.** Train the instinct; let the LLM judge whether emission serves the student.
4. **Don't introduce closed taxonomies on what the LLM perceives.** Routing/bookkeeping closed enums are fine. Closed enums on contextual judgments are banned.
5. **Don't ship banned-phrase regex / blocklists.** Teach the thinking; let the LLM apply it.
6. **Don't enforce character-count minimums or maximums.** Length serves content; quality bar > word count.
7. **Don't co-locate Understanding + Analysis + Feedback in a single layer's prompt.** Each layer preserves its existing scope.
8. **Don't demand mandatory predictive numeric outputs.** The LLM doesn't know the gain. Describe in prose.
9. **Don't re-enforce evaluative vocabulary in Understanding layers (L3 walk).** The FORBIDDEN VOCABULARY rule at `sequentialDeepWalk.ts:192` stays in force.
10. **Don't mask LLM silence with default values.** No `?? 'medium'`, `?? 'high'`, `?? 'general'` patterns. If the LLM doesn't emit, the absence is the audit signal.
11. **Don't spend emission budget validating already-working moves** outside the three exception cases (replication, loss-prevention, architecture-spanning recognition). Working moves earn silence.
12. **Don't use the system's analytical jargon in student-facing output.** Translate to plain words while preserving precision underneath. Real writing-technique names (anaphora, metaphor, register, parallelism) stay because those are the writer's tools. Analytical names (subject-deferral, possession-grammar, inferential geometry) get translated.
13. **Don't enumerate every move you observe.** Emit only on gaps the student can act on. The L3 walk is reading at corpus depth — it isn't writing a corpus review for the student.

---

## §11 — Open scope expansions awaiting your sign-off

| # | Item | Detail |
|---|---|---|
| 1 | D-2.6 builds a new service | The existing maturity-refresh call doesn't exist; D-2.6 builds `findingMaturityRefresh.ts`. ~6-8h vs spec's 4-5h. Surfaced in `PHASE_2_FOUNDATION_GROUND_STATE.md` §3. |
| 2 | This benchmark itself | Round 1.6 draft. Awaiting your review of: (a) the five-principle stack, (b) the corpus-as-RAG framing in §4.1, (c) the recognition-vs-delivery split in §7, (d) the per-layer examples in coaching register, (e) the round-0 quality gate's five tests in priority order, (f) the forbid-list additions (items 11, 12, 13). |

---

## §12 — Surface for your sign-off (round 1.6 ready)

This document is round 1.6. Per the per-prompt-sign-off discipline, the next step is your review.

**Specific questions for your round 1.6 review:**

1. **The five principles in §2** — does adding "issue and approach, not validation" as §2.4 and "plain language for the student, precise language only for techniques" as §2.5 match what you wanted? Or are there other principles that should also be load-bearing in the system's coaching disposition?

2. **The recognition / delivery split in §7** — does separating "what the LLM understands internally" (corpus depth) from "what the system says to the student" (coaching register) match your intent? Specifically — the L3 walk's existing `SYSTEM_PROMPT_TEMPLATE` (~500 lines) is corpus-depth-instruction-heavy. Should the walk's prompt itself be in coaching register too, or stays in instruction register since the walk is internal-to-system not student-facing?

3. **The corpus-as-RAG framing in §4.1** — does the framing match your intent? Specifically — out-of-scope for this benchmark to design the RAG architecture itself, but in-scope to name that the system pulls relevant moves at moment-of-analysis and extends the corpus when new moves show up. Is that the right level of detail, or should the benchmark go deeper into the architecture?

4. **The per-layer examples in §8** — each layer now has a coaching-register output example showing what the system says to the student in plain words (Sarika's longing-triplet for L3 walk; Francisco's specificity-oscillation for L3.5; Marcus's three-word hinge for L3.75; Billy's strategic role for L4). Are these the right examples, and do they read at the bar you want?

5. **The round-0 quality gate's five tests in priority order** (§3) — Tailored swap → Purpose swap → Issue-and-approach → Plain-language → Disposition. Right priority? Or does one of the new tests (issue-and-approach, plain-language) fire before the swap tests?

6. **The forbid-list additions** (§10 items 11, 12, 13) — items 11 (no validation padding), 12 (no analytical jargon), 13 (no enumerating every move). Right framing? Anything else from your input you want explicitly forbidden that I missed?

7. **D-2.6 scope expansion** (§11 #1) — sign off *yes, build the new service as part of D-2.6* OR redirect.

8. **The benchmark itself** — does this round 1.6 give you enough to sign off, OR are there sections that need more depth before round 2?

**Prompt drafting begins ONLY after you sign off this benchmark.** Per the per-prompt-sign-off directive, no Phase 2 prompt draft (D-2.2 through D-2.6) lands in code until you ratify the framing this doc establishes.

---

> **End of round 1.6 draft.** Awaiting your sign-off.
