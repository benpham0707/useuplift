# Two-Step Validation Frontend Integration Plan

## Current Architecture Analysis

### Existing Flow (Single API Call - Timeout Risk)
```
User clicks "Analyze"
    ↓
PIQWorkshopIntegrated.performAnalysis()
    ↓
piqWorkshopAnalysisService.analyzePIQEntry()
    ↓
supabase.functions.invoke('workshop-analysis')  [88-133s + 40-50s = 128-183s] ❌ TIMEOUT RISK
    ↓
Returns: voice, experience, rubric, workshop items
    ↓
UI displays everything at once
```

### Issues with Current Flow
1. **Timeout Risk**: Combined Phase 17 + 18 exceeds 150s limit
2. **No Progressive Loading**: User waits 2+ minutes with no intermediate feedback
3. **All-or-nothing**: If timeout occurs, user gets nothing

---

## New Architecture (Two-Step API Calls)

### High-Level Flow
```
User clicks "Analyze"
    ↓
PHASE 17: Generate Workshop Suggestions [88-133s]
    ├─ Show loading: "Analyzing your essay..."
    ├─ API call: workshop-analysis
    └─ UI updates: Display suggestions immediately ✅
    ↓
PHASE 18: Validate Quality [20-50s]
    ├─ Show loading: "Scoring suggestion quality..."
    ├─ API call: validate-workshop
    └─ UI updates: Add quality scores to suggestions ✅
```

### Benefits
1. ✅ **No Timeout**: Each call stays under 150s
2. ✅ **Progressive Loading**: Suggestions appear in ~113s, scores appear ~22s later
3. ✅ **Graceful Degradation**: If Phase 18 fails, user still has suggestions
4. ✅ **Better UX**: User sees progress instead of black box waiting

---

## Implementation Details

### Step 1: Update TypeScript Interfaces

**File**: `src/components/portfolio/extracurricular/workshop/backendTypes.ts`

```typescript
// Add validation result types for Phase 18
export interface ValidationResult {
  suggestion_id: string;
  quality_score: number; // 0-10
  issues: string[];
  improvements: string[];
  verdict: 'excellent' | 'good' | 'needs_work';
}

export interface WorkshopSuggestion {
  type: string;
  text: string;
  rationale: string;
  fingerprint_connection?: string;
  // NEW: Phase 18 validation
  validation?: ValidationResult;
}

export interface WorkshopItem {
  id: string;
  quote: string;
  problem: string;
  why_it_matters: string;
  rubric_category: string;
  severity: 'critical' | 'major' | 'minor';
  suggestions: WorkshopSuggestion[];
}

export interface ValidationSummary {
  average_quality: number;
  excellent_count: number;
  good_count: number;
  needs_work_count: number;
  total_suggestions: number;
  validation_time_seconds: number;
}

// Extend AnalysisResult to include validation
export interface AnalysisResult {
  // ... existing fields ...
  workshopItems: WorkshopItem[];

  // NEW: Phase 18 validation summary
  validationSummary?: ValidationSummary;
}
```

---

### Step 2: Update piqWorkshopAnalysisService.ts

**File**: `src/services/piqWorkshopAnalysisService.ts`

Add two-step analysis function:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Two-step analysis with Phase 17 + Phase 18 validation
 *
 * @param onPhase17Complete - Callback when Phase 17 finishes (for progressive UI)
 * @param onPhase18Complete - Callback when Phase 18 finishes (for quality scores)
 */
