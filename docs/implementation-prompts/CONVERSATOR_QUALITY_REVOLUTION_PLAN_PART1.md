# Conversator Quality Revolution — Part 1: Intelligence Gathering as System Enhancement

> **This is a PLANNING prompt.** It does not describe types, state machines, or API shapes. It describes HOW the Conversator's intelligence gathering produces measurable qualitative improvements in every downstream layer's output — grounded in specific quality gaps that exist today.

---

## The Thesis

The Essay Intelligence system's quality ceiling is not limited by prompt engineering or architecture. It is limited by **information the system cannot access**. No LLM prompt — no matter how sophisticated — can reliably determine:

- What the writer intended (inferredIntents: 50% guess rate, unfalsifiable)
- Whether a voice shift is a deliberate craft choice or unconscious drift
- Whether an emotional moment reflects real experience or performed vulnerability
- Whether domain-specific language is precise expertise or obfuscating jargon
- Whether the essay's structure follows a plan or emerged from confused revision
- What the student already knows about their own weaknesses

These are not edge cases. They are **the most valuable signals for every downstream layer**. The system currently either guesses (inferredIntents), ignores (voice intentionality), or works around (domain context) these gaps. The Conversator doesn't add a chat feature. It **closes the information asymmetry that caps the system's output quality**.

---

## Layer-by-Layer: How Student Input Transforms Output Quality

### L3 Walk: From Cataloguing to Comprehension

**Current quality gap** (from audit): L3 produces 50% structural / 50% architectural observations. The prompt teaches depth via examples but cannot VERIFY depth was achieved. A pivotal sentence and a transitional sentence produce the same output format. The walk treats every sentence as equally important because it has no signal about which sentences MATTER MOST to the student.

**What student input changes:**

1. **Attention Allocation**: When the student says "the transition in P2 is the heart of this essay — everything before it sets up and everything after responds to it," the walk knows to spend 3x the cognitive attention on P2. Currently, the walk distributes attention roughly evenly (with some novelty-driven decay). Student-declared attention signals let the walk produce **variable-depth understanding** that matches the essay's actual architecture of meaning.

   - **Before**: P2 gets 3 observations like every other paragraph. One might be architectural by luck.
   - **After**: P2 gets 5-7 observations, the walk is TOLD this is architecturally central, and its novelty comparison for P3-P5 is anchored to P2's declared significance. Every later paragraph's understanding is richer because it's measured against the student's identified center of gravity.

2. **Function Disambiguation**: The walk's biggest quality failure is when a sentence's function is ambiguous. "She set the tray down carefully" — is this scene-setting, characterization, foreshadowing, or emotional preparation? The walk guesses. With a 0.6-confidence primaryFunction, the downstream layers get a shaky foundation.

   Student input doesn't answer "what is the function" (that's the system's job). It answers **"what were you going for"** — which is a different and more useful question. If the student says "I wanted the reader to notice how careful she is with things, because later she's careless with something important," the walk knows this sentence is FORESHADOWING (earned by future context), not scene-setting. This eliminates ambiguity that no amount of re-reading resolves.

   - **Quality metric**: Reduce primaryFunction confidence < 0.7 rate from ~30% to ~10% for sentences with declared intent. Every 1% reduction in ambiguity propagates to L3.5, L5, and L6 as more precise analysis.

3. **Back-Propagation Quality**: The walk's back-propagation mechanism (P4 reveals something new about P1, so P1's understanding is updated) is powerful but imprecise. The walk guesses what P4 reveals about P1. Student input makes this precise: "I started with the chair because it comes back at the end" → the walk knows the opening image is STRUCTURALLY LOAD-BEARING for the closing, not just scene-setting that happens to recur.

   - **Before**: Back-prop might notice the recurrence and guess it's important.
   - **After**: Back-prop KNOWS it's the student's deliberate structural thread. The quality of the back-propagated understanding is night-and-day.

**Forcing function**: L3 prompt gains a section: "STUDENT-DECLARED SIGNIFICANCE" that shows which sentences/paragraphs the student has identified as important and WHY. This isn't just context — it's an **attention-allocation signal** that the LLM uses to decide where to invest its architectural analysis energy.

---

### L3.75 Holistic Synthesis: From Sophisticated Rephrasing to Genuine Insight

