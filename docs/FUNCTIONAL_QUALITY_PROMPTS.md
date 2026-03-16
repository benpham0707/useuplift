# Functional Quality Deep Dives — Essay Intelligence System

> 6 self-contained prompts for 6 separate Opus 4.6 Claude Code sessions.
> Each chat investigates ONE specific functional quality question.
>
> **Philosophy**: We don't want "completed" — we want "excellent."
> Every piece should actually do its job at the highest level.
> No confidence scores. No unnecessary sophistication.
> Just reliably excellent output, every time.

---

## HOW TO USE

1. Open 6 separate Claude Code sessions on the repo (branch: `refactor/scoring-decomposition-step3`)
2. Ensure each is **Opus 4.6**
3. Paste one prompt per chat
4. Chats 1, 2, 4, 5 require `ANTHROPIC_API_KEY` for live LLM testing
5. Chat 3 is implementation (can run in parallel with testing chats)
6. Chat 6 is implementation (can run after testing chats confirm what to keep/remove)

**Dependency order:**
- Chats 1, 2, 5 can run in parallel (independent testing)
- Chat 3 (earned-ness implementation) should run early — Chat 4 depends on it
- Chat 4 (L5 testing) benefits from Chat 3 completing first
- Chat 6 (confidence removal) should run last after all testing insights are gathered

---

# CHAT 1: Does L3 Actually Produce Architectural Understanding?

## Context

You're working on an AI essay coaching platform. The L3 "Sequential Deep Walk" is the CORE engine — it walks paragraph-by-paragraph through a college essay, building deep understanding of every sentence.

The L3 prompt defines three levels of observation depth:
- **Surface**: "The first sentence uses concrete nouns" (just noticing)
- **Structural**: "The sensory registers (leather, light, counter) ground the reader in physicality" (technique + what it does)
- **Architectural**: "The narrator understands value through what can be touched, weighed, appraised — establishing an epistemology that the grandmother's story will disrupt" (what the technique REVEALS about meaning-making)

The gap between structural and architectural is the gap between "good essay analysis" and "insight a human expert would produce." We need to know: **does L3 consistently produce architectural-level observations, or does it stop at structural?**

## Your Task

### Phase 1: Test Current Output Quality

1. Read `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` thoroughly. Understand the prompt, the output schema, the context assembly.

2. Write a focused test script (`tests/test-l3-depth-audit.ts`) that:
   - Takes the piano essay from `tests/fixtures/piano-essay.txt`
   - Runs ONLY L1 (for sentence splitting) and then L3 (the deep walk) — skip L2/L2.5 for now to isolate L3's native quality
   - Captures the FULL JSON output for every paragraph
   - Writes the output to `tests/output/l3-depth-audit-output.json`
   - Also writes a human-readable summary to `tests/output/l3-depth-audit-summary.txt` that lists each observation with its text

3. Run the test: `ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-l3-depth-audit.ts`

4. Read the output and **classify every observation** as:
   - SURFACE (just notices a feature exists)
   - STRUCTURAL (identifies technique + what it achieves locally)
   - ARCHITECTURAL (reveals what the technique tells us about HOW the essay makes meaning)

5. Calculate the distribution: what % of observations are architectural?

### Phase 2: Identify Why (If Depth is Low)

If architectural observations are <40% of total:

1. Examine the observations that ARE architectural. What do they have in common? What in the prompt elicited them?

2. Examine the observations that stopped at structural. What would the architectural version look like? Write 3-5 concrete examples of "structural observation → what the architectural version would say."

3. Look at the prompt's forcing functions. The prompt says "Always aim for architectural" but does it have:
   - Negative examples showing structural-level output as INSUFFICIENT?
   - A self-check instruction like "After writing each observation, ask: does this reveal how the essay makes meaning, or just what the text does?"
   - Banned vocabulary for structural-level language?

### Phase 3: Iterate on the Prompt

Based on Phase 2 findings:

1. Add forcing functions to the L3 system prompt that push toward architectural depth. Consider:
   - A self-check instruction after each observation
   - 2-3 examples of structural → architectural upgrades using the piano essay context
   - Banned structural-only language patterns (but be careful — some observations genuinely ARE surface/structural level and that's fine for craft notices)

2. Re-run the test with the updated prompt.

3. Compare before/after: did architectural % improve? Did any observations get WORSE (over-reaching into false profundity)?

4. If observations start over-reaching ("every word choice reveals the narrator's existential positioning"), pull back. The goal is genuine architectural insight, not pretentious depth.

### Phase 4: Also Test L2 Quality

While you have the test infrastructure:

1. Add L2 structural cartography to the test (run L1 → L2 → L3 with L2 feeding into L3 context)
2. Check L2's structural role labels: are they architectural ("frame of risk") or generic ("introduction", "development")?
3. If L2 produces generic labels, add a vocabulary ban to L2's prompt: `BANNED: 'introduction', 'development', 'conclusion', 'provides context', 'establishes', 'discusses'. Every role must be a structural metaphor specific to THIS essay.`
4. Re-test: does better L2 input improve L3 output?

## Files (read AND write)

| File | Purpose |
|------|---------|
| `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` | L3 prompt + walk logic |
| `src/services/essayIntelligence/analysis/structuralCartographer.ts` | L2 prompt |
| `src/services/essayIntelligence/analysis/firstImpressions.ts` | L1 (need for sentence splitting) |
| `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` | Pipeline coordinator (READ for data flow) |
| `src/services/essayIntelligence/profileManager/profileRouter.ts` | Context assembly for L3 (READ) |
| `tests/fixtures/piano-essay.txt` | Test essay |
| `tests/test-l3-depth-audit.ts` | NEW — your test script |
| `tests/output/` | NEW — output directory |

## What "Excellent" Looks Like

For the piano essay's first paragraph about "fingers dancing across piano keys":
- **Structural** (what we probably get now): "Uses kinesthetic imagery ('fingers danced') to establish physical connection to the instrument. Metaphor of 'creating worlds' positions music as generative act."
- **Architectural** (what we want): "The narrator's first gesture is physical contact — fingers touching keys. Not listening, not being moved, but DOING. This frames the entire essay's epistemology: this is someone who understands through making, not through receiving. 'Creating worlds' isn't metaphorical ambition — it's the narrator's actual relationship to meaning. They make, therefore they understand. The music-to-coding bridge in P4 isn't a stretch; it's the same epistemology applied to a different medium."

The architectural version reveals the meaning-making strategy. The structural version describes what the text does.

## Quality Gate

By the end, you should have:
1. A baseline measurement (% architectural before changes)
2. An improved measurement (% architectural after prompt iteration)
3. 3-5 specific prompt additions that increased depth without introducing false profundity
4. Concrete output examples showing the improvement
5. All type checks pass: `npx tsc --noEmit`

---

# CHAT 2: Does L3.5 Actually Differentiate Scores?

## Context

L3.5 is the first evaluative layer — it assigns effectiveness scores (0-100) to every sentence in the essay. These scores drive the improvement phase (Foundation/Architecture/Craft/Polish/Distinction), which controls what feedback the student sees.

The L3.5 prompt has excellent calibration language: "If your scores cluster in 75-90, you have FAILED." Scoring anchors range from 96-100 (MASTERFUL) to <40 (PROBLEMATIC).

**But does Sonnet actually follow this?** LLMs have a well-documented tendency to produce "safe" scores in the 70-85 range. If all sentences in a mediocre essay get 72-83, the system can't identify which sentences are strong vs weak, and the improvement phase defaults to a generic middle ground.

## Your Task

### Phase 1: Test Score Distribution on Diverse Essays

1. Read `src/services/essayIntelligence/analysis/analysisPass.ts` thoroughly. Understand the prompt, the scoring anchors, the anti-clustering instruction.

2. Write a test script (`tests/test-l35-score-audit.ts`) that:
   - Runs the FULL pipeline (L1 through L3.5) on TWO essays:
     a. The piano essay from `tests/fixtures/piano-essay.txt` (mediocre — template language, generic metaphors, no genuine depth)
     b. The excellent activity essay from `tests/fixtures/wqe-reference-essays.ts` (EXCELLENT_ESSAY — genuine story, specific detail, real insight)
   - For each essay, captures ALL sentence-level effectiveness scores
   - Writes a statistical summary: min, max, mean, median, stdev, histogram (buckets: <40, 40-54, 55-75, 76-85, 86-95, 96-100)
   - Writes each sentence with its score and the effectivenessReasoning
   - Outputs to `tests/output/l35-score-audit.json` and `tests/output/l35-score-audit-summary.txt`

3. Run the test: `ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-l35-score-audit.ts`

Note: The WQE reference essays are activity descriptions, not full college essays. You may need to adapt the pipeline input format. If the full pipeline requires essay-type fields that activities don't have, create a wrapper that fills in defaults.

### Phase 2: Analyze Score Distributions

Read the output and answer:

1. **Spread**: Is the standard deviation > 10? If < 7, scores are clustering.
2. **Differentiation**: For the piano essay vs the excellent essay — is there a meaningful gap in average scores? The excellent essay should score significantly higher on narrative-carrying sentences.
3. **Low-end usage**: Are ANY sentences scored below 55? Below 40? If the piano essay (which has genuinely weak sentences like "I was captivated by the power to create worlds through sound") doesn't get any scores below 60, the calibration is too generous.
4. **High-end restraint**: Are ANY sentences scored above 90? If generic sentences in the piano essay score 85+, the high end is too loose.
5. **Reasoning quality**: Read the effectivenessReasoning for 5-6 sentences. Does the reasoning actually justify the score? Or is it vague ("this sentence effectively conveys the writer's passion")?

### Phase 3: Improve Calibration (If Needed)

If scores cluster (stdev < 10) or if the piano essay scores too high:

1. **Strengthen the anti-clustering forcing function**: The current instruction says "if scores cluster 75-90, you FAILED." Consider adding:
   - "Before assigning ANY score, first RANK all sentences from strongest to weakest. The strongest sentence and weakest sentence must differ by at least 25 points."
   - "A mediocre essay's sentences should average 55-65, not 70-80. Reserve 75+ for sentences that genuinely earn it."

2. **Add calibration examples specific to the essay type**: The prompt has generic anchors. Add concrete examples:
   - "SCORE 45: 'I was captivated by the power to create worlds through sound.' — Template language. 'Captivated' is cliche. 'Power to create worlds' is unearned grandiosity. No specific sensory detail. Any applicant could write this sentence."
   - "SCORE 88: 'Most Wednesdays smelled like bleach and citrus.' — Specific day (not 'every day'), specific sensory registers (smell, not sight), grounds the reader physically in a real place. You believe this person was there."

3. **Test the piano essay's weakest sentence**: "From the moment my fingers first danced across the piano keys, I was captivated by the power to create worlds through sound." This should score 40-55 (cliche opening, no specific detail, grandiose language). If it scores 70+, the calibration is broken.

4. Re-run the test with updated prompt. Compare distributions.

### Phase 4: Score → Improvement Phase Mapping

After ensuring good score distributions:

1. Trace how scores flow to `computeImprovementPhase()`. Read the function.
2. For the piano essay's score distribution, what improvement phase would be computed? Is it reasonable?
3. For the excellent essay, what phase? Should it be Craft or Polish, not Foundation.
4. If the phase mapping is wrong, adjust the thresholds in `computeImprovementPhase()`.

## Files (read AND write)

| File | Purpose |
|------|---------|
| `src/services/essayIntelligence/analysis/analysisPass.ts` | L3.5 prompt + scoring logic |
| `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` | Pipeline (need to run L1→L3.5) |
| `tests/fixtures/piano-essay.txt` | Mediocre test essay |
| `tests/fixtures/wqe-reference-essays.ts` | Excellent test essay (EXCELLENT_ESSAY) |
| `tests/test-l35-score-audit.ts` | NEW — your test script |

## What "Excellent" Looks Like

For the piano essay:
- Average score: 50-65 (mediocre essay should get mediocre scores)
- Score range: 35-78 (some sentences are genuinely weak, some are okay)
- The opening sentence ("From the moment my fingers first danced...") should score 40-55
- The AI DJ detail ("developed an artificially intelligent disc jockey") should score higher (specific, concrete)
- Standard deviation: > 12 (real differentiation within the essay)

For the excellent essay:
- Average score: 70-82 (strong but not inflated)
- Score range: 58-92 (real differentiation — specific moments score high, transitions score lower)
- Standard deviation: > 10

## Quality Gate

1. Clear before/after comparison of score distributions
2. Concrete evidence that scoring differentiates strong vs weak sentences
3. Concrete evidence that a mediocre essay scores lower than an excellent one
4. Updated calibration examples in the prompt if needed
5. Type check passes: `npx tsc --noEmit`

---

# CHAT 3: Implement L3.75 Earned-ness Map + Voice Intentionality

## Context

L3.75 (Holistic Synthesis) sees ALL sentence-level understanding simultaneously and produces 10 holistic sections. Currently it produces 8 of 10. Two are missing:

1. **Earned-ness Map** — A backward-tracing arrow network that identifies WHY emotional/intellectual/humorous moments land or fail. 7 earning mechanism types: sensory_grounding, emotional_setup, stakes_establishment, character_revelation, thematic_preparation, intellectual_scaffolding, comedic_subversive_setup.

2. **Voice Intentionality** — For each voice shift detected in the voice map, an assessment of whether the shift is intentional (strength to celebrate) or unintentional (drift to flag).

These are PLAN.md's most innovative features. The types exist in `profileTypes.ts`. The mutators exist and are tested. The L3.75 prompt just never asks for them.

**Important design note on confidence scores**: We are NOT adding confidence scores to earned-ness or intentionality. No 0-1 scales. The system should produce observations it's certain about. If the LLM isn't sure whether a moment is earned, it should explain what's present vs missing — not assign a 0.6 confidence number. For voice intentionality: use clear categories like `clearly_intentional`, `uncertain`, `likely_unintentional` — but NOT as a score, as a reasoned assessment with evidence.

Actually, re-read the paragraph above. Even those categories may add complexity. The simplest approach: for each voice shift, the LLM explains WHY it thinks the shift happened (citing text evidence). If it can point to clear textual evidence of intent (the shift serves a narrative purpose, the student set it up), it's intentional. If it can't, it's unintentional or uncertain. The reasoning IS the assessment — no separate category needed. The downstream consumer (L5, L6) can read the reasoning and decide what to do.

## Your Task

### Phase 1: Understand the Existing Infrastructure

1. Read these files:
   - `PLAN.md` lines 677-865 (Earned-ness Map specification)
   - `PLAN.md` lines 410-673 (Voice Map specification, especially intentionality)
   - `src/services/essayIntelligence/profileTypes.ts` — find `MomentEarnednessMap`, `EarnedMoment`, `EarningMechanism`, `VoiceShift`
   - `src/services/essayIntelligence/profileManager/mutators/earnednessMutator.ts` — understand the mutator API
   - `src/services/essayIntelligence/profileManager/mutators/voiceMapMutator.ts` — understand voice shift storage
   - `src/services/essayIntelligence/analysis/holisticSynthesis.ts` — understand the current prompt and output parsing

2. Map exactly what the L3.75 prompt currently asks for (which sections, which fields).

3. Map what the `applyHolisticSynthesis()` method in the coordinator expects. Understand the data path: L3.75 output → parsing → coordinator → mutators.

### Phase 2: Add Earned-ness Map to L3.75

1. Update the L3.75 system prompt to include earned-ness analysis. The prompt should:
   - Explain the concept: "For each significant emotional, intellectual, humorous, or subversive moment in the essay, trace BACKWARD. What earlier content earned this moment? What mechanisms were used?"
   - Define the 7 mechanism types with clear examples:
     - `sensory_grounding`: "Reader feels the cold counter, smells the leather — they're physically IN the pawnshop before being asked to feel the loss"
     - `emotional_setup`: "The grandmother's laugh is established as warm in P1 before its absence is weaponized in P4"
     - `stakes_establishment`: "The reader understands what the scholarship means to the family before learning it was denied"
     - `character_revelation`: "We see the narrator's precision with instruments before they apply that same precision to a moral dilemma"
     - `thematic_preparation`: "The concept of 'value' is explored through physical objects before being applied to relationships"
     - `intellectual_scaffolding`: "The coding-music parallel is built step by step: scales→debugging, composing→architecture, before the AI DJ synthesis"
     - `comedic_subversive_setup`: "Expectation of formal recital culture established before the narrator breaks convention"
   - Ask for GAPS — moments that AREN'T earned: "P3S5 claims 'it changed everything' but no prior passage established what 'everything' was or why it mattered"
   - Include a structural observation: "What does the pattern of earned vs unearned moments reveal about this essay's maturity?"

2. Update the JSON output schema to include the earned-ness section.

3. Update the parser in `holisticSynthesis.ts` to extract earned-ness data.

4. Update the coordinator's `applyHolisticSynthesis()` to route earned-ness data to the `EarnednessMutator`.

### Phase 3: Add Voice Intentionality to L3.75

1. The voice map section of L3.75's prompt already asks for voice shifts. Update it to also ask:
   - For each shift: "WHY did this shift happen? Cite the textual evidence that suggests intent. Is there a narrative reason for the register change? Did the student set it up?"
   - Frame it as reasoning, not scoring: "Explain whether the shift appears intentional (serves a clear narrative purpose, has textual setup) or unintentional (voice drifts without apparent purpose, the student seems to lose their register)."
   - Store the reasoning in the shift's intentionality assessment field.

2. Update the parser and coordinator to pass intentionality reasoning to the `VoiceMapMutator`.

### Phase 4: Test the Implementation

1. Write a test script (`tests/test-l375-earned-voice-audit.ts`) that:
   - Runs L1 → L3 → L3.75 on the piano essay
   - Captures the full L3.75 output including earned-ness map and voice intentionality
   - Writes human-readable output showing:
     - Each identified moment with its earning mechanisms (or gap description)
     - Each voice shift with its intentionality reasoning
   - Output to `tests/output/l375-earned-voice-audit.txt`

2. Run the test and evaluate:
   - Did L3.75 identify the right moments? (The piano essay's "reaffirmed my belief in the connection between technology and human emotion" is an UNEARNED moment — the essay never shows this connection being tested or doubted)
   - Are the earning mechanisms specific and grounded in text? Or vague?
   - Are voice shift assessments backed by evidence?

3. Iterate on the prompt if quality is low.

## Files (read AND write)

| File | Purpose |
|------|---------|
| `src/services/essayIntelligence/analysis/holisticSynthesis.ts` | L3.75 prompt + parser |
| `src/services/essayIntelligence/profileTypes.ts` | Type definitions (READ — Chat 1's domain for edits, but you may need to add fields for intentionality reasoning if not present) |
| `src/services/essayIntelligence/profileManager/essayProfileManager.ts` | Coordinator routing (update `applyHolisticSynthesis`) |
| `src/services/essayIntelligence/profileManager/mutators/earnednessMutator.ts` | Earned-ness mutator (READ — verify API) |
| `src/services/essayIntelligence/profileManager/mutators/voiceMapMutator.ts` | Voice mutator (READ — verify API) |
| `PLAN.md` | Vision reference |
| `tests/test-l375-earned-voice-audit.ts` | NEW — your test script |

## Design Principles

- **No confidence scores**: Don't add numerical confidence to earned-ness moments or voice shifts. The LLM should produce observations it's certain about, backed by textual evidence. If it can't cite evidence, it shouldn't include the observation.
- **Evidence over judgment**: Every earned-ness mechanism must cite specific text. "sensory_grounding via the leather/light/counter details in P1S1-S3" — not "sensory_grounding (confidence: 0.8)".
- **Gaps are as important as mechanisms**: Identifying UNEARNED moments ("this emotional claim has no earning setup") is where the real coaching value lies.

## Quality Gate

1. L3.75 produces earned-ness data for the piano essay
2. At least 2-3 gaps identified (the piano essay has several unearned claims)
3. Voice shifts have reasoning-backed intentionality assessments
4. Data flows through coordinator → mutators without errors
5. Type check passes: `npx tsc --noEmit`

---

# CHAT 4: Do L5 Annotations Actually Teach?

## Context

L5 (Deep Annotation Service) is the student-facing feedback layer. It generates per-paragraph annotations that should teach the student HOW to improve. The annotations are phase-aware (Foundation → essay-level, Polish → word-level) and should reference the essay's North Star architecture.

**The core question: do L5 annotations teach with causal chains, or just label issues?**

Teaching with causal chain: "P2 is where you establish your father's value system — the reader needs to FEEL the weight of 'if it's worth doing, it's worth doing right' before P4 tests that belief against the scholarship denial. Right now P2 tells us about the value system but doesn't show it in action. What if we SAW a moment where your father applied this principle — choosing quality over speed in a specific situation the reader can picture?"

Labeling an issue: "Consider adding more specific detail to paragraph 2 to strengthen the reader's connection."

The first teaches WHY the issue matters to the essay's architecture. The second is generic writing advice that any AI tool produces.

## Your Task

### Phase 1: Test Current Annotation Quality

1. Read `src/services/essayIntelligence/analysis/deepAnnotationService.ts` thoroughly. Understand the prompt, phase-awareness, North Star integration.

2. Write a test script (`tests/test-l5-teaching-audit.ts`) that:
   - Runs the FULL pipeline (L1 through L5) on the piano essay
   - Captures ALL annotations for every paragraph
   - Writes each annotation in human-readable format:
     ```
     [P2S3] growth_opportunity (phase: architecture)
     CONTENT: <the actual annotation text>
     TEACHING RATIONALE: <the rationale>
     NORTH STAR CONNECTION: <how it connects to architecture>
     REWRITE EXAMPLE: <if provided>
     ```
   - Output to `tests/output/l5-teaching-audit.txt`

3. Run the test: `ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-l5-teaching-audit.ts`

### Phase 2: Classify Annotation Quality

Read every annotation and classify:

1. **Teaches with causal chain** — Explains WHY the issue matters to THIS essay's architecture. References specific structural role, through-line involvement, or connection to other paragraphs. Gives the student insight they couldn't get from a generic writing guide.

2. **Labels with North Star decoration** — Mentions North Star but vaguely. "This connects to your through-line" without explaining HOW or WHY.

3. **Generic writing advice** — Could apply to any essay. "Add more sensory detail." "Show don't tell." "Use stronger verbs." This is the floor — if we're producing this, our 8-layer pipeline is wasted.

Calculate the distribution. If >30% are generic writing advice, we have a problem.

### Phase 3: Check for Banned Phrases

Scan all annotations for the banned phrases from the L5 system prompt:
- "Consider adding more sensory detail"
- "Show don't tell"
- "Use stronger verbs"
- "Add more specificity"
- "Make it more vivid"
- "Strengthen the connection"

If any appear, the LLM is ignoring the ban. This needs stronger enforcement.

### Phase 4: Improve Annotation Quality

Based on findings:

1. **If annotations are generic**: Strengthen the forcing function in the L5 system prompt. Add:
   - "Every annotation MUST answer: WHY does this matter for THIS essay specifically? If your rationale could apply to any essay, it's generic. Rewrite it."
   - "Reference the paragraph's structural role from the North Star: 'This paragraph IS [role]. Its job is [significance]. This annotation matters because [specific reason tied to role].'"

2. **If annotations label without causal chains**: Add examples to the prompt:
   - "BAD: 'This paragraph would benefit from more specific detail.' (Why? What kind of detail? What would it accomplish for the architecture?)"
   - "GOOD: 'P2 establishes your value system — it's the foundation P4 tests against. Right now it TELLS us about precision but doesn't SHOW it. A single moment where you chose precision over speed would give the reader something to hold onto when the stakes arrive in P4.'"

3. **If earned-ness data is available** (from Chat 3): Add to L5's prompt:
   - "When annotating emotional/intellectual moments, check the earned-ness map. If a moment is unearned, your annotation should explain WHAT earning mechanisms are missing and WHERE to add them. Frame it as: 'This moment needs [mechanism type] earlier in the essay. Specifically, [concrete suggestion].'"

4. Re-run the test and compare.

### Phase 5: Test Banned Phrase Enforcement

If banned phrases appeared in Phase 3:

1. Add post-processing validation: after L5 returns annotations, scan for banned phrases
2. If found, either filter them out and log a warning, or add a stricter prompt instruction
3. Consider adding: "ABSOLUTELY FORBIDDEN in any annotation: [list]. If you write any of these phrases, your annotation will be DELETED. Replace with architecture-specific language."

## Files (read AND write)

| File | Purpose |
|------|---------|
| `src/services/essayIntelligence/analysis/deepAnnotationService.ts` | L5 prompt + annotation logic |
| `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` | Pipeline coordinator |
| `tests/fixtures/piano-essay.txt` | Test essay |
| `tests/test-l5-teaching-audit.ts` | NEW — your test script |

## What "Excellent" Looks Like

For the piano essay P5 (about debugging code mirroring practicing scales):

**Generic** (what we don't want): "Consider adding more specific examples of how debugging relates to practicing scales."

**Labels** (mediocre): "This paragraph connects your two interests. Strengthening the parallel would improve the essay's coherence."

**Teaches** (excellent): "P5 is doing the hardest work in the essay — it's the BRIDGE between your two identities (musician and coder). Right now it asserts the parallel ('practicing scales mirrors debugging code') but doesn't SHOW it happening. The AI DJ in the next sentence is your best evidence — but it arrives as a separate claim rather than growing from the scale/debugging insight. What if the debugging experience was the SCENE, and the scale-practice parallel was something you realized mid-debug? Let the reader discover the connection with you, rather than being told about it."

## Quality Gate

1. Baseline measurement: % of annotations that teach with causal chains
2. Improved measurement after prompt iteration
3. Zero banned phrases in final output
4. Every annotation references THIS essay's specific architecture
5. Type check passes: `npx tsc --noEmit`

---

# CHAT 5: Does L6 Coaching Actually Evolve Across Turns?

## Context

L6 coaching is the student-facing conversation. A student submits an essay, gets analysis, then chats with the coach. The coach should feel like a human expert who KNOWS this essay deeply and gets SMARTER with each turn.

**The questions:**
1. What does "good coaching" actually look like across 5-8 turns?
2. Does the current system produce it?
3. Where does coaching quality degrade?

Right now, pattern detection data is collected (repeated focus, structural resistance, premature polish) but **never injected into the Stage 3 prompt**. The coach literally cannot say "I notice you keep returning to your opening." This is the biggest coaching quality gap.

Also: there's no anti-repetition between turns. If a student asks about their opening twice, the coach may rephrase the same observation instead of going deeper.

## Your Task

### Phase 1: Define What Good Multi-Turn Coaching Looks Like

Before testing, define the gold standard. Write a brief document (`tests/output/coaching-quality-rubric.md`) that answers:

1. **Turn 1 (student: "What do you think of my essay?")**: What should the coach say? Should lead with the most important architectural observation. Reference specific text. Be honest about the essay's current level without being discouraging.

2. **Turn 3 (student returns to opening paragraph)**: Coach has already discussed the opening. What should be different? Must go DEEPER — reference specific sentences not covered before, explore a different dimension, or connect to something discussed in Turn 2.

3. **Turn 5 (student says "I meant the music-coding connection to show I'm versatile")**: This is a reinterpretation. The coach should evaluate: does the text actually communicate versatility? If not, what would? Cite specific text evidence for the gap.

4. **Turn 7 (student hasn't edited anything after 7 turns of discussing changes)**: The coach should notice this pattern and gently probe: "We've talked about several changes — would it help to start with one? I'd suggest P2 since that's where the biggest structural improvement would come from."

5. What makes coaching BAD:
   - Repeating the same observation in different words
   - Generic advice ("add more detail")
   - Ignoring what the student actually said
   - Being sycophantic ("Great question!")
   - Not referencing specific text from the essay

### Phase 2: Test Current Coaching Quality

1. Read `src/services/essayIntelligence/coaching/coachingService.ts` thoroughly. Understand all 4-5 stages, the prompt, the context assembly.

2. Write a test script (`tests/test-l6-coaching-audit.ts`) that:
   - Runs the FULL pipeline (L1 through L4) on the piano essay to build the profile
   - Then simulates 5 coaching turns:
     - Turn 1: "What do you think of my essay overall?"
     - Turn 2: "Tell me more about the opening paragraph"
     - Turn 3: "What about the opening paragraph though — is it good enough?"  (tests anti-repetition)
     - Turn 4: "Actually I meant the music-coding parallel to show my versatility" (tests reinterpretation)
     - Turn 5: "How should I improve paragraph 3?" (tests paragraph-specific coaching with profile context)
   - Captures each coaching response in full
   - Output to `tests/output/l6-coaching-audit.txt`

3. Run the test: `ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-l6-coaching-audit.ts`

### Phase 3: Evaluate Against Rubric

Read each coaching response and evaluate against your rubric:

1. **Turn 1**: Does it lead with the most important observation? Does it reference specific text? Is it honest about the piano essay's mediocrity without being harsh?

2. **Turn 3 vs Turn 2**: Does Turn 3 go DEEPER than Turn 2? Or does it repeat the same points? This is the critical anti-repetition test.

3. **Turn 4**: Does the reinterpretation trigger Stage 4? Does the coach evaluate whether the text actually shows versatility? Does the profile update correctly?

4. **Turn 5**: Does the coach use paragraph-level analysis (from L3.5) for P3? Does it reference specific sentences?

5. **Overall**: Does the conversation feel like it's EVOLVING? Or does each turn feel independent?

### Phase 4: Wire Pattern Detection + Anti-Repetition

Based on findings:

1. **Wire pattern injection into Stage 3 prompt**: Read `profile.patternInsights` (or wherever patterns are stored) and add them to the coaching prompt. Format:
   ```
   === COACHING PATTERNS ===
   - Student has asked about opening paragraph 2 times. Go deeper — don't repeat.
   - Student has not edited the essay despite 5 turns of discussion.
   ```

2. **Add anti-repetition instruction** to Stage 3 system prompt:
   ```
   If the student returns to a topic previously discussed:
   1. Check conversation history — what did you already say about this?
   2. Do NOT rephrase. Go DEEPER: new sentences, new dimension, new connection.
   3. If nothing new to add, say so honestly and redirect to implementation.
   ```

3. **Add response length guidance** by phase:
   ```
   Foundation: 2-3 paragraphs. Architecture: 2-3 focused paragraphs.
   Craft: 1-2 paragraphs. Polish: 4-6 sentences. Distinction: 1-2 paragraphs.
   ```

4. Re-run the 5-turn test and compare Turn 3 before/after.

## Files (read AND write)

| File | Purpose |
|------|---------|
| `src/services/essayIntelligence/coaching/coachingService.ts` | L6 coaching service |
| `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` | Pipeline (need full profile) |
| `src/services/essayIntelligence/analysis/reanalysisOrchestrator.ts` | Re-analysis (READ — context) |
| `tests/fixtures/piano-essay.txt` | Test essay |
| `tests/test-l6-coaching-audit.ts` | NEW — your test script |
| `tests/output/coaching-quality-rubric.md` | NEW — your quality rubric |

## Quality Gate

1. Coaching quality rubric documented
2. 5-turn test showing before/after improvement
3. Turn 3 demonstrably goes deeper than Turn 2 (not rephrasing)
4. Pattern detection data reaches the prompt
5. Type check passes: `npx tsc --noEmit`

---

# CHAT 6: Remove Confidence Scores — Raise the Quality Bar

## Context

Throughout the Essay Intelligence system, observations carry confidence scores (0.0-1.0). These are LLM self-reports with zero calibration against ground truth. When Sonnet writes `confidence: 0.85`, it's guessing a number, not providing a calibrated probability.

Downstream systems then treat these guesses as meaningful: `if (confidence >= 0.8)`, readiness scoring uses `thesisConfidence`, routing decisions reference connection confidence. This adds apparent precision without real accuracy.

**The decision**: Remove continuous confidence scores entirely. The system should produce observations it's certain about, backed by textual evidence. If the LLM isn't sure, it should investigate deeper or not include the observation — not assign a low number and hope downstream consumers handle it.

**Exception**: Some fields use "confidence" as a concept but should be reframed as categorical assessments:
- `thesisConfidence` → `thesisPresence: 'clear' | 'emerging' | 'absent'` — this IS useful as a categorical signal
- But we do NOT need continuous 0-1 scales anywhere

**Important**: Do NOT remove fields that downstream code actively uses without checking all consumers first. Trace every `confidence` reference in the codebase before removing it. Some may need to be replaced with categorical alternatives, others can be dropped entirely.

## Your Task

### Phase 1: Audit All Confidence Usage

1. Search the entire `src/services/essayIntelligence/` directory for every use of `confidence`:
   - In type definitions (`profileTypes.ts`)
   - In prompts (all analysis files)
   - In downstream consumers (profile manager, router, coaching, mutators)
   - In readiness calculations

2. For each confidence field, document:
   - What it is
   - Who writes it (which layer/prompt)
   - Who reads it (which downstream consumer)
   - What decision it drives
   - Whether removing it would break something

3. Write the audit to `tests/output/confidence-audit.md`

### Phase 2: Classify Each Confidence Field

For each field found, classify:

**A. Remove entirely** — No downstream consumer makes meaningful decisions from it. Example: `ObservationEntry.confidence` if no code filters or sorts by it.

**B. Replace with categorical** — Downstream code uses it but would work better with categories. Example: `thesisConfidence: number` → `thesisPresence: 'clear' | 'emerging' | 'absent'`

**C. Keep but reframe** — The concept is needed but shouldn't be a 0-1 scale. Example: connection strength might be better as `strength: 'strong' | 'moderate' | 'tentative'`

**D. Keep as-is** — Genuinely useful as a number AND downstream code calibrates against it correctly. (There may be zero items in this category.)

### Phase 3: Implement Removals

For category A (remove entirely):
1. Remove the field from `profileTypes.ts`
2. Remove from all prompts that ask the LLM to produce it
3. Remove from all downstream consumers
4. Run `npx tsc --noEmit` to catch all type errors and fix them

For category B (replace with categorical):
1. Change the type in `profileTypes.ts` (e.g., `confidence: number` → `certainty: 'high' | 'moderate' | 'speculative'` — BUT only if the categories serve a real purpose)
2. Update prompts to ask for the category instead of a number
3. Update downstream consumers to use the category
4. Run type check

For category C (keep but reframe):
1. Update the type and prompt as needed
2. Ensure downstream code uses the new format

### Phase 4: Update Prompts to Raise Quality Bar

After removing confidence scores, update ALL analysis prompts with a quality bar instruction:

```
QUALITY BAR: Only include observations you are certain about based on textual evidence.
Every observation must cite specific text that supports it. If you cannot point to
specific words/phrases/patterns in the essay that demonstrate your observation,
do not include it. Uncertain observations waste downstream processing and dilute
the profile.
```

This replaces the "confidence: 0.85" paradigm with "include it if you're sure, don't if you're not."

### Phase 5: Update Readiness Calculations

`computeEssayReadiness()` currently uses `thesisConfidence` (line 1943-1946). If you replace this with a categorical `thesisPresence`, update the readiness logic:
```typescript
// Before: if (thesisConf >= 0.8) score += 30;
// After:
if (thesisPresence === 'clear') score += 30;
else if (thesisPresence === 'emerging') score += 15;
// 'absent' → no points
```

Similarly update any other readiness calculations that reference confidence.

## Files (read AND write)

| File | Purpose |
|------|---------|
| `src/services/essayIntelligence/profileTypes.ts` | Type definitions — remove/replace confidence fields |
| `src/services/essayIntelligence/profileManager/essayProfileManager.ts` | Coordinator — readiness calculations |
| `src/services/essayIntelligence/profileManager/profileRouter.ts` | Router — may filter by confidence |
| `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` | L3 prompt — produces observation confidence |
| `src/services/essayIntelligence/analysis/holisticSynthesis.ts` | L3.75 prompt |
| `src/services/essayIntelligence/analysis/analysisPass.ts` | L3.5 prompt |
| `src/services/essayIntelligence/analysis/crystallizer.ts` | L4 prompt |
| `src/services/essayIntelligence/analysis/deepAnnotationService.ts` | L5 prompt |
| `src/services/essayIntelligence/coaching/coachingService.ts` | L6 prompt |
| `src/services/essayIntelligence/analysis/scoutPass.ts` | L2.5 prompt |
| All mutator files in `src/services/essayIntelligence/profileManager/mutators/` | May store confidence values |

## Design Principles

- **Remove, don't deprecate**: Delete the fields and fix the type errors. Don't leave `confidence?: number` as optional — that's technical debt.
- **Evidence replaces confidence**: Instead of `{observation: "...", confidence: 0.85}`, just `{observation: "...", evidence: "specific quoted text"}`. The evidence IS the confidence.
- **Categorical only where genuinely useful**: Only add categorical alternatives if downstream code actually makes different decisions based on the category. Don't replace one form of complexity with another.
- **Don't break the pipeline**: Run `npx tsc --noEmit` after every batch of changes. Fix all type errors before proceeding.

## Quality Gate

1. Complete audit documented in `tests/output/confidence-audit.md`
2. All continuous 0-1 confidence fields either removed or replaced with categorical
3. All prompts updated with quality bar instruction
4. Readiness calculations updated
5. Zero type errors: `npx tsc --noEmit`
6. No downstream logic broken (trace every consumer before removing)
