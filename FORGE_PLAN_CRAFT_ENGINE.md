# Deep Writing Craft Engine — Implementation Blueprint

> **Version**: v1 (Forge Pipeline Complete)
> **Date**: 2026-03-15
> **Status**: FINAL — passes the "start coding" test
> **Pipeline**: Deep Research → Diagnostic → Design A (Direct) → Design B (Rethink) → Reality Check → Blueprint Assembly

---

## Executive Summary

The Deep Writing Craft Engine is the technical writing expertise system within the Conversator. It knows HOW TO FIX writing problems at the highest craft level, personalized to the student's voice, intent, and improvement phase. It is NOT the analysis system (L3/L3.5/L3.75 determine WHAT needs work). It is the system that translates "P2's transition is abrupt" into "here's a sensory threading technique that bridges physically separate scenes — find a smell that exists in both places."

**Architecture decision**: Zero new LLM calls. All craft intelligence is delivered through an enriched Stage 3 prompt — a redesigned system prompt with craft vocabulary, a dynamic craft context assembly layer, and workshop-aware prompt templates. Total cost delta: ~$0.002/turn (additional cached system prompt tokens + dynamic context).

---

## Section 1: Architecture Decision

### The Core Question

How is craft knowledge represented, stored, and accessed?

### Decision: Enhanced Stage 3 (Option D — Craft-Aware Coaching Response)

The Stage 3 Sonnet call already sees the essay, the profile, the findings, and the conversation. Adding a separate craft call would cost ~$0.02 and produce craft guidance disconnected from the coaching dialogue. Instead, the Stage 3 prompt is redesigned to BE craft-aware:

1. **System prompt** gains a ~600-token Craft Teaching Framework (cached — one-time $0.002 write, then $0.0002/turn read)
2. **Dynamic context assembly** builds per-turn craft context from profile data (~200-400 tokens, not cached)
3. **Workshop-aware prompt templates** inject interaction-mode-specific directives based on CognitiveAssessment

### Why Not the Alternatives

| Option | Cost/turn | Quality | Rejected Because |
|--------|-----------|---------|-----------------|
| A: Static vocabulary in system prompt only | $0 delta | LOW | No personalization. Sonnet already knows writing techniques. A static list just gives shared names, not personalized guidance. |
| B: Dynamic craft context per turn | ~$0.001 delta | MEDIUM | Good but insufficient without the teaching framework. Context without pedagogy = data dump. |
| C: Separate Sonnet craft call | ~$0.02 delta | HIGH | Blows the $0.06 budget. Craft guidance disconnected from dialogue feels robotic. |
| **D: Enhanced Stage 3 (chosen)** | **~$0.002 delta** | **HIGH** | Craft expertise integrated directly into the coaching voice. Zero latency. Leverages existing Sonnet context. |

### Cost Model

**Current baseline per coaching turn:**
| Stage | Model | Cost |
|-------|-------|------|
| S1 Insight Extraction | Haiku | ~$0.001 |
| S1.5 Cognitive Assessment | Haiku | ~$0.001 |
| Pattern Detection (turn 3+) | Haiku | ~$0.003 |
| S3 Coaching Response | Sonnet | ~$0.015-0.025 |
| S4 Profile Deepening (conditional) | Sonnet | ~$0.010-0.015 |
| **Total typical** | | **~$0.025-0.035** |

**Craft Engine additions:**
| Addition | Token Impact | Cost Impact |
|----------|-------------|-------------|
| Craft Teaching Framework in system prompt | +600 tokens (cached) | First turn: +$0.00225 cache write. Subsequent: +$0.00018 cache read. |
| Dynamic craft context in user prompt | +200-400 tokens | +$0.0006-0.0012 input |
| Demonstrated capabilities in pattern detection | +20 output tokens | +$0.0001 |
| **Total per turn (after first)** | | **~$0.002** |
| **New total per turn** | | **~$0.027-0.037** |

Hard ceiling of $0.06 maintained with ~$0.023-0.033 remaining for future Conversator additions.

---

## Section 2: Craft Teaching Framework

### Location

Append to `staticCoachingPhilosophy` in `coachingService.ts` (after the "COACHING PATTERNS" section, before the closing backtick on line 1019).

### Content (~600 tokens)

```typescript
// Append to staticCoachingPhilosophy, after line 1019:

`

CRAFT TEACHING FRAMEWORK:

You have craft expertise. When teaching writing craft, follow these principles:

1. NAME TECHNIQUES so the student builds reusable vocabulary.
2. GROUND techniques in the student's OWN text — quote their words, show the technique in action.
3. TEACH THE PRINCIPLE, not just the fix — the student should be able to apply this elsewhere.
4. ONE TECHNIQUE PER TURN — depth over breadth. Master one thing before introducing another.

TECHNIQUE VOCABULARY (use these names when teaching):

TRANSITION CRAFT:
- SENSORY THREADING: A shared sensory detail (smell, sound, texture) that exists in both scenes, creating an experiential bridge without explanation
- TEMPORAL BRIDGING: Using time markers that carry emotional weight, not just chronology ("three Sundays later" vs "three weeks later")
- THEMATIC ECHOING: A word, image, or idea from one section that resurfaces in another, creating structural resonance

VOICE CRAFT:
- VOICE ANCHORING: Identifying the sentences where the writer sounds MOST like themselves, then building outward from those anchors
- REGISTER CALIBRATION: Making intentional register shifts (formal/informal) serve the narrative rather than drift unconsciously
- EARNED FORMALITY: When formal language arrives AFTER the reader trusts the writer's informal voice — it signals growth, not performance

EMOTIONAL CRAFT:
- EARNED ABSTRACTION: An abstract insight that the essay has BUILT toward through concrete detail — never asserted before it's earned
- SHOW-INVERSION: Knowing when TELLING is the power move — when deliberate, spare statement after detailed scene creates impact
- SUBTEXT CONSTRUCTION: What the essay communicates through juxtaposition, omission, or implication — not statement

STRUCTURAL CRAFT:
- SPECIFICITY ESCALATION: Moving from general to hyper-specific ("music" → "Chopin's Ballade No. 1 at 2am on a Tuesday")
- RHYTHMIC VARIATION: Alternating sentence lengths — short punch after long build, or long flowing sentence after staccato
- NARRATIVE COMPRESSION: Covering time/events quickly when the material isn't load-bearing, expanding when it is
- BOOKENDING: Opening and closing images that create structural resonance — the same image, transformed

ADMISSIONS CRAFT:
- THE 4PM TEST: Would an AO reading this at 4pm on their 30th essay stop and pay attention? What makes them look up?
- VALUE-ACTION GAP: The distance between what the student CLAIMS to value and what their essay SHOWS them doing — AOs read for this

HOW TO USE PROFILE DATA:
Your context includes CraftAssessment data — strengthSignatures (what the student does WELL) and growthEdges (where they need work). USE these:
- When the student's CraftAssessment shows "sensory grounding" as a strength: "You already do sensory grounding beautifully in P2 — let's apply that same instinct to this transition."
- When a growthEdge says "transitions rely on temporal markers": teach SENSORY THREADING specifically, grounded in their essay.
- When VoiceMap shows unintentional shifts: teach REGISTER CALIBRATION using their specific shift locations.
- When MomentEarnednessMap shows unearned moments: teach EARNED ABSTRACTION using their specific gap.

