# Implementation Prompt: Improvement #10 -- Version Branching

## Context

When a student revises their essay, they face a constant dilemma: "What if this change makes it worse?" Currently, the system treats essay revision as a linear sequence. Each edit overwrites the previous version. The student cannot explore an alternative direction without committing to it. If they want to try a bolder P3 rewrite, they have to either take the leap or abandon the idea.

Version branching gives the student **safe exploration space**: the ability to try alternative versions of passages without losing their current work, and to get the system's comparison of which version serves the essay better. The key insight is that the comparison is not about text diffing -- it is about **understanding diffing**. "Version A earns P5 better but Version B has stronger voice" is the comparison that matters, not "Version A has 12 more words."

This is the most complex improvement in the V2 system. The design must resist the temptation to build a full Git-like branching/merging apparatus. The minimum viable version delivers 80% of the value: **snapshot + explore + compare**.

---

## Design Principles (LLM-First Rules That Apply Here)

### From Rule 1: The LLM Owns All Judgment

**The LLM compares branches, not a formula.** No point-based `BranchComparison.recommendation` with weighted scoring. The LLM receives both versions' understanding (findings, connections, prose) and produces a comparative analysis in prose: what each version does better, what each sacrifices, and what the trade-off reveals about the student's priorities.

**The LLM detects understanding deltas, not text deltas.** The interesting question is not "what words changed" but "what understanding changed." If a student rewrites P3 with different words but the understanding is the same (cosmetic edit), the branches are effectively identical for that paragraph. The LLM assesses whether the understanding diverged.

**The LLM decides what constitutes a meaningful branch point, not a threshold.** No rigid "semantic distance > 0.7 = suggest branching" formula. The LLM recognizes branch-worthy moments through context: "The student has written two different openings in quick succession," or "The coach asked 'what if you tried X?' and the student responded with a draft."

### From Rule 2: Never Discard Paid LLM Output

Branch-specific understanding (findings, connections, readings) is never deleted when a branch is abandoned. It is archived with the branch metadata. If the student later returns to that direction, the understanding is available. The system paid for it; it keeps it.

### From Rule 6: System Infrastructure for Bookkeeping

Maximum 5 branches and 2 nesting levels are resource limits (operational constraint, not analytical judgment). Branch IDs, creation timestamps, parent branch pointers, text snapshots -- all system bookkeeping. The version tracker (existing `versionTracker.ts`) manages the bookkeeping layer.

---

## Context from Cluster C Implementation (Forward Propagation)

