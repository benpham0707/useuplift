# Coaching Effectiveness — Revised Plan (Based on Real E2E Output)

> **Previous assessment was based on simulated output. This revision is based on
> ACTUAL E2E test results.** The system scores higher than initially estimated
> (~7.8/10 vs ~5-6/10) but still below the 9.0 A+ target.

---

## WHAT THE ACTUAL OUTPUT SHOWS

### Strengths Confirmed (7.5-9/10 — preserve these)
- **Opening hook**: Committee one-liner in first sentence, quotes essay text (9/10)
- **Insight depth**: Multi-layer diagnosis with specific word/sentence counts (8-9/10)
- **Demonstration quality**: C major→minor demo is genuinely good writing (9/10)
- **Student agency**: Correctly refuses to coach phantom work, insists on seeing prose (9/10)
- **Honest assessment**: "You're telling me ABOUT the connection instead of letting me experience it" (9/10)
- **Conversational memory**: Tracks deflection pattern across 4 turns, references hackathon/Mrs. Chen consistently (9/10)
- **Writing prompts**: "Write me the first three sentences. Show me your hands on the keys. Go." — scaffolded and specific (8/10)
- **Deflection handling**: Correctly names the pattern, doesn't cave, maintains direction (8/10)
- **Anti-repetition**: 0% phrase overlap between turns 2 and 8 (perfect)
- **Breakthrough handling**: Turn 10 at 486 chars, names insight, gives prompt (9/10)

### Real Gaps (5-7/10 — these need fixing)

| Gap | Score | Evidence from E2E Output |
|-----|-------|------------------------|
| **Technique naming** | 5/10 | Coach never says "SUMMARY-TO-SCENE" or any craft move name in 10 turns, despite 20 technique routes existing |
| **Word economy** | 6/10 | Never mentions "650 words," never identifies what to cut when suggesting additions |
| **Structural diagnosis** | 7/10 | No structural roles (L4 failed), coach improvises but can't reference architectural data |
| **Identity connection** | 7/10 | StudentTheory parse failed all 3 times — "Theory synthesis incomplete" — no identity grounding |
| **Revision readiness** | 7/10 | Direction is clear ("write P1 first") but no structured revision checklist |

### Infrastructure Failures (not coaching quality issues)
| Issue | Impact | Fix |
|-------|--------|-----|
| **L4 timeout** | 6 analysis checks failed, no North Star/structural roles/findings/phase | Increase timeout or optimize L4 prompt |
| **StudentTheory JSON parse failed** | No identity grounding for 10 turns | jsonrepair fix already implemented, needs testing |

---

## REVISED PRIORITY ORDER

Based on ACTUAL output, the priority shifts dramatically. Session flow redesign
and writing scaffolding — which seemed most urgent from the simulation — are
already working reasonably well in practice. The real blockers are:

### TIER 1: Infrastructure Fixes (Unblock 8 checks, highest ROI)

#### 1A. Fix L4 Timeout
**Impact**: Unblocks 6 analysis checks (North Star, structural roles, findings, phase)
**Root cause**: L4 crystallization call exceeds 120s timeout
**Options**:
- Increase timeout to 180s (simplest)
- Split L4 into 2 smaller calls (North Star + score matrix separately)
- Optimize L4 prompt to reduce output tokens (currently requests ~5000 tokens)
**Estimated effort**: 30 minutes
**Files**: `analysisOrchestrator.ts` (timeout config), `crystallizer.ts` (prompt optimization)

#### 1B. Verify StudentTheory Parse Fix
**Impact**: Unblocks identity grounding for coaching
**Already done**: Added jsonrepair fallback + bumped maxTokens from 1000→1500
**Needs**: Re-run E2E test to verify the fix works
**Estimated effort**: 0 (already implemented, needs testing)

### TIER 2: Prompt Fixes (Low effort, direct quality improvement)

#### 2A. Enforce Technique Naming
**Impact**: 5/10 → 8/10 on technique naming dimension
**Problem**: The coaching philosophy says "name the specific craft move" but the LLM
doesn't do it. The technique routes inject directives alongside findings, but the
coach ignores them in the response.
**Root cause**: Two possibilities:
1. Findings are 0 (because L4 failed, which broke L3.5) — so no technique routes fire
2. Even with findings, the directive is in the system prompt but the LLM doesn't
   prioritize it in the response
**Fix**:
- First: Fix L4 → fixes findings → technique routes will fire
- Second: Add explicit instruction in `responseStructureBlock`: "When your context
  includes a TECHNIQUE directive (→ TECHNIQUE: ...), you MUST name that technique
  by name in your response. Use ALL-CAPS: 'That's SUMMARY-TO-SCENE' or 'This is
  a SENSORY TIMESTAMP move.'"
