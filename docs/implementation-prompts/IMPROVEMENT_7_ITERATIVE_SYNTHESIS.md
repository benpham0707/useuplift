# Implementation Prompt #7: L3.75 Iterative Synthesis + Walk Validation + Question Curation

> Complete, self-contained implementation prompt for a future Claude session.

---

## Context from Cluster B Implementation (MUST READ FIRST)

Cluster B (#2 Scoring Validation + #9 Continuous Phase + #4 Contradiction Mining) is complete. These discoveries directly affect your implementation:

### Actual Types You'll Consume

**`ImprovementPhase`** (from `phaseAssessment.ts`):
```typescript
{
  level: ImprovementPhaseLevel;  // 'foundation' | 'architecture' | 'craft' | 'polish' | 'distinction'
  reasoning: string;
  focusAreas: string[];
  deferredAreas: string[];
  readinessAssessment: string;
  legacyReadiness: { essayLevel, paragraphLevel, sentenceLevel, wordLevel };  // backward-compat only
  dimensionPhases: Array<{
    dimension: string;  // LLM picks 3-6 of 8 dimensions
    level: ImprovementPhaseLevel;
    reasoning: string;
    coachingApproach: string;  // HOW to give feedback for this dimension
  }>;
  coachingLens: string;  // 2-4 sentence directive for downstream prompts
  transition: null | { priorLevel, isGenuineShift: boolean, transitionReasoning };
  nearBoundary?: boolean;
}
```

**`ProgrammaticContradiction`** (from `crossDomainValidation.ts`):
4 types: `understanding_vs_analysis`, `voicemap_vs_identity`, `structural_weight_vs_scores`, `earnedness_vs_effectiveness`. Each has `evidenceA`, `evidenceB`, `severity` (blocking/notable/minor), `consumed` flag.

**`SentenceAnalysisConfidence`** (from `analysisPass.ts`):
Per-sentence confidence with `reasoning`, `level` (high/moderate/low), `sensitivityNote`. Low confidence is diagnostic, not corrective.

### Key Discoveries

1. **Contradiction findings start at `developing` maturity, not `confirmed`**. Programmatic checks can have false positives (e.g., "earned" used descriptively in understanding, not evaluatively). The growth cycle (YOUR code) should validate these — promote to `confirmed` when the LLM agrees the tension is genuine, or supersede when it determines the contradiction was a labeling artifact.

2. **Anti-clustering works through prompt engineering, not post-hoc adjustment**. L3.5 uses: forced ranking before scoring, calibration reflection citing essay-specific ceiling/floor, anchor-then-parallel scoring, 4 concrete calibration examples. Distribution diagnostics are pure bookkeeping (Rule 6). Your synthesis iterations should follow this same pattern — if you need quality control on synthesis prose, build it into the prompt, not into a post-hoc filter.

3. **The anchor mechanism creates sequential dependency**. Anchor paragraph is scored first (sequential), then remaining paragraphs in parallel with anchor context. This means the first paragraph analysis takes ~3-5s before parallel scoring begins. Plan your growth cycle timing accordingly.

4. **Phase assessment's `coachingLens` should flow into your synthesis prompts**. It's a 2-4 sentence directive capturing the student's developmental stage and feedback sensitivities. When your growth cycle produces a ReadingStrategy, it should be informed by the coaching lens.

5. **Dimension selection is LLM-driven, not exhaustive**. Phase assessment only covers 3-6 dimensions the LLM judges most meaningful. Your `DimensionDepth` tracking should handle sparse coverage — not every dimension will have a phase level.

6. **The `nearBoundary` flag signals imminent phase shift**. If synthesis discovers new depth that could push a dimension across a phase boundary, this is a high-value signal for the growth cycle.

7. **Notable contradictions now create hypothesis-maturity findings**. Blocking contradictions (severity: effectiveness < 30) create `developing`-maturity findings with `critical` coaching value. Notable contradictions (severity: effectiveness 30-50) create `hypothesis`-maturity findings with `medium` coaching value. Your growth cycle should have a step that explicitly addresses these developing/hypothesis findings — validate or supersede them based on the full-context view that synthesis provides.

8. **Per-dimension phase divergence relies on holistic inference, not fine-grained signal**. L3.5 produces one `effectiveness` number per sentence, not per-dimension scores. The phase assessment LLM infers dimension-specific quality from holistic sections (voice identity, narrative strategy, etc.). If your growth cycle discovers that a dimension's holistic data is thin (e.g., craft assessment has few strength signatures), this is a signal for a targeted deep dive to strengthen the signal — which in turn would improve future phase assessment accuracy.

9. **`blockingCount >= 3` in analysisOrchestrator degrades profile confidence**. This operational heuristic caps confidence at `developing` when 3+ blocking contradictions exist. When your growth cycle resolves contradictions (validates or supersedes them), it should trigger confidence re-assessment. If blocking contradictions are resolved down to <3, the confidence cap should lift.

### Watch-outs

- **Do NOT re-implement scoring validation in the synthesis layer**. L3.5 handles scoring; your layer handles understanding. The boundary is sacred: understanding (L3/L3.75) = descriptive, analysis (L3.5) = evaluative, feedback (L5/L6) = prescriptive.
- **Contradiction findings from programmatic checks will already be in the FindingStore** when your growth cycle runs. Your synthesis should SEE these findings and incorporate them — validate the genuine ones, supersede the false positives. Don't create duplicate contradiction findings.
- **The `earned` label was removed from profile context**. We fixed a rigidity violation where `mechanisms.length >= 2` was being labeled "EARNED/UNEARNED". Now shows mechanism count only. Your synthesis prompts should similarly avoid pre-judging — show the evidence, let the LLM synthesize.

---

## Context

You are implementing the upgraded L3.75 layer for the Essay Intelligence V2 system. The current L3.75 (`src/services/essayIntelligence/analysis/holisticSynthesis.ts`) makes two Sonnet calls (Phase A + Phase B) that synthesize 10 holistic sections from scratch by reading the walk's sentence-level understanding. It is a single-shot pass with no iterative deepening.

The V2 evolution (docs/specs/PLAN2.md) gives L3.75 three distinct roles:
1. **Walk Validation** -- seeing the full essay simultaneously to catch what the sequential walk missed or misread
2. **Holistic Synthesis** -- producing the 10 structured sections (voice, emotion, theme, etc.) grounded in the walk's rich understanding
3. **Question Curation** -- filtering, answering, and prioritizing the question queue that drives deep dives

This improvement transforms L3.75 from a single-shot synthesizer into an iterative growth engine that loops: synthesize -> curate questions -> dispatch deep dives -> re-synthesize with new information -> check convergence -> stop or continue.

**Key files:**
- `src/services/essayIntelligence/analysis/holisticSynthesis.ts` -- current implementation (two-phase Sonnet calls)
- `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` -- current pipeline (Phase 3 = single L3.75 call)
- `src/services/essayIntelligence/profileTypes.ts` -- V2 type definitions
- `src/services/essayIntelligence/profileManager/profileRouter.ts` -- context assembly
- `docs/specs/PLAN2.md` -- authoritative spec for V2 evolution

---

## Design Principles (LLM-First Rules)

Every design decision must pass these rules. Violations are bugs.

### Rule 1: The LLM Owns All Judgment -- The System Tracks and Organizes
- The LLM decides when synthesis has converged (not a formula comparing deltas, not a reward threshold).
- The LLM decides which questions are worth investigating (not a static priority enum).
- The LLM decides which paragraphs need re-reading with full context (not a confidence threshold).
- The system tracks raw activity metrics (bookkeeping), manages budgets, and enforces safety caps.
- **CRITICAL**: No `computeStepReward()` weighted formula. No `REWARD_PLATEAU_THRESHOLD`. No `CONSECUTIVE_LOW_STEPS`. These are analytical judgments disguised as infrastructure. The LLM's `selfAssessedConvergence` is the PRIMARY convergence signal. Budget and iteration caps are the ONLY system-enforced stops.

### Rule 2: Never Discard Paid LLM Output
- Every iteration's synthesis is preserved in the growth log.
- Questions answered by L3.75's full-context view are recorded with their answers.
- Deep dive findings are never trimmed to fit a quota.

### Rule 3: No Closed Taxonomies for LLM Perception
- Question dimensions are not a fixed enum. The LLM describes what a question is about in prose; the system uses a small set of routing tags (`voice`, `theme`, `narrative`, `emotion`, `character`, `craft`, `epistemology`, `admissions`, `absence`, `coherence`) for dispatch, but the LLM is free to describe questions beyond these categories.
- Deep dive prompt selection is LLM-recommended, not formula-mapped.

### Rule 4: No Whack-a-Mole Pattern Matching
- Quality of questions and synthesis is driven by prompt engineering (examples of good/bad questions, understanding level examples), not by post-hoc regex filtering.

### Rule 5: Soft Guidance Over Hard Blocklists
- Convergence thresholds are soft guidance ("the system suggests you may have reached sufficient depth") not hard stops ("iteration terminated because delta < 0.15").

### Rule 6: System Infrastructure IS Appropriate for Resource Limits and Bookkeeping
- Safety cap on iterations (MAX_ITERATIONS = 8) is system infrastructure -- a backstop, not the primary stopping criterion.
- Budget ceiling in dollars is system infrastructure.
- Activity ledger (raw metrics per step) is system bookkeeping -- presented to the LLM as context, never fed through a formula.

### Rule 7 (NEW): When the System Needs a Routing Signal from LLM Output, Have the LLM Produce It Explicitly
- Don't reverse-engineer LLM prose through keyword matching or threshold formulas.
- If the system needs to know whether to stop iterating, the LLM produces `selfAssessedConvergence` explicitly.
- If the router needs to know which profile sections matter, the LLM produces `contextPriorities` explicitly.
- If coaching needs to know response intensity, the LLM produces `responseIntensity` explicitly.
- The LLM already has the context to make these judgments. The system just needs to ask for them in a form it can route on.

---

## Core Architecture

### New Types

```typescript
// ── Growth Engine Types ──

/**
 * Raw activity record for a single growth step.
 * Pure bookkeeping -- NO weighted formula, NO composite score.
 * Presented to L3.75 as context for convergence judgment.
 */
interface GrowthStepRecord {
  /** Which growth step this records */
  step: string;  // 'synthesis_iter_1', 'deep_dive_voice_authenticity', 'reread_P1'
  /** Raw metrics -- what changed (tracking, not scoring) */
  questionsResolved: number;
  questionsRaised: number;
  findingsAdded: number;
  findingsDeepened: number;
  findingsSuperseded: number;
  /** Which holistic sections were updated */
  sectionsUpdated: string[];
  /** Cost of this step */
  cost: number;
  /** LLM-generated one-liner from the step's output -- what did this step reveal? */
  discoveryNote: string;
}

/**
 * Growth cycle state -- simplified to activity tracking + resource limits.
 * NO rewardHistory (deleted: was input to formula).
 * NO dimensionState (deleted: was closed taxonomy).
 * Convergence is L3.75's judgment. System enforces budget + iteration caps only.
 */
interface GrowthCycleState {
  /** Current iteration (0-based) */
  iteration: number;
  /** Raw activity log -- presented to L3.75 for convergence judgment */
  activityLog: GrowthStepRecord[];
  /** Budget remaining in USD */
  budgetRemaining: number;
  /** Budget ceiling for the entire growth cycle */
  budgetCeiling: number;
  /** Whether the cycle has converged */
  isConverged: boolean;
  /** Why it converged (if it did) -- only system backstop reasons */
  convergenceReason?: 'budget_exhausted' | 'safety_cap';
}

// NOTE: DimensionDepth type is DELETED.
// The LLM knows what it understands deeply vs shallowly from its own synthesis.
// A 4-level enum ('unexplored'|'noticed'|'understood'|'deeply_understood') gives
// the LLM a system-assigned label that may disagree with its own self-knowledge.
// If coverage tracking is needed, the activity log's sectionsUpdated field shows
// which areas received attention.

// ── Question Curation Types ──

interface QuestionCurationOutput {
  /** Walk questions that L3.75 answered with full-context view */
  resolvedQuestions: Array<{
    questionId: string;
    answer: string;
    evidence: string;
  }>;
  /** Walk questions kept + new questions L3.75 raised, with deep dive recommendations */
  curatedQueue: Array<{
    question: UnderstandingQuestion;
    /** Which deep dive prompt would best investigate this */
    recommendedPrompt: string;
    /** Why this prompt -- not just dimension matching, reading-strategy-aware */
    promptRationale: string;
  }>;
  /** Walk questions filtered out (with reason, for transparency and debugging) */
  filteredQuestions: Array<{
    questionId: string;
    filterReason: string;  // free text, not a closed enum
  }>;
}

// ── Synthesis Iteration Output ──

interface SynthesisIterationOutput {
  /** The holistic sections (same structure as current HolisticSynthesisOutput) */
  synthesis: HolisticSynthesisOutput;
  /** Walk validation: disagreements with the walk's reading */
  walkDisagreements: Array<{
    paragraph: number;
    walkReading: string;
    synthesisReading: string;
    confidence: number;  // 0-1: how confident L3.75 is that its reading is better
    resolution: 'synthesis_wins' | 'flag_for_reread' | 'preserve_both';
    reasoning: string;
  }>;
  /** Question curation output */
  questionCuration: QuestionCurationOutput;
  /** Reading Strategy -- meta-understanding of how to read THIS essay */
  readingStrategy: ReadingStrategy;
  /** Which paragraphs would benefit from re-reading with full context */
  reReadCandidates: Array<{
    paragraph: number;
    reason: string;
    expectedDepthGain: 'significant' | 'moderate';
  }>;
  /** What changed compared to previous iteration (LLM-generated narrative) */
  evolutionNarrative: string;
  /** Self-assessed convergence signal */
  selfAssessedConvergence: {
    hasConverged: boolean;
    reasoning: string;
    /** What would be lost if we stopped here */
    remainingOpportunities: string[];
  };
}

interface ReadingStrategy {
  /** Meta-understanding of how to read this specific essay */
  strategy: string;
  /** What reading approach yields the deepest understanding */
  bestApproach: string;
  /** What this essay is NOT -- prevents misapplied frameworks */
  antiPatterns: string[];
  /**
   * Routing signal for the Profile Router -- which profile sections
   * matter most for understanding this essay, in priority order.
   * L3.75 produces this because it KNOWS what dimensions matter.
   * The router uses it directly -- no keyword matching needed.
   *
   * Example: ['voiceIdentity', 'voiceMap', 'craftAssessment', 'emotionalTopography']
   * for an essay where voice and craft are the primary axes.
   *
   * This replaces the router's dimensionKeywords keyword-matching approach
   * (Rule 7: have the LLM produce routing signals explicitly).
   */
  contextPriorities: string[];
}
```

### Convergence: L3.75 Judges, System Backstops

**The LLM's `selfAssessedConvergence` is the PRIMARY stopping criterion.** The system enforces only resource limits.

```typescript
// System infrastructure constants (Rule 6: resource limits ONLY)
const MAX_ITERATIONS = 8;            // Safety cap -- backstop only
const GROWTH_BUDGET_CEILING = 0.60;  // USD -- total for synthesis + deep dives + re-reads
const MIN_BUDGET_FOR_STEP = 0.03;    // USD -- minimum to attempt another step

// NO computeStepReward(). NO REWARD_PLATEAU_THRESHOLD. NO CONSECUTIVE_LOW_STEPS.
// These were deterministic formulas replacing the LLM's contextual judgment about
// whether understanding has matured enough. The LLM judges convergence; the system
// tracks raw activity and enforces ceilings.
```

**How convergence works:**

1. **L3.75 receives the activity log** as context each iteration (formatted as prose, not numbers):
   ```
   === GROWTH ACTIVITY LOG ===
   Iteration 0:
     Synthesis: resolved 2 walk questions, updated voice identity + emotional topography
     Discovery: "The procedural voice is actually the authentic register"
     Deep dive (voice_authenticity): added 3 findings, superseded 1
     Discovery: "Vocabulary domain analysis confirms authentic/performed split"
   Cost so far: $0.18 of $0.60 budget
   ```

2. **L3.75 produces `selfAssessedConvergence`** as part of its synthesis output:
   - `hasConverged: boolean` -- the LLM's judgment
   - `reasoning: string` -- WHY it has/hasn't converged
   - `remainingOpportunities: string[]` -- what would be lost if we stopped

3. **The orchestrator trusts L3.75** (after at least 1 iteration) and stops.

4. **System backstops** catch runaway cycles:
   - `iteration >= MAX_ITERATIONS` → stop (safety cap)
   - `budgetRemaining < MIN_BUDGET_FOR_STEP` → stop (budget exhausted)
   - These are the ONLY system-enforced convergence reasons.

**Why this is better than the reward formula:**
- The formula couldn't know that "1 finding superseded" might be the key insight that transforms coaching
- The formula treated all questions equally; the LLM knows which questions matter for THIS essay
- The LLM can detect qualitative convergence ("I keep seeing the same patterns") that no metric captures
- Simple essays converge in 1 iteration (L3.75 says "I have sufficient depth"); complex essays get 2-3 iterations naturally

### The Stable Core / Refinement Zone Pattern

Each synthesis iteration produces a `HolisticSynthesisOutput`. To prevent drift across iterations:

```typescript
interface StableSynthesisState {
  /** Core claims that are established and shouldn't change without strong evidence */
  stableCore: {
    /** Claims that have been stable for 2+ iterations */
    confirmedClaims: string[];
    /** Version when each claim was last modified */
    claimVersions: Map<string, number>;
  };
  /** Areas where the synthesis is still evolving */
  refinementZone: {
    /** Claims that changed in the last iteration */
    recentlyChanged: string[];
    /** Claims flagged as uncertain by the LLM */
    uncertain: string[];
  };
}
```

The prompt instructs the LLM to:
1. Identify which parts of the prior synthesis are STABLE (same across iterations) vs. EVOLVING
2. Only change stable elements when new evidence from deep dives warrants it
3. Explain in `evolutionNarrative` what changed and WHY

This is enforced at the PROMPT level (Rule 4: quality at the prompt layer), not at the code level. The system does not diff outputs and block changes. Instead, the prompt creates cognitive pressure to maintain stability.

### Growth Cycle Loop (Orchestrator Integration)

The orchestrator's Phase 3 changes from a single L3.75 call to a growth cycle.
L3.75 owns convergence. The system tracks activity and enforces resource limits.

```typescript
// In analysisOrchestrator.ts -- replaces the current Phase 3 block

async function runGrowthCycle(
  profile: EssayProfile,
  walkResult: L3WalkResult,
  essayText: string,
  costTracker: CostTracker,
  priorPhase?: ImprovementPhase,  // available on re-analysis
): Promise<{
  finalSynthesis: HolisticSynthesisOutput;
  readingStrategy: ReadingStrategy;
  growthState: GrowthCycleState;
  totalCost: number;
}> {
  const state: GrowthCycleState = {
    iteration: 0,
    activityLog: [],
    budgetRemaining: GROWTH_BUDGET_CEILING,
    budgetCeiling: GROWTH_BUDGET_CEILING,
    isConverged: false,
  };

  let currentSynthesis: SynthesisIterationOutput | null = null;
  let cumulativeFindings: Finding[] = [...walkResult.findings];

  while (!state.isConverged && state.iteration < MAX_ITERATIONS) {
    // ── Step 1: L3.75 synthesizes + curates + judges convergence ──
    const iterResult = await holisticSynthesisService.synthesizeIteration({
      essayText,
      profile,
      walkEvolution: walkResult.holisticEvolution,
      previousSynthesis: currentSynthesis?.synthesis ?? null,
      previousReadingStrategy: currentSynthesis?.readingStrategy ?? null,
      questionQueue: currentSynthesis?.questionCuration.curatedQueue ?? walkResult.questionQueue,
      cumulativeFindings,
      activityLog: state.activityLog,  // raw history, no formula
      priorPhase,                       // phase context when available
      iterationNumber: state.iteration,
    });

    state.budgetRemaining -= iterResult.cost;
    costTracker.record(`L3.75_iter_${state.iteration}`, iterResult.cost, iterResult.tokenUsage, iterResult.timingMs);
    state.activityLog.push(buildStepRecord('synthesis', iterResult));

    currentSynthesis = iterResult.output;

    // ── Step 2: L3.75 says converged? Trust it. ──
    if (currentSynthesis.selfAssessedConvergence.hasConverged && state.iteration >= 1) {
      state.isConverged = true;
      break;
    }

    // ── Step 3: Run re-reads L3.75 flagged ──
    // L3.75 already decided which paragraphs need re-reading and why.
    // No confidence > 0.7 threshold -- if L3.75 flagged it, run it.
    for (const reRead of currentSynthesis.reReadCandidates.slice(0, 2)) {
      if (state.budgetRemaining < MIN_BUDGET_FOR_STEP) break;

      const reReadResult = await runTargetedReRead(profile, essayText, reRead.paragraph, currentSynthesis);
      state.budgetRemaining -= reReadResult.cost;
      costTracker.record(`reread_P${reRead.paragraph}`, reReadResult.cost, reReadResult.tokenUsage, reReadResult.timingMs);

      cumulativeFindings = mergeFindingsFromReRead(cumulativeFindings, reReadResult.findings);
      state.activityLog.push(buildStepRecord(`reread_P${reRead.paragraph}`, reReadResult));
    }

    // ── Step 4: Dispatch deep dives (L3.75 curated, system enforces budget) ──
    const dives = dispatchDeepDives(
      currentSynthesis.questionCuration.curatedQueue,
      state.budgetRemaining,
    );

    for (const dive of dives) {
      const diveResult = await runDeepDive(profile, essayText, dive, currentSynthesis);
      state.budgetRemaining -= diveResult.cost;
      costTracker.record(`deep_dive_${dive.promptType}`, diveResult.cost, diveResult.tokenUsage, diveResult.timingMs);

      cumulativeFindings = mergeFindingsFromDeepDive(cumulativeFindings, diveResult.findings);
      state.activityLog.push(buildStepRecord(`deep_dive_${dive.promptType}`, diveResult));
    }

    // ── Step 5: Budget backstop ──
    if (state.budgetRemaining < MIN_BUDGET_FOR_STEP) {
      state.isConverged = true;
      state.convergenceReason = 'budget_exhausted';
    }

    state.iteration++;
  }

  // Safety cap reached
  if (state.iteration >= MAX_ITERATIONS && !state.isConverged) {
    state.convergenceReason = 'safety_cap';
  }

  return {
    finalSynthesis: currentSynthesis!.synthesis,
    readingStrategy: currentSynthesis!.readingStrategy,
    growthState: state,
    totalCost: state.budgetCeiling - state.budgetRemaining,
  };
}

/**
 * Build a GrowthStepRecord from a step's result.
 * Pure bookkeeping -- no scoring, no weighting.
 */
function buildStepRecord(step: string, result: StepResult): GrowthStepRecord {
  return {
    step,
    questionsResolved: result.questionsResolved ?? 0,
    questionsRaised: result.questionsRaised ?? 0,
    findingsAdded: result.findingsAdded ?? 0,
    findingsDeepened: result.findingsDeepened ?? 0,
    findingsSuperseded: result.findingsSuperseded ?? 0,
    sectionsUpdated: result.sectionsUpdated ?? [],
    cost: result.cost,
    discoveryNote: result.discoveryNote ?? '',
  };
}
```

### Deep Dive Dispatch: Budget-Only

L3.75's curated queue IS the priority. The dispatch is trivially simple:
follow L3.75's ordering, enforce budget. No diminishing returns formula,
no domain diversity heuristic, no dimension gap backfill.

If L3.75 wants voice investigated twice, it curates two voice questions.
If a dimension is unexplored and L3.75 doesn't mention it, that's because
the reading strategy says it's not relevant to THIS essay. If it IS relevant,
L3.75 will curate a question for it.

```typescript
function dispatchDeepDives(
  curatedQueue: CuratedQuestion[],
  budgetRemaining: number,
): DeepDiveRequest[] {
  // L3.75's ordering IS the priority. System enforces budget.
  const selected: DeepDiveRequest[] = [];
  let remaining = budgetRemaining;

  for (const cq of curatedQueue) {
    const cost = estimateDeepDiveCost(cq.recommendedPrompt);
    if (cost > remaining) break;
    selected.push({
      question: cq.question,
      promptType: cq.recommendedPrompt,
      rationale: cq.promptRationale,
      estimatedCost: cost,
    });
    remaining -= cost;
  }

  return selected;
}
```

---

## Deeper Design

### Q1: Should L3.75's three roles be in one prompt or separate calls?

**Answer: Two calls per iteration, not three.**

The three roles have different cognitive profiles:
- **Synthesis + Validation** are deeply intertwined -- you can't synthesize the holistic view without noticing where it disagrees with the walk. These share cognitive context and produce better results together.
- **Question Curation** is a meta-cognitive task -- evaluating and prioritizing questions requires a different stance (editorial, evaluative) than producing synthesis (interpretive, integrative).

Architecture:
1. **Call 1: Synthesis + Validation** (Sonnet, ~$0.05-0.10) -- produces holistic sections, walk disagreements, re-read candidates, reading strategy, evolution narrative, self-assessed convergence
2. **Call 2: Question Curation** (Sonnet, ~$0.02-0.04) -- receives the synthesis output + walk questions + findings, produces curated queue with deep dive recommendations

Keeping synthesis and validation together preserves the cross-role insight: "I notice the walk's reading of P3 doesn't account for the voice shift I see from the full-essay view, which connects to the thematic tension I'm synthesizing." Separating question curation prevents cognitive overload from trying to simultaneously interpret AND editorially evaluate.

Total per iteration: ~$0.07-0.14. Over 2-3 iterations: ~$0.14-0.42.

### Q2: How do we prevent synthesis drift across iterations?

**Answer: Prompt-driven stability with explicit stable/evolving labeling.**

The prompt instructs the LLM to produce its synthesis in two conceptual zones:

**Stable Core:** Claims that appeared in the previous iteration and are not contradicted by new evidence. The LLM must explicitly mark any change to a stable claim and explain what new evidence warrants the change.

**Refinement Zone:** Areas where new deep dive results or re-reads have added information. The LLM is free to evolve these.

Implementation: the prompt for iteration N includes iteration N-1's synthesis with annotations:

```
=== PREVIOUS SYNTHESIS (Iteration 1) ===

Voice Identity: "This writer's voice is most natural in procedural descriptions..."
  ^^^ STABLE since iteration 1. Only change if new evidence contradicts this.

Emotional Topography: "The essay's emotional arc builds through..."
  ^^^ UPDATED by deep dive 'emotion_earning_trace'. Refinement zone.

=== NEW INFORMATION SINCE LAST ITERATION ===

Deep Dive 'voice_authenticity' found:
  - Finding: "The performative register in P0 and P6 shares vocabulary
    ('passion', 'journey', 'impact') that appears nowhere in the authentic
    middle paragraphs..."

Re-read of P1 found:
  - Finding: "With full context, P1's opening image is not just scene-setting
    but deliberately establishing the physical-transaction epistemology..."

=== YOUR TASK ===

Produce the updated holistic synthesis. For any STABLE claim you change,
explain what new evidence warrants the change. For REFINEMENT areas,
integrate the new information freely.
```

This is enforced at the prompt level, not through code diffing. The code tracks which claims are stable (appeared unchanged for 2+ iterations) and annotates the prompt accordingly.

### Q3: What prompt engineering drives question quality?

**Answer: Five-level question taxonomy with concrete examples, plus a "would this deep dive produce a finding the walk couldn't?" test.**

The prompt includes these examples, explicitly ordered from worst to best:

```
=== QUESTION QUALITY LEVELS ===

LEVEL 1 -- Surface (NEVER produce these):
  "What techniques does the author use in paragraph 3?"
  "How does the writer use imagery?"
  Why bad: Answerable by re-reading. Produces observations, not understanding.

LEVEL 2 -- Functional (ONLY if the walk couldn't answer):
  "What function does the rhythm shift in P3S2 serve?"
  "Why does the vocabulary change from technical to intimate in P4?"
  Why these are borderline: Useful, but the walk should have caught them.
  Only curate if the walk specifically flagged uncertainty.

LEVEL 3 -- Architectural (GOOD -- these drive structural understanding):
  "The constraint-creativity framework is stated in P0, demonstrated in P4,
   but never TESTED or complicated. Is the essay's central claim challenged
   anywhere, or does it operate as received wisdom throughout?"
  "P2's puzzle simile reframes creativity as analytical. Does this reframing
   persist, or does the essay revert to the romantic frame of P0?"
  Why good: Cross-paragraph patterns the walk couldn't fully trace.

LEVEL 4 -- Epistemological (EXCELLENT -- these unlock deepest depth):
  "The writer claims constraint enables creativity, but retreats to
   abstraction every time they approach a specific creative moment.
   Is this a structural habit (they don't know how to write concrete
   scenes) or a protective choice (the real moment feels too vulnerable)?"
  "The essay's theory of creativity (constraints -> innovation) depends
   on P4's AI DJ project as proof. But P4's evidence is external validation
   ('users smile'), not internal recognition. Does the essay HAVE a moment
   of internal recognition anywhere?"
  Why excellent: These require investigation BEYOND the text surface.

LEVEL 5 -- Meta-Awareness (EXCEPTIONAL -- produce 0-1 of these per essay):
  "The essay's commitment to physical knowing creates ironic tension with
   the college essay form itself. The writer's voice is most authentic in
   concrete moments and most generic in philosophical ones. Is the essay
   unknowingly PERFORMING the very constraint it describes -- forced into
   reflection by the form when their native mode is making?"
  Why exceptional: These connect the essay's content to its own formal
   conditions. Answering them can transform the entire coaching strategy.
```

Additionally, the prompt includes a forcing function:

```
=== QUESTION QUALITY TEST ===

Before including any question, apply this test:
"If I dispatched a deep dive to investigate this question, would the
deep dive's answer produce a FINDING that the walk couldn't have produced?"

If yes: include the question.
If no: either answer it yourself (you have full-context view) or discard it.
```

### Q4: How does the orchestrator decide which deep dives to run?

**Answer: L3.75's curated queue is the priority source. The dispatch adds budget, diminishing returns, and diversity constraints.**

The dispatch algorithm is in the Core Architecture section above. Key design decisions:

- **L3.75's ordering IS the priority.** The dispatch does not re-score or re-rank. It respects the LLM's judgment about which questions matter most.
- **Budget is a constraint, not a factor.** A high-priority question doesn't get a bigger budget. Each deep dive costs ~$0.02-0.05. Budget constrains how many, not which.
- **Diminishing returns detection.** If the last 2 deep dives produced low reward, only take the top-priority candidate. This prevents burning budget on a converging system.
- **Domain diversity.** Prefer dives in different domains (voice, theme, emotion) over multiple dives in the same domain, unless L3.75 specifically ordered same-domain dives at top priority.
- **Dimension gap backfill.** If a dimension is `unexplored` and budget remains, add a fallback dive. This catches systematic blind spots the question queue might miss.

### Q5: Walk validation -- when L3.75 disagrees with the walk, who wins?

**Answer: Confidence-gated resolution with three outcomes.**

```typescript
// In the synthesis prompt:
//
// When your full-context reading disagrees with the walk's paragraph reading:
//
// HIGH CONFIDENCE (>0.7): Your reading likely wins. The walk read sequentially
// and couldn't see what you see. Mark as 'synthesis_wins' and explain why.
//
// MEDIUM CONFIDENCE (0.4-0.7): Flag for re-read. The walk may have had
// local context (sentence-level nuance) that your holistic view misses.
// Mark as 'flag_for_reread' -- the system will re-read the paragraph with
// full context to resolve the disagreement.
//
// LOW CONFIDENCE (<0.4): Preserve both readings. This is likely genuine
// ambiguity -- the essay supports multiple valid interpretations. Mark as
// 'preserve_both' and explain why both readings are valid.
```

The re-read is the key innovation: it combines the walk's local attention (sentence-by-sentence close reading) with L3.75's full-context view. This is different from both the walk (which didn't know the ending) and L3.75 (which might miss local nuance). It costs ~$0.03 per paragraph and runs only for `flag_for_reread` + `significant` depth gain.

### Q6: How does cost budget constrain the growth cycle?

**Answer: Adaptive allocation, not fixed percentages.**

The total growth cycle budget is `$0.60` (system infrastructure -- Rule 6). Allocation is NOT predetermined:

```
Iteration 1 (always runs):
  - L3.75 Synthesis+Validation: ~$0.07
  - L3.75 Question Curation: ~$0.03
  - Re-reads (0-2): ~$0.00-0.06
  - Deep dives (0-4): ~$0.00-0.16
  Total: ~$0.10-0.32

Iteration 2 (runs if not converged):
  - L3.75 Synthesis+Validation: ~$0.07
  - L3.75 Question Curation: ~$0.03
  - Re-reads (0-1): ~$0.00-0.03
  - Deep dives (0-2): ~$0.00-0.08
  Total: ~$0.10-0.21

Iteration 3+ (rare -- only for complex/layered essays):
  - Same structure, usually fewer dives due to convergence
  Total: ~$0.07-0.14
```

The key: the system allocates based on what is PRODUCING THE MOST LEARNING. If deep dives are generating high-reward findings, budget flows to more dives. If synthesis iterations are producing diminishing returns but deep dives aren't, budget flows to dives. This happens naturally because:
- High-reward dives create new findings that make the next synthesis iteration worthwhile
- Low-reward dives trigger the diminishing returns check, which caps future dive selection
- The LLM's self-assessed convergence catches cases where the numeric reward doesn't reflect genuine saturation

### Q7: How does the prompt drive prose quality in the synthesis?

**Answer: The synthesis prompt models the OUTPUT quality with a worked example and explicitly forbids checklist-style output.**

```
=== SYNTHESIS QUALITY ===

The holistic synthesis is the system's PORTRAIT of this essay. It should read
like a literary critic's close reading -- a coherent argument about what this
essay IS and HOW it works.

BAD synthesis (checklist disguised as prose):
  "Voice Identity: The writer uses a formal register in the introduction,
  transitioning to a more personal tone in the middle paragraphs. They
  demonstrate versatility through vocabulary choices. Their voice is
  distinctive in its use of technical terminology."

  Why bad: Three separate observations listed in sequence. No argument.
  No relationship between observations. Could describe any essay.

GOOD synthesis (genuine portrait):
  "Voice Identity: This writer's voice is most ITSELF when describing
  process -- the specific heat of solder, the exact moment a chord
  resolves, the satisfying click of code compiling. In these moments,
  the prose has a precision-intimate quality: technically exact but
  personally warm, as if the writer experiences closeness through
  mastery. When the essay asks them to REFLECT rather than DESCRIBE,
  the voice retreats to a generic philosophical register ('passion,'
  'journey,' 'connection') that could belong to any applicant. The
  essay's central voice tension is between the native procedural
  register and the imported reflective register -- and the writer
  doesn't know the procedural voice is their strongest asset."

  Why good: A coherent argument. Each observation builds on the last.
  The synthesis identifies a TENSION that has coaching implications.
  It could only describe THIS essay.

Your synthesis should make someone who hasn't read the essay understand
not just what it contains, but what it's ABOUT -- the difference between
a table of contents and a review.
```

---

## Prompt Engineering

### Synthesis + Validation Prompt (Call 1 of each iteration)

```
You are producing iteration {N} of the holistic synthesis for this essay.
You have the UNIQUE advantage of seeing the ENTIRE essay simultaneously --
the walk read paragraph-by-paragraph and built understanding forward.
You see everything at once.

{IF N > 0}
=== PREVIOUS SYNTHESIS (Iteration {N-1}) ===
{Previous synthesis, with stable/refinement annotations}

=== NEW INFORMATION SINCE LAST ITERATION ===
{Deep dive results, re-read results, answered questions}

=== WHAT CHANGED AND WHY ===
Your previous evolution narrative: "{previous evolution narrative}"
{END IF}

=== CURRENT UNDERSTANDING STATE ===
Essay text: {essay with paragraph markers}
Walk paragraph readings: {paragraph readings from L3}
Walk findings: {findings with maturity levels}
Walk holistic evolution: {walk's incremental observations}
Cumulative findings from deep dives: {if any}
Connection graph: {connections}

=== YOUR THREE TASKS ===

TASK 1: HOLISTIC SYNTHESIS
Produce the 10 holistic sections (voice, emotion, theme, etc.).
{IF N > 0}
Mark what is STABLE (unchanged from last iteration) and what you are
REFINING. For any stable claim you change, explain what new evidence
warrants the change.
{END IF}

TASK 2: WALK VALIDATION
Where does your full-context reading disagree with the walk's reading
of specific paragraphs? For each disagreement, state your confidence
(0-1) and your recommended resolution.

TASK 3: META-ASSESSMENT
- Reading Strategy: How should this specific essay be read? What rewards
  attention? What anti-patterns should the system avoid?
  ALSO: list the profile sections most important for understanding this
  essay in priority order as `contextPriorities` (e.g., ['voiceIdentity',
  'voiceMap', 'craftAssessment']). The router uses these directly for
  context ordering -- this replaces keyword-based dimension matching.
- Re-read Candidates: Which paragraphs would benefit most from re-reading
  with the full essay context? If you flag a paragraph, the system WILL
  re-read it -- no confidence threshold gates your judgment.
- Evolution Narrative: What changed in this iteration and why?
- Self-Assessed Convergence: Has your understanding reached sufficient
  depth to support high-quality coaching? You are the PRIMARY convergence
  signal -- the system trusts your judgment here. Budget and iteration
  caps are backstops only. Be honest:
  - If you have converged, say so and explain why further iteration
    would not meaningfully improve coaching quality.
  - If you have NOT converged, your question curation output tells
    the system what to investigate next.
  - What would be LOST if we stopped here? Name specific remaining
    opportunities, not generic "could go deeper."

{IF activityLog}
=== GROWTH ACTIVITY LOG ===
{formatted activity log: step, raw metrics, discovery note per step}
Cost so far: ${totalCost} of ${budgetCeiling} budget
{END IF}

{IF priorPhase}
=== PHASE CONTEXT (from most recent assessment) ===
{dimension phases with reasoning}
Overall: {level} -- {reasoning}
Consider this when curating questions. A Foundation essay benefits more
from structural investigation, but if you see a craft question that would
unlock structural understanding, curate it. Your judgment.
{END IF}

{Synthesis quality standards as above}
{Understanding level examples (1-5) as in PLAN2}
```

### Question Curation Prompt (Call 2 of each iteration)

```
You are curating the question queue for deep dive dispatch.

=== INPUTS ===
Current synthesis: {just-produced synthesis}
Reading strategy: {reading strategy from synthesis call}
Walk questions: {questions from walk, with status}
{IF iteration > 0}
Questions from previous iteration: {with resolution status}
{END IF}
Available deep dive prompts: {prompt library with focus descriptions}

=== YOUR TASKS ===

1. RESOLVE: Which walk questions can you answer now that you have the
   full-context synthesis? For each, provide the answer with evidence.

2. FILTER: Which questions are too generic, answerable by re-reading,
   or already covered by existing findings? For each, explain why.

3. CURATE: Which questions should drive deep dives? For each:
   - State the question clearly
   - Recommend a specific deep dive prompt and explain WHY
   - Your ordering IS the priority -- put the highest-impact question first

4. GENERATE: Are there new questions that the synthesis revealed but the
   walk didn't ask? These are often the most valuable -- they come from
   the simultaneous full-text view that the walk couldn't have.

{Question quality levels (1-5) with examples}
{Question quality test: "Would a deep dive answer produce a finding
 the walk couldn't have produced?"}

Return your curation as JSON matching the QuestionCurationOutput schema.
```

---

## Integration Points

### Connection to Improvement #8 (Profile Router)

The growth cycle introduces new routing rules:
- `l3_75_synthesis_iteration` -- context for L3.75 iteration N (needs prior synthesis + new findings)
- `deep_dive_{type}` -- context for specific deep dive prompts (varies by prompt's `requiredContext`)
- `full_context_reread` -- context for targeted paragraph re-reads (needs full understanding + essay text + reading strategy)

The router must support `DeclaredContextRequest` from Improvement #8 for deep dives, since each deep dive prompt declares its own context needs.

### Connection to Orchestrator

The orchestrator's Phase 3 expands from:
```
Phase 3: L3.75 holistic synthesis (single Sonnet call)
```
to:
```
Phase 3: Growth Cycle
  - L3.75 iteration 1: synthesis + validation + question curation
  - Re-reads (if any)
  - Deep dives (question-driven)
  - L3.75 iteration 2: updated synthesis + updated questions
  - Convergence check
  - ... (up to MAX_ITERATIONS iterations)
```

Phase 4 (L3.5 Analysis Pass) remains unchanged but benefits from the deeper understanding.

### Connection to V2 Walk Output

This improvement assumes the walk produces:
- Rich paragraph readings (prose, not observation arrays)
- Findings at natural granularity
- An evolving question queue
- A holistic evolution accumulator

If the walk has not yet been upgraded to V2 output format, a compatibility layer translates current walk output into the expected format.

---

## Implementation Sequence

### Step 1: Types and State Management (1 day)
- Add `StepReward`, `GrowthCycleState`, `DimensionDepth`, `QuestionCurationOutput`, `SynthesisIterationOutput`, `ReadingStrategy` to `profileTypes.ts`
- Implement `computeStepReward()`, `checkConvergence()`, `initializeDimensionState()`, `updateDimensionState()` in a new `growthEngine.ts`
- Tests: unit tests for reward computation and convergence checking

### Step 2: L3.75 Multi-Call Architecture (1-2 days)
- Refactor `holisticSynthesis.ts` from two fixed phases to an iteration-based architecture
- Implement `synthesizeIteration()` that runs Call 1 (synthesis+validation) and Call 2 (question curation)
- Keep the Phase A / Phase B prompt split for synthesis (same 10 sections), but add iteration context blocks
- Add the new prompt sections: walk validation, reading strategy, self-assessed convergence, question curation
- Tests: run against piano essay, verify all 10 sections + questions + reading strategy are produced

### Step 3: Growth Cycle in Orchestrator (1-2 days)
- Replace Phase 3 in `analysisOrchestrator.ts` with `runGrowthCycle()`
- Implement re-read runner (single Sonnet call re-reading one paragraph with full context)
- Implement deep dive runner (single Sonnet call with deep dive prompt + assembled context)
- Implement `selectDeepDives()` dispatch
- Tests: full pipeline run, verify growth cycle produces 1-3 iterations and converges

### Step 4: Deep Dive Prompt Library (1 day)
- Create `deepDivePromptLibrary.ts` with the ~20 specialized prompts from PLAN2
- Each prompt: focus text, required context list, typical cost, domain tag
- Implement the deep dive runner that instantiates a prompt with context from the router
- Tests: run 3 deep dives against piano essay, verify findings are produced and integrated

### Step 5: Finding Integration and Merge Logic (1 day)
- Implement `mergeFindingsFromDeepDive()` and `mergeFindingsFromReRead()` in `growthEngine.ts`
- Finding merge rules: new findings get `source: 'deep_dive'`; existing findings may have maturity upgraded; superseded findings are marked
- Wire finding integration into the coordinator's mutation path
- Tests: verify finding merge preserves IDs, handles supersession, updates maturity

### Step 6: Convergence Calibration (1-2 days)
- Run against 3-5 diverse essays (simple, complex, excellent, weak)
- Monitor: how many iterations before convergence? What reward trajectory looks like?
- Tune: `REWARD_PLATEAU_THRESHOLD`, `CONSECUTIVE_LOW_STEPS`, `GROWTH_BUDGET_CEILING`
- Verify: simple essays converge in 1 iteration + 0-1 dives; complex essays use 2-3 iterations + 3-5 dives

### Step 7: Prompt Quality Iteration (1 day)
- Compare synthesis prose quality before/after across test essays
- Iterate on question quality examples if questions are too surface-level
- Iterate on synthesis quality examples if prose reads like a checklist
- Verify reading strategy is specific to each essay (not generic)

**Total: 7-10 days**

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/services/essayIntelligence/profileTypes.ts` | MODIFY | Add StepReward, GrowthCycleState, DimensionDepth, QuestionCurationOutput, SynthesisIterationOutput, ReadingStrategy types |
| `src/services/essayIntelligence/analysis/holisticSynthesis.ts` | MAJOR REWRITE | From two-phase single-shot to iteration-based synthesis+validation+curation |
| `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` | MODIFY | Phase 3 becomes growth cycle loop |
| `src/services/essayIntelligence/analysis/growthEngine.ts` | NEW | Reward computation, convergence checking, finding merge, dispatch |
| `src/services/essayIntelligence/analysis/deepDivePromptLibrary.ts` | NEW | ~20 specialized deep dive prompt templates |
| `src/services/essayIntelligence/analysis/deepDiveRunner.ts` | NEW | Executes a deep dive prompt with assembled context |
| `src/services/essayIntelligence/analysis/fullContextReReader.ts` | NEW | Targeted paragraph re-read with full essay context |
| `src/services/essayIntelligence/profileManager/profileRouter.ts` | MODIFY | Add routing rules for deep dives and re-reads |
| `tests/test-growth-cycle.ts` | NEW | End-to-end growth cycle test |
| `tests/test-convergence-calibration.ts` | NEW | Convergence behavior across diverse essays |
