# Writing Improvement Roadmap: Matching & Exceeding Type.ai Quality

> **Purpose:** Comprehensive, actionable plan for elevating Uplift's writing coaching to match or exceed type.ai-level quality while being more cost-effective.
> **Date:** February 2026
> **Scope:** Activity Workshop, PIQ Workshop, Common App Workshop, cross-cutting infrastructure

---

## Table of Contents

1. [Gap Analysis Summary](#1-gap-analysis-summary)
2. [Voice Capture & Preservation System](#2-voice-capture--preservation-system)
3. [Story Mining & Brainstorming Engine](#3-story-mining--brainstorming-engine)
4. [RAG Layer](#4-rag-layer)
5. [Inline Editing Commands](#5-inline-editing-commands)
6. [Style Layer / Brand Voice](#6-style-layer--brand-voice)
7. [Anti-AI-Detection & Authenticity](#7-anti-ai-detection--authenticity)
8. [Cost Optimization Strategy](#8-cost-optimization-strategy)
9. [Document-Context Awareness](#9-document-context-awareness)
10. [Feedback Loops & Analytics](#10-feedback-loops--analytics)
11. [Implementation Phases](#11-implementation-phases)
12. [Technical Specifications](#12-technical-specifications)

---

## 1. Gap Analysis Summary

### What Type.ai Does vs. What We Have

| Capability | Type.ai | Uplift Current State | Gap Severity | Impact |
|:-----------|:--------|:---------------------|:-------------|:-------|
| **Voice capture & preservation** | Full — sentence length, vocabulary, formality profiling from writing samples; style persists across sessions | **Partial** — Common App has VoiceFingerprint (6 emotional registers, sentence rhythms, vocabulary level, authentic phrases). Activity chat has basic voice (formality/energy/verbosity). PIQ has voice fingerprint + quality anchors. BUT: no unified cross-workshop profile, Activity pipeline rewrites don't receive voice fingerprint. | **Medium** | **High** |
| **Story mining & brainstorming** | Clustering/ranking story seeds by distinctiveness, ranking by fit with each prompt | **Partial** — Activity chat does story exploration with phase-based conversation. Common App has excavation questions + buried spark detection. BUT: no dedicated brainstorming flow with ranked story seeds, no cross-activity story clustering. | **Medium** | **High** |
| **Rubric-based critique** | Multi-dimension scoring with per-dimension comments | **Strong** — PIQ: 13 dimensions with prompt-specific weights. Common App: 12 dimensions with essay-type weights. Activity: multi-rubric scoring (description, activity, portfolio) on 1-10 scale with Harvard equivalents. This is already our strongest area. | **Low** | **High** |
| **RAG with examples/rubrics** | Vector DB for example essays, rubrics, official guidance; retrieves 2-3 similar examples at generation time | **Partial** — Common App has 10+ college research overlays with dean quotes, examples, and principles. PIQ has teaching examples (20 pairs, 4 of 13 dimensions). Activity has expert knowledge base with counselor quotes. BUT: all static, no embedding-based retrieval, no vector DB. | **High** | **High** |
| **Inline editing commands** | Targeted: "make more concrete", "show don't tell", "clarify what you learned" vs single "improve" button | **Missing** — No inline editing capability. All feedback is batch (full analysis → all issues at once). No document-integrated editing experience. | **High** | **Very High** |
| **Style/brand voice layer** | Persistent voice profile encoded across sessions; outputs consistent with student's natural style | **Partial** — Voice fingerprinting exists per-workshop but is session-scoped and not shared. No persistent voice profile in Supabase. Different fingerprint schemas across workshops. | **Medium** | **High** |
| **Anti-AI-detection** | Flags generic/pattern-heavy writing, encourages personalization | **Partial** — Common App has banned terms, anti-cliché analyzer, essay-mode detection. Activity has authenticity scoring. PIQ has anti-pattern flags (followsTypicalArc, hasGenericInsight). BUT: no explicit "AI detection risk" check or score. | **Low** | **Medium** |
| **Document-context awareness** | Full document visible to LLM during inline edits; suggestions stay consistent with rest of essay | **Partial** — Common App maintains holistic context during analysis. PIQ chat injects full draft + context. BUT: no real-time document-context awareness during editing. | **Medium** | **High** |
| **Analytics/feedback loops** | Tracks edits accepted/rejected, versions, refines prompts over time | **Missing** — No edit tracking, no version diffing, no prompt refinement pipeline. PIQ has version history type but limited implementation. Activity has no versioning. | **High** | **Medium** |
| **Paragraph-level coaching** | Side-by-side draft comparison, highlight suggestions, encourage student rewrites | **Partial** — All three workshops produce before/after examples and teaching. Common App has 2-suggestion framework (Polished Original + Voice Amplifier). Activity has `descriptionOptimization` with `changesExplained`. BUT: no side-by-side UI, no paragraph-level granularity, no student revision tracking. | **Medium** | **High** |

### Priority Matrix

```
                         HIGH IMPACT
                              │
     ┌────────────────────────┼────────────────────────┐
     │                        │                        │
     │  Inline Editing ★★★    │  Unified Voice ★★★     │
     │  RAG Layer ★★★         │  Story Mining ★★       │
     │  Doc-Context ★★        │                        │
     │                        │                        │
HIGH ├────────────────────────┼────────────────────────┤ LOW
GAP  │                        │                        │  GAP
     │  Analytics ★★          │  Anti-AI-Detection ★   │
     │  Feedback Loops ★★     │  Rubric (already good) │
     │                        │                        │
     │                        │                        │
     └────────────────────────┼────────────────────────┘
                              │
                         LOW IMPACT
```

**Top 5 Priorities (in order):**
1. **Inline Editing Commands** — highest gap, highest user-facing impact
2. **Unified Voice Profile System** — multiplier effect across all workshops
3. **RAG Layer with Vector DB** — transforms teaching quality with real examples
4. **Story Mining & Brainstorming Engine** — fills critical user workflow gap
5. **Document-Context Awareness** — enables real-time editing experience

---

## 2. Voice Capture & Preservation System

### Current State

Three separate, incompatible voice representations:

| Workshop | Voice Type | Fields | Persistence |
|----------|-----------|--------|-------------|
| Common App | `VoiceFingerprint` (stage0Types.ts) | dominant_register, voice_qualities, sentence_rhythms, vocabulary_level, authentic_phrases, preservation_warnings | Session only |
| Activity Chat | `VoiceFingerprint` (dynamicConversationEngine.ts) | formality, energy, verbosity | Session only |
| PIQ | Voice fingerprint (from Phase 17 edge function) | sentence_structure_pattern, vocabulary_level, signature_words, pacing, tone | Edge function response only |

### Target: Unified Student Voice Profile

A single, persistent voice profile that:
- Is built from any writing sample (essay, chat response, or uploaded text)
- Enriches over time as the student writes more
- Flows into every LLM prompt across all workshops
- Is stored in Supabase for cross-session persistence

### Implementation Plan

#### New Type: `StudentVoiceProfile`

```typescript
// src/services/voiceProfile/types.ts

export interface StudentVoiceProfile {
  userId: string;
  version: number;
  createdAt: string;
  updatedAt: string;

  // === CORE VOICE CHARACTERISTICS ===
  register: {
    primary: EmotionalRegister;
    secondary?: EmotionalRegister;
    confidence: number;
  };

  // === LINGUISTIC FINGERPRINT ===
  linguistics: {
    averageSentenceLength: number;
    sentenceLengthVariety: number; // 1-10
    vocabularyLevel: 'sophisticated' | 'clear' | 'simple';
    formality: 'formal' | 'semi-formal' | 'casual';
    fragmentUse: 'effective' | 'moderate' | 'minimal';
    signatureWords: string[];      // Words/phrases they naturally use
    avoidWords: string[];          // Words that sound wrong in their voice
  };

  // === PERSONALITY MARKERS ===
  personality: {
    energy: 'high' | 'medium' | 'low';
    humor: 'frequent' | 'occasional' | 'rare';
    directness: 'very_direct' | 'moderate' | 'circumspect';
    emotionalOpenness: 'open' | 'guarded' | 'reserved';
  };

  // === AUTHENTIC PHRASES ===
  authenticPhrases: {
    phrase: string;
    source: 'essay' | 'chat' | 'uploaded_sample';
    sourceId?: string;
    preserveExactly: boolean;
  }[];

  // === VOICE WEAKNESSES ===
  weaknesses: string[];            // Where voice breaks down
  preservationWarnings: string[];  // What NOT to change

  // === CONFIDENCE & SOURCES ===
  confidence: number;              // 0-100
  sampleCount: number;             // How many samples contributed
  lastSampleAt: string;
}
```

#### New Service: `VoiceProfileService`

```typescript
// src/services/voiceProfile/voiceProfileService.ts

export class VoiceProfileService {
  // Build initial profile from a writing sample
  async buildFromSample(userId: string, text: string, source: string): Promise<StudentVoiceProfile>;

  // Enrich existing profile with new writing
  async enrichProfile(userId: string, text: string, source: string): Promise<StudentVoiceProfile>;

  // Get a prompt-ready summary (token-efficient)
  getPromptSummary(profile: StudentVoiceProfile, maxTokens?: number): string;

  // Convert from workshop-specific formats
  fromCommonAppFingerprint(fp: VoiceFingerprint): Partial<StudentVoiceProfile>;
  fromActivityChatFingerprint(fp: ActivityVoiceFingerprint): Partial<StudentVoiceProfile>;
  fromPIQFingerprint(fp: PIQVoiceFingerprint): Partial<StudentVoiceProfile>;

  // Persist to Supabase
  async save(profile: StudentVoiceProfile): Promise<void>;
  async load(userId: string): Promise<StudentVoiceProfile | null>;
}
```

#### Database Migration

```sql
-- supabase/migrations/XXX_add_voice_profiles.sql
CREATE TABLE voice_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(clerk_id),
  version INTEGER NOT NULL DEFAULT 1,
  profile JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own voice profile"
  ON voice_profiles FOR ALL USING (user_id = auth.jwt() ->> 'sub');
```

#### Integration Points

| Workshop | How Voice Profile Is Used |
|----------|--------------------------|
| Common App Stage 0 | Pre-populate VoiceFingerprint if profile exists; skip excavation for confident profiles |
| Common App Stage 2 | Include `getPromptSummary()` in every suggestion generation prompt |
| Activity Stage 2 | Include in teaching prompts for description optimization |
| Activity Chat | Initialize conversation voice matching from profile instead of cold-start |
| PIQ Chat | Include in system prompt context alongside existing fingerprint |
| PIQ Phase 17 | Send as context for voice fingerprint validation/enrichment |

#### Files to Modify

| File | Change |
|------|--------|
| `src/services/voiceProfile/types.ts` | **NEW** — StudentVoiceProfile types |
| `src/services/voiceProfile/voiceProfileService.ts` | **NEW** — Core service |
| `src/services/voiceProfile/index.ts` | **NEW** — Exports |
| `src/http/routes.ts` | Add `/api/voice-profile` endpoints |
| `src/services/commonAppWorkshop/services/evolvedWorkshopOrchestrator.ts` | Load voice profile, pass to Stage 0/2 |
| `src/services/commonAppWorkshop/services/batchGenerationService.ts` | Accept voice profile in HolisticContext |
| `src/services/portfolioStrategy/services/activityWorkshop/activityWorkshopService.ts` | Load voice profile, pass to Stage 2 |
| `src/services/portfolioStrategy/services/activityWorkshop/chat/dynamicConversationEngine.ts` | Initialize from voice profile |
| `src/services/piqWorkshop/piqChatContext.ts` | Include voice profile in context |
| `supabase/migrations/XXX_add_voice_profiles.sql` | **NEW** — Database table |

**Model:** Haiku for initial profiling (fast, cheap), Sonnet for enrichment/validation

**Token cost:** ~500 tokens per prompt injection (compact summary), ~1000 tokens for Haiku profiling call

**Effort:** ~3-4 days

---

## 3. Story Mining & Brainstorming Engine

### Current State

- Activity chat does multi-phase story exploration (`opening` → `story_exploration` → `meaning_reflection`), but it's activity-scoped, not cross-activity
- Common App has excavation questions + buried spark detection in Stage 0, but it's essay-scoped
- Neither system provides ranked story seeds with distinctiveness scoring

### Target: Cross-Activity Story Mining

A dedicated brainstorming flow that:
1. Surfaces specific moments, decisions, and conflicts across ALL activities
2. Clusters and ranks ideas by distinctiveness, reflection depth, and fit with target prompts
3. Connects story seeds to specific essay prompts (Common App, PIQ, supplementals)
4. Preserves the student's voice throughout

### Implementation Plan

#### New Type: `StoryMiningSession`

```typescript
// src/services/storyMining/types.ts

export interface StorySeed {
  id: string;
  /** The specific moment/decision/conflict */
  moment: string;
  /** Activities it draws from */
  sourceActivityIds: string[];
  /** The emotional core */
  emotionalCore: string;
  /** What makes it distinctive */
  distinctiveness: {
    score: number;       // 0-100
    reasoning: string;
    uniqueElements: string[];
  };
  /** Reflection depth potential */
  reflectionDepth: {
    score: number;       // 0-100
    possibleInsights: string[];
  };
  /** Prompt fit scores */
  promptFit: {
    promptId: string;    // e.g., 'common_app_1', 'piq3_talent'
    fitScore: number;    // 0-100
    fitReasoning: string;
  }[];
  /** Suggested narrative angles */
  narrativeAngles: string[];
  /** Voice register that fits this story */
  suggestedRegister: EmotionalRegister;
  /** Raw student quotes that could start this story */
  seedQuotes: string[];
}

export interface StoryMiningResult {
  sessionId: string;
  userId: string;
  seeds: StorySeed[];
  clusters: {
    theme: string;
    seedIds: string[];
    clusterStrength: number;
  }[];
  topRecommendations: {
    promptId: string;
    recommendedSeedId: string;
    reasoning: string;
  }[];
  metadata: {
    generatedAt: string;
    modelUsed: string;
    tokensUsed: { input: number; output: number };
    cost: number;
  };
}
```

#### New Service: `StoryMiningService`

```typescript
// src/services/storyMining/storyMiningService.ts

export class StoryMiningService {
  /**
   * Mine stories from activity profiles and chat history.
   * Uses Haiku for initial extraction, Sonnet for ranking.
   */
  async mineStories(input: {
    activityProfiles: Record<string, ActivityProfile>;
    chatHistories?: Record<string, ConversationMessage[]>;
    voiceProfile?: StudentVoiceProfile;
    targetPrompts?: string[];  // Prompts to score fit against
    studentContext?: StudentContext;
  }): Promise<StoryMiningResult>;

  /**
   * Interactive brainstorming: ask follow-up questions about a seed.
   */
  async deepenSeed(
    seedId: string,
    miningResult: StoryMiningResult,
    followUpResponses: string[]
  ): Promise<StorySeed>;

  /**
   * Rank seeds for a specific prompt.
   */
  async rankForPrompt(
    seeds: StorySeed[],
    promptId: string,
    promptText: string
  ): Promise<StorySeed[]>;
}
```

#### Flow

```
Activity Chat Profiles + Pipeline Analysis
    │
    ├──► Haiku: Extract story moments (~$0.005)
    │    (specific moments, decisions, conflicts, emotions)
    │
    ├──► Haiku: Cluster by theme + score distinctiveness (~$0.005)
    │    (cluster similar moments, identify unique angles)
    │
    └──► Sonnet: Rank top seeds per target prompt (~$0.03)
         (fit scoring, narrative angle suggestions, quote selection)
```

#### Files to Create/Modify

| File | Change |
|------|--------|
| `src/services/storyMining/types.ts` | **NEW** |
| `src/services/storyMining/storyMiningService.ts` | **NEW** |
| `src/services/storyMining/index.ts` | **NEW** |
| `src/http/routes.ts` | Add `/api/story-mining` endpoints |

**Model:** Haiku for extraction/clustering ($0.01), Sonnet for ranking/quality ($0.03)

**Total cost per mining session:** ~$0.04

**Effort:** ~4-5 days

---

## 4. RAG Layer

### Current State

- Common App: 10+ college research files (static TypeScript), transformation examples, source registries, counseling insights — ALL embedded directly in prompts
- PIQ: 20 teaching examples (static, incomplete), issue patterns with fix strategies
- Activity: Expert counselor knowledge base, database matches
- NO vector database, NO embedding-based retrieval, NO dynamic example selection

### Target: pgvector-Based RAG System

Use Supabase's built-in pgvector extension for:
1. **Example essay fragments** — anonymized, consented, tagged by dimension/prompt/college/quality
2. **Teaching patterns** — before/after transformations with effectiveness scores
3. **Admissions guidance** — official statements, dean quotes, counselor insights
4. **Rubric context** — dimension-specific scoring criteria and examples

### Implementation Plan

#### Database Schema

```sql
-- supabase/migrations/XXX_add_rag_embeddings.sql

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Essay fragment store
CREATE TABLE rag_essay_fragments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536),  -- text-embedding-3-small dimensions

  -- Metadata for retrieval filtering
  essay_type TEXT,          -- 'common_app', 'piq', 'supplemental', 'activity_description'
  prompt_type TEXT,         -- 'why_us', 'challenge', 'piq1_leadership', etc.
  dimension TEXT,           -- 'specificity_evidence', 'voice_integrity', etc.
  quality_tier TEXT,        -- 'excellent', 'strong', 'needs_work'
  college TEXT,             -- 'stanford', 'harvard', etc.
  technique TEXT,           -- 'storytelling', 'technical_depth', etc.

  -- Teaching metadata
  why_it_works TEXT,
  transferable_principle TEXT,
  source_info TEXT,         -- "Harvard admit, leadership essay"

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teaching transformation store
CREATE TABLE rag_transformations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  before_text TEXT NOT NULL,
  after_text TEXT NOT NULL,
  before_embedding vector(1536),
  after_embedding vector(1536),

  dimension TEXT,
  technique TEXT,
  why_it_works TEXT,
  principle TEXT,           -- Transferable lesson
  effectiveness_score FLOAT, -- Tracked over time

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create HNSW indexes for fast similarity search
CREATE INDEX ON rag_essay_fragments
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX ON rag_transformations
  USING hnsw (before_embedding vector_cosine_ops);
```

#### New Service: `RAGService`

```typescript
// src/services/rag/ragService.ts

export class RAGService {
  /**
   * Retrieve relevant essay fragments for a given context.
   * Returns 2-3 similar examples with abstracted patterns.
   */
  async retrieveExamples(input: {
    queryText: string;        // The student's current text
    essayType?: string;
    promptType?: string;
    dimension?: string;       // Focus dimension
    college?: string;
    qualityTier?: 'excellent' | 'strong'; // Only retrieve good examples
    limit?: number;           // Default 3
  }): Promise<RAGResult[]>;

  /**
   * Retrieve relevant transformations (before/after pairs).
   */
  async retrieveTransformations(input: {
    weakText: string;         // Text to improve
    dimension?: string;
    technique?: string;
    limit?: number;
  }): Promise<RAGTransformation[]>;

  /**
   * Format retrieved results for prompt injection.
   * Abstracts patterns — never copies language.
   */
  formatForPrompt(results: RAGResult[], maxTokens?: number): string;

  /**
   * Embed and store a new example (admin function).
   */
  async addExample(fragment: Omit<RAGEssayFragment, 'id' | 'embedding'>): Promise<void>;
}
```

#### Content Seeding Strategy

Phase 1 (MVP): Migrate existing static content to pgvector
- Common App college research → rag_essay_fragments (tagged by college)
- PIQ teaching examples → rag_transformations
- Activity expert knowledge base → rag_essay_fragments
- Common App transformation examples → rag_transformations
- **Estimated: ~500 fragments, ~100 transformations**

Phase 2: Curated expansion
- Anonymized example essays from consenting users (with permission)
- Published admissions guide excerpts (fair use / licensed)
- College-specific official guidance documents

Phase 3: Dynamic learning
- Track which retrieved examples lead to highest score improvements
- Update `effectiveness_score` on transformations based on user outcomes
- Automatically surface highest-performing examples

#### Integration Points

| Workshop Stage | RAG Usage |
|---------------|-----------|
| Common App Stage 2 (suggestions) | Retrieve 2-3 similar excellent fragments for the same essay type + dimension being addressed. Include in prompt as "Here is how strong essays handle [dimension]..." |
| PIQ Phase 17 (analysis) | Retrieve relevant teaching transformations for detected issues |
| PIQ Chat | Retrieve real examples when student asks "can you show me what good looks like?" |
| Activity Stage 2 (teaching) | Retrieve description transformations matching the activity's improvement areas |
| Story Mining | Retrieve story seeds from excellent essays in the same prompt type |
| Inline Editing (new) | Retrieve targeted transformations for the specific editing command |

#### Files to Create/Modify

| File | Change |
|------|--------|
| `src/services/rag/types.ts` | **NEW** — RAG types |
| `src/services/rag/ragService.ts` | **NEW** — Core service with pgvector queries |
| `src/services/rag/ragSeeder.ts` | **NEW** — Migration script for existing static content |
| `src/services/rag/index.ts` | **NEW** |
| `supabase/migrations/XXX_add_rag_embeddings.sql` | **NEW** — Schema |
| `src/services/commonAppWorkshop/services/batchGenerationService.ts` | Add RAG context to suggestion prompts |
| `src/services/piqWorkshop/piqChatContext.ts` | Add RAG example retrieval |

**Embedding model:** OpenAI `text-embedding-3-small` (1536 dims, $0.02/1M tokens) — cheap, fast, good quality

**Cost per retrieval:** ~$0.0001 (embedding query) + negligible pgvector compute

**Effort:** ~5-6 days (including content migration)

---

## 5. Inline Editing Commands

### Current State

All three workshops operate in batch mode:
1. Student submits essay/description
2. System analyzes everything at once
3. Returns full analysis with all issues and suggestions

No ability to select text and say "make this more concrete" or "show don't tell here."

### Target: Targeted Inline Editing

A command palette of writing-specific editing operations that:
- Operate on selected text within document context
- Are fast (< 3 seconds response)
- Preserve student voice
- Generate 2 alternatives (safe + creative)
- Are backed by the same rubric intelligence

### Implementation Plan

#### Editing Commands

```typescript
// src/services/inlineEditor/types.ts

export type EditingCommand =
  | 'make_concrete'        // Replace vague language with specific details
  | 'show_dont_tell'       // Convert telling to showing (scene, dialogue, sensory)
  | 'clarify_learning'     // Deepen reflection/insight
  | 'add_stakes'           // Raise the stakes — what's at risk?
  | 'strengthen_voice'     // Make it sound more like THEM
  | 'cut_filler'           // Remove unnecessary words
  | 'add_evidence'         // Add specific metrics/results/proof
  | 'deepen_vulnerability' // Move past surface-level emotion
  | 'connect_to_theme'     // Link this passage to the essay's main theme
  | 'fix_hook'             // Strengthen an opening
  | 'sharpen_ending'       // Strengthen a conclusion
  | 'expand_moment'        // Slow down and expand a key moment
  | 'compress'             // Say the same thing in fewer words
  | 'add_dialogue'         // Convert summary to scene with dialogue
  | 'remove_cliche';       // Replace clichéd language

export interface InlineEditRequest {
  /** The selected text to edit */
  selectedText: string;
  /** Full document for context */
  fullDocument: string;
  /** Position in document */
  selectionStart: number;
  selectionEnd: number;
  /** The command to apply */
  command: EditingCommand;
  /** Student's voice profile (for voice preservation) */
  voiceProfile?: StudentVoiceProfile;
  /** Essay type context */
  essayType?: string;
  /** Additional context */
  additionalContext?: string;
}

export interface InlineEditResult {
  /** Primary suggestion (safe, incremental) */
  primary: {
    text: string;
    explanation: string;
  };
  /** Creative alternative (bolder) */
  creative: {
    text: string;
    explanation: string;
  };
  /** What changed and why */
  teachingNote: string;
  /** Transferable principle */
  principle: string;
  /** Token cost */
  cost: number;
}
```

#### New Service: `InlineEditorService`

```typescript
// src/services/inlineEditor/inlineEditorService.ts

export class InlineEditorService {
  private ragService: RAGService;
  private voiceProfileService: VoiceProfileService;

  /**
   * Apply an editing command to selected text.
   * Uses Haiku for speed (~2s response time).
   */
  async applyCommand(request: InlineEditRequest): Promise<InlineEditResult>;

  /**
   * Get suggested commands for a text selection.
   * Analyzes the selection and recommends 2-3 most impactful commands.
   */
  async suggestCommands(
    selectedText: string,
    fullDocument: string,
    essayType?: string
  ): Promise<{ command: EditingCommand; reason: string; impact: string }[]>;
}
```

#### Prompt Strategy

Each command has a focused prompt template (~300 tokens system, ~200 tokens user):

```
System: You are a college essay writing coach. Your task is to {COMMAND_DESCRIPTION}.

RULES:
- Preserve the student's authentic voice: {VOICE_SUMMARY}
- Generate exactly 2 alternatives: one safe (minimal change), one creative (bolder)
- Each must fit naturally in the surrounding context
- Explain what changed and why (one sentence)
- State the transferable writing principle

{RAG_EXAMPLES if available}

BANNED TERMS: {BANNED_LIST}

User:
SURROUNDING CONTEXT: {100 chars before}[SELECTED]{100 chars after}

FULL ESSAY TYPE: {essay_type}

SELECTED TEXT TO EDIT:
"{selected_text}"

COMMAND: {command}
```

#### Model Selection: Haiku for Speed

Inline editing MUST be fast (< 3 seconds). Use `claude-haiku-4-5-20251001`:
- Input: ~800 tokens (system + context + selection)
- Output: ~300 tokens (2 alternatives + explanation)
- Cost: ~$0.001 per edit
- Latency: ~1.5-2.5 seconds

For complex commands (deepen_vulnerability, connect_to_theme), optionally upgrade to Sonnet with a 5-second timeout.

#### API Endpoint

```typescript
// In src/http/routes.ts
POST /api/inline-edit
  Body: InlineEditRequest
  Response: InlineEditResult

POST /api/inline-edit/suggest-commands
  Body: { selectedText: string; fullDocument: string; essayType?: string }
  Response: { command: EditingCommand; reason: string; impact: string }[]
```

#### Files to Create/Modify

| File | Change |
|------|--------|
| `src/services/inlineEditor/types.ts` | **NEW** |
| `src/services/inlineEditor/inlineEditorService.ts` | **NEW** |
| `src/services/inlineEditor/commandPrompts.ts` | **NEW** — Per-command prompt templates |
| `src/services/inlineEditor/index.ts` | **NEW** |
| `src/http/routes.ts` | Add inline-edit endpoints |

**Cost per edit:** ~$0.001 (Haiku)

**Effort:** ~4-5 days

---

## 6. Style Layer / Brand Voice

### Current State

Voice preservation is handled differently in each workshop:
- Common App: `VoiceFingerprint` with emotional registers, banned terms, anti-cliché analyzer
- Activity: Basic chat-level voice (formality/energy/verbosity), expert knowledge base flags "admissions consultant voice"
- PIQ: Quality anchors ("DO NOT CHANGE THESE"), anti-flowery mandate in chat prompt

No unified "style layer" that ensures all outputs across all workshops sound consistent with the student.

### Target: Unified Style Consistency Layer

A middleware-like layer that:
1. Validates all LLM outputs against the student's voice profile before returning
2. Catches voice drift (suggestions that sound too polished, too generic, or too adult)
3. Maintains consistency across workshops (an essay suggestion and an activity description should feel like the same student)

### Implementation Plan

#### New Service: `StyleConsistencyService`

```typescript
// src/services/voiceProfile/styleConsistencyService.ts

export class StyleConsistencyService {
  /**
   * Validate generated text against student's voice profile.
   * Returns the text unchanged if consistent, or a flag + reason if not.
   */
  async validateVoiceConsistency(
    generatedText: string,
    voiceProfile: StudentVoiceProfile,
    context: 'essay_suggestion' | 'description_rewrite' | 'chat_response' | 'teaching'
  ): Promise<{
    isConsistent: boolean;
    issues?: string[];
    suggestedFixes?: string[];
  }>;

  /**
   * Quick heuristic check (no LLM call).
   * Catches obvious voice violations.
   */
  quickVoiceCheck(text: string, profile: StudentVoiceProfile): {
    bannedTermsFound: string[];
    vocabularyMismatch: boolean;
    sentenceLengthDeviation: number;
    formalityMismatch: boolean;
  };

  /**
   * Build a voice constraint block for LLM prompts.
   * Standard format used across all workshops.
   */
  buildVoiceConstraintBlock(profile: StudentVoiceProfile): string;
}
```

#### Integration Pattern

```
Any workshop LLM call that generates student-facing text
    │
    ├──► Add voice constraint block to prompt (pre-generation)
    │    buildVoiceConstraintBlock(profile)
    │
    ├──► Generate text (existing pipeline)
    │
    └──► quickVoiceCheck (post-generation, no LLM cost)
         │
         ├──► Pass → Return to student
         └──► Fail → Log warning, optionally re-generate with stronger constraints
```

The `quickVoiceCheck` is purely heuristic (banned terms, sentence length stats, formality regex) — no additional LLM cost.

#### Files to Create/Modify

| File | Change |
|------|--------|
| `src/services/voiceProfile/styleConsistencyService.ts` | **NEW** |
| All suggestion generation services | Add `buildVoiceConstraintBlock()` to prompts |

**Cost:** Zero additional LLM cost (heuristic checks only in default path)

**Effort:** ~2 days

---

## 7. Anti-AI-Detection & Authenticity

### Current State

- Common App: Banned terms list (tapestry, realm, unwavering, etc.), `SemanticClicheAnalyzer`, essay-mode detection in Stage 0 (`SparkGapAnalysis`)
- Activity: Authenticity scoring (0-100) in analysis, "admissions consultant voice" detection
- PIQ: Anti-pattern flags (`followsTypicalArc`, `hasGenericInsight`, `hasManufacturedBeat`), anti-flowery mandate

No explicit "AI detection risk score" or tool.

### Target: AI-Writing Risk Assessment

A lightweight tool that:
1. Scores text for AI-detection risk (0-100)
2. Highlights specific passages that trigger AI detectors
3. Suggests personalization strategies for flagged passages
4. Runs as an optional post-generation check

### Implementation Plan

#### Heuristic AI-Risk Scorer (No LLM Cost)

```typescript
// src/services/authenticity/aiRiskScorer.ts

export interface AIRiskAssessment {
  overallRisk: number;           // 0-100 (higher = more AI-like)
  riskLevel: 'low' | 'medium' | 'high';
  flaggedPassages: {
    text: string;
    risk: number;
    reason: string;              // "generic reflection", "AI vocabulary cluster", etc.
    suggestion: string;          // How to personalize
  }[];
  metrics: {
    vocabularyUniformity: number;     // AI text has unnaturally uniform vocab
    sentenceLengthVariance: number;   // AI text has low variance
    genericReflectionDensity: number; // Count of "I learned that..." patterns
    bannedTermCount: number;
    clicheDensity: number;
    hedgingDensity: number;          // "somewhat", "perhaps", "it could be argued"
    adverbDensity: number;           // AI overuses adverbs
    firstPersonDensity: number;      // AI essays tend to have uniform first-person
  };
}

export class AIRiskScorer {
  /**
   * Score text for AI-detection risk using heuristics only.
   * No LLM call — runs in < 50ms.
   */
  assess(text: string, voiceProfile?: StudentVoiceProfile): AIRiskAssessment;
}
```

#### Integration

- Run after every suggestion generation (Common App Stage 2, PIQ Phase 17)
- Surface as an optional "Authenticity Check" in the UI
- When risk > 70, automatically trigger personalization suggestions

#### Files to Create/Modify

| File | Change |
|------|--------|
| `src/services/authenticity/aiRiskScorer.ts` | **NEW** |
| `src/services/authenticity/types.ts` | **NEW** |
| `src/services/authenticity/index.ts` | **NEW** |
| `src/http/routes.ts` | Add `/api/authenticity-check` endpoint |

**Cost:** Zero (pure heuristics)

**Effort:** ~2 days

---

## 8. Cost Optimization Strategy

### Current Costs

| Workshop | Cost per Run | Primary Driver |
|----------|-------------|----------------|
| Activity Workshop | ~$0.35-0.40 | Stage 1 parallel Sonnet calls (analysis + scoring) |
| Common App Workshop | ~$0.12-0.16 | Stage 1 semantic scoring + Stage 2 suggestions (both Sonnet) |
| PIQ Workshop | ~$0.15-0.25 (est.) | 4-phase all-Sonnet pipeline |
| **Total per student (est.)** | **~$1.50-3.00** | Multiple essays + activities |

### Cost Optimization Opportunities

#### 1. Aggressive Prompt Caching (saves 30-50%)

**Current state:** Only Common App Stage 1 uses `cacheSystemPrompt: true`. Activity and PIQ do not.

**Action:** Enable prompt caching on every Sonnet call with stable system prompts:

| Service | System Prompt Size | Cache Savings (90% on repeat) |
|---------|-------------------|-------------------------------|
| Activity Stage 1 (expert system prompt) | ~3,000 tokens | ~$0.009/call saved |
| Activity Stage 2 (teaching prompt) | ~2,500 tokens | ~$0.007/call saved |
| Activity Scoring (all 3 calls) | ~2,000 tokens each | ~$0.018 total saved |
| PIQ Phase 17-19 edge functions | ~4,000 tokens | ~$0.012/call saved |
| Common App Stage 2 (batch generation) | ~2,500 tokens | ~$0.007/call saved |

**Estimated total savings per student:** 30-40% reduction (~$0.50-1.00)

**Implementation:**

```typescript
// Pattern: Add cacheSystemPrompt to all Sonnet calls with stable system prompts
const response = await callClaude({
  model: 'claude-sonnet-4-5-20250929',
  systemPrompt: expertSystemPrompt,  // Stable across calls
  userPrompt: perActivityPrompt,     // Variable per call
  cacheSystemPrompt: true,           // <-- Enable caching
  maxTokens: 4096,
});
```

Files to modify:
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage1ContextAwareAnalysisService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/stages/stage2ConditionalTeachingService.ts`
- `src/services/portfolioStrategy/services/activityWorkshop/scoring/scoringOrchestrator.ts`
- `supabase/functions/workshop-analysis/index.ts`
- `supabase/functions/teaching-layer/index.ts`
- `supabase/functions/validate-workshop/index.ts`

**Effort:** ~1 day

#### 2. Model Routing: Haiku for Triage, Sonnet for Quality (saves 15-25%)

**Principle:** Use Haiku for any step where the output is intermediate (not user-facing) or where the task is classification/extraction.

**Already optimal:**
- Activity Stage 0 (Haiku for story detection) ✅
- Activity Stage 3 (Haiku for synthesis) ✅
- Common App Stage 1 quick triage (optional Haiku) ✅

**Opportunities:**
- PIQ Phase 18 (validate-workshop): Currently Sonnet. Validation is classification — Haiku would suffice with structured rubric. **Saves ~$0.02/essay**
- Activity scoring description scoring: Currently all 3 calls use Sonnet. Description scoring could use Haiku with rubric injection. **Saves ~$0.01/portfolio**

**Conservative estimate:** 15-20% additional savings

**Effort:** ~1 day

#### 3. Token Reduction in Prompts (saves 10-15%)

**Current issue:** Several prompts include full knowledge bases and research data regardless of relevance.

**Action:** Implement dynamic prompt assembly that only includes relevant knowledge:

```typescript
// Instead of: always include ALL expert knowledge
// Do: include only knowledge relevant to this activity's category/tier
const relevantKnowledge = knowledgeBase.getRelevant({
  category: activity.detectedCategory,
  tier: activity.classification.tier,
  issues: activity.redFlags.map(f => f.flag),
});
```

**Files to modify:**
- `src/services/portfolioStrategy/services/activityWorkshop/knowledgeAssemblyService.ts`
- `src/services/commonAppWorkshop/services/contextEnrichmentService.ts`

**Effort:** ~2 days

#### 4. Incremental Analysis (saves 40-60% on repeat runs)

**Current state:** Activity Workshop has `scoringSessionId` for incremental scoring (cache by content hash). Common App and PIQ re-analyze from scratch every time.

**Action:** Extend content-hash caching to Common App and PIQ:
- Cache dimension scores by essay content hash
- Only re-analyze if essay text changes by > 10%
- Cache voice fingerprint indefinitely (voice doesn't change between edits)

**Effort:** ~3 days

#### 5. Batching Across Workshops (future optimization)

When a student has multiple essays being analyzed, batch system prompt caching across the session:
- Load college research once, cache for all essays targeting that college
- Load voice profile once, cache for all workshops
- Sequence calls to maximize cache hits (same college essays back-to-back)

#### Cost Projection After Optimization

| Workshop | Current | After Optimization | Savings |
|----------|---------|-------------------|---------|
| Activity Workshop | $0.35-0.40 | $0.18-0.25 | ~40% |
| Common App Workshop | $0.12-0.16 | $0.07-0.10 | ~35% |
| PIQ Workshop | $0.15-0.25 | $0.08-0.14 | ~40% |
| **Per student (est.)** | **$1.50-3.00** | **$0.80-1.60** | **~45%** |
| Inline edits (new) | N/A | $0.001/edit | Negligible |

---

## 9. Document-Context Awareness

### Current State

- Common App: Full essay visible during analysis, holistic context maintained across stages
- PIQ Chat: Full draft injected into every chat turn
- Activity: Full portfolio visible during analysis, but descriptions are short (150 chars)
- No real-time awareness — all analysis is batch, not interactive

### Target: Real-Time Document-Context Awareness

When a student is editing their essay in the UI:
1. The LLM always has access to the full current document state
2. Inline edits are aware of surrounding context
3. Suggestions don't contradict what's elsewhere in the essay
4. Structural advice considers the whole essay arc

### Implementation Plan

This is primarily achieved through the **Inline Editor** (Section 5) + **Session Context Manager**:

#### Session Context Manager

```typescript
// src/services/sessionContext/sessionContextService.ts

export interface DocumentSession {
  sessionId: string;
  userId: string;
  documentType: 'essay' | 'piq' | 'activity_description';
  currentText: string;
  essayType?: string;
  promptText?: string;
  collegeId?: string;
  voiceProfile?: StudentVoiceProfile;

  // Cached analysis (invalidated on text change)
  lastAnalysis?: {
    timestamp: string;
    textHash: string;
    scores: Record<string, number>;
    topIssues: string[];
  };

  // Edit history for this session
  editHistory: {
    timestamp: string;
    command: EditingCommand;
    original: string;
    replacement: string;
    accepted: boolean;
  }[];
}

export class SessionContextService {
  /** Create or resume a document editing session */
  async startSession(input: StartSessionInput): Promise<DocumentSession>;

  /** Update document text (triggers cache invalidation if changed) */
  async updateDocument(sessionId: string, newText: string): Promise<void>;

  /** Get context-aware prompt block for any LLM call */
  getDocumentContextBlock(session: DocumentSession): string;

  /** Record an edit (accepted or rejected) */
  async recordEdit(sessionId: string, edit: EditRecord): Promise<void>;
}
```

The `getDocumentContextBlock()` method produces a compact context block (~200-300 tokens) that any LLM call can include:

```
DOCUMENT CONTEXT:
Type: Why Us essay (Stanford)
Length: 487/650 words
Voice: Energetic enthusiasm, casual, high energy
Current scores: Specificity 7/10, Fit 5/10, Voice 8/10
Top issues: Fit demonstration needs specific program references
Recent edits: 2 accepted (added Stanford HAI reference, added specific professor)
```

#### Files to Create/Modify

| File | Change |
|------|--------|
| `src/services/sessionContext/types.ts` | **NEW** |
| `src/services/sessionContext/sessionContextService.ts` | **NEW** |
| `src/services/sessionContext/index.ts` | **NEW** |
| `src/services/inlineEditor/inlineEditorService.ts` | Use session context in edit prompts |

**Cost:** Zero additional LLM cost (context block is compact)

**Effort:** ~2-3 days

---

## 10. Feedback Loops & Analytics

### Current State

- PIQ: `VersionHistory` type with NQI delta tracking (partially implemented)
- Activity: `NarrativeProgression` type for before/after comparison (partially implemented)
- Common App: `TeachingHistory` tracks what was taught (no outcome tracking)
- No system-wide edit tracking, no suggestion acceptance rates, no prompt refinement pipeline

### Target: Comprehensive Analytics System

Track what works, what doesn't, and continuously improve:

1. **Suggestion acceptance tracking** — which suggestions do students actually use?
2. **Score progression** — how do scores change after applying suggestions?
3. **Prompt effectiveness** — which prompt patterns produce the best outcomes?
4. **Student behavior patterns** — which editing commands are most used?

### Implementation Plan

#### Database Schema

```sql
-- supabase/migrations/XXX_add_analytics.sql

CREATE TABLE writing_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(clerk_id),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'suggestion_shown', 'suggestion_accepted', 'suggestion_rejected',
                             -- 'score_change', 'inline_edit', 'command_used'
  event_data JSONB NOT NULL, -- Flexible event payload
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analytics_user ON writing_analytics(user_id);
CREATE INDEX idx_analytics_type ON writing_analytics(event_type);
CREATE INDEX idx_analytics_session ON writing_analytics(session_id);

-- Aggregated prompt effectiveness (updated by batch job)
CREATE TABLE prompt_effectiveness (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_hash TEXT NOT NULL UNIQUE,
  prompt_type TEXT,          -- 'suggestion', 'inline_edit', 'teaching'
  workshop TEXT,             -- 'common_app', 'piq', 'activity'
  total_shown INTEGER DEFAULT 0,
  total_accepted INTEGER DEFAULT 0,
  avg_score_improvement FLOAT,
  avg_satisfaction FLOAT,    -- If we add ratings
  last_updated TIMESTAMPTZ DEFAULT now()
);
```

#### Analytics Service

```typescript
// src/services/analytics/writingAnalyticsService.ts

export class WritingAnalyticsService {
  async trackSuggestionShown(sessionId: string, suggestionId: string, data: SuggestionData): Promise<void>;
  async trackSuggestionAccepted(sessionId: string, suggestionId: string): Promise<void>;
  async trackSuggestionRejected(sessionId: string, suggestionId: string): Promise<void>;
  async trackScoreChange(sessionId: string, before: number, after: number, dimension?: string): Promise<void>;
  async trackInlineEdit(sessionId: string, command: EditingCommand, accepted: boolean): Promise<void>;

  // Aggregation queries
  async getAcceptanceRate(workshop: string, timeRange?: DateRange): Promise<number>;
  async getMostUsedCommands(timeRange?: DateRange): Promise<{ command: string; count: number }[]>;
  async getAverageScoreImprovement(workshop: string): Promise<number>;

  // Prompt refinement data
  async getPromptEffectiveness(promptHash: string): Promise<PromptEffectiveness>;
}
```

#### Version Comparison

```typescript
// src/services/analytics/versionComparisonService.ts

export class VersionComparisonService {
  /**
   * Compare two versions of an essay and show improvements.
   * Uses cached analysis scores — no additional LLM cost.
   */
  async compareVersions(
    sessionId: string,
    oldTextHash: string,
    newTextHash: string
  ): Promise<VersionComparison>;
}

export interface VersionComparison {
  scoreDelta: Record<string, number>;  // Per-dimension score changes
  overallDelta: number;
  improvements: string[];              // What got better
  regressions: string[];               // What got worse (if any)
  unchanged: string[];                 // What stayed the same
  editCount: number;
  mostImpactfulEdit: string;           // Which edit helped most
}
```

#### Files to Create/Modify

| File | Change |
|------|--------|
| `src/services/analytics/types.ts` | **NEW** |
| `src/services/analytics/writingAnalyticsService.ts` | **NEW** |
| `src/services/analytics/versionComparisonService.ts` | **NEW** |
| `src/services/analytics/index.ts` | **NEW** |
| `supabase/migrations/XXX_add_analytics.sql` | **NEW** |
| `src/http/routes.ts` | Add analytics endpoints |

**Cost:** Zero (analytics are pure database operations)

**Effort:** ~3-4 days

---

## 11. Implementation Phases

### Phase 0: Foundation & Fixes (Week 1) — Effort: ~3 days

**Goal:** Fix existing issues that affect quality baseline.

| Task | Files | Effort |
|------|-------|--------|
| Fix model ID inconsistency: Update all `claude-sonnet-4-5-20250514` to `claude-sonnet-4-5-20250929` | `techniqueSuggestionRouter.ts`, `batchGenerationService.ts`, `stage0Service.ts`, `stage1ConsolidatedService.ts`, PIQ edge functions | 0.5 day |
| Enable prompt caching on all Sonnet calls with stable system prompts | Stage 1/2 services (Activity + Common App) + PIQ edge functions | 1 day |
| Complete PIQ teaching examples for remaining 9 dimensions (Voice, Reflection, Identity, Craft, Coherence, etc.) | `src/services/piq/teachingExamples.ts` | 1.5 days |

**Impact:** Immediate quality + cost improvement. ~30% cost reduction from caching alone.

### Phase 1: Unified Voice System (Week 2) — Effort: ~5 days

**Goal:** Single voice profile that works across all workshops.

| Task | Files | Effort |
|------|-------|--------|
| Create `StudentVoiceProfile` type + `VoiceProfileService` | `src/services/voiceProfile/` (NEW) | 1.5 days |
| Database migration for voice_profiles table | `supabase/migrations/` | 0.5 day |
| Integrate into Common App (load profile, skip excavation if confident, inject into Stage 2) | `evolvedWorkshopOrchestrator.ts`, `batchGenerationService.ts` | 1 day |
| Integrate into Activity (inject into Stage 2, initialize chat from profile) | `activityWorkshopService.ts`, `dynamicConversationEngine.ts` | 1 day |
| Integrate into PIQ (inject into chat context) | `piqChatContext.ts` | 0.5 day |
| Build `StyleConsistencyService` with heuristic voice checks | `src/services/voiceProfile/styleConsistencyService.ts` (NEW) | 0.5 day |

**Impact:** All workshops produce voice-consistent output. Reduces voice drift across essays.

### Phase 2: Inline Editing System (Weeks 3-4) — Effort: ~7 days

**Goal:** Type.ai-level inline editing experience.

| Task | Files | Effort |
|------|-------|--------|
| Create `InlineEditorService` with 15 editing commands | `src/services/inlineEditor/` (NEW) | 3 days |
| Create `SessionContextService` for document-context awareness | `src/services/sessionContext/` (NEW) | 2 days |
| API endpoints for inline editing | `src/http/routes.ts` | 0.5 day |
| Create `AIRiskScorer` (heuristic authenticity check) | `src/services/authenticity/` (NEW) | 1.5 days |

**Impact:** Largest user-facing improvement. Transforms from batch analysis tool to real-time writing coach.

### Phase 3: RAG + Story Mining (Weeks 5-6) — Effort: ~10 days

**Goal:** Teaching backed by real examples; dedicated brainstorming flow.

| Task | Files | Effort |
|------|-------|--------|
| pgvector schema + RAG service | `src/services/rag/` (NEW), migration | 3 days |
| Content migration (existing static data → pgvector) | `src/services/rag/ragSeeder.ts` (NEW) | 2 days |
| Integrate RAG into Common App Stage 2 suggestions | `batchGenerationService.ts` | 1 day |
| Integrate RAG into PIQ teaching | `piqChatContext.ts`, edge functions | 1 day |
| Story Mining service | `src/services/storyMining/` (NEW) | 3 days |

**Impact:** Teaching quality jumps — students see real examples instead of generic advice. Story mining fills a critical workflow gap.

### Phase 4: Analytics & Continuous Improvement (Weeks 7-8) — Effort: ~6 days

**Goal:** Track what works and continuously improve.

| Task | Files | Effort |
|------|-------|--------|
| Analytics schema + service | `src/services/analytics/` (NEW), migration | 2 days |
| Version comparison service | `src/services/analytics/versionComparisonService.ts` | 1 day |
| Integrate tracking into all suggestion/editing flows | All workshop services | 2 days |
| Dashboard API endpoints | `src/http/routes.ts` | 1 day |

**Impact:** Enables data-driven prompt refinement. Measures actual improvement in student writing quality.

### Timeline Summary

```
Week 1:  [Phase 0] Foundation & Fixes (model IDs, caching, PIQ examples)
Week 2:  [Phase 1] Unified Voice System
Week 3:  [Phase 2] Inline Editing (commands + service)
Week 4:  [Phase 2] Inline Editing (session context + authenticity)
Week 5:  [Phase 3] RAG Layer (schema + service + migration)
Week 6:  [Phase 3] Story Mining Engine
Week 7:  [Phase 4] Analytics (schema + tracking)
Week 8:  [Phase 4] Analytics (version comparison + dashboard)
```

**Total estimated effort:** ~31 days of focused development

---

## 12. Technical Specifications

### Spec 1: Unified Voice Profile

**Type interface:** See Section 2 (`StudentVoiceProfile`)

**Prompt template for voice profiling (Haiku):**
```
System: You are a writing style analyst. Analyze the writing sample and produce a voice profile.

Extract:
1. Emotional register (one of: energetic_enthusiasm, quiet_intensity, melancholy_loss, defiant_irreverent, wonder_curiosity, warmth_connection)
2. Vocabulary level (sophisticated/clear/simple)
3. Formality (formal/semi-formal/casual)
4. Sentence patterns: average length, variety (1-10), fragment use, natural feel
5. Signature words (5-10 words/phrases this person naturally uses)
6. Energy level (high/medium/low)
7. Humor frequency (frequent/occasional/rare)
8. Directness (very_direct/moderate/circumspect)
9. Authentic phrases to preserve (3-5 exact quotes)

Output as JSON matching StudentVoiceProfile schema.
```

**Model:** `claude-haiku-4-5-20251001`
**Max tokens:** 800
**Temperature:** 0.2
**Estimated input:** ~1200 tokens (system + sample)
**Estimated output:** ~400 tokens
**Cost:** ~$0.002

---

### Spec 2: Inline Editing Command Prompt (per command)

**Example: `show_dont_tell`**

```
System: You are a college essay writing coach specializing in "show, don't tell" technique.

VOICE PROFILE:
{voice_constraint_block}

YOUR TASK:
Transform the selected passage from TELLING (stating conclusions) to SHOWING (using scenes, dialogue, sensory details, or actions that let the reader draw the conclusion).

RULES:
- Generate exactly 2 alternatives:
  "primary": Safe, minimal change — converts the most obvious telling to showing
  "creative": Bolder — reimagines the passage as a vivid scene or moment
- Both MUST match the student's voice profile above
- Both MUST fit naturally with the surrounding context
- Do NOT change the factual content, only the presentation
- Do NOT use banned terms: {BANNED_LIST}
- Explain what changed and why (one sentence each)
- State one transferable "show don't tell" principle

RELEVANT EXAMPLES:
{rag_examples}

Respond as JSON: { primary: { text, explanation }, creative: { text, explanation }, teachingNote, principle }
```

**Model:** `claude-haiku-4-5-20251001`
**Max tokens:** 500
**Temperature:** 0.5
**Cost:** ~$0.001

---

### Spec 3: RAG Retrieval Query

```typescript
// Retrieve examples for a "show don't tell" edit on a why_us essay
const examples = await ragService.retrieveExamples({
  queryText: selectedText,
  essayType: 'supplemental',
  promptType: 'why_us',
  dimension: 'specificity_evidence',
  qualityTier: 'excellent',
  limit: 3,
});

// Format for prompt injection
const ragBlock = ragService.formatForPrompt(examples, 300); // max 300 tokens
// Output:
// "RELEVANT EXAMPLES (patterns only, do not copy language):
//  1. [Stanford why_us, leadership angle] This excerpt shows specificity through
//     naming exact programs and connecting personal experience...
//  2. [Harvard why_us, research angle] This excerpt demonstrates fit through
//     citing specific faculty work and tying to student's project..."
```

---

### Spec 4: AI Risk Scorer Heuristics

```typescript
// Key heuristic signals for AI-generated text
const AI_SIGNALS = {
  // Vocabulary uniformity: AI text uses 15-20% fewer unique words
  vocabularyUniformity: (text: string) => {
    const words = text.toLowerCase().split(/\s+/);
    const uniqueRatio = new Set(words).size / words.length;
    return uniqueRatio < 0.55 ? 'high_risk' : uniqueRatio < 0.65 ? 'medium_risk' : 'low_risk';
  },

  // Sentence length variance: AI text has lower std dev
  sentenceLengthVariance: (text: string) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + (b - mean) ** 2, 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    return stdDev < 4 ? 'high_risk' : stdDev < 7 ? 'medium_risk' : 'low_risk';
  },

  // Generic reflection patterns
  genericReflections: (text: string) => {
    const patterns = [
      /I (learned|realized|discovered) that/gi,
      /This (experience|journey|challenge) taught me/gi,
      /It (made me realize|opened my eyes|changed my perspective)/gi,
      /I (grew|developed|evolved) as a (person|leader|thinker)/gi,
      /Looking back,? I/gi,
    ];
    return patterns.reduce((count, p) => count + (text.match(p)?.length || 0), 0);
  },

  // Hedging language density
  hedgingDensity: (text: string) => {
    const hedges = ['somewhat', 'perhaps', 'arguably', 'it could be said',
                    'in many ways', 'to some extent', 'in a sense'];
    const words = text.toLowerCase().split(/\s+/);
    return hedges.reduce((count, h) => count + (text.toLowerCase().includes(h) ? 1 : 0), 0) / words.length * 1000;
  },
};
```

---

### Spec 5: Story Mining LLM Call

**Model:** Haiku for extraction, Sonnet for ranking

**Extraction prompt (Haiku):**
```
System: You are a story mining specialist for college application essays.

Given these activity profiles, extract specific MOMENTS — not summaries, not themes, but concrete instants in time where something happened, shifted, or mattered.

For each moment, capture:
- The specific instant (what happened)
- The emotional core (what was felt)
- What makes it distinctive (why this student, not any student)
- Which activities it connects to

Activities:
{formatted_activity_profiles}

Extract 8-12 story moments. Output as JSON array.
```

**Ranking prompt (Sonnet):**
```
System: You are a college admissions essay strategist.

Rank these story moments for the target prompt. Score each on:
1. Distinctiveness (0-100): Would an admissions officer remember this?
2. Reflection depth (0-100): How much growth/insight can the student mine?
3. Prompt fit (0-100): How well does this address what the prompt asks?

Target prompt: {prompt_text}
Student voice: {voice_summary}

Story moments:
{formatted_moments}

For each, also suggest 2 narrative angles and identify the best opening line from the student's own words.
```

---

### Model Selection Summary (All New Features)

| Feature | Model | Rationale | Cost/Call |
|---------|-------|-----------|-----------|
| Voice profiling | Haiku | Classification task, speed important | $0.002 |
| Voice enrichment | Haiku | Incremental update, not creative | $0.001 |
| Style consistency check | Heuristic | No LLM needed | $0 |
| Inline editing (simple commands) | Haiku | Speed critical (< 3s), output is short | $0.001 |
| Inline editing (complex commands) | Sonnet (timeout 5s) | Deeper reasoning needed | $0.005 |
| RAG embedding | text-embedding-3-small | Cheap, fast, good quality | $0.0001 |
| RAG retrieval | pgvector query | No LLM needed | $0 |
| Story mining extraction | Haiku | Pattern extraction, speed | $0.005 |
| Story mining ranking | Sonnet | Quality judgment needed | $0.03 |
| AI risk scoring | Heuristic | No LLM needed | $0 |
| Analytics | Database | No LLM needed | $0 |

---

## Appendix A: Files Index

### New Files to Create

```
src/services/voiceProfile/
  types.ts
  voiceProfileService.ts
  styleConsistencyService.ts
  index.ts

src/services/inlineEditor/
  types.ts
  inlineEditorService.ts
  commandPrompts.ts
  index.ts

src/services/sessionContext/
  types.ts
  sessionContextService.ts
  index.ts

src/services/rag/
  types.ts
  ragService.ts
  ragSeeder.ts
  index.ts

src/services/storyMining/
  types.ts
  storyMiningService.ts
  index.ts

src/services/authenticity/
  types.ts
  aiRiskScorer.ts
  index.ts

src/services/analytics/
  types.ts
  writingAnalyticsService.ts
  versionComparisonService.ts
  index.ts

supabase/migrations/
  XXX_add_voice_profiles.sql
  XXX_add_rag_embeddings.sql
  XXX_add_analytics.sql
```

### Existing Files to Modify

```
src/http/routes.ts                                    — New API endpoints
src/services/commonAppWorkshop/services/
  evolvedWorkshopOrchestrator.ts                      — Voice profile integration
  batchGenerationService.ts                           — Voice + RAG context
  techniqueSuggestionRouter.ts                        — Model ID fix
  stage0Service.ts                                    — Voice profile pre-population
  stage1ConsolidatedService.ts                        — Prompt caching
src/services/portfolioStrategy/services/activityWorkshop/
  activityWorkshopService.ts                          — Voice profile integration
  stages/stage1ContextAwareAnalysisService.ts         — Prompt caching
  stages/stage2ConditionalTeachingService.ts          — Voice + RAG context
  scoring/scoringOrchestrator.ts                      — Prompt caching
  chat/dynamicConversationEngine.ts                   — Voice profile init
src/services/piqWorkshop/
  piqChatContext.ts                                   — Voice profile + RAG
src/services/piq/
  teachingExamples.ts                                 — Complete remaining 9 dimensions
supabase/functions/
  workshop-analysis/index.ts                          — Model ID fix + caching
  teaching-layer/index.ts                             — Prompt caching
  validate-workshop/index.ts                          — Model routing (Haiku)
  piq-chat/index.ts                                   — Model ID fix
```

---

## Appendix B: Competitive Positioning

### What Makes Uplift Potentially BETTER Than Type.ai

1. **Domain expertise:** Type.ai is a general writing tool. Uplift's rubrics, college-specific research, admissions knowledge bases, and prompt-specific weights are custom-built for college essays. A general tool cannot compete with `TECHNIQUE_PRIORITIES_BY_TYPE` or `PROMPT_REGISTER_MAPPINGS`.

2. **Teaching over ghostwriting:** Type.ai is an editor; Uplift is a coach. The teaching philosophy (celebration first → explain → transform → practice) is pedagogically superior for students who need to learn, not just produce.

3. **Multi-dimensional scoring:** 12-13 dimension rubrics with per-prompt weighting is far more sophisticated than a single "writing quality" score.

4. **Authenticity protection:** The voice fingerprinting, banned terms, anti-cliché analysis, and essay-mode detection are specifically designed to prevent AI-sounding output — a critical concern for college admissions.

5. **Cost efficiency:** With prompt caching, model routing, and incremental analysis, Uplift can deliver higher quality at ~$0.001-0.005 per inline edit vs. Type.ai's subscription model.

### What Type.ai Does Better (for now)

1. **Real-time editing experience** — Phase 2 (Inline Editing) closes this gap
2. **Persistent voice profiles** — Phase 1 (Unified Voice) closes this gap
3. **Example-backed teaching** — Phase 3 (RAG) closes this gap
4. **Edit tracking and versioning** — Phase 4 (Analytics) closes this gap

After implementing all 4 phases, Uplift should exceed Type.ai's writing quality for college essays while being significantly more cost-effective.

---

*This roadmap was generated from comprehensive analysis of all three writing workshop systems (Activity Workshop, PIQ Workshop, Common App Workshop), the type.ai technical analysis, and the existing LLM integration layer.*