**Current quality gap** (from audit): L3.75 can produce descriptions that sound insightful but are actually rephrased versions of L3's observations. Voice identity might say "mix of colloquial and formal registers" — a description, not an insight. The prompt says "synthesize holistic sections that capture the WHOLE" but doesn't force INSIGHTS about how sections relate.

**What student input changes:**

1. **Voice Intentionality Assessment**: The system currently cannot distinguish intentional voice shifts from drift. When the student says "I deliberately switch to more formal language in P3 because I'm trying to show that I've grown up," the holistic synthesis can now assess:
   - Is the formal register actually conveying maturity, or does it read as stiff/uncomfortable?
   - Does the transition between registers feel earned or abrupt?
   - Is the student's STRATEGY (formal = mature) actually effective, or is it a misconception about what maturity sounds like in writing?

   This transforms voice identity from "describes what the voice does" to "evaluates whether the voice achieves what the student wants it to achieve." That gap — between student strategy and text effect — is the single most valuable insight the holistic synthesis can produce.

   - **Before**: `voiceIdentity: "The essay alternates between casual personal narration and more formal reflective analysis."`
   - **After**: `voiceIdentity: "The writer deliberately shifts to formal register in P3 to signal maturity, but the formality reads as distancing rather than authoritative — the reader loses the intimacy that made P1-P2 compelling. The strategy (formal = mature) is the student's conscious choice but the execution undermines the essay's strongest asset: the conversational authenticity that P1 establishes. The voice's BEST moments are when it's LEAST controlled."`

   The second version is genuinely useful for teaching. The first is a description.

2. **Earned-ness Map Specificity**: The earned-ness map is supposed to trace which emotional moments have supporting setup (earned) vs. which arrive without preparation (unearned). Currently, the map identifies unearned moments but can't explain WHY the student didn't earn them — because it doesn't know whether the student (a) tried to earn it and failed, (b) didn't realize it needed earning, or (c) deliberately chose not to earn it for effect.

   Student input resolves this. "I wanted the diagnosis reveal to hit the reader cold, without warning" → the unearned emotional moment is a DELIBERATE CRAFT CHOICE, not a failure. The earned-ness map can now assess whether the strategy works (does the cold reveal actually create impact, or does it create confusion?) rather than just flagging it as unearned.

   - **Quality metric**: Earned-ness map entries with student-declared strategy produce 2x more specific mechanism analysis because the system knows WHAT to evaluate.

3. **Thematic Architecture — Separating Statement from Belief**: The thematic architecture captures the essay's thesis and threads. But the system can't distinguish between a thesis the student genuinely believes and a thesis the student thinks admissions officers want to hear. Student input reveals this: "I wrote about community service because I thought I was supposed to" vs "This experience genuinely changed how I see responsibility."

   When the holistic synthesis knows the student's relationship to their own thesis, it can assess authenticity — the dimension that matters most to admissions officers and that no text analysis alone can verify.

   - **Before**: `centralThesis: "Community service reveals the responsibility of privilege."`
   - **After**: `centralThesis: "The essay states 'community service reveals responsibility' but the student reports writing about this topic because they thought they should, not because it transformed them. The thesis is strategically chosen, not experientially grounded — which explains why P3-P4's emotional claims feel performed rather than earned. The essay's authenticity problem isn't a craft issue; it's a topic-fit issue."`

**Forcing function**: L3.75 prompt gains "STUDENT CONTEXT" section with all declared intents, personal context, and creative direction. The synthesis is explicitly told: "Where student-declared context exists, your synthesis must address the RELATIONSHIP between what the student says they want and what the text actually does. This relationship — alignment, tension, or contradiction — is your most valuable output."

---

### L3.5 Analysis Pass: From Scoring to Diagnosing the Intent-Effect Gap

**Current quality gap** (from audit): L3.5 clusters scores in the 70-85 "safe middle" even on weak essays. Weakness descriptions can be generic ("could be more specific") rather than grounded in the essay's specific architectural needs. The system evaluates effectiveness without knowing what the sentence is TRYING to be effective at.

**What student input changes:**

