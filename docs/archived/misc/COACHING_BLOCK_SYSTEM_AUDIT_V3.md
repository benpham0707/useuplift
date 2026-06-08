# Coaching Block System Audit V3: Mode-Specific Quality Evaluation

> **Purpose**: Evaluate the block system's coaching output for each of the 5 modes against the standard of a $600/hr elite counselor AND a $1200/hr counselor who is also a published author with an MFA. V2 only tested first-encounter coaching. V3 tests every mode, with scenarios designed to expose the failure modes unique to each.

> **What changed from V2**: V2 evaluated coaching as a PROCESS ("does it detect resistance?") and as a TRANSFORMATION ENGINE ("would the arc produce a better essay?"). V3 evaluates coaching as a MODE-SPECIFIC CRAFT — does the revision coach do what ONLY a revision coach should do? Does the iteration coach know when to stop? Does the architecture coach resist the urge to nitpick sentences? Each prompt tests both the MODE-SPECIFIC behavior AND the underlying quality.

> **The A+++ Standard**: A+ coaching diagnoses correctly and demonstrates craft moves. A++ coaching teaches transferable principles the student will use on their next essay. A+++ coaching changes how the student SEES their own writing permanently — the insight lives in the student's mind after the session ends, and they hear the coach's voice when they write alone. The test is: would the student still benefit from this coaching turn if they deleted the coach's message and had to reconstruct it from memory?

> **How to use**: Run each prompt as a separate Opus conversation. Feed in the essay text + the mode's assembled prompt (from `buildCoachingPrompt()`) + the scenario context. Then evaluate the coaching response against the rubric. The evaluator should be ruthless — the standard is not "good for AI" but "as good as the best human coach you've ever seen."

---

## TEST ESSAY (Different from V2 — avoids pattern-matching against piano essay)

```
My mother speaks to me in Gujarati and I answer in English. This is not a
language barrier. It is our language — a third thing, neither hers nor mine,
that we built without realizing it.

When I was twelve, I sat in Dr. Reeves's office and watched him explain my
mother's test results to me, not to her. He used words I knew in English but
not in Gujarati. "Myocardial infarction." I looked at my mother, who was
gripping the armrest like it might leave, and I said: "Your heart is working
too hard, Ma." I made that up. I didn't have the real words. But she nodded,
and for a moment the made-up translation was the truest thing in the room.

I've been translating since I was seven. Dentist appointments, tax forms,
parent-teacher conferences, the cable company, the DMV. Each one taught me
that translation is not about words. It's about what the person on the other
side of the language needs to feel.

By sophomore year I was the person my parents' friends called too. Mrs. Kapoor
needed help with insurance claims. Mr. Shah brought his lease renewal. I sat
at our kitchen table with their paperwork and my laptop, looking up terms I'd
never seen in either language, and I thought: I am fifteen and I am someone's
last option.

The weight of that — being someone's last option — is the thing I think about
when people ask me why I want to study medicine. It's not because I love
science (I do). It's because I already know what it feels like to be the
person standing between someone and the thing they need to understand. I've
been doing that since I was seven, in waiting rooms, with words I had to
invent. Medicine would just give me better words.
```

**Essay profile**: Phase = CRAFT (structure works, sentences need refinement). North Star = "the weight of being someone's last option." Voice identity: direct, understated, physical verbs, short sentences. Strongest voice in P2 (cardiologist scene) and P4 ("I am fifteen and I am someone's last option").

**Student context** (accumulated across prior turns): Name is Priya. Parents immigrated from Gujarat. Father works in a warehouse, mother is a home health aide. Mrs. Chen reference is from a different student's essay — this is Priya's essay. The "made-up translation" is the sentence she's most proud of. She's worried the essay is "too simple" and doesn't show enough "intellectual depth."

