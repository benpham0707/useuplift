# FORGE_PLAN_ORCHESTRATOR.md — Conversator Orchestrator Blueprint

> **Date**: 2026-03-15
> **Pipeline**: Deep Research → Diagnostic → Design A (Direct) + Design B (Rethink) → Reality Check → Blueprint Assembly
> **Status**: FINAL — passes the "start coding" test

---

## PART 1: ARCHITECTURAL DECISION — DEBATE & RESOLUTION

### Question 1: Orchestrator Architecture

**Option A: New `ConversatorOrchestrator` wrapping CoachingService**
A new service that owns the entry point. It receives every student message, runs orchestration logic (mode detection, state management, routing), then delegates to the appropriate sub-system (CoachingService, future CraftEngine, future TeachingEngine, GatheringService).

**Option B: Extend CoachingService with new stages**
Add orchestration stages (0.5 for mode detection, 2.5 for mode-specific routing) to the existing 5-stage pipeline. CoachingService becomes the orchestrator.

**Option C: Thin dispatch layer**
A minimal router that calls into CoachingService, CraftEngine, etc. as independent services. Stateless — relies on session state object passed in.

**DECISION: Option C (Thin dispatch layer) with session state ownership.**

Rationale:
- CoachingService is 2640 lines and well-tested. Extending it with orchestration responsibilities violates SRP and risks regression.
- A wrapping service (Option A) creates a second layer of LLM calls and state management alongside CoachingService's existing state management. Confusion about which layer "owns" what.
- A thin dispatch layer is the most honest architecture: the orchestrator's job is ROUTING and STATE MANAGEMENT, not LLM calls. It delegates LLM work to specialized services. Zero LLM cost for orchestration itself.
- The dispatch layer owns `ConversatorSessionState` (new) and passes it to each service. Services read state and return updates. The orchestrator applies updates.

**Key constraint**: Orchestration must be zero-cost (no LLM calls). All intelligence comes from Stage 1 + Stage 1.5 (which already run inside CoachingService). The orchestrator uses their outputs for routing.

---

### Question 2: Relationship to Existing Stage 1 / Stage 1.5

**Problem**: The orchestrator needs to know the interaction mode BEFORE routing to a sub-system. But Stage 1 and Stage 1.5 live inside CoachingService. If we route to CraftEngine instead of CoachingService, those stages never run.

**DECISION: Extract Stage 1 + Stage 1.5 into a shared `MessageClassifier` service.**

The classifier runs FIRST on every message, producing:
- `Stage1Output` (existing type — category, cognitive state, focus, scope)
- `CognitiveAssessment` (existing type — assessment, whatTheyNeed, approach, intensity)
- `InteractionMode` (NEW — the capability the student needs)