1. **The Intent-Effect Gap as Primary Scoring Signal**: Currently, L3.5 scores "how well does this sentence work?" — a vague question that produces vague scores. With declared intent, the question becomes: "how well does this sentence achieve what the student wants it to achieve?" This is a MEASURABLE gap with specific, actionable dimensions.

   - **Before scoring**: "P2S4 transitions from technical to personal. Effectiveness: 62." (Why 62? 62 out of what? What would 80 look like?)
   - **After scoring**: "P2S4 is supposed to connect the lab to the grandmother (student declared intent). The text jumps directly from 'I adjusted the pipette' to 'My grandmother was diagnosed.' Intent-effect gap: the student wants an emotional bridge but provides only a temporal one ('that same week'). The gap is SPECIFIC: no sensory or thematic link exists between the two scenes. Effectiveness at achieving declared intent: 42. Effectiveness at general function: 58."

   The dual scoring (intent-achievement vs general-function) is more informative than a single number. A sentence can be a competent transition (58) but a poor execution of the student's specific goal (42). That 16-point gap IS the teaching opportunity.

2. **Calibration Anchoring**: Score clustering happens because the LLM lacks confidence about what "good" means for THIS essay. Student input provides anchoring: if the student says "P3 is the part I'm most proud of," the system knows to use P3 as a quality ceiling for calibration. If the student says "I've rewritten the opening six times and I still hate it," the system knows the student's own assessment puts the opening at the floor.

   Student self-assessment doesn't replace analytical scoring — but it provides CALIBRATION ANCHORS that help the LLM differentiate. "The student considers P3 their best work and the opening their worst" → the system ensures P3 scores higher than the opening, and the gap between them reflects the genuine quality difference.

   - **Quality metric**: Anti-clustering test currently passes by checking for 20-point spread. With student calibration anchors, the MEANINGFUL spread should increase — not just a larger numerical range, but a range that maps to real quality differences the student already perceives.

3. **Weakness Descriptions Become Architectural**: When the system knows what the student intended, weakness descriptions transform from "what's wrong" to "what's preventing you from achieving what you want."

   - **Before**: "P2S4 uses telling language ('it was meaningful') instead of showing."
   - **After**: "P2S4 tells the reader the connection was meaningful instead of letting them FEEL it. You want this moment to bridge the lab and the hospital (your stated intent). 'Meaningful' is a conclusion — it skips the emotional experience you want the reader to have. The bridge needs a shared sensory detail or image that exists in both scenes, not an abstract claim about significance."

   The second version is specific to THIS essay, references the student's own goal, and suggests a concrete direction. It's useful in a way the first version isn't.

**Forcing function**: L3.5 prompt gains "INTENT-EFFECT EVALUATION" section. For each sentence with declared intent, the analysis must: (a) state the declared intent, (b) state what the text actually does, (c) describe the specific gap, (d) score effectiveness-at-intent separately from general effectiveness. For sentences WITHOUT declared intent, the analysis notes this as an information gap and flags it as a question for the Conversator.

---

### L4 Crystallizer: From North Star to Intent-Aware Architecture

**Current quality gap** (from audit): "Architecture of meaning" is never formally defined. Distinctiveness descriptions can be specific-sounding but still generic. The Intent Bridge has `studentIntent: null` until L6 coaching, meaning it's always empty during initial analysis.

**What student input changes:**

1. **Intent Bridge Populated From Day One**: Currently, the Intent Bridge captures `systemReading` but leaves `studentIntent` null until the student tells L6 coaching what they meant. With the Conversator gathering intent during the initial discovery conversation, the Intent Bridge has BOTH sides from the first analysis run:

   - `systemReading`: "The essay argues that musical constraints enable creative expression"
   - `studentIntent`: "I want to show that I approach problems by embracing limitations rather than fighting them"
   - `alignments`: [{ aspect: "constraint-as-enabler", alignment: "confirmed", detail: "Student's stated approach directly maps to essay's argument" }, { aspect: "problem-solving identity", alignment: "tensioned", detail: "Student frames this as a problem-solving strategy, but essay presents it more as an aesthetic philosophy — the gap suggests the essay could be strengthened by grounding the constraint theme in a non-musical problem-solving context" }]

   The second alignment entry is the kind of insight that ONLY exists when you have both sides. The system reads the essay as aesthetic philosophy; the student sees it as problem-solving. That tension is the most valuable thing the North Star can surface.