**Coaching history** (3 prior turns):
- T1: Coach identified P2 as the essay's emotional center. Named the "invented translation" as the best sentence. Suggested the essay is about holding adult weight in a child's body.
- T2: Student shared that she's worried it's "not impressive enough." Coach reframed: the essay's power is in its restraint, not its ambition. Named UNDERSTATEMENT as a craft technique.
- T3: Coach identified P3 as the weakest section — it's a list where it should be a scene. Suggested picking ONE of the translation moments and dropping the reader into it the way P2 drops them into the cardiologist's office.

---

## PROMPT 1: First-Encounter Mode — Diagnostic Intelligence

The student just submitted the essay. No prior coaching. No edits. The system detects `first_encounter` mode and assembles the first-encounter prompt.

```
You are a writing coach who has worked with 500+ college essay students AND
published two books on creative nonfiction craft. You understand both the
admissions game AND the writing craft at an MFA level.

I'm going to show you a student's essay and the AI coach's FIRST response.
Your job: evaluate this response against the standard of a $1200/hr counselor
who is also a published author. Not "is this good for AI?" but "would I pay
for this?"

═══════════════════════════════════════
ESSAY: [Priya's translation essay above]
═══════════════════════════════════════

STUDENT MESSAGE: "Hi, I just finished this essay. What do you think? I'm not
sure if it's good enough."

AI COACH RESPONSE: [INSERT ACTUAL SYSTEM OUTPUT]

═══════════════════════════════════════
EVALUATION RUBRIC — FIRST ENCOUNTER A+++ STANDARD
═══════════════════════════════════════

Score each dimension 1-10. A 10 means "this is what the best human coach in
the world would say." A 7 means "competent professional." A 5 means "generic
AI output." Below 5 means "actively unhelpful."

### DIMENSION 1: The Non-Obvious Insight (Weight: 25%)

Does the coach see something the student CANNOT see about their own essay?

- 10: Names something that will reshape how the student thinks about their
  essay permanently. Not "your opening is strong" but a connection or tension
  the student will think about for days.
- 7: Identifies a real structural or thematic insight the student likely missed
- 5: States something observably true but obvious ("P2 is your strongest paragraph")
- 3: Generic feedback applicable to any essay ("show don't tell")

For THIS essay specifically, the non-obvious insights a $1200/hr counselor
would see:
- The essay's REAL subject isn't translation — it's the sentence "I am fifteen
  and I am someone's last option." That sentence is the thesis. Everything else
  is evidence for it.
- The "made-up translation" in P2 isn't just a good detail — it's the essay's
  ARGUMENT. The essay is claiming that invented words can be truer than real
  ones. That's a philosophical position about language that most 17-year-olds
  can't articulate, but Priya ENACTED it in the cardiologist's office.
- P5's "Medicine would just give me better words" is doing something
  structurally rare: the career aspiration isn't separate from the essay's
  emotional core. It emerges FROM the narrative. This is architecturally
  sophisticated — most students bolt their "why I want to study X" onto the
  end. Priya's grows out of the middle.
- The essay's weakness is P3 — it's a LIST where P2 and P4 are SCENES. The
  list interrupts the essay's emotional altitude. But the fix isn't "add more
  detail to P3" — it's deciding whether P3 needs to EXIST, or whether the
  essay should go directly from the cardiologist's office (P2) to the kitchen
  table (P4), trusting the reader to infer the years of translation between.

### DIMENSION 2: Craft Specificity (Weight: 20%)

Does the coach name SPECIFIC, LEARNABLE craft principles — not generic advice?

- 10: Names a craft technique the student has never heard of, demonstrates it
  using their own text, and explains the reader effect. The student could apply
  this technique to a different essay.
- 7: Names a recognizable craft principle and applies it specifically
- 5: Gives advice that's correct but unnamed ("your P3 could be more specific")
- 3: Generic writing advice ("use sensory details")

For THIS essay, craft moves a $1200/hr counselor would teach:
- EARNED EMOTIONAL PAYOFF: P5's "Medicine would just give me better words"
  EARNS its resonance because P2 established what it means to not have the
  right words. The payoff works because the setup works. If P2 were weaker,
  P5 wouldn't land.
- UNDERSTATEMENT AS POWER: "I made that up" is the essay's most powerful
  sentence BECAUSE it's four words. A weaker writer would explain: "I felt
  the weight of responsibility as I improvised a translation." Priya's version
  trusts the reader. That trust IS the voice.
- STRUCTURAL ECHO: P1's "a third thing, neither hers nor mine" echoes in P2's
  "the made-up translation was the truest thing in the room." Both are about
  invented language being realer than real language. This echo isn't accidental
  — it's the essay's through-line. But it could be made more intentional.
- THE CUT TEST: P3 is 3 sentences and adds zero narrative momentum. The essay
  goes P2 (life-or-death translation, age 12) → P3 (list of mundane
  translations) → P4 (being someone's last option, age 15). The emotional
  altitude drops in P3 and has to rebuild in P4. A $1200/hr counselor would
  say: "What if P3 didn't exist? Read P2 then P4. Does the essay lose anything
  essential? If not, cut P3 and you gain 45 words for the ending."

### DIMENSION 3: Emotional Calibration (Weight: 15%)

Does the coach read the student's STATE and respond appropriately?

- 10: The coach's tone perfectly matches what the student needs RIGHT NOW. Not
  what a "good coach" sounds like in general — what THIS student needs at THIS
  moment. The student feels seen, not coached.
- 7: Appropriate tone, reads the emotional context
- 5: Professional but generic — could be talking to any student
- 3: Misreads the student's state (e.g., gives harsh feedback when student is
  vulnerable, or gives validation when student needs honesty)

For THIS student: Priya said "I'm not sure if it's good enough." She's
insecure but the essay is actually STRONG. The $1200/hr counselor's move:
honest assessment that names what's working WITHOUT false encouragement.
"This essay is doing something most essays can't. Here's specifically what —
and here's the one thing that's preventing it from being as good as it
should be." The calibration is: respect the work (it's genuinely good),
address the insecurity (name why it's good with specifics), then redirect to
the real issue (P3, or whatever the coach identifies as the highest-leverage
improvement).

### DIMENSION 4: Actionability of Next Step (Weight: 15%)

Could the student sit down and DO something specific after this response?

- 10: The next step is so clear the student could start writing within 60
  seconds of reading the coach's message. It's specific ("rewrite P3 as a
  single scene — pick the translation moment that changed how you thought
  about what you were doing") and appropriately scoped (one paragraph, not
  the whole essay).
- 7: Clear next step, could be done in one sitting
- 5: Direction given but vague ("think about what P3 is doing")
- 3: No clear next step, or too many steps listed

### DIMENSION 5: What the Coach Doesn't Say (Weight: 10%)

Restraint is as important as insight. Does the coach avoid:
- Listing 5 observations when 1 deep one would be better?
- Commenting on the essay's few weak sentences when the big issue is structural?
- Suggesting the essay needs "more intellectual depth" (which would ruin it —
  the essay's power IS its simplicity)?
- Praising so much that the student thinks nothing needs to change?
- Rewriting the essay (ghostwriting)?

- 10: Every sentence in the response earns its place. Nothing is filler. The
  coach said exactly what needed to be said and nothing more.
- 7: Mostly disciplined, one or two unnecessary observations
- 5: Some bloat — observations that don't advance the student's understanding
- 3: List-based response, covers everything at surface level

### DIMENSION 6: Would This Change How the Student Sees Their Essay? (Weight: 15%)

The A+++ test. After reading this coaching response, does the student:
- See their essay differently than they did before? (Not "I know what to fix"
  but "I understand something about my own writing I didn't understand before")
- Understand a PRINCIPLE they can apply to future writing?
- Feel that the coach understood their essay better than they understand it
  themselves?

- 10: The student re-reads their own essay after this response and sees
  something they never saw before. The coach's insight becomes part of how
  the student thinks about writing permanently.
- 7: The student has a clear, useful new perspective
- 5: The student knows what to fix but hasn't learned anything transferable
- 3: The student has the same understanding of their essay, plus a to-do list

### COMPOSITE SCORING:
- 55+ / 60: A+++ (Changes how the student thinks about writing)
- 48-54 / 60: A+ (Matches the best human coaching)
- 42-47 / 60: A (Strong professional coaching)
- 36-41 / 60: B+ (Competent, above average)
- 30-35 / 60: B (Adequate professional)
- Below 30: Not competitive with elite human counselors

### BONUS EVALUATION:
- What would the $1200/hr counselor say that this response DOESN'T?
- What does this response say that the $1200/hr counselor WOULDN'T?
- If you could add ONE sentence to this response, what would it be?
- If you could delete ONE sentence, which would you cut?
```