export async function analyzePIQEntryTwoStep(
  essayText: string,
  promptTitle: string,
  promptText: string,
  callbacks: {
    onPhase17Complete?: (result: AnalysisResult) => void;
    onPhase18Complete?: (validatedResult: AnalysisResult) => void;
    onProgress?: (status: string) => void;
  },
  options: {
    depth?: 'quick' | 'standard' | 'comprehensive';
    skip_coaching?: boolean;
    essayType?: 'personal_statement' | 'uc_piq' | 'why_us' | 'supplemental' | 'activity_essay';
  } = {}
): Promise<AnalysisResult> {

  console.log('='.repeat(80));
  console.log('TWO-STEP PIQ WORKSHOP ANALYSIS');
  console.log('='.repeat(80));

  // ========================================================================
  // PHASE 17: Generate Workshop Suggestions (88-133s)
  // ========================================================================

  try {
    callbacks.onProgress?.('Analyzing your essay and generating suggestions...');
    console.log('🌐 PHASE 17: Calling workshop-analysis...');

    const phase17Start = Date.now();

    const { data: phase17Data, error: phase17Error } = await supabase.functions.invoke(
      'workshop-analysis',
      {
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
      }
    );

    const phase17Time = (Date.now() - phase17Start) / 1000;

    if (phase17Error) {
      console.error('❌ Phase 17 error:', phase17Error);
      throw new Error(`Phase 17 failed: ${phase17Error.message}`);
    }

    if (!phase17Data || !phase17Data.success) {
      console.error('❌ Phase 17 returned error:', phase17Data);
      throw new Error(phase17Data?.error || 'Phase 17 failed');
    }

    console.log(`✅ Phase 17 complete in ${phase17Time.toFixed(1)}s`);
    console.log(`   NQI: ${phase17Data.analysis.narrative_quality_index}/100`);
    console.log(`   Workshop Items: ${phase17Data.workshopItems?.length || 0}`);
    console.log(`   Total Suggestions: ${phase17Data.workshopItems?.reduce((sum, item) => sum + item.suggestions.length, 0) || 0}`);

    // Transform Phase 17 result
    const phase17Result: AnalysisResult = {
      analysis: {
        narrative_quality_index: phase17Data.analysis.narrative_quality_index,
        overall_strengths: phase17Data.analysis.overall_strengths || [],
        overall_weaknesses: phase17Data.analysis.overall_weaknesses || [],
        // Transform categories from rubric dimensions
        categories: (phase17Data.rubricDimensionDetails || []).map(dim => ({
          category: dim.dimension_name,
          score: dim.final_score,
          maxScore: 10,
          comments: [dim.evidence?.justification || ''],
          evidence: [dim.evidence?.strengths || ''],
          suggestions: dim.evidence?.gaps || [],
        })),
        weights: {}, // Will be filled from rubric
        id: 'phase17-' + Date.now(),
        entry_id: 'piq-' + Date.now(),
        rubric_version: 'surgical-workshop-v17',
        created_at: new Date().toISOString(),
        reader_impression_label: getImpressionLabel(phase17Data.analysis.narrative_quality_index),
        flags: [],
        suggested_fixes_ranked: [],
        analysis_depth: 'comprehensive',
      },
      voiceFingerprint: phase17Data.voiceFingerprint,
      experienceFingerprint: phase17Data.experienceFingerprint,
      rubricDimensionDetails: phase17Data.rubricDimensionDetails,
      workshopItems: phase17Data.workshopItems,
      categories: {}, // Legacy field
    };

    // Notify UI that Phase 17 is complete - suggestions can be displayed!
    callbacks.onPhase17Complete?.(phase17Result);

    // ========================================================================
    // PHASE 18: Validate Suggestion Quality (20-50s)
    // ========================================================================

    callbacks.onProgress?.('Scoring suggestion quality...');
    console.log('🔍 PHASE 18: Calling validate-workshop...');

    const phase18Start = Date.now();

    const { data: phase18Data, error: phase18Error } = await supabase.functions.invoke(
      'validate-workshop',
      {
        body: {
          workshopItems: phase17Data.workshopItems,
          essayText,
          promptText
        }
      }
    );

    const phase18Time = (Date.now() - phase18Start) / 1000;

    // Graceful degradation: If Phase 18 fails, return Phase 17 results
    if (phase18Error || !phase18Data?.success) {
      console.warn('⚠️ Phase 18 failed, proceeding with Phase 17 results only');
      console.warn('   Error:', phase18Error?.message || phase18Data?.error);
      return phase17Result;
    }

    console.log(`✅ Phase 18 complete in ${phase18Time.toFixed(1)}s`);
    console.log(`   Average Quality: ${phase18Data.summary?.average_quality.toFixed(1)}/10`);
    console.log(`   Excellent: ${phase18Data.summary?.excellent_count}`);
    console.log(`   Good: ${phase18Data.summary?.good_count}`);
    console.log(`   Needs Work: ${phase18Data.summary?.needs_work_count}`);

    // Merge Phase 18 validations back into Phase 17 result
    const validatedResult: AnalysisResult = {
      ...phase17Result,
      workshopItems: phase18Data.workshopItems, // Now includes validation
      validationSummary: phase18Data.summary
    };

    // Notify UI that Phase 18 is complete - quality scores can be displayed!
    callbacks.onPhase18Complete?.(validatedResult);

    console.log('='.repeat(80));
    console.log(`✅ TWO-STEP ANALYSIS COMPLETE`);
    console.log(`   Phase 17: ${phase17Time.toFixed(1)}s`);
    console.log(`   Phase 18: ${phase18Time.toFixed(1)}s`);
    console.log(`   Total: ${(phase17Time + phase18Time).toFixed(1)}s`);
    console.log('='.repeat(80));

    return validatedResult;

  } catch (error) {
    console.error('❌ TWO-STEP ANALYSIS FAILED:', error);
    throw new Error(`PIQ workshop analysis failed: ${(error as Error).message}`);
  }
}

