# How to See All 11 Rubric Dimensions

## The Fix is Done ✅

The backend code has been updated to return all 11 rubric categories instead of 3.

**Committed:** c79d95e - "Fix: Return all 11 rubric dimensions in heuristic fallback"
**Pushed:** ✅ Successfully pushed to remote

## You Need to Restart the Backend Server

### Option 1: Quick Restart
```bash
# Stop the current server (Ctrl+C in the terminal running it)
# Then restart with:
npm run dev:full
```

### Option 2: If Server is Running in Background
```bash
# Find and kill the process
pkill -f "node.*server" || pkill -f "tsx.*server"

# Then restart
npm run dev:full
```

### Option 3: Check What's Running
```bash
# See what ports are in use
lsof -i :8789  # Backend API port
lsof -i :5173  # Frontend dev port

# Kill specific process by PID
kill -9 <PID>

# Then restart
npm run dev:full
```

## After Restarting

1. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Reload the workshop page**
3. **All 11 dimensions should now display:**
   - Voice Integrity
   - Specificity & Evidence
   - Transformative Impact
   - Role Clarity & Ownership
   - Narrative Arc & Stakes
   - Initiative & Leadership
   - Community & Collaboration
   - Reflection & Meaning
   - Craft & Language Quality
   - Fit & Trajectory
   - Time Investment & Consistency

## Verify the Fix

Open browser console and check the API response:
```
Network tab → Find /api/analyze-entry request → Preview response
→ Look for result.report.categories → Should show 11 items
```

## What Was Fixed

**Before:** Heuristic fallback returned only 3 categories
**After:** Returns all 11 categories with intelligent scoring based on:
- Numbers/metrics detection
- Leadership keywords (led, founded, organized)
- Community markers (we, team, together)
- Impact verbs (changed, improved, taught)
- Stakes/challenges (struggled, overcome, failed)
- Ownership markers (I, my)
- Reflection phrases
- Dialogue presence
- Word count thresholds

Each dimension now has context-aware heuristic scoring!
