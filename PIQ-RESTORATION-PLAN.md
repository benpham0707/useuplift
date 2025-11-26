# PIQ WORKSHOP RESTORATION PLAN

## Executive Summary
**Objective**: Restore the PIQ workshop backend system to its working state before November 25, 2024 at 9:40 AM by reverting to commit `156379562da673eb3eda28e9602284fddf0e61bc` (Nov 24, 5:08 PM - "push prodx almost done caching").

**Problem**: After attempting to scale from 5 to 12 issues, the suggestion quality degraded significantly - suggestions became too long, unrelated, and the overall system performance suffered.

**Solution**: Restore the exact working implementation that generated 5 high-quality issues in a single API call.

---

## Problem Analysis

### What Broke (Current System - After Nov 25 9:40 AM)

**Architecture**: 3-stage chunked system
```
Stage 1 (~35s): Analysis (voice + experience + rubric)
  ↓ (pass continueToken)
Stage 2 (~35s): Generation (12 items in 3 parallel batches)
  ↓ (pass continueToken)
Stage 3 (~60s): Validation (85+ quality threshold with retries)
Total: ~130 seconds across 3 separate API calls
```

**Key Files**:
- `supabase/functions/workshop-analysis/index.ts` (661 lines)
  - Lines 13: Imports validator.ts
  - Lines 50-72: Continue token encode/decode functions
  - Lines 141-428: Stage 1 with token passing
  - Lines 433-535: Stage 2 with batching
  - Lines 540-618: Stage 3 with validation

- `supabase/functions/workshop-analysis/validator.ts` (929 lines) **← DIDN'T EXIST BEFORE**
  - Complex validation system
  - Quality thresholds (85+ score requirement)
  - Retry logic with feedback loops

- `src/services/piqWorkshopAnalysisService.ts` (986 lines)
  - Lines 42-124: 3-stage orchestration with separate API calls
  - Lines 140-229: Strategic analysis Stage 5

**Issues**:
1. ✗ Suggestions too long and unrelated
2. ✗ Over-engineered with validation layer
3. ✗ 130s total time vs 30-45s before
4. ✗ 3 API calls vs 1 before

---

### What Worked (Before Nov 25 9:40 AM)

**Architecture**: Simple 4-stage sequential flow
```
Stage 1: Voice Fingerprint Analysis
  ↓
Stage 2: Experience Fingerprint Analysis
  ↓
Stage 3: 12-Dimension Rubric Analysis
  ↓
Stage 4: Workshop Items (5 issues in ONE call with max_tokens: 8192)

Total: ~30-45 seconds in single request
```

**Key Files**:
- `supabase/functions/workshop-analysis/index.ts` (417 lines)
  - Lines 66-127: Voice fingerprint (sequential)
  - Lines 130-201: Experience fingerprint (sequential)
  - Lines 204-288: Rubric analysis (sequential)
  - Lines 291-373: Workshop items - **SINGLE CALL** with max_tokens: 8192
  - Lines 376-399: Assemble and return result

- `supabase/functions/workshop-analysis/validator.ts` **← DIDN'T EXIST**

- `src/services/piqWorkshopAnalysisService.ts` (293 lines)
  - Lines 44-77: **Single edge function call** (no staging)
  - Simple, clean integration

**Benefits**:
1. ✓ Concise, relevant suggestions
2. ✓ Simple architecture
3. ✓ Fast (30-45s)
4. ✓ Single API call

---

## Root Cause Analysis

The team tried to scale from 5 to 12 issues and added:
1. **Multi-stage chunking** → Complex state passing with continue tokens
2. **Validation layer** → Every suggestion validated with quality scores
3. **Batching logic** → 3 parallel batches instead of single generation
4. **Retry mechanisms** → Feedback loops and regeneration attempts

This over-engineering destroyed the simplicity and quality that made it work.

---

## Restoration Strategy

### Files to Restore

#### 1. Backend Edge Function ✓
**File**: `supabase/functions/workshop-analysis/index.ts`
- **Action**: Replace with version from commit `156379562da673eb3eda28e9602284fddf0e61bc`
- **Changes**:
  - Remove 3-stage architecture (stages 1/2/3)
  - Remove continue token logic
  - Restore simple 4-stage sequential flow
  - Restore single max_tokens: 8192 call for workshop items
  - Remove `?stage=` parameter handling
  - No imports from validator.ts

