# Deploy Workshop-Analysis Edge Function

## What Changed

The PIQ Workshop integration now uses a **server-side edge function** to call Claude API, fixing the browser security restriction.

### Files Created/Modified:
1. ✅ Created: `supabase/functions/workshop-analysis/index.ts` - Edge function for surgical workshop
2. ✅ Modified: `src/services/piqWorkshopAnalysisService.ts` - Now calls edge function instead of local code
3. ✅ Modified: `supabase/config.toml` - Added workshop-analysis function config
4. ✅ Build verified - No errors

## Deploy the Edge Function

### Option 1: Deploy via Supabase CLI (Recommended)

```bash
# 1. Login to Supabase
supabase login

# 2. Deploy the function
supabase functions deploy workshop-analysis --project-ref zclaplpkuvxkrdwsgrul

# 3. Set the ANTHROPIC_API_KEY secret
supabase secrets set ANTHROPIC_API_KEY=your_actual_anthropic_api_key --project-ref zclaplpkuvxkrdwsgrul
```

### Option 2: Deploy via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/zclaplpkuvxkrdwsgrul/functions
2. Click "Create a new function"
3. Name: `workshop-analysis`
4. Copy the contents of `supabase/functions/workshop-analysis/index.ts`
5. Paste into the code editor
6. Deploy
7. Go to Settings > Edge Functions > Secrets
8. Add secret: `ANTHROPIC_API_KEY` with your API key

## Verify Deployment

After deploying, test the integration:

1. Start dev server: `npm run dev`
2. Go to: http://localhost:8080/piq-workshop
3. Type an essay and click "Re-analyze"
4. Check browser console for:
   - `🌐 Calling workshop-analysis edge function...`
   - `✅ Edge function call complete`
   - `NQI: <score>/100`

## How It Works

### Before (FAILED):
```
PIQWorkshop.tsx (browser)
  → piqWorkshopAnalysisService.ts
  → runSurgicalWorkshop()
  → callClaude() [BLOCKED: Browser can't call Claude API]
```

### After (WORKING):
```
PIQWorkshop.tsx (browser)
  → piqWorkshopAnalysisService.ts
  → supabase.functions.invoke('workshop-analysis')
  → Edge Function (server-side)
  → Claude API ✅ (4 separate calls for complete analysis)
```

## Edge Function Architecture

The edge function performs 4 sequential Claude API calls:

1. **Voice Fingerprint** (2048 tokens) - Analyzes writing style
2. **Experience Fingerprint** (3072 tokens) - Detects unique elements
3. **12-Dimension Rubric** (4096 tokens) - Comprehensive scoring
4. **Workshop Items** (8192 tokens) - Surgical suggestions

Total: ~18-20K tokens per analysis (~100-120 seconds)

## Troubleshooting

### Error: "Edge function not found"
- Deploy the function using instructions above

### Error: "ANTHROPIC_API_KEY not configured"
- Set the secret using Supabase CLI or dashboard

### Error: "Claude API error: 401"
- Check that ANTHROPIC_API_KEY is valid
- Verify API key has sufficient credits

### Frontend shows old error
- Clear browser cache
- Hard reload: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Rebuild: `npm run build`

## Cost Estimate

Per analysis: ~18K tokens input + ~5K tokens output = ~$0.20-0.30
- Input: 18,000 tokens × $3.00/1M = $0.054
- Output: 5,000 tokens × $15.00/1M = $0.075
- **Total: ~$0.13 per full analysis**

## Next Steps

1. Deploy the edge function (see instructions above)
2. Test the PIQ workshop at http://localhost:8080/piq-workshop
3. Verify all components show real data:
   - Voice Fingerprint card
   - Experience Fingerprint card
   - 12 Rubric Dimensions with scores
   - Workshop Items with surgical suggestions