VOICE PRESERVATION IMPERATIVE:
Every craft suggestion must PRESERVE the student's authentic voice. Before suggesting any change, check:
1. Does this suggestion sound like THIS student, or like a generic "good essay"?
2. Which sentences in the essay are the student's VOICE ANCHORS — the moments they sound most like themselves?
3. If in doubt, suggest the student write it in their own words first, THEN refine.
NEVER suggest language that overwrites the student's register with academic formality unless THEY chose formal register intentionally.`
```

### Why These 15 Techniques

Each technique maps to a specific, recurring weakness observable in admissions essays:

| Technique | Maps to Profile Data | Common Essay Problem |
|-----------|---------------------|---------------------|
| SENSORY THREADING | ConnectionGraph weak connections, CraftAssessment growthEdges | Scene-to-scene transitions with no experiential bridge |
| TEMPORAL BRIDGING | NarrativeStrategy.pacingAnalysis | "Three months later" jumps without emotional weight |
| THEMATIC ECHOING | ThematicArchitecture.threads with strength='hinted' | Dropped thematic threads, unrealized connections |
| VOICE ANCHORING | VoiceIdentity.authenticVsPerformed | Student overwrites their best voice moments during revision |
| REGISTER CALIBRATION | VoiceMap.shifts[].intentionality | Unintentional voice drift between paragraphs |
| EARNED FORMALITY | VoiceMap.shifts[].servesFunction | Formal language that feels performed rather than earned |
| EARNED ABSTRACTION | MomentEarnednessMap.moments[].gaps | Abstract conclusions without concrete setup |
| SHOW-INVERSION | EmotionalTopography.showVsTell | Binary show/tell thinking; student doesn't know when telling IS showing |
| SUBTEXT CONSTRUCTION | ThematicArchitecture.subtext, .contradictions | Everything stated explicitly, nothing implied |
| SPECIFICITY ESCALATION | SentenceCraft.techniques, CraftAssessment.wordPatterns | Generic language where hyper-specificity would create memorability |
| RHYTHMIC VARIATION | VoiceMap.sentenceRhythm, SentenceCraft.rhythm | Monotonous sentence lengths throughout |
| NARRATIVE COMPRESSION | NarrativeStrategy.pacingAnalysis, .arcMomentum='stalling' | Equal time given to unequal moments |
| BOOKENDING | ConnectionGraph structural connections, ThroughLineMap | No structural resonance between opening and closing |
| THE 4PM TEST | AdmissionsPositioning.memorability | Essay that's "good" but not memorable |
| VALUE-ACTION GAP | CharacterRevelation.valuesRevealed, .blindSpots | Claiming values the essay doesn't demonstrate |

---

## Section 3: Dynamic Craft Context Assembly

### New Function: `buildCraftContext()`

A new private method on `CoachingService` that assembles per-turn craft context from the profile. Injected into the Stage 3 user prompt after the profile context text and before the conversation history.

**File**: `src/services/essayIntelligence/coaching/coachingService.ts`
**Location**: New private method, called from `runStage3CoachingResponse()` after `buildProfileContextText()`.

```typescript
/**
 * Build dynamic craft context from the essay profile.
 * Assembles craft-relevant data that grounds the Craft Teaching Framework
 * in the student's specific essay.
 *
 * Output: ~200-400 tokens of craft context, injected into Stage 3 user prompt.
 * Not cached (changes per essay, potentially per turn after edits).
 */
private buildCraftContext(
  profile: EssayProfile,
  stage1: Stage1Output,
  coordinator: EssayProfileCoordinator,
  sessionMemory: CoachingSessionMemory,
): string {
  const parts: string[] = [];
  const phase = profile.index.improvementPhase.level;

  // 1. Craft Assessment Summary (always include — 50-80 tokens)
  const craft = profile.craftAssessment;
  if (craft.strengthSignatures.length > 0 || craft.growthEdges.length > 0) {
    const strengths = craft.strengthSignatures
      .slice(0, 3)
      .map(s => `  STRENGTH: "${s.quality}" — ${s.evidence.slice(0, 100)}`)
      .join('\n');
    const edges = craft.growthEdges
      .slice(0, 3)
      .map(e => `  GROWTH EDGE: "${e.quality}" — ${e.description.slice(0, 100)}`)
      .join('\n');
    parts.push(`CRAFT PROFILE:\n${strengths}\n${edges}`);
  }

  // 2. Voice Anchors — authentic moments to protect (30-60 tokens)
  const authenticMoments = profile.voiceIdentity.authenticVsPerformed
    .filter(m => m.assessment === 'authentic')
    .slice(0, 3);
  if (authenticMoments.length > 0) {
    const anchors = authenticMoments
      .map(m => `  P${m.location[0] + 1}S${m.location[1] + 1}: ${m.reasoning.slice(0, 80)}`)
      .join('\n');
    parts.push(`VOICE ANCHORS (protect these — the student sounds most like themselves here):\n${anchors}`);
  }

  // 3. Unearned Moments — craft teaching opportunities (30-60 tokens)
  const unearnedMoments = profile.momentEarnednessMap.moments
    .filter(m => m.gaps.length > 0)
    .slice(0, 2);
  if (unearnedMoments.length > 0) {
    const unearned = unearnedMoments
      .map(m => `  P${m.location.paragraph + 1}S${m.location.sentence + 1} (${m.momentType}): ${m.gaps[0].slice(0, 100)}`)
      .join('\n');
    parts.push(`UNEARNED MOMENTS (need EARNED ABSTRACTION or setup work):\n${unearned}`);
  }

  // 4. Voice Shifts with low intentionality — teaching opportunity (30-60 tokens)
  const driftShifts = profile.voiceMap.shifts
    .filter(s => s.intentionality.assessment === 'unintentional' || s.intentionality.assessment === 'ambiguous')
    .slice(0, 2);
  if (driftShifts.length > 0) {
    const drifts = driftShifts
      .map(s => {
        const loc = `P${s.location.paragraph + 1}${s.location.sentence !== undefined ? `S${s.location.sentence + 1}` : ''}`;
        return `  ${loc}: ${s.fromDescription.slice(0, 50)} → ${s.toDescription.slice(0, 50)} (${s.intentionality.assessment})`;
      })
      .join('\n');
    parts.push(`VOICE DRIFT (REGISTER CALIBRATION opportunity):\n${drifts}`);
  }

  // 5. Scoped findings as craft opportunities (40-80 tokens)
  //    Scope to the student's current focus area
  const findingStore = coordinator.getFindingStore();
  const focusParaIndex = this.resolveDominantParagraph(stage1.focusProbabilities);
  const scopedFindings = focusParaIndex !== null
    ? findingStore.getByScope(focusParaIndex)
        .filter(f => f.maturity !== 'superseded' && (f.coachingValue === 'critical' || f.coachingValue === 'high'))
        .slice(0, 3)
    : findingStore.getActiveSortedByCoachingValue()
        .slice(0, 3);

  if (scopedFindings.length > 0) {
    const findingLines = scopedFindings
      .map(f => `  [${f.id}] ${f.claim.slice(0, 120)} → ${this.mapFindingToTechnique(f, profile)}`)
      .join('\n');
    parts.push(`CRAFT OPPORTUNITIES (findings → techniques):\n${findingLines}`);
  }

  // 6. Demonstrated capabilities — build on what they can do (20-40 tokens)
  if (sessionMemory.demonstratedCapabilities && sessionMemory.demonstratedCapabilities.length > 0) {
    parts.push(
      `STUDENT HAS DEMONSTRATED: ${sessionMemory.demonstratedCapabilities.join('; ')}\n` +
      `Build on what they can already do. Reference prior success when teaching new techniques.`
    );
  }

  // 7. Phase-specific craft lens (20-40 tokens)
  parts.push(this.buildPhaseCraftLens(phase));

  if (parts.length === 0) return '';
  return `\n\n=== CRAFT CONTEXT (use to ground technique teaching in this student's essay) ===\n${parts.join('\n\n')}`;
}

