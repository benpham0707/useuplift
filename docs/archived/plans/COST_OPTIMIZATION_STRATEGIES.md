# Cost Optimization Strategies - Reducing from $0.45 to ~$0.15-0.25

## Main Cost Drivers (79% of Total Cost)

### 1. **Stage 2 Surgical Suggestions: $0.25 (55%)**
- **Problem**: 5 issues × $0.05 per 3-suggestion set = $0.25
- **Why expensive**: Generating 15 total suggestions (3 per issue)

### 2. **Stage 0 Multi-Stage Voice: $0.11 (24%)**
- **Problem**: 5 separate Sonnet calls for voice excavation
- **Why expensive**: Multi-stage pipeline with multiple generations

---

## Strategy 1: Batch Generation (Biggest Impact)

### Current Approach (Expensive)
```typescript
// 5 separate API calls for Stage 2
for (const issue of issues) {
  const suggestions = await sonnet.generateSuggestions(issue); // $0.05
}
// Total: 5 × $0.05 = $0.25
```

### Optimized Approach (Batched)
```typescript
// 1 API call for all issues
const allSuggestions = await sonnet.generateBatchSuggestions(issues); // $0.12
// Total: $0.12
```

**How It Works**:
- Single prompt with all 5 issues
- Generate 3 suggestions for each in one call
- Claude processes all issues together (more efficient context usage)

**Savings**: $0.25 → $0.12 = **$0.13 saved (29% total cost reduction)**

**Quality Trade-off**: Minimal
- Still gets full context for each issue
- Still generates 3 distinct suggestions per issue
- Actually may improve quality (Claude sees relationships between issues)

---

## Strategy 2: Reduce Issue Count (Smart Prioritization)

### Current Approach
```typescript
// Analyze all dimensions, find top 5 issues
const issues = findTopIssues(dimensionalAnalysis, 5);
```

### Optimized Approach
```typescript
// Analyze dimensions, find top 3 CRITICAL issues only
const issues = findCriticalIssues(dimensionalAnalysis, 3);

// Filter by:
// 1. Severity: Only 'critical' issues (not 'moderate' or 'minor')
// 2. Impact: Only issues that move score +3 or more
// 3. College-specific: Only issues that directly contradict college values
```

**Savings**:
- Stage 2: 3 issues × $0.07 = $0.21 (vs $0.35)
- **$0.14 saved (31% total cost reduction)**

**Quality Trade-off**: Actually IMPROVES quality
- Student gets focused, high-impact feedback
- Less overwhelm (3 issues vs 5)
- Forces prioritization of what truly matters
- Can always run additional passes if needed

---

## Strategy 3: Conditional Stage 0 (Skip When Not Needed)

### Current Approach
```typescript
// Always run full Stage 0 multi-stage pipeline
const stage0Output = await runStage0MultiStage(draft); // $0.11
```

### Optimized Approach
```typescript
// Quick Haiku triage first
const sparkCheck = await haiku.quickSparkCheck(draft); // $0.002

if (sparkCheck.sparkScore >= 75) {
  // Essay already has good voice - skip Stage 0
  // Go straight to Stage 1
  return { draft, voiceContext: sparkCheck.voiceBaseline };
} else {
  // Run full Stage 0 multi-stage
  return await runStage0MultiStage(draft); // $0.11
}
```

**Savings (when skipped)**:
- Skip Stage 0: $0.11 saved
- Only pay $0.002 for triage

**Expected Hit Rate**:
- ~30% of essays already have decent voice (spark > 75)
- **Average savings: $0.03 per essay (7% reduction)**

**Quality Trade-off**: None
- Essays with good voice don't need voice excavation
- Still get full teaching in Stages 1-3

---

## Strategy 4: Haiku for Generation (Experimental)

### Current Approach
```typescript
// Sonnet generates all 3 suggestions
const suggestions = await sonnet.generate3Suggestions(issue); // $0.05
```

### Optimized Approach (Hybrid)
```typescript
// Haiku generates suggestions, Sonnet reviews/enhances top one
const haikuSuggestions = await haiku.generate3Suggestions(issue); // $0.01
const enhanced = await sonnet.enhanceBestSuggestion(haikuSuggestions[0]); // $0.02

return {
  polished: enhanced,
  voiceAmplifier: haikuSuggestions[1],
  divergent: haikuSuggestions[2]
};
```

**Savings**: $0.05 → $0.03 per issue
- 5 issues: $0.25 → $0.15
- **$0.10 saved (22% reduction)**

