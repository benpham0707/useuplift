# Master Implementation Prompt: A+ System Intelligence + Writing Craft

> Run this as sequential agent swarms. Each phase builds on the previous.
> Every change must be verified with `npx tsc --noEmit` before moving to the next.
> Focus on IMPLEMENTATION QUALITY — prompts, data depth, logic precision.

---

## WHAT'S ALREADY DONE (prompt calibration — do NOT redo)

These prompt changes were already implemented in `coachingService.ts`:
- A+ demonstration example with actual rewritten sentences (P1) ✓
- 3 dialogue-format demonstration exemplars (P3) ✓
- Voice calibration for demonstrations (P4) ✓
- Early session arc: "demonstrate as you collect" (P5) ✓
- AO psychology injection from profile into coaching context (P7) ✓
- Gatekeeper rewrite: "one detail is enough to demonstrate" (P9) ✓

---

## PHASE 1: SYSTEM INTELLIGENCE CORE (3 swarm agents, parallel)

### Agent 1A: StudentTheory — Periodic Synthesis

**Goal**: After every 5 coaching turns, synthesize everything the system knows about the student into a structured theory. This replaces the append-only blob of `studentDeclaredContext` with an intelligent, evolving understanding.

**Files to read FIRST**:
- `/Users/tuepham/uplift-final-final-18698-62030/FORGE_PLAN_SYSTEM_INTELLIGENCE.md` — Read the StudentTheory section completely
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/profileTypes.ts` — Read CoachingSessionMemory, CharacterRevelation, EssayProfile root type
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/coachingService.ts` — Read `processCoachingTurn()` flow, `buildDynamicProfileContext()`, sidecar handling, `initializeSessionMemory()`

**What to implement**:

1. **New type `StudentTheory`** on `profileTypes.ts`:
```typescript
export interface StudentTheory {
  personhood: string; // Who is this person — evolves every synthesis
  protectedValues: Array<{
    value: string;
    evidence: string;
    implication: string;
  }>;
  blindSpotHypotheses: Array<{
    hypothesis: string;
    analysisEvidence: string;
    coachingEvidence: string;
    readyToSurface: boolean;
  }>;
  tensions: Array<{
    studentSays: string;
    essayShows: string;
    coachingOpportunity: string;
  }>;
  essayRelationship: string;
  crossLayerPatterns: Array<{
    analysisObservation: string;
    conversationEvidence: string;
    coachingImplication: string;
  }>;
  synthesizedAtTurn: number;
}
```

2. **Add `studentTheory?: StudentTheory` to `EssayProfile`** (alongside `studentDeclaredContext`)

3. **New method `synthesizeStudentTheory()`** in `coachingService.ts`:
   - Model: **SONNET** (not Haiku — synthesis requires interpretive depth)
   - Cost: ~$0.015 per synthesis (every 5 turns = ~$0.06 per 20-turn session)
   - Caching: `cacheSystemPrompt: true`
   - Receives: current studentDeclaredContext, session journal events, admissionsPositioning.redFlags, characterRevelation.blindSpots, characterRevelation.writerPortrait, active findings
   - Must accomplish: Connect patterns across conversation reveals, analysis red flags, and behavioral observations. Produce a THEORY, not a list.
   - Key constraints: Every claim needs evidence. Tensions must cite both sides. ProtectedValues must explain the IMPLICATION for coaching.
   - Output: JSON matching StudentTheory schema

4. **Wire into `processCoachingTurn()`**: After session memory update, every 5th turn, call `synthesizeStudentTheory()` and store result on profile.

5. **Update `buildDynamicProfileContext()`**: When `studentTheory` exists, inject it as structured context INSTEAD of the flat `studentDeclaredContext` blob. Format:
```
STUDENT THEORY (synthesized understanding):
WHO THEY ARE: ${personhood}
WHAT THEY PROTECT: ${protectedValues map}
TENSIONS: ${tensions map}
CROSS-LAYER PATTERNS: ${crossLayerPatterns map}
```

