# FORGE PLAN: Writing Craft Engine

> Blueprint assembled from Agent A (Direct Path), Agent B (Rethink Path), and Reality Checker verification.
> Date: 2026-03-19
> Status: READY FOR IMPLEMENTATION

---

## Problem Statement

The Conversator V2 coaching engine (coachingService.ts) never demonstrates. Across 10 turns in the E2E audit, the coach diagnosed problems accurately, collected context skillfully, and eventually forced architectural decisions — but produced zero concrete writing samples, zero before/after demonstrations, and zero "here's what your material could look like" moments. The coaching was excellent at TELLING but never SHOWED.

Three root causes identified through codebase verification:

1. **The Prerequisite Catch-22**: The prompt says "ONLY use details the student has SHARED. If you don't have enough, ask first." This creates an infinite deferral loop: coach asks for details -> student gives some -> coach asks for more -> student gives more -> coach asks for even more. No threshold exists for "enough."

2. **Gatekeeper Mode**: When the student deflects from architectural decisions, the coach blocks ALL coaching (turns 6-9), refusing to demonstrate even when it has rich material (hackathon context, Mrs. Chen, Chopin-jazz fusion). The correct move is to DEMONSTRATE each architectural option so the student can feel the difference, not demand they decide abstractly.

3. **No Finding-to-Technique Routing**: Findings are injected as raw claims (`"The opening operates in summary mode..."`) with no coaching directive attached. The LLM must improvise what to DO with each finding every turn, and it defaults to diagnosis + questioning rather than demonstration.

---

## Architecture: Three Changes, Zero New Files

All changes modify `src/services/essayIntelligence/coaching/coachingService.ts`. No new files, no new LLM calls, no new dependencies.

### Change 1: Demonstration Trigger (code + prompt)

**What**: A `shouldTriggerDemonstration()` method that detects when the coach should stop asking and start showing. When triggered, injects a hard prompt directive that overrides the default "ask first" behavior.

**Where**: New private method on `CoachingService`, called in `runStage3CoachingResponse()` before prompt assembly.

**Trigger conditions** (any one fires):
- `contextAccumulation` in studentDeclaredContext exceeds 150 chars AND student has asked about the same paragraph/topic 2+ turns in a row
- Student classified as `resistant_to_specific` for 2+ consecutive turns (gatekeeper mode detected)
- Session is at turn 5+ and no demonstration has occurred yet (staleness guard)
- Student explicitly asks to "see" / "show me" / "what would it look like" (intent detection)

**Prompt injection when triggered** (~200 tokens, appended to user prompt):

```
DEMONSTRATION DIRECTIVE (ACTIVE):
You have enough student material to demonstrate. Do NOT ask for more details this turn.

WRITE A CONCRETE SAMPLE using the student's own words and details from the context above.
The sample must:
1. Be 2-4 sentences maximum (not a full paragraph rewrite)
2. Name the specific CRAFT MOVE being applied (e.g., "This is SUMMARY-TO-SCENE")
3. Use ONLY details the student has shared (marked in Student Declared Context)
4. Show what their material FEELS LIKE when the technique is applied
5. If an architectural decision is pending, write ONE sample per option (max 3)

After the sample, ask: "Does this feel closer to what you meant? What would you change?"

This is not a suggestion. Write the sample.
```

**Why this works**: The LLM already knows HOW to demonstrate (the existing CONCRETE DEMONSTRATION mode in the prompt is well-written). It just never decides to. This trigger makes the decision for it.

**Token cost**: +0 per turn (trigger is code-side). +200 tokens in user prompt only when triggered (~30% of turns based on audit patterns).

### Change 2: Finding-to-Technique Router (code)

**What**: A `routeFindingToTechnique()` method that maps each focus finding to a specific coaching directive. Only the MATCHED directive gets injected into the prompt — not a static registry.

**Where**: New private method on `CoachingService`, called inside `buildFindingCoachingContext()`. Appends a technique directive line after each serialized finding.

**Routing table** (~15 entries, stored as a const array in coachingService.ts):

