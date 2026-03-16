# Implementation Blueprint: Conversator Intelligence System

> **Version**: v3 (Reality-Checked Blueprint)
> **Status**: Ready to implement
> **Date**: 2026-03-15

The Conversator Intelligence System gives the essay analysis pipeline access to what the student KNOWS but didn't WRITE. It operates across three layers: (1) a pre-analysis GatheringService that conducts a 2-4 turn conversation to capture intent, domain expertise, audience, backstory, emotional stakes, and voice choices; (2) pipeline injection that threads this declared data into L3 walk, L3.75 synthesis, L3.5 analysis, L4 crystallization, and L5 annotations; and (3) coaching-time intelligence extraction that continues gathering declared data during L6 conversations, with bidirectional synergy mechanisms connecting all layers.

The single persistent data model is `DeclaredDataEntry[]` on `EssayProfile.studentDeclaredData`. The GatheringService produces an intermediate `StudentDeclaredContext` during crystallization, which is immediately converted to initial `DeclaredDataEntry[]` entries. From that point forward, all consumers read from the same unified array.

---

## Architecture Overview

```
+-----------------------------------------------------------------+
|  LAYER 1: Pre-Analysis Gathering (GatheringService)              |
|                                                                   |
|  Essay Text --> Sonnet Seed Questions --> Student Answers          |
|                --> Haiku Classification --> Sonnet Crystallization  |
|                                                                   |
|  Output: StudentDeclaredContext (intermediate)                    |
|       --> CONVERTED TO --> initial DeclaredDataEntry[]             |
|                             stored on EssayProfile                |
+-----------------------+-------------------------------------------+
                        |
                        v
+-----------------------------------------------------------------+
|  LAYER 2: Pipeline Injection                                      |
|                                                                   |
|  buildDeclaredDataBlock(profile.studentDeclaredData) -->           |
|    L3 walk (after essay text, before accumulated understanding)    |
|    L3.75 synthesis (after holistic scaffold)                       |
|    L3.5 analysis (Block 2 cached context)                         |
|    L4 crystallizer (near IntentBridge schema)                     |
|    L5 annotations (after phase context)                           |
|                                                                   |
|  L1, L2, L2.5 EXCLUDED (descriptive/structural -- no bias)       |
+-----------------------+-------------------------------------------+
                        |
                        v
+-----------------------------------------------------------------+
|  LAYER 3: Coaching-Time Intelligence (L6)                         |
|                                                                   |
|  Stage 2.5: Question injection (targetAudience: 'student')        |
|  Stage 4: Declared data extraction (declaredEntries[] on output)  |
|  DeclaredDataMutator: storage + supersession + staleness          |
|  IntentGapDetector: post-L3.5 gap --> Finding generation           |
|  Adaptive overlay: declared data in all routing rules             |
+-----------------------+-------------------------------------------+
                        |
                        v
+-----------------------------------------------------------------+
|  SYNERGY LAYER (SYN-1 through SYN-9)                              |
|                                                                   |
|  Bidirectional amplification between gathering, pipeline,         |
|  and coaching. $0-0.005 marginal cost per round.                  |
+-----------------------------------------------------------------+
```

---

## Types (add to `profileTypes.ts`)

### DeclaredDataEntry -- the UNIFIED persistent data model

```typescript
/**
 * Categories of student-declared data.
 * Each category has different downstream routing behavior.
 */
export type DeclaredDataCategory =
  | 'intent'          // What the student is trying to achieve with this essay
  | 'domain'          // Domain expertise or cultural knowledge behind references
  | 'audience'        // Who this essay is for (school, program, reader)
  | 'backstory'       // Context invisible in the text (life events, relationships)
  | 'emotional_stakes' // Why this essay matters personally to the student
  | 'voice_choice'    // Intentional stylistic decisions explained by the student
  | 'correction'      // Student says the analysis got something wrong
  | 'preference';     // Student expresses a stylistic preference

/**
 * Where in the essay this declaration applies.
 * 'essay_wide' for declarations that span the entire essay.
 */
export interface LocationScope {
  type: 'essay_wide' | 'paragraph' | 'sentence';
  paragraph?: number;   // 0-based, required for paragraph/sentence scope
  sentence?: number;    // 0-based, required for sentence scope
}

/**
 * How certain the student is about this declaration.
 * Affects downstream weighting -- 'exploring' entries are deprioritized
 * in IntentBridge synthesis and supersession.
 */
export type StudentCertainty = 'definite' | 'tentative' | 'exploring';

/**
 * DeclaredDataEntry -- a single piece of student-declared data.
 *
 * This is the ONLY persistent data model for student declarations.
 * GatheringService produces initial entries; L6 coaching adds more.
 * Supersession: later entries for same location+category supersede earlier.
 */
export interface DeclaredDataEntry {
  /** Unique ID (e.g., 'D1', 'D2', ...) */
  id: string;
  /** When this entry was created */
  timestamp: string;
  /** What category of declaration */
  category: DeclaredDataCategory;
  /** Where in the essay this applies */
  location: LocationScope;
  /** The student's actual words (preserved exactly) */
  content: string;
  /** How certain the student seems */
  certainty: StudentCertainty;
  /** Source of this entry */
  source: 'gathering' | 'coaching';
  /** If sourced from coaching, the ConversationInsight ID */
  sourceInsightId?: string;
  /** If this entry supersedes an earlier one */
  supersedes?: string;
}
```

### StudentDeclaredContext -- intermediate crystallization format ONLY

```typescript
/**
 * Used ONLY as the Sonnet crystallization output format.
 * Immediately converted to DeclaredDataEntry[] after crystallization.
 * NOT stored on EssayProfile. NOT consumed by any pipeline layer.
 */
export interface StudentDeclaredContext {
  intent: string | null;
  domain: string | null;
  audience: string | null;
  backstory: string | null;
  emotionalStakes: string | null;
  voiceChoices: string | null;
  contradictions: Array<{ declared: string; observed: string; tension: string }>;
  confidence: 'partial' | 'complete';
  rawExchanges: Array<{ role: 'system' | 'student'; content: string }>;
}
```

### EssayProfile Extension

```typescript
// ADD to EssayProfile interface in profileTypes.ts
// Position: after conversationInsights, before metadata

/** Student-declared data -- gathered pre-analysis and during L6 coaching.
 *  Unified array: GatheringService provides initial entries, coaching adds more.
 *  Supersession: later entries for same location+category supersede earlier. */
studentDeclaredData: DeclaredDataEntry[];
```