// Helper function
function getImpressionLabel(nqi: number): 'captivating_grounded' | 'strong_distinct_voice' | 'solid_needs_polish' | 'patchy_narrative' | 'generic_unclear' {
  if (nqi >= 85) return 'captivating_grounded';
  if (nqi >= 70) return 'strong_distinct_voice';
  if (nqi >= 55) return 'solid_needs_polish';
  if (nqi >= 40) return 'patchy_narrative';
  return 'generic_unclear';
}
```

---

### Step 3: Update PIQWorkshopIntegrated Component

**File**: `src/components/portfolio/piq/workshop/PIQWorkshopIntegrated.tsx`

```typescript
// Add state for Phase 18 validation
const [validationLoading, setValidationLoading] = useState(false);
const [validationComplete, setValidationComplete] = useState(false);
const [progressMessage, setProgressMessage] = useState('');

// Update performAnalysis to use two-step flow
const performAnalysis = useCallback(
  async (draft: string, isInitial: boolean = false) => {
    setIsAnalyzing(true);
    setValidationLoading(false);
    setValidationComplete(false);
    setAnalysisError(null);

    try {
      console.log('🔍 Starting Two-Step PIQ analysis...');

      // Use two-step analysis with callbacks for progressive UI
      const result = await analyzePIQEntryTwoStep(
        draft,
        promptTitle,
        promptText,
        {
          // Phase 17 complete - show suggestions immediately
          onPhase17Complete: (phase17Result) => {
            console.log('📊 Phase 17 complete - displaying suggestions');
            setAnalysisResult(phase17Result);

            // Transform to teaching format
            const coaching = transformAnalysisToCoaching(
              phase17Result.analysis,
              phase17Result.coaching || null,
              draft
            );
            setTeachingCoaching(coaching);
            setTeachingIssues(coaching.teaching_issues);

            // Track initial score
            if (isInitial) {
              initialScoreRef.current = phase17Result.analysis.narrative_quality_index;
            }

            // Phase 17 done, but Phase 18 still loading
            setIsAnalyzing(false);
            setValidationLoading(true);
          },

          // Phase 18 complete - add quality scores
          onPhase18Complete: (validatedResult) => {
            console.log('✨ Phase 18 complete - adding quality scores');
            setAnalysisResult(validatedResult);
            setValidationLoading(false);
            setValidationComplete(true);
          },

          // Progress updates
          onProgress: (status) => {
            console.log('📍', status);
            setProgressMessage(status);
          }
        },
        {
          depth: 'comprehensive',
          skip_coaching: false,
        }
      );

      console.log('✅ Two-Step PIQ Analysis complete');

    } catch (error) {
      console.error('❌ PIQ Analysis failed:', error);
      setAnalysisError(
        error instanceof Error ? error.message : 'Analysis failed. Please try again.'
      );
      setIsAnalyzing(false);
      setValidationLoading(false);
    }
  },
  [promptTitle, promptText]
);
```

---

### Step 4: Create Quality Score UI Component

**New File**: `src/components/portfolio/piq/workshop/QualityScoreBadge.tsx`

```typescript
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import type { ValidationResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';

interface QualityScoreBadgeProps {
  validation?: ValidationResult;
  loading?: boolean;
}

export const QualityScoreBadge: React.FC<QualityScoreBadgeProps> = ({
  validation,
  loading
}) => {
  if (loading) {
    return (
      <Badge variant="outline" className="text-xs">
        <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
        Scoring...
      </Badge>
    );
  }

  if (!validation) {
    return null;
  }

  const { quality_score, verdict } = validation;

  // Color coding based on verdict
  const getBadgeVariant = () => {
    if (verdict === 'excellent') return 'default'; // Green
    if (verdict === 'good') return 'secondary'; // Blue
    return 'destructive'; // Red/Orange
  };

  const getIcon = () => {
    if (verdict === 'excellent') return <CheckCircle className="w-3 h-3 mr-1" />;
    if (verdict === 'good') return <Sparkles className="w-3 h-3 mr-1" />;
    return <AlertCircle className="w-3 h-3 mr-1" />;
  };

  return (
    <Badge variant={getBadgeVariant()} className="text-xs">
      {getIcon()}
      {quality_score}/10 - {verdict.replace('_', ' ')}
    </Badge>
  );
};
```

---

### Step 5: Update Workshop Item Display

**File**: `src/components/portfolio/piq/workshop/WorkshopItemCard.tsx` (or wherever workshop items are displayed)

```typescript
import { QualityScoreBadge } from './QualityScoreBadge';

// In the suggestion display section:
{item.suggestions.map((suggestion, idx) => (
  <div key={idx} className="border-l-2 border-blue-200 pl-4 py-2">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-blue-600">
            {suggestion.type.replace('_', ' ').toUpperCase()}
          </span>

          {/* NEW: Quality Score Badge */}
          <QualityScoreBadge
            validation={suggestion.validation}
            loading={validationLoading && !validationComplete}
          />
        </div>

        <p className="text-sm">{suggestion.text}</p>
        <p className="text-xs text-gray-500 mt-1">{suggestion.rationale}</p>

        {/* NEW: Show validation issues if present */}
        {suggestion.validation && suggestion.validation.issues.length > 0 && (
          <div className="mt-2 text-xs text-orange-600">
            <strong>Quality Issues:</strong>
            <ul className="list-disc list-inside ml-2">
              {suggestion.validation.issues.slice(0, 2).map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* NEW: Show improvements if present */}
        {suggestion.validation && suggestion.validation.improvements.length > 0 && (
          <div className="mt-2 text-xs text-green-600">
            <strong>Suggested Improvements:</strong>
            <ul className="list-disc list-inside ml-2">
              {suggestion.validation.improvements.slice(0, 2).map((improvement, i) => (
                <li key={i}>{improvement}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  </div>
))}
```

---

### Step 6: Add Loading States UI

**File**: `src/components/portfolio/piq/workshop/PIQWorkshopIntegrated.tsx`

Add loading state indicators:

```typescript
{/* Analysis Loading State */}
{isAnalyzing && (
  <div className="flex flex-col items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
    <p className="text-sm text-gray-600">{progressMessage || 'Analyzing your essay...'}</p>
    <p className="text-xs text-gray-400 mt-2">This may take up to 2 minutes</p>
  </div>
)}

{/* Validation Loading State (appears after Phase 17 completes) */}
{validationLoading && !isAnalyzing && (
  <Alert className="mb-4">
    <Sparkles className="w-4 h-4 animate-pulse" />
    <AlertDescription>
      Workshop suggestions are ready! Now scoring quality... (20-50 seconds)
    </AlertDescription>
  </Alert>
)}

{/* Validation Complete */}
{validationComplete && analysisResult?.validationSummary && (
  <Alert className="mb-4 border-green-200 bg-green-50">
    <CheckCircle className="w-4 h-4 text-green-600" />
    <AlertDescription className="text-green-800">
      Quality scoring complete! Average: {analysisResult.validationSummary.average_quality.toFixed(1)}/10
      ({analysisResult.validationSummary.excellent_count} excellent,{' '}
      {analysisResult.validationSummary.good_count} good,{' '}
      {analysisResult.validationSummary.needs_work_count} needs work)
    </AlertDescription>
  </Alert>
)}
```

---

## Testing Strategy

### Unit Tests

1. **Test Phase 17 API Call**
   - Verify workshop-analysis returns expected structure
   - Verify timeout stays under 150s
   - Verify callback fires with Phase 17 data

2. **Test Phase 18 API Call**
   - Verify validate-workshop returns validation results
   - Verify timeout stays under 150s
   - Verify callback fires with Phase 18 data

3. **Test Graceful Degradation**
   - Simulate Phase 18 failure
   - Verify UI still shows Phase 17 results
   - Verify no crash/error state

### Integration Tests

1. **End-to-End Flow**
   - User submits essay
   - Phase 17 completes → suggestions appear
   - Phase 18 completes → quality scores appear
   - Verify total time < 3 minutes

2. **UI State Management**
   - Verify loading states transition correctly
   - Verify progress messages update
   - Verify quality badges render correctly

### Manual Testing Checklist

- [ ] Submit test essay, verify Phase 17 completes in 88-133s
- [ ] Verify suggestions appear immediately after Phase 17
- [ ] Verify Phase 18 loading indicator shows
- [ ] Verify Phase 18 completes in 20-50s
- [ ] Verify quality scores appear on suggestions
- [ ] Test graceful degradation by simulating Phase 18 error
- [ ] Verify no timeout errors occur
- [ ] Test with different essay lengths (50 words, 200 words, 350 words)

---

## Migration Strategy

### Option 1: Feature Flag (Recommended)
```typescript
const USE_TWO_STEP_VALIDATION = import.meta.env.VITE_FEATURE_TWO_STEP_VALIDATION === 'true';

const performAnalysis = async () => {
  if (USE_TWO_STEP_VALIDATION) {
    return analyzePIQEntryTwoStep(...);
  } else {
    return analyzePIQEntry(...); // Old single-call method
  }
};
```

### Option 2: Gradual Rollout
1. Deploy two-step backend (already done ✅)
2. Deploy frontend with feature flag disabled
3. Test with internal users
4. Enable for 10% of users
5. Monitor for errors/timeouts
6. Gradually increase to 100%

### Option 3: Immediate Switch
- Deploy frontend with two-step flow
- Monitor first 24 hours closely
- Have rollback plan ready

**Recommendation**: Use **Option 1** (Feature Flag) for safety.

---

## Performance Metrics to Monitor

### Success Criteria
- ✅ Phase 17 completion time: < 150s (target: 88-133s)
- ✅ Phase 18 completion time: < 150s (target: 20-50s)
- ✅ Total time: < 200s (target: 108-183s)
- ✅ Timeout rate: < 1%
- ✅ Phase 18 failure rate (graceful degradation): < 5%

### Key Metrics
- Time to Phase 17 complete
- Time to Phase 18 complete
- Total analysis time
- Timeout error rate
- Phase 18 success rate
- Average quality score distribution

---

## Error Handling

### Phase 17 Failure
```typescript
// CRITICAL - Phase 17 must succeed
if (phase17Error) {
  setAnalysisError('Analysis failed. Please try again.');
  setIsAnalyzing(false);
  return; // Stop - can't proceed without Phase 17
}
```

### Phase 18 Failure
```typescript
// NON-CRITICAL - Phase 18 can fail gracefully
if (phase18Error) {
  console.warn('Phase 18 validation failed, showing suggestions without quality scores');
  // Continue with Phase 17 results
  // UI shows suggestions but no quality badges
}
```

### Timeout Handling
```typescript
// Add timeout wrapper (optional safety net)
const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ]);
};

// Use it:
await withTimeout(
  supabase.functions.invoke('validate-workshop', ...),
  60000 // 60s max for Phase 18
);
```

---

## Rollback Plan

If issues occur:

### Quick Rollback (< 5 minutes)
1. Set feature flag: `VITE_FEATURE_TWO_STEP_VALIDATION=false`
2. Redeploy frontend
3. System reverts to single-call method

### Full Rollback (if needed)
1. Revert frontend PR
2. Keep Phase 18 edge function deployed (harmless)
3. Monitor for resolution of issue
4. Re-deploy when ready

---

## Timeline Estimate

| Task | Est. Time | Owner |
|------|-----------|-------|
| Update TypeScript interfaces | 30 min | Dev |
| Update piqWorkshopAnalysisService | 1 hour | Dev |
| Update PIQWorkshopIntegrated | 1.5 hours | Dev |
| Create QualityScoreBadge component | 30 min | Dev |
| Update workshop item display | 45 min | Dev |
| Add loading states | 30 min | Dev |
| Write unit tests | 1 hour | Dev |
| Integration testing | 1 hour | QA |
| Manual testing | 30 min | QA |
| **Total** | **~7 hours** | |

---

## Next Steps

1. ✅ Review this plan
2. ⏳ Get approval from technical lead
3. ⏳ Create feature branch: `feature/two-step-validation`
4. ⏳ Implement TypeScript interfaces
5. ⏳ Implement service layer
6. ⏳ Implement UI components
7. ⏳ Write tests
8. ⏳ QA testing
9. ⏳ Deploy to staging
10. ⏳ Production deployment with feature flag

---

## Success Definition

This integration is successful when:

✅ **No Timeout Errors**: System handles essays of all lengths without 150s timeout
✅ **Progressive Loading**: Users see suggestions in ~113s, quality scores ~22s later
✅ **Graceful Degradation**: If Phase 18 fails, users still get suggestions from Phase 17
✅ **Quality Visible**: Users see 0-10 quality scores and improvement suggestions on each workshop suggestion
✅ **Performance**: 95th percentile total time < 180s (3 minutes)

This delivers the complete Phase 17 + Phase 18 system to production with reliability and excellent user experience.
