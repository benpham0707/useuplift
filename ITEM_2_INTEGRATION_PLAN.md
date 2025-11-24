# Item 2: Enhanced Feedback Integration Plan

## Current Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ Test: test-final-lego.ts                                     │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ surgicalOrchestrator.ts                                       │
│   • Calls: getRubricScores()                                  │
│   • Returns: RubricScoringResult with dimension_scores[]      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ analyzers/rubricAnalysisService.ts                            │
│   • Calls LLM in batches (4 dimensions at a time)             │
│   • Returns: DimensionRawScore[] with simple evidence          │
│     {                                                          │
│       dimension_name,                                          │
│       score,                                                   │
│       evidence: {                                              │
│         quotes: string[],                                      │
│         justification: string,                                 │
│         anchors_met: number[]                                  │
│       }                                                        │
│     }                                                          │
└────────────────────────────────────────────────────────────────┘
```

## What We Need

We need to enhance the `evidence` object to include:
- Calibration context (percentile, competitive benchmark)
- Tier breakdown (current → next tier with gap analysis)
- What they did well (authentic praise)
- Essay-specific next steps (personalized guidance)

## Integration Strategy

### Option A: Enhance rubricAnalysisService (Recommended)

**Pros:**
- Single point of integration
- All tests automatically get enhanced feedback
- Maintains existing API surface

**Cons:**
- Adds more LLM calls (but can be parallelized)

**Implementation:**
1. After getting basic LLM scores in `rubricAnalysisService.ts`
2. For each dimension, call the dedicated rich analyzer (if available)
3. Use `feedbackFormatter.ts` to merge basic + rich data
4. Return enhanced evidence

### Option B: Post-Process in surgicalOrchestrator

**Pros:**
- Doesn't change rubricAnalysisService
- Can be feature-flagged

**Cons:**
- Two places to maintain
- More complex data flow

## Recommended Approach: Option A with Smart Caching

```typescript
// In rubricAnalysisService.ts

import { formatEnhancedFeedback } from '../unified/feedbackFormatter';
import { analyzeNarrativeArc } from '../unified/features/narrativeArcAnalyzer_llm';
import { analyzeVulnerability } from '../unified/features/vulnerabilityAnalyzer_llm';
// ... other analyzers

// Map dimension names to their rich analyzers
const RICH_ANALYZERS = {
  'narrative_arc_stakes_turn': analyzeNarrativeArc,
  'character_interiority_vulnerability': analyzeVulnerability,
  'show_dont_tell_craft': analyzeCraft,
  'opening_power_scene_entry': analyzeOpeningHookV5,
  // ... etc
};