### PipelineInput Extension

```typescript
// ADD to PipelineInput interface in analysisOrchestrator.ts

/** Pre-gathered student declared context.
 *  If provided, seeded into profile.studentDeclaredData before pipeline starts.
 *  If not provided, pipeline runs without student context (current behavior). */
studentDeclaredContext?: StudentDeclaredContext;
```

---

## Implementation Item 1: GatheringService

**New file**: `src/services/essayIntelligence/analysis/gatheringService.ts` (~300 lines)

A standalone 3-phase service that operates in the pre-analysis void. No dependency on profile, synthesis, reading strategy, coaching service, or question queue.

### Phase 1: Seed Question Generation

**LLM Call Spec:**
| Field | Value |
|-------|-------|
| Model | `claude-sonnet-4-5-20250929` (MODEL CONSTRAINT: question gen = Sonnet) |
| Caching | `cacheSystemPrompt: true` |
| Max tokens | 1500 |
| Temperature | 0.5 |
| Timeout | 45000ms |
| Input cost | ~1500 tokens system + ~2000 tokens essay = ~3500 tokens = ~$0.0105 input |
| Output cost | ~500 tokens = ~$0.0075 |
| Total | ~$0.006 (with cache hits: ~$0.003) |

**System prompt:**
```
You are reading a college application essay for the first time. Your job is to
identify what you CANNOT know from the text alone -- the author's invisible context.

Generate 2-3 questions that would most deepen understanding of this essay.
Focus on these facets (prioritize whichever has the biggest gap):
- INTENT: What is the writer trying to achieve? What should the reader take away?
- DOMAIN: Does the essay reference specialized knowledge the writer has?
- BACKSTORY: What happened before/after what the essay describes?
- EMOTIONAL STAKES: Why does this story/topic matter to the writer personally?
- VOICE CHOICES: Are there stylistic decisions that might be intentional?
- AUDIENCE: Is this essay for a specific school/program/reader?

RULES:
- Questions must be answerable by the writer (not by further analysis)
- Questions should feel natural and curious, not interrogative
- Each question should target a DIFFERENT facet
- Order by information value (most important first)

OUTPUT: JSON array of objects:
[
  {
    "question": "the question text",
    "facet": "intent" | "domain" | "backstory" | "emotional_stakes" | "voice_choice" | "audience",
    "rationale": "why this information would deepen understanding"
  }
]
```

**User prompt:**
```
ESSAY TEXT:

{essayText}

Generate 2-3 questions for the writer.
```

**Validation:**
```typescript
interface SeedQuestion {
  question: string;
  facet: 'intent' | 'domain' | 'backstory' | 'emotional_stakes' | 'voice_choice' | 'audience';
  rationale: string;
}

function validateSeedQuestions(raw: unknown): SeedQuestion[] {
  const parsed = parseLlmJsonOutput(raw, 'gatheringSeedQuestions');
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((q: Record<string, unknown>) =>
      typeof q.question === 'string' &&
      typeof q.facet === 'string' &&
      ['intent', 'domain', 'backstory', 'emotional_stakes', 'voice_choice', 'audience'].includes(q.facet as string)
    )
    .map((q: Record<string, unknown>) => ({
      question: q.question as string,
      facet: q.facet as SeedQuestion['facet'],
      rationale: typeof q.rationale === 'string' ? q.rationale as string : '',
    }))
    .slice(0, 3);  // Cap at 3
}
```

### Phase 2: Multi-Turn Gathering

Student answers seed questions. Each answer is classified by Haiku.

**Classification LLM Call Spec:**
| Field | Value |
|-------|-------|
| Model | `claude-haiku-4-5-20251001` (classification = Haiku) |
| Caching | `cacheSystemPrompt: true` |
| Max tokens | 256 |
| Temperature | 0.1 |
| Timeout | 15000ms |
| Cost | ~$0.001 per classification |

**Classification prompt:**
```
Classify the student's response into one or more of these facets:
intent, domain, audience, backstory, emotional_stakes, voice_choice

The student was asked: "{questionText}"
The student answered: "{studentResponse}"

OUTPUT: JSON object:
{
  "primaryFacet": "intent" | "domain" | "audience" | "backstory" | "emotional_stakes" | "voice_choice",
  "secondaryFacets": ["facet", ...],
  "extractedContent": "the key information from the response"
}
```

**Gap detection (pure logic, no LLM):**
```typescript
function detectGaps(
  classifiedResponses: Array<{ facet: string; content: string }>,
): string[] {
  const covered = new Set(classifiedResponses.map(r => r.facet));
  const allFacets = ['intent', 'domain', 'audience', 'backstory', 'emotional_stakes', 'voice_choice'];
  return allFacets.filter(f => !covered.has(f));
}
```

If gaps remain after initial questions, generate 1 follow-up question targeting the most important uncovered facet. Conversation cap: 4 turns total (2-3 seed questions + 1 optional follow-up).

### Phase 3: Crystallization

**LLM Call Spec:**
| Field | Value |
|-------|-------|
| Model | `claude-sonnet-4-5-20250929` (synthesis = Sonnet) |
| Caching | `cacheSystemPrompt: true` |
| Max tokens | 2000 |
| Temperature | 0.3 |
| Timeout | 60000ms |
| Input cost | ~1000 tokens system + ~2000 tokens essay + ~1500 tokens conversation = ~4500 tokens = ~$0.0135 |
| Output cost | ~800 tokens = ~$0.012 |
| Total | ~$0.010 (with cache hits: ~$0.008) |

**System prompt:**
```
You are synthesizing a pre-analysis conversation with a college essay writer into
structured context. The writer has answered questions about their essay.

Synthesize their declarations into the output format below. Important:
- Preserve the student's exact words for intent and voice choices
- Flag contradictions between what they SAY and what the essay TEXT shows
  (these are coaching gold -- the divergence IS the discovery)
- Mark confidence as 'complete' only if all 6 facets have substantive content
- Leave facets as null if the student didn't address them (don't fabricate)

OUTPUT: JSON object matching this schema:
{
  "intent": "string or null -- what the student says they're trying to achieve",
  "domain": "string or null -- domain expertise or cultural knowledge",
  "audience": "string or null -- target school/program/reader",
  "backstory": "string or null -- context not visible in the text",
  "emotionalStakes": "string or null -- why this matters personally",
  "voiceChoices": "string or null -- intentional stylistic decisions",
  "contradictions": [
    {
      "declared": "what the student said",
      "observed": "what the text actually shows",
      "tension": "the meaningful divergence"
    }
  ],
  "confidence": "partial" | "complete"
}
```