> The following discoveries from Cluster C (#7 Iterative L3.75 + #8 Adaptive Router) affect this improvement.

### Key Integration Points

1. **Finding lifecycle is the authoritative understanding record.** When snapshotting, deep-copy the `FindingStore`'s findings array (via `findingStore.getAll()`). Findings have maturity levels (hypothesis→developing→confirmed→deepened→superseded) and `buildsOn`/`relatedTo` relationships. A snapshot comparison should show finding evolution: "In your snapshot, F3 was a hypothesis about voice performing authenticity. In your current version, F3 was deepened to show the performance IS the essay's meta-argument."

2. **Connection graph is bidirectional.** Snapshot comparison should include connection deltas: gained connections, lost connections, and changed strength categories. Use `ConnectionGraph.fromArray()` to reconstruct the graph from the snapshot's frozen connections.

3. **Growth cycle state gives comparison context.** If the snapshot was taken mid-growth-cycle (e.g., after 2 iterations), the comparison LLM should know that the snapshot's understanding was still deepening. The `GrowthCycleState.isConverged` and `convergenceReason` fields tell you whether the snapshot captured a converged or in-progress understanding.

4. **ReadingStrategy may differ between snapshot and current.** The reading strategy is LLM-produced guidance about how to read THIS essay. After edits, the reading strategy may change (e.g., a voice-dominant essay becomes structure-dominant after a rewrite). The comparison should surface reading strategy changes as a first-class delta: "The system now reads your essay as primarily about structural innovation rather than voice authenticity."

5. **Don't re-run the growth cycle on snapshots.** The snapshot captures frozen understanding. Comparison is a single Sonnet call that sees both states and produces prose comparison. The growth cycle only runs on the current (live) version after edits.

---

## Core Architecture: The Minimum Viable Branch

### Design Decision: Snapshot + Explore + Compare

The full Git-like branching model (create branch, switch between branches, merge branches, cherry-pick changes, resolve conflicts) is massive complexity for uncertain value. The MVP that delivers 80% of the value:

1. **Snapshot**: Save the current state (text + understanding) as a named checkpoint.
2. **Explore**: Continue editing on the main branch. The snapshot is frozen.
3. **Compare**: Ask the system to compare the current state with any snapshot.

This is "branching" without the branch management overhead. No switching between branches. No merging. No conflict resolution. The student always works on their current version and can compare backward to any snapshot.

**Why this is 80% of the value:**
- The student's primary anxiety is "what if this makes it worse?" A snapshot resolves that: they can always compare back.
- The comparison is the high-value output: "Version A (your snapshot) earns the climax better, but your current version has stronger voice in the opening. The trade-off is..."
- Full branch switching (editing both versions simultaneously) is rarely needed and adds enormous complexity to the finding store, connection graph, and coaching context.

**When to upgrade beyond MVP:** If user research shows students frequently want to maintain two parallel versions and switch between editing them, that is the signal to build full branching. Until then, snapshot + compare is sufficient.

### Type Definitions

```typescript
// In profileTypes.ts or a new versionBranching.ts

/**
 * Snapshot -- a frozen point-in-time capture of essay state.
 * Immutable once created. Text + understanding are preserved.
 */
interface EssaySnapshot {
  id: string;

  /** Human-readable name, either student-provided or auto-generated */
  name: string;

  /** When this snapshot was created */
  createdAt: string;

  /** What prompted the snapshot -- LLM-described context */
  context: string;

  /** The essay text at snapshot time -- frozen */
  text: string;

  /** The paragraph count at snapshot time (for structural comparison) */
  paragraphCount: number;

  /**
   * Understanding state at snapshot time -- frozen copies.
   * These are deep copies, not references, so the main branch's
   * evolution doesn't affect snapshot state.
   *
   * INCLUDE: everything that represents the essay's understanding.
   * EXCLUDE: operational state (growth cycle activity log, convergence
   * state, cost tracking, session memory). These belong to the analysis
   * run, not the essay's understanding.
   */
  understanding: {
    /** Essay-level understanding prose */
    essayUnderstanding: string;
    /** Per-paragraph readings */
    paragraphReadings: Array<{ paragraph: number; reading: string }>;
    /** Active findings (deep copy) */
    findings: Finding[];
    /** Active connections (deep copy) */
    connections: Connection[];
    /** Graph summary */
    connectionGraphSummary: string;
    /** Holistic sections (voice, emotion, etc.) */
    holisticSections: Record<string, unknown>;
    /** Question queue state */
    questionQueue: UnderstandingQuestion[];
    /** Understanding maturity */
    maturity: string;
    /**
     * Reading strategy -- how to read THIS essay (deep copy).
     * This is understanding about the essay, not operational state.
     * Changes with edits because the essay itself changes.
     * Includes contextPriorities for router ordering.
     */
    readingStrategy: ReadingStrategy | null;
    /** Phase assessment at snapshot time */
    improvementPhase: ImprovementPhase | null;
  };

  /** Source -- what triggered the snapshot */
  source: SnapshotSource;

  /** If this snapshot was auto-suggested, the trigger description */
  autoTrigger?: string;

  /** Parent snapshot ID, if this is a snapshot-of-a-snapshot (nesting) */
  parentSnapshotId?: string;
}

type SnapshotSource =
  | 'student_manual'      // Student explicitly asked to save a snapshot
  | 'coach_suggested'     // Coach suggested saving before a major change
  | 'auto_before_rewrite' // System auto-saved before a detected major rewrite
  | 'auto_milestone';     // System auto-saved at a growth milestone

/**
 * SnapshotComparison -- the LLM's comparative analysis of two versions.
 * Pure LLM output with no deterministic scoring.
 */
interface SnapshotComparison {
  /** The snapshot being compared to */
  snapshotId: string;
  /** The snapshot name */
  snapshotName: string;
  /** When the comparison was generated */
  comparedAt: string;

  /**
   * The comparative analysis -- LLM-generated prose.
   * NOT a score. NOT a recommendation. A nuanced comparison
   * that helps the student understand what each version does.
   *
   * Example:
   * "Your current version rewrites P3 with a specific scene (the
   *  late-night debugging moment). This grounds your constraint-creativity
   *  claim in concrete experience for the first time -- something the
   *  snapshot version never achieved. However, the rewrite disrupts the
   *  rhythmic pattern that P2->P3->P4 established in the snapshot: the
   *  snapshot's P3 was a brief transitional paragraph that kept momentum
   *  moving toward P4's climax. Your new P3 is richer but slows the
   *  essay's forward motion.
   *
   *  The trade-off: concrete evidence (current) vs. narrative momentum
   *  (snapshot). Your current version is architecturally stronger because
   *  it earns the climax, but you may want to tighten the new P3 to
   *  recover some of the momentum you lost."
   */
  analysis: string;

  /**
   * Per-paragraph understanding deltas -- where understanding diverged.
   * Only paragraphs where understanding MEANINGFULLY changed.
   */
  paragraphDeltas: Array<{
    paragraph: number;
    /** Did the text change? */
    textChanged: boolean;
    /** Did the understanding change? (can be no even if text changed) */
    understandingChanged: boolean;
    /** What changed in understanding, if anything */
    understandingDelta: string | null;
    /** Which version serves the essay better for THIS paragraph, and why */
    assessment: string;
  }>;

  /**
   * Structural comparison -- did the essay's architecture change?
   * Connections gained, lost, or changed.
   */
  structuralDelta: {
    /** Connections present in snapshot but not current */
    lostConnections: Array<{ id: string; description: string; significance: string }>;
    /** Connections present in current but not snapshot */
    gainedConnections: Array<{ id: string; description: string; significance: string }>;
    /** Connections present in both but changed */
    changedConnections: Array<{ id: string; changeDescription: string }>;
    /** Overall architectural assessment */
    architecturalAssessment: string;
  };

  /**
   * Finding comparison -- what understanding diverged?
   */
  findingDelta: {
    /** Findings that exist in current but not snapshot */
    newFindings: string[];
    /** Findings that exist in snapshot but were superseded in current */
    supersededFindings: Array<{ snapshotFindingId: string; currentSuccessor: string; reason: string }>;
    /** Findings that exist in both but at different maturity levels */
    maturityDifferences: Array<{ findingId: string; snapshotMaturity: string; currentMaturity: string }>;
  };

  /**
   * Coaching implications -- what does this comparison mean for coaching?
   * This is what the coach uses to guide the student.
   */
  coachingImplications: string;
}

/**
 * SnapshotManager state -- system bookkeeping for all snapshots.
 */
interface SnapshotManagerState {
  /** All snapshots, ordered by creation time */
  snapshots: EssaySnapshot[];
  /** Maximum allowed snapshots (resource limit) */
  maxSnapshots: number;  // default: 5
  /** Cached comparisons (avoid re-running expensive LLM calls) */
  cachedComparisons: Map<string, SnapshotComparison>;
}
```

### The Snapshot Manager

```typescript
// snapshotManager.ts -- snapshot CRUD + comparison orchestration

class SnapshotManager {
  private snapshots: EssaySnapshot[] = [];
  private cachedComparisons: Map<string, SnapshotComparison> = new Map();
  private nextId: number = 1;
  private readonly maxSnapshots: number = 5;

  /** Create a snapshot of the current state */
  createSnapshot(
    name: string,
    context: string,
    currentText: string,
    understanding: EssaySnapshot['understanding'],
    source: SnapshotSource,
    autoTrigger?: string,
    parentSnapshotId?: string,
  ): EssaySnapshot {
    if (this.snapshots.length >= this.maxSnapshots) {
      throw new Error(
        `Maximum ${this.maxSnapshots} snapshots reached. ` +
        `Delete an existing snapshot before creating a new one.`
      );
    }

    // Nesting limit: max 2 levels
    if (parentSnapshotId) {
      const parent = this.getSnapshot(parentSnapshotId);
      if (parent?.parentSnapshotId) {
        throw new Error('Maximum snapshot nesting depth (2) reached.');
      }
    }

    const snapshot: EssaySnapshot = {
      id: `snap-${this.nextId++}`,
      name,
      createdAt: new Date().toISOString(),
      context,
      text: currentText,
      paragraphCount: currentText.split(/\n\n+/).length,
      understanding: JSON.parse(JSON.stringify(understanding)), // deep copy
      source,
      autoTrigger,
      parentSnapshotId,
    };

    this.snapshots.push(snapshot);

    // Invalidate cached comparisons (current state changed relative to snapshot)
    this.cachedComparisons.clear();

    return snapshot;
  }

  /** Get a specific snapshot */
  getSnapshot(id: string): EssaySnapshot | undefined {
    return this.snapshots.find(s => s.id === id);
  }

  /** List all snapshots (for UI) */
  listSnapshots(): Array<{
    id: string;
    name: string;
    createdAt: string;
    source: SnapshotSource;
    paragraphCount: number;
  }> {
    return this.snapshots.map(s => ({
      id: s.id,
      name: s.name,
      createdAt: s.createdAt,
      source: s.source,
      paragraphCount: s.paragraphCount,
    }));
  }

  /** Delete a snapshot (student explicitly removes it) */
  deleteSnapshot(id: string): void {
    const index = this.snapshots.findIndex(s => s.id === id);
    if (index === -1) throw new Error(`Snapshot ${id} not found`);

    // Check for children
    const children = this.snapshots.filter(s => s.parentSnapshotId === id);
    if (children.length > 0) {
      // Orphan children (remove parent reference, don't delete them)
      for (const child of children) {
        child.parentSnapshotId = undefined;
      }
    }

    this.snapshots.splice(index, 1);
    // Remove cached comparisons involving this snapshot
    for (const key of this.cachedComparisons.keys()) {
      if (key.includes(id)) this.cachedComparisons.delete(key);
    }
  }

  /**
   * Get a cached comparison, or null if not cached.
   * Cache key includes snapshot ID + a hash of current understanding state
   * (comparisons are invalidated when the current state changes).
   */
  getCachedComparison(
    snapshotId: string,
    currentStateHash: string,
  ): SnapshotComparison | null {
    const key = `${snapshotId}:${currentStateHash}`;
    return this.cachedComparisons.get(key) || null;
  }

  /** Store a comparison in cache */
  cacheComparison(
    snapshotId: string,
    currentStateHash: string,
    comparison: SnapshotComparison,
  ): void {
    const key = `${snapshotId}:${currentStateHash}`;
    this.cachedComparisons.set(key, comparison);
  }
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/essayIntelligence/versioning/snapshotManager.ts` | CREATE | SnapshotManager class -- snapshot CRUD + caching |
| `src/services/essayIntelligence/versioning/snapshotComparator.ts` | CREATE | Orchestrates LLM comparison calls |
| `src/services/essayIntelligence/versioning/snapshotTrigger.ts` | CREATE | Auto-snapshot detection logic |
| `src/services/essayIntelligence/versioning/index.ts` | CREATE | Barrel export |
| `src/services/essayIntelligence/profileTypes.ts` | MODIFY | Add EssaySnapshot, SnapshotComparison, SnapshotSource types |
| `src/services/essayIntelligence/versionTracker.ts` | MODIFY | Integrate snapshot creation into version lifecycle |
| `src/services/essayIntelligence/coaching/` | MODIFY | Coach accesses snapshot comparison data |
| `tests/test-snapshot-branching.ts` | CREATE | Snapshot lifecycle + comparison tests |

---

## Deeper Design Questions (with Proposed Answers)

### 1. Branch Analysis Cost: Reusing Main Branch Understanding

When a student creates a snapshot and then edits P3, we need to analyze the new P3. But we already have understanding for the pre-edit P3 (now frozen in the snapshot). How much can we reuse?

**Answer: All non-P3 understanding is shared. Only P3 needs re-analysis.**

The snapshot freezes the pre-edit state. The current (main) branch continues with the edit. The re-analysis of P3 on the main branch is exactly the focused re-analysis that PLAN2 already defines -- it uses the existing understanding as context and only re-analyzes the edited paragraph.

**No additional cost for snapshots.** The snapshot creation itself is free (it is a deep copy of existing state -- no LLM call). The re-analysis of P3 happens on the main branch regardless of whether a snapshot exists. The only additional cost comes when the student requests a comparison -- that is a single Sonnet call.

**Comparison cost optimization:** The comparison call receives both versions' understanding as context, not both versions' full analysis pipeline output. The pre-computed understanding is compact (findings + readings + connections), so the comparison call is a single focused Sonnet call (~$0.03-0.08).

```typescript
// snapshotComparator.ts

async function compareToSnapshot(
  snapshotId: string,
  currentState: CurrentEssayState,
  snapshotManager: SnapshotManager,
): Promise<SnapshotComparison> {
  const snapshot = snapshotManager.getSnapshot(snapshotId);
  if (!snapshot) throw new Error(`Snapshot ${snapshotId} not found`);

  // Check cache first
  const stateHash = hashCurrentState(currentState);
  const cached = snapshotManager.getCachedComparison(snapshotId, stateHash);
  if (cached) return cached;

  // Build comparison context for LLM
  const context = buildComparisonContext(snapshot, currentState);

  // Single Sonnet call -- comparison is a judgment call
  const response = await callSonnet({
    system: COMPARISON_SYSTEM_PROMPT,
    user: context,
    responseFormat: 'json',
  });

  const comparison = parseComparisonResponse(response, snapshotId, snapshot.name);

  // Cache the result
  snapshotManager.cacheComparison(snapshotId, stateHash, comparison);

  return comparison;
}
```

### 2. Understanding Deltas: Detecting Cosmetic vs. Meaningful Edits

The student rewrites P3 with different words. Did the understanding change? This is the key question for comparison -- and it must be LLM-judged, not text-diffed.

**Three cases:**

1. **Text changed, understanding unchanged (cosmetic edit):** The student rephrased P3 but the meaning is the same. Findings about P3 are still accurate. Connections through P3 are still valid. The paragraphDelta entry shows `textChanged: true, understandingChanged: false`.

2. **Text changed, understanding changed (meaningful edit):** The student added a concrete scene to P3 where there was previously an abstract assertion. Multiple findings are superseded or deepened. Connections may have changed strength. The paragraphDelta entry shows both true.

3. **Text unchanged, understanding changed (insight from coaching):** The student didn't edit P3, but coaching revealed that P3's metaphor references a specific personal experience. The understanding deepens without text change. This is not a branching scenario -- it is a growth step on the main branch.

**The comparison prompt handles all three:**

```
For each paragraph that changed between the snapshot and the current version:

1. Did the TEXT change? (Compare the actual words.)
2. Did the UNDERSTANDING change? This is the important question.
   Compare the findings, readings, and connections for this paragraph
   between the two versions. If the findings are essentially the same
   (same claims, same maturity, same connections), then the understanding
   didn't change -- it was a cosmetic edit.
3. If the understanding changed, describe the delta: what does the
   current version understand about this paragraph that the snapshot
   version didn't, and vice versa?
4. For this paragraph specifically, which version serves the essay's
   architecture better? WHY?

Do NOT default to "the current version is better because it's newer."
Sometimes the snapshot version is genuinely stronger. Say so if it is.
```

### 3. Implicit Branching: Auto-Snapshot Triggers

Beyond explicit "save a snapshot" requests, the system should recognize patterns that suggest the student is at a branch point:

**Pattern 1: Major rewrite detected.**
When the version tracker records an edit that changes >40% of a paragraph's text (measured by character-level diff), auto-snapshot BEFORE the edit is applied. The student can always compare back.

```typescript
// snapshotTrigger.ts

function shouldAutoSnapshot(
  editEvent: EditEvent,
  currentState: CurrentEssayState,
  snapshotManager: SnapshotManager,
): { should: boolean; reason: string } | null {
  // Don't auto-snapshot if we already have a recent snapshot
  const lastSnapshot = snapshotManager.listSnapshots().at(-1);
  if (lastSnapshot) {
    const msSinceLastSnapshot =
      Date.now() - new Date(lastSnapshot.createdAt).getTime();
    if (msSinceLastSnapshot < 60_000) { // less than 1 minute ago
      return null;
    }
  }

  // Pattern 1: Major rewrite
  const changeRatio = editEvent.changedCharacters / editEvent.originalLength;
  if (changeRatio > 0.4) {
    return {
      should: true,
      reason: `Major rewrite of P${editEvent.paragraph} detected ` +
              `(${Math.round(changeRatio * 100)}% changed). ` +
              `Auto-saving snapshot before the change.`,
    };
  }

  // Pattern 2: Structural change (paragraph added/removed/reordered)
  if (editEvent.type === 'structural') {
    return {
      should: true,
      reason: `Structural change detected (${editEvent.structuralChange}). ` +
              `Auto-saving snapshot before the change.`,
    };
  }

  return null;
}
```

**Pattern 2: Coach suggests exploration.** When the coach says something like "What if you tried X instead?", the coaching system can suggest creating a snapshot before the student experiments. This is a coach-initiated snapshot, not a system-detected one.

```
// In coaching prompt:
When you suggest the student try an alternative approach -- a different
opening, a different structure, a different metaphor -- recommend they
save a snapshot first:

"Before you try this, let's save where you are now. That way you can
compare both versions and see which one serves your essay better.
[Save snapshot: 'Before alternative opening']"
```

**Pattern 3: Growth milestone.** When the system reaches a convergence point (understanding maturity reaches 'deep' for the first time, or a critical finding is confirmed), auto-snapshot as a milestone. This gives the student a trail of their essay's evolution.

**Pattern 4: Student asks "what if?"** During coaching, if the student says "What if I tried X?" or "I'm thinking about changing P3 to...", the coach should proactively suggest saving a snapshot. This requires the coaching prompt to recognize exploration intent.

**NOT a trigger:** Rapid small edits (fixing typos, adjusting word choice). These are too granular for snapshots and would fill the 5-snapshot limit with noise. The auto-snapshot triggers are calibrated for significant moments.

### 4. Coaching Integration: Snapshot-Aware Coaching

When the student has snapshots, the coach should be aware of them and reference them when relevant.

**How coaching accesses snapshot data:**

```typescript
interface CoachingContext {
  // ... existing fields ...

  /** Available snapshots (summaries, not full state) */
  availableSnapshots: Array<{
    id: string;
    name: string;
    createdAt: string;
    paragraphCount: number;
    /** One-sentence summary of what was different at snapshot time */
    briefDelta: string;
  }>;

  /** Most recent comparison (if student asked for one) */
  lastComparison?: SnapshotComparison;
}
```

**Coaching prompt additions:**

```
=== SNAPSHOT AWARENESS ===

The student has saved {N} snapshots of their essay. These represent
earlier versions they might want to compare against.

Available snapshots:
{snapshot list with names and brief deltas}

When the student asks about previous versions, compares options, or
wonders about trade-offs, you can reference snapshots:

"You tried a more concrete opening in your current version compared
to 'Before rewrite' (snap-2). That snapshot's P1 was more poetic but
less grounded. Your current P1 earns P4 better because it establishes
the kinesthetic register that P4's 'seeing users smile' pays off."

When suggesting risky changes, recommend saving a snapshot first:

"I'd suggest trying a completely different structure for P3. Before
you do, save a snapshot so you can compare both approaches."

Do NOT suggest snapshots when the student is making small refinements.
Snapshots are for significant exploration moments.
```

**Comparison-informed coaching:** When the student requests a comparison, the coach receives the `SnapshotComparison` as context. The coach can then guide the student through the trade-offs:

```
=== COMPARISON CONTEXT ===

The student compared their current version to snapshot "{name}":
{comparison.analysis}

Structural changes:
{comparison.structuralDelta.architecturalAssessment}

Coaching implications:
{comparison.coachingImplications}

Use this comparison to help the student decide which direction to pursue.
Do NOT make the decision for them -- illuminate the trade-offs:
- What does each version do better?
- What does each version sacrifice?
- What does the choice reveal about the student's priorities?
- Is there a way to get the best of both versions?
```

### 5. Simplicity: The MVP Boundary

The MVP is **snapshot + compare**. Here is what is explicitly OUT of scope for the initial implementation, and the signal that would trigger upgrading:

**OUT of scope:**
- **Branch switching** (editing the snapshot version while preserving the current version). Signal to add: users frequently say "I want to go back to the old version and edit from there."
- **Merging** (combining parts of two versions). Signal to add: users say "I like P1 from the old version and P3 from the new version."
- **Cherry-picking** (pulling one change from a snapshot into the current version). Signal to add: users want to selectively undo specific changes.
- **Diff visualization** (showing text changes side-by-side in the UI). This is a UI feature, not a system architecture feature. It can be added independently.
- **Automatic version comparison after every edit.** Too expensive. Comparison is on-demand only.

**IN scope (MVP):**
- Create snapshot (manual or auto-triggered)
- List snapshots
- Delete snapshot
- Compare current state to any snapshot (on-demand, cached)
- Coach awareness of snapshots
- Coach-suggested snapshots before risky changes
- Auto-snapshots before major rewrites
- Maximum 5 snapshots (resource limit)

**Cost model:**
- Snapshot creation: $0 (deep copy, no LLM call)
- Comparison: ~$0.03-0.08 per comparison (single Sonnet call)
- Auto-snapshot trigger detection: $0 (heuristic checks, no LLM call)
- Coach snapshot awareness: $0 (included in existing coaching context)

---

## Prompt Engineering Guidance

### Comparison Prompt

```
=== ESSAY VERSION COMPARISON ===

You are comparing two versions of an essay. Your job is NOT to declare
a winner. Your job is to illuminate what each version does better and
what it sacrifices -- so the student can make an informed choice.

=== SNAPSHOT VERSION (saved as "{snapshot_name}" on {date}) ===

Essay text:
{snapshot_text}

Understanding at snapshot time:
{snapshot_understanding_prose}

Key findings:
{snapshot_findings_summary}

Connection architecture:
{snapshot_graph_summary}

=== CURRENT VERSION ===

Essay text:
{current_text}

Current understanding:
{current_understanding_prose}

Key findings:
{current_findings_summary}

Connection architecture:
{current_graph_summary}

=== YOUR ANALYSIS ===

1. PARAGRAPH-BY-PARAGRAPH COMPARISON
   For each paragraph that changed (skip unchanged paragraphs):
   - Did the TEXT change? If so, how?
   - Did the UNDERSTANDING change? (This is the important question.)
     The text might have changed cosmetically while the understanding
     stayed the same, or vice versa.
   - Which version of this paragraph serves the essay better? WHY?
   - Be specific: "Version A's P3 earns the climax through a concrete
     scene, while Version B's P3 used abstract assertion."

2. ARCHITECTURAL COMPARISON
   How did the essay's connection architecture change?
   - What connections were gained or lost?
   - Did the essay's structural topology change (hub-and-spoke to linear,
     sparse to web, etc.)?
   - Is the essay more or less coherent architecturally?

3. TRADE-OFF ANALYSIS
   What is the essential trade-off between these versions?
   Not "current is better" but "current gains X at the cost of Y."
   Name the specific trade-off.

4. COACHING IMPLICATIONS
   What does this comparison reveal about the student's revision instincts?
   Are they improving or just changing? What would they need to do to
   get the best of both versions?

Produce your analysis in the SnapshotComparison JSON format.
```

### Auto-Snapshot Notification

When the system auto-creates a snapshot, the coach should briefly acknowledge it:

```
// In coaching system prompt:
When an auto-snapshot is created during the conversation, acknowledge
it naturally and briefly:

"I noticed you're making a significant change to your opening.
I've saved a snapshot of where you were ('Before P1 rewrite') so
you can compare later if you want."

Keep it to 1-2 sentences. Don't make a big deal of it. The snapshot
is a safety net, not a ceremony.
```

### Coach Suggesting Snapshots

```
// In coaching system prompt:
When you're about to suggest a bold revision — rewriting a paragraph,
restructuring the essay, trying a completely different approach — suggest
saving a snapshot first. But ONLY for bold revisions, not for small
refinements.

SUGGEST snapshot:
"What if you opened with the debugging scene instead of the philosophy?
Before you try that, let's save a snapshot so you can compare both
approaches."

DON'T suggest snapshot:
"Try replacing 'passionate' with a more specific word." (Too small
for a snapshot.)
```

---

## Integration Points

### With Improvement #1 (Finding Lifecycle)

**Snapshots freeze the finding store.** When a snapshot is created, all active findings are deep-copied into the snapshot. The main branch's finding store continues to evolve. The comparison uses both stores to compute finding deltas.

**Finding IDs must be globally unique.** Since both the snapshot and the main branch reference the same pre-snapshot findings, ID uniqueness is already guaranteed. Post-snapshot findings on the main branch get new IDs that the snapshot doesn't have. The comparison can identify "findings only in current" by checking which IDs don't appear in the snapshot's finding list.

**Supersession chains may diverge.** If finding F5 existed at snapshot time and was later superseded by F12 on the main branch, the snapshot still shows F5 as active. The comparison highlights this: "F5 (active in snapshot, superseded in current by F12) -- the current version deepened this understanding."

### With Improvement #3 (Connections)

**Snapshots freeze the connection graph.** Deep copy of all active connections. The comparison uses both graphs to compute structural deltas.

**Connection revalidation after edits only applies to the main branch.** The snapshot's connections are frozen and never revalidated. The comparison may note: "Connection C3 was foundational in the snapshot but was invalidated in the current version by the P3 edit."

**Graph topology comparison is high-value.** "The snapshot had a hub-and-spoke structure centered on P3. After the rewrite, the current version has a web structure with connections distributed more evenly." This architectural comparison is often more insightful than paragraph-level text comparison.

### With PLAN2's Growth Engine

**Snapshots are growth milestones.** The growth engine can trigger auto-snapshots when understanding reaches maturity milestones: first time `maturity` reaches 'deep', first time all dimensions reach 'understood', etc.

**Comparison feeds back into coaching.** The `coachingImplications` field in SnapshotComparison tells the coach what the student's revision instincts reveal. This enriches the coaching context for subsequent turns.

**Snapshot understanding counts as "prior understanding" for re-analysis.** If the student decides to revert to a snapshot version (by manually copying the text back), the system can use the snapshot's understanding as the starting point for re-analysis, avoiding the cost of a full re-walk.

---

## Implementation Sequence

### Step 1: Types and SnapshotManager (day 1)
1. Define types: `EssaySnapshot`, `SnapshotComparison`, `SnapshotSource`
2. Create `snapshotManager.ts` with CRUD operations
3. Unit tests: create, list, delete, max snapshot enforcement, nesting limit

### Step 2: Snapshot Creation Integration (day 2)
1. Integrate snapshot creation into the version tracker lifecycle
2. Build the `createSnapshot()` call that deep-copies current understanding state
3. Wire up to the coaching service (student can say "save a snapshot")
4. Integration test: create snapshot, verify deep copy isolation (mutations to main don't affect snapshot)

### Step 3: Auto-Snapshot Triggers (day 2)
1. Create `snapshotTrigger.ts` with pattern detection (major rewrite, structural change)
2. Integrate trigger checks into the edit recording path (versionTracker.recordEdit)
3. Integration test: large edit triggers auto-snapshot, small edit does not

### Step 4: Comparison Engine (days 3-4)
1. Create `snapshotComparator.ts` with comparison orchestration
2. Build the comparison prompt (both versions' understanding as context)
3. Build the comparison parser (structured SnapshotComparison from LLM JSON)
4. Implement comparison caching (keyed on snapshot ID + current state hash)
5. Integration test: create snapshot, make edits, compare, verify comparison captures understanding delta

### Step 5: Coaching Integration (day 4-5)
1. Add snapshot awareness to coaching context
2. Add snapshot list to coaching prompt
3. Add comparison context to coaching prompt (when student requests comparison)
4. Add coach-suggested snapshot prompts (before bold revisions)
5. Add auto-snapshot acknowledgment in coaching responses
6. Integration test: coach references snapshots appropriately, suggests snapshots before bold changes

### Step 6: End-to-End Test (day 5)
1. Full lifecycle: write essay -> analyze -> snapshot -> major edit -> re-analyze -> compare -> coach discusses trade-offs
2. Verify: snapshot creation cost ($0), comparison cost (~$0.05), coach awareness works
3. Verify: 5-snapshot limit enforced, nesting limit enforced
4. Score against quality rubric: comparison analysis is genuinely insightful (not just text diffing)

**Total: ~5 days. MVP delivers snapshot + compare + coach awareness. Full branching deferred until user research signals demand.**
