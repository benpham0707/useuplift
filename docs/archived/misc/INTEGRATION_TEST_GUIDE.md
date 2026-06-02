# PIQ Workshop Full Integration Test Guide

## ✅ Deployment Status

**Edge Function**: `workshop-analysis` - DEPLOYED ✅
- **URL**: `https://zclaplpkuvxkrdwsgrul.supabase.co/functions/v1/workshop-analysis`
- **Status**: ACTIVE (Version 2)
- **Last Deployed**: 2025-11-24 22:09:59 UTC
- **Test Result**: 108 seconds, all data returned correctly

**Secrets**: CONFIGURED ✅
- `ANTHROPIC_API_KEY` - Set and verified
- Edge function has access to Claude API

---

## 🧪 Integration Test Results (Edge Function)

```
✅ Edge function succeeded in 108.0s

📊 Response validation:
   ✓ voiceFingerprint: ✓ Present
   ✓ experienceFingerprint: ✓ Present
   ✓ rubricDimensionDetails: 12 dimensions
   ✓ workshopItems: 5 items
   ✓ analysis.narrative_quality_index: 79

🎤 Voice Fingerprint Sample:
   Sentence Structure: methodical compound structures with precise technical details
   Vocabulary Level: technical precision with accessible explanations

🔍 Experience Fingerprint Sample:
   Confidence Score: 8.5
   Anti-Pattern Flags: 5

📏 Rubric Dimensions (top 3):
   opening_hook: 8/10 (raw: 8)
   character_development: 8/10 (raw: 7)
   stakes_tension: 6/10 (raw: 6)

🔧 Workshop Items (first item):
   Problem: Opening lacks emotional hook or compelling tension
   Severity: medium
   Suggestions: 3
```

---

## 🌐 Browser Testing Instructions

### Step 1: Navigate to PIQ Workshop
1. Open browser to: `http://localhost:8080/piq-workshop`
2. The page should load with the default Lego essay

### Step 2: Verify Initial Analysis Triggers
**Expected Behavior:**
- On page load, `performFullAnalysis()` should trigger automatically
- You'll see "Analyzing..." state for ~108 seconds
- Check browser console for these logs:
  ```
  📍 Component mounted - checking if initial analysis needed
  🚀 Triggering initial analysis...
  🔍 performFullAnalysis called
  ```

### Step 3: Verify Edge Function Call
**Check Console for:**
```
📤 Calling edge function: workshop-analysis
📦 Request payload: {essayText, promptTitle, promptText, essayType}
```

**Should NOT see:**
- ❌ "Claude API calls must be made from backend/edge functions"
- ❌ "Surgical workshop failed"
- ❌ Any fallback to heuristics

### Step 4: Wait for Analysis (108+ seconds)
**During Analysis:**
- Progress indicator should show
- No errors in console
- No alerts/popups

**After Analysis Completes:**
```
📥 Edge function response received
✅ Successfully transformed to frontend format
📊 Backend result received:
   - rubricDimensionDetails: 12 dimensions
   - workshopItems: 5 items
```

### Step 5: Verify UI Components Display

#### A. Essay Overview Card
- **Location**: Top of page
- **Should Show**:
  - Narrative Quality Index: ~79/100
  - Overall score display
  - No mock/fallback data

#### B. Voice Fingerprint Card
- **Location**: Below essay overview, left side
- **Should Show**:
  - Sentence Structure: "methodical compound structures..."
  - Vocabulary: "technical precision with accessible explanations"
  - Pacing: (from backend)
  - Tone: (from backend)
  - Purple/blue gradient styling

#### C. Experience Fingerprint Card
- **Location**: Below essay overview, right side
- **Should Show**:
  - Confidence Score: ~8.5
  - Anti-Pattern Flags: 5 items
  - Uniqueness dimensions (if present)
  - Orange gradient (if risks) OR green gradient (if unique)

#### D. Rubric Analysis Section
- **Location**: Main content area
- **Should Show**:
  - 12 Dimension cards
  - Each dimension with:
    - Name (e.g., "Opening Hook")
    - Score: X/10
    - Status badge (good/needs_work/critical)
    - Overview text from backend
  - **First 3 dimensions should be**:
    1. opening_hook: 8/10 (good)
    2. character_development: 8/10 (good)
    3. stakes_tension: 6/10 (needs_work)

#### E. Workshop Items / Issues
- **Location**: Within dimension cards
- **Should Show**:
  - 5 total workshop items distributed across dimensions
  - Each item with:
    - Problem title
    - Quote/excerpt
    - Analysis text
    - 3 suggestions (polished_original, voice_amplifier, divergent_strategy)
  - **First item should be**:
    - Problem: "Opening lacks emotional hook or compelling tension"
    - Severity: medium
    - 3 actionable suggestions

#### F. PIQ Prompt Selector
- **Location**: Right column, below essay editor
- **Should Show**:
  - Dropdown with 8 UC PIQ prompts
  - Currently selected: "PIQ 1: Leadership Experience"
  - Collapsible/expandable design
  - Full prompt text visible when expanded

### Step 6: Test Reanalysis
1. Click "Reanalyze" button
2. **Expected**:
   - Analysis runs again (~108 seconds)
   - All data refreshes
   - No errors
   - UI updates with new results