**User prompt:**
```
ESSAY TEXT:
{essayText}

GATHERING CONVERSATION:
{formattedConversation}

Synthesize the student's declarations.
```

### Conversion to DeclaredDataEntry[]

```typescript
function convertToDeclaredEntries(
  ctx: StudentDeclaredContext,
): DeclaredDataEntry[] {
  const entries: DeclaredDataEntry[] = [];
  const now = new Date().toISOString();
  let nextId = 1;

  const facetMap: Array<[keyof StudentDeclaredContext, DeclaredDataCategory]> = [
    ['intent', 'intent'],
    ['domain', 'domain'],
    ['audience', 'audience'],
    ['backstory', 'backstory'],
    ['emotionalStakes', 'emotional_stakes'],
    ['voiceChoices', 'voice_choice'],
  ];

  for (const [field, category] of facetMap) {
    const value = ctx[field];
    if (typeof value === 'string' && value !== null) {
      entries.push({
        id: `D${nextId++}`,
        timestamp: now,
        category,
        location: { type: 'essay_wide' },
        content: value,
        certainty: ctx.confidence === 'complete' ? 'definite' : 'tentative',
        source: 'gathering',
      });
    }
  }

  // Contradictions become special entries (consumed by IntentGapDetector as seed gaps)
  for (const contradiction of ctx.contradictions) {
    entries.push({
      id: `D${nextId++}`,
      timestamp: now,
      category: 'intent',
      location: { type: 'essay_wide' },
      content: `CONTRADICTION: Student declares "${contradiction.declared}" but text shows "${contradiction.observed}". Tension: ${contradiction.tension}`,
      certainty: 'tentative',
      source: 'gathering',
    });
  }

  return entries;
}
```

### GatheringService Public API

```typescript
export interface GatheringResult {
  /** Crystallized context (intermediate -- immediately converted) */
  context: StudentDeclaredContext;
  /** Converted entries ready for profile seeding */
  entries: DeclaredDataEntry[];
  /** Total cost of all gathering phases */
  cost: number;
  /** Token usage breakdown */
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  /** Number of conversation turns completed */
  turnsCompleted: number;
  /** Wall-clock time in ms */
  timingMs: number;
}

export class GatheringService {
  /**
   * Phase 1: Generate seed questions from essay text.
   * Returns questions for the caller to present to the student.
   */
  async generateSeedQuestions(essayText: string): Promise<{
    questions: SeedQuestion[];
    cost: number;
  }>;

  /**
   * Phase 2: Process a student response to a gathering question.
   * Classifies the response and detects remaining gaps.
   * Returns follow-up question if gaps remain, null if gathering is complete.
   */
  async processResponse(
    essayText: string,
    questionAsked: string,
    studentResponse: string,
    priorExchanges: Array<{ question: string; response: string; facet: string }>,
  ): Promise<{
    classification: { primaryFacet: string; extractedContent: string };
    followUpQuestion: SeedQuestion | null;
    isComplete: boolean;
    cost: number;
  }>;

  /**
   * Phase 3: Crystallize all exchanges into StudentDeclaredContext,
   * then convert to DeclaredDataEntry[].
   */
  async crystallize(
    essayText: string,
    exchanges: Array<{ question: string; response: string; facet: string }>,
  ): Promise<GatheringResult>;
}

export const gatheringService = new GatheringService();
```

### Cost Summary

| Phase | Model | Calls | Cost per call | Total |
|-------|-------|-------|---------------|-------|
| Seed questions | Sonnet | 1 | ~$0.006 | ~$0.006 |
| Classification | Haiku | 2-4 | ~$0.001 | ~$0.003 |
| Follow-up gen | Sonnet | 0-1 | ~$0.004 | ~$0.002 |
| Crystallization | Sonnet | 1 | ~$0.010 | ~$0.010 |
| **Total** | | **4-7** | | **~$0.017-0.021** |

---

## Implementation Item 2: Context Formatter

**New file**: `src/services/essayIntelligence/analysis/contextFormatters.ts` (~80 lines)

```typescript
import type { DeclaredDataEntry, DeclaredDataCategory } from '../profileTypes';

const CATEGORY_LABELS: Record<DeclaredDataCategory, string> = {
  intent: 'Intent',
  domain: 'Domain Knowledge',
  audience: 'Target Audience',
  backstory: 'Backstory',
  emotional_stakes: 'Emotional Stakes',
  voice_choice: 'Voice Choices',
  correction: 'Student Correction',
  preference: 'Student Preference',
};

/**
 * Formats DeclaredDataEntry[] into a prompt-injectable text block.
 * Reads from the unified array -- no separate data model.
 *
 * Groups by category, shows only active entries (not superseded),
 * marks tentative/exploring entries.
 *
 * @param entries  The full studentDeclaredData array from the profile
 * @param options  Optional filters for category and paragraph scope
 * @returns        Formatted string block, or '' if no entries match
 */
export function buildDeclaredDataBlock(
  entries: DeclaredDataEntry[],
  options?: {
    /** Filter to specific categories */
    categories?: DeclaredDataCategory[];
    /** Filter to specific paragraph (includes essay_wide entries) */
    paragraph?: number;
  },
): string {
  if (!entries || entries.length === 0) return '';

  // Filter: only active entries (not superseded)
  const supersededIds = new Set(
    entries.filter(e => e.supersedes).map(e => e.supersedes!),
  );
  let active = entries.filter(e => !supersededIds.has(e.id));

  // Apply optional filters
  if (options?.categories) {
    active = active.filter(e => options.categories!.includes(e.category));
  }
  if (options?.paragraph !== undefined) {
    active = active.filter(e =>
      e.location.type === 'essay_wide' ||
      e.location.paragraph === options.paragraph,
    );
  }

  if (active.length === 0) return '';

  // Group by category
  const grouped = new Map<DeclaredDataCategory, DeclaredDataEntry[]>();
  for (const entry of active) {
    const existing = grouped.get(entry.category) ?? [];
    existing.push(entry);
    grouped.set(entry.category, existing);
  }

  const lines: string[] = [
    '=== STUDENT-DECLARED CONTEXT ===',
    'The writer has shared the following about their essay. Use this to deepen',
    'your understanding -- what the text DOES may differ from what the student',
    'INTENDED, and that divergence is itself meaningful.',
    '',
  ];

  for (const [category, items] of grouped) {
    lines.push(`**${CATEGORY_LABELS[category]}**:`);
    for (const item of items) {
      const certaintyTag = item.certainty !== 'definite'
        ? ` [${item.certainty}]`
        : '';
      const scopeTag = item.location.type !== 'essay_wide'
        ? ` (P${(item.location.paragraph ?? 0) + 1}${item.location.sentence !== undefined ? `S${item.location.sentence + 1}` : ''})`
        : '';
      lines.push(`  - ${item.content}${certaintyTag}${scopeTag}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