**Verify**: Run `npx tsc --noEmit`. Then manually check that the synthesis prompt spec is complete (inputs, goals, constraints, output format).

---

### Agent 1B: Resistance Tracking Infrastructure

**Goal**: Mirror the existing confusion tracking (which has a 4-level escalation ladder) for resistance. When a student deflects from a topic 2+ times, inject escalation instructions that change the coach's behavior.

**Files to read FIRST**:
- `/Users/tuepham/uplift-final-final-18698-62030/FORGE_PLAN_SYSTEM_INTELLIGENCE.md` — Read the Resistance Tracking section
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/coachingService.ts` — Read `updateConfusionTracking()` (~line 3040-3084), `buildEscalationContext()` (~line 3100-3153), `confusionTrackers` map. These are the patterns to mirror.

**What to implement**:

1. **New type `TopicResistanceTracker`** on `profileTypes.ts`:
```typescript
export interface TopicResistanceTracker {
  topic: string;
  deflectionCount: number;
  escalationLevel: 0 | 1 | 2 | 3 | 4;
  deflectionTurns: number[];
  approachesTried: string[];
  deflectsToward?: string;
}
```

2. **New `resistanceTrackers: Map<string, TopicResistanceTracker>`** on CoachingService (mirrors `confusionTrackers`)

3. **New method `updateResistanceTracking(stage1, sidecar, turnNumber)`** — fires when `cognitiveState === 'resistant_to_specific' || 'resistant_to_general'`. Increments counter, updates escalation level. De-escalates (reduces level by 1, not delete) when student engages.

4. **New method `buildResistanceEscalationContext(stage1)`** — mirrors `buildEscalationContext()`. The escalation levels are DIFFERENT from confusion (these are from the forge plan):
   - Level 1: Note the resistance, hold the line
   - Level 2: "I notice you steer away from [topic]. What would you lose if you went there?"
   - Level 3: "Let me make it concrete — here's what [topic] could sound like in your essay: [DEMONSTRATE using declared details]"
   - Level 4: "You clearly have reasons for not going there, and I respect that. When you want to explore it, I'm here."

5. **Wire into `processCoachingTurn()`**: Call `updateResistanceTracking()` right after `updateConfusionTracking()`. Inject `buildResistanceEscalationContext()` alongside the confusion escalation in the Stage 3 user prompt.

**CRITICAL**: Level 3 of resistance escalation says "DEMONSTRATE." This connects Stream A (intelligence) to Stream B (craft). The resistance escalation trigger should work WITH the demonstration trigger from Phase 2.

**Verify**: `npx tsc --noEmit`. Check that the escalation injection goes into the user prompt at the right location (near the existing escalation section).

---

### Agent 1C: InnerVoice Sidecar + Portrait Evolution

**Goal**: Replace the hollow CognitiveAssessment ("Student is resistant_to_specific") with rich prose from the sidecar. Also allow the person portrait to evolve from coaching revelations.

**Files to read FIRST**:
- `/Users/tuepham/uplift-final-final-18698-62030/FORGE_PLAN_SYSTEM_INTELLIGENCE.md` — Read the InnerVoice and Portrait Evolution sections
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/coachingService.ts` — Read `SIDECAR_INSTRUCTIONS` (~line 162), `CoachingSidecar` interface (~line 305), sidecar parsing, CognitiveAssessment construction (~line 764-776), `updateSessionMemory()`

**What to implement**:

1. **Add `innerVoice` to sidecar schema** (in `SIDECAR_INSTRUCTIONS`):
```
"innerVoice":"<Your honest inner read of this student RIGHT NOW. Not the enum — the specific, contextual assessment. What are they actually doing? What are they protecting? What do they need that they're not asking for? 2-3 sentences of genuine counselor intuition.>"
```

2. **Add `innerVoice: string | null` to `CoachingSidecar` interface** and default/validation.

