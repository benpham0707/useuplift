# Model Comparison Plan: Claude vs GPT-5

## Overview

We're conducting comprehensive A/B testing to determine which LLM provides the best results for the Narrative Workshop essay analysis system.

## Testing Framework Built

### 1. **Unified LLM Interface** ([src/lib/llm/unified.ts](src/lib/llm/unified.ts))

**Capabilities**:
- Single interface supporting both Claude (Anthropic) and GPT-5 (OpenAI)
- Automatic JSON parsing for both providers
- Token usage tracking
- Cost estimation
- Parallel model comparison

**Key Functions**:
```typescript
callUnifiedLLM(prompt, { provider: 'claude' | 'gpt5', ... })
compareModels(prompt, options) // Runs both in parallel
```

### 2. **Comprehensive Test Suite** ([test-model-comparison.ts](test-model-comparison.ts))

**Test Essays**:
1. **Elite Essay** (Guatemala Medical - Expected: 85-95)
   - Has 2+ vulnerability moments ✓
   - Micro→macro structure ✓
   - Quantified impact (14-hour days, 200 patients, 2 years, 8 AM-4 PM) ✓
   - Sensory opening ("worst stench") ✓
   - Cultural specificity (Spanish, Guatemala) ✓

2. **Mid-Tier Essay** (Philosophy Club - Expected: 70-80)
   - Decent structure, some specificity
   - Leadership demonstrated
   - Missing vulnerability and sensory details
   - Somewhat generic reflection

3. **Weak Essay** (Generic Volunteering - Expected: 40-55)
   - Essay-speak ("passionate," "journey," "make a difference")
   - No vulnerability, all telling
   - Generic clichés
   - No specific details or numbers

**Evaluation Criteria** (Weighted):
1. **Accuracy to Elite Standards** (25%)
   - Proper scoring calibration
   - Vulnerability detection
   - Micro→macro identification

2. **Insight Specificity** (20%)
   - Sentence-level precision
   - Before/after examples
   - Actionable suggestions

3. **Dimension Calibration** (15%)
   - Nuanced scoring (not all same)
   - Appropriate variance
   - 12-dimension coverage

4. **Actionability** (20%)
   - Quality of improvement roadmap
   - Quick wins, strategic moves, transformative moves
   - Time and impact estimates

5. **Comparative Context Quality** (10%)
   - Percentile estimation
   - vs typical applicant comparison
   - vs top 10% comparison
   - Competitive advantages identified

6. **Admissions Officer Perspective** (10%)
   - First impression quality
   - Memorability factor
   - Concerns and positive signals

## Current Test Status

### Phase 1: Claude Baseline (IN PROGRESS)
Running all 3 essays through Claude Sonnet 4.5 to establish baseline performance.

**What We're Measuring**:
- Overall scores vs expected ranges
- Weighted evaluation score (0-10)
- Analysis duration
- Token usage
- Estimated cost per essay
- Quality of insights generated

### Phase 2: GPT-5 Comparison (NEXT)
Will require modifying the orchestrator to support provider selection, then running same essays through GPT-4o.

### Phase 3: Iterative Refinement (PLANNED)
Based on results, we'll:
1. Identify which model performs better overall
2. Identify specific strengths/weaknesses of each
3. Potentially use different models for different stages
4. Tune temperature and other parameters
5. Optimize prompts for the winning model

## Key Metrics to Compare

### Quality Metrics:
- **Calibration Accuracy**: Do scores match expected ranges?
- **Insight Quality**: Are insights specific and actionable?
- **Dimension Understanding**: Does it properly evaluate all 12 dimensions?
- **Elite Pattern Detection**: Does it catch vulnerability, micro→macro, etc.?

### Performance Metrics:
- **Speed**: Which is faster?
- **Token Efficiency**: Which uses fewer tokens?
- **Cost**: Which is more cost-effective?
- **Reliability**: Which has fewer errors?

### Qualitative Metrics:
- **Nuance**: Which provides more sophisticated analysis?
- **Voice Recognition**: Which better understands authentic vs manufactured voice?
- **Strategic Insight**: Which provides better improvement roadmaps?
- **AO Perspective**: Which better simulates admissions officer thinking?

## Expected Outcomes

### Scenario A: Claude Wins
**If Claude performs better**:
- Keep current implementation
- Optimize prompts for Claude's strengths
- Use Claude Sonnet 4.5 across all stages

**Advantages**:
- Already integrated
- Excellent at nuanced analysis
- Strong JSON mode
- Good at following complex instructions

### Scenario B: GPT-5 Wins
**If GPT-4o performs better**:
- Modify orchestrator to use OpenAI
- Adjust prompts for GPT's style
- Switch to GPT-4o as primary model

**Advantages**:
- Potentially faster
- Strong reasoning capabilities
- Native JSON mode
- Possibly more cost-effective

### Scenario C: Hybrid Approach
**If each excels at different things**:
- Use Claude for holistic understanding (Stage 1)
- Use GPT for deep dive analysis (Stage 2)
- Use best for synthesis (Stage 4)
- Optimize cost/quality tradeoff

## Next Steps

1. ✅ **Complete Claude baseline tests** (3 essays)
2. **Analyze Claude results** - Check calibration, insights, performance
3. **Modify orchestrator** - Add provider parameter to all stage functions
4. **Run GPT-5 tests** - Same 3 essays with GPT-4o
5. **Compare results** - Side-by-side analysis
6. **Iterate** - Adjust temperatures, prompts, or use hybrid
7. **Validate** - Test with additional real essays
8. **Deploy** - Ship with winning configuration

## Cost Analysis

### Claude Sonnet 4.5:
- Input: $3 per million tokens
- Output: $15 per million tokens
- Typical essay: ~15,000-20,000 tokens total
- **Cost per essay**: ~$0.10-$0.15

### GPT-4o:
- Input: $2.50 per million tokens
- Output: $10 per million tokens
- Typical essay: ~12,000-18,000 tokens total (estimate)
- **Cost per essay**: ~$0.08-$0.12

**Note**: GPT may be slightly cheaper, but quality is paramount. A 20% cost difference is worth it if one model provides significantly better insights.

## Quality vs Cost Tradeoff

**Philosophy**: Prioritize quality over cost.
- Students pay for exceptional insights, not cheap analysis
- Better calibration = better outcomes = higher perceived value
- Cost difference is negligible at scale (~$0.03-$0.05 per essay)
- Quality improvements justify premium pricing

## Success Criteria

We'll select the winning model based on:

1. **Calibration Accuracy** (40% weight)
   - Elite essays score 85-95
   - Weak essays score 40-55
   - Mid-tier essays score 70-80

2. **Insight Quality** (30% weight)
   - Specific, actionable recommendations
   - Accurate pattern detection
   - Useful comparative examples

3. **Overall Experience** (20% weight)
   - Speed (preferably <60 seconds)
   - Reliability (low error rate)
   - Consistency across essays

4. **Cost Efficiency** (10% weight)
   - Token usage
   - API costs
   - Operational expenses

## Testing Log

### Test Run 1: Claude Baseline (Current)
**Date**: 2025-11-13
**Model**: Claude Sonnet 4.5
**Status**: Running
**Essays**: Elite (Guatemala), Mid (Philosophy), Weak (Generic)

Results will be saved to `model-comparison-report.json`

---

**Once baseline is complete, we'll analyze results and proceed with GPT-5 testing!** 🚀