/**
 * Map a finding to the most relevant craft technique name.
 * Returns a brief string like "→ SENSORY THREADING" or "→ EARNED ABSTRACTION".
 *
 * LLM-first: the mapping is a HINT, not a mandate. The LLM may choose a different
 * technique if its judgment says otherwise. This just creates an initial association
 * so the LLM doesn't have to derive the mapping from scratch.
 */
private mapFindingToTechnique(finding: Finding, profile: EssayProfile): string {
  const claim = finding.claim.toLowerCase();
  const dims = finding.dimensions;

  // Transition/connection findings
  if (claim.includes('transition') || claim.includes('bridge') || claim.includes('abrupt')) {
    return 'consider SENSORY THREADING or THEMATIC ECHOING';
  }
  // Voice findings
  if (dims.includes('voice') && (claim.includes('shift') || claim.includes('drift') || claim.includes('register'))) {
    return 'consider REGISTER CALIBRATION or VOICE ANCHORING';
  }
  // Emotion/earnedness findings
  if (claim.includes('unearned') || claim.includes('told') || claim.includes('telling')) {
    return 'consider EARNED ABSTRACTION or SHOW-INVERSION';
  }
  // Specificity findings
  if (claim.includes('generic') || claim.includes('abstract') || claim.includes('vague')) {
    return 'consider SPECIFICITY ESCALATION';
  }
  // Rhythm/pacing findings
  if (claim.includes('pace') || claim.includes('rhythm') || claim.includes('monoton')) {
    return 'consider RHYTHMIC VARIATION or NARRATIVE COMPRESSION';
  }
  // Structure findings
  if (claim.includes('opening') || claim.includes('closing') || claim.includes('bookend')) {
    return 'consider BOOKENDING';
  }
  // Admissions findings
  if (claim.includes('memorable') || claim.includes('forgettable') || claim.includes('generic')) {
    return 'consider THE 4PM TEST';
  }

  return 'craft teaching opportunity';
}

/**
 * Build phase-specific craft lens directive.
 * Tells the coach what KIND of craft to prioritize at this phase.
 */
private buildPhaseCraftLens(phase: ImprovementPhaseLevel): string {
  switch (phase) {
    case 'foundation':
      return `CRAFT LENS (FOUNDATION): Focus on STRUCTURAL craft — what each paragraph needs to DO. ` +
        `Teach techniques that help the student see their essay's architecture. ` +
        `Avoid sentence-level craft unless a sentence-level problem IS the structural problem.`;
    case 'architecture':
      return `CRAFT LENS (ARCHITECTURE): Focus on TRANSITION craft and STRUCTURAL craft. ` +
        `Teach SENSORY THREADING, THEMATIC ECHOING, NARRATIVE COMPRESSION. ` +
        `The structure exists — now each section must earn its place and connect to its neighbors.`;
    case 'craft':
      return `CRAFT LENS (CRAFT): Full craft vocabulary available. ` +
        `Teach sentence-level techniques: RHYTHMIC VARIATION, SPECIFICITY ESCALATION, SHOW-INVERSION. ` +
        `Give CONCRETE ALTERNATIVES — don't just name the technique, show what it looks like in THEIR text.`;
    case 'polish':
      return `CRAFT LENS (POLISH): Word-level precision. ` +
        `Teach VOICE ANCHORING (protect and amplify the student's best moments). ` +
        `Every word choice matters. "pungent" vs "acrid" — which one does double duty?`;
    case 'distinction':
      return `CRAFT LENS (DISTINCTION): THE 4PM TEST is your primary lens. ` +
        `What makes this essay the one an AO remembers? ` +
        `BOOKENDING, SUBTEXT CONSTRUCTION — the craft that creates memorability. ` +
        `Not "good" — every admitted student writes "good." What makes this one THEIRS?`;
  }
}

/**
 * Resolve the dominant paragraph index from focus probabilities.
 * Returns null if no paragraph has > 0.4 probability.
 */
private resolveDominantParagraph(focusProbabilities: Record<string, number>): number | null {
  let maxProb = 0;
  let dominantLabel = '';
  for (const [label, prob] of Object.entries(focusProbabilities)) {
    if (prob > maxProb) {
      maxProb = prob;
      dominantLabel = label;
    }
  }
  if (maxProb <= 0.4) return null;
  const match = dominantLabel.match(/P(\d+)/);
  return match ? parseInt(match[1], 10) - 1 : null;
}
```

### Integration Point

In `runStage3CoachingResponse()`, after `buildProfileContextText()` (line 1022) and before the user prompt assembly (line 1111):

```typescript
// After line 1022:
const craftContext = this.buildCraftContext(profile, stage1, coordinator, sessionMemory);

// In the user prompt (line 1111), insert after profileContextText:
const userPrompt = `===ESSAY + PROFILE CONTEXT===
${profileContextText}
${craftContext}

===ESSAY TEXT ...
```

---

## Section 4: Workshop Interaction Model

### How Brainstorm, Draft-Workshop, and Evaluate Modes Work

The system does NOT use explicit mode enums (that would violate LLM-first design — Rule 3: no closed taxonomies). Instead, it uses CognitiveAssessment's `recommendedApproach` (free prose from Stage 1.5) plus session memory's `sessionMode` (free text from pattern detection) to create mode-aware behavior.

### Mode Detection (Zero Cost — Existing Infrastructure)

Stage 1.5 already produces `recommendedApproach` as free prose:
- "Brainstorm alternatives with the student — they want divergent exploration"
- "Workshop this sentence together — they have a specific fix in mind"
- "Evaluate their revision — they want to know if it worked"

This is injected into Stage 3 as `=== COGNITIVE ASSESSMENT ===`. The Craft Teaching Framework's pedagogical instructions tell the coach how to respond to each approach type.

### Session Mode Persistence