2. **Structural Roles Informed by Student Priority**: The crystallizer assigns structural roles to every paragraph. Currently, these are the system's assessment of what each paragraph DOES. With student input about what each paragraph is SUPPOSED to do, the structural roles can show where architectural intention and execution diverge:

   - `{ paragraph: 2, assignedRole: "personal_grounding", studentIntendedRole: "emotional_bridge", alignmentNote: "The paragraph grounds the essay in personal experience (system reading) but doesn't create the emotional bridge the student wants — the personal details are observational rather than emotionally resonant" }`

3. **Distinctiveness Grounded in Student Identity**: The system's distinctiveness assessment often produces specific-sounding but replaceable descriptions. When the student reveals WHY they chose this topic, what it means to them, and what they want the reader to take away, distinctiveness becomes genuinely personal:

   - **Before**: `"Explores how constraint enables creativity through musical metaphor."`
   - **After**: `"The essay claims constraint enables creativity, but the student's deeper motivation is showing admissions officers that they approach ALL problems by embracing limitations — a pattern that extends beyond music to how they handled their family's financial constraints and their school's limited course offerings. The essay currently only shows the musical instantiation. The STUDENT is more interesting than the essay knows."`

   That last sentence — "the student is more interesting than the essay knows" — is the kind of insight that transforms feedback from "polish your essay" to "your essay isn't yet showing who you actually are."

**Forcing function**: Crystallizer prompt gains "STUDENT-DECLARED ARCHITECTURE" section showing all declared intents, personal context, and creative direction. The North Star must address: "Where is the student's stated purpose aligned with the essay's apparent purpose? Where do they diverge? What does the divergence reveal about what the essay could become?"

---

### L5 Annotations: From Generic Advice to Intent-Gap-Grounded Teaching

**Current quality gap** (from audit): Teaching test is binary (could the student see this by re-reading?). North Star connection can be name-checking without meaning. Capacity building notes can be generic. Annotations can be "assessment wrapped in specific-sounding language."

**What student input changes:**

1. **The Teaching Test Becomes Falsifiable**: Currently, "Could the student see this by re-reading?" is a judgment call the LLM makes about a hypothetical student. With declared student context, the question becomes concrete: "Does the student ALREADY KNOW this?" If the student said "I know my transitions are weak" during the Conversator conversation, an annotation about weak transitions FAILS the teaching test — the student already identified this. The annotation must teach them something they DON'T know: WHY the transitions are weak in THIS specific architectural context, or WHAT specific technique would address the weakness given their declared intent.

   - **Before**: Teaching test = LLM guessing what student might notice
   - **After**: Teaching test = checking against what the student has ACTUALLY SAID they know/don't know

   This is measurably better. We can audit: "Did the annotation teach something the student didn't already declare knowing?"

2. **Annotations Reference Student's Own Words**: The most powerful teaching move is using the student's own language to ground feedback. When the student said "I wanted the reader to realize my science interest is personal," the annotation can say:

   > "You want the reader to realize your science interest is personal. But P2 TELLS them ('it was deeply meaningful to me') instead of SHOWING them. The reader can't realize something they're being told — realization requires discovering it. What if the lab detail you chose was one that specifically echoes something from your grandmother's treatment? Then the reader DISCOVERS the personal connection instead of being informed of it."

   This annotation: (a) references the student's exact stated intent, (b) diagnoses the specific gap (telling vs showing, in the context of realization), (c) provides a concrete direction grounded in the essay's specific architecture (lab detail that echoes treatment), (d) teaches a transferable principle (realization requires discovery, not assertion). It passes every quality test convincingly.

3. **North Star Connection Becomes Structural Necessity**: Currently, annotations include a `northStarConnection` field that can be generic ("Related to voice consistency"). With the student's declared architecture (what they want each part to do), North Star connections become specific and necessary:

   > `northStarConnection: "This annotation addresses the P2-P4 intent bridge that the student identified as the essay's structural backbone. Without a sensory link here, the student's declared 'show science is personal' intent cannot be achieved because the reader arrives at P4 without the experiential preparation P2 was supposed to provide."`

   This connection is unfakeable — it references a specific declared intent, a specific structural relationship, and a specific consequence of not addressing the issue.

4. **Capacity Building Notes Become Student-Specific**: Currently, capacity building notes teach generic techniques ("Watch for show-don't-tell"). With student context, they teach techniques the student specifically needs:

   > `capacityBuildingNote: "You default to telling when you're describing something that really matters to you — as if the emotion is so obvious to you that you forget the reader hasn't lived it. This is a common pattern for writers who have strong emotional connections to their material. The fix is counterintuitive: the moments you care most about need the MOST concrete detail, because your certainty makes you skip the evidence that creates certainty for the reader."`

   This note is personalized to the student's specific pattern, explains WHY they do it, and reframes the fix as counterintuitive (which makes it memorable and transferable).

