# Uplift Technical Architecture
### Complete System Reference for Technical Leadership

> Last updated: March 2026 | 920+ TypeScript files | 33 test suites | 39 DB migrations

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Request Lifecycle](#2-request-lifecycle)
3. [The Engine Systems](#3-the-engine-systems)
   - 3.1 [Essay Intelligence (V2)](#31-essay-intelligence-v2--the-understanding-engine)
   - 3.2 [Activity Analysis (11-Dimension Rubric)](#32-activity-analysis--11-dimension-rubric-engine)
   - 3.3 [Common App Workshop](#33-common-app-workshop)
   - 3.4 [Narrative Workshop](#34-narrative-workshop)
   - 3.5 [Activity Workshop](#35-activity-workshop)
   - 3.6 [Academic Workshop](#36-academic-workshop)
   - 3.7 [PIQ Workshop](#37-piq-workshop)
   - 3.8 [Enhanced Writing Workshop](#38-enhanced-writing-workshop)
4. [Cross-Cutting Infrastructure](#4-cross-cutting-infrastructure)
   - 4.1 [Authentication (Clerk)](#41-authentication-clerk)
   - 4.2 [Credit & Billing (Stripe)](#42-credit--billing-stripe)
   - 4.3 [LLM Abstraction Layer](#43-llm-abstraction-layer)
   - 4.4 [Security & Fraud Prevention](#44-security--fraud-prevention)
5. [Data Layer](#5-data-layer)
6. [Frontend Architecture](#6-frontend-architecture)
7. [System Interconnection Map](#7-system-interconnection-map)
8. [Cost Model](#8-cost-model)
9. [API Endpoint Inventory](#9-api-endpoint-inventory)

---

## 1. System Overview

### What Uplift Does

AI-powered college application platform that deeply understands student essays and activities, then teaches students how to improve through multi-stage coaching pipelines. Key differentiator: we don't just score, we *understand* first, then *analyze*, then *teach*.

### Architecture at a Glance

```
                                    ┌──────────────────────┐
                                    │   React 18 / Vite    │
                                    │   shadcn/ui + TW     │
                                    │   Clerk Auth (FE)    │
                                    └──────────┬───────────┘
                                               │ HTTPS
                                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Express.js API (port 8789)                       │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Auth MW   │  │ Security MW  │  │ CORS/JSON │  │ Circuit Breaker│  │
│  │ (Clerk)   │  │ (Sanitize)   │  │ (Compress)│  │ (Enhanced WS) │  │
│  └─────┬─────┘  └──────┬───────┘  └─────┬────┘  └───────┬────────┘  │
│        └───────────────┼────────────────┼────────────────┘           │
│                        ▼                                             │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │                    ROUTE DISPATCH                        │        │
│  │  /analyze-entry  /enhanced/*  /activity-chat/*          │        │
│  │  /analyze-academics  /api/v1/annotate/*  /billing/*     │        │
│  │  /webhooks/clerk  /webhooks/stripe  /referrals/*        │        │
│  └────────────────────────┬────────────────────────────────┘        │
│                           ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │                   SERVICE LAYER                          │        │
│  │                                                          │        │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐  │        │
│  │  │ Essay            │  │ Activity Analysis            │  │        │
│  │  │ Intelligence V2  │  │ (11-dim rubric + scoring     │  │        │
│  │  │ (8-layer         │  │  science calibration)        │  │        │
│  │  │  understanding)  │  │                              │  │        │
│  │  └─────────────────┘  └──────────────────────────────┘  │        │
│  │                                                          │        │
│  │  ┌─────────────┐ ┌──────────────┐ ┌────────────────┐   │        │
│  │  │ Common App   │ │ Narrative    │ │ Activity       │   │        │
│  │  │ Workshop     │ │ Workshop     │ │ Workshop       │   │        │
│  │  │ (3-stage)    │ │ (5-stage)    │ │ (4-stage)      │   │        │
│  │  └─────────────┘ └──────────────┘ └────────────────┘   │        │
│  │                                                          │        │
│  │  ┌─────────────┐ ┌──────────────┐ ┌────────────────┐   │        │
│  │  │ Academic     │ │ PIQ          │ │ Enhanced       │   │        │
│  │  │ Workshop     │ │ Workshop     │ │ Writing WS     │   │        │
│  │  │ (6-layer)    │ │ (13-dim)     │ │ (voice/inline) │   │        │
│  │  └─────────────┘ └──────────────┘ └────────────────┘   │        │
│  │                                                          │        │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌─────────┐ │        │
│  │  │ Credits  │ │ Voice    │ │ Story      │ │ RAG     │ │        │
│  │  │ Service  │ │ Profile  │ │ Mining     │ │ Search  │ │        │
│  │  └──────────┘ └──────────┘ └────────────┘ └─────────┘ │        │
│  └─────────────────────────────────────────────────────────┘        │
│                           │                                          │
│                           ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │                   LLM LAYER                              │        │
│  │  claude.ts (Anthropic SDK) + unified.ts (dual-model)    │        │
│  │  Sonnet 4.5: quality/teaching    Haiku 4.5: speed/triage│        │
│  │  Prompt caching | JSON mode | Token tracking             │        │
│  └─────────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Supabase PostgreSQL   │
              │  + RLS (Clerk JWT)     │
              │  + Edge Functions      │
              │  39 migrations         │
              └────────────────────────┘
```

### Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18, Vite, TypeScript strict, shadcn/ui, Tailwind CSS | SPA, React Query (5min stale, 30min GC) |
| Backend | Express.js (port 8789), TypeScript strict | Lazy service imports, compression, CORS |
| Database | Supabase PostgreSQL with RLS | TEXT user_ids (Clerk), JSONB for analysis data |
| Auth | Clerk | JWT → Supabase RLS via `auth.jwt()->> 'sub'` |
| AI | Anthropic Claude (Sonnet 4.5 + Haiku 4.5) | Prompt caching, JSON mode, token tracking |
| Payments | Stripe | Checkout sessions, webhook-driven credit grants |
| Fraud | Custom device fingerprinting | Canvas/WebGL/Audio hashing, zero-tolerance |

---

## 2. Request Lifecycle

### Typical Authenticated Request

```
1. Browser sends HTTPS request
   Headers: { Authorization: "Bearer <clerk-jwt>" }

2. Express middleware chain:
   compression() → CORS → JSON parsing → Cache-Control headers

3. Route matching: /api/v1/* or /api/*

4. requireAuth middleware:
   - Extract JWT from Authorization header
   - Verify signature via Clerk SDK (production) or decode-only (dev)
   - Validate Clerk user ID format (user_XXXX)
   - Attach req.auth = { userId, claims }
   - Log security event

5. Route handler:
   - Access req.auth.userId
   - Check fraud status: is_user_banned(userId)
   - Check credits: hasEnoughCredits(userId, amount)
   - Deduct credits atomically
   - Call service layer (Essay Intelligence, Workshop, etc.)
   - Return ApiResponse<T> { success, data?, error? }

6. Service layer:
   - Assemble prompt from templates + user data
   - Call Claude via src/lib/llm/claude.ts
   - Parse structured JSON response
   - Store results in Supabase
   - Return typed result
```

### Webhook Flow (Clerk / Stripe)

```
1. External service sends POST to webhook endpoint
2. No auth middleware (webhooks self-authenticate)
3. Signature verification:
   - Clerk: Svix headers (svix-id, svix-timestamp, svix-signature)
   - Stripe: stripe-signature header + raw body
4. Process event idempotently
5. Always return 200 OK (prevent retries)
```

---

## 3. The Engine Systems

### 3.1 Essay Intelligence V2 — The Understanding Engine

**Path**: `src/services/essayIntelligence/` (~80 files)

This is the crown jewel. An 8-layer sequential pipeline that first *understands* an essay deeply, then *analyzes* it, then *teaches* from that understanding. The key architectural insight: **separate understanding from judgment**.

#### Pipeline Overview

```
Essay Text
    │
    ▼
┌─ L1: First Impressions (Haiku, parallel, ~$0.02) ──────────────────┐
│  Purely descriptive observations. NO evaluation.                     │
│  Per-paragraph: purpose, emotional register, voice, craft notices    │
│  Per-sentence: rhetorical function, tone, notable elements           │
│  Output: ParagraphFirstImpression[] + initial ProfileIndex           │
└──────────────────────────────────────────────────────────────────────┘
    │
    ▼ (feeds L2 and L2.5 in PARALLEL)
┌─ L2: Structural Cartography (Sonnet, single call, ~$0.08) ─────────┐
│  Architecture mapping. Paragraph roles, narrative arc type,          │
│  transition quality, central theme, pacing, flat spots.              │
│  Arc types: man_in_hole | cinderella | icarus | quest | rags_to_riches │
│  Output: StructuralCartography                                       │
└──────────────────────────────────────────────────────────────────────┘
    │                    ┌─ L2.5: Connection Scout (Haiku, ~$0.02) ───┐
    │                    │  "Metal detector" — finds leads, not        │
    │                    │  conclusions. Repeated elements, tonal      │
    │                    │  shifts, structural echoes.                  │
    │                    │  Output: ConnectionScoutOutput               │
    │                    └─────────────────────────────────────────────┘
    ▼                                    │
┌─ L3: Sequential Deep Walk (Sonnet, sequential per-paragraph, ~$0.40) ┐
│  THE CORE. Walks paragraph by paragraph, building understanding.      │
│  Each paragraph call sees:                                            │
│    - Adjacent paragraphs: full understanding                          │
│    - Earlier paragraphs: digests (via ProfileRouter)                  │
│    - Connected paragraphs: full understanding (via ConnectionGraph)   │
│  Produces per-paragraph:                                              │
│    - inferredRole, primaryClaim, emotionalRegister, voiceAuthenticity │
│    - Per-sentence: function, significance, craft                      │
│    - Findings (1-5): claims with maturity lifecycle                   │
│    - holisticEvolution: 4-field accumulator (thesis, voice, arc)      │
│    - Back-propagation: later paragraphs UPDATE earlier understanding  │
│  Supersession rule: arrays REPLACED (never appended)                  │
│  System prompt CACHED across all paragraph calls                      │
│  Output: L3WalkResult (paragraph + sentence understanding)            │
└───────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─ L3.75: Holistic Synthesis (Sonnet, single call, ~$0.12) ───────────┐
│  Reads ALL sentence-level understanding simultaneously.               │
│  Two-phase execution (A: voice+earnedness, B: theme+narrative)        │
│  Produces 10 holistic sections:                                       │
│    1. VoiceIdentity (signature, authentic moments, risks)             │
│    2. VoiceMap (5 dimensions tracked per paragraph)                   │
│    3. EmotionalTopography (arc, depth, earned-ness per paragraph)     │
│    4. MomentEarnednessMap (setup + payoff verification)               │
│    5. ThematicArchitecture (threads, gaps, tensions)                  │
│    6. NarrativeStrategy (approach, turns, climax, resolution)         │
│    7. CharacterRevelation (values, conflicts, growth)                 │
│    8. CraftAssessment (rhythm, imagery, dialogue)                     │
│    9. CrossDimensionEntanglements (voice×emotion, theme×narrative)    │
│   10. AdmissionsPositioning (AO memory, distinctiveness)              │
│  Output: HolisticSynthesisOutput                                      │
└───────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─ L3.5: Analysis Pass (Sonnet, parallel per-paragraph, ~$0.25) ──────┐
│  NOW we judge. Sees complete understanding + holistic synthesis.       │
│  Per-sentence: effectivenessScore (0-100), strengths, weaknesses      │
│  Per-paragraph: effectiveness, structural role, suggested revisions   │
│  ImprovementPhase computed: Foundation→Architecture→Craft→Polish→     │
│  Distinction                                                          │
│  Key separation: L3 sees WHAT IS. L3.5 sees HOW WELL.                │
│  Output: L35AnalysisResult + ImprovementPhase                         │
└───────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─ L4: Crystallization (Sonnet, single call, ~$0.08) ─────────────────┐
│  North Star: emergent interpretation (not lossy compression)          │
│    - Scaled by essay type (supplement=2dim, PIQ=3dim, PS=5dim)        │
│    - distinctivenessSignature, trajectory, throughLineMap, intentBridge│
│  ParagraphScoreMatrix: multi-dimensional per-paragraph scoring        │
│    - 5 dimensions: effectiveness, structural, voice, emotional,       │
│      thematic                                                         │
│    - strengthClusters, weaknessClusters, improvementPriorities        │
│  CoherenceReport: cross-domain contradictions                         │
│  Output: EssayNorthStar + ParagraphScoreMatrix + CoherenceReport      │
└───────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─ L5: Deep Annotation (Sonnet, parallel per-paragraph, ~$0.15) ──────┐
│  EPHEMERAL feedback — generated fresh, never stored.                  │
│  Phase-aware zoom:                                                    │
│    Foundation: 3-5 essay-level structural issues                      │
│    Architecture: paragraph-level                                      │
│    Craft: sentence-level craft improvements                           │
│    Polish: nuanced refinements                                        │
│    Distinction: advanced techniques                                   │
│  Each annotation: observation + consequence (via North Star) +        │
│  suggestion                                                           │
│  Output: L5Annotation[] (sent to user, not persisted)                 │
└───────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─ L6: Coaching Service (Haiku classifier + Sonnet responder) ─────────┐
│  5-stage per-turn pipeline:                                           │
│    Stage 1: Haiku classifies message type + extracts focus (~$0.001)  │
│    Stage 2: ProfileRouter assembles context (no LLM)                  │
│    Stage 3: Sonnet generates grounded coaching response (~$0.08)      │
│    Stage 4: Conditional profile deepening (Sonnet, ~$0.03)            │
│      - If student reinterprets or adds context                        │
│      - Verdict: confirmed | superseded | tensioned | none             │
│    Stage 5: Phase re-check (conditional)                              │
│  Output: coaching response + whether profile was deepened             │
└───────────────────────────────────────────────────────────────────────┘
```

#### Key Subsystems

**ProfileRouter** (`profileManager/profileRouter.ts`):
Assembles precisely-scoped context for every LLM call. 16 routing rules. Connection graph is PRIMARY signal for what context to include (which paragraphs get full detail vs. digests). Proximity is fallback.

**ConnectionGraph** (`connections/connectionGraph.ts`):
Pure data management for cross-paragraph connections. Connections are NEVER deleted (invalidated with reason instead). Types: deep | surface | contrast. Tags: callback | echo | escalation.

**FindingStore** (`findings/findingStore.ts`):
Append-only finding management. Maturity lifecycle: hypothesis → developing → confirmed → deepened → superseded. Never deleted. Superseded findings preserved with reason.

**EssayProfileCoordinator** (`profileManager/essayProfileManager.ts`):
Thin dispatch hub. Routes mutations to domain-specific mutators. Manages cross-domain staleness via DependencyMap. Checkpoints at pipeline boundaries.

**VersionTracker** (`versionTracker.ts`):
Tracks edit lifecycle. Staleness accumulates: weak → moderate → strong. Determines when to trigger re-analysis vs. accumulate more edits.

#### Incremental Updates (Edit Handling)

```
Student edits essay
    │
    ▼
EditUnderstandingService (editUnderstandingService.ts):
  Step 0: Mechanical diff (no LLM) — paragraph alignment, word-level diff
  Step 1: Haiku triviality filter (~$0.001) — TRIVIAL vs REAL gate
  Step 2-4: Sonnet understanding (~$0.03) — significance + impact + scope
    │
    ▼
ReanalysisOrchestrator decides:
  - TRIVIAL edit? → skip
  - MINOR/MODERATE? → FocusedAnalyzer (surgical, ~$0.03-0.05)
  - SIGNIFICANT/TRANSFORMATIVE? → Full comprehensive re-analysis (~$0.75)
    │
    ▼
FocusedAnalyzer (focusedAnalyzer.ts) for small edits:
  1. Focused understanding update (delta reasoning)
  2. Focused analysis update
  3. Escalation ladder (local → holistic → comprehensive)
  4. Phase re-computation

Cost acceleration: Round 1 ~$0.75 → Round 5 ~$0.03 (10x cheaper)
```

#### Data Model (Root Type)

```typescript
EssayProfile {
  // L1
  paragraphFirstImpressions: ParagraphFirstImpression[];

  // L2
  structuralCartography: StructuralCartography | null;

  // L2.5
  scoutOutput: ConnectionScoutOutput | null;

  // L3 (hierarchy: essay → paragraph → sentence)
  paragraphs: ParagraphProfile[];

  // L3.75 (10 holistic sections)
  holistic: {
    voiceIdentity, voiceMap, emotionalTopography,
    momentEarnednessMap, thematicArchitecture,
    narrativeStrategy, characterRevelation,
    craftAssessment, crossDimensionEntanglements,
    admissionsPositioning
  };

  // L3.5
  analysis: {
    paragraphs: ParagraphAnalysis[];
    improvementPhase: ImprovementPhase;
  };

  // L4
  northStar: EssayNorthStar | null;
  scoreMatrix: ParagraphScoreMatrix | null;
  coherenceReport: CoherenceReport | null;

  // Supporting
  connections: ProfileConnections;
  findings: Finding[];
  conversationInsights: ConversationInsight[];

  // Metadata
  version, writeVersion, createdAt, updatedAt
}
```

---

### 3.2 Activity Analysis — 11-Dimension Rubric Engine

**Path**: `src/core/analysis/` + `src/core/rubrics/`
**Entry**: `POST /analyze-entry` → `analyzeEntry()` in `engine.ts`

Scores extracurricular activity descriptions against an 11-dimension rubric with authenticity-adjusted weighting.

#### 4-Stage Pipeline

```
Activity Description Text
    │
    ▼
Stage 1: Feature Extraction (deterministic, no LLM)
    extractor.ts — voice markers, evidence markers, arc markers,
    collaboration markers, reflection markers
    authenticityDetector.ts — red flags (formulaic phrases, forced arcs)
                              green flags (conversational, real specificity)
    │
    ▼
Stage 2: Parallel Category Scoring (Sonnet, 3 batches)
    categoryScorer.ts — 3 parallel Claude calls:
      Batch 1 (text): voice_integrity, craft, specificity
      Batch 2 (outcome): impact, initiative, collaboration, role_clarity
      Batch 3 (narrative): arc, reflection, fit, time_investment
    Each category: score 0-10, evidence quotes, evaluator notes, confidence
    │
    ▼
Stage 3: Conditional Deep Reflection (Sonnet, conditional)
    If reflection_meaning < 6 → recalibrate with deeper analysis
    │
    ▼
Stage 4: NQI Calculation + Flags + Fixes
    NQI = weighted_average × 10 (0-100 scale)
    Authenticity adjustment: +1.5 (score≥8) to -2 (score<3)
    Quiet Excellence bonus: +1-3 if voice≥9 + reflection≥7.5 + authenticity≥7.5
    Adaptive weights by activity type (work/arts/research/athletics)
    Flag generation: authenticity, voice, evidence, arc, collaboration, reflection
    Suggested fixes ranked by marginal NQI impact
```

#### The 11 Dimensions (weighted)

| # | Dimension | Weight | Anchors |
|---|-----------|--------|---------|
| 1 | Voice Integrity | 10% | 0: templated → 10: human & grounded |
| 2 | Specificity & Evidence | 9% | 0: vague → 10: precise outcomes |
| 3 | Transformative Impact | **12%** | 0: no change → 10: systemic + personal |
| 4 | Role Clarity & Ownership | 8% | 0: title only → 10: specific actions |
| 5 | Narrative Arc & Stakes | 10% | 0: snapshot → 10: clear stakes & turning point |
| 6 | Initiative & Leadership | 10% | 0: follows → 10: momentum from zero |
| 7 | Community & Collaboration | 8% | 0: "I only" → 10: named interdependence |
| 8 | Reflection & Meaning | **12%** | 0: none → 10: transferable insight |
| 9 | Craft & Language Quality | 7% | 0: errors → 10: vivid & concise |
| 10 | Fit & Trajectory | 7% | 0: isolated → 10: coherent thread |
| 11 | Time Investment | 7% | 0: one-off → 10: multi-term evolution |

#### Optional Scoring Science Calibration

Post-LLM calibration pipeline (`scoring/scoringScience/`):
```
Raw LLM Scores → IRT Calibration → Bayesian Updating →
Constraint Satisfaction → Distribution Normalization →
Reliability Analysis (SEM) → Diminishing Returns → Final Scores
```

---

### 3.3 Common App Workshop

**Path**: `src/services/commonAppWorkshop/` (~54 files)
**Purpose**: College-specific supplemental essay coaching with research overlay

```
Essay + College Target
    │
    ▼
Stage 0: Voice Excavation (Haiku, ~$0.02)
  → voice fingerprint, authentic phrases, emotional range
    │
    ▼
Stage 1: Holistic Foundation Teaching (Sonnet/Haiku, ~$0.05)
  → dimensional feedback, college value alignment, Socratic questions
    │
    ▼
Stage 2: Deep Development Teaching (Sonnet, ~$0.08)
  → issue-by-issue teaching with research citations, progress tracking
    │
    ▼
Stage 3: Excellence Polish (Haiku, ~$0.01)
  → final refinement priorities, citation recommendations
```

**Key feature**: Full college research data (~2,500 tokens) cached across all stages via prompt caching. 74% cost reduction.

**Support services**: College overlay/enhancer, type-aware scoring, semantic cliche analyzer, context gap detector, citation engine (maps to Dean quotes).

---

### 3.4 Narrative Workshop

**Path**: `src/services/narrativeWorkshop/` (~45 files)
**Purpose**: Deep structural analysis of personal statements

```
Essay Text
    │
    ▼
Stage 1: Holistic Understanding (Sonnet, ~$0.10)
  → central theme, narrative thread, voice type, key moments
    │
    ▼
Stage 2: Deep Dive (6 PARALLEL Sonnet calls, ~$0.12)
  → opening analysis, character development, stakes & tension,
    climax/turning point, body development, conclusion/reflection
    │
    ▼
Stage 3: Grammar & Style (Sonnet + deterministic, ~$0.05)
  → grammar issues, style categorization, vocabulary, sentence patterns
    │
    ▼
Stage 4: Synthesis & Scoring (Sonnet, ~$0.08)
  → dimension scores (0-10), overall quality label
    │
    ▼
Stage 5: Sentence-Level Insights (deterministic, minimal cost)
  → prioritized improvements with exact locations
```

**Surgical editing tools**: `surgicalEditor.ts` + `surgicalOrchestrator.ts` for targeted edits post-analysis.

---

### 3.5 Activity Workshop

**Path**: `src/services/portfolioStrategy/services/activityWorkshop/` (~109 files)
**Purpose**: Portfolio-level activity analysis with story-aware coaching

```
Activity Portfolio (list of activities + student context)
    │
    ▼
Stage 0: Story Detection (Haiku, ~$0.02)
  → student archetype (founder, caretaker, activist...)
  → narrative themes (first-gen journey, entrepreneurial grit...)
  → contextual factors, activity story roles
    │
    ▼
Stage 1: Context-Aware Analysis (Sonnet, ~$0.18)
  → batched analysis enriched with story context
  → Harvard tier assignment (1-6) with story-influenced adjustments
  → teaching candidate selection + priority ordering
    │
    ▼
Stage 2: Conditional Teaching (Sonnet, ~$0.12)
  → deep teaching for high-potential activities only
  → quick encouragement for already-strong activities
  → research-backed guidance with citations
    │
    ▼
Stage 3: Portfolio Synthesis (Haiku, ~$0.03)
  → final competitive assessment
  → optimally ordered activity list
  → action plan: immediate / short-term / long-term
```

**Chat Integration**: Activity profiles from conversational chat (`chat/`) feed into Stage 0-2. `profileBridgeService.ts` connects chat-collected context (origin stories, key moments) into the pipeline. Cost: ~50-200 extra tokens per activity.

**Scoring subsystem**: 20+ files in `scoring/` — dimension scoring, impressiveness calibration, expertise signaling library.

---

### 3.6 Academic Workshop

**Path**: `src/services/portfolioStrategy/services/academicWorkshop/` (~52 files)
**Purpose**: Academic history analysis, capability profiling, college-tier reporting

#### 6-Layer Architecture

```
Course History + GPA + School Context
    │
    ▼
Layer 1: Data Normalization (sync, no LLM)
  → AP course name matching against verified DB (40 courses, CB 2024)
  → raw metric calculation (GPA, AP count, trajectory)
    │
    ▼
Layer 2: Heuristic Foundation (sync, no LLM)
  → GPA trajectory (ascending/stable_high/declining)
  → deep dive detection (sustained subject sequences)
  → major alignment, red flags (GPA protection patterns)
    │
    ▼
Layer 3: Deep Understanding (Sonnet, parallel)
  → academic narrative type (rising_star, gpa_protector, passion_driven...)
  → contextual positioning (relative rigor, school tier)
    │
    ▼
Layer 4: Multi-Dimensional Scoring (Sonnet)
  → 6 dimensions: rigor, performance, trajectory, intellectual character,
    opportunity utilization, contextual strength
    │
    ▼
Layer 5: Teaching Generation (Sonnet)
  → by ability level (foundational/intermediate/advanced)
  → connected to target school expectations
    │
    ▼
Layer 6: Portfolio Synthesis (sync)
  → final AcademicPortfolioScore
  → competitive positioning + improvement ranking
```

#### Specialized Modules

**Conversational Advisor** (`capability/conversational/`, 20 files, ~26K lines):
- Real-time LLM-first advisor with topic detection
- AP course knowledge base (40 courses, verified CB 2024 stats)
- College expectations database (42 majors, 229 name variants)
- Dynamic response generation with adaptive depth
- Major resolution service with 3-tier matching

**Deep Academic Report** (`capability/deepAcademicReport/`, 12 files):
- 6-tier college-specific analysis (Ivy → Competitive)
- 6 specialized generators: Bottom Line, Challenges, Identity, Research, Roadmap, Tier Calibration
- Student-friendly narrative format

---

### 3.7 PIQ Workshop

**Path**: `src/services/piq/` + `src/services/piqWorkshop/`
**Purpose**: UC Personal Insight Questions coaching with 13-dimension rubric

**13 Dimensions** (weighted tiers):

| Tier | Dimensions | Weight |
|------|-----------|--------|
| 1: Critical Foundations (45%) | Opening Hook (10%), Vulnerability & Authenticity (12%), Specificity (10%), Voice (8%), Narrative Arc (9%) |
| 2: Impact & Growth (30%) | Transformative Impact (10%), Role Clarity (7%), Initiative (7%), Context (6%) |
| 3: Depth & Meaning (15%) | Reflection (9%), Identity & Self-Discovery (6%) |
| 4: Polish (10%) | Craft (6%), Fit & Trajectory (5%) |

**Architecture**: Chat-based interface with Supabase persistence, autosave, session accumulation. Haiku for diagnosis, Sonnet for teaching.

---

### 3.8 Enhanced Writing Workshop

**Path**: `src/services/enhancedWorkshop/` + `src/http/enhancedWorkshopRoutes.ts`
**Purpose**: Voice-aware inline editing with enhancement orchestration

**Protected by circuit breaker**: 5 consecutive 500s in 60s → auto-disable for 5 minutes. Kill switch: `ENABLE_ENHANCED_WORKSHOP=false`.

**Capabilities**:
- Session management (start/end with analytics)
- Voice profile building/enrichment from essay samples
- Inline editing with voice-aware commands
- Command suggestion (2-3 best commands for selection)
- AI authenticity risk scoring
- Version comparison
- Pre-analysis (heuristic, no LLM)
- LLM-powered improvement planning (Haiku, ~$0.002)
- Regression guard (before/after quality check)
- Full enhancement loop (pre-analyze → plan → edit → guard)
- SSE streaming enhancement
- Portfolio cross-essay intelligence
- Voice drift detection against baseline
- Competitive intelligence (overused phrase detection, AO fatigue)

---

## 4. Cross-Cutting Infrastructure

### 4.1 Authentication (Clerk)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Clerk UI   │────▶│  Clerk API   │────▶│ Webhook Endpoint │
│  (frontend)  │     │  (JWT issue) │     │ POST /webhooks/  │
│              │     │              │     │ clerk            │
└──────┬───────┘     └──────┬───────┘     └────────┬─────────┘
       │                    │                       │
       │ JWT in             │ Svix signature        │ user.created:
       │ Authorization      │ verification          │ → create profile
       │ header             │                       │   (10 free credits)
       ▼                    ▼                       │
┌──────────────┐     ┌──────────────┐              │
│  requireAuth │────▶│ verifyClerk  │              │
│  middleware   │     │ JWT()        │              │
└──────┬───────┘     └──────────────┘              │
       │                                            │
       │ req.auth = { userId, claims }              │
       ▼                                            ▼
┌──────────────────────────────────────────────────────────┐
│                Supabase PostgreSQL                        │
│  RLS: auth.jwt() ->> 'sub' = profiles.user_id (TEXT)    │
│  Service role bypasses RLS for webhooks/admin ops        │
└──────────────────────────────────────────────────────────┘
```

**Dev bypass**: Requires BOTH `NODE_ENV=development` AND `ALLOW_DEV_AUTH=true`. Routes prefixed with `/dev/`.

### 4.2 Credit & Billing (Stripe)

```
Credit Constants:
  ESSAY_ANALYSIS = 5 credits
  CHAT_MESSAGE = 1 credit

New User: 10 free credits (granted via Clerk webhook)

Credit Packs (Stripe):
  starter_pack:     $80  → 400 credits
  full_season_pack: $200 → 1200 credits
  custom_X:         $13 per 50 credits (50-2000 range)

Referral System:
  Referee: +10 credits on signup, 10% off all packs
  Referrer: +25 on referee signup, +25 on referee's first purchase

Atomic Deduction Flow:
  1. getCredits(userId)           → current balance
  2. balance >= amount?           → validate
  3. UPDATE profiles SET credits  → atomic write
  4. INSERT credit_transactions   → audit trail
  5. dispatch 'credits:updated'   → UI refresh event
```

### 4.3 LLM Abstraction Layer

**Path**: `src/lib/llm/`

| File | Purpose |
|------|---------|
| `claude.ts` (16.8KB) | Anthropic SDK wrapper. Lazy init, prompt caching, JSON mode with `jsonrepair`, retry with backoff, token tracking |
| `unified.ts` (8.3KB) | Dual-model abstraction (Claude OR GPT-5). Parallel model comparison. Cost tracking |

**Model Selection**:
- `claude-sonnet-4-5-20250929` — quality/teaching/analysis (all user-facing content)
- `claude-haiku-4-5-20251001` — speed/triage/classification/synthesis

**Prompt Caching Strategy**:
- System prompts cached across parallel paragraph-scoped calls
- College research data cached across workshop stages
- Essay + profile cached for all paragraph-scoped analysis calls
- Saves ~90% of context tokens on subsequent calls within a pipeline

### 4.4 Security & Fraud Prevention

**Path**: `src/http/security/index.ts` + `src/utils/deviceFingerprint.ts`

#### Input Sanitization
- AI prompt injection blocking (system overrides, jailbreak patterns)
- XML tag escaping
- Max length enforcement (50KB essays, 10KB chat)
- User content wrapped in clear delimiters

#### Error Sanitization
- Sensitive patterns detected and redacted (passwords, keys, JWTs, connection strings)
- Generic error codes returned to client
- Full errors logged server-side

#### Device Fingerprinting
- Components: user agent, language, screen, timezone, canvas hash, WebGL hash, audio hash
- ~85% stability (vs Fingerprint.js Pro 95%)
- Zero cost (custom implementation)

#### Zero-Tolerance Fraud Policy
```
Triggers:
  - Duplicate essay hash
  - Multiple devices from single user
  - IP abuse patterns

Response:
  - Immediate flag_user_for_fraud() call
  - All operations blocked until reviewed
  - status: flagged → under_review → cleared|banned
  - Severity: low | medium | high | critical
```

---

## 5. Data Layer

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User data + credits | user_id (TEXT, Clerk), credits (INT), completion_score |
| `essays` | Essay submissions | user_id, essay_type, draft_original, draft_current, version |
| `essay_analysis_reports` | Analysis results | essay_id FK, dimension_scores (JSON), overall_score |
| `essay_revision_history` | Version tracking | essay_id FK, version, draft_content, dimension_scores |
| `essay_understanding` | **V2 Understanding Walk** | essay_id FK, understanding (JSONB ~200KB), overall_eqi, analysis_passes |
| `credit_transactions` | Billing audit trail | user_id, amount, type, description |
| `fraud_flags` | Zero-tolerance tracking | user_id (UNIQUE), flag_reason, severity, is_banned |

### Extended Tables (Feb-March 2026)

| Table | Purpose |
|-------|---------|
| `activity_profiles` | Chat-collected activity profiles |
| `voice_profiles` | Writing style baselines |
| `rag_essay_fragments` | RAG embeddings for example search |
| `rag_transformations` | Transformation examples |
| `writing_analytics` | Prompt effectiveness metrics |
| `activity_scoring_cache` | Expensive scoring cache |
| `editing_sessions` | Inline editing sessions |
| `enhancement_runs` | Enhancement operations |
| `scoring_telemetry` | Detailed scoring metrics |
| `prestige_research_cache` | College data cache |

### Schema Principles
- All user IDs: TEXT type (Clerk format: `user_2q...`)
- All tables: UUID primary keys
- RLS on everything: `auth.jwt() ->> 'sub'` checks
- JSONB for complex nested data (essay understanding, analysis results)
- GIN indexes on JSONB columns for querying
- Service role key bypasses RLS for webhooks and admin operations

---

## 6. Frontend Architecture

### Provider Stack (outermost → innermost)

```
ClerkProvider
  └─ QueryClientProvider (React Query: 5min stale, 30min GC)
    └─ BrowserRouter
      └─ AuthProvider (custom auth context)
        └─ FraudTrackingProvider (device fingerprinting)
          └─ TooltipProvider (shadcn/ui)
            └─ Routes + Toast/Sonner
```

### Key Pages

| Route | Page | Auth | Purpose |
|-------|------|------|---------|
| `/` | Index | No | Landing page |
| `/auth` | Auth | No | Sign in/up |
| `/portfolio-scanner` | PortfolioScanner | Yes | Activity analysis entry |
| `/portfolio-insights` | PortfolioInsights | Yes | Results dashboard |
| `/piq-workshop/:n` | PIQWorkshop | Yes | PIQ coaching |
| `/settings` | Settings | Yes | User preferences |
| `/pricing` | Pricing | No | Credit pack purchase |

### Protected Route Guards
- `requireVerified`: Clerk email verification
- `requireTermsAccepted`: Terms of service acceptance
- Both enforced before dashboard access

---

## 7. System Interconnection Map

This is how everything connects:

```
                        ┌──────────────────────────────────┐
                        │         STUDENT JOURNEY           │
                        │                                    │
                        │  1. Sign up (Clerk → webhook →    │
                        │     profile + 10 credits)          │
                        │                                    │
                        │  2. Add activities → Activity      │
                        │     Chat collects stories →        │
                        │     Activity Profiles stored       │
                        │                                    │
                        │  3. Submit activities →             │
                        │     Activity Workshop (4-stage)     │
                        │     Story Detection uses chat       │
                        │     profiles as context             │
                        │                                    │
                        │  4. Add academic history →          │
                        │     Academic Workshop (6-layer)     │
                        │     Conversational advisor for      │
                        │     course recommendations          │
                        │                                    │
                        │  5. Write essay →                   │
                        │     Essay Intelligence V2           │
                        │     (8-layer understanding)         │
                        │                                    │
                        │  6. Workshop coaching →             │
                        │     Common App / Narrative / PIQ    │
                        │     Uses voice profile baseline     │
                        │     Uses essay understanding        │
                        │                                    │
                        │  7. Inline editing →                │
                        │     Enhanced Writing Workshop       │
                        │     Voice-aware, regression guard   │
                        │                                    │
                        │  8. Portfolio insights →            │
                        │     Cross-essay intelligence        │
                        │     Activity + Academic + Essay     │
                        │     unified positioning             │
                        └──────────────────────────────────┘
```

### Data Flow Between Systems

```
Activity Chat ──profile──▶ Activity Workshop Stage 0-2
                              │
                              │ activity tiers + descriptions
                              ▼
                          Portfolio Strategy ◀── Academic Workshop
                              │                     │
                              │ portfolio strength   │ academic positioning
                              ▼                     ▼
                          Holistic Analyzer
                              │
                              │ consistency check (essay claims vs activities)
                              │ strategic positioning (spine, spike, blind spots)
                              ▼
                          Essay Orchestrator
                              │
                              │ 7 universal + prompt-specific dimensions
                              ▼
                          Essay Intelligence V2
                              │
                              │ deep understanding (L1-L4)
                              │ coaching (L6)
                              ▼
                          Workshop Coaching ◀── Voice Profile
                              │                    ▲
                              │                    │ enriched from
                              │                    │ essay samples
                              ▼                    │
                          Enhanced Writing ─────────┘
                              │
                              │ regression guard + version compare
                              ▼
                          Essay Revision History
```

### Shared Resources

| Resource | Consumers |
|----------|-----------|
| `claude.ts` (LLM) | All services that call Claude |
| `creditsService.ts` | All paid operations (analysis, chat) |
| `ProfileRouter` | Essay Intelligence L3-L6, workshops |
| `ConnectionGraph` | Essay Intelligence L3+, coaching |
| `FindingStore` | Essay Intelligence L3+, crystallization |
| `Voice Profile` | Enhanced Workshop, inline editor |
| `Activity Profiles` | Activity Workshop, portfolio strategy |
| Supabase client | All data persistence |
| Security middleware | All API routes |

### Key Architectural Decisions

1. **Understanding before judgment**: L3 understands WHAT IS. L3.5 judges HOW WELL. L5 prescribes WHAT TO DO. Three separate API calls = three separate prompts = structural anti-contamination.

2. **Never discard paid output**: Connections invalidated (not deleted). Findings superseded (not removed). Understanding arrays replaced (not appended) — because later context produces *better* understanding.

3. **LLM-first design**: LLM owns all contextual judgment. System tracks metadata. No deterministic formulas for things requiring contextual understanding.

4. **No degraded fallbacks**: If Claude fails, return a clear error. Never return fake/heuristic results pretending to be real analysis.

5. **Prompt caching everywhere**: System prompts, college research, essay+profile data all cached across parallel calls. Saves 70-90% of context tokens.

6. **Phase-aware teaching**: Understanding + Analysis are always comprehensive. Only *feedback* zooms to the student's current improvement phase (Foundation → Distinction).

7. **Atomic credit deduction**: Check + deduct + log in single operation. No race conditions. UI refreshed via custom event dispatch.

8. **Zero-tolerance fraud**: Flag immediately, block all operations, no second chances until reviewed.

---

## 8. Cost Model

### Per-Operation Costs

| Operation | Cost | Model Mix |
|-----------|------|-----------|
| Essay Intelligence V2 (first analysis) | ~$0.75-1.00 | Haiku (L1, L2.5) + Sonnet (L2, L3, L3.75, L3.5, L4, L5) |
| Essay Intelligence (focused re-analysis) | ~$0.03-0.05 | Sonnet focused calls |
| Essay Intelligence (coaching turn) | ~$0.05-0.10 | Haiku classifier + Sonnet responder |
| Activity Analysis (single, 11-dim) | ~$0.08-0.12 | Sonnet (3 batches) |
| Activity Workshop (portfolio) | ~$0.28-0.40 | Haiku (S0, S3) + Sonnet (S1, S2) |
| Common App Workshop | ~$0.12-0.16 | Haiku (S0, S3) + Sonnet (S1, S2) |
| Narrative Workshop | ~$0.35-0.45 | Sonnet (S1-S4) |
| Academic Workshop | ~$0.20-0.30 | Sonnet (4 parallel calls) |
| PIQ Workshop | ~$0.15-0.25 | Haiku + Sonnet |
| Enhanced Writing (improvement plan) | ~$0.002 | Haiku |

### Credit Economics

| Pack | Price | Credits | $/Credit | Student Sessions |
|------|-------|---------|----------|------------------|
| Free | $0 | 10 | - | ~2 analyses |
| Starter | $80 | 400 | $0.20 | ~80 analyses |
| Full Season | $200 | 1200 | $0.17 | ~240 analyses |
| Custom | $13/50 | variable | $0.26 | variable |

---

## 9. API Endpoint Inventory

### Core Analysis
| Method | Endpoint | Auth | Service |
|--------|----------|------|---------|
| POST | `/analyze-entry` | No* | Activity 11-dim rubric |
| POST | `/analyze-academics` | Yes | Academic workshop |
| GET | `/academic-teaching/:type` | Yes | Academic teaching lookup |

### Essay Intelligence
| Method | Endpoint | Auth | Service |
|--------|----------|------|---------|
| POST | `/api/v1/annotate/analyze` | Yes | Full annotation pipeline |
| POST | `/api/v1/annotate/deep-dive` | Yes | Deep dive annotation |
| POST | `/api/v1/annotate/reanalyze` | Yes | Re-analysis after edit |
| POST | `/api/v1/annotate/batch-activities` | Yes | Batch activity analysis |

### Enhanced Writing (prefix: `/enhanced`)
| Method | Endpoint | Auth | Service |
|--------|----------|------|---------|
| POST | `/session/start` | Yes | Start editing session |
| POST | `/session/end` | Yes | End session + analytics |
| POST | `/inline-edit` | Yes | Apply edit command |
| POST | `/suggest-commands` | Yes | Suggest edit commands |
| POST | `/voice-profile` | Yes | Build voice profile |
| POST | `/authenticity/check` | Yes | AI risk scoring |
| POST | `/version-compare` | Yes | Compare essay versions |
| POST | `/pre-analyze` | Yes | Quick quality snapshot |
| POST | `/plan-improvements` | Yes | LLM improvement plan |
| POST | `/regression-check` | Yes | Before/after guard |
| POST | `/enhance` | Yes | Full enhancement loop |
| POST | `/enhance/stream` | Yes | SSE streaming enhancement |
| POST | `/portfolio-analyze` | Yes | Cross-essay intelligence |
| POST | `/voice-drift` | Yes | Voice consistency check |
| POST | `/competitive-analysis` | Yes | Overused phrase detection |

### Activity Chat (prefix: `/activity-chat`)
| Method | Endpoint | Auth | Service |
|--------|----------|------|---------|
| POST | `/start` | Yes | Start activity conversation |
| POST | `/respond` | Yes | Process user message |
| POST | `/end` | Yes | End conversation |
| POST | `/resume` | Yes | Resume paused conversation |
| GET | `/summary/:id` | Yes | Get conversation summary |
| GET | `/profile/:activityId` | Yes | Get activity profile |
| GET | `/profiles` | Yes | Get all activity profiles |
| POST | `/assess-need` | Yes | Batch assess chat need |
| POST | `/generate-description` | Yes | Generate from profile |
| GET | `/conversations` | Yes | List conversations |

### Writing Services
| Method | Endpoint | Auth | Service |
|--------|----------|------|---------|
| GET | `/api/voice-profile` | Yes | Load voice profile |
| PUT | `/api/voice-profile` | Yes | Build/enrich voice profile |
| POST | `/api/inline-edit` | Yes | Apply edit command |
| POST | `/api/inline-edit/suggest` | Yes | Suggest commands |
| POST | `/api/authenticity-check` | Yes | AI risk scoring |
| POST | `/api/story-mining/mine` | Yes | Mine stories from activities |
| POST | `/api/story-mining/deepen` | Yes | Deepen a story seed |
| POST | `/api/story-mining/rank` | Yes | Rank seeds for prompt |
| GET | `/api/rag/stats` | Yes | RAG database stats |
| POST | `/api/rag/search` | Yes | Search RAG examples |

### Analytics
| Method | Endpoint | Auth | Service |
|--------|----------|------|---------|
| POST | `/api/analytics/track` | Yes | Track user events |
| GET | `/api/analytics/acceptance-rate` | Yes | Suggestion acceptance |
| GET | `/api/analytics/commands` | Yes | Most-used commands |
| GET | `/api/analytics/score-improvement` | Yes | Score improvement |
| GET | `/api/analytics/summary` | Yes | Full summary |
| POST | `/api/analytics/compare-versions` | Yes | Version comparison |
| GET | `/analytics/portfolio-strength` | Yes | Portfolio metrics |
| POST | `/analytics/reconcile` | Yes | Reconcile portfolio |
| POST | `/analytics/version-compare` | Yes | Version score compare |

### Billing & Referrals
| Method | Endpoint | Auth | Service |
|--------|----------|------|---------|
| POST | `/billing/checkout` | Yes | Create Stripe checkout |
| POST | `/billing/webhook` | No | Stripe events |
| POST | `/billing/verify-session` | Yes | Verify payment |
| GET | `/referrals/me` | Yes | Get referral info |
| POST | `/referrals/claim` | Yes | Claim referral code |

### Webhooks
| Method | Endpoint | Auth | Service |
|--------|----------|------|---------|
| POST | `/webhooks/clerk` | Svix | User lifecycle events |

### Health
| Method | Endpoint | Auth | Service |
|--------|----------|------|---------|
| GET | `/health` | No | Service status |

---

## File Structure Quick Reference

```
src/
├── http/
│   ├── server.ts                    # Express server + middleware
│   ├── routes.ts                    # Main route dispatch (~200KB)
│   ├── middleware/auth.ts           # requireAuth, optionalAuth
│   ├── security/index.ts           # JWT, sanitization, logging
│   ├── billing.ts                  # Stripe routes
│   ├── referrals.ts                # Referral routes
│   ├── activityChatRoutes.ts       # Activity chat sub-router
│   ├── annotationRoutes.ts         # Annotation pipeline sub-router
│   ├── enhancedWorkshopRoutes.ts   # Enhanced writing sub-router
│   ├── dev-auth.ts                 # Dev bypass
│   └── webhooks/clerk.ts           # Clerk webhook handler
│
├── core/
│   ├── analysis/
│   │   ├── engine.ts               # 4-stage activity analysis pipeline
│   │   ├── features/
│   │   │   ├── extractor.ts        # Deterministic feature extraction
│   │   │   └── authenticityDetector.ts  # Voice authenticity
│   │   ├── scoring/
│   │   │   ├── categoryScorer.ts   # 3-batch Claude scoring
│   │   │   └── scoringScience/     # IRT, Bayesian, constraints
│   │   └── coaching/               # Issue detection + guidance
│   └── rubrics/v1.0.0.ts          # 11-dimension rubric definition
│
├── services/
│   ├── essayIntelligence/          # V2 understanding engine (~80 files)
│   │   ├── analysis/               # L1-L5 + edit handling + reanalysis
│   │   ├── profileManager/         # Coordinator, router, mutators
│   │   ├── connections/            # ConnectionGraph
│   │   ├── findings/               # FindingStore
│   │   ├── coaching/               # L6 coaching service
│   │   ├── versioning/             # Snapshot management
│   │   └── profileTypes.ts         # V2 type system (THE core types)
│   │
│   ├── commonAppWorkshop/          # College supplement coaching (~54 files)
│   ├── narrativeWorkshop/          # Personal statement analysis (~45 files)
│   ├── piq/ + piqWorkshop/         # UC PIQ coaching
│   │
│   ├── portfolioStrategy/
│   │   └── services/
│   │       ├── activityWorkshop/   # 4-stage portfolio analysis (~109 files)
│   │       │   ├── stages/         # Stage 0-3
│   │       │   ├── scoring/        # 20+ scoring files
│   │       │   ├── profile/        # Activity profiles
│   │       │   └── chat/           # Conversational interface
│   │       └── academicWorkshop/   # Academic analysis (~52 files)
│   │           ├── capability/
│   │           │   ├── conversational/     # AI advisor (20 files, ~26K lines)
│   │           │   └── deepAcademicReport/ # Tier-specific reports
│   │           ├── pipeline/       # Main orchestrator
│   │           └── scoring/        # Dimension scoring
│   │
│   ├── credits/                    # Credit operations
│   ├── voiceProfile/               # Writing style profiles
│   ├── inlineEditor/               # Inline editing engine
│   ├── authenticity/               # AI risk scoring
│   ├── storyMining/                # Story extraction from activities
│   ├── rag/                        # Retrieval-augmented generation
│   ├── analytics/                  # Writing analytics
│   ├── competitiveIntelligence/    # AO fatigue detection
│   ├── portfolioIntelligence/      # Cross-essay intelligence
│   ├── sessionContext/             # Session state management
│   └── enhancedWorkshop/           # Enhancement orchestration
│
├── lib/
│   ├── llm/
│   │   ├── claude.ts               # Anthropic SDK wrapper (16.8KB)
│   │   └── unified.ts             # Dual-model abstraction (8.3KB)
│   └── stripe.ts                  # Stripe client
│
├── integrations/
│   └── supabase/
│       ├── client.ts              # Supabase client
│       ├── safeClient.ts          # Lazy init + fallbacks
│       └── types.ts               # Auto-generated DB types (~30KB)
│
├── pipeline/
│   └── annotationPipeline.ts      # 4-phase annotation pipeline
│
├── pages/                          # React page components
├── components/                     # Shared UI components
├── hooks/                          # React hooks (fraud tracking, etc.)
├── utils/                          # Device fingerprinting, helpers
└── config/                         # Clerk config

supabase/migrations/                # 39 schema migrations (Aug 2025 - Mar 2026)
tests/                              # 33 test suites
docs/                               # Architecture docs, analysis reports
```

---

> **Design Philosophy**: Understand deeply, analyze honestly, teach specifically. Every shortcut becomes a student who doesn't improve. Every silent failure becomes a student who gets wrong advice. The system is complex because the problem is complex — but every layer earns its place.