The `sessionMode` field on `CoachingSessionMemory` (free text, updated by pattern detection Haiku) provides cross-turn mode continuity:

```typescript
// Already added by FORGE_PLAN_CONVERSATOR.md ITEM 3:
sessionMode: string; // e.g., "brainstorming alternative openings for 3 turns"
```

The pattern detection call detects mode continuity: "student has been brainstorming for 3 turns" gets injected into Stage 1.5 → Stage 1.5 produces "continue brainstorming" → Stage 3 stays in brainstorm mode.

### Workshop Prompt Additions

Add to the Craft Teaching Framework (in the cached system prompt):

```
WORKSHOP MODES (infer from the cognitive assessment — do NOT announce modes):

When the student is BRAINSTORMING:
- Offer 2-3 concrete alternatives, each with a different craft approach
- Ground each alternative in a specific technique: "This one uses BOOKENDING..."
- Ask the student to react to FEELING, not quality: "Which one sounds most like you?"
- Do NOT evaluate during brainstorming — that kills divergent thinking

When the student is WORKSHOPPING a specific passage:
- Work at the sentence level. Quote their draft. Show the technique in action.
- Use a SHOW-THEN-EXPLAIN pattern: "What if it read: '[rewritten]' — that's RHYTHMIC VARIATION: the short sentence after the long one creates a pause the reader needs here."
- Iterate: "Try writing the next version yourself. Keep the [specific thing that worked], change the [specific thing that didn't]."

When the student is EVALUATING a revision:
- Compare their new version to the old version SPECIFICALLY. Don't just say "it's better."
- Name what improved: "The new version uses SENSORY THREADING — the formaldehyde smell connects the lab to the hospital."
- Name what's still open: "But 'reminded me of' is still TELLING. What if the smell just IS there — 'the formaldehyde caught in my throat' — and you let the reader make the connection?"
- Give a clear signal: "One more pass and this transition is done."

When the student is STUCK:
- Switch from craft to intent: "Forget the words for a second. Tell me out loud: what do you WANT the reader to feel at this moment?"
- Their answer becomes the craft target. Turn it into a specific technique.
```

### How the Brainstorm→Draft→Evaluate Cycle Works Across Turns

```
Turn 1 (student): "Help me brainstorm a different opening"
  → Stage 1.5: recommendedApproach = "brainstorm alternatives"
  → Stage 3: Craft context includes opening's CraftAssessment + structural role
  → Coach: 3 alternatives, each grounded in a named technique
  → Pattern detection: sessionMode = "brainstorming opening alternatives"

Turn 2 (student): "I like the second one — the in-medias-res approach"
  → Stage 1.5: sees sessionMode="brainstorming", student chose option
  → recommendedApproach = "transition from brainstorm to workshopping"
  → Coach: "Good instinct. That's starting in the pawnshop scene. Try writing
    the first 2 sentences. Ground the reader in something they can SEE."

Turn 3 (student): "What about: 'The fluorescent light caught the stone's face
  as I turned it under the pawnshop's case.' ?"
  → Stage 1.5: student proposing draft text → "workshop and refine"
  → Stage 3: Craft context includes VoiceMap (is this in their register?) +
    structural role of P1 (frame of risk? introduction?)
  → Coach: "That's strong — the fluorescent light is specific, and 'caught the
    stone's face' personifies the diamond without announcing the metaphor.
    The rhythm works too: it's one long flowing sentence. Try a SHORT second
    sentence that creates contrast. RHYTHMIC VARIATION — the reader needs a
    beat between the image and whatever comes next."

Turn 4 (student): "How about: 'Fourteen carats. My grandfather's entire estate.' ?"
  → Stage 1.5: evaluating their own draft → "evaluate and affirm or refine"
  → Coach: "That's SPECIFICITY ESCALATION done perfectly — '14 carats' is
    the kind of detail that makes an AO pay attention. And 'my grandfather's
    entire estate' in four words does what three sentences of backstory would
    do less well. That's NARRATIVE COMPRESSION. This opening passes the
    4pm test. Let's move on to P2."
```

### How the System Reacts to Student-Produced Text

When the student produces mid-workshop draft text, the system:

1. **Evaluates against profile data** — does this new text maintain voice consistency? (VoiceMap)
2. **Evaluates against findings** — does this address the relevant finding? (FindingStore scoped to target)
3. **Evaluates against declared intent** — does this achieve what the student wants? (ConversationInsights)
4. **Names what works** — identify and name the craft technique the student used (builds capability)
5. **Names what's open** — one specific next step, not a list of problems
6. **Signals progress** — "one more pass" or "this is ready" or "good direction, keep iterating"

All of this happens within the existing Stage 3 Sonnet call. The craft context provides the data; the Craft Teaching Framework provides the pedagogy; the CognitiveAssessment provides the mode.

---

## Section 5: Phase-Aware Craft Calibration

### How Improvement Phase Modulates Craft Depth

The `buildPhaseCraftLens()` function (Section 3) produces phase-specific directives. Here's the full calibration with before/after examples:

### Foundation Phase

**Craft depth**: Structural only. Name WHAT each paragraph needs to DO.
**Techniques available**: Minimal — focus on paragraph roles, not sentence craft.

```
CURRENT (generic):
"Your opening needs to ground the reader in a specific moment."

TARGET (craft-grounded):
"Your opening's structural role is 'frame of risk' — it's supposed to tell the
reader what's at stake BEFORE the story unfolds. Right now it's a philosophical
claim ('Growth requires discomfort'). That's a conclusion, not a frame. The
reader needs to feel the RISK first, then discover the growth. What moment
in your story would show the reader that something was at stake?"
```

### Architecture Phase

**Craft depth**: Transition + structural. How paragraphs CONNECT.
**Techniques available**: SENSORY THREADING, THEMATIC ECHOING, TEMPORAL BRIDGING, NARRATIVE COMPRESSION.

```
CURRENT (generic):
"The transition between P2 and P3 needs work — it feels abrupt."

TARGET (craft-grounded):
"P2 ends in the lab and P3 starts at the hospital. Right now the reader goes
from pipettes to diagnosis with nothing between them. You need a bridge.

Here's a technique called SENSORY THREADING: find something that exists in
BOTH places — not something abstract, something your senses would register.
What's in a chemistry lab that's also in a hospital? ... The smell. That's
your bridge. Write one sentence that puts the formaldehyde smell in the lab
paragraph, casually. When the reader hits the hospital, the echo creates the
bridge automatically."
```

### Craft Phase

**Craft depth**: Full sentence-level. RHYTHMIC VARIATION, SPECIFICITY ESCALATION, SHOW-INVERSION.
**Techniques available**: All 15. Give CONCRETE ALTERNATIVES.

