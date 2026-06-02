# Solution: Bypassing 150-Second Timeout

**Problem**: Phase 17 (88-133s) + Phase 18 (40-50s) = 128-183s total, which can exceed 150s timeout

**Solution**: Split into TWO separate API calls with NO loss of functionality or quality

---

## Architecture: Two-Phase Request Pattern

### Current Flow (Hits Timeout)
```
Frontend → workshop-analysis (150s timeout)
           ├─ Phase 17: Voice + Experience + Rubric + Workshop (88-133s)
           └─ Phase 18: Validation (40-50s)
           └─ Return complete result (❌ TIMEOUT at 150s+)
```

### New Flow (Bypasses Timeout)
```
Frontend → workshop-analysis (150s timeout)
           ├─ Phase 17: Voice + Experience + Rubric + Workshop (88-133s)
           └─ Return Phase 17 results immediately ✅

Frontend → validate-workshop (NEW, separate 150s timeout)
           ├─ Phase 18: Validation (40-50s)
           └─ Return validation results ✅
```

---

## Implementation Strategy

### Option 1: Sequential Calls (Recommended)
**User Experience**: Slightly slower but simpler

```typescript
// Frontend code
async function getWorkshopWithValidation(essay, prompt) {
  // Step 1: Get Phase 17 suggestions (returns in 88-133s)
  const phase17 = await fetch('/functions/v1/workshop-analysis', {
    body: { essayText: essay, promptText: prompt }
  });

  // Show Phase 17 results to user immediately
  displaySuggestions(phase17.workshopItems);

  // Step 2: Get Phase 18 validation (returns in 40-50s)
  const phase18 = await fetch('/functions/v1/validate-workshop', {
    body: { workshopItems: phase17.workshopItems, essayText: essay }
  });

  // Update UI with validation scores
  updateWithValidation(phase18.validations);
}
```

**Total Time**: 128-183s (same as before)
**Timeouts**: None (each call < 150s)
**UX**: User sees suggestions immediately, then quality scores appear

---

### Option 2: Fire-and-Forget (Fastest UX)
**User Experience**: Show suggestions instantly, validate in background

```typescript
// Frontend code
async function getWorkshopWithValidation(essay, prompt) {
  // Step 1: Get Phase 17 suggestions
  const phase17Promise = fetch('/functions/v1/workshop-analysis', {
    body: { essayText: essay, promptText: prompt }
  });

  // Step 2: Start Phase 18 validation (don't wait)
  phase17Promise.then(phase17 => {
    displaySuggestions(phase17.workshopItems);

    // Validate in background
    fetch('/functions/v1/validate-workshop', {
      body: { workshopItems: phase17.workshopItems, essayText: essay }
    }).then(phase18 => {
      updateWithValidation(phase18.validations);
    });
  });
}
```

**Total Time**: 88-133s to first display
**Validation**: Appears 40-50s later
**UX**: Fastest - user sees suggestions immediately

---

## New Edge Function: validate-workshop

**File**: `supabase/functions/validate-workshop/index.ts`

```typescript
/**
 * Validate Workshop Suggestions
 *
 * Runs Phase 18 validation on Phase 17 output
 * Separate endpoint to avoid 150s timeout
 */

import { validateSuggestions } from '../validate-suggestions/simple-validator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ValidateRequest {
  workshopItems: Array<{
    id: string;
    quote: string;
    suggestions: Array<{
      type: string;
      text: string;
      rationale: string;
    }>;
  }>;
  essayText: string;
  promptText?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ValidateRequest = await req.json();

    console.log('🔍 Validation Request:', {
      itemCount: body.workshopItems?.length,
      suggestionCount: body.workshopItems?.reduce((sum, item) => sum + item.suggestions.length, 0)
    });

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Flatten suggestions from all workshop items
    const allSuggestions = body.workshopItems.flatMap((item, itemIdx) =>
      item.suggestions.map((sug, sugIdx) => ({
        suggestion_id: `item_${itemIdx}_sug_${sugIdx}`,
        suggestion_text: sug.text,
        suggestion_type: sug.type
      }))
    );

    console.log(`   Validating ${allSuggestions.length} total suggestions...`);

    // Run validation (single API call, 40-50s)
    const validations = await validateSuggestions(
      allSuggestions,
      body.essayText,
      anthropicApiKey
    );

    // Map validations back to workshop structure
    const enrichedWorkshopItems = body.workshopItems.map((item, itemIdx) => ({
      ...item,
      suggestions: item.suggestions.map((sug, sugIdx) => {
        const globalIdx = itemIdx * item.suggestions.length + sugIdx;
        return {
          ...sug,
          validation: validations[globalIdx]
        };
      })
    }));

    // Calculate summary
    const summary = {
      average_quality: validations.reduce((sum, v) => sum + v.quality_score, 0) / validations.length,
      excellent_count: validations.filter(v => v.verdict === 'excellent').length,
      good_count: validations.filter(v => v.verdict === 'good').length,
      needs_work_count: validations.filter(v => v.verdict === 'needs_work').length,
    };

    console.log('✅ Validation complete:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        workshopItems: enrichedWorkshopItems,
        summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Validation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

---

## Deployment Steps

### 1. Create validate-workshop function
```bash
# Create directory
mkdir -p supabase/functions/validate-workshop