```

---

## Implementation Item 3: Pipeline Input Extension

**Modified file**: `src/services/essayIntelligence/analysis/analysisOrchestrator.ts`

### Change 1: PipelineInput type

```typescript
// ADD to PipelineInput interface (line ~174, after priorFindings)

/**
 * Pre-gathered student declared context.
 * If provided, seeded into profile.studentDeclaredData before pipeline starts.
 * If not provided, pipeline runs without student context (current behavior).
 */
studentDeclaredContext?: StudentDeclaredContext;
```

### Change 2: Seed declared data before pipeline

In `analyzeEssay()`, after coordinator creation (line ~313) and before L1 starts:

```typescript
// ── Seed student declared data (if gathering was performed) ──
if (input.studentDeclaredContext) {
  const declaredEntries = convertToDeclaredEntries(input.studentDeclaredContext);
  coordinator.seedDeclaredData(declaredEntries);
  console.log(
    `[Orchestrator] Seeded ${declaredEntries.length} declared data entries from gathering`,
  );
}
```

### Change 3: Pass declared data to downstream layers

Each layer that receives declared data gets it from the profile:

```typescript
// L3 walkEssay call (line ~382):
// ADD to options object:
const profile = coordinator.getProfile();
l3Result = await sequentialDeepWalkService.walkEssay(
  input.essayText,
  profile as EssayProfile,
  structuralMap,
  scoutOutput,
  l1Result.impressions,
  {
    reanalysisContext: l3ReanalysisContext,
    findingStore: walkFindingStore.size > 0 ? walkFindingStore : undefined,
    studentDeclaredData: profile.studentDeclaredData?.length > 0
      ? profile.studentDeclaredData
      : undefined,
  },
);
```

---

## Implementation Item 4: L3 Walk Injection (GAP-1 + GAP-6)

**Modified file**: `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts`

### Change 1: Add option to walkEssay signature

```typescript
// Line ~410, add to options interface:
/** Student-declared data for context injection */
studentDeclaredData?: DeclaredDataEntry[];
```

### Change 2: Inject into per-paragraph user prompt

Position: AFTER essay text, BEFORE accumulated understanding context. This is the high-attention zone.

```typescript
// In buildUserPrompt() (approximately line ~440), after essay text section:

// ── Student-declared context (if available) ──
const declaredBlock = studentDeclaredData
  ? buildDeclaredDataBlock(studentDeclaredData, { paragraph: paragraphIndex })
  : '';

// Build user prompt:
const userPrompt = [
  `FULL ESSAY (${paragraphs.length} paragraphs):`,
  markedEssayText,
  '',
  // HIGH-ATTENTION ZONE: student context after essay, before accumulated understanding
  declaredBlock ? declaredBlock + '\n' : '',
  // Accumulated understanding from prior paragraphs...
  accumulatedContext,
  '',
  `TARGET: Paragraph ${paragraphIndex + 1} (P${paragraphIndex + 1})`,
  `${paragraphText}`,
  '',
  scoutLeadSection,
  findingContext,
].filter(Boolean).join('\n');
```

### Change 3: Attention-weighted token allocation (GAP-6)

Uses student-declared structural significance AND L2 structural weight to adjust per-paragraph token budgets.

```typescript
// REPLACE computeWalkMaxTokens (line ~92):

/**
 * Compute max tokens for a paragraph's walk call.
 * Base: sentence count * 200 + finding budget.
 * Multiplier: structural significance from student declarations or L2 cartography.
 *
 * StructuralWeight (from profileTypes.ts):
 *   'load_bearing' => 1.4x (these paragraphs carry the essay's argument)
 *   'supporting'   => 1.0x (baseline)
 *   'transitional'  => 0.8x (bridges between ideas, less depth needed)
 *   'decorative'    => 0.7x (scene-setting, atmosphere)
 */
const WEIGHT_MULTIPLIERS: Record<string, number> = {
  load_bearing: 1.4,
  supporting: 1.0,
  transitional: 0.8,
  decorative: 0.7,
};

function computeWalkMaxTokens(
  sentenceCount: number,
  structuralWeight?: string,
): number {
  const base = Math.max(WALK_BASE_MAX_TOKENS, sentenceCount * 200 + WALK_FINDING_BUDGET);
  const multiplier = structuralWeight
    ? (WEIGHT_MULTIPLIERS[structuralWeight] ?? 1.0)
    : 1.0;
  return Math.min(WALK_MAX_TOKENS_CAP, Math.round(base * multiplier));
}
```

Then at the call site (line ~492):

```typescript
// Get structural weight from L2 cartography or student declarations
const structuralWeight = structuralMap?.paragraphRoles?.[pIdx]?.weight;
const walkMaxTokens = computeWalkMaxTokens(sentenceCount, structuralWeight);
```

---

## Implementation Item 5: L3.75 Synthesis Injection (GAP-5)

**Modified file**: `src/services/essayIntelligence/analysis/holisticSynthesis.ts`

### Injection: User prompt, after holistic scaffold

Position: In the user prompt (not system prompt -- preserves caching). After the holistic evolution scaffold, before the output schema reminder.

```typescript
// In buildSynthesisUserPrompt(), after holistic evolution scaffold:

// ── Student-declared context ──
const declaredBlock = profile.studentDeclaredData?.length > 0
  ? buildDeclaredDataBlock(profile.studentDeclaredData)
  : '';