```
CURRENT (generic):
"P3S2 could be more specific — try adding concrete detail."

TARGET (craft-grounded):
"P3S2 says 'it was a meaningful experience.' That's an assertion — you're
TELLING the reader it mattered instead of SHOWING them. But here's the thing:
sometimes TELLING is exactly right. This is what I call SHOW-INVERSION —
knowing when a spare, direct statement creates MORE impact than detail.

The problem isn't that you're telling. It's that you're telling TOO EARLY.
You haven't earned the abstraction yet. 'Meaningful' after 200 words of vivid
detail WORKS. 'Meaningful' in sentence 2, before the reader has seen anything?
That's a claim without evidence.

Try this: move P3S2 to the END of P3. Let all the specific detail come first.
Then 'it was meaningful' arrives as a RELEASE — the reader already feels the
meaning, and the sentence names what they're feeling. That's EARNED ABSTRACTION."
```

### Polish Phase

**Craft depth**: Word-level. Every word choice matters.
**Techniques available**: VOICE ANCHORING, SPECIFICITY ESCALATION at word level.

```
CURRENT (generic):
"Consider whether 'impactful' is the right word choice here."

TARGET (craft-grounded):
"The word 'pungent' in P2S4 is doing double duty — it bridges the lab and
the hospital through smell. Keep it. But 'impactful' in P4S2 is a word that
means everything and nothing. It's not in your register — your voice throughout
this essay is precise and observational, not résumé-speak.

What did the experience actually DO to you? Not 'impactful' — that's a label.
What changed? Did you see something differently? Did you stop doing something?
Start? The specific verb IS the impact."
```

### Distinction Phase

**Craft depth**: Memorability. THE 4PM TEST.
**Techniques available**: BOOKENDING, SUBTEXT CONSTRUCTION, THE 4PM TEST, VALUE-ACTION GAP.

```
CURRENT (generic):
"The essay is well-crafted. Consider what makes it memorable."

TARGET (craft-grounded):
"Your closing image — the LED light holding steady — that's your essay's last
impression. An AO at 4pm on their 30th essay will either remember that image
or they won't.

Right now the LED light works but it's introduced FOR the ending. The reader
meets it in P5 and never sees it again. That's a closing, not a BOOKEND.

What if the LED light appears in P1 too — casually, part of the lab scene?
Then when it returns in P5, it carries the weight of everything between.
The reader feels the transformation because the IMAGE transformed — same
light, different meaning. That's BOOKENDING.

The image an AO remembers isn't the most dramatic one. It's the one that
MEANS something different the second time they think about it."
```

---

## Section 6: Voice Preservation Mechanics

### The Problem

The coach can inadvertently suggest changes that make the essay sound "better" but less like the student. "Try ending with a powerful declaration: 'In that moment, I understood that true strength comes from vulnerability'" — sounds polished, sounds nothing like a 17-year-old who uses sentence fragments and irony.

### Three-Layer Voice Preservation

**Layer 1: Voice Anchors in Craft Context (dynamic)**

The `buildCraftContext()` function (Section 3) includes `authenticVsPerformed` entries filtered to `'authentic'` assessments. These are injected as "VOICE ANCHORS — protect these."

**Layer 2: Voice Preservation Imperative in Teaching Framework (cached)**

The Craft Teaching Framework (Section 2) includes the "VOICE PRESERVATION IMPERATIVE" — a directive to check every suggestion against the student's register before offering it.

**Layer 3: Router Enhancement — Scoped authenticVsPerformed**

**File**: `src/services/essayIntelligence/profileManager/profileRouter.ts`
**Location**: `assembleL6CoachingParagraph()` method — the `voiceContext` section.

Currently the voice context for paragraph coaching includes signature + register baseline + distinctive patterns. Add paragraph-scoped `authenticVsPerformed` entries:

```typescript
// In assembleL6CoachingParagraph(), within the voiceContext section assembly:
// After existing voice context fields, add:

const paragraphAuthenticMoments = profile.voiceIdentity.authenticVsPerformed
  .filter(m => m.location[0] === pIdx)
  .map(m => ({
    sentence: m.location[1],
    assessment: m.assessment,
    reasoning: m.reasoning,
  }));

// Include in the voiceContext section content:
const voiceContextContent = {
  signature: profile.voiceIdentity.signature,
  registerBaseline: profile.voiceMap.register.baseline,
  distinctivePatterns: profile.voiceIdentity.distinctivePatterns,
  authenticMoments: paragraphAuthenticMoments, // NEW
};
```

**Token impact**: ~20-40 tokens per paragraph coaching turn. Typically 1-3 authentic moment entries for a given paragraph.

### How Voice Preservation Works in Practice

```
Student: "How can I make the ending stronger?"

PROFILE DATA AVAILABLE:
- VoiceIdentity.signature: "Understated, observational. Shows things without
  naming them. Occasional dry humor."
- Voice anchors: P2S3 (authentic: "raw observational detail"), P3S1 (authentic:
  "dry humor undercuts emotional weight")
- VoiceMap.register.baseline: "informal-observational"

COACH (without voice preservation):
"Try ending with a powerful declaration: 'In that moment, I understood
that true strength comes from vulnerability.'"

COACH (with voice preservation):
"Your voice throughout this essay is understated — you show things without
naming them. P2S3 and P3S1 are where you sound most like yourself. So your
ending shouldn't be a declaration. What if the last sentence did what P2S3
does — just described what happened, and let the reader feel the weight?
Something that stays in your register: quiet, observational, the meaning
between the lines."
```

---

## Section 7: Integration Spec

### Files Modified

| File | Changes | Lines Affected |
|------|---------|---------------|
| `src/services/essayIntelligence/coaching/coachingService.ts` | Craft Teaching Framework in system prompt, `buildCraftContext()` method, `mapFindingToTechnique()`, `buildPhaseCraftLens()`, `resolveDominantParagraph()`, integration in `runStage3CoachingResponse()`, workshop mode additions to system prompt | +~250 lines |
| `src/services/essayIntelligence/profileManager/profileRouter.ts` | Scoped `authenticVsPerformed` in `assembleL6CoachingParagraph()` voiceContext | +~15 lines |
| `src/services/essayIntelligence/profileTypes.ts` | `demonstratedCapabilities: string[]` on `CoachingSessionMemory` | +~12 lines |

### coachingService.ts — Detailed Change Map

**Change 1: Craft Teaching Framework (cached system prompt)**
- Location: `staticCoachingPhilosophy` string (lines 873-1019)
- Action: Append ~600-token Craft Teaching Framework + Workshop Mode directives after line 1019
- Cache impact: System prompt grows from ~4500 chars to ~7500 chars. Still well within cache limits. One-time cache write cost: ~$0.002.

**Change 2: `buildCraftContext()` — new private method**
- Location: New method after `buildProfileContextText()` (after line 1223)
- Dependencies: `EssayProfile`, `Stage1Output`, `EssayProfileCoordinator`, `CoachingSessionMemory`
- Returns: string (craft context block, ~200-400 tokens)

**Change 3: `mapFindingToTechnique()` — new private method**
- Location: After `buildCraftContext()`
- Dependencies: `Finding`, `EssayProfile`
- Returns: string (technique suggestion, ~5-15 tokens)
- Note: Soft mapping via claim text heuristics. The LLM is NOT bound by this mapping — it's a hint that creates an initial association. This is Rule 5 compliant (soft guidance, not hard restriction).