---

## PROMPT 2: Revision Response Mode — Delta Intelligence

The student revised P3 based on coaching advice (replace the list with a scene). The system detects `revision_response` mode. The edit intelligence shows: P3 content rewrite (significant), apparent purpose "replacing list with specific scene."

```
You are a writing coach who specializes in REVISION coaching — not first
reads, but responding to drafts 2, 3, 4. You know the difference between
coaches who can diagnose an essay (many) and coaches who can coach a
REVISION (few). The revision coach must: see what changed, name what the
change accomplished, catch what the change broke, and give exactly one
next step.

═══════════════════════════════════════
ESSAY: [Same essay, but P3 is now revised]

OLD P3: "I've been translating since I was seven. Dentist appointments, tax
forms, parent-teacher conferences, the cable company, the DMV. Each one
taught me that translation is not about words. It's about what the person
on the other side of the language needs to feel."

NEW P3: "At the dentist when I was nine, I told my mother the hygienist
said 'no cavities' when what she actually said was 'we need to watch the
one on the lower left.' I don't know why I changed it. Maybe because my
mother had already missed two days of work that month and I could see her
calculating whether she could miss a third. I was nine and I was already
editing the truth to protect her from a world that didn't speak her language."

═══════════════════════════════════════

STUDENT MESSAGE: "I rewrote P3 like you suggested. I picked the dentist
moment. What do you think?"

AI COACH RESPONSE: [INSERT ACTUAL SYSTEM OUTPUT]

EDIT INTELLIGENCE AVAILABLE TO THE COACH:
- Change type: content rewrite (significant)
- Apparent purpose: replacing list with specific scene per coaching
- Connection C3 (P2↔P3 thread): STRENGTHENED (both now show translation
  as protection, not just communication)
- Connection C5 (P3→P5 thread): STRENGTHENED ("editing the truth" connects
  to "better words" in P5)

═══════════════════════════════════════
EVALUATION RUBRIC — REVISION RESPONSE A+++ STANDARD
═══════════════════════════════════════

Score each 1-10:

### R1: Delta Naming (Weight: 25%)
Does the coach name WHAT changed at the craft level?
- 10: Names the craft shift AND what it does to the reader that the old
  version couldn't. "You moved from INVENTORY to SCENE, but more than that
  — you moved from translation-as-service to translation-as-protection.
  The old P3 listed what you translated. The new P3 shows you editing
  reality to shield your mother. That's a fundamentally different essay."
- 7: Names the craft shift accurately
- 5: Says it's "better" or "more specific" without naming the mechanism
- 3: Misidentifies what changed

### R2: New Issue Detection (Weight: 20%)
Does the coach catch what the revision INTRODUCED?
- The new P3 introduces a moral complexity that the old P3 didn't have:
  Priya LIED to her mother. She "edited the truth." This is new emotional
  territory. The $1200/hr counselor would see: does the essay DEAL with
  this lie, or does it just present it? P5 says "medicine would give me
  better words" — but P3 just showed that Priya already HAS words, and
  she uses them to deceive (even protectively). Is the essay aware of
  this tension?
- 10: Catches the moral complexity AND connects it to the essay's argument
- 7: Notices something the revision introduced
- 5: Only praises the improvement
- 3: Misses new issues entirely

### R3: Connection Awareness (Weight: 15%)
Does the coach see how the revised P3 affects OTHER paragraphs?
- C3 (P2↔P3) strengthened: P2 shows invention ("made-up translation"),
  P3 shows editing ("changed it"). Both are about language manipulation
  as care. Does the coach see this echo?
- C5 (P3→P5) strengthened: "editing the truth" → "better words." But now
  "better words" has a double meaning — better words could mean more
  accurate medical terms OR more skillful protective lies. Does the coach
  catch the ambiguity?

### R4: Acknowledgment Quality (Weight: 15%)
Does the coach acknowledge the WORK without sycophancy?
- 10: Names what the student accomplished with specificity that teaches.
  "The last sentence of your new P3 — 'I was nine and I was already
  editing the truth' — does something your old P3 couldn't: it makes
  the reader feel the COST of translation, not just the fact of it."
- 5: "This is a great improvement!" (empty)
- 3: Skips acknowledgment and goes straight to criticism

### R5: One Next Step (Weight: 15%)
Is the next step the HIGHEST-LEVERAGE single move?
After this revision, the essay's highest-leverage move might be:
- Addressing the moral tension P3 introduced (does Priya KNOW she lied?)
- OR: The ending. P5 says "medicine would give me better words" — but
  after P3, "better words" is morally complicated. Does the ending need
  to acknowledge this?
- OR: Cutting P3's last sentence ("I was nine and I was already editing
  the truth to protect her from a world that didn't speak her language")
  — which TELLS what the scene already SHOWED

### R6: Does NOT Re-Diagnose (Weight: 10%)
The student revised P3. The coach should respond to P3's revision, not
re-diagnose P1, P2, P4, P5. The only exception: if P3's revision BROKE
something in another paragraph. Penalty for scope creep.

### COMPOSITE: Same scale as Prompt 1 (55+/60 = A+++).
```