**Files**: `promptBlocks.ts` (responseStructureBlock)
**Estimated effort**: 15 minutes

#### 2B. Enforce Word Economy
**Impact**: 6/10 → 8/10 on word economy dimension
**Problem**: The prompt says "NEVER suggest adding content without naming the cut"
but the coach doesn't do it. Turn 1 suggests "one specific scene from musical
practice and one from building the AI DJ" without identifying what to cut.
**Root cause**: The word economy instruction is in `coachingPrioritiesBlock` but
may be too far from the response structure instructions to be effective.
**Fix**: Add word economy to the DEVELOPMENT PATH step of `responseStructureBlock`:
"3. THE DEVELOPMENT PATH — ALWAYS include a WORD ECONOMY line: 'This needs ~80 words.
Cut P6 entirely (52 words of redundant summary) to make room.' The student must know
what leaves when something new arrives."
Also: The live word count injection in `buildStableProfileContext` now shows
"WORD COUNT: 348/650" — this gives the coach real data. But the coach needs to
be told to REFERENCE it: "You know the essay is 348/650 words. Reference this
number when suggesting additions or cuts."
**Files**: `promptBlocks.ts` (responseStructureBlock), `coachingService.ts` (stable context)
**Estimated effort**: 15 minutes

#### 2C. Add Technique Transferability Language
**Impact**: Supports technique naming with explanation of WHY the technique matters
**Problem**: Even when techniques are named, the coach doesn't explain the
TRANSFERABLE PRINCIPLE — what makes this technique useful beyond this essay.
**Fix**: Already implemented in `craftReferenceBlock` ("TRANSFERABILITY: When you
name a technique, explain its PRINCIPLE"). Needs verification with real output.
**Estimated effort**: 0 (already implemented)

### TIER 3: Session Tracking Improvements (Medium effort, meaningful quality lift)

#### 3A. Revision Checklist on Session Memory
**Impact**: 7/10 → 9/10 on revision readiness
**Problem**: The coach gives clear direction ("write P1 first") but there's no
VISIBLE running checklist. The student can't see: what's done, what's next, how
many items remain.
**What to build**:
```typescript
interface RevisionTask {
  paragraph: number;
  task: string;         // "Rewrite as scene using hackathon"
  technique: string;    // "SUMMARY-TO-SCENE"
  status: 'pending' | 'in_progress' | 'done';
  priority: number;
}
// Add to CoachingSessionMemory:
revisionChecklist?: RevisionTask[];
```
**Behavior**:
- After turn 1 diagnosis, populate checklist from top findings
- Inject checklist status into the session arc section
- When student submits prose that addresses a task, mark it done
- Late session: output remaining checklist as "your revision plan"
**Files**: `profileTypes.ts`, `coachingService.ts` (session memory + arc injection)
**Estimated effort**: 2-3 hours

#### 3B. In-Session Draft Detection
**Impact**: Enables sentence-by-sentence coaching of student prose
**Problem**: When the student sends prose (not a question), the system treats it
as a regular message. It should detect draft prose and switch to revision coaching
mode.
**What exists**: The `coachingMode` detection in `reanalysisOrchestrator.ts` already
detects revision mode for ESSAY EDITS (via processEdit). But it doesn't detect
IN-SESSION prose in chat messages.
**What to build**:
- Detect draft prose in student message (2+ sentences, no question marks, essay-like)
- When detected, switch coaching mode to a lightweight "in_session_draft" mode
- Coach sentence-by-sentence: "S1 does X. S2 does Y. S3 needs to do Z instead."
**Files**: `reanalysisOrchestrator.ts` (mode detection), `promptBlocks.ts` (new mode)
**Estimated effort**: 3-4 hours

### TIER 4: Deeper Integration (Higher effort, long-term quality)

#### 4A. Structured Student Context
**Impact**: Enables auto-filled writing prompts
**Problem**: `studentDeclaredContext` is a flat string blob. Scaffolded writing
prompts need structured data: "Use [Mrs. Chen] in [the practice room] at [the
moment when X happened]."
**What to build**: Replace blob with structured context:
```typescript
interface StructuredStudentContext {
  names: string[];           // ['Mrs. Chen', 'hackathon team']
  places: string[];          // ['practice room', 'hackathon venue']
  moments: string[];         // ['algorithm scored Nocturne as 0.2']
  details: string[];         // ['second place', 'team project', 'Chopin Nocturnes']
  emotionalMoments: string[]; // ['first time hearing Mrs. Chen play']
}
```
**How**: The sidecar's `contextAccumulation` already captures concrete details.
Parse it into structured fields using a lightweight extraction (regex or Haiku).
**Files**: `profileTypes.ts`, `coachingService.ts` (context accumulation)
**Estimated effort**: 3-4 hours