async function enhanceEvidence(
  dimensionName: string,
  score: number,
  basicEvidence: any,
  essayText: string
): Promise<EnhancedDimensionEvidence> {

  // If we have a rich analyzer for this dimension, use it
  const richAnalyzer = RICH_ANALYZERS[dimensionName];

  if (richAnalyzer) {
    try {
      const richAnalysis = await richAnalyzer(essayText);

      // Use feedbackFormatter to merge basic + rich data
      return formatEnhancedFeedback(
        dimensionName,
        score,
        richAnalysis,
        essayText,
        { personalization_level: 'high' }
      );
    } catch (error) {
      console.warn(`Failed to get rich analysis for ${dimensionName}:`, error);
      // Fall back to basic evidence
    }
  }

  // Fallback: Use feedbackFormatter with basic data only
  return formatEnhancedFeedback(
    dimensionName,
    score,
    {
      score,
      evidence_quotes: basicEvidence.quotes,
      evaluator_note: basicEvidence.justification,
      strengths: [],
      weaknesses: [],
      strategic_pivot: basicEvidence.constructive_feedback
    } as any,
    essayText,
    { personalization_level: 'medium' }
  );
}
```

## Implementation Steps

### Step 1: Add Rich Analyzer Mapping

Create a mapping in `rubricAnalysisService.ts` that connects dimension names to their rich LLM analyzers.

### Step 2: Enhance getRubricScores

Modify `getRubricScores()` to:
1. Get basic scores (current flow)
2. **In parallel**, call rich analyzers for each dimension
3. Merge results using `feedbackFormatter`

### Step 3: Update Return Type

Change `DimensionRawScore` to return `EnhancedDimensionEvidence`:

```typescript
export interface DimensionRawScore {
  dimension_name: string;
  score: number;
  evidence: EnhancedDimensionEvidence; // Instead of simple evidence
}
```

### Step 4: Update Downstream Consumers

Update any code that expects the old simple evidence structure to handle the new enhanced structure (backwards compatible via legacy fields).

## Performance Considerations

**Current:**
- 3 LLM calls (batches of 4 dimensions each)

**Enhanced:**
- 3 LLM calls (batches) + up to 13 individual rich analyzer calls
- Total: ~16 LLM calls

**Optimization:**
- Run all rich analyzer calls in parallel
- Each call is independent
- With parallel execution: ~same latency as current (dominated by batch calls)

**Cost:**
- Current: ~3 calls × 2K tokens = 6K tokens
- Enhanced: 6K + (13 × 1.5K) = ~25K tokens per essay
- At $3/M tokens (input): ~$0.08 per essay (acceptable)

## Testing Plan

1. **Unit Test:** Test `feedbackFormatter` with mock LLM data
2. **Integration Test:** Run on Lego essay and compare before/after
3. **Quality Check:** Verify all 13 dimensions have enhanced feedback
4. **Regression Check:** Ensure scores haven't changed (only feedback improved)

## Success Criteria

After integration, the test output should show:

### Before (Current):
```json
{
  "dimension_name": "opening_power_scene_entry",
  "score": 4,
  "evidence": {
    "quotes": ["I was always captivated by puzzles..."],
    "justification": "Generic opening lacks power",
    "constructive_feedback": "Start with a specific moment"
  }
}
```

### After (Enhanced):
```json
{
  "dimension_name": "opening_power_scene_entry",
  "score": 4,
  "evidence": {
    "quotes": ["I was always captivated by puzzles..."],
    "what_we_see": "Looking at your essay, you open with a generic statement about being 'captivated by puzzles'",
    "what_works_well": [
      "You quickly provide specific ages (7 years old, 8th birthday)",
      "Concrete details (Ninjago set, 1000-piece puzzles)",
      "Authentic voice in describing the spacecraft transformation"
    ],
    "specific_opportunities": [
      "Opening line is abstract and predictable",
      "Essay announces topic instead of showing it",
      "Doesn't drop reader into a scene"
    ],
    "score_context": {
      "your_score": 4,
      "percentile_range": "Bottom 30%",
      "competitive_benchmark": "Most admitted students: 7-9",
      "what_this_means": "Your essay needs significant strengthening..."
    },
    "tier_breakdown": {
      "current_tier_name": "TIER 1: Weak Opening",
      "current_tier_description": "Generic, abstract, or clichéd opening...",
      "next_tier_name": "TIER 2: Adequate Opening",
      "gap_analysis": "To advance from Tier 1 to Tier 2, you need to...",
      "path_to_next_tier": [...]
    },
    "concrete_next_step": {
      "diagnosis": "Your opening starts with a generic statement",
      "prescription": "Start with a specific visual moment",
      "essay_specific_example": "Look at line 42 where you describe the Ninjago transformation...",
      "rewrite_suggestion": "..."
    }
  }
}
```

## Timeline

- **Phase 1:** Add rich analyzer mapping (15 min)
- **Phase 2:** Implement enhancement logic (30 min)
- **Phase 3:** Test on Lego essay (15 min)
- **Phase 4:** Document results (15 min)

**Total:** ~75 minutes for complete implementation and testing
