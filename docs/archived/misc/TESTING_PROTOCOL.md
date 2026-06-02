# PIQ Workshop Testing Protocol

## 🎯 Purpose
This document provides a comprehensive testing protocol to verify the save and versioning system works correctly after database migration.

---

## ✅ Pre-Testing Checklist

Before starting tests, verify:
- [ ] Database migration deployed successfully
- [ ] All 4 tables exist (essays, essay_analysis_reports, essay_revision_history, essay_coaching_plans)
- [ ] New JSONB columns added to essay_analysis_reports
- [ ] RLS policies have "Clerk:" prefix
- [ ] user_id column is TEXT (not UUID)
- [ ] Clerk authentication is configured

---

## 🧪 Test Suite

### Test 1: Authentication Flow
**Objective:** Verify Clerk authentication works

**Steps:**
1. Open the application
2. Navigate to PIQ Workshop page
3. Observe authentication status

**Expected Results:**
- [ ] If signed out: Shows "Sign in to save" warning in top-right
- [ ] If signed in: Shows user's name/avatar
- [ ] Console shows: `userId = user_abc123...` (not null)

**Debug if fails:**
```javascript
// In browser console:
console.log('User ID:', useClerkUserId());
```

---

### Test 2: Select Prompt and Type
**Objective:** Verify basic UI functionality

**Steps:**
1. Click "Select a PIQ Prompt" dropdown
2. Choose "PIQ 1: Leadership"
3. Click in the text editor
4. Type: "This is a test essay about my leadership experience."

**Expected Results:**
- [ ] Prompt selector shows selected prompt
- [ ] Text appears in editor as you type
- [ ] Word count updates in real-time
- [ ] "Save" button appears in header

**Debug if fails:**
- Check browser console for React errors
- Verify no TypeScript compilation errors

---

### Test 3: Manual Save to Database
**Objective:** Verify save button persists data to database

**Steps:**
1. With text in editor, click "Save" button
2. Watch top-right corner for status indicator
3. Wait for save to complete

**Expected Results:**
- [ ] Status shows "Saving..." (blue, with spinner)
- [ ] After 1-2 seconds, status shows "Saved" (green, with checkmark)
- [ ] Console shows:
  ```
  💾 handleSave called
  📤 Saving essay to database...
  ✅ Essay created: <uuid>
  ✅ Save complete
  ```

**Debug if fails:**
- **"Sign in to save" alert:** Not authenticated, sign in with Clerk
- **Status shows "Error":** Check console for error message
  - Common: `relation "essays" does not exist` → Migration not deployed
  - Common: `permission denied` → RLS policy issue
- **Network error:** Check Supabase connection, API keys

**Verify in Database:**
```sql
-- Check if essay was saved
SELECT id, user_id, essay_type, version, length(draft_current) as char_count
FROM essays
WHERE user_id = 'your-clerk-user-id'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:** 1 row with your essay data

---

### Test 4: Page Refresh (Database Load)
**Objective:** Verify data persists and loads from database

**Steps:**
1. After successful save, refresh the page (Cmd+R / Ctrl+R)
2. Navigate back to PIQ Workshop
3. Select the same prompt as before

**Expected Results:**
- [ ] Your essay text appears in editor (loaded from database)
- [ ] Word count matches what you saved
- [ ] Console shows:
  ```
  📥 Loading essay from database for prompt: piq1
  ✅ Loaded essay from database: <uuid> (version 1)
  ✅ Database load complete
  ```

**Debug if fails:**
- **Empty editor:** Check console for load errors
- **Old data from localStorage:** Clear localStorage and refresh
  ```javascript
  // In browser console:
  localStorage.clear();
  location.reload();
  ```

**Verify in Database:**
```sql
-- Confirm the essay ID matches console log
SELECT id, draft_current, updated_at
FROM essays
WHERE id = '<uuid-from-console>';
```

---

### Test 5: Edit and Re-Save (Version Increment)
**Objective:** Verify version tracking works

**Steps:**
1. With loaded essay, edit the text (add a sentence)
2. Click "Save" button again
3. Wait for "Saved" indicator

**Expected Results:**
- [ ] Save completes successfully
- [ ] Console shows: `✅ Essay updated: <uuid> (version 1 -> 2)`
- [ ] No duplicate entries created

**Verify in Database:**
```sql
-- Check version incremented
SELECT id, version, updated_at
FROM essays
WHERE id = '<your-essay-id>';
```

**Expected:** version = 2

```sql
-- Check revision history created
SELECT version, length(draft_content) as char_count, created_at
FROM essay_revision_history
WHERE essay_id = '<your-essay-id>'
ORDER BY version DESC;
```

**Expected:** 2 rows (version 1 and version 2)

---

### Test 6: Run Analysis
**Objective:** Verify analysis runs and displays results

**Steps:**
1. With essay text in editor, click "Analyze" button
2. Wait for analysis to complete (~2-3 minutes)
3. Observe UI updates

**Expected Results:**
- [ ] Loading indicator appears
- [ ] Progress updates show in console
- [ ] After completion:
  - [ ] Score appears (e.g., "73/100")
  - [ ] Rubric dimensions display
  - [ ] Workshop items appear
  - [ ] "Saved" indicator shows (auto-save triggered)

**Expected Console Logs:**
```
🎯 Starting comprehensive analysis...
📤 Sending to backend...
✅ Analysis complete! Score: 73
📤 Auto-saving analysis result to database...
✅ Analysis auto-saved to database: <report-id>
```

**Debug if fails:**
- **Analysis never completes:** Check network tab for API call
- **Error during analysis:** Check backend logs
- **Auto-save fails:** Check that essay was saved first (need essayId)

**Verify in Database:**
```sql
-- Check analysis report saved
SELECT id, essay_quality_index, created_at,
       voice_fingerprint IS NOT NULL as has_voice,
       experience_fingerprint IS NOT NULL as has_experience,
       workshop_items IS NOT NULL as has_workshop