3. **Replace hollow CognitiveAssessment construction** (~line 764-776): Use `sidecar.innerVoice` for the `assessment` field when available. Keep enum fallback for backward compat.

4. **Add `portraitEvolution` to sidecar schema**:
```
"portraitEvolution":"<If this turn revealed something that changes WHO the student is (not just what they said), write a 2-3 sentence evolved portrait integrating essay-based + conversation-based understanding. null if no portrait-level insight this turn.>"
```

5. **Add `portraitEvolution: string | null` to `CoachingSidecar`** and default/validation.

6. **Apply portrait evolution after sidecar parsing**: When `sidecar.portraitEvolution` is non-null, update `profile.characterRevelation.writerPortrait`. Preserve the original as `essayOnlyPortrait` (add this optional field to `CharacterRevelation` in profileTypes.ts).

**Verify**: `npx tsc --noEmit`. Check that the sidecar JSON schema in `SIDECAR_INSTRUCTIONS` is valid (no unescaped quotes, proper field structure).

---

## PHASE 2: WRITING CRAFT ENGINE (2 swarm agents, parallel)

### Agent 2A: Demonstration Trigger + Technique Router

**Goal**: Ensure the coach actually PRODUCES demonstrations when appropriate, and connects diagnosed issues to specific craft techniques.

**Files to read FIRST**:
- `/Users/tuepham/uplift-final-final-18698-62030/FORGE_PLAN_WRITING_CRAFT.md` — Read the Demonstration Trigger and Technique Router sections completely
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/coachingService.ts` — Read `estimateResponseIntensity()`, `buildFindingCoachingContext()`, the Stage 3 user prompt construction
- `/Users/tuepham/uplift-final-final-18698-62030/tests/output/conversator-v2-e2e-audit.txt` — Read turns 1-5 to understand when demonstrations SHOULD have fired

**What to implement**:

1. **New method `shouldTriggerDemonstration(memory, profile, quickFocus)`**:
   Returns `{ trigger: boolean; reason: string }` based on:
   - Has the student shared scene-worthy details? (contextAccumulation exists AND contains proper noun OR temporal marker OR physical detail — not just char count)
   - Has the same topic been discussed 2+ turns without new prose from the student?
   - Has the student been resistant for 2+ consecutive turns?
   - Is this Turn 5+ and no demonstration has been given yet? (staleness guard)
   - Did the student explicitly ask "what would it look like?" or "can you show me?"

   **IMPORTANT**: The trigger should fire EARLIER than the original blueprint proposed. At Turn 3 when the student shares "hackathon, team, second place" — that's scene-worthy. The trigger should detect this via proper noun / specificity signals in the latest sidecar.contextAccumulation, NOT just a char count threshold.

2. **When trigger fires, inject into the Stage 3 user prompt**:
```
DEMONSTRATION DIRECTIVE (ACTIVE):
${reason}
You have enough material to demonstrate. Write 2-4 sentences of sample prose
using the student's own details to show what the current issue LOOKS LIKE
when fixed. Name the craft move. Explain what the change does for the reader.
DO NOT defer. DO NOT ask for more details. WRITE THE SAMPLE NOW.

