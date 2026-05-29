# LLM-Based PIQ Analyzer Architecture

**Date**: 2025-11-19
**Status**: Design Phase - Ready for Implementation

## Executive Summary

We're pivoting from regex-based pattern matching to **LLM-based semantic analysis** for all 13 PIQ dimensions to achieve the same quality and dynamic intelligence as the extracurricular workshop system (19 iterations of proven success).

## Why LLM-Based?

### Problems with Regex Approach:
- ❌ Cannot understand **semantic meaning** or **intent**
- ❌ Feels robotic and template-based
- ❌ Requires constant calibration for edge cases
- ❌ Can't detect subtle narrative nuances
- ❌ Misses context and thematic consistency

### Benefits of LLM Approach:
- ✅ Understands **meaning, not just literal strings**
- ✅ Detects subtle storytelling techniques
- ✅ Provides authentic, specific feedback
- ✅ Self-calibrating through prompt engineering
- ✅ Proven to work (extracurricular workshop)

---

## Architecture Overview

### 1. **Analyzer Call Pattern** (from extracurricular workshop)

```typescript
import { callClaude } from '@/lib/llm/claude';

export async function analyzeDimension<T>(
  essayText: string,
  dimensionConfig: DimensionConfig
): Promise<DimensionAnalysis> {

  const systemPrompt = buildSystemPrompt(dimensionConfig);
  const userPrompt = buildUserPrompt(essayText, dimensionConfig);

  const response = await callClaude<T>(userPrompt, {
    model: 'claude-sonnet-4-20250514',
    temperature: 0.3, // Low temperature for consistent scoring
    maxTokens: 2048,
    systemPrompt,
    useJsonMode: true, // Structured output
  });

  return response.content;
}
```

### 2. **Prompt Engineering Philosophy**

**System Prompt Structure:**
```
1. Role Definition: "You are an elite UC admissions evaluator..."
2. Scoring Philosophy: BRUTALLY strict, evidence-based
3. Dimension Definition: What this measures
4. Scoring Anchors: 0/10, 5/10, 10/10 examples
5. Evaluator Prompts: Questions to guide analysis
6. Warning Signs: Red flags to penalize
7. Output Format: Structured JSON schema
```

**Key Principles:**
- **Scores must be EARNED** - start from 0, only increase for strong evidence
- **Quote exact text** - all judgments backed by evidence
- **Calibration examples** - anchor scores to real essays
- **Strict standards** - 80+ = Stanford/MIT tier, 70-80 = UC Berkeley tier

---

## Implementation Plan

### Phase 1: Create LLM Analyzer Base Class

**File**: `src/services/unified/features/_llmAnalyzerBase.ts`

```typescript
export interface DimensionConfig {
  name: string;
  display_name: string;
  weight: number;
  definition: string;
  anchor_0: string; // What a 0/10 looks like
  anchor_5: string; // What a 5/10 looks like
  anchor_10: string; // What a 10/10 looks like
  evaluator_prompts: string[]; // Questions to guide LLM
  warning_signs: string[]; // Red flags
}

export interface DimensionAnalysis {
  score: number; // 0-10
  quality_level: string; // e.g., 'exceptional', 'strong', 'weak'
  evidence_quotes: string[]; // Direct quotes from essay
  evaluator_note: string; // 1-2 sentence explanation
  strengths: string[];
  weaknesses: string[];
  quick_wins: string[]; // Actionable improvements
}
```

### Phase 2: Define All 13 Dimensions

**File**: `src/services/unified/rubrics/piqDimensions.ts`