```typescript
interface TechniqueRoute {
  /** Keywords to match against finding claim (all must be present) */
  claimKeywords: string[];
  /** Dimensions to match (any one) */
  dimensions?: string[];
  /** The coaching directive injected into the prompt */
  directive: string;
}

const TECHNIQUE_ROUTES: TechniqueRoute[] = [
  {
    claimKeywords: ['summary', 'scene'],
    directive: 'TECHNIQUE: summary-to-scene. Write a 2-sentence scene version using student details. Name the craft move.',
  },
  {
    claimKeywords: ['generic', 'opening'],
    dimensions: ['voice', 'craft'],
    directive: 'TECHNIQUE: inventory opening. Show what it looks like to START with the specific activity, not a description of it.',
  },
  {
    claimKeywords: ['vulnerability', 'retreat'],
    directive: 'TECHNIQUE: sustained vulnerability. Quote where they pulled back. Ask: what are you protecting by not staying in the hard moment?',
  },
  {
    claimKeywords: ['people', 'absence'],
    directive: 'TECHNIQUE: named-person injection. Ask for ONE specific person. Show what 2 sentences of their essay looks like with that person in it.',
  },
  {
    claimKeywords: ['scope', 'inflation'],
    directive: 'TECHNIQUE: evidence grounding. Quote the inflated claim. Ask: what is the actual scale? Then show the sentence with real scale.',
  },
  {
    claimKeywords: ['emotional', 'distance'],
    dimensions: ['emotion'],
    directive: 'TECHNIQUE: somatic vulnerability. Ask where they felt it in their body. Show what a body-grounded version of their sentence looks like.',
  },
  {
    claimKeywords: ['parallel', 'assert'],
    directive: 'TECHNIQUE: enacted parallel. Instead of explaining the connection, show the reader by writing the two activities in a way that reveals the structural echo.',
  },
  {
    claimKeywords: ['conclusion', 'generic'],
    directive: 'TECHNIQUE: bookend inversion. Return to the opening image with one thing changed. Show them what their own opening looks like when reflected through the ending.',
  },
  {
    claimKeywords: ['voice', 'inconsisten'],
    dimensions: ['voice'],
    directive: 'TECHNIQUE: voice comparison. Quote 2 sentences from different paragraphs. Name which sounds more like them. Ask why the gap exists.',
  },
  {
    claimKeywords: ['solo', 'credit'],
    directive: 'TECHNIQUE: collaboration reveal. Ask who else was there. Show what 2 sentences look like with a named collaborator and a specific moment of interaction.',
  },
  {
    claimKeywords: ['theme', 'stated'],
    dimensions: ['theme'],
    directive: 'TECHNIQUE: anti-lesson. Ask: what if the essay resists this conclusion? Show what the ending sounds like when it trusts the reader to draw the insight.',
  },
  {
    claimKeywords: ['pacing', 'compress'],
    dimensions: ['structure'],
    directive: 'TECHNIQUE: temporal expansion. The compressed section is hiding the best material. Ask what happened in that gap. Show what 3 sentences of expansion looks like.',
  },
  {
    claimKeywords: ['transition', 'abrupt'],
    dimensions: ['structure'],
    directive: 'TECHNIQUE: bridge sentence. Write one sentence that makes the reader feel the connection between the two paragraphs. Name what the bridge is doing.',
  },
  {
    claimKeywords: ['cliche', 'phrase'],
    dimensions: ['craft', 'voice'],
    directive: 'TECHNIQUE: definitional pivot. Quote the cliche. Ask: what does this word actually mean to YOU? Show what their specific meaning sounds like as a sentence.',
  },
  {
    claimKeywords: ['missing', 'stakes'],
    directive: 'TECHNIQUE: consequence injection. Ask: what would have happened if this failed? Show what the sentence looks like with real stakes named.',
  },
];
```

**Matching logic**: For each focus finding, iterate TECHNIQUE_ROUTES. If ALL `claimKeywords` appear in `finding.claim.toLowerCase()` AND (no dimension filter OR any dimension matches), emit the directive.

**Injection format**: Appended after the finding line in `buildFindingCoachingContext()`:

```
[F3] [confirmed/high] P1 [voice, craft]
  The opening operates in summary mode rather than grounding the reader in a specific scene.
  -> TECHNIQUE: summary-to-scene. Write a 2-sentence scene version using student details. Name the craft move.
```

**Token cost**: ~20-40 tokens per matched finding. Max 8 findings injected per turn, typically 1-3 match. Net: +30-120 tokens/turn.

### Change 3: Deflection Escalation (code + prompt)

**What**: Extend the existing W6.2 confusion escalation pattern to detect and respond to student deflection (asking execution questions while avoiding architectural decisions or withholding materials).

**Where**: New `deflectionTracker` on `CoachingService` (parallel to existing `confusionTrackers`). Escalation context injected via `buildEscalationContext()`.

**Detection logic**:
- The sidecar already emits `cognitiveState` per turn. Track consecutive turns where `cognitiveState === 'resistant_to_specific'` or `cognitiveState === 'resistant_to_general'`.
- Also track turns where the strategic question hasn't been answered (question staleness >= 3 AND student message doesn't contain new substantive content > 50 chars).

**Escalation ladder**:

| Level | Condition | Prompt injection |
|-------|-----------|------------------|
| 0 | No deflection | (none) |
| 1 | 1 resistance turn | (none — normal coaching) |
| 2 | 2 consecutive resistance turns | `"The student may be avoiding a decision. Name the pattern gently. But also: DEMONSTRATE the options so they can FEEL the difference rather than deciding abstractly."` |
| 3 | 3+ consecutive resistance turns | `"The student has deflected for ${n} turns. Stop asking. Write a sample for each option (max 3) using their own details. Present as: 'Here's what each direction feels like. Pick the one that sounds most like you.'"` |

**Why level 3 triggers demonstration**: The audit shows that by turn 8 the coach was saying "send me the revised P1" for the third time. That's a dead loop. The correct coaching move (which the LLM finally invents at turn 10 with A/B/C) is to SHOW the options. The escalation ladder formalizes this and makes it happen 2-3 turns earlier.

**Token cost**: +0 most turns. +80-100 tokens at escalation level 2-3.

---

## Implementation Spec

### Files Modified

| File | Changes |
|------|---------|
| `src/services/essayIntelligence/coaching/coachingService.ts` | Add `shouldTriggerDemonstration()`, `routeFindingToTechnique()`, `deflectionTracker`, modify `buildFindingCoachingContext()`, modify `runStage3CoachingResponse()` prompt assembly, modify `buildEscalationContext()` |

### Estimated Size

- `shouldTriggerDemonstration()`: ~40 lines
- `TECHNIQUE_ROUTES` const + `routeFindingToTechnique()`: ~120 lines
- Deflection tracking additions: ~50 lines
- Prompt modifications: ~30 lines
- Total: **~240 lines added/modified**

### What Is NOT Changed

- No new files created
- No new LLM calls added
- No PIQ examples ported
- No phase toolkits added
- No exemplar registry created
- System prompt philosophy section unchanged
- Craft vocabulary unchanged
- Pedagogical calibration rules unchanged
- Finding store / finding context builder unchanged

---

## Testing Strategy

### Test 1: Demonstration Trigger Fires

**Setup**: Run E2E with same piano-essay input. Monitor whether the demonstration directive activates.

**Expected**: Directive fires by Turn 3 or 4 (contextAccumulation will exceed 150 chars after hackathon reveal + same-topic detection on P1).