STUDENT'S AVAILABLE DETAILS: ${profile.studentDeclaredContext}
```

3. **New constant `TECHNIQUE_ROUTES`** — a compact array of 15 entries mapping finding issue types to craft techniques:
```typescript
const TECHNIQUE_ROUTES: Array<{
  issueKeywords: string[];  // Keywords to match in finding claims
  technique: string;        // Named craft move
  directive: string;        // 1-2 sentence coaching instruction
}> = [
  {
    issueKeywords: ['summary', 'telling', 'distance', '30,000 feet', 'narrates from'],
    technique: 'SUMMARY-TO-SCENE',
    directive: 'Identify the MOMENT buried in the summary. Write a 2-sentence scene version using student details. Ask: "What were your hands doing?"',
  },
  {
    issueKeywords: ['generic opening', 'template', 'stock phrasing', 'could be anyone'],
    technique: 'COLD OPEN / SENSORY TIMESTAMP',
    directive: 'The opening needs a physical anchor before any philosophy. Write 2 sentences that put the reader in the room where this essay\'s topic first mattered.',
  },
  {
    issueKeywords: ['emotion', 'label', 'naming', 'captivated', 'fascinated', 'I felt'],
    technique: 'SOMATIC VULNERABILITY',
    directive: 'Replace the named emotion with what the BODY did. "I was nervous" → what did their hands do, their stomach, their voice?',
  },
  {
    issueKeywords: ['no named', 'people absence', 'unnamed', 'no teacher', 'no mentor'],
    technique: 'NAMED CHARACTER',
    directive: 'A person needs to be ON THE PAGE. Ask for the name + one physical detail. Write a 1-sentence introduction that makes the reader see them.',
  },
  {
    issueKeywords: ['scope inflation', 'grandiose', 'meaningful difference', 'change the world'],
    technique: 'EVIDENCE ANCHORING',
    directive: 'The claim exceeds the evidence. Identify the SPECIFIC, SMALL thing the student actually did. That specific thing is more powerful than the grand claim.',
  },
  {
    issueKeywords: ['solo credit', 'I developed', 'collaborative', 'team'],
    technique: 'COLLABORATIVE SPECIFICITY',
    directive: 'Show the student how including collaborators STRENGTHENS, not weakens, the essay. "We built" with a specific role is more credible than "I developed" without one.',
  },
  {
    issueKeywords: ['generic ending', 'timeless', 'journey', 'look forward to'],
    technique: 'RITUAL DETAIL / BOOKEND INVERSION',
    directive: 'Replace aspirational closing with a specific image or habit that PROVES the transformation. Return to the opening scene with one thing changed.',
  },
  {
    issueKeywords: ['voice', 'register', 'performed', 'essay-speak', 'thesis language'],
    technique: 'PROXIMITY-TO-WORK VOICE',
    directive: 'Show the difference between "writing about" and "writing from inside." Compare their best-voiced sentence to their most performed sentence.',
  },
  {
    issueKeywords: ['decorative', 'atmosphere', 'doesn\'t serve', 'filler'],
    technique: 'FUNCTIONAL DETAIL',
    directive: 'Every detail must reveal character, carry theme, or advance narrative. If it\'s just scenery, cut it. Show what the detail DOES for the reader.',
  },
  {
    issueKeywords: ['transformation', 'too neat', 'manufactured', 'suddenly realized'],
    technique: 'ANTI-LESSON',
    directive: 'The takeaway is too clean. Real growth is messy. Help the student find the version that\'s honest rather than tidy.',
  },
  {
    issueKeywords: ['stakes', 'consequence', 'nothing at risk', 'no tension'],
    technique: 'STAKES ESTABLISHMENT',
    directive: 'What could the student LOSE? What was at risk? If nothing was at risk, the reader can\'t feel invested.',
  },
  {
    issueKeywords: ['arc', 'no progression', 'flat', 'list of events'],
    technique: 'NARRATIVE ARC',
    directive: 'The essay needs a before/after with a turning point. Help the student identify THE moment when something changed.',
  },
  {
    issueKeywords: ['pacing', 'rushed', 'compressed', 'too fast'],
    technique: 'SCENE EXPANSION',
    directive: 'The essay\'s most important moment gets the same word count as setup. The reader needs to LINGER at the pivot point.',
  },
  {
    issueKeywords: ['transition', 'abrupt', 'disconnected', 'jump'],
    technique: 'BRIDGE SENTENCE',
    directive: 'Write a 1-sentence bridge between the two paragraphs using a detail that lives in BOTH worlds.',
  },
  {
    issueKeywords: ['mentor', 'teacher', 'relationship', 'influence'],
    technique: 'COUNTERINTUITIVE MENTOR',
    directive: 'What did the mentor say that sounded WRONG? Quote the exact words. The reader needs the surprise before the wisdom.',
  },
];
```

4. **New method `routeFindingToTechnique(finding)`** — matches finding claims against TECHNIQUE_ROUTES keywords, returns the matching directive (or null).

5. **Enhance `buildFindingCoachingContext()`** — after serializing each finding, call `routeFindingToTechnique()` and append the matched directive:
```
[F1] [emerging/high] P1 [voice, narrative]
  Opening operates in summary mode — thesis language rather than scene
  → TECHNIQUE: SUMMARY-TO-SCENE — Identify the MOMENT buried in the summary. Write a 2-sentence scene version.