```typescript
export const PIQ_DIMENSIONS: Record<string, DimensionConfig> = {

  // PHASE 1 (Currently implemented with regex)
  opening_hook: {
    name: 'opening_hook',
    display_name: 'Opening Hook & First Impression',
    weight: 0.08,
    definition: 'How effectively does the opening sentence/paragraph capture attention and set up stakes?',
    anchor_0: 'Generic opening ("I have always been interested in..."), no tension',
    anchor_5: 'Clear setup with some specificity, hints at stakes',
    anchor_10: 'Vivid, specific opening that immediately creates tension or intrigue',
    evaluator_prompts: [
      'Does the first sentence make you want to keep reading?',
      'Is there immediate specificity (time/place/sensory detail)?',
      'Do we feel stakes or tension from the start?',
    ],
    warning_signs: [
      'Starts with "I have always..."',
      'Generic topic announcement',
      'No immediate tension or stakes',
    ],
  },

  vulnerability: {
    name: 'vulnerability',
    display_name: 'Vulnerability & Emotional Authenticity',
    weight: 0.12,
    definition: 'Does the student show genuine emotional stakes, fears, or personal struggles?',
    anchor_0: 'Purely factual, no emotional content',
    anchor_5: 'Mentions challenges but stays surface-level',
    anchor_10: 'Deep vulnerability, specific fears/emotions, risks reputation',
    evaluator_prompts: [
      'Does the student admit fears, doubts, or failures?',
      'Is there genuine emotional exposure?',
      'Do we see internal struggle or uncertainty?',
    ],
    warning_signs: [
      'Humblebrag failures ("I worked too hard")',
      'No admission of genuine struggle',
      'Purely external/logistical challenges',
    ],
  },

  // ... (Continue for all 13 dimensions)

  // PHASE 3 (New dimensions)
  role_clarity_ownership: {
    name: 'role_clarity_ownership',
    display_name: 'Role Clarity & Individual Ownership',
    weight: 0.07,
    definition: 'Does the essay clarify the student\'s specific role and differentiate their contributions from the team?',
    anchor_0: 'All "we" statements, vague "helped with", no individual role',
    anchor_5: 'Mix of "I" and "we", some role clarity',
    anchor_10: '80%+ "I" statements, specific role description, clear differentiation',
    evaluator_prompts: [
      'Can you tell exactly what THIS student did vs what the team did?',
      'Is there a specific role description or just a title?',
      'Does the student own failures personally ("I messed up")?',
    ],
    warning_signs: [
      'Vague language: "helped with", "was part of", "contributed to"',
      'Dominance of "we" statements',
      'No personal failure ownership',
    ],
  },

  context_circumstances: {
    name: 'context_circumstances',
    display_name: 'Context & Circumstances',
    weight: 0.06,
    definition: 'Does the essay provide context about obstacles, constraints, or unique circumstances that shaped the experience?',
    anchor_0: 'No context provided, reads like anyone could have done this',
    anchor_5: 'Some context about setting or constraints',
    anchor_10: 'Specific obstacles named (financial, family, systemic), shows resourcefulness despite constraints',
    evaluator_prompts: [
      'What obstacles or constraints did the student face?',
      'Is there evidence of resourcefulness or creative problem-solving?',
      'Does the essay avoid victimhood while acknowledging challenges?',
    ],
    warning_signs: [
      'Generic hardship without specifics',
      'Victimhood tone (blaming without agency)',
      'Privilege-blind (no awareness of advantages)',
    ],
  },

  voice_style: {
    name: 'voice_style',
    display_name: 'Voice & Writing Style',
    weight: 0.06,
    definition: 'Is the writing voice conversational and authentic, or does it sound like "essay-speak"?',
    anchor_0: 'Heavy essay-speak, AI-generated feel, zero personality',
    anchor_5: 'Mix of conversational and formal, some personality',
    anchor_10: 'Distinctive voice, sounds like a real person talking, zero essay-speak',
    evaluator_prompts: [
      'Does this sound like a real 17-year-old or a robot?',
      'Is there essay-speak ("this taught me", "through this experience")?',
      'Do we get a sense of the student\'s personality through word choice?',
    ],
    warning_signs: [
      'Reflective clichés: "this taught me that", "through this experience"',
      'AI phrases: "in conclusion", "upon reflection"',
      'Fancy vocabulary that sounds forced',
    ],
  },

  initiative_leadership: {
    name: 'initiative_leadership',
    display_name: 'Initiative & Leadership',
    weight: 0.07,
    definition: 'Does the essay show proactive initiative, problem-identification, or self-directed action?',
    anchor_0: 'Pure participation, no initiative shown',
    anchor_5: 'Some self-directed action, follows through on tasks',
    anchor_10: 'Spots problems others miss, creates opportunities, takes risks, teaches themselves',
    evaluator_prompts: [
      'Did the student identify a problem or gap before taking action?',
      'Is there evidence of self-directed learning or risk-taking?',
      'Did they create something from scratch vs joining existing?',
    ],
    warning_signs: [
      'Reactive language: "I was assigned", "I was told to"',
      'No problem identification',
      'Participation without creation',
    ],
  },

  fit_trajectory: {
    name: 'fit_trajectory',
    display_name: 'Fit & Academic Trajectory',
    weight: 0.07,
    definition: 'Does the essay connect the experience to future academic interests or career trajectory?',
    anchor_0: 'No connection to future, one-time experience',
    anchor_5: 'Mentions major or career but connection feels forced',
    anchor_10: 'Clear trajectory from experience → major/research, UC-specific details, continued commitment',
    evaluator_prompts: [
      'Is there a logical connection between this experience and their intended major?',
      'Does the student mention specific UC programs, professors, or resources?',
      'Is there evidence of continued commitment beyond this one experience?',
    ],
    warning_signs: [
      'Generic mission statements: "I want to help people", "change the world"',
      'No UC-specific details',
      'One-time experience with no follow-through',
    ],
  },
};
```

