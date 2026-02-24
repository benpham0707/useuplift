# Activity Workshop Writing System - Deep Analysis Report

> **Generated**: 2026-02-19
> **Scope**: `src/services/portfolioStrategy/services/activityWorkshop/` (46 TypeScript files)
> **Version**: v4.3.0 Pipeline

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Writing Quality Mechanisms](#2-writing-quality-mechanisms)
3. [LLM Usage](#3-llm-usage)
4. [Strengths](#4-strengths)
5. [Weaknesses](#5-weaknesses)
6. [Type.ai Comparison](#6-typeai-comparison)
7. [Cost Analysis](#7-cost-analysis)

---

## 1. Architecture Overview

### 1.1 Pipeline Stages

The Activity Workshop is a **4-stage LLM pipeline** plus a parallel narrative pass, processing a student's full extracurricular activity portfolio (typically 5-10 activities):

```
Input: Activities[] + StudentContext
          │
    ┌─────▼──────┐
    │  Stage 0    │  Haiku (~$0.005)
    │  Story      │  "Who IS this student?"
    │  Detection  │  → StoryContext (archetype, themes, roles)
    └─────┬──────┘
          │
    ┌─────▼──────────────────────────┐
    │  Stage 1: Parallel Analysis    │  Sonnet (~$0.15-0.20)
    │  ┌─────────────┐              │
    │  │ Sub-batches  │ (2 at a     │  LLM sub-batches for per-activity analysis
    │  │ of 2 acts    │  time,      │  + profiler heuristics
    │  └─────────────┘  parallel)   │
    │  + Scoring Orchestrator        │  3-4 Sonnet batch calls (description,
    │    (runs in parallel)          │  activity, portfolio scoring)
    │  → AnalysisContext             │
    └─────┬──────────────────────────┘
          │
    ┌─────▼──────────────────────────┐
    │  Stage 2: Parallel Teaching    │  Sonnet (~$0.10-0.15)
    │  ┌─────────────┐              │
    │  │ Per-activity │ (each is    │  Individual LLM call per activity
    │  │ LLM calls    │  parallel)  │  + scoring teaching layer
    │  └─────────────┘              │
    │  → TeachingContext             │
    └─────┬──────────────────────────┘
          │
    ┌─────▼──────────────────────────┐
    │  Stage 3 + Narrative (Parallel)│
    │  ├─ Stage 3: Synthesis (Haiku) │  Final assessment, ordering, action plan
    │  └─ Narrative (Sonnet)         │  Holistic portfolio story
    │  → SynthesisContext +          │
    │    PortfolioNarrative           │
    └────────────────────────────────┘
```

**Key architectural decisions:**
- **Parallel processing** within stages (sub-batches, individual teaching calls)
- **Stage 3 and Narrative run in parallel** since they're independent
- **Scoring orchestrator runs in parallel** with Stage 1 analysis
- **Legacy compatibility layer** converts v4 types to v3 `PortfolioAnalysis`/`PortfolioTeaching`

### 1.2 File Map (46 files)

| Directory | Files | Purpose |
|-----------|-------|---------|
| `./` (root) | 12 | Orchestrator, legacy services, types, index, knowledge bases |
| `./stages/` | 5 | 4 pipeline stages + portfolio narrative service |
| `./scoring/` | 10 | 1-10 rubric scoring system (description, activity, portfolio, teaching layer, cache) |
| `./chat/` | 8 | Conversational profile extraction system |
| `./profile/` | 3 | Activity profile types, service, description generator |

### 1.3 Data Flow

**Input** (`ActivityWorkshopSessionInput`):
- `activities[]`: title, description (150 chars), role, hours, category, achievements
- `studentContext?`: intended major, target schools, grade, first-gen/low-income/rural flags
- `activityProfiles?`: Rich profile data from chat conversations (optional, keyed by activity ID)
- `targetPlatform?`: Common App (150 chars), UC (350 chars), Coalition (255 chars)

**Output** (`ActivityWorkshopPipelineResult`):
- All 4 stage outputs (StoryContext, AnalysisContext, TeachingContext, SynthesisContext)
- `finalNarrative?`: Holistic portfolio story
- `scoring?`: Full 1-10 rubric with per-activity breakdowns
- `chatRecommendations?`: Which activities need deeper profiling
- `teachingSummary`: Coach's strategic direction
- Legacy `analysis`/`teaching` for backward compatibility

---

## 2. Writing Quality Mechanisms

### 2.1 Knowledge Bases (Grounding LLM in Domain Expertise)

The system uses **5 interconnected knowledge bases** to prevent LLM hallucination and ground all feedback in real admissions expertise:

| Knowledge Base | File | Content |
|----------------|------|---------|
| **Expert Counselor KB** | `expertCounselorKnowledgeBase.ts` | AO reading process (8-min read), committee pitch test, constraint intelligence (4 levels), school archetypes, narrative arcs, character traits |
| **Teaching KB** | `activityTeachingKnowledgeBase.ts` | 15 issue types (vague_description, missing_quantification, weak_role_clarity, etc.) with THE PROBLEM → WHY THIS WORKS → WHAT TO PRIORITIZE → BEFORE/AFTER structure |
| **Knowledge Assembly** | `knowledgeAssemblyService.ts` | Bridges 10+ competition hierarchies, impact metrics, major alignment, field expectations, spike detection into per-activity teaching context |
| **Expert System Prompts** | `expertSystemPrompts.ts` | 3-layer prompt architecture: Analysis Mindset → Teaching Mindset → Strategic Mindset |
| **Citation Service** | `activityCitationService.ts` | Links feedback to verifiable sources (Sara Harberson, research, statistics, school-specific) |

**Key insight**: The LLM is told to **APPLY** knowledge, not **INVENT** it. Pre-computed benchmarks, citations, and teaching bundles are injected into prompts so the model reasons from real data.

### 2.2 Teaching Protocol

Stage 2 follows a structured teaching protocol for each activity:

1. **CELEBRATE FIRST** (conditional): Quote a specific strong phrase from description. Skip if nothing genuinely noteworthy.
2. **TIER EXPLANATION**: Using Sara Harberson's 4-tier framework with benchmarks the student meets/misses.
3. **STRENGTH TEACHING**: Why what works matters (with AO psychology backing).
4. **IMPROVEMENT TEACHING**: THE PROBLEM → WHY IT MATTERS → HOW TO FIX → BEFORE/AFTER → TRANSFORMATION ANALYSIS.
5. **DESCRIPTION OPTIMIZATION**: Full rewrite of 150-char description with change explanations.
6. **NARRATIVE GUIDANCE**: How to talk about this activity in essays, interviews. Unique angle. Connection to story.

**Quality controls baked into prompts:**
- **Anti-redundancy rules**: "Every sentence must be unique to THIS activity"
- **Banned phrases**: "Great job!", "Consider adding more detail", generic praise
- **Anti-generic checklist**: 5-point self-check before output
- **Conditional celebration**: "OMIT celebration field entirely if description is weak/generic"
- **Description references**: `DescriptionReference` type enables frontend text highlighting

### 2.3 Scoring Rubric (1-10 Scale)

Two independent scoring dimensions per activity:

**Description Score** (weighted average of 5 dimensions):
- Role Ownership (25%): Does the reader know what THIS student did?
- Evidence of Impact (25%): Clear cause-and-effect?
- Differentiation Signal (20%): What did THIS student do that 1,000 others didn't?
- Action Precision (15%): Strong verbs, specific language?
- Strategic Quantification (15%): Numbers used meaningfully?

**Activity Score** (weighted average of 5 dimensions):
- Tier Assessment (30%): Sara Harberson 1-4 framework
- Recognition Level (25%): External validation
- Leadership & Impact (12.5%, conditional): Role and measurable change
- Community & Character (15%): Character traits, community benefit
- Commitment & Progression (17.5%): Years, growth, sustained engagement

**Combined Score**: `(activityScore * 0.7) + (descriptionScore * 0.3)`

**Portfolio Score**: Tier distribution, spike detection, coherence, major alignment, presentation quality → Harvard 1-6 equivalent.

### 2.4 Chat-Based Profile Enrichment

The chat system (`chat/` subdirectory) is a conversational AI that builds rich `ActivityProfile` objects through natural dialogue:

**Conversation phases**: Opening → Fact Gathering → Story Exploration → Meaning Reflection → Impact Assessment → Connection Mapping → Synthesis → Complete

**Adaptive behavior**:
- Detects student communication patterns: engaged, terse, tangential, reluctant, humble
- Adjusts conversation modes: standard, rescue_storytelling, targeted_completion, recap_confirmation, emotional_validation
- Tracks extraction quality per turn and adjusts strategy

**Profile Bridge** (`profileBridge.ts`) translates profiles into stage-appropriate summaries:
- Stage 0: Origin story, key moments, meaning, spike connection
- Stage 1: Verified facts, recognition, scale metrics, role progression
- Stage 2: Authentic quotes, verified metrics, gaps vs description, suggested elements
- Stage 3: Unique angle, narrative contribution, character traits

**Critical design principle**: Profiles enhance GUIDANCE quality but do NOT inflate SCORES. Scores reflect what the AO reads in the 150-char description.

### 2.5 Description Rewrite Pipeline

Descriptions get rewritten/improved at multiple points:

1. **Stage 2 Teaching**: Each activity gets an `descriptionOptimization` with `optimizedDescription`, `changesExplained`
2. **Scoring Teaching Layer**: Generates principled rewrites with craft teaching
3. **Step 7 Merge**: If scoring rewrite is within char limit AND Stage 2's exceeds it, prefer the scoring version
4. **Stage 3 Synthesis**: Final ordered activity list with `finalDescription` per activity

---

## 3. LLM Usage

### 3.1 Model Selection by Stage

| Stage | Model | Rationale | Max Tokens |
|-------|-------|-----------|------------|
| Stage 0: Story Detection | Haiku | Quick classification, low cost | 2,000 |
| Stage 1: Sub-batch Analysis | Sonnet | Nuanced tier assessment needs strong reasoning | varies |
| Stage 1: Story Adjustments | Sonnet | Context-sensitive tier adjustments | 2,000 |
| Stage 1: Scoring (3 calls) | Sonnet | Description & activity scoring need calibration | varies |
| Stage 2: Per-activity Teaching | Sonnet | Teaching quality is user-facing, must be excellent | 5,000-6,500 |
| Stage 2: Quick Encouragements | Sonnet | Even brief feedback should be high quality | varies |
| Stage 2: Scoring Teaching | Sonnet | Description rewrites need craft | varies |
| Stage 3: Synthesis | Haiku | Data already analyzed, just synthesizing | 3,000 |
| Narrative Pass | Sonnet | Deep narrative reasoning | varies |

### 3.2 Prompt Engineering Techniques

**System prompt caching**: `cacheSystemPrompt: true` on Stage 1 story adjustments and Stage 2 per-activity calls. The expert system prompt (~2000+ tokens) is cached across parallel calls, saving ~$0.03-0.05 per pipeline run.

**Temperature settings**:
- 0.3 for most stages (grounded analysis with slight creativity)
- 0.2 for story adjustments (more deterministic)

**JSON output format**: All stages output structured JSON. Robust parsing with `parseClaudeJSON` utility (handles markdown code blocks, repair).

**Expert knowledge injection**: The `expertSystemPrompts.ts` builds multi-thousand-token system prompts that teach the LLM a reasoning framework, not just instructions:
- "The 3-Second Impression" (gut reaction)
- "The Committee Pitch Test" (can AO use this?)
- "The 8-Minute Read" (how AOs actually process applications)
- "Read BETWEEN the lines" (what most systems miss)

### 3.3 Parallel Processing Architecture

```
Stage 0 (Haiku)                    ← sequential
    │
Stage 1: Profiler (heuristic)       ← instant, no API
    │
    ├── Sub-batch 1 (Sonnet)  ─┐
    ├── Sub-batch 2 (Sonnet)   ├── parallel
    ├── Sub-batch N (Sonnet)  ─┘
    │                              ├── parallel with sub-batches
    └── Scoring Orchestrator ──────┘
        ├── Description batch (Sonnet) ─┐
        ├── Activity batch (Sonnet)     ├── parallel
        └── Portfolio scoring (Sonnet)  ┘
    │
Stage 2:
    ├── Activity 1 teaching (Sonnet)  ─┐
    ├── Activity 2 teaching (Sonnet)   ├── all parallel
    ├── Activity N teaching (Sonnet)  ─┘
    ├── Quick encouragements (Sonnet)  ├── parallel with above
    └── Scoring teaching (Sonnet)     ─┘
    │
    ├── Stage 3 (Haiku)         ─┐
    └── Narrative (Sonnet)       ├── parallel
                                ─┘
```

This architecture achieves **~5 min wall clock** (down from ~29 min in v4.1) for 10 activities.

---

## 4. Strengths

### 4.1 Deep Domain Knowledge Integration
The knowledge base system is exceptionally well-built. The `expertCounselorKnowledgeBase.ts` encodes genuine admissions expertise — the AO reading process, committee pitch test, constraint intelligence framework. This is not generic writing advice; it's domain-specific guidance grounded in how applications are actually evaluated.

### 4.2 Structured Teaching Protocol
The CELEBRATE → EDUCATE → TRANSFORM → CONNECT protocol with anti-redundancy rules, banned phrases, and conditional celebration produces teaching that avoids the two most common AI writing coach failures: empty praise and generic advice. The requirement that "every sentence must be unique to THIS activity" is enforced at the prompt level.

### 4.3 Multi-Dimensional Scoring
The 1-10 rubric with 5 description dimensions and 5 activity dimensions provides granular, actionable feedback. The weighted scoring system (Role Ownership 25%, Impact 25%, etc.) reflects actual admissions priorities. The Harvard 1-6 mapping gives portfolio-level context.

### 4.4 Profile-Enhanced Teaching
The chat → profile → pipeline bridge is a genuine differentiator. When a student has chatted about their robotics club, Stage 2 knows their verified metrics and can say "Your profile shows you trained 12 team members, but your description doesn't mention it" — this is massively more useful than generic "add quantification" advice.

### 4.5 Constraint-Aware Evaluation
The 4-level constraint intelligence system (Baseline → Moderate → Significant → Exceptional) with tier adjustment logic respects that a first-gen student starting a club at an under-resourced school has demonstrated more initiative than a legacy student joining an established program. This is ethically important and technically well-implemented.

### 4.6 Before/After Examples with Real Student Text
Stage 2 teaching requires quoting the student's actual description text in `exampleBefore` and providing a concrete rewrite in `exampleAfter`. This is the gold standard for writing coaching — not abstract advice, but "here's what you wrote, here's what it could be."

### 4.7 Portfolio-Level Coherence Analysis
The system doesn't just evaluate activities individually. The spike analysis, coherence scoring, narrative threading, and "how activities elevate each other" analysis provides strategic portfolio-level guidance that most writing tools completely miss.

### 4.8 Incremental Scoring Cache
The `scoringCacheService` enables re-scoring only changed activities on subsequent runs. This makes iterative improvement practical — change one description, re-run, see the score change, without re-scoring 9 unchanged activities.

---

## 5. Weaknesses

### 5.1 No Iterative Drafting Loop
The pipeline is **one-shot**: input activities → output analysis + teaching + rewrites. There is no mechanism for the student to revise a description, see the score change, get new feedback, revise again, and converge toward an optimal description through multiple iterations. The scoring cache supports this technically, but there's no UI/UX or API flow designed for it.

### 5.2 No Voice Capture or Preservation System
While prompts mention "preserve student's authentic voice," there is no formal **voice model** or **style profile** that captures how THIS student writes. The chat system extracts authentic quotes, but these are used as content inputs, not as stylistic targets. Two students with very different writing voices would get similar-sounding rewrites.

### 5.3 Limited Inline Editing
The system produces complete rewrites but doesn't support **inline editing commands** ("make this more concrete," "show don't tell for this phrase"). The `DescriptionReference` type supports highlighting specific text, but there's no mechanism for the student to point at a phrase and ask for targeted improvement.

### 5.4 No Example Essay RAG
There is no retrieval-augmented generation from a corpus of successful activity descriptions. The before/after examples in `activityTeachingKnowledgeBase.ts` are static (15 issue types × 2-3 transformations each = ~40 examples). A RAG system over hundreds of successful descriptions would provide much more relevant examples for any given activity type.

### 5.5 Fabricated Metrics in Descriptions
By design, when no profile data exists, the system generates **fabricated metrics** as "inspirational examples" in description rewrites (e.g., "organized fundraiser raising $3,200" when the student never said that). While documented as intentional, this creates a risk of students submitting descriptions with numbers they haven't verified. The prompt says "these serve as EXAMPLES that inspire students to fill in their own real figures," but the UX doesn't enforce this.

### 5.6 No Cross-Activity Description Consistency
Each activity is taught individually in parallel. While the narrative service analyzes connections, there's no post-processing step that ensures **voice consistency** across all 10 descriptions, or that descriptions collectively avoid repetitive phrasing ("Founded and led..." appearing 4 times).

### 5.7 Description Optimization Character Limit Compliance
Despite explicit prompt instructions (`HARD LIMIT: 150 chars for Common App`), LLM-generated rewrites frequently exceed the character limit. The Step 7 merge logic partially addresses this by preferring scoring-layer rewrites when Stage 2's exceed the limit, but this is a workaround, not a solution.

### 5.8 Teaching Depth Uniformity
The "deep" vs "medium" teaching distinction is based on teaching candidate selection (tier, story role, improvement potential), but the actual teaching quality varies significantly based on LLM output. Some "deep" teachings are shallow; some "medium" teachings are excellent. There's no post-hoc quality validation.

### 5.9 No Student Feedback Loop
The system has no mechanism for students to rate the quality of teaching they received, flag unhelpful advice, or indicate what resonated. This makes prompt optimization rely entirely on developer testing rather than user signal.

---

## 6. Type.ai Comparison

### 6.1 Voice Capture and Style Preservation

| Feature | Type.ai Pattern | Uplift Status | Gap |
|---------|----------------|---------------|-----|
| Voice model that captures student's writing style | Formal voice profiling per user | **Not implemented** | No formal voice model. Prompts say "preserve voice" but there's no captured style target. Chat quotes are content, not style. |
| Style consistency across documents | Brand/style layer ensures consistency | **Partial** | Narrative service detects themes, but no enforcement of consistent voice/tone across 10 descriptions. |
| Adapts output to match student's natural register | Learns from user writing samples | **Not implemented** | Rewrites default to a "strong admissions voice" rather than adapting to each student's natural register. |

**Assessment**: This is the largest gap. Type.ai's core differentiator is voice capture. Uplift has no equivalent.

### 6.2 Story Mining and Brainstorming

| Feature | Type.ai Pattern | Uplift Status | Gap |
|---------|----------------|---------------|-----|
| Surface specific moments, decisions, conflicts | Interactive brainstorming sessions | **Strong (Chat system)** | The chat conversation phases (story_exploration, meaning_reflection) actively mine for key moments, turning points, and emotional resonance. |
| Follow-up prompting for depth | Adaptive questioning based on responses | **Strong** | ConversationDynamics tracks sparse/rich extractions, adjusts mode (rescue_storytelling, targeted_completion). Detects engaged/terse/humble patterns. |
| Connect stories to application narrative | Context-aware story integration | **Strong** | Stage 0 identifies narrative threads, Stage 2 connects improvements to story, narrative service shows how activities elevate each other. |

**Assessment**: This is Uplift's strongest area relative to type.ai. The chat → profile → pipeline integration is sophisticated.

### 6.3 Paragraph-Level Drafting vs Full Ghostwriting

| Feature | Type.ai Pattern | Uplift Status | Gap |
|---------|----------------|---------------|-----|
| Coach approach (teach, don't write for them) | Paragraph-level drafting with user control | **Mixed** | Stage 2 does both: teaches (improvement explanations, before/after) AND writes (full description rewrite). The teaching is coaching-style, but the rewrite is ghostwriting. |
| User retains control of their words | User makes final edits | **Weak in system, depends on UI** | The pipeline produces a `optimizedDescription` that could replace the student's work entirely. No mechanism to present it as a suggestion the student iterates on. |
| Incremental improvement | Small suggestions, not wholesale rewrites | **Not implemented** | Each teaching cycle produces a complete rewrite. No "change just this phrase" capability. |

**Assessment**: The teaching protocol is excellent coaching. The description rewrites are closer to ghostwriting. The system needs a "suggest edits" mode alongside "full rewrite."

### 6.4 Rubric-Based Critique with Dimension Scoring

| Feature | Type.ai Pattern | Uplift Status | Gap |
|---------|----------------|---------------|-----|
| Multi-dimension scoring with rubric | Dimension-based critique | **Excellent** | 5-dimension description scoring (Role Ownership, Impact, Differentiation, Action Precision, Quantification) + 5-dimension activity scoring. Research-backed weights. |
| Explains WHY each score | Rationale per dimension | **Excellent** | Every score component includes `rationale` field with specific evidence. |
| Shows improvement path | Clear "to get from X to Y, do Z" | **Good** | Tier explanation shows "what would change it." Scoring teaching provides `improvementPaths`. But no projected score after improvement. |

**Assessment**: This is a strength. The scoring rubric is more sophisticated than typical writing tool rubrics.

### 6.5 RAG with Example Essays

| Feature | Type.ai Pattern | Uplift Status | Gap |
|---------|----------------|---------------|-----|
| Retrieve similar successful examples | RAG over essay corpus | **Not implemented** | No vector store, no retrieval. Before/after examples are static in `activityTeachingKnowledgeBase.ts` (~40 examples for 15 issue types). |
| Show relevant exemplars | "Here's how a similar student described their robotics club" | **Partial** | `comparisonBenchmarksLibrary.ts` has static benchmarks per activity category. Not dynamic retrieval. |
| Learn from successful patterns | Continuous improvement from good outputs | **Not implemented** | No feedback loop. No storage of successful descriptions for future reference. |

**Assessment**: Significant gap. RAG over a corpus of strong descriptions (anonymized) would dramatically improve example relevance.

### 6.6 Inline Editing Commands

| Feature | Type.ai Pattern | Uplift Status | Gap |
|---------|----------------|---------------|-----|
| "Make more concrete" on selection | Inline editing with natural language commands | **Not implemented** | No inline editing. DescriptionReference supports highlighting text, but there's no mechanism to modify a specific phrase. |
| "Show don't tell" on a paragraph | Targeted rewrite of selection | **Not implemented** | All rewrites are full-description replacements. |
| Quick actions on highlighted text | Selection-based quick transforms | **Not implemented** | No selection-based interaction. |

**Assessment**: Major gap for interactive writing improvement. The current system is batch-oriented, not interactive.

### 6.7 Brand/Style Layer for Consistency

| Feature | Type.ai Pattern | Uplift Status | Gap |
|---------|----------------|---------------|-----|
| Consistent style across outputs | Brand voice enforcement | **Partial** | Anti-redundancy rules prevent repetition. But no positive style enforcement. |
| Template system | Reusable templates for common patterns | **Not implemented** | Each description is generated fresh. No template library for common activity types. |
| Style guide adherence | Check output against style rules | **Not implemented** | No post-generation style validation. |

**Assessment**: Moderate gap. The anti-generic checklist is a start, but there's no positive style system.

### 6.8 Document-Context Awareness

| Feature | Type.ai Pattern | Uplift Status | Gap |
|---------|----------------|---------------|-----|
| Aware of full application context | Understands all documents together | **Strong** | The 4-stage pipeline explicitly builds context: Stage 0 reads ALL activities, Stage 1 analyzes with story context, Stage 2 teaches with portfolio awareness, Stage 3 synthesizes holistically. |
| Cross-document consistency | Ensures essays/descriptions align | **Partial** | Within the activity section, strong. But no awareness of the student's main essay, supplementals, or rec letters. |

**Assessment**: Strong within the activity section. No cross-application-section awareness (which would be a significant feature).

### 6.9 Guardrails Against Generic/AI-Sounding Output

| Feature | Type.ai Pattern | Uplift Status | Gap |
|---------|----------------|---------------|-----|
| Detect and prevent AI-sounding language | Style guardrails | **Good (prompt-level)** | Banned phrases list, anti-generic checklist, "consultant voice" detection ("Spearheaded cross-functional collaboration" = red flag). Expert prompt teaches "authentic student voice" vs "adult wrote it." |
| Post-generation quality check | Validate output quality | **Partial** | `qualityMetrics` tracks celebration-first adherence, citation count, example count. But no automated detection of AI-sounding output. |
| Authenticity scoring | Rate how human the output sounds | **Not implemented** | No authenticity scoring on generated descriptions. |

**Assessment**: Good prompt-level guardrails, weak post-generation validation.

### 6.10 Analytics/Feedback Loops

| Feature | Type.ai Pattern | Uplift Status | Gap |
|---------|----------------|---------------|-----|
| Track which suggestions users accept | User interaction analytics | **Not implemented** | No tracking of which rewrites students adopt. |
| A/B test prompt variations | Prompt optimization from data | **Not implemented** | No A/B testing infrastructure. |
| Continuous prompt improvement | Learn from user outcomes | **Not implemented** | Prompt quality relies on developer testing. |

**Assessment**: Complete gap. No feedback loop exists.

### Summary Table

| Type.ai Feature | Uplift Rating | Notes |
|-----------------|---------------|-------|
| Voice capture/preservation | **1/5** | No voice model |
| Story mining/brainstorming | **5/5** | Chat system is excellent |
| Coaching vs ghostwriting | **3/5** | Good teaching, rewrites are ghostwriting |
| Rubric-based scoring | **5/5** | Sophisticated multi-dimension rubric |
| RAG with examples | **1/5** | Static examples only |
| Inline editing | **0/5** | Not implemented |
| Style consistency | **2/5** | Anti-redundancy only |
| Document context | **4/5** | Strong within activity section |
| Anti-generic guardrails | **4/5** | Good at prompt level |
| Analytics/feedback | **0/5** | Not implemented |

---

## 7. Cost Analysis

### 7.1 Per-Pipeline Cost Estimate (10 Activities)

| Component | Model | Estimated Cost | Notes |
|-----------|-------|---------------|-------|
| Stage 0: Story Detection | Haiku | $0.005 | ~1500 in, ~800 out |
| Stage 1: Sub-batches (5x2) | Sonnet | $0.10-0.15 | 5 sub-batch calls |
| Stage 1: Story Adjustments | Sonnet | $0.02-0.03 | 1 call with expert system prompt (cached) |
| Stage 1: Scoring (3 calls) | Sonnet | $0.05-0.08 | Description batch + activity batch + portfolio |
| Stage 2: Per-activity Teaching (5 deep + 5 quick) | Sonnet | $0.10-0.20 | 5 individual deep calls + 1 quick batch |
| Stage 2: Scoring Teaching | Sonnet | $0.04-0.06 | 1 call for transformations |
| Stage 3: Synthesis | Haiku | $0.005 | ~2000 in, ~1500 out |
| Narrative: Portfolio Story | Sonnet | $0.05-0.08 | 1 call |
| **TOTAL** | | **$0.35-0.60** | |

### 7.2 Token Breakdown (10 Activities)

| Stage | Input Tokens | Output Tokens | Dominant Cost |
|-------|-------------|---------------|---------------|
| Stage 0 | ~1,500 | ~800 | Haiku: negligible |
| Stage 1 (all) | ~15,000-25,000 | ~10,000-15,000 | Sonnet output ($15/M) |
| Stage 2 (all) | ~20,000-30,000 | ~15,000-25,000 | Sonnet output ($15/M) |
| Stage 3 | ~3,000 | ~2,000 | Haiku: negligible |
| Narrative | ~5,000-8,000 | ~3,000-5,000 | Sonnet output ($15/M) |

**Key cost driver**: Sonnet output tokens in Stage 2 (per-activity teaching generates 1000-1500 output tokens per activity at $15/M).

### 7.3 Optimization Opportunities

1. **Prompt caching is partially used but could be extended**: The expert system prompt is cached in Stage 2 (`cacheSystemPrompt: true`), but the per-activity prompts include repeated context (student story, portfolio needs) that could be moved to a cached prefix.

2. **Description rewrites happen twice**: Both Stage 2 teaching and the scoring teaching layer generate rewrites. The Step 7 merge chooses the better one, but both API calls are made. Could skip scoring teaching rewrites for activities where Stage 2's rewrite is already within char limits.

3. **Quick encouragements could use Haiku**: Currently uses Sonnet for quick encouragements (~100-200 words). These are celebratory, not nuanced analysis — Haiku would suffice and save ~$0.01-0.02.

4. **Scoring cache is well-designed but underutilized**: The incremental scoring cache only benefits repeat pipeline runs. If the UI supported "score just this one description" calls, costs would drop dramatically for iterative improvement.

5. **Narrative pass runs on every pipeline call**: For repeat analyses where activities haven't changed, the narrative could be cached like scoring is.

### 7.4 Cost Comparison

| Approach | Cost per Portfolio | Time |
|----------|-------------------|------|
| v1.0 (per-activity) | $1.60-2.40 | ~20 min |
| v2.0 (batch) | $0.35-0.55 | ~10 min |
| v4.3 (current pipeline) | $0.35-0.60 | ~5 min |
| With full caching (repeat run, 1 change) | $0.05-0.15 | ~2 min |

The v4.3 pipeline achieves similar cost to v2.0 while providing dramatically richer analysis (scoring, narrative, teaching, chat integration) and 50% faster wall-clock time through parallelization.

---

## Appendix A: Key Files Quick Reference

| File | Size | Purpose |
|------|------|---------|
| `types.ts` | ~1,400 lines | All type definitions for pipeline |
| `activityWorkshopService.ts` | ~870 lines | Main orchestrator |
| `stage0StoryDetectionService.ts` | ~530 lines | Story triage (Haiku) |
| `stage1ContextAwareAnalysisService.ts` | ~970 lines | Parallel analysis (Sonnet) |
| `stage2ConditionalTeachingService.ts` | ~1,400+ lines | Parallel teaching (Sonnet) |
| `stage3PortfolioSynthesisService.ts` | ~500+ lines | Synthesis (Haiku) |
| `portfolioNarrativeService.ts` | ~500+ lines | Holistic narrative (Sonnet) |
| `expertCounselorKnowledgeBase.ts` | ~500+ lines | Expert domain knowledge |
| `expertSystemPrompts.ts` | ~400+ lines | 3-layer prompt architecture |
| `activityTeachingKnowledgeBase.ts` | ~500+ lines | 15 issue teaching bundles |
| `knowledgeAssemblyService.ts` | ~400+ lines | Knowledge bridge |
| `scoring/types.ts` | ~660 lines | Scoring rubric types |
| `scoring/scoringOrchestrator.ts` | ~400+ lines | Scoring pipeline |
| `scoring/descriptionScoringService.ts` | ~300+ lines | Description scoring (Sonnet) |
| `scoring/activityTeachingLayerService.ts` | ~300+ lines | Teaching layer (Sonnet) |
| `chat/types.ts` | ~586 lines | Chat conversation types |
| `chat/activityProfileChatService.ts` | ~500+ lines | Chat orchestrator |
| `profileBridge.ts` | ~500+ lines | Profile → pipeline translation |
| `profile/types.ts` | ~500+ lines | Activity profile data model |