#### 2. Delete Validator ✓
**File**: `supabase/functions/workshop-analysis/validator.ts`
- **Action**: **DELETE THIS FILE** (didn't exist in working version)
- This file adds 929 lines of unnecessary complexity

#### 3. Frontend Service ✓
**File**: `src/services/piqWorkshopAnalysisService.ts`
- **Action**: Replace with version from commit `156379562da673eb3eda28e9602284fddf0e61bc`
- **Changes**:
  - Remove 3-stage calling logic (lines 42-124)
  - Remove strategic analysis Stage 5 (lines 140-229)
  - Restore single `supabase.functions.invoke('workshop-analysis', {...})` call
  - Simplify to ~300 lines

#### 4. Verify Related Files
Check these files for unintended changes (keep UI improvements, revert analysis changes):
- `src/components/portfolio/piq/workshop/PIQCarouselNav.tsx` ← UI only, likely safe
- `src/components/portfolio/piq/workshop/PIQTabsNav.tsx` ← UI only, likely safe
- `src/pages/PIQWorkshop.tsx` ← Verify analysis service calls
- `src/services/piqWorkshop/piqChatService.ts` ← **Keep chat changes**
- `src/services/piqWorkshop/piqDatabaseService.ts` ← Verify save logic

---

## Implementation Steps

### Phase 1: Backup Current State
```bash
# Create backup branch
git checkout -b backup-before-piq-restoration-$(date +%Y%m%d)
git push origin backup-before-piq-restoration-$(date +%Y%m%d)
```

### Phase 2: Restore Backend Files
```bash
# Get good versions from working commit
git show 156379562da673eb3eda28e9602284fddf0e61bc:supabase/functions/workshop-analysis/index.ts > /tmp/good-index.ts

# Replace current version
cp /tmp/good-index.ts supabase/functions/workshop-analysis/index.ts

# Delete validator (didn't exist in good version)
rm supabase/functions/workshop-analysis/validator.ts

# Verify deno.json (should be simple)
git show 156379562da673eb3eda28e9602284fddf0e61bc:supabase/functions/workshop-analysis/deno.json
```

### Phase 3: Restore Frontend Service
```bash
# Get good version
git show 156379562da673eb3eda28e9602284fddf0e61bc:src/services/piqWorkshopAnalysisService.ts > /tmp/good-service.ts

# Replace current version
cp /tmp/good-service.ts src/services/piqWorkshopAnalysisService.ts
```

### Phase 4: Verify and Test Locally
```bash
# Deploy edge function locally
supabase functions serve workshop-analysis

# Test with sample PIQ
curl -X POST http://localhost:54321/functions/v1/workshop-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "essayText": "...",
    "essayType": "uc_piq",
    "promptText": "...",
    "promptTitle": "..."
  }'

# Verify:
# - Single API call (no stages)
# - Returns 5 workshop items
# - Each item has 3 suggestions
# - Response time ~30-45s
```

### Phase 5: Deploy to Production
```bash
# Deploy edge function
supabase functions deploy workshop-analysis

# Monitor logs
supabase functions logs workshop-analysis --tail

# Test in production with real essay
```

### Phase 6: Verify UI Integration
1. Open PIQ Workshop in browser
2. Paste test essay
3. Click "Analyze"
4. Verify:
   - ✓ Single loading state (not 3 stages)
   - ✓ ~30-45s analysis time
   - ✓ 5 workshop items displayed
   - ✓ Suggestions are concise and relevant
   - ✓ No validation errors

---

## Detailed File Comparison

### `supabase/functions/workshop-analysis/index.ts`

| Aspect | Current (Broken) | Good (Working) |
|--------|------------------|----------------|
| Lines | 661 | 417 |
| Architecture | 3-stage chunked | 4-stage sequential |
| API calls | 3 separate (stage 1/2/3) | 1 single call |
| Workshop generation | 12 items in 3 batches | 5 items in 1 call |
| Validation | Separate stage 3 | No validation layer |
| Imports | `import { generateWorkshopBatch, validateWorkshopItemSuggestions } from './validator.ts'` | None |
| Continue tokens | Lines 50-72 encode/decode | No token logic |
| max_tokens | 3500 per batch | 8192 single call |

**Key Code Difference - Workshop Generation:**

**Broken (Current)**:
```typescript
// Lines 498-506
const [batch1Items, batch2Items, batch3Items] = await Promise.all([
  generateWorkshopBatch(essayText, promptText, rubricAnalysis, voiceFingerprint, anthropicApiKey, baseSystemPrompt, 1),
  generateWorkshopBatch(essayText, promptText, rubricAnalysis, voiceFingerprint, anthropicApiKey, baseSystemPrompt, 2),
  generateWorkshopBatch(essayText, promptText, rubricAnalysis, voiceFingerprint, anthropicApiKey, baseSystemPrompt, 3)
]);
workshopItems = [...batch1Items, ...batch2Items, ...batch3Items];
```

**Working (Good)**:
```typescript
// Lines 291-352
const workshopResponse = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': anthropicApiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    temperature: 0.8,
    system: `You are a surgical essay editor...`,
    messages: [{
      role: 'user',
      content: `Identify surgical fixes for this essay:\n\nPrompt: ${promptText}\n\nEssay:\n${essayText}\n\nRubric Analysis:\n${JSON.stringify(rubricAnalysis, null, 2)}`
    }]
  })
});
```

### `src/services/piqWorkshopAnalysisService.ts`

| Aspect | Current (Broken) | Good (Working) |
|--------|------------------|----------------|
| Lines | 986 | 293 |
| API calls | 3 (stage 1, 2, 3) | 1 (single call) |
| Strategic analysis | Stage 5 (lines 140-229) | None |

**Key Code Difference:**

**Broken (Current)**:
```typescript
// Lines 42-124 - 3 separate API calls
const { data: stage1Data, error: stage1Error } = await supabase.functions.invoke('workshop-analysis?stage=1', {...});
const { data: stage2Data, error: stage2Error } = await supabase.functions.invoke('workshop-analysis?stage=2', {
  body: { continueToken: stage1Data.continueToken }
});
const { data: stage3Data, error: stage3Error } = await supabase.functions.invoke('workshop-analysis?stage=3', {
  body: { continueToken: stage2Data.continueToken }
});
```

**Working (Good)**:
```typescript
// Lines 44-77 - Single API call
const { data, error } = await supabase.functions.invoke('workshop-analysis', {
  body: {
    essayText,
    essayType: options.essayType || 'uc_piq',
    promptText,
    promptTitle,
    maxWords: 350,
    targetSchools: ['UC System'],
    studentContext: {
      academicStrength: 'moderate',
      voicePreference: 'concise',
    }
  }
});
```

---

## Expected Outcomes

### Before Restoration (Current State)
- ✗ 3 API calls with continue tokens
- ✗ ~130s total time
- ✗ 12 workshop items (lower quality)
- ✗ Complex validation with retries
- ✗ Suggestions too long and unrelated
- ✗ Over-engineered system

### After Restoration (Target State)
- ✓ 1 API call
- ✓ ~30-45s total time
- ✓ 5 workshop items (high quality)
- ✓ No validation layer
- ✓ Concise, relevant suggestions
- ✓ Simple, working system

---

## Risk Assessment

### Risk Level: **LOW** ✓

**Why Low Risk:**
1. Restoring exact working code from known-good commit
2. Only affects PIQ workshop analysis (not chat)
3. Frontend/backend both being restored together
4. Can easily rollback if needed
5. Changes are in version control

### Safeguards
1. ✓ **Preserve chat implementation** - Only revert suggestion/analysis system
2. ✓ **Git safety** - All changes in version control, easy to revert
3. ✓ **Backup branch** - Created before any changes
4. ✓ **Test locally first** - Verify before production deploy

---

## Testing Plan

### Test Case 1: Basic Analysis ✓
**Input**: 350-word PIQ essay
**Expected**:
- 5 workshop items returned
- ~30-45s response time
- Single API call to edge function (no stages)
- Each item has: id, quote, problem, why_it_matters, severity, rubric_category, 3 suggestions

### Test Case 2: Suggestion Quality ✓
**Check**:
- Suggestions are concise (not too long)
- Suggestions are relevant to the quote
- 3 types per item:
  - polished_original
  - voice_amplifier
  - divergent_strategy

### Test Case 3: No Regression ✓
**Verify**:
- Chat functionality still works
- Save/load functionality still works
- UI displays results correctly
- No errors in console

### Test Case 4: Performance ✓
**Verify**:
- Analysis completes in 30-45s (not 130s)
- Single API call (check network tab)
- No timeout errors

---

## Rollback Plan

If restoration causes issues:

```bash
# Option 1: Revert commit
git reset --hard HEAD~1

# Option 2: Restore from backup branch
git checkout backup-before-piq-restoration-YYYYMMDD
git cherry-pick <specific-commits-to-keep>

# Option 3: Redeploy current functions
supabase functions deploy workshop-analysis
```

Then investigate specific failure and consider:
- Hybrid approach (restore backend only, keep frontend)
- Gradual restoration (one file at a time)
- Review dependencies that may have changed

---

## Success Criteria

✅ Single API call to workshop-analysis edge function (no ?stage= parameter)
✅ Response time 30-45 seconds (not 130s)
✅ Generates exactly 5 workshop items with 3 suggestions each
✅ Suggestions are concise and relevant (not too long or unrelated)
✅ validator.ts file does not exist
✅ No staging logic in frontend service
✅ Chat functionality unaffected
✅ User experience matches pre-Nov 25 quality
✅ No errors in browser console
✅ No timeout errors

---

## Timeline

### Day 1: Preparation & Backup
- [x] Analyze git history
- [x] Identify working commit (`156379562da673eb3eda28e9602284fddf0e61bc`)
- [x] Create detailed restoration plan
- [ ] Create backup branch
- [ ] Get user approval

### Day 2: Backend Restoration
- [ ] Restore `supabase/functions/workshop-analysis/index.ts`
- [ ] Delete `supabase/functions/workshop-analysis/validator.ts`
- [ ] Test locally with sample essays
- [ ] Verify output format matches expectations

### Day 3: Frontend Restoration & Integration
- [ ] Restore `src/services/piqWorkshopAnalysisService.ts`
- [ ] Verify integration with UI components
- [ ] Test end-to-end locally
- [ ] Check for any breaking changes

### Day 4: Production Deployment
- [ ] Deploy edge function to production
- [ ] Monitor logs for errors
- [ ] Test with real essays
- [ ] Verify quality improvements

### Day 5: Verification & Monitoring
- [ ] Run full test suite
- [ ] Collect user feedback
- [ ] Monitor performance metrics
- [ ] Document any issues and resolutions

**Total Estimated Time**: 5 days

---

## Cost Analysis

### Current System (Broken)
- 3 API calls
- ~130s total time
- Complex processing with retries
- Higher token usage due to validation

### Restored System (Working)
- 1 API call
- ~30-45s total time
- Simple processing
- Lower token usage (single 8192 token call)

**Expected Cost Reduction**: ~15-20% due to:
1. Fewer API calls (1 vs 3)
2. No validation layer
3. More efficient token usage

---

## Next Steps

1. **✓ DONE**: Analyze git history and create plan
2. **→ WAITING**: Get user approval for this restoration plan
3. **TODO**: Create backup branch
4. **TODO**: Restore backend files
5. **TODO**: Restore frontend service
6. **TODO**: Test locally
7. **TODO**: Deploy to production
8. **TODO**: Verify and monitor

---

## Critical Notes

⚠️ **IMPORTANT**: This restoration is LOW RISK - we're reverting to known-good code
⚠️ **Working commit**: `156379562da673eb3eda28e9602284fddf0e61bc` (Nov 24, 5:08 PM)
⚠️ **Scope**: Only revert PIQ workshop analysis/suggestion system (NOT chat)
⚠️ **Reversibility**: All changes in git, fully reversible
⚠️ **Testing**: Must test locally before production deployment

---

## Approval Required

**I have created a comprehensive restoration plan to bring back the exact working implementation from before November 25, 2024 at 9:40 AM.**

**Key Points:**
- ✓ Restores simple 1-API-call architecture
- ✓ Brings back 5 high-quality issues (vs broken 12)
- ✓ Removes 929-line validator.ts file
- ✓ Reduces response time from 130s to 30-45s
- ✓ Low risk with easy rollback
- ✓ Does NOT affect chat functionality

**Ready to proceed?**

Type "yes" to approve and begin restoration, or let me know if you have any questions or concerns.