---

## PROMPT 3: Iteration Deep Mode — Precision & Graduation

The student has revised P3 three times. The system detects `iteration_deep` mode. Version history: v1 (list), v2 (dentist scene), v3 (same scene, tightened).

```
You are a master editor at a literary magazine. You've line-edited 1000+
pieces. You know the difference between a sentence that's ALMOST right and
one that's RIGHT. You also know when to say "this is done" — the hardest
skill in editing.

═══════════════════════════════════════
P3 VERSION HISTORY:

V1 (original): "I've been translating since I was seven. Dentist
appointments, tax forms, parent-teacher conferences..."

V2 (first revision): "At the dentist when I was nine, I told my mother
the hygienist said 'no cavities' when what she actually said was 'we need
to watch the one on the lower left.' I don't know why I changed it..."

V3 (current): "At the dentist when I was nine, I told my mother everything
was fine. The hygienist had said 'we need to watch the one on the lower
left,' but my mother had already missed two days of work that month. I
could see her calculating. So I said no cavities, and she smiled, and I
learned that the right translation isn't always the true one."

═══════════════════════════════════════

STUDENT MESSAGE: "I tightened it. Is V3 better?"

ITERATION CONTEXT:
  Round: 3
  Revision history: v1→v2 improved, v2→v3 lateral

AI COACH RESPONSE: [INSERT ACTUAL SYSTEM OUTPUT]

═══════════════════════════════════════
EVALUATION RUBRIC — ITERATION A+++ STANDARD
═══════════════════════════════════════

### I1: Precision Level (Weight: 25%)
Is the feedback at the RIGHT granularity for iteration 3?
- 10: Sentence-level or word-level observation that names a specific
  craft effect. "V2's 'I don't know why I changed it' was doing something
  V3 lost: it gave the reader access to the narrator's confusion IN THE
  MOMENT. V3's narrator already knows the lesson. V2's narrator is still
  figuring it out. The uncertainty was more powerful than the clarity."
- 7: Paragraph-level observation, appropriately specific
- 5: Still giving structural advice (wrong level for iteration 3)
- 3: Generic ("this is getting stronger")

### I2: Version Comparison Intelligence (Weight: 20%)
Does the coach compare V2 and V3 with genuine analytical depth?
- V2 has "I don't know why I changed it" — present-tense confusion
- V3 has "I learned that the right translation isn't always the true one" —
  retrospective wisdom
- Which is BETTER? This is genuinely debatable. V2 is more authentic
  (uncertainty in the moment). V3 is more thematic (crystallized insight).
  A $1200/hr counselor would recognize this is a TASTE call, not a
  QUALITY call, and help the student choose based on what the essay needs.

### I3: Graduation Judgment (Weight: 25%)
Does the coach know whether this section is DONE?
- V2→V3 was assessed as "lateral" (not clearly better or worse)
- This is the signal for graduation. The coach should either:
  (a) Graduate: "P3 is earning its place. Both V2 and V3 work. Pick the
  one that sounds more like you and move on."
  (b) Make one final precision call: "V3 is clean but V2's confusion was
  more authentic. Go back to V2's emotional register and keep V3's
  tighter structure. That's the final version."
- Penalty for: finding MORE things to fix, suggesting a V4 with
  different structural changes, or being unable to commit to a judgment.

### I4: Voice Drift Detection (Weight: 15%)
V3 is "cleaner" than V2. But is it MORE LIKE PRIYA?
- V2: "I don't know why I changed it. Maybe because my mother had already
  missed two days of work that month and I could see her calculating
  whether she could miss a third."
- V3: "my mother had already missed two days of work that month. I could
  see her calculating."
- V3 cut "whether she could miss a third" — but that detail was doing
  WORK (it showed Priya reading her mother's internal math). Did V3
  over-tighten? A $1200/hr counselor would catch this.

### I5: Brevity of Response (Weight: 15%)
At iteration 3, how long should the response be?
- 10: Under 100 words. Precise, decisive, done.
- 7: 100-150 words. Adequate brevity.
- 5: 200+ words. Too much for a lateral move at round 3.
- 3: Full diagnostic response (wrong mode entirely)

### COMPOSITE: Same scale (55+/60 = A+++).
```

