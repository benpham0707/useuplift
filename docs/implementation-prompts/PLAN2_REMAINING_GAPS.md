# PLAN2 Remaining Gaps: Essay Understanding + Persistent Questions + Maturity Analysis

> **Implementation prompt for three additive features that complete the "Understanding Revolution" vision from PLAN2.md without breaking existing infrastructure.**

---

## Context: What Already Exists

The 10 improvements (Clusters A–D) are complete. The system has:

- **8-layer pipeline**: L1→L2→L2.5→L3→L3.75→L3.5→L4→L5→L6
- **Finding lifecycle**: FindingStore with maturity tracking, supersession, lineage, deepening potential
- **Growth cycle**: `runGrowthCycle()` in analysisOrchestrator — iterative L3.75 synthesis → re-reads → deep dives → finding merge → convergence check
- **Question curation**: L3.75 produces `QuestionCurationOutput` with curated questions + recommended prompts
- **Deep dive library**: ~20 specialized prompts dispatched by question dimension
- **Holistic sections**: 10 independently-managed sections (voiceIdentity, emotionalTopography, thematicArchitecture, etc.)

What's **missing** — the three gaps this prompt addresses:

1. **No essay-level understanding prose.** The system's "mental model" is scattered across 10 holistic sections. PLAN2 envisions a single, coherent `EssayUnderstanding.prose` narrative that reads like expert literary analysis and grows with each pass.

2. **No persistent question queue.** Questions are re-derived fresh each L3.75 iteration. PLAN2 envisions questions that ACCUMULATE across growth cycles with tracked status, priority evolution, and parent→child relationships.

3. **No maturity gap analysis.** Findings have maturity fields but nothing actively detects "stuck" findings and routes them for investigation.

---

## CRITICAL CONSTRAINT: ADDITIVE ONLY

These three features **layer on top of** the existing system. They do NOT:
- Remove or replace the 10 holistic sections
- Change the walk's output format (ObservationEntry[] stays)
- Alter the L3.5 scoring pipeline
- Break any existing type contracts

The holistic sections remain the **structured breakdown**. The essay understanding prose becomes the **synthesized narrative** — derived from them, not replacing them.

---

## Gap 1: Essay-Level Understanding Prose

### The Problem

The system produces 10 separate holistic analyses (voice identity, thematic architecture, emotional topography, etc.). No single artifact answers: "What does this system UNDERSTAND about this essay, as a whole, right now?"

An admissions consultant doesn't think in 10 separate sections. They think: "This essay argues X through Y, but it's undermined by Z. The student knows their conclusion but hasn't earned it through experience. The real essay is hiding in the gap between what they claim and what the text actually does."

That's what `EssayUnderstanding.prose` should be.

### What to Build

**Type** — Add to `profileTypes.ts`:

```typescript
interface EssayUnderstanding {
  /**
   * The system's developing understanding of the WHOLE essay.
   * Rich prose — reads like expert literary analysis.
   * Grows with each pass: initial synthesis ~300 words,
   * after deep dives ~500 words, after coaching ~700 words.
   *
   * This is NOT a summary of the 10 holistic sections.
   * It's the ARGUMENT the system would make about this essay
   * if asked "what do you see?" — synthesized, opinionated,
   * grounded in specific text.
   */
  prose: string;

  /**
   * The essay's central tension — what drives it, whether
   * the writer knows it or not. NOT the thesis. The tension.
   * Updated as understanding deepens.
   */
  centralTension: string;

  /**
   * Things the system is confident about.
   * Persist across runs unless explicitly superseded.
   */
  confirmedInsights: string[];

  /**
   * Tentative readings that need more evidence.
   * May be confirmed, superseded, or acknowledged as ambiguous.
   */
  activeHypotheses: string[];

  /**
   * How deep the system has gone.
   * LLM-assessed — NOT a formula from finding maturities.
   * 'initial' = first walk only
   * 'developing' = walk + some deep dives
   * 'deep' = multiple growth cycles, most questions answered
   * 'comprehensive' = deep dives exhausted, coaching integrated
   * 'exhaustive' = student edits analyzed, re-analysis complete
   */
  maturity: 'initial' | 'developing' | 'deep' | 'comprehensive' | 'exhaustive';

  /**
   * How understanding evolved — each entry records what changed and why.
   */
  growthLog: Array<{
    timestamp: string;
    trigger: 'walk' | 'deep_dive' | 'coaching' | 'edit' | 'coherence_check';
    whatChanged: string;
  }>;
}
```

