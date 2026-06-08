# Narrative Overview System

## Overview

The narrative overview system provides holistic, empowering feedback that shows deep understanding of the student's essay. It's a separate, lightweight API call that synthesizes all analysis data into 3-5 encouraging sentences.

## Architecture

### Two-Phase Analysis System

**Phase 1: Main Workshop Analysis** (~100-120 seconds)
- Edge function: `workshop-analysis`
- Returns: Voice fingerprint, experience fingerprint, 12-dimension rubric, workshop items
- Heavy computational load (4 Claude API calls)

**Phase 2: Narrative Overview** (~5-10 seconds)
- Edge function: `narrative-overview`
- Returns: Holistic narrative understanding (3-5 sentences)
- Lightweight, separate call
- Uses full context from Phase 1

### Why Separate?

1. **Performance** - Doesn't block main analysis
2. **Independence** - Can retry or regenerate overview without re-running full analysis
3. **Cost efficiency** - Lighter model usage for overview generation
4. **User experience** - Main results show immediately, overview enhances them
5. **Flexibility** - Can be called on-demand or cached

## API Endpoints

### Deployed Functions

| Function | Status | Version | Purpose |
|----------|--------|---------|---------|
| `workshop-analysis` | ACTIVE | 3 | Full 4-stage analysis with score calibration |
| `narrative-overview` | ACTIVE | 1 | Holistic narrative understanding |
| `notify-new-signin` | ACTIVE | 3 | User notifications |

### Narrative Overview Endpoint

**URL:** `https://zclaplpkuvxkrdwsgrul.supabase.co/functions/v1/narrative-overview`

**Method:** POST

**Request Body:**
```typescript
{
  essayText: string;
  promptText: string;
  voiceFingerprint: object;
  experienceFingerprint: object;
  rubricDimensionDetails: array;
  workshopItems: array;
  narrativeQualityIndex: number;
}
```

**Response:**
```typescript
{
  success: true,
  narrative_overview: string // 3-5 empowering sentences
}
```

## Overview Generation Prompt

The system uses Claude Sonnet 4 with specific instructions:

**Key Guidelines:**
- Lead with strongest narrative asset (not scores)
- Articulate what essay is trying to show/convey
- Identify what would make it compelling (specificity, emotion, transformation, structure)
- Give overarching guidance (not dimension-by-dimension)
- Close with encouraging, concrete next step
- Storytelling tone, no report-card language
- NO scores or numbers
- 3-5 sentences maximum

**Context Provided:**
- Voice tone and pacing
- Experience uniqueness confidence
- NQI score
- Strongest dimensions
- Areas for growth
- Workshop focus areas

## Frontend Integration

### State Management

```typescript
const [narrativeOverview, setNarrativeOverview] = useState<string | null>(null);
const [loadingOverview, setLoadingOverview] = useState(false);
```

### Call Flow

```typescript
// 1. Main analysis completes
const result = await analyzePIQEntry(...);

// 2. Trigger narrative overview (non-blocking)
fetchNarrativeOverview(result);

// 3. Display frontend fallback while loading
if (narrativeOverview) {
  return narrativeOverview; // API-generated
} else if (loadingOverview) {
  return 'Generating personalized narrative overview...';
} else {
  return getDetailedOverview(dims, score); // Frontend fallback
}
```

### Fallback Strategy

The system has three levels:

1. **API-generated overview** (preferred)
   - Uses full context from all analysis stages
   - Claude-powered narrative understanding
   - Most personalized and empowering

2. **Loading state** (transitional)
   - Shows while API call is in progress
   - "Generating personalized narrative overview..."

3. **Frontend fallback** (backup)
   - Pattern-based analysis of dimensions/issues
   - Still narrative-focused and encouraging
   - Used if API call fails

## Example Outputs

### Before (Old System - Number-Heavy)
```
Your narrative scores 73/100, placing it in the competitive range, which demonstrates
solid narrative fundamentals but requires polish to reach the elite tier that commands
admissions officers' attention. Your strongest dimensions are Specificity & Evidence
(8.2/10) and Initiative & Leadership (8/10), which show solid narrative craftsmanship...
```

**Problems:**
- Too many numbers: 73/100, 8.2/10, 8/10, 6/10
- Report-card language
- Doesn't articulate what essay is trying to say
- Lists dimension names mechanically