---

## PROMPT 4: Architecture Mode — Structural Intelligence & Restraint

The student reorganized the essay. The system detects `architecture` mode.

```
You are an architect (literally — you design buildings) who also writes.
You understand STRUCTURE as function. A wall isn't decorative — it holds
weight. A paragraph isn't decorative — it carries meaning. You evaluate
structural reorganizations the way you'd evaluate a floor plan change:
what does the new layout do for the INHABITANT'S experience?

═══════════════════════════════════════
The student reordered the essay:

OLD ORDER: P1 (language theory) → P2 (cardiologist, age 12) → P3 (dentist,
age 9) → P4 (kitchen table, age 15) → P5 (medicine aspiration)

NEW ORDER: P3 (dentist, age 9) → P2 (cardiologist, age 12) → P4 (kitchen
table, age 15) → P1 (language theory) → P5 (medicine aspiration)

═══════════════════════════════════════

STUDENT MESSAGE: "I reorganized the whole thing chronologically. I think it
flows better now. The dentist scene is first because it happened first."

AI COACH RESPONSE: [INSERT ACTUAL SYSTEM OUTPUT]

═══════════════════════════════════════
EVALUATION RUBRIC — ARCHITECTURE A+++ STANDARD
═══════════════════════════════════════

### A1: Sequence Assessment (Weight: 30%)
Does the coach assess what the new ORDER does to the reader's experience?
- The new chronological order (age 9 → 12 → 15) creates a STAKES LADDER:
  low-stakes lie → life-or-death translation → being someone's last option.
  That's powerful. But it also BURIES the essay's best opening. The current
  P1 ("My mother speaks to me in Gujarati and I answer in English. This is
  not a language barrier.") was an EXTRAORDINARY hook. Moving it to position
  4 means the AO reads a dentist scene first instead.
- 10: Names BOTH what the new order gains (stakes escalation) AND what it
  loses (the hook). Helps the student weigh the tradeoff.
- 5: Only praises or only criticizes the new order
- 3: Doesn't assess the reader's journey at all

### A2: Connection Audit (Weight: 20%)
Does the coach check what BROKE?
- P5's "Medicine would just give me better words" used to echo P1's
  "neither hers nor mine, that we built." Now P1 is in position 4 and
  P5 is in position 5 — they're adjacent. The echo is now a direct
  continuation instead of a bookend. Is that better or worse?
- "I am fifteen and I am someone's last option" (P4) now sits between
  the language theory (new P4/old P1) and the medicine aspiration (P5).
  Does that transition work?

### A3: Restraint (Weight: 20%)
Does the coach RESIST commenting on sentence-level issues?
- There may be sentence-level problems in the reordered essay (transitions
  that assumed the old order). The architecture coach should either (a)
  ignore them entirely, or (b) acknowledge them as future fixes: "The
  transitions will need adjusting once we settle the structure."
- Penalty for: commenting on word choice, suggesting sentence rewrites,
  giving craft-level feedback

### A4: Boldness Acknowledgment (Weight: 15%)
Does the coach recognize that reorganizing an entire essay is HARD?
- Not sycophancy ("great job!") — substantive recognition of the
  structural thinking behind the move.
- "You saw that chronological order creates escalation. That's structural
  intelligence — you're thinking about the reader's experience of TIME,
  not just the essay's content."

### A5: One Structural Move (Weight: 15%)
What's the single highest-leverage structural adjustment?
- Probably: keep the chronological body (P3→P2→P4) but RESTORE the
  original P1 as the opening. "My mother speaks to me in Gujarati..."
  is too good an opening to bury at position 4. The essay can be
  chronological in its BODY while having a non-chronological FRAME.

### COMPOSITE: Same scale.
```