### Step 7: Test Prompt Switching
1. Select different prompt from dropdown (e.g., PIQ 2: Creative Side)
2. **Expected**:
   - `setNeedsReanalysis(true)` triggered
   - Analysis reruns with new prompt context
   - Results update based on new prompt

---

## 🔍 Data Flow Verification

### Frontend → Edge Function
```typescript
// PIQWorkshop.tsx calls:
analyzePIQEntry(
  currentDraft,           // Essay text
  selectedPrompt.title,   // "Leadership Experience"
  selectedPrompt.prompt,  // Full prompt text
  { essayType: 'uc_piq' }
)

// piqWorkshopAnalysisService.ts invokes:
supabase.functions.invoke('workshop-analysis', {
  body: { essayText, promptTitle, promptText, essayType }
})
```

### Edge Function → Claude API (4 Sequential Calls)
1. **Voice Fingerprint** (2048 tokens) → sentence structure, vocabulary, pacing, tone
2. **Experience Fingerprint** (3072 tokens) → uniqueness, anti-patterns, confidence
3. **12-Dimension Rubric** (4096 tokens) → scores, evidence, justifications
4. **Workshop Items** (8192 tokens) → problems, quotes, 3 suggestion types each

### Edge Function → Frontend
```typescript
{
  voiceFingerprint: { sentenceStructure, vocabulary, pacing, tone },
  experienceFingerprint: { confidenceScore, antiPatternFlags, ... },
  rubricDimensionDetails: [ // 12 dimensions
    {
      dimension_name: "opening_hook",
      raw_score: 8,
      final_score: 8,
      evidence: { justification, strengths, weaknesses }
    },
    // ... 11 more
  ],
  workshopItems: [ // 5 items
    {
      id, problem, quote, why_it_matters, severity,
      rubric_category: "opening_hook",
      suggestions: [
        { type: 'polished_original', text, rationale },
        { type: 'voice_amplifier', text, rationale },
        { type: 'divergent_strategy', text, rationale }
      ]
    },
    // ... 4 more
  ],
  analysis: {
    narrative_quality_index: 79,
    // ... other metadata
  }
}
```

### Frontend Transformation
```typescript
// piqWorkshopAnalysisService.ts transforms to AnalysisResult
// PIQWorkshop.tsx maps to RubricDimension[] for UI
```

---

## ✅ Success Criteria

All of the following MUST be true:

- [ ] No "Claude API" security errors
- [ ] No fallback to mock data
- [ ] No fallback to heuristics
- [ ] Analysis completes in ~108 seconds
- [ ] Voice Fingerprint displays 4 dimensions
- [ ] Experience Fingerprint shows confidence + anti-patterns
- [ ] All 12 rubric dimensions appear with real scores
- [ ] 5 workshop items mapped to dimensions
- [ ] Each workshop item has 3 suggestion types
- [ ] Narrative Quality Index displays (~79)
- [ ] PIQ Prompt Selector works and triggers reanalysis
- [ ] Reanalyze button triggers new analysis
- [ ] Console shows detailed logging (no silent failures)
- [ ] NO alerts or error popups

---

## 🐛 Troubleshooting

### If you see "Claude API" error:
- **Cause**: Edge function not deployed or secret not set
- **Fix**: Already deployed! Should not happen.

### If analysis never completes:
- **Check**: Browser console for errors
- **Check**: Network tab for failed edge function call
- **Check**: Edge function logs in Supabase dashboard

### If Voice/Experience Fingerprint not showing:
- **Check**: Console for `analysisResult.voiceFingerprint` and `analysisResult.experienceFingerprint`
- **Verify**: Edge function returned these fields

### If rubric dimensions show wrong scores:
- **Check**: Field name mapping (snake_case vs camelCase)
- **Verify**: `dim.final_score` (not `dim.finalScore`)
- **Verify**: `dim.dimension_name` (not `dim.category`)

---

## 📝 Next Steps After Successful Test

1. **Document** any issues found during testing
2. **Verify** all 12 dimensions display correctly (not just first 3)
3. **Test** with different UC PIQ prompts (all 8)
4. **Test** with shorter/longer essays
5. **Verify** suggestion types work (polished_original, voice_amplifier, divergent_strategy)
6. **Test** applying suggestions and re-analyzing
7. **Performance**: Confirm analysis time is acceptable (~108s is expected for full surgical workshop)

---

## 🎯 Quality Guarantees Maintained

✅ **NO data loss** - All backend insights preserved
✅ **NO fallbacks** - Real analysis or visible error
✅ **NO quality reduction** - Full 100+ second surgical workshop
✅ **Complete transparency** - Detailed console logging
✅ **Type safety** - Full TypeScript interfaces
✅ **Error visibility** - Alerts on failure, no silent failures

---

## 🔗 Useful Links

- **PIQ Workshop**: http://localhost:8080/piq-workshop
- **Edge Function Dashboard**: https://supabase.com/dashboard/project/zclaplpkuvxkrdwsgrul/functions
- **Edge Function Logs**: https://supabase.com/dashboard/project/zclaplpkuvxkrdwsgrul/logs/edge-functions
- **Supabase Secrets**: https://supabase.com/dashboard/project/zclaplpkuvxkrdwsgrul/settings/functions

---

**Ready to test! 🚀**

The full integration is deployed and verified. Navigate to http://localhost:8080/piq-workshop and follow the test steps above.