**Change 4: `buildPhaseCraftLens()` — new private method**
- Location: After `mapFindingToTechnique()`
- Dependencies: `ImprovementPhaseLevel`
- Returns: string (phase-specific craft directive, ~30-50 tokens)

**Change 5: `resolveDominantParagraph()` — new private method**
- Location: After `buildPhaseCraftLens()`
- Dependencies: `Record<string, number>` (focus probabilities)
- Returns: `number | null`

**Change 6: Integration in `runStage3CoachingResponse()`**
- Location: After line 1022 (`const profileContextText = ...`)
- Action: Call `buildCraftContext()` and inject result into user prompt
- Exact insertion point: After `${profileContextText}` and before `===ESSAY TEXT===` in the user prompt template (line 1111-1139)

### profileRouter.ts — Detailed Change Map

**Change 1: Scoped authenticVsPerformed in voiceContext**
- Location: `assembleL6CoachingParagraph()` method, within the voiceContext section construction
- Action: Add paragraph-filtered `authenticVsPerformed` entries to the voiceContext content object
- Dependencies: `profile.voiceIdentity.authenticVsPerformed` (already on EssayProfile)

### profileTypes.ts — Detailed Change Map

**Change 1: `demonstratedCapabilities` on CoachingSessionMemory**
- Location: `CoachingSessionMemory` interface
- Action: Add `demonstratedCapabilities: string[]` field
- Note: This change is already specified in `FORGE_PLAN_CONVERSATOR.md` ITEM 2. Including here for completeness — implement once.

---

## Section 8: Before/After Examples (All 6 Craft Domains)

### 8.1 Transition Craft

**Student**: "I don't know how to fix the transition in paragraph 2"

**CURRENT OUTPUT** (no craft engine):
```
The transition between your lab scene and the hospital scene feels abrupt
because there's no bridging element. Consider adding a sensory detail or
thematic connection that links the two environments.
```

**TARGET OUTPUT** (with craft engine):
```
Let's think about what that transition needs to do. You want to connect the
lab to your grandmother — right now the reader goes from "I adjusted the
pipette" to "My grandmother was diagnosed" with nothing between them.

Here's a technique that works for bridging physically separate scenes — it's
called SENSORY THREADING. Find something that exists in BOTH places. Not
something abstract — something your senses would register. What's in a
chemistry lab that's also in a hospital?

[Student: "The smell"]

That's exactly it — smell is the most emotionally immediate sense, and it
exists in both environments without you having to explain the connection. Try
writing one sentence that puts that smell in the lab scene, almost casually.
When the reader gets to the hospital paragraph, the sensory echo creates the
bridge automatically.

You've already shown you're good at sensory detail — P1S3 with the "fluorescent
light catching the stone's face" is exactly this instinct. Apply it here.
```

### 8.2 Voice Craft

**Student**: "How can I sound more mature in my essay?"

**CURRENT OUTPUT**:
```
Your essay has an authentic voice. Consider where you can elevate the language
while maintaining your natural tone. The key is finding the balance between
casual and formal.
```

**TARGET OUTPUT**:
```
Here's the thing about maturity in writing: it's not about sounding formal.
Your voice in P2 — "I couldn't look at the piano without hearing her breathing"
— that IS maturity. That's VOICE ANCHORING: the sentences where you sound most
like yourself are already the strongest moments in this essay.

The places where you try to sound "mature" — P4S1: "This experience catalyzed
my understanding of mortality" — those are where the essay sounds least like
you. That's what I'd call a register drift: your natural voice is observational
and specific, and when you reach for formal language, the reader can feel the
shift. It reads as performance, not growth.

EARNED FORMALITY works differently: you earn the right to a more formal sentence
by spending 5 sentences in your natural voice first. Then one measured, precise
sentence lands with weight because the reader trusts your voice by then. P5S3
actually does this — after all the concrete lab detail, "I understood" lands
because you earned it.
```

### 8.3 Emotional Craft

**Student**: "The ending feels flat. How do I make it more emotional?"

**CURRENT OUTPUT**:
```
Your ending resolves the essay's tension but doesn't deliver the emotional
payoff the rest of the essay builds toward. Try adding more vivid detail or
a stronger final image.
```

**TARGET OUTPUT**:
```
Your ending isn't flat because it lacks emotion — it's flat because it
STATES the emotion instead of letting the reader arrive at it. "I finally
understood the value of perseverance" is a conclusion. But conclusions aren't
emotional — experiences are.

Your MomentEarnednessMap shows the gap: P4's emotional climax (the diagnosis
revelation) has solid setup through the lab scenes, but P5 skips from the
moment to the lesson. That skip IS the flatness.

Here's the craft move: SHOW-INVERSION. Sometimes telling IS the power move —
but only AFTER you've shown. Right now P5 TELLS without having shown the
aftermath. What happened in the MOMENT after the diagnosis? Not what you
learned — what you DID. What you saw. What you felt in your body.

Write two sentences of pure physical experience — what the room looked like,
what your hands were doing, what sound you remember. THEN "I finally understood"
has somewhere to land. That's EARNED ABSTRACTION: the insight arrives after
the evidence, so the reader earns it alongside you.
```

### 8.4 Narrative Structure Craft

**Student**: "My essay feels like it moves too slowly in the middle"

**CURRENT OUTPUT**:
```
The middle section could benefit from better pacing. Consider which details
are essential and which could be cut or condensed.
```

**TARGET OUTPUT**:
```
Let's look at where the momentum stalls. P2 spends 4 sentences on the lab
setup. P3 spends 5 sentences on similar setup for the hospital. Both scenes
serve the same function: grounding the reader in a physical space. The essay
is doing the same work twice.

This is where NARRATIVE COMPRESSION helps. The rule: expand the moments that
MATTER, compress the ones that SUPPORT. P2's lab scene matters — it's where
the essay's central image (the diamond) appears. P3's hospital scene supports
P2 — the reader already knows how to read a scene from you. You can compress
P3 to 2 sentences and trust the reader to fill in the rest.

Your pacing profile shows the essay's arc momentum is "stalling" through
P2-P3. That's because both paragraphs are in setup mode. Once P3 compresses,
the acceleration into P4's diagnosis will feel earned — the reader has been
held in setup long enough to need the release.

Try rewriting P3 as 2 sentences. Cut the physical description. Keep only the
detail that bridges to P4.
```

### 8.5 Sentence-Level Craft

**Student**: "Is this sentence working: 'The weight of my grandfather's legacy pressed upon me like a boulder of expectation.'"

**CURRENT OUTPUT**:
```
The metaphor feels mixed — "weight" and "boulder" are doing similar work.
Consider simplifying to one strong image.
```

