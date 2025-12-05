# PIQ Workshop Essay Overview Issue - Analysis & Solution Plan

## Problem Statement

The main essay overview at the top of the PIQ Workshop is showing **generic, fallback text** instead of a personalized, AI-generated narrative overview. Users see text like:

> "Your essay shows genuine effort and authentic voice. The core of what you're trying to convey is there, but it needs sharper focus and more vivid storytelling. The surgical suggestions below show you exactly where and how to strengthen your narrative."

This is coming from the **frontend fallback logic**, not from the AI-powered `narrative-overview` edge function that's supposed to provide deep, essay-specific insights.

---

## Root Cause Analysis

### **Architecture Overview**

The essay overview generation has a two-tier system:

1. **Primary (AI-Generated)**: `narrative-overview` Supabase edge function
2. **Fallback (Frontend)**: `getDetailedOverview()` function in PIQWorkshop.tsx

### **Detailed Investigation**

#### 1. **The Primary System (AI-Generated Overview)**

**Location**: [supabase/functions/narrative-overview/index.ts](supabase/functions/narrative-overview/index.ts)

**How it should work**:
- Called AFTER Phase 17-19 analysis completes
- Receives full context: voiceFingerprint, experienceFingerprint, rubricDimensionDetails, workshopItems
- Calls Claude API with detailed prompt asking for holistic, empowering 3-5 sentence overview
- Returns essay-specific insights

**Status**: ✅ Function EXISTS and is DEPLOYED
```bash
$ supabase functions list | grep narrative
narrative-overview | ACTIVE | 2025-11-25 11:32:50
```

#### 2. **The Calling Code**