### After (New System - Narrative-Focused)
```
Your essay's strongest asset is the concrete, measurable impact you demonstrate—the
2,000 bottles, 47% reduction, and 45-member growth tell a story of genuine change.
What you're trying to show—that leadership emerges through persistence and data-driven
advocacy—comes through clearly. To make this truly compelling, focus on emotional
authenticity: show us not just what you accomplished, but what you felt when your
voice shook, when the board hesitated, when you saw the first student use those
refill stations. Start with this: deepen the vulnerability in your presentation scene.
Each workshop item below includes specific revisions that maintain your authentic
voice while making your narrative more powerful.
```

**Improvements:**
- ✅ Shows understanding of narrative intent
- ✅ Minimal numbers (only contextual mentions)
- ✅ Empowering, storytelling tone
- ✅ Specific, actionable guidance
- ✅ Encourages authenticity
- ✅ Concrete next step

## Benefits

### For Students
- Feels understood (system "gets" their story)
- Encouraging tone (not deflating)
- Clear, specific guidance
- Shows path to improvement
- Maintains motivation

### For Product
- Differentiated UX (not generic rubric)
- High-quality AI synthesis
- Flexible architecture
- Cost-efficient (separate lightweight call)
- Scalable (can enhance prompt without touching main analysis)

### Technical
- Non-blocking (doesn't slow main analysis)
- Cacheable (can store overviews)
- Retryable (can regenerate if needed)
- Independent deployment
- Easy to A/B test different prompts

## Monitoring

### Logs to Watch

```bash
# Overview generation
supabase functions logs narrative-overview --project-ref zclaplpkuvxkrdwsgrul

# Look for:
✅ Narrative overview generated
⚠️  Failed to parse overview JSON
❌ Narrative overview error
```

### Frontend Console

```javascript
// Success
console.log('✅ Narrative overview loaded');

// Fallback
console.warn('⚠️  Narrative overview failed, using frontend fallback');
```

### Metrics to Track

- Overview generation latency (target: <10s)
- Success rate (target: >95%)
- Fallback usage rate (target: <5%)
- User engagement with overview text

## Future Enhancements

### Potential Improvements

1. **Caching**
   - Cache overview by essay hash
   - Avoid regenerating for identical text

2. **Personalization**
   - Use student profile data (grade, background)
   - Adapt tone based on confidence level

3. **Progressive Enhancement**
   - Show partial overview as it generates
   - Stream tokens for faster perceived load

4. **A/B Testing**
   - Test different prompt strategies
   - Measure impact on user engagement

5. **Multi-language**
   - Generate overview in student's native language
   - Adapt cultural references

## Cost Analysis

### Per-Essay Cost

**Main Analysis:**
- 4 Claude Sonnet 4 calls
- ~100-120 seconds
- High token usage (10K+ tokens)

**Narrative Overview:**
- 1 Claude Sonnet 4 call
- ~5-10 seconds
- Low token usage (~1K tokens)

**Total:** ~10-15% additional cost for significantly better UX

### Optimization Opportunities

- Use Claude Haiku for overview (faster, cheaper)
- Batch overview generation for multiple essays
- Cache frequently-accessed overviews
- Pre-generate for saved drafts

## Deployment

### Deploy Both Functions

```bash
# Main analysis (with score calibration)
supabase functions deploy workshop-analysis --project-ref zclaplpkuvxkrdwsgrul

# Narrative overview
supabase functions deploy narrative-overview --project-ref zclaplpkuvxkrdwsgrul
```

### Environment Variables Required

```bash
ANTHROPIC_API_KEY=<your-key>
```

### Frontend Configuration

```env
VITE_SUPABASE_URL=https://zclaplpkuvxkrdwsgrul.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## Summary

The narrative overview system provides a crucial layer of personalization and empowerment that transforms the workshop from a rubric-driven tool into an empathetic coaching experience. By using a separate, lightweight API call that synthesizes all analysis data, we achieve:

- **Better UX** - Students feel understood and encouraged
- **Better Architecture** - Separation of concerns, independent deployment
- **Better Performance** - Non-blocking, doesn't slow main analysis
- **Better Product** - Differentiated from generic essay tools

This is a key differentiator that shows students we truly understand their narrative, not just score it.