**TARGET OUTPUT**:
```
There are two problems here, and they're connected.

First: "weight" and "boulder" are saying the same thing twice. That's
redundancy, not emphasis. Pick one.

Second — and this is the real issue: "boulder of expectation" is what I'd call
a DEAD METAPHOR. It doesn't create an image the reader can see. What does a
boulder of expectation look like? The reader's mind goes blank.

Compare this to your own best writing — P1S3: "the fluorescent light caught
the stone's face." THAT'S a live metaphor. The reader SEES the light on the
diamond. The image is specific, physical, surprising.

SPECIFICITY ESCALATION: "boulder of expectation" → what did the legacy
actually feel like? Not a boulder. Maybe "fourteen carats in a velvet box
I couldn't close." Maybe "a diamond I couldn't sell and couldn't afford to
keep." The specific physical detail of YOUR legacy IS the metaphor. You don't
need to compare it to something else.

Write the sentence using only what's actually in your story. No boulders.
```

### 8.6 Admissions-Specific Craft

**Student**: "Do you think this essay is memorable enough?"

**CURRENT OUTPUT**:
```
The essay has a strong personal narrative. To increase memorability, consider
a more distinctive opening or a stronger closing image.
```

**TARGET OUTPUT**:
```
THE 4PM TEST: An AO has read 29 essays today. They pick up yours. They read
"Growth requires stepping outside our comfort zones." They've read that
sentence 200 times this cycle. They're already skimming.

Now imagine they pick up yours and read: "Fourteen carats. My grandfather's
entire estate." They stop. They're curious. THAT'S memorability — not a
better version of what everyone writes, but something only YOU can write.

Your essay has a VALUE-ACTION GAP that's working in your favor: you claim to
value your grandfather's legacy, but the essay actually shows you STRUGGLING
with it — not wanting it, not knowing what to do with it, finding meaning in
it only through the lab. That tension is more interesting than any version of
"I learned from my grandfather." AOs read for the gap between what students
say they value and what they actually show.

Your closing — the LED light — is close. But right now it arrives cold. The
reader meets the LED in P5 only. If it appeared in P1 (part of the lab
scene, casually), then returned in P5, it would be a BOOKEND — the same image
carrying different meaning. That's what an AO remembers: not the most dramatic
moment, but the image that means something different the second time.
```

---

## Section 9: Cost Model

### Per-Turn Cost Breakdown

| Component | Tokens | Cost Basis | Cost |
|-----------|--------|-----------|------|
| Craft Teaching Framework (cached read) | ~600 | $0.30/MTok (Sonnet cache read) | $0.00018 |
| Dynamic craft context (input) | ~300 avg | $3.00/MTok (Sonnet input) | $0.0009 |
| Workshop mode directives (cached read) | ~200 | $0.30/MTok (Sonnet cache read) | $0.00006 |
| Demonstrated capabilities in pattern detection (output) | ~20 | $5.00/MTok (Haiku output) | $0.0001 |
| **Total craft engine per turn** | **~1120** | | **~$0.0013** |

First-turn cache write: ~800 additional cached tokens * $3.75/MTok = $0.003 (one-time).

### Session Cost Projection

| Session Profile | Turns | Craft Engine Cost | Total Session Cost |
|----------------|-------|------------------|--------------------|
| Short (5 turns) | 5 | $0.003 + 5*$0.0013 = $0.0095 | ~$0.14-0.19 |
| Medium (10 turns) | 10 | $0.003 + 10*$0.0013 = $0.016 | ~$0.28-0.38 |
| Long (20 turns) | 20 | $0.003 + 20*$0.0013 = $0.029 | ~$0.55-0.75 |

Craft engine adds ~6-8% to total session cost. Well within the $0.06/turn hard ceiling.

---

## Section 10: Execution Order

### Phase 1: Core Craft Infrastructure (1 session)

**Step 1.1: Add `demonstratedCapabilities` to CoachingSessionMemory**
- File: `profileTypes.ts`
- Add field to `CoachingSessionMemory` interface
- Verification: `npx tsc --noEmit` passes

**Step 1.2: Update pattern detection to extract demonstrated capabilities**
- File: `coachingService.ts`
- Update `detectPatternsLLM()` system prompt JSON schema
- Update parse logic for new field
- Update session memory update logic
- Update `initializeSessionMemory()` to include `demonstratedCapabilities: []`
- Verification: `npx tsc --noEmit` passes. Manual test with a multi-turn conversation shows capabilities extracted.

**Step 1.3: Append Craft Teaching Framework to system prompt**
- File: `coachingService.ts`
- Append ~600 tokens to `staticCoachingPhilosophy`
- Append ~200 tokens of Workshop Mode directives
- Verification: `npx tsc --noEmit` passes. Log system prompt length to confirm ~800 token increase.

### Phase 2: Dynamic Craft Context (1 session)

**Step 2.1: Implement `buildCraftContext()` and helpers**
- File: `coachingService.ts`
- New methods: `buildCraftContext()`, `mapFindingToTechnique()`, `buildPhaseCraftLens()`, `resolveDominantParagraph()`
- Verification: `npx tsc --noEmit` passes.

**Step 2.2: Integrate into `runStage3CoachingResponse()`**
- File: `coachingService.ts`
- Call `buildCraftContext()` after `buildProfileContextText()`
- Inject result into user prompt template
- Verification: `npx tsc --noEmit` passes. Run a coaching turn and inspect logs for craft context injection.

**Step 2.3: Add scoped authenticVsPerformed to router**
- File: `profileRouter.ts`
- Modify `assembleL6CoachingParagraph()` voiceContext section
- Verification: `npx tsc --noEmit` passes. Run paragraph-scoped coaching turn and verify voiceContext includes authenticMoments.

### Phase 3: Integration Test (1 session)

**Step 3.1: E2E coaching test with craft engine**
- Create `tests/test-craft-engine-e2e.ts`
- Test scenarios:
  - Foundation phase student asks about opening → coach gives structural craft advice
  - Craft phase student asks about sentence → coach names techniques with examples
  - Student says "help me brainstorm" → coach offers alternatives grounded in techniques
  - Student proposes draft text → coach evaluates using technique names
  - Student has demonstrated capability → coach references it ("remember the sensory threading you used earlier")
- Verification: Test passes. Coach responses include technique names, cite essay text, respect phase calibration.

**Step 3.2: Cost verification**
- Run 10-turn coaching session
- Verify per-turn cost delta is ~$0.001-0.003
- Verify no turn exceeds $0.06 hard ceiling

**Step 3.3: Voice preservation verification**
- Run coaching turn where student asks for help with ending
- Verify coach references voice anchors
- Verify suggestions stay in student's register (not generic "powerful declaration" language)

---

## Section 11: Design Debates

### Debate 1: Static Library vs Dynamic Context vs Separate LLM Call

**Options considered:**
- A: 1200-token static technique library in system prompt
- B: Zero static library, directive to use CraftAssessment as technique library
- C: Separate Sonnet call with craft-specific system prompt (~$0.02)
- D: Enhanced Stage 3 with compact static framework + dynamic context

**Decision: D (Enhanced Stage 3)**

**Why A was rejected**: 1200 tokens is too much static content. Sonnet already knows writing techniques from training. A large library wastes cache tokens on knowledge the model already possesses. What Sonnet DOESN'T have is: (a) shared vocabulary names for techniques, and (b) this student's specific profile data mapped to those techniques. A smaller library that provides names + dynamic data that provides grounding is better.