**Location**: [src/pages/PIQWorkshop.tsx:667](src/pages/PIQWorkshop.tsx#L667)

After analysis completes:
```typescript
// Call separate narrative overview endpoint (non-blocking)
fetchNarrativeOverview(result);
```

**Location**: [src/pages/PIQWorkshop.tsx:689-727](src/pages/PIQWorkshop.tsx#L689-L727)

```typescript
const fetchNarrativeOverview = useCallback(async (analysisData: AnalysisResult) => {
  setLoadingOverview(true);
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/narrative-overview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({
        essayText: currentDraft,
        promptText: UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId)?.prompt || '',
        voiceFingerprint: analysisData.voiceFingerprint,
        experienceFingerprint: analysisData.experienceFingerprint,
        rubricDimensionDetails: analysisData.rubricDimensionDetails,
        workshopItems: analysisData.workshopItems,
        narrativeQualityIndex: analysisData.analysis?.narrative_quality_index || 50,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.narrative_overview) {
        setNarrativeOverview(result.narrative_overview); // ✅ Should set state
        console.log('✅ Narrative overview loaded');
      }
    } else {
      console.warn('⚠️  Narrative overview failed, using frontend fallback');
    }
  } catch (error) {
    console.error('Failed to fetch narrative overview:', error);
    // Silently fall back to frontend-generated overview
  } finally {
    setLoadingOverview(false);
  }
}, [currentDraft, selectedPromptId]);
```

#### 3. **The Fallback System**

**Location**: [src/pages/PIQWorkshop.tsx:1605-1710](src/pages/PIQWorkshop.tsx#L1605-L1710)

```typescript
const getDetailedOverview = (dims: RubricDimension[], score: number): string => {
  // Use API-generated overview if available
  if (narrativeOverview) {
    return narrativeOverview; // ✅ Should use AI-generated
  }

  // Loading state
  if (loadingOverview && analysisResult) {
    return 'Generating personalized narrative overview...';
  }

  // Fallback to frontend-generated overview (GENERIC TEXT)
  // ... 100+ lines of heuristic-based text generation
}
```

### **Why It's Not Working: Hypothesis**

There are several possible reasons why `narrativeOverview` state is `null` (causing fallback):

#### **Hypothesis 1: API Call is Failing Silently** ⚠️ MOST LIKELY

The `fetchNarrativeOverview` function catches errors and falls back silently:

```typescript
} else {
  console.warn('⚠️  Narrative overview failed, using frontend fallback');
}
```

Possible causes:
- ❌ **CORS issues** - Edge function might not have proper CORS headers for the request
- ❌ **Authorization failure** - The `ANON_KEY` might not have access to this function
- ❌ **API timeout** - Claude API call might be timing out (no timeout set)
- ❌ **Malformed request** - Some required data might be missing or malformed
- ❌ **Claude API error** - API key issues, rate limits, or service errors
- ❌ **JSON parsing failure** - The edge function expects JSON from Claude but gets different format

#### **Hypothesis 2: State Update Timing Issue**

The overview is fetched AFTER analysis completes, but the UI might render before the state updates:

```typescript
// Analysis completes → Sets analysisResult
// Then calls fetchNarrativeOverview (async, non-blocking)
// UI renders with analysisResult but narrativeOverview is still null
```

#### **Hypothesis 3: Component Unmounting/Remounting**

If the component remounts, `narrativeOverview` state is reset to `null` but not refetched.

**Location**: [src/pages/PIQWorkshop.tsx:756](src/pages/PIQWorkshop.tsx#L756)
```typescript
setNarrativeOverview(null); // Reset when switching PIQs
```

#### **Hypothesis 4: Edge Function Error**

The edge function might be:
- Throwing errors during Claude API call
- Getting malformed responses from Claude
- Failing to parse JSON from Claude's response
- Hitting Anthropic API rate limits or quota issues

---

## Investigation Steps (To Determine Root Cause)

### **Step 1: Check Browser Console Logs**

Look for these console messages when running analysis:
- ✅ `"✅ Narrative overview loaded"` - Success path
- ⚠️ `"⚠️ Narrative overview failed, using frontend fallback"` - HTTP error
- ❌ `"Failed to fetch narrative overview:"` - Network/exception error

### **Step 2: Check Supabase Edge Function Logs**

```bash
supabase functions logs narrative-overview --tail
```

Look for:
- Incoming requests
- Claude API errors
- JSON parsing errors
- Success/failure responses

### **Step 3: Check Network Tab**

In browser DevTools Network tab:
- Is the request to `narrative-overview` being made?
- What's the response status code?
- What's the response body?
- Are there CORS errors?

### **Step 4: Test Edge Function Directly**

```bash
curl -X POST https://zclaplpkuvxkrdwsgrul.supabase.co/functions/v1/narrative-overview \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "essayText": "test essay...",
    "promptText": "test prompt...",
    "narrativeQualityIndex": 70
  }'
```

---

## Solution Design

### **Solution 1: Add Comprehensive Debugging** (IMMEDIATE)

**Goal**: Determine exactly why the API call is failing

**Changes**:

1. **Enhanced logging in fetchNarrativeOverview**:

```typescript
const fetchNarrativeOverview = useCallback(async (analysisData: AnalysisResult) => {
  setLoadingOverview(true);
  console.log('🔍 [Narrative Overview] Starting fetch...', {
    hasVoiceFingerprint: !!analysisData.voiceFingerprint,
    hasExperienceFingerprint: !!analysisData.experienceFingerprint,
    rubricDimensionCount: analysisData.rubricDimensionDetails?.length,
    workshopItemCount: analysisData.workshopItems?.length,
    nqi: analysisData.analysis?.narrative_quality_index,
  });

  try {
    const requestBody = {
      essayText: currentDraft,
      promptText: UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId)?.prompt || '',
      voiceFingerprint: analysisData.voiceFingerprint,
      experienceFingerprint: analysisData.experienceFingerprint,
      rubricDimensionDetails: analysisData.rubricDimensionDetails,
      workshopItems: analysisData.workshopItems,
      narrativeQualityIndex: analysisData.analysis?.narrative_quality_index || 50,
    };

    console.log('🔍 [Narrative Overview] Request body size:',
      JSON.stringify(requestBody).length, 'bytes');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/narrative-overview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('🔍 [Narrative Overview] Response status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('🔍 [Narrative Overview] Response:', {
        success: result.success,
        hasOverview: !!result.narrative_overview,
        overviewLength: result.narrative_overview?.length,
        overviewPreview: result.narrative_overview?.substring(0, 100),
      });

      if (result.success && result.narrative_overview) {
        setNarrativeOverview(result.narrative_overview);
        console.log('✅ [Narrative Overview] Successfully set state');
      } else {
        console.error('❌ [Narrative Overview] Invalid response structure:', result);
      }
    } else {
      const errorBody = await response.text();
      console.error('❌ [Narrative Overview] HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
    }
  } catch (error) {
    console.error('❌ [Narrative Overview] Exception:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  } finally {
    setLoadingOverview(false);
  }
}, [currentDraft, selectedPromptId]);
```

2. **Add UI indicator for loading/error states**:

In the overview display section, show:
```typescript
{loadingOverview && (
  <div className="text-sm text-muted-foreground animate-pulse">
    🤔 Generating personalized narrative overview...
  </div>
)}
{!loadingOverview && !narrativeOverview && (
  <div className="text-xs text-yellow-600 dark:text-yellow-400">
    ⚠️ Using quick analysis (AI overview unavailable)
  </div>
)}
```

### **Solution 2: Fix Edge Function Issues** (BASED ON FINDINGS)

Potential fixes depending on what we find:

#### **If CORS Issue**:
Verify edge function CORS headers allow the request.

#### **If Timeout Issue**:
Add timeout handling:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

const response = await fetch(url, {
  ...options,
  signal: controller.signal,
});

clearTimeout(timeoutId);
```

#### **If Claude API Error**:
Check edge function logs for API errors. Possible fixes:
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check API rate limits
- Add error handling for specific API errors

#### **If JSON Parsing Error**:
The edge function has JSON parsing logic:
```typescript
const jsonMatch = overviewText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
const jsonString = jsonMatch ? jsonMatch[1].trim() : overviewText.trim();
const parsed = JSON.parse(jsonString);
```

This might fail if Claude returns text in a different format. Fix:
- Make the prompt more explicit about JSON format
- Add better fallback handling
- Return raw text if JSON parsing fails

### **Solution 3: Add Retry Logic** (RESILIENCE)

If the API call fails temporarily, retry:

```typescript
const fetchNarrativeOverview = useCallback(async (analysisData: AnalysisResult, retryCount = 0) => {
  const MAX_RETRIES = 2;

  setLoadingOverview(true);
  try {
    // ... existing fetch logic ...

    if (!response.ok && retryCount < MAX_RETRIES) {
      console.log(`⚠️ Retrying narrative overview (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
      return fetchNarrativeOverview(analysisData, retryCount + 1);
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`⚠️ Retrying after error (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchNarrativeOverview(analysisData, retryCount + 1);
    }
    // Final failure - fall back
  } finally {
    setLoadingOverview(false);
  }
}, [currentDraft, selectedPromptId]);
```

### **Solution 4: Persist Overview to Database** (LONG-TERM)

Once generated, save the overview to the database so it persists:

```typescript
if (result.success && result.narrative_overview) {
  setNarrativeOverview(result.narrative_overview);

  // Persist to database
  if (currentEssayId) {
    await saveNarrativeOverviewToDatabase(currentEssayId, result.narrative_overview);
  }
}
```

Then load it when resuming:
```typescript
if (essay && essay.narrative_overview) {
  setNarrativeOverview(essay.narrative_overview);
}
```

### **Solution 5: Improve Fallback Quality** (BACKUP PLAN)

If AI overview continues to fail, improve the frontend fallback to be more personalized:

```typescript
// Use actual dimension evidence instead of generic text
const getDetailedOverview = (dims: RubricDimension[], score: number, analysisData?: AnalysisResult): string => {
  if (narrativeOverview) return narrativeOverview;

  // Enhanced fallback using dimension evidence
  let overview = '';

  // Use actual strength from top dimension's evidence
  const topDimension = dims.filter(d => d.status === 'good').sort((a, b) => b.score - a.score)[0];
  if (topDimension && topDimension.overview) {
    overview += `Your essay's strongest asset is ${topDimension.overview.split('.')[0].toLowerCase()}. `;
  }

  // Use voice fingerprint if available
  if (analysisData?.voiceFingerprint?.tone?.primary) {
    overview += `Your ${analysisData.voiceFingerprint.tone.primary.toLowerCase()} voice comes through clearly. `;
  }

  // ... rest of enhanced fallback
}
```

---

## Implementation Plan (TDD Approach)

### **Phase 1: Investigation & Debugging** (IMMEDIATE)

**Goal**: Determine root cause

**Steps**:
1. ✅ Add comprehensive console logging to `fetchNarrativeOverview`
2. ✅ Add UI indicators for loading/error states
3. ✅ Test with real essay
4. ✅ Check browser console logs
5. ✅ Check Supabase edge function logs
6. ✅ Check network tab for request/response
7. ✅ Document exact failure mode

**Deliverable**: Clear understanding of WHY the overview is not being generated

### **Phase 2: Fix Core Issue** (BASED ON FINDINGS)

**Tests to Write First**:

```typescript
describe('Narrative Overview Generation', () => {
  it('should call edge function after analysis completes', async () => {
    // Mock analysis completion
    // Verify fetch is called with correct parameters
  });

  it('should set narrativeOverview state on success', async () => {
    // Mock successful API response
    // Verify state is updated
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    // Verify fallback is used
    // Verify error is logged
  });

  it('should retry on temporary failures', async () => {
    // Mock temporary failure then success
    // Verify retry logic works
  });

  it('should timeout after 30 seconds', async () => {
    // Mock slow response
    // Verify timeout occurs
  });
});
```

**Implementation**:
1. ✅ Write tests (RED)
2. ✅ Implement fix based on root cause
3. ✅ Add retry logic
4. ✅ Add timeout handling
5. ✅ Run tests (GREEN)
6. ✅ Refactor

### **Phase 3: Edge Function Improvements**

**Tests** (using Deno test framework):

```typescript
Deno.test('narrative-overview should return valid JSON', async () => {
  // Test with sample data
  // Verify response structure
});

Deno.test('narrative-overview should handle missing Claude API key', async () => {
  // Test with missing key
  // Verify error response
});

Deno.test('narrative-overview should parse Claude response correctly', async () => {
  // Mock Claude API response
  // Verify parsing works
});
```

**Implementation**:
1. ✅ Add better error handling in edge function
2. ✅ Improve JSON parsing robustness
3. ✅ Add request validation
4. ✅ Add timeout to Claude API call
5. ✅ Add detailed logging

### **Phase 4: Persistence** (OPTIONAL)

**Database Schema**:

```sql
ALTER TABLE piq_essays
ADD COLUMN narrative_overview TEXT;
```

**Implementation**:
1. ✅ Add column to database
2. ✅ Save overview after generation
3. ✅ Load overview when resuming
4. ✅ Update when re-analyzing

### **Phase 5: Integration Testing**

**Manual Testing Checklist**:

- [ ] Start new essay analysis
- [ ] Verify "Generating personalized narrative overview..." appears
- [ ] Wait for analysis to complete
- [ ] Check browser console for narrative overview logs
- [ ] Verify AI-generated overview appears (not fallback text)
- [ ] Check that overview is essay-specific and insightful
- [ ] Re-analyze same essay
- [ ] Verify overview updates
- [ ] Close and reopen workshop
- [ ] Verify overview persists (if persistence implemented)
- [ ] Test with failing API (disconnect network)
- [ ] Verify fallback appears with appropriate messaging

---

## Expected Outcomes

### **Before (Current State)**

Generic fallback text:
> "Your essay shows genuine effort and authentic voice. The core of what you're trying to convey is there, but it needs sharper focus and more vivid storytelling. The surgical suggestions below show you exactly where and how to strengthen your narrative."

### **After (AI-Generated)**

Essay-specific, empowering overview:
> "Your essay's strongest asset is the vivid sensory detail in your opening scene—the 'metallic tang of solder' and 'satisfying click of components fitting together' immediately transport us into your engineering workspace. You're showing us a transformation: from someone intimidated by circuits to someone who finds beauty in their logic. To make this truly captivating, dig deeper into that moment of shift—what exactly scared you before? What specific realization changed everything? Start by expanding the moment where you first understood how circuits 'speak' to each other."

---

## Success Criteria

✅ **Technical Success**:
- [ ] `narrative-overview` edge function is called after every analysis
- [ ] API call succeeds 95%+ of the time
- [ ] State is updated correctly
- [ ] Overview appears within 5 seconds of analysis completion
- [ ] Errors are logged clearly for debugging
- [ ] Fallback works when API fails

✅ **User Experience Success**:
- [ ] User sees personalized, essay-specific overview
- [ ] Overview mentions actual content from their essay
- [ ] Overview is empowering and actionable
- [ ] Loading state is clear
- [ ] No jarring flash of fallback text

✅ **Code Quality**:
- [ ] Comprehensive error handling
- [ ] Detailed logging for debugging
- [ ] Tests cover success and failure cases
- [ ] Code is maintainable and well-documented

---

## Risk Assessment

**Low Risk**:
- Changes are primarily debugging/logging additions
- Fallback system already exists
- No breaking changes to API contract
- No database schema changes (unless persistence added)

**Medium Risk**:
- Edge function changes could affect deployed function
- Claude API rate limits could cause issues at scale

**Mitigation**:
- Test thoroughly in development first
- Deploy edge function changes carefully
- Monitor logs after deployment
- Keep fallback system robust

---

## Files to Modify

### **Core Changes**
1. ✅ `src/pages/PIQWorkshop.tsx`
   - Add comprehensive logging to `fetchNarrativeOverview`
   - Add retry logic
   - Add timeout handling
   - Add UI loading/error indicators
   - Improve fallback quality (optional)

2. ✅ `supabase/functions/narrative-overview/index.ts`
   - Add better error handling
   - Improve JSON parsing
   - Add request validation
   - Add timeout to Claude API call
   - Add detailed logging

### **Optional (Persistence)**
3. ⚠️ Database migration (if adding persistence)
4. ⚠️ Save/load functions for overview

### **Test Files**
5. ✅ `src/pages/__tests__/PIQWorkshop.test.tsx` (create or update)
6. ✅ `supabase/functions/narrative-overview/test.ts` (create)

---

## Timeline Estimate

- **Phase 1** (Investigation): 1-2 hours
  - Add logging: 30 min
  - Test and document findings: 1 hour

- **Phase 2** (Fix core issue): 2-3 hours
  - Write tests: 45 min
  - Implement fix: 1 hour
  - Add retry/timeout: 45 min
  - Testing: 30 min

- **Phase 3** (Edge function improvements): 1-2 hours
  - Error handling: 45 min
  - Testing: 45 min
  - Deployment: 30 min

- **Phase 4** (Persistence - optional): 1-2 hours
  - Schema change: 15 min
  - Implementation: 1 hour
  - Testing: 45 min

- **Phase 5** (Integration testing): 1 hour

**Total: 6-10 hours** (4-6 hours without persistence)

---

## Next Steps

### **Immediate Actions** (Do This First):

1. **Add Debug Logging** to `fetchNarrativeOverview` in PIQWorkshop.tsx
2. **Test with Real Essay** and check:
   - Browser console logs
   - Network tab
   - Supabase function logs
3. **Document Findings** - What exactly is failing?

### **Then Proceed Based on Findings**:

- **If API call not being made** → Fix calling logic
- **If API call failing** → Check edge function logs, fix root cause
- **If API call succeeding but state not updating** → Fix state management
- **If edge function erroring** → Fix edge function implementation

---

## Questions for Approval

1. Should I start with Phase 1 (Investigation) to determine root cause before implementing fixes?
2. Should we add persistence for the narrative overview? (Recommended for better UX)
3. What's the acceptable latency for overview generation? (Current: ~3-5 seconds)
4. Should we show a more detailed loading state (e.g., progress indicator)?
5. If AI overview fails repeatedly, should we notify the user or silently use fallback?

---

**Ready to begin investigation!** Please approve and I'll start with Phase 1 to determine exactly why the AI-generated overview isn't appearing. 🔍

