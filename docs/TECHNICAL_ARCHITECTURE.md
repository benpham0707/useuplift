# Uplift Technical Architecture: Essay Intelligence V2 & Writing Workshop
### For Technical Co-Founder — Complete Service Layer Reference

> Last updated: March 2026 | System: ~57 files, 45K+ lines (Essay Intelligence) + ~55 files (Writing Workshop)

---

## Table of Contents

1. [System Overview — What These Two Systems Are](#1-system-overview)
2. [Essay Intelligence V2 — The Understanding Engine](#2-essay-intelligence-v2)
   - 2.1 [The 8-Layer Pipeline](#21-the-8-layer-pipeline)
   - 2.2 [The Growth Engine (PLAN2 Revolution)](#22-the-growth-engine)
   - 2.3 [Profile Manager & State Coordination](#23-profile-manager--state-coordination)
   - 2.4 [ProfileRouter — Context Assembly](#24-profilerouter--context-assembly)
   - 2.5 [FindingStore — Append-Only Knowledge](#25-findingstore--append-only-knowledge)
   - 2.6 [ConnectionGraph — Cross-Paragraph Intelligence](#26-connectiongraph--cross-paragraph-intelligence)
   - 2.7 [Edit Handling & Incremental Re-Analysis](#27-edit-handling--incremental-re-analysis)
   - 2.8 [Coaching Service (L6)](#28-coaching-service-l6)
   - 2.9 [Version Tracking](#29-version-tracking)
3. [Enhanced Writing Workshop — The Editing Engine](#3-enhanced-writing-workshop)
   - 3.1 [Enhancement Orchestrator](#31-enhancement-orchestrator)
   - 3.2 [Annotation Pipeline](#32-annotation-pipeline)
   - 3.3 [Voice Profile Service](#33-voice-profile-service)
   - 3.4 [Inline Editor](#34-inline-editor)
   - 3.5 [Regression Guard](#35-regression-guard)
   - 3.6 [Session Context](#36-session-context)
   - 3.7 [Supporting Services](#37-supporting-services)
4. [How The Two Systems Connect](#4-how-the-two-systems-connect)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [Type System Reference](#6-type-system-reference)
7. [File Map](#7-file-map)
8. [Cost Model](#8-cost-model)

---

## 1. System Overview

These are Uplift's two core essay-facing systems. They serve different purposes but share infrastructure and feed each other data:

| | Essay Intelligence V2 | Enhanced Writing Workshop |
|---|---|---|
| **Purpose** | Deeply *understand* an essay, then *analyze* it, then *coach* from that understanding | *Edit* essay text with voice preservation, quality guarding, and improvement planning |
| **Core metaphor** | A great writing teacher reading carefully | A writing partner with a red pen and style guide |
| **Primary output** | EssayProfile (rich hierarchical understanding) | Edited text + quality snapshots + voice consistency |
| **LLM strategy** | Sequential depth (walk paragraph by paragraph, then grow via deep dives) | Targeted actions (apply one command, check regression, plan next) |
| **Persistence** | EssayProfile stored in Supabase JSONB (~200KB) | Sessions in-memory with write-behind; enhancement runs logged |
| **Cost per use** | $0.75–1.00 first analysis, $0.03–0.05 incremental | $0.06–0.15 per 3-step enhancement loop |
| **Path** | `src/services/essayIntelligence/` | `src/services/enhancedWorkshop/` + `src/pipeline/` + supporting services |

**Key architectural principle shared by both: no degraded fallbacks.** If Claude fails, return an error. Never return heuristic results pretending to be real analysis.

---

## 2. Essay Intelligence V2 — The Understanding Engine

### 2.1 The 8-Layer Pipeline

The pipeline's core insight: **separate understanding from judgment from feedback**. Three separate LLM calls with three separate prompts prevent evaluative contamination — the system understands WHAT IS before judging HOW WELL before prescribing WHAT TO DO.

```
Essay Text
    │
    ▼
╔══════════════════════════════════════════════════════════════════╗
║  PHASE 1: FOUNDATION                                            ║
║                                                                  ║
║  L1: First Impressions (Haiku, parallel per-paragraph, ~$0.02)  ║
║  ├─ Purely DESCRIPTIVE. No evaluation words allowed.             ║
║  ├─ Per-paragraph: purpose, emotional register, voice, craft     ║
║  ├─ Per-sentence: rhetorical function, tone, notable elements    ║
║  └─ Output: ParagraphFirstImpression[] + initial ProfileIndex    ║
║                                                                  ║
║  File: analysis/firstImpressions.ts (576 lines)                 ║
║  Model: claude-haiku-4-5-20251001 | Temp: 0.2 | Max: 2K/para   ║
╚══════════════════════════════════════════════════════════════════╝
    │
    ▼ (L2 and L2.5 run in PARALLEL — no dependency between them)
╔══════════════════════════════════════════════════════════════════╗
║  L2: Structural Cartography (Haiku, single call, ~$0.08)        ║
║  ├─ Paragraph roles (NOT topics — architectural function)        ║
║  ├─ Narrative arc type + confidence                              ║
║  │   (man_in_hole | cinderella | icarus | quest | rags_to_riches)║
║  ├─ Transition quality (seamless | functional | abrupt | missing)║
║  ├─ Central theme (tension, not topic), pacing, flat spots       ║
║  └─ Output: StructuralCartography                                ║
║                                                                  ║
║  File: analysis/structuralCartographer.ts                        ║
╠══════════════════════════════════════════════════════════════════╣
║  L2.5: Connection Scout (Haiku, single call, ~$0.02)            ║
║  ├─ "Metal detector" — finds leads, not conclusions              ║
║  ├─ Repeated elements (words/phrases/images that recur)          ║
║  ├─ Tonal shifts (where emotional register changes)              ║
║  ├─ Structural echoes (parallel constructions, mirrored openings)║
║  └─ Output: ConnectionScoutOutput                                ║
║                                                                  ║
║  File: analysis/scoutPass.ts                                     ║
╚══════════════════════════════════════════════════════════════════╝
    │
    ▼
╔══════════════════════════════════════════════════════════════════╗
║  PHASE 2: THE UNDERSTANDING WALK (THE CORE)                     ║
║                                                                  ║
║  L3: Sequential Deep Walk (Sonnet, sequential per-para, ~$0.40) ║
║  ├─ Walks P0 → P1 → ... → PN, one Sonnet call per paragraph    ║
║  ├─ Each call sees:                                              ║
║  │   ├─ Adjacent paragraphs: full understanding                  ║
║  │   ├─ Connected paragraphs: full (via ConnectionGraph)         ║
║  │   ├─ Earlier paragraphs: digests (via ProfileRouter)          ║
║  │   └─ System prompt: CACHED across all paragraph calls         ║
║  ├─ Produces per-paragraph:                                      ║
║  │   ├─ ParagraphUnderstanding (role, claim, emotion, voice)     ║
║  │   ├─ SentenceUnderstanding[] (function, significance, craft)  ║
║  │   ├─ Finding[] (1-5, at natural granularity)                  ║
║  │   ├─ holisticEvolution (4-field accumulator)                  ║
║  │   ├─ newConnections[] (cross-paragraph links discovered)      ║
║  │   └─ priorSentenceUpdates (back-propagation)                  ║
║  ├─ BACK-PROPAGATION: when P4 reveals something about P1,       ║
║  │   P1's understanding arrays are REPLACED (supersession rule)  ║
║  └─ Output: L3WalkResult                                        ║
║                                                                  ║
║  File: analysis/sequentialDeepWalk.ts (1,755 lines)             ║
║  Model: claude-sonnet-4-5-20250929 | Temp: 0.3 | Max: 4K/para  ║
╚══════════════════════════════════════════════════════════════════╝
    │
    ▼
╔══════════════════════════════════════════════════════════════════╗
║  PHASE 3: GROWTH CYCLE (PLAN2 REVOLUTION)                       ║
║  Orchestrated by growthEngine.ts — iterative depth expansion     ║
║                                                                  ║
║  ┌─── ITERATION LOOP (up to 8 iters, $0.60 budget ceiling) ───┐ ║
║  │                                                              │ ║
║  │  L3.75: Holistic Synthesis (Sonnet, ~$0.12/iter)            │ ║
║  │  ├─ 3-phase pipeline:                                        │ ║
║  │  │   Phase A+B (parallel): Voice+Emotion + Theme+Narrative  │ ║
║  │  │   Phase Meta: Cross-dimension entanglements              │ ║
║  │  ├─ Produces 10 holistic sections:                           │ ║
║  │  │   VoiceIdentity, VoiceMap, EmotionalTopography,          │ ║
║  │  │   MomentEarnednessMap, ThematicArchitecture,             │ ║
║  │  │   NarrativeStrategy, CharacterRevelation,                │ ║
║  │  │   CraftAssessment, AdmissionsPositioning,                │ ║
║  │  │   CrossDimensionEntanglements                            │ ║
║  │  ├─ QUESTION CURATION (critical new PLAN2 role):            │ ║
║  │  │   ├─ Resolves walk questions with full-context view      │ ║
║  │  │   ├─ Filters generic/rereading-answerable questions      │ ║
║  │  │   ├─ Raises new cross-essay questions                    │ ║
║  │  │   ├─ Maps each question → best deep dive prompt          │ ║
║  │  │   └─ Output: QuestionCurationOutput                      │ ║
║  │  ├─ READING STRATEGY: meta-understanding + routing signal   │ ║
║  │  │   (bestApproach, antiPatterns, contextPriorities[])      │ ║
║  │  ├─ RE-READ CANDIDATES: paragraphs whose meaning changes   │ ║
║  │  │   with full context (walk read them sequentially)        │ ║
║  │  └─ CONVERGENCE: self-assessed (primary), budget (backstop) │ ║
║  │                                                              │ ║
║  │  Deep Dive Dispatch (selectDeepDives algorithm):            │ ║
║  │  ├─ PRIMARY: L3.75's curated questions (quality-filtered)   │ ║
║  │  ├─ SECONDARY: dimension coverage gaps                      │ ║
║  │  ├─ TERTIARY: hypothesis findings needing evidence          │ ║
║  │  ├─ Diminishing returns check (raise score bar if low ROI)  │ ║
║  │  └─ Budget + diversity enforcement                          │ ║
║  │                                                              │ ║
║  │  Deep Dive Runner (deepDiveRunner.ts):                      │ ║
║  │  ├─ Executes targeted investigation via prompt library      │ ║
║  │  ├─ Returns: findings + answered questions + new questions  │ ║
║  │  └─ Fed back into FindingStore + QuestionQueueManager       │ ║
║  │                                                              │ ║
║  │  Full-Context Re-Reader (fullContextReReader.ts):           │ ║
║  │  ├─ Re-reads flagged paragraphs with complete understanding │ ║
║  │  └─ Walk read them without knowing how essay ends — now fix │ ║
║  │                                                              │ ║
║  │  → Check convergence → if converged or budget exhausted: ──┐│ ║
║  │  → else: next iteration ───────────────────────────────────┘│ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                  ║
║  Files: analysis/growthEngine.ts (267 lines)                    ║
║         analysis/holisticSynthesis.ts (2,835 lines)             ║
║         analysis/deepDiveRunner.ts (631 lines)                  ║
║         analysis/deepDivePromptLibrary.ts (1,008 lines)         ║
║         analysis/questionQueueManager.ts (225 lines)            ║
║         analysis/fullContextReReader.ts                         ║
╚══════════════════════════════════════════════════════════════════╝
    │
    ▼
╔══════════════════════════════════════════════════════════════════╗
║  PHASE 4: ANALYSIS PASS                                         ║
║                                                                  ║
║  L3.5: Analysis Pass (Sonnet, parallel per-paragraph, ~$0.25)   ║
║  ├─ NOW we judge. Sees complete understanding + holistic.        ║
║  ├─ Per-sentence: effectiveness (0-100), strengths, weaknesses  ║
║  ├─ Per-paragraph: effectiveness, structural role, revisions    ║
║  ├─ ImprovementPhase computed after all paragraphs:             ║
║  │   Foundation → Architecture → Craft → Polish → Distinction   ║
║  ├─ 3-block prompt caching:                                     ║
║  │   Block 1: system prompt + phase (CACHED)                    ║
║  │   Block 2: essay + profile + holistic (CACHED across calls)  ║
║  │   Block 3: paragraph-specific (not cached)                   ║
║  └─ Output: L35AnalysisResult + ImprovementPhase                ║
║                                                                  ║
║  Key separation: L3 = WHAT IS. L3.5 = HOW WELL.                ║
║  File: analysis/analysisPass.ts (1,397 lines)                   ║
╚══════════════════════════════════════════════════════════════════╝
    │
    ▼
╔══════════════════════════════════════════════════════════════════╗
║  PHASE 5: CRYSTALLIZATION                                        ║
║                                                                  ║
║  L4: Crystallizer (Sonnet, single call, ~$0.08)                 ║
║  ├─ EssayNorthStar (emergent, NOT lossy compression):           ║
║  │   ├─ 5 dims: intent, thesis, emotional core, narrative       ║
║  │   │   strategy, admissions positioning                        ║
║  │   ├─ Scaled by essay type:                                    ║
║  │   │   Supplement: 2 dims | PIQ: 3 | Personal Statement: 5   ║
║  │   └─ Confidence: hypothesis | emerging | full | confirmed    ║
║  ├─ ParagraphScoreMatrix:                                        ║
║  │   5 dims per paragraph (structure, rhetoric, emotion, craft,  ║
║  │   voice) + composite + verdict (anchor → restructure)         ║
║  ├─ CoherenceReport:                                             ║
║  │   Cross-domain contradiction detection (LLM + programmatic)  ║
║  │   blocking vs advisory contradictions                         ║
║  └─ Output: L4CrystallizationResult                             ║
║                                                                  ║
║  File: analysis/crystallizer.ts (1,697 lines)                   ║
╚══════════════════════════════════════════════════════════════════╝
    │
    ▼
╔══════════════════════════════════════════════════════════════════╗
║  PHASE 6: ANNOTATIONS (Ephemeral Feedback)                       ║
║                                                                  ║
║  L5: Deep Annotation (Sonnet, parallel per-para, ~$0.15)        ║
║  ├─ EPHEMERAL — generated fresh per context, NEVER stored        ║
║  ├─ Phase-aware zoom:                                            ║
║  │   Foundation: 3-5 essay-level structural issues               ║
║  │   Architecture: paragraph-level                               ║
║  │   Craft: sentence-level improvements                          ║
║  │   Polish: nuanced refinements                                 ║
║  │   Distinction: advanced techniques                            ║
║  ├─ Each annotation: observation + consequence (via North Star)  ║
║  │   + suggestion                                                ║
║  └─ Output: L5AnnotationResult (sent to user)                    ║
║                                                                  ║
║  File: analysis/deepAnnotationService.ts (1,765 lines)          ║
╚══════════════════════════════════════════════════════════════════╝
    │
    ▼
╔══════════════════════════════════════════════════════════════════╗
║  L6: Coaching Service (ongoing, per-conversation-turn)           ║
║  (Detailed in section 2.8)                                       ║
╚══════════════════════════════════════════════════════════════════╝
```

**Orchestrator**: `analysis/analysisOrchestrator.ts` (1,447 lines) — sequences all phases, manages fail-fast error handling, cost tracking, and checkpoint saves between phases.

---

### 2.2 The Growth Engine (PLAN2 Revolution)

This is the key innovation. The current system (pre-PLAN2) produces the same depth every time. PLAN2 introduced **question-driven iterative depth** — understanding that compounds across runs.

#### Philosophy: Understanding Hierarchy

The system aims for Level 3-5 understanding, not just Level 1-2:

| Level | Name | Example |
|-------|------|---------|
| 1 | Technique Identification | "This sentence uses concrete imagery." |
| 2 | Contextual Function | "The sensory registers construct a world organized around physical transactions." |
| 3 | Architectural Comprehension | "The clash between P1's epistemology (value = measurable) and P3's (value = inherited story) IS the essay's central tension." |
| 4 | Epistemological Insight | "The essay defines understanding as physical encounter. The grandmother's story doesn't just add information — it challenges the essay's entire way of knowing." |
| 5 | Meta-Awareness | "The essay unknowingly performs the very constraint it describes. The writer's voice is most authentic in concrete moments and most generic in philosophical ones." |
| 6 | Coaching Synthesis | "If the student could see that their essay PERFORMS its own thesis — the meta-awareness IS the essay's deepest insight, hiding in plain sight." |

#### Four Growth Mechanisms

**1. Question Queue** — Every growth step produces understanding + unanswered questions. Questions are PERSISTENT — they survive across runs, accumulate priority, and drive where the system invests next.

```typescript
interface UnderstandingQuestion {
  id: string;
  question: string;
  dimension: 'earned-ness' | 'voice' | 'epistemology' | 'structure' |
    'intent' | 'craft' | 'identity' | 'connection' | 'admissions' | 'meta';
  scope: { paragraph?, sentences?, crossParagraph?, essayLevel? };
  priority: 'critical' | 'high' | 'medium' | 'low';
  expectedYield: string;
  status: 'open' | 'partially_answered' | 'answered' | 'unanswerable';
  answer?: string;
  answeredBy?: 'walk' | 'deep_dive' | 'coaching' | 'edit_reanalysis';
  spawnedQuestions: string[];
  iterationsSurvived: number;  // auto-promotes stale questions
}
```

**2. Finding Maturity Tracking** — Findings evolve: `hypothesis → developing → confirmed → deepened → superseded`. The system sees where understanding is tentative and targets those areas.

**3. Coherence Checks** — After each growth step, check: does the understanding contradict itself? Contradictions are deepening opportunities, not errors.

**4. Diminishing Returns** — Track how much each step adds. Deep dives producing nothing new → that area is mature. Signal to stop investing.

#### Deep Dive Prompt Library (~20 Specialized Prompts)

Each prompt is a SPECIALIST — narrowly scoped, deeply focused. The dispatch system combines specialists based on what the essay actually needs.

**By domain:**

| Domain | Prompts | When Dispatched |
|--------|---------|-----------------|
| **Voice** | `voice_authenticity`, `vocabulary_domain_map`, `rhythm_meaning` | Walk notices register shifts or "essay-writing voice" vs natural voice |
| **Emotion** | `emotion_earning_trace`, `show_vs_tell_map`, `emotional_subtext` | Emotional claims feel unearned or the essay TELLS rather than SHOWS |
| **Theme** | `claim_earning_trace`, `epistemology`, `tension_excavation`, `subtext_reader` | Central claim stated not demonstrated, or deeper framework detected |
| **Narrative** | `scene_potential`, `structural_necessity`, `redundancy_vs_deepening` | Compressed scenes, structural bloat, or same idea restated |
| **Identity** | `intellectual_fingerprint`, `blind_spot_detection`, `values_revealed` | Enough text to see thinking patterns, or gap between declared/revealed values |
| **Craft** | `image_system_trace`, `word_precision` | Recurring image carries meaning, or generic language in key moments |
| **Admissions** | `ao_reading_simulation`, `distinctiveness_test` | Walk complete, need admissions context or interchangeability check |
| **Meta** | `intent_text_gap`, `form_content_alignment`, `finding_deepener`, `full_context_reread` | Coaching reveals intent divergence, form fights content, findings need evidence |

Each costs ~$0.03, runs in a single focused Sonnet call, and returns findings + answered questions + new questions.

#### Dispatch Algorithm

```
selectDeepDives(curatedQuestions, findings, dimensionState, rewardHistory, budget):

1. L3.75's curated questions (PRIMARY — already quality-filtered + prompt-matched)
2. Dimension coverage gaps (unexplored/noticed dimensions → default prompt)
3. Hypothesis findings needing evidence → finding_deepener
4. Diminishing returns check → raise min score bar if last 2 dives had low reward
5. Sort by score, enforce budget + diversity (avoid 2 dives from same domain)
6. Return 2-6 DeepDiveRequests
```

#### Growth Cycle State

```typescript
interface GrowthCycleState {
  iteration: number;          // current iteration (0-indexed)
  maxIterations: number;      // cap (default 8)
  budgetCeiling: number;      // $0.60
  budgetSpent: number;
  converged: boolean;
  activityLog: GrowthActivity[];  // what happened each step
}
```

Convergence: L3.75's `selfAssessedConvergence` (primary) + budget/iteration caps (backstop). Guard ensures at least 1 full iteration before trusting convergence claim.

---

### 2.3 Profile Manager & State Coordination

**File**: `profileManager/essayProfileManager.ts` (2,805 lines)

The `EssayProfileCoordinator` is a thin dispatch hub — it doesn't contain business logic, it routes mutations to domain-specific mutators and manages cross-domain staleness.

```typescript
class EssayProfileCoordinator {
  // Creation
  static createNew(config: { essayText, paragraphTexts, sentenceTexts,
    metadata: { essayType, wordCount, promptText? } }): EssayProfileCoordinator

  // Layer application (dispatch to mutators)
  applyFirstImpressions(impressions): void
  applyStructuralCartography(cartography): void
  applyScoutLeads(scoutOutput): void
  applyUnderstandingWalkStep(walkOutput): void
  applyHolisticSynthesis(synthesis): void
  applyAnalysisPassResult(analysis): void
  applyNorthStar(northStar): void
  applyScoreMatrix(scoreMatrix): void
  applyCoherenceReport(report): void
  updateImprovementPhase(phase): void

  // Mutation helpers
  addConnections(connections): { mutations, connectionIds }
  applySectionLevelSynthesis(partial): void
  applyInsight(insight): void
  addPatternInsight(pattern): void

  // State access
  getProfile(): Readonly<EssayProfile>
  getFindingStore(): FindingStore
}
```

**8 Domain Mutators** (each owns one slice of the profile):

| Mutator | Responsibility |
|---------|---------------|
| `SentenceMutator` | Sentence understanding/analysis, back-propagation, inferred intent updates |
| `ParagraphMutator` | Paragraph understanding/analysis, structural role, tags |
| `HolisticMutator` | All 7 holistic sections + entanglements (merge or supersession) |
| `ConnectionMutator` | Connection CRUD, referential integrity, duplicate detection |
| `VoiceMapMutator` | Voice shifts, intentionality assessment, code-switching |
| `EarnednessMutator` | Earning mechanism networks for significant moments |
| `NorthStarMutator` | 5-dimensional North Star updates |
| `InsightMutator` | Conversation insights, pattern insights |

**Cross-domain staleness**: `dependencyMap.ts` defines how edits propagate. Edit to sentence S → mark S.understanding as stale → mark connected paragraphs' analysis as stale → mark holistic sections if threshold crossed.

**Checkpointing**: Saves at 9 defined checkpoint boundaries (after each phase, before reanalysis, on circuit break). Pipeline is resumable from any checkpoint.

---

### 2.4 ProfileRouter — Context Assembly

**File**: `profileManager/profileRouter.ts` (2,910 lines)

Assembles precisely-scoped context for every LLM call in the system. This is the traffic controller — determines what profile data each prompt sees.

```typescript
class ProfileRouter {
  assembleContext(
    profile: Readonly<EssayProfile>,
    request: ContextRequest
  ): AssembledProfileContext
}
```

**16 Routing Rules** (each tailored to a specific pipeline stage):

| Rule | Used By | What It Includes |
|------|---------|------------------|
| `l3_understanding_walk` | L3 per-paragraph | ProfileIndex, holistic, scout leads, connected paras (full), proximity (full), earlier (digests) |
| `l3_5_analysis_pass` | L3.5 per-paragraph | ProfileIndex, full holistic, full understanding ALL paragraphs, connections |
| `l3_75_holistic_synthesis` | L3.75 synthesis | Essay-level holistic, findings summary, questions |
| `l3_75_synthesis_iteration` | L3.75 growth iters | Previous synthesis, evolved sections, persistent question queue |
| `l4_crystallization` | L4 | Full understanding, essay DNA sketch, connection graph |
| `l5_feedback_annotations` | L5 | North Star, improvement phase, prior annotations |
| `l6_coaching_voice` | L6 voice questions | VoiceIdentity, VoiceMap, emotionalTopography, craftAssessment |
| `l6_coaching_paragraph` | L6 paragraph focus | Paragraph understanding, connected sentences, voice/theme/structure |
| `l6_coaching_overview` | L6 overview | Holistic sections, NorthStar, paragraph digests |
| `inline_edit_sentence` | Inline editor | Sentence full, surrounding, connections, voice context |
| `reanalysis_comprehensive` | Full re-analysis | Staleness snapshot, affected paragraphs, connections |
| `focused_understanding` | Focused re-walk | Changed paragraph + connected, previous understanding |
| `focused_analysis` | Focused re-score | Sentence detail, paragraph analysis, connections |
| `impact_classification` | Edit triage | Changed section + context, prior scores |
| `deep_dive` | Growth engine | Full understanding, findings, question guidance |
| `full_context_reread` | Re-reader | Complete profile, reading strategy, connections |

**Connection-driven routing** (PRIMARY): Connection graph determines which paragraphs get full detail. Proximity is FALLBACK for unconnected neighbors.

**Token budgeting**: Per-rule base budgets (4K-14K) + density scaling (±4K) + hard cap (16K). Sections dropped if over budget, with dropped sections logged.

---

### 2.5 FindingStore — Append-Only Knowledge

**File**: `findings/findingStore.ts` (461 lines)

Findings are the structured, referenceable units that downstream systems use. They're **append-only** — never deleted, only superseded.

```typescript
interface Finding {
  id: string;                    // 'F1', 'F2', ...
  claim: string;                 // the insight itself
  scope: {
    type: 'word' | 'sentence' | 'sentence_group' | 'paragraph' | 'cross_paragraph' | 'essay_level';
    paragraph?, sentences?, paragraphs?;
    textEvidence: Array<{ text: string; location: { paragraph, sentence? } }>;
  };
  maturity: 'hypothesis' | 'developing' | 'confirmed' | 'deepened' | 'superseded';
  coachingValue: 'critical' | 'high' | 'medium' | 'contextual' | 'diagnostic';
  dimensions: HolisticDimension[];
  evidence: FindingEvidence[];
  source: 'walk' | 'deep_dive' | 'coaching' | 'edit_reanalysis' | 'coherence_check';
  buildsOn: string[];            // finding IDs (depth tree)
  relatedTo: string[];           // finding IDs (lateral connections)
  supersededBy?: string;
  deepeningPotential: string | null;
  raisesQuestions: string[];     // question IDs
  lineage: FindingLineageEntry[];  // every transition logged
}
```

**Maturity lifecycle**: `hypothesis(0) → developing(1) → confirmed(2) → deepened(3)`, with `superseded(-1)` branch. Backward jumps guarded. Every transition logged with trigger, reasoning, and timestamp.

**Key methods**: `add()`, `get()`, `getActive()` (filters superseded), `getByScope(paragraph)`, `getActiveSortedByCoachingValue()`, `updateMaturity()` (validates referential integrity, handles transitive supersession), `getSupersessionChain()`.

---

### 2.6 ConnectionGraph — Cross-Paragraph Intelligence

**File**: `connections/connectionGraph.ts` (415 lines)

Bidirectional graph tracking how parts of the essay relate to each other. Connections are NEVER deleted — invalidated with reason (rule: never discard paid output).

```typescript
interface Connection {
  id: string;
  from: ConnectionEndpoint;       // {paragraph, sentence?, label}
  to: ConnectionEndpoint;
  description: string;
  reverseIllumination?: string;   // what connection means in reverse direction
  significance: string;
  strengthCategory: 'foundational' | 'significant' | 'supporting' | 'tentative';
  routingTags: ConnectionRoutingTag[];  // structural | earning | thematic | contrastive
  discoveredBy: 'scout' | 'walk' | 'holistic_synthesis' | 'deep_dive' | 'coaching';
  status: 'active' | 'invalidated' | 'superseded';
  relatedFindings: string[];
}
```

Used by ProfileRouter as the PRIMARY signal for context assembly — connected paragraphs get full detail regardless of distance.

---

### 2.7 Edit Handling & Incremental Re-Analysis

When a student edits their essay, the system doesn't blindly re-run everything. It classifies the edit's impact and runs the minimum work needed.

#### Edit Classification

**File**: `analysis/editUnderstandingService.ts` (1,417 lines)

```
Student edits text
    │
    ▼
Step 0: Mechanical Diff (no LLM, <10ms)
  ├─ Paragraph alignment via text hashing
  ├─ Sentence alignment, word-level diff
  └─ Reorder detection
    │
    ▼
Step 1: Haiku Triviality Filter (~$0.001)
  └─ Binary TRIVIAL vs REAL gate (biased toward REAL)
    │
    ▼
Step 2-4: Sonnet Understanding (~$0.03)
  ├─ Significance: TRANSFORMATIVE | SIGNIFICANT | MODERATE | MINOR | TRIVIAL
  ├─ Change type: word_refinement | meaning_evolution | tonal_voice_shift |
  │   content_expansion | content_reduction | structural_reorganization
  ├─ Profile impact: direct, connection, paragraph, holistic impacts
  ├─ Scope recommendation: sentence | paragraph | holistic | comprehensive
  └─ Staleness effects: which profile sections are now stale
```

#### Focused Analyzer (Surgical Re-Analysis)

**File**: `analysis/focusedAnalyzer.ts` (1,855 lines)

For small edits — runs only what's needed instead of full pipeline:

```
1. Focused Understanding Update (Sonnet, ~$0.03)
   ├─ Delta reasoning: what was GAINED, LOST, CONFIRMED, INVALIDATED
   └─ Ripple flags: does this propagate beyond the sentence?

2. Focused Analysis Update (Sonnet, ~$0.03)
   └─ Re-evaluate based on updated understanding

3. Escalation Ladder
   └─ If ripples exceed paragraph boundary → holistic re-synthesis or comprehensive

4. Phase Re-computation
   └─ Update improvement phase if analysis changed
```

**Cost acceleration**: Round 1 ~$0.75 → Round 5 ~$0.03 (10x cheaper)

#### ReanalysisOrchestrator

**File**: `analysis/reanalysisOrchestrator.ts`

Decides between focused and comprehensive re-analysis. Single-slot processing with edit coalescing (latest edit supersedes older queued ones).

---

### 2.8 Coaching Service (L6)

**File**: `coaching/coachingService.ts` (2,640 lines)

5-stage pipeline per conversation turn:

```
Student message
    │
    ▼
Stage 1: Insight Extraction (Haiku, ~$0.001)
  ├─ Classify: clarification | reinterpretation | new_context | confirmation |
  │   emotional_reaction | resistance | preference | correction
  ├─ Detect focus: essay/paragraph/sentence/word/dimension
  └─ Output: InsightCategory + scope certainty + cognitive state
    │
    ▼
Stage 2: Context Routing (no LLM)
  ├─ Route to appropriate coaching routing rule (9 options)
  └─ Call ProfileRouter.assembleContext() → profile sections
    │
    ▼
Stage 3: Coaching Response (Sonnet/Haiku, ~$0.05-0.10)
  ├─ Full Sonnet for substantive responses
  ├─ Haiku for brief acknowledgments
  ├─ Phase-aware: feedback zoomed to improvement phase level
  ├─ Architecture-grounded: references structural roles, earned-ness
  └─ Max 12 conversation turns in context
    │
    ▼
Stage 4: Profile Deepening (conditional Sonnet, ~$0.03)
  ├─ Only if category = reinterpretation | new_context | correction
  ├─ Sonnet evaluates: does student's reading change the profile?
  ├─ Verdict: confirmed | superseded | tensioned | none
  ├─ If superseded: profile sections updated with student interpretation
  └─ If tensioned: student intent conflicts with text (revision opportunity)
    │
    ▼
Stage 5: Session Memory + Quality Signals
  ├─ Update CoachingSessionMemory (turn count, approaches, arc)
  ├─ Update LearningStyleObservations (how student learns)
  └─ Every 3 turns: extract PatternInsights (repeated focus, confusion, breakthroughs)
```

---

### 2.9 Version Tracking

**File**: `versionTracker.ts` (1,160 lines)

Tracks the lifecycle of an essay version — accumulates edits, decides when to trigger re-analysis, and seals completed versions.

**Staleness accumulation**: weak → moderate → strong (monotonic — once strong, stays strong). Drives re-analysis scope decisions.

**Snapshot system** (`versioning/`): Captures understanding state at key moments, compares across snapshots to detect drift, auto-snapshots on major edits.

---

## 3. Enhanced Writing Workshop — The Editing Engine

### 3.1 Enhancement Orchestrator

**File**: `enhancedWorkshop/writingEnhancementOrchestrator.ts` (634 lines)

The main pipeline: pre-analyze → plan → edit → guard → repeat.

```
User submits essay text
    │
    ▼
WritingEnhancementOrchestrator.enhance(request)
    │
    ├─ Load/build voice profile (REQUIRED — throws if fails)
    │
    ├─ Pre-analyze text → EssaySnapshot (heuristic, ~200ms)
    │
    └─ LOOP (max 3 steps default, max 8):
        │
        ├─ planImprovements(currentSnapshot)
        │   └─ Haiku call (~$0.002): ROI-ranked improvement actions
        │      Input: dimension scores, essay text
        │      Output: dimension, command, targetPassage, rationale
        │
        ├─ Validate target passage exists (fuzzy matching)
        │
        ├─ inlineEditorService.applyCommand()
        │   └─ Sonnet/Haiku: apply editing command with voice constraints
        │      Context: 500 chars before/after, voice profile, session, RAG
        │
        ├─ Pre-analyze edited text → afterSnapshot
        │
        ├─ checkRegression(before, after, editContext)
        │   ├─ Heuristic: dimension deltas, EQI delta
        │   └─ LLM Judge (Haiku): voice, specificity, authenticity
        │   └─ Combined verdict: passed | rejected
        │
        └─ Accept → update text, continue
           Reject → record, exclude passage, continue
```

**Circuit breaker**: 5 consecutive 500s in 60s → auto-disable for 5 minutes. Kill switch: `ENABLE_ENHANCED_WORKSHOP=false`.

**SSE streaming**: `enhanceStreaming()` emits `EnhancementEvent` events in real-time for progressive UI.

**Constants**: `DEFAULT_MAX_STEPS = 3`, `MAX_CONSECUTIVE_FAILURES = 3`, `CATASTROPHIC_EQI_DROP = 5.0`, `SEVERE_DIMENSION_DROP = 3.0`.

---

### 3.2 Annotation Pipeline

**Path**: `src/pipeline/` (17 files, ~5,753 lines)

A separate system from Essay Intelligence — produces inline text annotations with scores. Used by the Enhanced Workshop's `preAnalyzer` for quality snapshots.

```
Essay Text
    │
    ▼
Phase 1: Profile Resolution
  └─ Resolve essay type → dimension weight overrides, anti-patterns, tone
    │
    ▼
Phase 2: Deterministic Feature Extraction (4 parallel analyzers)
  ├─ structureAnalyzer.ts (633 lines): arc type, beats, pacing
  ├─ themeAnalyzer.ts (412 lines): show-don't-tell ratio, cliche themes, coherence
  ├─ characterAnalyzer.ts (354 lines): revelation levels (7-tier), vulnerability
  ├─ insightAnalyzer.ts (391 lines): depth (6 levels), uniqueness
  └─ Word-count-aware annotation scaling (5-12 annotations)
    │
    ▼
Phase 3: Sonnet Annotation Call (single call, $0.15-0.50)
  ├─ 3 dimension clusters in prompt (Structure+Arc, Craft+Voice, Character+Meaning)
  ├─ Deep content analysis findings injected as context
  ├─ Output: RawLLMAnnotation[] with text spans, severity, insight, suggestion
  └─ Validation: span text verified against source, offsets corrected
    │
    ▼
Phase 4: Score Derivation
  ├─ Heuristic score per dimension (from features)
  ├─ Annotation signal per dimension (strength/weakness counts)
  ├─ Fusion: heuristic * 0.4 + annotation * 0.6 (per-dimension overrides)
  ├─ EQI calculation (weighted average)
  └─ Output: DerivedDimensionScore[] + EQI + ImpressionLabel
    │
    ▼
Post-Phase: Summary (top 3 strengths + improvements) + Improvement Roadmap
    │
    ▼
Optional Phase 5: On-demand deep dive for one annotation (Sonnet, $0.02-0.10)
```

**Key types**:
```typescript
interface EssayAnnotation {
  id: string;
  span: TextSpan;           // { text, startOffset, endOffset, paragraphIndex }
  dimensionId: string;       // which of 13 dimensions
  severity: 'critical' | 'important' | 'suggestion' | 'strength';
  isStrength: boolean;
  insight: string;           // what + why (1-3 sentences)
  suggestion: string;        // concrete direction (1-2 sentences)
  rewriteExample?: string;
  confidence: number;        // 0-1
}

interface AnnotatedAnalysisResult {
  annotations: EssayAnnotation[];
  dimensionScores: DerivedDimensionScore[];
  eqi: number;               // 0-100
  impressionLabel: ImpressionLabel;
  summary: { strengths, improvements, overallInsight };
  roadmap: ImprovementRoadmap;
  meta: { costUSD, timing, tokens };
}
```

---

### 3.3 Voice Profile Service

**Path**: `src/services/voiceProfile/` (5 files, ~600 lines)

Captures and preserves a student's authentic writing voice.

```typescript
interface StudentVoiceProfile {
  register: { primary, secondary?, confidence };
  linguistics: {
    averageSentenceLength, sentenceLengthVariety, vocabularyLevel,
    formality, fragmentUse, signatureWords[], avoidWords[]
  };
  personality: { energy, humor, directness, emotionalOpenness };
  authenticPhrases: AuthenticPhrase[];
  weaknesses: string[];
  preservationWarnings: string[];
  confidence, sampleCount;
}
```

**Key operations**:
- `buildFromSample(userId, text, source)` → Haiku analysis (~$0.001)
- `enrichProfile(userId, text, source)` → Sonnet enrichment (~$0.01)
- `getPromptSummary(profile)` → ~500 token block injected into LLM prompts
- `save(profile)` / `load(userId)` → Supabase `voice_profiles` table

**StyleConsistencyService** (495 lines):
- `quickVoiceCheck(text, profile)` → heuristic only, <10ms
- `buildVoiceConstraintBlock(profile)` → ~200 token directive for LLM prompts
- `compareToBaseline(text, profile)` → `VoiceDriftAnalysis` (5 dimensions: sentence length, vocabulary, formality, contraction rate, energy)

---

### 3.4 Inline Editor

**Path**: `src/services/inlineEditor/` (5 files, ~320 lines)

Applies editing commands to selected text with voice awareness.

**15 Built-in Commands**: `make_concrete`, `show_dont_tell`, `clarify_learning`, `add_stakes`, `strengthen_voice`, `cut_filler`, `add_evidence`, `deepen_vulnerability`, `connect_to_theme`, `fix_hook`, `sharpen_ending`, `expand_moment`, `compress`, `add_dialogue`, `remove_cliche`

```typescript
interface InlineEditResult {
  primary: { text, explanation };    // main edit
  creative: { text, explanation };   // bolder alternative
  teachingNote: string;              // why this change matters
  principle: string;                 // underlying writing principle
  cost: number;
  voiceConsistency?: { primary, creative };  // optional post-gen check
}
```

**Model selection**: Sonnet for `deepen_vulnerability` + `connect_to_theme` (nuance-critical), Haiku for others.

**Context injected**: 500 chars before/after, voice constraints, session context, admissions intel, RAG examples (transformation patterns).

---

### 3.5 Regression Guard

**File**: `enhancedWorkshop/regressionGuard.ts` (466 lines)

Prevents edits from making the essay worse. Hybrid approach — both heuristic and LLM signals.

```
Before/After Snapshots
    │
    ▼
Heuristic Layer (instant):
  ├─ Dimension deltas (per-dimension score comparison)
  ├─ EQI delta
  ├─ Catastrophic drop detection (EQI drop > 5.0 or dimension drop > 3.0)
  └─ Result: heuristic verdict
    │
    ▼
LLM Judge Layer (Haiku, ~$0.002):
  ├─ Voice consistency (does the edit preserve the student's voice?)
  ├─ Specificity preservation (concrete → abstract = regression)
  ├─ Authenticity impact (authentic → generic = regression)
  └─ Result: LLM verdict with confidence
    │
    ▼
Combined Verdict:
  ├─ Both pass → ACCEPT
  ├─ Both reject → REJECT
  ├─ Disagree → weighted by confidence
  └─ Output: RegressionCheckResult { verdict, heuristic, llm, reasoning }
```

---

### 3.6 Session Context

**Path**: `src/services/sessionContext/` (3 files, ~380 lines)

In-memory hot cache with debounced Supabase write-behind.

- **In-memory map**: Source of truth, per-session
- **Write-behind**: Debounced (500ms), async, non-blocking
- **Eviction**: 15-minute sweep, 24h TTL
- **Context block**: `getDocumentContextBlock(sessionId)` → ~200-300 token block injected into LLM prompts (word count, essay type, recent edits, top issues)

---

### 3.7 Supporting Services

| Service | Path | Purpose | LLM? |
|---------|------|---------|------|
| **Authenticity** | `src/services/authenticity/` (3 files) | AI risk scoring — 7 heuristic signals, <50ms | No |
| **RAG** | `src/services/rag/` (5 files) | Vector similarity retrieval of essay examples + transformation patterns. Anti-copying enforcement (no 8+ word verbatim phrases). Diversity filtering (Jaccard similarity) | No (embedding only) |
| **Competitive Intelligence** | `src/services/competitiveIntelligence/` (4 files) | 200+ overused phrase database, AO fatigue pattern detection, distinctiveness scoring | No |
| **Portfolio Intelligence** | `src/services/portfolioIntelligence/` (3 files) | Cross-essay theme overlap detection, narrative gap analysis, coverage dimensions | Sonnet |
| **Story Mining** | `src/services/storyMining/` (3 files) | Extract story seeds from activities, rank by distinctiveness + reflection depth + prompt fit | Sonnet |
| **Analytics** | `src/services/analytics/` (4 files) | Version comparison, suggestion acceptance tracking, prompt effectiveness aggregation | No |
| **Stylometrics** | `src/services/stylometrics/` (11 files) | Deep linguistic fingerprinting: idiolect detection, AI detection heuristics, rhythm/register analysis | No |

---

## 4. How The Two Systems Connect

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ESSAY INTELLIGENCE V2                             │
│                                                                     │
│  EssayProfile (rich hierarchical understanding)                    │
│  ├─ paragraphs[].understanding (what each paragraph IS)            │
│  ├─ paragraphs[].analysis (how well each paragraph works)          │
│  ├─ holistic.* (10 cross-essay synthesis sections)                 │
│  ├─ northStar (emergent essay meaning)                             │
│  ├─ findings[] (append-only knowledge with maturity)               │
│  ├─ connections (bidirectional cross-paragraph graph)               │
│  └─ improvementPhase (Foundation→Distinction)                      │
│                                                                     │
│              │ provides deep                      ▲ coaching feeds  │
│              │ understanding                      │ back insights   │
│              ▼                                    │                 │
│  ┌───────────────────────┐    ┌──────────────────────────────────┐ │
│  │ L5 Annotations        │    │ L6 Coaching                      │ │
│  │ (phase-aware feedback)│    │ (conversation → profile deepening)│ │
│  └───────────┬───────────┘    └──────────────┬───────────────────┘ │
│              │                                │                     │
└──────────────┼────────────────────────────────┼─────────────────────┘
               │                                │
               │ annotations inform             │ coaching insights
               │ what to edit                   │ trigger re-analysis
               ▼                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ENHANCED WRITING WORKSHOP                         │
│                                                                     │
│  Voice Profile ──────────────────────────────────────────────────┐  │
│  │                                                               │  │
│  │  Enhancement Loop:                                            │  │
│  │  ├─ preAnalyze() → EssaySnapshot (heuristic scores)          │  │
│  │  ├─ planImprovements() → ROI-ranked actions (Haiku)          │  │
│  │  ├─ inlineEditor.applyCommand() ← voice constraints          │  │
│  │  │                               ← RAG examples              │  │
│  │  │                               ← session context           │  │
│  │  │                               ← admissions intel          │  │
│  │  ├─ regressionGuard.check() ← voice profile                  │  │
│  │  │                          ← heuristic + LLM hybrid         │  │
│  │  └─ accept/reject → loop or done                             │  │
│  │                                                               │  │
│  ├─ Standalone endpoints:                                        │  │
│  │  ├─ /authenticity/check (heuristic, <50ms)                   │  │
│  │  ├─ /voice-drift (heuristic, <10ms)                          │  │
│  │  ├─ /competitive-analysis (heuristic, 200+ phrase DB)        │  │
│  │  ├─ /portfolio-analyze (cross-essay Sonnet)                   │  │
│  │  └─ /version-compare (score delta tracking)                   │  │
│  │                                                               │  │
│  └─ Voice profile feeds back into Essay Intelligence:            │  │
│     ProfileRouter rule `inline_edit_sentence` uses voice context │  │
└─────────────────────────────────────────────────────────────────────┘
```

### Specific Integration Points

| From | To | What Flows | How |
|------|----|-----------|-----|
| Essay Intelligence L5 | Workshop UI | Phase-aware annotations | User clicks annotation → inline editor acts on it |
| Essay Intelligence L6 | Workshop | Coaching insights trigger re-analysis | `processCoachingTurn()` → Stage 4 deepening → profile update |
| Voice Profile | Essay Intelligence | Voice context in routing | ProfileRouter rule `inline_edit_sentence` includes voice |
| Voice Profile | Inline Editor | Voice constraint block | `buildVoiceConstraintBlock()` injected into edit prompt |
| Voice Profile | Regression Guard | Drift comparison | LLM judge evaluates voice consistency against baseline |
| RAG | Inline Editor | Transformation examples | Before/after patterns matched by technique + dimension |
| Session Context | Inline Editor | Document context | ~200 token block with word count, recent edits, top issues |
| Annotation Pipeline | Enhancement Orchestrator | Quality snapshots | `preAnalyze()` produces EssaySnapshot for regression checks |
| Enhancement Runs | Analytics | Effectiveness tracking | Persisted to `enhancement_runs` table for ROI analysis |

### What They DON'T Share (Deliberate Separation)

- Essay Intelligence produces understanding → does NOT directly edit text
- Enhanced Workshop edits text → does NOT produce deep understanding
- Essay Intelligence scores via L3.5 (rich context) → Workshop scores via annotation pipeline (heuristic + single LLM call)
- They're complementary: understand deeply, then edit precisely

---

## 5. Data Flow Diagrams

### First-Time Essay Analysis (Essay Intelligence)

```
Student writes essay
    │
    ▼
POST /api/v1/annotate/analyze  (or orchestrator.analyzeEssay())
    │
    ├─ L1: Haiku × N paragraphs (parallel)     [$0.02]
    ├─ L2 + L2.5: Haiku × 2 (parallel)         [$0.10]
    ├─ L3: Sonnet × N paragraphs (sequential)   [$0.40]
    ├─ Growth Cycle:                             [$0.12-0.30]
    │   ├─ L3.75 Iteration 1: synthesis + curation
    │   ├─ Deep Dives: 2-4 targeted investigations
    │   ├─ Re-reads: 0-2 full-context paragraph re-reads
    │   ├─ L3.75 Iteration 2: validate + converge
    │   └─ (repeat until converged or budget exhausted)
    ├─ L3.5: Sonnet × N paragraphs (parallel)   [$0.25]
    ├─ L4: Sonnet × 1 (crystallization)          [$0.08]
    └─ L5: Sonnet × N paragraphs (parallel)      [$0.15]
    │
    ▼
Store EssayProfile in Supabase (essay_understanding table, ~200KB JSONB)
Return L5 annotations to UI
Total: $0.75–1.00, ~30-60 seconds
```

### Enhancement Loop (Writing Workshop)

```
Student selects text or requests enhancement
    │
    ▼
POST /enhanced/enhance  (or /enhance/stream for SSE)
    │
    ├─ Load voice profile (Supabase or build from sample)
    ├─ Pre-analyze: heuristic snapshot                    [free]
    │
    ├─ Step 1:
    │   ├─ Plan: Haiku ROI ranking                        [$0.002]
    │   ├─ Edit: Sonnet/Haiku apply command               [$0.006-0.012]
    │   ├─ Re-analyze: heuristic snapshot                  [free]
    │   ├─ Guard: heuristic + Haiku judge                  [$0.002]
    │   └─ Accept or reject
    │
    ├─ Step 2: (same pattern on updated text)
    ├─ Step 3: (same pattern on updated text)
    │
    └─ Persist enhancement run to Supabase (async)
    │
    ▼
Return: improved text + all snapshots + step details
Total: $0.06–0.15, ~10-15 seconds
```

### Student Edit → Re-Analysis (Cross-System)

```
Student edits essay (via inline editor or manually)
    │
    ▼
editUnderstandingService.classifyEdit()
    ├─ Step 0: Mechanical diff (no LLM)
    ├─ Step 1: Haiku triviality filter ($0.001)
    └─ Step 2-4: Sonnet impact classification ($0.03)
    │
    ├─ TRIVIAL → skip
    │
    ├─ MINOR/MODERATE → focusedAnalyzer ($0.03-0.05)
    │   ├─ Focused understanding update
    │   ├─ Focused analysis update
    │   ├─ Escalation check
    │   └─ Phase re-computation
    │
    └─ SIGNIFICANT/TRANSFORMATIVE → full re-analysis ($0.40-0.75)
        ├─ Re-walk affected paragraphs WITH PRIOR UNDERSTANDING
        ├─ Growth cycle (may run 1-2 iterations)
        ├─ Re-run L3.5, L4, L5
        └─ Understanding compounds (doesn't restart from zero)
```

---

## 6. Type System Reference

### Essay Intelligence Root Type

```typescript
interface EssayProfile {
  id: string;
  essayId: string;
  essayType: 'common_app' | 'supplement' | 'piq';
  metadata: { wordCount, promptText?, totalAnalysisCost, createdAt, updatedAt };

  // L1
  paragraphFirstImpressions: ParagraphFirstImpression[];

  // L2 + L2.5
  structuralCartography: StructuralCartography | null;
  scoutOutput: ConnectionScoutOutput | null;

  // L3 (hierarchy: essay → paragraph → sentence)
  paragraphs: ParagraphProfile[];
    // ParagraphProfile.understanding: ParagraphUnderstanding
    // ParagraphProfile.analysis: ParagraphAnalysis
    // ParagraphProfile.sentences: SentenceProfile[]
    //   SentenceProfile.understanding: SentenceUnderstanding
    //   SentenceProfile.analysis: SentenceAnalysis

  // L3.75 (10 holistic sections)
  voiceIdentity: VoiceIdentity | null;
  voiceMap: VoiceMap | null;
  emotionalTopography: EmotionalTopography | null;
  momentEarnednessMap: MomentEarnednessMap | null;
  thematicArchitecture: ThematicArchitecture | null;
  narrativeStrategy: NarrativeStrategy | null;
  characterRevelation: CharacterRevelation | null;
  craftAssessment: CraftAssessment | null;
  admissionsPositioning: AdmissionsPositioning | null;
  entanglements: CrossDimensionEntanglement[];

  // L4
  northStar: EssayNorthStar | null;
  paragraphScoreMatrix: ParagraphScoreMatrix | null;
  coherenceReport: CoherenceReport | null;

  // Supporting
  connections: ProfileConnections;
  findings: Finding[];
  questionQueue: UnderstandingQuestion[];
  index: ProfileIndex;
  improvementPhase: ImprovementPhase;

  // Metadata
  version: number;
  writeVersion: number;  // optimistic concurrency
}
```

### Understanding vs Analysis (Critical Separation)

```typescript
// L3 — DESCRIPTIVE (what it IS)
interface SentenceUnderstanding {
  observedFunctions: ObservationEntry[];
  inferredIntents: ObservationEntry[];
  narrativeContributions: ObservationEntry[];
  rhetoricalFunctions: string[];
  significantChoices: Array<{ word, significance }>;
  connectionRefs: string[];
  findingRefs: string[];
  tags: string[];
}

// L3.5 — EVALUATIVE (how well it works)
interface SentenceAnalysis {
  effectiveness: number;              // 0-100
  effectivenessReasoning: string;
  strengths: ObservationEntry[];
  weaknesses: ObservationEntry[];
  isStrength: boolean;
  isProblem: boolean;
  priorityForImprovement: number;
}

// ObservationEntry — evidence-grounded (every claim cites text)
interface ObservationEntry {
  observation: string;
  confidence: number;    // 0-1, cognitive forcing function
  evidence: string;      // exact text quote, prevents hallucination
}
```

### Growth Engine Types

```typescript
interface GrowthCycleState {
  iteration: number;
  maxIterations: number;    // default 8
  budgetCeiling: number;    // $0.60
  budgetSpent: number;
  converged: boolean;
  activityLog: GrowthActivity[];
}

interface QuestionCurationOutput {
  resolvedQuestions: Array<{ questionId, answer, evidence }>;
  curatedQueue: Array<{
    question: UnderstandingQuestion;
    recommendedPrompt: string;       // deep dive prompt type
    promptRationale: string;
  }>;
  filteredQuestions: Array<{ questionId, filterReason }>;
}

interface SynthesisIterationOutput {
  synthesis: HolisticSynthesisOutput;
  walkDisagreements: string[];
  questionCuration: QuestionCurationOutput;
  readingStrategy: ReadingStrategy;
  reReadCandidates: Array<{ paragraphIndex, reason }>;
  selfAssessedConvergence: boolean;
}

type ImprovementPhaseLevel =
  'foundation' | 'architecture' | 'craft' | 'polish' | 'distinction';
```

### Enhanced Workshop Types

```typescript
interface EnhanceRequest {
  text: string;
  essayType?: string;
  maxSteps?: number;        // default 3, max 8
  focusDimensions?: string[];
  sessionId?: string;
}

interface EnhanceResult {
  originalText: string;
  improvedText: string;
  steps: EnhancementStep[];
  beforeSnapshot: EssaySnapshot;
  afterSnapshot: EssaySnapshot;
  totalCost: number;
  totalTimeMs: number;
}

interface EssaySnapshot {
  wordCount: number;
  eqi: number;
  dimensionScores: Record<string, number>;
  impressionLabel: string;
  weakestDimensions: string[];
}

interface RegressionCheckResult {
  verdict: 'passed' | 'rejected';
  heuristicResult: { dimensionDeltas, eqiDelta, catastrophic };
  llmResult: { voiceConsistency, specificityPreserved, authenticityImpact, confidence };
  reasoning: string;
}
```

---

## 7. File Map

```
src/services/essayIntelligence/          (57 files, 45K+ lines)
├── index.ts                              barrel exports (282 lines)
├── profileTypes.ts                       V2 type system — THE source of truth (3,600 lines)
├── versionTracker.ts                     version lifecycle (1,160 lines)
│
├── analysis/
│   ├── analysisOrchestrator.ts           MAIN PIPELINE — L1→L5 sequencing (1,447 lines)
│   ├── firstImpressions.ts              L1: Haiku parallel (576 lines)
│   ├── structuralCartographer.ts         L2: Haiku structural map
│   ├── scoutPass.ts                     L2.5: Haiku connection leads
│   ├── sequentialDeepWalk.ts            L3: Sonnet sequential walk (1,755 lines)
│   ├── holisticSynthesis.ts             L3.75: Sonnet iterative growth (2,835 lines)
│   ├── analysisPass.ts                  L3.5: Sonnet parallel analysis (1,397 lines)
│   ├── crystallizer.ts                  L4: Sonnet crystallization (1,697 lines)
│   ├── deepAnnotationService.ts         L5: Sonnet parallel annotations (1,765 lines)
│   ├── growthEngine.ts                  Growth cycle state + budget (267 lines)
│   ├── deepDiveRunner.ts                Execute deep dives (631 lines)
│   ├── deepDivePromptLibrary.ts         ~20 specialist prompts (1,008 lines)
│   ├── questionQueueManager.ts          Question persistence + evolution (225 lines)
│   ├── fullContextReReader.ts           Re-read with complete understanding
│   ├── editUnderstandingService.ts      Edit impact classification (1,417 lines)
│   ├── focusedAnalyzer.ts               Surgical re-analysis (1,855 lines)
│   ├── reanalysisOrchestrator.ts        Edit lifecycle management
│   ├── phaseAssessment.ts               Improvement phase computation
│   ├── llmJsonParser.ts                 Defensive JSON parsing
│   └── contradictionConsumer.ts         Coherence contradiction processing
│
├── profileManager/
│   ├── essayProfileManager.ts           Coordinator — thin dispatch hub (2,805 lines)
│   ├── profileRouter.ts                 16-rule context assembly (2,910 lines)
│   ├── routerTypes.ts                   Router type definitions
│   ├── checkpointStore.ts               Pipeline checkpointing
│   ├── dependencyMap.ts                 Staleness propagation rules
│   ├── readinessScoring.ts              Profile readiness assessment
│   └── mutators/                        8 domain-specific mutators
│       ├── sentenceMutator.ts, paragraphMutator.ts, holisticMutator.ts
│       ├── connectionMutator.ts, voiceMapMutator.ts, earnednessMutator.ts
│       ├── northStarMutator.ts, insightMutator.ts
│   └── validation/                      Intra- and cross-domain validation
│
├── connections/
│   ├── connectionGraph.ts               Bidirectional graph (415 lines)
│   └── connectionContextBuilder.ts      Render connections for prompts
│
├── findings/
│   ├── findingStore.ts                  Append-only CRUD + lifecycle (461 lines)
│   └── findingContextBuilder.ts         Render findings for prompts
│
├── coaching/
│   └── coachingService.ts               L6: 5-stage pipeline (2,640 lines)
│
└── versioning/
    ├── snapshotManager.ts               Snapshot capture + compare
    ├── snapshotComparator.ts            Edit event detection
    └── snapshotTrigger.ts               Auto-snapshot decisions

src/services/enhancedWorkshop/           (9 files, ~850 lines)
├── writingEnhancementOrchestrator.ts    Main loop (634 lines)
├── preAnalyzer.ts                       Quality snapshot wrapper (72 lines)
├── improvementPlanner.ts                ROI ranking + Haiku (517 lines)
├── regressionGuard.ts                   Hybrid heuristic + LLM guard (466 lines)
├── workshopBridge.ts                    New→old system bridge (233 lines)
├── config.ts                            Circuit breaker config (61 lines)
├── types.ts                             All types (370 lines)
├── enhancedApiClient.ts                 Frontend API client (155 lines)
└── index.ts                             Re-exports

src/pipeline/                            (17 files, ~5,753 lines)
├── annotationPipeline.ts                Main 4-phase orchestrator (415 lines)
├── promptBuilder.ts                     Sonnet prompt assembly (819 lines)
├── scoreDeriver.ts                      Heuristic + annotation fusion (246 lines)
├── types.ts                             Core types (428 lines)
├── structureAnalyzer.ts                 Arc/beat/pacing heuristics (633 lines)
├── themeAnalyzer.ts                     Show-don't-tell + clichés (412 lines)
├── characterAnalyzer.ts                 Revelation levels + vulnerability (354 lines)
├── insightAnalyzer.ts                   Depth + uniqueness scoring (391 lines)
├── deepDiveService.ts                   On-demand annotation expansion (189 lines)
├── reanalysisService.ts                 Selective re-analysis (193 lines)
├── batchActivityPipeline.ts             N activities in 1 call (360 lines)
└── ...                                  validation, roadmap, summary, etc.

src/services/voiceProfile/               (5 files, ~600 lines)
src/services/inlineEditor/               (5 files, ~320 lines)
src/services/authenticity/               (3 files, ~450 lines)
src/services/sessionContext/             (3 files, ~380 lines)
src/services/rag/                        (5 files, ~510 lines)
src/services/competitiveIntelligence/    (4 files, ~400 lines)
src/services/portfolioIntelligence/      (3 files, ~110 lines)
src/services/storyMining/               (3 files, ~150 lines)
src/services/analytics/                  (4 files, ~200 lines)
src/services/stylometrics/              (11 files, ~1,500 lines)

src/http/enhancedWorkshopRoutes.ts       Route layer (796 lines)
src/http/annotationRoutes.ts             Annotation routes (123 lines)
```

---

## 8. Cost Model

### Essay Intelligence V2

| Layer | Model | Cost | Notes |
|-------|-------|------|-------|
| L1 (First Impressions) | Haiku | ~$0.02 | Parallel per-paragraph |
| L2 (Structural) | Haiku | ~$0.08 | Single call |
| L2.5 (Scout) | Haiku | ~$0.02 | Single call |
| L3 (Walk) | Sonnet | ~$0.40 | Sequential, ~$0.05-0.10/para |
| Growth Cycle | Sonnet | ~$0.12-0.30 | L3.75 iters + deep dives |
| L3.5 (Analysis) | Sonnet | ~$0.25 | Parallel per-paragraph |
| L4 (Crystallization) | Sonnet | ~$0.08 | Single call |
| L5 (Annotations) | Sonnet | ~$0.15 | Parallel per-paragraph |
| **First analysis total** | | **$0.75-1.00** | |
| Focused re-analysis | Sonnet | $0.03-0.05 | 10x cheaper than full |
| L6 coaching turn | Haiku+Sonnet | $0.05-0.10 | Per conversation turn |

### Enhanced Writing Workshop

| Operation | Model | Cost | Latency |
|-----------|-------|------|---------|
| preAnalyze (heuristic) | None | $0 | ~200ms |
| planImprovements | Haiku | ~$0.002 | ~1s |
| inlineEditor (Haiku cmd) | Haiku | ~$0.006 | ~2s |
| inlineEditor (Sonnet cmd) | Sonnet | ~$0.012 | ~3s |
| checkRegression (judge) | Haiku | ~$0.002 | ~1s |
| voice profile build | Haiku | ~$0.003 | ~1.5s |
| voice profile enrich | Sonnet | ~$0.015 | ~3s |
| assessRisk (heuristic) | None | $0 | ~50ms |
| quickVoiceCheck | None | $0 | ~10ms |
| **Full enhance (3 steps)** | Mixed | **$0.06-0.15** | ~10-15s |

### Understanding Growth Over Time

```
Round 1: Full analysis                    ~$0.75-1.00
Round 1 deep dives: 3 investigations      ~$0.12
Coaching turn 1: insight + deepening       ~$0.08
Student edit: focused re-analysis          ~$0.04
Round 2 deep dive: escalated question      ~$0.04
Coaching turn 2: confirmation              ~$0.03
Student edit: another focused update       ~$0.03

Total after 5 interactions: ~$1.09
Understanding: 700+ words of prose, 20+ findings, mature question queue
vs. Current (pre-PLAN2): ~$1.50 producing same depth every time
```

---

> **The core insight**: Essay Intelligence understands deeply so the Writing Workshop can edit precisely. Understanding compounds across interactions — each coaching turn, each edit, each deep dive adds to a growing model of what the essay IS and how the student thinks. The writing workshop consumes that understanding to make voice-preserving, regression-guarded improvements. They're separate systems that make each other powerful.