FROM essay_analysis_reports
WHERE essay_id = '<your-essay-id>'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:** 1 row with score and TRUE for all fingerprint columns

---

### Test 7: Refresh with Analysis (Load Analysis)
**Objective:** Verify analysis persists across sessions

**Steps:**
1. After analysis completes and auto-saves, refresh page
2. Navigate back to PIQ Workshop
3. Select same prompt

**Expected Results:**
- [ ] Essay text loads
- [ ] Score displays immediately (e.g., "73/100")
- [ ] Rubric dimensions appear
- [ ] Workshop items display
- [ ] No re-analysis needed

**Expected Console Logs:**
```
📥 Loading essay from database for prompt: piq1
✅ Loaded essay from database: <uuid> (version 2)
✅ Loaded analysis from database: NQI 73
✅ Database load complete
```

**Debug if fails:**
- **No analysis shown:** Check that analysis was saved (Test 6)
- **Wrong analysis:** Check created_at timestamps in database

---

### Test 8: Auto-Save to LocalStorage
**Objective:** Verify 30-second auto-save to localStorage

**Steps:**
1. Edit the essay text
2. Wait 30 seconds without saving manually
3. Check localStorage

**Expected Results:**
- [ ] After 30 seconds, console shows: `✅ Auto-saved to localStorage`
- [ ] No save status indicator (silent operation)

**Verify in Browser:**
```javascript
// In browser console:
const cache = JSON.parse(localStorage.getItem('piq_workshop_cache_piq1'));
console.log(cache);
```

**Expected:** Object with:
- `promptId: "piq1"`
- `currentDraft: "your essay text"`
- `lastSaved: <timestamp>`
- `analysisResult: {...}`
- `versions: [...]`

**Debug if fails:**
- Check that `hasUnsavedChanges` is true
- Verify 30-second timer is running
- Check console for errors

---

### Test 9: Resume Session Banner
**Objective:** Verify localStorage resume functionality