### Phase 3: Implement LLM Analyzer for Each Dimension

**Example**: `initiativeLeadershipAnalyzer_llm.ts`

```typescript
import { callClaude } from '@/lib/llm/claude';
import { PIQ_DIMENSIONS } from '../rubrics/piqDimensions';
import { DimensionAnalysis } from './_llmAnalyzerBase';

export async function analyzeInitiativeLeadership(essayText: string): Promise<DimensionAnalysis> {
  const dimension = PIQ_DIMENSIONS.initiative_leadership;

  const systemPrompt = `You are an elite UC admissions evaluator analyzing essays for Initiative & Leadership.

**Definition**: ${dimension.definition}

**Scoring Anchors**:
- **0/10**: ${dimension.anchor_0}
- **5/10**: ${dimension.anchor_5}
- **10/10**: ${dimension.anchor_10}

**Evaluator Prompts**:
${dimension.evaluator_prompts.map(p => `- ${p}`).join('\n')}

**Warning Signs (penalize)**:
${dimension.warning_signs.map(w => `- ${w}`).join('\n')}

**CRITICAL CALIBRATION**:
- Be BRUTALLY strict - scores must be EARNED
- Most essays score 3-5/10, not 5-7/10
- Quote exact text to justify your score
- 8+/10 is reserved for top 5% of essays

**Output Format**: Return a JSON object with:
{
  "score": <number 0-10 with decimals>,
  "quality_level": "<exceptional|strong|acceptable|weak|very_weak>",
  "evidence_quotes": ["<quote 1>", "<quote 2>"],
  "evaluator_note": "<1-2 sentence explanation>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "quick_wins": ["<actionable improvement 1>"]
}`;

  const userPrompt = `Analyze this essay for Initiative & Leadership:\n\n---\n\n${essayText}\n\n---\n\nProvide your analysis as JSON.`;

  const response = await callClaude<DimensionAnalysis>(userPrompt, {
    model: 'claude-sonnet-4-20250514',
    temperature: 0.3,
    maxTokens: 2048,
    systemPrompt,
    useJsonMode: true,
  });

  return response.content;
}
```

---

## Cost & Performance Considerations

### Cost per Essay (13 LLM calls):
- Model: Claude Sonnet 4
- Input: ~1000 tokens/call (essay + prompt)
- Output: ~500 tokens/call (JSON response)
- **Total: ~19,500 tokens per essay**
- **Cost: ~$0.12 per essay** (at current Sonnet 4 pricing)

### Performance:
- Sequential: ~13-20 seconds per essay (13 calls × 1-1.5s each)
- **Parallel batching** (like extracurricular): ~5-7 seconds (3 batches)

### Optimization Strategy:
```typescript
// Batch dimensions into 3 parallel calls
const DIMENSION_BATCHES = {
  narrative_focused: [
    'opening_hook',
    'vulnerability',
    'narrative_arc',
    'reflection_depth',
  ],
  content_focused: [
    'specificity',
    'transformation',
    'fit_trajectory',
    'context_circumstances',
  ],
  craft_focused: [
    'voice_style',
    'role_clarity_ownership',
    'initiative_leadership',
    'vividness',
    'intellectual_depth',
  ],
};
```

---

## Migration Path

### Option A: Full Rewrite (Recommended)
1. Build all 13 LLM analyzers from scratch
2. Parallel development with current system
3. A/B test both systems
4. Cut over when LLM system passes validation

### Option B: Hybrid Approach
1. Keep Phase 1 & 2 regex analyzers (8/13 dims)
2. Only rebuild Phase 3 analyzers (5/13 dims) with LLM
3. Gradual migration

**Recommendation**: **Option A** - Full rewrite ensures consistency and quality across all dimensions.

---

## Next Steps

1. ✅ Review this architecture
2. ⏳ Get approval to proceed
3. ⏳ Implement LLM analyzer base system
4. ⏳ Build all 13 dimension analyzers
5. ⏳ Create comprehensive test suite
6. ⏳ Validate against real essays
7. ⏳ Deploy to production

**Estimated Timeline**:
- Architecture design: ✅ Complete
- Implementation: 8-12 hours (with focus)
- Testing & validation: 4-6 hours
- **Total: 12-18 hours to world-class PIQ system**

---

## Questions for You

1. **Approve full LLM rewrite?** (vs hybrid approach)
2. **Cost acceptable?** (~$0.12 per essay vs current $0)
3. **Performance acceptable?** (5-7 seconds vs <1 second)
4. **Should we keep old analyzers as fallback?** (in case API down)

Let me know and I'll start building immediately!