// Inject into user prompt
if (declaredBlock) {
  userPromptSections.push(declaredBlock);
  userPromptSections.push(
    'Note: When the student\'s declared intent diverges from what the text does,',
    'describe BOTH. The divergence is information, not an error to resolve.',
    ''
  );
}
```

### GAP-5: Topic-Fit Signal

AdmissionsPositioning does NOT have a `topicFitSignal` field. Instead of adding one, inject topic motivation context into the Phase B prompt that produces AdmissionsPositioning. The LLM naturally incorporates topic-fit assessment into the existing fields (`distinctivenessFactors`, `memorability`, `portfolioPosition`).

```typescript
// In Phase B user prompt, when student has declared audience or intent:
const topicContext = profile.studentDeclaredData?.filter(
  e => e.category === 'audience' || e.category === 'intent',
);
if (topicContext?.length) {
  phaseBPrompt += '\n\nSTUDENT CONTEXT FOR ADMISSIONS ASSESSMENT:\n';
  for (const entry of topicContext) {
    phaseBPrompt += `- ${CATEGORY_LABELS[entry.category]}: ${entry.content}\n`;
  }
  phaseBPrompt += 'Consider whether the essay\'s actual content and positioning aligns with these stated goals.\n';
}
```

---

## Implementation Item 6: L3.5 Analysis Injection (GAP-4)

**Modified file**: `src/services/essayIntelligence/analysis/analysisPass.ts`

### Change: Block 2 cached context injection

L3.5 uses 3-block caching: Block 1 (system, cached), Block 2 (essay+profile, cached across parallel paragraph calls), Block 3 (paragraph-specific, not cached).

Student declared data goes into Block 2 so it is PART of the cache key:

```typescript
// In buildBlock2Context() (the function that assembles the shared cached context):

// ── Student-declared context (cached across all parallel paragraph calls) ──
const declaredBlock = profile.studentDeclaredData?.length > 0
  ? buildDeclaredDataBlock(profile.studentDeclaredData)
  : '';

if (declaredBlock) {
  block2Sections.push(declaredBlock);
  block2Sections.push(
    'ANALYSIS DIRECTIVE: When evaluating effectiveness, consider whether the text',
    'achieves what the student intended. Intent-effect gaps are high-coaching-value findings.',
    'A sentence that "fails" by generic standards may succeed at its intended purpose,',
    'and a sentence that "works" generically may fail at the student\'s specific goal.',
    ''
  );
}
```

### GAP-4: Teaching Calibration

Student domain expertise informs teaching annotation density. When a student declares domain expertise, L3.5 should note it but NOT reduce analytical depth -- depth of analysis is constant. The teaching calibration happens in L5, not L3.5.

The injection into Block 2 context is sufficient: the analysis LLM sees the student's domain claims and factors them into effectiveness assessment. No structural changes to L3.5 needed beyond the Block 2 injection.

---

## Implementation Item 7: L4 Crystallizer Injection (GAP-3)

**Modified file**: `src/services/essayIntelligence/analysis/crystallizer.ts`

### Change 1: IntentBridge pre-population from gathering

When `studentDeclaredData` has entries with category `'intent'`, pre-populate `IntentBridge.studentIntent` before the crystallization Sonnet runs.

```typescript
// In the crystallization prompt assembly, near IntentBridge schema (line ~348):

// ── Pre-populate studentIntent from declared data ──
const intentEntries = profile.studentDeclaredData?.filter(
  e => e.category === 'intent' && !e.supersedes,
);
const declaredIntent = intentEntries?.length
  ? intentEntries.map(e => e.content).join('; ')
  : null;

// Inject into crystallization prompt
if (declaredIntent) {
  promptSections.push(
    `\nSTUDENT-DECLARED INTENT:\n"${declaredIntent}"`,
    'The IntentBridge.studentIntent should reflect this. The systemReading should',
    'reflect YOUR independent reading. Alignments should map where they agree and diverge.',
    ''
  );
}
```

### Change 2: User prompt context injection

```typescript
// In the crystallization user prompt:
const declaredBlock = profile.studentDeclaredData?.length > 0
  ? buildDeclaredDataBlock(profile.studentDeclaredData)
  : '';

if (declaredBlock) {
  userPromptSections.push(declaredBlock);
}
```

---

## Implementation Item 8: L5 Annotation Injection (GAP-4 Teaching)

**Modified file**: `src/services/essayIntelligence/analysis/deepAnnotationService.ts`

### Change: Domain-calibrated teaching

When students declare domain expertise, L5 annotations should calibrate teaching depth accordingly. A student who knows music theory doesn't need "a chord progression is a sequence of chords" explained.

```typescript
// In the L5 system prompt or phase guidance, add domain awareness:

const domainEntries = profile.studentDeclaredData?.filter(
  e => e.category === 'domain',
);
if (domainEntries?.length) {
  const domainSection = domainEntries
    .map(e => `- ${e.content}`)
    .join('\n');

  phaseGuidance += `\n\nSTUDENT DOMAIN EXPERTISE:\n${domainSection}\n` +
    'Calibrate teaching depth: do NOT explain concepts the student already knows.\n' +
    'Reference their expertise when it creates teaching leverage (e.g., "Your music theory\n' +
    'background means you understand tension/resolution -- apply that same principle to\n' +
    'your paragraph transitions").\n';
}
```

---

## Implementation Item 9: DeclaredDataMutator

**New file**: `src/services/essayIntelligence/profileManager/mutators/declaredDataMutator.ts` (~100 lines)

```typescript
import type {
  EssayProfile,
  DeclaredDataEntry,
  MutationType,
} from '../../profileTypes';

/**
 * Mutator for student-declared data on EssayProfile.
 * Handles storage, supersession, and staleness propagation.
 */
export class DeclaredDataMutator {
  /**
   * Add a new DeclaredDataEntry to the profile.
   * Handles supersession: if an entry with the same location+category exists,
   * the new entry's `supersedes` field is set to the old entry's ID.
   */
  addEntry(profile: EssayProfile, entry: DeclaredDataEntry): MutationType[] {
    const mutations: MutationType[] = [];

    // Check for supersession
    const existingIdx = profile.studentDeclaredData.findIndex(
      e => e.category === entry.category &&
        e.location.type === entry.location.type &&
        e.location.paragraph === entry.location.paragraph &&
        e.location.sentence === entry.location.sentence &&
        !e.supersedes, // Only supersede active entries
    );

    if (existingIdx >= 0) {
      entry.supersedes = profile.studentDeclaredData[existingIdx].id;
    }

    profile.studentDeclaredData.push(entry);
    mutations.push('declared_data_applied');

    return mutations;
  }

