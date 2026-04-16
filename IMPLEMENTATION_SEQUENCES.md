# Implementation Sequences: System Intelligence + Writing Craft Quality

> Two parallel work streams to bring Essay Intelligence V2 from C/B- to A+ on both dimensions.
> Each sequence is a self-contained chat session with its own context, goals, and verification criteria.

---

## STREAM A: SYSTEM INTELLIGENCE (B+ → A+)

The system's diagnosis is strong but has gaps in synthesis, emotional intelligence, and actionability.

### Sequence A1: Profile Synthesis + Emotional Intelligence

**Goal**: Transform the profile from a pattern-collection into a genuine understanding of the student — connecting disparate observations into a unified theory of who they are and what they're afraid of.

**Context to provide**:
```
Read these files for full context:
- tests/output/conversator-v2-e2e-audit.txt (the latest E2E output)
- src/services/essayIntelligence/analysis/holisticSynthesis.ts (L3.75 prompts)
- src/services/essayIntelligence/profileTypes.ts (CharacterRevelation, EssayUnderstanding types)
- src/services/essayIntelligence/coaching/coachingService.ts (lines 1370-1560 — coaching philosophy)

AUDIT FINDINGS TO ADDRESS:

1. PROFILE IS A HOROSCOPE: "Someone who thinks in systems" could describe any STEM kid. The profile must integrate Mrs. Chen, the hackathon hiding, the reinterpretation pattern, and the emotional avoidance into a UNIFIED theory of this student. The ideal: "This student presents relational experiences as solo intellectual achievements because they don't yet believe relationships are as impressive as frameworks."

2. DECLARED CONTEXT IS A LIST: studentDeclaredContext accumulates facts ("AI DJ = hackathon, team project, second place") but never SYNTHESIZES them. After 10 turns, it should say: "This student hides collaboration (hackathon team) and mentorship (Mrs. Chen) behind solo intellectual framing — both patterns point to the same root: discomfort with admitting their creative identity was shaped by other people."

3. EMOTIONAL STATE INFERENCE IS SURFACE: CognitiveState detects "resistant_to_specific" but doesn't distinguish between "lazy," "scared," "paralyzed," or "working in parallel." The deflection spiral needed EMOTIONAL diagnosis, not behavioral labeling.

4. CROSS-OBSERVATION SYNTHESIS MISSING: Red flags (solo credit, people absence, scope inflation) are listed independently when they should be connected: "Solo credit + people absence + scope inflation = student who believes AOs value individual brilliance over relational growth."

WHAT TO IMPLEMENT:
- Enhance the L3.75 characterRevelation prompt to produce SYNTHESIS, not lists
- Add a "deflection diagnosis" capability to the coaching service that infers WHY the student is stuck (fear, paralysis, working separately, laziness) and adapts accordingly
- Enhance studentDeclaredContext accumulation to synthesize, not just append
- Connect red flag observations into unified behavioral patterns
- Add "emotional safety" coaching mode that shifts approach when the student is scared vs. lazy
```

### Sequence A2: Coaching Strategy Intelligence

**Goal**: Fix the deflection spiral handling, breakthrough handling, and the transition from diagnosis to action.