```

**Verify**: `npx tsc --noEmit`. Read back the technique routes — are the keywords comprehensive enough to match real L3.5 findings? Check against the actual findings from the E2E test output.

---

### Agent 2B: Deflection Escalation + Integration

**Goal**: Formalize the deflection counter and wire Stream A (intelligence) into Stream B (craft) — so demonstrations reference the StudentTheory.

**Files to read FIRST**:
- `/Users/tuepham/uplift-final-final-18698-62030/FORGE_PLAN_WRITING_CRAFT.md` — Read the Deflection Escalation section
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/coachingService.ts` — Read the existing `estimateResponseIntensity()` (which already detects resistance patterns), the Stage 3 user prompt construction

**What to implement**:

1. **Deflection counter** — add to CoachingService class:
```typescript
private deflectionCounter: number = 0;
```

2. **In post-sidecar processing**, after resistance tracking (from Agent 1B):
```typescript
if (sidecar.cognitiveState === 'resistant_to_specific' ||
    sidecar.cognitiveState === 'resistant_to_general') {
  this.deflectionCounter++;
} else if (sidecar.cognitiveState === 'engaged' ||
           sidecar.cognitiveState === 'curious_deeper') {
  this.deflectionCounter = 0; // Reset on genuine engagement
}
```

3. **When `deflectionCounter >= 3`**, inject into the Stage 3 user prompt:
```
DEFLECTION ESCALATION (student has deflected ${deflectionCounter} consecutive turns):
STOP repeating previous demands. The student is stuck, not stubborn.
DEMONSTRATE the options to break the logjam. Write 2-3 sentences for EACH
architectural option using their declared details. Ask: "Which of these
sounds more like the essay you want to write?"

${profile.studentTheory ? `STUDENT THEORY CONTEXT: ${profile.studentTheory.personhood}
THEY MAY BE PROTECTING: ${profile.studentTheory.protectedValues.map(v => v.value).join(', ')}
HONOR what they're protecting while showing them what's possible.` : ''}
```

4. **Integration between streams**: When the demonstration trigger fires AND the StudentTheory exists, append theory context to the demonstration directive:
```typescript
// In the demonstration injection (from Agent 2A):
const theoryContext = profile.studentTheory
  ? `\nSTUDENT THEORY: ${profile.studentTheory.personhood}\nTENSIONS: ${profile.studentTheory.tensions.map(t => `${t.studentSays} vs ${t.essayShows}`).join('; ')}\nYour demonstration should illuminate a tension, not just fix a craft issue.`
  : '';
```