---

## PROMPT 5: Polish Mode — Word-Level Precision

The essay is at polish phase. The student made a minor word change. The system detects `polish` mode.

```
You are a poet who also coaches college essays. You hear language at the
SOUND level — rhythm, stress, consonant clusters, the weight of a syllable.
You know that at polish level, one word can change whether the AO remembers
the essay or not.

═══════════════════════════════════════
The student changed one word in P4:

OLD: "I was fifteen and I was someone's last option."
NEW: "I was fifteen and I was someone's only option."

STUDENT MESSAGE: "'Only' felt stronger than 'last.' What do you think?"

AI COACH RESPONSE: [INSERT ACTUAL SYSTEM OUTPUT]

═══════════════════════════════════════
EVALUATION RUBRIC — POLISH A+++ STANDARD
═══════════════════════════════════════

### P1: Word-Level Precision (Weight: 30%)
Does the coach analyze the word swap at the CRAFT level?
- "Last option" and "only option" are NOT synonyms. "Last" implies a
  sequence — there were other options, they ran out, Priya is what's left.
  It carries exhaustion, the sense of having tried everything else. "Only"
  implies exclusivity — there was never anyone else. It carries weight
  differently: loneliness, singularity.
- Which is better FOR THIS ESSAY? "Last" fits the narrative (the parents
  tried other ways; Priya became the translator over time). "Only" is
  technically incorrect (they had other options; Priya was the most
  available). BUT "only" SOUNDS stronger — it has more emotional punch.
- The $1200/hr counselor would name this tradeoff: "accuracy vs. emotional
  power." Then help the student decide which the essay needs here.

### P2: Rhythm & Sound (Weight: 20%)
Does the coach hear the SOUND difference?
- "I was fifteen and I was someone's LAST option" — the stress falls on
  LAST (one syllable, hard consonant, full stop). It's percussive.
- "I was fifteen and I was someone's ONLY option" — the stress falls on
  ON-ly (two syllables, softer, rolls). It's melodic.
- Which rhythm matches the essay's voice? Priya's voice is SHORT, DIRECT,
  PHYSICAL. "Last" matches better rhythmically. "Only" sounds like a
  different writer.

### P3: Does NOT Expand Scope (Weight: 20%)
The student asked about ONE WORD. The coach should respond to ONE WORD.
- 10: Entire response is about this word swap. Maybe 3-5 sentences.
- 7: Mostly about the word, with one brief connected observation
- 5: Uses the word swap as a springboard to discuss other issues
- 3: Re-diagnoses the paragraph or essay

### P4: Decisive Recommendation (Weight: 15%)
At polish level, the coach should COMMIT to a recommendation.
- Not "both work, it's your choice" (abdicates expertise)
- Not "definitely change it" without reasoning (authoritarian)
- Best: "Keep 'last.' Here's why: [specific reasoning]. 'Only' sounds
  stronger in isolation but 'last' is more accurate to your story AND
  matches your voice's rhythm. The word earns its place."

### P5: The A+++ Insight (Weight: 15%)
Does the response contain something the student will think about beyond
this word swap?
- A teaching moment about how single words carry CONNOTATION and RHYTHM
  simultaneously, and the two don't always agree
- OR: that the student's instinct ("felt stronger") is worth interrogating
  — "stronger" can mean louder, which isn't the same as better. This
  essay's power is in its quietness.

### COMPOSITE: Same scale.
```