**Steps:**
1. With auto-save active, close the tab (don't save to cloud)
2. Reopen the application
3. Navigate to PIQ Workshop (without selecting prompt)

**Expected Results:**
- [ ] Yellow banner appears: "You have unsaved work from [time ago]"
- [ ] "Resume" button in banner
- [ ] Clicking "Resume" loads localStorage data
- [ ] Clicking "Start Fresh" clears banner

**Debug if fails:**
- Check localStorage has recent data (< 7 days old)
- Verify `lastSaved` timestamp is within 7 days

---

### Test 10: Cross-Device Sync
**Objective:** Verify data syncs across devices

**Steps:**
1. On Device 1: Save essay with analysis
2. Note the essay ID from console
3. On Device 2 (or different browser):
   - Sign in with same Clerk account
   - Navigate to PIQ Workshop
   - Select same prompt

**Expected Results:**
- [ ] Device 2 loads exact same essay text
- [ ] Device 2 shows same analysis results
- [ ] Device 2 shows same score
- [ ] Console logs match (same essay ID)

**Debug if fails:**
- **Different data:** Check user IDs match
- **No data:** Check RLS policies allow cross-device access
- **Old data:** Check created_at/updated_at timestamps

---

### Test 11: Multiple Prompts
**Objective:** Verify prompts are stored independently

**Steps:**
1. Save essay for "PIQ 1: Leadership"
2. Switch to "PIQ 2: Creative Side"
3. Write different essay, save
4. Switch back to "PIQ 1: Leadership"

**Expected Results:**
- [ ] PIQ 1 essay loads when selecting PIQ 1
- [ ] PIQ 2 essay loads when selecting PIQ 2
- [ ] No data mixing between prompts
- [ ] Each has independent version history

**Verify in Database:**
```sql
SELECT prompt_text, length(draft_current) as chars, version
FROM essays
WHERE user_id = 'your-clerk-user-id'
ORDER BY created_at DESC;
```

**Expected:** 2 rows with different prompt_text

---

### Test 12: Error Handling
**Objective:** Verify graceful error handling

**Steps to Test Network Error:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to save essay

**Expected Results:**
- [ ] Status shows "Error" (red X)
- [ ] Hovering shows error message tooltip
- [ ] Console shows error details
- [ ] UI doesn't crash
- [ ] LocalStorage still works

**Steps to Test Auth Error:**
1. Sign out from Clerk
2. Try to save essay

**Expected Results:**
- [ ] Alert: "Please sign in to save your work to the cloud"
- [ ] Save doesn't proceed
- [ ] "Sign in to save" warning appears

---

### Test 13: Version History (Database Query)
**Objective:** Verify all versions are tracked

**Steps:**
1. Save essay multiple times with edits (create 3+ versions)
2. Run version history query

**Query:**
```sql
SELECT
  v.version,
  v.word_count,
  v.created_at,
  v.source,
  a.essay_quality_index as score
FROM essay_revision_history v
LEFT JOIN essay_analysis_reports a
  ON a.essay_id = v.essay_id
  AND a.created_at >= v.created_at
WHERE v.essay_id = '<your-essay-id>'
ORDER BY v.version DESC;
```

**Expected Results:**
- [ ] One row per save
- [ ] Version numbers increment (3, 2, 1)
- [ ] Word counts differ between versions
- [ ] Scores present if analysis was run
- [ ] Timestamps in descending order

---

## 🔍 Validation Queries

### Check All User Essays:
```sql
SELECT
  id,
  essay_type,
  LEFT(prompt_text, 50) as prompt_preview,
  version,
  LENGTH(draft_current) as current_length,
  LENGTH(draft_original) as original_length,
  created_at,
  updated_at
FROM essays
WHERE user_id = 'your-clerk-user-id'
ORDER BY updated_at DESC;
```

### Check All Analysis Reports:
```sql
SELECT
  a.id,
  a.essay_id,
  a.essay_quality_index,
  a.created_at,
  (a.voice_fingerprint IS NOT NULL) as has_voice,
  (a.experience_fingerprint IS NOT NULL) as has_experience,
  (a.workshop_items IS NOT NULL) as has_workshop,
  JSONB_ARRAY_LENGTH(a.workshop_items) as workshop_count
FROM essay_analysis_reports a
JOIN essays e ON e.id = a.essay_id
WHERE e.user_id = 'your-clerk-user-id'
ORDER BY a.created_at DESC;
```

### Check Complete Version History:
```sql
SELECT
  e.id as essay_id,
  LEFT(e.prompt_text, 30) as prompt,
  e.version as current_version,
  COUNT(v.id) as history_count
FROM essays e
LEFT JOIN essay_revision_history v ON v.essay_id = e.id
WHERE e.user_id = 'your-clerk-user-id'
GROUP BY e.id, e.prompt_text, e.version
ORDER BY e.updated_at DESC;
```

---

## 📊 Success Criteria

### Must Pass (Critical):
- ✅ Test 1: Authentication works
- ✅ Test 2: Can type in editor
- ✅ Test 3: Manual save persists to database
- ✅ Test 4: Refresh loads from database
- ✅ Test 5: Version increments correctly
- ✅ Test 6: Analysis runs and completes
- ✅ Test 7: Analysis persists across refresh

### Should Pass (Important):
- ✅ Test 8: Auto-save to localStorage
- ✅ Test 9: Resume session banner
- ✅ Test 10: Cross-device sync
- ✅ Test 11: Multiple prompts work independently

### Nice to Have (Secondary):
- ✅ Test 12: Error handling is graceful
- ✅ Test 13: Version history is complete

---

## 🚨 Common Issues and Fixes

### Issue: "relation essays does not exist"
**Cause:** Migration not deployed
**Fix:** Deploy MIGRATIONS_TO_RUN.sql to Supabase

### Issue: "permission denied for table essays"
**Cause:** RLS policy issue or wrong user ID
**Fix:**
1. Check Clerk JWT is configured correctly
2. Verify `auth.jwt() ->> 'sub'` returns your user ID
3. Run: `SELECT current_clerk_user_id();` in Supabase SQL Editor

### Issue: Save shows "Error" but no details
**Cause:** Generic error, need more info
**Fix:**
1. Open browser console
2. Look for red error messages
3. Check Network tab for failed API calls
4. Share error message with team

### Issue: Analysis doesn't auto-save
**Cause:** Essay not saved first (no essayId)
**Fix:**
1. Save essay first (get essayId)
2. Then run analysis
3. Analysis auto-save needs essayId

### Issue: Old data shows after save
**Cause:** Caching issue
**Fix:**
1. Clear localStorage: `localStorage.clear()`
2. Hard refresh: Cmd+Shift+R / Ctrl+Shift+R
3. Clear browser cache if needed

### Issue: Different user's data appears
**Cause:** Clerk user ID mismatch or RLS policy bug
**Fix:**
1. Sign out and sign back in
2. Check console for user ID: `console.log(useClerkUserId())`
3. Verify RLS policies in database:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'essays';
   ```

---

## 📈 Performance Benchmarks

### Expected Timings:
- **Manual save:** < 2 seconds
- **Database load:** < 1 second
- **Analysis (comprehensive):** 100-180 seconds
- **Auto-save to localStorage:** < 100ms (imperceptible)

### Network Calls:
- **Save essay:** 1 POST to Supabase
- **Load essay:** 1-2 GET from Supabase (essay + analysis)
- **Save analysis:** 1 POST to Supabase

### Database Performance:
- **Indexes:** All queries use indexes (no seq scans)
- **JSONB queries:** Fast with GIN indexes
- **Version history:** Efficient with composite indexes

---

## ✅ Final Validation Checklist

After completing all tests:

**Functionality:**
- [ ] Can save essay to database
- [ ] Data persists across refreshes
- [ ] Version tracking works
- [ ] Analysis runs and saves
- [ ] Analysis persists across refreshes
- [ ] Auto-save to localStorage works
- [ ] Resume session works
- [ ] Cross-device sync works
- [ ] Multiple prompts work independently

**User Experience:**
- [ ] Save status indicators work
- [ ] Error messages are clear
- [ ] No crashes or freezes
- [ ] Responsive UI (no lag)
- [ ] Console logs are informative

**Data Integrity:**
- [ ] No duplicate essays created
- [ ] Version numbers increment correctly
- [ ] Analysis matches essay version
- [ ] RLS policies enforce user isolation
- [ ] Timestamps are accurate

**Security:**
- [ ] Can only access own data
- [ ] Signed-out users can't save to cloud
- [ ] JWT authentication works
- [ ] RLS policies properly configured

---

## 📝 Testing Log Template

Use this template to document your testing session:

```
Date: _______________
Tester: _______________
Environment: [ ] Development [ ] Staging [ ] Production

Test 1: Authentication Flow
Status: [ ] Pass [ ] Fail
Notes: _______________

Test 2: Select Prompt and Type
Status: [ ] Pass [ ] Fail
Notes: _______________

Test 3: Manual Save to Database
Status: [ ] Pass [ ] Fail
Notes: _______________

Test 4: Page Refresh (Database Load)
Status: [ ] Pass [ ] Fail
Notes: _______________

Test 5: Edit and Re-Save (Version Increment)
Status: [ ] Pass [ ] Fail
Notes: _______________

Test 6: Run Analysis
Status: [ ] Pass [ ] Fail
Notes: _______________

Test 7: Refresh with Analysis (Load Analysis)
Status: [ ] Pass [ ] Fail
Notes: _______________

Test 8: Auto-Save to LocalStorage
Status: [ ] Pass [ ] Fail
Notes: _______________

Test 9: Resume Session Banner
Status: [ ] Pass [ ] Fail
Notes: _______________

Test 10: Cross-Device Sync
Status: [ ] Pass [ ] Fail
Notes: _______________

Test 11: Multiple Prompts
Status: [ ] Pass [ ] Fail
Notes: _______________

Test 12: Error Handling
Status: [ ] Pass [ ] Fail
Notes: _______________

Test 13: Version History (Database Query)
Status: [ ] Pass [ ] Fail
Notes: _______________

Overall Result: [ ] All Pass [ ] Some Failures

Issues Found:
1. _______________
2. _______________

Action Items:
1. _______________
2. _______________
```

---

## 🎉 Testing Complete!

If all critical tests pass:
1. ✅ System is ready for production use
2. ✅ Users can start saving their work
3. ✅ Cross-device sync is functional
4. ✅ Version history is tracking correctly

Next steps:
- [ ] Deploy to production (if testing in staging)
- [ ] Monitor error logs for first 24 hours
- [ ] Collect user feedback
- [ ] Plan Phase 3: Version History UI
- [ ] Plan Phase 4: Debounced Auto-Save

---

**Last Updated:** 2025-11-25
**Version:** 1.0.0
**Status:** ✅ Ready for testing