**Verify**: `npx tsc --noEmit`. Check that the deflection counter resets properly (on engagement, not on every non-resistance turn — clarification turns shouldn't reset it).

---

## PHASE 3: DEEP DATA + QUALITY PASS (1 swarm agent, sequential)

### Agent 3: Craft Knowledge Enrichment + Prompt Quality Polish

**Goal**: Enrich the technique router with real essay examples, ensure all prompt additions work together without conflicts, and do a final quality pass on the coaching philosophy for coherence.

**Files to read**:
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/essayIntelligence/coaching/coachingService.ts` — Read the ENTIRE coaching philosophy after all Phase 1+2 changes
- `/Users/tuepham/uplift-final-final-18698-62030/tests/fixtures/wqe-reference-essays.ts` — Read the EXCELLENT and STRONG NARRATIVE essays
- `/Users/tuepham/uplift-final-final-18698-62030/tests/fixtures/authentic-examples.ts` — Read Jimmy's Hot Dogs and Santur essays
- `/Users/tuepham/uplift-final-final-18698-62030/src/services/portfolioStrategy/services/activityWorkshop/expertCounselorKnowledgeBase.ts` — Read the AO psychology section (committee pitch, oof factor)

**What to do**:

1. **Review technique router entries for specificity**: Each of the 15 `TECHNIQUE_ROUTES` entries has a `directive` field. Read each one and ask: "If Sonnet received ONLY this directive, would it produce an A+ coaching response?" If not, improve the directive. Use specific language from the reference essays as calibration — e.g., the `SUMMARY-TO-SCENE` directive should reference the health clinic essay's "Most Wednesdays smelled like bleach and citrus" as the target quality level for scene-based writing.

2. **Check for prompt coherence**: After all Phase 1+2 changes, the coaching prompt has:
   - Static philosophy (~2500 tokens)
   - A+ demo examples + voice calibration + craft moves (~600 tokens new)
   - Phase-gated coaching directives (~200 tokens)
   - Pedagogical calibration rules (~350 tokens)
   - Sidecar instructions (~350 tokens, now with innerVoice + portraitEvolution + learningStyleUpdate + strategicQuestionUpdate)

   **Check**: Are there contradictory instructions? Does "demonstrate as you collect" conflict with anything else? Does the resistance escalation from Agent 1B conflict with the deflection escalation from Agent 2B? If so, reconcile.

3. **Enrich the AO psychology injection**: The current injection (from P7) puts `aoFirstRead.gutReaction` and archetype warning in the stable context. Check: is this enough? Should the `expertCounselorKnowledgeBase`'s Committee Pitch Test or Oof Factor be referenced? If adding, keep it COMPACT — 2-3 sentences max, injected conditionally (only when the coaching is about structure or admissions positioning).

4. **Token budget audit**: After all changes, estimate the total prompt size for a typical Turn 5 coaching call. The ceiling is ~12,000 input tokens total. If the additions push past this, identify what to compress.

5. **Final coherence read**: Read the entire coaching philosophy from top to bottom as if you were Sonnet encountering it for the first time. Note any place where you'd be confused about priority, where instructions conflict, or where the example quality doesn't match the instruction quality.

6. **Run `npx tsc --noEmit`** to verify everything compiles.

---

## PHASE 4: E2E TEST UPDATE + VERIFICATION

### Agent 4: Update E2E Test for New Features

**Goal**: Update the E2E test to capture all new features so the next run validates everything.

**Files to modify**:
- `/Users/tuepham/uplift-final-final-18698-62030/tests/test-conversator-v2-e2e.ts`

**What to add**:

1. **StudentTheory capture**: After each turn, if `profile.studentTheory` exists, output it.
2. **Resistance tracking**: Output the resistance escalation level if active.
3. **Demonstration detection**: Check if the coach response contains actual rewritten sentences (look for quoted text that's NOT from the essay — new prose the coach wrote).
4. **InnerVoice capture**: Output `sidecar.innerVoice` per turn.
5. **Portrait evolution**: Track if `writerPortrait` changes across turns.

**New verification checks (add to the existing 20)**:
```
// 21. StudentTheory produced by Turn 5
// 22. Resistance escalation active during deflection turns
// 23. Coach DEMONSTRATES (writes actual prose) at least twice in 10 turns
// 24. InnerVoice is contextual prose (not just "Student is ${enum}")
// 25. Portrait evolves at least once from coaching revelations
// 26. Technique router directive appears alongside at least one finding
// 27. AO psychology referenced in at least one coaching response
```

---

## EXECUTION ORDER

```
PHASE 1 (parallel — 3 agents):
  Agent 1A: StudentTheory + synthesis     ← profileTypes.ts + coachingService.ts (synthesis method + wire)
  Agent 1B: Resistance tracking           ← profileTypes.ts + coachingService.ts (tracker + escalation)
  Agent 1C: InnerVoice + portrait evolve  ← coachingService.ts (sidecar + cognitive assessment)

  ⚠️ All three modify coachingService.ts but DIFFERENT sections:
  1A: processCoachingTurn (synthesis call) + buildDynamicProfileContext (injection)
  1B: processCoachingTurn (tracking) + user prompt (escalation injection)
  1C: SIDECAR_INSTRUCTIONS + CoachingSidecar interface + sidecar parsing + CognitiveAssessment construction

  They CAN run in parallel if each agent is careful about which lines they modify.
  If worried about merge conflicts, run 1C first (sidecar changes), then 1A+1B in parallel.

PHASE 2 (parallel — 2 agents, AFTER Phase 1):
  Agent 2A: Demonstration trigger + technique router
  Agent 2B: Deflection escalation + stream integration

  Both modify coachingService.ts but different sections:
  2A: New methods + buildFindingCoachingContext + user prompt (demo directive)
  2B: Post-sidecar processing + user prompt (deflection escalation)

PHASE 3 (sequential — 1 agent, AFTER Phase 2):
  Agent 3: Quality pass + enrichment + coherence check

PHASE 4 (sequential — 1 agent, AFTER Phase 3):
  Agent 4: E2E test update
```

---

## VERIFICATION CRITERIA (before running E2E)

After all phases complete, verify:

### Compilation
- [ ] `npx tsc --noEmit` passes with zero errors

### System Intelligence
- [ ] `StudentTheory` type exists on `EssayProfile`
- [ ] `synthesizeStudentTheory()` method exists and uses SONNET model
- [ ] `resistanceTrackers` map exists parallel to `confusionTrackers`
- [ ] `buildResistanceEscalationContext()` produces output for resistant states
- [ ] `innerVoice` field exists on `CoachingSidecar`
- [ ] CognitiveAssessment uses `sidecar.innerVoice` when available
- [ ] `portraitEvolution` field exists on `CoachingSidecar`
- [ ] Portrait updates from coaching revelations

### Writing Craft
- [ ] `shouldTriggerDemonstration()` method exists with scene-worthy detail detection
- [ ] `TECHNIQUE_ROUTES` constant has 15 entries with keywords + directives
- [ ] `routeFindingToTechnique()` matches findings to techniques
- [ ] Finding context includes technique directives alongside finding text
- [ ] `deflectionCounter` tracks consecutive resistance turns
- [ ] Deflection escalation injects demonstration directive at count >= 3
- [ ] StudentTheory context is wired into demonstration directives

### Prompt Quality
- [ ] No contradictory instructions in the coaching philosophy
- [ ] Token budget for typical Turn 5 is under 12,000 input tokens
- [ ] All sidecar fields have defaults and validation

### E2E Test
- [ ] Test captures StudentTheory per turn
- [ ] Test captures resistance escalation level
- [ ] Test detects whether coach wrote actual demonstration prose
- [ ] 27 total verification checks (existing 20 + 7 new)

---

## THE A+ STANDARD

After implementation, the system should produce coaching that:

1. **DEMONSTRATES** — writes actual rewritten sentences using student's details, not just describes what they should do
2. **UNDERSTANDS** — connects patterns across analysis and conversation into a theory of who the student IS and what they're protecting
3. **ADAPTS** — changes tactics when the student is stuck (emotional probe → demonstrate → tactical retreat), doesn't repeat demands
4. **GROUNDS** — references AO psychology and competitive positioning when relevant
5. **TEACHES** — names specific craft moves, matches them to diagnosed issues, shows before/after in the student's own material
6. **RESPECTS** — honors what the student is protecting while showing them what's possible
7. **PRODUCES RESULTS** — after 10 turns, the student has written at least one new paragraph and understands how to write the rest