**Quality Trade-off**: Moderate
- Haiku can generate decent suggestions
- Sonnet enhancement ensures quality on primary suggestion
- May lose some sophistication on suggestions 2-3

**Recommendation**: Test this thoroughly - may not be worth quality trade-off

---

## Strategy 5: Stage Consolidation (Aggressive)

### Current Approach
```typescript
// 3 separate stages with distinct Sonnet calls
Stage 1: Conceptual Teaching ($0.04) + Dimensional Analysis ($0.03)
Stage 2: Dimensional Feedback ($0.03)
Stage 3: Style Refinements ($0.04) + Final Polish ($0.03)
```

### Optimized Approach (Consolidated)
```typescript
// Combine related calls
Stage 1: Conceptual + Dimensional (single call) - $0.05
Stage 2: (Keep surgical per-issue, but use batching)
Stage 3: Style + Polish (single call) - $0.05
```

**How**:
```typescript
const STAGE_1_CONSOLIDATED_PROMPT = `You are providing comprehensive Stage 1 teaching.

PART 1: CONCEPTUAL FOUNDATION
{teach college values, rubric, prompt analysis}

PART 2: DIMENSIONAL ANALYSIS
{analyze essay across all dimensions}

Output both in a single structured JSON response.`;
```

**Savings**:
- Stage 1: $0.07 → $0.05 = $0.02 saved
- Stage 3: $0.07 → $0.05 = $0.02 saved
- **$0.04 total saved (9% reduction)**

**Quality Trade-off**: Minimal
- Same information generated
- Slightly longer prompts but more efficient

---

## Strategy 6: Progressive Disclosure (User Choice)

### Optimized Approach
```typescript
// Let user choose depth vs cost

// QUICK MODE (~$0.15)
const quickMode = {
  stage0: skipIfSparkOK,              // Conditional
  stage1: haiku + minimal sonnet,     // $0.04
  stage2: top 3 issues, batched,      // $0.10
  stage3: haiku only                  // $0.01
};

// STANDARD MODE (~$0.25)
const standardMode = {
  stage0: runIfSparkLow,              // Conditional
  stage1: current approach,           // $0.08
  stage2: top 3 issues, batched,      // $0.15
  stage3: current approach            // $0.08
};

// DEEP MODE (~$0.45)
const deepMode = {
  stage0: always run full pipeline,   // $0.11
  stage1: current approach,           // $0.08
  stage2: top 5 issues, per-issue,    // $0.38
  stage3: current approach            // $0.08
};
```

**Benefit**: User controls cost vs depth
- Students with budget constraints use Quick Mode
- Students targeting top schools use Deep Mode
- Most students use Standard Mode

---

## Recommended Optimization Plan

### **Tier 1: Implement Immediately (Low Risk, High Impact)**

1. ✅ **Batch Generation** (Strategy 1)
   - Savings: $0.13 (29% reduction)
   - Risk: Very low
   - Impact: Very high
   - Implementation: 2-3 hours

2. ✅ **Reduce to 3 Critical Issues** (Strategy 2)
   - Savings: $0.14 (31% reduction)
   - Risk: None (improves quality)
   - Impact: Very high
   - Implementation: 1 hour

3. ✅ **Conditional Stage 0** (Strategy 3)
   - Savings: $0.03 average (7% reduction)
   - Risk: Very low
   - Impact: Medium
   - Implementation: 2 hours

**Tier 1 Total Savings**: $0.30 → Brings cost to **$0.15 per essay**

---

### **Tier 2: Test & Evaluate (Medium Risk, Good Impact)**

4. 🧪 **Stage Consolidation** (Strategy 5)
   - Savings: $0.04 (9% reduction)
   - Risk: Low
   - Impact: Medium
   - Implementation: 4-5 hours
   - **Test quality impact first**

5. 🧪 **Progressive Disclosure** (Strategy 6)
   - Savings: Variable (user choice)
   - Risk: Low
   - Impact: High (user satisfaction)
   - Implementation: 6-8 hours
   - **Implement after Tier 1 validated**

---

### **Tier 3: Research & Experiment (Higher Risk)**

6. 🔬 **Haiku for Generation** (Strategy 4)
   - Savings: $0.10 (22% reduction)
   - Risk: Medium-High
   - Impact: Unknown
   - **Run quality tests before implementing**
   - May not be worth quality trade-off

---

## Final Cost Projections

### With Tier 1 Optimizations Only:
```
Stage 0: $0.03 (conditional average, was $0.11)
Stage 1: $0.08 (same)
Stage 2: $0.12 (batched 3 issues, was $0.38)
Stage 3: $0.08 (same)

TOTAL: ~$0.31 per essay
With caching: ~$0.25 per essay
```

