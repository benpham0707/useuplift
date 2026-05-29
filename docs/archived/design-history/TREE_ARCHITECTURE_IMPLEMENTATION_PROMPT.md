# Implementation Prompt: Tree-Based Progressive Deepening Architecture

> **Paste this into a fresh Opus 4.6 Claude Code session on branch `refactor/scoring-decomposition-step3`.**
> This is a major architectural evolution of the Essay Intelligence system.

---

## THE PROBLEM

The current essay intelligence system produces WIDE but SHALLOW analysis. L3 generates ~18 observations per paragraph (129 total for a 7-paragraph essay), but most are flat `ObservationEntry` objects — a single string with a confidence score and one evidence quote. The same insight gets restated across `observedFunctions`, `inferredIntents`, and `narrativeContributions`. Subsequent layers (L3.75, L3.5) add NEW ANGLES but don't go DEEPER on existing observations. The result: a profile that looks comprehensive by volume but doesn't compound understanding.

**What we need instead**: A tree-structured insight system where each analysis pass discovers genuinely NEW things by building on what prior passes found. Many specialized prompts that go DEEP on specific analytical dimensions, dispatched by a routing system that knows what the essay needs and what the profile is still shallow on.

## THE ARCHITECTURE: Insight Trees + Specialized Analyzers + Smart Dispatch

### Core Concept: Insight Tree (replaces flat ObservationEntry arrays)

Instead of:
```typescript
// CURRENT: flat list, same shape for everything
observedFunctions: [
  { observation: "establishes constraint-possibility paradox", confidence: 0.85, evidence: "..." },
  { observation: "establishes constraint-possibility paradox (but framed as intent)", confidence: 0.82, evidence: "..." },
  { observation: "establishes constraint-possibility paradox (but framed as narrative)", confidence: 0.80, evidence: "..." },
]
```

We want:
```typescript
// NEW: tree that deepens
{
  id: "ins_p0s1_constraint_paradox",
  claim: "P0S1 establishes a constraint-possibility paradox ('just seven notes' → infinite melodies)",
  evidence: [
    { text: "With just seven notes, I could weave melodies", location: { p: 0, s: 1 }, type: "direct_quote" },
    { text: "innovate within rhythm and harmony's constraints", location: { p: 0, s: 2 }, type: "supporting" }
  ],
  maturity: "confirmed",  // seedling → developing → confirmed → deepened
  coachingValue: "high",  // how useful is this for teaching the student

  children: [
    {
      id: "ins_p0s1_paradox_unearned",
      claim: "The paradox is STATED but never TESTED — no moment where constraint felt limiting before becoming generative",
      derivedFrom: ["ins_p0s1_constraint_paradox"],
      evidence: [
        { text: "From the moment my fingers first danced", location: { p: 0, s: 0 }, type: "absence_evidence",
          note: "'From the moment' frames it as always-known, never discovered" }
      ],
      maturity: "confirmed",
      coachingValue: "critical",  // this is WHERE the coaching intervention should focus
      discoveredBy: "earning_mechanism_tracer",  // which specialized analyzer found this

      children: [
        {
          id: "ins_p0s1_paradox_fix_opportunity",
          claim: "The Chopin-jazz fusion in P3 ('favorite endeavor') is the student's best candidate for a SCENE where constraint became generative — but it's compressed into 2 summary sentences instead of being shown",
          derivedFrom: ["ins_p0s1_paradox_unearned", "ins_p2s1_chopin_fusion"],
          evidence: [
            { text: "Inspired by Chopin's Nocturnes, I blended them with contemporary jazz rhythms", location: { p: 2, s: 1 }, type: "direct_quote" },
          ],
          implications: {
            forCoaching: "Ask: 'What specific moment in the Chopin fusion made you realize constraint was generative? What were you trying to do, what constraint were you working within, and what happened?'",
            forArchitecture: "If P3 expands into a scene, P1's paradox claim becomes earned retroactively — the scene in P3 provides the sensory grounding P1 needs",
            connectsTo: ["ins_p0s0_opening_weakness", "ins_p3_structural_role"]
          },
          maturity: "developing",
          coachingValue: "critical",
          discoveredBy: "gap_finder"
        }
      ]
    },
    {
      id: "ins_p0s1_paradox_arc",
      claim: "The paradox evolves across the essay: stated philosophically (P0) → demonstrated in practice (P2 chord progressions) → extended to new domain (P4 coding) → but never complicated or tested",
      derivedFrom: ["ins_p0s1_constraint_paradox"],
      evidence: [...],  // multiple locations traced
      maturity: "confirmed",
      discoveredBy: "connection_cartographer"
    }
  ]
}
```