**Why B was rejected**: CraftAssessment contains essay-specific observations ("sensory detail as a strength"), NOT technique definitions ("SENSORY THREADING = using shared sensory detail to bridge scenes"). Conflating observation with instruction is conceptually confused. The LLM needs both — observations (what this student does) AND vocabulary (names for techniques to teach).

**Why C was rejected**: $0.02 per turn is 60% of the remaining budget. A separate call also produces craft guidance disconnected from the coaching dialogue — the coach has to reference craft output it didn't produce, which creates an "assistant reading from a script" quality. The best craft teaching is integrated into the coaching voice.

**Why D was chosen**: Compact framework (~600 tokens) provides technique NAMES so coach and student develop shared vocabulary. Dynamic context (~300 tokens) grounds techniques in THIS student's profile. Together they make the existing Stage 3 Sonnet call craft-aware without adding latency or cost.

### Debate 2: Explicit Mode Enum vs LLM-Inferred Modes

**Options considered:**
- A: Add `interactionMode` enum to Stage1Output (brainstorm/workshop/evaluate/etc.)
- B: Use CognitiveAssessment's free-prose `recommendedApproach` field

**Decision: B (free prose, no enum)**

**Why A was rejected**: Violates LLM-first design Rule 3 ("No closed taxonomies for LLM perception"). A 7-value enum forces the LLM to categorize fluid interaction styles into rigid bins. A student saying "I want to try something different" is simultaneously brainstorming and evaluating. An enum forces one label. Also: Stage1Output already has 14 fields. Adding another increases parse failure risk.

**Why B was chosen**: CognitiveAssessment already produces `recommendedApproach` as free prose. "Brainstorm alternatives — they want divergent exploration" is more informative than `mode: 'brainstorm'`. Session mode persistence is handled by `sessionMode` on CoachingSessionMemory (free text from pattern detection), which gets injected into Stage 1.5 for cross-turn continuity.

### Debate 3: Finding-to-Technique Mapping — Deterministic vs LLM

**Options considered:**
- A: Haiku pre-selection call that picks 2-3 techniques per finding (~$0.001)
- B: Deterministic keyword-based mapping in `mapFindingToTechnique()`
- C: Let the LLM select from vocabulary using profile context (zero cost)

**Decision: B (deterministic mapping) + C (LLM final selection)**

B provides a HINT that creates an initial association: "F3 [abrupt transition] → consider SENSORY THREADING." The hint is cheap (string matching on claim text) and frequently correct. The LLM then makes the final selection — it may override the hint based on context. This is Rule 5 compliant: soft guidance, not hard restriction.

**Why A was rejected**: $0.001 per finding per turn adds up when there are 5-10 active findings. The hint from B is "good enough" — the LLM's own reasoning about technique selection, given the profile context and the craft vocabulary, is better than a Haiku pre-selection.

### Debate 4: Technique Library Size — 10 vs 15 vs 25

**Options considered:**
- 10 techniques (original FORGE_PLAN_CONVERSATOR.md proposal)
- 15 techniques (this blueprint)
- 25 techniques (comprehensive coverage of all craft domains)

**Decision: 15 techniques**

**Why 10 was too few**: Missing admissions-specific craft (THE 4PM TEST, VALUE-ACTION GAP) and some structural craft (TEMPORAL BRIDGING, NARRATIVE COMPRESSION). These are among the most frequently needed in admissions writing.

**Why 25 was too many**: Beyond ~15, techniques start overlapping. "EMOTIONAL PREPARATION" and "EARNED ABSTRACTION" are the same principle applied to different material. "WORD-LEVEL PRECISION" is a meta-category, not a technique. Overlap creates confusion, not capability. 15 is the sweet spot: every technique is distinct, every one addresses a real recurring weakness, and the list fits in ~400 tokens.

**Why 15 was chosen**: Covers all 6 craft domains (3 transition, 3 voice, 3 emotional, 3 structural, 2 admissions + word patterns covered by SPECIFICITY ESCALATION). No overlaps. Each maps to observable profile data. Fits in cached system prompt without bloating it.

### Debate 5: Voice Preservation — Prompt-Only vs Router Enhancement vs Separate Verification Call

**Options considered:**
- A: Voice preservation directive in system prompt only
- B: Router enhancement (scoped authenticVsPerformed) + system prompt directive
- C: Separate Haiku verification call that checks suggestions against voice profile (~$0.001)

**Decision: B (router enhancement + prompt directive)**

**Why A was insufficient**: A directive without DATA is just a wish. "Preserve the student's voice" without knowing WHICH sentences are the voice anchors is unactionable. The LLM needs to SEE the authentic moments to protect them.

**Why C was rejected**: A separate verification call adds latency and cost for a quality that should be baked into the primary response. If the Stage 3 Sonnet has the voice anchors in context and the preservation directive in its system prompt, it can preserve voice natively.

**Why B was chosen**: The router already assembles voiceContext for paragraph coaching. Adding paragraph-scoped authenticVsPerformed entries is ~15 lines of code and ~20-40 tokens per turn. Combined with the system prompt directive (cached), this gives the Stage 3 Sonnet everything it needs to make voice-preserving suggestions without a separate call.

---

## Appendix: Type Interfaces

### Modified: CoachingSessionMemory

```typescript
// In profileTypes.ts — add to existing interface
export interface CoachingSessionMemory {
  turnCount: number;
  topicsDiscussed: Array<{ topic: string; turnNumbers: number[]; summary: string; resolution: string }>;
  approachesUsed: Array<{ turnNumber: number; approach: string; outcome: string }>;
  studentStances: Array<{ stance: string; turnNumber: number }>;
  sessionArcSummary: string;
  nextFocus: string;

  /** LLM-inferred session mode (free text, NOT enum). Updated by pattern detection.
   *  Examples: "brainstorming alternative openings", "workshopping P3 transition" */
  sessionMode?: string;  // From FORGE_PLAN_CONVERSATOR.md ITEM 3

  /**
   * Capabilities the student has DEMONSTRATED in this session.
   * Populated by the pattern detection Haiku call.
   * Each entry is free-text, not a fixed taxonomy.
   * Examples: "used specificity escalation in P3 revision",
   *           "identified voice shift between P2-P3 unprompted"
   */
  demonstratedCapabilities: string[];  // From FORGE_PLAN_CONVERSATOR.md ITEM 2
}
```

### No New Types Required

The Craft Engine introduces zero new interfaces. It operates entirely through:
- Extended `CoachingSessionMemory` (already planned in Conversator blueprint)
- Enhanced Stage 3 prompt text (system prompt + user prompt)
- New private methods on `CoachingService` (internal implementation detail)
- Modified `voiceContext` content in `ProfileRouter` (existing section, richer data)

This is intentional. The craft engine is an intelligence layer, not a data layer. It reads from existing profile types (CraftAssessment, VoiceMap, MomentEarnednessMap, FindingStore) and produces EPHEMERAL feedback through the coaching response. No new persistent state is needed.