#### 4B. Coaching-Driven Profile Updates
**Impact**: When coaching discovers "the essay is about Mrs. Chen, not innovation,"
the profile's North Star should update immediately — not wait for full reanalysis.
**What exists**: `coordinator.applyConversationInsight()` handles conversation
insights but not architectural reinterpretations.
**What to build**: A `coordinator.applyCoachingReinterpretation()` method that
updates North Star through-line and structural roles based on coaching discoveries.
**Files**: `essayProfileManager.ts`, `coachingService.ts`
**Estimated effort**: 4-6 hours

#### 4C. Progress Metrics
**Impact**: Track whether coaching is actually working across the session
**What to track**:
- Findings addressed through coaching (finding status → "addressed")
- Student prose quality trend (if they write during session)
- Estimated committee one-liner improvement
**Files**: `coachingService.ts`, `profileTypes.ts`
**Estimated effort**: 3-4 hours

---

## WHAT WAS WRONG IN THE PREVIOUS PLAN

| Previous Claim | Reality | Correction |
|---------------|---------|------------|
| "Writing scaffolding is 5/10" | Actually 8/10 — coach gives specific, scaffolded prompts ("three sentences, hands on keys, go") | The simulated student never cooperated, making it LOOK like scaffolding was missing |
| "5 turns of diagnosis before any writing" | Turn 2 already gives a scaffolded writing prompt with "Go." | The test student deflects, not the system |
| "Session flow needs redesign" | The flow works — diagnosis (T1-2), writing prompt (T2+), coaching student work (T6+), consolidation (T10) | The test scenario is adversarial (4 turns of deflection) |
| "The system is a DIAGNOSTIC engine" | The system diagnoses AND scaffolds AND demonstrates AND pushes for writing | The balance is actually reasonable for a first-encounter session |
| "Too much diagnosis, not enough doing" | The coach asks for writing at T2, T6, T7, T8, T9, T10 — SIX times | The student never writes, which is the test's design, not the system's failure |

---

## ESTIMATED IMPACT ON SCORES

| Dimension | Current | After Tier 1 | After Tier 2 | After Tier 3 |
|-----------|---------|-------------|-------------|-------------|
| Technique naming | 5 | 7 (findings exist) | 8-9 (enforcement) | 9 |
| Word economy | 6 | 6 | 8 (enforcement) | 8-9 |
| Structural diagnosis | 7 | 9 (L4 works) | 9 | 9 |
| Identity connection | 7 | 8 (theory works) | 8 | 9 |
| Revision readiness | 7 | 7 | 7 | 9 (checklist) |
| **Average** | **7.8** | **8.3** | **8.7** | **9.0** |

---

## IMPLEMENTATION SEQUENCE

```
TIER 1 (infrastructure, ~1 hour):
  1A. Fix L4 timeout → unblocks findings, North Star, phase, structural roles
  1B. Verify StudentTheory parse fix → re-run E2E test

TIER 2 (prompt fixes, ~30 minutes):
  2A. Enforce technique naming in responseStructureBlock
  2B. Enforce word economy in development path step
  2C. Verify technique transferability (already implemented)

TIER 3 (session tracking, ~6-8 hours):
  3A. Revision checklist on session memory
  3B. In-session draft detection + sentence-level coaching mode

TIER 4 (deeper integration, ~14-18 hours):
  4A. Structured student context
  4B. Coaching-driven profile updates
  4C. Progress metrics
```

After Tiers 1+2: estimated score **8.7/10** (~$0.50 of prompt changes)
After Tier 3: estimated score **9.0/10** (~6-8 hours of implementation)
After Tier 4: estimated score **9.2+/10** (~14-18 hours of implementation)

---

## SUCCESS CRITERIA (revised)

The system achieves A+ when:
1. Every coaching response names a SPECIFIC craft technique when relevant
2. Every addition suggestion includes a SPECIFIC cut ("P6 can go — 52 words of redundant summary")
3. The student always knows EXACTLY what to write next (scaffolded prompt with constraints)
4. A live revision checklist shows progress across the session
5. When the student writes prose, the coach evaluates it sentence-by-sentence against the analysis
6. The committee one-liner CHANGES by end of session (the essay is measurably more competitive)
7. StudentTheory provides identity grounding from turn 3 onward
8. L4 reliably completes, providing North Star and structural roles for every session