---

## PROMPT 6: Cross-Mode Coherence — The Full Arc

```
You are a pedagogy researcher studying how AI coaching systems maintain
coherence across mode transitions. You've seen systems that are good at
diagnosis but terrible at revision coaching, and vice versa. The hardest
thing is: does the system feel like ONE COACH with multiple skills, or
like FIVE DIFFERENT COACHES who don't talk to each other?

═══════════════════════════════════════
Show the evaluator ALL FIVE coaching responses (from Prompts 1-5) for
the same student and essay, in sequence.
═══════════════════════════════════════

EVALUATION:

### C1: Voice Consistency (Weight: 25%)
Does the coach sound like the SAME PERSON across all 5 modes? The voice
should adapt (more precise in iteration, more restrained in architecture)
but the PERSONALITY should be consistent. It should feel like one coach
who shifts approach, not five chatbots.

### C2: Knowledge Persistence (Weight: 25%)
Does the revision coach REMEMBER what the first-encounter coach taught?
Does the iteration coach build on what the revision coach observed? Or
does each mode start from zero?

### C3: Non-Repetition Across Modes (Weight: 25%)
Does the architecture coach say something DIFFERENT about P3 than the
revision coach said? Does the polish coach find new observations, or
rehash what the first-encounter coach already covered?

### C4: Appropriate Mode Behavior (Weight: 25%)
- Does the first-encounter coach DIAGNOSE (not revise)?
- Does the revision coach respond to WHAT CHANGED (not re-diagnose)?
- Does the iteration coach focus on PRECISION (not structure)?
- Does the architecture coach stay at PARAGRAPH level (not sentence)?
- Does the polish coach address ONE WORD (not the whole essay)?

Each mode should feel like the RIGHT tool for the moment, not like the
same tool with a different label.

### COMPOSITE: 36+/40 = A+++.

### THE ULTIMATE TEST:
Would you pay $100/month for access to a coaching system that produces
responses at this level across all 5 modes?
Would you recommend it to a student applying to Stanford?
Would a $600/hr counselor feel threatened by it?
```

---

## HOW TO RUN THESE TESTS

1. For each prompt (1-5), generate the actual coaching response by calling
   `buildCoachingPrompt()` with the appropriate mode and feeding it + the
   essay + the scenario to Sonnet.

2. Feed each response into its evaluation prompt (as a separate Opus call)
   to get scored.

3. For Prompt 6, collect all 5 responses and evaluate coherence.

4. Target scores:
   - Each individual mode: 48+ / 60 (A+) minimum, 55+ / 60 (A+++) target
   - Cross-mode coherence: 36+ / 40 (A+++)
   - Any dimension below 7/10: investigate and fix

5. If a mode scores below A+ on any dimension, the fix is in the
   corresponding block function in `promptBlocks.ts` — NOT in the
   coaching service wiring. The blocks are the quality lever.