  /**
   * Seed multiple entries at once (used during gathering conversion).
   */
  seedEntries(profile: EssayProfile, entries: DeclaredDataEntry[]): MutationType[] {
    profile.studentDeclaredData = [...profile.studentDeclaredData, ...entries];
    return entries.length > 0 ? ['declared_data_applied'] : [];
  }

  /**
   * Get active entries (not superseded) for a given scope.
   */
  getActiveEntries(
    profile: EssayProfile,
    options?: { category?: string; paragraph?: number },
  ): DeclaredDataEntry[] {
    const supersededIds = new Set(
      profile.studentDeclaredData
        .filter(e => e.supersedes)
        .map(e => e.supersedes!),
    );

    return profile.studentDeclaredData.filter(e => {
      if (supersededIds.has(e.id)) return false;
      if (options?.category && e.category !== options.category) return false;
      if (options?.paragraph !== undefined) {
        return e.location.type === 'essay_wide' ||
          e.location.paragraph === options.paragraph;
      }
      return true;
    });
  }
}

export const declaredDataMutator = new DeclaredDataMutator();
```

### MutationType extension

```typescript
// ADD to MutationType union in profileTypes.ts:
| 'declared_data_applied'   // Student declared data added/updated
| 'declared_intent_applied' // Intent-specific declared data (triggers IntentBridge staleness)
| 'declared_context_applied' // Context-specific declared data (triggers holistic staleness)
```

---

## Implementation Item 10: Coordinator Extension

**Modified file**: `src/services/essayIntelligence/profileManager/essayProfileManager.ts`

```typescript
// ADD method to EssayProfileCoordinator:

/**
 * Seed student declared data from pre-analysis gathering.
 * Called once, before pipeline starts.
 */
seedDeclaredData(entries: DeclaredDataEntry[]): void {
  declaredDataMutator.seedEntries(this.profile, entries);
  console.log(
    `[Coordinator] Seeded ${entries.length} declared data entries`,
  );
}

/**
 * Add a single declared data entry from coaching extraction.
 * Handles supersession and triggers staleness propagation.
 */
addDeclaredDataEntry(entry: DeclaredDataEntry): void {
  const mutations = declaredDataMutator.addEntry(this.profile, entry);

  // Staleness propagation based on category
  if (entry.category === 'intent' || entry.category === 'correction') {
    // Intent changes make IntentBridge and analysis stale
    this.markStale('intent_bridge', 'moderate');
    if (entry.location.paragraph !== undefined) {
      this.markStale(`paragraph_analysis_${entry.location.paragraph}`, 'moderate');
    }
  }
  if (entry.category === 'domain' || entry.category === 'backstory') {
    // Context changes make holistic sections stale
    this.markStale('holistic_synthesis', 'weak');
  }
}
```

---

## Implementation Item 11: Edit Understanding Injection (GAP-7)

**Modified file**: `src/services/essayIntelligence/analysis/editUnderstandingService.ts`

### Change: Inject declared intents into edit understanding prompt

Per SYN-5 decision: inject declared intents as context, let existing `apparentPurpose` absorb alignment assessment.

```typescript
// In the Sonnet understanding prompt (Step 2-4), add declared intent context:

const intentEntries = profile.studentDeclaredData?.filter(
  e => e.category === 'intent' && !e.supersedes,
);

if (intentEntries?.length) {
  promptSections.push(
    '\nSTUDENT-DECLARED INTENT:',
    ...intentEntries.map(e => `- ${e.content}`),
    '',
    'When assessing apparentPurpose of this edit, consider whether it moves',
    'TOWARD or AWAY from the student\'s declared intent. This alignment is',
    'itself a meaningful observation.',
    ''
  );
}
```

This costs $0 (same Sonnet call, ~50 additional input tokens). The `apparentPurpose` field is already consumed by VersionTracker and coaching.

---

## Implementation Item 12: IntentGapDetector

**New file**: `src/services/essayIntelligence/analysis/intentGapDetector.ts` (~120 lines)

Runs after L3.5, before L4. Produces Findings for intent-effect gaps.

```typescript
import type { EssayProfile, Finding, FindingScope, FindingMaturity } from '../profileTypes';
import { FindingStore } from '../findings/findingStore';

/**
 * Scans profile for intent-effect gaps and converts them to Findings.
 *
 * An intent-effect gap exists when:
 * 1. Student declared intent for a location (DeclaredDataEntry with category='intent')
 * 2. The analysis of that location shows the text doing something different
 *
 * These gaps are coaching gold: they tell us WHERE the student's vision
 * diverges from the text's reality.
 *
 * No LLM call needed -- pure comparison between declared data and analysis output.
 * The gap detection is mechanical; the gap DESCRIPTION comes from existing analysis.
 */
