# Workshop Analysis - Prompt Quality Restoration

## ✅ DEPLOYED

### What Was Wrong

The Stage 4 prompts were **over-specified** with explicit length requirements that caused Claude to:
1. Focus on hitting length targets ("2-3 sentences") instead of providing insight
2. Generate verbose but shallow content
3. Sacrifice depth for word count

**Previous problematic prompt:**
```
CRITICAL QUALITY STANDARDS:
- Each "problem" must be specific and detailed (2-3 sentences explaining the exact issue)
- Each "why_it_matters" must explain concrete impact on admissions readers (2-3 sentences)
- Each suggestion "rationale" must be substantive (2-3 sentences explaining WHY this specific approach works)
```

This caused the quality drop you noticed:
- Essays scoring lower
- Suggestions feeling generic
- "Problem", "why it matters", and "rationale" losing depth

---

## What Was Fixed

### ✅ Restored Original Concise Prompts

Reverted to the **proven high-quality prompt style** from commit b0a4758 (before the 12-item change):

**New BASE_SYSTEM_PROMPT:**
```
You are a surgical essay editor. Identify specific issues in the essay and provide 3 types of surgical fixes:

1. polished_original: Minimal edits preserving voice
2. voice_amplifier: Heightens student's existing voice patterns
3. divergent_strategy: Bold alternative exploring different angle

For each issue:
- Extract exact quote from essay
- Explain problem and why it matters
- Assign severity (critical/high/medium/low)
- Map to rubric category (opening_hook, character_development, stakes_tension, etc.)
- Provide 3 surgical suggestions with rationale
```

**Key changes:**
- Removed "2-3 sentences" requirements
- Changed from prescriptive to descriptive language
- Let Claude determine appropriate depth naturally
- Shorter, clearer tier-specific instructions

**Tier-specific prompts (simplified):**

| Tier | Old (Verbose) | New (Concise) |
|------|--------------|---------------|
| Tier 1 | "TIER 1 FOCUS: Identify the 4 MOST CRITICAL issues in this essay<br>- Prioritize dimensions with scores below 6.0<br>- Focus on critical and high severity issues only<br>- These are the issues that most hurt the essay's chances<br>- Provide MAXIMUM depth and detail for each item" | "TIER 1: Focus on the 4 MOST CRITICAL issues (severity: critical/high)" |
| Tier 2 | "TIER 2 FOCUS: Identify the NEXT 4 most important issues<br>- Cover dimensions NOT addressed in Tier 1<br>- Focus on medium and high severity issues<br>- Look for opportunities to strengthen already-decent areas<br>- Maintain same depth and quality as Tier 1" | "TIER 2: Cover dimensions NOT in Tier 1 (severity: medium/high)" |
| Tier 3 | "TIER 3 FOCUS: Identify FINAL 4 polish opportunities<br>- Cover any remaining uncovered dimensions<br>- Look for subtle refinements and optimization opportunities<br>- Focus on elevating good areas to excellent<br>- Maintain same depth and quality as Tiers 1 & 2" | "TIER 3: Final 4 items covering remaining dimensions" |

**User messages (simplified):**

| Tier | Old | New |
|------|-----|-----|
| Tier 1 | "Identify the 4 MOST CRITICAL workshop items for this essay:<br>...<br>INSTRUCTIONS: Return exactly 4 workshop items, focusing on the most severe problems. Maintain maximum depth and quality in problem descriptions, why_it_matters, and rationales." | "Identify 4 critical workshop items for this essay:<br>..." |
| Tier 2 | "Identify the NEXT 4 most important workshop items for this essay:<br>...<br>ALREADY COVERED DIMENSIONS (do NOT repeat these):<br>...<br>INSTRUCTIONS: Return exactly 4 workshop items, focusing on uncovered dimensions and medium/high severity issues. Maintain maximum depth and quality." | "Identify 4 workshop items for this essay (excluding already-covered dimensions):<br>...<br>Already covered: ..." |
| Tier 3 | "Identify the FINAL 4 workshop items to complete the analysis:<br>...<br>ALREADY COVERED DIMENSIONS (do NOT repeat these):<br>...<br>INSTRUCTIONS: Return exactly 4 workshop items, covering remaining gaps and polish opportunities. Maintain maximum depth and quality. Focus on uncovered dimensions or subtle refinements." | "Identify 4 final workshop items for this essay:<br>...<br>Already covered: ..." |