**Forcing function**: L5 prompt gains "STUDENT KNOWLEDGE STATE" section: what the student has declared they know, what they've said they want to achieve, what they've identified as their own weaknesses. The annotation prompt explicitly says: "Do NOT annotate things the student already identified as problems. If the student said 'I know my transitions are weak,' your job is to teach them WHY the transitions are weak in this specific architectural context, not to inform them that transitions are weak."

---

### L6 Coaching: From Responsive to Adaptive

**Current quality gap** (from audit): Cognitive assessment can misdiagnose root cause (assumes confusion when student might be disagreeing). Pattern detection on small sample can be spurious. Confusion escalation assumes "not understanding" not "disagreeing." Phase restrictions can hide structural issues that manifest at word level.

**What student input changes:**

1. **Root Cause Disambiguation**: When a student returns to the same topic 3 times, the system currently assumes confusion and escalates (simpler explanation → smaller pieces → "I haven't explained this clearly"). But the student might be: (a) confused, (b) disagreeing, (c) testing the analysis, (d) stuck on implementation, or (e) avoiding a harder topic nearby.

   The Conversator's intelligence gathering provides signal for disambiguation. If the student previously said "I get what you're saying, I just don't think it's right" (categorized as a `resistance` insight), the coaching system knows to switch from escalation (simpler explanation) to exploration (why does the student disagree? what's their alternative reading?).

   This doesn't require new LLM calls — it requires the coaching prompt to SEE the categorized insights from the Conversator and use them as diagnostic context.

2. **Pattern Detection Becomes Evidence-Based**: The system detects patterns from conversation history (student keeps returning to word choice → labeled "structural avoidance"). With Conversator-gathered data, patterns are grounded in declared context:

   - **Before**: "Student discussed word choice 3 times in 8 turns → may be avoiding structural issues"
   - **After**: "Student discussed word choice 3 times, AND told the Conversator 'I'm terrified of reorganizing because I spent two weeks getting the structure right' → structural avoidance is CONFIRMED and emotionally motivated. Coaching approach: acknowledge the time investment, show that structural changes can PRESERVE what works while fixing what doesn't."

   The coaching response is qualitatively different when it knows WHY the pattern exists.

