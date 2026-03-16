# Revised Improvement 9: Continuous Phase Detection

> **REVISED PROMPT — replaces IMPROVEMENT_9_CONTINUOUS_IMPROVEMENT_PHASE.md**
> Paste this entire document into a new Claude Code session. It is self-contained.
> All rigidity issues from the original spec have been fixed per LLM-first design principles.

---

## 0. Context from Cluster A Implementation

Cluster A (#1 Finding Lifecycle, #3 Bidirectional Connections) is COMPLETE. Key things that affect this implementation:

### Finding Maturity Distribution as Phase Signal

The FindingStore provides signals that complement score-based phase assessment:

- **Finding maturity distribution**: A profile where most findings are at `hypothesis` or `developing` suggests the system hasn't converged on its understanding yet — phase assessment should be tentative. A profile with many `confirmed` or `deepened` findings indicates stable understanding — phase assessment can be more decisive.
- `store.getActive()` gives all active findings to compute the maturity distribution.
- `store.getDeepDiveCandidates()` gives findings with unexplored deepening potential — if many candidates remain, the understanding phase is still evolving.

### Connection Graph Density as Coherence Signal

The connection graph provides structural coherence data for phase assessment:

- `graph.getHubs()` — hub count and density correlates with essay structural coherence. An essay with clear hubs is more architecturally mature than one with evenly-distributed weak connections.
- `graph.findStructuralIslands(totalParagraphs)` — island count is a direct signal of structural disconnection. Many islands = likely Foundation-level structure.
- `graph.activeCount` — total active connections. A 6-paragraph essay with 2 connections is structurally sparse; one with 8+ is densely connected.

### Phase Assessment Should Reference Findings

When the phase assessment LLM call explains WHY a dimension is at a particular phase level, it should reference specific findings by ID:

"Structure is at Architecture because F3 [confirmed] identifies the thesis in P1 but F7 [developing] suggests P3-P4 may be structurally disconnected (no strong connections between them per the connection graph)."

This grounds phase reasoning in actual system understanding rather than vague impressions. Use `buildCompactFindingContext(store)` to inject finding context into the phase assessment prompt.

### Type References (verified)

Finding types at `profileTypes.ts` lines 1842-2018. Connection types at lines 217-273. Key enums for phase routing:
- `FindingMaturity`: hypothesis | developing | confirmed | deepened | superseded
- `FindingCoachingValue`: critical | high | medium | contextual | diagnostic
- `ConnectionStrengthCategory`: foundational | significant | supporting | tentative

### Watch-outs

1. **Per-dimension phases should NOT use finding counts as scores**: "Voice has 3 confirmed findings, so it's at Craft" is a formula replacing judgment (Rule 1 violation). The LLM should READ the findings and JUDGE the dimension's phase. The finding count is context, not a formula input.

2. **Connection density is infrastructure context, not a phase formula**: "Fewer than 3 strong connections = Foundation structure" would be a Rule 1 violation. The graph density is context the LLM uses to inform its structural assessment, not a threshold.

3. **Dimension selection should consider finding dimensions**: If findings cluster around 'voice' and 'craft' with no 'theme' findings, the phase assessment might include 'thematic_coherence' as a dimension that needs Foundation work — the absence of thematic findings IS a signal.

---

## 1. Context

### What Exists Today

The ImprovementPhase system determines the "coaching zoom level" — at Foundation, coaching focuses on thesis and arc; at Distinction, coaching focuses on what makes the essay unforgettable. The phase is a FILTER on feedback, not a limiter on analysis. Understanding + scoring are always comprehensive; the phase shapes what gets surfaced to the student.

**Current implementation**: `computeImprovementPhase()` in `src/services/essayIntelligence/analysis/analysisPass.ts` (lines 676-789). The entire function is a deterministic formula replacing LLM judgment. Specifically:

1. **Hardcoded thresholds create cliff effects**: `avgParagraph < 55` = Foundation, `< 68` = Architecture, `< 78` = Craft, `< 88` = Polish, else Distinction. An essay at 54.9 average is Foundation; at 55.1 it's Architecture. The 0.2-point difference triggers a completely different coaching approach. These boundaries are arbitrary — no pedagogical theory says 55 is the dividing line between "needs structural work" and "structure is emerging."

2. **Single-axis phase collapses multi-dimensional reality**: One `level` for the whole essay. But an essay at Foundation for structure and Craft for voice is extremely common — most student writers have uneven strengths. The system collapses this into a single level, losing the most important diagnostic signal.

3. **Formula-computed readiness scores are meaningless**: `readiness.essayLevel = Math.round(Math.min(avgParagraph + 10, 75))` is pure arithmetic. The LLM knows whether the essay-level architecture is ready for paragraph-level coaching; a formula adding 10 to the average score does not.

4. **Static focusAreas and deferredAreas are templates, not assessments**: Hardcoded string arrays per phase level. The actual focus areas depend on THIS essay's specific situation, not on what "Foundation" generically means.

5. **No essay type awareness**: A 150-word supplement and a 650-word personal statement are assessed with the same thresholds. But "Foundation for a supplement" (not answering the prompt) is fundamentally different from "Foundation for a personal statement" (unclear thesis).

### Rigidity Issues Fixed From Original Spec

The original IMPROVEMENT_9 spec contained these rigidity violations:

- **RED: `computeImprovementPhase()` deterministic formula** — The entire function is a cascade of hardcoded thresholds and arithmetic readiness scores. Completely eliminated. The LLM assesses phase per-dimension with prose reasoning; the system tracks the assessment.

- **RED: `readiness` computed from arithmetic formulas** — `essayLevel = Math.round(Math.min(avgParagraph + 10, 75))` etc. Replaced with LLM-assessed prose readiness that describes what the essay IS ready for and ISN'T ready for in coaching terms.

- **RED: `ESSAY_TYPE_WEIGHTS` lookup table** — The original spec mentioned fixed dimension weights per essay type (e.g., "personal statements weight voice at 0.25"). Not yet in code but planned. Eliminated. Essay type influences phase assessment through the LLM's contextual judgment, not through a lookup table. When PLAN2's ReadingStrategy is available, it replaces type weights entirely.

- **ORANGE: Static `focusAreas` and `deferredAreas` per phase** — Template string arrays ("Thesis clarity", "Basic narrative arc") that ignore the essay's specific situation. Replaced with LLM-generated focus areas specific to THIS essay's dimension phase mix.

- **RED: `phaseInfluencedModeSelection()` deterministic routing** — Even the revised version with `'let_llm_decide'` smuggles determinism. A Foundation + structural edit doesn't always need comprehensive re-analysis (e.g., fixing THE thesis is surgical, not cascading). DELETED entirely. Replaced with phase context injected into the impact classifier's prompt — the LLM decides with full context.

- **GREEN: Per-dimension phase assessment** — Kept. The core insight that an essay has different readiness levels for different dimensions is sound and is the primary contribution of this improvement.

- **GREEN: Phase transitions as learning signals** — Kept. Phase transitions are milestones the student should feel and the coaching layer should celebrate.

- **RED: `getPhaseGrowthGuidance()` function** — Static `suggestedMaxDives` + `priorityDomains[]` per phase conflicts with #7's design where L3.75's curated question queue IS the dispatch priority. DELETED entirely. Replaced with phase context injected into L3.75's question curation prompt.

- **GREEN: 5 phase levels (foundation/architecture/craft/polish/distinction)** — Kept as system routing tags (Rule 6). These are routing signals for the feedback layer, not analytical judgments.

### Relationship to Improvement #2

Improvement #2 (Anti-Clustering Scoring Validation) proposes replacing `computeImprovementPhase()` with a Haiku-based assessment. This improvement goes DEEPER — it defines:
- What phase MEANS across multiple dimensions
- How per-dimension phase asymmetry works
- How essay type detection feeds into phase assessment
- How phase transitions become learning signals
- How the coaching lens concept replaces hard focus/deferred blocklists
- How phase interacts with the growth engine
- How readiness becomes prose instead of numbers

If Improvement #2 has already been implemented (replacing the formula with a basic Haiku call), this improvement EXTENDS that call with per-dimension assessment, essay type context, reading strategy integration, and transition detection.

If Improvement #2 has NOT been implemented, this improvement includes the formula removal as a prerequisite step.

### Where This Improvement Fits

```
L3.5 Analysis Pass (scores) → Phase Assessment (THIS IMPROVEMENT) → L4 Crystallizer → L5 Feedback → L6 Coaching
```

The phase assessment sits between scoring and crystallization. It reads the scores (from L3.5), the holistic synthesis (from L3.75), and the profile context to determine:
- Where the essay stands on each relevant dimension
- What coaching would help most right now
- What the feedback layer should focus on and how to frame it
- Whether a phase transition has occurred (for celebration/acknowledgment)

### Key Files

- `src/services/essayIntelligence/analysis/analysisPass.ts` — Contains `computeImprovementPhase()` (to be replaced)
- `src/services/essayIntelligence/profileTypes.ts` — ImprovementPhase type definition (to be rewritten)
- `src/services/essayIntelligence/analysis/focusedAnalyzer.ts` — Uses `computeImprovementPhase()` (to be updated)
- `src/services/essayIntelligence/coaching/coachingService.ts` — Consumes phase for coaching lens (to be updated)
- `src/services/essayIntelligence/analysis/deepAnnotationService.ts` — Consumes phase for annotation granularity (to be updated)

---

## 2. Design Principles Applied

### Rule 1: The LLM Owns All Judgment — The System Tracks and Organizes

Phase assignment is a contextual judgment. The LLM reads the understanding, scoring, and holistic synthesis and says "Structure is at Foundation because the thesis is unclear and paragraphs don't have defined roles. Voice is at Craft because the writer has a distinctive register that's consistent but not yet precise." The system tracks this per-dimension assessment and derives routing signals from it.

**Litmus test applied:**
- `assessPhase()` — LLM call that produces the phase assessment. LLM judgment. PASS.
- `detectTransition()` — Compares two LLM-produced assessments and records the difference. System tracking. PASS.
- `getPhaseGrowthGuidance()` — DELETED. Static phase→domain mapping conflicts with L3.75's curated dispatch. Phase context now flows as prompt input to L3.75's question curation.
- `computeImprovementPhase()` with hardcoded thresholds — Deterministic formula replacing contextual judgment. FAIL. Eliminated.
- `readiness.essayLevel = Math.round(Math.min(avgParagraph + 10, 75))` — Arithmetic replacing LLM assessment. FAIL. Eliminated.

### Rule 2: Never Discard Paid LLM Output

If the phase assessment says "Voice is at Distinction" but the overall phase is Foundation (because structure drags it down), the voice phase assessment is STILL STORED AND AVAILABLE. The feedback layer can produce Distinction-quality voice coaching even while focusing primarily on structural issues.

Per-dimension phases are ALL kept, regardless of the overall phase. The overall phase is a routing convenience; the per-dimension phases are the full picture.

### Rule 3: No Closed Taxonomies

The phase dimensions are NOT a fixed enum. The LLM assesses whichever dimensions are RELEVANT to THIS essay. A 150-word supplement about "why this school" might only need {specificity, structure, distinctiveness}. A 650-word personal statement about loss might need {structure, voice, emotional_depth, earned-ness, craft, thematic_coherence}.

The LLM chooses dimensions based on the essay's content and type. The system stores whatever dimensions the LLM identifies. Downstream consumers iterate over the array without assuming which dimensions exist.

Common dimensions (for prompt guidance, not constraints): structure, voice, craft, emotional_depth, earned-ness, thematic_coherence, distinctiveness, specificity. But the LLM can identify "narrative_pacing" or "tonal_consistency" or "argument_density" if those are what THIS essay needs.

### Rule 4: No Whack-a-Mole Pattern Matching

No formula-based phase detection. No threshold cascades. No regex patterns for thesis clarity. No keyword matching for structural coherence. The LLM reads the actual scoring results and holistic synthesis and makes a judgment.

### Rule 5: Soft Guidance Over Hard Blocklists

Phase shapes HOW coaching is delivered, not WHETHER a dimension is addressed. The coaching lens is prompt guidance for the feedback layer, not a filter that blocks annotations.

A Foundation-phase essay can still receive a devastating voice insight if the teaching moment is powerful enough. A Distinction-phase essay can receive structural feedback if the conclusion undercuts the opening. The phase tells the LLM where to FOCUS attention and how to FRAME coaching. It does not tell it what to EXCLUDE.

### Rule 6: System Infrastructure for Operational Concerns

- The 5 phase levels (foundation/architecture/craft/polish/distinction) are system routing tags, not analytical judgments. They map to downstream behavior (annotation granularity, coaching frame).
- Phase transition tracking is system bookkeeping — recording what the LLM assessed changed.
- Phase context flows into downstream LLM prompts (impact classifier, L3.75 question curation) as soft context — not as deterministic functions.

---

## 3. Core Architecture

### What the LLM Produces vs. What the System Manages

**LLM produces (all judgment lives here):**
- Which dimensions are relevant for THIS essay
- Per-dimension phase level with prose reasoning and coaching approach description
- Overall phase synthesis explaining WHY this level (not formula-derived)
- Essay-specific focus areas and deferred areas (not template strings)
- Coaching lens guidance: how the feedback layer should approach this essay right now
- Readiness assessment in prose: what coaching the essay IS and ISN'T ready for
- Phase transition detection: whether the essay has genuinely moved to a new level
- Transition celebration notes and unlock descriptions

**System manages (all infrastructure lives here):**
- Scheduling the phase assessment Haiku call after scoring
- Storing per-dimension phases on the profile
- Tracking phase history (prior assessments)
- Phase-to-growth-guidance mapping (soft operational guidance)
- Phase-to-analysis-mode suggestions (soft operational routing)
- Passing coaching lens guidance to downstream prompts
- Cost and timing tracking

### Type Changes: Rewritten ImprovementPhase

The existing `ImprovementPhase` interface is rewritten to support per-dimension assessment:

```typescript
/**
 * Revised ImprovementPhase — per-dimension assessment with overall synthesis.
 *
 * The LLM determines which dimensions are relevant to THIS essay.
 * It does not assess a fixed set — a supplement about community service
 * might be assessed on {structure, specificity, distinctiveness} while a
 * personal statement about loss might be assessed on {structure, voice,
 * emotional_depth, earned-ness, craft}.
 *
 * The overall phase is the LLM's synthesis, NOT a formula average.
 * An essay with Foundation structure but Craft voice gets an overall
 * phase based on which dimension most needs coaching attention right now.
 */
export interface ImprovementPhase {
  /** Overall phase — where does coaching attention go? */
  level: ImprovementPhaseLevel;

  /** Why this overall phase (LLM reasoning, not formula) */
  reasoning: string;

  /**
   * Per-dimension phase assessments.
   * Dimensions are LLM-chosen (not a fixed enum).
   * Typical dimensions: structure, voice, craft, emotional_depth,
   * earned-ness, thematic_coherence, distinctiveness, specificity.
   * But the LLM can identify novel dimensions for unusual essays.
   */
  dimensionPhases: Array<{
    /** LLM-chosen dimension name */
    dimension: string;
    /** Phase for this dimension */
    phase: ImprovementPhaseLevel;
    /** Why this phase for this dimension — cites specific evidence */
    reasoning: string;
    /** What coaching at this phase looks like for this dimension */
    coachingApproach: string;
  }>;

  /**
   * What to focus on NOW — derived from the per-dimension assessment.
   * NOT a template — specific to THIS essay's dimension phase mix.
   */
  focusAreas: string[];

  /**
   * What exists but isn't the priority right now.
   * Specific to THIS essay — not generic phase templates.
   */
  deferredAreas: string[];

  /**
   * Coaching lens guidance — the paragraph the feedback layer receives
   * about HOW to coach this essay right now. This replaces hardcoded
   * phase-to-focus mappings in the coaching prompt.
   */
  coachingLensGuidance: string;

  /**
   * Readiness assessment in prose — what the essay IS and ISN'T ready for.
   * Replaces the old numeric readiness (essayLevel, paragraphLevel, etc.)
   * with LLM-assessed coaching-terms description.
   */
  readiness: PhaseReadiness;

  /**
   * Essay type context — how the type influences phase assessment.
   */
  essayTypeContext: {
    detectedType: EssayType;
    typeInfluence: string;
  };
}

/**
 * Phase readiness — LLM-assessed prose instead of numeric levels.
 */
interface PhaseReadiness {
  /**
   * Overall readiness assessment in coaching terms.
   *
   * Example: "The essay's structure is ready for paragraph-level coaching —
   * the thesis is clear and the arc makes sense, though P2 and P3 feel
   * interchangeable. Voice is ready for sentence-level craft work in
   * P4-P5 where it's strongest. P0 and P6 are not ready for craft
   * coaching because the voice there is performed, not genuine —
   * structural voice work (finding the authentic register) comes first."
   */
  assessment: string;

  /**
   * Per-dimension readiness — what KIND of coaching each dimension
   * is ready for, expressed in coaching terms not numbers.
   */
  dimensionReadiness: Array<{
    dimension: string;
    readyFor: string;    // e.g., "paragraph-level structural coaching"
    notReadyFor: string; // e.g., "sentence-level craft refinement"
  }>;
}

/**
 * Phase transition record — stored in profile for coaching celebration
 * and historical tracking.
 */
interface PhaseTransition {
  /** Phase before the transition */
  from: ImprovementPhaseLevel;
  /** Phase after the transition */
  to: ImprovementPhaseLevel;
  /** What triggered the reassessment */
  trigger: 'edit' | 'reanalysis' | 'coaching';
  /** Specific dimensions that drove the transition */
  drivingDimensions: string[];
  /** What the student did that earned the transition (LLM-assessed) */
  whatEarned: string;
  /** What to celebrate in coaching (LLM-assessed) */
  celebrationNote: string;
  /** What the new phase unlocks for coaching (LLM-assessed) */
  whatOpensUp: string;
  /** ISO timestamp */
  timestamp: string;
}
```

### Phase as Coaching Lens, Not Quality Gate

The current system treats phase as a blocklist: Foundation = only structural feedback. This violates Rule 5.

The revised design treats phase as a LENS: Foundation = PRIORITIZE structural feedback, but use moments from any dimension when the teaching opportunity is powerful enough.

The coaching lens is a prompt paragraph that the feedback layer receives. It shapes attention and framing, not inclusion/exclusion:

```
At FOUNDATION for structure: focus on what the essay is TRYING to say.
Don't critique sentence craft yet — the sentences will change when the
structure changes. But if you see a brilliant sentence-level moment,
MENTION IT. It shows the student what they're capable of.

At CRAFT for voice: the writer has a distinctive register. Help them
make it consistent. "This sentence has your strongest voice — the
casual precision of 'shuffled the papers like they owed me money.'
Can P2S3 match that register?"

At DISTINCTION: the essay is polished. What makes it UNFORGETTABLE?
"This is the sentence an AO would quote to a colleague. Can it be
even more precise?"
```

### Essay Type Detection

Essay type influences phase expectations. The system uses database metadata when available and lets the LLM infer type from content when metadata is absent or ambiguous.

Why type matters for phase:
- **Personal statements** (650 words): Voice, emotional depth, and earned-ness matter enormously. Structure expectations are flexible — unconventional structure that serves the narrative is valid.
- **Supplements** (150-350 words): Every sentence must work harder. Specificity and structural efficiency are paramount. Extended emotional development is impractical in 150 words.
- **PIQ** (350 words): Tight word count demands compression. Distinctiveness within a constrained format is the primary challenge.

The phase assessment prompt receives essay type as context and adjusts expectations accordingly. "Foundation for a supplement" means "not answering the prompt." "Foundation for a personal statement" means "unclear thesis." These are different problems requiring different coaching.

### Reading Strategy Integration

When PLAN2's ReadingStrategy is available (from L3.75), it replaces essay type weights entirely as the source of "what matters for THIS essay." The ReadingStrategy is the LLM's discovery of what THIS specific essay rewards attention to.

The phase assessment receives the ReadingStrategy as optional context:

```
If the reading strategy says "this essay rewards attention to vocabulary
domain shifts," then voice/craft dimensions get heightened importance
in the phase assessment. If it says "this is NOT a trauma essay," don't
assess emotional_depth as if processing trauma is the goal.
```

This is additive — if no ReadingStrategy exists (L3.75 hasn't run or didn't produce one), the phase assessment works fine with just essay type and scoring results.

### Phase Transitions as Learning Signals

A phase transition (Foundation to Architecture, Architecture to Craft, etc.) is a milestone the student should FEEL. It represents genuine progress — the essay has moved to a new level of readiness for deeper coaching.

**The noise problem:** Small score changes across a re-analysis could trigger false transitions if we used threshold detection. The solution: phase transitions are LLM-judged, not threshold-computed. The Haiku call reads the actual scoring and holistic synthesis and assesses whether the essay has GENUINELY moved to a new level, not whether a number crossed a line.

**The regression problem:** Phase can also REGRESS — if a structural edit breaks what was working, the essay might move from Architecture back to Foundation. Regressions are NOT failures; they're the natural cost of ambitious revision. The coaching layer should frame them honestly: "The rewrite opened new structural possibilities but temporarily destabilized the arc. That's a sign of growth — you're reaching for something better."

**Transition metadata:** When a transition is detected, the LLM produces:
- What the student did that earned it (specific)
- Which dimensions drove the change (specific)
- A celebration note for the coaching layer
- What the new phase unlocks for deeper coaching

This metadata is stored in `ProfileIndex.phaseHistory` and surfaced to L6 coaching.

---

## 4. Deeper Design

### Per-Dimension Phase Asymmetry

An essay at Foundation for structure but Craft for voice is not an edge case — it is the COMMON case. Most student writers have uneven strengths. A writer with a beautiful, distinctive voice who has no idea how to organize an essay is typical, not unusual.

**The overall phase question:** What should the "overall phase" be when dimensions differ?

The overall phase is determined by what coaching would HELP MOST right now. This is a judgment call the LLM makes based on:

1. **Which low-phase dimension is most critical for this essay type?** If structure is at Foundation, it usually dominates — structural problems make voice and craft improvements moot because the paragraphs will change when the structure changes. But if the low-phase dimension is non-critical (e.g., emotional_depth at Foundation for a technical supplement), it doesn't dominate.

2. **Where is the student's energy best invested?** Sometimes the coaching opportunity is in the strong dimension, not the weak one: "Your voice is remarkable — let's make sure the structure lets it sing." This frames structural work as enabling voice, not as a deficiency.

3. **What would a ONE-SESSION coaching interaction focus on?** The overall phase should answer: "If I could give this student one coaching session right now, what zoom level would help them most?"

The LLM synthesizes these considerations. The system stores both the overall phase AND the per-dimension phases. The feedback layer uses the overall phase for general framing and the per-dimension phases for dimension-specific zoom levels.

### Phase Transitions: Preventing Noise

**The threshold problem revisited:** In the current system, moving from 54.9 to 55.1 average paragraph score triggers a phase transition. This is noise, not signal. The student didn't DO anything — the LLM just scored slightly differently on re-analysis.

**The LLM-judged solution:** The Haiku call that assesses phase also detects transitions. It compares the current assessment to the prior phase and asks: "Has the essay's readiness for deeper coaching genuinely changed?"

The prompt is explicit about noise prevention:

```
A phase transition should reflect GENUINE QUALITATIVE CHANGE, not
score noise. An essay doesn't move from Foundation to Architecture
because its average went from 54 to 56. It moves because the thesis
has clarified, the paragraphs have found their roles, and structural
work is now productive.

When comparing to the prior phase assessment, ask: "Has the essay's
readiness for deeper coaching genuinely changed, or have the scores
just fluctuated?"
```

This means the Haiku must have access to the prior phase assessment AND the current scoring results. It makes a contextual judgment about whether genuine qualitative change has occurred.

### Phase and Re-Analysis Cost

Phase should influence analysis mode selection: Foundation essays need comprehensive re-analysis more often (structural changes cascade), while Distinction essays need focused re-analysis (changes are localized).

**DELETED: `phaseInfluencedModeSelection()`** — This was a deterministic function mapping (phase × editScope) → analysis mode. Even with the `'let_llm_decide'` escape hatch, the "clear-cut" cases aren't actually clear-cut. A Foundation-phase structural edit that FIXES the thesis (the one structural problem) may NOT need comprehensive re-analysis. Context matters; the function can't capture it.

**Replacement:** Phase context is injected into the **impact classifier's prompt** (the Haiku call in the focused analysis pipeline). The classifier already receives the edit + profile context. Adding the current phase:

```
PHASE CONTEXT FOR MODE SELECTION:
Current phases: ${dimensionPhases.map(d => `${d.dimension}: ${d.phase}`).join(', ')}
Overall coaching priority: ${phase.level}

Consider phase when assessing impact scope:
- Foundation-phase structural edits tend to cascade widely
- Craft/Polish-phase word edits tend to be localized
- But a surgical edit that fixes THE structural problem at Foundation
  may not need comprehensive re-analysis — use your judgment about
  what THIS specific edit actually changes
```

The LLM classifier makes the call with full context. No function. No mapping table.

### Phase and the Growth Engine

Phase and convergence are separate signals that interact:

- **Convergence** = "Is the system still learning new things about this essay?" (L3.75's self-assessed judgment)
- **Phase** = "What level of coaching is the essay ready for?" (feedback zoom)

A Distinction-phase essay might still need growth cycles if the system hasn't explored its emotional subtext or intent-text gap. Conversely, a Foundation-phase essay might converge quickly if the structural issues are obvious and fully understood.

**DELETED: `getPhaseGrowthGuidance()`** — This was a static mapping of phase → `{suggestedMaxDives, priorityDomains[]}`. It conflicts with #7's design where L3.75's curated question queue IS the dispatch priority. If L3.75 curates a voice question at Foundation, a `priorityDomains: ['structural_necessity']` array either gets ignored (pointless) or overrides L3.75 (harmful).

**Replacement:** Phase context is injected into **L3.75's question curation prompt**. During re-analysis (when a prior phase exists), L3.75 receives:

```
PHASE CONTEXT (from most recent assessment):
${dimensionPhases.map(d => `${d.dimension}: ${d.phase} — ${d.reasoning}`).join('\n')}
Overall: ${phase.level} — ${phase.reasoning}

This context tells you where coaching attention is focused. When curating
questions for deep dives, consider whether your questions serve the coaching
priority. A Foundation essay benefits more from structural investigation
than word-precision analysis — but if you see a genuine craft question
that would unlock structural understanding, curate it. Your judgment.
```

L3.75 curates what matters given the essay, the phase, and the reading strategy. No `suggestedMaxDives`. No `priorityDomains` array. The dispatch in #7 follows L3.75's queue within budget.

### The Readiness Revolution

The current `readiness` is 4 numbers: `{ essayLevel: number, paragraphLevel: number, sentenceLevel: number, wordLevel: number }`. These are computed from arithmetic formulas and consumed by the UI for display.

The problem: what does "essayLevel: 63" mean to a student? Nothing. What does "paragraphLevel: 72" mean? Nothing actionable.

The replacement: LLM-assessed prose that describes readiness in coaching terms:

```
"The essay's structure is ready for paragraph-level coaching —
the thesis is clear and the arc makes sense, though P2 and P3 feel
interchangeable. Voice is ready for sentence-level craft work in
P4-P5 where it's strongest. P0 and P6 are not ready for craft
coaching because the voice there is performed, not genuine —
structural voice work (finding the authentic register) comes first."
```

This is dramatically more informative than 4 numbers. It tells the student (and the coaching layer) EXACTLY what's ready for improvement and what isn't, with specific paragraph references.

Per-dimension readiness adds more precision:

```typescript
dimensionReadiness: [
  { dimension: "structure", readyFor: "paragraph-level role clarification", notReadyFor: "micro-structural transitions" },
  { dimension: "voice", readyFor: "sentence-level craft refinement in P4-P5", notReadyFor: "whole-essay voice consistency (P0/P6 still performed)" },
  { dimension: "emotional_depth", readyFor: "exploring the P3 vulnerability", notReadyFor: "emotional arc coaching (the arc depends on structural decisions not yet made)" },
]
```

### Backward Compatibility: readiness Migration

The old `readiness` type is `{ essayLevel: number, paragraphLevel: number, sentenceLevel: number, wordLevel: number }`. Some UI code may depend on these numbers.

**Migration strategy:**
1. The new `ImprovementPhase` interface uses `readiness: PhaseReadiness` (prose-based)
2. For backward compatibility during transition, add an optional `legacyReadiness?: { essayLevel: number, paragraphLevel: number, sentenceLevel: number, wordLevel: number }` that the phase assessment function can populate with rough approximations derived from the overall phase level
3. Update UI consumers to use the prose readiness when available, falling back to legacy numbers
4. Remove `legacyReadiness` once all consumers are updated

---

## 5. Prompt Engineering

### Phase Assessment Prompt (Complete Haiku Call)

This is the complete Haiku call that replaces `computeImprovementPhase()`. It runs after L3.5 scoring completes.

```
You are assessing an essay's improvement phase — where it stands and
what coaching would help most right now.

You receive:
1. Per-paragraph scoring results (effectiveness scores, sentence analyses,
   strengths/weaknesses, paragraph verdicts)
2. Holistic synthesis (voice identity, emotional topography, thematic
   architecture, narrative strategy, character revelation, craft assessment)
3. Essay type and word count
4. Reading strategy (if available — what this essay rewards attention to)
5. Prior phase assessment (if this is a re-analysis)

YOUR ASSESSMENT PROCESS:

STEP 1: IDENTIFY RELEVANT DIMENSIONS for this essay.
Typical dimensions: structure, voice, craft, emotional_depth,
earned-ness, thematic_coherence, distinctiveness, specificity.

NOT all essays need all dimensions. Choose dimensions based on what
THIS essay is trying to do:
- A 150-word "why this school" supplement might only need
  {specificity, structure, distinctiveness}
- A 650-word personal statement about loss might need
  {structure, voice, emotional_depth, earned-ness, craft, thematic_coherence}
- An argumentative supplement might need
  {structure, argument_density, evidence_quality, specificity}

You are not limited to the "typical" list. If this essay needs
assessment on "narrative_pacing" or "tonal_consistency" or "argument_density,"
use those dimensions.

STEP 2: ASSESS EACH DIMENSION'S PHASE.
For each dimension, determine the phase level:

- foundation: needs fundamental directional or structural work.
  The essay doesn't yet know what it's trying to say, or its
  fundamental approach to this dimension is misguided.

- architecture: direction is clear, organization needs sharpening.
  The essay knows what it's trying to do but the execution plan
  for this dimension needs work.

- craft: organization is solid, execution needs attention.
  The plan is good; now the writing itself needs to be better.

- polish: execution is strong, fine-grained refinement will elevate.
  The writing works; now make it sing.

- distinction: the essay is polished on this dimension. Focus on
  what makes it unforgettable — the difference between good and
  great, between admissible and memorable.

For each dimension, state WHY you assigned this phase level.
Cite specific evidence from the scoring and holistic synthesis:
- Quote specific paragraph/sentence scores that inform your assessment
- Reference specific holistic synthesis observations
- Name specific strengths or weaknesses that define the phase

STEP 3: SYNTHESIZE AN OVERALL PHASE.
Which dimension most needs coaching attention right now? That
dimension's phase is usually the overall phase.

But consider:
- If the lowest-phase dimension is non-critical for this essay type
  (e.g., emotional_depth at Foundation for a technical supplement),
  the overall phase might be determined by more relevant dimensions.
- If one dimension is dramatically ahead of others (voice at Distinction
  while everything else is at Architecture), the coaching might LEAD
  with the strong dimension: "Your voice is remarkable — let's build
  a structure that lets it sing."

Your overall phase should answer: "If I could give this student ONE
coaching session right now, what zoom level would help them most?"

STEP 4: DESCRIBE THE COACHING LENS.
Write 2-4 sentences describing how the feedback layer should approach
this essay right now. This paragraph will be injected directly into
the L5 feedback prompt as coaching guidance.

Include:
- Where to FOCUS attention (primary)
- Where to MENTION but not belabor (secondary)
- How to FRAME observations at this phase level
- Any dimension-specific zoom level differences
  (e.g., "Structural feedback at Architecture level;
  voice feedback at Craft level — help them see that their
  authentic register in P4-P5 can extend to P0-P2")

IMPORTANT: The coaching lens is guidance, not a blocklist.
If you see a devastating teaching moment that transcends the current
phase, USE IT. The phase tells you where to focus, not what to exclude.

STEP 5: ASSESS READINESS.
Describe what level of coaching the essay is ready for.
Express in coaching terms, not numbers.

Per-dimension, describe:
- What it IS ready for: "paragraph-level structural coaching"
- What it ISN'T ready for: "sentence-level craft refinement"

STEP 6: ESSAY TYPE CONTEXT.
Database type: ${essayType ?? 'unknown'}
Word count: ${wordCount}
Paragraph count: ${paragraphCount}

If the database type is available, use it. If not, infer from content
and word count:
- 500-650 words, personal narrative → personal_statement
- 100-350 words, specific school/program/value → supplement
- 300-350 words, specific PIQ prompt response → piq

Describe how essay type influences your phase assessment:
- "Foundation for a supplement" means something different than
  "Foundation for a personal statement." A supplement's structure
  problem might be "not answering the prompt" while a personal
  statement's might be "unclear thesis."
- A supplement at Distinction focuses on density and precision.
  A personal statement at Distinction focuses on voice and memorability.

${readingStrategy ? `
READING STRATEGY CONTEXT (from L3.75):
${readingStrategy.strategy}
Best approach: ${readingStrategy.bestApproach}
Anti-patterns: ${readingStrategy.antiPatterns.join('; ')}

Use this reading strategy to weight your dimension assessment. If the
strategy says "this essay rewards attention to vocabulary domain shifts,"
then voice/craft dimensions get heightened importance. If it says "this
is NOT a trauma essay," don't assess emotional_depth as if processing
trauma is the goal.
` : ''}

${priorPhase ? `
STEP 7: DETECT PHASE TRANSITION.
Prior overall phase was: ${priorPhase.level}
Prior dimension phases: ${priorPhase.dimensionPhases.map(d => `${d.dimension}=${d.phase}`).join(', ')}

Has the essay genuinely moved to a new phase? A phase transition should
reflect GENUINE QUALITATIVE CHANGE, not score noise.

An essay doesn't move from Foundation to Architecture because its
average went from 54 to 56. It moves because the thesis has clarified,
the paragraphs have found their roles, and structural work is now
productive.

Ask: "Has the essay's readiness for deeper coaching genuinely changed,
or have the scores just fluctuated?"

If the essay HAS transitioned:
- What did the student do that earned this? (Be specific)
- Which dimension improvements drove it?
- What does the new phase unlock?
- Write a celebration note that the coaching layer can use to
  acknowledge the student's progress. Make it specific to what
  they actually improved, not generic ("Great job!").

Phase can also REGRESS — if a structural edit breaks what was working.
If it has:
- What happened? (The rewrite destabilized the arc, etc.)
- Frame honestly. Regression from ambitious revision is not failure.
  "The rewrite opened new structural possibilities but temporarily
  destabilized the arc. That's a sign of growth — you're reaching
  for something better."

AVOID noise transitions. If the essay hasn't genuinely changed its
readiness for deeper coaching, don't declare a transition just because
scores moved slightly.
` : ''}

OUTPUT JSON:
{
  "dimensionPhases": [
    {
      "dimension": "string — your chosen dimension name",
      "phase": "foundation" | "architecture" | "craft" | "polish" | "distinction",
      "reasoning": "string — why this phase, citing specific evidence",
      "coachingApproach": "string — what coaching at this phase looks like for this dimension"
    }
  ],
  "overallPhase": {
    "level": "foundation" | "architecture" | "craft" | "polish" | "distinction",
    "reasoning": "string — why this overall phase (NOT formula, cite evidence)",
    "focusAreas": ["string — essay-specific, NOT templates"],
    "deferredAreas": ["string — essay-specific, NOT templates"],
    "coachingLensGuidance": "string — 2-4 sentences for the feedback layer"
  },
  "readiness": {
    "assessment": "string — prose readiness description",
    "dimensionReadiness": [
      {
        "dimension": "string",
        "readyFor": "string — what coaching this dimension IS ready for",
        "notReadyFor": "string — what coaching this dimension ISN'T ready for"
      }
    ]
  },
  "essayTypeContext": {
    "detectedType": "personal_statement" | "supplement" | "piq",
    "typeInfluence": "string — how type influences phase expectations"
  }
  ${priorPhase ? `,
  "phaseTransition": {
    "transitioned": true | false,
    "from": "string — prior overall phase (only if transitioned)",
    "to": "string — new overall phase (only if transitioned)",
    "drivingDimensions": ["string — which dimensions drove the change"],
    "whatEarned": "string — what the student did",
    "celebrationNote": "string — for coaching to use",
    "whatOpensUp": "string — what deeper coaching is now possible"
  }` : ''}
}
```

### Coaching Lens in L5 Feedback Prompt

This is the prompt section injected into L5 (feedback/annotations) to shape coaching behavior:

```
## YOUR COACHING LENS (from phase assessment)

Overall phase: ${phase.level}
Coaching guidance: ${phase.coachingLensGuidance}

Dimension detail:
${phase.dimensionPhases.map(d =>
  `- ${d.dimension}: ${d.phase} — ${d.coachingApproach}`
).join('\n')}

Readiness: ${phase.readiness.assessment}

REMEMBER: Phase is guidance, not a blocklist. Focus your attention
where the phase directs, but use moments from ANY dimension when
the teaching opportunity is powerful enough.

At FOUNDATION: focus on what the essay is TRYING to say. Don't critique
sentence craft yet — but if you see a brilliant sentence that shows
what the writer is capable of, MENTION it. Hope is a teaching tool.

At ARCHITECTURE: the essay knows what it's saying. Help it organize.
"P2 and P3 are doing the same work — what if P3 went deeper instead
of repeating P2's move?"

At CRAFT: the architecture is sound. Surface sentence-level work.
"This sentence tells when it could show. What specific image would
carry this feeling?"

At POLISH: the craft is strong. Word-level precision. Rhythm. Cadence.
"Replacing 'walked' with 'shuffled' changes the reader's picture."

At DISTINCTION: the essay is polished. What makes it UNFORGETTABLE?
"This is the sentence an AO would quote. Can it be even more precise?"

${latestTransition ? `
PHASE TRANSITION MILESTONE:
The student just earned a phase transition: ${latestTransition.from} → ${latestTransition.to}
What they did: ${latestTransition.whatEarned}
Celebration: ${latestTransition.celebrationNote}
What opens up: ${latestTransition.whatOpensUp}

Acknowledge this milestone naturally in your coaching. The student
should feel their progress. Don't overdo it — genuine, specific
recognition is more powerful than generic praise.
` : ''}
```

### Coaching Lens in L6 Coaching (Conversation) Prompt

```
## COACHING PHASE CONTEXT

The essay is at ${phase.level} phase overall.

Dimension breakdown:
${phase.dimensionPhases.map(d =>
  `${d.dimension}: ${d.phase} (${d.coachingApproach})`
).join('\n')}

This shapes your conversation approach:
- Lead with questions about ${phase.focusAreas[0]}
- Acknowledge strength in ${highestDimension} (at ${highestPhase})
- Defer deep discussion of ${phase.deferredAreas[0]} unless the student brings it up

${latestTransition ? `
The student just earned a phase transition. Find a natural moment
in the conversation to acknowledge their progress:
"${latestTransition.celebrationNote}"
` : ''}

${phase.readiness.assessment}
```

### Token Budget Estimate

**Phase assessment Haiku call:**
- Input: scoring results (~1000-2000 tokens) + holistic synthesis summary (~500-1000 tokens) + prior phase (~200 tokens if re-analysis) + reading strategy (~200 tokens if available) + system prompt (~1200 tokens)
- Total input: ~3000-4600 tokens
- Output: phase assessment JSON (~400-800 tokens)
- Cost per call: ~$0.001-0.003

**Note:** If combined with Improvement #2's Haiku recalibration call, the combined cost is still ~$0.002-0.005 total (the calls share input context).

---

## 6. Integration Points

### With Improvement #2 (Anti-Clustering Scoring Validation)

Improvement #2 proposes a Haiku recalibration call that assesses phase + consistency. This improvement EXTENDS that call with:
- Per-dimension phase assessment (not just overall phase)
- Essay type context and influence
- Reading strategy integration
- Phase transition detection with celebration metadata
- Prose readiness instead of numeric readiness

If implementing both improvements, they share a single Haiku call. The prompt from this improvement includes all of Improvement #2's consistency checking plus the per-dimension phase assessment. Net cost: ~$0.002-0.005 for the combined call.

Better-calibrated scores from Improvement #2 (anchor-based calibration, confidence metadata) produce more accurate phase assessments. Confidence metadata enables phase confidence: if many scores are low-confidence, the phase assessment itself should carry lower certainty in its reasoning.

### With Improvement #4 (Contradiction Mining)

The crystallizer's coaching map priorities should be phase-aware:
- At Foundation: coaching map focuses on structural priorities
- At Craft: coaching map focuses on sentence-level improvements
- At Distinction: coaching map focuses on what makes the essay unforgettable

The crystallizer receives the ImprovementPhase as input context. Per-dimension phases allow the coaching map to target different coaching approaches for different dimensions.

Productive tensions from the adversarial pass may also influence phase: a productive tension between voice and structure (strong voice, weak structure) reinforces the per-dimension asymmetry signal.

### With PLAN2 Growth Engine

Phase-aware growth budget guidance tells the dispatch system which deep dive domains to prioritize at each phase level. The growth engine's convergence detection is separate from phase:
- Convergence asks: "Is understanding still growing?"
- Phase asks: "What coaching zoom level is appropriate?"

Both signals inform the dispatch system but operate independently. A converged understanding at Foundation phase means "we fully understand the essay's structural problems" — not that coaching should stop.

### With PLAN2 ReadingStrategy

The ReadingStrategy replaces `ESSAY_TYPE_WEIGHTS` as the source of dimension importance for this specific essay. When available, it's the strongest signal for which dimensions matter and how to weight them in the overall phase synthesis.

### With L5 Feedback Layer (Annotations)

Phase is consumed by L5 as coaching lens guidance:
- Overall phase determines general annotation framing
- Per-dimension phases allow L5 to coach at different zoom levels for different dimensions in the same essay
- An essay at Foundation for structure but Craft for voice can receive structural annotations at the Architecture level while also receiving voice annotations at the Craft level

### With L6 Coaching (Conversation)

Phase transitions are surfaced to the coaching layer as celebration moments. The coaching prompt includes the latest transition (if one occurred) and guides the coach to acknowledge progress naturally.

Per-dimension phases also shape conversation strategy: the coach leads with questions about the lowest-phase critical dimension while affirming strength in the highest-phase dimension.

---

## 7. Implementation Sequence

### Step 1: Type Definitions (45 min)
**File:** `src/services/essayIntelligence/profileTypes.ts`

1. Rewrite `ImprovementPhase` interface with:
   - `dimensionPhases: Array<{ dimension: string; phase: ImprovementPhaseLevel; reasoning: string; coachingApproach: string }>`
   - `coachingLensGuidance: string`
   - `readiness: PhaseReadiness` (new interface)
   - `essayTypeContext: { detectedType: EssayType; typeInfluence: string }`
   - Keep existing `level`, `reasoning`, `focusAreas`, `deferredAreas`

2. Add `PhaseReadiness` interface:
   - `assessment: string`
   - `dimensionReadiness: Array<{ dimension: string; readyFor: string; notReadyFor: string }>`

3. Add `PhaseTransition` interface (as defined in Section 3)

4. Update `ProfileIndex`:
   - Add `phaseHistory: PhaseTransition[]`
   - Keep `currentPhase` (type unchanged — still `ImprovementPhase`)

5. For backward compatibility, add optional `legacyReadiness?: { essayLevel: number; paragraphLevel: number; sentenceLevel: number; wordLevel: number }` to `ImprovementPhase`

6. Run `npx tsc --noEmit` — expect errors from consumers of old readiness shape. Note them for Step 4.

### Step 2: Create Phase Assessment Module (2-3 hours)
**New file:** `src/services/essayIntelligence/analysis/phaseAssessment.ts`

1. Add `PhaseAssessmentInput` interface:
   ```typescript
   interface PhaseAssessmentInput {
     analyses: AnalysisPassOutput[];
     profile: Readonly<EssayProfile>;
     essayType: EssayType | null;
     wordCount: number;
     paragraphCount: number;
     readingStrategy?: { strategy: string; bestApproach: string; antiPatterns: string[] } | null;
     priorPhase?: ImprovementPhase | null;
   }
   ```

2. Add `assessPhase()` function:
   - Haiku call with the complete prompt from Section 5
   - Builds system prompt with phase assessment instructions
   - Builds user message from scoring results + holistic synthesis summary + context
   - Parses JSON output
   - Validates phase levels (default to 'foundation' if unknown)
   - Populates `legacyReadiness` from overall phase level for backward compatibility
   - Returns `ImprovementPhase`

3. Add `detectTransition()` function:
   - Compares new phase to prior phase
   - If the Haiku detected a transition (`phaseTransition.transitioned === true`), construct a `PhaseTransition` record
   - If no prior phase or no transition: return null
   - Adds ISO timestamp

4. Add `getPhaseGrowthGuidance()` function (from Section 4)

5. Add `phaseInfluencedModeSelection()` function (from Section 4)

6. Export all functions and interfaces

### Step 3: Remove computeImprovementPhase (30 min)
**File:** `src/services/essayIntelligence/analysis/analysisPass.ts`

1. If Improvement #2 has already replaced `computeImprovementPhase()`: skip this step
2. If not: remove `computeImprovementPhase()` function
3. Import `assessPhase` from the new `phaseAssessment.ts` module
4. In `analyzeAllParagraphs()`, replace the `computeImprovementPhase()` call with `assessPhase()` call
5. Note: `assessPhase()` is async (Haiku API call), so the calling code needs to await it

### Step 4: Update analyzeAllParagraphs (1-2 hours)
**File:** `src/services/essayIntelligence/analysis/analysisPass.ts`

1. After all paragraph scoring completes:
   ```
   a. Collect scoring results
   b. Call assessPhase() with scoring results + profile + essay type + reading strategy + prior phase
   c. If prior phase exists, call detectTransition()
   d. Store phase transition in profile.phaseHistory if detected
   e. Return phase as part of L35AnalysisResult
   ```

2. Update `L35AnalysisResult` to use the new `ImprovementPhase` type (should be compatible since the interface was rewritten with the same top-level fields + additions)

3. Handle `assessPhase()` failure:
   - If Haiku call fails: fall back to a minimal ImprovementPhase with `level: 'foundation'` and generic reasoning
   - Log warning: `[AnalysisPass] Phase assessment Haiku call failed — falling back to foundation`
   - The fallback is conservative (Foundation) to avoid giving the student credit for progress that wasn't assessed

### Step 5: Update Focused Analyzer (1 hour)
**File:** `src/services/essayIntelligence/analysis/focusedAnalyzer.ts`

1. Currently imports `computeImprovementPhase` — update to import `assessPhase` from `phaseAssessment.ts`
2. After focused re-analysis of 1-2 paragraphs, call `assessPhase()` with updated scoring + full profile
3. Call `detectTransition()` against the prior phase
4. Store transition if detected
5. This ensures focused re-analysis can trigger phase transitions when a targeted edit improves one dimension enough to change the phase

### Step 6: Update Coaching Layer (1-2 hours)
**File:** `src/services/essayIntelligence/coaching/coachingService.ts`

1. Update the coaching prompt to use `coachingLensGuidance` from the phase:
   - Replace any hardcoded phase-to-focus mappings with the dynamic coaching lens
   - The coaching lens is already a prompt paragraph — inject it directly

2. Add transition celebration:
   - Check `profile.phaseHistory` for recent transitions
   - If a transition occurred since the last coaching turn, inject the celebration prompt section
   - The coaching layer acknowledges the milestone naturally in conversation

3. Use per-dimension phases for conversation strategy:
   - Lead with questions about the lowest-phase critical dimension
   - Affirm strength in the highest-phase dimension
   - Use the coaching approach description from each dimension's phase for framing

### Step 7: Update Feedback Layer (1-2 hours)
**File:** `src/services/essayIntelligence/analysis/deepAnnotationService.ts`

1. Update annotation generation to use per-dimension phase as zoom level guidance:
   - For structural annotations: use the structure dimension's phase
   - For voice annotations: use the voice dimension's phase
   - For craft annotations: use the craft dimension's phase

2. Inject the coaching lens prompt section (from Section 5) into the annotation generation prompt

3. Use `phase.readiness.dimensionReadiness` to determine annotation granularity:
   - If a dimension is "ready for sentence-level craft refinement" → generate sentence-level annotations
   - If a dimension is "not ready for sentence-level work" → generate paragraph-level annotations

### Step 8: Wire Phase to Growth Dispatch (30 min)
**File:** `src/services/essayIntelligence/analysis/phaseAssessment.ts` (already created in Step 2)

1. `getPhaseGrowthGuidance()` is already implemented in Step 2
2. Update the deep dive dispatch algorithm (when it exists) to receive growth guidance as input
3. If the dispatch algorithm doesn't exist yet: ensure `getPhaseGrowthGuidance()` is exported and documented for future integration

### Step 9: Testing (2-3 hours)

Create test file: `tests/test-l9-continuous-phase.ts`

1. **Per-dimension phase accuracy test**: Run full pipeline against 3 essays with different quality profiles.
   - Essay A: strong voice, weak structure → expect voice at Craft+, structure at Foundation/Architecture
   - Essay B: uniform quality → expect dimensions at similar phases
   - Essay C: supplement vs personal statement → expect different dimensions chosen

2. **Overall phase synthesis test**: Verify the overall phase makes coaching sense.
   - When structure is at Foundation and voice is at Craft, overall should be Foundation (structure dominates)
   - When emotional_depth is at Foundation for a technical supplement, overall should NOT be Foundation (non-critical dimension)

3. **Phase transition detection test**: Run analysis, simulate meaningful edit, re-run.
   - Verify transition is detected for genuine qualitative change
   - Verify transition is NOT detected for minor score fluctuation
   - Verify celebration note is specific (not "Great job!")

4. **Phase regression test**: Run analysis, simulate a structural edit that breaks the arc, re-run.
   - Verify phase regresses with honest framing
   - Verify the regression is not presented as failure

5. **Coaching lens test**: Generate L5 annotations at different phases.
   - Foundation: annotations should be structural, paragraph-level
   - Craft: annotations should include sentence-level craft observations
   - Verify the coaching lens guidance appears in the L5 prompt

6. **Essay type test**: Analyze a 150-word supplement and a 650-word personal statement.
   - Verify different dimensions are chosen for each
   - Verify "Foundation" means different things for each

7. **Readiness prose test**: Verify readiness assessment is in coaching terms.
   - Should NOT contain numbers
   - Should reference specific paragraphs
   - Should describe what IS and ISN'T ready for coaching

8. **Cost verification**: The Haiku call should cost ~$0.001-0.003 per assessment.

### Step 10: Backward Compatibility Verification (30 min)

1. Check all consumers of `ImprovementPhase.readiness`:
   - If they expect `{ essayLevel, paragraphLevel, sentenceLevel, wordLevel }`, update to use `legacyReadiness` or the new prose readiness
   - The `legacyReadiness` field provides a migration path

2. Check all consumers of `phase.focusAreas` and `phase.deferredAreas`:
   - These still exist on the interface (unchanged names)
   - Values are now essay-specific instead of templates — consumers should handle variable content

3. Check all consumers of `phase.level`:
   - Unchanged — still `ImprovementPhaseLevel`
   - Consumers that switch on level should still work

4. `npx tsc --noEmit` — fix any remaining type errors

### Step 11: Type Check and Cleanup (30 min)

1. `npx tsc --noEmit` — fix all type errors
2. Verify `computeImprovementPhase()` is fully removed (not just unused)
3. Verify no hardcoded phase-to-focus mappings remain in coaching or feedback prompts
4. Verify `phaseAssessment.ts` exports are correct and documented
5. Remove any debugging artifacts
6. Ensure no functions compute phase from formulas or hardcoded thresholds — final litmus test

### Dependency Notes
- If Improvement #2 has already been implemented and replaced `computeImprovementPhase()` with a basic Haiku call, this improvement EXTENDS that call. If not, this improvement includes the removal as Step 3.
- Improvement #4 is ENHANCED by phase context (coaching map priorities shaped by phase) but doesn't require it.
- The coaching layer update (Step 6) depends on `coachingService.ts` existing — if it doesn't exist yet, document the coaching lens interface for future implementation.
- The ReadingStrategy integration is optional — works without it, enhanced with it.
- `getPhaseGrowthGuidance()` is ready for the growth engine but the growth engine may not exist yet — export and document for future wiring.

### Cost Impact Summary
- Phase assessment Haiku call: ~$0.001-0.003 per assessment
- If combined with Improvement #2's Haiku call: shared cost, no additional call
- Transition detection: no additional cost (parsed from same Haiku output)
- **Total additional cost: ~$0.001-0.003 per assessment** (or $0 if combined with #2)
- **Latency impact: +1-2 seconds** for Haiku call (or +0 if combined with #2)