**Context to provide**:
```
Read these files for full context:
- tests/output/conversator-v2-e2e-audit.txt (turns 6-10 especially)
- src/services/essayIntelligence/coaching/coachingService.ts (full coaching philosophy + estimateResponseIntensity)
- DEEP_DIVE_AUDIT_PROMPTS_V2.md (Prompt 2 and 3 evaluation criteria)

AUDIT FINDINGS TO ADDRESS:

1. DEFLECTION SPIRAL: 4 turns of "send me your rewrite" produced zero progress. The system correctly detected resistance but responded with escalating frustration instead of changing tactics. THREE ALTERNATIVE APPROACHES (from audit):
   a. Emotional probe: "What's making this choice hard? What are you afraid of?"
   b. Demonstration: "Let me show you something — here's what P1 could look like: [writes sample]. React to this."
   c. Tactical retreat: "Let's set the big question aside. Just tell me about Mrs. Chen's hands when she played."

2. BREAKTHROUGH MISHANDLING: Turn 10 — student discovers emotional center, coach immediately forces A/B/C architectural choice. Should have said: "Write that moment. Right now. 100 words. Mrs. Chen playing, you listening. Don't worry about structure."

3. NO MATERIAL COLLECTION MODE: When the student can't produce text, the coach should shift to EXTRACTING details through conversation ("What did the room smell like? What was on the piano? What did she say after she played?") that become the raw material for demonstration later.

4. STRATEGIC THREAD TOO RIGID: The strategicQuestion is good but the system never adjusts it based on what's actually happening. After 4 turns of deflection, the strategic question should shift from "What architecture should we choose?" to "What is this student afraid of writing?"

WHAT TO IMPLEMENT:
- Add deflection-response escalation ladder: Turn 1 of deflection = hold line. Turn 2 = emotional probe. Turn 3 = demonstrate with sample. Turn 4 = tactical retreat to detail collection.
- Add breakthrough-response mode: When needsDeepening=true AND category=reinterpretation AND emotional valence is high, respond with writing prompt not architectural framework
- Add material collection coaching mode: when the student won't commit to structure, shift to extracting sensory details that will be useful for any architecture
- Enhance strategic question updating to reflect emotional state, not just topical focus
```

---

## STREAM B: WRITING CRAFT OUTCOME (C → A+)

The system diagnoses brilliantly but teaches nothing. The student leaves knowing what's wrong but not how to fix it.

### Sequence B1: Craft Knowledge Base + Demonstration Engine

**Goal**: Give the coaching LLM actual WRITING CRAFT KNOWLEDGE comparable to what PIQ/CommonApp workshops have — named techniques, before/after examples, and the ability to generate personalized rewrites.