---

## Why This Works Better

### Prompt Engineering Principle: Less Is More

**Over-specification kills quality:**
- Explicit length requirements ("2-3 sentences") → Claude optimizes for length, not insight
- Repetitive instructions → Claude focuses on following rules, not understanding context
- Verbose prompts → Wastes tokens and cognitive bandwidth

**Concise prompts enable quality:**
- Trust Claude's judgment on appropriate depth
- Let the model focus on understanding the essay, not counting sentences
- Natural language allows Claude to use its full capabilities

### Example: Over-specified vs. Natural

**Over-specified (BAD):**
```
INSTRUCTIONS: Return exactly 4 workshop items, focusing on the most severe problems.
Maintain maximum depth and quality in problem descriptions, why_it_matters, and rationales.
Each "problem" must be 2-3 sentences. Each "why_it_matters" must be 2-3 sentences.
```

Claude thinks: "I need to count sentences... let me add filler to hit 2-3 sentences..."

**Natural (GOOD):**
```
Identify 4 critical workshop items for this essay
```

Claude thinks: "What are the most critical issues? Let me analyze deeply and explain clearly."

---

## System Architecture (Unchanged)

The 3-tiered batched approach remains:
- **Tier 1**: 4 critical/high severity items (8K tokens)
- **Tier 2**: 4 medium/high items, excluding Tier 1 dimensions (8K tokens)
- **Tier 3**: 4 final items, covering remaining gaps (8K tokens)

**What changed:** ONLY the prompt language, not the architecture or flow

---

## Expected Quality Improvements

With the restored prompts, you should see:

### ✅ Problem Descriptions
- More insightful, less formulaic
- Natural depth without forced length
- Focused on **what matters**, not hitting word counts

### ✅ Why It Matters
- Concrete admissions impact
- Student-focused reasoning
- No filler sentences

### ✅ Suggestion Rationales
- Substantive explanations of **why** the fix works
- Strategic thinking about narrative approach
- No "this is better because it's better" circular logic

### ✅ Overall Feel
- Professional, coach-like guidance
- Surgical precision without verbosity
- Each word earns its place

---

## Testing Checklist

When testing the restored system:

1. **Essay scoring**: Should return to previous quality levels
2. **Problem depth**: Should feel insightful, not padded
3. **Why it matters**: Should clearly explain admissions impact
4. **Rationales**: Should explain strategy, not just restate suggestion
5. **Overall length**: May be slightly shorter, but much denser with insight

---

## Performance Metrics (Unchanged)

- **Latency**: ~75s for Stage 4 (3 sequential calls)
- **Total pipeline**: ~145s (within 150s timeout)
- **Cost**: $0.197 per essay (Stage 4: $0.128)
- **Dimension coverage**: 100% (12/12 items)

---

## What We Learned

### 🚫 Don't Over-Specify Prompts
- Explicit length requirements ("2-3 sentences") harm quality
- Trust Claude's judgment on appropriate depth
- Let the model focus on understanding, not rule-following

### ✅ Keep Prompts Concise
- Shorter prompts → more tokens for analysis
- Natural language → better Claude performance
- Descriptive, not prescriptive

### ✅ Test Original Systems Before Changing
- The old system was producing high-quality results
- Adding "improvements" (explicit quality standards) actually hurt quality
- When in doubt, keep it simple

---

## Rollback Plan

If the prompt restoration doesn't fix quality issues, we can:

1. **Revert to single-call approach** (commit b0a4758)
2. **Increase max_tokens** per tier (8K → 10K)
3. **Adjust temperature** (0.8 → 0.7 for more focused output)
4. **Add few-shot examples** if Claude needs guidance

---

## Status

✅ **DEPLOYED & READY FOR TESTING**

- Prompts restored to proven high-quality style
- 3-tiered architecture maintained (12 items total)
- No changes to other stages or system flow
- All original logic preserved

**Next step:** Test with real essays and verify quality restoration