**Verify**: Coach response at the triggered turn contains an actual writing sample (2-4 sentences of the student's material rewritten with a named craft move).

### Test 2: Technique Router Matches

**Setup**: Unit test. Feed the 21 observations from the piano-essay analysis through `routeFindingToTechnique()`.

**Expected**: At least 3-5 findings get matched directives (the audit findings include summary/scene, people absence, scope inflation, emotional distance, solo credit patterns).

**Verify**: Each matched directive is a single actionable line, not a paragraph of instructions.

### Test 3: Deflection Escalation Shortens the Dead Loop

**Setup**: Run E2E with same piano-essay and same simulated student messages (including the deflection pattern at turns 6-9).

**Expected**: Escalation level 2 triggers at turn 7 (2nd consecutive resistance turn). Level 3 triggers at turn 8 (3rd consecutive). The coach writes demonstration samples at turn 8 instead of repeating "send me the revised P1."

**Verify**: Turn 8 response is LONGER than current (567 chars) because it contains actual writing samples, not shorter because the coach has given up asking.

### Test 4: Token Budget Verification

**Setup**: Run full 10-turn session. Log system prompt + user prompt token counts per turn.

**Expected**: System prompt unchanged (same cache hit). User prompt increases by ~100-300 tokens on turns where demonstration directive + technique directives fire. No turn exceeds 2200 maxTokens for full intensity.

### Test 5: No Regression on Early Turns

**Setup**: Compare Turn 1-3 coaching output between current and new versions.

**Expected**: Nearly identical behavior. The demonstration trigger should NOT fire on Turn 1 (no context yet) or Turn 2 (contextAccumulation too low). Turn 3 responses should still ask for hackathon details but MAY also include a small demonstration if the trigger conditions are met.

---

## Cost Impact

| Metric | Current | After Changes |
|--------|---------|---------------|
| LLM calls per turn | 1 Sonnet (+ conditional S4) | 1 Sonnet (+ conditional S4) — UNCHANGED |
| System prompt tokens | ~4500-5500 | ~4500-5500 — UNCHANGED (technique routes injected per-turn, not in system prompt) |
| User prompt tokens | ~800-3600 | ~900-3900 — +100-300 per turn |
| Output tokens | ~300-1000 | ~400-1200 — slightly longer when demonstrations are produced |
| Cost per turn | ~$0.02-0.06 | ~$0.02-0.07 — <20% increase |
| New API calls | 0 | 0 |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Demonstration trigger fires too early (insufficient material) | Medium | 150-char contextAccumulation threshold + same-topic-2-turns guard prevents premature firing |
| Technique router produces mismatched directives | Low | Keyword matching is conservative (ALL keywords must match). Worst case: a slightly off-target directive that the LLM overrides with better judgment |
| Demonstrations feel generic despite using student details | Medium | The prompt directive requires naming the craft move AND using student-declared context. The LLM's existing "ONLY use details the student has SHARED" instruction remains |
| Deflection escalation feels aggressive | Low | Level 2 is gentle naming. Level 3 replaces demands with demonstrations. Neither is more aggressive than the current turn 8 response ("Stop asking about the opening. Send it.") |
| Increased token usage triggers maxTokens truncation | Low | 300 additional tokens is well within the 2200 full / 1200 brief budgets |

---

## Decisions Made (with rationale)

1. **No exemplar registry** — The LLM knows the format; the bottleneck is the DECISION to demonstrate, not the knowledge of how. PIQ examples are for a different interaction pattern (workshop feedback, not dialogue coaching).

2. **No phase toolkits** — Existing phase guidance + pedagogical rules + craft vocabulary already cover MIRROR, FORCED CHOICE, IDENTITY PROBE, SCENE HUNT, SIDE-BY-SIDE, etc. The audit shows the LLM uses these moves organically.

3. **No new files** — All changes are within coachingService.ts. The technique routes are a const array, not a separate registry module. This keeps the change small and reviewable.

4. **Trigger-based demonstration, not mode-based** — Agent B's "fifth interaction mode" idea is conceptually elegant but hard to implement as a clean mode. A trigger that injects a hard directive is simpler and achieves the same outcome.

5. **Code-side routing, not prompt-side registry** — Only matched technique directives enter the prompt. This avoids 1500-token static bloat while providing targeted coaching instructions exactly when needed.

---

## Implementation Order

1. **TECHNIQUE_ROUTES const + routeFindingToTechnique()** — Most surgical change. Modifies only `buildFindingCoachingContext()`. Can be tested independently with unit test.

2. **shouldTriggerDemonstration() + prompt injection** — The highest-impact change. Breaks the catch-22. Requires integration testing with full E2E.

3. **Deflection escalation** — Extends existing W6.2 pattern. Lower priority because the demonstration trigger at step 2 may resolve most deflection scenarios (if the coach demonstrates instead of gatekeeping, there's less reason for the student to deflect).