**Context to provide**:
```
Read these files for craft knowledge patterns:
- src/services/piq/rubric.ts (13-dimension rubric with scoring criteria — how they evaluate)
- src/services/commonAppWorkshop/ — look for teaching prompts, stage services, transformation examples
- src/services/portfolioStrategy/services/activityWorkshop/expertCounselorKnowledgeBase.ts (first 200 lines)
- tests/fixtures/wqe-reference-essays.ts (reference essays across quality spectrum)
- tests/fixtures/authentic-examples.ts (real successful admissions narratives)
- tests/fixtures/elite-examples-2025.ts (recent successful essays)

Also read the current coaching philosophy:
- src/services/essayIntelligence/coaching/coachingService.ts (lines 1370-1560)

Also read the latest audit results:
- tests/output/conversator-v2-e2e-audit.txt (all 10 coaching turns)
- DEEP_DIVE_AUDIT_PROMPTS_V2.md (all 6 prompts — especially Prompt 2's "Missing Demonstrations" section)

THE CORE PROBLEM:
The coaching service has ZERO craft knowledge embedded. The PIQ workshop has 130+ before/after examples, 50+ issue patterns with fix pathways, and named techniques (sensory_details, active_verbs, emotional_physical, etc). The Common App workshop has 124+ research sources, phase-gated craft vocabulary (anaphora, volta, in medias res for craft phase; syllepsis, temporal compression for polish phase), and transformation examples. The Activity workshop has an expert knowledge base with AO psychology, committee pitch tests, and constraint intelligence.

The Essay Intelligence coaching has: a philosophy prompt that says "be specific" and "shorter is better."

WHAT TO BUILD:

1. ESSAY CRAFT KNOWLEDGE BASE (new file — craft knowledge comparable to expertCounselorKnowledgeBase):
   - Named craft moves with definitions, examples, and when to teach them
   - 8-10 core techniques: Cold open (in medias res), Sensory timestamp, Somatic vulnerability, Definitional pivot, Bookend inversion, Counterintuitive mentor, Anti-lesson, Ritual detail, The inventory opening, Proximity-to-work voice
   - Each with: definition, example from real essays (use fixture files), BAD version (what generic AI produces), when to use it, when NOT to use it
   - Phase-gated: which techniques are appropriate at Foundation vs Craft vs Polish

2. BEFORE/AFTER EXAMPLE LIBRARY (new file — comparable to PIQ's teachingExamples):
   - 30+ transformation pairs organized by issue type:
     - summary→scene
     - telling→showing
     - abstract→concrete
     - generic→specific
     - performed voice→authentic voice
     - thesis ending→scene ending
     - decorative detail→functional detail
   - Each pair includes: the principle, what changed, why the after version is better
   - Examples drawn from real essay fixtures (not fabricated)

3. DEMONSTRATION ENGINE (enhancement to coachingService.ts):
   - When the student asks "how should I improve X?" or "what would better look like?" — the coach WRITES a 2-4 sentence sample rewrite of the specific passage, using the student's declared details
   - The demonstration follows a pattern: name the craft move → show the student's current text → show the rewritten version → explain what changed and why → tell the student to write THEIR version
   - Demonstrations ONLY use details from studentDeclaredContext — never fabricate
   - Demonstrations match the student's voice register (the system has voiceIdentity data)
   - Add a "demonstrate" mode to the coaching service that triggers when: (a) student explicitly asks, (b) student has been stuck for 2+ turns, (c) the coach identifies a specific sentence/paragraph that could be dramatically improved

4. ISSUE-TO-FIX TAXONOMY (enhancement to coaching prompts):
   - When the analysis identifies a specific issue (e.g., "P1 operates in summary mode"), the coaching prompt should include the FIX PATHWAY: "Summary mode → scene mode. Technique: Cold open or sensory timestamp. Ask the student for the specific moment, then demonstrate the transformation."
   - Map the 10 most common essay issues to specific named techniques:
     - Generic opening → Cold open / Sensory timestamp
     - Telling emotions → Somatic vulnerability
     - Cliché lesson → Anti-lesson / Definitional pivot
     - No arc → Bookend inversion
     - Performed voice → Proximity-to-work voice
     - Decorative detail → Functional detail (every word earns its place)
     - Abstract ending → Ritual detail / Scene ending
     - People absence → Named character introduction
     - Solo credit → Collaborative specificity
     - Scope inflation → Evidence anchoring

5. AO PSYCHOLOGY INTEGRATION (enhancement to coaching prompts):
   - Inject 3-5 key AO insights from the expert knowledge base into the coaching context:
     - "AOs read 30+ essays/day. Your essay needs to differentiate in the first 2 sentences."
     - "The Committee Pitch Test: what would an AO say about you in 90 seconds?"
     - "AOs value specific > generic. '47 to 22 questions' beats 'I improved the intake process.'"
     - "The Oof Factor: what makes an AO lean forward? Unusual specificity, improbable scale, genuine sacrifice."
   - These should be available to the coaching LLM as reference material, injected when relevant (not every turn)
```

### Sequence B2: Coaching Response Quality + Demonstration Practice

**Goal**: Make the coaching LLM actually PRODUCE high-quality demonstrations, not just diagnose. Test with real essay material.

**Context to provide**:
```
Read the craft knowledge base and demonstration engine built in Sequence B1.
Also read:
- tests/output/conversator-v2-e2e-audit.txt (all 10 turns)
- tests/fixtures/piano-essay.txt

THE CORE TASK:
The coaching philosophy now says "demonstrate when the student needs to SEE what better looks like." But saying it and doing it are different. The LLM needs to actually produce high-quality sample prose that:
1. Uses the student's declared details (not fabricated)
2. Matches the student's voice register (not AI voice)
3. Demonstrates a named craft move
4. Is clearly a SCAFFOLD (not a finished version the student should copy)

TEST CASES:
For each of these 5 scenarios from the E2E test, write what the coach SHOULD have said (including the demonstration):

1. Turn 2 — student asks about generic P1. Coach should have demonstrated a scene-based opening using declared context (at this point: only essay text, no Mrs. Chen yet)

2. Turn 4 — student asks about voice in P3. Coach identified "thesis voice vs doing voice." Should have shown both registers applied to one of the student's sentences.

3. Turn 5 — student reveals Mrs. Chen. Coach should have shown what P3 looks like WITH Mrs. Chen in it. (Now has declared context: Mrs. Chen taught Chopin)

4. Turn 7 — student asks about connection between new opening and P3. Instead of refusing, coach should have written sample P1 and sample P3 that connect, using declared context.

5. Turn 10 — student has breakthrough about Mrs. Chen playing Chopin. Instead of A/B/C framework, coach should have prompted immediate writing with sensory detail questions AND shown a 2-sentence example.

For EACH test case:
- Write the ideal coach response (including demonstration)
- Identify which craft move the demonstration teaches
- Explain what makes the demonstration effective vs what would make it fall flat
- Note which details come from declared context vs which are fabricated (fabricated = bad)

THEN: Update the coaching prompts to actually produce this quality of response. This means modifying the CONCRETE DEMONSTRATION section of the coaching philosophy, possibly adding craft move reference material to the stable context, and testing whether the LLM can produce demonstrations that match the student's voice.
```

