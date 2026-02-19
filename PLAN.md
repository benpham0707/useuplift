# Activity Workshop ↔ Chat Integration Plan

**Last Updated**: February 19, 2026
**Status**: IMPLEMENTATION IN PROGRESS

## Vision (from Tue)

The activity conversator and analysis system become interconnected — feeding one into the other. The conversator collects data and builds a profile of each activity. That profile feeds into the analysis pipeline so it uses REAL student context instead of fabricated examples. Users can also workshop/rewrite descriptions through the chat. The two systems improve each other's quality and tailor the user experience. No degradation to existing system — same structure, just smarter and more capable.

## Architecture: Bidirectional Data Flow

```
User Activities
    |
    v
[Activity Profile Chat] ←──────────────────────┐
    |                                            |
    | produces ActivityProfile                   | workshop results inform
    | (facts, story, meaning, impact)            | chat triggers & priorities
    |                                            |
    v                                            |
[Profile Bridge Service]                         |
    |                                            |
    | converts ActivityProfile                   |
    | → prompt-ready summaries                   |
    |                                            |
    v                                            |
[Activity Workshop Pipeline]                     |
    |                                            |
    ├─ Stage 0: Story Detection ─────────────────┘
    |    (profile enriches archetype detection)
    ├─ Stage 1: Analysis + Scoring
    |    (verified facts → accurate tier assessment)
    ├─ Stage 2: Teaching (BIGGEST WIN)
    |    (personalized feedback using real context)
    └─ Stage 3: Synthesis
         (final descriptions use real data)
```

## Design Principles

1. **ActivityProfile is always optional.** Pipeline never requires it. Backward compatible.
2. **Scoring vs Guidance separation.** Profile enriches GUIDANCE quality, NOT scores. Scores reflect what AO reads in the description.
3. **Bidirectional with graceful degradation.** Either direction works independently.

## 7-Agent Implementation

### Agent 1: Database & Persistence
- NEW: `supabase/migrations/YYYYMMDD_activity_profiles_and_chat.sql`
- NEW: `chat/chatPersistenceService.ts`

### Agent 2: API Routes
- NEW: `src/http/activityChatRoutes.ts`
- EDIT: `src/http/routes.ts` (mount routes)

### Agent 3: Profile Bridge
- NEW: `activityWorkshop/profileBridge.ts`

### Agent 4: Types & Orchestrator
- EDIT: `activityWorkshop/types.ts`
- EDIT: `activityWorkshop/activityWorkshopService.ts`
- EDIT: `chat/types.ts`

### Agent 5: Stage 0 + Stage 1 Enrichment
- EDIT: `stages/stage0StoryDetectionService.ts`
- EDIT: `stages/stage1ContextAwareAnalysisService.ts`
- EDIT: `batchActivityAnalysisService.ts`

### Agent 6: Stage 2 + Stage 3 Enrichment
- EDIT: `stages/stage2ConditionalTeachingService.ts`
- EDIT: `stages/stage3PortfolioSynthesisService.ts`

### Agent 7: Chat Enhancement
- EDIT: `chat/questionGenerator.ts`
- EDIT: `chat/activityProfileChatService.ts`
- EDIT: `chat/index.ts`