**68% reduction from $0.45!**

### With Tier 1 + Tier 2:
```
Stage 0: $0.03 (conditional)
Stage 1: $0.05 (consolidated)
Stage 2: $0.12 (batched 3 issues)
Stage 3: $0.05 (consolidated)

TOTAL: ~$0.25 per essay
With caching: ~$0.18 per essay
```

**78% reduction from $0.45!**

---

## Detailed Implementation: Batch Generation

### Current Code (Expensive)
```typescript
async generateStage2Teaching(issues: Issue[]) {
  const surgicalTeaching = [];

  for (const issue of issues) {
    // Haiku diagnosis
    const diagnosis = await haiku.diagnose(issue); // $0.02

    // Context assembly
    const bundle = assembleContext(diagnosis, ...);

    // Sonnet generation (EXPENSIVE)
    const suggestions = await sonnet.generate(bundle); // $0.05

    surgicalTeaching.push({ issue, suggestions, diagnosis });
  }

  return surgicalTeaching; // Cost: 5 × $0.07 = $0.35
}
```

### Optimized Code (Batched)
```typescript
async generateStage2Teaching(issues: Issue[]) {
  // Batch diagnoses (still cheap)
  const diagnoses = await Promise.all(
    issues.map(issue => haiku.diagnose(issue)) // 5 × $0.02 = $0.10
  );

  // Assemble all contexts
  const bundles = diagnoses.map((d, i) =>
    assembleContext(d, issues[i], ...)
  );

  // SINGLE batched generation call
  const allSuggestions = await sonnet.generateBatch(bundles); // $0.12

  // Structure results
  return issues.map((issue, i) => ({
    issue,
    diagnosis: diagnoses[i],
    suggestions: allSuggestions[i]
  }));

  // Cost: $0.10 + $0.12 = $0.22 (vs $0.35)
  // Savings: $0.13
}
```

### Batch Generation Prompt
```typescript
const BATCH_SURGICAL_PROMPT = `You are generating surgical suggestions for MULTIPLE issues in a single response.

CASE FILES:

${bundles.map((bundle, i) => `
--- ISSUE ${i + 1} ---
${bundle.caseFile}
`).join('\n\n')}

For EACH issue, generate 3 distinct suggestions following the same format:
- Polished Original
- Voice Amplifier
- Divergent Strategy

Output JSON:
{
  "issues": [
    {
      "issue_number": 1,
      "suggestions": {
        "polished_original": {...},
        "voice_amplifier": {...},
        "divergent_strategy": {...}
      }
    },
    {
      "issue_number": 2,
      "suggestions": {...}
    },
    ...
  ]
}`;
```

**Why This Works**:
- Claude can handle multiple issues in a single context
- Shared context means better understanding of relationships
- More efficient token usage
- Faster overall (1 API call vs 5)

---

## Quality Assurance for Optimizations

### Testing Protocol
1. **Baseline Test**: Run current system on 10 sample essays, measure:
   - Cost per essay
   - Score improvements
   - Voice preservation
   - Teaching quality (user feedback)

2. **Optimization Test**: Run optimized system on same 10 essays, measure same metrics

3. **Comparison**:
   - Cost reduction: Target 60%+ ($0.45 → $0.18)
   - Score improvement: Must maintain within 2 points
   - Voice preservation: Must maintain 85%+
   - Teaching quality: Must be equivalent or better

### Acceptance Criteria
- ✅ Cost reduced by 60%+
- ✅ Score improvement within 2 points of baseline
- ✅ Voice preservation ≥ 85%
- ✅ User feedback score ≥ baseline

---

## Summary: Main Cost Areas & Solutions

### Main Cost Drivers:
1. **Stage 2 Surgical (55%)** → Batch generation + reduce to 3 issues
2. **Stage 0 Multi-Stage (24%)** → Conditional execution
3. **Stage 1 Teaching (16%)** → Consolidate calls
4. **Stage 3 Refinement (5%)** → Consolidate calls

### Recommended Path:
1. **Week 1**: Implement Tier 1 (batch + 3 issues + conditional) → **$0.15 target**
2. **Week 2**: Test quality, validate savings
3. **Week 3**: Implement Tier 2 if quality maintained → **$0.18 target**

### Final Target: **$0.15-0.25 per essay** (67-78% reduction from $0.45)

This maintains world-class depth while making it economically sustainable.