### Sequence B3: Research-Backed Admissions Grounding

**Goal**: Integrate AO psychology, research citations, and strategic admissions context into the coaching experience — comparable to Common App workshop's 124+ sources.

**Context to provide**:
```
Read these files:
- src/services/portfolioStrategy/services/activityWorkshop/expertCounselorKnowledgeBase.ts (AO psychology, committee pitch, oof factor)
- src/services/commonAppWorkshop/ — look for research source integration patterns
- src/services/essayIntelligence/coaching/coachingService.ts (coaching philosophy section)
- src/services/essayIntelligence/analysis/aoFirstRead.ts (the AO simulation)

THE GOAL:
The coaching currently says "AOs read 30 essays by 4pm" but doesn't teach the student HOW to think about their essay from an AO's perspective. The Common App workshop integrates 124+ research sources that ground feedback in evidence ("MIT's AO blog says...", "Stanford looks for intellectual vitality, which means...").

WHAT TO BUILD:

1. ADMISSIONS CONTEXT MODULE (new file or section):
   - 15-20 key AO insights from the expert knowledge base, organized by when they're relevant:
     - Opening coaching: "AOs spend <10 seconds deciding whether to read carefully or skim"
     - Architecture coaching: "The Committee Pitch Test — what will the AO say about you in 90 seconds?"
     - Voice coaching: "AOs at Yale say 'rough edges > lifeless polish'"
     - Conclusion coaching: "Don't end with 'I look forward to continuing this journey' — it's the most common closing in applications"
   - Each with: the source (AO name, school, or research paper), the direct quote, and the coaching implication

2. STRATEGIC COACHING LAYER:
   - The coaching should occasionally reference the AO perspective: "Right now, an AO reading your P1 would think: 'music-to-coding bridge, seen it before.' You need them to think: 'Wait, this one's different because...' That's where your Mrs. Chen detail comes in."
   - NOT every turn — maybe 2-3 times per session, when the AO perspective adds genuine value
   - Integrated with the AO First Read output: "The system's AO simulation said 'put-down risk: high, skimming by P3.' That means your opening has about 2 sentences to earn the reader's continued attention."

3. ARCHETYPE-AWARE COACHING:
   - When the archetype is "saturated" or "common," the coaching should explain what the 95th percentile version of this archetype looks like — not generically, but with examples from the reference essay fixtures
   - "Your archetype (music-as-metaphor) is common. Here's what makes the top 5% of this archetype work: [reference specific essay from fixtures that succeeds in this archetype]. Notice how they don't explain the parallel — they demonstrate it through a specific scene where the two domains collide."
```

### Sequence B4: Phase-Gated Teaching + Issue Taxonomy Integration

**Goal**: Make the coaching responses phase-appropriate (foundation students get different teaching than craft students) and connect issues to specific fix pathways.