**Where it lives** — Add `essayUnderstanding: EssayUnderstanding` to `EssayProfile`, right after the holistic sections block (before northStar). Initialize it in `createDefaultProfile()` or equivalent.

**Where it's produced** — L3.75 is the natural synthesis layer. After `holisticSynthesis.synthesizeIteration()` produces the 10 sections, add one more Sonnet call (or extend the existing meta call) that reads ALL 10 sections + the reading strategy + top findings and synthesizes them into the `EssayUnderstanding` prose.

The prompt for this synthesis should:
- See the full essay text
- See all 10 holistic section summaries (compact — first 2-3 sentences each)
- See the reading strategy prose
- See the top 10 active findings (by coaching value)
- See the central tension (if previously established)
- See the previous `prose` (if this is an iteration, not first pass)
- Produce: `prose`, `centralTension`, `confirmedInsights[]`, `activeHypotheses[]`, `maturity`
- When iterating: the prompt should show the PREVIOUS prose and ask "what has CHANGED in your understanding?" — the output should be a REPLACEMENT, not an append. The prose should read as a complete, current narrative each time.

**Cost**: One Sonnet call per growth cycle iteration. ~$0.02-0.04. Cached system prompt reduces cost on iterations 2+.

**When it updates**:
- After each L3.75 synthesis iteration (during growth cycle)
- After coaching reveals reinterpretation or new context (Stage 4 deepening)
- After re-analysis completes (via reanalysisOrchestrator)

For coaching updates: when `CoachingResult.stage4Verdict` is `'superseded'` or `'confirmed'` with significant profile changes, run a lightweight update call (Haiku) that takes the current prose + the coaching insight and produces a delta update. Append a growth log entry.

**Consumers**:
- L5 annotations: Include `essayUnderstanding.prose` in the shared context block. It gives every annotation access to the synthesized mental model.
- L6 coaching: Include `essayUnderstanding.prose` (or a compact version) in the Stage 3 profile context. Replaces the current fragmented section summaries.
- Snapshot comparison: Include `essayUnderstanding.prose` in `SnapshotUnderstanding` for richer comparisons.

### Quality bar for the prose