export function detectIntentEffectGaps(
  profile: EssayProfile,
  findingStore: FindingStore,
): Finding[] {
  const newFindings: Finding[] = [];
  const intentEntries = profile.studentDeclaredData?.filter(
    e => e.category === 'intent' && !e.supersedes,
  );

  if (!intentEntries?.length) return [];

  for (const entry of intentEntries) {
    // Essay-wide intent: compare against North Star system reading
    if (entry.location.type === 'essay_wide' && profile.northStar?.intentBridge) {
      const bridge = profile.northStar.intentBridge;
      const divergent = bridge.alignments.filter(
        a => a.alignment === 'divergent' || a.alignment === 'student_unaware',
      );

      for (const alignment of divergent) {
        const finding: Finding = {
          id: `F-gap-${entry.id}-${alignment.aspect}`,
          source: 'intent_gap',
          scope: { type: 'essay' },
          maturity: 'hypothesis',
          coachingValue: 'critical',
          content: `Intent-effect gap: Student declares "${entry.content}" but the essay's ${alignment.aspect} shows "${alignment.detail}"`,
          evidence: [{
            location: { type: 'essay' },
            text: alignment.detail,
            reasoning: `Student intent: "${entry.content}". Essay behavior: "${alignment.detail}". Alignment: ${alignment.alignment}.`,
          }],
          lineage: [{
            iteration: 0,
            action: 'created',
            reasoning: 'Detected divergence between student-declared intent and essay behavior',
            timestamp: new Date().toISOString(),
          }],
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
          deepeningPotential: 'The student may not realize this gap exists -- confirming or explaining it would advance their understanding',
          iterationsSurvived: 0,
        };

        findingStore.addFinding(finding);
        newFindings.push(finding);
      }
    }

    // Paragraph-specific intent: compare against paragraph analysis
    if (entry.location.type === 'paragraph' && entry.location.paragraph !== undefined) {
      const paraIdx = entry.location.paragraph;
      const paraProfile = profile.paragraphs[paraIdx];
      if (!paraProfile?.analysis) continue;

      // Check if paragraph analysis mentions divergence from intent
      // This is a soft check -- the analysis may or may not have noticed
      const analysis = paraProfile.analysis;
      if (analysis.effectivenessAssessment) {
        const finding: Finding = {
          id: `F-gap-${entry.id}-p${paraIdx}`,
          source: 'intent_gap',
          scope: { type: 'paragraph', paragraph: paraIdx },
          maturity: 'hypothesis',
          coachingValue: 'critical',
          content: `Intent-effect gap at P${paraIdx + 1}: Student intends "${entry.content}" but analysis assesses effectiveness as: ${analysis.effectivenessAssessment}`,
          evidence: [{
            location: { type: 'paragraph', paragraph: paraIdx },
            text: analysis.effectivenessAssessment,
            reasoning: `Declared intent vs analysis assessment at paragraph ${paraIdx + 1}`,
          }],
          lineage: [{
            iteration: 0,
            action: 'created',
            reasoning: 'Detected potential divergence between student intent and paragraph effectiveness',
            timestamp: new Date().toISOString(),
          }],
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
          deepeningPotential: 'Student input could confirm whether this gap is real or a misreading',
          iterationsSurvived: 0,
        };

        findingStore.addFinding(finding);
        newFindings.push(finding);
      }
    }
  }

  return newFindings;
}
```

### Orchestrator integration

In `analysisOrchestrator.ts`, between Phase 4 (L3.5) and Phase 5 (L4):

```typescript
// ── Intent-Effect Gap Detection (between L3.5 and L4) ──
if (coordinator.getProfile().studentDeclaredData?.length > 0) {
  const gapFindings = detectIntentEffectGaps(
    coordinator.getProfile() as EssayProfile,
    coordinator.getFindingStore(),
  );
  if (gapFindings.length > 0) {
    console.log(
      `[Orchestrator] Detected ${gapFindings.length} intent-effect gap findings`,
    );
  }
}
```

Cost: $0 (pure logic, no LLM call).

---

## Implementation Item 13: Coaching Intelligence Extraction (L6)

**Modified file**: `src/services/essayIntelligence/coaching/coachingService.ts`

### Change 1: Stage 4 declaredEntries extraction

Add `declaredEntries` to Stage 4 Sonnet output schema for `reinterpretation` and `new_context` categories:

```typescript
// In Stage 4 Sonnet prompt, extend output schema:
`"declaredEntries": [
  {
    "category": "intent" | "domain" | "backstory" | "emotional_stakes" | "voice_choice" | "correction",
    "content": "extracted declaration in the student's words",
    "certainty": "definite" | "tentative" | "exploring",
    "location": { "type": "essay_wide" } | { "type": "paragraph", "paragraph": <0-based> }
  }
]`
```

After Stage 4 completes, convert to DeclaredDataEntry and apply:

```typescript
// After Stage 4 Sonnet response processing:
if (stage4Output.declaredEntries?.length) {
  for (const raw of stage4Output.declaredEntries) {
    const entry: DeclaredDataEntry = {
      id: `D${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      category: raw.category,
      location: raw.location,
      content: raw.content,
      certainty: raw.certainty,
      source: 'coaching',
      sourceInsightId: insightExtracted?.id,
    };
    coordinator.addDeclaredDataEntry(entry);
  }
}
```

### Change 2: Haiku extraction for correction/preference

For `correction` and `preference` categories (which skip Stage 4 Sonnet), add a lightweight Haiku call:

```typescript
// After Stage 1 classification, if category is 'correction' or 'preference':
if (['correction', 'preference'].includes(stage1Category)) {
  const extractionResponse = await callClaude<{ declaredEntries: Array<{ category: string; content: string; location: LocationScope; certainty: string }> }>({
    model: HAIKU,
    systemPrompt: 'Extract structured declarations from the student message.',
    userPrompt: `Student message: "${studentMessage}"\nCategory: ${stage1Category}\n\nExtract as JSON: { "declaredEntries": [{ "category": "...", "content": "...", "location": {...}, "certainty": "..." }] }`,
    maxTokens: 512,
    temperature: 0.1,
    useJsonMode: true,
    cacheSystemPrompt: true,
  });
  // Process entries...
}
```

Cost: ~$0.001 per correction/preference coaching turn.

### Change 3: Question injection (Stage 2.5)

```typescript
// In Stage 2.5 (context routing), inject top student-facing question:
if (questionQueueManager) {
  const studentQuestions = questionQueueManager.getTopQuestions(1, { targetAudience: 'student' });
  if (studentQuestions.length > 0) {
    stage3Context.pendingQuestion = studentQuestions[0];
  }
}
```

---

## Implementation Item 14: UnderstandingQuestion Extension

**Modified file**: `src/services/essayIntelligence/profileTypes.ts`

```typescript
// ADD to UnderstandingQuestion interface:

/** Who should answer this question: the system (via deep dive/re-read)
 *  or the student (via coaching conversation). */
targetAudience: 'system' | 'student';
```

Default: `'system'` (backward compatible). Walk and synthesis prompts extended to classify questions by audience during generation.

---

## Implementation Item 15: Profile Initialization

**Modified files**:
- `src/services/essayIntelligence/profileManager/essayProfileManager.ts` -- add `studentDeclaredData: []` to `createEmptyProfile()`
- `src/services/essayIntelligence/versioning/` -- include `studentDeclaredData` in snapshot serialization

---

## Cost Summary Table

| Component | Model | Calls | Cost per call | Total cost |
|-----------|-------|-------|---------------|------------|
| **Gathering Phase 1** (seed questions) | Sonnet | 1 | ~$0.006 | ~$0.006 |
| **Gathering Phase 2** (classification) | Haiku | 2-4 | ~$0.001 | ~$0.003 |
| **Gathering Phase 2** (follow-up gen) | Sonnet | 0-1 | ~$0.004 | ~$0.002 |
| **Gathering Phase 3** (crystallization) | Sonnet | 1 | ~$0.010 | ~$0.010 |
| **Pipeline injection** (L3/L3.5/L3.75/L4/L5) | N/A | 0 | $0 | $0 |
| **Intent gap detection** (post-L3.5) | N/A | 0 | $0 | $0 |
| **L6 correction/preference extraction** | Haiku | 0-1 | ~$0.001 | ~$0.001 |
| **L6 Stage 4 declared entries** | N/A | 0 | $0 | $0 |
| **SYN-2: Finding question promoter** | Haiku | 0-1 | ~$0.002 | ~$0.002 |
| **TOTAL (gathering + first analysis)** | | **4-8** | | **~$0.017-0.024** |
| **TOTAL (per coaching turn)** | | **0-1** | | **$0-0.001** |

---

## Execution Order with Verification Steps

### Phase A: Types and Foundation (Items 1-2, 9-10, 14-15)

1. Add types to `profileTypes.ts` (DeclaredDataEntry, DeclaredDataCategory, LocationScope, StudentCertainty, StudentDeclaredContext)
2. Add `studentDeclaredData: DeclaredDataEntry[]` to EssayProfile
3. Add `targetAudience` to UnderstandingQuestion
4. Add MutationType extensions
5. Create `contextFormatters.ts`
6. Create `declaredDataMutator.ts`
7. Extend coordinator (seedDeclaredData, addDeclaredDataEntry)
8. Update createEmptyProfile, snapshot serialization

**Verification**: `npx tsc --noEmit` passes. All existing tests pass unchanged.

### Phase B: GatheringService (Item 1)

1. Create `gatheringService.ts`
2. Implement Phase 1 (seed questions)
3. Implement Phase 2 (classification + gap detection)
4. Implement Phase 3 (crystallization)
5. Implement `convertToDeclaredEntries()`

**Verification**: Unit test with real Sonnet/Haiku calls. Verify:
- 2-3 seed questions generated, each targeting a different facet
- Classification produces valid facet labels
- Crystallization produces valid StudentDeclaredContext
- Conversion produces valid DeclaredDataEntry[]
- Total cost < $0.025

### Phase C: Pipeline Integration (Items 3-8, 11-12)

1. Extend PipelineInput
2. Add seeding in orchestrator
3. L3 walk injection
4. L3.75 synthesis injection
5. L3.5 analysis Block 2 injection
6. L4 crystallizer injection
7. L5 annotation injection
8. Edit understanding injection
9. IntentGapDetector
10. Orchestrator gap detection integration

**Verification**: End-to-end pipeline test with and without gathering:
- Pipeline WITHOUT gathering: identical output to current behavior
- Pipeline WITH gathering: declared data visible in walk/synthesis/analysis prompts
- IntentBridge.studentIntent populated when gathering provides intent
- Token counts reasonable (Block 2 grows by ~200-400 tokens)
- L3.5 cache hits confirmed (Block 2 is shared across parallel calls)
- Intent-effect gap findings created when divergences exist

### Phase D: Coaching Integration (Item 13)

1. Stage 4 declaredEntries schema extension
2. Haiku extraction for correction/preference
3. Question injection (Stage 2.5)
4. Wire QuestionQueueManager to coaching service

**Verification**: Coaching integration test:
- Student says "I meant this as irony" -> DeclaredDataEntry with category='correction'
- Student says "This essay is for MIT" -> DeclaredDataEntry with category='audience'
- Student-facing question from queue appears in coaching response
- Stage 4 produces finding maturity transitions when student confirms/denies

### Phase E: Synergies (SYN-1 through SYN-9)

1. SYN-4: IntentBridge auto-population from accumulated intent entries
2. SYN-5: Edit understanding intent injection
3. SYN-6: Finding maturity via Stage 4 confirmation
4. SYN-7: Staleness propagation for declared data
5. SYN-1: L3.75 dimensionConfidence output
6. SYN-2: FindingQuestionPromoter
7. SYN-3: Connection-gap questions in L3.75
8. SYN-8: Finding resolution ladder soft gate
9. SYN-9: Phase-aware question filtering in Stage 2.5

**Verification**: Each synergy has $0-0.002 marginal cost. Total synergy cost < $0.005.

---

## File Inventory

### New Files (4 files, ~600 lines)

| File | Lines | Purpose |
|------|-------|---------|
| `src/services/essayIntelligence/analysis/gatheringService.ts` | ~300 | Pre-analysis gathering service |
| `src/services/essayIntelligence/analysis/contextFormatters.ts` | ~80 | buildDeclaredDataBlock() utility |
| `src/services/essayIntelligence/analysis/intentGapDetector.ts` | ~120 | Intent-effect gap -> Finding detection |
| `src/services/essayIntelligence/profileManager/mutators/declaredDataMutator.ts` | ~100 | DeclaredDataEntry CRUD + supersession |

### Modified Files (9 files)

| File | Change | Lines added |
|------|--------|-------------|
| `profileTypes.ts` | Types: DeclaredDataEntry, StudentDeclaredContext, MutationType, targetAudience | ~80 |
| `analysisOrchestrator.ts` | PipelineInput extension, seeding, gap detection integration | ~30 |
| `sequentialDeepWalk.ts` | walkEssay option, user prompt injection, computeWalkMaxTokens multiplier | ~40 |
| `holisticSynthesis.ts` | User prompt declared data injection + topic-fit context | ~20 |
| `analysisPass.ts` | Block 2 declared data injection | ~20 |
| `crystallizer.ts` | IntentBridge pre-population + user prompt injection | ~25 |
| `deepAnnotationService.ts` | Domain-calibrated teaching guidance | ~15 |
| `editUnderstandingService.ts` | Declared intent context injection | ~15 |
| `essayProfileManager.ts` | seedDeclaredData(), addDeclaredDataEntry(), createEmptyProfile | ~30 |

**Total estimated diff**: ~455 lines added across 13 files.