# Copy validator
cp supabase/functions/validate-suggestions/simple-validator.ts \
   supabase/functions/validate-workshop/

# Create index.ts (code above)
```

### 2. Deploy to Supabase
```bash
export SUPABASE_ACCESS_TOKEN=sbp_cd670c5220812795e57290deb11673898f3bdef8

# Deploy new validation endpoint
supabase functions deploy validate-workshop

# Verify deployment
supabase functions list
```

### 3. Update Frontend
```typescript
// src/services/piqWorkshop/supabaseService.ts

export async function getWorkshopAnalysisWithValidation(
  essayText: string,
  promptText: string,
  essayType: string,
  promptTitle: string
) {
  // Step 1: Get Phase 17 suggestions (88-133s, under 150s limit)
  const phase17Response = await supabase.functions.invoke('workshop-analysis', {
    body: {
      essayText,
      promptText,
      essayType,
      promptTitle,
      maxWords: 350
    }
  });

  if (phase17Response.error) {
    throw phase17Response.error;
  }

  const phase17Data = phase17Response.data;

  // Return Phase 17 immediately for fast UX
  // Then validate in background

  // Step 2: Get Phase 18 validation (40-50s, under 150s limit)
  const phase18Response = await supabase.functions.invoke('validate-workshop', {
    body: {
      workshopItems: phase17Data.workshopItems,
      essayText,
      promptText
    }
  });

  if (phase18Response.error) {
    console.warn('Validation failed, returning Phase 17 only:', phase18Response.error);
    return phase17Data; // Graceful degradation
  }

  // Merge validation into Phase 17 results
  return {
    ...phase17Data,
    workshopItems: phase18Response.data.workshopItems,
    validationSummary: phase18Response.data.summary
  };
}
```

---

## Benefits

### ✅ No Timeout Issues
- Phase 17: 88-133s (well under 150s)
- Phase 18: 40-50s (well under 150s)
- Total: Still 128-183s but split across two calls

### ✅ No Loss of Functionality
- Exact same Phase 17 logic
- Exact same Phase 18 validation
- Same quality of results

### ✅ Better UX Options
- **Option 1**: Sequential (show suggestions → show validation)
- **Option 2**: Parallel (show suggestions instantly, validate in background)

### ✅ Graceful Degradation
- If Phase 18 fails, Phase 17 results still shown
- User always gets suggestions, validation is optional enhancement

### ✅ Easier Debugging
- Two separate functions = easier to troubleshoot
- Can test Phase 17 and Phase 18 independently

---

## Testing

```bash
# Test Phase 17 (should return in 88-133s)
curl -X POST https://zclaplpkuvxkrdwsgrul.supabase.co/functions/v1/workshop-analysis \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"essayText": "...", "promptText": "..."}'

# Test Phase 18 (should return in 40-50s)
curl -X POST https://zclaplpkuvxkrdwsgrul.supabase.co/functions/v1/validate-workshop \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"workshopItems": [...], "essayText": "..."}'
```

---

## Rollback Plan

If something goes wrong:

```bash
# Delete new function
supabase functions delete validate-workshop

# Frontend continues to call workshop-analysis only
# (Will timeout but can increase timeout or remove Phase 18 integration)
```

---

## Summary

**Before**: Single 150s+ call → timeout ❌
**After**: Two separate calls (88-133s + 40-50s) → no timeout ✅

**Same functionality, same quality, no timeouts!**