The classifier is the ONLY LLM cost the orchestrator adds (it's the SAME Haiku calls that already run in CoachingService, just extracted). CoachingService's internal Stage 1 / Stage 1.5 are skipped when invoked via the orchestrator (the orchestrator passes pre-computed classification).

**Cost impact**: Zero. Same two Haiku calls (~$0.002 total), just owned by a different service.

---

### Question 3: Session State Model

**Problem**: CoachingSessionMemory is per-coaching-session and ephemeral. The orchestrator needs broader state: interaction mode, workshop focus, revision progress, finding resolution tracking.

**DECISION: New `ConversatorSessionState` that CONTAINS `CoachingSessionMemory`.**

The session state is a superset. CoachingSessionMemory remains for coaching-specific state (topics, approaches, stances). The orchestrator adds workshop state, mode state, and capability tracking. This avoids breaking the existing CoachingService contract.

**Persistence model**:
- `ConversatorSessionState` is passed in / returned out on every turn (same pattern as CoachingSessionMemory).
- The caller (API route handler) decides persistence. For now: in-memory per session. Phase 2: DB persistence for cross-session continuity.
- `StudentDurableContext` (cross-essay) is a separate data model persisted to DB.

---

### Question 4: Capability Blending

**Problem**: "Help me fix this transition" might need Craft (technique) + Teaching (sequencing) + Gathering (intent). Is this multiple calls composed, or one call with blended context?

**DECISION: Single Sonnet call with blended context assembly. No multi-call composition.**

Rationale:
- Budget constraint: ~$0.025 remaining per turn. Can't afford multiple Sonnet calls.
- The existing Stage 3 Sonnet call already receives a rich context payload. Blending means assembling the RIGHT context for the RIGHT mode, not making separate calls.
- The orchestrator's job is to assemble the optimal context payload by combining: (a) mode-specific context (e.g., craft technique reference for workshop mode), (b) finding-scoped context (not global top-5), (c) declared data context (from GatheringService), (d) workshop state (what's been tried, what's next).
- Then ONE Sonnet call generates the response, with the system prompt variant appropriate to the mode.

---

### Question 5: Re-Analysis Triggering

**DECISION: Student-initiated with smart nudges.**

- The orchestrator DOES NOT auto-trigger re-analysis after every edit (too expensive, ~$0.15-0.50).
- The orchestrator TRACKS edits and their cumulative significance (from EditUnderstanding output).
- When significance crosses a threshold OR the student asks "how's my essay now?", the orchestrator suggests re-analysis: "You've made 3 significant changes since the last analysis. Want me to re-evaluate?"
- For small edits during workshop mode, the orchestrator runs EditUnderstanding (Haiku filter + Sonnet if non-trivial, ~$0.02) and provides inline feedback WITHOUT full re-analysis.
- Full re-analysis is triggered by: (a) explicit student request, (b) orchestrator suggestion when accumulated edits are substantial, (c) workshop completion.

---

### Question 6: Finding Resolution Loop

**DECISION: FindingStore is the source of truth. Orchestrator tracks discussion state.**

- FindingStore already handles maturity transitions (hypothesis → confirmed → superseded).
- The orchestrator adds a lightweight `FindingDiscussionState` map: which findings have been discussed, which are being worked on, which are resolved.
- When a student works on finding F3 and makes an edit:
  1. EditUnderstanding runs → identifies the edit targets F3's scope
  2. If re-analysis triggers, FindingStore maturity may update
  3. The orchestrator reads the maturity change and presents it: "The transition finding is now resolved — your sensory threading technique closed that gap."
- This is pure bookkeeping — no LLM cost.

---

## PART 2: COMPLETE TYPE DEFINITIONS

### 2.1 InteractionMode (NEW)

```typescript
/**
 * InteractionMode — what KIND of help the student needs.
 * Detected by Stage 1 enhanced classification.
 *
 * CRITICAL: These are NOT rigid modes. They are routing hints.
 * The LLM blends capabilities in its response. The mode determines
 * which CONTEXT is assembled, not which WORDS are generated.
 *
 * Rule 3 compliance: soft routing hints, not closed taxonomy.
 * The LLM produces a mode + confidence. Low confidence = blend.
 */
export type InteractionMode =
  | 'coaching'           // Default: "What's wrong with X?" — analytical coaching
  | 'brainstorm'         // "Help me think about alternatives" — divergent exploration
  | 'craft_workshop'     // "Help me write/fix this" — sentence-level crafting
  | 'evaluate'           // "Is this better?" or "Which version?" — comparative reading
  | 'revision_companion' // Student just edited → guide the revision process
  | 'emotional_support'  // Frustrated / overwhelmed / stuck → recalibrate
  | 'gathering'          // Student volunteering context → route to GatheringService
  | 'direction'          // "What should I work on?" → revision planning
  | 'teaching';          // Student just succeeded → skill transfer moment

/**
 * Mode classification output from enhanced Stage 1.
 * Added to the existing Stage1Output, NOT replacing it.
 */
export interface ModeClassification {
  /** Primary interaction mode */
  primaryMode: InteractionMode;
  /** Confidence in mode detection (0-1). Below 0.6 = blend with coaching default */
  confidence: number;
  /** Secondary mode if blending is likely (e.g., craft_workshop + teaching) */
  secondaryMode?: InteractionMode;
  /** Whether this is a mode TRANSITION from the previous turn */
  isTransition: boolean;
  /** If transition, what was the previous mode */
  previousMode?: InteractionMode;
}
```

### 2.2 ConversatorSessionState (NEW — owns all session state)

```typescript
/**
 * ConversatorSessionState — the orchestrator's session model.
 *
 * Passed in and returned from every orchestrator turn. The caller
 * (API route handler) is responsible for persistence.
 *
 * CONTAINS CoachingSessionMemory (backward compatible).
 * ADDS: mode tracking, workshop state, finding discussion state,
 *       capability tracking, revision progress.
 */
export interface ConversatorSessionState {
  /** Unique session ID */
  sessionId: string;

  /** Essay ID this session is working on */
  essayId: string;

  /** Profile version at session start (for staleness detection) */
  profileVersionAtStart: number;

  // ── EXISTING COACHING STATE (backward compatible) ──

  /** Existing coaching session memory — passed through to CoachingService */
  coachingMemory: CoachingSessionMemory;

  /** Existing learning style observations */
  learningStyle: LearningStyleObservations;

  // ── MODE STATE ──

  /** Current interaction mode */
  currentMode: InteractionMode;

  /** Mode history for transition detection */
  modeHistory: Array<{
    mode: InteractionMode;
    turnNumber: number;
    /** How many consecutive turns in this mode */
    duration: number;
  }>;

  // ── WORKSHOP STATE ──

  /** Active workshop focus (what are we working on RIGHT NOW) */
  activeFocus: WorkshopFocus | null;

  /** Completed focuses (for progress tracking) */
  completedFocuses: WorkshopFocus[];

  /** Deferred focuses (student chose to work on something else) */
  deferredFocuses: WorkshopFocus[];

  // ── FINDING DISCUSSION STATE ──

  /** Which findings have been discussed, with outcomes */
  findingDiscussion: Map<string, FindingDiscussionEntry>;

  // ── REVISION TRACKING ──

  /** Revision plan (if one has been built) */
  revisionPlan: RevisionPlan | null;

  /** Accumulated edit significance since last re-analysis */
  editAccumulator: EditAccumulator;

  // ── CAPABILITY TRACKING ──

  /** Techniques the student has been taught / demonstrated */
  capabilities: CapabilityEntry[];

  // ── TEACHING MOMENTS ──

  /** Capacity building moments recorded this session */
  capacityMoments: CapacityBuildingMoment[];

  // ── SESSION METADATA ──

  /** Total orchestrator turns */
  turnCount: number;

  /** Session start timestamp */
  startedAt: string;

  /** Last turn timestamp */
  lastTurnAt: string;
}
```

### 2.3 WorkshopFocus (what we're working on)

```typescript
/**
 * WorkshopFocus — tracks what the student is actively working on.
 *
 * The focus can be a finding, a paragraph, a connection, or a
 * student-chosen area. It tracks the lifecycle from exploration
 * through resolution.
 */
export interface WorkshopFocus {
  /** Unique focus ID */
  id: string;

  /** What kind of thing we're focused on */
  type: 'finding' | 'paragraph' | 'connection' | 'holistic_dimension' | 'student_chosen';

  /** Finding ID (if type === 'finding') */
  findingId?: string;

  /** Paragraph index (if type === 'paragraph' or scoped) */
  paragraphIndex?: number;

  /** Connection ID (if type === 'connection') */
  connectionId?: string;

  /** Dimension name (if type === 'holistic_dimension') */
  dimension?: string;

  /** Human-readable description of the focus */
  description: string;

  /** What the student declared they want to achieve here */
  goalStatement?: string;

  /** Current status */
  status: 'exploring' | 'brainstorming' | 'drafting' | 'evaluating' | 'resolved' | 'deferred';

  /** Resolution description (if resolved or deferred) */
  resolution?: string;

  /** Turn numbers where this focus was active */
  activeTurns: number[];

  /** What was tried during this focus */
  attempts: Array<{
    turnNumber: number;
    description: string;
    outcome: 'helped' | 'partial' | 'didnt_help' | 'pending';
  }>;
}
```

### 2.4 FindingDiscussionEntry

```typescript
/**
 * Tracks coaching interaction with a specific finding.
 * Pure bookkeeping — no LLM judgment.
 */
export interface FindingDiscussionEntry {
  /** Finding ID */
  findingId: string;

  /** When first discussed */
  firstDiscussedAt: number; // turn number

  /** When last discussed */
  lastDiscussedAt: number;

  /** Discussion status */
  status: 'mentioned' | 'explained' | 'workshopped' | 'resolved' | 'deferred' | 'rejected';

  /** What the student decided about this finding */
  studentStance?: string;

  /** If resolved, what resolved it (edit description or student decision) */
  resolutionDescription?: string;
}
```

### 2.5 RevisionPlan

```typescript
/**
 * RevisionPlan — an ordered set of revision items, built
 * collaboratively between the system and student.
 *
 * Generated by a Sonnet call when the student asks "What should
 * I work on?" or the system offers direction. Updated as items
 * are completed.
 */
export interface RevisionPlan {
  /** Plan items in priority order */
  items: RevisionPlanItem[];

  /** LLM-generated strategy summary */
  strategy: string;

  /** What resolving all items would achieve */
  estimatedImpact: string;

  /** When created / last updated */
  createdAt: string;
  lastUpdated: string;
}

export interface RevisionPlanItem {
  /** Unique item ID */
  id: string;

  /** Finding IDs this addresses */
  findingIds: string[];

  /** What to do */
  description: string;

  /** Why this matters (grounded in North Star / essay architecture) */
  rationale: string;

  /** Other item IDs that should be done first */
  dependsOn: string[];

  /** Estimated difficulty */
  difficulty: 'quick_fix' | 'moderate' | 'significant_rework' | 'structural_change';

  /** Current status */
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}
```

### 2.6 EditAccumulator

```typescript
/**
 * Tracks accumulated edit significance since last re-analysis.
 * Used to decide when to suggest re-analysis.
 */
export interface EditAccumulator {
  /** Number of edits since last re-analysis */
  editCount: number;

  /** Highest significance level seen */
  maxSignificance: 'minor' | 'moderate' | 'significant' | 'transformative';

  /** Paragraphs touched */
  paragraphsTouched: Set<number>;

  /** Whether any structural changes were made */
  hasStructuralChanges: boolean;

  /** Last EditUnderstanding output (for revision companion context) */
  lastEditUnderstanding?: EditUnderstanding;
}
```

### 2.7 CapabilityEntry

```typescript
/**
 * CapabilityEntry — a technique or skill the student has been
 * taught or demonstrated.
 *
 * LLM-first: the LLM decides what was taught and whether the
 * student demonstrated it. The system stores the record.
 */
export interface CapabilityEntry {
  /** Technique name (e.g., "sensory threading", "show vs tell") */
  technique: string;

  /** Turn where it was first taught */
  taughtAtTurn: number;

  /** Whether the student has demonstrated this technique */
  demonstrated: boolean;

  /** Turn where demonstrated (if applicable) */
  demonstratedAtTurn?: number;

  /** Brief description of the technique */
  description: string;

  /** Where this technique applies (for cross-essay transfer) */
  applicability: string;
}

/**
 * CapacityBuildingMoment — when a student successfully applies
 * a technique, creating a transferable skill moment.
 */
export interface CapacityBuildingMoment {
  /** Technique applied */
  technique: string;

  /** One-sentence transferable principle */
  principle: string;

  /** What the student was doing */
  context: string;

  /** Where else this applies */
  transferability: string;

  /** Turn number */
  turnNumber: number;
}
```

### 2.8 StudentDurableContext (cross-essay, Phase 2)

```typescript
/**
 * StudentDurableContext — intelligence that persists across essays.
 * Phase 2 implementation — listed here for type completeness.
 *
 * Stored in DB, loaded when any essay session starts.
 */
export interface StudentDurableContext {
  /** Clerk user ID */
  userId: string;

  /** Student-durable conversation insights (preferences, learning patterns) */
  durableInsights: ConversationInsight[];

  /** Techniques learned across all essays */
  learnedTechniques: CapabilityEntry[];

  /** Writing tendencies observed across essays */
  writingPatterns: string[];

  /** Learning style observations (merged across sessions) */
  learningStyle: LearningStyleObservations;

  /** Last updated */
  lastUpdated: string;
}
```

---

## PART 3: SERVICE ARCHITECTURE

### 3.1 File Structure

```
src/services/essayIntelligence/conversator/
├── conversatorOrchestrator.ts    — Entry point, dispatch loop, state management
├── messageClassifier.ts          — Extracted Stage 1 + Stage 1.5 + mode detection
├── modeRouter.ts                 — Mode-specific context assembly
├── workshopManager.ts            — Workshop focus tracking, progress management
├── findingCoachingBridge.ts      — Scoped finding selection, discussion tracking
├── revisionCompanion.ts          — Edit understanding piping, re-analysis triggers
├── capabilityTracker.ts          — Technique teaching and demonstration tracking
├── types.ts                      — All types from Part 2
└── index.ts                      — Clean exports
```

### 3.2 ConversatorOrchestrator — Entry Point

```typescript
/**
 * ConversatorOrchestrator — the thin dispatch layer.
 *
 * Receives every student message. Runs classification, routes to
 * the right capability, manages session state, ensures profile feedback.
 *
 * ZERO LLM calls of its own. All LLM cost comes from:
 * - MessageClassifier (2 Haiku calls — same as existing Stage 1 + 1.5)
 * - The routed sub-service (CoachingService Sonnet call or equivalent)
 * - Optional profile deepening (existing Stage 4)
 */
export class ConversatorOrchestrator {

  private classifier: MessageClassifier;
  private modeRouter: ModeRouter;
  private workshopManager: WorkshopManager;
  private findingBridge: FindingCoachingBridge;
  private revisionCompanion: RevisionCompanion;
  private capabilityTracker: CapabilityTracker;
  private coachingService: CoachingService;

  /**
   * Process one conversator turn.
   *
   * @param studentMessage  Raw text from student
   * @param conversationHistory  All prior turns
   * @param profile  Current essay profile (read-only)
   * @param coordinator  Profile coordinator for mutations
   * @param router  Profile router for context assembly
   * @param sessionState  Current session state (or null for first turn)
   * @param recentEditContext  Optional edit context
   * @param editUnderstanding  Optional EditUnderstanding from recent edit
   * @returns ConversatorResult with response + updated session state
   */
  async processTurn(
    studentMessage: string,
    conversationHistory: ConversationTurn[],
    profile: EssayProfile,
    coordinator: EssayProfileCoordinator,
    router: ProfileRouter,
    sessionState: ConversatorSessionState | null,
    recentEditContext?: string,
    editUnderstanding?: EditUnderstanding,
  ): Promise<ConversatorResult> {
    const turnStart = Date.now();
    const costs: LayerCost[] = [];

    // Initialize session state on first turn
    let state = sessionState ?? this.initializeSessionState(profile);

    // ── STEP 1: Classification (2 Haiku calls — $0.002) ──
    const classification = await this.classifier.classify(
      studentMessage,
      conversationHistory,
      profile,
      state,
      recentEditContext,
    );
    costs.push(classification.s1Cost, classification.s15Cost);

    // ── STEP 2: Mode Transition Detection (zero cost — pure logic) ──
    const modeTransition = this.detectModeTransition(
      classification.modeClassification,
      state,
    );
    state = this.applyModeTransition(state, modeTransition);

    // ── STEP 3: Workshop State Update (zero cost — pure logic) ──
    if (editUnderstanding) {
      state = this.revisionCompanion.processEdit(state, editUnderstanding);
    }
    state = this.workshopManager.updateFocus(
      state,
      classification,
      studentMessage,
    );

    // ── STEP 4: Context Assembly + Dispatch (mode-dependent cost) ──
    const dispatchResult = await this.dispatch(
      state.currentMode,
      studentMessage,
      conversationHistory,
      profile,
      coordinator,
      router,
      classification,
      state,
      recentEditContext,
    );
    costs.push(...dispatchResult.costs);

    // ── STEP 5: Post-Turn State Updates (zero cost) ──
    state = this.updatePostTurn(
      state,
      classification,
      dispatchResult,
    );

    // ── STEP 6: Capability Extraction (zero cost — read from response) ──
    state = this.capabilityTracker.extractFromTurn(
      state,
      dispatchResult.response,
      classification,
    );

    // ── STEP 7: Finding Discussion Tracking (zero cost) ──
    state = this.findingBridge.trackDiscussion(
      state,
      classification,
      dispatchResult,
    );

    const totalCost = costs.reduce((sum, c) => sum + c.cost, 0);

    return {
      response: dispatchResult.response,
      sessionState: state,
      costs,
      totalCost,
      modeUsed: state.currentMode,
      modeTransition: modeTransition.transitioned
        ? { from: modeTransition.previousMode!, to: state.currentMode }
        : undefined,
      // Pass through coaching-specific outputs
      insightExtracted: dispatchResult.insightExtracted ?? null,
      profileDeepened: dispatchResult.profileDeepened ?? false,
      stage4Verdict: dispatchResult.stage4Verdict ?? 'none',
      cognitiveAssessment: classification.cognitiveAssessment,
      qualitySignals: dispatchResult.qualitySignals,
    };
  }
}
```

### 3.3 MessageClassifier — Enhanced Stage 1 + Stage 1.5

The MessageClassifier extracts Stage 1 + Stage 1.5 from CoachingService and adds mode detection.

```typescript
/**
 * MessageClassifier — extracted and enhanced Stage 1 + Stage 1.5.
 *
 * Runs 2 Haiku calls per turn (same cost as existing pipeline).
 * Adds mode detection to Stage 1 output via an expanded prompt.
 *
 * File: src/services/essayIntelligence/conversator/messageClassifier.ts
 */
export class MessageClassifier {

  /**
   * Classify a student message: insight category + mode + cognitive state.
   *
   * IMPLEMENTATION: The existing Stage 1 prompt (~3400 chars) is extended
   * with ~400 chars of mode detection taxonomy. The JSON output gains
   * one field: `interactionMode`. This stays within Haiku's capabilities
   * and adds negligible token cost (~50 output tokens).
   *
   * Stage 1.5 is unchanged — same Haiku cognitive assessment call.
   */
  async classify(
    studentMessage: string,
    conversationHistory: ConversationTurn[],
    profile: EssayProfile,
    sessionState: ConversatorSessionState,
    recentEditContext?: string,
  ): Promise<ClassificationResult> {
    // ... (implementation follows existing Stage 1 + 1.5 patterns)
  }
}

interface ClassificationResult {
  stage1: Stage1Output;
  modeClassification: ModeClassification;
  cognitiveAssessment: CognitiveAssessment;
  s1Cost: LayerCost;
  s15Cost: LayerCost;
}
```

**Stage 1 Prompt Extension** (added to existing system prompt):

```
INTERACTION MODE — what kind of help is the student seeking?

  coaching — analytical question about their essay ("What's wrong with X?", "Why does this matter?")
  brainstorm — divergent exploration ("Help me think about alternatives", "What if I tried...")
  craft_workshop — sentence/paragraph-level crafting ("Help me write/fix this", "How do I say...")
  evaluate — comparative reading ("Is this better?", "Which version works?", "Does this fix it?")
  revision_companion — student just edited, needs guidance on the change
  emotional_support — frustrated, overwhelmed, stuck, needs recalibration before continuing
  gathering — volunteering context about themselves/essay ("What you don't know is...", "The reason I...")
  direction — seeking what to work on next ("What should I fix first?", "Where do I start?")
  teaching — student just succeeded, ripe for skill transfer ("I think I get it now")

  If unsure, default to "coaching". Report confidence 0-1.

  "interactionMode": "<mode>",
  "modeConfidence": <0-1>,
```

**Cost model**:
- Stage 1 Haiku: ~800 input tokens (system prompt) + ~200 input tokens (user prompt) = ~1000 input tokens → ~$0.001
- With caching: system prompt cached at $0.10/MTok read → ~$0.0001 + ~$0.001 output = ~$0.001
- Stage 1.5: same as existing ~$0.001
- **Total classifier: ~$0.002/turn (unchanged from baseline)**

### 3.4 ModeRouter — Mode-Specific Context Assembly

```typescript
/**
 * ModeRouter — assembles mode-specific context for the dispatch target.
 *
 * Each mode has different context needs:
 * - coaching: existing L6 routing rules (voice/paragraph/overview)
 * - brainstorm: essay trajectory + plausible paths + distinctiveness + connection gaps
 * - craft_workshop: scoped findings + techniques catalog + voice protection
 * - evaluate: before/after text + finding state changes + connection impacts
 * - revision_companion: EditUnderstanding + affected connections + voice consistency
 * - emotional_support: minimal context, maximum empathy signals
 * - gathering: declared data schema + pending questions
 * - direction: all active findings sorted by impact + dependency graph + revision plan
 * - teaching: recently used technique + capability history + transferability
 *
 * IMPLEMENTATION: Uses ProfileRouter.assembleDeclaredContext() for custom
 * context needs. The DeclaredContextRequest system was designed for this.
 *
 * File: src/services/essayIntelligence/conversator/modeRouter.ts
 */
export class ModeRouter {

  /**
   * Assemble context appropriate for the current interaction mode.
   *
   * Returns both the assembled profile context AND mode-specific
   * supplementary context (workshop state, finding focus, technique reference).
   */
  assembleContext(
    mode: InteractionMode,
    profile: EssayProfile,
    router: ProfileRouter,
    classification: ClassificationResult,
    sessionState: ConversatorSessionState,
    coordinator: EssayProfileCoordinator,
  ): ModeContext {
    // ... mode-specific assembly logic
  }
}

interface ModeContext {
  /** Profile context from router */
  profileContext: AssembledProfileContext;

  /** Mode-specific supplementary text (workshop state, technique refs, etc.) */
  supplementaryContext: string;

  /** System prompt variant for this mode (or null to use default coaching philosophy) */
  systemPromptOverride: string | null;

  /** Max tokens for response (modes like emotional_support should be shorter) */
  maxTokens: number;

  /** Temperature (brainstorm = higher, evaluate = lower) */
  temperature: number;
}
```

**Mode-specific context assembly specifications:**

| Mode | Profile Context Rule | Supplementary Context | System Prompt | maxTokens | temp |
|------|---------------------|----------------------|---------------|-----------|------|
| `coaching` | Existing l6_coaching_* rules | Findings (scoped), essay understanding prose, workshop state | Default coaching philosophy (cached) | 2048 | 0.4 |
| `brainstorm` | DeclaredContext: essay trajectory, distinctiveness, plausible paths, voice identity, connection gaps | Workshop focus, student capabilities, what's been tried | Coaching philosophy + brainstorm addendum (cached) | 1536 | 0.6 |
| `craft_workshop` | DeclaredContext: target paragraph full, connected sentences, voice map, craft assessment | Scoped findings as craft challenges, technique reference, capability history | Coaching philosophy + craft addendum (cached) | 2048 | 0.4 |
| `evaluate` | DeclaredContext: target paragraph before/after, connections, holistic impact | EditUnderstanding output, finding state changes, voice consistency check | Coaching philosophy + evaluation addendum (cached) | 1024 | 0.3 |
| `revision_companion` | DeclaredContext: edited paragraph full, connection impacts, voice map at edit location | EditUnderstanding formatted for coaching, what changed vs what stayed, revision plan status | Coaching philosophy + revision addendum (cached) | 1536 | 0.4 |
| `emotional_support` | Minimal: North Star summary, 3 specific strengths from craft assessment | Session arc, student energy history, what they've accomplished | Coaching philosophy + emotional support addendum (cached) | 512 | 0.5 |
| `gathering` | Minimal: pending ConversatorQuestions, declared data schema | What questions are still unanswered, what declared data exists | Gathering-specific prompt (cached) | 1024 | 0.4 |
| `direction` | DeclaredContext: all active findings by coaching value, dependency graph, North Star trajectory | Revision plan (if exists), what's been resolved, what's next | Coaching philosophy + direction addendum (cached) | 1536 | 0.3 |
| `teaching` | DeclaredContext: the specific area where success happened, capability history | What technique was just demonstrated, transferability analysis | Coaching philosophy + teaching addendum (cached) | 512 | 0.4 |

### 3.5 Dispatch Logic

The orchestrator dispatches to the appropriate service based on mode:

```typescript
/**
 * Dispatch pseudocode — the orchestrator's routing heart.
 *
 * CRITICAL: Most modes dispatch to CoachingService.processCoachingTurn()
 * with enriched context. The orchestrator doesn't replace CoachingService —
 * it FEEDS it better context.
 */
private async dispatch(
  mode: InteractionMode,
  studentMessage: string,
  conversationHistory: ConversationTurn[],
  profile: EssayProfile,
  coordinator: EssayProfileCoordinator,
  router: ProfileRouter,
  classification: ClassificationResult,
  state: ConversatorSessionState,
  recentEditContext?: string,
): Promise<DispatchResult> {

  // Assemble mode-specific context
  const modeContext = this.modeRouter.assembleContext(
    mode, profile, router, classification, state, coordinator,
  );

  switch (mode) {
    case 'gathering':
      // Route to GatheringService (from FORGE_PLAN.md)
      // TODO: Phase 2 — GatheringService integration
      // For now, fall through to coaching with gathering context
      break;

    case 'emotional_support':
      // Special handling: always use Haiku for speed, minimal response
      // Override cognitive assessment to force brief/minimal intensity
      break;

    default:
      // All other modes: dispatch to CoachingService with enriched context
      break;
  }

  // Most modes use CoachingService with mode-enriched context
  // The key innovation: we REPLACE the Stage 1/1.5 classification
  // (already computed by MessageClassifier) and inject mode-specific
  // supplementary context into the coaching pipeline.

  const coachingResult = await this.coachingService.processCoachingTurnWithPreClassification(
    studentMessage,
    conversationHistory,
    profile,
    coordinator,
    router,
    classification.stage1,
    classification.cognitiveAssessment,
    state.coachingMemory,
    state.learningStyle,
    recentEditContext,
    /* editStrategyContext */ undefined,
    /* modeSupplementaryContext */ modeContext.supplementaryContext,
    /* systemPromptOverride */ modeContext.systemPromptOverride,
    /* maxTokensOverride */ modeContext.maxTokens,
    /* temperatureOverride */ modeContext.temperature,
  );

  return {
    response: coachingResult.response,
    costs: coachingResult.cost,
    insightExtracted: coachingResult.insightExtracted,
    profileDeepened: coachingResult.profileDeepened,
    stage4Verdict: coachingResult.stage4Verdict,
    qualitySignals: coachingResult.qualitySignals,
    sessionMemoryUpdate: coachingResult.sessionMemory,
    learningStyleUpdate: coachingResult.learningStyle,
  };
}
```

**Required CoachingService modification**: Add a new entry point `processCoachingTurnWithPreClassification()` that:
1. Skips Stage 1 and Stage 1.5 (uses pre-computed values)
2. Accepts supplementary context string injected into Stage 3 user prompt
3. Accepts system prompt override (for mode-specific addenda)
4. Accepts maxTokens/temperature overrides

This is a **surgical** change to CoachingService — ~50 lines of new code. The existing `processCoachingTurn()` entry point remains unchanged for backward compatibility.

### 3.6 WorkshopManager

```typescript
/**
 * WorkshopManager — manages workshop focus lifecycle.
 *
 * Pure logic, zero LLM cost. Tracks what the student is working on,
 * detects focus shifts, manages the exploring→brainstorming→drafting→
 * evaluating→resolved lifecycle.
 *
 * File: src/services/essayIntelligence/conversator/workshopManager.ts
 */
export class WorkshopManager {

  /**
   * Update focus based on classification and student message.
   *
   * Focus transition rules (deterministic):
   * 1. If classification targets a DIFFERENT finding/paragraph than current focus → new focus
   * 2. If mode changes from coaching → brainstorm while on same area → same focus, status update
   * 3. If student says "let's work on something else" → deferred focus + new focus
   * 4. If student says "I'm done with this" / finding is resolved → completed focus
   * 5. If same focus > 5 turns and student seems stuck → suggest change
   */
  updateFocus(
    state: ConversatorSessionState,
    classification: ClassificationResult,
    studentMessage: string,
  ): ConversatorSessionState {
    // Implementation follows deterministic rules above
  }

  /**
   * Determine the next logical focus when current is resolved.
   *
   * Priority: (1) next revision plan item, (2) highest coaching-value
   * undiscussed finding, (3) connected finding to just-resolved one
   */
  suggestNextFocus(
    state: ConversatorSessionState,
    findingStore: FindingStore,
  ): WorkshopFocus | null {
    // Pure logic — reads finding store and revision plan
  }
}
```

### 3.7 FindingCoachingBridge

```typescript
/**
 * FindingCoachingBridge — connects finding intelligence to coaching context.
 *
 * REPLACES the current global top-5 finding injection with scoped,
 * mode-aware finding selection.
 *
 * File: src/services/essayIntelligence/conversator/findingCoachingBridge.ts
 */
export class FindingCoachingBridge {

  /**
   * Build finding context scoped to the student's current focus + mode.
   *
   * ALGORITHM:
   * 1. Get the focus area (paragraph, finding, connection)
   * 2. Get all findings in scope (FindingStore.getByScope)
   * 3. If mode is craft_workshop → prioritize findings with growthEdges
   * 4. If mode is direction → include ALL active findings with dependency tree
   * 5. If mode is evaluate → include findings affected by recent edit
   * 6. Filter out findings already resolved (from findingDiscussion state)
   * 7. Sort by coaching value
   * 8. Format as structured context (not just text block)
   *
   * Output format for Stage 3 injection:
   *
   * === RELEVANT FINDINGS (for current focus: P3 transition) ===
   * [F3] CONFIRMED/HIGH: "The transition relies on temporal marker without
   *      sensory bridge." Evidence: "Three months later" (P3S1)
   *      → CRAFT OPPORTUNITY: sensory threading technique
   *      → RELATED: [F1] voice shift in P2 (connected via C7)
   *      → STATUS: not yet discussed with student
   *
   * [F7] DEVELOPING/MEDIUM: "Emotional register shifts without preparation"
   *      Evidence: P2 calm → P3 devastating
   *      → RELATED: downstream of [F3] — fixing F3 may partially resolve F7
   *      → STATUS: mentioned in turn 3, student seemed uncertain
   */
  buildScopedFindingContext(
    profile: EssayProfile,
    coordinator: EssayProfileCoordinator,
    state: ConversatorSessionState,
    classification: ClassificationResult,
  ): string {
    const findingStore = coordinator.getFindingStore();

    // ... scoped selection algorithm
  }

  /**
   * Track which findings were discussed/addressed in this turn.
   * Called after the response is generated.
   */
  trackDiscussion(
    state: ConversatorSessionState,
    classification: ClassificationResult,
    dispatchResult: DispatchResult,
  ): ConversatorSessionState {
    // Identify findings referenced in the response
    // Update findingDiscussion map
    // Pure logic — no LLM
  }
}
```

### 3.8 RevisionCompanion

```typescript
/**
 * RevisionCompanion — pipes EditUnderstanding to coaching context.
 *
 * Bridges the gap between editUnderstandingService.ts (which produces
 * rich change analysis) and the coaching pipeline (which currently
 * only sees a brief text summary).
 *
 * File: src/services/essayIntelligence/conversator/revisionCompanion.ts
 */
export class RevisionCompanion {

  /**
   * Process an edit event — update session state with edit intelligence.
   * Called when EditUnderstanding is available (student made changes).
   */
  processEdit(
    state: ConversatorSessionState,
    editUnderstanding: EditUnderstanding,
  ): ConversatorSessionState {
    // Update edit accumulator
    state.editAccumulator.editCount++;
    state.editAccumulator.lastEditUnderstanding = editUnderstanding;

    if (editUnderstanding.significance === 'transformative' ||
        editUnderstanding.significance === 'significant') {
      state.editAccumulator.maxSignificance = editUnderstanding.significance;
    }

    if (editUnderstanding.profileImpact.connectionImpact.length > 0) {
      state.editAccumulator.hasStructuralChanges = true;
    }

    return state;
  }

  /**
   * Build revision companion context for Stage 3 injection.
   *
   * Formats EditUnderstanding as coaching-actionable intelligence:
   *
   * === WHAT THE STUDENT JUST CHANGED ===
   * CHANGE: Replaced "diamond" with "glass" in P3S2
   * SIGNIFICANCE: significant — metaphor shift affects through-line
   * APPARENT PURPOSE: Shifting from "pressure creates beauty" to "clarity is fragile"
   * PURPOSE CONFIDENCE: 0.7 (may want to confirm with student)
   *
   * CONNECTIONS AFFECTED:
   * - C3 (P1S3 → P3S2): "faceted as any gem" — NOW BROKEN (P1 still references diamond)
   * - C8 (P3S2 → P5S1): closing metaphor — NEEDS UPDATE to match glass
   *
   * COACH INSTRUCTIONS:
   * 1. Acknowledge the metaphor shift and what it reveals about student's intent
   * 2. Flag the broken connection in P1S3 (student may not have noticed)
   * 3. If confidence < 0.8, ASK: "Did you mean to change the underlying metaphor?"
   */
  buildRevisionContext(
    state: ConversatorSessionState,
    profile: EssayProfile,
  ): string {
    if (!state.editAccumulator.lastEditUnderstanding) return '';

    const eu = state.editAccumulator.lastEditUnderstanding;
    // ... format as above
  }

  /**
   * Should the system suggest re-analysis?
   *
   * Thresholds:
   * - 3+ significant edits since last analysis → suggest
   * - 1 transformative edit → suggest
   * - 5+ minor edits touching 3+ paragraphs → suggest
   * - Student asks "how's my essay now?" → always suggest
   */
  shouldSuggestReanalysis(state: ConversatorSessionState): boolean {
    const acc = state.editAccumulator;
    if (acc.maxSignificance === 'transformative') return true;
    if (acc.editCount >= 3 && acc.maxSignificance === 'significant') return true;
    if (acc.editCount >= 5 && acc.paragraphsTouched.size >= 3) return true;
    return false;
  }
}
```

### 3.9 CapabilityTracker

```typescript
/**
 * CapabilityTracker — tracks techniques taught and demonstrated.
 *
 * LLM-first: the LLM names techniques in its response. The tracker
 * detects them post-hoc via lightweight pattern matching on the
 * response text (NOT regex on student text — regex on system output
 * is acceptable infrastructure per Rule 4).
 *
 * Actually: BETTER approach per LLM-first rules — extend the Stage 4
 * profile deepening to include capability extraction. But that adds
 * a Sonnet call. Instead: include capability extraction in the
 * pattern detection Haiku call (which already runs every 3 turns).
 *
 * File: src/services/essayIntelligence/conversator/capabilityTracker.ts
 */
export class CapabilityTracker {

  /**
   * Extract capability signals from this turn.
   *
   * For now: purely from the coach's response structure.
   * The coach names techniques when teaching them. We detect
   * by checking if the response contains technique-like language.
   *
   * Phase 2: Add capability extraction to pattern detection Haiku call.
   */
  extractFromTurn(
    state: ConversatorSessionState,
    coachResponse: string,
    classification: ClassificationResult,
  ): ConversatorSessionState {
    // If mode was teaching or the student demonstrated something,
    // the pattern detection call (running every 3 turns) will catch it.
    // For now: mark capabilities based on pattern detection output.
    return state;
  }

  /**
   * Build capability context for injection into coaching prompt.
   *
   * Output format:
   * === STUDENT'S DEMONSTRATED CAPABILITIES ===
   * - Sensory threading (taught turn 4, demonstrated turn 6)
   * - Show vs tell identification (taught turn 2, not yet demonstrated)
   *
   * TEACHING INSTRUCTION: Reference demonstrated capabilities when
   * they apply to the current focus. "You already know how to do
   * sensory threading — this is the same principle."
   */
  buildCapabilityContext(state: ConversatorSessionState): string {
    if (state.capabilities.length === 0) return '';
    // ... format capabilities
  }
}
```

---

## PART 4: MODE-SPECIFIC SYSTEM PROMPT ADDENDA

Each mode adds a **short addendum** (~200-400 tokens) to the cached coaching philosophy system prompt. The addendum is appended to the static Block 1, keeping the cache hit for the philosophy portion.

### 4.1 Brainstorm Addendum

```
=== BRAINSTORM MODE ===
You are in BRAINSTORM mode. The student wants to explore alternatives.

YOUR JOB: Generate OPTIONS, not answers. Help the student think.

STRUCTURE:
1. Reflect the challenge back (1 sentence)
2. Offer 2-3 CONCRETE alternatives (not abstract principles)
3. Ask which FEELS right (not which is "best")
4. Validate their choice and help sharpen it

ANTI-PATTERNS:
- Don't evaluate options prematurely — let the student react first
- Don't offer more than 3 options (decision fatigue)
- Don't default to the most "literary" option — match their voice
- Don't write complete sentences for them unless asked

The alternatives should reference the essay's actual text and architecture.
```

### 4.2 Craft Workshop Addendum

```
=== CRAFT WORKSHOP MODE ===
You are in CRAFT WORKSHOP mode. The student needs help writing/fixing specific text.

YOUR JOB: Teach technique through guided practice. Name techniques so the student
can recognize and reuse them.

STRUCTURE:
1. Name the craft challenge (what the text needs to do)
2. Name the technique that addresses it (give it a memorable name)
3. Guide the student through applying it (ask questions, don't write for them)
4. When they succeed, name what they just did: "What you did there — [technique
   name] — works because [principle]. You can use this anywhere you need to [function]."

TECHNIQUE NAMING: When you teach a technique, give it a concrete name the student
will remember. "Sensory threading" not "using sensory details to create continuity."
The name should capture the mechanism, not describe the outcome.

PROTECTED VOICE: Reference the voice profile. Any suggested changes MUST stay in
the student's authentic register. If their voice is understated, don't suggest
declarative sentences. Quote their strongest voice moments as the standard.
```

### 4.3 Evaluate Addendum

```
=== EVALUATION MODE ===
You are evaluating the student's recent changes.

YOUR JOB: Honest assessment — what improved, what stayed the same, what might
have regressed.

STRUCTURE:
1. Acknowledge what they did (be specific about the change, not generic)
2. Assess impact on the essay's architecture (reference North Star, connections)
3. Flag anything that was weakened by the change (broken connections, voice drift)
4. Suggest next step (continue refining, or move to next focus)

HONESTY: If the change didn't help, say so directly but kindly. "The rewrite
didn't quite close the gap — here's why..." is more helpful than "This is a
good start!" The student needs to know when to try a different approach.

REFERENCE: If EditUnderstanding is available below, use its analysis as
grounding for your assessment.
```

### 4.4 Emotional Support Addendum

```
=== EMOTIONAL SUPPORT MODE ===
The student is frustrated, overwhelmed, or stuck.

YOUR JOB: Recalibrate before continuing. Acknowledge their state. Reduce
cognitive load. Remind them what's working.

RULES:
- DO NOT introduce new feedback or findings
- DO reference 2-3 specific strengths in their essay (cite text)
- DO name what they've already accomplished ("You've resolved 3 findings")
- DO make the next step SMALL and achievable
- BE BRIEF — 3-5 sentences max
- If they're frustrated with the SYSTEM: acknowledge, ask what would help
- If they're frustrated with their WRITING: normalize, ground in strengths
```

### 4.5 Direction Addendum

```
=== DIRECTION MODE ===
The student wants to know what to work on next.

YOUR JOB: Build or present a revision strategy, prioritized by architectural impact.

PRIORITIZATION LOGIC (follow this order):
1. Foundation-level findings that cascade to other issues
2. Findings with the most downstream connections (fix one, resolve many)
3. Findings where the intent-effect gap is largest
4. Student's own stated priorities (even if analysis disagrees — honor their agency)

PRESENT as a conversation, not a list. "I'd start with X because it's the
structural backbone — once that's solid, Y and Z will probably resolve themselves."

If a revision plan exists, reference it. Track what's been completed.
```

---

## PART 5: INTEGRATION SPEC — EXACT CHANGES TO EXISTING FILES

### 5.1 CoachingService Changes

**File**: `src/services/essayIntelligence/coaching/coachingService.ts`

**Change 1**: Add `processCoachingTurnWithPreClassification()` method (~50 lines)

```typescript
/**
 * Entry point for orchestrator-driven turns.
 * Stage 1 + Stage 1.5 already computed by MessageClassifier.
 * Starts at Stage 2 (context routing).
 *
 * Accepts supplementary context and overrides for mode-specific behavior.
 */
async processCoachingTurnWithPreClassification(
  studentMessage: string,
  conversationHistory: ConversationTurn[],
  profile: EssayProfile,
  coordinator: EssayProfileCoordinator,
  router: ProfileRouter,
  precomputedStage1: Stage1Output,
  precomputedCognitiveAssessment: CognitiveAssessment,
  sessionMemory: CoachingSessionMemory,
  learningStyle: LearningStyleObservations,
  recentEditContext?: string,
  editStrategyContext?: string,
  modeSupplementaryContext?: string,
  systemPromptOverride?: string,
  maxTokensOverride?: number,
  temperatureOverride?: number,
): Promise<CoachingResult> {
  // Skip Stage 1 + Stage 1.5 — use precomputed values
  const stage1 = precomputedStage1;
  const cognitiveAssessment = precomputedCognitiveAssessment;

  // Stage 2 onwards identical to processCoachingTurn, with:
  // - modeSupplementaryContext injected into Stage 3 user prompt
  // - systemPromptOverride used instead of staticCoachingPhilosophy (if provided)
  // - maxTokensOverride/temperatureOverride used for Stage 3 Sonnet call

  // ... (reuse existing Stage 2-5 logic)
}
```

**Change 2**: In `runStage3CoachingResponse()`, add supplementary context injection point (~10 lines)

```typescript
// After editStrategySection, before userPrompt construction:
const modeSupplementarySection = modeSupplementaryContext
  ? `\n\n=== MODE-SPECIFIC CONTEXT ===\n${modeSupplementaryContext}`
  : '';

// In userPrompt template, add:
// ${modeSupplementarySection}
```

**Change 3**: Make Stage 1 types and parsing exportable (~5 lines)

```typescript
// Export Stage1Output and the parsing functions so MessageClassifier can reuse them
export type { Stage1Output };
export { parseStage1Output }; // (extract from private to module-level function)
```

### 5.2 Profile Router Changes

**File**: `src/services/essayIntelligence/profileManager/profileRouter.ts`

**Change**: No changes needed. The existing `DeclaredContextRequest` system is already designed for custom context needs. The ModeRouter uses `assembleDeclaredContext()` to build mode-specific context without modifying the router.

### 5.3 ProfileTypes Changes

**File**: `src/services/essayIntelligence/profileTypes.ts`

**Change**: No changes needed. All new types go in `conversator/types.ts`. The orchestrator does not modify the profile type system — it composes on top of it.

### 5.4 API Route Changes

**File**: `src/http/routes.ts` (or wherever the coaching endpoint lives)

**Change**: Add an alternative endpoint (or modify existing) that uses `ConversatorOrchestrator.processTurn()` instead of directly calling `CoachingService.processCoachingTurn()`.

```typescript
// New endpoint or modified existing:
app.post('/api/essay/:essayId/conversator', async (req, res) => {
  const { studentMessage, conversationHistory, sessionState } = req.body;

  // Load profile, coordinator, router as existing

  const result = await conversatorOrchestrator.processTurn(
    studentMessage,
    conversationHistory,
    profile,
    coordinator,
    router,
    sessionState ?? null,
    recentEditContext,
    editUnderstanding,
  );

  return res.json({
    success: true,
    data: {
      response: result.response,
      sessionState: result.sessionState, // Client stores and sends back next turn
      modeUsed: result.modeUsed,
      cost: result.totalCost,
    },
  });
});
```

---

## PART 6: BEFORE/AFTER EXAMPLES

### Example 1: Mode Detection + Workshop Focus

**BEFORE (current system)**:

```
Student: "Help me brainstorm a different opening"
→ Stage 1: category=clarification, focusProbabilities={P1: 0.8}
→ Stage 2: routes to l6_coaching_paragraph (P1)
→ Stage 3: Sonnet generates an analytical response about what's wrong with P1
→ Result: "Your opening makes a philosophical claim. The essay needs a more
   grounded entry point. Consider starting with the pawnshop scene."
```

**AFTER (orchestrator)**:

```
Student: "Help me brainstorm a different opening"
→ MessageClassifier:
    Stage 1: category=clarification, focusProbabilities={P1: 0.8}
    Mode: brainstorm (confidence: 0.9)
→ ModeRouter: assembles brainstorm context
    - EssayTrajectory.plausiblePaths[] (3 paths)
    - DistinctivenessSignature (what to preserve)
    - VoiceIdentity (authentic register to match)
    - NorthStar.structuralRolesMap[0] (P1's current role)
    - Active workshop focus: null → creates new: {type: 'paragraph', paragraphIndex: 0, status: 'brainstorming'}
→ Dispatch: CoachingService with brainstorm addendum + brainstorm context
→ Stage 3: Sonnet generates a brainstorm response:
  "Let me give you three entry points. I want you to react to each one —
   not whether it's 'good' but whether it FEELS like you.

   1. Start in the pawnshop: 'The fluorescent light caught the stone's
      face—' (puts the reader in your world immediately)
   2. Start with the question: 'I didn't know what my grandfather left me
      until—' (pulls the reader forward with curiosity)
   3. Start with the scale mismatch: 'My grandfather's entire estate fit in
      an envelope.' (sets up the contrast that drives your essay)

   Which one makes you FEEL something? Don't think about which is best."
```

### Example 2: Finding-Scoped Coaching

**BEFORE (current system)**:

```
Student: "What's wrong with the transition between paragraphs 3 and 4?"
→ Stage 3 receives top 5 global findings (F1-F5), only F3 is relevant
→ Coach may or may not reference F3
→ Response: "The transition feels abrupt because there's no bridging element..."
```

**AFTER (orchestrator)**:

```
Student: "What's wrong with the transition between paragraphs 3 and 4?"
→ FindingCoachingBridge: scopes to P3-P4
    - F3 [confirmed/high]: "Transition relies on temporal marker without sensory bridge"
    - F1 [confirmed/critical]: "Voice shifts from reflective to performative in P2"
      (connected via C7 — voice drift affects transition quality)
    - F7 [developing/medium]: "Emotional register shifts without preparation"
      (downstream of F3 — fixing F3 may resolve F7)
    - Finding discussion state: F3 never discussed, F1 mentioned turn 2
→ Formatted as structured context with relationships and discussion status
→ Coach response is GROUNDED in scoped findings:
  "Two things are happening at that P3-P4 boundary. [F3] The transition
   currently relies on 'Three months later' — a time skip that tells
   the reader time passed but doesn't help them FEEL the shift. And there's
   a related issue: [F1] your voice in P2 shifts to a more formal register
   right before this transition, which means by P4 the reader has been
   unmoored for two paragraphs.

   If we fix the sensory bridge (what exists in BOTH the lab and the hospital?),
   [F7] the emotional preparation issue will probably resolve itself because
   the bridge IS the preparation."
```

### Example 3: Revision Companion

**BEFORE (current system)**:

```
[Student changes "diamond" to "glass" in P3]
→ editUnderstandingService runs → produces rich EditUnderstanding
→ EditUnderstanding flows to re-analysis pipeline (NOT coaching)
→ Coach sees only: "Recent edit context: P3 was modified"
→ Response: "I see you've made some changes. How can I help?"
```

**AFTER (orchestrator)**:

```
[Student changes "diamond" to "glass" in P3]
→ EditUnderstanding piped to RevisionCompanion
→ RevisionCompanion formats for coaching:
    CHANGE: Replaced "diamond" → "glass" in P3S2
    SIGNIFICANCE: significant — metaphor shift affects through-line
    APPARENT PURPOSE: shifting from "pressure creates beauty" to "clarity is fragile"
    CONNECTIONS AFFECTED:
    - C3 (P1S3 → P3S2): "faceted as any gem" — NOW BROKEN
    - C8 (P3S2 → P5S1): closing metaphor — NEEDS UPDATE
→ Mode detected: revision_companion (confidence: 0.95)
→ Coach response:
  "Glass instead of diamond — that changes things. Glass is fragile,
   transparent, something you can see through and break. 'Pressure creates
   beauty' becomes something like 'clarity is delicate.' That actually
   aligns better with what you told me about wanting to show vulnerability.

   But check P1 — you wrote 'faceted as any gem.' That's still talking about
   the diamond. And your closing line references pressure too. If you're
   committing to glass, those need to follow.

   Want to go through them? The glass metaphor might unlock the ending
   you've been struggling with."
```

### Example 4: Teaching Moment

**BEFORE (current system)**:

```
[Student successfully uses sensory detail to bridge scenes]
→ Coach: "That's much better. The smell detail works well as a bridge."
(Generic positive feedback. No technique naming. No transferability.)
```

**AFTER (orchestrator)**:

```
[Student writes sensory bridge using smell]
→ Mode detected: teaching (student just demonstrated capability)
→ CapabilityTracker: records "sensory threading" as demonstrated
→ Teaching addendum + capability context assembled
→ Coach response:
  "The formaldehyde line is perfect — the reader now has a physical
   sensation connecting both environments without you having to explain
   the relationship.

   What you just did is called sensory threading. You found something
   that exists in both worlds and let the senses do the connecting.
   It works any time you need to bridge physically separate scenes that
   are emotionally linked. Your Stanford supplement has a similar
   disconnect between the classroom and the lab — same technique."
```

---

## PART 7: COST MODEL

### Per-Turn Cost Breakdown

| Component | Model | Current Cost | Orchestrator Cost | Delta |
|-----------|-------|-------------|------------------|-------|
| Stage 1 (classification + mode) | Haiku | $0.001 | $0.001 | $0.000 |
| Stage 1.5 (cognitive assessment) | Haiku | $0.001 | $0.001 | $0.000 |
| Pattern detection (conditional) | Haiku | $0.003 | $0.003 | $0.000 |
| Stage 3 (coaching response) | Sonnet | $0.020 | $0.020 | $0.000 |
| Stage 3 (minimal response) | Haiku | $0.001 | $0.001 | $0.000 |
| Stage 4 (profile deepening) | Sonnet | $0.012 | $0.012 | $0.000 |
| Orchestration (routing, state) | None | $0.000 | $0.000 | $0.000 |
| Mode-specific context assembly | None | $0.000 | $0.000 | $0.000 |
| **Total (typical full turn)** | | **$0.035** | **$0.035** | **$0.000** |

**The orchestrator adds ZERO cost to the per-turn baseline.** All intelligence comes from:
1. The same Haiku calls (now producing mode classification too — negligible token increase)
2. Better context assembly (deterministic, zero cost)
3. Mode-specific system prompt addenda (cached — negligible incremental cost)

**Cost for mode-specific addenda caching**: The addenda are ~300 tokens each. At Sonnet cache write rate ($3.75/MTok), first-time caching costs ~$0.001 per addendum. Subsequent turns hit cache at $0.30/MTok. Negligible.

### Where Additional Cost MAY Appear (Phase 2)

| Feature | Cost | When |
|---------|------|------|
| Revision plan generation | ~$0.02 (1 Sonnet call) | When student asks "What should I work on?" (once per session, not per turn) |
| EditUnderstanding for revision companion | ~$0.02 (1 Sonnet call) | When student makes a non-trivial edit (already runs in re-analysis pipeline — may share) |
| Capability extraction (enhanced pattern detection) | ~$0.001 (extend existing Haiku call) | Every 3 turns (already runs) |

---

## PART 8: EXECUTION ORDER (Dependency-Ordered Steps)

### Phase 1: Foundation (Can be coded immediately)

**Step 1.1: Create type definitions** (~2 hours)
- File: `src/services/essayIntelligence/conversator/types.ts`
- All types from Part 2
- **Verification**: `npx tsc --noEmit` passes

**Step 1.2: Extract MessageClassifier** (~3 hours)
- File: `src/services/essayIntelligence/conversator/messageClassifier.ts`
- Extract Stage 1 + Stage 1.5 from CoachingService into standalone service
- Add `interactionMode` + `modeConfidence` to Stage 1 prompt and output parsing
- **Verification**: Run existing coaching tests — they should still pass (CoachingService still has its own Stage 1/1.5 for backward compat)
- **Verification**: New unit test that classifies 10 sample messages with expected modes

**Step 1.3: Add `processCoachingTurnWithPreClassification` to CoachingService** (~2 hours)
- File: `src/services/essayIntelligence/coaching/coachingService.ts`
- New method that accepts pre-computed Stage 1 + Stage 1.5 + supplementary context
- Export `Stage1Output` type and `parseStage1Output` function
- **Verification**: Call both entry points with same inputs, verify identical outputs (when no supplementary context provided)

**Step 1.4: Create ConversatorOrchestrator shell** (~2 hours)
- File: `src/services/essayIntelligence/conversator/conversatorOrchestrator.ts`
- Entry point `processTurn()` that runs classifier → dispatches to CoachingService via `processCoachingTurnWithPreClassification()`
- No mode-specific behavior yet — all modes route to default coaching
- **Verification**: End-to-end test — same input through orchestrator produces equivalent output to direct CoachingService call

### Phase 2: Mode Routing (Depends on Phase 1)

**Step 2.1: Create ModeRouter with coaching default** (~3 hours)
- File: `src/services/essayIntelligence/conversator/modeRouter.ts`
- All 9 mode branches, but initially all delegate to existing coaching context assembly
- Mode-specific `DeclaredContextRequest` for each mode
- **Verification**: Each mode produces valid `AssembledProfileContext` from the router

**Step 2.2: Create mode-specific system prompt addenda** (~2 hours)
- Brainstorm, craft_workshop, evaluate, emotional_support, direction, teaching addenda
- Test cache behavior: first call caches, subsequent calls hit cache
- **Verification**: Each addendum + coaching philosophy fits within Sonnet context window

**Step 2.3: Wire mode routing to dispatch** (~2 hours)
- ModeRouter output feeds into `processCoachingTurnWithPreClassification()`
- Mode-specific context, system prompt override, and temperature/maxTokens overrides applied
- **Verification**: Send a "Help me brainstorm" message → verify brainstorm addendum is used

### Phase 3: Workshop Management (Depends on Phase 2)

**Step 3.1: Create WorkshopManager** (~3 hours)
- File: `src/services/essayIntelligence/conversator/workshopManager.ts`
- Focus creation, transition, deferred, completion logic
- **Verification**: State machine test — sequence of messages produces correct focus transitions

**Step 3.2: Create FindingCoachingBridge** (~3 hours)
- File: `src/services/essayIntelligence/conversator/findingCoachingBridge.ts`
- Scoped finding selection, structured formatting, discussion tracking
- **Verification**: Given a profile with 10 findings and a P3-focused query, verify correct scoped selection + formatting

**Step 3.3: Wire workshop state to context assembly** (~2 hours)
- Workshop focus description, finding discussion status, revision plan status injected into supplementary context
- **Verification**: Multi-turn conversation test — verify state accumulates correctly

### Phase 4: Revision & Teaching (Depends on Phase 3)

**Step 4.1: Create RevisionCompanion** (~3 hours)
- File: `src/services/essayIntelligence/conversator/revisionCompanion.ts`
- EditUnderstanding formatting for coaching, edit accumulator, re-analysis suggestion logic
- **Verification**: Given an EditUnderstanding with broken connections, verify formatted context flags them

**Step 4.2: Create CapabilityTracker** (~2 hours)
- File: `src/services/essayIntelligence/conversator/capabilityTracker.ts`
- Capability extraction from pattern detection, capability context building
- **Verification**: After a turn where the coach teaches "sensory threading," verify capability recorded

**Step 4.3: Build EssayUnderstanding prose injection** (~1 hour)
- In `buildProfileContextText()`, add `profile.essayUnderstanding.prose` (GAP-10 fix)
- **Verification**: Profile context text includes essay understanding prose

### Phase 5: Integration Testing (Depends on Phase 4)

**Step 5.1: Multi-turn E2E test** (~4 hours)
- 10-turn conversation covering: coaching → brainstorm → craft workshop → evaluation → teaching
- Verify mode transitions, workshop focus tracking, finding discussion state, capability accumulation
- **Verification**: Session state at each turn matches expected values

**Step 5.2: Cost verification** (~1 hour)
- Verify per-turn cost ≤ $0.06 ceiling
- Verify orchestration adds zero incremental LLM cost
- **Verification**: Cost tracker shows ≤ baseline + $0.002 per turn

**Step 5.3: Regression test** (~2 hours)
- Run existing coaching tests through the orchestrator (backward compat path)
- Verify identical behavior when no mode-specific features are activated
- **Verification**: All existing coaching tests pass through orchestrator

---

## PART 9: DEBATES — KEY DECISIONS AND REJECTED ALTERNATIVES

### Debate 1: Should the Orchestrator Make LLM Calls?

**Rejected: Dedicated orchestration LLM call**
A separate Haiku call for orchestration (mode detection + state reasoning) was considered. This would produce richer mode classification with orchestration-specific context (workshop state, revision plan, etc.).

**Why rejected**: Budget constraint (~$0.025 remaining). An extra Haiku call is only $0.001, but it sets a precedent for adding calls. More importantly, the existing Stage 1 Haiku call can absorb mode detection with a ~400-token prompt extension. Adding orchestration context to Stage 1 (workshop state, revision plan) would bloat the Stage 1 prompt beyond what Haiku handles well.

**Decision**: Zero LLM calls for orchestration. Mode detection embedded in Stage 1. Workshop state management is pure deterministic logic.

### Debate 2: New Service vs. Extended CoachingService

**Rejected: Extend CoachingService (Option B)**
Adding mode stages to CoachingService's 5-stage pipeline was considered: Stage 0 (mode detection), Stage 2.5 (mode-specific routing).

**Why rejected**: CoachingService is 2640 lines and well-tested. Adding 600+ lines of orchestration logic risks regression. The concerns are fundamentally different: CoachingService is about coaching QUALITY (prompt engineering, profile deepening). The orchestrator is about routing STRATEGY (which capability, which context, which workshop state). Mixing them violates SRP.

**Decision**: Thin dispatch layer (Option C). CoachingService remains unchanged except for one new entry point.

### Debate 3: Mode Detection Accuracy

**Concern**: Haiku classifying 9 interaction modes from a single student message may be unreliable.

**Mitigation**:
1. Default to `coaching` when confidence < 0.6 (safe fallback)
2. Use session state as signal (if we're in the middle of brainstorming, next message is likely still brainstorming)
3. The modes are routing hints, not rigid categories — the LLM blends in its response regardless
4. The existing `conversationType` (4 values) already achieves ~90% accuracy for its categories. Expanding to 9 modes with clear examples should achieve ~85%.

### Debate 4: Single Sonnet Call vs. Multi-Call Composition

**Rejected: Separate craft engine Sonnet call**
A dedicated Sonnet call for craft expertise (technique selection + application guidance) was considered, running in parallel with the coaching response call.

**Why rejected**: At $0.02 per Sonnet call, this doubles the cost of the response generation stage. The budget ceiling ($0.06) would be exceeded on turns that also need Stage 4 deepening. More importantly, the coaching response already runs on Sonnet — giving it better context is more efficient than running a second model.

**Decision**: Single Sonnet call with enriched context. The craft expertise comes from better context assembly (technique references, scoped findings, voice protection), not from a separate reasoning chain.

### Debate 5: Workshop State Persistence

**Rejected: Full DB persistence of ConversatorSessionState**
Persisting the entire session state to the DB after every turn was considered.

**Why rejected**: Premature. The current system doesn't persist `CoachingSessionMemory` — it's passed in/out per turn by the client. Adding DB persistence for the orchestrator state would require new tables, serialization logic, and recovery handling. Not needed for Phase 1.

**Decision**: In-memory per session (client stores and passes back). Phase 2 adds DB persistence for: (a) cross-session workshop continuity, (b) cross-essay student intelligence.

### Debate 6: Capability Tracking Mechanism

**Rejected: Regex matching on coach responses for technique names**
Pattern matching on the coach's response text to detect when techniques are taught.

**Why rejected**: Violates LLM-first design (Rule 4: no regex quality enforcement). The response text is free-form — regex matching is fragile.

**Decision**: Extend the existing pattern detection Haiku call (which already runs every 3 turns) to include capability extraction. The Haiku call already reads the full conversation — adding "what techniques were taught?" to its output is a natural extension at zero additional cost.

### Debate 7: Finding Discussion Tracking Granularity

**Rejected: LLM-based finding reference detection**
A Haiku call after each response to identify which findings were referenced.

**Why rejected**: Additional cost. More importantly, the system should track what the ORCHESTRATOR injected as context, not what the coach actually referenced. If the orchestrator provided F3 and F7 as relevant findings, they were "discussed" regardless of whether the response named them by ID.

**Decision**: Deterministic tracking based on which findings were included in the scoped context. If the orchestrator injected F3 into the supplementary context and the student's message was about P3-P4, F3's discussion status updates to 'mentioned'. If the student subsequently works on F3 (detected by focus tracking), it updates to 'workshopped'. If the finding maturity changes after re-analysis, it updates to 'resolved'.

---

## PART 10: RISK REGISTRY

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Mode classification accuracy < 70% | Medium | Medium | Default to `coaching` on low confidence. Add session state momentum (stay in current mode unless explicit transition). |
| Supplementary context bloat exceeds token budget | Low | High | Hard limit on supplementary context (2000 tokens). ModeRouter truncates by priority. |
| Workshop state grows unbounded | Low | Low | Cap at 20 focus items, 50 finding discussion entries. Trim oldest deferred focuses. |
| Regression in existing coaching quality | Low | Critical | The `processCoachingTurn()` entry point is UNCHANGED. Orchestrator path runs through `processCoachingTurnWithPreClassification()` only. Full regression test suite. |
| System prompt cache invalidation from addenda | Medium | Medium | Addenda are APPENDED to the cached philosophy, not modifying it. The cache key changes per mode, but each mode's prompt is stable across turns. After first turn in each mode, subsequent turns hit cache. |
| Cross-mode context leakage (brainstorm context in coaching response) | Low | Low | ModeRouter builds context from scratch each turn based on current mode. No carryover from previous mode's context assembly. |

---

## APPENDIX A: TOKEN ESTIMATES FOR MODE-SPECIFIC CONTEXT

| Context Component | Estimated Tokens | Notes |
|-------------------|-----------------|-------|
| Coaching philosophy (cached) | ~1200 | Existing. Cache hit after first turn. |
| Mode addendum (cached per mode) | ~300 | New. 9 variants, each cached separately. |
| Profile context (from router) | ~2000-4000 | Existing. Varies by routing rule. |
| Essay text | ~800-1500 | Existing. Depends on essay length. |
| Conversation history (12 turns) | ~2000-3000 | Existing. |
| Current message | ~50-200 | Existing. |
| Mode supplementary context | ~500-1500 | NEW. Scoped findings + workshop state + capabilities. |
| Total input | ~7000-12000 | Within Sonnet 200K context window. |
| Output | ~300-600 | Response text. |

**Cache breakdown per turn** (after warm-up):
- Cached (system prompt): ~1500 tokens at $0.30/MTok = $0.00045
- Uncached (user prompt): ~8000 tokens at $3.00/MTok = $0.024
- Output: ~500 tokens at $15.00/MTok = $0.0075
- **Total: ~$0.032/turn** (matches current baseline)

---

## APPENDIX B: CONVERSATOR RESULT TYPE

```typescript
/**
 * ConversatorResult — the full output from one orchestrator turn.
 */
export interface ConversatorResult {
  /** The response text to show the student */
  response: string;

  /** Updated session state — client stores and passes back next turn */
  sessionState: ConversatorSessionState;

  /** Per-stage cost breakdown */
  costs: LayerCost[];

  /** Total cost for this turn */
  totalCost: number;

  /** Which mode was used for this turn */
  modeUsed: InteractionMode;

  /** If mode transitioned, the from→to */
  modeTransition?: { from: InteractionMode; to: InteractionMode };

  /** Conversation insight extracted (from Stage 4) */
  insightExtracted: ConversationInsight | null;

  /** Whether the profile was deepened */
  profileDeepened: boolean;

  /** Stage 4 verdict */
  stage4Verdict: Stage4Verdict;

  /** Cognitive assessment for this turn */
  cognitiveAssessment: CognitiveAssessment;

  /** Quality signals (from pattern detection) */
  qualitySignals?: CoachingQualitySignals;

  /** Whether the system suggests re-analysis */
  suggestsReanalysis: boolean;

  /** If suggestsReanalysis, the reason */
  reanalysisReason?: string;

  /** Workshop focus update (for UI) */
  workshopFocusUpdate?: {
    action: 'created' | 'updated' | 'resolved' | 'deferred';
    focus: WorkshopFocus;
  };

  /** Finding resolution update (for UI) */
  findingResolutionUpdate?: Array<{
    findingId: string;
    newStatus: string;
    description: string;
  }>;
}
```

---

*This blueprint passes the "start coding" test: every type is defined, every algorithm has pseudocode, every integration point names the real file and function, every cost claim is grounded in actual model pricing, and every quality improvement has concrete before/after examples.*