**Key properties of the tree**:
- **Insights have children** that go deeper (WHY is this true? WHAT does it mean? WHERE is the coaching opportunity?)
- **`derivedFrom`** creates explicit parent→child reasoning chains
- **`discoveredBy`** tracks which specialized analyzer found each insight
- **`maturity`** evolves: seedling (first noticed) → developing (evidence accumulating) → confirmed (well-grounded) → deepened (child insights exist) → superseded (replaced by better understanding)
- **`coachingValue`** prioritizes what matters for the student (not just what's analytically interesting)
- **`implications`** has structured sub-fields: forCoaching, forArchitecture, connectsTo
- **Cross-references** (`connectsTo`, `derivedFrom`) create a graph, not just a tree

### Specialized Analyzer Registry

Instead of one mega-prompt that tries to understand everything about a sentence, we have ~12-15 focused analyzers that each go DEEP on one dimension. The dispatch system decides which ones to run based on what the essay needs and what the profile is still shallow on.

**Design each analyzer as a separate file in `src/services/essayIntelligence/analyzers/`.**

Here are the analyzers to implement. Each one:
- Has its own system prompt optimized for its specific analytical lens
- Receives the full insight tree + essay text as context
- Outputs new insights (with `derivedFrom` linking to existing insights it's deepening)
- Uses Haiku or Sonnet depending on complexity (marked below)

#### Tier 1: Always Run (first pass, broad sweep)

1. **`initialSweep.ts`** (Sonnet) — Replaces current L3. Single pass that identifies the essay's 8-15 ROOT insights. These are the trunk of the tree. NOT 129 observations — just the 8-15 genuinely distinct things this essay IS DOING. Each root insight should be:
   - A unique claim about what the essay does or means
   - Grounded in specific text
   - Tagged with which dimensions it touches (voice, theme, narrative, etc.)
   - Flagged with `maturity: "seedling"` — intentionally shallow, waiting to be deepened

2. **`structuralMapper.ts`** (Sonnet) — Replaces L2. Maps the essay's architecture: what is each paragraph's JOB? How do they relate? Where are the load-bearing vs supporting structures? Output: structural role insights for each paragraph, arc type, pacing analysis.

#### Tier 2: Dispatched Based on Essay Needs

3. **`earningMechanismTracer.ts`** (Sonnet) — For each emotional/intellectual claim in the essay, traces BACKWARD: what earlier content earned this moment? What mechanisms were used? Where are the gaps? This is the current L3.75 earned-ness concept but run as a dedicated analyzer that goes MUCH deeper — not just "mechanism present/absent" but "here's what the student would need to ADD and WHERE to make this moment land."

4. **`specificityGradient.ts`** (Haiku) — Fast pass that maps concrete vs abstract language density per sentence. Outputs a heatmap: which sentences are grounded in sensory/specific detail vs floating in abstraction. Flags the abstract-to-concrete ratio. This is diagnostic — it feeds other analyzers (e.g., earningMechanismTracer knows WHERE the abstraction problems are).

5. **`sceneVsSummary.ts`** (Haiku) — Detects whether each passage is SCENE (reader experiences moment in real-time) or SUMMARY (narrator tells reader what happened). Target ratio: 60-70% scene for excellent essays. Flags passages where scene would dramatically improve impact. Fast, diagnostic.

6. **`voiceArchaeologist.ts`** (Sonnet) — Deep voice analysis. NOT "the voice is analytical-reflective" (that's surface). Instead: What does the voice REVEAL about the writer that the content doesn't? Where does the voice drift unintentionally? Where is the writer performing a voice vs being authentic? What would the voice sound like if the writer trusted the reader more? This is the deep voice work the current VoiceMap attempts but doesn't achieve because it's one section of a 10-section synthesis.

7. **`identityExcavator.ts`** (Sonnet) — WHO is this student behind the writing? What values, thinking patterns, and ways of relating to the world emerge from the essay's choices (not just its claims)? What does the essay reveal that the student probably doesn't realize they're revealing? What's MISSING from the identity portrait that an AO would want to see? This is the deepest, most insight-dense analyzer — it reads between the lines.

8. **`connectionCartographer.ts`** (Sonnet) — Maps ALL relationships between passages: echoes, callbacks, contradictions, developments, fulfillments, broken promises. Not just "P1 and P4 are connected" but "P1 promises X, P4 partially delivers X but drops the relational dimension, P6 attempts to recover it through metaphor but too late." Produces the essay's relationship graph.

9. **`admissionsLens.ts`** (Sonnet) — How does an AO at 4pm read this essay? What do they remember 5 minutes later? What makes them lean in vs check out? What red flags would they notice? What do they wish the essay had shown? This is external perspective — not what the essay IS but what it DOES TO a reader.

10. **`craftMicroscope.ts`** (Sonnet) — Word-level and sentence-level craft analysis. Rhythm patterns, image systems, syntactic variety, verb strength, redundant constructions, precise language vs filler. Only dispatched when improvement phase is Craft/Polish/Distinction. Not useful at Foundation/Architecture phases.

11. **`gapFinder.ts`** (Sonnet) — The most valuable analyzer for coaching. Reads the full insight tree and asks: What's MISSING from this essay that should be here? Where are the unrealized connections? Where does the essay promise something it never delivers? Where could one added scene/detail/moment transform the architecture? Outputs specific, actionable coaching opportunities ranked by impact.

12. **`redundancyDetector.ts`** (Haiku) — Fast pass that identifies where the essay says the same thing in different words. Maps information repetition across paragraphs. Flags passages where the essay is "spinning" (filling space with restated ideas). Diagnostic — feeds into structural advice.

13. **`stakesAnalyzer.ts`** (Sonnet) — Where are the stakes in this essay? What does the student stand to gain/lose/learn? Are the stakes earned or asserted? Are they personal/specific or generic ("make a meaningful difference")? This is the "so what?" analyzer — it asks why the reader should care.

14. **`tensionMapper.ts`** (Haiku) — Maps the essay's tension curve: where does interest rise/fall? Where are the turns, surprises, complications? Is there genuine tension or is the essay monotonically positive? Fast diagnostic that identifies where the essay flatlines.

#### Tier 3: Deep Dives (dispatched for specific insights)

15. **`insightDeepener.ts`** (Sonnet) — Generic deepening prompt. Takes a SPECIFIC existing insight and asks: What does this really mean? What are the second-order implications? What would a great coach say about this? How does this connect to other insights we haven't linked yet? Used when the dispatch system identifies a high-value seedling insight that needs deepening but no specialized analyzer covers it.

### The Dispatch System

This is the BRAIN of the new architecture. It lives in `src/services/essayIntelligence/dispatch/insightDispatcher.ts`.

**After each analysis pass, the dispatcher**:
1. Reads the current insight tree
2. Assesses coverage: which dimensions are deep vs shallow?
3. Identifies the highest-value gaps: what would most improve coaching if we understood it better?
4. Selects 2-5 specialized analyzers to run next
5. Assembles context for each (full tree + essay + specific investigation brief)
6. Collects results and integrates them into the tree
7. Repeats until: (a) budget exhausted, (b) diminishing returns detected, (c) all dimensions at target depth

**Dispatch decision factors**:
- **Essay needs**: A generic template essay needs identityExcavator + gapFinder. An essay with strong voice but weak structure needs connectionCartographer + structuralMapper deeper pass.
- **Phase awareness**: Foundation phase → structural/gap/earning analyzers. Craft phase → craftMicroscope + voiceArchaeologist.
- **Insight maturity**: If most insights are still "seedling", run broad analyzers. If most are "confirmed", run deep analyzers.
- **Coaching value**: Prioritize analyzers whose insights will most help the student improve.
- **Budget**: Each analyzer has a cost estimate. Dispatcher manages total budget (e.g., $1.50 max for initial analysis).
- **Diminishing returns**: If an analyzer's last run produced mostly "already known" insights, don't re-run it.

**Dispatch heuristics** (implement as a scoring function, not hardcoded rules):

```typescript
interface AnalyzerCandidate {
  analyzer: string;
  priority: number;      // computed score
  reason: string;        // why this analyzer would be valuable now
  estimatedCost: number;
  prerequisites: string[]; // which analyzers must have run first
}

function selectAnalyzers(
  tree: InsightTree,
  phase: ImprovementPhase,
  budget: number,
  history: AnalyzerRun[]  // what's already been run
): AnalyzerCandidate[]
```

The dispatcher should use a SIMPLE scoring model, not an LLM call. Score each analyzer based on:
- Does the tree have gaps in this analyzer's domain? (+weight)
- Has this analyzer already run? (-weight, unless new insights invalidated prior results)
- Is this analyzer relevant to current improvement phase? (+weight)
- How many seedling insights exist in this domain? (+weight per seedling)
- How many high-coachingValue insights lack children? (+weight)

### Integration with Current System

**What stays**:
- L1 (First Impressions) — still useful as fast sentence splitting + initial tags
- L2.5 (Connection Scout) — subsumed by connectionCartographer but can serve as fast pre-pass
- The profile manager, mutators, and checkpoint store — adapt to new tree structure
- The coaching service (L6) — reads from tree instead of flat profile
- The improvement phase system — drives dispatch decisions
- The focused analysis / reanalysis system — adapts to tree-based updates

**What changes**:
- L3 (Sequential Deep Walk) → `initialSweep.ts` — produces 8-15 root insights, not 129 flat observations
- L3.75 (Holistic Synthesis) → distributed across specialized analyzers (voice, earned-ness, etc.)
- L3.5 (Analysis Pass) → scoring happens PER-INSIGHT not per-sentence. Each insight gets a coachingValue assessment.
- L4 (Crystallizer) → North Star emerges from the tree structure itself (the highest-maturity, most-connected insights ARE the North Star)
- L5 (Deep Annotation) → reads tree, generates phase-aware feedback from insights with `coachingValue: "critical"`
- `profileTypes.ts` → major rewrite for tree-structured insights
- `profileRouter.ts` → adapts context assembly to tree traversal

**What's new**:
- `src/services/essayIntelligence/analyzers/` — 12-15 specialized analyzer files
- `src/services/essayIntelligence/dispatch/insightDispatcher.ts` — the dispatch brain
- `src/services/essayIntelligence/tree/` — insight tree data structure, traversal, serialization
- Updated `analysisOrchestrator.ts` — orchestrates dispatch loops instead of fixed pipeline

---

## YOUR TASK

### Phase 1: Design the Insight Tree Type System

1. Read the current types in `src/services/essayIntelligence/profileTypes.ts` (82KB). Understand every type, especially `EssayProfile`, `SentenceUnderstanding`, `ParagraphUnderstanding`, `ObservationEntry`, `MomentEarnednessMap`, `VoiceMap`, `Connection`, `EssayNorthStar`.

2. Read the current pipeline in `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` to understand data flow.

3. Read `PLAN.md` lines 1-200 for the architectural overview.

4. Design the new type system. Key types to define:

```typescript
// Core insight node
interface Insight {
  id: string;
  claim: string;
  evidence: TextEvidence[];
  maturity: InsightMaturity;
  coachingValue: CoachingValue;
  dimensions: HolisticDimension[];  // which dimensions this touches
  location: InsightLocation;         // essay-level, paragraph-level, sentence-level, or cross-paragraph
  derivedFrom: string[];             // parent insight IDs
  connectsTo: string[];              // lateral connections to other insights
  supersedes: string[];              // insights this replaces
  discoveredBy: string;              // analyzer name
  discoveredAt: number;              // timestamp or pass number
  implications: InsightImplications;
  children: string[];                // child insight IDs (tree structure)
}

interface TextEvidence {
  text: string;
  location: { paragraph: number; sentence?: number };
  type: 'direct_quote' | 'pattern' | 'absence_evidence' | 'structural' | 'supporting';
  note?: string;  // interpretation of this evidence
}

type InsightMaturity = 'seedling' | 'developing' | 'confirmed' | 'deepened' | 'superseded';
type CoachingValue = 'critical' | 'high' | 'medium' | 'low' | 'diagnostic';  // diagnostic = useful for analysis, not directly for student

interface InsightImplications {
  forCoaching?: string;      // what this means for teaching the student
  forArchitecture?: string;  // what this means for essay structure
  forRevision?: string;      // specific revision suggestion
}

interface InsightLocation {
  scope: 'essay' | 'paragraph' | 'sentence' | 'cross_paragraph';
  paragraphs?: number[];
  sentences?: Array<{ paragraph: number; sentence: number }>;
}

// The tree itself
interface InsightTree {
  essayId: string;
  roots: string[];           // IDs of root-level insights
  insights: Map<string, Insight>;  // all insights by ID
  analyzerHistory: AnalyzerRun[];  // what's been run
  coverage: DimensionCoverage;     // how deep each dimension has been explored
  metadata: TreeMetadata;
}

interface DimensionCoverage {
  [dimension: string]: {
    depth: 'unexplored' | 'scouted' | 'analyzed' | 'deep' | 'exhaustive';
    insightCount: number;
    lastAnalyzedBy: string;
    lastAnalyzedAt: number;
  };
}

interface AnalyzerRun {
  analyzer: string;
  timestamp: number;
  cost: number;
  insightsProduced: number;
  insightsDeepened: number;  // existing insights that gained children
  newInsightIds: string[];
}
```

5. Write these types to `src/services/essayIntelligence/tree/treeTypes.ts`. Make sure they're clean, well-documented, and don't conflict with existing types.

6. Write tree utility functions to `src/services/essayIntelligence/tree/treeOperations.ts`:
   - `createTree(essayId)` — empty tree
   - `addInsight(tree, insight, parentId?)` — add insight, optionally as child
   - `deepenInsight(tree, insightId, childInsights)` — add children to existing insight
   - `supersede(tree, oldInsightId, newInsight)` — mark old as superseded, add replacement
   - `getInsightsByDimension(tree, dimension)` — filter by dimension
   - `getInsightsByMaturity(tree, maturity)` — filter by maturity
   - `getCoachableInsights(tree)` — insights with high/critical coaching value, sorted by value
   - `getInsightDepth(tree, insightId)` — how many levels deep (root = 0)
   - `serializeForPrompt(tree, scope?)` — serialize tree into text format optimized for LLM consumption
   - `getCoverage(tree)` — compute dimension coverage

### Phase 2: Implement the Initial Sweep Analyzer

Replace the current L3 (Sequential Deep Walk) with `initialSweep.ts`. This is the most important analyzer because it creates the root insights that everything else builds on.

**Key differences from current L3**:
- Produces 8-15 ROOT insights, not 129 flat observations
- Each insight is a UNIQUE claim — no restating the same thing across multiple fields
- Insights are tagged with dimensions and coaching value
- Insights are intentionally SHALLOW (maturity: "seedling") — they're starting points for deeper investigation
- Still walks paragraph-by-paragraph for sequential understanding, but the OUTPUT is consolidated into distinct insights

**The prompt should instruct the LLM**:
- "Identify the 8-15 genuinely DISTINCT things this essay does. Not 15 variations of 'uses metaphor' — 8-15 separate claims about what makes this essay THIS essay."
- "For each insight: What's the claim? What text proves it? Which dimensions does it touch? How valuable would it be for coaching?"
- "Flag insights that are SEEDS for deeper investigation: 'This paradox is stated but I'd need to trace whether it's earned' → maturity: seedling, suggests: earningMechanismTracer"
- "Do NOT evaluate. Do NOT say 'effective' or 'weak'. Describe what the essay IS and what it DOES."

Create the file at `src/services/essayIntelligence/analyzers/initialSweep.ts`.

### Phase 3: Implement 3-4 Core Specialized Analyzers

Implement these four analyzers that cover the most critical dimensions:

1. **`earningMechanismTracer.ts`** — Takes seedling insights about emotional/intellectual claims and traces backward. For each claim: what earned it? What's missing? Where's the coaching opportunity? Output: child insights under the parent claim, with specific text evidence and revision suggestions.

2. **`gapFinder.ts`** — Reads the full tree and asks: What's MISSING? Where are broken promises? Where could one added element transform the essay? Output: new root-level insights about gaps, each with implications.forRevision.

3. **`specificityGradient.ts`** (Haiku) — Fast diagnostic pass. Maps concrete vs abstract per sentence. Output: diagnostic insights about abstraction patterns, feeding other analyzers.

4. **`voiceArchaeologist.ts`** — Deep voice analysis. Not "the voice is X" but "the voice REVEALS Y about the writer that the content doesn't say." Where is the voice authentic vs performed? Output: deep insights about identity and authenticity.

Create each at `src/services/essayIntelligence/analyzers/{name}.ts`.

### Phase 4: Implement the Dispatch System

Create `src/services/essayIntelligence/dispatch/insightDispatcher.ts`.

The dispatcher:
1. Receives: current InsightTree, essay text, improvement phase, budget remaining, analyzer history
2. Scores each available analyzer on relevance (see scoring function above)
3. Selects top 2-5 analyzers within budget
4. Runs them (parallel where possible, sequential where one depends on another's output)
5. Integrates results into the tree
6. Returns updated tree + cost + what was run

**Important**: The dispatcher should be PURE LOGIC (no LLM call). It's a scoring function that looks at tree coverage, insight maturity distribution, phase, and budget. Simple, fast, deterministic.

### Phase 5: Implement the Orchestrator

Update `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` (or create a new `treeOrchestrator.ts`) to:

1. Run L1 (keep current first impressions for sentence splitting)
2. Run initialSweep → creates root insights
3. Run dispatch loop:
   - Dispatcher selects analyzers
   - Run analyzers
   - Integrate results
   - Check: budget exhausted? diminishing returns? all dimensions at target depth?
   - If not, loop
4. Compute improvement phase from tree (replace current threshold-based computation)
5. Return InsightTree + metadata

### Phase 6: Adapt Downstream Consumers

Update these to read from InsightTree instead of flat EssayProfile:

1. **L5 (deepAnnotationService.ts)** — Generate annotations from insights with `coachingValue: "critical"` or `"high"`. Each annotation should reference the insight chain: "This matters because [root insight] → [child insight] → [coaching opportunity]."

2. **L6 (coachingService.ts)** — Build coaching context from tree traversal. When student asks about P3, find all insights touching P3 and their children. When student offers reinterpretation, check if it contradicts or extends existing insights.

3. **Profile serialization** — `serializeForPrompt()` should produce a compact, LLM-friendly text format. NOT raw JSON — a structured markdown-like format that an LLM can quickly parse:

```
## ROOT INSIGHTS (8)

[R1] CONSTRAINT-POSSIBILITY PARADOX (voice, theme) [confirmed, critical]
  Claim: Essay's central framework — creativity operates within limits
  Evidence: "just seven notes" (P0S1), "constraints" (P0S2), "logic layered with creativity" (P3S1)

  [R1.1] PARADOX IS STATED NOT TESTED (earning) [confirmed, critical]
    The paradox is claimed as always-known, never discovered through experience
    Gap: No scene where constraint felt limiting before becoming generative
    → Coaching: Ask about the Chopin fusion moment — that's where the scene lives

    [R1.1.1] CHOPIN FUSION IS THE FIX (gap, revision) [developing, critical]
      P3's "favorite endeavor" is compressed into 2 summary sentences
      If expanded into a scene, P1's paradox claim becomes earned retroactively

[R2] ABSTRACTION ESCALATION (craft, voice) [confirmed, high]
  Essay moves from kinesthetic (P0 "fingers danced") → conceptual (P2 "puzzle")
  → pure abstract (P5-P6 methodology) → aspirational (P7 "limitless")
  ...
```

This format is:
- Hierarchical (indentation shows depth)
- Tagged (dimensions, maturity, coaching value in brackets)
- Compact (one line per key fact)
- Actionable (coaching implications inline)
- Cross-referenced (IDs for lateral connections)

### Phase 7: Write a Test

Create `tests/test-tree-analysis.ts` that:
1. Runs the new tree-based pipeline on the piano essay
2. Outputs the full insight tree in human-readable format
3. Outputs statistics: root count, total insights, max depth, dimension coverage, cost
4. Compares: fewer total insights than current L3 (target: 30-50 vs 129) but each one is deeper and more actionable
5. Verifies: every insight has evidence, every child has derivedFrom, no orphan insights

Run it: `ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-tree-analysis.ts`

---

## WHAT "EXCELLENT" LOOKS LIKE

For the piano essay, the tree should look like this after 2-3 dispatch passes:

**Pass 1 (initialSweep)**: 8-10 root insights
- Constraint-possibility paradox (the essay's central framework)
- Music-to-coding bridge (structural pivot at P4)
- Abstraction escalation (concrete→abstract across essay)
- AI DJ as synthesis artifact (only concrete tech project)
- Identity gap (essay is about activities, not about the person)
- Unearned closing (P7 claims impact without evidence)
- Template language patterns (opening cliche, generic claims)
- Relational dimension gap (P1 promises connection, never delivered)

**Pass 2 (dispatcher selects: earningMechanismTracer + gapFinder + specificityGradient)**:
- Each root insight gets 1-3 children
- earningMechanismTracer: traces backward from "reaffirmed my belief" → finds only 1 earning mechanism (users smile) → identifies 3 missing mechanisms
- gapFinder: identifies that P3's Chopin fusion could be the essay's best scene but is compressed into summary → coaching opportunity
- specificityGradient: maps exactly which sentences are abstract vs concrete → feeds coaching with precision

**Pass 3 (dispatcher selects: voiceArchaeologist + identityExcavator)**:
- voiceArchaeologist: discovers that the voice is most authentic in P2S2 ("spent hours experimenting, fascinated by how minor adjustments transformed") — the ONLY sentence where the student sounds like themselves rather than performing. Coaching implication: "Write more like P2S2."
- identityExcavator: surfaces that the essay reveals someone who intellectualizes experience rather than inhabiting it. The student THINKS about music rather than PLAYING it. This is the root cause of the abstraction problem — not a craft issue but an identity orientation.

**Total**: ~35-50 insights with max depth 3-4. Compare to current: 129 flat observations with depth 0.

---

## FILES YOU'LL BE READING

| File | Purpose | Size |
|------|---------|------|
| `src/services/essayIntelligence/profileTypes.ts` | Current type definitions — understand before redesigning | 82KB |
| `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` | Current L3 — understand what to replace | 69KB |
| `src/services/essayIntelligence/analysis/holisticSynthesis.ts` | Current L3.75 — capabilities to distribute | 61KB |
| `src/services/essayIntelligence/analysis/analysisPass.ts` | Current L3.5 — scoring approach | 53KB |
| `src/services/essayIntelligence/analysis/crystallizer.ts` | Current L4 — North Star emergence | 955 lines |
| `src/services/essayIntelligence/analysis/deepAnnotationService.ts` | L5 — read, will adapt later | 53KB |
| `src/services/essayIntelligence/coaching/coachingService.ts` | L6 — read, will adapt later | 93KB |
| `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` | Pipeline coordinator — will modify | 796 lines |
| `src/services/essayIntelligence/profileManager/profileRouter.ts` | Context assembly — will adapt | 62KB |
| `src/services/essayIntelligence/profileManager/essayProfileManager.ts` | Profile coordinator | medium |
| `PLAN.md` | Authoritative spec (lines 1-200 for overview) | 448KB |
| `tests/fixtures/piano-essay.txt` | Test essay | small |
| `tests/output/l3-depth-audit-output.json` | Current L3 output for comparison | 340KB |

## FILES YOU'LL BE WRITING

| File | Purpose |
|------|---------|
| `src/services/essayIntelligence/tree/treeTypes.ts` | New type system for insight trees |
| `src/services/essayIntelligence/tree/treeOperations.ts` | Tree manipulation utilities |
| `src/services/essayIntelligence/analyzers/initialSweep.ts` | Replaces L3 — produces root insights |
| `src/services/essayIntelligence/analyzers/earningMechanismTracer.ts` | Deep earned-ness analysis |
| `src/services/essayIntelligence/analyzers/gapFinder.ts` | Missing elements + coaching opportunities |
| `src/services/essayIntelligence/analyzers/specificityGradient.ts` | Concrete vs abstract diagnostic |
| `src/services/essayIntelligence/analyzers/voiceArchaeologist.ts` | Deep voice + authenticity analysis |
| `src/services/essayIntelligence/dispatch/insightDispatcher.ts` | Dispatch brain — selects analyzers |
| `src/services/essayIntelligence/analysis/treeOrchestrator.ts` | New orchestrator for tree pipeline |
| `tests/test-tree-analysis.ts` | Test script |

## CONSTRAINTS

- **TypeScript strict mode.** No `any` types.
- **Type check must pass**: `npx tsc --noEmit` after every phase.
- **Don't break existing pipeline.** The tree system should be a NEW path alongside the existing one, not a replacement that breaks current functionality. Both should be callable from `analysisOrchestrator.ts`.
- **Budget awareness.** Each analyzer tracks cost. The dispatcher manages total budget. Default budget: $1.50 for initial analysis (comparable to current full pipeline).
- **Evidence grounding.** Every insight must cite specific text. No insight without evidence.
- **No confidence scores.** Use `maturity` and `coachingValue` as categorical signals. No 0-1 numbers.
- **Prompt caching.** Use Anthropic prompt caching for system prompts and essay text. Each analyzer's system prompt should be structured for caching.
- **Model selection.** Diagnostic analyzers (specificityGradient, sceneVsSummary, redundancyDetector, tensionMapper) use **Haiku**. Deep analyzers (everything else) use **Sonnet**.

## IMPLEMENTATION ORDER

1. Tree types + operations (no LLM calls, pure types and utilities)
2. Initial sweep analyzer (the foundation — test it standalone)
3. 2-3 specialized analyzers (earningMechanismTracer + gapFinder + specificityGradient)
4. Dispatch system (scoring function + runner)
5. Tree orchestrator (wires everything together)
6. Test script (run on piano essay, compare to current output)
7. Downstream adaptation (L5, L6 — read from tree) — can be a follow-up chat

**Start with Phase 1 (types) and Phase 2 (initialSweep). Get those working and tested before building the dispatch system.** The initial sweep is the hardest part — getting 8-15 genuinely distinct, non-redundant root insights from a single pass. If the roots are good, everything else follows.