3. **Phase Flexibility With Intent Awareness**: Current phase system says "at Foundation phase, deprioritize word-level craft." But student input might reveal that a word-level issue IS the structural problem. If the student says "I keep using 'meaningful' because I can't find the right word for what I actually feel," the system knows:
   - The word-level issue ("meaningful" is vague) IS a structural issue (the essay's emotional claims are ungrounded)
   - The student KNOWS it's wrong but is stuck
   - The coaching should address the word-level symptom AND the structural cause simultaneously

   Phase restrictions become guidelines informed by student context, not hard filters that hide relevant problems.

---

## The Quality Improvements That ONLY the Conversator Enables

These are improvements that no prompt engineering, architectural change, or additional LLM call can achieve without student input:

### 1. Authenticity Assessment (Currently Impossible)

The system can detect performed voice, formulaic structure, and template phrasing. It CANNOT determine whether these are:
- A student performing what they think admissions officers want (coaching opportunity: be yourself)
- A student's genuine but undeveloped voice (coaching opportunity: develop your voice)
- Cultural or linguistic context where the "template" is authentic expression (coaching opportunity: none — this IS their voice)

Only the student can tell us. The Conversator asks. The system calibrates.

**Quality impact**: Authenticity is the #1 dimension admissions officers evaluate. If our system can assess it accurately (by combining text analysis WITH student self-report), our feedback quality in this dimension leaps from guess-level to expert-level.

### 2. Revision Intent Tracking (Currently Missing)

When a student makes an edit, the system detects WHAT changed but not WHY. Was the edit:
- A response to our feedback (verification: did they implement it correctly?)
- Their own idea (intelligence: what are they prioritizing?)
- A misunderstanding of our feedback (correction: they changed the wrong thing)
- An accident or experiment (context: should we evaluate this as final?)

The Conversator asks "What prompted this change?" and the answer transforms edit evaluation from "did the text improve?" to "did the student make progress toward their goal?"

**Quality impact**: Edit evaluation accuracy jumps from ~60% (guessing intent) to ~90% (knowing intent). This directly improves the tight feedback loop that drives real revision.

### 3. Emotional Calibration (Currently Absent)

The system has no model of the student's emotional state. It delivers the same feedback whether the student is excited, overwhelmed, defensive, or defeated. The Conversator reads emotional signals continuously and adjusts:

- Overwhelmed student → feedback focuses on smallest possible next win
- Defensive student → feedback leads with strengths before raising issues
- Excited student → feedback matches energy and raises the bar
- Defeated student → feedback reframes progress and names specific improvements

**Quality impact**: Pedagogically, the SAME feedback delivered at the wrong emotional moment is counterproductive. Emotional calibration transforms identical analytical content into effective or ineffective teaching. This is not a UX feature — it's a teaching quality multiplier.

### 4. Domain Expertise Calibration (Currently Missing)

A student writing about competitive policy debate uses "spreading" (speaking extremely fast to present more arguments). The system flags this as jargon. The student tells the Conversator "spreading is standard debate terminology — every debater knows what it means." The system recalibrates: this isn't jargon, it's precision. The analysis adjusts scores, feedback stops flagging it, and the annotation shifts from "consider defining this term" to "your use of debate terminology creates insider texture — but consider whether the moment needs to work for readers outside that world too."

**Quality impact**: False positive rate for domain-specific language drops from ~40% (system guessing) to ~5% (student confirms). Every false positive wastes student attention and erodes trust.

### 5. Topic-Fit Diagnosis (Currently Impossible)

The most impactful feedback the system could give is sometimes: "This isn't the right topic for your essay." But the system can't know this without knowing WHY the student chose the topic. If the student says "My counselor told me to write about community service because I don't have enough activities," the system can diagnose:

- The topic was externally imposed, not intrinsically motivated
- The essay's authenticity problems aren't fixable by revision — they're topic-fit problems
- The student might have a better essay buried in their actual interests

This is the highest-ROI feedback possible, and it's ONLY available through conversation.

**Quality impact**: For the ~15-20% of essays where the topic itself is the problem, no amount of craft feedback helps. The Conversator can surface this early and save weeks of misguided revision.

---

## How to Measure Qualitative Improvement

### Before/After Metrics (Per Layer)

| Layer | Current Quality Gap | Conversator Fix | Measurable Signal |
|-------|-------|-------|-------|
| L3 Walk | 50% structural / 50% architectural | Attention allocation via declared significance | Architectural observation rate for high-significance passages: 50% → 75%+ |
| L3 Walk | ~30% primaryFunction confidence < 0.7 | Intent-informed disambiguation | Confidence < 0.7 rate for sentences with declared intent: 30% → 10% |
| L3.75 Synthesis | Voice described, not assessed | Voice intentionality from student | Synthesis entries that assess intent-vs-effect: 0% → 80%+ |
| L3.75 Synthesis | Earned-ness flags without explaining why | Student explains deliberate choices | Earned-ness entries with strategy assessment: ~20% → 70%+ |
| L3.5 Analysis | Safe-middle score clustering (70-85) | Student calibration anchors | Meaningful spread (gap between student's best and worst): 20pt → 35pt+ |
| L3.5 Analysis | Generic weakness descriptions | Intent-effect gap diagnosis | Weakness descriptions referencing specific declared intent: 0% → 70%+ |
| L4 North Star | Intent Bridge always null initially | Conversator gathers intent before first analysis | Intent Bridge populated on first analysis: 0% → 80%+ |
| L4 North Star | Generic distinctiveness | Student identity context | Distinctiveness referencing student-specific context: ~30% → 80%+ |
| L5 Annotations | Teaching test is LLM guessing | Teaching test against declared knowledge | Annotations teaching genuinely unknown information: ~60% → 85%+ |
| L5 Annotations | North Star connection can be superficial | Connection to declared architectural intent | Unfakeable North Star connections: ~40% → 80%+ |
| L6 Coaching | Cognitive assessment misdiagnoses root cause | Categorized insight history | Correct root cause identification: ~60% → 85%+ |
| L6 Coaching | Pattern detection on small sample | Evidence-grounded patterns via declared context | Pattern-informed coaching responses: ~20% → 60%+ |

### The Compound Effect

Each layer's improvement compounds downstream. A 25% improvement in L3 architectural depth → produces 25% richer context for L3.75 → produces 25% more insightful holistic synthesis → produces 25% more grounded L3.5 analysis → produces 25% more specific L5 annotations → produces 25% better L6 coaching responses.

The total compound improvement from one Conversator conversation is not additive — it's multiplicative across 6 layers.

---

## The Deep Questions This Plan Must Answer Before Implementation

1. **Timing**: When does the Conversator gather intelligence relative to analysis? If gathered BEFORE initial analysis, every layer benefits from day one. If gathered DURING/AFTER analysis, only re-analysis benefits. The optimal answer is probably: brief initial gathering (5-10 minutes) before first analysis, continuous gathering during coaching that triggers re-analysis of affected areas.

2. **Depth vs Breadth of Gathering**: Should the Conversator try to get declared intent for EVERY sentence, or focus on high-ambiguity areas? Pipeline-generated questions target ambiguity, but student-volunteered information about non-ambiguous areas can still improve quality. The answer is probably: system-directed questions for ambiguity, open-ended questions for everything else.

3. **Trust Calibration**: How much should the system trust student self-report? Students can be wrong about their own intentions ("I wanted it to be funny" but it reads as bitter, and the student doesn't realize the bitterness is MORE interesting). Declared intent is ground truth for WHAT THE STUDENT WANTS, not for WHAT THE TEXT SHOULD DO. The system's job is to evaluate whether the text achieves the intent AND whether the intent is the best strategy.

4. **Information Decay**: Student intent can change during revision. How does the system handle: student declares intent for P2, revises P2 significantly, and the declared intent may no longer apply? Answer: version-tagged declared data with re-confirmation after major edits.

5. **Gathering Without Biasing**: If the system asks "What were you going for in P2?" the student might reverse-engineer an intent they didn't have. The Conversator must be designed to DETECT post-hoc rationalization vs genuine intent. Techniques: ask about process first ("How did you decide to write P2 this way?"), check consistency with emotional signals, note when declared intent conflicts with revision history.

6. **Quality of Questions Matters More Than Quantity**: A mediocre question ("What is your essay about?") wastes a conversational turn and teaches the student nothing. A great question ("You shift from describing the lab to talking about your grandmother with no warning — what do you want the reader to feel in that gap?") reveals intent AND teaches the student something about their own essay (that the gap exists as a gap, not a transition). Every Conversator question should have dual function: gather intelligence AND raise awareness.

7. **How does gathered intelligence compose across essays?**: A student writing their Common App essay AND three supplementals should carry `student_durable` declared data across essays. "I approach problems by embracing constraints" is student-level context, not essay-level. The Conversator architecture must support cross-essay intelligence that enriches analysis of each individual essay.

---

## What Needs to Happen Before Writing Code

1. **Audit the information gaps**: For each layer (L3, L3.75, L3.5, L4, L5, L6), map every place where the prompt says "if known" or uses hedge language that indicates missing student context. These are the specific insertion points for declared data.

2. **Design the question taxonomy**: Not all questions are equal. Map the question types that produce the highest-value declared data, grounded in specific layer quality gaps. Priority: intent questions (closes L3 ambiguity), voice-intentionality questions (closes L3.75 gap), calibration anchor questions (closes L3.5 clustering gap).

3. **Design the trust model**: How does the system weigh student self-report against text evidence? When they conflict, what happens? This is not a type system question — it's a pedagogical question about when to trust the student vs when to gently challenge their self-assessment.

4. **Design the gathering conversation flow**: Not as a state machine, but as a pedagogical sequence. What questions, in what order, produce the maximum intelligence with minimum student burden? The initial discovery conversation is a 5-10 minute investment that needs to feel natural, not interrogative.

5. **Design the re-analysis trigger**: When declared data arrives, what specifically gets re-analyzed? Not "re-run everything" (expensive) — targeted re-analysis of the areas affected by the new information. This requires mapping declared data scope to pipeline layer scope.

6. **Prototype the intent-effect gap prompt modification**: Take the current L3.5 prompt, add declared intent context, and run it on a test essay. Compare output quality with and without declared intent. If the quality improvement is not dramatic and obvious, the prompt modification needs iteration before building the gathering system.