**Context to provide**:
```
Read these files:
- src/services/essayIntelligence/analysis/phaseAssessment.ts (phase definitions)
- src/services/essayIntelligence/coaching/coachingService.ts (phase-aware coaching section)
- src/services/piq/rubric.ts (issue taxonomy pattern)
- The craft knowledge base and issue-to-fix taxonomy from Sequence B1

THE PROBLEM:
Phase assessment exists (Foundation/Architecture/Craft/Polish/Distinction) but doesn't meaningfully change what the coaching teaches. A foundation-phase student and a craft-phase student get the same style of feedback. The coaching philosophy has phase-specific directives but they're too vague to produce different behavior.

WHAT TO BUILD:

1. PHASE-GATED CRAFT VOCABULARY:
   - Foundation: NO craft technique names. Plain language. Focus: "What is your essay about? Who is in it? What happened?"
   - Architecture: Structural language. Focus: "Which paragraphs earn their place? Where does the reader lose the thread?"
   - Craft: Named techniques (cold open, sensory timestamp, somatic vulnerability). Focus: "This sentence is doing X; it should be doing Y. Here's the technique."
   - Polish: Precision vocabulary (register shift, temporal compression, negative space). Focus: "This word, specifically. Not that one. Here's why."
   - Distinction: Reader psychology. Focus: "What makes this essay the one the AO brings to committee?"

2. ISSUE-TO-FIX DECISION TREE (injected into coaching context):
   - When the analysis identifies "P1 is summary mode" → coaching receives: "Technique: cold open or sensory timestamp. Ask for the specific moment. If student provides details, demonstrate the transformation. If student is stuck, offer 3 starting sentences to react to."
   - When the analysis identifies "telling emotions" → coaching receives: "Technique: somatic vulnerability. Ask: 'Where did you feel that in your body?' If student says 'I was nervous,' ask: 'What did your hands do? Your stomach? Your voice?'"
   - This should be a lightweight lookup, not an LLM call — the issue type from L3.5 maps to a fix pathway that's injected into the coaching prompt

3. TEST: Run the piano essay through with the new phase-gated teaching and verify:
   - At architecture phase: coaching focuses on structure, not sentence craft
   - Named techniques appear when discussing specific paragraphs
   - Issue-to-fix pathways are followed (summary→scene technique is taught, not just diagnosed)
```

---

## EXECUTION ORDER

```
STREAM A (System Intelligence):
  A1: Profile Synthesis + Emotional Intelligence  (standalone)
  A2: Coaching Strategy Intelligence              (standalone, can parallel A1)

STREAM B (Writing Craft):
  B1: Craft Knowledge Base + Demonstration Engine (FOUNDATION — do first)
  B2: Coaching Response Quality + Testing         (depends on B1)
  B3: Research-Backed Admissions Grounding        (can parallel B1/B2)
  B4: Phase-Gated Teaching + Issue Taxonomy       (depends on B1)
```

**Recommended parallel execution:**
- Chat 1: A1 + A2 (system intelligence, can be done in one session)
- Chat 2: B1 (craft knowledge base — the heaviest build)
- Chat 3: B2 (demonstration testing — needs B1 complete)
- Chat 4: B3 + B4 (admissions grounding + phase gating — can be done together, needs B1)

**Total: 4 chat sessions**, each producing concrete code changes and verified with test runs.

---

## VERIFICATION CRITERIA

After all sequences complete, re-run the E2E test. The following MUST be true:

### System Intelligence (Target: A/A+)
- [ ] Profile synthesizes observations into a unified theory of the student
- [ ] Deflection triggers emotional probe by Turn 2 of resistance (not Turn 5)
- [ ] Breakthrough moment gets writing prompt response, not analytical framework
- [ ] Strategic question adapts to emotional state, not just topic
- [ ] Red flags are connected into behavioral patterns, not listed independently

### Writing Craft (Target: A/A+)
- [ ] Coach demonstrates at least 2x per 10-turn session (writes sample prose)
- [ ] Demonstrations use declared details only (zero fabrication)
- [ ] Named craft moves appear in coaching output (not just "be more specific")
- [ ] Phase-appropriate vocabulary (no "volta" for foundation-phase student)
- [ ] Issue-to-fix pathways followed (summary→scene technique taught, not just diagnosed)
- [ ] At least 1 AO psychology reference per session (grounding in admissions reality)
- [ ] Before/after transformation shown at least 1x per session
- [ ] Student leaves with a writing prompt they can immediately execute

### The Ultimate Test
- [ ] After 10 coaching turns, the student has written at least ONE new sentence/paragraph
- [ ] The coaching output reads like a skilled writing teacher, not a literary analyst
- [ ] A $600/hr counselor reviewing the transcript would say "I would have done something similar"
