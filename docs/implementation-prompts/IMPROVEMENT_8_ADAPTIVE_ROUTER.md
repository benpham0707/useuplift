# Implementation Prompt #8: Profile Router -- Rules-Based to Adaptive

> Complete, self-contained implementation prompt for a future Claude session.

---

## Context from Cluster B Implementation (MUST READ FIRST)

Cluster B (#2 Scoring Validation + #9 Continuous Phase + #4 Contradiction Mining) is complete. These discoveries directly affect your router upgrade:

### How the Router is Currently Used

1. **L3.5 Analysis Pass** (`analysisPass.ts`): Does NOT use the router. Builds its own profile context via `buildProfileContext()` that serializes the entire profile (all holistic sections, all paragraph understanding, all connections). This is because L3.5 needs the FULL picture for every paragraph call (the system prompt + profile context = Block 1 + Block 2, cached across all parallel paragraph calls).

2. **L4 Crystallizer** (`crystallizer.ts`): Uses `ProfileRouter.assembleContext()` with the `l4_crystallization` routing rule. Serializes assembled sections as JSON.

3. **Phase Assessment** (`phaseAssessment.ts`): Does NOT use the router. Builds its own scoring digest + holistic digest. This is efficient — phase assessment only needs summary statistics, not full prose.

### Key Discoveries

1. **The analysis pass has its own context builder that bypasses the router**. `buildProfileContext()` in `analysisPass.ts` (lines 488-676) is a substantial piece of code that serializes the entire profile with [U] observation labels, [F] finding labels, connection graph, etc. When you add adaptive routing, you'll need to decide: does the analysis pass switch to using the router, or does it keep its specialized builder? The specialized builder has features the router doesn't: sequential [U] label assignment, per-sentence understanding formatting, connection display with routing tags. **Recommendation**: Keep the specialized builder for L3.5 (it's optimized for the scoring task) and route other consumers through the adaptive system.

2. **Finding context is assembled separately from profile context**. `buildParagraphFindingContext()` from `findings/findingContextBuilder.ts` produces a per-paragraph finding digest that's injected as a separate block in Block 3 (per-paragraph prompt). The router should be aware of this when assembling context for consumers that need finding context — don't duplicate what the finding context builder already provides.

3. **Anchor context is injected per-paragraph, not globally**. The anchor paragraph's scores and calibration reflection are formatted into a cross-paragraph calibration block and injected into each non-anchor paragraph's Block 3. This is per-call context that changes based on which paragraph is being analyzed. Your `DeclaredContextRequest` should handle this pattern — some context is call-specific, not globally assembled.

4. **Distribution diagnostics exist but are pure bookkeeping**. The `distributionDiagnostics` field on `L35AnalysisResult` has sentence/paragraph stdev/range, low confidence count, and anchor index. These could be useful routing signals for the growth cycle (e.g., high clustering might indicate synthesis should investigate scoring uniformity). But they MUST remain bookkeeping — never drive routing decisions deterministically.

5. **`coachingLens` from phase assessment is a new context source**. It's a 2-4 sentence directive capturing the student's developmental stage. This should be available as an assemblable context section for L5/L6 consumers but NOT for understanding/analysis consumers (to preserve the understanding→analysis→feedback separation).

6. **Essay-type-specific calibration is already in the prompts**. The crystallizer and phase assessment both have type-specific guidance. When the router handles budget allocation, essay type should influence token budgets (supplements need less context than personal statements).

### Actual Types from Cluster B

**`ProgrammaticContradiction[]`** lives on `CoherenceReport.programmaticContradictions`. Route these alongside the LLM-detected `CoherenceIssue[]` when assembling context for consumers that need coherence information.

**`ImprovementPhase.dimensionPhases`** is an array of 3-6 entries (not always 8). Your router should handle sparse dimension coverage when assembling phase context.

**`AnalysisPassOutput.calibrationReflection`** and `comparativeNotes` are anti-clustering metadata. Available per-paragraph. Could be useful context for the growth cycle's synthesis validation.

---

## Context

You are upgrading the Profile Router (`src/services/essayIntelligence/profileManager/profileRouter.ts`) from a rigid 13-rule switch statement to an adaptive context assembly system. The current router maps each `RoutingRule` to a hand-coded function that assembles profile sections with fixed logic (specific fields, fixed priority tiers, hardcoded proximity windows). This works, but it cannot adapt to what the LLM actually needs for a specific analysis task.

The V2 evolution (PLAN2.md) introduces new context consumers that don't fit the 13-rule model:
- **Deep dive prompts** (~20 specialized prompts, each with different context needs)
- **Growth cycle iterations** (context needs change across iterations)
- **Re-reads** (full context for one paragraph)
- **Reading Strategy** (informs what context to prioritize)

The upgrade adds a **Declared Context System** alongside the existing 13 rules. Analysis steps declare what they need (via `DeclaredContextRequest`), and the router assembles it. This replaces static multiplier tables and essay-type weight maps with convergence-driven allocation within a total budget ceiling.

**Key files:**
- `src/services/essayIntelligence/profileManager/profileRouter.ts` -- current 13-rule router
- `src/services/essayIntelligence/analysis/holisticSynthesis.ts` -- a consumer of router context
- `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` -- pipeline coordinator
- `src/services/essayIntelligence/profileTypes.ts` -- V2 type definitions
- `PLAN2.md` -- authoritative spec for V2 evolution

---

## Design Principles (LLM-First Rules)

### Rule 1: The LLM Owns All Judgment -- The System Tracks and Organizes
- The LLM decides what context it needs for a deep dive (via `DeclaredContextRequest` or by generating a context request in prose).
- The system assembles and delivers that context within operational constraints (budget, token limits).
- The LLM's Reading Strategy informs context ordering and emphasis -- not a static essay-type weight table.

### Rule 2: Never Discard Paid LLM Output
- When context is compressed due to budget, the router SUMMARIZES rather than DROPS sections. Compressed context includes a note: "Full [voice map / paragraph P3 understanding] available -- summary provided due to token budget."
- Context relevance tracking never deletes data from the profile. It annotates usage patterns.

### Rule 3: No Closed Taxonomies for LLM Perception
- The `DeclaredContextRequest` interface supports free-form context descriptions, not just enum-based section selectors. The LLM can request "any connections involving voice shifts" without knowing the exact field path.
- `ESSAY_TYPE_WEIGHTS` (fixed multiplier table mapping essay type to dimension importance) is REMOVED. Replaced by the Reading Strategy, which the LLM discovers during the growth cycle (Improvement #7).

### Rule 4: No Whack-a-Mole Pattern Matching
- Context quality is not checked by scanning assembled context for regex patterns. If the router produces bad context, the diagnostic system (described below) catches it through LLM reference tracking, not keyword matching.

### Rule 5: Soft Guidance Over Hard Blocklists
- Reading Strategy provides soft ordering guidance: "This essay rewards attention to vocabulary domain shifts -- prioritize voice data." This influences section ordering, not section inclusion/exclusion.

### Rule 6: System Infrastructure IS Appropriate for Resource Limits and Bookkeeping
- Token budget ceiling is system infrastructure.
- `estimateTokens()` heuristic is system infrastructure.
- `ContextRelevanceTracker` that logs what was provided vs. referenced is system bookkeeping.
- Priority tiers (`always`, `connection_driven`, `proximity`, `nice_to_have`) for budget enforcement are system bookkeeping.

---

## Core Architecture

### Declared Context System Types

```typescript
// ── Declared Context Request ──
// Analysis steps declare what they need. The router assembles it.

interface DeclaredContextRequest {
  /** Human-readable description of what this context is for */
  purpose: string;

  /** Required sections -- always included regardless of budget */
  required: ContextSectionSpec[];

  /** Desired sections -- included if budget allows, in priority order */
  desired: ContextSectionSpec[];

  /** Token budget for the entire assembled context */
  tokenBudget: number;

  /** Reading Strategy -- influences ordering and emphasis */
  readingStrategy?: ReadingStrategy;

  /** If provided, the router should optimize ordering for this focus */
  analysisFocus?: string;
}

interface ContextSectionSpec {
  /**
   * What to include. Supports:
   * - Named sections: 'profileIndex', 'voiceIdentity', 'voiceMap',
   *   'emotionalTopography', 'thematicArchitecture', 'narrativeStrategy',
   *   'characterRevelation', 'craftAssessment', 'admissionsPositioning',
   *   'entanglements', 'northStar', 'connections', 'readingStrategy'
   * - Paragraph-scoped: 'paragraph:3' (full P3), 'paragraph:3:understanding' (P3 understanding only)
   * - Sentence-scoped: 'sentence:3:2' (P3S2 full)
   * - Connection-scoped: 'connections:paragraph:3' (connections involving P3)
   * - All paragraphs: 'paragraphs:all' (full), 'paragraphs:all:digests' (digests only)
   * - All findings: 'findings:all', 'findings:dimension:voice'
   * - Question queue: 'questions:open', 'questions:all'
   * - Essay text: 'essayText', 'essayText:paragraph:3'
   * - Free-form: 'custom:...' (router resolves by best-effort matching)
   */
  section: string;

  /** How to present this section */
  presentation: 'full' | 'summary' | 'digest';

  /** Priority override (default: determined by position in required/desired) */
  priority?: 'always' | 'connection_driven' | 'proximity' | 'nice_to_have';
}

// ── Context Relevance Tracking ──

interface ContextRelevanceEntry {
  /** Which routing rule or declared request produced this context */
  source: string;
  /** Which sections were included */
  sectionsProvided: string[];
  /** Estimated tokens of assembled context */
  totalTokens: number;
  /** Timestamp */
  timestamp: string;
  /** Which sections the LLM actually referenced in its output (post-hoc analysis) */
  sectionsReferenced?: string[];
  /** Which sections the LLM mentioned needing but not having */
  sectionsMissing?: string[];
}

interface ContextRelevanceTracker {
  /** Log a context assembly event */
  recordAssembly(entry: ContextRelevanceEntry): void;
  /** Log which sections the LLM actually used (called after LLM response is parsed) */
  recordUsage(source: string, referenced: string[], missing: string[]): void;
  /** Get usage statistics for diagnostic purposes */
  getStats(): {
    mostReferenced: Array<{ section: string; refCount: number }>;
    leastReferenced: Array<{ section: string; refCount: number }>;
    mostMissing: Array<{ section: string; missCount: number }>;
  };
}
```

### Removing `ESSAY_TYPE_WEIGHTS`

The current system uses (or was designed to use) a static mapping:

```typescript
// REMOVED -- this is a closed taxonomy that pre-determines dimension importance
const ESSAY_TYPE_WEIGHTS: Record<EssayType, Record<HolisticDimension, number>> = {
  common_app: { voice: 1.2, emotion: 1.1, theme: 1.0, ... },
  supplement: { voice: 0.9, theme: 1.3, admissions: 1.2, ... },
  piq: { voice: 1.0, character: 1.2, ... },
};
```

This violates Rule 3 (closed taxonomy) and Rule 1 (pre-determines what matters). A supplement about music and identity needs the same voice attention as a common app about music and identity. The ESSAY TYPE is a weak signal; the ESSAY CONTENT is the strong signal.

**Replacement:** The Reading Strategy (produced by L3.75 in Improvement #7) tells the router what THIS SPECIFIC ESSAY rewards attention to:

```typescript
// Reading Strategy (from L3.75) replaces static essay-type weights
interface ReadingStrategy {
  strategy: string;         // "This essay rewards attention to vocabulary domain shifts..."
  bestApproach: string;     // "Follow the procedural voice..."
  antiPatterns: string[];   // "This is NOT a trauma essay..."
}
```

The router uses the Reading Strategy to:
1. **Order sections** in the assembled context (most relevant to the strategy go first)
2. **Emphasize sections** when compressing (strategy-relevant sections get full presentation, others get summaries)
3. **Inform deep dive context** (strategy tells the router which profile dimensions matter most for each essay)

### Removing `computeDynamicBudget()` Fixed Multiplier Tables

The current design used fixed multiplier tables:

```typescript
// REMOVED -- deterministic formula for contextual decision
function computeDynamicBudget(
  rule: RoutingRule,
  essayType: EssayType,
  paragraphCount: number,
): number {
  const BASE_BUDGETS: Record<RoutingRule, number> = { ... };
  const ESSAY_MULTIPLIERS: Record<EssayType, number> = { ... };
  const LENGTH_FACTOR = Math.min(1.3, 1 + (paragraphCount - 5) * 0.05);
  return BASE_BUDGETS[rule] * ESSAY_MULTIPLIERS[essayType] * LENGTH_FACTOR;
}
```

**Replacement:** Each context consumer declares its budget in the `DeclaredContextRequest`. The budget reflects the consumer's actual needs (a deep dive on voice needs ~3000 tokens of context; a holistic synthesis needs ~8000). The router enforces the budget as a ceiling, not a target.

For the existing 13 routing rules (which use `ContextRequest`, not `DeclaredContextRequest`), the `DEFAULT_TOKEN_BUDGET = 8000` remains as the fallback, which is already in the current code.

### The Adaptive Router Class

```typescript
export class ProfileRouter {
  private relevanceTracker: ContextRelevanceTracker;

  constructor() {
    this.relevanceTracker = new InMemoryRelevanceTracker();
  }

  /**
   * Original entry point -- 13 routing rules for backward compatibility.
   * All existing callers continue to work unchanged.
   */
  assembleContext(
    profile: Readonly<EssayProfile>,
    request: ContextRequest,
  ): AssembledProfileContext {
    // Existing 13-rule switch statement -- UNCHANGED
    // This is the integration path: existing rules work alongside declared context
    const budget = request.tokenBudget ?? DEFAULT_TOKEN_BUDGET;
    let sections: ProfileSection[];

    switch (request.rule) {
      // ... existing 13 rules unchanged ...
    }

    const result = this.applyTokenBudget(sections, budget, request.rule);

    // Track what was assembled (bookkeeping -- Rule 6)
    this.relevanceTracker.recordAssembly({
      source: request.rule,
      sectionsProvided: result.sections.map(s => s.name),
      totalTokens: result.estimatedTokens,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  /**
   * New entry point -- declared context assembly.
   * Used by deep dives, growth cycle iterations, re-reads, and any future
   * consumer that knows what context it needs.
   */
  assembleDeclared(
    profile: Readonly<EssayProfile>,
    request: DeclaredContextRequest,
  ): AssembledProfileContext {
    const sections: ProfileSection[] = [];
    const droppedSections: string[] = [];

    // ── Step 1: Resolve required sections ──
    for (const spec of request.required) {
      const resolved = this.resolveSection(profile, spec);
      if (resolved) {
        resolved.priority = 'always';
        sections.push(resolved);
      }
    }

    // ── Step 2: Resolve desired sections ──
    for (const spec of request.desired) {
      const resolved = this.resolveSection(profile, spec);
      if (resolved) {
        resolved.priority = spec.priority ?? 'nice_to_have';
        sections.push(resolved);
      }
    }

    // ── Step 3: Apply Reading Strategy ordering ──
    if (request.readingStrategy) {
      this.applyReadingStrategyOrdering(sections, request.readingStrategy, request.analysisFocus);
    }

    // ── Step 4: Apply token budget ──
    const result = this.applyTokenBudgetWithCompression(
      sections,
      request.tokenBudget,
      request.purpose,
      droppedSections,
    );

    // Track assembly
    this.relevanceTracker.recordAssembly({
      source: `declared:${request.purpose}`,
      sectionsProvided: result.sections.map(s => s.name),
      totalTokens: result.estimatedTokens,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  /**
   * Record which sections the LLM actually used in its response.
   * Called by the caller after parsing the LLM's output.
   */
  recordContextUsage(
    source: string,
    referenced: string[],
    missing: string[],
  ): void {
    this.relevanceTracker.recordUsage(source, referenced, missing);
  }

  /**
   * Get diagnostic statistics about context usage patterns.
   */
  getContextDiagnostics(): ReturnType<ContextRelevanceTracker['getStats']> {
    return this.relevanceTracker.getStats();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION RESOLUTION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Resolve a ContextSectionSpec into a ProfileSection.
   * Handles named sections, paragraph-scoped, sentence-scoped,
   * connection-scoped, and free-form selectors.
   */
  private resolveSection(
    profile: Readonly<EssayProfile>,
    spec: ContextSectionSpec,
  ): ProfileSection | null {
    const { section, presentation } = spec;

    // ── Named holistic sections ──
    const HOLISTIC_MAP: Record<string, unknown> = {
      'profileIndex': profile.index,
      'voiceIdentity': profile.voiceIdentity,
      'voiceMap': profile.voiceMap,
      'emotionalTopography': profile.emotionalTopography,
      'momentEarnednessMap': profile.momentEarnednessMap,
      'thematicArchitecture': profile.thematicArchitecture,
      'narrativeStrategy': profile.narrativeStrategy,
      'characterRevelation': profile.characterRevelation,
      'craftAssessment': profile.craftAssessment,
      'admissionsPositioning': profile.admissionsPositioning,
      'entanglements': profile.entanglements,
      'northStar': profile.northStar,
      'connections': profile.connections,
    };

    if (section in HOLISTIC_MAP) {
      const content = HOLISTIC_MAP[section];
      return {
        name: section,
        content: presentation === 'summary'
          ? this.summarizeSection(section, content)
          : content,
        tokenEstimate: estimateTokens(
          presentation === 'summary' ? this.summarizeSection(section, content) : content
        ),
        priority: 'always',
      };
    }

    // ── Paragraph-scoped: 'paragraph:3' or 'paragraph:3:understanding' ──
    const paraMatch = section.match(/^paragraph:(\d+)(?::(\w+))?$/);
    if (paraMatch) {
      const pIdx = parseInt(paraMatch[1]);
      const aspect = paraMatch[2]; // 'understanding', 'analysis', or undefined (full)
      const para = profile.paragraphs[pIdx];
      if (!para) return null;

      let content: unknown;
      if (aspect === 'understanding') {
        content = { index: pIdx, text: para.text, understanding: para.understanding };
      } else if (aspect === 'analysis') {
        content = { index: pIdx, analysis: para.analysis };
      } else {
        content = {
          index: pIdx,
          text: para.text,
          understanding: para.understanding,
          analysis: para.analysis,
          sentences: para.sentences.map(s => ({
            index: s.index, text: s.text,
            understanding: s.understanding,
            analysis: s.analysis,
          })),
        };
      }

      if (presentation === 'digest') {
        content = buildParagraphDigest(para);
      }

      return {
        name: `paragraph_P${pIdx}${aspect ? '_' + aspect : ''}`,
        content,
        tokenEstimate: estimateTokens(content),
        priority: 'always',
      };
    }

    // ── Sentence-scoped: 'sentence:3:2' ──
    const sentMatch = section.match(/^sentence:(\d+):(\d+)$/);
    if (sentMatch) {
      const pIdx = parseInt(sentMatch[1]);
      const sIdx = parseInt(sentMatch[2]);
      const sentence = profile.paragraphs[pIdx]?.sentences[sIdx];
      if (!sentence) return null;

      return {
        name: `sentence_P${pIdx}S${sIdx}`,
        content: {
          paragraphIndex: pIdx, sentenceIndex: sIdx,
          text: sentence.text,
          understanding: sentence.understanding,
          analysis: sentence.analysis,
        },
        tokenEstimate: estimateTokens(sentence),
        priority: 'always',
      };
    }

    // ── Connection-scoped: 'connections:paragraph:3' ──
    const connMatch = section.match(/^connections:paragraph:(\d+)$/);
    if (connMatch) {
      const pIdx = parseInt(connMatch[1]);
      const conns = getConnectionsForParagraph(profile, pIdx);
      return {
        name: `connections_P${pIdx}`,
        content: conns,
        tokenEstimate: estimateTokens(conns),
        priority: 'connection_driven',
      };
    }

    // ── All paragraphs: 'paragraphs:all' or 'paragraphs:all:digests' ──
    if (section === 'paragraphs:all' || section === 'paragraphs:all:digests') {
      const isDigest = section.endsWith(':digests');
      const content = profile.paragraphs.map(p =>
        isDigest
          ? buildParagraphDigest(p)
          : {
              index: p.index, text: p.text,
              understanding: p.understanding,
              sentences: p.sentences.map(s => ({
                index: s.index, text: s.text, understanding: s.understanding,
              })),
            }
      );
      return {
        name: isDigest ? 'paragraphs_digests' : 'paragraphs_full',
        content,
        tokenEstimate: estimateTokens(content),
        priority: 'always',
      };
    }

    // ── Essay text: 'essayText' or 'essayText:paragraph:3' ──
    if (section === 'essayText') {
      return {
        name: 'essayText',
        content: profile.metadata?.essayText ?? '',
        tokenEstimate: estimateTokens(profile.metadata?.essayText ?? ''),
        priority: 'always',
      };
    }

    const essayParaMatch = section.match(/^essayText:paragraph:(\d+)$/);
    if (essayParaMatch) {
      const pIdx = parseInt(essayParaMatch[1]);
      const text = profile.paragraphs[pIdx]?.text ?? '';
      return {
        name: `essayText_P${pIdx}`,
        content: text,
        tokenEstimate: estimateTokens(text),
        priority: 'always',
      };
    }

    // ── Unknown section: log warning, return null ──
    console.warn(`[ProfileRouter] Unknown section spec: '${section}' -- skipping`);
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // READING STRATEGY ORDERING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Reorder sections based on the Reading Strategy.
   *
   * The Reading Strategy tells us what this essay rewards attention to.
   * Sections relevant to the strategy's focus move earlier in the context.
   * This affects what the LLM sees first and how it frames its analysis.
   *
   * This is an OPPORTUNITY, not a problem: ordering IS framing. By
   * putting the most relevant context first, we give the LLM the right
   * cognitive frame for this specific analysis task on this specific essay.
   */
  /**
   * Reorder sections based on the Reading Strategy's contextPriorities.
   *
   * DESIGN: L3.75 produces `contextPriorities: string[]` as an explicit
   * routing signal alongside the reading strategy prose. The router uses
   * this directly — NO keyword matching, NO dimensionKeywords closed
   * taxonomy (Rule 7: have the LLM produce routing signals explicitly).
   *
   * Previous design had a dimensionKeywords dict that keyword-matched
   * against reading strategy prose. This failed for novel dimensions
   * (e.g., "prosodic cadence" didn't match the 7-category keyword list)
   * and was a closed taxonomy (Rule 3 violation).
   */
  private applyReadingStrategyOrdering(
    sections: ProfileSection[],
    strategy: ReadingStrategy,
  ): void {
    if (!strategy.contextPriorities?.length) return;

    // L3.75 already told us the priority order. Build an index.
    const priorityIndex = new Map(
      strategy.contextPriorities.map((name, i) => [name, i])
    );

    // Sort: required sections first (preserve order), then by L3.75's priorities
    sections.sort((a, b) => {
      // 'always' priority stays first
      if (a.priority === 'always' && b.priority !== 'always') return -1;
      if (a.priority !== 'always' && b.priority === 'always') return 1;
      // Within same priority tier, sort by L3.75's contextPriorities ordering
      const aIdx = priorityIndex.get(a.name) ?? 999;
      const bIdx = priorityIndex.get(b.name) ?? 999;
      return aIdx - bIdx;
    });

    // Rewrite sections in-place
    for (let i = 0; i < sections.length; i++) {
      sections[i] = scored[i].section;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TOKEN BUDGET WITH COMPRESSION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Apply token budget with compression instead of dropping.
   *
   * When budget is tight, the choice is: fewer sections at full fidelity
   * OR more sections at compressed fidelity. The answer depends on the
   * analysis task:
   *
   * - Deep dive on voice: FULL voice map (can't compress), SUMMARY of structure
   * - Holistic synthesis: ALL sections at moderate detail
   * - Coaching on paragraph: FULL target paragraph, DIGEST of others
   *
   * The DeclaredContextRequest's 'presentation' field handles this per-section.
   * This method handles budget overflow by progressively compressing
   * lowest-priority sections.
   */
  private applyTokenBudgetWithCompression(
    sections: ProfileSection[],
    budget: number,
    purpose: string,
    droppedSections: string[],
  ): AssembledProfileContext {
    let totalTokens = sections.reduce((sum, s) => sum + s.tokenEstimate, 0);

    if (totalTokens <= budget) {
      return {
        sections,
        estimatedTokens: totalTokens,
        appliedRule: 'declared' as RoutingRule,
        droppedSections: [],
      };
    }

    // Progressive compression: compress lowest-priority sections first
    // Priority order for compression: nice_to_have -> proximity -> connection_driven -> always
    const compressionOrder: ProfileSection['priority'][] = [
      'nice_to_have', 'proximity', 'connection_driven', 'always',
    ];

    for (const tier of compressionOrder) {
      if (totalTokens <= budget) break;

      const tierSections = sections.filter(s => s.priority === tier);

      for (const section of tierSections) {
        if (totalTokens <= budget) break;

        const compressed = this.compressSection(section);
        if (compressed) {
          const saved = section.tokenEstimate - compressed.tokenEstimate;
          totalTokens -= saved;
          // Replace in-place
          const idx = sections.indexOf(section);
          sections[idx] = compressed;
        } else {
          // Can't compress further -- drop
          totalTokens -= section.tokenEstimate;
          const idx = sections.indexOf(section);
          sections.splice(idx, 1);
          droppedSections.push(section.name);
        }
      }
    }

    return {
      sections,
      estimatedTokens: totalTokens,
      appliedRule: 'declared' as RoutingRule,
      droppedSections,
    };
  }

  /**
   * Compress a section by summarizing its content.
   * Returns null if the section is already at minimum fidelity.
   */
  private compressSection(section: ProfileSection): ProfileSection | null {
    const content = section.content;
    if (typeof content === 'string') return null; // Already minimal

    // For objects: produce a compact summary
    const summary = this.summarizeSection(section.name, content);
    if (!summary) return null;

    return {
      ...section,
      content: summary,
      tokenEstimate: estimateTokens(summary),
    };
  }

  /**
   * Produce a compact summary of a profile section.
   * Used for compression and for 'summary' presentation mode.
   */
  private summarizeSection(name: string, content: unknown): unknown {
    if (!content || typeof content !== 'object') return content;

    const obj = content as Record<string, unknown>;

    // Section-specific summarization
    switch (name) {
      case 'voiceMap': {
        // Keep baselines and shift locations, drop individual observations
        return {
          register: { baseline: (obj['register'] as Record<string, unknown>)?.['baseline'] },
          vocabularyFingerprint: { baseline: (obj['vocabularyFingerprint'] as Record<string, unknown>)?.['baseline'] },
          sentenceRhythm: { baseline: (obj['sentenceRhythm'] as Record<string, unknown>)?.['baseline'] },
          perspectiveDistance: { baseline: (obj['perspectiveDistance'] as Record<string, unknown>)?.['baseline'] },
          tonalDisposition: { baseline: (obj['tonalDisposition'] as Record<string, unknown>)?.['baseline'] },
          shifts: obj['shifts'], // Keep shifts -- they're essential
          _compressed: true,
          _note: 'Full voice map observations available -- summary shows baselines + shifts only',
        };
      }

      case 'connections': {
        // Keep connection count and high-confidence connections only
        const all = (obj['all'] as Array<Record<string, unknown>>) ?? [];
        return {
          connectionCount: all.length,
          highConfidence: all.filter(c => (c['confidence'] as number) >= 0.7),
          _compressed: true,
          _note: `${all.length} total connections -- showing ${all.filter(c => (c['confidence'] as number) >= 0.7).length} high-confidence only`,
        };
      }

      default: {
        // Generic: keep only string/number/boolean top-level fields, drop arrays > 3 items
        const summary: Record<string, unknown> = { _compressed: true };
        for (const [key, val] of Object.entries(obj)) {
          if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            summary[key] = val;
          } else if (Array.isArray(val) && val.length <= 3) {
            summary[key] = val;
          } else if (Array.isArray(val)) {
            summary[key] = `[${val.length} items]`;
          }
        }
        return summary;
      }
    }
  }
}
```

---

## Deeper Design

### Q1: Context as Cognitive Frame -- Is ordering a problem or an opportunity?

**Answer: Opportunity. Lean into it deliberately.**

The LLM's attention is biased toward what it sees first. This is well-known from prompt engineering: system prompt framing shapes all subsequent reasoning. Context ordering IS framing.

The router should EXPLOIT this:
- For a deep dive on voice authenticity: voice data first, then paragraph text, then connections. The LLM enters "voice analysis mode" and reads the paragraph through a voice lens.
- For holistic synthesis: essay-level understanding first, then structural overview, then paragraph details. The LLM enters "big picture mode" and synthesizes top-down.
- For paragraph coaching: the specific paragraph first, then its connections, then essay-wide patterns. The LLM enters "local focus mode" and coaches from the ground level up.

The Reading Strategy amplifies this: if the strategy says "this essay rewards attention to vocabulary domain shifts," the router orders vocabulary data earlier in the context. The LLM naturally gives more weight to the vocabulary dimension.

Implementation: the `applyReadingStrategyOrdering()` method (in Core Architecture above) scores sections by strategy relevance and reorders within priority tiers.

**Guard rail:** Required sections always precede desired sections. The strategy reorders WITHIN tiers, not across them. This prevents a strategy that emphasizes voice from pushing essential structural data after the token budget cutoff.

### Q2: Context Compression vs. Context Selection

**Answer: Per-section decision based on the consumer's needs, with a default of "summarize before dropping."**

Different analysis steps have radically different needs:

| Consumer | Needs Full Fidelity On | Can Summarize |
|----------|----------------------|---------------|
| Deep dive: voice_authenticity | Voice map, target paragraph text | Structure, other paragraphs, admissions |
| Deep dive: structural_necessity | All paragraph readings, narrative strategy | Voice map, craft assessment, individual sentence understanding |
| L3.75 synthesis | Everything (but it has a big budget) | Nothing -- it needs the full picture |
| L6 coaching (paragraph) | Target paragraph + connections | Other paragraphs, admissions, craft patterns |
| Focused analysis | Changed paragraph + ripple targets | Everything else |

The `DeclaredContextRequest` handles this elegantly:
- `required` sections with `presentation: 'full'` are never compressed
- `desired` sections with `presentation: 'summary'` are pre-compressed
- When budget overflows, the `applyTokenBudgetWithCompression()` method progressively compresses `nice_to_have` -> `proximity` -> `connection_driven` sections

The key insight: **summarize before dropping**. A compressed voice map (baselines + shifts only, ~200 tokens) is better than NO voice map. The LLM sees the signal and can request more detail if needed (in coaching, it can say "let me look more closely at the voice in P3").

### Q3: Router Debugging -- Diagnosing Bad Context

**Answer: Three-layer diagnostic: what was provided, what was referenced, what was missing.**

When analysis quality is poor, the diagnostic question is: "Was it the context or the prompt?"

The `ContextRelevanceTracker` captures three signals:

1. **What was provided:** The sections included in the assembled context, with token estimates. Logged at assembly time.

2. **What was referenced:** After the LLM's response is parsed, the caller scans for section references. For example, if the LLM's voice analysis mentions "P3S4" but the context only included P3 at digest level, that's a reference to missing detail. Implementation: a lightweight post-hoc scan of the LLM output for paragraph/sentence references, section names, and key terms.

3. **What was missing:** If the LLM explicitly says "I would need the voice map to assess this" or "without P2's text, I cannot determine...", that's a direct signal. Implementation: parse the LLM output for phrases indicating missing context ("without", "I would need", "if I could see").

The diagnostic aggregation:

```typescript
// After N analysis runs, the tracker reveals patterns:
const stats = router.getContextDiagnostics();

// "voiceMap provided 12 times, referenced 11 times" -- high utility
// "admissionsPositioning provided 12 times, referenced 2 times" -- low utility for this call type
// "essayText requested 3 times but not provided" -- context gap

// This informs router improvements:
// - Sections with low reference rates can be downgraded from 'always' to 'nice_to_have'
// - Sections frequently missing should be added to the context spec
```

This is SYSTEM BOOKKEEPING (Rule 6), not quality judgment. The tracker never decides that context is "bad" -- it provides data for the developer to improve routing rules.

### Q4: LLM-Generated Context Requests

**Answer: Support this as a two-step deep dive protocol, not for all calls.**

For deep dives, the most organic approach is:

1. The dispatch says: "You need to investigate: Why does the voice retreat to abstraction specifically when discussing the father?"
2. The LLM responds: "To investigate this, I need: the voice map (full), P3 and P5 full text with sentence-level understanding, any connections between P3 and P5, and the emotional topography."
3. The router assembles that context.
4. The LLM runs the actual deep dive with its requested context.

This is a **two-call pattern**: one cheap call (Haiku, ~$0.005) to generate the context request, then one Sonnet call (~$0.03) with the assembled context to run the dive.

```typescript
interface LLMContextNegotiation {
  /** Step 1: Ask the LLM what it needs */
  prompt: string;  // "You are about to investigate: [question]. What context do you need?"
  /** Step 2: Parse the LLM's response into a DeclaredContextRequest */
  parseContextRequest(llmResponse: string): DeclaredContextRequest;
}
```

For the initial implementation, this is OPTIONAL. The deep dive prompt library already declares `requiredContext` per prompt. LLM-generated context requests are a Phase 2 enhancement for when the static `requiredContext` proves insufficient.

**When to implement:** After the first round of deep dive quality evaluation. If deep dives frequently produce output that says "I would need X but don't have it," that's the signal to add LLM context negotiation.

### Q5: Router adaptation during the growth cycle

**Answer: Context needs change across iterations. The router tracks this implicitly through the changing Reading Strategy.**

Early growth cycle iterations (iteration 0-1):
- Broad context: full holistic sections, all paragraph readings, all connections
- Purpose: exploratory. The LLM needs the complete picture to identify what's interesting.

Late growth cycle iterations (iteration 2+):
- Narrow context: previous synthesis, new findings from deep dives/re-reads, specific areas of change
- Purpose: confirmatory. The LLM needs to see what's NEW and check it against the stable synthesis.

This adaptation happens NATURALLY through the `DeclaredContextRequest`:

```typescript
// Iteration 0: broad context
const iter0Request: DeclaredContextRequest = {
  purpose: 'L3.75 synthesis iteration 0 (initial)',
  required: [
    { section: 'paragraphs:all', presentation: 'full' },
    { section: 'connections', presentation: 'full' },
    { section: 'essayText', presentation: 'full' },
  ],
  desired: [
    { section: 'voiceIdentity', presentation: 'full' },
    { section: 'emotionalTopography', presentation: 'full' },
    // ... all holistic sections
  ],
  tokenBudget: 12000,
};

// Iteration 2: narrow context
const iter2Request: DeclaredContextRequest = {
  purpose: 'L3.75 synthesis iteration 2 (refinement)',
  required: [
    { section: 'previousSynthesis', presentation: 'full' },  // custom section
    { section: 'newFindings', presentation: 'full' },         // custom section
    { section: 'essayText', presentation: 'full' },
  ],
  desired: [
    // Only sections that deep dives touched
    { section: 'voiceMap', presentation: 'full' },  // if voice dive ran
    { section: 'connections', presentation: 'summary' },
    { section: 'paragraphs:all', presentation: 'digest' },  // digests only
  ],
  tokenBudget: 8000,
  readingStrategy: currentReadingStrategy,
};
```

The orchestrator (Improvement #7) constructs the appropriate `DeclaredContextRequest` for each iteration based on what deep dives ran and what areas the synthesis flagged for refinement.

### Q6: Minimal viable router -- integration path

**Answer: Add `assembleDeclared()` alongside existing rules. Zero breaking changes.**

The integration is strictly additive:

1. The existing `assembleContext(profile, request: ContextRequest)` method is UNCHANGED. All 13 rules continue to work exactly as they do today.

2. The new `assembleDeclared(profile, request: DeclaredContextRequest)` method is ADDED as a second entry point. New consumers (deep dives, growth cycle, re-reads) use this.

3. The `ContextRelevanceTracker` is ADDED and records usage for BOTH entry points. This provides diagnostics without changing any behavior.

4. Over time, existing rules can be OPTIONALLY migrated to declared context requests. For example, `l6_coaching_paragraph` could be expressed as:

```typescript
const coachingRequest: DeclaredContextRequest = {
  purpose: 'L6 coaching on P3',
  required: [
    { section: 'profileIndex', presentation: 'full' },
    { section: 'paragraph:3', presentation: 'full' },
    { section: 'voiceIdentity', presentation: 'summary' },
    { section: 'thematicArchitecture', presentation: 'summary' },
  ],
  desired: [
    { section: 'connections:paragraph:3', presentation: 'full' },
    { section: 'paragraph:2', presentation: 'digest' },
    { section: 'paragraph:4', presentation: 'digest' },
    { section: 'northStar', presentation: 'summary' },
  ],
  tokenBudget: 4000,
  readingStrategy: currentReadingStrategy,
};
```

But this migration is OPTIONAL and can happen incrementally. The existing rule-based approach works and will continue to work.

---

## Prompt Engineering

### Context Request Generation Prompt (for LLM-negotiated context, Phase 2)

```
You are about to investigate this question:

"{question}"

The essay profile contains these sections:
- Voice Identity: writer's voice signature, register, distinctive patterns
- Voice Map: 5-dimension voice geography across the essay (register, vocabulary, rhythm, perspective, tonal disposition)
- Emotional Topography: emotional arc, peak moments, undertones
- Moment Earnedness Map: how emotional/intellectual moments are earned or unearned
- Thematic Architecture: thesis, threads, subtext, contradictions
- Narrative Strategy: arc type, momentum, turning points, pacing
- Character Revelation: writer portrait, values, growth arc
- Craft Assessment: craft signatures, patterns, image system
- Admissions Positioning: AO perspective, distinctiveness
- Cross-Dimension Entanglements: where dimensions intersect
- Paragraph Understanding: per-paragraph readings with sentence-level detail
- Connections: cross-paragraph semantic links
- Findings: structured claims about the essay at various maturity levels

For your investigation, list EXACTLY what you need:
1. Which sections at FULL detail (critical for your analysis)?
2. Which sections at SUMMARY level (helpful context but not the focus)?
3. Which specific paragraphs do you need to see in full?
4. What connections are relevant (e.g., "connections involving P3")?
5. Is there anything you need that isn't listed above?

Be specific. Request only what will actually inform your investigation.
Unnecessary context wastes tokens and dilutes focus.
```

### Reading Strategy Integration in Existing Rules

For existing 13 routing rules that don't use `DeclaredContextRequest`, the Reading Strategy can still influence ordering:

```typescript
// In assembleContext() after the rule-specific assembly:
if (request.readingStrategy) {
  this.applyReadingStrategyOrdering(sections, request.readingStrategy);
}
```

This is a lightweight enhancement: the existing rule determines WHAT sections to include, the Reading Strategy influences their ORDER. No behavioral change, just framing optimization.

---

## Integration Points

### Connection to Improvement #7 (Growth Cycle)

The growth cycle creates the primary demand for `assembleDeclared()`:
- Each L3.75 iteration needs different context (broad early, narrow late)
- Each deep dive prompt has specific context needs from its `requiredContext` list
- Each re-read needs the full essay text + complete understanding + reading strategy
- The Reading Strategy (produced by L3.75) feeds back into the router for subsequent calls

### Connection to Deep Dive Prompt Library

Each deep dive prompt template declares its context needs:

```typescript
const DEEP_DIVE_PROMPTS = {
  voice_authenticity: {
    focus: '...',
    requiredContext: ['essayText', 'voiceMap', 'voiceIdentity'],
    desiredContext: ['emotionalTopography', 'connections'],
    typicalCost: 0.03,
  },
  // ...
};
```

The router translates these into `DeclaredContextRequest` objects:

```typescript
function buildDeepDiveContextRequest(
  promptTemplate: DeepDivePromptTemplate,
  readingStrategy: ReadingStrategy,
  targetScope?: { paragraphs?: number[]; sentences?: number[] },
): DeclaredContextRequest {
  return {
    purpose: `deep_dive:${promptTemplate.name}`,
    required: promptTemplate.requiredContext.map(section => ({
      section,
      presentation: 'full' as const,
    })),
    desired: [
      ...(promptTemplate.desiredContext ?? []).map(section => ({
        section,
        presentation: 'summary' as const,
      })),
      ...(targetScope?.paragraphs ?? []).map(p => ({
        section: `paragraph:${p}`,
        presentation: 'full' as const,
      })),
    ],
    tokenBudget: 4000,
    readingStrategy,
  };
}
```

### Connection to Coaching (L6)

Coaching already works through the existing 13 rules. The Reading Strategy enhancement (ordering) improves coaching quality without changing the interface.

---

## Implementation Sequence

### Step 1: Types and `DeclaredContextRequest` Interface (0.5 day)
- Add `DeclaredContextRequest`, `ContextSectionSpec`, `ContextRelevanceEntry`, `ContextRelevanceTracker` to `profileTypes.ts` or a dedicated `routerTypes.ts`
- Implement `InMemoryRelevanceTracker` (simple Map-based storage)
- Tests: unit tests for type construction and tracker accumulation

### Step 2: `assembleDeclared()` Method (1-2 days)
- Add `assembleDeclared()` to `ProfileRouter` alongside existing `assembleContext()`
- Implement `resolveSection()` with all section spec patterns (named, paragraph-scoped, sentence-scoped, connection-scoped, all-paragraphs, essay-text)
- Implement `summarizeSection()` for compression
- Tests: unit tests for each section spec pattern against a mock profile

### Step 3: Reading Strategy Ordering (0.5 day)
- Implement `applyReadingStrategyOrdering()` in `ProfileRouter`
- Wire it into both `assembleContext()` (existing rules, optional) and `assembleDeclared()` (new consumers, always)
- Tests: verify ordering changes with different strategy texts

### Step 4: Token Budget with Compression (1 day)
- Implement `applyTokenBudgetWithCompression()` in `ProfileRouter`
- Implement `compressSection()` with section-specific summarization strategies
- Tests: verify progressive compression (nice_to_have first, then proximity, etc.)
- Tests: verify sections are summarized before dropped

### Step 5: Remove `ESSAY_TYPE_WEIGHTS` and `computeDynamicBudget()` (0.5 day)
- Remove any `ESSAY_TYPE_WEIGHTS` constant or mapping
- Remove `computeDynamicBudget()` if present
- Replace any callers with direct token budget specification or Reading Strategy integration
- Tests: verify no regression in existing routing rules (they use `DEFAULT_TOKEN_BUDGET`)

### Step 6: Context Relevance Tracking Integration (1 day)
- Wire `recordAssembly()` calls into both `assembleContext()` and `assembleDeclared()`
- Implement lightweight output scanning for `recordUsage()` (paragraph/sentence reference detection)
- Add `getContextDiagnostics()` endpoint for debugging
- Tests: integration test that runs a full pipeline and checks diagnostic output

### Step 7: Deep Dive Context Request Builder (0.5 day)
- Implement `buildDeepDiveContextRequest()` that translates prompt template `requiredContext` into `DeclaredContextRequest`
- Wire into the deep dive runner from Improvement #7
- Tests: verify context assembly for 3 different deep dive prompt types

### Step 8: Growth Cycle Context Adaptation (1 day)
- Build the iteration-aware context request constructor for L3.75 synthesis iterations
- Iteration 0: broad context (full paragraphs, all sections)
- Iteration 1+: narrow context (previous synthesis + new findings + changed areas)
- Wire into the growth cycle from Improvement #7
- Tests: verify context shrinks across iterations

**Total: 5-7 days**

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/services/essayIntelligence/profileManager/profileRouter.ts` | MAJOR MODIFY | Add `assembleDeclared()`, `resolveSection()`, `applyReadingStrategyOrdering()`, `applyTokenBudgetWithCompression()`, `compressSection()`, `summarizeSection()`, `ContextRelevanceTracker` integration. Existing 13 rules UNCHANGED. |
| `src/services/essayIntelligence/profileManager/routerTypes.ts` | NEW | `DeclaredContextRequest`, `ContextSectionSpec`, `ContextRelevanceEntry`, `ContextRelevanceTracker`, `InMemoryRelevanceTracker` |
| `src/services/essayIntelligence/profileTypes.ts` | MODIFY | Add `ReadingStrategy` type (if not already added by Improvement #7) |
| `src/services/essayIntelligence/analysis/deepDiveRunner.ts` | MODIFY (from #7) | Add `buildDeepDiveContextRequest()` that uses `assembleDeclared()` |
| `src/services/essayIntelligence/analysis/holisticSynthesis.ts` | MODIFY (from #7) | Use `assembleDeclared()` for iteration-aware context in growth cycle |
| `tests/test-router-declared.ts` | NEW | Unit tests for `assembleDeclared()` with mock profiles |
| `tests/test-router-compression.ts` | NEW | Tests for progressive compression and ordering |
| `tests/test-context-diagnostics.ts` | NEW | Integration test for relevance tracking |