The prose should be capable of Level 4-5 understanding (from PLAN2's hierarchy):

- Level 4 (Epistemological Insight): "The essay defines understanding as physical encounter — to know value is to hold it, weigh it, see it under light."
- Level 5 (Meta-Awareness): "The essay's commitment to physical knowing creates an ironic tension with the college essay form itself."

Not every essay will warrant Level 5. But the PROMPT should never be the ceiling. Add examples at both levels to the synthesis prompt, with a note: "Reach for the deepest available level of understanding. Not every essay has a Level 5 insight hiding in it — but when one does, you should see it."

---

## Gap 2: Persistent Question Queue

### The Problem

The growth cycle's questions are ephemeral. Each L3.75 iteration produces a fresh `QuestionCurationOutput` with curated questions — but these are derived from scratch each time. There's no tracking of:
- Which questions were asked across ALL iterations
- Which questions were ANSWERED by deep dives (vs. resolved by synthesis)
- Which questions spawned CHILD questions (investigation led to deeper questions)
- Which questions remain STUBBORNLY open (asked 3 times, never answered)
- Priority evolution: a question that 3 different analysis passes flag as important

### What to Build

**Extend `UnderstandingQuestion`** — The existing type (`profileTypes.ts:2967`) has `id`, `question`, `dimensions`, `anchorParagraph`, `expectedInsight`, `source`, `status`, `resolution`. Add:

```typescript
// Add these fields to the existing UnderstandingQuestion interface:

  /** Priority: LLM-assigned, may change as understanding deepens */
  priority: 'critical' | 'high' | 'medium' | 'low';

  /** How many growth iterations this question has survived */
  iterationsSurvived: number;

  /** Parent question ID — if this was spawned from investigating another question */
  parentQuestionId?: string;

  /** Child question IDs — questions spawned from investigating this one */
  spawnedQuestions: string[];

  /** Which growth step answered it (if resolved) */
  resolvedBy?: string;  // e.g., 'deep_dive_voice_authenticity', 'coaching_turn_3'

  /** When this question was first raised */
  raisedAt: string;  // ISO timestamp

  /** When this question was resolved (if resolved) */
  resolvedAt?: string;

  /** Which growth iteration first raised this question */
  raisedDuringIteration: number;
```

**Add `questionQueue: UnderstandingQuestion[]` to `EssayProfile`** — Right after `findings?: Finding[]`. This is the PERSISTENT store. Initialize as `[]`.

**Question Queue Manager** — Create a small utility (can live inside `growthEngine.ts` or as a new `questionQueueManager.ts`):

```typescript
class QuestionQueueManager {
  private questions: UnderstandingQuestion[];

  /** Merge curated questions from L3.75 with the persistent queue */
  mergeCuratedOutput(curation: QuestionCurationOutput, iteration: number): void;

  /** Mark a question as resolved */
  resolve(questionId: string, resolvedBy: string, resolution: string): void;

  /** Get all open questions, sorted by priority then iterationsSurvived */
  getOpenQuestions(): UnderstandingQuestion[];

  /** Get questions that have survived N+ iterations without resolution */
  getStaleQuestions(minIterations: number): UnderstandingQuestion[];

  /** Increment iterationsSurvived for all open questions */
  advanceIteration(): void;

  /** Spawn a child question from a parent */
  spawnChild(parentId: string, childQuestion: Omit<UnderstandingQuestion, 'parentQuestionId' | 'spawnedQuestions'>): UnderstandingQuestion;
}
```

**Integration into growth cycle** — In `analysisOrchestrator.runGrowthCycle()`:

1. **Initialize**: Seed the manager from `profile.questionQueue` (persistent) instead of starting with `let questionQueue: UnderstandingQuestion[] = []`
2. **After each L3.75 curation**: Call `manager.mergeCuratedOutput(curation, iteration)` instead of using the curation output directly. Merge logic:
   - Resolved questions: mark as `status: 'resolved'` with `resolvedBy` and `resolution`
   - Filtered questions: keep in queue with `status: 'filtered'` (don't delete — they may be un-filtered later)
   - New curated questions: add to queue, link as children if they evolved from existing questions
   - Existing open questions not in curation: increment `iterationsSurvived`
3. **Deep dive dispatch**: Use `manager.getOpenQuestions()` as the primary dispatch signal (replacing the current ephemeral `curatedQueue`)
4. **After deep dive completes**: If a deep dive answers a question, call `manager.resolve()`. If it spawns new questions, call `manager.spawnChild()`.
5. **Persist**: At cycle end, write `manager.getAll()` back to `profile.questionQueue`

**Question priority as dispatch signal** — The persistent queue replaces the ephemeral curated queue as the primary deep dive dispatch input. In `growthEngine.dispatchDeepDives()`:
- Sort candidates by: `priority` (critical > high > medium > low) → `iterationsSurvived` (higher = more important, it keeps coming back) → `source` (coaching > synthesis > walk)
- Stale questions (survived 3+ iterations) get auto-promoted to `high` priority

**Coaching integration** — When coaching reveals something that answers a question:
- In `coachingService.ts` Stage 4: if the reinterpretation or new context resolves a question in `profile.questionQueue`, mark it resolved
- If coaching raises new questions about the essay, add them with `source: 'coaching'`

---

## Gap 4: Maturity Gap Analysis

### The Problem

Findings have maturity (`hypothesis → developing → confirmed → deepened → superseded`), but nothing actively monitors for "stuck" findings. A finding stuck at `hypothesis` after 3 growth iterations should be either:
- Investigated (dispatch a deep dive targeting it)
- Acknowledged as genuinely ambiguous (the essay doesn't provide enough evidence)

### What to Build

**Maturity analyzer function** — Add to `growthEngine.ts` (or a new small file):

```typescript
interface MaturityGap {
  findingId: string;
  claim: string;
  maturity: FindingMaturity;
  iterationsAtCurrentMaturity: number;
  recommendation: 'investigate' | 'acknowledge_ambiguous';
  suggestedAction: string;  // e.g., "Dispatch finding_deepener for F3"
}

function analyzeMaturityGaps(
  findings: Finding[],
  growthState: GrowthCycleState,
): MaturityGap[];
```

Logic:
- Scan all findings where `maturity === 'hypothesis'` and the finding has existed for 2+ growth iterations without advancing
- Scan all findings where `maturity === 'developing'` and the finding has existed for 3+ iterations without advancing
- For each stuck finding:
  - If `deepeningPotential` is non-null → recommend `'investigate'`, suggested action = dispatch the appropriate deep dive
  - If `deepeningPotential` is null → recommend `'acknowledge_ambiguous'`

**How to track iterations**: Findings don't currently track how many iterations they've been at their current maturity. Two options:
- Option A (simple): Compare findings against the growth step activity log. If a finding was created in iteration 0 and it's now iteration 3 with no maturity change, it's stuck.
- Option B (explicit): Add `iterationsAtCurrentMaturity: number` to the `Finding` interface. Increment it each growth iteration; reset to 0 when maturity changes.

Choose Option A (simpler — no type changes to Finding). Use `finding.createdAt` timestamp vs `growthState.iteration` count. A finding created in iteration 0 that's still `hypothesis` in iteration 2 → stuck.

**Integration into growth cycle** — In `analysisOrchestrator.runGrowthCycle()`, after each iteration:
1. Run `analyzeMaturityGaps(cumulativeFindings, state)`
2. For gaps with `recommendation: 'investigate'`:
   - Convert to `UnderstandingQuestion` with `source: 'maturity_gap'`
   - Add to the persistent question queue via the manager
   - These questions compete for deep dive dispatch alongside L3.75's curated questions
3. For gaps with `recommendation: 'acknowledge_ambiguous'`:
   - Log the acknowledgment
   - Do NOT delete the finding — it's still valid information
   - Optionally add a note to the finding's `deepeningPotential`: `null` (already done if recommendation is acknowledge)

**Feed into essay understanding** — When maturity gaps are found, include them in the next L3.75 synthesis context:
- "Finding F3 ('the constraint-creativity claim is stated not earned') has remained at hypothesis for 3 iterations. Either investigate it or acknowledge the essay may be genuinely ambiguous on this point."
- This gives L3.75 the agency to either dispatch investigation or update the understanding prose to reflect the ambiguity.

---

## Implementation Order

These three gaps have dependencies:

```
Gap 2 (Persistent Questions) ← no dependencies, foundational
Gap 4 (Maturity Analysis)    ← depends on Gap 2 (feeds questions into queue)
Gap 1 (Understanding Prose)  ← depends on Gap 2 (references question queue state in prose)
```

**Recommended sequence**: Gap 2 → Gap 4 → Gap 1

### Files to modify:

**Gap 2**:
- `profileTypes.ts` — extend `UnderstandingQuestion`, add `questionQueue` to `EssayProfile`
- `growthEngine.ts` (or new `questionQueueManager.ts`) — queue CRUD
- `analysisOrchestrator.ts` — wire persistent queue into growth cycle
- `essayProfileManager.ts` — initialize `questionQueue: []` in profile creation

**Gap 4**:
- `growthEngine.ts` — add `analyzeMaturityGaps()` function
- `analysisOrchestrator.ts` — call gap analysis after each iteration, feed gaps into question queue

**Gap 1**:
- `profileTypes.ts` — add `EssayUnderstanding` interface, add field to `EssayProfile`
- `holisticSynthesis.ts` — add synthesis call that produces understanding prose
- `analysisOrchestrator.ts` — wire understanding prose into growth cycle output
- `essayProfileManager.ts` — initialize `essayUnderstanding` in profile creation
- `deepAnnotationService.ts` — include prose in shared context
- `coachingService.ts` — include prose in Stage 3 context
- `snapshotComparator.ts` / `snapshotManager.ts` — include prose in snapshot understanding

---

## LLM-First Design Reminders

1. **Maturity assessment is LLM-judged**: `EssayUnderstanding.maturity` is produced by the LLM synthesis call, NOT computed from finding maturities or question queue counts. The LLM sees the evidence and judges depth.

2. **Question priority can evolve**: The LLM may re-prioritize questions when it sees the full picture. If L3.75's curation downgrades a `critical` question to `medium`, respect that — the LLM has context we don't.

3. **The prose is the primary output**: The 10 holistic sections are the structured breakdown. The prose is what a human expert would say if asked "what do you see in this essay?" The prose should DISAGREE with sections if the sections are contradictory — it's the SYNTHESIS, not the concatenation.

4. **No formula for "stuck"**: The maturity gap analysis uses iteration count as a SIGNAL, not a deterministic trigger. The gap analysis produces CANDIDATES. The question queue and L3.75 decide what to DO with them. If L3.75 says "F3 is genuinely ambiguous, stop investigating," that's the answer.

5. **Never delete questions**: Filtered questions get `status: 'filtered'`, not deleted. Resolved questions get `status: 'resolved'`. The full question history is diagnostic gold.

---

## Verification

After implementation, verify:

1. **Type check**: `npx tsc --noEmit` clean
2. **Profile initialization**: New profiles have `essayUnderstanding` and `questionQueue` initialized
3. **Growth cycle integration**: `runGrowthCycle()` reads from persistent queue, merges curated output, persists at end
4. **Maturity gaps feed questions**: Stuck findings generate investigation questions in the queue
5. **Understanding prose grows**: First synthesis ~300 words, after 2+ iterations ~500+ words
6. **Consumers receive prose**: L5 and L6 prompts include `essayUnderstanding.prose` in their context
